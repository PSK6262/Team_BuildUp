package com.app.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;

/**
 * 사용자 행동 IP 로그 유틸리티
 * CRUD 등 주요 행동 시 IP + 사용자 정보를 기록합니다.
 */
public class UserActivityLogger {

    private static final Logger log = LoggerFactory.getLogger(UserActivityLogger.class);

    /**
     * IP 추출 - Render 등 Reverse Proxy 환경에서는 X-Forwarded-For 헤더 우선
     */
    public static String extractIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
            // X-Forwarded-For는 "실제IP, 프록시IP, ..." 형태일 수 있음
            ip = ip.split(",")[0].trim();
        } else {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }

    /**
     * 사용자 행동 로그 기록
     *
     * @param request  HttpServletRequest
     * @param action   행동 설명 (예: "게시글 작성", "로그인", "예측 등록")
     * @param loginId  로그인 사용자 ID (비로그인이면 "anonymous")
     */
    public static void log(HttpServletRequest request, String action, Object loginId) {
        String ip = extractIp(request);
        String userId = (loginId != null) ? loginId.toString() : "anonymous";
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String query = request.getQueryString();
        String fullUri = (query != null) ? uri + "?" + query : uri;

        log.info("[USER_ACTIVITY] action={} | ip={} | userId={} | method={} | uri={}",
                action, ip, userId, method, fullUri);
    }
}
