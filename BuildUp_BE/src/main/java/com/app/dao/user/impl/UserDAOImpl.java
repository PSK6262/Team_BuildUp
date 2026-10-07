package com.app.dao.user.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.user.UserDAO;
import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.prediction.PointHistory;
import com.app.dto.user.Users;

@Repository
public class UserDAOImpl implements UserDAO {

	@Autowired
	private SqlSessionTemplate sqlSession;

	private volatile boolean nicknameColumnExpanded = false;

	private void ensureNicknameColumnCapacity() {
		if (!nicknameColumnExpanded) {
			nicknameColumnExpanded = true;
			try {
				sqlSession.update("UserMapper.expandUsersNicknameColumn");
			} catch (Exception ignored) {
			}
		}
	}

	@Override
	public int insertUser(Users user) {
		ensureNicknameColumnCapacity();
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
		ensureNicknameColumnCapacity();
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
		// 0. 포인트샵 거래/주문/보관함 데이터 삭제 (외래키 무결성 보장)
		try {
			sqlSession.delete("UserMapper.deletePointTransactionsByUserId", userId);
			sqlSession.delete("UserMapper.deleteItemOrdersByUserId", userId);
			sqlSession.delete("UserMapper.deleteUserInventoryByUserId", userId);
		} catch (Exception ignored) {
		}

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

	@Override
	public List<Posts> selectUserPosts(Map<String, Object> params) {
		return sqlSession.selectList("UserMapper.selectUserPosts", params);
	}

	@Override
	public int countUserPosts(Long userId) {
		Integer count = sqlSession.selectOne("UserMapper.countUserPosts", userId);
		return count != null ? count : 0;
	}

	@Override
	public List<Comments> selectUserComments(Map<String, Object> params) {
		return sqlSession.selectList("UserMapper.selectUserComments", params);
	}

	@Override
	public int countUserComments(Long userId) {
		Integer count = sqlSession.selectOne("UserMapper.countUserComments", userId);
		return count != null ? count : 0;
	}

	@Override
	public List<Posts> selectUserLikedPosts(Map<String, Object> params) {
		return sqlSession.selectList("UserMapper.selectUserLikedPosts", params);
	}

	@Override
	public int countUserLikedPosts(Long userId) {
		Integer count = sqlSession.selectOne("UserMapper.countUserLikedPosts", userId);
		return count != null ? count : 0;
	}

	@Override
	public List<com.app.dto.prediction.PointHistory> selectUserPointHistories(Long userId) {
		return sqlSession.selectList("UserMapper.selectRecentPointHistoriesByUserId", userId);
	}

	@Override
	public int countShopItems() {
		Integer count = sqlSession.selectOne("UserMapper.countShopItems");
		return count != null ? count : 0;
	}

	@Override
	public int insertShopItem(Map<String, Object> item) {
		return sqlSession.insert("UserMapper.insertShopItem", item);
	}

	@Override
	public Map<String, Object> selectShopItemByName(String itemName) {
		return sqlSession.selectOne("UserMapper.selectShopItemByName", itemName);
	}

	@Override
	public List<Map<String, Object>> selectUserInventoryByUserId(Long userId) {
		return sqlSession.selectList("UserMapper.selectUserInventoryByUserId", userId);
	}

	@Override
	public List<Map<String, Object>> selectUserItemOrdersByUserId(Long userId) {
		return sqlSession.selectList("UserMapper.selectUserItemOrdersByUserId", userId);
	}

	@Override
	public int countUserInventoryItem(Long userId, Long itemId) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("itemId", itemId);
		Integer count = sqlSession.selectOne("UserMapper.countUserInventoryItem", params);
		return count != null ? count : 0;
	}

	@Override
	public int deductUserPoint(Long userId, int price) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("price", price);
		return sqlSession.update("UserMapper.deductUserPoint", params);
	}

	@Override
	public int insertUserInventory(Long userId, Long itemId) {
		Map<String, Object> params = new HashMap<>();
		params.put("userId", userId);
		params.put("itemId", itemId);
		return sqlSession.insert("UserMapper.insertUserInventory", params);
	}

	@Override
	public int insertItemOrder(Map<String, Object> order) {
		return sqlSession.insert("UserMapper.insertItemOrder", order);
	}

	@Override
	public int insertPointTransaction(Map<String, Object> tx) {
		return sqlSession.insert("UserMapper.insertPointTransaction", tx);
	}

	@Override
	public int insertShopPointHistory(Map<String, Object> history) {
		return sqlSession.insert("UserMapper.insertShopPointHistory", history);
	}

	@Override
	public int insertPointHistory(PointHistory pointHistory) {
		return sqlSession.insert("UserMapper.insertPointHistory", pointHistory);
	}
}
