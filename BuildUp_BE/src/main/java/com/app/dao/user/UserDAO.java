package com.app.dao.user;

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
}
