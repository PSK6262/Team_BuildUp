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

	// 6. 경기 진행 상태 (MATCHES.STATUS)
	public static final String MATCH_SCHEDULED = "SCHEDULED";
	public static final String MATCH_TIMED = "TIMED";
	public static final String MATCH_FINISHED = "FINISHED";

	// 7. 승부예측 보상 포인트 및 순위 규칙
	public static final long PREDICT_POINT_NORMAL = 100L;
	public static final long PREDICT_POINT_DRAW = 150L;
	public static final long PREDICT_POINT_UNDERDOG = 250L;
	public static final int PREDICT_UNDERDOG_RANK_GAP = 4;
	public static final int PREDICT_MIN_MATCHES_CURRENT_SEASON = 3;
	public static final int PREDICT_PROMOTED_TEAM_DEFAULT_RANK = 19;
	public static final int SEASON_CURRENT = 2026;
	public static final int SEASON_PREV = 2025;
	public static final int RANK_MIN = 1;
	public static final int RANK_MAX = 20;
}
