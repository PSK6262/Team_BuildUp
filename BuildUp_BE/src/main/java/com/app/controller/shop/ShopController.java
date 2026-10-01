package com.app.controller.shop;

import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.app.common.ApiResponse;
import com.app.common.ResultCode;
import com.app.service.shop.ShopService;
import com.app.dto.shop.ShopItem;
import com.app.dto.shop.UserInventory;
import com.app.dto.shop.ItemOrder;
import com.app.dto.shop.PointTransaction;
import com.app.dto.shop.ShopPurchaseRequest;
import com.app.dto.shop.ShopPurchaseResponse;
import com.app.dto.user.Users;
import com.app.dao.user.UserDAO;
import com.app.util.JwtProvider;
import com.app.util.LoginManager;

/**
 * [포인트샵 컨트롤러]
 * - SHOP_ITEMS (상품 조회)
 * - USER_INVENTORY (회원 보관함 조회 및 장착)
 * - ITEM_ORDERS (주문 내역)
 * - POINT_TRANSACTIONS (포인트 변동 내역)
 * - 아이템 구매 및 포인트 차감
 */
@RestController
@RequestMapping("/api/shop")
public class ShopController {

    private static final Logger log = LoggerFactory.getLogger(ShopController.class);

    @Autowired
    private ShopService shopService;

    @Autowired
    private UserDAO userDAO;

    /**
     * 1. 포인트샵 판매 아이템 목록 조회 (비로그인 허용)
     * GET /api/shop/items?type=ICON / EMOTICON
     */
    @GetMapping("/items")
    public ResponseEntity<ApiResponse<List<ShopItem>>> getItems(
            @RequestParam(value = "type", required = false) String type) {
        try {
            List<ShopItem> items = shopService.getShopItems(type);
            return ResponseEntity.ok(ApiResponse.success(items));
        } catch (Exception e) {
            log.error("아이템 목록 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(ResultCode.FAIL, "아이템 목록을 불러오지 못했습니다."));
        }
    }

    /**
     * 2. 특정 아이템 상세 정보 조회 (비로그인 허용)
     * GET /api/shop/item?itemId=1
     */
    @GetMapping("/item")
    public ResponseEntity<ApiResponse<ShopItem>> getItem(
            @RequestParam("itemId") Long itemId) {
        try {
            ShopItem item = shopService.getShopItem(itemId);
            if (item == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error(ResultCode.SHOP_ITEM_NOT_FOUND));
            }
            return ResponseEntity.ok(ApiResponse.success(item));
        } catch (Exception e) {
            log.error("아이템 상세 조회 실패", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(ResultCode.FAIL, "아이템 정보를 불러오지 못했습니다."));
        }
    }

