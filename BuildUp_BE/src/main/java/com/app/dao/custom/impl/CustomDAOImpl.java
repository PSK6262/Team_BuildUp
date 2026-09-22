package com.app.dao.custom.impl;

import org.springframework.stereotype.Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.mybatis.spring.SqlSessionTemplate;
import java.util.List;
import com.app.dto.custom.CustomTeams;
import com.app.dto.custom.CustomSquads;

import com.app.dao.custom.CustomDAO;

@Repository
public class CustomDAOImpl implements CustomDAO {
    @Autowired
    private SqlSessionTemplate sqlSession;

    public Long lockUser(Long userId) { return sqlSession.selectOne("CustomMapper.lockUser", userId); }
    public CustomTeams findByUserId(Long userId) { return sqlSession.selectOne("CustomMapper.findByUserId", userId); }
    public List<CustomSquads> findSquads(Long customTeamId) { return sqlSession.selectList("CustomMapper.findSquads", customTeamId); }
    public void insertTeam(CustomTeams team) { sqlSession.insert("CustomMapper.insertTeam", team); }
    public void updateTeam(CustomTeams team) { sqlSession.update("CustomMapper.updateTeam", team); }
    public void deleteSquads(Long customTeamId) { sqlSession.delete("CustomMapper.deleteSquads", customTeamId); }
    public int insertSquad(CustomSquads squad) { return sqlSession.insert("CustomMapper.insertSquad", squad); }
}
