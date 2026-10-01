package com.app.dto.shop;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * [POINT_TRANSACTIONS] 테이블 매핑 DTO
 * 통합 포인트 적립/차감/취소 트랜잭션 기록
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PointTransaction {
    private Long txId;            // [PK] 포인트 트랜잭션 식별자
    private Long userId;          // [FK] 회원 식별자
    private String txType;        // 거래 구분 ('EARN', 'SPEND', 'CANCEL')
    private Integer amount;       // 거래 포인트 수량
    private Long balanceAfter;    // 거래 후 잔여 포인트
    private String orderId;       // [FK] 관련 주문 번호 (선택)
    private String description;   // 상세 내역 설명
    private LocalDateTime createdAt; // 발생 일시

    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
