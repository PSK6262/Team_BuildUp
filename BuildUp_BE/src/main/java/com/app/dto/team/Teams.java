package com.app.dto.team;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class Teams {
	private Long teamId;
	private String teamName;
	private String teamNameKor;    // 구단 명칭 한글명
	private String history;
	private String emblemUrl;
	private String anthemUrl;
	private String foundedYear;    // 구단 창단 일자 (YYYY/MM/DD 형식)
	private String homeGround;
	private String homeGroundKor;  // 구단 홈 경기장 명칭 한글명
    private LocalDateTime updatedAt;
	
    public void setFoundedYear(Long foundedYear) {
        this.foundedYear = (foundedYear != null) ? String.valueOf(foundedYear) : null;
    }

    public void setFoundedYear(String foundedYear) {
        this.foundedYear = foundedYear;
    }

	public String getUpdatedAt() {
        if (this.updatedAt == null) return null;
        return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
