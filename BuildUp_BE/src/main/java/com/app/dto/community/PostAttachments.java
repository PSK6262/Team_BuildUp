package com.app.dto.community;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.Data;

@Data
public class PostAttachments {
    private Long attachmentId;       // [PK] 첨부파일 식별자
    private Long postId;             // [FK] 게시글 식별자
    private String originalName;     // 사용자가 올린 원본 파일명
    @JsonIgnore
    private String storedName;       // 서버에 저장된 UUID 파일명
    private String contentType;      // 파일 MIME 타입
    private Long fileSize;           // 파일 크기(byte)
    private Integer sortOrder;       // 게시글 내 표시 순서
    private LocalDateTime createdAt; // 등록 일시

    // 프론트에서 이미지 미리보기 여부를 판단합니다.
    public boolean isImage() {
        return contentType != null && contentType.startsWith("image/");
    }

    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
