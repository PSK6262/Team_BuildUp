package com.app.service.user.impl;

import java.net.InetAddress;

import java.net.UnknownHostException;
import java.sql.Clob;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.user.UserDAO;
import com.app.dao.user.UserMailDAO;
import com.app.dto.user.Users;
import com.app.service.user.UserMailService;
import com.app.util.SHA256Encryptor;
import com.app.util.SendMail;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserMailServiceImpl implements UserMailService {

	/** 백엔드 서버가 실행 중인 컴퓨터의 IP를 런타임에 감지해 프론트 주소 생성 */
	private String getFrontendBaseUrl() {
		try {
			String ip = InetAddress.getLocalHost().getHostAddress();
			return "http://" + ip + ":5173";
		} catch (UnknownHostException e) {
			log.warn("서버 IP 감지 실패, localhost로 대체");
			return "http://localhost:5173";
		}
	}

	@Autowired
	private SendMail sendMail;

	@Autowired
	private UserMailDAO userMailDAO;

	@Autowired
	private UserDAO userDAO;

	private final ObjectMapper objectMapper = new ObjectMapper();

	@Override
	public void sendSignupVerificationLink(Users pendingUser) {
		if (pendingUser == null || pendingUser.getEmail() == null) {
			throw new IllegalArgumentException("회원 정보 및 이메일이 누락되었습니다.");
		}

		String authKey = UUID.randomUUID().toString();

		// 비밀번호 암호화 후 대기 데이터 JSON 직렬화
		Users userToStore = new Users();
		userToStore.setLoginId(pendingUser.getLoginId());
		userToStore.setPassword(SHA256Encryptor.encrypt(pendingUser.getPassword()));
		userToStore.setNickname(pendingUser.getNickname());
		userToStore.setEmail(pendingUser.getEmail());
		userToStore.setFavoriteTeamId(pendingUser.getFavoriteTeamId());

		try {
			String payload = objectMapper.writeValueAsString(userToStore);
			userMailDAO.insertSignupAuthKey(pendingUser.getEmail(), authKey, payload);

			String confirmUrl = getFrontendBaseUrl() + "/plug/signup/confirm?key=" + authKey;
			String title = "[PL:UG] 이메일 인증을 완료하고 회원가입을 마쳐주세요! ⚽";
			String content = "<!DOCTYPE html>"
					+ "<html lang='ko'>"
					+ "<head>"
					+ "    <meta charset='UTF-8'>"
					+ "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
					+ "</head>"
					+ "<body style='margin: 0; padding: 0; background-color: #f4f6f8; font-family: \"Malgun Gothic\", \"Apple SD Gothic Neo\", sans-serif;'>"
					+ "    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #f4f6f8; padding: 40px 10px;'>"
					+ "        <tr>"
					+ "            <td align='center'>"
					+ "                <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); overflow: hidden;'>"
					+ "                    <tr>"
					+ "                        <td style='padding: 30px 40px; background-color: #16744b; text-align: left;'>"
					+ "                            <h1 style='margin: 0; color: #ffffff; font-size: 26px; font-weight: bold; letter-spacing: -1px;'>PL:UG</h1>"
					+ "                            <span style='color: #a7f3d0; font-size: 13px;'>프리미어리그 축구 커뮤니티 & 승부예측</span>"
					+ "                        </td>"
					+ "                    </tr>"
					+ "                    <tr>"
					+ "                        <td style='padding: 40px; color: #333333; font-size: 15px; line-height: 1.6;'>"
					+ "                            <h2 style='margin: 0 0 20px 0; color: #1a1a1a; font-size: 22px; font-weight: bold;'>환영합니다, " + pendingUser.getNickname() + "님! ⚽</h2>"
					+ "                            <p style='margin: 0 0 15px 0;'>축구 팬들의 공간, <strong>PL:UG</strong>에 가입해 주셔서 진심으로 감사드립니다.</p>"
					+ "                            <p style='margin: 0 0 10px 0; color: #dc2626; font-weight: bold;'>⚠️ 해당 인증 링크는 보안을 위해 발송 후 30분 동안만 유효합니다.</p>"
					+ "                            <p style='margin: 0 0 35px 0; color: #555555;'>아래의 <strong>회원가입 완료하기</strong> 버튼을 클릭하시면 이메일 인증이 완료되며 즉시 서비스를 이용하실 수 있습니다.</p>"
					+ "                            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='margin: 30px 0;'>"
					+ "                                <tr>"
					+ "                                    <td align='center'>"
					+ "                                        <a href='" + confirmUrl + "' target='_blank' style='background-color: #16744b; color: #ffffff; padding: 14px 38px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 8px rgba(22, 116, 75, 0.25);'>회원가입 완료하기</a>"
					+ "                                    </td>"
					+ "                                </tr>"
					+ "                            </table>"
					+ "                            <p style='font-size: 13px; color: #888888; margin: 30px 0 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 6px;'>"
					+ "                                ※ 30분이 지나 링크가 만료된 경우 회원가입을 다시 진행해 주셔야 합니다.<br>"
					+ "                                ※ 본인이 요청하지 않은 가입 메일인 경우 본 메일을 무시하셔도 됩니다."
					+ "                            </p>"
					+ "                            <p style='margin: 35px 0 0 0; color: #555555;'>감사합니다.<br><strong style='color: #1a1a1a;'>PL:UG 팀</strong></p>"
					+ "                        </td>"
					+ "                    </tr>"
					+ "                    <tr>"
					+ "                        <td style='padding: 25px 40px; background-color: #fafafa; border-top: 1px solid #eeeeee; text-align: left;'>"
					+ "                            <p style='margin: 0 0 6px 0; font-size: 12px; color: #999999; line-height: 1.4;'>"
					+ "                                본 메일은 시스템에 의해 자동으로 발송되는 발신전용 메일입니다."
					+ "                            </p>"
					+ "                            <p style='margin: 0; font-size: 11px; color: #b0b0b0;'>"
					+ "                                © PL:UG (BUILDUP). All rights reserved."
					+ "                            </p>"
					+ "                        </td>"
					+ "                    </tr>"
					+ "                </table>"
					+ "            </td>"
					+ "        </tr>"
					+ "    </table>"
					+ "</body>"
					+ "</html>";

			boolean sent = sendMail.send(pendingUser.getEmail(), title, content);
			if (sent) {
				log.info("[UserMailServiceImpl] 가입 인증 메일 발송 성공 -> 이메일: {}, authKey: {}", pendingUser.getEmail(), authKey);
			} else {
				log.warn("[UserMailServiceImpl] 가입 인증 메일 발송 실패 -> 이메일: {}", pendingUser.getEmail());
			}

		} catch (Exception e) {
			log.error("[UserMailServiceImpl] 가입 인증 처리 중 오류: {}", e.getMessage(), e);
			throw new RuntimeException("가입 인증 메일 생성 중 오류가 발생했습니다.", e);
		}
	}

	@Override
	@Transactional
	public Users confirmSignup(String authKey) {
		if (authKey == null || authKey.trim().isEmpty()) {
			throw new IllegalArgumentException("인증키가 누락되었습니다.");
		}

		Map<String, Object> record = userMailDAO.selectPendingSignupByAuthKey(authKey.trim());
		if (record == null) {
			throw new IllegalArgumentException("인증 링크가 올바르지 않습니다.");
		}

		Object payloadObj = record.get("PAYLOAD");
		String payloadStr = null;
		if (payloadObj instanceof Clob) {
			payloadStr = clobToString((Clob) payloadObj);
		} else if (payloadObj != null) {
			payloadStr = String.valueOf(payloadObj);
		}

		if (payloadStr == null || payloadStr.trim().isEmpty()) {
			throw new IllegalStateException("가입 정보가 손상되었습니다.");
		}

		Users user;
		try {
			user = objectMapper.readValue(payloadStr, Users.class);
		} catch (Exception e) {
			throw new IllegalStateException("가입 정보 역직렬화 실패", e);
		}

		String isVerified = String.valueOf(record.get("IS_VERIFIED"));

		// 이미 인증 완료된 키인 경우 (중복 요청 or 브라우저 새로고침 시 멱등성 보장)
		if ("Y".equalsIgnoreCase(isVerified)) {
			Users existingUser = userDAO.selectUserByLoginId(user.getLoginId());
			if (existingUser != null) {
				log.info("[UserMailServiceImpl] 이미 가입 완료된 계정 (멱등성 처리) -> userId: {}, loginId: {}",
						existingUser.getUserId(), existingUser.getLoginId());
				return existingUser;
			}
		}

		// 만료 여부 확인
		Object isExpiredObj = record.get("IS_EXPIRED");
		boolean isExpired = false;
		if (isExpiredObj instanceof Number) {
			isExpired = ((Number) isExpiredObj).intValue() == 1;
		}
		if (isExpired) {
			throw new IllegalArgumentException("인증 링크 유효시간(30분)이 만료되었습니다. 회원가입을 다시 진행해주세요.");
		}

		// 중복 재확인
		if (userDAO.countByLoginId(user.getLoginId()) > 0) {
			throw new IllegalStateException("이미 가입된 아이디입니다.");
		}
		if (userDAO.countByNickname(user.getNickname()) > 0) {
			throw new IllegalStateException("이미 사용 중인 닉네임입니다.");
		}

		// 정식 회원 등록
		userDAO.insertUser(user);
		userDAO.insertUserPredictsInitial(user.getUserId());

		// 인증 완료 처리
		userMailDAO.completeSignupAuth(authKey.trim());

		log.info("[UserMailServiceImpl] 회원가입 최종 완료 -> userId: {}, loginId: {}", user.getUserId(), user.getLoginId());

		// 웰컴 메일 발송
		try {
			sendWelcomeMail(user.getEmail(), user.getNickname());
		} catch (Exception e) {
			log.warn("[UserMailServiceImpl] 웰컴 메일 발송 실패 (가입 완료에는 영향 없음): {}", e.getMessage());
		}

		return user;
	}

	@Override
	public void sendWelcomeMail(String userEmail, String nickname) {
		String title = "[PL:UG] 웰컴 탑승 완료! PL:UG에 오신 것을 환영합니다! 🏆";
		String content = "<!DOCTYPE html>"
				+ "<html lang='ko'>"
				+ "<head><meta charset='UTF-8'></head>"
				+ "<body style='margin: 0; padding: 0; background-color: #f4f6f8; font-family: \"Malgun Gothic\", sans-serif;'>"
				+ "    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='padding: 40px 10px;'>"
				+ "        <tr><td align='center'>"
				+ "            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;'>"
				+ "                <tr><td style='padding: 30px 40px; background-color: #16744b; color: #ffffff;'>"
				+ "                    <h1 style='margin: 0;'>PL:UG</h1>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 40px; color: #333333; line-height: 1.6;'>"
				+ "                    <h2>환영합니다, " + nickname + "님! ⚽</h2>"
				+ "                    <p>PL:UG의 모든 서비스(경기 일정, 승부예측, 커뮤니티)를 지금 바로 이용해보세요!</p>"
				+ "                    <div style='text-align: center; margin: 30px 0;'>"
				+ "                        <a href='" + getFrontendBaseUrl() + "/plug/community' style='background-color: #16744b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;'>커뮤니티 바로가기</a>"
				+ "                    </div>"
				+ "                </td></tr>"
				+ "            </table>"
				+ "        </td></tr>"
				+ "    </table>"
				+ "</body></html>";

		sendMail.send(userEmail, title, content);
	}

	@Override
	public void sendWithdrawalMail(String userEmail, String nickname) {
		String title = "[PL:UG] 회원 탈퇴 처리가 완료되었습니다.";
		String displayName = (nickname != null && !nickname.trim().isEmpty()) ? nickname : "회원";
		String content = "<!DOCTYPE html>"
				+ "<html lang='ko'>"
				+ "<head><meta charset='UTF-8'></head>"
				+ "<body style='margin: 0; padding: 0; background-color: #f4f6f8; font-family: \"Malgun Gothic\", sans-serif;'>"
				+ "    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='padding: 40px 10px;'>"
				+ "        <tr><td align='center'>"
				+ "            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);'>"
				+ "                <tr><td style='padding: 30px 40px; background-color: #334155; color: #ffffff;'>"
				+ "                    <h1 style='margin: 0; font-size: 24px; font-weight: 800;'>PL:UG</h1>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 40px; color: #333333; line-height: 1.7;'>"
				+ "                    <h2 style='font-size: 20px; color: #1e293b; margin-top: 0;'>안녕하세요, " + displayName + "님</h2>"
				+ "                    <p style='color: #4b5563;'>회원님의 요청에 따라 <strong>PL:UG 회원 탈퇴 처리가 안전하게 완료</strong>되었습니다.</p>"
				+ "                    <div style='background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;'>"
				+ "                        <p style='margin: 0 0 8px 0; font-weight: bold; color: #1e293b;'>📌 안내 사항</p>"
				+ "                        <ul style='margin: 0; padding-left: 20px; color: #64748b; font-size: 13px; line-height: 1.6;'>"
				+ "                            <li style='margin-bottom: 4px;'>회원 계정 정보 및 보유 포인트는 비활성화/초기화 처리되었습니다.</li>"
				+ "                            <li style='margin-bottom: 4px;'>작성하신 게시글 및 댓글은 커뮤니티 맥락 유지를 위해 삭제되지 않고 <strong>(탈퇴회원)</strong>으로 보존됩니다.</li>"
				+ "                            <li style='margin-bottom: 4px;'>탈퇴 완료 즉시 계정이 소멸되므로 기존 작성 글/댓글의 수정이나 삭제가 불가능합니다.</li>"
				+ "                            <li style='margin-bottom: 4px;'>동일한 이메일로 재가입이 가능하나, 이전 작성글의 관리 권한은 복구되지 않습니다.</li>"
				+ "                        </ul>"
				+ "                    </div>"
				+ "                    <p style='color: #4b5563;'>그동안 PL:UG를 이용해 주셔서 진심으로 감사드리며, 더 나은 모습으로 다시 만나 뵙기를 기대하겠습니다.</p>"
				+ "                    <div style='text-align: center; margin: 32px 0 10px 0;'>"
				+ "                        <a href='" + getFrontendBaseUrl() + "/plug/' style='background-color: #334155; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;'>PL:UG 홈으로 가기</a>"
				+ "                    </div>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 20px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;'>"
				+ "                    <p style='margin: 0; font-size: 11px; color: #94a3b8;'>© PL:UG (BUILDUP). All rights reserved.</p>"
				+ "                </td></tr>"
				+ "            </table>"
				+ "        </td></tr>"
				+ "    </table>"
				+ "</body></html>";

		sendMail.send(userEmail, title, content);
	}

	@Override
	public void sendPasswordReset(String userEmail) {
		String authKey = UUID.randomUUID().toString();
		userMailDAO.insertPasswordResetAuthKey(userEmail, authKey);

		String resetUrl = getFrontendBaseUrl() + "/plug/reset-password?key=" + authKey + "&email=" + userEmail;
		String title = "[PL:UG] 비밀번호 재설정 안내 메일입니다. 🔑";
		String content = "<!DOCTYPE html>"
				+ "<html lang='ko'>"
				+ "<head><meta charset='UTF-8'></head>"
				+ "<body style='margin: 0; padding: 0; background-color: #f4f6f8; font-family: \"Malgun Gothic\", sans-serif;'>"
				+ "    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='padding: 40px 10px;'>"
				+ "        <tr><td align='center'>"
				+ "            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden;'>"
				+ "                <tr><td style='padding: 30px 40px; background-color: #16744b; color: #ffffff;'>"
				+ "                    <h1 style='margin: 0;'>PL:UG</h1>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 40px; color: #333333; line-height: 1.6;'>"
				+ "                    <h2>비밀번호 재설정 안내 🔑</h2>"
				+ "                    <p>계정의 비밀번호 재설정을 위해 아래 버튼을 클릭해주세요. (10분간 유효)</p>"
				+ "                    <div style='text-align: center; margin: 30px 0;'>"
				+ "                        <a href='" + resetUrl + "' style='background-color: #16744b; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;'>비밀번호 재설정하기</a>"
				+ "                    </div>"
				+ "                </td></tr>"
				+ "            </table>"
				+ "        </td></tr>"
				+ "    </table>"
				+ "</body></html>";

		sendMail.send(userEmail, title, content);
	}

	@Override
	public boolean verifyResetAuthKey(String email, String authKey) {
		return userMailDAO.checkValidPasswordResetAuthKey(email, authKey);
	}

	private String clobToString(Clob clob) {
		if (clob == null) return null;
		try {
			return clob.getSubString(1, (int) clob.length());
		} catch (Exception e) {
			log.error("[UserMailServiceImpl] CLOB 변환 오류", e);
			return null;
		}
	}
}
