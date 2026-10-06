package com.app.controller.admin;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import com.app.common.ExternalApiException;
import com.app.common.ResultCode;
import com.app.dao.user.UserDAO;
import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.match.MatchEvents;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.team.PlayerStats;
import com.app.dto.user.Users;
import com.app.service.admin.AdminService;
import com.app.service.api.GeminiApiService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;
import com.app.util.UserActivityLogger;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

	private static final Logger log = LoggerFactory.getLogger(AdminController.class);

	@Autowired
	private AdminService adminService;

	@Autowired
	private GeminiApiService geminiApiService;

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

	// 현재 접속 중인 관리자 사용자 엔티티 조회 헬퍼
	private Users getLoginAdmin(HttpServletRequest request) {
		HttpSession session = request.getSession(false);
		if (session != null) {
			Users sessionUser = (Users) session.getAttribute(CommonCode.SESSION_LOGIN_USER);
			if (sessionUser != null && CommonCode.ROLE_ADMIN.equals(sessionUser.getRoleCode())) {
				return sessionUser;
			}
		}
		String sessionLoginId = LoginManager.getLoginUserId(request);
		if (sessionLoginId != null && userDAO != null) {
			Users user = userDAO.selectUserByLoginId(sessionLoginId);
			if (user != null && CommonCode.ROLE_ADMIN.equals(user.getRoleCode())) {
				return user;
			}
		}
		String token = JwtProvider.extractToken(request);
		if (token != null && JwtProvider.isValidToken(token)) {
			String tokenLoginId = JwtProvider.getLoginIdFromToken(token);
			if (tokenLoginId != null && userDAO != null) {
				Users user = userDAO.selectUserByLoginId(tokenLoginId);
				if (user != null && CommonCode.ROLE_ADMIN.equals(user.getRoleCode())) {
					return user;
				}
			}
		}
		return null;
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
			@RequestParam(value = "startDate", required = false) String startDate,
			@RequestParam(value = "endDate", required = false) String endDate,
			@RequestParam(value = "status", required = false) String status,
			@RequestParam(value = "sort", required = false) String sort,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getAdminMatches(date, startDate, endDate, status, sort));
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

		try {
			boolean success = adminService.updateMatchScore(matchId, homeScore, awayScore, status);
			return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
		} catch (IllegalStateException | IllegalArgumentException e) {
			return ApiResponse.error(ResultCode.FAIL, e.getMessage());
		}
	}

	// 4-1. 경기 타임라인 이벤트 목록 조회
	@GetMapping("/matches/{matchId}/events")
	public ApiResponse<List<MatchEvents>> getMatchEvents(
			@PathVariable("matchId") Long matchId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getMatchEvents(matchId));
	}

	// 4-2. 단건 경기 이벤트 수동 삭제 (취소골/오적재 이벤트 제거)
	@DeleteMapping("/matches/events/{eventId}")
	public ApiResponse<Void> deleteMatchEvent(
			@PathVariable("eventId") Long eventId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		boolean success = adminService.deleteMatchEvent(eventId);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 4-3. 단건 경기 이벤트 수동 등록 (누락된 골/카드 직접 기입)
	@PostMapping("/matches/{matchId}/events")
	public ApiResponse<Void> addMatchEvent(
			@PathVariable("matchId") Long matchId,
			@RequestBody MatchEvents event,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		if (event == null || event.getTeamId() == null || event.getEventTime() == null || event.getEventType() == null || event.getPlayerId() == null) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		event.setMatchId(matchId);
		boolean success = adminService.addMatchEvent(event);
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 4-4. 단건 경기 결과(Result) 및 이벤트 원본 외부 API에서 다시 불러오기 (AI 자동삭제 없음)
	@PostMapping("/matches/{matchId}/resync")
	public ApiResponse<Map<String, Object>> resyncSingleMatch(
			@PathVariable("matchId") Long matchId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			Map<String, Object> data = adminService.resyncSingleMatch(matchId);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 경기 matchId={} 재동기화 실패: {}", matchId, e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "경기 재동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 4-5. 불일치 경기 AI 분석 조언 조회 (Read-only, DB 변경 없음)
	@GetMapping("/matches/{matchId}/ai-advice")
	public ApiResponse<Map<String, Object>> getAiMismatchAdvice(
			@PathVariable("matchId") Long matchId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			Map<String, Object> data = adminService.getAiMismatchAdvice(matchId);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] matchId={} AI 분석 의견 조회 실패: {}", matchId, e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "AI 분석 중 오류가 발생했습니다: " + e.getMessage());
		}
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

	// 10. 관리자가 작성자와 관계없이 게시글을 삭제 처리
	@DeleteMapping("/community/posts/{postId}")
	public ApiResponse<Void> deletePost(
			@PathVariable("postId") Long postId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		boolean success = adminService.deletePost(postId);
		if (success) UserActivityLogger.log(request, "관리자 게시글 삭제(postId=" + postId + ")", "admin");
		return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
	}

	// 11. 커뮤니티 댓글 목록 조회 (블라인드/삭제/검색 필터)
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

	// 12. 댓글 블라인드 상태 수정 (Y/N 토글)
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

	// 12-1. AI 유해 게시글 / 욕설 문맥 자동 모더레이션 즉시 일괄 검사 실행
	@PostMapping("/community/ai-moderation")
	public ApiResponse<Map<String, Object>> runAiModerationBatch(
			@RequestBody(required = false) Map<String, Object> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		int limit = 30;
		if (body != null && body.containsKey("limit")) {
			try {
				limit = Integer.parseInt(body.get("limit").toString());
			} catch (Exception e) {}
		}
		Map<String, Object> result = geminiApiService.inspectAndBlindHarmfulCommunityBatch(limit);
		return ApiResponse.success(result);
	}

	// 13. 회원 목록 조회
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

	// 14. 회원 권한 등급 변경
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

	// 15. 회원 포인트 직권 지급/차감
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
		if (Math.abs(amount) > 10000) {
			return ApiResponse.error(ResultCode.INVALID_INPUT, "한 번에 변경할 수 있는 포인트는 최대 ±10,000P 입니다.");
		}
		String description = (String) body.get("description");
		Users loginAdmin = getLoginAdmin(request);
		String adminPrefix = (loginAdmin != null && loginAdmin.getNickname() != null)
				? "[관리자: " + loginAdmin.getNickname() + "] "
				: "[관리자 직권] ";
		String finalDescription = adminPrefix + (description != null && !description.trim().isEmpty() ? description.trim() : "포인트 직권 조정");

		try {
			boolean success = adminService.adjustUserPoints(userId, amount, finalDescription);
			if (success) UserActivityLogger.log(request, "관리자 포인트 직권 조정(userId=" + userId + ")", "admin");
			return success ? ApiResponse.success() : ApiResponse.error(ResultCode.FAIL);
		} catch (IllegalStateException | IllegalArgumentException e) {
			return ApiResponse.error(ResultCode.FAIL, e.getMessage());
		}
	}

	// 16. 최근 포인트 변동 이력 조회
	@GetMapping("/points/recent")
	public ApiResponse<List<PointHistory>> getRecentPointHistories(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		return ApiResponse.success(adminService.getRecentPointHistories());
	}

	// 17. 외부 축구 경기 일정/스코어 수동 동기화 트리거 (단일 일자 또는 기간 From ~ To 지원)
	@PostMapping("/sync/matches")
	public ApiResponse<Map<String, Object>> syncMatches(
			@RequestParam(value = "date", required = false) String date,
			@RequestParam(value = "startDate", required = false) String startDate,
			@RequestParam(value = "endDate", required = false) String endDate,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			String from = (startDate != null && !startDate.trim().isEmpty()) ? startDate.trim() : date;
			String to = (endDate != null && !endDate.trim().isEmpty()) ? endDate.trim() : from;
			int count = adminService.syncMatchesByDateRange(from, to);
			Map<String, Object> data = new HashMap<>();
			data.put("syncedMatches", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 경기 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "경기 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 18. 경기 타임라인 상세 이벤트 수동 동기화 트리거 (단일 일자 또는 기간 From ~ To 지원)
	@PostMapping("/sync/events")
	public ApiResponse<Map<String, Object>> syncEvents(
			@RequestParam(value = "date", required = false) String date,
			@RequestParam(value = "startDate", required = false) String startDate,
			@RequestParam(value = "endDate", required = false) String endDate,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			String from = (startDate != null && !startDate.trim().isEmpty()) ? startDate.trim() : date;
			String to = (endDate != null && !endDate.trim().isEmpty()) ? endDate.trim() : from;
			int count = adminService.syncMatchEventsByDateRange(from, to);
			Map<String, Object> data = new HashMap<>();
			data.put("syncedEvents", count);
			return ApiResponse.success(data);
		} catch (ExternalApiException e) {
			log.error("[AdminController] 이벤트 동기화 중 외부 API 연동 실패 (HTTP {}, Code: {}): {}",
					e.getStatusCode(), e.getResultCode().getCode(), e.getMessage());
			return ApiResponse.error(e.getResultCode(), e.getMessage());
		} catch (Exception e) {
			log.error("[AdminController] 이벤트 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "이벤트 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 18-1. AI 스코어 정합성 강제 일치 트리거 (단일 일자 또는 기간 From ~ To 지원)
	@PostMapping("/sync/ai-force-align")
	public ApiResponse<Map<String, Object>> forceAiAlign(
			@RequestParam(value = "date", required = false) String date,
			@RequestParam(value = "startDate", required = false) String startDate,
			@RequestParam(value = "endDate", required = false) String endDate,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			String from = (startDate != null && !startDate.trim().isEmpty()) ? startDate.trim() : date;
			String to = (endDate != null && !endDate.trim().isEmpty()) ? endDate.trim() : from;
			Map<String, Object> result = adminService.forceAiAlignMatchEventsByDateRange(from, to);
			return ApiResponse.success(result);
		} catch (ExternalApiException e) {
			log.error("[AdminController] AI 강제 일치 중 외부 API 연동 실패 (HTTP {}, Code: {}): {}",
					e.getStatusCode(), e.getResultCode().getCode(), e.getMessage());
			return ApiResponse.error(e.getResultCode(), e.getMessage());
		} catch (Exception e) {
			log.error("[AdminController] AI 강제 일치 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "AI 강제 일치 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 19. 프리미어리그 순위표 수동 동기화
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
		} catch (ExternalApiException e) {
			log.error("[AdminController] 순위표 동기화 중 외부 API 연동 실패 (HTTP {}, Code: {}): {}",
					e.getStatusCode(), e.getResultCode().getCode(), e.getMessage());
			return ApiResponse.error(e.getResultCode(), e.getMessage());
		} catch (Exception e) {
			log.error("[AdminController] 순위표 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "순위표 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 20. 득점 순위 수동 동기화
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
		} catch (ExternalApiException e) {
			log.error("[AdminController] 득점순위 동기화 중 외부 API 연동 실패 (HTTP {}, Code: {}): {}",
					e.getStatusCode(), e.getResultCode().getCode(), e.getMessage());
			return ApiResponse.error(e.getResultCode(), e.getMessage());
		} catch (Exception e) {
			log.error("[AdminController] 득점순위 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "득점순위 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 21. 특정 시즌 전체 380경기 일괄 동기화
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
		} catch (ExternalApiException e) {
			log.error("[AdminController] 시즌 경기 동기화 중 외부 API 연동 실패 (HTTP {}, Code: {}): {}",
					e.getStatusCode(), e.getResultCode().getCode(), e.getMessage());
			return ApiResponse.error(e.getResultCode(), e.getMessage());
		} catch (Exception e) {
			log.error("[AdminController] 시즌 경기 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "시즌 경기 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 22. 전체 20개 구단 및 선수단 일괄 동기화
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
		} catch (ExternalApiException e) {
			log.error("[AdminController] 구단/선수단 동기화 중 외부 API 연동 실패 (HTTP {}, Code: {}): {}",
					e.getStatusCode(), e.getResultCode().getCode(), e.getMessage());
			return ApiResponse.error(e.getResultCode(), e.getMessage());
		} catch (Exception e) {
			log.error("[AdminController] 구단 및 선수단 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "구단/선수단 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 23. 스코어-이벤트 불일치 경기 정밀 재동기화 (1차 룰 + 2차 Gemini AI 교차 검증)
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
		} catch (ExternalApiException e) {
			log.error("[AdminController] 불일치 경기 재동기화 중 외부 API 연동 실패 (HTTP {}, Code: {}): {}",
					e.getStatusCode(), e.getResultCode().getCode(), e.getMessage());
			return ApiResponse.error(e.getResultCode(), e.getMessage());
		} catch (Exception e) {
			log.error("[AdminController] 불일치 경기 재동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "불일치 경기 재동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// [Gemini AI] 23-1. 전체 구단 역사 및 한글명 일괄 자동 적재 (비동기 백그라운드)
	@PostMapping("/sync/ai-korean")
	public ApiResponse<Map<String, Object>> syncAiKorean(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			Map<String, Object> result = geminiApiService.syncAllKoreanDataAsync();
			return ApiResponse.success(result);
		} catch (Exception e) {
			log.error("[AdminController] 전체 AI 한글화 일괄 실행 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "전체 AI 한글화 실행 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// [Gemini AI] 23-2. 전체 선수단 한글 번역 단독 실행
	@PostMapping("/sync/ai-players")
	public ApiResponse<Map<String, Object>> syncAiPlayers(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = geminiApiService.syncAllPlayersKorean();
			Map<String, Object> data = new HashMap<>();
			data.put("syncedPlayersKorean", count);
			data.put("updatedCount", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 선수단 한글 번역 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "선수단 한글 번역 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// [Gemini AI] 23-3. 20개 구단 한글명, 홈구장, 역사 동기화 단독 실행
	@PostMapping("/sync/ai-teams")
	public ApiResponse<Map<String, Object>> syncAiTeams(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = geminiApiService.syncTeamsKoreanAndHistory();
			Map<String, Object> data = new HashMap<>();
			data.put("syncedTeamsKorean", count);
			data.put("updatedCount", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 구단 한글명 동기화 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "구단 한글명 동기화 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// [Gemini AI] 23-4. 코칭스태프(감독) 한글명 번역 단독 실행
	@PostMapping("/sync/ai-staffs")
	public ApiResponse<Map<String, Object>> syncAiStaffs(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = geminiApiService.syncStaffsKorean();
			Map<String, Object> data = new HashMap<>();
			data.put("syncedStaffsKorean", count);
			data.put("updatedCount", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 코칭스태프 한글 번역 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "코칭스태프 한글 번역 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// [Gemini AI] 23-5. 전체 선수 세부 포지션(CB, LB, CDM, ST 등) AI 판별 및 DB 적재
	@PostMapping("/sync/ai-positions")
	public ApiResponse<Map<String, Object>> syncAiPositions(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			int count = geminiApiService.syncAllPlayersDetailPositions();
			Map<String, Object> data = new HashMap<>();
			data.put("syncedPositions", count);
			data.put("updatedCount", count);
			return ApiResponse.success(data);
		} catch (Exception e) {
			log.error("[AdminController] 세부 포지션 AI 적재 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "세부 포지션 AI 적재 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 24. [승부예측 테스트용] 더미 경기 10개 생성 (현재시간 + N분 뒤 시작)
	@PostMapping("/matches/dummy")
	public ApiResponse<Map<String, Object>> createDummyMatches(
			@RequestBody(required = false) Map<String, Object> body,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		int minutes = 3;
		if (body != null && body.get("minutesAfterNow") != null) {
			try {
				minutes = Integer.parseInt(body.get("minutesAfterNow").toString());
			} catch (NumberFormatException ignored) {
				minutes = 3;
			}
		}
		try {
			Map<String, Object> result = adminService.createDummyMatches(minutes);
			return ApiResponse.success(result);
		} catch (Exception e) {
			log.error("[AdminController] 더미 경기 생성 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "더미 경기 생성 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 25. [승부예측 테스트용] 더미 경기 일괄 즉시 종료 및 포인트 정산
	@PostMapping("/matches/dummy/settle")
	public ApiResponse<Map<String, Object>> settleDummyMatches(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			Map<String, Object> result = adminService.settleDummyMatches(false);
			return ApiResponse.success(result);
		} catch (Exception e) {
			log.error("[AdminController] 더미 경기 정산 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "더미 경기 정산 중 오류가 발생했습니다: " + e.getMessage());
		}
	}

	// 26. [승부예측 테스트용] 더미 경기 및 파생 결과(포인트/전적/이력/투표) 일괄 원상복구 삭제
	@DeleteMapping("/matches/dummy")
	public ApiResponse<Map<String, Object>> cleanupDummyMatches(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return ApiResponse.error(ResultCode.FORBIDDEN);
		}
		try {
			Map<String, Object> result = adminService.cleanupDummyMatches();
			return ApiResponse.success(result);
		} catch (Exception e) {
			log.error("[AdminController] 더미 경기 원상복구 삭제 실패: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "더미 경기 삭제 중 오류가 발생했습니다: " + e.getMessage());
		}
	}
}

