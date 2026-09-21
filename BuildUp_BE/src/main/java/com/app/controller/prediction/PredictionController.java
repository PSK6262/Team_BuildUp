package com.app.controller.prediction;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.dao.user.UserDAO;
import com.app.dto.prediction.Predictions;
import com.app.dto.user.UserPredicts;
import com.app.dto.user.Users;
import com.app.service.prediction.PredictionService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

@CrossOrigin(origins = "*")
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
	 * 특정 경기 결과 정산 수동 실행 (테스트 및 경기 종료 시 호출용)
	 * POST /api/predictions/matches/{matchId}/settle
	 */
	@PostMapping("/matches/{matchId}/settle")
	public ResponseEntity<Map<String, Object>> settleMatch(@PathVariable("matchId") Long matchId) {
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
	 * 세션 또는 JWT 토큰에서 현재 로그인 회원 객체 추출
	 */
	private Users resolveLoginUser(HttpServletRequest request) {
		String loginId = LoginManager.getLoginUserId(request);

		if (loginId == null) {
			String token = JwtProvider.extractToken(request);
			if (token != null && JwtProvider.isValidToken(token)) {
				loginId = JwtProvider.getLoginIdFromToken(token);
			}
		}

		if (loginId != null) {
			return userDAO.selectUserByLoginId(loginId);
		}

		return null;
	}
}
