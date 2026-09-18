package com.app.dao.community;

import java.util.List;
import java.util.Map;
import com.app.dto.community.Posts;
public interface CommunityDAO {
    // 검색 조건에 맞는 전체 게시글 수를 조회합니다.
    long countPosts(Map<String, Object> params);
    // 현재 페이지의 게시글 목록을 조회합니다.
    List<Posts> findPosts(Map<String, Object> params);
}
