package com.app.dao.prediction.impl;

import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.prediction.PredictionDAO;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.prediction.Predictions;
import com.app.dto.team.TeamStats;
import com.app.dto.user.UserPredicts;

@Repository
public class PredictionDAOImpl implements PredictionDAO {

	private static final String NAMESPACE = "com.app.dao.prediction.PredictionDAO.";

	@Autowired
	private SqlSessionTemplate sqlSession;

	@Override
	public Matches selectMatchForOdds(Long matchId) {
		return sqlSession.selectOne(NAMESPACE + "selectMatchForOdds", matchId);
	}

	@Override
	public TeamStats selectTeamStatsForOdds(Map<String, Object> params) {
		return sqlSession.selectOne(NAMESPACE + "selectTeamStatsForOdds", params);
	}

	@Override
	public Predictions selectUserPrediction(Map<String, Object> params) {
		return sqlSession.selectOne(NAMESPACE + "selectUserPrediction", params);
	}

	@Override
	public Long selectUserPoint(Long userId) {
		return sqlSession.selectOne(NAMESPACE + "selectUserPoint", userId);
	}

	@Override
	public int insertPrediction(Predictions prediction) {
		return sqlSession.insert(NAMESPACE + "insertPrediction", prediction);
	}

	@Override
	public int updateUserPoint(Map<String, Object> params) {
		return sqlSession.update(NAMESPACE + "updateUserPoint", params);
	}

	@Override
	public int insertPointHistory(PointHistory pointHistory) {
		return sqlSession.insert(NAMESPACE + "insertPointHistory", pointHistory);
	}

	@Override
	public List<Predictions> selectPredictionsByUserId(Long userId) {
		return sqlSession.selectList(NAMESPACE + "selectPredictionsByUserId", userId);
	}

	@Override
	public Map<String, Object> selectMatchVoteStats(Long matchId) {
		return sqlSession.selectOne(NAMESPACE + "selectMatchVoteStats", matchId);
	}

	@Override
	public List<Predictions> selectPendingPredictionsByMatchId(Long matchId) {
		return sqlSession.selectList(NAMESPACE + "selectPendingPredictionsByMatchId", matchId);
	}

	@Override
	public int updatePredictionSettlement(Predictions prediction) {
		return sqlSession.update(NAMESPACE + "updatePredictionSettlement", prediction);
	}

	@Override
	public int updatePredictionChoice(Predictions prediction) {
		return sqlSession.update(NAMESPACE + "updatePredictionChoice", prediction);
	}

	@Override
	public int mergeUserPredicts(Map<String, Object> params) {
		return sqlSession.insert(NAMESPACE + "mergeUserPredicts", params);
	}

	@Override
	public List<UserPredicts> selectTopPredictors() {
		return sqlSession.selectList(NAMESPACE + "selectTopPredictors");
	}

	@Override
	public UserPredicts selectUserPredictsByUserId(Long userId) {
		return sqlSession.selectOne(NAMESPACE + "selectUserPredictsByUserId", userId);
	}

	@Override
	public Long selectUserTotalHitPoints(Long userId) {
		return sqlSession.selectOne(NAMESPACE + "selectUserTotalHitPoints", userId);
	}

	@Override
	public Integer selectUserPredictionRank(Long userId) {
		return sqlSession.selectOne(NAMESPACE + "selectUserPredictionRank", userId);
	}
}
