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
import java.util.List;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

@Service
public class FootballApiServiceImpl implements FootballApiService {

    @Value("${football.api.key}")
    private String apiKey;

    private final TeamDAO teamDAO;
    private final MatchDAO matchDAO;
    private final ObjectMapper objectMapper;

    @Autowired
    public FootballApiServiceImpl(TeamDAO teamDAO, MatchDAO matchDAO) {
        this.teamDAO = teamDAO;
        this.matchDAO = matchDAO;
        this.objectMapper = new ObjectMapper();
    }

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
                    .header("X-Auth-Token", apiKey)
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            return response.body();
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    public String fetchPremierLeagueFixtures() {
        String url = "https://api.football-data.org/v4/competitions/PL/matches";
        return sendGetRequest(url);
    }

    @Override
    public String fetchTeamData(Long teamId) {
        String url = "https://api.football-data.org/v4/teams/" + teamId;
        return sendGetRequest(url);
    }

    @Override
    public String fetchAllTeamsData() {
        String url = "https://api.football-data.org/v4/competitions/PL/teams";
        return sendGetRequest(url);
    }

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

    @Override
    @Transactional
    public int syncMatchesByDate(LocalDate date) {
        LocalDate targetDate = (date != null) ? date : LocalDate.now(ZoneId.of("Asia/Seoul"));
        String dateStr = targetDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        String url = "https://api.football-data.org/v4/competitions/PL/matches?dateFrom=" + dateStr + "&dateTo=" + dateStr;

        String jsonResult = sendGetRequest(url);
        if (jsonResult == null || jsonResult.isBlank()) {
            throw new RuntimeException(dateStr + " 일자 경기 일정을 가져오는데 실패했습니다.");
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
            throw new RuntimeException("일자별 경기 데이터 동기화 중 오류 발생: " + e.getMessage(), e);
        }
    }

