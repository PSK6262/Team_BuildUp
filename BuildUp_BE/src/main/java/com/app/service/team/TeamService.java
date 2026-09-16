package com.app.service.team;

import java.util.List;
import com.app.dto.team.Players;
import com.app.dto.team.Teams;

public interface TeamService {
	List<Players> getPlayersByTeamId(Long teamId);
	Teams getTeamById(Long teamId);
	List<Teams> getAllTeams();
}
