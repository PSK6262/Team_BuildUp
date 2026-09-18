package com.app.dto.community;

import lombok.Data;

// 커뮤니티 게시글 카테고리 정보를 전달합니다.
@Data
public class CommunityCategory {
    private Long categoryId;
    private String categoryType;
}
