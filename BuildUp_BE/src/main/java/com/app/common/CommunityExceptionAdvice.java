package com.app.common;

import java.util.logging.Level;
import java.util.logging.Logger;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;




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
            if ("Post content too long".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_POST_TOO_LONG;
            } else if ("Comment too long".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_COMMENT_TOO_LONG;
            } else if ("Attachment limit exceeded".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_ATTACHMENT_LIMIT;
            } else if ("Attachment too large".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_ATTACHMENT_TOO_LARGE;
            } else if ("Invalid attachment".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_ATTACHMENT_INVALID;
            } else {
                code = ResultCode.INVALID_INPUT;
            }
        } else if (exception.getStatus() == HttpStatus.UNAUTHORIZED) {
            code = ResultCode.COMMUNITY_LOGIN_REQUIRED;
        } else if (exception.getStatus() == HttpStatus.NOT_FOUND) {
            if ("Comment not found".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_COMMENT_NOT_FOUND;
            } else if ("Attachment not found".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_ATTACHMENT_NOT_FOUND;
            } else {
                code = ResultCode.COMMUNITY_POST_NOT_FOUND;
            }
        } else if (exception.getStatus() == HttpStatus.FORBIDDEN) {
            if ("Comment owner required".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_COMMENT_FORBIDDEN;
            } else if ("Attachment owner required".equals(exception.getReason())) {
                code = ResultCode.COMMUNITY_ATTACHMENT_FORBIDDEN;
            } else {
                code = ResultCode.COMMUNITY_POST_FORBIDDEN;
            }
        } else if ("Attachment storage failed".equals(exception.getReason())) {
            code = ResultCode.COMMUNITY_ATTACHMENT_STORAGE_FAIL;
        } else {
            code = ResultCode.FAIL;
        }
        return ResponseEntity.status(exception.getStatus()).body(ApiResponse.error(code));
    }

    // web.xml의 multipart 요청 크기 제한을 초과한 경우를 처리합니다.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Void>> uploadTooLarge(MaxUploadSizeExceededException exception) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
            .body(ApiResponse.error(ResultCode.COMMUNITY_ATTACHMENT_TOO_LARGE));
    }

    // 처리하지 못한 서버 오류를 기록하고 실패 응답을 반환합니다.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> serverError(Exception exception) {
        log.log(Level.SEVERE, "Community API failed", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.error(ResultCode.FAIL));
    }
}
