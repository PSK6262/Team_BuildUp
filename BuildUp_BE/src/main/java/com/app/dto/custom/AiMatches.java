package com.app.dto.custom;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class AiMatches {
    private Long aiMatchId;            // [PK] AI 경기 식별자
    private Long homeTeamId;           // [FK] 내 커스텀 팀 식별자
    private Long awayTeamId;           // [FK] 상대 커스텀 팀 식별자
    private Long homeScore;            // 홈팀 점수
    private Long awayScore;            // 원정팀 점수
    private String aiReview;           // AI 경기 관전평 및 요약
    private LocalDateTime createdAt;   // 진행 일시
    
    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}