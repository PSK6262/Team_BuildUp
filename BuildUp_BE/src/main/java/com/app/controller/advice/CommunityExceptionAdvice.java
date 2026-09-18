package com.app.controller.advice;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import com.app.common.ApiResponse;
import com.app.common.ResultCode;

// 커뮤니티 API에서 발생한 예외를 공통 응답 형식으로 처리합니다.
@RestControllerAdvice(basePackages = "com.app.controller.community")
public class CommunityExceptionAdvice {
    private static final Logger log = Logger.getLogger(CommunityExceptionAdvice.class.getName());

    // 누락되거나 형식이 잘못된 요청값을 처리합니다.
    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiResponse<Void>> invalidParameter(Exception exception) {
        return ResponseEntity.badRequest().body(ApiResponse.error(ResultCode.INVALID_INPUT));
    }

    // 서비스에서 전달한 HTTP 상태에 맞는 결과 코드를 반환합니다.
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>> invalidRequest(ResponseStatusException exception) {
        ResultCode code;
        if (exception.getStatus() == HttpStatus.BAD_REQUEST) {
            code = ResultCode.INVALID_INPUT;
        } else if (exception.getStatus() == HttpStatus.UNAUTHORIZED) {
            code = ResultCode.COMMUNITY_LOGIN_REQUIRED;
        } else if (exception.getStatus() == HttpStatus.NOT_FOUND) {
            code = "Comment not found".equals(exception.getReason())
                ? ResultCode.COMMUNITY_COMMENT_NOT_FOUND : ResultCode.COMMUNITY_POST_NOT_FOUND;
        } else if (exception.getStatus() == HttpStatus.FORBIDDEN) {
            code = "Comment owner required".equals(exception.getReason())
                ? ResultCode.COMMUNITY_COMMENT_FORBIDDEN : ResultCode.COMMUNITY_POST_FORBIDDEN;
        } else {
            code = ResultCode.FAIL;
        }
        return ResponseEntity.status(exception.getStatus()).body(ApiResponse.error(code));
    }

    // 처리하지 못한 서버 오류를 기록하고 실패 응답을 반환합니다.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> serverError(Exception exception) {
        log.log(Level.SEVERE, "Community API failed", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(ResultCode.FAIL));
    }
}
