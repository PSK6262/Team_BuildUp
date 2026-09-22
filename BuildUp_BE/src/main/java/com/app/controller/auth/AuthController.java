package com.app.controller.auth;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import java.util.regex.Pattern;

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

	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9](?!.*\\.\\.)[a-zA-Z0-9._-]{2,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");

	@Autowired
	private UserService userService;

	@Autowired
	private com.app.service.user.UserMailService userMailService;

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
	 * 신규 회원가입 요청 (이메일 인증 링크 발송)
	 */
	@PostMapping("/signup")
	public ApiResponse<Map<String, String>> signup(@RequestBody Users user) {
		if (user == null) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		if (user.getLoginId() == null || user.getLoginId().trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		if (!userService.isLoginIdAvailable(user.getLoginId().trim())) {
			return ApiResponse.error(ResultCode.DUPLICATE_LOGIN_ID);
		}
		if (user.getNickname() == null || user.getNickname().trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		if (!userService.isNicknameAvailable(user.getNickname().trim())) {
			return ApiResponse.error(ResultCode.DUPLICATE_NICKNAME);
		}
		if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		if (!EMAIL_PATTERN.matcher(user.getEmail().trim()).matches()) {
			return ApiResponse.error(ResultCode.INVALID_EMAIL);
		}
		if (!userService.isEmailAvailable(user.getEmail().trim())) {
			return ApiResponse.error(ResultCode.DUPLICATE_EMAIL);
		}
		if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}

		try {
			userMailService.sendSignupVerificationLink(user);
			Map<String, String> data = new HashMap<>();
			data.put("email", user.getEmail().trim());
			data.put("message", "가입 인증 메일이 발송되었습니다. 이메일에서 링크를 클릭하여 가입을 완료해주세요.");
			return ApiResponse.success(data);

		} catch (IllegalArgumentException e) {
			if (e.getMessage() != null && e.getMessage().contains("이메일")) {
				return ApiResponse.error(ResultCode.INVALID_EMAIL);
			}
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		} catch (Exception e) {
			log.error("[AuthController] 회원가입 인증 메일 발송 오류: {}", e.getMessage(), e);
			return ApiResponse.error(ResultCode.EMAIL_SEND_FAIL);
		}
	}

	/**
	 * 이메일 인증 링크 확인 및 회원가입 최종 완료
	 */
	@GetMapping("/confirm-signup")
	public ApiResponse<Users> confirmSignup(@RequestParam("key") String authKey) {
		if (authKey == null || authKey.trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		try {
			Users user = userMailService.confirmSignup(authKey.trim());
			user.setPassword(null);
			return ApiResponse.success(user);
		} catch (IllegalArgumentException e) {
			return ApiResponse.error(ResultCode.INVALID_AUTH_KEY, e.getMessage());
		} catch (IllegalStateException e) {
			if (e.getMessage() != null && e.getMessage().contains("아이디")) {
				return ApiResponse.error(ResultCode.DUPLICATE_LOGIN_ID, e.getMessage());
			}
			if (e.getMessage() != null && e.getMessage().contains("닉네임")) {
				return ApiResponse.error(ResultCode.DUPLICATE_NICKNAME, e.getMessage());
			}
			return ApiResponse.error(ResultCode.DUPLICATE_EMAIL, e.getMessage());
		} catch (Exception e) {
			log.error("[AuthController] 회원가입 인증 확인 오류: {}", e.getMessage(), e);
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
	 * 이메일 중복 확인
	 */
	@GetMapping("/check-email")
	public ApiResponse<Boolean> checkEmail(@RequestParam("email") String email) {
		if (email == null || email.trim().isEmpty()) {
			return ApiResponse.error(ResultCode.INVALID_INPUT);
		}
		if (!EMAIL_PATTERN.matcher(email.trim()).matches()) {
			return ApiResponse.error(ResultCode.INVALID_EMAIL);
		}

		boolean available = userService.isEmailAvailable(email.trim());
		if (!available) {
			return ApiResponse.error(ResultCode.DUPLICATE_EMAIL);
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

	/**
	 * 토큰 갱신 (Sliding Session: 사용자가 사이트에 들어오거나 활동할 때마다 30분 연장)
	 */
	@PostMapping("/refresh")
	public ApiResponse<Map<String, Object>> refreshToken(HttpServletRequest request) {
		String token = JwtProvider.extractToken(request);
		if (token != null && JwtProvider.isValidToken(token)) {
			String loginId = JwtProvider.getLoginIdFromToken(token);
			if (loginId != null) {
				Users user = userService.getUserByLoginId(loginId);
				if (user != null) {
					String newToken = JwtProvider.createAccessToken(user);
					LoginManager.setSessionLoginUserId(request, user.getLoginId());
					request.getSession().setAttribute(CommonCode.SESSION_LOGIN_USER, user);

					Map<String, Object> data = new HashMap<>();
					data.put("token", newToken);
					data.put("user", user);
					return ApiResponse.success(data);
				}
			}
		}
		return ApiResponse.error(ResultCode.UNAUTHORIZED);
	}
}
