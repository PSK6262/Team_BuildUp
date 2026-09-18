package com.app.dao.user.impl;

import java.util.HashMap;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.user.UserDAO;
import com.app.dto.user.Users;

@Repository
public class UserDAOImpl implements UserDAO {

	@Autowired
	private SqlSessionTemplate sqlSession;

	@Override
	public int insertUser(Users user) {
		return sqlSession.insert("UserMapper.insertUser", user);
	}

	@Override
	public int insertUserPredictsInitial(Long userId) {
		return sqlSession.insert("UserMapper.insertUserPredictsInitial", userId);
	}

	@Override
	public Users selectUserByLoginId(String loginId) {
		return sqlSession.selectOne("UserMapper.selectUserByLoginId", loginId);
	}

	@Override
	public Users selectUserByUserId(Long userId) {
		return sqlSession.selectOne("UserMapper.selectUserByUserId", userId);
	}

	@Override
	public int countByLoginId(String loginId) {
		return sqlSession.selectOne("UserMapper.countByLoginId", loginId);
	}

	@Override
	public int countByNickname(String nickname) {
		return sqlSession.selectOne("UserMapper.countByNickname", nickname);
	}

	@Override
	public int updateUser(Users user) {
		return sqlSession.update("UserMapper.updateUser", user);
	}

	@Override
	public int updatePassword(Long userId, String newPassword) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("newPassword", newPassword);
		return sqlSession.update("UserMapper.updatePassword", params);
	}
}
