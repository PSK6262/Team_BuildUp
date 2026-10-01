package com.app.dao.shop.impl;

import org.springframework.stereotype.Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.mybatis.spring.SqlSessionTemplate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import com.app.dao.shop.ShopDAO;
import com.app.dto.shop.ShopItem;
import com.app.dto.shop.UserInventory;
import com.app.dto.shop.ItemOrder;
import com.app.dto.shop.PointTransaction;

@Repository
public class ShopDAOImpl implements ShopDAO {

    @Autowired
    private SqlSessionTemplate sqlSession;

    @Override
    public List<ShopItem> selectActiveItems() {
        return sqlSession.selectList("ShopMapper.selectActiveItems");
    }

    @Override
    public List<ShopItem> selectItemsByType(String itemType) {
        return sqlSession.selectList("ShopMapper.selectItemsByType", itemType);
    }

    @Override
    public ShopItem selectItemById(Long itemId) {
        return sqlSession.selectOne("ShopMapper.selectItemById", itemId);
    }

    @Override
    public List<UserInventory> selectInventoryByUserId(Long userId) {
        return sqlSession.selectList("ShopMapper.selectInventoryByUserId", userId);
    }

    @Override
    public UserInventory selectInventoryByUserAndItem(Long userId, Long itemId) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("itemId", itemId);
        return sqlSession.selectOne("ShopMapper.selectInventoryByUserAndItem", params);
    }

    @Override
    public int insertInventory(UserInventory inventory) {
        return sqlSession.insert("ShopMapper.insertInventory", inventory);
    }

    @Override
    public int updateEquipStatus(Long userId, Long itemId, String isEquipped) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("itemId", itemId);
        params.put("isEquipped", isEquipped);
        return sqlSession.update("ShopMapper.updateEquipStatus", params);
    }

    @Override
    public int unequipAllByType(Long userId, String itemType) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("itemType", itemType);
        return sqlSession.update("ShopMapper.unequipAllByType", params);
    }

    @Override
    public int insertOrder(ItemOrder order) {
        return sqlSession.insert("ShopMapper.insertOrder", order);
    }

    @Override
    public ItemOrder selectOrderById(String orderId) {
        return sqlSession.selectOne("ShopMapper.selectOrderById", orderId);
    }

    @Override
    public List<ItemOrder> selectOrdersByUserId(Long userId) {
        return sqlSession.selectList("ShopMapper.selectOrdersByUserId", userId);
    }

    @Override
    public int insertTransaction(PointTransaction tx) {
        return sqlSession.insert("ShopMapper.insertTransaction", tx);
    }

    @Override
    public List<PointTransaction> selectTransactionsByUserId(Long userId) {
        return sqlSession.selectList("ShopMapper.selectTransactionsByUserId", userId);
    }

    @Override
    public Long lockUserPoint(Long userId) {
        return sqlSession.selectOne("ShopMapper.lockUserPoint", userId);
    }

    @Override
    public Long selectUserPoint(Long userId) {
        return sqlSession.selectOne("ShopMapper.selectUserPoint", userId);
    }

    @Override
    public int updateUserPoint(Long userId, int amount) {
        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("amount", amount);
        return sqlSession.update("ShopMapper.updateUserPoint", params);
    }
}
