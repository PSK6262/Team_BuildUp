package com.app.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * [글로벌 웹 및 CORS 환경 설정 클래스]
 * 1. 컨트롤러마다 @CrossOrigin을 개별 작성하지 않고 이곳에서 중앙 집중 관리합니다.
 * 2. 개발 환경(localhost, 개발자 IP)과 운영 환경 도메인을 application.properties에서 일괄 제어합니다.
 * 3. 와일드카드('*') 대신 허용된 프론트엔드 도메인만 명시하여 보안을 강화하고,
 *    allowCredentials(true)를 활성화하여 쿠키 및 인증 헤더(Authorization)를 정상 전송합니다.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

	// application.properties에서 허용할 프론트엔드 출처 목록을 읽어옵니다 (쉼표 구분)
	@Value("${cors.allowed-origins:http://localhost:5173}")
	private String allowedOrigins;

	@Override
	public void addCorsMappings(CorsRegistry registry) {
		// 1단계: 쉼표(,)로 구분된 허용 도메인 문자열을 분리합니다.
		String[] originArray;
		if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
			originArray = allowedOrigins.split(",");
			for (int i = 0; i < originArray.length; i++) {
				originArray[i] = originArray[i].trim();
			}
		} else {
			originArray = new String[] { "http://localhost:5173" };
		}

		// 2단계: 전체 API 경로(/**)에 대해 안전한 CORS 정책을 등록합니다.
		registry.addMapping("/**")
				.allowedOrigins(originArray) // 와일드카드(*) 대신 지정된 출처만 명시 허용
				.allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
				.allowedHeaders("*")
				.allowCredentials(true) // 인증 토큰 및 쿠키 전송 허용
				.maxAge(3600); // Preflight 요청 1시간 캐싱
	}
}