    @Override
    public int fillBackNumbersAsync(Long teamId) {
        // 1. BACK_NUMBER가 NULL인 대상 선수들 조회
        List<Players> targetPlayers = teamDAO.findPlayersWithNullBackNumber(teamId);
        int totalTargets = targetPlayers.size();
        if (totalTargets == 0) {
            System.out.println("등번호가 누락된 선수가 없습니다.");
            return 0;
        }

        System.out.println("========== [등번호 비동기 수집 작업 예약] ==========");
        System.out.println("수집 대상 선수 수: " + totalTargets + "명 (Rate limit 준수를 위해 6.5초 간격으로 순차 처리)");
        System.out.println("예상 소요 시간: 약 " + (int) Math.ceil(totalTargets * 6.5 / 60.0) + "분");
        System.out.println("==================================================");

        // 2. 백그라운드 쓰레드에서 비동기 순차 처리 (호출 즉시 클라이언트에 리턴)
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            int current = 0;
            int updatedCount = 0;

            for (Players p : targetPlayers) {
                current++;
                try {
                    String url = "https://api.football-data.org/v4/persons/" + p.getPlayerId();
                    String json = sendGetRequest(url);

                    Long shirtNumber = 0L; // API에서도 없으면 0(미배정)으로 설정하여 다음번 무한 재조회 방지
                    if (json != null && !json.isBlank()) {
                        JsonNode personNode = objectMapper.readTree(json);
                        if (personNode.hasNonNull("shirtNumber")) {
                            shirtNumber = personNode.get("shirtNumber").asLong();
                        }
                    }

                    teamDAO.updatePlayerBackNumber(p.getPlayerId(), shirtNumber);
                    updatedCount++;

                    String numberDisplay = (shirtNumber > 0) ? "#" + shirtNumber : "미배정(0)";
                    System.out.println(String.format(" - [등번호 수집 (%d/%d)] [%s] %s -> %s (대기 6.5초...)",
                            current, totalTargets, p.getMainPosition(), p.getName(), numberDisplay));

                    // 분당 10회 한도 준수를 위한 6.5초 대기
                    if (current < totalTargets) {
                        Thread.sleep(6500);
                    }
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    System.out.println("등번호 수집 작업이 인터럽트되었습니다.");
                    break;
                } catch (Exception e) {
                    System.err.println("선수 (" + p.getName() + ") 등번호 수집 중 오류: " + e.getMessage());
                }
            }

            System.out.println("========== [등번호 비동기 수집 완료] ==========");
            System.out.println("총 " + updatedCount + "명의 등번호가 DB에 성공적으로 업데이트되었습니다.");
            System.out.println("==============================================");
        });

        return totalTargets;
    }

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

        Long homeScore = matchNode.path("score").path("fullTime").hasNonNull("home")
                ? matchNode.path("score").path("fullTime").get("home").asLong() : null;
        Long awayScore = matchNode.path("score").path("fullTime").hasNonNull("away")
                ? matchNode.path("score").path("fullTime").get("away").asLong() : null;

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
        return true;
    }

    private void ensureTeamExists(JsonNode teamNode) {
        if (teamNode != null && teamNode.hasNonNull("id")) {
            Long teamId = teamNode.get("id").asLong();
            String name = teamNode.path("name").asText("구단 " + teamId);
            String crest = teamNode.hasNonNull("crest") ? teamNode.get("crest").asText() : null;

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

    private List<Players> parseAndSaveTeamWithSquad(JsonNode teamNode) {
        if (teamNode == null || !teamNode.hasNonNull("id")) {
            return List.of();
        }

        Long teamId = teamNode.get("id").asLong();
        String teamName = teamNode.path("name").asText();
        String emblemUrl = teamNode.hasNonNull("crest") ? teamNode.get("crest").asText() : null;
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

        // 2. 코칭 스태프(감독) 정보 저장 (API coach 객체 파싱)
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
                Long backNumber = playerNode.hasNonNull("shirtNumber") ? playerNode.get("shirtNumber").asLong() : null;

                Players player = new Players();
                player.setPlayerId(playerId);
                player.setName(name);
                player.setMainPosition(convertPosition(positionRaw));
                player.setNationality(nationality);
                player.setBackNumber(backNumber);
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

    private String convertPosition(String position) {
        if (position == null || position.isBlank()) {
            return "MF";
        }
        String p = position.trim().toLowerCase();
        if (p.contains("goal") || p.equals("gk")) return "GK";
        if (p.contains("def") || p.contains("back") || p.equals("df")) return "DF";
        if (p.contains("mid") || p.equals("mf")) return "MF";
        if (p.contains("off") || p.contains("forw") || p.contains("att") || p.contains("wing") || p.contains("striker") || p.equals("fw")) return "FW";

        String upper = position.trim().toUpperCase();
        if (upper.length() > 20) {
            return upper.substring(0, 20);
        }
        return upper;
    }

    private String convertMatchStatus(String status) {
        if (status == null || status.isBlank()) {
            return "SCHEDULED";
        }
        return switch (status.trim().toUpperCase()) {
            case "TIMED", "SCHEDULED" -> "SCHEDULED";
            case "IN_PLAY", "PAUSED", "LIVE" -> "LIVE";
            case "FINISHED", "AWARDED" -> "FINISHED";
            case "POSTPONED", "SUSPENDED" -> "SUSPENDED";
            case "CANCELLED" -> "CANCELLED";
            default -> "SCHEDULED";
        };
    }

    @Override
    @Transactional
    public int initPremierLeagueStaffs() {
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
            createStaff(1044L, "Marco Rose", "Germany", 1L),
            createStaff(1076L, "Frank Lampard", "England", 1L)
        );

        for (Staffs s : defaultManagers) {
            teamDAO.mergeStaff(s);
        }
        return defaultManagers.size();
    }

    private Staffs createStaff(Long teamId, String name, String nationality, Long staffRoleId) {
        Staffs s = new Staffs();
        s.setTeamId(teamId);
        s.setName(name);
        s.setNationality(nationality);
        s.setStaffRoleId(staffRoleId);
        return s;
    }

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
            if (season == null && rootNode.hasNonNull("filters") && rootNode.path("filters").hasNonNull("season")) {
                try {
                    targetSeason = Integer.parseInt(rootNode.path("filters").get("season").asText());
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

            System.out.println(String.format(" - [%d 시즌 순위표 동기화 완료] 총 %d개 구단 성적 적재", targetSeason, count));
            return count;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("순위 데이터 파싱 및 저장 중 오류: " + e.getMessage(), e);
        }
    }

    @Override
    public int syncRecentThreeSeasonsStandings() {
        int[] seasons = {2024, 2025, 2026};
        int totalUpdated = 0;

        System.out.println("========== [최근 3개년(2024~2026) 리그 순위표 일괄 동기화 시작] ==========");
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
                System.err.println(season + " 시즌 동기화 중 오류: " + e.getMessage());
            }
        }
        System.out.println("========== [최근 3개년 순위표 동기화 완료: 총 " + totalUpdated + "건 적재] ==========");
        return totalUpdated;
    }

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

            System.out.println(String.format("========== [득점자 스탯 동기화 완료: 총 %d명 갱신] ==========", count));
            return count;
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("득점자 데이터 파싱 및 저장 중 오류: " + e.getMessage(), e);
        }
    }

    private void ensurePlayerExists(JsonNode playerNode, JsonNode teamNode) {
        if (playerNode != null && playerNode.hasNonNull("id")) {
            Long playerId = playerNode.get("id").asLong();
            String name = playerNode.path("name").asText("선수 " + playerId);
            String positionRaw = playerNode.hasNonNull("section")
                    ? playerNode.get("section").asText()
                    : (playerNode.hasNonNull("position") ? playerNode.get("position").asText() : null);
            String nationality = playerNode.hasNonNull("nationality") ? playerNode.get("nationality").asText() : null;
            Long backNumber = playerNode.hasNonNull("shirtNumber") ? playerNode.get("shirtNumber").asLong() : null;
            Long teamId = (teamNode != null && teamNode.hasNonNull("id")) ? teamNode.get("id").asLong() : null;

            if (teamId == null) {
                return;
            }

            Players player = new Players();
            player.setPlayerId(playerId);
            player.setName(name);
            player.setMainPosition(convertPosition(positionRaw));
            player.setNationality(nationality);
            player.setBackNumber(backNumber);
            player.setTeamId(teamId);

            teamDAO.mergePlayer(player);
        }
    }
}
