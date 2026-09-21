package com.app.dto.prediction;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class Predictions {
    private Long predictionId;         // [PK] 승부예측 식별자
    private Long userId;               // [FK] 참여 회원 식별자
    private Long matchId;              // [FK] 대상 경기 식별자
    private String predictResult;      // 예측 결과 (HOME, DRAW, AWAY)
    private String isSuccess;          // 적중 여부 (Y/N/C, 경기 종료 전 NULL)
    private LocalDateTime createdAt;   // 예측 제출 일시
    
    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
    }
}
