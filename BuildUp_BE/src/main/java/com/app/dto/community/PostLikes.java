package com.app.dto.community;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PostLikes {
    private Long userId;
    private Long postId;
    private LocalDateTime createdAt;
}
