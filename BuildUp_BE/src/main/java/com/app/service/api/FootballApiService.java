package com.app.service.api;

import java.util.List;
import com.app.dto.team.Players;

public interface FootballApiService {
	public String fetchTeamData(Long teamId);
	
	public String fetchAllTeamsData();
	
	public List<Players> syncTeamPlayers(Long teamId);
	
	public int syncAllPremierLeagueTeamsAndPlayers();

	public int syncPremierLeagueSeasonMatches(Integer season);

	public int syncMatchesByDate(java.time.LocalDate date);

	public int syncMatchesByDateRange(java.time.LocalDate fromDate, java.time.LocalDate toDate);
	
	public int initPremierLeagueStaffs();

	public int syncPremierLeagueStandings(Integer season);

	public int syncRecentThreeSeasonsStandings();

	public int syncPremierLeagueScorers(Integer limit);

	public int syncPremierLeagueCleanSheets(Integer season);
}
