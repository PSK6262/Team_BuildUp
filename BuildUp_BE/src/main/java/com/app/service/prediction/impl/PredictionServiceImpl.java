package com.app.service.prediction.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.common.CommonCode;
import com.app.dao.prediction.PredictionDAO;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.prediction.Predictions;
import com.app.dto.team.TeamStats;
import com.app.dto.user.UserPredicts;
import com.app.service.prediction.PredictionService;

@Service
public class PredictionServiceImpl implements PredictionService {

	private static final Logger log = LoggerFactory.getLogger(PredictionServiceImpl.class);

	// 처리 상태
	private static final String STATUS_SUCCESS = "SUCCESS";
	private static final String STATUS_SKIPPED = "SKIPPED";

	// 공통 검증 및 안내 메시지
	private static final String MSG_MATCH_NOT_FOUND = "존재하지 않는 경기입니다.";
	private static final String MSG_LOGIN_REQUIRED = "로그인이 필요한 서비스입니다.";
	private static final String MSG_MATCH_ID_REQUIRED = "대상 경기 식별자가 누락되었습니다.";
	private static final String MSG_INVALID_PREDICT_RESULT = "예측 결과는 HOME, DRAW, AWAY 중 하나여야 합니다.";
	private static final String MSG_MATCH_ALREADY_CLOSED = "이미 시작되었거나 종료된 경기에는 예측에 참여할 수 없습니다.";
	private static final String MSG_MATCH_TIME_EXPIRED = "경기 시작 시간이 경과하여 투표가 마감되었습니다.";
	private static final String MSG_MATCH_NOT_FINISHED = "경기가 아직 종료(FINISHED)되지 않아 정산할 수 없습니다.";
	private static final String MSG_SCORE_NOT_CONFIRMED = "경기 최종 스코어가 확정되지 않아 정산할 수 없습니다.";

	@Autowired
	private PredictionDAO predictionDAO;

	@Override
	public Map<String, Object> getMatchOdds(Long matchId) {
		Matches match = predictionDAO.selectMatchForOdds(matchId);
		if (match == null) {
			throw new IllegalArgumentException(MSG_MATCH_NOT_FOUND + " (matchId: " + matchId + ")");
		}

		// 1. 직전 시즌 순위 폴백을 적용한 두 팀의 유효 순위 산출
		TeamStats homeCur = getTeamStats(match.getHomeTeamId(), CommonCode.SEASON_CURRENT);
		TeamStats homePrev = getTeamStats(match.getHomeTeamId(), CommonCode.SEASON_PREV);
		TeamStats awayCur = getTeamStats(match.getAwayTeamId(), CommonCode.SEASON_CURRENT);
		TeamStats awayPrev = getTeamStats(match.getAwayTeamId(), CommonCode.SEASON_PREV);

		int homeRank = getEffectiveRank(homeCur, homePrev);
		int awayRank = getEffectiveRank(awayCur, awayPrev);

		// 2. 난이도 및 언더독 적중 포인트 산출
		Map<String, Object> pointMap = calculateMatchPoints(homeRank, awayRank);

		// 3. 실시간 팬 투표율 집계
		Map<String, Object> voteStats = predictionDAO.selectMatchVoteStats(matchId);
		long totalVotes = extractVoteCount(voteStats, "TOTALVOTES");
		long homeVotes = extractVoteCount(voteStats, "HOMEVOTES");
		long drawVotes = extractVoteCount(voteStats, "DRAWVOTES");
		long awayVotes = extractVoteCount(voteStats, "AWAYVOTES");

		double homeVoteRate = calculateVoteRate(homeVotes, totalVotes);
		double drawVoteRate = calculateVoteRate(drawVotes, totalVotes);
		double awayVoteRate = calculateVoteRate(awayVotes, totalVotes);

		Map<String, Object> response = new HashMap<>();
		response.put("matchId", match.getMatchId());
		response.put("homeTeamId", match.getHomeTeamId());
		response.put("awayTeamId", match.getAwayTeamId());
		response.put("homeTeamName", match.getHomeTeamName());
		response.put("awayTeamName", match.getAwayTeamName());
		response.put("homeTeamNameKor", match.getHomeTeamNameKor());
		response.put("awayTeamNameKor", match.getAwayTeamNameKor());
		response.put("homeEmblemUrl", match.getHomeEmblemUrl());
		response.put("awayEmblemUrl", match.getAwayEmblemUrl());
		response.put("matchDate", match.getMatchDate());
		response.put("status", match.getStatus());

		// 포인트 및 언더독 정보
		response.putAll(pointMap);

		// 투표율 통계
		response.put("totalVotes", totalVotes);
		response.put("homeVotes", homeVotes);
		response.put("drawVotes", drawVotes);
		response.put("awayVotes", awayVotes);
		response.put("homeVoteRate", homeVoteRate);
		response.put("drawVoteRate", drawVoteRate);
		response.put("awayVoteRate", awayVoteRate);

		return response;
	}

