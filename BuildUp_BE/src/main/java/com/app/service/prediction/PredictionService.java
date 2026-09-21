package com.app.service.prediction;

import java.util.List;
import java.util.Map;

import com.app.dto.prediction.Predictions;
import com.app.dto.user.UserPredicts;

public interface PredictionService {

	/**
	 * 특정 경기의 배당률(방안 1: 직전 시즌 순위 폴백) 및 실시간 투표율 조회
	 */
	Map<String, Object> getMatchOdds(Long matchId);

	/**
	 * 승부예측 투표 참여 (무료 1클릭 투표)
	 */
	Map<String, Object> betPrediction(Long userId, Long matchId, String predictResult);

	/**
	 * 회원의 특정 경기 참여 내역 조회
	 */
	Predictions getUserPredictionForMatch(Long userId, Long matchId);

	/**
	 * 회원의 전체 승부예측 참여 목록 조회
	 */
	List<Predictions> getMyPredictions(Long userId);

	/**
	 * 승부예측 적중 랭킹 Top 10 조회
	 */
	List<UserPredicts> getTopPredictors();

	/**
	 * 경기 종료 스코어 기반 승부예측 결과 정산 (배당금 지급 트랜잭션)
	 */
	Map<String, Object> settleMatchPredictions(Long matchId);
}
