package com.app.dao.team.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import com.app.dao.team.TeamDAO;
import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Teams;

@Repository
public class TeamDAOImpl implements TeamDAO {

	@Autowired
	private SqlSessionTemplate sqlSession;

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
	public void updateTeamKoreanAndHistory(Teams team) {
		sqlSession.update("TeamMapper.updateTeamKoreanAndHistory", team);
	}

	@Override
	public void updateTeamAnthem(Teams team) {
		sqlSession.update("TeamMapper.updateTeamAnthem", team);
	}

	@Override
	public List<Players> findAllPlayers() {
		return sqlSession.selectList("TeamMapper.selectAllPlayers");
	}

	@Override
	public void updatePlayerKorean(Players player) {
		sqlSession.update("TeamMapper.updatePlayerKorean", player);
	}

	@Override
	public List<Staffs> findAllStaffs() {
		return sqlSession.selectList("TeamMapper.selectAllStaffs");
	}

	@Override
	public void updateStaffKorean(Staffs staff) {
		sqlSession.update("TeamMapper.updateStaffKorean", staff);
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
		Map<String, Object> params = new HashMap<>();
		params.put("staffRoleId", staffRoleId);
		params.put("roleName", roleName);
		sqlSession.insert("TeamMapper.ensureStaffRoleExists", params);
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
