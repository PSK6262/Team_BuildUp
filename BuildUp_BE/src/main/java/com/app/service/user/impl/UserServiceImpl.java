package com.app.service.user.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.team.TeamDAO;
import com.app.dao.user.UserDAO;
import com.app.dto.team.Teams;
import com.app.dto.user.Users;
import com.app.service.user.UserService;
import com.app.util.SHA256Encryptor;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserServiceImpl implements UserService {

	@Autowired
	private UserDAO userDAO;

	@Autowired
	private TeamDAO teamDAO;

	@Override
	@Transactional
	public Users signup(Users user) {
		if (user == null) {
			throw new IllegalArgumentException("회원 정보가 올바르지 않습니다.");
		}
		if (user.getLoginId() == null || user.getLoginId().trim().isEmpty()) {
			throw new IllegalArgumentException("아이디를 입력해주세요.");
		}
		if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
			throw new IllegalArgumentException("비밀번호를 입력해주세요.");
		}
		if (user.getNickname() == null || user.getNickname().trim().isEmpty()) {
			throw new IllegalArgumentException("닉네임을 입력해주세요.");
		}

		// 아이디 중복 체크
		if (!isLoginIdAvailable(user.getLoginId())) {
			throw new IllegalStateException("이미 사용 중인 아이디입니다.");
		}

		// 닉네임 중복 체크
		if (!isNicknameAvailable(user.getNickname())) {
			throw new IllegalStateException("이미 사용 중인 닉네임입니다.");
		}

		// 비밀번호 SHA-256 암호화
		String encryptedPassword = SHA256Encryptor.encrypt(user.getPassword());
		user.setPassword(encryptedPassword);

		// 기본 권한(1: 일반회원) 및 가입 포인트(100) 설정
		user.setRoleCode(1L);
		user.setPoint(100L);

		// 선호 구단 유효성 검증 및 더미 번호(1~20) 자동 실구단 ID 변환
		user.setFavoriteTeamId(resolveRealTeamId(user.getFavoriteTeamId()));

		// 회원 저장
		userDAO.insertUser(user);

		// 승부예측 전적 초기화 레코드 생성
		if (user.getUserId() != null) {
			userDAO.insertUserPredictsInitial(user.getUserId());
		}

		log.info("[회원가입 완료] userId={}, loginId={}, nickname={}", user.getUserId(), user.getLoginId(), user.getNickname());

		// 보안을 위해 비밀번호 제거 후 반환
		user.setPassword(null);
		return user;
	}

	@Override
	public Users login(String loginId, String password) {
		if (loginId == null || loginId.trim().isEmpty() || password == null || password.trim().isEmpty()) {
			throw new IllegalArgumentException("아이디와 비밀번호를 모두 입력해주세요.");
		}

		Users user = userDAO.selectUserByLoginId(loginId.trim());
		if (user == null) {
			throw new IllegalArgumentException("존재하지 않는 아이디입니다.");
		}

		String encryptedInputPassword = SHA256Encryptor.encrypt(password);
		if (!encryptedInputPassword.equals(user.getPassword())) {
			throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
		}

		// 보안을 위해 비밀번호는 null 처리하여 반환
		user.setPassword(null);
		log.info("[로그인 성공] userId={}, loginId={}", user.getUserId(), user.getLoginId());
		return user;
	}

	@Override
	public boolean isLoginIdAvailable(String loginId) {
		if (loginId == null || loginId.trim().isEmpty()) {
			return false;
		}
		return userDAO.countByLoginId(loginId.trim()) == 0;
	}

	@Override
	public boolean isNicknameAvailable(String nickname) {
		if (nickname == null || nickname.trim().isEmpty()) {
			return false;
		}
		return userDAO.countByNickname(nickname.trim()) == 0;
	}

	@Override
	public Users getUserProfile(Long userId) {
		if (userId == null) {
			return null;
		}
		Users user = userDAO.selectUserByUserId(userId);
		if (user != null) {
			user.setPassword(null);
		}
		return user;
	}

	@Override
	@Transactional
	public Users updateUserProfile(Users user) {
		if (user == null || user.getUserId() == null) {
			throw new IllegalArgumentException("수정할 회원 식별자가 없습니다.");
		}
		user.setFavoriteTeamId(resolveRealTeamId(user.getFavoriteTeamId()));
		userDAO.updateUser(user);
		return getUserProfile(user.getUserId());
	}

	@Override
	@Transactional
	public boolean changePassword(Long userId, String currentPassword, String newPassword) {
		if (userId == null || currentPassword == null || newPassword == null) {
			return false;
		}
		Users user = userDAO.selectUserByUserId(userId);
		if (user == null) {
			return false;
		}

		String encryptedCurrent = SHA256Encryptor.encrypt(currentPassword);
		if (!encryptedCurrent.equals(user.getPassword())) {
			throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
		}

		String encryptedNew = SHA256Encryptor.encrypt(newPassword);
		userDAO.updatePassword(userId, encryptedNew);
		return true;
	}

	/**
	 * 선호 구단 식별자 유효성 검증 (실제 DB TEAMS 테이블에 존재하는지 확인)
	 */
	private Long resolveRealTeamId(Long inputTeamId) {
		if (inputTeamId == null) return null;

		// 실제 DB에 등록된 구단인지 검증
		Teams team = teamDAO.findTeamById(inputTeamId);
		if (team != null) {
			return inputTeamId;
		}

		log.warn("[구단 ID 검증 실패] DB에 존재하지 않는 구단 식별자: {} -> null 처리", inputTeamId);
		return null;
	}
}
