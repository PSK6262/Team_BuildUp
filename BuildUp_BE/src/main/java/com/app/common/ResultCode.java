package com.app.common;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

// API 응답 코드와 메시지를 관리합니다.
@Getter
@RequiredArgsConstructor
public enum ResultCode {
	//성공:SUC_ 으로 시작, 실패:REJ_ 으로 시작
    SUCCESS("SUC_001", "성공"),
    SUC_EMPTY("SUC_002", "성공했으나 비어있음"),
    FAIL("REJ_001", "요청 처리 중 오류가 발생했습니다."),
    INVALID_INPUT("REJ_002", "요청값을 확인해주세요.");
    
    //개인정보 영역(로그인,회원가입 마이페이지... REJ_101~200까지 사용)
	
	
	//커뮤니티 영역(REJ_201~300)

    private final String code;
    private final String message;
}
