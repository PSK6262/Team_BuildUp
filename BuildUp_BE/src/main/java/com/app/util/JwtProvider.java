package com.app.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;

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

//JWT 토큰 관련 처리 담당 클래스
public class JwtProvider {
	
	
	//비밀키 설정
	private static final String SECRET_KEY = "thisissecretkeyforjwtreactconnectwithspringserver123456123";
	
	// token 만료시간 설정
	private static final long ACCESS_TOKEN_EXPIRATION = 1000 * 60 * 30; //30분 
	private static final long REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7; // 7일
	
	
	//시크릿키 생성   (비밀키 변환 -> 인코딩 -> 키 생성) 
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
		// "Bearer 토큰값"
		System.out.println(bearerToken);
		
		if( bearerToken != null && bearerToken.startsWith("Bearer ")) {
			return bearerToken.substring(7);
		}
		
		return null;
	}
	
	
}

















