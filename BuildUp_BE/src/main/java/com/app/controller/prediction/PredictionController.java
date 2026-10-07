package com.app.controller.prediction;

import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.common.CommonCode;
import com.app.dao.user.UserDAO;
import com.app.dto.prediction.Predictions;
import com.app.dto.user.UserPredicts;
import com.app.dto.user.Users;
import com.app.service.prediction.PredictionService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;
import com.app.util.UserActivityLogger;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

	private static final Logger log = LoggerFactory.getLogger(PredictionController.class);

	// 응답 키 및 상태 상수
	private static final String KEY_STATUS = "status";
	private static final String KEY_MESSAGE = "message";
	private static final String STATUS_SUCCESS = "SUCCESS";
	private static final String STATUS_FAIL = "FAIL";
	private static final String STATUS_ERROR = "ERROR";

	// 공통 오류 메시지
	private static final String MSG_LOGIN_REQUIRED = "로그인 후 이용할 수 있습니다.";
	private static final String MSG_ODDS_ERROR = "배당률 계산 중 오류가 발생했습니다.";
	private static final String MSG_BET_ERROR = "투표 처리 중 서버 오류가 발생했습니다.";
	private static final String MSG_SETTLE_ERROR = "경기 정산 중 서버 오류가 발생했습니다.";

	@Autowired
	private PredictionService predictionService;

	@Autowired
	private UserDAO userDAO;

	/**
	 * 실패 응답 생성 헬퍼
	 */
	private Map<String, Object> failResponse(String message) {
		return Map.of(KEY_STATUS, STATUS_FAIL, KEY_MESSAGE, message);
	}

	/**
	 * 서버 오류 응답 생성 헬퍼
	 */
	private Map<String, Object> errorResponse(String message) {
		return Map.of(KEY_STATUS, STATUS_ERROR, KEY_MESSAGE, message);
	}

	/**
	 * Long 값 파싱 헬퍼 (null 및 예외 안전)
	 */
	private Long parseLong(Object obj, Long defaultVal) {
		if (obj == null) return defaultVal;
		try {
			return Long.valueOf(obj.toString());
		} catch (NumberFormatException e) {
			return defaultVal;
		}
	}

	/**
	 * 특정 경기의 실시간 배당률(방안 1 적용) 및 투표 통계 조회
	 * GET /api/predictions/matches/{matchId}/odds
	 */
	@GetMapping("/matches/{matchId}/odds")
	public ResponseEntity<Map<String, Object>> getMatchOdds(@PathVariable("matchId") Long matchId) {
		try {
			Map<String, Object> odds = predictionService.getMatchOdds(matchId);
			return ResponseEntity.ok(odds);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(failResponse(e.getMessage()));
		} catch (Exception e) {
			log.error("[PredictionController] 배당률 조회 오류: {}", e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(errorResponse(MSG_ODDS_ERROR));
		}
	}

	/**
	 * 승부예측 투표 참여 (무료 1클릭 투표)
	 * POST /api/predictions
	 * Body: { "matchId": 1, "predictResult": "HOME" }
	 */
	@PostMapping({"", "/"})
	public ResponseEntity<Map<String, Object>> betPrediction(
			@RequestBody Map<String, Object> requestBody,
			HttpServletRequest request) {

		Users user = resolveLoginUser(request);
		if (user == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(failResponse(MSG_LOGIN_REQUIRED));
		}

		try {
			Long matchId = parseLong(requestBody.get("matchId"), null);
			String predictResult = (String) requestBody.get("predictResult");

			Map<String, Object> result = predictionService.betPrediction(user.getUserId(), matchId, predictResult);
			UserActivityLogger.log(request, "승부예측 투표", user.getLoginId());
			return ResponseEntity.ok(result);

		} catch (IllegalArgumentException | IllegalStateException e) {
			return ResponseEntity.badRequest().body(failResponse(e.getMessage()));
		} catch (Exception e) {
			log.error("[PredictionController] 투표 처리 오류: {}", e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(errorResponse(MSG_BET_ERROR));
		}
	}

	/**
	 * 특정 경기에 대한 로그인 회원의 베팅 내역 조회
	 * GET /api/predictions/matches/{matchId}/my
	 */
	@GetMapping("/matches/{matchId}/my")
	public ResponseEntity<Map<String, Object>> getMyPredictionForMatch(
			@PathVariable("matchId") Long matchId,
			HttpServletRequest request) {

		Users user = resolveLoginUser(request);
		if (user == null) {
			return ResponseEntity.ok(Map.of("isLoggedIn", false, "hasVoted", false));
		}

		Predictions pred = predictionService.getUserPredictionForMatch(user.getUserId(), matchId);
		if (pred != null) {
			return ResponseEntity.ok(Map.of(
				"isLoggedIn", true,
				"hasVoted", true,
				"prediction", pred
			));
		} else {
			return ResponseEntity.ok(Map.of(
				"isLoggedIn", true,
				"hasVoted", false
			));
		}
	}

	/**
	 * 로그인 회원의 전체 승부예측 참여 목록 조회 (마이페이지/예측페이지)
	 * GET /api/predictions/my
	 */
	@GetMapping("/my")
	public ResponseEntity<Map<String, Object>> getMyPredictions(HttpServletRequest request) {
		Users user = resolveLoginUser(request);
		if (user == null) {
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
					.body(failResponse(MSG_LOGIN_REQUIRED));
		}

		List<Predictions> list = predictionService.getMyPredictions(user.getUserId());
		return ResponseEntity.ok(Map.of(
			KEY_STATUS, STATUS_SUCCESS,
			"totalCount", list.size(),
			"items", list
		));
	}

	/**
	 * 승부예측 Top 10 적중 랭킹 조회
	 * GET /api/predictions/rankings
	 */
	@GetMapping("/rankings")
	public ResponseEntity<Map<String, Object>> getRankings() {
		List<UserPredicts> rankings = predictionService.getTopPredictors();
		return ResponseEntity.ok(Map.of(
			KEY_STATUS, STATUS_SUCCESS,
			"rankings", rankings
		));
	}

	/**
	 * [인가 보안 개선 - 질문 3]
	 * 특정 경기 결과 정산 수동 실행 (관리자 권한 필수)
	 * POST /api/predictions/matches/{matchId}/settle
	 */
	@PostMapping("/matches/{matchId}/settle")
	public ResponseEntity<Map<String, Object>> settleMatch(
			@PathVariable("matchId") Long matchId,
			HttpServletRequest request) {

		// 관리자 권한 검증: 비인가자/일반 사용자의 무단 포인트 정산 차단
		if (!isAdmin(request)) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
					.body(failResponse("승부예측 정산 작업은 관리자(ADMIN) 권한이 필요합니다."));
		}

		try {
			Map<String, Object> result = predictionService.settleMatchPredictions(matchId);
			return ResponseEntity.ok(result);
		} catch (IllegalArgumentException e) {
			return ResponseEntity.badRequest().body(failResponse(e.getMessage()));
		} catch (Exception e) {
			log.error("[PredictionController] 경기 정산 오류: {}", e.getMessage(), e);
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
					.body(errorResponse(MSG_SETTLE_ERROR));
		}
	}

	/**
	 * [인증 우선순위 개선 - 질문 6]
	 * 세션보다 클라이언트의 Authorization Bearer JWT 토큰을 최우선으로 검증합니다.
	 * 1순위: Authorization 헤더에 실린 JWT 토큰 유효성 검증 -> 최신 사용자 식별
	 * 2순위: 토큰이 없는 브라우저/레거시 요청 시 세션(LoginManager) Fallback
	 */
	private Users resolveLoginUser(HttpServletRequest request) {
		if (request == null) {
			return null;
		}

		String loginId = null;

		// 1순위: 클라이언트가 전송한 Authorization Bearer JWT 토큰을 최우선으로 검증합니다.
		String token = JwtProvider.extractToken(request);
		if (token != null && JwtProvider.isValidToken(token)) {
			loginId = JwtProvider.getLoginIdFromToken(token);
		}

		// 2순위: JWT 토큰이 없는 경우에만 세션 확인 (인증 덮어쓰기/세션 하이재킹 방지)
		if (loginId == null) {
			loginId = LoginManager.getLoginUserId(request);
		}

		if (loginId != null && userDAO != null) {
			return userDAO.selectUserByLoginId(loginId);
		}

		return null;
	}

	/**
	 * [인가 보안 개선 - 질문 3]
	 * 현재 요청자가 관리자(ROLE_ADMIN, 9L) 권한을 보유하고 있는지 확인합니다.
	 */
	private boolean isAdmin(HttpServletRequest request) {
		Users user = resolveLoginUser(request);
		return user != null && (CommonCode.ROLE_ADMIN.equals(user.getRoleCode())
				|| CommonCode.ROLE_SUB_ADMIN.equals(user.getRoleCode()));
	}
}
