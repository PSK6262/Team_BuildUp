package com.app.controller.match;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.app.dto.match.Matches;
import com.app.service.api.FootballApiService;
import com.app.service.match.MatchService;

@RestController
@RequestMapping({"/api/matches", "/matches"})
public class MatchController {

	private final MatchService matchService;
	private final FootballApiService footballApiService;

	@Autowired
	public MatchController(MatchService matchService, FootballApiService footballApiService) {
		this.matchService = matchService;
		this.footballApiService = footballApiService;
	}

	// 1. 시즌 경기 일정 DB 일괄 동기화 (초기 1회 적재용)
	// 예: GET /api/matches/sync-season (최신 시즌 자동) 또는 GET /api/matches/sync-season?season=2026
	@GetMapping("/sync-season")
	public Map<String, Object> syncSeasonMatches(
			@RequestParam(value = "season", required = false) Integer season) {
		String seasonDisplay = (season != null) ? season.toString() : "최신 활성 시즌";
		System.out.println("========== [시즌 경기 일정 동기화 시작] season: " + seasonDisplay + " ==========");
		int savedCount = footballApiService.syncPremierLeagueSeasonMatches(season);
		System.out.println("시즌 경기 동기화 완료: 총 " + savedCount + "경기가 DB에 저장되었습니다.");
		System.out.println("==================================================================");

		return Map.of(
			"status", "SUCCESS",
			"targetSeason", seasonDisplay,
			"savedMatchCount", savedCount,
			"message", seasonDisplay + " 경기(" + savedCount + "경기)가 한국 시간(KST)으로 DB에 저장되었습니다."
		);
	}

	// 2. 오늘 경기 상태 및 스코어 갱신 (재호출/스케줄러용)
	// 예: GET /api/matches/sync-today
	@GetMapping("/sync-today")
	public Map<String, Object> syncTodayMatches() {
		System.out.println("========== [오늘 경기 상태/스코어 갱신 시작] ==========");
		int updatedCount = footballApiService.syncMatchesByDate(LocalDate.now());
		System.out.println("오늘 경기 갱신 완료: 총 " + updatedCount + "경기");
		System.out.println("=================================================");

		return Map.of(
			"status", "SUCCESS",
			"date", LocalDate.now().toString(),
			"updatedMatchCount", updatedCount
		);
	}

	// 3. 특정 날짜 경기 상태 및 스코어 갱신
	// 예: GET /api/matches/sync-date?date=2025-05-25
	@GetMapping("/sync-date")
	public Map<String, Object> syncMatchesByDate(
			@RequestParam(value = "date") String dateStr) {
		LocalDate targetDate = LocalDate.parse(dateStr);
		System.out.println("========== [특정 일자 경기 갱신 시작] date: " + dateStr + " ==========");
		int updatedCount = footballApiService.syncMatchesByDate(targetDate);
		System.out.println("일자별 경기 갱신 완료: 총 " + updatedCount + "경기");
		System.out.println("=================================================");

		return Map.of(
			"status", "SUCCESS",
			"date", dateStr,
			"updatedMatchCount", updatedCount
		);
	}

	// 4. 전체 경기 일정 조회 (DB 데이터)
	// 예: GET /api/matches
	@GetMapping
	public List<Matches> getAllMatches() {
		return matchService.getAllMatches();
	}

	// 5. 단건 경기 상세 조회 (DB 데이터)
	// 예: GET /api/matches/{matchId}
	@GetMapping("/{matchId}")
	public Matches getMatchById(@PathVariable("matchId") Long matchId) {
		return matchService.getMatchById(matchId);
	}
}