	@Override
	@Transactional(rollbackFor = Exception.class)
	public Map<String, Object> betPrediction(Long userId, Long matchId, String predictResult) {
		// 1. 요청 유효성 검증
		if (userId == null) {
			throw new IllegalArgumentException(MSG_LOGIN_REQUIRED);
		}
		if (matchId == null) {
			throw new IllegalArgumentException(MSG_MATCH_ID_REQUIRED);
		}
		if (!CommonCode.PREDICT_HOME.equals(predictResult) 
				&& !CommonCode.PREDICT_DRAW.equals(predictResult) 
				&& !CommonCode.PREDICT_AWAY.equals(predictResult)) {
			throw new IllegalArgumentException(MSG_INVALID_PREDICT_RESULT);
		}

		// 2. 경기 시작 여부 및 상태 검증
		Matches match = predictionDAO.selectMatchForOdds(matchId);
		if (match == null) {
			throw new IllegalArgumentException(MSG_MATCH_NOT_FOUND);
		}
		if (!CommonCode.MATCH_SCHEDULED.equals(match.getStatus()) && !CommonCode.MATCH_TIMED.equals(match.getStatus())) {
			throw new IllegalStateException(MSG_MATCH_ALREADY_CLOSED);
		}
		if (match.getRawMatchDate() != null && match.getRawMatchDate().isBefore(LocalDateTime.now())) {
			throw new IllegalStateException(MSG_MATCH_TIME_EXPIRED);
		}

		// 3. 기존 예측 확인 (동일 선택 시 안내, 다른 선택 시 경기 시작 전 변경 허용)
		Predictions existing = predictionDAO.selectUserPrediction(Map.of("userId", userId, "matchId", matchId));
		if (existing != null && predictResult.equals(existing.getPredictResult())) {
			throw new IllegalStateException("이미 " + getChoiceLabel(predictResult) + "에 투표하셨습니다.");
		}

		// 4. 보상 포인트 확인
		Map<String, Object> oddsInfo = getMatchOdds(matchId);
		long expectedReward;

		if (CommonCode.PREDICT_HOME.equals(predictResult)) {
			expectedReward = (Long) oddsInfo.get("homePoint");
		} else if (CommonCode.PREDICT_DRAW.equals(predictResult)) {
			expectedReward = (Long) oddsInfo.get("drawPoint");
		} else {
			expectedReward = (Long) oddsInfo.get("awayPoint");
		}

		String matchTitle = formatMatchTitle(match);

		// 5. 기존 예측이 있으면 결과 변경, 없으면 신규 등록
		if (existing != null) {
			existing.setPredictResult(predictResult);
			predictionDAO.updatePredictionChoice(existing);

			log.info("[승부예측 변경] 유저 ID: {}, 경기: {}, 변경 선택: {}, 적중 시: {}P",
					userId, matchTitle, predictResult, expectedReward);

			return Map.of(
				"status", STATUS_SUCCESS,
				"message", "승부예측이 '" + getChoiceLabel(predictResult) + "'(으)로 변경되었습니다! (적중 시 +" + expectedReward + "P)",
				"matchId", matchId,
				"predictResult", predictResult,
				"expectedReward", expectedReward
			);
		}

		Predictions prediction = new Predictions();
		prediction.setUserId(userId);
		prediction.setMatchId(matchId);
		prediction.setPredictResult(predictResult);
		predictionDAO.insertPrediction(prediction);

		log.info("[승부예측 투표] 유저 ID: {}, 경기: {}, 선택: {}, 적중 시: {}P",
				userId, matchTitle, predictResult, expectedReward);

		return Map.of(
			"status", STATUS_SUCCESS,
			"message", "승부예측 투표가 완료되었습니다! (적중 시 +" + expectedReward + "P)",
			"matchId", matchId,
			"predictResult", predictResult,
			"expectedReward", expectedReward
		);
	}

