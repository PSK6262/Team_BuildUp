package com.app.dao.team.impl;

import org.springframework.stereotype.Repository;

import com.app.dao.team.TeamDAO;
import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
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

	@Override
	public void mergeStaff(Staffs staff) {
		sqlSession.insert("TeamMapper.mergeStaff", staff);
	}

	@Override
	public List<Staffs> findStaffsByTeamId(Long teamId) {
		return sqlSession.selectList("TeamMapper.selectStaffsByTeamId", teamId);
	}

	@Override
	public void ensureStaffRoleExists(Long staffRoleId, String roleName) {
		sqlSession.insert("TeamMapper.ensureStaffRoleExists", java.util.Map.of(
			"staffRoleId", staffRoleId,
			"roleName", roleName
		));
	}

	@Override
	public void mergeTeamStats(TeamStats stats) {
		sqlSession.insert("TeamMapper.mergeTeamStats", stats);
	}

	@Override
	public TeamStats findTeamStats(Long teamId, Integer season) {
		java.util.Map<String, Object> params = new java.util.HashMap<>();
		params.put("teamId", teamId);
		params.put("season", season);
		return sqlSession.selectOne("TeamMapper.selectTeamStatsByTeamAndSeason", params);
	}

	@Override
	public List<TeamStats> findTeamStatsHistory(Long teamId) {
		return sqlSession.selectList("TeamMapper.selectTeamStatsHistoryByTeamId", teamId);
	}

	@Override
	public List<TeamStats> findAllTeamStandings(Integer season) {
		return sqlSession.selectList("TeamMapper.selectAllTeamStandings", season);
	}

	@Override
	public void mergePlayerGoalsAndAssists(Long playerId, Long goals, Long assists) {
		java.util.Map<String, Object> params = new java.util.HashMap<>();
		params.put("playerId", playerId);
		params.put("goals", goals);
		params.put("assists", assists);
		sqlSession.insert("TeamMapper.mergePlayerGoalsAndAssists", params);
	}

	@Override
	public List<PlayerStats> findTopScorers(Integer limit) {
		return sqlSession.selectList("TeamMapper.selectTopScorers", limit);
	}

	@Override
	public PlayerStats findPlayerStats(Long playerId) {
		return sqlSession.selectOne("TeamMapper.selectPlayerStatsByPlayerId", playerId);
	}
}
