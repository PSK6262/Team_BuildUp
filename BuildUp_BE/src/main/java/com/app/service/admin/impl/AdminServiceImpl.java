package com.app.service.admin.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.admin.AdminDAO;
import com.app.dao.match.MatchDAO;
import com.app.dao.team.TeamDAO;
import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.match.MatchEvents;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Teams;
import com.app.dto.user.Users;
import com.app.service.admin.AdminService;
import com.app.service.api.BigBallsApiService;
import com.app.service.api.FootballApiService;
import com.app.service.api.GeminiApiService;

@Service
public class AdminServiceImpl implements AdminService {

	private static final Logger log = LoggerFactory.getLogger(AdminServiceImpl.class);

	@Autowired
	private AdminDAO adminDAO;

	@Autowired
	private MatchDAO matchDAO;

	@Autowired
	private TeamDAO teamDAO;

	@Autowired
	private FootballApiService footballApiService;

	@Autowired
	private BigBallsApiService bigBallsApiService;

	@Autowired
	private GeminiApiService geminiApiService;

	@Override
	public Map<String, Object> getAdminSummary() {
		return adminDAO.selectAdminSummary();
	}

	@Override
	public List<Matches> getAdminMatches(String date, String status, String sortOrder) {
		Map<String, Object> params = new HashMap<>();
		params.put("date", date);
		params.put("status", status);
		params.put("sortOrder", sortOrder);
		return adminDAO.selectAdminMatches(params);
	}

	@Override
	public boolean updateMatchNotice(Long matchId, String notice) {
		return adminDAO.updateMatchNotice(matchId, notice) > 0;
	}

	@Override
	public boolean updateMatchScore(Long matchId, Long homeScore, Long awayScore, String status) {
		Matches match = new Matches();
		match.setMatchId(matchId);
		match.setHomeScore(homeScore);
		match.setAwayScore(awayScore);
		match.setStatus(status);
		return adminDAO.updateMatchScore(match) > 0;
	}

	@Override
	public List<MatchEvents> getMatchEvents(Long matchId) {
		return matchDAO.findEventsByMatchId(matchId);
	}

	@Override
	@Transactional
	public boolean deleteMatchEvent(Long eventId) {
		return adminDAO.deleteMatchEvent(eventId) > 0;
	}

	@Override
	@Transactional
	public boolean addMatchEvent(MatchEvents event) {
		return adminDAO.insertMatchEvent(event) > 0;
	}

	@Override
	@Transactional
	public Map<String, Object> resyncSingleMatch(Long matchId) {
		Matches match = matchDAO.findMatchById(matchId);
		if (match == null) {
			throw new IllegalArgumentException("대상 경기를 찾을 수 없습니다: matchId=" + matchId);
		}
		Map<String, Object> result = new HashMap<>();

		// 1. 경기 일정 및 공식 결과(스코어) Football API에서 다시 불러오기
		String matchDateStr = match.getMatchDate();
		if (matchDateStr != null && matchDateStr.length() >= 10) {
			try {
				LocalDate targetDate = LocalDate.parse(matchDateStr.substring(0, 10));
				footballApiService.syncMatchesByDate(targetDate);
			} catch (Exception e) {
				log.warn("[AdminService] matchId={} 날짜({}) 공식 스코어 재동기화 중 오류 (스킵): {}", matchId, matchDateStr, e.getMessage());
			}
		}

		// 2. 경기 타임라인 원본 이벤트 BigBalls API에서 다시 불러오기 (AI 자동 삭제 없음)
		int syncedEvents = bigBallsApiService.syncMatchEventsAuto(matchId);
		result.put("syncedEvents", syncedEvents);

		Matches updatedMatch = matchDAO.findMatchById(matchId);
		List<MatchEvents> events = matchDAO.findEventsByMatchId(matchId);
		result.put("match", updatedMatch);
		result.put("events", events);

		return result;
	}

