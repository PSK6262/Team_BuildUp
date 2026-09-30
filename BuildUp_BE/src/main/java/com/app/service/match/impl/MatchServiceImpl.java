package com.app.service.match.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.app.dao.match.MatchDAO;
import com.app.dto.match.MatchEvents;
import com.app.dto.match.Matches;
import com.app.service.match.MatchService;

@Service
public class MatchServiceImpl implements MatchService {
    private final MatchDAO matchDAO;

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

    @Override
    public List<MatchEvents> getPlayerEvents(Long playerId, Integer season) {
        LocalDateTime startDate = LocalDate.of(season, 7, 1).atStartOfDay();
        return matchDAO.findPlayerEvents(playerId, startDate, startDate.plusYears(1).minusNanos(1));
    }
}
