package com.app.dao.team;

import java.util.List;
import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Teams;

public interface TeamDAO {
	void mergeTeam(Teams team);
	void mergePlayer(Players player);
	void mergePlayerStats(Long playerId);
	List<Players> findPlayersByTeamId(Long teamId);
	Teams findTeamById(Long teamId);
	List<Teams> findAllTeams();
	// Gemini AI 한글 및 역사 동기화 관련
	void updateTeamKoreanAndHistory(Teams team);
	void updateTeamAnthem(Teams team);
	List<Teams> findTeamsWithBrokenEmblem();
	void updateTeamEmblem(Teams team);
	List<Players> findAllPlayers();
	void updatePlayerKorean(Players player);
	List<Staffs> findAllStaffs();
	void updateStaffKorean(Staffs staff);

	void mergeStaff(Staffs staff);
	List<Staffs> findStaffsByTeamId(Long teamId);
	void ensureStaffRoleExists(Long staffRoleId, String roleName);
	void mergeTeamStats(TeamStats stats);
	TeamStats findTeamStats(Long teamId, Integer season);
	List<TeamStats> findTeamStatsHistory(Long teamId);
	List<TeamStats> findAllTeamStandings(Integer season);
	void mergePlayerGoalsAndAssists(Long playerId, Long goals, Long assists);
	List<PlayerStats> findTopScorers(Integer limit);
	PlayerStats findPlayerStats(Long playerId);
}