	@Override
	public Map<String, Object> getAiMismatchAdvice(Long matchId) {
		Matches match = matchDAO.findMatchById(matchId);
		if (match == null) {
			throw new IllegalArgumentException("대상 경기를 찾을 수 없습니다: matchId=" + matchId);
		}
		List<MatchEvents> events = matchDAO.findEventsByMatchId(matchId);
		Teams homeTeam = teamDAO.findTeamById(match.getHomeTeamId());
		Teams awayTeam = teamDAO.findTeamById(match.getAwayTeamId());

		String hName = homeTeam != null ? homeTeam.getTeamName() : "Home";
		String aName = awayTeam != null ? awayTeam.getTeamName() : "Away";
		String mDate = match.getMatchDate() != null && match.getMatchDate().length() >= 10 ? match.getMatchDate().substring(0, 10) : "";

		long officialHome = match.getHomeScore() != null ? match.getHomeScore() : 0L;
		long officialAway = match.getAwayScore() != null ? match.getAwayScore() : 0L;

		List<MatchEvents> homeGoals = events.stream()
				.filter(e -> e.getTeamId().equals(match.getHomeTeamId()) && (e.getEventType() != null && (e.getEventType() == 1L || e.getEventType() == 2L || e.getEventType() == 3L)))
				.toList();
		List<MatchEvents> awayGoals = events.stream()
				.filter(e -> e.getTeamId().equals(match.getAwayTeamId()) && (e.getEventType() != null && (e.getEventType() == 1L || e.getEventType() == 2L || e.getEventType() == 3L)))
				.toList();

		List<Integer> homeDisallowedMinutes = new ArrayList<>();
		if (homeGoals.size() > officialHome) {
			List<Map<String, Object>> candidates = new ArrayList<>();
			for (MatchEvents g : homeGoals) {
				Map<String, Object> map = new HashMap<>();
				map.put("minute", g.getEventTime());
				map.put("playerName", g.getPlayerName() != null ? g.getPlayerName() : "Unknown");
				candidates.add(map);
			}
			try {
				List<Integer> mins = geminiApiService.identifyDisallowedGoalMinutes(
						mDate, hName, aName, hName, (int) officialHome, candidates);
				if (mins != null) homeDisallowedMinutes.addAll(mins);
			} catch (Exception e) {
				log.warn("[AdminService] 홈팀 취소골 AI 분석 중 오류: {}", e.getMessage());
			}
		}

		List<Integer> awayDisallowedMinutes = new ArrayList<>();
		if (awayGoals.size() > officialAway) {
			List<Map<String, Object>> candidates = new ArrayList<>();
			for (MatchEvents g : awayGoals) {
				Map<String, Object> map = new HashMap<>();
				map.put("minute", g.getEventTime());
				map.put("playerName", g.getPlayerName() != null ? g.getPlayerName() : "Unknown");
				candidates.add(map);
			}
			try {
				List<Integer> mins = geminiApiService.identifyDisallowedGoalMinutes(
						mDate, hName, aName, aName, (int) officialAway, candidates);
				if (mins != null) awayDisallowedMinutes.addAll(mins);
			} catch (Exception e) {
				log.warn("[AdminService] 원정팀 취소골 AI 분석 중 오류: {}", e.getMessage());
			}
		}

		Map<String, Object> advice = new HashMap<>();
		advice.put("matchId", matchId);
		advice.put("officialHomeScore", officialHome);
		advice.put("officialAwayScore", officialAway);
		advice.put("homeGoalCount", homeGoals.size());
		advice.put("awayGoalCount", awayGoals.size());
		advice.put("homeDisallowedMinutes", homeDisallowedMinutes);
		advice.put("awayDisallowedMinutes", awayDisallowedMinutes);
		advice.put("isMismatch", (homeGoals.size() != officialHome || awayGoals.size() != officialAway));

		return advice;
	}

	@Override
	public List<PlayerStats> getTeamPlayers(Long teamId) {
		return adminDAO.selectPlayersByTeam(teamId);
	}

	@Override
	public boolean updatePlayerInjury(Long playerId, String isInjured, String injuryNote, String isSuspended) {
		PlayerStats stats = new PlayerStats();
		stats.setPlayerId(playerId);
		stats.setIsInjured(isInjured);
		stats.setInjuryNote(injuryNote);
		stats.setIsSuspended(isSuspended != null ? isSuspended : "N");
		return adminDAO.mergePlayerStatsInjury(stats) > 0;
	}

	@Override
	public List<PlayerStats> getInjuredPlayersSummary() {
		return adminDAO.selectInjuredPlayersSummary();
	}

	@Override
	public List<Posts> getAdminPosts(String isBlind, String isDeleted, String keyword) {
		Map<String, Object> params = new HashMap<>();
		params.put("isBlind", isBlind);
		params.put("isDeleted", isDeleted);
		params.put("keyword", keyword);
		return adminDAO.selectAdminPosts(params);
	}

