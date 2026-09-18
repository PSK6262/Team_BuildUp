package com.app.dao.community.impl;

import java.util.List;
import java.util.Map;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;
import com.app.dao.community.CommunityDAO;
import com.app.dto.community.Posts;
@Repository
public class CommunityDAOImpl implements CommunityDAO {
    private final SqlSessionTemplate sqlSession;
    public CommunityDAOImpl(SqlSessionTemplate sqlSession) { this.sqlSession = sqlSession; }
    // 게시글 개수 조회 SQL을 실행합니다.
    public long countPosts(Map<String, Object> params) {
        return sqlSession.selectOne("CommunityMapper.countPosts", params);
    }
    // 게시글 목록 조회 SQL을 실행합니다.
    public List<Posts> findPosts(Map<String, Object> params) {
        return sqlSession.selectList("CommunityMapper.findPosts", params);
    }
}
