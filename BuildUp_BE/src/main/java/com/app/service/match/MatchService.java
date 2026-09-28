package com.app.service.match;

import java.time.LocalDateTime;
import java.util.List;
import com.app.dto.match.Matches;
import com.app.dto.match.MatchEvents;

public interface MatchService {
	List<MatchEvents> getPlayerEvents(Long playerId, Integer season);
	List<Matches> getAllMatches();
	Matches getMatchById(Long matchId);
	List<Matches> getMatchesByDateRange(LocalDateTime startDate, LocalDateTime endDate);
}
