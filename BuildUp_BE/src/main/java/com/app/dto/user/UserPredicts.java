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

	// JOIN 및 랭킹 산출용 필드
	private String nickname;
	
    public String getUpdatedAt() {
        if (this.updatedAt == null) return null;
        return this.updatedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }

	public Double getWinRate() {
		if (this.predictTotal == null || this.predictTotal == 0) return 0.0;
		double rate = ((double) (this.predictWin != null ? this.predictWin : 0) / this.predictTotal) * 100.0;
		return Math.round(rate * 10.0) / 10.0;
	}
}

