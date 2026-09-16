package com.app.dao.team;

import java.util.List;
import com.app.dto.team.Players;
import com.app.dto.team.Teams;

public interface TeamDAO {
	void mergeTeam(Teams team);
	void mergePlayer(Players player);
	void mergePlayerStats(Long playerId);
	List<Players> findPlayersByTeamId(Long teamId);
	Teams findTeamById(Long teamId);
	List<Teams> findAllTeams();
	List<Players> findPlayersWithNullBackNumber(Long teamId);
	void updatePlayerBackNumber(Long playerId, Long backNumber);
}
