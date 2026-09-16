package com.app.service.api;

import java.util.List;
import com.app.dto.team.Players;

public interface FootballApiService {
	public String fetchPremierLeagueFixtures();
	
	public String fetchTeamData(Long teamId);
	
	public String fetchAllTeamsData();
	
	public List<Players> syncTeamPlayers(Long teamId);
	
	public int syncAllPremierLeagueTeamsAndPlayers();

	public int syncPremierLeagueSeasonMatches(Integer season);

	public int syncMatchesByDate(java.time.LocalDate date);

	public int fillBackNumbersAsync(Long teamId);
}
