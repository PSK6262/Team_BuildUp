package com.app.service.team.impl;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.app.dao.team.TeamDAO;
import com.app.dto.team.PlayerStats;
import com.app.dto.team.Players;
import com.app.dto.team.Staffs;
import com.app.dto.team.TeamStats;
import com.app.dto.team.Teams;
import com.app.service.api.FootballApiService;
import com.app.service.team.TeamService;

@Service
public class TeamServiceImpl implements TeamService {

    @Autowired
    private TeamDAO teamDAO;

    @Autowired(required = false)
    private FootballApiService footballApiService;

    private final AtomicBoolean schemaVerified = new AtomicBoolean(false);

    @PostConstruct
    public void initCleanSheetsSchema() {
        ensureSchemaReady();
    }

    private void ensureSchemaReady() {
        if (schemaVerified.compareAndSet(false, true)) {
            try {
                teamDAO.ensureCleanSheetsSchema();
                teamDAO.syncTeamCleanSheetsBySeason(2026);
            } catch (Exception ignored) {
                schemaVerified.set(false);
            }
        }
    }

    @Override
    public List<Teams> getAllTeams() {
        return teamDAO.findAllTeams();
    }

    @Override
    public Teams getTeamById(Long teamId) {
        return teamDAO.findTeamById(teamId);
    }

    @Override
    public List<Players> getPlayersByTeamId(Long teamId) {
        return teamDAO.findPlayersByTeamId(teamId);
    }

    @Override
    public List<Staffs> getStaffsByTeamId(Long teamId) {
        return teamDAO.findStaffsByTeamId(teamId);
    }

    @Override
    public List<TeamStats> getTeamStandings(Integer season) {
        ensureSchemaReady();
        return teamDAO.findAllTeamStandings(season);
    }

    @Override
    public TeamStats getTeamStats(Long teamId, Integer season) {
        ensureSchemaReady();
        return teamDAO.findTeamStats(teamId, season);
    }

    @Override
    public List<TeamStats> getTeamStatsHistory(Long teamId) {
        ensureSchemaReady();
        return teamDAO.findTeamStatsHistory(teamId);
    }

    @Override
    public List<PlayerStats> getTopScorers(Integer limit) {
        ensureSchemaReady();
        return teamDAO.findTopScorers(limit);
    }

    @Override
    public List<PlayerStats> getPlayerRankings(String metric) {
        ensureSchemaReady();
        List<PlayerStats> rankings = teamDAO.findPlayerRankings(metric);
        if ("cleanSheets".equals(metric) && (rankings == null || rankings.isEmpty()) && footballApiService != null) {
            try {
                footballApiService.syncPremierLeagueCleanSheets(2026);
                rankings = teamDAO.findPlayerRankings(metric);
            } catch (Exception ignored) {}
        }
        return rankings;
    }

    @Override
    public PlayerStats getPlayerStats(Long playerId) {
        ensureSchemaReady();
        return teamDAO.findPlayerStats(playerId);
    }
}
