package com.app.util;			
			
import java.security.MessageDigest;			
import java.security.NoSuchAlgorithmException;			
			
public class SHA256Encryptor {			
			
	// 암호화 복호화		
	// Encrypt Decrypt		
	// 암호화 : 평문 -> 암호문		
	// 복호화 : 암호문 -> 평문		
			
	// Encode Decode		
	private static final String ENC_SALT = "sha256encsalt"; // 옵션		
			
	public static String encrypt(String text) {
		if (text == null) return null;
		try {
			MessageDigest md = MessageDigest.getInstance("SHA-256");
			text = text + ENC_SALT; // salt 는 옵션
			md.update(text.getBytes());
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