	@Override
	public Predictions getUserPredictionForMatch(Long userId, Long matchId) {
		if (userId == null || matchId == null) return null;
		return predictionDAO.selectUserPrediction(Map.of("userId", userId, "matchId", matchId));
	}

	@Override
	public List<Predictions> getMyPredictions(Long userId) {
		if (userId == null) return List.of();
		return predictionDAO.selectPredictionsByUserId(userId);
	}

	@Override
	public List<UserPredicts> getTopPredictors() {
		return predictionDAO.selectTopPredictors();
	}

	@Override
	@Transactional(rollbackFor = Exception.class)
	public Map<String, Object> settleMatchPredictions(Long matchId) {
		Matches match = predictionDAO.selectMatchForOdds(matchId);
		if (match == null) {
			throw new IllegalArgumentException(MSG_MATCH_NOT_FOUND + " (matchId: " + matchId + ")");
		}

		String matchTitle = formatMatchTitle(match);

		if (!CommonCode.MATCH_FINISHED.equals(match.getStatus())) {
			return Map.of(
				"status", STATUS_SKIPPED,
				"message", MSG_MATCH_NOT_FINISHED + " (현재 상태: " + match.getStatus() + ")"
			);
		}

		if (match.getHomeScore() == null || match.getAwayScore() == null) {
			return Map.of(
				"status", STATUS_SKIPPED,
				"message", MSG_SCORE_NOT_CONFIRMED
			);
		}

		// 실제 경기 승/무/패 판정
		String actualResult = determineMatchResult(match.getHomeScore(), match.getAwayScore());

		// 이번 경기의 적중 보상 포인트 산출
		Map<String, Object> pointInfo = getMatchOdds(matchId);
		long reward;
		if (CommonCode.PREDICT_HOME.equals(actualResult)) {
			reward = (Long) pointInfo.get("homePoint");
		} else if (CommonCode.PREDICT_DRAW.equals(actualResult)) {
			reward = (Long) pointInfo.get("drawPoint");
		} else {
			reward = (Long) pointInfo.get("awayPoint");
		}

		List<Predictions> pendingList = predictionDAO.selectPendingPredictionsByMatchId(matchId);
		int successCount = 0;
		int failCount = 0;
		long totalPayout = 0L;

		for (Predictions p : pendingList) {
			boolean isWin = p.getPredictResult().equals(actualResult);

			if (isWin) {
				// 적중 시 보상 포인트 지급
				predictionDAO.updateUserPoint(Map.of("userId", p.getUserId(), "amount", reward));

				Long curPoint = predictionDAO.selectUserPoint(p.getUserId());

				PointHistory history = new PointHistory();
				history.setUserId(p.getUserId());
				history.setPredictionId(p.getPredictionId());
				history.setAmount(reward);
				history.setBalanceAfter(curPoint != null ? curPoint : reward);
				history.setDescription("[승부예측 적중] " + matchTitle + " (" + reward + "P 적중 보상 지급)");
				predictionDAO.insertPointHistory(history);

				// 예측 결과 업데이트 (성공)
				p.setIsSuccess(CommonCode.SUCCESS_WIN);
				predictionDAO.updatePredictionSettlement(p);

				// 누적 전적 갱신 (승수 +1)
				predictionDAO.mergeUserPredicts(Map.of("userId", p.getUserId(), "winIncrement", 1));

				successCount++;
				totalPayout += reward;
			} else {
				// 미적중 (실패)
				p.setIsSuccess(CommonCode.SUCCESS_LOSE);
				predictionDAO.updatePredictionSettlement(p);

				// 누적 전적 갱신 (참여수만 +1)
				predictionDAO.mergeUserPredicts(Map.of("userId", p.getUserId(), "winIncrement", 0));

				failCount++;
			}
		}

		log.info("[승부예측 정산 완료] 경기 ID: {}, 결과: {}, 적중: {}건, 미적중: {}건, 총 지급액: {}P",
				matchId, actualResult, successCount, failCount, totalPayout);

		return Map.of(
			"status", STATUS_SUCCESS,
			"matchId", matchId,
			"actualResult", actualResult,
			"settledCount", pendingList.size(),
			"successCount", successCount,
			"failCount", failCount,
			"totalPayout", totalPayout,
			"message", "경기(" + matchTitle + ") 결과 정산이 완료되었습니다."
		);
	}

	/**
	 * 경기 대진 텍스트 포맷 (Home vs Away)
	 */
	private String formatMatchTitle(Matches match) {
		return match.getHomeTeamName() + " vs " + match.getAwayTeamName();
	}

