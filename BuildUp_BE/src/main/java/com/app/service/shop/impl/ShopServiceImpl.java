package com.app.service.shop.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

import com.app.dao.shop.ShopDAO;
import com.app.service.shop.ShopService;
import com.app.dto.shop.ShopItem;
import com.app.dto.shop.UserInventory;
import com.app.dto.shop.ItemOrder;
import com.app.dto.shop.PointTransaction;
import com.app.dto.shop.ShopPurchaseResponse;

@Service
public class ShopServiceImpl implements ShopService {

    private static final Logger log = LoggerFactory.getLogger(ShopServiceImpl.class);

    @Autowired
    private ShopDAO shopDAO;

    @Override
    public List<ShopItem> getShopItems(String itemType) {
        if (itemType != null && !itemType.trim().isEmpty() && !"ALL".equalsIgnoreCase(itemType)) {
            return shopDAO.selectItemsByType(itemType.trim());
        }
        return shopDAO.selectActiveItems();
    }

    @Override
    public ShopItem getShopItem(Long itemId) {
        return shopDAO.selectItemById(itemId);
    }

    @Override
    public List<UserInventory> getUserInventory(Long userId) {
        if (userId == null) {
            return List.of();
        }
        return shopDAO.selectInventoryByUserId(userId);
    }

    @Override
    @Transactional
    public ShopPurchaseResponse purchaseItem(Long userId, Long itemId) {
        if (userId == null) {
            throw new IllegalArgumentException("로그인이 필요한 서비스입니다.");
        }
        if (itemId == null) {
            throw new IllegalArgumentException("구매할 아이템을 선택해주세요.");
        }

        // 1. 아이템 정보 검증
        ShopItem item = shopDAO.selectItemById(itemId);
        if (item == null || !"Y".equals(item.getIsActive())) {
            throw new IllegalArgumentException("존재하지 않거나 판매 중이지 않은 아이템입니다.");
        }

        // 2. 이미 보유한 아이템인지 검증
        UserInventory existing = shopDAO.selectInventoryByUserAndItem(userId, itemId);
        if (existing != null) {
            throw new IllegalStateException("이미 보유하고 있는 아이템입니다.");
        }

        // 3. 회원 포인트 조회 및 동시성 비관적 락 (SELECT ... FOR UPDATE)
        Long currentPoint = shopDAO.lockUserPoint(userId);
        if (currentPoint == null) {
            throw new IllegalArgumentException("회원 정보를 찾을 수 없습니다.");
        }

        int price = item.getPoint() != null ? item.getPoint() : 0;
        if (currentPoint < price) {
            throw new IllegalStateException("포인트가 부족합니다. (현재: " + currentPoint + " P / 필요: " + price + " P)");
        }

        long remainingPoint = currentPoint - price;

        // 4. USERS 포인트 차감
        shopDAO.updateUserPoint(userId, -price);

        // 5. 주문 식별자 생성 (예: ORD_20261001123456_A1B2C3)
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        String randomPart = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        String orderId = "ORD_" + datePart + "_" + randomPart;

        // 6. ITEM_ORDERS 주문 기록 저장
        ItemOrder order = ItemOrder.builder()
                .orderId(orderId)
                .userId(userId)
                .itemId(itemId)
                .point(price)
                .orderStatus("COMPLETED")
                .build();
        shopDAO.insertOrder(order);

        // 7. POINT_TRANSACTIONS 포인트 변동 내역 저장
        PointTransaction tx = PointTransaction.builder()
                .userId(userId)
                .txType("SPEND")
                .amount(price)
                .balanceAfter(remainingPoint)
                .orderId(orderId)
                .description("포인트샵 아이템 구매: " + item.getItemName())
                .build();
        shopDAO.insertTransaction(tx);

        // 8. USER_INVENTORY 회원 보관함에 추가
        UserInventory inventory = UserInventory.builder()
                .userId(userId)
                .itemId(itemId)
                .isEquipped("N")
                .build();
        shopDAO.insertInventory(inventory);

        log.info("포인트샵 아이템 구매 완료 - userId: {}, itemId: {}, orderId: {}, remainingPoint: {}",
                userId, itemId, orderId, remainingPoint);

        return ShopPurchaseResponse.builder()
                .orderId(orderId)
                .remainingPoint(remainingPoint)
                .item(item)
                .inventoryId(inventory.getInventoryId())
                .message("'" + item.getItemName() + "' 아이템을 성공적으로 구매하였습니다.")
                .build();
    }

    @Override
    @Transactional
    public boolean toggleEquipItem(Long userId, Long itemId) {
        if (userId == null || itemId == null) {
            throw new IllegalArgumentException("필수 파라미터가 누락되었습니다.");
        }
        UserInventory inv = shopDAO.selectInventoryByUserAndItem(userId, itemId);
        if (inv == null) {
            throw new IllegalArgumentException("보유하지 않은 아이템입니다.");
        }

        boolean currentlyEquipped = "Y".equalsIgnoreCase(inv.getIsEquipped());
        if (currentlyEquipped) {
            shopDAO.updateEquipStatus(userId, itemId, "N");
            return false;
        } else {
            ShopItem item = shopDAO.selectItemById(itemId);
            if (item != null && item.getItemType() != null) {
                shopDAO.unequipAllByType(userId, item.getItemType());
            }
            shopDAO.updateEquipStatus(userId, itemId, "Y");
            return true;
        }
    }

    @Override
    public List<ItemOrder> getUserOrders(Long userId) {
        if (userId == null) return List.of();
        return shopDAO.selectOrdersByUserId(userId);
    }

    @Override
    public List<PointTransaction> getUserTransactions(Long userId) {
        if (userId == null) return List.of();
        return shopDAO.selectTransactionsByUserId(userId);
    }

    @Override
    public Long getUserPoint(Long userId) {
        if (userId == null) return 0L;
        Long point = shopDAO.selectUserPoint(userId);
        return point != null ? point : 0L;
    }
}
