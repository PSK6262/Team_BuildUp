package com.app.common;

import lombok.Getter;

/**
 * [외부 API 연동 실패 전용 커스텀 예외 - 질문 11]
 * 
 * 외부 축구 API(football-data.org, BigBallsData 등)와의 HTTP 통신 실패,
 * 상태 코드 오류(429 Too Many Requests, 5xx 서버 에러, 401/403 인증 오류),
 * 응답 시간 초과(Timeout) 등의 장애 상황 발생 시 명확한 에러 원인과 HTTP 상태를 호출부에 전달합니다.
 */
@Getter
public class ExternalApiException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    /** 발생한 HTTP 상태 코드 (예: 429, 500, 502, 504 등) */
    private final int statusCode;

    /** 호출에 실패한 외부 API 엔드포인트 URL */
    private final String endpoint;

    /** 시스템 공통 결과 코드 (ResultCode) */
    private final ResultCode resultCode;

    public ExternalApiException(ResultCode resultCode, String message) {
        super(message);
        this.statusCode = 500;
        this.endpoint = "";
        this.resultCode = resultCode;
    }

    public ExternalApiException(ResultCode resultCode, int statusCode, String endpoint, String message) {
        super(message);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        this.resultCode = resultCode;
    }

    public ExternalApiException(ResultCode resultCode, int statusCode, String endpoint, String message, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        this.resultCode = resultCode;
    }
}
