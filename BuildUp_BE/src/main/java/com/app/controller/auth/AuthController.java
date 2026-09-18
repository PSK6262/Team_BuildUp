package com.app.controller.auth;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.user.APILogin;
import com.app.dto.user.Users;
import com.app.service.user.UserService;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.CrossOrigin;

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
	public ResponseEntity<Map<String, Object>> login(@RequestBody APILogin loginDto, HttpServletRequest request) {
		Map<String, Object> response = new HashMap<>();
		try {
			Users user = userService.login(loginDto.getLoginId(), loginDto.getPassword());

			// 세션 로그인 처리
			LoginManager.setSessionLoginUserId(request, user.getLoginId());
			request.getSession().setAttribute("loginUser", user);

			// JWT 토큰 발급
			String token = JwtProvider.createAccessToken(user);

			response.put("status", "SUCCESS");
			response.put("message", "로그인되었습니다.");
			response.put("token", token);
			response.put("user", user);
			return ResponseEntity.ok(response);

		} catch (IllegalArgumentException e) {
			response.put("status", "FAIL");
			response.put("message", e.getMessage());
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
		} catch (Exception e) {
			log.error("[AuthController] 로그인 오류: {}", e.getMessage(), e);
			response.put("status", "ERROR");
			response.put("message", "로그인 처리 중 서버 오류가 발생했습니다.");
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	/**
	 * 신규 회원가입
	 */
	@PostMapping("/signup")
	public ResponseEntity<Map<String, Object>> signup(@RequestBody Users user) {
		Map<String, Object> response = new HashMap<>();
		try {
			Users registered = userService.signup(user);
			response.put("status", "SUCCESS");
			response.put("message", "회원가입이 완료되었습니다.");
			response.put("userId", registered.getUserId());
			return ResponseEntity.status(HttpStatus.CREATED).body(response);

		} catch (IllegalArgumentException | IllegalStateException e) {
			response.put("status", "FAIL");
			response.put("message", e.getMessage());
			return ResponseEntity.badRequest().body(response);
		} catch (Exception e) {
			log.error("[AuthController] 회원가입 오류: {}", e.getMessage(), e);
			response.put("status", "ERROR");
			response.put("message", "회원가입 처리 중 오류가 발생했습니다.");
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
		}
	}

	/**
	 * 아이디 중복 확인
	 */
	@GetMapping("/check-id")
	public ResponseEntity<Map<String, Object>> checkLoginId(@RequestParam("loginId") String loginId) {
		Map<String, Object> response = new HashMap<>();
		boolean available = userService.isLoginIdAvailable(loginId);
		response.put("status", "SUCCESS");
		response.put("available", available);
		response.put("message", available ? "사용 가능한 아이디입니다." : "이미 사용 중인 아이디입니다.");
		return ResponseEntity.ok(response);
	}

	/**
	 * 닉네임 중복 확인
	 */
	@GetMapping("/check-nickname")
	public ResponseEntity<Map<String, Object>> checkNickname(@RequestParam("nickname") String nickname) {
		Map<String, Object> response = new HashMap<>();
		boolean available = userService.isNicknameAvailable(nickname);
		response.put("status", "SUCCESS");
		response.put("available", available);
		response.put("message", available ? "사용 가능한 닉네임입니다." : "이미 사용 중인 닉네임입니다.");
		return ResponseEntity.ok(response);
	}

	/**
	 * 로그아웃 처리 (세션 만료)
	 */
	@PostMapping("/logout")
	public ResponseEntity<Map<String, Object>> logout(HttpServletRequest request) {
		LoginManager.logout(request);
		Map<String, Object> response = new HashMap<>();
		response.put("status", "SUCCESS");
		response.put("message", "로그아웃되었습니다.");
		return ResponseEntity.ok(response);
	}

	/**
	 * 현재 로그인 상태 및 사용자 기본 정보 확인
	 */
	@GetMapping("/status")
	public ResponseEntity<Map<String, Object>> getAuthStatus(HttpServletRequest request) {
		Map<String, Object> response = new HashMap<>();

		// 1차: 세션 확인
		String loginId = LoginManager.getLoginUserId(request);

		// 2차: JWT 토큰 확인 (헤더 Authorization)
		if (loginId == null) {
			String token = JwtProvider.extractToken(request);
			if (token != null && JwtProvider.isValidToken(token)) {
				loginId = JwtProvider.getLoginIdFromToken(token);
			}
		}

		if (loginId != null) {
			Users user = (Users) (request.getSession(false) != null ? request.getSession(false).getAttribute("loginUser") : null);
			response.put("status", "SUCCESS");
			response.put("isLoggedIn", true);
			response.put("user", user);
		} else {
			response.put("status", "SUCCESS");
			response.put("isLoggedIn", false);
			response.put("user", null);
		}
		return ResponseEntity.ok(response);
	}
}
