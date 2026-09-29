package com.app.dto.community;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.fasterxml.jackson.annotation.JsonProperty;

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
	 private String isDeleted;          // 작성자 삭제 여부 (Y/N)
	 private String nickname;           // 조인용 댓글 작성자 닉네임
	 private String postTitle;          // 조인용 대상 게시글 제목
	 private String categoryType;       // 조인용 카테고리명
	 private String teamName;           // 조인용 대상 게시글 구단명
	 private Integer likeCount;         // 조인용 댓글 추천(좋아요) 수
	 private Integer viewCount;         // 조인용 대상 게시글 조회수
	 
	 private LocalDateTime createdAt;   // 작성 일시
	 private LocalDateTime updatedAt;   // 수정 일시

	 // 부모 댓글 번호가 JSON에서 pCommentId라는 이름으로 유지되도록 지정합니다.
	 @JsonProperty("pCommentId")
	 public Long getPCommentId() {
	     return pCommentId;
	 }

	 @JsonProperty("pCommentId")
	 public void setPCommentId(Long pCommentId) {
	     this.pCommentId = pCommentId;
	 }
	 
	 public String getCreatedAt() {
	     if (this.createdAt == null) return null;
	     return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
	 }
	
	 public String getUpdatedAt() {
	     if (this.updatedAt == null) return null;
	     return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
	 }
}

