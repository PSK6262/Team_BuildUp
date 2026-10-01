package com.app.util;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

public class LoginManager {

    private static final String SESSION_KEY_LOGIN_ID = "loginUserId";
    private static final String SESSION_KEY_BOOT_ID = "loginBootId";
    private static final int SESSION_TIMEOUT_SECONDS = 30 * 60; // 30분 미활동 시 세션 만료

    public static void setSessionLoginUserId(HttpServletRequest request, String loginId) {
        if (request != null) {
            HttpSession session = request.getSession();
            session.setMaxInactiveInterval(SESSION_TIMEOUT_SECONDS);
            session.setAttribute(SESSION_KEY_LOGIN_ID, loginId);
            session.setAttribute(SESSION_KEY_BOOT_ID, JwtProvider.getServerBootId());
        }
    }

    public static String getLoginUserId(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        HttpSession session = request.getSession(false);
        if (session == null) {
            return null;
        }
        Object bootId = session.getAttribute(SESSION_KEY_BOOT_ID);
        if (!JwtProvider.getServerBootId().equals(bootId)) {
            session.invalidate();
            return null;
        }
        Object loginId = session.getAttribute(SESSION_KEY_LOGIN_ID);
        if (loginId != null) {
            return loginId.toString();
        }
        return null;
    }

    public static void logout(HttpServletRequest request) {
        if (request != null) {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
        }
    }
}