	/**
	 * 투표수 추출 헬퍼 (null-safe)
	 */
	private long extractVoteCount(Map<String, Object> voteStats, String key) {
		if (voteStats != null && voteStats.get(key) != null) {
			return ((Number) voteStats.get(key)).longValue();
		}
		return 0L;
	}

	/**
	 * 투표율 백분율 계산 헬퍼 (소수점 첫째 자리)
	 */
	private double calculateVoteRate(long votes, long totalVotes) {
		return totalVotes > 0 ? Math.round(((double) votes / totalVotes) * 1000.0) / 10.0 : 0.0;
	}

	/**
	 * 시즌별 구단 전적 조회 헬퍼
	 */
	private TeamStats getTeamStats(Long teamId, int season) {
		return predictionDAO.selectTeamStatsForOdds(Map.of("teamId", teamId, "season", season));
	}

	/**
	 * 구단 유효 순위 추출 헬퍼 (1~20위 범위 보정)
	 */
	private Integer extractValidRank(TeamStats stats) {
		if (stats != null && stats.getCurrentRank() != null && stats.getCurrentRank() > 0) {
			return Math.max(CommonCode.RANK_MIN, Math.min(CommonCode.RANK_MAX, stats.getCurrentRank().intValue()));
		}
		return null;
	}

	/**
	 * 최종 스코어 기반 경기 승/무/패 판정 헬퍼
	 */
	private String determineMatchResult(Long homeScore, Long awayScore) {
		if (homeScore > awayScore) {
			return CommonCode.PREDICT_HOME;
		} else if (homeScore.equals(awayScore)) {
			return CommonCode.PREDICT_DRAW;
		}
		return CommonCode.PREDICT_AWAY;
	}

	/**
	 * [방안 1] 시즌 초반 경기수 부족 시 직전 시즌 순위 폴백
	 */
	private int getEffectiveRank(TeamStats currentStats, TeamStats prevStats) {
		if (currentStats != null && currentStats.getMatchesPlayed() != null 
				&& currentStats.getMatchesPlayed() >= CommonCode.PREDICT_MIN_MATCHES_CURRENT_SEASON) {
			Integer curRank = extractValidRank(currentStats);
			if (curRank != null) {
				return curRank;
			}
		}
		Integer prevRank = extractValidRank(prevStats);
		if (prevRank != null) {
			return prevRank;
		}
		return CommonCode.PREDICT_PROMOTED_TEAM_DEFAULT_RANK;
	}

	/**
	 * 난이도 및 언더독 적중 포인트 산출 (정배 100P, 무승부 150P, 언더독 250P)
	 */
	private Map<String, Object> calculateMatchPoints(int homeRank, int awayRank) {
		long homePoint = CommonCode.PREDICT_POINT_NORMAL;
		long drawPoint = CommonCode.PREDICT_POINT_DRAW;
		long awayPoint = CommonCode.PREDICT_POINT_NORMAL;
		boolean homeUnderdog = false;
		boolean awayUnderdog = false;

		// 순위 4계단 이상 차이나면 언더독(약팀) 보너스 250P 적용
		if (homeRank >= awayRank + CommonCode.PREDICT_UNDERDOG_RANK_GAP) {
			homePoint = CommonCode.PREDICT_POINT_UNDERDOG;
			homeUnderdog = true;
		} else if (awayRank >= homeRank + CommonCode.PREDICT_UNDERDOG_RANK_GAP) {
			awayPoint = CommonCode.PREDICT_POINT_UNDERDOG;
			awayUnderdog = true;
		}

		Map<String, Object> result = new HashMap<>();
		result.put("homeRank", homeRank);
		result.put("awayRank", awayRank);
		result.put("homePoint", homePoint);
		result.put("drawPoint", drawPoint);
		result.put("awayPoint", awayPoint);
		result.put("homeUnderdog", homeUnderdog);
		result.put("awayUnderdog", awayUnderdog);

		return result;
	}

	/**
	 * 승부예측 선택지 표시용 라벨 변환 헬퍼
	 */
	private String getChoiceLabel(String predictResult) {
		if (CommonCode.PREDICT_HOME.equals(predictResult)) return "홈팀 승";
		if (CommonCode.PREDICT_DRAW.equals(predictResult)) return "무승부";
		if (CommonCode.PREDICT_AWAY.equals(predictResult)) return "원정팀 승";
		return predictResult;
	}
}
