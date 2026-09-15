package com.app.dto.team;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class Teams {
	private Long teamId;
	private String teamName;
	private String history;
	private String emblemUrl;
	private String anthemUrl;
	private Long foundedYear;
	private String homeGround;
    private LocalDateTime updatedAt;
	
	public String getUpdatedAt() {
        if (this.updatedAt == null) return null;
        return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
