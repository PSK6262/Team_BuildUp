package com.app.controller.match;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.common.CommonCode;
import com.app.dao.user.UserDAO;
import com.app.dto.match.Matches;
import com.app.dto.match.MatchEvents;
import com.app.dto.user.Users;
import com.app.service.api.FootballApiService;
import com.app.service.api.BigBallsApiService;
import com.app.service.match.MatchService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

@RestController
@RequestMapping({"/api/matches", "/matches"})
public class MatchController {

	@Autowired
	private MatchService matchService;

	@GetMapping("/players/{playerId}/events")
	public List<MatchEvents> getPlayerEvents(
			@PathVariable("playerId") Long playerId,
			@RequestParam(value = "season", defaultValue = "2026") Integer season) {
		if (playerId <= 0 || season < 1900 || season > 9998) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "선수와 시즌을 확인하세요.");
		}
		return matchService.getPlayerEvents(playerId, season);
	}

	@Autowired
	private FootballApiService footballApiService;

	@Autowired
	private BigBallsApiService bigBallsApiService;

	@Autowired
	private UserDAO userDAO;

	/**
	 * [관리자 권한 검증 메서드]
	 * 1. 세션의 loginUser 객체 확인
	 * 2. 세션 loginUserId 확인 후 DB 조회
	 * 3. Authorization Bearer JWT 토큰 검증 후 DB 조회
	 * 경기 데이터 동기화와 같은 대량 DB 변경 작업은 관리자(ROLE_ADMIN) 권한을 요구합니다.
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
			"message", "경기 데이터 동기화 작업은 관리자(ADMIN) 권한이 필요합니다."
		));
	}

	// 1. 시즌 경기 일정 DB 일괄 동기화 (초기 1회 적재용)
	// 보안 개선: POST 단일 메서드로 한정 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-season")
	public ResponseEntity<Map<String, Object>> syncSeasonMatches(
			@RequestParam(value = "season", required = false) Integer season,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		String seasonDisplay = (season != null) ? season.toString() : "최신 활성 시즌";
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 시즌 경기 일정 일괄 동기화 시작 (시즌: " + seasonDisplay + ")");
		System.out.println("----------------------------------------------------------------------");
		int savedCount = footballApiService.syncPremierLeagueSeasonMatches(season);
		System.out.println("  - 처리 결과: 총 " + savedCount + "개 경기 일정이 DB에 저장되었습니다.");
		System.out.println("======================================================================");

		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"targetSeason", seasonDisplay,
			"savedMatchCount", savedCount,
			"message", seasonDisplay + " 경기(" + savedCount + "경기)가 한국 시간(KST)으로 DB에 저장되었습니다."
		));
	}

	// 2. 오늘 경기 상태 및 스코어 갱신 (재호출/스케줄러용)
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-today")
	public ResponseEntity<Map<String, Object>> syncTodayMatches(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 오늘 경기 스코어/상태 실시간 갱신 시작 (일자: " + LocalDate.now() + ")");
		System.out.println("----------------------------------------------------------------------");
		int updatedCount = footballApiService.syncMatchesByDate(LocalDate.now());
		System.out.println("  - 처리 결과: 총 " + updatedCount + "개 경기 스코어가 갱신되었습니다.");
		System.out.println("======================================================================");

		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"date", LocalDate.now().toString(),
			"updatedMatchCount", updatedCount
		));
	}

	// 3. 특정 날짜 경기 상태 및 스코어 갱신
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-date")
	public ResponseEntity<Map<String, Object>> syncMatchesByDate(
			@RequestParam(value = "date") String dateStr,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		LocalDate targetDate = LocalDate.parse(dateStr);
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 특정 일자 경기 스코어/상태 갱신 시작 (일자: " + dateStr + ")");
		System.out.println("----------------------------------------------------------------------");
		int updatedCount = footballApiService.syncMatchesByDate(targetDate);
		System.out.println("  - 처리 결과: 총 " + updatedCount + "개 경기 스코어가 갱신되었습니다.");
		System.out.println("======================================================================");

		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"date", dateStr,
			"updatedMatchCount", updatedCount
		));
	}

	// 4. 전체 경기 일정 조회 (DB 데이터)
	// 예: GET /api/matches 또는 GET /api/matches/
	@GetMapping({"", "/"})
	public List<Matches> getAllMatches(
			@RequestParam(value = "season", required = false) Integer season) {
		if (season == null) {
			return matchService.getAllMatches();
		}
		if (season < 1900 || season > 9998) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "올바른 시즌 연도를 입력하세요.");
		}
		LocalDateTime startDate = LocalDate.of(season, 7, 1).atStartOfDay();
		LocalDateTime endDate = startDate.plusYears(1).minusNanos(1);
		return matchService.getMatchesByDateRange(startDate, endDate);
	}

	// 5. 단건 경기 상세 조회 (DB 데이터)
	// 예: GET /api/matches/{matchId}
	@GetMapping("/{matchId}")
	public Matches getMatchById(@PathVariable("matchId") Long matchId) {
		return matchService.getMatchById(matchId);
	}

	// 6. 경기 타임라인 이벤트 목록 조회 (DB 데이터)
	// 예: GET /api/matches/{matchId}/events
	@GetMapping("/{matchId}/events")
	public List<MatchEvents> getMatchEvents(@PathVariable("matchId") Long matchId) {
		return bigBallsApiService.getMatchEvents(matchId);
	}

	// 7. 경기 타임라인 이벤트 동기화 (Big Balls Data 연동)
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/{matchId}/sync-events")
	public ResponseEntity<Map<String, Object>> syncMatchEvents(
			@PathVariable("matchId") Long matchId,
			@RequestParam(value = "extMatchId", required = false) String extMatchId,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		int savedCount = 0;
		if (extMatchId != null && !extMatchId.isBlank()) {
			savedCount = bigBallsApiService.syncMatchEvents(matchId, extMatchId);
		} else {
			savedCount = bigBallsApiService.syncMatchEventsAuto(matchId);
		}

		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"matchId", matchId,
			"savedEventCount", savedCount,
			"message", "경기 타임라인 이벤트 " + savedCount + "건이 DB(MATCH_EVENTS)에 동기화되었습니다."
		));
	}

	// 8. 종료 경기 전체 타임라인 이벤트 일괄 동기화
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-all-events")
	public ResponseEntity<Map<String, Object>> syncAllFinishedMatchEvents(HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 종료 경기 전체 타임라인 이벤트 일괄 동기화 시작");
		System.out.println("----------------------------------------------------------------------");
		int totalSaved = bigBallsApiService.syncAllFinishedMatchEvents();
		System.out.println("  - 처리 결과: 총 " + totalSaved + "건의 타임라인 이벤트가 DB에 저장되었습니다.");
		System.out.println("======================================================================");

		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"totalSavedEvents", totalSaved,
			"message", "DB에 등록된 모든 종료 경기의 이벤트(" + totalSaved + "건)가 일괄 동기화되었습니다."
		));
	}

	// 9. 특정 날짜 경기 타임라인 이벤트 일괄 동기화
	// 보안 개선: GET -> POST 전환 및 관리자(ADMIN) 권한 검증 필수
	@PostMapping("/sync-events-by-date")
	public ResponseEntity<Map<String, Object>> syncMatchEventsByDate(
			@RequestParam("date") String dateStr,
			HttpServletRequest request) {
		if (!isAdmin(request)) {
			return forbiddenResponse();
		}
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 특정 일자 경기 타임라인 이벤트 동기화 시작 (일자: " + dateStr + ")");
		System.out.println("----------------------------------------------------------------------");
		int totalSaved = bigBallsApiService.syncMatchEventsByDate(dateStr);
		System.out.println("  - 처리 결과: 총 " + totalSaved + "건의 타임라인 이벤트가 DB에 저장되었습니다.");
		System.out.println("======================================================================");

		return ResponseEntity.ok(Map.of(
			"status", "SUCCESS",
			"date", dateStr,
			"totalSavedEvents", totalSaved,
			"message", dateStr + " 경기의 이벤트(" + totalSaved + "건)가 동기화되었습니다."
		));
	}
}
