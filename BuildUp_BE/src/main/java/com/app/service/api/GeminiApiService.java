package com.app.service.api;

import java.util.Map;

/**
 * [Gemini AI 축구 데이터 한글 번역 및 구단 역사 생성 서비스]
 * - Google Gemini 1.5 Flash 모델 연동
 * - 20개 구단 한글명, 홈구장 한글명, 역사(3~4문장) 자동 생성
 * - 코칭스태프(감독) 한글명, 국적 번역
 * - 500여 명 선수단 한글명, 국적 일괄 번역
 */
public interface GeminiApiService {

	// 프리미어리그 질문에 대한 챗봇 답변을 생성합니다.
	String answerEplQuestion(String question, String pagePath);

	/**
	 * 20개 구단 한글 명칭, 홈 경기장 한글 명칭 및 구단 역사 일괄 생성 및 DB 적재
	 * @return 갱신된 구단 수
	 */
	int syncTeamsKoreanAndHistory();

	/**
	 * 코칭스태프(감독 등) 한글 이름 및 국적 일괄 번역 및 DB 적재
	 * @return 갱신된 스태프 수
	 */
	int syncStaffsKorean();

	/**
	 * 특정 구단의 소속 선수단 한글 이름 및 국적 번역 및 DB 적재
	 * @param teamId 구단 식별자
	 * @return 갱신된 선수 수
	 */
	int syncPlayersKoreanByTeamId(Long teamId);

	/**
	 * 전체 20개 구단의 모든 선수단(약 500명) 일괄 번역 및 DB 적재
	 * @return 갱신된 총 선수 수
	 */
	int syncAllPlayersKorean();

	/**
	 * 20개 구단 공식 유튜브 응원가(Anthem) 일괄 DB 적재
	 * @return 갱신된 구단 수
	 */
	int syncAllTeamAnthems();

	/**
	 * 전체 한글화 및 역사 생성 작업 일괄 비동기 실행 (구단 -> 스태프 -> 선수단)
	 * @return 작업 시작 상태 맵
	 */
	Map<String, Object> syncAllKoreanDataAsync();

	/**
	 * 깨지거나 누락된 구단 엠블럼을 AI로 자동 탐색하여 공식 투명 PNG 엠블럼으로 복구 및 DB 적재
	 * @return 갱신된 구단 수
	 */
	int syncBrokenTeamEmblemsWithAI();

	/**
	 * 특정 구단 선수들의 세부 포지션(CB, LB, RB, CDM, CAM, CM, LM, RM, ST, LW, RW 등) Gemini AI 정밀 판별 및 DB 적재
	 * @param teamId 구단 식별자
	 * @return 갱신된 선수 수
	 */
	int syncPlayersDetailPositionsByTeamId(Long teamId);

	/**
	 * 전체 20개 구단 모든 선수단의 세부 포지션 Gemini AI 정밀 판별 및 DB 일괄 적재
	 * @return 갱신된 총 선수 수
	 */
	int syncAllPlayersDetailPositions();

	/**
	 * 사용자의 프리미어리그(EPL) 관련 질문에 대해 Gemini AI를 통해 친절하고 전문적인 답변을 생성합니다.
	 * @param question 사용자 질문
	 * @param pagePath 현재 사용자가 접속 중인 페이지 경로 (맥락 참조용)
	 * @return Gemini AI 축구 전문 답변
	 */
	String answerEplQuestion(String question, String pagePath);
}
