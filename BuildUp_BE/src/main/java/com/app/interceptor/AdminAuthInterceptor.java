package com.app.interceptor;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.app.common.CommonCode;
import com.app.dao.user.UserDAO;
import com.app.dto.user.Users;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

/**
 * [관리자 전용 API 접근 통제 인터셉터]
 * 비로그인 사용자(401) 및 일반 회원(403)이 관리자 API(/api/admin/**, 동기화 API 등)에
 * 접근하려 할 때 컨트롤러 진입 전에 차단합니다.
 */
@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

	private static final Logger log = LoggerFactory.getLogger(AdminAuthInterceptor.class);

	@Autowired
	private UserDAO userDAO;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		// CORS Preflight (OPTIONS) 요청은 통과
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			return true;
		}

		Users user = resolveUser(request);

		// 1. 비로그인 사용자 차단 (401 Unauthorized)
		if (user == null) {
			log.warn("[AdminAuthInterceptor] 비로그인 사용자의 관리자 API 접근 차단: URI={}", request.getRequestURI());
			writeJsonError(response, HttpServletResponse.SC_UNAUTHORIZED, "ERR_002",
					"로그인이 필요한 관리자 전용 서비스입니다.");
			return false;
		}

		// 2. 일반 회원/탈퇴 회원 차단 - 매니저(9) 및 부매니저(8)만 허용 (403 Forbidden)
		Long roleCode = user.getRoleCode();
		boolean isAdmin = CommonCode.ROLE_ADMIN.equals(roleCode) || CommonCode.ROLE_SUB_ADMIN.equals(roleCode);
		if (!isAdmin) {
			log.warn("[AdminAuthInterceptor] 비인가 회원의 관리자 API 접근 차단: loginId={}, roleCode={}, URI={}",
					user.getLoginId(), roleCode, request.getRequestURI());
			writeJsonError(response, HttpServletResponse.SC_FORBIDDEN, "ERR_003",
					"접근 권한이 없습니다. 매니저 또는 부매니저 권한이 필요합니다.");
			return false;
		}

		request.setAttribute(CommonCode.SESSION_LOGIN_USER, user);
		return true;
	}

	private Users resolveUser(HttpServletRequest request) {
		// 1순위: Authorization Bearer JWT 토큰 검증
		String token = JwtProvider.extractToken(request);
		if (token != null && JwtProvider.isValidToken(token)) {
			String tokenLoginId = JwtProvider.getLoginIdFromToken(token);
			if (tokenLoginId != null && userDAO != null) {
				Users user = userDAO.selectUserByLoginId(tokenLoginId);
				if (user != null) {
					return user;
				}
			}
		}

		// 2순위: 세션 loginUserId 확인
		String sessionLoginId = LoginManager.getLoginUserId(request);
		if (sessionLoginId != null && userDAO != null) {
			Users user = userDAO.selectUserByLoginId(sessionLoginId);
			if (user != null) {
				return user;
			}
		}

		// 3순위: 세션의 loginUser 객체 확인
		HttpSession session = request.getSession(false);
		if (session != null) {
			Object sessionObj = session.getAttribute(CommonCode.SESSION_LOGIN_USER);
			if (sessionObj instanceof Users) {
				return (Users) sessionObj;
			}
		}

		return null;
	}

	private void writeJsonError(HttpServletResponse response, int status, String code, String message)
			throws IOException {
		response.setStatus(status);
		response.setContentType("application/json;charset=UTF-8");
		String json = String.format(
				"{\"status\":\"FAIL\",\"code\":\"%s\",\"message\":\"%s\",\"data\":null}",
				code, message);
		response.getWriter().write(json);
		response.getWriter().flush();
	}
}
