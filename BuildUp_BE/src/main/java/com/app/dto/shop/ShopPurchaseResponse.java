package com.app.dto.shop;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 아이템 구매 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopPurchaseResponse {
    private String orderId;          // 발급된 주문 번호
    private Long remainingPoint;     // 구매 후 보유 잔여 포인트
    private ShopItem item;           // 구매 완료된 아이템 정보
    private Long inventoryId;        // 인벤토리 생성 번호
    private String message;          // 처리 결과 안내 메시지
}
