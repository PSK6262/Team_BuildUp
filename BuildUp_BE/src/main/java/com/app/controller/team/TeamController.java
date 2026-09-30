package com.app.controller.team;

import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.common.CommonCode;
import com.app.dao.user.UserDAO;
import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Teams;
import com.app.dto.user.Users;
import com.app.service.api.FootballApiService;
import com.app.service.api.GeminiApiService;
import com.app.service.team.TeamService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

@RestController
@RequestMapping({"/api/teams", "/teams"})
public class TeamController {

	@Autowired
	private TeamService teamService;

	@Autowired
	private FootballApiService footballApiService;

	@Autowired
	private GeminiApiService geminiApiService;

	@Autowired
	private UserDAO userDAO;

	/**
	 * [관리자 권한 검증 메서드]
	 * 1. 세션의 loginUser 객체 확인
	 * 2. 세션 loginUserId 확인 후 DB 조회
	 * 3. Authorization Bearer JWT 토큰 검증 후 DB 조회
	 * 데이터 동기화와 같은 중요한 상태 변경 API는 반드시 관리자(ROLE_ADMIN) 권한을 요구합니다.
	 */
	private boolean isAdmin(HttpServletRequest request) {
		if (request == null) {
			return false;
		}

		// 1. 세션의 loginUser 객체 확인
		HttpSession session = request.getSession(false);
		if (session != null) {
			Users sessionUser = (Users) session.getAttribute(CommonCode.SESSION_LOGIN_USER);
			if (sessionUser != null && CommonCode.ROLE_ADMIN.equals(sessionUser.getRoleCode())) {
				return true;
			}
		}

		// 2. 세션 loginUserId 확인
		String sessionLoginId = LoginManager.getLoginUserId(request);
		if (sessionLoginId != null && userDAO != null) {
			Users user = userDAO.selectUserByLoginId(sessionLoginId);
			if (user != null && CommonCode.ROLE_ADMIN.equals(user.getRoleCode())) {
				return true;
			}
		}

		// 3. Authorization Bearer JWT 토큰 확인
		String token = JwtProvider.extractToken(request);
		if (token != null && JwtProvider.isValidToken(token)) {
			String tokenLoginId = JwtProvider.getLoginIdFromToken(token);
			if (tokenLoginId != null && userDAO != null) {
				Users user = userDAO.selectUserByLoginId(tokenLoginId);
				if (user != null && CommonCode.ROLE_ADMIN.equals(user.getRoleCode())) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * 비관리자 접근 시 403 Forbidden 응답을 생성하는 공통 메서드
	 */
	private ResponseEntity<Map<String, Object>> forbiddenResponse() {
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
			"status", "FAIL",
			"code", "FORBIDDEN",
			"message", "데이터 동기화 작업은 관리자(ADMIN) 권한이 필요합니다."
		));
	}

	// [Gemini AI] 0. 전체 구단 역사 및 한글명 일괄 자동 적재 (비동기 백그라운드)
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-ai-korean")
	public ResponseEntity<Map<String, Object>> syncAiKorean(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		return ResponseEntity.ok(geminiApiService.syncAllKoreanDataAsync());
	}

	// [Gemini AI] 0-1. 20개 구단 한글명, 홈구장, 역사 동기화만 단독 실행
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-ai-teams")
	public ResponseEntity<Map<String, Object>> syncAiTeams(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = geminiApiService.syncTeamsKoreanAndHistory();
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"message", "20개 구단 한글명 및 역사 생성이 완료되었습니다.",
			"updatedCount", count
		));
	}

	// [Gemini AI] 0-2. 코칭스태프(감독) 한글명 번역만 단독 실행
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-ai-staffs")
	public ResponseEntity<Map<String, Object>> syncAiStaffs(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = geminiApiService.syncStaffsKorean();
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"message", "코칭스태프 한글명 번역이 완료되었습니다.",
			"updatedCount", count
		));
	}

	// [Gemini AI] 0-3. 전체 선수단 한글 번역만 단독 실행
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-ai-players")
	public ResponseEntity<Map<String, Object>> syncAiPlayers(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = geminiApiService.syncAllPlayersKorean();
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"message", "전체 선수단 한글명 번역이 완료되었습니다.",
			"updatedCount", count
		));
	}

	// [응원가 자동화] 20개 구단 공식 유튜브 응원가 일괄 DB 적재
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-anthems")
	public ResponseEntity<Map<String, Object>> syncAnthems(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = geminiApiService.syncAllTeamAnthems();
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"updatedCount", count,
			"message", "20개 구단의 공식 유튜브 응원가(Anthem)가 DB에 성공적으로 저장되었습니다."
		));
	}

	// [Gemini AI] 0-4. 깨지거나 누락된 구단 엠블럼 AI 자동 탐색 및 복구
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-ai-emblems")
	public ResponseEntity<Map<String, Object>> syncAiEmblems(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = geminiApiService.syncBrokenTeamEmblemsWithAI();
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"updatedCount", count,
			"message", "깨지거나 누락된 구단 엠블럼 AI 복구 및 저장이 완료되었습니다."
		));
	}

	// [Gemini AI] 0-5. 20개 구단 전체 선수 세부 포지션(CB, LB, RB, CDM, CAM, ST 등) AI 정밀 판별 및 DB 적재
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-ai-detail-positions")
	public ResponseEntity<Map<String, Object>> syncAiDetailPositions(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = geminiApiService.syncAllPlayersDetailPositions();
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"message", "20개 구단 전체 선수의 세부 포지션(CB, LB, RB, CDM, CAM, ST 등) 정밀 동기화가 완료되었습니다.",
			"updatedCount", count
		));
	}

	// [Gemini AI] 0-6. 특정 구단 소속 선수 세부 포지션 AI 단독 적재
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/{teamId}/sync-ai-detail-positions")
	public ResponseEntity<Map<String, Object>> syncAiDetailPositionsByTeam(
			@PathVariable("teamId") Long teamId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = geminiApiService.syncPlayersDetailPositionsByTeamId(teamId);
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"teamId", teamId,
			"message", "구단(ID: " + teamId + ") 소속 선수의 세부 포지션 정밀 동기화가 완료되었습니다.",
			"updatedCount", count
		));
	}

	// 1. 프리미어리그 전체 구단 및 소속 선수 전체 일괄 DB 저장 (동기화)
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-all")
	public ResponseEntity<Map<String, Object>> syncAllTeams(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 프리미어리그 전체 구단 및 선수 일괄 동기화 시작");
		System.out.println("----------------------------------------------------------------------");
		int totalPlayers = footballApiService.syncAllPremierLeagueTeamsAndPlayers();
		System.out.println("  - 처리 결과: 총 " + totalPlayers + "명의 선수가 DB에 저장되었습니다.");
		System.out.println("======================================================================");

		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"message", "프리미어리그 20개 구단 및 전체 선수 데이터가 성공적으로 DB에 저장되었습니다.",
			"totalSavedPlayers", totalPlayers
		));
	}

	// 2. 특정 구단 선수 스쿼드 API 조회 후 DB 저장 (동기화)
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/{teamId}/sync")
	public ResponseEntity<Map<String, Object>> syncTeamSquad(
			@PathVariable("teamId") Long teamId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 구단 선수 목록 동기화 시작 (TEAM_ID: " + teamId + ")");
		System.out.println("----------------------------------------------------------------------");
		List<Players> savedPlayers = footballApiService.syncTeamPlayers(teamId);
		
		System.out.println("  - 처리 결과: 총 " + savedPlayers.size() + "명의 선수가 DB에 저장되었습니다.");
		for (Players p : savedPlayers) {
			System.out.println("    ▶ [" + p.getMainPosition() + "] " + p.getName() + " (국적: " + p.getNationality() + ")");
		}
		System.out.println("======================================================================");

		return ResponseEntity.ok(Map.of(
			"teamId", teamId,
			"status", "SUCCESS",
			"savedPlayerCount", savedPlayers.size(),
			"players", savedPlayers
		));
	}

	// 3. 전체 구단 목록 조회 (DB 데이터)
	// 예: GET /api/teams 또는 GET /api/teams/
	@GetMapping({"", "/"})
	public List<Teams> teams() {
		return teamService.getAllTeams();
	}

	// 3-1. 프리미어리그 20개 구단 공식 감독 일괄 적재
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/init-staffs")
	public ResponseEntity<Map<String, Object>> initStaffs(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = footballApiService.initPremierLeagueStaffs();
		return ResponseEntity.ok(Map.of(
			"status", count > 0 ? "SUCCESS" : "DORMANT",
			"message", count > 0 
				? "프리미어리그 구단 공식 최신 감독 데이터가 성공적으로 적재되었습니다."
				: "현재 무료 API 환경에서는 감독 데이터 제공이 지원되지 않아 자동 설정이 비활성화(Dormant) 상태입니다. (유료 API 연동 틀 유지 중)",
			"totalStaffs", count
		));
	}

	// 3-2. 특정 시즌 순위표 동기화 (기본값: 2026)
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-standings")
	public ResponseEntity<Map<String, Object>> syncStandings(
			@RequestParam(value = "season", required = false) Integer season,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = footballApiService.syncPremierLeagueStandings(season);
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"season", (season != null ? season : 2026),
			"savedTeams", count,
			"message", "프리미어리그 " + (season != null ? season : 2026) + " 시즌 순위표가 성공적으로 DB에 저장되었습니다."
		));
	}

	// 3-3. 최근 3개 시즌(2024, 2025, 2026) 순위표 일괄 동기화
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-recent-standings")
	public ResponseEntity<Map<String, Object>> syncRecentStandings(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = footballApiService.syncRecentThreeSeasonsStandings();
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"totalRecords", count,
			"message", "최근 3개 시즌(2024~2026) 리그 순위표가 성공적으로 DB에 저장되었습니다."
		));
	}

	// 3-4. 리그 순위표 조회 (기본값: 2026 시즌)
	// 예: GET /api/teams/standings?season=2026
	@GetMapping("/standings")
	public List<TeamStats> getStandings(@RequestParam(value = "season", required = false, defaultValue = "2026") Integer season) {
		return teamService.getTeamStandings(season);
	}

	// 3-5. 프리미어리그 득점자 스탯 일괄 동기화 (기본: 상위 100명)
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-scorers")
	public ResponseEntity<Map<String, Object>> syncScorers(
			@RequestParam(value = "limit", required = false, defaultValue = "100") Integer limit,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = footballApiService.syncPremierLeagueScorers(limit);
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"updatedScorers", count,
			"message", "프리미어리그 득점자 " + count + "명의 기록이 성공적으로 DB에 동기화되었습니다."
		));
	}

	// 3-5-1. 프리미어리그 구단 및 골키퍼 클린시트(무실점) 통계 일괄 동기화
	@PostMapping("/sync-clean-sheets")
	public ResponseEntity<Map<String, Object>> syncCleanSheets(
			@RequestParam(value = "season", required = false, defaultValue = "2026") Integer season,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int count = footballApiService.syncPremierLeagueCleanSheets(season);
		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"season", season,
			"updatedCount", count,
			"message", "프리미어리그 구단 및 골키퍼 클린시트 기록(" + count + "건)이 성공적으로 DB에 동기화되었습니다."
		));
	}

	// 3-6. 프리미어리그 득점 랭킹 조회 (기본: 상위 20명)
	// 예: GET /api/teams/top-scorers?limit=20
	@GetMapping("/top-scorers")
	public List<PlayerStats> getTopScorers(@RequestParam(value = "limit", required = false, defaultValue = "20") Integer limit) {
		return teamService.getTopScorers(limit);
	}

	@GetMapping("/player-rankings")
	public List<PlayerStats> getPlayerRankings(
			@RequestParam(value = "metric", defaultValue = "goals") String metric) {
		if (!java.util.Set.of("goals", "assists", "contributions", "cleanSheets").contains(metric)) {
			throw new org.springframework.web.server.ResponseStatusException(
					org.springframework.http.HttpStatus.BAD_REQUEST, "지원하지 않는 순위 기준입니다.");
		}
		return teamService.getPlayerRankings(metric);
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
