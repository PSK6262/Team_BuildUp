package com.app.dto.shop;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 아이템 구매 요청 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopPurchaseRequest {
    private Long itemId; // 구매할 아이템 식별자
}
