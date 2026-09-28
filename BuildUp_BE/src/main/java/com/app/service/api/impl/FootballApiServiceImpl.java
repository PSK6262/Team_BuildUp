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
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.common.ExternalApiException;
import com.app.common.ResultCode;
import com.app.dao.match.MatchDAO;
import com.app.dao.team.TeamDAO;
import com.app.dto.match.Matches;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Teams;
import com.app.service.api.FootballApiService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * [외부 축구 데이터 동기화 서비스 구현체 - FootballApiServiceImpl]
 * 
 * [왜 1:1 DTO 대신 JsonNode(Jackson 트리 모델)를 사용하는가?]
 * 1. 외부 축구 API(football-data.org) 응답은 수십 개의 부가 정보와 4~5단계의 깊은 중첩 구조를 가집니다.
 * 2. 이를 모두 자바 DTO 클래스로 만들면 수십 개의 임시 클래스가 생겨 관리가 복잡해지고 API 스키마 변경에 취약해집니다.
 * 3. 따라서 JsonNode를 사용하여 우리 DB에 실제로 필요한 핵심 데이터(ID, 스코어, 일시, 엠블럼 등)만 집게(Picker)처럼
 *    선별 추출하며, path() 메서드를 통해 중간 필드가 누락되어도 NullPointerException 없이 안전하게 처리합니다.
 */
@Service
public class FootballApiServiceImpl implements FootballApiService {

    private static final Logger log = LoggerFactory.getLogger(FootballApiServiceImpl.class);

    @Value("${football.api.key}")
    private String apiKey;

    @Autowired
    private TeamDAO teamDAO;

    @Autowired
    private MatchDAO matchDAO;

    @Autowired(required = false)
    private com.app.service.prediction.PredictionService predictionService;

    private ObjectMapper objectMapper = new ObjectMapper();

    // [보안 및 성능 최적화 개선]
    // 1. JVM 기본 신뢰 인증서(CA)를 검증하여 중간자 공격(MITM) 및 전송 데이터 위·변조를 원천 방어합니다.
    // 2. 요청마다 클라이언트를 새로 생성하지 않고 싱글톤으로 재사용하여 커넥션 풀링 및 네트워크 성능을 대폭 향상시킵니다.
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // [질문 11 - 외부 API 재시도 및 장애 내성 설정]
    private static final int MAX_RETRY_COUNT = 2; // 최대 재시도 횟수 (기본 1회 + 재시도 2회 = 총 3회)
    private static final long RETRY_BACKOFF_MS = 500L; // 재시도 전 대기 지연(ms)

