package com.app.service.match.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.match.MatchDAO;
import com.app.dto.match.Matches;
import com.app.service.match.MatchService;

@Service
public class MatchServiceImpl implements MatchService {

	@Autowired
	private MatchDAO matchDAO;

	@Override
	public List<Matches> getAllMatches() {
		return matchDAO.findAllMatches();
	}

    @Override
    public List<Matches> getMatchesBySeason(Integer season) {
        return matchDAO.findMatchesBySeason(season);
    }

	@Override
	public List<Matches> getMatchResults(Integer season, Integer round, Long teamId) {
		Map<String, Object> params = new HashMap<>();
		if (season != null) params.put("season", season);
		if (round != null) params.put("round", round);
		if (teamId != null) params.put("teamId", teamId);
		return matchDAO.findMatchResults(params);
	}

	@Override
	public Matches getMatchById(Long matchId) {
		return matchDAO.findMatchById(matchId);
	}

	@Override
	public List<Matches> getMatchesByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
		return matchDAO.findMatchesByDateRange(startDate, endDate);
	}
}
