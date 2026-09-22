package com.app.dao.custom;
import java.util.List;
import com.app.dto.custom.CustomTeams;
import com.app.dto.custom.CustomSquads;

public interface CustomDAO {
    Long lockUser(Long userId);
    CustomTeams findByUserId(Long userId);
    List<CustomSquads> findSquads(Long customTeamId);
    void insertTeam(CustomTeams team);
    void updateTeam(CustomTeams team);
    void deleteSquads(Long customTeamId);
    int insertSquad(CustomSquads squad);
}
