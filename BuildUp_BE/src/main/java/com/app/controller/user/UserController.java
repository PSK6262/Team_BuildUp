package com.app.controller.user;

import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
import com.app.dao.user.UserMailDAO;
import com.app.dto.prediction.PointHistory;
import com.app.dto.user.Users;
import com.app.service.user.UserService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;
import com.app.util.UserActivityLogger;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/users")
public class UserController {

	private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[\\uAC00-\\uD7A3a-zA-Z0-9]{2,20}$");

	@Autowired
	private UserService userService;

	@Autowired
	private UserDAO userDAO;

	@Autowired
	private UserMailDAO userMailDAO;


	/**
	 * 현재 로그인된 회원의 상세 프로필 조회 (마이페이지용)
	 */
	@GetMapping("/me")
	public ApiResponse<Users> getMyProfile(HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		user.setPassword(null);
		return ApiResponse.success(user);
	}

	/**
	 * 닉네임 중복 확인 (/api/users/check-nickname 호환 지원)
	 */
	@GetMapping("/check-nickname")
	public ApiResponse<Boolean> checkNickname(@RequestParam("nickname") String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		if (!NICKNAME_PATTERN.matcher(nickname.trim()).matches()) {
			return ApiResponse.error(ResultCode.INVALID_NICKNAME);
		}
		boolean available = userService.isNicknameAvailable(nickname.trim());
		if (!available) {
			return ApiResponse.error(ResultCode.DUPLICATE_NICKNAME);
		}
		return ApiResponse.success(true);
	}

	/**
	 * 마이페이지 활동 요약 통계 (작성글 수, 작성댓글 수, 좋아요 수)
	 */
	@GetMapping("/me/activities")
	public ApiResponse<Map<String, Object>> getMyActivities(HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		Map<String, Object> summary = userService.getUserActivitySummary(user.getUserId());
		return ApiResponse.success(summary);
	}

