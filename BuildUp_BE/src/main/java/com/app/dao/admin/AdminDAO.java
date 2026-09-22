package com.app.dao.admin;

import java.util.List;
import java.util.Map;

import com.app.dto.community.Comments;
import com.app.dto.community.Posts;
import com.app.dto.match.Matches;
import com.app.dto.prediction.PointHistory;
import com.app.dto.team.PlayerStats;
import com.app.dto.user.Users;

public interface AdminDAO {
	// 관리자 대시보드 통계 지표 조회
	Map<String, Object> selectAdminSummary();

	// 경기 목록 조회 및 공지/스코어 수정
	List<Matches> selectAdminMatches(Map<String, Object> params);
	int updateMatchNotice(Long matchId, String notice);
	int updateMatchScore(Matches match);

	// 구단별 선수 및 부상 정보 관리
	List<PlayerStats> selectPlayersByTeam(Long teamId);
	int mergePlayerStatsInjury(PlayerStats playerStats);
	List<PlayerStats> selectInjuredPlayersSummary();

	// 커뮤니티 게시글/댓글 관리
	List<Posts> selectAdminPosts(Map<String, Object> params);
	int updatePostBlind(Long postId, String isBlind);
	int deletePost(Long postId);
	List<Comments> selectAdminComments(Map<String, Object> params);
	int updateCommentBlind(Long commentId, String isBlind);

	// 회원 및 포인트 관리
	List<Users> selectAdminUsers(Map<String, Object> params);
	Users selectAdminUserById(Long userId);
	int updateUserRole(Long userId, Long roleCode);
	int updateUserPoint(Long userId, Long amount);
	int insertPointHistory(PointHistory pointHistory);
	List<PointHistory> selectRecentPointHistories();
}
