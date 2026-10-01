package com.app.dto.shop;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * [USER_INVENTORY] 테이블 매핑 DTO
 * 회원이 보유한 아이템 인벤토리
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserInventory {
    private Long inventoryId;     // [PK] 인벤토리 식별자
    private Long userId;          // [FK] 회원 식별자
    private Long itemId;          // [FK] 아이템 식별자
    private String isEquipped;    // 장착 여부 ('Y', 'N')
    private LocalDateTime purchasedAt; // 구매 일시

    // SHOP_ITEMS 조인 필드
    private String itemType;      // 아이템 유형 ('ICON', 'EMOTICON')
    private String itemName;      // 아이템 명칭
    private String description;   // 아이템 설명
    private Integer point;        // 아이템 가격
    private String imageUrl;      // 아이템 이미지 URL / 이모지

    public String getPurchasedAt() {
        if (this.purchasedAt == null) return null;
        return this.purchasedAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