	/**
	 * 마이페이지: 본인이 작성한 게시글 목록 조회
	 */
	@GetMapping("/me/posts")
	public ApiResponse<Map<String, Object>> getMyPosts(
			@RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "size", defaultValue = "10") int size,
			HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		Map<String, Object> result = userService.getUserPosts(user.getUserId(), page, size);
		return ApiResponse.success(result);
	}

	/**
	 * 마이페이지: 본인이 작성한 댓글 목록 조회
	 */
	@GetMapping("/me/comments")
	public ApiResponse<Map<String, Object>> getMyComments(
			@RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "size", defaultValue = "10") int size,
			HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		Map<String, Object> result = userService.getUserComments(user.getUserId(), page, size);
		return ApiResponse.success(result);
	}

	/**
	 * 마이페이지: 본인이 좋아요(추천)한 게시글 목록 조회
	 */
	@GetMapping("/me/likes")
	public ApiResponse<Map<String, Object>> getMyLikedPosts(
			@RequestParam(value = "page", defaultValue = "1") int page,
			@RequestParam(value = "size", defaultValue = "10") int size,
			HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		Map<String, Object> result = userService.getUserLikedPosts(user.getUserId(), page, size);
		return ApiResponse.success(result);
	}

	/**
	 * 마이페이지: 본인 최근 포인트 변동 이력 (최근 5건) 조회
	 */
	@GetMapping("/me/points/history")
	public ApiResponse<List<PointHistory>> getMyPointHistories(HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		List<PointHistory> histories = userService.getUserPointHistories(user.getUserId());
		return ApiResponse.success(histories);
	}

	/**
	 * 마이페이지 & 포인트샵: 본인 보유 아이템 및 구매 내역 조회
	 */
	@GetMapping("/me/shop")
	public ApiResponse<Map<String, Object>> getMyShopData(HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		Map<String, Object> shopData = userService.getUserShopData(user.getUserId());
		return ApiResponse.success(shopData);
	}

	/**
	 * 포인트샵 아이템 구매 처리 (USER_INVENTORY, ITEM_ORDERS, POINT_TRANSACTIONS, POINT_HISTORY, USERS.POINT 연동)
	 */
	@PostMapping("/me/shop/purchase")
	public ApiResponse<Map<String, Object>> purchaseShopItem(
			@RequestBody Map<String, Object> itemRequest,
			HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		try {
			Map<String, Object> result = userService.purchaseShopItem(user.getUserId(), itemRequest);
			UserActivityLogger.log(request, "포인트샵 구매(UserCtrl)", loginId);
			return ApiResponse.success(result);
		} catch (IllegalArgumentException e) {
			return ApiResponse.error(ResultCode.INVALID_INPUT, e.getMessage());
		} catch (Exception e) {
			log.error("[UserController] 포인트샵 아이템 구매 오류: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL);
		}
	}

	/**
	 * 회원 정보 수정 (닉네임, 이메일, 선호 구단)
	 */
	@PutMapping("/me")
	public ApiResponse<Users> updateMyProfile(@RequestBody Users updateData, HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users currentUser = userDAO.selectUserByLoginId(loginId);
		if (currentUser == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		// 본인 정보만 업데이트 가능하도록 PK 고정
		updateData.setUserId(currentUser.getUserId());

		// 닉네임 공백 제거 및 미입력 시 기존 닉네임 유지
		if (updateData.getNickname() == null || updateData.getNickname().trim().isEmpty()) {
			updateData.setNickname(currentUser.getNickname());
		} else {
			updateData.setNickname(updateData.getNickname().trim());
		}

		// 이메일 미입력 시 기존 이메일 유지
		if (updateData.getEmail() == null || updateData.getEmail().trim().isEmpty()) {
			updateData.setEmail(currentUser.getEmail());
		} else {
			updateData.setEmail(updateData.getEmail().trim());
		}

		// 닉네임 변경 시 형식 및 중복 검증 (자신의 기존 닉네임과 다른 경우만)
		if (!updateData.getNickname().equals(currentUser.getNickname())) {
			String newNickname = updateData.getNickname();
			if (!NICKNAME_PATTERN.matcher(newNickname).matches()) {
				return ApiResponse.error(ResultCode.INVALID_NICKNAME);
			}
			if (!userService.isNicknameAvailable(newNickname)) {
				return ApiResponse.error(ResultCode.DUPLICATE_NICKNAME);
			}
		}

		// 이메일 변경 시 인증 완료 및 중복 검증 (자신의 기존 이메일과 다른 경우만)
		if (!updateData.getEmail().equalsIgnoreCase(currentUser.getEmail())) {
			String newEmail = updateData.getEmail();
			if (!userService.isEmailAvailable(newEmail)) {
				return ApiResponse.error(ResultCode.DUPLICATE_EMAIL);
			}
			if (!userMailDAO.isEmailChangeVerified(newEmail)) {
				return ApiResponse.error(ResultCode.EMAIL_CHANGE_NOT_VERIFIED);
			}
		}

		try {
			Users updated = userService.updateUserProfile(updateData);
			// 세션 사용자 정보도 동기화
			if (request.getSession(false) != null) {
				request.getSession().setAttribute(CommonCode.SESSION_LOGIN_USER, updated);
			}
			UserActivityLogger.log(request, "프로필 수정", loginId);
			return ApiResponse.success(updated);

		} catch (IllegalArgumentException e) {
			if (e.getMessage() != null && e.getMessage().contains("이메일")) {
				return ApiResponse.error(ResultCode.INVALID_EMAIL);
			}
			return ApiResponse.error(ResultCode.PROFILE_UPDATE_FAIL);
		} catch (Exception e) {
			log.error("[UserController] 프로필 수정 오류: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.PROFILE_UPDATE_FAIL);
		}
	}

	/**
	 * 회원 비밀번호 변경 (현재 비밀번호 검증 + 신규 규격 암호화 적용)
	 */
	@PutMapping("/me/password")
	public ApiResponse<Void> changePassword(
			@RequestBody Map<String, String> body,
			HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users currentUser = userDAO.selectUserByLoginId(loginId);
		if (currentUser == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		String currentPassword = body != null ? body.get("currentPassword") : null;
		String newPassword = body != null ? body.get("newPassword") : null;

		if (currentPassword == null || currentPassword.trim().isEmpty() ||
			newPassword == null || newPassword.trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT, "현재 비밀번호와 새 비밀번호를 모두 입력해주세요.");
		}

		if (newPassword.trim().length() < 8 || newPassword.trim().length() > 20) {
			return ApiResponse.error(ResultCode.INVALID_PASSWORD, "새 비밀번호는 8자 이상 20자 이하로 입력해주세요.");
		}

		try {
			boolean changed = userService.changePassword(currentUser.getUserId(), currentPassword.trim(), newPassword.trim());
			if (changed) {
				UserActivityLogger.log(request, "비밀번호 변경", loginId);
				return ApiResponse.success();
			} else {
				return ApiResponse.error(ResultCode.FAIL, "비밀번호 변경에 실패했습니다.");
			}
		} catch (IllegalArgumentException e) {
			return ApiResponse.error(ResultCode.INVALID_PASSWORD, e.getMessage());
		} catch (Exception e) {
			log.error("[UserController] 비밀번호 변경 중 예외 발생: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL, "비밀번호 변경 처리 중 오류가 발생했습니다.");
		}
	}

	/**
	 * 회원 탈퇴 (회원 데이터 및 연관 활동 데이터 영구 삭제)
	 */
	@DeleteMapping("/me")
	public ApiResponse<Void> withdraw(HttpServletRequest request) {
		String loginId = resolveLoginId(request);
		if (loginId == null) {
			return ApiResponse.error(ResultCode.UNAUTHORIZED);
		}

		Users currentUser = userDAO.selectUserByLoginId(loginId);
		if (currentUser == null) {
			return ApiResponse.error(ResultCode.USER_NOT_FOUND);
		}

		try {
			boolean success = userService.withdraw(currentUser.getUserId(), currentUser.getEmail());
			if (success) {
				UserActivityLogger.log(request, "회원 탈퇴", loginId);
				LoginManager.logout(request);
				log.info("[UserController] 회원 탈퇴 완료 -> userId: {}, loginId: {}", currentUser.getUserId(), loginId);
				return ApiResponse.success();
			} else {
				return ApiResponse.error(ResultCode.FAIL);
			}
		} catch (Exception e) {
			log.error("[UserController] 회원 탈퇴 중 오류: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL);
		}
	}

	/**
	 * 세션 또는 JWT 토큰에서 현재 로그인 아이디 추출
	 */
	private String resolveLoginId(HttpServletRequest request) {
		String loginId = LoginManager.getLoginUserId(request);
		if (loginId != null) {
			return loginId;
		}

		String token = JwtProvider.extractToken(request);
		if (token != null && JwtProvider.isValidToken(token)) {
			return JwtProvider.getLoginIdFromToken(token);
		}

		return null;
	}
}
