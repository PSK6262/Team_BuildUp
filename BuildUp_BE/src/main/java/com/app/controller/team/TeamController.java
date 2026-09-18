package com.app.controller.team;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Teams;
import com.app.service.api.FootballApiService;
import com.app.service.api.GeminiApiService;
import com.app.service.team.TeamService;

@RestController
@RequestMapping({"/api/teams", "/teams"})
public class TeamController {

	@Autowired
	private TeamService teamService;

	@Autowired
	private FootballApiService footballApiService;

	@Autowired
	private GeminiApiService geminiApiService;

	// [Gemini AI] 0. 전체 구단 역사 및 한글명 일괄 자동 적재 (비동기 백그라운드)
	// 예: GET 또는 POST /api/teams/sync-ai-korean
	@GetMapping("/sync-ai-korean")
	public Map<String, Object> syncAiKorean() {
		return geminiApiService.syncAllKoreanDataAsync();
	}

	// [Gemini AI] 0-1. 20개 구단 한글명, 홈구장, 역사 동기화만 단독 실행
	// 예: GET /api/teams/sync-ai-teams
	@GetMapping("/sync-ai-teams")
	public Map<String, Object> syncAiTeams() {
		int count = geminiApiService.syncTeamsKoreanAndHistory();
		return Map.of(
			"status", "SUCCESS",
			"message", "20개 구단 한글명 및 역사 생성이 완료되었습니다.",
			"updatedCount", count
		);
	}

	// [Gemini AI] 0-2. 코칭스태프(감독) 한글명 번역만 단독 실행
	// 예: GET /api/teams/sync-ai-staffs
	@GetMapping("/sync-ai-staffs")
	public Map<String, Object> syncAiStaffs() {
		int count = geminiApiService.syncStaffsKorean();
		return Map.of(
			"status", "SUCCESS",
			"message", "코칭스태프 한글명 번역이 완료되었습니다.",
			"updatedCount", count
		);
	}

	// [Gemini AI] 0-3. 전체 선수단 한글 번역만 단독 실행
	// 예: GET /api/teams/sync-ai-players
	@GetMapping("/sync-ai-players")
	public Map<String, Object> syncAiPlayers() {
		int count = geminiApiService.syncAllPlayersKorean();
		return Map.of(
			"status", "SUCCESS",
			"message", "전체 선수단 한글명 번역이 완료되었습니다.",
			"updatedCount", count
		);
	}

	// [응원가 자동화] 20개 구단 공식 유튜브 응원가 일괄 DB 적재
	// 예: GET /api/teams/sync-anthems
	@GetMapping("/sync-anthems")
	public Map<String, Object> syncAnthems() {
		int count = geminiApiService.syncAllTeamAnthems();
		return Map.of(
			"status", "SUCCESS",
			"updatedCount", count,
			"message", "20개 구단의 공식 유튜브 응원가(Anthem)가 DB에 성공적으로 저장되었습니다."
		);
	}

	// [Gemini AI] 0-4. 깨지거나 누락된 구단 엠블럼 AI 자동 탐색 및 복구
	// 예: GET /api/teams/sync-ai-emblems
	@GetMapping("/sync-ai-emblems")
	public Map<String, Object> syncAiEmblems() {
		int count = geminiApiService.syncBrokenTeamEmblemsWithAI();
		return Map.of(
			"status", "SUCCESS",
			"updatedCount", count,
			"message", "깨지거나 누락된 구단 엠블럼 AI 복구 및 저장이 완료되었습니다."
		);
	}

	// 1. 프리미어리그 전체 구단 및 소속 선수 전체 일괄 DB 저장 (동기화)
	// 예: GET /api/teams/sync-all
	@GetMapping("/sync-all")
	public Map<String, Object> syncAllTeams() {
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 프리미어리그 전체 구단 및 선수 일괄 동기화 시작");
		System.out.println("----------------------------------------------------------------------");
		int totalPlayers = footballApiService.syncAllPremierLeagueTeamsAndPlayers();
		System.out.println("  - 처리 결과: 총 " + totalPlayers + "명의 선수가 DB에 저장되었습니다.");
		System.out.println("======================================================================");

		return Map.of(
			"status", "SUCCESS",
			"message", "프리미어리그 20개 구단 및 전체 선수 데이터가 성공적으로 DB에 저장되었습니다.",
			"totalSavedPlayers", totalPlayers
		);
	}

	// 2. 특정 구단 선수 스쿼드 API 조회 후 DB 저장 (동기화)
	// 예: GET /api/teams/57/sync
	@GetMapping("/{teamId}/sync")
	public Map<String, Object> syncTeamSquad(@PathVariable("teamId") Long teamId) {
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 구단 선수 목록 동기화 시작 (TEAM_ID: " + teamId + ")");
		System.out.println("----------------------------------------------------------------------");
		List<Players> savedPlayers = footballApiService.syncTeamPlayers(teamId);
		
		System.out.println("  - 처리 결과: 총 " + savedPlayers.size() + "명의 선수가 DB에 저장되었습니다.");
		for (Players p : savedPlayers) {
			System.out.println("    ▶ [" + p.getMainPosition() + "] " + p.getName() + " (국적: " + p.getNationality() + ")");
		}
		System.out.println("======================================================================");

		return Map.of(
			"teamId", teamId,
			"status", "SUCCESS",
			"savedPlayerCount", savedPlayers.size(),
			"players", savedPlayers
		);
	}

