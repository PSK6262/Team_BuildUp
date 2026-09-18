package com.app.dto.community;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

// 게시글 목록, 전체 개수, 현재 페이지, 페이지 크기, 총 페이지 수를 전달합니다.
@Getter
@AllArgsConstructor
public class PostListResponse {
    private List<Posts> items;
    private long totalCount;
    private int page;
    private int size;
    private long totalPages;
}
