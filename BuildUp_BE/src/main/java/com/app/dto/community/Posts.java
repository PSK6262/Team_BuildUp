package com.app.dto.community;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class Posts {
    private Long postId;               // [PK] 게시글 식별자
    private Long userId;               // [FK] 작성자 회원 식별자
    private Long teamId;               // [FK] 구단 카테고리 필터 (자유글 NULL)
    private String title;              // 게시글 제목
    private String content;            // 게시글 본문 내용
    private Long viewCount;            // 조회수
    private Long likeCount;            // 추천수
    private String isBlind;            // 블라인드 여부 (Y/N)
    private Long categoryId;           // [FK] 카테고리 식별자

    private LocalDateTime createdAt;   // 작성 일시
    private LocalDateTime updatedAt;   // 수정 일시
    
    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getUpdatedAt() {
        if (this.updatedAt == null) return null;
        return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
    
    // 조인용 (Category)
    private String categoryType;
}