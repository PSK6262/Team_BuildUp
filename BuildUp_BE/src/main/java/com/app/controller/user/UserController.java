package com.app.controller.user;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
	public ResponseEntity<Map<String, Object>> getMyProfile(HttpServletRequest request) {
		Map<String, Object> response = new HashMap<>();

		String loginId = resolveLoginId(request);
		if (loginId == null) {
			response.put("status", "FAIL");
			response.put("message", "로그인이 필요한 서비스입니다.");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
		}

		Users user = userDAO.selectUserByLoginId(loginId);
		if (user == null) {
			response.put("status", "FAIL");
			response.put("message", "사용자 정보를 찾을 수 없습니다.");
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
		}

		user.setPassword(null);
		response.put("status", "SUCCESS");
		response.put("user", user);
		return ResponseEntity.ok(response);
	}

	/**
	 * 회원 정보 수정 (닉네임, 이메일, 선호 구단)
	 */
	@PutMapping("/me")
	public ResponseEntity<Map<String, Object>> updateMyProfile(@RequestBody Users updateData, HttpServletRequest request) {
		Map<String, Object> response = new HashMap<>();

		String loginId = resolveLoginId(request);
		if (loginId == null) {
			response.put("status", "FAIL");
			response.put("message", "로그인이 필요한 서비스입니다.");
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
		}

		Users currentUser = userDAO.selectUserByLoginId(loginId);
		if (currentUser == null) {
			response.put("status", "FAIL");
			response.put("message", "사용자 정보를 찾을 수 없습니다.");
			return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
		}

		// 본인 정보만 업데이트 가능하도록 PK 고정
		updateData.setUserId(currentUser.getUserId());

		// 닉네임 변경 시 중복 검증 (자신의 기존 닉네임과 다른 경우만)
		if (updateData.getNickname() != null && !updateData.getNickname().equals(currentUser.getNickname())) {
			if (!userService.isNicknameAvailable(updateData.getNickname())) {
				response.put("status", "FAIL");
				response.put("message", "이미 사용 중인 닉네임입니다.");
				return ResponseEntity.badRequest().body(response);
			}
		}

		try {
			Users updated = userService.updateUserProfile(updateData);
			// 세션 사용자 정보도 동기화
			if (request.getSession(false) != null) {
				request.getSession().setAttribute("loginUser", updated);
			}

			response.put("status", "SUCCESS");
			response.put("message", "회원 정보가 성공적으로 수정되었습니다.");
			response.put("user", updated);
			return ResponseEntity.ok(response);

		} catch (Exception e) {
			log.error("[UserController] 프로필 수정 오류: {}", e.getMessage(), e);
			response.put("status", "ERROR");
			response.put("message", "회원 정보 수정 중 오류가 발생했습니다.");
			return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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
