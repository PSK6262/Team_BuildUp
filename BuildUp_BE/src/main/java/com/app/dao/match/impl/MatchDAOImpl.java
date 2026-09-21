package com.app.dao.match.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.match.MatchDAO;
import com.app.dto.match.Matches;
import com.app.dto.match.MatchEvents;

@Repository
public class MatchDAOImpl implements MatchDAO {

	@Autowired
	private SqlSessionTemplate sqlSession;

	@Override
	public void mergeMatch(Matches match) {
		sqlSession.insert("MatchMapper.mergeMatch", match);
	}

	@Override
	public Matches findMatchById(Long matchId) {
		return sqlSession.selectOne("MatchMapper.selectMatchById", matchId);
	}

	@Override
	public List<Matches> findAllMatches() {
		return sqlSession.selectList("MatchMapper.selectAllMatches");
	}

	@Override
	public List<Matches> findMatchesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
		Map<String, Object> paramMap = new HashMap<>();
		paramMap.put("startDate", startDate);
		paramMap.put("endDate", endDate);
		return sqlSession.selectList("MatchMapper.selectMatchesByDateRange", paramMap);
	}

	@Override
	public List<Matches> findUpcomingMatches(Long teamId, LocalDateTime fromDate, int limit) {
		Map<String, Object> params = new HashMap<>();
		params.put("teamId", teamId);
		params.put("fromDate", fromDate);
		params.put("limit", limit);
		return sqlSession.selectList("MatchMapper.selectUpcomingMatches", params);
	}

	@Override
	public List<Matches> findRecentMatches(Long teamId, int limit) {
		Map<String, Object> params = new HashMap<>();
		params.put("teamId", teamId);
		params.put("limit", limit);
		return sqlSession.selectList("MatchMapper.selectRecentMatches", params);
	}

	@Override
	public void insertMatchEvent(MatchEvents event) {
		sqlSession.insert("MatchMapper.insertMatchEvent", event);
	}

	@Override
	public List<MatchEvents> findEventsByMatchId(Long matchId) {
		return sqlSession.selectList("MatchMapper.selectEventsByMatchId", matchId);
	}

	@Override
	public void deleteEventsByMatchId(Long matchId) {
		sqlSession.delete("MatchMapper.deleteEventsByMatchId", matchId);
	}
}

