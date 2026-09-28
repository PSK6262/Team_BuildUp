package com.app.util.api;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * [Gemini 프롬프트 템플릿 빌더 - GeminiPromptBuilder]
 * 
 * - 도메인별(커뮤니티 유해성 모더레이션, 구단 역사, 선수 번역, 세부 포지션 등) Gemini 프롬프트 텍스트 조립을 전담합니다.
 */
@Component
public class GeminiPromptBuilder {

	private final ObjectMapper objectMapper;

	public GeminiPromptBuilder() {
		this.objectMapper = new ObjectMapper();
	}

	/**
	 * 커뮤니티 게시글 및 댓글 일괄 유해성 검증 프롬프트 생성
	 * 
	 * @param items 검사 대상 글/댓글 목록 (type: 'POST'|'COMMENT', id, text)
	 * @return Gemini 질의용 구조화 프롬프트
	 */
	public String buildCommunityModerationPrompt(List<Map<String, Object>> items) {
		String itemsJson = "[]";
		try {
			itemsJson = objectMapper.writeValueAsString(items);
		} catch (Exception e) {
			// ignore
		}

		return """
			당신은 온라인 축구 커뮤니티의 엄격하고 공정한 AI 콘텐츠 모더레이터입니다.
			제공된 게시글 및 댓글 목록을 분석하여, 서비스 운영 정책을 위반하는 유해 콘텐츠를 찾아내세요.
			
			[유해 콘텐츠 판정 기준 (위반 대상)]
			1. 비속어, 심한 욕설, 저속한 비하 발언이 포함된 문맥
			2. 특정 선수, 감독, 타 회원에 대한 도를 넘은 인신공격, 모욕, 패드립
			3. 성희롱, 음란성 표현, 불법 도박/스팸 홍보
			4. 지역 비하, 혐오 표현, 맹목적인 악성 비난
			(단, 축구 경기력에 대한 단순 비판, 아쉬움 표현, 건전한 응원/토론은 정상으로 통과시키세요.)
			
			[검사 대상 데이터]
			%s
			
			[반드시 지켜야 할 응답 JSON 스키마]
			위반한 항목만 골라 아래 JSON 포맷으로만 응답하세요. 위반 항목이 없으면 "flaggedItems": [] 로 응답하세요.
			{
			  "flaggedItems": [
			    {
			      "type": "POST 또는 COMMENT",
			      "id": 123,
			      "reason": "위반 사유 요약 (예: 심한 욕설 및 선수 비하 문맥 포함)"
			    }
			  ]
			}
			""".formatted(itemsJson);
	}

	/**
	 * 20개 구단 한글명 및 역사 생성 프롬프트
	 */
	public String buildTeamsKoreanAndHistoryPrompt(List<Map<String, Object>> teams) {
		String teamsJson = "[]";
		try {
			teamsJson = objectMapper.writeValueAsString(teams);
		} catch (Exception e) {}

		return """
			프리미어리그 구단 정보를 한국어로 정제하세요.
			구단명, 홈경기장, 그리고 구단 역사 요약(3~4문장)을 작성하세요.
			
			[대상 구단 목록]
			%s
			
			[응답 JSON 스키마]
			{
			  "teams": [
			    {
			      "teamId": 57,
			      "teamNameKor": "아스널",
			      "stadiumKor": "에미레이츠 스타디움",
			      "history": "1886년 창단된 런던의 명문 구단입니다..."
			    }
			  ]
			}
			""".formatted(teamsJson);
	}

	/**
	 * 선수 세부 포지션 판별 프롬프트
	 */
	public String buildDetailPositionPrompt(String teamName, List<Map<String, Object>> players) {
		String playersJson = "[]";
		try {
			playersJson = objectMapper.writeValueAsString(players);
		} catch (Exception e) {}

		return """
			다음 프리미어리그 [%s] 구단 선수들의 주 포지션(대분류)을 바탕으로,
			실제 경기에서 주로 뛰는 세부 포지션(CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST, CF, GK)을 판별하세요.
			
			[선수 목록]
			%s
			
			[응답 JSON 스키마]
			{
			  "positions": [
			    {
			      "playerId": 123,
			      "detailPosition": "ST"
			    }
			  ]
			}
			""".formatted(teamName, playersJson);
	}
}
