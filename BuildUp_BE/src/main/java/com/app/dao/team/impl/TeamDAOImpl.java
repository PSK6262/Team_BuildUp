package com.app.dao.team.impl;

import java.util.List;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.team.TeamDAO;
import com.app.dto.team.Players;
import com.app.dto.team.Teams;

@Repository
public class TeamDAOImpl implements TeamDAO {

	private final SqlSessionTemplate sqlSession;

	@Autowired
	public TeamDAOImpl(SqlSessionTemplate sqlSession) {
		this.sqlSession = sqlSession;
	}

	@Override
	public void mergeTeam(Teams team) {
		sqlSession.insert("TeamMapper.mergeTeam", team);
	}

	@Override
	public void mergePlayer(Players player) {
		sqlSession.insert("TeamMapper.mergePlayer", player);
	}

	@Override
	public void mergePlayerStats(Long playerId) {
		sqlSession.insert("TeamMapper.mergePlayerStats", playerId);
	}

	@Override
	public List<Players> findPlayersByTeamId(Long teamId) {
		return sqlSession.selectList("TeamMapper.selectPlayersByTeamId", teamId);
	}

	@Override
	public Teams findTeamById(Long teamId) {
		return sqlSession.selectOne("TeamMapper.selectTeamById", teamId);
	}

	@Override
	public List<Teams> findAllTeams() {
		return sqlSession.selectList("TeamMapper.selectAllTeams");
	}

	@Override
	public List<Players> findPlayersWithNullBackNumber(Long teamId) {
		return sqlSession.selectList("TeamMapper.selectPlayersWithNullBackNumber", teamId);
	}

	@Override
	public void updatePlayerBackNumber(Long playerId, Long backNumber) {
		sqlSession.update("TeamMapper.updatePlayerBackNumber", java.util.Map.of(
			"playerId", playerId,
			"backNumber", backNumber
		));
	}
}
