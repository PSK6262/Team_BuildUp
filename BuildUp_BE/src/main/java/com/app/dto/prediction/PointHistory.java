package com.app.dto.prediction;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import lombok.Data;

@Data
public class PointHistory {
    private Long pointHistoryId;       // [PK] 포인트 변동 이력 식별자
    private Long userId;               // [FK] 대상 회원 식별자
    private Long predictionId;         // [FK] 관련 승부예측 식별자 (NULL 허용)
    private Long amount;               // 변동 포인트 (+500, -300 등)
    private Long balanceAfter;         // 변동 후 잔여 포인트
    private String description;        // 변동 사유 내용
    
    private LocalDateTime createdAt;   // 내역 발생 일시
    
	 public String getCreatedAt() {
	     if (this.createdAt == null) return null;
	     return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
	 }
}
