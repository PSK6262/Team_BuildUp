package com.app.dto.shop;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * [ITEM_ORDERS] 테이블 매핑 DTO
 * 아이템 구매 주문 내역
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ItemOrder {
    private String orderId;       // [PK] 주문 고유 식별자 (예: ORD_...)
    private Long userId;          // [FK] 주문 회원 식별자
    private Long itemId;          // [FK] 주문 아이템 식별자
    private Integer point;        // 결제 포인트
    private String orderStatus;   // 주문 상태 ('COMPLETED', 'REFUNDED')
    private LocalDateTime orderedAt; // 주문 일시

    // 조인 필드
    private String itemName;      // 아이템 명칭
    private String itemType;      // 아이템 유형
    private String imageUrl;      // 아이템 이미지 URL / 이모지

    public String getOrderedAt() {
        if (this.orderedAt == null) return null;
        return this.orderedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
