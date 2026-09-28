package com.app.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * [SHA-256 단방향 비밀번호 암호화 유틸리티]
 * 1. 사용자별 고유 Salt(loginId) 결합:
 *    - 동일한 비밀번호라도 사용자마다 다른 해시값이 생성되어 레인보우 테이블 공격을 방어합니다.
 * 2. 키 스트레칭 (Key Stretching):
 *    - 해시 연산을 1,000번 반복 실행하여 해커의 초고속 무차별 대입(Brute-force) 연산을 지연시킵니다.
 * 3. 기존 단일 파라미터 encrypt(String text)와의 하위 호환성 유지.
 */
public class SHA256Encryptor {

	// 시스템 기본 솔트
	private static final String SYSTEM_SALT = "sha256encsalt";

	// 키 스트레칭 반복 횟수 (1,000회 반복 해싱)
	private static final int STRETCH_COUNT = 1000;

	/**
	 * [신규 권장 방식] 사용자 고유 식별자(loginId)를 Salt로 결합하고 1,000회 키 스트레칭 적용
	 * 
	 * @param rawPassword 평문 비밀번호
	 * @param loginId 사용자 로그인 아이디 (사용자별 고유 Salt 역할)
	 * @return 암호화된 최종 해시 문자열
	 */
	public static String encrypt(String rawPassword, String loginId) {
		if (rawPassword == null || rawPassword.isEmpty()) {
			return null;
		}

		// 1단계: 비밀번호 + 사용자별 고유 Salt(loginId) + 시스템 Salt 결합
		// 두 사용자가 같은 "1234" 비밀번호를 써도 loginId가 다르면 결과가 완전히 달라집니다.
		String userSalt = (loginId != null) ? loginId.trim().toLowerCase() : "";
		String combinedText = rawPassword + "_" + userSalt + "_" + SYSTEM_SALT;

		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			byte[] hashBytes = combinedText.getBytes(StandardCharsets.UTF_8);

			// 2단계: 키 스트레칭 (Key Stretching) - 해시 결과를 1,000번 반복 해싱하여 무차별 대입 방어
			for (int i = 0; i < STRETCH_COUNT; i++) {
				md.reset();
				hashBytes = md.digest(hashBytes);
			}

			// 3단계: byte 배열을 16진수 문자열로 변환하여 반환
			return bytesToHex(hashBytes);

		} catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("SHA-256 암호화 알고리즘 초기화 실패", e);
		}
	}

	/**
	 * [기존 호환용] 단일 문자열 암호화 (기존 가입자 비밀번호 검증용)
	 */
	public static String encrypt(String text) {
		if (text == null) return null;
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			String combined = text + SYSTEM_SALT;
			md.update(combined.getBytes(StandardCharsets.UTF_8));
			return bytesToHex(md.digest());
		} catch (NoSuchAlgorithmException e) {
			throw new RuntimeException("SHA-256 암호화 알고리즘 초기화 실패", e);
		}
	}

	private static String bytesToHex(byte[] cs) {
		StringBuilder sb = new StringBuilder();
		for (byte b : cs) {
			sb.append(String.format("%02x", b));
		}
		return sb.toString();
	}
}			
