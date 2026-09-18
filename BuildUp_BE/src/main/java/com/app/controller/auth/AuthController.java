package com.app.controller.auth;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.common.ApiResponse;
import com.app.common.CommonCode;
import com.app.common.ResultCode;
import com.app.dto.user.APILogin;
import com.app.dto.user.Users;
import com.app.service.user.UserService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

	@Autowired
	private UserService userService;

	/**
	 * 로그인 처리 (아이디/비밀번호 검증, 세션 및 JWT 발급)
	 */
	@PostMapping("/login")
	public ApiResponse<Map<String, Object>> login(@RequestBody APILogin loginDto, HttpServletRequest request) {
		if (loginDto == null || loginDto.getLoginId() == null || loginDto.getPassword() == null) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}

		try {
			Users user = userService.login(loginDto.getLoginId(), loginDto.getPassword());

			// 세션 로그인 처리
			LoginManager.setSessionLoginUserId(request, user.getLoginId());
			request.getSession().setAttribute(CommonCode.SESSION_LOGIN_USER, user);

			// JWT 토큰 발급
			String token = JwtProvider.createAccessToken(user);

			Map<String, Object> data = new HashMap<>();
			data.put("token", token);
			data.put("user", user);

			return ApiResponse.success(data);

		} catch (IllegalArgumentException e) {
			return ApiResponse.error(ResultCode.INVALID_PASSWORD);
		} catch (Exception e) {
			log.error("[AuthController] 로그인 오류: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL);
		}
	}

	/**
	 * 신규 회원가입
	 */
	@PostMapping("/signup")
	public ApiResponse<Users> signup(@RequestBody Users user) {
		if (user == null) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}

		try {
			Users registered = userService.signup(user);
			return ApiResponse.success(registered);

		} catch (IllegalStateException e) {
			if (e.getMessage() != null && e.getMessage().contains("아이디")) {
				return ApiResponse.error(ResultCode.DUPLICATE_LOGIN_ID);
			}
			return ApiResponse.error(ResultCode.DUPLICATE_NICKNAME);
		} catch (IllegalArgumentException e) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		} catch (Exception e) {
			log.error("[AuthController] 회원가입 오류: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.FAIL);
		}
	}

	/**
	 * 아이디 중복 확인
	 */
	@GetMapping("/check-id")
	public ApiResponse<Boolean> checkLoginId(@RequestParam("loginId") String loginId) {
		if (loginId == null || loginId.trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}

		boolean available = userService.isLoginIdAvailable(loginId.trim());
		if (!available) {
			return ApiResponse.error(ResultCode.DUPLICATE_LOGIN_ID);
		}

		return ApiResponse.success(true);
	}

	/**
	 * 닉네임 중복 확인
	 */
	@GetMapping("/check-nickname")
	public ApiResponse<Boolean> checkNickname(@RequestParam("nickname") String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}

		boolean available = userService.isNicknameAvailable(nickname.trim());
		if (!available) {
			return ApiResponse.error(ResultCode.DUPLICATE_NICKNAME);
		}

		return ApiResponse.success(true);
	}

	/**
	 * 로그아웃 처리 (세션 만료)
	 */
	@PostMapping("/logout")
	public ApiResponse<Void> logout(HttpServletRequest request) {
		LoginManager.logout(request);
		return ApiResponse.success();
	}

	/**
	 * 현재 로그인 상태 및 사용자 기본 정보 확인
	 */
	@GetMapping("/status")
	public ApiResponse<Map<String, Object>> getAuthStatus(HttpServletRequest request) {
		String loginId = LoginManager.getLoginUserId(request);
		if (loginId == null) {
			String token = JwtProvider.extractToken(request);
			if (token != null && JwtProvider.isValidToken(token)) {
				loginId = JwtProvider.getLoginIdFromToken(token);
			}
		}

		HttpSession session = request.getSession(false);
		Users user = (session != null) ? (Users) session.getAttribute(CommonCode.SESSION_LOGIN_USER) : null;
		boolean isLoggedIn = (loginId != null);

		Map<String, Object> data = new HashMap<>();
		data.put("isLoggedIn", isLoggedIn);
		data.put("user", user);

		return ApiResponse.success(data);
	}
}
