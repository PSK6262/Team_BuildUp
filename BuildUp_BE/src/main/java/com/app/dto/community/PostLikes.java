package com.app.dto.community;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class PostLikes {
    private Long userId;               // [PK, FK] 추천 누른 회원 식별자
    private Long postId;               // [PK, FK] 추천 대상 게시글 식별자
    private LocalDateTime createdAt;   // 추천 일시
    
	 public String getCreatedAt() {
	     if (this.createdAt == null) return null;
	     return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
	 }
}
