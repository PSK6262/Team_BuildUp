package com.app.dao.shop;

import java.util.List;
import java.util.Map;
import com.app.dto.shop.ShopItem;
import com.app.dto.shop.UserInventory;
import com.app.dto.shop.ItemOrder;
import com.app.dto.shop.PointTransaction;

public interface ShopDAO {
    List<ShopItem> selectActiveItems();
    List<ShopItem> selectItemsByType(String itemType);
    ShopItem selectItemById(Long itemId);
    
    List<UserInventory> selectInventoryByUserId(Long userId);
    UserInventory selectInventoryByUserAndItem(Long userId, Long itemId);
    int insertInventory(UserInventory inventory);
    int updateEquipStatus(Long userId, Long itemId, String isEquipped);
    int unequipAllByType(Long userId, String itemType);

    int insertOrder(ItemOrder order);
    ItemOrder selectOrderById(String orderId);
    List<ItemOrder> selectOrdersByUserId(Long userId);

    int insertTransaction(PointTransaction tx);
    List<PointTransaction> selectTransactionsByUserId(Long userId);

    Long lockUserPoint(Long userId);
    Long selectUserPoint(Long userId);
    int updateUserPoint(Long userId, int amount);
}
