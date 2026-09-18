package com.app.util;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

public class LoginManager {
	
	public static final String SESSION_LOGIN_USER_KEY = "loginUserId";
	
	public static void setSessionLoginUserId(HttpSession session, String id) {
		session.setAttribute(SESSION_LOGIN_USER_KEY, id);
	}
	
	public static void setSessionLoginUserId(HttpServletRequest request, String id) {
		setSessionLoginUserId(request.getSession(), id);
	}
	
	public static String getLoginUserId(HttpSession session) {
		if (session == null) return null;
		Object id = session.getAttribute(SESSION_LOGIN_USER_KEY);
		return id != null ? id.toString() : null;
	}
	
	public static String getLoginUserId(HttpServletRequest request) {
		return request != null ? getLoginUserId(request.getSession(false)) : null;
	}
	
	public static boolean isLogin(HttpSession session) {
		return session != null && session.getAttribute(SESSION_LOGIN_USER_KEY) != null;
	}
	
	public static boolean isLogin(HttpServletRequest request) {
		return request != null && isLogin(request.getSession(false));
	}
	
	public static void logout(HttpSession session) {
		if (session != null) {
			session.invalidate();
		}
	}
		
	public static void logout(HttpServletRequest request) {
		if (request != null) {
			logout(request.getSession(false));
		}
	}
}