	@Override
	public boolean togglePostBlind(Long postId, String isBlind) {
		return adminDAO.updatePostBlind(postId, isBlind) > 0;
	}

	@Override
	@Transactional
	public boolean deletePost(Long postId) {
		return adminDAO.deletePost(postId) > 0;
	}

	@Override
	public List<Comments> getAdminComments(String isBlind, String isDeleted, String keyword) {
		Map<String, Object> params = new HashMap<>();
		params.put("isBlind", isBlind);
		params.put("isDeleted", isDeleted);
		params.put("keyword", keyword);
		return adminDAO.selectAdminComments(params);
	}

	@Override
	public boolean toggleCommentBlind(Long commentId, String isBlind) {
		return adminDAO.updateCommentBlind(commentId, isBlind) > 0;
	}

	@Override
	public List<Users> getAdminUsers(String keyword, Long roleCode) {
		Map<String, Object> params = new HashMap<>();
		params.put("keyword", keyword);
		params.put("roleCode", roleCode);
		return adminDAO.selectAdminUsers(params);
	}

	@Override
	public boolean updateUserRole(Long userId, Long roleCode) {
		Users user = adminDAO.selectAdminUserById(userId);
		if (user == null) {
			return false;
		}
		// 탈퇴회원(ROLE_CODE = 7)은 권한 변경 불가
		if (user.getRoleCode() != null && user.getRoleCode() == 7L) {
			log.warn("[회원 권한 변경 차단] 탈퇴회원(userId={})의 권한은 변경할 수 없습니다.", userId);
			return false;
		}
		return adminDAO.updateUserRole(userId, roleCode) > 0;
	}

	@Override
	@Transactional
	public boolean adjustUserPoints(Long userId, Long amount, String description) {
		Users user = adminDAO.selectAdminUserById(userId);
		if (user == null) {
			return false;
		}
		// 탈퇴회원(ROLE_CODE = 7)은 포인트 조정 불가
		if (user.getRoleCode() != null && user.getRoleCode() == 7L) {
			log.warn("[포인트 조정 차단] 탈퇴회원(userId={})의 포인트는 조정할 수 없습니다.", userId);
			return false;
		}

		long currentPoint = user.getPoint() != null ? user.getPoint() : 0L;
		long balanceAfter = Math.max(0, currentPoint + amount);
		long actualDelta = balanceAfter - currentPoint;

		adminDAO.updateUserPoint(userId, actualDelta);

		PointHistory history = new PointHistory();
		history.setUserId(userId);
		history.setAmount(actualDelta);
		history.setBalanceAfter(balanceAfter);
		history.setDescription(description != null ? description : "관리자 수동 조정");
		adminDAO.insertPointHistory(history);

		return true;
	}

	@Override
	public List<PointHistory> getRecentPointHistories() {
		return adminDAO.selectRecentPointHistories();
	}

	@Override
	public int syncMatchesByDate(String dateStr) {
		return syncMatchesByDateRange(dateStr, dateStr);
	}

	@Override
	public int syncMatchesByDateRange(String fromDateStr, String toDateStr) {
		LocalDate fromDate = (fromDateStr != null && !fromDateStr.trim().isEmpty())
				? LocalDate.parse(fromDateStr.trim())
				: LocalDate.now();
		LocalDate toDate = (toDateStr != null && !toDateStr.trim().isEmpty())
				? LocalDate.parse(toDateStr.trim())
				: fromDate;
		return footballApiService.syncMatchesByDateRange(fromDate, toDate);
	}

	@Override
	public int syncMatchEventsByDate(String dateStr) {
		return syncMatchEventsByDateRange(dateStr, dateStr);
	}

	@Override
	public int syncMatchEventsByDateRange(String fromDateStr, String toDateStr) {
		String from = (fromDateStr != null && !fromDateStr.trim().isEmpty())
				? fromDateStr.trim()
				: LocalDate.now().toString();
		String to = (toDateStr != null && !toDateStr.trim().isEmpty())
				? toDateStr.trim()
				: from;
		return bigBallsApiService.syncMatchEventsByDateRange(from, to);
	}

	@Override
	public int syncStandings(Integer season) {
		return footballApiService.syncPremierLeagueStandings(season);
	}

	@Override
	public int syncScorers(Integer limit) {
		int maxLimit = (limit != null && limit > 0) ? limit : 50;
		return footballApiService.syncPremierLeagueScorers(maxLimit);
	}

