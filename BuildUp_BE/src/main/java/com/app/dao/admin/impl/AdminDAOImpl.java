package com.app.dao.admin.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.admin.AdminDAO;
import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.team.PlayerStats;
import com.app.dto.user.Users;

@Repository
public class AdminDAOImpl implements AdminDAO {

	@Autowired
	private SqlSessionTemplate sqlSession;

	@Override
	public Map<String, Object> selectAdminSummary() {
		return sqlSession.selectOne("AdminMapper.selectAdminSummary");
	}

	@Override
	public List<Matches> selectAdminMatches(Map<String, Object> params) {
		return sqlSession.selectList("AdminMapper.selectAdminMatches", params);
	}

	@Override
	public int updateMatchNotice(Long matchId, String notice) {
		Map<String, Object> params = new HashMap<>();
		params.put("matchId", matchId);
		params.put("notice", notice);
		return sqlSession.update("AdminMapper.updateMatchNotice", params);
	}

	@Override
	public int updateMatchScore(Matches match) {
		return sqlSession.update("AdminMapper.updateMatchScore", match);
	}

	@Override
	public List<PlayerStats> selectPlayersByTeam(Long teamId) {
		return sqlSession.selectList("AdminMapper.selectPlayersByTeam", teamId);
	}

	@Override
	public int mergePlayerStatsInjury(PlayerStats playerStats) {
		return sqlSession.insert("AdminMapper.mergePlayerStatsInjury", playerStats);
	}

	@Override
	public List<PlayerStats> selectInjuredPlayersSummary() {
		return sqlSession.selectList("AdminMapper.selectInjuredPlayersSummary");
	}

	@Override
	public List<Posts> selectAdminPosts(Map<String, Object> params) {
		return sqlSession.selectList("AdminMapper.selectAdminPosts", params);
	}

	@Override
	public int updatePostBlind(Long postId, String isBlind) {
		Map<String, Object> params = new HashMap<>();
		params.put("postId", postId);
		params.put("isBlind", isBlind);
		return sqlSession.update("AdminMapper.updatePostBlind", params);
	}

	@Override
	public int deletePost(Long postId) {
		return sqlSession.update("AdminMapper.deletePost", postId);
	}

	@Override
	public List<Comments> selectAdminComments(Map<String, Object> params) {
		return sqlSession.selectList("AdminMapper.selectAdminComments", params);
	}

	@Override
	public int updateCommentBlind(Long commentId, String isBlind) {
		Map<String, Object> params = new HashMap<>();
		params.put("commentId", commentId);
		params.put("isBlind", isBlind);
		return sqlSession.update("AdminMapper.updateCommentBlind", params);
	}

	@Override
	public List<Users> selectAdminUsers(Map<String, Object> params) {
		return sqlSession.selectList("AdminMapper.selectAdminUsers", params);
	}

	@Override
	public Users selectAdminUserById(Long userId) {
		return sqlSession.selectOne("AdminMapper.selectAdminUserById", userId);
	}

	@Override
	public int updateUserRole(Long userId, Long roleCode) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("roleCode", roleCode);
		return sqlSession.update("AdminMapper.updateUserRole", params);
	}

	@Override
	public int updateUserPoint(Long userId, Long amount) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("amount", amount);
		return sqlSession.update("AdminMapper.updateUserPoint", params);
	}

	@Override
	public int insertPointHistory(PointHistory pointHistory) {
		return sqlSession.insert("AdminMapper.insertPointHistory", pointHistory);
	}

	@Override
	public List<PointHistory> selectRecentPointHistories() {
		return sqlSession.selectList("AdminMapper.selectRecentPointHistories");
	}
}
