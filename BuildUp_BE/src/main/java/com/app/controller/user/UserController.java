package com.app.controller.user;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.common.ApiResponse;
import com.app.common.CommonCode;
import com.app.common.ResultCode;
import com.app.dao.user.UserDAO;
import com.app.dto.user.Users;
import com.app.service.user.UserService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;

@Slf4j
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/users")
public class UserController {

	@Autowired
	private UserService userService;

	@Autowired
	private UserDAO userDAO;

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

		// 닉네임 변경 시 중복 검증 (자신의 기존 닉네임과 다른 경우만)
		if (updateData.getNickname() != null && !updateData.getNickname().equals(currentUser.getNickname())) {
			if (!userService.isNicknameAvailable(updateData.getNickname())) {
				return ApiResponse.error(ResultCode.DUPLICATE_NICKNAME);
			}
		}

		try {
			Users updated = userService.updateUserProfile(updateData);
			// 세션 사용자 정보도 동기화
			if (request.getSession(false) != null) {
				request.getSession().setAttribute(CommonCode.SESSION_LOGIN_USER, updated);
			}
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
