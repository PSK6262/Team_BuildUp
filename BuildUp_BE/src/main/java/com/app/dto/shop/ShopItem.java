package com.app.dto.shop;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * [SHOP_ITEMS] 테이블 매핑 DTO
 * 포인트샵 판매 아이템 (아이콘 / 이모티콘)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopItem {
    private Long itemId;          // [PK] 아이템 식별자
    private String itemType;      // 아이템 유형 ('ICON', 'EMOTICON')
    private String itemName;      // 아이템 명칭
    private String description;   // 아이템 상세 설명
    private Integer point;        // 구매 필요 포인트
    private String imageUrl;      // 아이콘/이모티콘 이미지 URL 또는 이모지 심볼
    private String isActive;      // 활성화 여부 ('Y', 'N')
    private LocalDateTime createdAt; // 생성 일시

    public String getCreatedAt() {
        if (this.createdAt == null) return null;
        return this.createdAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
