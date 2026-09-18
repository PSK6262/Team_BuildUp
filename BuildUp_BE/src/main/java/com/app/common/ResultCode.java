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
    INVALID_INPUT("REJ_002", "요청값을 확인해주세요."),
    UNAUTHORIZED("REJ_003", "로그인이 필요한 서비스입니다."),
    FORBIDDEN("REJ_004", "접근 권한이 없습니다."),

    // 개인정보 / 유저 / 마이페이지 영역 (REJ_101 ~ REJ_200)
    USER_NOT_FOUND("REJ_101", "사용자 정보를 찾을 수 없습니다."),
    DUPLICATE_LOGIN_ID("REJ_102", "이미 사용 중인 아이디입니다."),
    DUPLICATE_NICKNAME("REJ_103", "이미 사용 중인 닉네임입니다."),
    DUPLICATE_EMAIL("REJ_104", "이미 등록된 이메일입니다."),
    INVALID_PASSWORD("REJ_105", "비밀번호가 일치하지 않습니다."),
    PROFILE_UPDATE_FAIL("REJ_106", "회원 정보 수정에 실패했습니다."),

    // 커뮤니티 영역 (REJ_201 ~ REJ_300)
    POST_NOT_FOUND("REJ_201", "존재하지 않거나 삭제된 게시글입니다."),
    COMMENT_NOT_FOUND("REJ_202", "존재하지 않거나 삭제된 댓글입니다."),
    POST_BLINDED("REJ_203", "블라인드 처리된 게시글입니다."),
    NOT_POST_AUTHOR("REJ_204", "해당 게시글의 작성자만 수정 및 삭제할 수 있습니다."),
    NOT_COMMENT_AUTHOR("REJ_205", "해당 댓글의 작성자만 수정 및 삭제할 수 있습니다."),

    // 승부예측 & 가상대결 영역 (REJ_301 ~ REJ_400)
    MATCH_NOT_FOUND("REJ_301", "대상 경기 일정을 찾을 수 없습니다."),
    PREDICTION_CLOSED("REJ_302", "이미 시작되었거나 종료된 경기는 예측할 수 없습니다."),
    DUPLICATE_PREDICTION("REJ_303", "이미 승부예측에 참여한 경기입니다."),
    INSUFFICIENT_POINTS("REJ_304", "보유 포인트가 부족합니다."),

    // 고객센터 (1:1 문의) 영역 (REJ_401 ~ REJ_500)
    SUPPORT_NOT_FOUND("REJ_401", "문의 내역을 찾을 수 없습니다."),

    // 관리자 전용 영역 (REJ_501 ~ REJ_600)
    CANNOT_MODIFY_OWN_ROLE("REJ_501", "자기 자신의 권한이나 상태는 변경할 수 없습니다.");

    private final String code;
    private final String message;
}
