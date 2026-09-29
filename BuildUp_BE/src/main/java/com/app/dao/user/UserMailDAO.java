package com.app.dao.user;

import java.util.Map;

public interface UserMailDAO {
	void insertSignupAuthKey(String email, String authKey, String payload);
	Map<String, Object> selectPendingSignupByAuthKey(String authKey);
	int completeSignupAuth(String authKey);

	void insertPasswordResetAuthKey(String email, String authKey);
	boolean checkValidPasswordResetAuthKey(String email, String authKey);
	int deleteUsedAuthKey(String authKey);
	int deleteVerificationsByEmail(String email);

	// 이메일 변경 인증코드 (6자리 숫자, AUTH_TYPE='EMAIL_CHANGE')
	void insertEmailChangeCode(String email, String code);
	boolean checkValidEmailChangeCode(String email, String code);
	int markEmailChangeVerified(String email);
	boolean isEmailChangeVerified(String email);
}
