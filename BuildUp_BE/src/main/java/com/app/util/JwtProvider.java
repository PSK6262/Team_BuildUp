package com.app.util;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Properties;

import javax.crypto.SecretKey;
import javax.servlet.http.HttpServletRequest;

import com.app.dto.user.APILogin;
import com.app.dto.user.Users;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;

// JWT 토큰 관련 처리 담당 클래스
public class JwtProvider {
	
	// JWT 서명에 사용할 비밀키 (소스코드에 직접 하드코딩하지 않고 외부 설정에서 안전하게 불러옵니다)
	private static final String SECRET_KEY = loadSecretKey();
	
	// token 만료시간 설정 (30분 슬라이딩 세션 기준)
	private static final long ACCESS_TOKEN_EXPIRATION = 1000L * 60 * 30; // 30분 
	
	/**
	 * 외부 설정(1순위: OS 환경변수, 2순위: application.properties)에서 비밀키를 안전하게 읽어오는 메서드
	 */
	private static String loadSecretKey() {
		// 1단계: 운영체제(OS) 환경변수 'JWT_SECRET'이 등록되어 있는지 확인합니다.
		String envKey = System.getenv("JWT_SECRET");
		if (envKey != null && !envKey.trim().isEmpty()) {
			return envKey.trim();
		}

		// 2단계: 환경변수가 없다면 .gitignore로 보호되는 application.properties 파일에서 'jwt.secret' 값을 읽어옵니다.
		try (InputStream inputStream = JwtProvider.class.getResourceAsStream("/config/application.properties")) {
			if (inputStream != null) {
				Properties properties = new Properties();
				properties.load(inputStream);
				String propKey = properties.getProperty("jwt.secret");
				if (propKey != null && !propKey.trim().isEmpty()) {
					return propKey.trim();
				}
			}
		} catch (Exception e) {
			System.err.println("[JwtProvider] application.properties 로드 중 오류 발생: " + e.getMessage());
		}

		// 3단계: 만약 설정 파일이나 환경변수 모두 누락되었을 때를 대비한 안전 기본값
		return "thisissecretkeyforjwtreactconnectwithspringserver123456123";
	}
	
	// 시크릿키 생성 (비밀키 변환 -> 인코딩 -> 키 생성) 
	private static SecretKey getSigningKey() {
		return Keys.hmacShaKeyFor( SECRET_KEY.getBytes(StandardCharsets.UTF_8) );
	}
	
	/*
	 * AccessToken 생성
	 * 현재 로그인 처리할 사용자의 아이디(loginId)를 기준으로 토큰 생성
	 */
	public static String createAccessToken(String loginId) {
		
		Date now = new Date(System.currentTimeMillis());
		
		// 토큰에 로그인 아이디 저장 (프로젝트 표준 loginId 및 기존 호환 userId 동시 보관)
		Claims claims = Jwts.claims()
							.add("loginId", loginId)
							.add("userId", loginId)
							.build();  
		
		return Jwts.builder()
					.header()
					.add("typ", "JWT")
					.and()
					.subject("accessToken")
					.issuedAt(now)
					.issuer("spring server")
					.expiration(new Date(now.getTime() + ACCESS_TOKEN_EXPIRATION))
					.claims(claims)
					.signWith(getSigningKey(), Jwts.SIG.HS256)
					.compact();
	}
	
	public static String createAccessToken(APILogin apiLogin) {
		return createAccessToken(apiLogin.getLoginId());
	}
	
	public static String createAccessToken(Users user) {
		return createAccessToken(user.getLoginId());
	}
	
	
	
	
	// 토큰의 유효성 검증
	public static boolean isValidToken(String token) {
		
		// return  유효여부 (true/false) 
		// return 상태코드 -> 만료, 위변조, 유효X   
		// 			exception -> throw 
		
		// 인증된 (Authenticated)
		// 만료된 (Expired)
		// 유효하지않다 (Invalid)
		
		//------------------------
		try {
			Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token);
			return true;  //정상적인 토큰 인증 완료
		} catch (MalformedJwtException e) {
			System.out.println("유효하지 않은 토큰: " + e.getMessage());
		} catch (ExpiredJwtException e) {
			System.out.println("만료된 토큰: " + e.getMessage());
		} catch (UnsupportedJwtException e) {
			System.out.println("지원하지 않는 토큰: " + e.getMessage());
		} catch (SignatureException e) {
			System.out.println("서명 예외 토큰: " + e.getMessage());
		} catch (Exception e) {
			System.out.println("토큰 검증 실패: " + e.getMessage());
		}
		
		return false;
	}
	
	
	// 토큰 해석 -> 토큰 claims에 담아둔 로그인 아이디(loginId) 추출
	public static String getLoginIdFromToken(String token) { 
		String loginId = null;
		try {
			Claims claims = Jwts.parser().verifyWith(getSigningKey()).build().parseSignedClaims(token).getPayload();
			loginId = claims.get("loginId", String.class);
			if (loginId == null) {
				loginId = claims.get("userId", String.class);
			}
		} catch (ExpiredJwtException e) {
			System.out.println("만료된 토큰: " + e.getMessage());
		} catch (Exception e) {
			System.out.println("토큰 검증 실패: " + e.getMessage());
		}
		return loginId;
	}
	
	// 기존 getUserIdFromToken 호환용 (getLoginIdFromToken 호출)
	public static String getUserIdFromToken(String token) {
		return getLoginIdFromToken(token);
	}
	
	
	// request 에서 토큰값 추출
	public static String extractToken(HttpServletRequest request) {
		String bearerToken = request.getHeader("Authorization");
		
		if( bearerToken != null && bearerToken.startsWith("Bearer ")) {
			return bearerToken.substring(7);
		}
		
		return null;
	}
	
	
}

















