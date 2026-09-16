package com.app.service.team;

import java.util.List;
import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Teams;

public interface TeamService {
	List<Players> getPlayersByTeamId(Long teamId);
	Teams getTeamById(Long teamId);
	List<Teams> getAllTeams();
	List<Staffs> getStaffsByTeamId(Long teamId);
	TeamStats getTeamStats(Long teamId, Integer season);
	List<TeamStats> getTeamStatsHistory(Long teamId);
	List<TeamStats> getTeamStandings(Integer season);
	List<PlayerStats> getTopScorers(Integer limit);
	PlayerStats getPlayerStats(Long playerId);
}
