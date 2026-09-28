package com.app.dao.custom;
import java.util.List;
import com.app.dto.custom.CustomTeams;
import com.app.dto.custom.CustomSquads;
import com.app.dto.custom.AiMatches;

public interface CustomDAO {
    void insertAiMatch(AiMatches match);
    List<CustomTeams> findRankings();
    Long lockUser(Long userId);
    CustomTeams findByUserId(Long userId);
    List<CustomSquads> findSquads(Long customTeamId);
    void insertTeam(CustomTeams team);
    void updateTeam(CustomTeams team);
    void deleteSquads(Long customTeamId);
    int insertSquad(CustomSquads squad);
}
