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
}
