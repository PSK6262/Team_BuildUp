package com.app.dto.match;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Data
public class Matches {
    private Integer season;
    private Integer round;
    private String homeTeamName;
    private String homeTeamNameKor;
    private String homeEmblemUrl;
    private String homeGround;
    private String homeGroundKor;
    private String awayTeamName;
    private String awayTeamNameKor;
    private String awayEmblemUrl;
    private Long matchId;              // [PK] 경기 식별자
    private Long homeTeamId;           // [FK] 홈팀 식별자
    private Long awayTeamId;           // [FK] 원정팀 식별자
    private Long homeScore;            // 홈팀 최종 득점 수 (경기 전 NULL)
    private Long awayScore;            // 원정팀 최종 득점 수 (경기 전 NULL)
    private String status;             // 경기 상태 (SCHEDULED, LIVE, FINISHED 등)
    private String notice;             // 경기 중단, 연기, 취소 발생 시 알림
    private LocalDateTime matchDate;   // 경기 시작 일시
    private LocalDateTime endedAt;     // 경기가 끝난 시간 (종료 전 NULL)
    
    @JsonIgnore
    public LocalDateTime getMatchDateValue() { return matchDate; }

    @JsonIgnore
    public LocalDateTime getEndedAtValue() { return endedAt; }

	public String getMatchDate() {
        if (this.matchDate == null) return null;
        return this.matchDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
	
	public String getEndedAt() {
        if (this.endedAt == null) return null;
        return this.endedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
