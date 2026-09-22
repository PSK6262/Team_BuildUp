package com.app.service.admin.impl;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.dao.admin.AdminDAO;
import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.team.PlayerStats;
import com.app.dto.user.Users;
import com.app.service.admin.AdminService;
import com.app.service.api.BigBallsApiService;
import com.app.service.api.FootballApiService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class AdminServiceImpl implements AdminService {

	@Autowired
	private AdminDAO adminDAO;

	@Autowired
	private FootballApiService footballApiService;

	@Autowired
	private BigBallsApiService bigBallsApiService;

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
		LocalDate targetDate = (dateStr != null && !dateStr.trim().isEmpty())
				? LocalDate.parse(dateStr.trim())
				: LocalDate.now();
		return footballApiService.syncMatchesByDate(targetDate);
	}

	@Override
	public int syncMatchEventsByDate(String dateStr) {
		String targetDate = (dateStr != null && !dateStr.trim().isEmpty())
				? dateStr.trim()
				: LocalDate.now().toString();
		return bigBallsApiService.syncMatchEventsByDate(targetDate);
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
}
