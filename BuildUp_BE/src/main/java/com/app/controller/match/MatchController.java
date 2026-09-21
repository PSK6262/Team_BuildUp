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
import com.app.dto.match.MatchEvents;
import com.app.service.api.FootballApiService;
import com.app.service.api.BigBallsApiService;
import com.app.service.match.MatchService;

@RestController
@RequestMapping({"/api/matches", "/matches"})
public class MatchController {

	@Autowired
	private MatchService matchService;

	@Autowired
	private FootballApiService footballApiService;

	@Autowired
	private BigBallsApiService bigBallsApiService;

	// 1. 시즌 경기 일정 DB 일괄 동기화 (초기 1회 적재용)
	// 예: GET 또는 POST /api/matches/sync-season?season=2026
	@RequestMapping(value = "/sync-season", method = {org.springframework.web.bind.annotation.RequestMethod.GET, org.springframework.web.bind.annotation.RequestMethod.POST})
	public Map<String, Object> syncSeasonMatches(
			@RequestParam(value = "season", required = false) Integer season) {
		String seasonDisplay = (season != null) ? season.toString() : "최신 활성 시즌";
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 시즌 경기 일정 일괄 동기화 시작 (시즌: " + seasonDisplay + ")");
		System.out.println("----------------------------------------------------------------------");
		int savedCount = footballApiService.syncPremierLeagueSeasonMatches(season);
		System.out.println("  - 처리 결과: 총 " + savedCount + "개 경기 일정이 DB에 저장되었습니다.");
		System.out.println("======================================================================");

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
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 오늘 경기 스코어/상태 실시간 갱신 시작 (일자: " + LocalDate.now() + ")");
		System.out.println("----------------------------------------------------------------------");
		int updatedCount = footballApiService.syncMatchesByDate(LocalDate.now());
		System.out.println("  - 처리 결과: 총 " + updatedCount + "개 경기 스코어가 갱신되었습니다.");
		System.out.println("======================================================================");

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
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 특정 일자 경기 스코어/상태 갱신 시작 (일자: " + dateStr + ")");
		System.out.println("----------------------------------------------------------------------");
		int updatedCount = footballApiService.syncMatchesByDate(targetDate);
		System.out.println("  - 처리 결과: 총 " + updatedCount + "개 경기 스코어가 갱신되었습니다.");
		System.out.println("======================================================================");

		return Map.of(
			"status", "SUCCESS",
			"date", dateStr,
			"updatedMatchCount", updatedCount
		);
	}

	// 4. 전체 경기 일정 조회 (DB 데이터)
	// 예: GET /api/matches 또는 GET /api/matches/
	@GetMapping({"", "/"})
	public List<Matches> getAllMatches() {
		return matchService.getAllMatches();
	}

	// 5. 단건 경기 상세 조회 (DB 데이터)
	// 예: GET /api/matches/{matchId}
	@GetMapping("/{matchId}")
	public Matches getMatchById(@PathVariable("matchId") Long matchId) {
		return matchService.getMatchById(matchId);
	}

	// 6. 경기 타임라인 이벤트 목록 조회 (DB 데이터)
	// 예: GET /api/matches/{matchId}/events
	@GetMapping("/{matchId}/events")
	public List<MatchEvents> getMatchEvents(@PathVariable("matchId") Long matchId) {
		return bigBallsApiService.getMatchEvents(matchId);
	}

	// 7. 경기 타임라인 이벤트 동기화 (Big Balls Data 연동)
	// 예: GET /api/matches/{matchId}/sync-events 또는 GET /api/matches/{matchId}/sync-events?extMatchId=bb_match_123
	@GetMapping("/{matchId}/sync-events")
	public Map<String, Object> syncMatchEvents(
			@PathVariable("matchId") Long matchId,
			@RequestParam(value = "extMatchId", required = false) String extMatchId) {
		int savedCount = 0;
		if (extMatchId != null && !extMatchId.isBlank()) {
			savedCount = bigBallsApiService.syncMatchEvents(matchId, extMatchId);
		} else {
			savedCount = bigBallsApiService.syncMatchEventsAuto(matchId);
		}

		return Map.of(
			"status", "SUCCESS",
			"matchId", matchId,
			"savedEventCount", savedCount,
			"message", "경기 타임라인 이벤트 " + savedCount + "건이 DB(MATCH_EVENTS)에 동기화되었습니다."
		);
	}

	// 8. 종료 경기 전체 타임라인 이벤트 일괄 동기화
	// 예: GET /api/matches/sync-all-events
	@GetMapping("/sync-all-events")
	public Map<String, Object> syncAllFinishedMatchEvents() {
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 종료 경기 전체 타임라인 이벤트 일괄 동기화 시작");
		System.out.println("----------------------------------------------------------------------");
		int totalSaved = bigBallsApiService.syncAllFinishedMatchEvents();
		System.out.println("  - 처리 결과: 총 " + totalSaved + "건의 타임라인 이벤트가 DB에 저장되었습니다.");
		System.out.println("======================================================================");

		return Map.of(
			"status", "SUCCESS",
			"totalSavedEvents", totalSaved,
			"message", "DB에 등록된 모든 종료 경기의 이벤트(" + totalSaved + "건)가 일괄 동기화되었습니다."
		);
	}

	// 9. 특정 날짜 경기 타임라인 이벤트 일괄 동기화
	// 예: GET /api/matches/sync-events-by-date?date=2026-08-21
	@GetMapping("/sync-events-by-date")
	public Map<String, Object> syncMatchEventsByDate(@RequestParam("date") String dateStr) {
		System.out.println("======================================================================");
		System.out.println("[BuildUp] 특정 일자 경기 타임라인 이벤트 동기화 시작 (일자: " + dateStr + ")");
		System.out.println("----------------------------------------------------------------------");
		int totalSaved = bigBallsApiService.syncMatchEventsByDate(dateStr);
		System.out.println("  - 처리 결과: 총 " + totalSaved + "건의 타임라인 이벤트가 DB에 저장되었습니다.");
		System.out.println("======================================================================");

		return Map.of(
			"status", "SUCCESS",
			"date", dateStr,
			"totalSavedEvents", totalSaved,
			"message", dateStr + " 경기의 이벤트(" + totalSaved + "건)가 동기화되었습니다."
		);
	}
}
