package com.app.dao.user;

import java.util.List;
import java.util.Map;

import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.prediction.PointHistory;
import com.app.dto.user.Users;

public interface UserDAO {
	int insertUser(Users user);
	int insertUserPredictsInitial(Long userId);
	Users selectUserByLoginId(String loginId);
	Users selectUserByUserId(Long userId);
	int countByLoginId(String loginId);
	int countByNickname(String nickname);
	int countByEmail(String email);
	int updateUser(Users user);
	int updatePassword(Long userId, String newPassword);
	int deleteUserRelatedData(Long userId);
	int deleteUser(Long userId);
	int anonymizeUser(Long userId);

	// 마이페이지 활동 내역
	List<Posts> selectUserPosts(Map<String, Object> params);
	int countUserPosts(Long userId);

	List<Comments> selectUserComments(Map<String, Object> params);
	int countUserComments(Long userId);

	List<Posts> selectUserLikedPosts(Map<String, Object> params);
	int countUserLikedPosts(Long userId);

	List<PointHistory> selectUserPointHistories(Long userId);
}
