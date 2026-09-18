package com.app.common;

/**
 * 프로젝트 전반에서 사용하는 공통 상수 인터페이스
 * - 회원 권한 등급, 세션 키, 승부예측, 블라인드 제재 등
 */
public interface CommonCode {

	// 1. 회원 권한 등급 (USER_ROLES / USERS.ROLE_CODE)
	public static final Long ROLE_USER = 1L;          // 일반 회원
	public static final Long ROLE_ADMIN = 9L;         // 관리자

	// 2. 세션 키 명칭 (Session Attribute Key)
	public static final String SESSION_LOGIN_USER = "loginUser";

	// 3. 블라인드 제재 상태 (POSTS.IS_BLIND, COMMENTS.IS_BLIND)
	public static final String BLIND_YES = "Y";
	public static final String BLIND_NO = "N";

	// 4. 승부예측 선택값 (PREDICTIONS.PREDICT_RESULT)
	public static final String PREDICT_HOME = "HOME";
	public static final String PREDICT_DRAW = "DRAW";
	public static final String PREDICT_AWAY = "AWAY";

	// 5. 승부예측 결과 상태 (PREDICTIONS.IS_SUCCESS)
	public static final String SUCCESS_WIN = "Y";       // 적중
	public static final String SUCCESS_LOSE = "N";      // 미적중
	public static final String SUCCESS_CANCEL = "C";    // 경기 취소/무효
}
