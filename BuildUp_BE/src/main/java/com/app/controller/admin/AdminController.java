package com.app.controller.admin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.common.ApiResponse;
import com.app.common.CommonCode;
import com.app.common.ResultCode;
import com.app.dao.user.UserDAO;
import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.team.PlayerStats;
import com.app.dto.user.Users;
import com.app.service.admin.AdminService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private static final Logger log = LoggerFactory.getLogger(AdminController.class);

	@Autowired
	private AdminService adminService;

	@Autowired
	private UserDAO userDAO;

	// 관리자 권한 확인 (세션의 loginUser 또는 LoginManager 또는 Authorization Bearer JWT 토큰)
	private boolean isAdmin(HttpServletRequest request) {
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

	// 1. 대시보드 KPI 요약 지표 조회
	@GetMapping("/summary")
	public ApiResponse<Map<String, Object>> getSummary(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getAdminSummary());
	}

	// 2. 경기 목록 조회
	@GetMapping("/matches")
	public ApiResponse<List<Matches>> getMatches(
			@RequestParam(value = "date", required = false) String date,
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "sort", required = false) String sort,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getAdminMatches(date, status, sort));
	}

	// 3. 경기 공지사항(NOTICE) 수정
	@PutMapping("/matches/{matchId}/notice")
	public ApiResponse<Void> updateMatchNotice(
			@PathVariable("matchId") Long matchId,
			@RequestBody Map<String, String> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		String notice = body != null ? body.get("notice") : null;
		boolean success = adminService.updateMatchNotice(matchId, notice);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 4. 경기 스코어 및 진행상태 긴급 수정
	@PutMapping("/matches/{matchId}/score")
	public ApiResponse<Void> updateMatchScore(
			@PathVariable("matchId") Long matchId,
			@RequestBody Map<String, Object> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		if (body == null) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		Long homeScore = body.get("homeScore") != null ? Long.valueOf(body.get("homeScore").toString()) : null;
		Long awayScore = body.get("awayScore") != null ? Long.valueOf(body.get("awayScore").toString()) : null;
		String status = (String) body.get("status");

		boolean success = adminService.updateMatchScore(matchId, homeScore, awayScore, status);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 5. 구단별 선수 및 부상/징계 현황 목록 조회
	@GetMapping("/teams/{teamId}/players")
	public ApiResponse<List<PlayerStats>> getTeamPlayers(
			@PathVariable("teamId") Long teamId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getTeamPlayers(teamId));
	}

	// 6. 선수 부상 및 결장 사유 수정
	@PutMapping("/players/{playerId}/injury")
	public ApiResponse<Void> updatePlayerInjury(
			@PathVariable("playerId") Long playerId,
			@RequestBody Map<String, String> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		if (body == null) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		String isInjured = body.getOrDefault("isInjured", "N");
		String injuryNote = body.get("injuryNote");
		String isSuspended = body.getOrDefault("isSuspended", "N");

		boolean success = adminService.updatePlayerInjury(playerId, isInjured, injuryNote, isSuspended);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 7. 전체 부상/결장 선수 요약 목록 조회
	@GetMapping("/players/injured-summary")
	public ApiResponse<List<PlayerStats>> getInjuredPlayersSummary(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getInjuredPlayersSummary());
	}

	// 8. 커뮤니티 게시글 목록 조회 (블라인드/삭제/검색 필터)
	@GetMapping("/community/posts")
	public ApiResponse<List<Posts>> getAdminPosts(
			@RequestParam(value = "isBlind", required = false) String isBlind,
			@RequestParam(value = "isDeleted", required = false) String isDeleted,
			@RequestParam(value = "keyword", required = false) String keyword,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getAdminPosts(isBlind, isDeleted, keyword));
	}

	// 9. 게시글 블라인드 상태 수정 (Y/N 토글)
	@PutMapping("/community/posts/{postId}/blind")
	public ApiResponse<Void> togglePostBlind(
			@PathVariable("postId") Long postId,
			@RequestBody Map<String, String> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		String isBlind = (body != null) ? body.getOrDefault("isBlind", "N") : "N";
		boolean success = adminService.togglePostBlind(postId, isBlind);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 10. 커뮤니티 댓글 목록 조회 (블라인드/삭제/검색 필터)
	@GetMapping("/community/comments")
	public ApiResponse<List<Comments>> getAdminComments(
			@RequestParam(value = "isBlind", required = false) String isBlind,
			@RequestParam(value = "isDeleted", required = false) String isDeleted,
			@RequestParam(value = "keyword", required = false) String keyword,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getAdminComments(isBlind, isDeleted, keyword));
	}

	// 11. 댓글 블라인드 상태 수정 (Y/N 토글)
	@PutMapping("/community/comments/{commentId}/blind")
	public ApiResponse<Void> toggleCommentBlind(
			@PathVariable("commentId") Long commentId,
			@RequestBody Map<String, String> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		String isBlind = (body != null) ? body.getOrDefault("isBlind", "N") : "N";
		boolean success = adminService.toggleCommentBlind(commentId, isBlind);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 12. 회원 목록 조회
	@GetMapping("/users")
	public ApiResponse<List<Users>> getAdminUsers(
			@RequestParam(value = "keyword", required = false) String keyword,
			@RequestParam(value = "roleCode", required = false) Long roleCode,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getAdminUsers(keyword, roleCode));
	}

	// 13. 회원 권한 등급 변경
	@PutMapping("/users/{userId}/role")
	public ApiResponse<Void> updateUserRole(
			@PathVariable("userId") Long userId,
			@RequestBody Map<String, Object> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		if (body == null || body.get("roleCode") == null) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		Long roleCode = Long.valueOf(body.get("roleCode").toString());
		boolean success = adminService.updateUserRole(userId, roleCode);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 14. 회원 포인트 직권 지급/차감
	@PostMapping("/users/{userId}/points")
	public ApiResponse<Void> adjustUserPoints(
			@PathVariable("userId") Long userId,
			@RequestBody Map<String, Object> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		if (body == null || body.get("amount") == null) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		Long amount = Long.valueOf(body.get("amount").toString());
		String description = (String) body.get("description");

		boolean success = adminService.adjustUserPoints(userId, amount, description);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 15. 최근 포인트 변동 이력 조회
	@GetMapping("/points/recent")
	public ApiResponse<List<PointHistory>> getRecentPointHistories(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getRecentPointHistories());
	}

	// 16. 외부 축구 경기 일정/스코어 수동 동기화 트리거
	@PostMapping("/sync/matches")
	public ApiResponse<Map<String, Object>> syncMatches(
			@RequestParam(value = "date", required = false) String date,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = adminService.syncMatchesByDate(date);
			Map<String, Object> data = new HashMap<>();
			data.put("syncedMatches", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 경기 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "경기 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 17. 경기 타임라인 상세 이벤트 수동 동기화 트리거
	@PostMapping("/sync/events")
	public ApiResponse<Map<String, Object>> syncEvents(
			@RequestParam(value = "date", required = false) String date,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = adminService.syncMatchEventsByDate(date);
			Map<String, Object> data = new HashMap<>();
			data.put("syncedEvents", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 이벤트 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "이벤트 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 18. 프리미어리그 순위표 수동 동기화
	@PostMapping("/sync/standings")
	public ApiResponse<Map<String, Object>> syncStandings(
			@RequestParam(value = "season", required = false) Integer season,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = adminService.syncStandings(season);
			Map<String, Object> data = new HashMap<>();
			data.put("syncedStandings", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 순위표 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "순위표 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 19. 득점 순위 수동 동기화
	@PostMapping("/sync/scorers")
	public ApiResponse<Map<String, Object>> syncScorers(
			@RequestParam(value = "limit", required = false, defaultValue = "50") Integer limit,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = adminService.syncScorers(limit);
			Map<String, Object> data = new HashMap<>();
			data.put("syncedScorers", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 득점순위 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "득점순위 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 20. 특정 시즌 전체 380경기 일괄 동기화
	@PostMapping("/sync/season-matches")
	public ApiResponse<Map<String, Object>> syncSeasonMatches(
			@RequestParam(value = "season", required = false) Integer season,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = adminService.syncSeasonMatches(season);
			Map<String, Object> data = new HashMap<>();
			data.put("syncedMatches", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 시즌 경기 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "시즌 경기 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 21. 전체 20개 구단 및 선수단 일괄 동기화
	@PostMapping("/sync/teams-and-players")
	public ApiResponse<Map<String, Object>> syncTeamsAndPlayers(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = adminService.syncTeamsAndPlayers();
			Map<String, Object> data = new HashMap<>();
			data.put("syncedPlayers", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 구단 및 선수단 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "구단/선수단 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 22. 스코어-이벤트 불일치 경기 정밀 재동기화 (1차 룰 + 2차 Gemini AI 교차 검증)
	@PostMapping("/sync/mismatched-events")
	public ApiResponse<Map<String, Object>> resyncMismatchedEvents(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = adminService.resyncMismatchedEvents();
			Map<String, Object> data = new HashMap<>();
			data.put("resyncedMatches", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 불일치 경기 재동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "불일치 경기 재동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}
}

