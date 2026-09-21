package com.app.dao.match;

import java.time.LocalDateTime;
import java.util.List;
import com.app.dto.match.Matches;
import com.app.dto.match.MatchEvents;

public interface MatchDAO {
	void mergeMatch(Matches match);
	Matches findMatchById(Long matchId);
	List<Matches> findAllMatches();
	List<Matches> findMatchesByDateRange(LocalDateTime startDate, LocalDateTime endDate);
	// 지정한 팀 또는 전체 리그의 예정 경기를 가까운 순으로 조회합니다.
	List<Matches> findUpcomingMatches(Long teamId, LocalDateTime fromDate, int limit);
	// 지정한 팀 또는 전체 리그의 종료된 경기를 최근 순으로 조회합니다.
	List<Matches> findRecentMatches(Long teamId, int limit);

	// 경기 타임라인 이벤트 (MATCH_EVENTS)
	void insertMatchEvent(MatchEvents event);
	List<MatchEvents> findEventsByMatchId(Long matchId);
	void deleteEventsByMatchId(Long matchId);
}
