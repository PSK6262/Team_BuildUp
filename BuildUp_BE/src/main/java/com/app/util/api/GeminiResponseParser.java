package com.app.util.api;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

/**
 * [Gemini 응답 파싱 및 마크다운 클리너 - GeminiResponseParser]
 * 
 * - Gemini API 응답에서 흔히 나타나는 마크다운 코드블록(```json ... ```)을 완벽히 제거
 * - JSON 문자열을 안전하게 JsonNode 또는 DTO List로 역직렬화
 */
@Slf4j
@Component
public class GeminiResponseParser {

	private final ObjectMapper objectMapper;

	public GeminiResponseParser() {
		this.objectMapper = new ObjectMapper();
	}

	/**
	 * 마크다운 백틱 및 공백을 제거하여 순수 JSON 문자열만 추출
	 */
	public String cleanJsonMarkdown(String raw) {
		if (raw == null) return "";
		String trimmed = raw.trim();

		// ```json 또는 ``` 로 감싸진 경우 제거
		if (trimmed.startsWith("```json")) {
			trimmed = trimmed.substring(7);
		} else if (trimmed.startsWith("```")) {
			trimmed = trimmed.substring(3);
		}

		if (trimmed.endsWith("```")) {
			trimmed = trimmed.substring(0, trimmed.length() - 3);
		}

		return trimmed.trim();
	}

	/**
	 * 순수 문자열을 JsonNode 트리로 안전하게 파싱
	 */
	public JsonNode parseJsonTree(String raw) {
		try {
			String cleaned = cleanJsonMarkdown(raw);
			return objectMapper.readTree(cleaned);
		} catch (Exception e) {
			log.warn("[GeminiResponseParser] JSON 트리 파싱 실패: raw={}", raw, e);
			return null;
		}
	}

	/**
	 * JSON 배열 또는 { "items": [...] } 형태에서 특정 클래스 리스트 추출
	 */
	public <T> List<T> parseList(String raw, String arrayKey, Class<T> clazz) {
		List<T> result = new ArrayList<>();
		try {
			JsonNode root = parseJsonTree(raw);
			if (root == null) return result;

			JsonNode targetArray = root;
			if (arrayKey != null && root.has(arrayKey)) {
				targetArray = root.get(arrayKey);
			}

			if (targetArray.isArray()) {
				for (JsonNode itemNode : targetArray) {
					T item = objectMapper.treeToValue(itemNode, clazz);
					if (item != null) {
						result.add(item);
					}
				}
			}
		} catch (Exception e) {
			log.warn("[GeminiResponseParser] 리스트 파싱 실패 (key={}): {}", arrayKey, e.getMessage());
		}
		return result;
	}
}
