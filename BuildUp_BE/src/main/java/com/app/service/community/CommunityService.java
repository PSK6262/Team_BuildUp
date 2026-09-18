package com.app.service.community;

import java.util.List;
import com.app.dto.community.CommunityBoardType;
import com.app.dto.community.PostListResponse;
public interface CommunityService {
    // 조건에 맞는 게시글 목록을 조회합니다.
    PostListResponse findPosts(List<Long> categoryIds, CommunityBoardType board, Long teamId,
        String keyword, String sort, int page, int size);
}
