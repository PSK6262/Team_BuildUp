package com.app.dto.community;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.Data;

//9. COMMENTS
@Data
public class Comments {
	private Long commentId; // [PK] 댓글 식별자
	private Long postId; // [FK] 대상 게시글 식별자
	private Long userId; // [FK] 댓글 작성자 식별자

	@JsonProperty("pCommentId")
	private Long pCommentId; // [FK] 부모 댓글 식별자 (원댓글 NULL)

	private String content; // 댓글 내용
	private String isBlind; // 블라인드 여부 (Y/N)
	private String nickname; // 조인용 댓글 작성자 닉네임

	@JsonFormat(pattern = "yyyy-MM-dd HH:mm", timezone = "Asia/Seoul")
	private LocalDateTime createdAt; // 작성 일시

	@JsonFormat(pattern = "yyyy-MM-dd HH:mm", timezone = "Asia/Seoul")
	private LocalDateTime updatedAt; // 수정 일시
}
