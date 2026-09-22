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

    // 개인정보 / 유저 / 마이페이지 영역
    USER_NOT_FOUND("REJ_101", "사용자 정보를 찾을 수 없습니다."),
    DUPLICATE_LOGIN_ID("REJ_102", "이미 사용 중인 아이디입니다."),
    DUPLICATE_NICKNAME("REJ_103", "이미 사용 중인 닉네임입니다."),
    DUPLICATE_EMAIL("REJ_104", "이미 등록된 이메일입니다."),
    INVALID_PASSWORD("REJ_105", "비밀번호가 일치하지 않습니다."),
    PROFILE_UPDATE_FAIL("REJ_106", "회원 정보 수정에 실패했습니다."),
    INVALID_EMAIL("REJ_107", "올바른 이메일 형식이 아닙니다."),
    INVALID_AUTH_KEY("REJ_108", "인증 링크가 유효하지 않거나 만료되었습니다."),
    EMAIL_SEND_FAIL("REJ_109", "인증 메일 발송에 실패했습니다."),

    // 커뮤니티 로그인 확인 실패
    COMMUNITY_LOGIN_REQUIRED("REJ_201", "로그인이 필요합니다."),
    COMMUNITY_POST_NOT_FOUND("REJ_202", "게시글을 찾을 수 없습니다."),
    COMMUNITY_POST_FORBIDDEN("REJ_203", "작성자만 게시글을 변경할 수 있습니다."),
    COMMUNITY_COMMENT_NOT_FOUND("REJ_204", "댓글을 찾을 수 없습니다."),
    COMMUNITY_COMMENT_FORBIDDEN("REJ_205", "작성자만 댓글을 변경할 수 있습니다."),
    COMMUNITY_COMMENT_TOO_LONG("REJ_206", "댓글은 100자까지 입력할 수 있습니다."),
    COMMUNITY_ATTACHMENT_INVALID("REJ_207", "허용되지 않는 첨부파일입니다."),
    COMMUNITY_ATTACHMENT_LIMIT("REJ_208", "첨부파일은 게시글당 5개까지 등록할 수 있습니다."),
    COMMUNITY_ATTACHMENT_NOT_FOUND("REJ_209", "첨부파일을 찾을 수 없습니다."),
    COMMUNITY_ATTACHMENT_FORBIDDEN("REJ_210", "작성자만 첨부파일을 변경할 수 있습니다."),
    COMMUNITY_ATTACHMENT_TOO_LARGE("REJ_211", "첨부파일 크기 제한을 초과했습니다."),
    COMMUNITY_ATTACHMENT_STORAGE_FAIL("REJ_212", "첨부파일 저장 중 오류가 발생했습니다."),
    COMMUNITY_POST_TOO_LONG("REJ_213", "게시글 내용은 1000자까지 입력할 수 있습니다."),
    COMMUNITY_POST_TITLE_TOO_LONG("REJ_214", "게시글 제목은 50자까지 입력할 수 있습니다.");

    private final String code;
    private final String message;
}
