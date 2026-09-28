package com.app.dao.user.impl;

import java.util.HashMap;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.user.UserMailDAO;

@Repository
public class UserMailDAOImpl implements UserMailDAO {

	@Autowired
	private SqlSessionTemplate sqlSession;

	@Override
	public void insertSignupAuthKey(String email, String authKey, String payload) {
		Map<String, Object> params = new HashMap<>();
		params.put("email", email);
		params.put("authKey", authKey);
		params.put("payload", payload);
		sqlSession.insert("UserMailMapper.insertSignupAuthKey", params);
	}

	@Override
	public Map<String, Object> selectPendingSignupByAuthKey(String authKey) {
		return sqlSession.selectOne("UserMailMapper.selectPendingSignupByAuthKey", authKey);
	}

	@Override
	public int completeSignupAuth(String authKey) {
		return sqlSession.update("UserMailMapper.completeSignupAuth", authKey);
	}

	@Override
	public void insertPasswordResetAuthKey(String email, String authKey) {
		Map<String, Object> params = new HashMap<>();
		params.put("email", email);
		params.put("authKey", authKey);
		sqlSession.insert("UserMailMapper.insertPasswordResetAuthKey", params);
	}

	@Override
	public boolean checkValidPasswordResetAuthKey(String email, String authKey) {
		Map<String, Object> params = new HashMap<>();
		params.put("email", email);
		params.put("authKey", authKey);
		Integer count = sqlSession.selectOne("UserMailMapper.checkValidPasswordResetAuthKey", params);
		return count != null && count > 0;
	}

	@Override
	public int deleteUsedAuthKey(String authKey) {
		return sqlSession.delete("UserMailMapper.deleteUsedAuthKey", authKey);
	}

	@Override
	public int deleteVerificationsByEmail(String email) {
		return sqlSession.delete("UserMailMapper.deleteVerificationsByEmail", email);
	}

	@Override
	public void insertEmailChangeCode(String email, String code) {
		// 기존 인증코드 먼저 삭제 후 신규 삽입
		sqlSession.delete("UserMailMapper.deleteOldEmailChangeCodes", email);
		Map<String, Object> params = new HashMap<>();
		params.put("email", email);
		params.put("code", code);
		sqlSession.insert("UserMailMapper.insertEmailChangeCode", params);
	}

	@Override
	public boolean checkValidEmailChangeCode(String email, String code) {
		Map<String, Object> params = new HashMap<>();
		params.put("email", email);
		params.put("code", code);
		Integer count = sqlSession.selectOne("UserMailMapper.checkValidEmailChangeCode", params);
		return count != null && count > 0;
	}

	@Override
	public int markEmailChangeVerified(String email) {
		return sqlSession.update("UserMailMapper.markEmailChangeVerified", email);
	}

	@Override
	public boolean isEmailChangeVerified(String email) {
		Integer count = sqlSession.selectOne("UserMailMapper.isEmailChangeVerified", email);
		return count != null && count > 0;
	}
}
