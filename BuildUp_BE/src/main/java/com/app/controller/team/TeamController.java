package com.app.controller.team;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.team.Players;
import com.app.dto.team.Teams;
import com.app.service.api.FootballApiService;
import com.app.service.team.TeamService;

@RestController
@RequestMapping({"/api/teams", "/teams"})
public class TeamController {

	private final TeamService teamService;
	private final FootballApiService footballApiService;

	@Autowired
	public TeamController(TeamService teamService, FootballApiService footballApiService) {
		this.teamService = teamService;
		this.footballApiService = footballApiService;
	}

	// 1. 프리미어리그 전체 구단 및 소속 선수 전체 일괄 DB 저장 (동기화)
	// 예: GET /api/teams/sync-all
	@GetMapping("/sync-all")
	public Map<String, Object> syncAllTeams() {
		System.out.println("========== [프리미어리그 전체 구단 및 선수 일괄 동기화 시작] ==========");
		int totalPlayers = footballApiService.syncAllPremierLeagueTeamsAndPlayers();
		System.out.println("동기화 완료: 총 " + totalPlayers + "명의 선수가 DB에 저장되었습니다.");
		System.out.println("===============================================================");

		return Map.of(
			"status", "SUCCESS",
			"message", "프리미어리그 20개 구단 및 전체 선수 데이터가 성공적으로 DB에 저장되었습니다.",
			"totalSavedPlayers", totalPlayers
		);
	}

	// 2. 특정 구단 선수 스쿼드 API 조회 후 DB 저장 (동기화)
	// 예: GET /api/teams/57/sync
	@GetMapping("/{teamId}/sync")
	public Map<String, Object> syncTeamSquad(@PathVariable("teamId") Long teamId) {
		System.out.println("========== [구단 선수 동기화 시작] teamId: " + teamId + " ==========");
		List<Players> savedPlayers = footballApiService.syncTeamPlayers(teamId);
		
		System.out.println("DB 저장 완료: 총 " + savedPlayers.size() + "명의 선수가 저장되었습니다.");
		for (Players p : savedPlayers) {
			System.out.println(" - [" + p.getMainPosition() + "] " + p.getName() + " (국적: " + p.getNationality() + ")");
		}
		System.out.println("===============================================================");

		return Map.of(
			"teamId", teamId,
			"status", "SUCCESS",
			"savedPlayerCount", savedPlayers.size(),
			"players", savedPlayers
		);
	}

	// 3. 전체 구단 목록 조회 (DB 데이터)
	// 예: GET /api/teams
	@GetMapping
	public List<Teams> teams() {
		return teamService.getAllTeams();
	}

	// 4. 특정 구단 상세 조회
	// 예: GET /api/teams/{teamId}
	@GetMapping("/{teamId}")
	public Teams getTeam(@PathVariable("teamId") Long teamId) {
		return teamService.getTeamById(teamId);
	}

	// 5. 특정 구단 소속 선수 목록 조회 (DB 데이터)
	// 예: GET /api/teams/{teamId}/players
	@GetMapping("/{teamId}/players")
	public List<Players> getTeamPlayers(@PathVariable("teamId") Long teamId) {
		return teamService.getPlayersByTeamId(teamId);
	}

	// 6. 특정 구단 선수 등번호(Back Number) 비동기 수집 시작 (6.5초 간격)
	// 예: GET /api/teams/57/fill-backnumbers (아스널)
	@GetMapping("/{teamId}/fill-backnumbers")
	public Map<String, Object> fillTeamBackNumbers(@PathVariable("teamId") Long teamId) {
		int targetCount = footballApiService.fillBackNumbersAsync(teamId);
		if (targetCount == 0) {
			return Map.of(
				"teamId", teamId,
				"status", "COMPLETED",
				"message", "해당 구단에 등번호가 누락된 선수가 없습니다."
			);
		}

		return Map.of(
			"teamId", teamId,
			"status", "STARTED",
			"targetPlayerCount", targetCount,
			"estimatedMinutes", (int) Math.ceil(targetCount * 6.5 / 60.0),
			"message", "등번호 비동기 수집이 백그라운드에서 시작되었습니다. (Rate Limit 준수를 위해 6.5초 간격으로 처리되며 진행 상황은 서버 콘솔에서 확인 가능합니다)"
		);
	}

	// 7. 전체 구단 중 등번호가 없는 선수 전체 비동기 수집 시작 (6.5초 간격)
	// 예: GET /api/teams/fill-backnumbers
	@GetMapping("/fill-backnumbers")
	public Map<String, Object> fillAllBackNumbers() {
		int targetCount = footballApiService.fillBackNumbersAsync(null);
		if (targetCount == 0) {
			return Map.of(
				"status", "COMPLETED",
				"message", "전체 구단에 등번호가 누락된 선수가 없습니다."
			);
		}

		return Map.of(
			"status", "STARTED",
			"targetPlayerCount", targetCount,
			"estimatedMinutes", (int) Math.ceil(targetCount * 6.5 / 60.0),
			"message", "전체 선수 등번호 비동기 수집이 백그라운드에서 시작되었습니다. (진행 상황은 서버 콘솔에서 확인 가능합니다)"
		);
	}
}
