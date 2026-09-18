package com.app.dao.match;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.app.dto.match.Matches;
import com.app.dto.match.MatchEvents;

public interface MatchDAO {
	void mergeMatch(Matches match);
	Matches findMatchById(Long matchId);
	List<Matches> findAllMatches();
    List<Matches> findMatchesBySeason(Integer season);
	List<Matches> findMatchResults(Map<String, Object> params);
	List<Matches> findMatchesByDateRange(LocalDateTime startDate, LocalDateTime endDate);

	// 경기 타임라인 이벤트 (MATCH_EVENTS)
	void insertMatchEvent(MatchEvents event);
	List<MatchEvents> findEventsByMatchId(Long matchId);
	void deleteEventsByMatchId(Long matchId);
}
