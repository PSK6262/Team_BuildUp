package com.app.service.team.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.team.TeamDAO;
import com.app.dto.team.Players;
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
}