    /**
     * 3. 로그인한 회원의 보관함(인벤토리) 목록 조회
     * GET /api/shop/inventory
     */
    @GetMapping("/inventory")
    public ResponseEntity<ApiResponse<List<UserInventory>>> getInventory(HttpServletRequest request) {
        Users user = resolveUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(ResultCode.UNAUTHORIZED));
        }

        try {
            List<UserInventory> inventory = shopService.getUserInventory(user.getUserId());
            return ResponseEntity.ok(ApiResponse.success(inventory));
        } catch (Exception e) {
            log.error("인벤토리 조회 실패 - userId: {}", user.getUserId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(ResultCode.FAIL, "보관함 정보를 불러오지 못했습니다."));
        }
    }

    /**
     * 4. 아이템 구매 요청 (포인트 차감, 주문 생성, 트랜잭션 기록, 보관함 추가)
     * POST /api/shop/purchase
     * Body: { "itemId": 1 }
     */
    @PostMapping("/purchase")
    public ResponseEntity<ApiResponse<ShopPurchaseResponse>> purchaseItem(
            @RequestBody ShopPurchaseRequest purchaseRequest,
            HttpServletRequest request) {
        Users user = resolveUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(ResultCode.UNAUTHORIZED));
        }

        if (purchaseRequest == null || purchaseRequest.getItemId() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(ResultCode.INVALID_INPUT, "구매할 아이템 번호가 누락되었습니다."));
        }

        try {
            ShopPurchaseResponse response = shopService.purchaseItem(user.getUserId(), purchaseRequest.getItemId());
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (IllegalStateException e) {
            // 포인트 부족 또는 이미 보유한 아이템 등 비즈니스 예외
            ResultCode code = e.getMessage() != null && e.getMessage().contains("포인트가 부족")
                    ? ResultCode.SHOP_INSUFFICIENT_POINT
                    : ResultCode.SHOP_ALREADY_OWNED;
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(code, e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(ResultCode.INVALID_INPUT, e.getMessage()));
        } catch (Exception e) {
            log.error("아이템 구매 처리 중 오류 - userId: {}, itemId: {}", user.getUserId(), purchaseRequest.getItemId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(ResultCode.SHOP_PURCHASE_FAIL, "아이템 구매 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."));
        }
    }

    /**
     * 5. 아이템 장착 / 장착 해제 토글
     * POST /api/shop/inventory/equip
     * Body: { "itemId": 1 }
     */
    @PostMapping("/inventory/equip")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleEquip(
            @RequestBody ShopPurchaseRequest equipRequest,
            HttpServletRequest request) {
        Users user = resolveUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(ResultCode.UNAUTHORIZED));
        }

        if (equipRequest == null || equipRequest.getItemId() == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(ResultCode.INVALID_INPUT, "아이템 번호가 누락되었습니다."));
        }

        try {
            boolean isEquipped = shopService.toggleEquipItem(user.getUserId(), equipRequest.getItemId());
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "itemId", equipRequest.getItemId(),
                    "isEquipped", isEquipped ? "Y" : "N",
                    "message", isEquipped ? "아이템을 장착했습니다." : "아이템 장착을 해제했습니다."
            )));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(ResultCode.INVALID_INPUT, e.getMessage()));
        } catch (Exception e) {
            log.error("장착 상태 변경 오류 - userId: {}, itemId: {}", user.getUserId(), equipRequest.getItemId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(ResultCode.FAIL, "장착 상태 변경에 실패했습니다."));
        }
    }

    /**
     * 6. 회원의 구매 주문 내역 조회
     * GET /api/shop/orders
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<ItemOrder>>> getOrders(HttpServletRequest request) {
        Users user = resolveUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(ResultCode.UNAUTHORIZED));
        }

        try {
            List<ItemOrder> orders = shopService.getUserOrders(user.getUserId());
            return ResponseEntity.ok(ApiResponse.success(orders));
        } catch (Exception e) {
            log.error("주문 내역 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(ResultCode.FAIL, "주문 내역을 불러오지 못했습니다."));
        }
    }

    /**
     * 7. 회원의 포인트 변동 트랜잭션 내역 조회
     * GET /api/shop/transactions
     */
    @GetMapping("/transactions")
    public ResponseEntity<ApiResponse<List<PointTransaction>>> getTransactions(HttpServletRequest request) {
        Users user = resolveUser(request);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error(ResultCode.UNAUTHORIZED));
        }

        try {
            List<PointTransaction> txList = shopService.getUserTransactions(user.getUserId());
            return ResponseEntity.ok(ApiResponse.success(txList));
        } catch (Exception e) {
            log.error("포인트 내역 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(ResultCode.FAIL, "포인트 변동 내역을 불러오지 못했습니다."));
        }
    }

    /**
     * 8. 현재 로그인된 회원의 최신 포인트 조회
     * GET /api/shop/point
     */
    @GetMapping("/point")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCurrentPoint(HttpServletRequest request) {
        Users user = resolveUser(request);
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.success(Map.of("point", 0L)));
        }

        try {
            Long point = shopService.getUserPoint(user.getUserId());
            return ResponseEntity.ok(ApiResponse.success(Map.of("point", point)));
        } catch (Exception e) {
            log.error("회원 포인트 조회 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error(ResultCode.FAIL, "포인트를 조회하지 못했습니다."));
        }
    }

    /**
     * 세션 및 JWT 토큰 기반 회원 객체 식별
     */
    private Users resolveUser(HttpServletRequest request) {
        String loginId = LoginManager.getLoginUserId(request);
        if (loginId == null) {
            String token = JwtProvider.extractToken(request);
            if (token != null && JwtProvider.isValidToken(token)) {
                loginId = JwtProvider.getLoginIdFromToken(token);
            }
        }
        return loginId == null ? null : userDAO.selectUserByLoginId(loginId);
    }
}
