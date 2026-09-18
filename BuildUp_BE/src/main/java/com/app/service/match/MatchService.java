package com.app.service.match;

import java.time.LocalDateTime;
import java.util.List;
import com.app.dto.match.Matches;

public interface MatchService {
	List<Matches> getAllMatches();
    List<Matches> getMatchesBySeason(Integer season);
	List<Matches> getMatchResults(Integer season, Integer round, Long teamId);
	Matches getMatchById(Long matchId);
	List<Matches> getMatchesByDateRange(LocalDateTime startDate, LocalDateTime endDate);
}