	// 3. 전체 구단 목록 조회 (DB 데이터)
	// 예: GET /api/teams 또는 GET /api/teams/
	@GetMapping({"", "/"})
	public List<Teams> teams() {
		return teamService.getAllTeams();
	}

	// 3-1. 프리미어리그 20개 구단 공식 감독 일괄 적재
	// 예: GET /api/teams/init-staffs
	@GetMapping("/init-staffs")
	public Map<String, Object> initStaffs() {
		int count = footballApiService.initPremierLeagueStaffs();
		return Map.of(
			"status", count > 0 ? "SUCCESS" : "DORMANT",
			"message", count > 0 
				? "프리미어리그 구단 공식 최신 감독 데이터가 성공적으로 적재되었습니다."
				: "현재 무료 API 환경에서는 감독 데이터 제공이 지원되지 않아 자동 설정이 비활성화(Dormant) 상태입니다. (유료 API 연동 틀 유지 중)",
			"totalStaffs", count
		);
	}

	// 3-2. 특정 시즌 순위표 동기화 (기본값: 2026)
	// 예: GET /api/teams/sync-standings?season=2026
	@GetMapping("/sync-standings")
	public Map<String, Object> syncStandings(@RequestParam(value = "season", required = false) Integer season) {
		int count = footballApiService.syncPremierLeagueStandings(season);
		return Map.of(
			"status", "SUCCESS",
			"season", (season != null ? season : 2026),
			"savedTeams", count,
			"message", "프리미어리그 " + (season != null ? season : 2026) + " 시즌 순위표가 성공적으로 DB에 저장되었습니다."
		);
	}

	// 3-3. 최근 3개 시즌(2024, 2025, 2026) 순위표 일괄 동기화
	// 예: GET /api/teams/sync-recent-standings
	@GetMapping("/sync-recent-standings")
	public Map<String, Object> syncRecentStandings() {
		int count = footballApiService.syncRecentThreeSeasonsStandings();
		return Map.of(
			"status", "SUCCESS",
			"totalRecords", count,
			"message", "최근 3개 시즌(2024~2026) 리그 순위표가 성공적으로 DB에 저장되었습니다."
		);
	}

	// 3-4. 리그 순위표 조회 (기본값: 2026 시즌)
	// 예: GET /api/teams/standings?season=2026
	@GetMapping("/standings")
	public List<TeamStats> getStandings(@RequestParam(value = "season", required = false, defaultValue = "2026") Integer season) {
		return teamService.getTeamStandings(season);
	}

	// 3-5. 프리미어리그 득점자 스탯 일괄 동기화 (기본: 상위 100명)
	// 예: GET /api/teams/sync-scorers?limit=100
	@GetMapping("/sync-scorers")
	public Map<String, Object> syncScorers(@RequestParam(value = "limit", required = false, defaultValue = "100") Integer limit) {
		int count = footballApiService.syncPremierLeagueScorers(limit);
		return Map.of(
			"status", "SUCCESS",
			"updatedScorers", count,
			"message", "프리미어리그 득점자 " + count + "명의 기록이 성공적으로 DB에 동기화되었습니다."
		);
	}

	// 3-6. 프리미어리그 득점 랭킹 조회 (기본: 상위 20명)
	// 예: GET /api/teams/top-scorers?limit=20
	@GetMapping("/top-scorers")
	public List<PlayerStats> getTopScorers(@RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
		return teamService.getTopScorers(limit);
	}

	// 3-7. 특정 선수 개인 상세 스탯 조회
	// 예: GET /api/teams/players/{playerId}/stats
	@GetMapping("/players/{playerId}/stats")
	public PlayerStats getPlayerStats(@PathVariable("playerId") Long playerId) {
		return teamService.getPlayerStats(playerId);
	}

	// 4. 특정 구단 상세 조회
	// 예: GET /api/teams/{teamId}
	@GetMapping("/{teamId}")
	public Teams getTeam(@PathVariable("teamId") Long teamId) {
		return teamService.getTeamById(teamId);
	}

	// 5. 특정 구단 소속 선수 목록 조회 (DB 데이터)
	// 예: GET /api/teams/{teamId}/players
	@GetMapping("/{teamId}/players")
	public List<Players> getTeamPlayers(@PathVariable("teamId") Long teamId) {
		return teamService.getPlayersByTeamId(teamId);
	}

	// 5-1. 특정 구단 소속 스태프(감독 등) 목록 조회 (DB 데이터)
	// 예: GET /api/teams/{teamId}/staffs
	@GetMapping("/{teamId}/staffs")
	public List<Staffs> getTeamStaffs(@PathVariable("teamId") Long teamId) {
		return teamService.getStaffsByTeamId(teamId);
	}

	// 5-2. 특정 구단 시즌 통계/성적 조회 (시즌 미지정 시 최신 시즌)
	// 예: GET /api/teams/{teamId}/stats?season=2026
	@GetMapping("/{teamId}/stats")
	public TeamStats getTeamStats(
			@PathVariable("teamId") Long teamId,
			@RequestParam(value = "season", required = false) Integer season) {
		return teamService.getTeamStats(teamId, season);
	}

	// 5-3. 특정 구단 최근 3개년 성적 추이 전체 조회 (2024, 2025, 2026 등)
	// 예: GET /api/teams/{teamId}/stats/history
	@GetMapping("/{teamId}/stats/history")
	public List<TeamStats> getTeamStatsHistory(@PathVariable("teamId") Long teamId) {
		return teamService.getTeamStatsHistory(teamId);
	}
}