    /**
     * 외부 축구 API(football-data.org)에 GET HTTP 요청을 전송하고 JSON 본문 문자열을 반환합니다.
     * 
     * [질문 11 개선 사항]:
     * 1. 단순 null 반환을 제거하여 호출부에서 데이터 부재 vs 통신 장애를 명확히 구분할 수 있도록 합니다.
     * 2. 일시적인 네트워크 타임아웃이나 외부 서버 장애(5xx) 시 최대 2회 지수 백오프 재시도(Retry)를 수행합니다.
     * 3. 429(Rate Limit 초과), 401/403(인증 실패), 5xx(서버 장애) 등 실패 원인을 담은 ExternalApiException을 던집니다.
     * 
     * @param url 호출할 외부 API 전체 URL
     * @return 성공 시 JSON 본문 문자열 (절대 null을 반환하지 않음)
     * @throws ExternalApiException 외부 API 연동 실패 시
     */
    private String sendGetRequest(String url) {
        int attempt = 0;

        while (attempt <= MAX_RETRY_COUNT) {
            attempt++;
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("X-Auth-Token", apiKey)
                        .timeout(Duration.ofSeconds(10))
                        .GET()
                        .build();

                // 공식 SSL 인증서 검증을 통과한 안전한 HTTPS 통신을 수행합니다.
                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                int statusCode = response.statusCode();

                // 1. 정상 응답 (2xx)
                if (statusCode >= 200 && statusCode < 300) {
                    return response.body();
                }

                // 2. 429 Too Many Requests (호출 제한 초과 - 즉시 명확한 예외 발생)
                if (statusCode == 429) {
                    log.warn("[FootballData] API 일일/초당 호출 한도 초과 (HTTP 429, URL: {})", url);
                    throw new ExternalApiException(ResultCode.EXTERNAL_API_RATE_LIMIT, 429, url,
                            "외부 축구 API 호출 한도(429 Too Many Requests)를 초과했습니다. 잠시 후 다시 시도해주세요.");
                }

                // 3. 401 / 403 인증 실패
                if (statusCode == 401 || statusCode == 403) {
                    log.error("[FootballData] API 인증 실패 (HTTP {}, URL: {})", statusCode, url);
                    throw new ExternalApiException(ResultCode.EXTERNAL_API_ERROR, statusCode, url,
                            "외부 축구 API 키 인증에 실패했거나 접근 권한이 없습니다. (HTTP " + statusCode + ")");
                }

                // 4. 5xx 외부 서버 장애 발생 -> 일시적 이슈일 수 있으므로 재시도 대상
                if (statusCode >= 500) {
                    log.warn("[FootballData] 외부 API 서버 장애 (HTTP {}, 시도 {}/{}, URL: {})",
                            statusCode, attempt, MAX_RETRY_COUNT + 1, url);
                    if (attempt <= MAX_RETRY_COUNT) {
                        try {
                            Thread.sleep(RETRY_BACKOFF_MS * attempt);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                        continue; // 재시도 진행
                    }
                    throw new ExternalApiException(ResultCode.EXTERNAL_API_SERVER_ERROR, statusCode, url,
                            "외부 축구 API 서버에 일시적인 장애가 발생했습니다. (HTTP " + statusCode + ")");
                }

                // 5. 기타 4xx 클라이언트 오류
                throw new ExternalApiException(ResultCode.EXTERNAL_API_ERROR, statusCode, url,
                        "외부 축구 API 요청에 실패했습니다. (HTTP " + statusCode + ")");

            } catch (ExternalApiException e) {
                // 커스텀 비즈니스 예외는 그대로 상위로 전파
                throw e;
            } catch (java.net.http.HttpTimeoutException e) {
                log.warn("[FootballData] 네트워크 응답 시간 초과 (시도 {}/{}, URL: {}): {}",
                        attempt, MAX_RETRY_COUNT + 1, url, e.getMessage());
                if (attempt <= MAX_RETRY_COUNT) {
                    try {
                        Thread.sleep(RETRY_BACKOFF_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    continue; // 재시도 진행
                }
                throw new ExternalApiException(ResultCode.EXTERNAL_API_TIMEOUT, 504, url,
                        "외부 축구 API 서버 응답 시간이 초과되었습니다. (Timeout)", e);
            } catch (Exception e) {
                log.warn("[FootballData] HTTP 통신 오류 발생 (시도 {}/{}, URL: {}): {}",
                        attempt, MAX_RETRY_COUNT + 1, url, e.getMessage());
                if (attempt <= MAX_RETRY_COUNT) {
                    try {
                        Thread.sleep(RETRY_BACKOFF_MS * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                    continue; // 재시도 진행
                }
                throw new ExternalApiException(ResultCode.EXTERNAL_API_ERROR, 502, url,
                        "외부 축구 API와의 통신 중 오류가 발생했습니다: " + e.getMessage(), e);
            }
        }

        throw new ExternalApiException(ResultCode.EXTERNAL_API_ERROR, 502, url,
                "외부 축구 API 요청 실패 (최대 재시도 횟수 초과)");
    }

    /**
     * 특정 구단의 기본 정보 및 소속 선수단(Squad) JSON 데이터를 외부 API에서 조회합니다.
     * @param teamId 구단 식별자 (예: 57 - 아스널)
     * @return 구단 및 스쿼드 원본 JSON 응답 문자열
     */
    @Override
    public String fetchTeamData(Long teamId) {
        String url = "https://api.football-data.org/v4/teams/" + teamId;
        return sendGetRequest(url);
    }

    /**
     * 프리미어리그에 참가하는 전체 20개 구단 목록 JSON 데이터를 외부 API에서 조회합니다.
     * @return 전체 구단 목록 원본 JSON 응답 문자열
     */
    @Override
    public String fetchAllTeamsData() {
        String url = "https://api.football-data.org/v4/competitions/PL/teams";
        return sendGetRequest(url);
    }

    /**
     * 특정 구단의 최신 선수단 정보를 외부 API에서 조회하여 TEAMS 및 PLAYERS 테이블에 저장/갱신합니다.
     * @param teamId 구단 식별자
     * @return DB에 저장/갱신된 해당 구단 소속 선수 리스트
     */
    @Override
    @Transactional
    public List<Players> syncTeamPlayers(Long teamId) {
        String jsonResult = fetchTeamData(teamId);
        if (jsonResult == null || jsonResult.isBlank()) {
            throw new RuntimeException("팀 데이터를 가져오는데 실패했습니다. (teamId: " + teamId + ")");
        }

        try {
            JsonNode teamNode = objectMapper.readTree(jsonResult);
            parseAndSaveTeamWithSquad(teamNode);
            return teamDAO.findPlayersByTeamId(teamId);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("팀 및 선수 데이터 처리 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 프리미어리그 전체 20개 구단 및 약 500여 명의 선수단을 외부 API에서 일괄 조회하여 DB에 동기화합니다.
     * @return DB에 일괄 저장된 총 선수 수
     */
    @Override
    @Transactional
    public int syncAllPremierLeagueTeamsAndPlayers() {
        String jsonResult = fetchAllTeamsData();
        if (jsonResult == null || jsonResult.isBlank()) {
            throw new RuntimeException("프리미어리그 팀 목록을 가져오는데 실패했습니다.");
        }

        int totalSavedPlayers = 0;
        try {
            JsonNode rootNode = objectMapper.readTree(jsonResult);
            JsonNode teamsArray = rootNode.path("teams");

            if (teamsArray.isArray()) {
                for (JsonNode teamNode : teamsArray) {
                    List<Players> saved = parseAndSaveTeamWithSquad(teamNode);
                    totalSavedPlayers += saved.size();
                }
            }
            return totalSavedPlayers;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("전체 팀 및 선수 데이터 동기화 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 특정 시즌(기본값: 최신 시즌)의 전체 380경기 일정을 외부 API에서 조회하여 MATCHES 테이블에 일괄 적재합니다.
     * - 경기 일시는 런던/UTC 시각에서 한국 표준시(KST, Asia/Seoul)로 자동 변환됩니다.
     * @param season 대상 시즌 연도 (예: 2026, null일 경우 최신 시즌)
     * @return DB에 동기화된 경기 일정 건수
     */
    @Override
    @Transactional
    public int syncPremierLeagueSeasonMatches(Integer season) {
        String url = "https://api.football-data.org/v4/competitions/PL/matches";
        if (season != null) {
            url += "?season=" + season;
        }
        String jsonResult = sendGetRequest(url);
        if (jsonResult == null || jsonResult.isBlank()) {
            throw new RuntimeException("시즌 경기 일정을 가져오는데 실패했습니다. (season: " + (season != null ? season : "current") + ")");
        }

        try {
            JsonNode rootNode = objectMapper.readTree(jsonResult);
            JsonNode matchesArray = rootNode.path("matches");
            int savedCount = 0;

            if (matchesArray.isArray()) {
                for (JsonNode matchNode : matchesArray) {
                    if (parseAndSaveMatch(matchNode)) {
                        savedCount++;
                    }
                }
            }
            return savedCount;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("시즌 경기 데이터 동기화 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 지정한 특정 일자(기본값: 오늘)에 진행되는 경기들의 상태와 실시간 스코어를 외부 API에서 조회하여 DB에 갱신합니다.
     * @param date 대상 일자 (null일 경우 오늘 한국 날짜 기준)
     * @return 상태/스코어가 갱신된 경기 건수
     */
    @Override
    @Transactional
    public int syncMatchesByDate(LocalDate date) {
        return syncMatchesByDateRange(date, date);
    }

    /**
     * 지정한 날짜 범위(fromDate ~ toDate)에 진행되는 경기들의 상태와 실시간 스코어를 외부 API에서 조회하여 DB에 갱신합니다.
     * @param fromDate 시작 일자
     * @param toDate 종료 일자
     * @return 상태/스코어가 갱신된 경기 건수
     */
    @Override
    @Transactional
    public int syncMatchesByDateRange(LocalDate fromDate, LocalDate toDate) {
        LocalDate start = (fromDate != null) ? fromDate : LocalDate.now(ZoneId.of("Asia/Seoul"));
        LocalDate end = (toDate != null) ? toDate : start;
        if (start.isAfter(end)) {
            LocalDate tmp = start;
            start = end;
            end = tmp;
        }

        // KST와 UTC 시차(9시간)를 고려하여 start-1일부터 end일까지 범위를 조회
        String fromDateStr = start.minusDays(1).format(DateTimeFormatter.ISO_LOCAL_DATE);
        String toDateStr = end.format(DateTimeFormatter.ISO_LOCAL_DATE);
        String url = "https://api.football-data.org/v4/competitions/PL/matches?dateFrom=" + fromDateStr + "&dateTo=" + toDateStr;

        String jsonResult = sendGetRequest(url);
        if (jsonResult == null || jsonResult.isBlank()) {
            throw new RuntimeException(fromDateStr + " ~ " + toDateStr + " 기간 경기 일정을 가져오는데 실패했습니다.");
        }

        try {
            JsonNode rootNode = objectMapper.readTree(jsonResult);
            JsonNode matchesArray = rootNode.path("matches");
            int savedCount = 0;

            if (matchesArray.isArray()) {
                for (JsonNode matchNode : matchesArray) {
                    if (parseAndSaveMatch(matchNode)) {
                        savedCount++;
                    }
                }
            }
            return savedCount;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("기간별 경기 데이터 동기화 중 오류 발생: " + e.getMessage(), e);
        }
    }

    /**
     * 단일 경기 JSON 노드를 파싱하여 외래키 무결성을 검증하고, 스코어/상태/일시를 MATCHES 테이블에 MERGE합니다.
     * - [JsonNode 활용 이유]: path("score").path("fullTime")처럼 체이닝해도 중간 필드가 없으면 빈 깡통 노드를 반환하여 NullPointerException을 방어합니다.
     * - [hasNonNull 활용]: 경기 시작 전 미입력(null) 상태와 실제 '0:0' 스코어를 구분하기 위해 사용합니다.
     * @param matchNode 외부 API에서 내려온 단일 경기 JSON 노드
     * @return 저장/갱신 성공 여부 (true: 성공, false: 필수값 누락)
     */
    private boolean parseAndSaveMatch(JsonNode matchNode) {
        if (matchNode == null || !matchNode.hasNonNull("id")) {
            return false;
        }

        Long matchId = matchNode.get("id").asLong();
        String utcDateStr = matchNode.path("utcDate").asText();

        // 런던/UTC 시각 -> 한국 표준시(KST, Asia/Seoul)로 변환
        LocalDateTime kstMatchDate;
        try {
            kstMatchDate = ZonedDateTime.parse(utcDateStr)
                    .withZoneSameInstant(ZoneId.of("Asia/Seoul"))
                    .toLocalDateTime();
        } catch (Exception e) {
            kstMatchDate = LocalDateTime.now();
        }

        Long homeTeamId = matchNode.path("homeTeam").get("id").asLong();
        Long awayTeamId = matchNode.path("awayTeam").get("id").asLong();

        // 외래키 무결성(ORA-02291) 방지: 홈팀과 원정팀이 TEAMS 테이블에 없으면 선저장
        ensureTeamExists(matchNode.path("homeTeam"));
        ensureTeamExists(matchNode.path("awayTeam"));

        String statusRaw = matchNode.path("status").asText("SCHEDULED");
        String status = convertMatchStatus(statusRaw);

        JsonNode fullTimeNode = matchNode.path("score").path("fullTime");
        Long homeScore = fullTimeNode.hasNonNull("home") ? fullTimeNode.get("home").asLong() : null;
        Long awayScore = fullTimeNode.hasNonNull("away") ? fullTimeNode.get("away").asLong() : null;

        LocalDateTime endedAt = null;
        if ("FINISHED".equalsIgnoreCase(status)) {
            endedAt = kstMatchDate.plusMinutes(115); // 경기 시작 후 약 115분 뒤 종료 예상시각
        }

        Matches match = new Matches();
        match.setMatchId(matchId);
        match.setMatchDate(kstMatchDate);
        match.setHomeTeamId(homeTeamId);
        match.setAwayTeamId(awayTeamId);
        match.setHomeScore(homeScore);
        match.setAwayScore(awayScore);
        match.setStatus(status);
        match.setEndedAt(endedAt);

        matchDAO.mergeMatch(match);

        // 경기가 종료되고 스코어가 확정되면 승부예측 결과 자동 정산
        if ("FINISHED".equalsIgnoreCase(status) && homeScore != null && awayScore != null && predictionService != null) {
            try {
                predictionService.settleMatchPredictions(matchId);
            } catch (Exception e) {
                log.warn("[FootballApiService] 경기(ID: {}) 승부예측 자동 정산 중 예외 발생: {}", matchId, e.getMessage());
            }
        }

        return true;
    }

    /**
     * 경기 또는 득점자 데이터 저장 시, 구단 외래키(FK) 제약조건 위반(ORA-02291)을 방지하기 위해
     * 해당 구단이 TEAMS 테이블에 없으면 기본 구단 레코드를 선저장(UPSERT)합니다.
     * @param teamNode 외부 API의 구단 JSON 노드
     */
    private void ensureTeamExists(JsonNode teamNode) {
        if (teamNode != null && teamNode.hasNonNull("id")) {
            Long teamId = teamNode.get("id").asLong();
            String name = teamNode.path("name").asText("구단 " + teamId);
            String crest = teamNode.hasNonNull("crest") ? teamNode.get("crest").asText() : null;
            crest = resolveOfficialEmblemUrl(teamId, crest);

            Teams team = new Teams();
            team.setTeamId(teamId);
            team.setTeamName(name);
            team.setEmblemUrl(crest);
            team.setHomeGround("홈 경기장");
            team.setFoundedYear(1900L);
            team.setHistory(null);

            teamDAO.mergeTeam(team);
        }
    }

    /**
     * 구단 JSON 노드에서 구단 기본 정보를 TEAMS 테이블에 저장하고, 소속 선수단 전체를 PLAYERS 및 PLAYER_STATS 테이블에 저장합니다.
     * @param teamNode 구단 및 스쿼드가 포함된 JSON 노드
     * @return DB에 저장된 선수 목록
     */
    private List<Players> parseAndSaveTeamWithSquad(JsonNode teamNode) {
        if (teamNode == null || !teamNode.hasNonNull("id")) {
            return new ArrayList<>();
        }

        Long teamId = teamNode.get("id").asLong();
        String teamName = teamNode.path("name").asText();
        String emblemUrl = teamNode.hasNonNull("crest") ? teamNode.get("crest").asText() : null;
        emblemUrl = resolveOfficialEmblemUrl(teamId, emblemUrl);
        String venue = teamNode.path("venue").asText("홈 경기장");
        Long founded = teamNode.hasNonNull("founded") ? teamNode.get("founded").asLong() : 1900L;

        // 1. 구단 정보 저장 (선수 외래키 보장을 위해 구단 선저장)
        // API에서 구단 역사/소개(HISTORY) 요약 정보는 제공되지 않으므로 null 저장
        Teams team = new Teams();
        team.setTeamId(teamId);
        team.setTeamName(teamName);
        team.setHistory(null);
        team.setEmblemUrl(emblemUrl);
        team.setFoundedYear(founded);
        team.setHomeGround(venue);

        teamDAO.mergeTeam(team);

        /*
         * =========================================================================
         * [유료 API 연동 대비 틀 - Coach Parsing Skeleton]
         * 현재 football-data.org 무료 플랜에서는 coach 객체의 필드가 모두 null로 반환되어 무효화 처리했습니다.
         * 추후 유료 API 플랜(Standard/Pro) 또는 타 유료 축구 API 도입 시,
         * 아래 주석을 해제하면 구단 동기화 시 감독 정보가 자동으로 STAFFS 테이블에 연동됩니다.
         * =========================================================================
        JsonNode coachNode = teamNode.path("coach");
        if (!coachNode.isMissingNode() && !coachNode.isNull() && coachNode.hasNonNull("name")) {
            String coachName = coachNode.get("name").asText().trim();
            if (!coachName.isBlank()) {
                String nationality = coachNode.hasNonNull("nationality") ? coachNode.get("nationality").asText() : null;

                // FK 방어: 1번(감독) 직책이 없으면 자동 등록
                teamDAO.ensureStaffRoleExists(1L, "감독");

                Staffs coach = new Staffs();
                coach.setName(coachName);
                coach.setNationality(nationality);
                coach.setTeamId(teamId);
                coach.setStaffRoleId(1L);

                teamDAO.mergeStaff(coach);
            }
        }
        */

        // 3. 선수 목록 저장
        JsonNode squadNode = teamNode.path("squad");
        List<Players> savedPlayers = new ArrayList<>();

        if (squadNode.isArray()) {
            for (JsonNode playerNode : squadNode) {
                if (!playerNode.hasNonNull("id")) continue;

                Long playerId = playerNode.get("id").asLong();
                String name = playerNode.path("name").asText("알 수 없음");
                String positionRaw = playerNode.hasNonNull("position") ? playerNode.get("position").asText() : null;
                String nationality = playerNode.hasNonNull("nationality") ? playerNode.get("nationality").asText() : null;

                Players player = new Players();
                player.setPlayerId(playerId);
                player.setName(name);
                player.setMainPosition(convertMainPosition(positionRaw));
                player.setDetailPosition(convertDetailPosition(positionRaw));
                player.setNationality(nationality);
                player.setTeamId(teamId);

                // 선수 정보 UPSERT
                teamDAO.mergePlayer(player);
                // 선수 1:1 시즌 기본 통계 레코드 생성
                teamDAO.mergePlayerStats(playerId);

                savedPlayers.add(player);
            }
        }

        return savedPlayers;
    }

    /**
     * 영문 포지션 명칭을 우리 서비스의 4대 메인 포지션 대분류(GK, DF, MF, FW)로 표준화 변환합니다.
     * @param position 외부 API에서 전달받은 원본 포지션 문자열
     * @return 표준 메인 포지션 코드 (GK, DF, MF, FW)
     */
    private String convertMainPosition(String position) {
        if (position == null || position.isBlank()) {
            return "MF";
        }
        String p = position.trim().toLowerCase();
        if (p.contains("goal") || p.equals("gk")) return "GK";
        if (p.contains("def") || p.contains("back") || p.equals("df")) return "DF";
        if (p.contains("mid") || p.equals("mf")) return "MF";
        if (p.contains("off") || p.contains("forw") || p.contains("att") || p.contains("wing") || p.contains("striker") || p.equals("fw")) return "FW";
        return "MF";
    }

    /**
     * 영문 포지션 명칭을 축구 표준 공식 세부 포지션 약어(CB, LB, RB, CDM, CAM, CM, ST, LW, RW 등)로 변환합니다.
     * @param position 외부 API에서 전달받은 원본 포지션 문자열
     * @return 공식 세부 포지션 약어
     */
    private String convertDetailPosition(String position) {
        if (position == null || position.isBlank()) {
            return "MF";
        }
        String p = position.trim().toLowerCase();

        // 1. 골키퍼
        if (p.contains("goal") || p.equals("gk")) {
            return "GK";
        }

        // 2. 수비수 세부 약어 (CB, LB, RB, DF)
        if (p.contains("centre-back") || p.contains("center-back") || p.equals("cb")) {
            return "CB";
        }
        if (p.contains("left-back") || p.equals("lb")) {
            return "LB";
        }
        if (p.contains("right-back") || p.equals("rb")) {
            return "RB";
        }
        if (p.contains("def") || p.contains("back") || p.equals("df")) {
            return "DF";
        }

        // 3. 미드필더 세부 약어 (CDM, CAM, CM, LM, RM, MF)
        if (p.contains("defensive mid") || p.equals("cdm") || p.equals("dm")) {
            return "CDM";
        }
        if (p.contains("attacking mid") || p.equals("cam") || p.equals("am")) {
            return "CAM";
        }
        if (p.contains("left mid") || p.equals("lm")) {
            return "LM";
        }
        if (p.contains("right mid") || p.equals("rm")) {
            return "RM";
        }
        if (p.contains("central mid") || p.equals("cm")) {
            return "CM";
        }
        if (p.contains("mid") || p.equals("mf")) {
            return "MF";
        }

        // 4. 공격수 세부 약어 (ST, LW, RW, SS, FW)
        if (p.contains("left wing") || p.equals("lw")) {
            return "LW";
        }
        if (p.contains("right wing") || p.equals("rw")) {
            return "RW";
        }
        if (p.contains("second striker") || p.equals("ss")) {
            return "SS";
        }
        if (p.contains("centre-forward") || p.contains("center-forward") || p.contains("striker") || p.equals("st") || p.equals("cf")) {
            return "ST";
        }
        if (p.contains("off") || p.contains("forw") || p.contains("att") || p.equals("fw")) {
            return "FW";
        }

        String upper = position.trim().toUpperCase();
        if (upper.length() > 20) {
            return upper.substring(0, 20);
        }
        return upper;
    }

    /**
     * 외부 API의 경기 진행 상태(TIMED, IN_PLAY, PAUSED, FINISHED 등)를 우리 시스템의 경기 상태값으로 변환합니다.
     * @param status 외부 API 경기 상태 문자열
     * @return 표준화된 경기 상태 문자열 (SCHEDULED, LIVE, FINISHED, SUSPENDED, CANCELLED)
     */
    private String convertMatchStatus(String status) {
        if (status == null || status.isBlank()) {
            return "SCHEDULED";
        }
        String upperStatus = status.trim().toUpperCase();
        switch (upperStatus) {
            case "TIMED":
            case "SCHEDULED":
                return "SCHEDULED";
            case "IN_PLAY":
            case "PAUSED":
            case "LIVE":
                return "LIVE";
            case "FINISHED":
            case "AWARDED":
                return "FINISHED";
            case "POSTPONED":
            case "SUSPENDED":
                return "SUSPENDED";
            case "CANCELLED":
                return "CANCELLED";
            default:
                return "SCHEDULED";
        }
    }

    /**
     * [유료 API 도입 대비 틀] 프리미어리그 구단 감독/코칭스태프 기본 정보를 STAFFS 테이블에 일괄 적재합니다.
     * - 현재 football-data.org 무료 플랜에서는 감독 데이터가 제공되지 않아 비활성화(Dormant) 상태입니다.
     * @return 적재된 감독 수 (현재: 0)
     */
    @Override
    @Transactional
    public int initPremierLeagueStaffs() {
        /*
         * =========================================================================
         * [유료 API 도입 전 임시 수동 등록 / 유료 API 도입 대비 틀]
         * 현재 football-data.org 무료 API에서는 감독 정보가 제공되지 않아 준비해 둔 기본 틀입니다.
         * 무료 API 환경에서 임의/과거 데이터로 덮어쓰여지는 것을 방지하기 위해 무효화(/*) 처리해 두었습니다.
         * 추후 유료 API 연동 후 실시간 호출 방식으로 전환하거나, 필요 시 주석을 해제하여 수동 적재할 수 있습니다.
         * =========================================================================
        teamDAO.ensureStaffRoleExists(1L, "감독");

        List<Staffs> defaultManagers = List.of(
            createStaff(57L, "Mikel Arteta", "Spain", 1L),
            createStaff(58L, "Unai Emery", "Spain", 1L),
            createStaff(61L, "Xavi Alonso", "Spain", 1L),
            createStaff(62L, "David Moyes", "Scotland", 1L),
            createStaff(63L, "Álvaro Arbeloa", "Spain", 1L),
            createStaff(64L, "Andoni Iraola", "Spain", 1L),
            createStaff(65L, "Enzo Maresca", "Italy", 1L),
            createStaff(66L, "Michael Carrick", "England", 1L),
            createStaff(67L, "Matthias Jaissle", "Germany", 1L),
            createStaff(71L, "Regis Le Bris", "France", 1L),
            createStaff(73L, "Roberto De Zerbi", "Italy", 1L),
            createStaff(322L, "Sergej Jakirovic", "Bosnia and Herzegovina", 1L),
            createStaff(341L, "Daniel Farke", "Germany", 1L),
            createStaff(349L, "Gary O'Neil", "England", 1L),
            createStaff(351L, "Oliver Glasner", "Austria", 1L),
            createStaff(354L, "Pierre Sage", "France", 1L),
            createStaff(397L, "Fabian Hurzeler", "Germany", 1L),
            createStaff(402L, "Keith Andrews", "Ireland", 1L),
            createStaff(563L, "Nuno Espirito Santo", "Portugal", 1L),
            createStaff(1044L, "Andoni Iraola", "Spain", 1L),
            createStaff(1076L, "Frank Lampard", "England", 1L)
        );

        for (Staffs s : defaultManagers) {
            teamDAO.mergeStaff(s);
        }
        return defaultManagers.size();
        */
        log.info("[FootballApi] 현재 무료 API 환경이므로 감독 자동/기본 설정이 비활성화(Dormant) 상태입니다.");
        return 0;
    }

    /**
     * 스태프 DTO 객체 생성을 보조하는 헬퍼 메서드입니다.
     */
    @SuppressWarnings("unused")
    private Staffs createStaff(Long teamId, String name, String nationality, Long staffRoleId) {
        Staffs s = new Staffs();
        s.setTeamId(teamId);
        s.setName(name);
        s.setNationality(nationality);
        s.setStaffRoleId(staffRoleId);
        return s;
    }

    /**
     * 특정 시즌의 프리미어리그 순위표(순위, 승점, 경기수, 승무패, 득실차 등)를 외부 API에서 조회하여 TEAM_STATS 테이블에 동기화합니다.
     * @param season 대상 시즌 (null일 경우 2026 기본 적용)
     * @return 갱신된 구단 순위 레코드 수
     */
    @Override
    @Transactional
    public int syncPremierLeagueStandings(Integer season) {
        String url = "https://api.football-data.org/v4/competitions/PL/standings";
        if (season != null) {
            url += "?season=" + season;
        }

        String jsonResult = sendGetRequest(url);
        if (jsonResult == null || jsonResult.isBlank()) {
            throw new RuntimeException("프리미어리그 순위 데이터를 가져오는데 실패했습니다. (season: " + (season != null ? season : "current") + ")");
        }

        try {
            JsonNode rootNode = objectMapper.readTree(jsonResult);
            int targetSeason = (season != null) ? season : 2026;
            JsonNode filtersNode = rootNode.path("filters");
            if (season == null && filtersNode.hasNonNull("season")) {
                try {
                    targetSeason = Integer.parseInt(filtersNode.get("season").asText());
                } catch (Exception ignored) {}
            }

            JsonNode standingsArray = rootNode.path("standings");
            if (!standingsArray.isArray() || standingsArray.isEmpty()) {
                return 0;
            }

            JsonNode tableArray = standingsArray.get(0).path("table");
            if (!tableArray.isArray()) {
                return 0;
            }

            int count = 0;
            for (JsonNode row : tableArray) {
                JsonNode teamNode = row.path("team");
                if (!teamNode.hasNonNull("id")) continue;

                Long teamId = teamNode.get("id").asLong();
                ensureTeamExists(teamNode);

                TeamStats stats = new TeamStats();
                stats.setTeamId(teamId);
                stats.setSeason(targetSeason);
                stats.setCurrentRank(row.path("position").asLong());
                stats.setMatchesPlayed(row.path("playedGames").asLong(0));
                stats.setWins(row.path("won").asLong(0));
                stats.setDraws(row.path("draw").asLong(0));
                stats.setLosses(row.path("lost").asLong(0));
                stats.setPoints(row.path("points").asLong(0));
                stats.setGoalsFor(row.path("goalsFor").asLong(0));
                stats.setGoalsAgainst(row.path("goalsAgainst").asLong(0));
                stats.setGoalDiff(row.path("goalDifference").asLong(0));

                teamDAO.mergeTeamStats(stats);
                count++;
            }

            System.out.println("======================================================================");
            System.out.println("[BuildUp] 리그 순위표 동기화 완료 (" + targetSeason + " 시즌)");
            System.out.println("----------------------------------------------------------------------");
            System.out.println("  - 처리 결과: 총 " + count + "개 구단 성적 데이터가 DB에 저장되었습니다.");
            System.out.println("======================================================================");
            return count;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("순위 데이터 파싱 및 저장 중 오류: " + e.getMessage(), e);
        }
    }

    /**
     * 최근 3개 시즌(2024, 2025, 2026)의 리그 순위표를 외부 API에서 순차 조회하여 DB에 일괄 동기화합니다.
     * - 무료 API의 호출 제한(분당 10회)을 준수하기 위해 호출 간 1.5초 대기를 적용합니다.
     * @return 저장된 총 순위 레코드 수
     */
    @Override
    public int syncRecentThreeSeasonsStandings() {
        int[] seasons = {2024, 2025, 2026};
        int totalUpdated = 0;

        System.out.println("======================================================================");
        System.out.println("[BuildUp] 최근 3개년(2024~2026) 리그 순위표 일괄 동기화 시작");
        System.out.println("----------------------------------------------------------------------");
        for (int season : seasons) {
            try {
                int count = syncPremierLeagueStandings(season);
                totalUpdated += count;
                // API 분당 10회 준수를 위한 1.5초 대기
                Thread.sleep(1500);
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("  [BuildUp] " + season + " 시즌 동기화 중 오류: " + e.getMessage());
            }
        }
        System.out.println("======================================================================");
        System.out.println("[BuildUp] 최근 3개년 리그 순위표 일괄 동기화 완료");
        System.out.println("----------------------------------------------------------------------");
        System.out.println("  - 처리 결과: 총 " + totalUpdated + "건의 시즌 순위 데이터가 DB에 저장되었습니다.");
        System.out.println("======================================================================");
        return totalUpdated;
    }

    /**
     * 프리미어리그 개인 득점 랭킹(골, 도움) 데이터를 외부 API에서 조회하여 PLAYER_STATS 테이블에 동기화합니다.
     * @param limit 조회할 상위 득점자 수 (기본: 100명)
     * @return 동기화된 득점자 수
     */
    @Override
    @Transactional
    public int syncPremierLeagueScorers(Integer limit) {
        int targetLimit = (limit != null && limit > 0) ? limit : 100;
        String url = "https://api.football-data.org/v4/competitions/PL/scorers?limit=" + targetLimit;

        String jsonResult = sendGetRequest(url);
        if (jsonResult == null || jsonResult.isBlank()) {
            throw new RuntimeException("프리미어리그 득점자 데이터를 가져오는데 실패했습니다.");
        }

        try {
            JsonNode rootNode = objectMapper.readTree(jsonResult);
            JsonNode scorersArray = rootNode.path("scorers");

            if (!scorersArray.isArray() || scorersArray.isEmpty()) {
                return 0;
            }

            int count = 0;
            for (JsonNode item : scorersArray) {
                JsonNode playerNode = item.path("player");
                if (!playerNode.hasNonNull("id")) continue;

                Long playerId = playerNode.get("id").asLong();
                Long goals = item.path("goals").asLong(0);
                Long assists = item.hasNonNull("assists") ? item.get("assists").asLong(0) : 0L;

                // 외래키(FK) 제약조건 보장: 구단 및 선수 기본 레코드 UPSERT
                ensureTeamExists(item.path("team"));
                ensurePlayerExists(playerNode, item.path("team"));

                teamDAO.mergePlayerGoalsAndAssists(playerId, goals, assists);
                count++;
            }

            System.out.println("======================================================================");
            System.out.println("[BuildUp] 프리미어리그 개인 득점 순위(Top " + targetLimit + ") 동기화 완료");
            System.out.println("----------------------------------------------------------------------");
            System.out.println("  - 처리 결과: 총 " + count + "명의 득점/도움 통계가 DB에 저장되었습니다.");
            System.out.println("======================================================================");
            return count;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("득점자 데이터 파싱 및 저장 중 오류: " + e.getMessage(), e);
        }
    }

    /**
     * 득점자 기록 저장 시, 선수 외래키(FK) 제약조건 위반을 방지하기 위해 해당 선수가 PLAYERS 테이블에 없으면 선저장합니다.
     * @param playerNode 선수 JSON 노드
     * @param teamNode 소속 구단 JSON 노드
     */
    private void ensurePlayerExists(JsonNode playerNode, JsonNode teamNode) {
        if (playerNode != null && playerNode.hasNonNull("id")) {
            Long playerId = playerNode.get("id").asLong();
            String name = playerNode.path("name").asText("선수 " + playerId);
            String positionRaw = null;
            if (playerNode.hasNonNull("section")) {
                positionRaw = playerNode.get("section").asText();
            } else if (playerNode.hasNonNull("position")) {
                positionRaw = playerNode.get("position").asText();
            }
            String nationality = playerNode.hasNonNull("nationality") ? playerNode.get("nationality").asText() : null;
            Long teamId = (teamNode != null && teamNode.hasNonNull("id")) ? teamNode.get("id").asLong() : null;

            if (teamId == null) {
                return;
            }

            Players player = new Players();
            player.setPlayerId(playerId);
            player.setName(name);
            player.setMainPosition(convertMainPosition(positionRaw));
            // 기존 정밀 세부 포지션(CAM, ST 등) 보존을 위해 null 전달 (매퍼 NVL 처리)
            player.setDetailPosition(null);
            player.setNationality(nationality);
            player.setTeamId(teamId);

            teamDAO.mergePlayer(player);
        }
    }

    /**
     * 구단 ID를 기반으로 프리미어리그 공식 CDN의 고화질 투명 PNG 엠블럼 URL로 매핑 및 보정합니다.
     * @param teamId 구단 식별자
     * @param defaultUrl 공식 CDN 엠블럼이 매핑되지 않았을 때 반환할 기본 URL
     * @return 프리미어리그 공식 엠블럼 URL (매핑 실패 시 defaultUrl)
     */
    private String resolveOfficialEmblemUrl(Long teamId, String defaultUrl) {
        if (teamId == null) {
            return defaultUrl;
        }

        String badgeId = switch (teamId.intValue()) {
            case 57 -> "t3";     // Arsenal
            case 58 -> "t7";     // Aston Villa
            case 1044 -> "t91";  // AFC Bournemouth
            case 402 -> "t94";   // Brentford
            case 397 -> "t36";   // Brighton & Hove Albion
            case 61 -> "t8";     // Chelsea
            case 354 -> "t31";   // Crystal Palace
            case 62 -> "t11";    // Everton
            case 63 -> "t54";    // Fulham
            case 349 -> "t40";   // Ipswich Town
            case 338 -> "t13";   // Leicester City
            case 64 -> "t14";    // Liverpool
            case 65 -> "t43";    // Manchester City
            case 66 -> "t1";     // Manchester United
            case 67 -> "t4";     // Newcastle United
            case 351 -> "t17";   // Nottingham Forest
            case 340 -> "t20";   // Southampton
            case 73 -> "t6";     // Tottenham Hotspur
            case 563 -> "t21";   // West Ham United
            case 76 -> "t39";    // Wolverhampton Wanderers
            case 71 -> "t56";    // Sunderland
            case 341 -> "t2";    // Leeds United
            case 322 -> "t88";   // Hull City
            case 1076 -> "t9";   // Coventry City
            default -> null;
        };

        if (badgeId != null) {
            return "https://resources.premierleague.com/premierleague/badges/50/" + badgeId + ".png";
        }
        return defaultUrl;
    }
}
