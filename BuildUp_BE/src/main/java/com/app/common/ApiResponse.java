package com.app.common;


import lombok.Getter;

// API 응답을 코드, 메시지, 데이터로 통일합니다.
@Getter
public class ApiResponse<T> {
    private final String code;
    private final String message;
    private final T data;

    private ApiResponse(ResultCode resultCode, T data) {
        this.code = resultCode.getCode();
        this.message = resultCode.getMessage();
        this.data = data;
    }

    // 성공 결과를 반환합니다.
    public static <T> ApiResponse<T> success(T data) {
        return response(ResultCode.SUCCESS, data);
    }

    // 데이터 없는 성공 결과를 반환합니다.
    public static <T> ApiResponse<T> success() {
        return success(null);
    }

    // 오류 코드와 메시지를 반환합니다.
    public static <T> ApiResponse<T> error(ResultCode resultCode) {
        return response(resultCode, null);
    }

    // 지정한 결과 코드와 데이터를 반환합니다.
    public static <T> ApiResponse<T> response(ResultCode resultCode, T data) {
        return new ApiResponse<>(resultCode, data);
    }

    // 프론트엔드 호환용 상태값 ("SUCCESS" / "FAIL")
    public String getStatus() {
        return (code != null && code.startsWith("SUC")) ? "SUCCESS" : "FAIL";
    }
}
