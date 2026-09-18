package com.app.service.community.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import com.app.dao.community.CommunityDAO;
import com.app.dto.community.CommunityBoardType;
import com.app.dto.community.PostListResponse;
import com.app.service.community.CommunityService;
@Service
public class CommunityServiceImpl implements CommunityService {
    private final CommunityDAO communityDAO;
    public CommunityServiceImpl(CommunityDAO communityDAO) { this.communityDAO = communityDAO; }

    @Override
    public PostListResponse findPosts(List<Long> categoryIds, CommunityBoardType board, Long teamId,
            String keyword, String sort, int page, int size) {
        // 조회 조건과 페이지 범위를 검사합니다.
        if (categoryIds == null || categoryIds.isEmpty() || categoryIds.size() > 50
                || categoryIds.stream().anyMatch(id -> id == null || id < 1)
                || board == null
                || !List.of("latest", "likes", "views").contains(sort)
                || page < 1 || size < 1 || size > 100 || keyword.length() > 255
                || (teamId != null && teamId < 1)
                || (board == CommunityBoardType.FREE && teamId != null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid community search parameters");
        }
        // DB 조회에 사용할 조건을 구성합니다.
        Map<String, Object> params = new HashMap<>();
        params.put("categoryIds", categoryIds);
        params.put("board", board);
        params.put("teamId", teamId);
        // 검색어의 공백을 정리하고 특수문자를 문자 그대로 검색합니다.
        params.put("keyword", keyword.trim().replace("!", "!!").replace("%", "!%").replace("_", "!_"));
        params.put("sort", sort);
        // 요청 페이지 앞에서 건너뛸 게시글 수를 계산합니다.
        params.put("offset", ((long) page - 1) * size);
        params.put("size", size);
        // 전체 글 수와 현재 페이지 목록을 조회하여 응답을 구성합니다.
        long total = communityDAO.countPosts(params);
        return new PostListResponse(communityDAO.findPosts(params), total, page, size,
            (total + size - 1) / size);
    }
}
