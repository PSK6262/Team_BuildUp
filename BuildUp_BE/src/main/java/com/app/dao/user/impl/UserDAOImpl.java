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
	public int countByEmail(String email) {
		return sqlSession.selectOne("UserMapper.countByEmail", email);
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

	@Override
	public int deleteUserRelatedData(Long userId) {
		// 1. 포인트 및 승부예측 데이터 삭제 (게시글 및 댓글은 커뮤니티 맥락 보존을 위해 삭제하지 않음)
		sqlSession.delete("UserMapper.deletePointHistoryByUserId", userId);
		sqlSession.delete("UserMapper.deletePredictionsByUserId", userId);
		sqlSession.delete("UserMapper.deleteUserPredictsByUserId", userId);

		// 2. 커스텀 팀 관련 데이터 연쇄 삭제 (AI 매치 -> 스쿼드 -> 커스텀 팀)
		sqlSession.delete("UserMapper.deleteAiMatchesByUserId", userId);
		sqlSession.delete("UserMapper.deleteCustomSquadsByUserId", userId);
		sqlSession.delete("UserMapper.deleteCustomTeamsByUserId", userId);

		return 1;
	}

	@Override
	public int deleteUser(Long userId) {
		return anonymizeUser(userId);
	}

	@Override
	public int anonymizeUser(Long userId) {
		return sqlSession.update("UserMapper.anonymizeUser", userId);
	}
}
