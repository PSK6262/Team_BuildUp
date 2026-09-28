package com.app.util.api;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * [Google Gemini REST API 전담 HTTP 클라이언트 - GeminiApiClient]
 * 
 * - 단일 책임 원칙(SRP)에 따라 순수 Gemini API 통신, 인증 헤더 주입,
 *   실패 시 대기 시간을 점차 늘려가며(첫 실패 시 0.5초, 다음 실패 시 1초) 재시도하는 안전한 대기 처리,
 *   그리고 모델 장애 시 다른 모델로 자동 전환(폴백)하는 로직만 전담합니다.
 * - 장애 발생 시 RuntimeException을 던집니다.
 */
@Slf4j
@Component
public class GeminiApiClient {

	public record GeminiCallResult(String text, List<String> sources) {}

	private static final String[] CANDIDATE_MODELS = {
		"gemini-flash-lite-latest",
		"gemini-3.1-flash-lite",
		"gemini-flash-latest"
	};

	private static final String[] SEARCH_CANDIDATES = {
		"gemini-3.1-flash-lite",
		"gemini-flash-latest",
		"gemini-flash-lite-latest"
	};

	private static final int MAX_RETRY_COUNT = 2; // 최대 2회 재시도 (총 3회 시도)
	private static final long INITIAL_BACKOFF_MS = 500; // 첫 실패 시 대기 시간 0.5초(500ms). 실패할 때마다 2배씩 늘려 재시도(0.5초 -> 1초)하여 서버 부하 방지

	@Value("${gemini.api.key}")
	private String apiKey;

	private final HttpClient httpClient;
	private final ObjectMapper objectMapper;

	private volatile String verifiedModel = null;
	private volatile String verifiedSearchModel = null;

	public GeminiApiClient() {
		this.httpClient = HttpClient.newBuilder()
				.connectTimeout(Duration.ofSeconds(15))
				.build();
		this.objectMapper = new ObjectMapper();
	}

	/**
	 * 순수 텍스트/JSON 프롬프트 기반 Gemini 질의 (검색 없음)
	 */
	public String callGemini(String promptText) {
		return callGeminiRequest(promptText, false).text();
	}

	/**
	 * Google Grounding Search 도구를 포함한 최신 정보 질의
	 */
	public GeminiCallResult callGeminiWithSearch(String promptText) {
		return callGeminiRequest(promptText, true);
	}

	/**
	 * Gemini API 호출 핵심 로직 (재시도 및 지수 백오프 적용)
	 */
	private GeminiCallResult callGeminiRequest(String promptText, boolean googleSearch) {
		if (apiKey == null || apiKey.trim().isEmpty() || "apikey".equalsIgnoreCase(apiKey.trim())) {
			throw new IllegalStateException("application.properties에 유효한 gemini.api.key가 설정되지 않았습니다.");
		}

		try {
			// 요청 Body 구성
			Map<String, Object> textPart = Map.of("text", promptText);
			List<Map<String, Object>> parts = List.of(textPart);
			Map<String, Object> contentMap = Map.of("parts", parts);
			List<Map<String, Object>> contents = List.of(contentMap);

			Map<String, Object> genConfig = Map.of("responseMimeType", "application/json");

			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("contents", contents);
			requestBody.put("generationConfig", genConfig);
			if (googleSearch) {
				requestBody.put("tools", List.of(Map.of("google_search", Map.of())));
			}

			String requestJson = objectMapper.writeValueAsString(requestBody);

			String cachedModel = googleSearch ? verifiedSearchModel : verifiedModel;
			String[] modelsToTry = cachedModel != null
					? new String[]{cachedModel}
					: (googleSearch ? SEARCH_CANDIDATES : CANDIDATE_MODELS);

			String lastError = null;
			for (String modelName : modelsToTry) {
				String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent";

				HttpRequest request = HttpRequest.newBuilder()
						.uri(URI.create(apiUrl))
						.header("Content-Type", "application/json; charset=utf-8")
						.header("x-goog-api-key", apiKey.trim())
						.timeout(Duration.ofSeconds(30))
						.POST(HttpRequest.BodyPublishers.ofString(requestJson))
						.build();

				// 재시도 루프
				for (int attempt = 0; attempt <= MAX_RETRY_COUNT; attempt++) {
					try {
						HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

						if (response.statusCode() == 200) {
							if (googleSearch) verifiedSearchModel = modelName;
							else verifiedModel = modelName;

							JsonNode rootNode = objectMapper.readTree(response.body());
							JsonNode candidates = rootNode.path("candidates");
							if (candidates.isArray() && candidates.size() > 0) {
								JsonNode candidate = candidates.get(0);
								for (JsonNode part : candidate.path("content").path("parts")) {
									String text = part.path("text").asText("");
									if (!text.isBlank()) {
										return new GeminiCallResult(text, extractGroundingSources(candidate));
									}
								}
							}
						} else if (response.statusCode() >= 500 || response.statusCode() == 429) {
							lastError = "모델 [" + modelName + "] 서버 일시 장애 (HTTP " + response.statusCode() + ")";
							log.warn("[Gemini API] 시도 {}/{} 실패: {}", attempt + 1, MAX_RETRY_COUNT + 1, lastError);
							if (attempt < MAX_RETRY_COUNT) {
								long sleepMs = INITIAL_BACKOFF_MS * (1L << attempt);
								Thread.sleep(sleepMs);
								continue;
							}
						} else {
							lastError = "모델 [" + modelName + "] 클라이언트 오류 (HTTP " + response.statusCode() + "): " + response.body();
							log.warn("[Gemini API] {}", lastError);
							break; // 4xx 에러는 재시도하지 않고 다음 모델 시도
						}
					} catch (HttpTimeoutException te) {
						lastError = "모델 [" + modelName + "] 타임아웃 발생: " + te.getMessage();
						if (attempt < MAX_RETRY_COUNT) {
							Thread.sleep(INITIAL_BACKOFF_MS * (1L << attempt));
							continue;
						}
					}
				}

				// 캐시된 모델이 실패하면 캐시를 비우고 전체 후보 재시도
				if (cachedModel != null) {
					if (googleSearch) verifiedSearchModel = null;
					else verifiedModel = null;
					return callGeminiRequest(promptText, googleSearch);
				}
			}

			throw new RuntimeException("모든 Gemini AI 모델 호출 실패: " + lastError);

		} catch (InterruptedException ie) {
			Thread.currentThread().interrupt();
			throw new RuntimeException("Gemini API 호출 중 인터럽트가 발생했습니다.");
		} catch (Exception e) {
			throw new RuntimeException("Gemini API 요청 처리 중 예외 발생: " + e.getMessage(), e);
		}
	}

	private List<String> extractGroundingSources(JsonNode candidate) {
		List<String> sources = new ArrayList<>();
		for (JsonNode chunk : candidate.path("groundingMetadata").path("groundingChunks")) {
			JsonNode web = chunk.path("web");
			String uri = web.path("uri").asText("");
			if (uri.isBlank()) continue;
			boolean alreadyExists = false;
			for (String source : sources) {
				if (source.endsWith(uri)) {
					alreadyExists = true;
					break;
				}
			}
			if (alreadyExists) continue;
			sources.add(uri);
		}
		return sources;
	}
}
