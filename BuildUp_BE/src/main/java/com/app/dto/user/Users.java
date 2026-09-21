package com.app.dto.user;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import lombok.Data;

@Data
public class Users {
	private Long userId;
	private String loginId;
	private String password;
	private String nickname;
	private String email;
	private Long favoriteTeamId;
	private Long roleCode;
	private Long point;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm", timezone = "Asia/Seoul")
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm", timezone = "Asia/Seoul")
    private LocalDateTime updatedAt;
    
    // 조인용 (USER_ROLES)
    private String roleName;
}