	@Override
	public int syncSeasonMatches(Integer season) {
		return footballApiService.syncPremierLeagueSeasonMatches(season);
	}

	@Override
	public int syncTeamsAndPlayers() {
		return footballApiService.syncAllPremierLeagueTeamsAndPlayers();
	}

	@Override
	public int resyncMismatchedEvents() {
		return bigBallsApiService.resyncAllMismatchedFinishedMatches();
	}

	@Override
	@Transactional
	public Map<String, Object> forceAiAlignMatchEventsByDateRange(String fromDateStr, String toDateStr) {
		String from = (fromDateStr != null && !fromDateStr.trim().isEmpty())
				? fromDateStr.trim()
				: LocalDate.now().toString();
		String to = (toDateStr != null && !toDateStr.trim().isEmpty())
				? toDateStr.trim()
				: from;

		LocalDate startDate = LocalDate.parse(from);
		LocalDate endDate = LocalDate.parse(to);
		if (startDate.isAfter(endDate)) {
			LocalDate tmp = startDate;
			startDate = endDate;
			endDate = tmp;
		}

		LocalDateTime start = startDate.atStartOfDay();
		LocalDateTime end = endDate.atTime(23, 59, 59);

		List<Matches> matches = matchDAO.findMatchesByDateRange(start, end);
		int fixedMatches = 0;
		int deletedEvents = 0;

		if (matches == null || matches.isEmpty()) {
			Map<String, Object> res = new HashMap<>();
			res.put("fixedMatches", 0);
			res.put("deletedEvents", 0);
			return res;
		}

		System.out.println("======================================================================");
		System.out.println("[BuildUp] " + startDate + " ~ " + endDate + " 기간 AI 스코어 정합성 강제 일치 시작");
		System.out.println("----------------------------------------------------------------------");

		for (Matches m : matches) {
			if (!"FINISHED".equalsIgnoreCase(m.getStatus()) || m.getHomeScore() == null || m.getAwayScore() == null) {
				continue;
			}

			Long matchId = m.getMatchId();
			long officialHomeScore = m.getHomeScore();
			long officialAwayScore = m.getAwayScore();

			List<MatchEvents> events = matchDAO.findEventsByMatchId(matchId);
			if (events == null) events = new ArrayList<>();

			Long homeTeamId = m.getHomeTeamId();
			Long awayTeamId = m.getAwayTeamId();

			List<MatchEvents> homeGoals = events.stream()
					.filter(e -> e.getTeamId().equals(homeTeamId) && (e.getEventType() == 1L || e.getEventType() == 2L || e.getEventType() == 3L))
					.collect(Collectors.toList());
			List<MatchEvents> awayGoals = events.stream()
					.filter(e -> e.getTeamId().equals(awayTeamId) && (e.getEventType() == 1L || e.getEventType() == 2L || e.getEventType() == 3L))
					.collect(Collectors.toList());

			boolean isMismatch = (homeGoals.size() != officialHomeScore) || (awayGoals.size() != officialAwayScore);
			if (!isMismatch) {
				continue;
			}

			Teams homeTeam = teamDAO.findTeamById(homeTeamId);
			Teams awayTeam = teamDAO.findTeamById(awayTeamId);
			String hName = homeTeam != null ? homeTeam.getTeamName() : "Home";
			String aName = awayTeam != null ? awayTeam.getTeamName() : "Away";

			// 이벤트가 없거나 빈 경기는 임의 생성하지 않음 (신뢰할 수 없는 데이터 유입 방지)
			if (events.isEmpty() || (homeGoals.isEmpty() && awayGoals.isEmpty())) {
				continue;
			}

			// [초과골 발생 케이스]: 이벤트는 들어왔으나 VAR 취소골 등으로 공식 점수보다 초과된 경우
			boolean matchModified = false;
			List<Players> homePlayers = teamDAO.findPlayersByTeamId(homeTeamId);
			List<Players> awayPlayers = teamDAO.findPlayersByTeamId(awayTeamId);

			String mDate = m.getMatchDate() != null && m.getMatchDate().length() >= 10 ? m.getMatchDate().substring(0, 10) : "";

			// [홈팀 보정]
			if (officialHomeScore == 0 && !homeGoals.isEmpty()) {
				// 공식 스코어 0점이면 모든 골 이벤트 삭제 (100% VAR 취소골)
				for (MatchEvents g : homeGoals) {
					adminDAO.deleteMatchEvent(g.getEventId());
					deletedEvents++;
				}
				matchModified = true;
			} else if (homeGoals.size() > officialHomeScore) {
				// Gemini AI로 취소골 시간대 추론
				List<Map<String, Object>> candidates = new ArrayList<>();
				for (MatchEvents g : homeGoals) {
					Map<String, Object> map = new HashMap<>();
					map.put("minute", g.getEventTime());
					String pName = (homePlayers != null) ? homePlayers.stream()
							.filter(p -> p.getPlayerId().equals(g.getPlayerId()))
							.map(Players::getName)
							.findFirst()
							.orElse("Unknown") : "Unknown";
					map.put("playerName", pName);
					candidates.add(map);
				}
				List<Integer> disallowedMinutes = geminiApiService.identifyDisallowedGoalMinutes(
						mDate, hName, aName, hName, (int) officialHomeScore, candidates
				);
				int removeNeeded = homeGoals.size() - (int) officialHomeScore;
				for (MatchEvents g : homeGoals) {
					if (removeNeeded <= 0) break;
					if (disallowedMinutes != null && disallowedMinutes.contains(g.getEventTime().intValue())) {
						adminDAO.deleteMatchEvent(g.getEventId());
						deletedEvents++;
						removeNeeded--;
					}
				}
				// AI가 특정하지 못했거나 여전히 초과하는 경우 후반부 골부터 초과분 삭제
				if (removeNeeded > 0) {
					for (int i = homeGoals.size() - 1; i >= 0 && removeNeeded > 0; i--) {
						MatchEvents g = homeGoals.get(i);
						adminDAO.deleteMatchEvent(g.getEventId());
						deletedEvents++;
						removeNeeded--;
					}
				}
				matchModified = true;
			}

			// [원정팀 보정]
			if (officialAwayScore == 0 && !awayGoals.isEmpty()) {
				for (MatchEvents g : awayGoals) {
					adminDAO.deleteMatchEvent(g.getEventId());
					deletedEvents++;
				}
				matchModified = true;
			} else if (awayGoals.size() > officialAwayScore) {
				List<Map<String, Object>> candidates = new ArrayList<>();
				for (MatchEvents g : awayGoals) {
					Map<String, Object> map = new HashMap<>();
					map.put("minute", g.getEventTime());
					String pName = (awayPlayers != null) ? awayPlayers.stream()
							.filter(p -> p.getPlayerId().equals(g.getPlayerId()))
							.map(Players::getName)
							.findFirst()
							.orElse("Unknown") : "Unknown";
					map.put("playerName", pName);
					candidates.add(map);
				}
				List<Integer> disallowedMinutes = geminiApiService.identifyDisallowedGoalMinutes(
						mDate, hName, aName, aName, (int) officialAwayScore, candidates
				);
				int removeNeeded = awayGoals.size() - (int) officialAwayScore;
				for (MatchEvents g : awayGoals) {
					if (removeNeeded <= 0) break;
					if (disallowedMinutes != null && disallowedMinutes.contains(g.getEventTime().intValue())) {
						adminDAO.deleteMatchEvent(g.getEventId());
						deletedEvents++;
						removeNeeded--;
					}
				}
				if (removeNeeded > 0) {
					for (int i = awayGoals.size() - 1; i >= 0 && removeNeeded > 0; i--) {
						MatchEvents g = awayGoals.get(i);
						adminDAO.deleteMatchEvent(g.getEventId());
						deletedEvents++;
						removeNeeded--;
					}
				}
				matchModified = true;
			}

			if (matchModified) {
				fixedMatches++;
				System.out.println("  - [AI 강제 일치 완료] MATCH_ID=" + matchId + " (" + hName + " vs " + aName + ") -> 공식 스코어 " + officialHomeScore + ":" + officialAwayScore + "에 맞춤 완료");
			}
		}

		System.out.println("======================================================================");
		System.out.println("[BuildUp] AI 스코어 정합성 강제 일치 완료: 총 " + fixedMatches + "경기 보정 (취소골 " + deletedEvents + "건 삭제)");
		System.out.println("======================================================================");

		Map<String, Object> result = new HashMap<>();
		result.put("fixedMatches", fixedMatches);
		result.put("deletedEvents", deletedEvents);
		return result;
	}
}
