package com.app.service.user.impl;

import java.util.regex.Pattern;

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

	private static final Pattern EMAIL_PATTERN = Pattern.compile("^[a-zA-Z0-9](?!.*\\.\\.)[a-zA-Z0-9._-]{2,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$");
	private static final Pattern LOGIN_ID_PATTERN = Pattern.compile("^[a-z0-9]{4,20}$");
	private static final Pattern NICKNAME_PATTERN = Pattern.compile("^[\\uAC00-\\uD7A3a-zA-Z0-9]{2,20}$");

	@Autowired
	private UserDAO userDAO;

	@Autowired
	private TeamDAO teamDAO;

	@Autowired
	private com.app.dao.user.UserMailDAO userMailDAO;

	@Autowired
	private com.app.service.user.UserMailService userMailService;

	@Override
	@Transactional
	public Users signup(Users user) {
		if (user == null) {
			throw new IllegalArgumentException("회원 정보가 올바르지 않습니다.");
		}
		if (user.getLoginId() == null || user.getLoginId().trim().isEmpty()) {
			throw new IllegalArgumentException("아이디를 입력해주세요.");
		}
		if (!LOGIN_ID_PATTERN.matcher(user.getLoginId().trim()).matches()) {
			throw new IllegalArgumentException("아이디는 4~20자의 영문 소문자와 숫자만 사용할 수 있습니다.");
		}
		if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
			throw new IllegalArgumentException("비밀번호를 입력해주세요.");
		}
		if (user.getNickname() == null || user.getNickname().trim().isEmpty()) {
			throw new IllegalArgumentException("닉네임을 입력해주세요.");
		}
		if (!NICKNAME_PATTERN.matcher(user.getNickname().trim()).matches()) {
			throw new IllegalArgumentException("닉네임은 2~20자의 한글, 영문, 숫자만 사용할 수 있습니다.");
		}
		if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
			throw new IllegalArgumentException("이메일을 입력해주세요.");
		}
		if (!EMAIL_PATTERN.matcher(user.getEmail().trim()).matches()) {
			throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
		}

		// 아이디 중복 체크
		if (!isLoginIdAvailable(user.getLoginId())) {
			throw new IllegalStateException("이미 사용 중인 아이디입니다.");
		}

		// 닉네임 중복 체크
		if (!isNicknameAvailable(user.getNickname())) {
			throw new IllegalStateException("이미 사용 중인 닉네임입니다.");
		}

		// 이메일 중복 체크
		if (!isEmailAvailable(user.getEmail())) {
			throw new IllegalStateException("이미 등록된 이메일입니다.");
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
	public boolean isEmailAvailable(String email) {
		if (email == null || email.trim().isEmpty()) {
			return false;
		}
		return userDAO.countByEmail(email.trim()) == 0;
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
		if (user.getEmail() != null && !user.getEmail().trim().isEmpty()) {
			if (!EMAIL_PATTERN.matcher(user.getEmail().trim()).matches()) {
				throw new IllegalArgumentException("올바른 이메일 형식이 아닙니다.");
			}
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

	@Override
	@Transactional
	public boolean withdraw(Long userId, String email) {
		if (userId == null) {
			return false;
		}

		// 탈퇴 메일 발송용 정보 사전 확보
		Users user = userDAO.selectUserByUserId(userId);
		String targetEmail = (email != null && !email.trim().isEmpty()) ? email : (user != null ? user.getEmail() : null);
		String nickname = (user != null) ? user.getNickname() : "회원";

		// 1. 회원 연관 데이터 정리 (외래키 제약조건 방지)
		userDAO.deleteUserRelatedData(userId);

		// 2. 회원 기본 레코드 삭제
		int deletedUsers = userDAO.deleteUser(userId);

		// 3. 인증 대기 및 만료 이메일 인증키 삭제 (재가입 테스트 완벽 지원)
		if (targetEmail != null && !targetEmail.trim().isEmpty()) {
			try {
				userMailDAO.deleteVerificationsByEmail(targetEmail.trim());
			} catch (Exception e) {
				log.warn("[UserServiceImpl] 회원탈퇴 중 이메일 인증 내역 삭제 예외 (무시 가능): {}", e.getMessage());
			}
		}

		// 4. 회원 탈퇴 완료 안내 메일 발송
		if (targetEmail != null && !targetEmail.trim().isEmpty() && deletedUsers > 0) {
			try {
				userMailService.sendWithdrawalMail(targetEmail.trim(), nickname);
				log.info("[UserServiceImpl] 회원 탈퇴 안내 메일 발송 완료 -> email: {}", targetEmail);
			} catch (Exception e) {
				log.warn("[UserServiceImpl] 회원 탈퇴 메일 발송 실패 (탈퇴 처리에는 영향 없음): {}", e.getMessage());
			}
		}

		log.info("[UserServiceImpl] 회원 탈퇴 처리 완료 -> userId={}, email={}", userId, targetEmail);
		return deletedUsers > 0;
	}

	@Override
	public Users getUserByLoginId(String loginId) {
		if (loginId == null || loginId.trim().isEmpty()) {
			return null;
		}
		Users user = userDAO.selectUserByLoginId(loginId.trim());
		if (user != null) {
			user.setPassword(null);
		}
		return user;
	}
}
