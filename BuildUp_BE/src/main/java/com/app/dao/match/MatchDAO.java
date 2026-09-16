package com.app.dao.match;

import java.time.LocalDateTime;
import java.util.List;
import com.app.dto.match.Matches;

public interface MatchDAO {
	void mergeMatch(Matches match);
	Matches findMatchById(Long matchId);
	List<Matches> findAllMatches();
	List<Matches> findMatchesByDateRange(LocalDateTime startDate, LocalDateTime endDate);
}
