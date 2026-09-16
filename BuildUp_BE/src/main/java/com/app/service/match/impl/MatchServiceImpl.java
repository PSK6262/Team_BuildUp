package com.app.service.match.impl;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.match.MatchDAO;
import com.app.dto.match.Matches;
import com.app.service.match.MatchService;

@Service
public class MatchServiceImpl implements MatchService {

	private final MatchDAO matchDAO;

	@Autowired
	public MatchServiceImpl(MatchDAO matchDAO) {
		this.matchDAO = matchDAO;
	}

	@Override
	public List<Matches> getAllMatches() {
		return matchDAO.findAllMatches();
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
