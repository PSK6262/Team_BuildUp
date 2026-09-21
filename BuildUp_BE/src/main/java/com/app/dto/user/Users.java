package com.app.dto.user;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

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

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

    public String getUpdatedAt() {
        if (this.updatedAt == null) return null;
        return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
    
    // 조인용 (USER_ROLES)
    private String roleName;
}

