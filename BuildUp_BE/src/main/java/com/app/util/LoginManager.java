package com.app.util;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

public class LoginManager {

    private static final String SESSION_KEY_LOGIN_ID = "loginUserId";

    public static void setSessionLoginUserId(HttpServletRequest request, String loginId) {
        if (request != null) {
            HttpSession session = request.getSession();
            session.setAttribute(SESSION_KEY_LOGIN_ID, loginId);
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
