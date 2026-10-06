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
 * [로그인 회원 전용 API 접근 통제 인터셉터]
 * 비로그인 사용자가 마이페이지/포인트샵 구매 등 회원 전용 API에 접근하려 할 때 차단합니다.
 */
@Component
public class LoginAuthInterceptor implements HandlerInterceptor {

	private static final Logger log = LoggerFactory.getLogger(LoginAuthInterceptor.class);

	@Autowired
	private UserDAO userDAO;

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
			throws Exception {
		if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
			return true;
		}

		Users user = resolveUser(request);
		if (user == null || CommonCode.ROLE_WITHDRAWN.equals(user.getRoleCode())) {
			log.warn("[LoginAuthInterceptor] 비로그인/탈퇴 사용자의 회원 전용 API 접근 차단: URI={}", request.getRequestURI());
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			response.setContentType("application/json;charset=UTF-8");
			response.getWriter().write(
					"{\"status\":\"FAIL\",\"code\":\"ERR_002\",\"message\":\"로그인이 필요한 서비스입니다.\",\"data\":null}");
			response.getWriter().flush();
			return false;
		}

		request.setAttribute(CommonCode.SESSION_LOGIN_USER, user);
		return true;
	}

	private Users resolveUser(HttpServletRequest request) {
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

		String sessionLoginId = LoginManager.getLoginUserId(request);
		if (sessionLoginId != null && userDAO != null) {
			Users user = userDAO.selectUserByLoginId(sessionLoginId);
			if (user != null) {
				return user;
			}
		}

		HttpSession session = request.getSession(false);
		if (session != null) {
			Object sessionObj = session.getAttribute(CommonCode.SESSION_LOGIN_USER);
			if (sessionObj instanceof Users) {
				return (Users) sessionObj;
			}
		}

		return null;
	}
}
