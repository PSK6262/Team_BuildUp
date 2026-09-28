package com.app.scheduler;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.app.service.api.GeminiApiService;

import lombok.extern.slf4j.Slf4j;

/**
 * [AI 커뮤니티 유해 게시글 / 욕설 문맥 자동 모더레이션 스케줄러 - CommunityModerationScheduler]
 * 
 * - 5분 주기로 백그라운드에서 자동 실행되어, 최근 등록/수정된 게시글 및 댓글을 일괄(Batch) 검사합니다.
 * - Gemini AI가 문맥을 분석하여 비속어/패드립/성희롱/심한 혐오 표현 발견 시 즉시 IS_BLIND = 'Y'로 자동 제재합니다.
 */
@Slf4j
@Component
public class CommunityModerationScheduler {

	@Autowired
	private GeminiApiService geminiApiService;

	// 5분 간격 (300,000ms) 실행, 서버 기동 1분 후 최초 실행
	@Scheduled(fixedDelay = 300000, initialDelay = 60000)
	public void runAutoModerationBatch() {
		try {
			log.info("[CommunityModerationScheduler] 정기 AI 유해성 모더레이션 배치 시작 (5분 주기)");
			Map<String, Object> result = geminiApiService.inspectAndBlindHarmfulCommunityBatch(30);
			log.info("[CommunityModerationScheduler] 정기 AI 모더레이션 배치 완료: {}", result.get("message"));
		} catch (Exception e) {
			log.warn("[CommunityModerationScheduler] 정기 AI 모더레이션 실행 중 예외 발생: {}", e.getMessage());
		}
	}
}
