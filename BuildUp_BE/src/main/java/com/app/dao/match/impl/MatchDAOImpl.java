package com.app.dao.match.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.match.MatchDAO;
import com.app.dto.match.Matches;

@Repository
public class MatchDAOImpl implements MatchDAO {

	private final SqlSessionTemplate sqlSession;

	@Autowired
	public MatchDAOImpl(SqlSessionTemplate sqlSession) {
		this.sqlSession = sqlSession;
	}

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
		return sqlSession.selectList("MatchMapper.selectMatchesByDateRange", Map.of(
			"startDate", startDate,
			"endDate", endDate
		));
	}
}
