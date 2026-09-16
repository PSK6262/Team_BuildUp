package com.app.service.team.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.team.TeamDAO;
import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Teams;
import com.app.service.team.TeamService;

@Service
public class TeamServiceImpl implements TeamService {

	private final TeamDAO teamDAO;

	@Autowired
	public TeamServiceImpl(TeamDAO teamDAO) {
		this.teamDAO = teamDAO;
	}

	@Override
	public List<Players> getPlayersByTeamId(Long teamId) {
		return teamDAO.findPlayersByTeamId(teamId);
	}

	@Override
	public Teams getTeamById(Long teamId) {
		return teamDAO.findTeamById(teamId);
	}

	@Override
	public List<Teams> getAllTeams() {
		return teamDAO.findAllTeams();
	}

	@Override
	public List<Staffs> getStaffsByTeamId(Long teamId) {
		return teamDAO.findStaffsByTeamId(teamId);
	}

	@Override
	public TeamStats getTeamStats(Long teamId, Integer season) {
		return teamDAO.findTeamStats(teamId, season);
	}

	@Override
	public List<TeamStats> getTeamStatsHistory(Long teamId) {
		return teamDAO.findTeamStatsHistory(teamId);
	}

	@Override
	public List<TeamStats> getTeamStandings(Integer season) {
		return teamDAO.findAllTeamStandings(season);
	}

	@Override
	public List<PlayerStats> getTopScorers(Integer limit) {
		return teamDAO.findTopScorers(limit);
	}

	@Override
	public PlayerStats getPlayerStats(Long playerId) {
		return teamDAO.findPlayerStats(playerId);
	}
}
