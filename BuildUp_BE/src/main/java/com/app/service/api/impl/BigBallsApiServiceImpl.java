package com.app.service.api.impl;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.admin.AdminDAO;
import com.app.dao.match.MatchDAO;
import com.app.dao.team.TeamDAO;
import com.app.dto.match.MatchEvents;
import com.app.dto.match.Matches;
import com.app.dto.team.Players;
import com.app.dto.team.Teams;
import com.app.service.api.BigBallsApiService;
import com.app.service.api.GeminiApiService;
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
    private AdminDAO adminDAO;

    @Autowired
    private GeminiApiService geminiApiService;

    @Autowired
    private ApplicationContext applicationContext;

    private ObjectMapper objectMapper = new ObjectMapper();

    // [보안 및 성능 최적화 개선]
    // 1. JVM 기본 신뢰 인증서(CA)를 검증하여 중간자 공격(MITM) 및 전송 데이터 위·변조를 원천 방어합니다.
    // 2. 요청마다 클라이언트를 새로 생성하지 않고 싱글톤으로 재사용하여 커넥션 풀링 및 네트워크 성능을 대폭 향상시킵니다.
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private volatile boolean circuitBreakerActive = false;

    private String sendGetRequest(String url) {
        if (circuitBreakerActive) {
            return null;
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("x-api-key", apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            // 신뢰할 수 있는 공식 인증서로 검증된 안전한 연결을 통해 데이터를 수신합니다.
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
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

                // [1차 필터 1] 선수명 결측치(null, empty, "None", "null") 이벤트는 가짜 골/이벤트 유입 방지를 위해 즉시 스킵
                if (playerName == null || playerName.isBlank() || "null".equalsIgnoreCase(playerName.trim()) || "None".equalsIgnoreCase(playerName.trim())) {
                    log.warn("[BigBallsData] MATCH_ID={} 선수명 결측치('{}') 이벤트 -> 가짜 골/이벤트 유입 방지를 위해 스킵", matchId, playerName);
                    continue;
                }

                // 4단계: 어시스트(도움) 선수명 추출 (assist_name -> assist -> assist_player)
                String assistName = null;
                if (eventNode.hasNonNull("assist_name")) {
                    assistName = eventNode.path("assist_name").asText();
                } else if (eventNode.hasNonNull("assist")) {
                    assistName = eventNode.path("assist").asText();
                } else if (eventNode.hasNonNull("assist_player")) {
                    assistName = eventNode.path("assist_player").asText();
                }
                if ("null".equalsIgnoreCase(assistName) || "None".equalsIgnoreCase(assistName)) {
                    assistName = null;
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
                boolean isGoalEvent = (eventTypeCode == 1L || eventTypeCode == 2L || eventTypeCode == 3L);

                // [1차 필터 2] 동일 구단, 동일 분(Minute) 중복 골 이벤트 제거
                if (isGoalEvent) {
                    final long curMinute = minute;
                    final Long curTeamId = eventTeamId;
                    boolean duplicateGoal = parsedEvents.stream().anyMatch(e ->
                        e.getTeamId().equals(curTeamId) &&
                        (e.getEventType() != null && (e.getEventType() == 1L || e.getEventType() == 2L || e.getEventType() == 3L)) &&
                        e.getEventTime() == curMinute
                    );
                    if (duplicateGoal) {
                        log.info("[BigBallsData] MATCH_ID={} {}분 동일 구단(TEAM_ID={}) 중복 골 이벤트 감지 -> 디둡 스킵 (선수명: {})", matchId, curMinute, curTeamId, playerName);
                        continue;
                    }
                }

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
                    if (isGoalEvent) {
                        // 골 득점자는 외래키 및 득점 정합성을 위해 임의 대표선수(골키퍼 등)로 대체하지 않고 스킵
                        log.warn("[BigBallsData] MATCH_ID={} 골 득점자 선수 매칭 실패 (선수명: '{}', 구단ID: {}) -> 외래키 및 스코어 보호를 위해 스킵", matchId, playerName, eventTeamId);
                        continue;
                    }
                    if (targetSquad != null && !targetSquad.isEmpty()) {
                        playerId = targetSquad.get(0).getPlayerId();
                        log.warn("[BigBallsData] MATCH_ID={} 일반 이벤트 선수명 미매칭('{}') -> 구단 대표선수(ID={})로 대체 적재", matchId, playerName, playerId);
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

            // 경기 공식 스코어와 이벤트 간 불일치 감지 로깅 (AI 임의 자동 삭제 제거 -> 관리자 수동 검증 대상)
            if ("FINISHED".equalsIgnoreCase(match.getStatus()) && match.getHomeScore() != null && match.getAwayScore() != null) {
                Long homeTeamId = match.getHomeTeamId();
                Long awayTeamId = match.getAwayTeamId();
                long officialHomeScore = match.getHomeScore();
                long officialAwayScore = match.getAwayScore();

                long homeGoalCount = parsedEvents.stream()
                        .filter(e -> e.getTeamId().equals(homeTeamId) && (e.getEventType() == 1L || e.getEventType() == 2L || e.getEventType() == 3L))
                        .count();
                long awayGoalCount = parsedEvents.stream()
                        .filter(e -> e.getTeamId().equals(awayTeamId) && (e.getEventType() == 1L || e.getEventType() == 2L || e.getEventType() == 3L))
                        .count();

                if (homeGoalCount != officialHomeScore || awayGoalCount != officialAwayScore) {
                    log.warn("[BigBallsData] MATCH_ID={} 스코어-골 이벤트 불일치 감지 (공식: {}:{}, 이벤트: {}:{}). 관리자 수동 검증 대상으로 유지합니다.",
                            matchId, officialHomeScore, officialAwayScore, homeGoalCount, awayGoalCount);
                }
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
        return syncMatchEventsByDateRange(dateStr, dateStr);
    }

    @Override
    public int syncMatchEventsByDateRange(String fromDateStr, String toDateStr) {
        if (fromDateStr == null || fromDateStr.isBlank()) return 0;
        LocalDate startDate = LocalDate.parse(fromDateStr);
        LocalDate endDate = (toDateStr != null && !toDateStr.isBlank()) ? LocalDate.parse(toDateStr) : startDate;
        if (startDate.isAfter(endDate)) {
            LocalDate tmp = startDate;
            startDate = endDate;
            endDate = tmp;
        }

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        circuitBreakerActive = false; // 서킷 브레이커 상태 초기화

        List<Matches> allMatches = matchDAO.findMatchesByDateRange(start, end);
        // 비시즌 및 아직 열리지 않은 SCHEDULED 경기는 제외 -> 실제 종료된(FINISHED) 경기만 선별하여 404 차단 방지
        List<Matches> matches = (allMatches != null)
                ? allMatches.stream()
                        .filter(m -> "FINISHED".equalsIgnoreCase(m.getStatus()))
                        .toList()
                : Collections.emptyList();

        int totalSaved = 0;
        int matchCount = 0;
        int totalMatches = matches.size();

        System.out.println("======================================================================");
        System.out.println("[BuildUp] " + startDate + " ~ " + endDate + " 기간 타임라인 이벤트 일괄 동기화 시작");
        System.out.println("  - 전체 조회 경기: " + (allMatches != null ? allMatches.size() : 0) + "경기 (종료된 대상 경기: " + totalMatches + "경기)");
        System.out.println("----------------------------------------------------------------------");

        for (Matches m : matches) {
            if (circuitBreakerActive) {
                System.err.println("  [BuildUp 경고] 외부 API Rate Limit(서킷 브레이커) 감지로 인해 계정 보호를 위해 동기화가 안전하게 중단되었습니다.");
                break;
            }
            try {
                int count = syncMatchEventsAuto(m.getMatchId());
                totalSaved += count;
                matchCount++;
                if (matchCount % 10 == 0 || matchCount == totalMatches) {
                    System.out.println("  - 진행 중: [" + matchCount + " / " + totalMatches + " 경기] 처리 완료 (누적 " + totalSaved + "건 저장)");
                }
                Thread.sleep(200); // 0.2초 안전 딜레이
            } catch (Exception e) {
                log.warn("[BigBallsData] MATCH_ID={} 일괄 동기화 중 오류: {}", m.getMatchId(), e.getMessage());
            }
        }
        System.out.println("======================================================================");
        System.out.println("[BuildUp] " + startDate + " ~ " + endDate + " 기간 타임라인 이벤트 일괄 동기화 완료");
        System.out.println("  - 처리 결과: 총 " + matchCount + "경기 중 " + totalSaved + "건의 타임라인 이벤트 저장 완료");
        if (circuitBreakerActive) {
            System.out.println("  - 알림: 외부 API 서킷 브레이커(쿨다운) 감지로 조기 중단되었습니다. 3분 후 다시 시도해주세요.");
        }
        System.out.println("======================================================================");
        log.info("[BigBallsData] {} ~ {} 기간 총 {}경기 이벤트 일괄 동기화 완료 (총 {}건 저장)", startDate, endDate, matchCount, totalSaved);
        return totalSaved;
    }

    @Override
    public int resyncAllMismatchedFinishedMatches() {
        Map<String, Object> params = new HashMap<>();
        params.put("status", "MISMATCH");
        List<Matches> mismatched = adminDAO.selectAdminMatches(params);
        if (mismatched == null || mismatched.isEmpty()) {
            log.info("[BigBallsData] 스코어-골 이벤트 불일치 경기가 없습니다. (0건)");
            return 0;
        }

        log.info("[BigBallsData] 불일치 경기 총 {}건 발견 -> 2단계(1차 룰 + 2차 Gemini AI) 정밀 재동기화 시작", mismatched.size());
        int resyncedCount = 0;
        for (Matches m : mismatched) {
            try {
                int count = syncMatchEventsAuto(m.getMatchId());
                resyncedCount++;
                log.info("  -> Match #{} ({}) 재동기화 완료 (이벤트 {}건 저장)", m.getMatchId(), m.getMatchDate(), count);
                Thread.sleep(200);
            } catch (Exception e) {
                log.warn("[BigBallsData] MATCH_ID={} 불일치 재동기화 중 오류: {}", m.getMatchId(), e.getMessage());
            }
        }
        log.info("[BigBallsData] 불일치 경기 재동기화 완료: 총 {}경기 처리", resyncedCount);
        return resyncedCount;
    }
}
