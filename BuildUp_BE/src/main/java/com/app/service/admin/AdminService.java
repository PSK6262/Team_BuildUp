package com.app.service.admin;

import java.util.List;
import java.util.Map;

import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.team.PlayerStats;
import com.app.dto.user.Users;

public interface AdminService {
	// 대시보드 요약 통계 지표 조회
	Map<String, Object> getAdminSummary();

	// 경기 목록 조회 및 공지사항/스코어 수정
	List<Matches> getAdminMatches(String date, String status, String sortOrder);
	default List<Matches> getAdminMatches(String date, String status) {
		return getAdminMatches(date, status, null);
	}
	boolean updateMatchNotice(Long matchId, String notice);
	boolean updateMatchScore(Long matchId, Long homeScore, Long awayScore, String status);

	// 구단 선수 및 부상/징계 관리
	List<PlayerStats> getTeamPlayers(Long teamId);
	boolean updatePlayerInjury(Long playerId, String isInjured, String injuryNote, String isSuspended);
	List<PlayerStats> getInjuredPlayersSummary();

	// 커뮤니티 게시글/댓글 블라인드 및 삭제 관리
	List<Posts> getAdminPosts(String isBlind, String isDeleted, String keyword);
	default List<Posts> getAdminPosts(String isBlind, String keyword) {
		return getAdminPosts(isBlind, null, keyword);
	}
	boolean togglePostBlind(Long postId, String isBlind);
	boolean deletePost(Long postId);
	List<Comments> getAdminComments(String isBlind, String isDeleted, String keyword);
	default List<Comments> getAdminComments(String isBlind, String keyword) {
		return getAdminComments(isBlind, null, keyword);
	}
	boolean toggleCommentBlind(Long commentId, String isBlind);

	// 회원 및 포인트 관리
	List<Users> getAdminUsers(String keyword, Long roleCode);
	boolean updateUserRole(Long userId, Long roleCode);
	boolean adjustUserPoints(Long userId, Long amount, String description);
	List<PointHistory> getRecentPointHistories();

	// 외부 데이터 수동 동기화 제어
	int syncMatchesByDate(String dateStr);
	int syncMatchEventsByDate(String dateStr);
	int syncStandings(Integer season);
	int syncScorers(Integer limit);
	int syncSeasonMatches(Integer season);
	int syncTeamsAndPlayers();
	int resyncMismatchedEvents();
}
