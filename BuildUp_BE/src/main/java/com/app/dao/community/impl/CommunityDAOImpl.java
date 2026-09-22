package com.app.dao.community.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;
import com.app.dao.community.CommunityDAO;
import com.app.dto.community.CommunityCategory;
import com.app.dto.community.Comments;
import com.app.dto.community.PostLikes;
import com.app.dto.community.Posts;
@Repository
public class CommunityDAOImpl implements CommunityDAO {
    private final SqlSessionTemplate sqlSession;
    public CommunityDAOImpl(SqlSessionTemplate sqlSession) { this.sqlSession = sqlSession; }
    // 커뮤니티 카테고리 목록 조회 SQL을 실행합니다.
    public List<CommunityCategory> findCategories() {
        return sqlSession.selectList("CommunityMapper.findCategories");
    }
    // 게시글 개수 조회 SQL을 실행합니다.
    public long countPosts(Map<String, Object> params) {
        return sqlSession.selectOne("CommunityMapper.countPosts", params);
    }
    // 게시글 목록 조회 SQL을 실행합니다.
    public List<Posts> findPosts(Map<String, Object> params) {
        return sqlSession.selectList("CommunityMapper.findPosts", params);
    }
    // 게시글 상세 조회 SQL을 실행합니다.
    public Posts findPostById(Long postId) {
        return sqlSession.selectOne("CommunityMapper.findPostById", postId);
    }
    // 게시글 조회수 증가 SQL을 실행합니다.
    public int increaseViewCount(Long postId) {
        return sqlSession.update("CommunityMapper.increaseViewCount", postId);
    }
    // 게시글 등록 SQL을 실행합니다.
    public int insertPost(Posts post) {
        return sqlSession.insert("CommunityMapper.insertPost", post);
    }
    // 게시글 수정 SQL을 실행합니다.
    public int updatePost(Posts post) {
        return sqlSession.update("CommunityMapper.updatePost", post);
    }
    // 게시글 숨김 SQL을 실행합니다.
    public int blindPost(Long postId, Long userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("postId", postId);
        params.put("userId", userId);
        return sqlSession.update("CommunityMapper.blindPost", params);
    }
    // 게시글 삭제(소프트 딜리트) SQL을 실행합니다.
    public int deletePost(Long postId, Long userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("postId", postId);
        params.put("userId", userId);
        return sqlSession.update("CommunityMapper.deletePost", params);
    }
    // 사용자의 게시글 추천 여부 조회 SQL을 실행합니다.
    public int countPostLike(PostLikes postLike) {
        return sqlSession.selectOne("CommunityMapper.countPostLike", postLike);
    }
    // 게시글 추천 등록 SQL을 실행합니다.
    public int insertPostLike(PostLikes postLike) {
        return sqlSession.insert("CommunityMapper.insertPostLike", postLike);
    }
    // 게시글 추천 취소 SQL을 실행합니다.
    public int deletePostLike(PostLikes postLike) {
        return sqlSession.delete("CommunityMapper.deletePostLike", postLike);
    }
    // 게시글 추천수 증가 SQL을 실행합니다.
    public int increaseLikeCount(Long postId) {
        return sqlSession.update("CommunityMapper.increaseLikeCount", postId);
    }
    // 게시글 추천수 감소 SQL을 실행합니다.
    public int decreaseLikeCount(Long postId) {
        return sqlSession.update("CommunityMapper.decreaseLikeCount", postId);
    }
    // 게시글 댓글 목록 조회 SQL을 실행합니다.
    public List<Comments> findComments(Long postId) {
        return sqlSession.selectList("CommunityMapper.findComments", postId);
    }
    // 댓글 상세 조회 SQL을 실행합니다.
    public Comments findCommentById(Long commentId) {
        return sqlSession.selectOne("CommunityMapper.findCommentById", commentId);
    }
    // 댓글 등록 SQL을 실행합니다.
    public int insertComment(Comments comment) {
        return sqlSession.insert("CommunityMapper.insertComment", comment);
    }
    // 댓글 수정 SQL을 실행합니다.
    public int updateComment(Comments comment) {
        return sqlSession.update("CommunityMapper.updateComment", comment);
    }
    // 댓글 숨김 SQL을 실행합니다.
    public int blindComment(Long commentId, Long userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("commentId", commentId);
        params.put("userId", userId);
        return sqlSession.update("CommunityMapper.blindComment", params);
    }
    // 댓글 삭제(소프트 딜리트) SQL을 실행합니다.
    public int deleteComment(Long commentId, Long userId) {
        Map<String, Object> params = new HashMap<>();
        params.put("commentId", commentId);
        params.put("userId", userId);
        return sqlSession.update("CommunityMapper.deleteComment", params);
    }
}
