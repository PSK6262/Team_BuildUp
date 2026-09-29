package com.app.dao.prediction;

import java.util.List;
import java.util.Map;

import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.prediction.Predictions;
import com.app.dto.team.TeamStats;
import com.app.dto.user.UserPredicts;

public interface PredictionDAO {

	Matches selectMatchForOdds(Long matchId);

	TeamStats selectTeamStatsForOdds(Map<String, Object> params);

	Predictions selectUserPrediction(Map<String, Object> params);

	Long selectUserPoint(Long userId);

	int insertPrediction(Predictions prediction);

	int updateUserPoint(Map<String, Object> params);

	int insertPointHistory(PointHistory pointHistory);

	List<Predictions> selectPredictionsByUserId(Long userId);

	Map<String, Object> selectMatchVoteStats(Long matchId);

	List<Predictions> selectPendingPredictionsByMatchId(Long matchId);

	int updatePredictionSettlement(Predictions prediction);

	int updatePredictionChoice(Predictions prediction);

	int mergeUserPredicts(Map<String, Object> params);

	List<UserPredicts> selectTopPredictors();
}
