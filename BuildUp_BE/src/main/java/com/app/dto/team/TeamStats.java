package com.app.dto.team;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class TeamStats {
	private Long teamId;
	private Long currentRank;
	private Long matchesPlayed;
	private Long wins;
	private Long draws;
	private Long losses;
	private Long points;
	private Long goalsFor; // 득점수
	private Long goalsAgainst; // 실점수
	private Long goalDiff; // 득실차
	private Long yellowCards; // 경고수
	private Long redCards; // 퇴장수
	private LocalDateTime updatedAt;
	
    public String getUpdatedAt() {
        if (this.updatedAt == null) return null;
        return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
