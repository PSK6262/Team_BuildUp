package com.app.dao.user;

import com.app.dto.user.Users;

public interface UserDAO {
	int insertUser(Users user);
	int insertUserPredictsInitial(Long userId);
	Users selectUserByLoginId(String loginId);
	Users selectUserByUserId(Long userId);
	int countByLoginId(String loginId);
	int countByNickname(String nickname);
	int updateUser(Users user);
	int updatePassword(Long userId, String newPassword);
}
