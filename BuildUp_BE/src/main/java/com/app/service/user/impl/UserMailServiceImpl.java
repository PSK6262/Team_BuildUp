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

	@org.springframework.beans.factory.annotation.Value("${app.frontend.url:https://psk6262.github.io/Team_BuildUp}")
	private String frontendUrl;

	/** 배포 도메인(기본: GitHub Pages) 프론트엔드 주소 반환 */
	private String getFrontendBaseUrl() {
		if (frontendUrl != null && !frontendUrl.trim().isEmpty()) {
			return frontendUrl.trim().replaceAll("/+$", "");
		}
		return "https://psk6262.github.io/Team_BuildUp";
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

			String confirmUrl = getFrontendBaseUrl() + "/#/plug/signup/confirm?key=" + authKey;
			String title = "[PL:UG] 이메일 인증을 완료하고 회원가입을 마쳐주세요! ⚽";
			String content = "<!DOCTYPE html>"
					+ "<html lang='ko'>"
					+ "<head>"
					+ "    <meta charset='UTF-8'>"
					+ "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>"
					+ "    <title>PL:UG 회원가입 인증</title>"
					+ "</head>"
					+ "<body style='margin: 0; padding: 0; background-color: #0d0b14; font-family: -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", \"Malgun Gothic\", sans-serif;'>"
					+ "    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #0d0b14; padding: 40px 12px;'>"
					+ "        <tr>"
					+ "            <td align='center'>"
					+ "                <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 580px; background-color: #171324; border: 1px solid #2d2442; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);'>"
					+ "                    <tr>"
					+ "                        <td style='padding: 32px 36px; background: linear-gradient(135deg, #221438 0%, #120d22 100%); border-bottom: 1px solid #2c2144; text-align: left;'>"
					+ "                            <table border='0' cellpadding='0' cellspacing='0' width='100%'>"
					+ "                                <tr>"
					+ "                                    <td>"
					+ "                                        <div style='font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #00ff87; text-shadow: 0 0 16px rgba(0, 255, 135, 0.45); font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;'>PL:UG</div>"
					+ "                                        <div style='color: #9d93b8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;'>PREMIER LEAGUE FOOTBALL &amp; COMMUNITY</div>"
					+ "                                    </td>"
					+ "                                    <td align='right' style='vertical-align: middle;'>"
					+ "                                        <span style='background: rgba(0, 255, 135, 0.12); color: #00ff87; border: 1px solid rgba(0, 255, 135, 0.3); padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;'>EMAIL AUTH</span>"
					+ "                                    </td>"
					+ "                                </tr>"
					+ "                            </table>"
					+ "                        </td>"
					+ "                    </tr>"
					+ "                    <tr>"
					+ "                        <td style='padding: 38px 36px; color: #d6d0e6; font-size: 15px; line-height: 1.7;'>"
					+ "                            <h2 style='margin: 0 0 18px 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;'>"
					+ "                                환영합니다, <span style='color: #00ff87;'>" + pendingUser.getNickname() + "</span>님! ⚽"
					+ "                            </h2>"
					+ "                            <p style='margin: 0 0 16px 0; color: #b8b0cc;'>"
					+ "                                프리미어리그 실시간 분석 &amp; 승부예측 커뮤니티 <strong style='color: #ffffff;'>PL:UG</strong>에 가입해 주셔서 감사드립니다."
					+ "                            </p>"
					+ "                            <div style='background-color: #241626; border: 1px solid #732238; border-radius: 8px; padding: 14px 18px; margin: 20px 0; color: #fecdd3; font-size: 13.5px;'>"
					+ "                                ⚠️ <strong>보안 안내:</strong> 본 가입 인증 링크는 발송 시점으로부터 <strong style='color: #ff859b;'>30분 동안만 유효</strong>합니다."
					+ "                            </div>"
					+ "                            <p style='margin: 0 0 28px 0; color: #b8b0cc;'>"
					+ "                                아래의 <strong>회원가입 완료하기</strong> 버튼을 누르시면 이메일 인증이 완료되며 즉시 모든 서비스를 이용하실 수 있습니다."
					+ "                            </p>"
					+ "                            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='margin: 28px 0;'>"
					+ "                                <tr>"
					+ "                                    <td align='center'>"
					+ "                                        <a href='" + confirmUrl + "' target='_blank' style='background: linear-gradient(135deg, #00ff87 0%, #60efff 100%); color: #0d141e; padding: 15px 42px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 4px 20px rgba(0, 255, 135, 0.35); letter-spacing: 0.5px;'>회원가입 완료하기 →</a>"
					+ "                                    </td>"
					+ "                                </tr>"
					+ "                            </table>"
					+ "                            <div style='background-color: #1a162b; border: 1px solid #2d2446; border-radius: 8px; padding: 16px 20px; margin-top: 28px; font-size: 12.5px; color: #8e84a8; line-height: 1.6;'>"
					+ "                                ※ 30분이 지나 링크가 만료된 경우 회원가입을 다시 진행해 주셔야 합니다.<br>"
					+ "                                ※ 버튼이 클릭되지 않는 경우 아래 주소를 복사하여 브라우저에 붙여넣어 주세요.<br>"
					+ "                                <a href='" + confirmUrl + "' style='color: #00ff87; word-break: break-all; text-decoration: underline; font-size: 12px; margin-top: 6px; display: inline-block;'>" + confirmUrl + "</a>"
					+ "                            </div>"
					+ "                            <p style='margin: 28px 0 0 0; color: #8e84a8; font-size: 13.5px;'>"
					+ "                                축구의 모든 순간, Team BUILDUP 드림"
					+ "                            </p>"
					+ "                        </td>"
					+ "                    </tr>"
					+ "                    <tr>"
					+ "                        <td style='padding: 22px 36px; background-color: #100d1a; border-top: 1px solid #201a30; text-align: left;'>"
					+ "                            <p style='margin: 0 0 4px 0; font-size: 11.5px; color: #6b6380; line-height: 1.4;'>"
					+ "                                본 메일은 PL:UG 서비스에 의해 발송된 발신전용 안내 메일입니다."
					+ "                            </p>"
					+ "                            <p style='margin: 0; font-size: 11px; color: #554f68;'>"
					+ "                                © 2026 PL:UG (BUILDUP). All rights reserved."
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

		// 타임존 변환 오차 대비 Java 측 이중 검증: 생성 시각(CREATED_AT) 기준 30분 이내라면 유효한 것으로 보정
		if (isExpired) {
			Object createdAtObj = record.get("CREATED_AT");
			if (createdAtObj instanceof java.util.Date) {
				long elapsed = System.currentTimeMillis() - ((java.util.Date) createdAtObj).getTime();
				if (elapsed >= 0 && elapsed <= 30 * 60 * 1000L) {
					log.info("[UserMailServiceImpl] 타임존 보정 적용: 생성된 지 {}초 경과 -> 정상 유효 인증키로 처리", elapsed / 1000);
					isExpired = false;
				}
			}
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
		String communityUrl = getFrontendBaseUrl() + "/#/plug/community";
		String content = "<!DOCTYPE html>"
				+ "<html lang='ko'>"
				+ "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>PL:UG 가입 완료</title></head>"
				+ "<body style='margin: 0; padding: 0; background-color: #0d0b14; font-family: -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", \"Malgun Gothic\", sans-serif;'>"
				+ "    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #0d0b14; padding: 40px 12px;'>"
				+ "        <tr><td align='center'>"
				+ "            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 580px; background-color: #171324; border: 1px solid #2d2442; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);'>"
				+ "                <tr><td style='padding: 32px 36px; background: linear-gradient(135deg, #221438 0%, #120d22 100%); border-bottom: 1px solid #2c2144; text-align: left;'>"
				+ "                    <div style='font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #00ff87; text-shadow: 0 0 16px rgba(0, 255, 135, 0.45); font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;'>PL:UG</div>"
				+ "                    <div style='color: #9d93b8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;'>WELCOME TO PREMIER LEAGUE FOOTBALL &amp; COMMUNITY</div>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 38px 36px; color: #d6d0e6; font-size: 15px; line-height: 1.7;'>"
				+ "                    <h2 style='margin: 0 0 18px 0; color: #ffffff; font-size: 22px; font-weight: 800;'>환영합니다, <span style='color: #00ff87;'>" + nickname + "</span>님! ⚽</h2>"
				+ "                    <p style='margin: 0 0 16px 0; color: #b8b0cc;'>PL:UG의 정식 회원이 되신 것을 진심으로 환영합니다!</p>"
				+ "                    <p style='margin: 0 0 24px 0; color: #b8b0cc;'>실시간 프리미어리그 경기 일정 및 스코어 분석, 승부예측 랭킹 챌린지, 서포터즈 커뮤니티까지 PL:UG의 모든 축구 콘텐츠를 지금 바로 즐겨보세요.</p>"
				+ "                    <div style='text-align: center; margin: 32px 0;'>"
				+ "                        <a href='" + communityUrl + "' style='background: linear-gradient(135deg, #00ff87 0%, #60efff 100%); color: #0d141e; padding: 14px 38px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 18px rgba(0, 255, 135, 0.35);'>커뮤니티 바로가기 →</a>"
				+ "                    </div>"
				+ "                    <p style='margin: 28px 0 0 0; color: #8e84a8; font-size: 13.5px;'>축구의 모든 순간을 함께하는, Team BUILDUP 드림</p>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 20px 36px; background-color: #100d1a; border-top: 1px solid #201a30; text-align: left;'>"
				+ "                    <p style='margin: 0; font-size: 11px; color: #554f68;'>© 2026 PL:UG (BUILDUP). All rights reserved.</p>"
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
		String mainUrl = getFrontendBaseUrl() + "/#/plug/mainpage";
		String content = "<!DOCTYPE html>"
				+ "<html lang='ko'>"
				+ "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>PL:UG 회원 탈퇴 안내</title></head>"
				+ "<body style='margin: 0; padding: 0; background-color: #0d0b14; font-family: -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", \"Malgun Gothic\", sans-serif;'>"
				+ "    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #0d0b14; padding: 40px 12px;'>"
				+ "        <tr><td align='center'>"
				+ "            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 580px; background-color: #171324; border: 1px solid #2d2442; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);'>"
				+ "                <tr><td style='padding: 32px 36px; background: #1c142b; border-bottom: 1px solid #281f3d; text-align: left;'>"
				+ "                    <div style='font-size: 24px; font-weight: 800; color: #a097ba;'>PL:UG</div>"
				+ "                    <div style='color: #6b6380; font-size: 11px; font-weight: 700; letter-spacing: 1px; margin-top: 4px;'>ACCOUNT WITHDRAWAL NOTICE</div>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 38px 36px; color: #d6d0e6; font-size: 15px; line-height: 1.7;'>"
				+ "                    <h2 style='font-size: 20px; color: #ffffff; margin-top: 0;'>안녕하세요, " + displayName + "님</h2>"
				+ "                    <p style='color: #b8b0cc;'>회원님의 요청에 따라 <strong>PL:UG 회원 탈퇴 처리가 완료</strong>되었습니다.</p>"
				+ "                    <div style='background-color: #1a162b; border: 1px solid #2d2446; border-radius: 8px; padding: 18px 20px; margin: 24px 0;'>"
				+ "                        <p style='margin: 0 0 8px 0; font-weight: bold; color: #e2dcee;'>📌 주요 안내 사항</p>"
				+ "                        <ul style='margin: 0; padding-left: 20px; color: #9d93b8; font-size: 13px; line-height: 1.6;'>"
				+ "                            <li style='margin-bottom: 4px;'>회원 계정 정보 및 보유 포인트는 비활성화/초기화 처리되었습니다.</li>"
				+ "                            <li style='margin-bottom: 4px;'>작성하신 게시글 및 댓글은 커뮤니티 맥락 보존을 위해 <strong>(탈퇴회원)</strong> 명의로 안전하게 보존됩니다.</li>"
				+ "                            <li style='margin-bottom: 4px;'>동일한 이메일로 언제든 재가입이 가능합니다.</li>"
				+ "                        </ul>"
				+ "                    </div>"
				+ "                    <p style='color: #b8b0cc;'>그동안 PL:UG를 이용해 주셔서 진심으로 감사드리며, 더 멋진 서비스로 다시 뵙기를 기대하겠습니다.</p>"
				+ "                    <div style='text-align: center; margin: 30px 0 10px 0;'>"
				+ "                        <a href='" + mainUrl + "' style='background-color: #2b2342; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;'>PL:UG 홈으로 가기</a>"
				+ "                    </div>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 20px 36px; background-color: #100d1a; border-top: 1px solid #201a30; text-align: left;'>"
				+ "                    <p style='margin: 0; font-size: 11px; color: #554f68;'>© 2026 PL:UG (BUILDUP). All rights reserved.</p>"
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

		String resetUrl = getFrontendBaseUrl() + "/#/plug/reset-password?key=" + authKey + "&email=" + userEmail;
		String title = "[PL:UG] 비밀번호 재설정 안내 메일입니다. 🔑";
		String content = "<!DOCTYPE html>"
				+ "<html lang='ko'>"
				+ "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>PL:UG 비밀번호 재설정</title></head>"
				+ "<body style='margin: 0; padding: 0; background-color: #0d0b14; font-family: -apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", \"Malgun Gothic\", sans-serif;'>"
				+ "    <table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color: #0d0b14; padding: 40px 12px;'>"
				+ "        <tr><td align='center'>"
				+ "            <table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width: 580px; background-color: #171324; border: 1px solid #2d2442; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);'>"
				+ "                <tr><td style='padding: 32px 36px; background: linear-gradient(135deg, #221438 0%, #120d22 100%); border-bottom: 1px solid #2c2144; text-align: left;'>"
				+ "                    <div style='font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #00ff87; text-shadow: 0 0 16px rgba(0, 255, 135, 0.45); font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;'>PL:UG</div>"
				+ "                    <div style='color: #9d93b8; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;'>PASSWORD RESET SERVICE</div>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 38px 36px; color: #d6d0e6; font-size: 15px; line-height: 1.7;'>"
				+ "                    <h2 style='margin: 0 0 18px 0; color: #ffffff; font-size: 22px; font-weight: 800;'>비밀번호 재설정 안내 🔑</h2>"
				+ "                    <p style='margin: 0 0 16px 0; color: #b8b0cc;'>회원님의 계정 비밀번호 재설정을 위해 아래 버튼을 클릭해 주세요.</p>"
				+ "                    <div style='background-color: #241626; border: 1px solid #732238; border-radius: 8px; padding: 14px 18px; margin: 20px 0; color: #fecdd3; font-size: 13.5px;'>"
				+ "                        ⚠️ <strong>보안 유의:</strong> 본 재설정 링크는 발송 후 <strong style='color: #ff859b;'>10분 동안만 유효</strong>합니다."
				+ "                    </div>"
				+ "                    <div style='text-align: center; margin: 32px 0;'>"
				+ "                        <a href='" + resetUrl + "' style='background: linear-gradient(135deg, #00ff87 0%, #60efff 100%); color: #0d141e; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 15px; display: inline-block; box-shadow: 0 4px 18px rgba(0, 255, 135, 0.35);'>비밀번호 재설정하기 →</a>"
				+ "                    </div>"
				+ "                    <div style='background-color: #1a162b; border: 1px solid #2d2446; border-radius: 8px; padding: 16px 20px; font-size: 12.5px; color: #8e84a8; line-height: 1.6;'>"
				+ "                        ※ 본인이 요청하지 않은 경우 즉시 고객센터에 문의하시기 바랍니다.<br>"
				+ "                        <a href='" + resetUrl + "' style='color: #00ff87; word-break: break-all; font-size: 12px; margin-top: 6px; display: inline-block;'>" + resetUrl + "</a>"
				+ "                    </div>"
				+ "                </td></tr>"
				+ "                <tr><td style='padding: 20px 36px; background-color: #100d1a; border-top: 1px solid #201a30; text-align: left;'>"
				+ "                    <p style='margin: 0; font-size: 11px; color: #554f68;'>© 2026 PL:UG (BUILDUP). All rights reserved.</p>"
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

	@Override
	public void sendEmailChangeCode(String newEmail, String nickname) {
		// 6자리 숫자 인증코드 생성
		String code = String.format("%06d", (int)(Math.random() * 1_000_000));
		userMailDAO.insertEmailChangeCode(newEmail, code);

		String title = "[PL:UG] 이메일 변경 인증번호를 확인해주세요 ⚽";
		String content = "<!DOCTYPE html>"
				+ "<html lang='ko'>"
				+ "<head><meta charset='UTF-8'><meta name='viewport' content='width=device-width, initial-scale=1.0'><title>PL:UG 이메일 변경 인증번호</title></head>"
				+ "<body style='margin:0;padding:0;background-color:#0d0b14;font-family:-apple-system, BlinkMacSystemFont, \"Apple SD Gothic Neo\", \"Malgun Gothic\", sans-serif;'>"
				+ "<table border='0' cellpadding='0' cellspacing='0' width='100%' style='background-color:#0d0b14;padding:40px 12px;'>"
				+ "<tr><td align='center'>"
				+ "<table border='0' cellpadding='0' cellspacing='0' width='100%' style='max-width:580px;background-color:#171324;border:1px solid #2d2442;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,0.5);overflow:hidden;'>"
				+ "<tr><td style='padding:32px 36px;background:linear-gradient(135deg, #221438 0%, #120d22 100%);border-bottom:1px solid #2c2144;text-align:left;'>"
				+ "<div style='font-size:28px;font-weight:900;letter-spacing:-0.5px;color:#00ff87;text-shadow:0 0 16px rgba(0,255,135,0.45);font-family:-apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif;'>PL:UG</div>"
				+ "<div style='color:#9d93b8;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-top:4px;'>PREMIER LEAGUE FOOTBALL &amp; COMMUNITY</div>"
				+ "</td></tr>"
				+ "<tr><td style='padding:38px 36px;color:#d6d0e6;font-size:15px;line-height:1.7;'>"
				+ "<h2 style='margin:0 0 18px 0;color:#ffffff;font-size:22px;font-weight:800;'>" + nickname + "님, 이메일 변경을 요청하셨습니다.</h2>"
				+ "<p style='margin:0 0 16px 0;color:#b8b0cc;'>아래의 6자리 인증번호를 마이페이지 이메일 변경 확인창에 입력해 주세요.</p>"
				+ "<div style='background-color:#241626;border:1px solid #732238;border-radius:8px;padding:12px 18px;margin:18px 0;color:#fecdd3;font-size:13.5px;'>"
				+ "⚠️ <strong>보안 유의:</strong> 본 인증번호는 발송 후 <strong style='color:#ff859b;'>10분 동안만 유효</strong>합니다."
				+ "</div>"
				+ "<div style='margin:28px 0;padding:24px;background-color:#141020;border:2px dashed #00ff87;border-radius:12px;text-align:center;box-shadow:inset 0 0 20px rgba(0,255,135,0.06);'>"
				+ "<span style='font-size:40px;font-weight:900;letter-spacing:12px;color:#00ff87;text-shadow:0 0 14px rgba(0,255,135,0.5);font-family:monospace;'>" + code + "</span>"
				+ "</div>"
				+ "<div style='background-color:#1a162b;border:1px solid #2d2446;border-radius:8px;padding:16px 20px;font-size:12.5px;color:#8e84a8;line-height:1.6;'>"
				+ "※ 본인이 요청하지 않은 인증 메일인 경우 계정 비밀번호를 즉시 변경해 주시기 바랍니다."
				+ "</div>"
				+ "<p style='margin:28px 0 0 0;color:#8e84a8;font-size:13.5px;'>축구의 모든 순간, Team BUILDUP 드림</p>"
				+ "</td></tr>"
				+ "<tr><td style='padding:20px 36px;background-color:#100d1a;border-top:1px solid #201a30;text-align:left;'>"
				+ "<p style='margin:0;font-size:11px;color:#554f68;'>© 2026 PL:UG (BUILDUP). All rights reserved.</p>"
				+ "</td></tr>"
				+ "</table></td></tr></table>"
				+ "</body></html>";

		boolean sent = sendMail.send(newEmail, title, content);
		if (sent) {
			log.info("[UserMailServiceImpl] 이메일 변경 인증코드 발송 성공 -> 이메일: {}", newEmail);
		} else {
			log.warn("[UserMailServiceImpl] 이메일 변경 인증코드 발송 실패 -> 이메일: {}", newEmail);
			throw new RuntimeException("이메일 발송 실패");
		}
	}

	@Override
	public boolean verifyEmailChangeCode(String newEmail, String code) {
		if (!userMailDAO.checkValidEmailChangeCode(newEmail, code)) {
			return false;
		}
		userMailDAO.markEmailChangeVerified(newEmail);
		return true;
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
