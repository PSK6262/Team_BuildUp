package com.app.service.match;

import java.time.LocalDateTime;
import java.util.List;
import com.app.dto.match.Matches;

public interface MatchService {
	List<Matches> getAllMatches();
	Matches getMatchById(Long matchId);
	List<Matches> getMatchesByDateRange(LocalDateTime startDate, LocalDateTime endDate);
}
