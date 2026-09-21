package com.app.service.user;

import com.app.dto.user.Users;

public interface UserMailService {
	// 회원가입 완료 인증 링크 발송
	void sendSignupVerificationLink(Users pendingUser);

	// 회원가입 인증 링크 검증 및 정식 회원 생성
	Users confirmSignup(String authKey);

	// 가입 환영 웰컴 메일 발송
	void sendWelcomeMail(String userEmail, String nickname);

	// 회원 탈퇴 완료 안내 메일 발송
	void sendWithdrawalMail(String userEmail, String nickname);

	// 비밀번호 재설정 메일 발송
	void sendPasswordReset(String userEmail);

	// 비밀번호 재설정 인증키 유효성 검사
	boolean verifyResetAuthKey(String email, String authKey);
}
