package com.app.dto.community;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

//9. COMMENTS
@Data
public class Comments {
	 private Long commentId;            // [PK] 댓글 식별자
	 private Long postId;               // [FK] 대상 게시글 식별자
	 private Long userId;               // [FK] 댓글 작성자 식별자
	 private Long pCommentId;           // [FK] 부모 댓글 식별자 (원댓글 NULL)
	 private String content;            // 댓글 내용
	 private String isBlind;            // 블라인드 여부 (Y/N)
	 
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
}