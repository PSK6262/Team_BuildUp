package com.app.dto.user;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class UserPredicts {
	private Long userId;
	private Long predictWin;
	private Long predictTotal;
	private LocalDateTime updatedAt;
	
    public String getUpdatedAt() {
        if (this.updatedAt == null) return null;
        return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
