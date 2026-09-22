package com.app.service.custom.impl;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import com.app.dao.custom.CustomDAO;
import com.app.dto.custom.CustomTeams;
import com.app.dto.custom.CustomSquads;

import com.app.service.custom.CustomService;

@Service
public class CustomServiceImpl implements CustomService {
    @Autowired
    private CustomDAO customDAO;

    @Override
    @Transactional
    public CustomTeams findByUserId(Long userId) {
        if (customDAO.lockUser(userId) == null) throw new IllegalArgumentException("회원을 찾을 수 없습니다.");
        CustomTeams team = customDAO.findByUserId(userId);
        if (team != null) team.setSquads(customDAO.findSquads(team.getCustomTeamId()));
        return team;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CustomTeams save(Long userId, CustomTeams team) {
        if (team == null || team.getTeamName() == null || team.getTeamName().isBlank())
            throw new IllegalArgumentException("스쿼드 이름을 입력해주세요.");
        team.setTeamName(team.getTeamName().trim());
        if (team.getTeamName().getBytes(StandardCharsets.UTF_8).length > 100)
            throw new IllegalArgumentException("스쿼드 이름은 UTF-8 기준 100바이트 이내로 입력해주세요.");
        if (team.getSquads() == null || team.getSquads().size() != 11)
            throw new IllegalArgumentException("배치 슬롯은 11개여야 합니다.");
        Set<Long> positions = new HashSet<>();
        Set<Long> players = new HashSet<>();
        int df = 0, mf = 0, fw = 0, gk = 0;
        for (CustomSquads squad : team.getSquads()) {
            if (squad == null || squad.getPositionNo() == null || squad.getPositionNo() < 1 || squad.getPositionNo() > 11
                    || !positions.add(squad.getPositionNo())) throw new IllegalArgumentException("슬롯 번호는 중복 없이 1~11이어야 합니다.");
            String pos = squad.getPosition();
            if ("DF".equals(pos)) df++;
            else if ("MF".equals(pos)) mf++;
            else if ("FW".equals(pos)) fw++;
            else if ("GK".equals(pos)) gk++;
            else throw new IllegalArgumentException("잘못된 배치 포지션입니다.");
            if (squad.getPlayerId() != null && (squad.getPlayerId() <= 0 || !players.add(squad.getPlayerId())))
                throw new IllegalArgumentException("선수를 중복 배치할 수 없습니다.");
        }
        if (gk != 1 || df + mf + fw != 10) throw new IllegalArgumentException("GK 1개와 필드 슬롯 10개가 필요합니다.");
        for (CustomSquads squad : team.getSquads()) {
            long no = squad.getPositionNo();
            String expected = no <= fw ? "FW" : no <= fw + mf ? "MF" : no <= fw + mf + df ? "DF" : "GK";
            if (!expected.equals(squad.getPosition())) throw new IllegalArgumentException("슬롯은 FW, MF, DF, GK 순서여야 합니다.");
        }
        team.setFormation(df + "-" + mf + "-" + fw);
        team.setUserId(userId);
        if (customDAO.lockUser(userId) == null) throw new IllegalArgumentException("회원을 찾을 수 없습니다.");
        CustomTeams existing = customDAO.findByUserId(userId);
        if (existing == null) {
            team.setCustomTeamId(null);
            customDAO.insertTeam(team);
            team.setCustomTeamId(customDAO.findByUserId(userId).getCustomTeamId());
        } else {
            team.setCustomTeamId(existing.getCustomTeamId());
            customDAO.updateTeam(team);
            customDAO.deleteSquads(team.getCustomTeamId());
        }
        for (CustomSquads squad : team.getSquads()) {
            if (squad.getPlayerId() == null) continue;
            squad.setCustomTeamId(team.getCustomTeamId());
            if (customDAO.insertSquad(squad) != 1) throw new IllegalArgumentException("DB에 등록되지 않은 선수가 포함되어 있습니다.");
        }
        CustomTeams saved = customDAO.findByUserId(userId);
        saved.setSquads(customDAO.findSquads(saved.getCustomTeamId()));
        return saved;
    }

}
