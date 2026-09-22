package com.app.service.api.impl;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.match.MatchDAO;
import com.app.dao.team.TeamDAO;
import com.app.dto.match.MatchEvents;
import com.app.dto.match.Matches;
import com.app.dto.team.Players;
import com.app.dto.team.Teams;
import com.app.service.api.BigBallsApiService;
import com.app.util.ApiBridgeUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class BigBallsApiServiceImpl implements BigBallsApiService {

    private static final Logger log = LoggerFactory.getLogger(BigBallsApiServiceImpl.class);

    @Value("${bigballsdata.api.key}")
    private String apiKey;

    @Autowired
    private MatchDAO matchDAO;

    @Autowired
    private TeamDAO teamDAO;

    @Autowired
    private ApplicationContext applicationContext;

    private ObjectMapper objectMapper = new ObjectMapper();

    private HttpClient createInsecureHttpClient() throws Exception {
        TrustManager[] trustAllCerts = new TrustManager[]{
            new X509TrustManager() {
                public X509Certificate[] getAcceptedIssuers() { return null; }
                public void checkClientTrusted(X509Certificate[] certs, String authType) {}
                public void checkServerTrusted(X509Certificate[] certs, String authType) {}
            }
        };

        SSLContext sslContext = SSLContext.getInstance("TLS");
        sslContext.init(null, trustAllCerts, new SecureRandom());

        return HttpClient.newBuilder()
                .sslContext(sslContext)
                .build();
    }

    private String sendGetRequest(String url) {
        try {
            HttpClient client = createInsecureHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("x-api-key", apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("[BigBallsData] API 요청 실패 (HTTP {}): {}", response.statusCode(), response.body());
                return null;
            }
            return response.body();
        } catch (Exception e) {
            log.error("[BigBallsData] HTTP 요청 중 오류 발생 (URL: {}): {}", url, e.getMessage());
            return null;
        }
    }

    @Override
    public String fetchMatchEventsRaw(String externalMatchId) {
        String url = "https://api.bigballsdata.com/v1/matches/" + externalMatchId + "/events?sport=football";
        return sendGetRequest(url);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public int syncMatchEvents(Long matchId, String externalMatchId) {
        Matches match = matchDAO.findMatchById(matchId);
        if (match == null) {
            log.error("[BigBallsData] 대상 경기(MATCH_ID={})를 DB에서 찾을 수 없습니다.", matchId);
            return 0;
        }

        String json = fetchMatchEventsRaw(externalMatchId);
        if (json == null || json.isBlank()) {
            log.warn("[BigBallsData] 경기 이벤트 응답이 비어있습니다. (extMatchId={})", externalMatchId);
            return 0;
        }

        try {
            JsonNode rootNode = objectMapper.readTree(json);
            JsonNode eventsArray = null;

            if (rootNode.has("data")) {
                JsonNode dataNode = rootNode.get("data");
                if (dataNode.isArray()) {
                    eventsArray = dataNode;
                } else if (dataNode.has("events") && dataNode.get("events").isArray()) {
                    eventsArray = dataNode.get("events");
                }
            } else if (rootNode.isArray()) {
                eventsArray = rootNode;
            }

            if (eventsArray == null || !eventsArray.isArray() || eventsArray.isEmpty()) {
                log.info("[BigBallsData] 경기 {} (ext:{})에 등록된 이벤트가 없습니다.", matchId, externalMatchId);
                return 0;
            }

            // 구단 및 선수 목록 캐싱 (외래키 매칭용)
            List<Teams> allTeams = teamDAO.findAllTeams();
            Teams homeTeam = teamDAO.findTeamById(match.getHomeTeamId());
            Teams awayTeam = teamDAO.findTeamById(match.getAwayTeamId());

            List<Players> homePlayers = teamDAO.findPlayersByTeamId(match.getHomeTeamId());
            List<Players> awayPlayers = teamDAO.findPlayersByTeamId(match.getAwayTeamId());

            List<MatchEvents> parsedEvents = new ArrayList<>();
            int cardCount = 0;

            for (JsonNode eventNode : eventsArray) {
                // 1단계: 경기 발생 시간(분) 추출 (elapsed -> minute -> time 순서로 탐색)
                long minute = 0L;
                if (eventNode.hasNonNull("elapsed")) {
                    minute = eventNode.path("elapsed").asLong();
                } else if (eventNode.hasNonNull("minute")) {
                    minute = eventNode.path("minute").asLong();
                } else if (eventNode.hasNonNull("time")) {
                    minute = eventNode.path("time").asLong();
                }

                // 2단계: 이벤트 유형 문자열 추출 (event_detail -> type -> event_type)
                String rawType = "goal";
                if (eventNode.hasNonNull("event_detail") && !eventNode.path("event_detail").asText().isBlank()) {
                    rawType = eventNode.path("event_detail").asText();
                } else if (eventNode.hasNonNull("type")) {
                    rawType = eventNode.path("type").asText();
                } else if (eventNode.hasNonNull("event_type")) {
                    rawType = eventNode.path("event_type").asText();
                }

                // 3단계: 구단명 및 선수명 추출
                String teamName = eventNode.path("team").asText(eventNode.path("team_name").asText(""));
                String playerName = eventNode.path("player_name").asText(eventNode.path("player").asText(""));

                // 4단계: 어시스트(도움) 선수명 추출 (assist_name -> assist -> assist_player)
                String assistName = null;
                if (eventNode.hasNonNull("assist_name")) {
                    assistName = eventNode.path("assist_name").asText();
                } else if (eventNode.hasNonNull("assist")) {
                    assistName = eventNode.path("assist").asText();
                } else if (eventNode.hasNonNull("assist_player")) {
                    assistName = eventNode.path("assist_player").asText();
                }

                // 1. 이벤트 구단 판별 (해당 경기 홈/원정 우선 대조 -> 리그 전체 대조)
                Long eventTeamId = null;
                List<Players> targetSquad = null;
                List<Players> opposingSquad = null;

                Long resolvedTeamId = ApiBridgeUtil.resolveMatchTeam(teamName, homeTeam, awayTeam, allTeams);
                if (resolvedTeamId != null && resolvedTeamId.equals(match.getHomeTeamId())) {
                    eventTeamId = match.getHomeTeamId();
                    targetSquad = homePlayers;
                    opposingSquad = awayPlayers;
                } else if (resolvedTeamId != null && resolvedTeamId.equals(match.getAwayTeamId())) {
                    eventTeamId = match.getAwayTeamId();
                    targetSquad = awayPlayers;
                    opposingSquad = homePlayers;
                } else {
                    // 팀명이 모호할 경우 선수 검색을 통해 역추정
                    Long homePlayerId = ApiBridgeUtil.findPlayerIdByName(playerName, homePlayers);
                    if (homePlayerId != null) {
                        eventTeamId = match.getHomeTeamId();
                        targetSquad = homePlayers;
                        opposingSquad = awayPlayers;
                    } else {
                        eventTeamId = match.getAwayTeamId();
                        targetSquad = awayPlayers;
                        opposingSquad = homePlayers;
                    }
                }

                // 2. 이벤트 코드 변환 (골, 자책골, 카드, 교체 등)
                Long eventTypeCode = ApiBridgeUtil.mapEventTypeToCode(rawType);

                // 3. 선수 및 도움 선수 ID 매칭
                Long playerId = ApiBridgeUtil.findPlayerIdByName(playerName, targetSquad);
                // 자책골(Own Goal) 등 상대팀 선수가 이벤트를 유발한 경우 상대 구단(opposingSquad)에서 검색
                if (playerId == null && opposingSquad != null) {
                    playerId = ApiBridgeUtil.findPlayerIdByName(playerName, opposingSquad);
                    if (playerId != null) {
                        log.info("[BigBallsData] 선수 '{}'가 상대 구단에서 매칭되었습니다. (자책골 이벤트 감지)", playerName);
                    }
                }

                if (playerId == null) {
                    if (targetSquad != null && !targetSquad.isEmpty()) {
                        playerId = targetSquad.get(0).getPlayerId();
                        log.warn("[BigBallsData] MATCH_ID={} 선수명 결측치/미매칭('{}') -> 구단 대표선수(ID={})로 안전 대체 적재", matchId, playerName, playerId);
                    } else {
                        log.warn("[BigBallsData] 선수 매칭 실패 (선수명: '{}', 구단ID: {}) -> 외래키 보호를 위해 스킵", playerName, eventTeamId);
                        continue;
                    }
                }

                Long assistPlayerId = null;
                if (assistName != null && !assistName.isBlank()) {
                    assistPlayerId = ApiBridgeUtil.findPlayerIdByName(assistName, targetSquad);
                    if (assistPlayerId == null && opposingSquad != null) {
                        assistPlayerId = ApiBridgeUtil.findPlayerIdByName(assistName, opposingSquad);
                    }
                }
                // [옐로/레드카드 이벤트 처리]
                if (eventTypeCode == 4L || eventTypeCode == 5L || eventTypeCode == 6L) {
                    cardCount++;
                }

                MatchEvents event = new MatchEvents();
                event.setMatchId(matchId);
                event.setTeamId(eventTeamId);
                event.setEventTime(minute);
                event.setEventType(eventTypeCode);
                event.setPlayerId(playerId);
                event.setAssistPlayerId(assistPlayerId);

                parsedEvents.add(event);
            }

            // 4. 기존 이벤트 삭제 후 일괄 저장 (멱등성 보장)
            matchDAO.deleteEventsByMatchId(matchId);
            for (MatchEvents evt : parsedEvents) {
                matchDAO.insertMatchEvent(evt);
            }

            // [카드 누락 방어 로그]
            if (cardCount == 0 && !parsedEvents.isEmpty()) {
                log.info("[BigBallsData] MATCH_ID={}: 총 {}건 저장 완료 (카드 이벤트 0건 - 제공사 결측치 가능성 있음)", matchId, parsedEvents.size());
            } else {
                log.info("[BigBallsData] MATCH_ID={}: 총 {}건 이벤트(카드 {}건 포함) 동기화 완료", matchId, parsedEvents.size(), cardCount);
            }

            return parsedEvents.size();

        } catch (Exception e) {
            log.error("[BigBallsData] MATCH_ID={} 이벤트 동기화 처리 중 에러 발생: {}", matchId, e.getMessage(), e);
            return 0;
        }
    }

    @Override
    public int syncMatchEventsAuto(Long matchId) {
        Matches match = matchDAO.findMatchById(matchId);
        if (match == null) {
            log.error("[BigBallsData] 대상 경기(MATCH_ID={})가 DB에 없습니다.", matchId);
            return 0;
        }

        LocalDateTime rawDate = match.getRawMatchDate();
        LinkedHashSet<String> datesToSearch = new LinkedHashSet<>();
        if (rawDate != null) {
            // KST -> UTC 변환 (외부 API는 UTC 기준 날짜로 경기 인덱싱)
            ZonedDateTime kst = rawDate.atZone(ZoneId.of("Asia/Seoul"));
            ZonedDateTime utc = kst.withZoneSameInstant(ZoneId.of("UTC"));
            datesToSearch.add(utc.toLocalDate().toString());
            datesToSearch.add(kst.toLocalDate().toString());
            datesToSearch.add(utc.toLocalDate().minusDays(1).toString());
            datesToSearch.add(utc.toLocalDate().plusDays(1).toString());
        } else {
            String dateStr = match.getMatchDate();
            if (dateStr != null && dateStr.length() >= 10) {
                String d = dateStr.substring(0, 10);
                datesToSearch.add(d);
                try {
                    LocalDate ld = LocalDate.parse(d);
                    datesToSearch.add(ld.minusDays(1).toString());
                    datesToSearch.add(ld.plusDays(1).toString());
                } catch (Exception ignored) {}
            }
        }

        if (datesToSearch.isEmpty()) {
            log.error("[BigBallsData] MATCH_ID={} 경기의 일자 정보가 없습니다.", matchId);
            return 0;
        }

        Teams homeTeam = teamDAO.findTeamById(match.getHomeTeamId());
        Teams awayTeam = teamDAO.findTeamById(match.getAwayTeamId());
        List<Teams> allTeams = teamDAO.findAllTeams();

        String targetExtMatchId = null;
        for (String searchDate : datesToSearch) {
            String url = "https://api.bigballsdata.com/v1/matches?sport=football&league=epl&date=" + searchDate;
            String json = sendGetRequest(url);
            if (json == null || json.isBlank()) continue;

            try {
                JsonNode root = objectMapper.readTree(json);
                JsonNode matchesNode = root.has("data") ? root.get("data") : root;
                if (!matchesNode.isArray()) continue;

                for (JsonNode mNode : matchesNode) {
                    String extHome = mNode.path("home").path("name").asText("");
                    String extAway = mNode.path("away").path("name").asText("");

                    Long resolvedHomeId = ApiBridgeUtil.mapTeamToId(extHome, allTeams);
                    Long resolvedAwayId = ApiBridgeUtil.mapTeamToId(extAway, allTeams);

                    if (resolvedHomeId != null && resolvedAwayId != null &&
                        resolvedHomeId.equals(match.getHomeTeamId()) &&
                        resolvedAwayId.equals(match.getAwayTeamId())) {
                        targetExtMatchId = mNode.path("id").asText();
                        break;
                    }
                }
            } catch (Exception e) {
                log.warn("[BigBallsData] 일자({}) 파싱 중 에러: {}", searchDate, e.getMessage());
            }

            if (targetExtMatchId != null && !targetExtMatchId.isBlank()) {
                break;
            }
        }

        if (targetExtMatchId == null || targetExtMatchId.isBlank()) {
            log.warn("[BigBallsData] MATCH_ID={}에 매칭되는 Big Balls Data 경기 ID를 찾지 못했습니다. ({} vs {})",
                    matchId, (homeTeam != null ? homeTeam.getTeamName() : ""), (awayTeam != null ? awayTeam.getTeamName() : ""));
            return 0;
        }

        BigBallsApiService proxy = applicationContext != null ? applicationContext.getBean(BigBallsApiService.class) : this;
        return proxy.syncMatchEvents(matchId, targetExtMatchId);
    }

    @Override
    public List<MatchEvents> getMatchEvents(Long matchId) {
        return matchDAO.findEventsByMatchId(matchId);
    }

    @Override
    public int syncAllFinishedMatchEvents() {
        List<Matches> allMatches = matchDAO.findAllMatches();
        int totalSaved = 0;
        int matchCount = 0;

        for (Matches m : allMatches) {
            // 경기 상태가 종료(FINISHED)이거나 스코어가 입력된 경기 대상
            if ("FINISHED".equalsIgnoreCase(m.getStatus()) || 
                (m.getHomeScore() != null && m.getAwayScore() != null)) {
                try {
                    int count = syncMatchEventsAuto(m.getMatchId());
                    totalSaved += count;
                    matchCount++;
                    // API 호출 간격 미세 딜레이 (Rate limit 보호)
                    Thread.sleep(100);
                } catch (Exception e) {
                    log.warn("[BigBallsData] MATCH_ID={} 일괄 동기화 중 오류 (스킵): {}", m.getMatchId(), e.getMessage());
                }
            }
        }
        log.info("[BigBallsData] 종료 경기 총 {}경기 이벤트 일괄 동기화 완료 (총 {}건 저장)", matchCount, totalSaved);
        return totalSaved;
    }

    @Override
    public int syncMatchEventsByDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return 0;
        LocalDate targetDate = LocalDate.parse(dateStr);
        LocalDateTime start = targetDate.atStartOfDay();
        LocalDateTime end = targetDate.atTime(23, 59, 59);

        List<Matches> matches = matchDAO.findMatchesByDateRange(start, end);
        int totalSaved = 0;
        int matchCount = 0;

        for (Matches m : matches) {
            try {
                int count = syncMatchEventsAuto(m.getMatchId());
                totalSaved += count;
                matchCount++;
                Thread.sleep(100);
            } catch (Exception e) {
                log.warn("[BigBallsData] MATCH_ID={} 일괄 동기화 중 오류: {}", m.getMatchId(), e.getMessage());
            }
        }
        log.info("[BigBallsData] {} 일자 총 {}경기 이벤트 일괄 동기화 완료 (총 {}건 저장)", dateStr, matchCount, totalSaved);
        return totalSaved;
    }
}
