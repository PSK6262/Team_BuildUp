package com.app.service.shop;

import java.util.List;
import com.app.dto.shop.ShopItem;
import com.app.dto.shop.UserInventory;
import com.app.dto.shop.ItemOrder;
import com.app.dto.shop.PointTransaction;
import com.app.dto.shop.ShopPurchaseResponse;

public interface ShopService {
    List<ShopItem> getShopItems(String itemType);
    ShopItem getShopItem(Long itemId);
    List<UserInventory> getUserInventory(Long userId);
    ShopPurchaseResponse purchaseItem(Long userId, Long itemId);
    boolean toggleEquipItem(Long userId, Long itemId);
    List<ItemOrder> getUserOrders(Long userId);
    List<PointTransaction> getUserTransactions(Long userId);
    Long getUserPoint(Long userId);
}
