package com.app.dto.rest;

import com.app.common.ResultCode;
import lombok.Getter;

// API 응답을 코드, 메시지, 데이터로 통일합니다.
@Getter
public class RestApiResponse<T> {
    private final String code;
    private final String message;
    private final T data;

    private RestApiResponse(ResultCode resultCode, T data) {
        this.code = resultCode.getCode();
        this.message = resultCode.getMessage();
        this.data = data;
    }

    // 성공 결과를 반환합니다.
    public static <T> RestApiResponse<T> success(T data) {
        return response(ResultCode.SUCCESS, data);
    }

    // 데이터 없는 성공 결과를 반환합니다.
    public static <T> RestApiResponse<T> success() {
        return success(null);
    }

    // 오류 코드와 메시지를 반환합니다.
    public static <T> RestApiResponse<T> error(ResultCode resultCode) {
        return response(resultCode, null);
    }

    // 지정한 결과 코드와 데이터를 반환합니다.
    public static <T> RestApiResponse<T> response(ResultCode resultCode, T data) {
        return new RestApiResponse<>(resultCode, data);
    }
}
