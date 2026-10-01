/**
 * [포인트샵 및 보관함 관련 API 클라이언트 모듈]
 */

const getAuthHeaders = () => {
  const token = localStorage.getItem('buildup_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * 1. 포인트샵 판매 아이템 목록 조회 (비로그인 허용)
 * @param {string} [type] 'ICON' | 'EMOTICON' | ''
 */
export async function getShopItems(type = '') {
  const query = type ? `?type=${encodeURIComponent(type.toUpperCase())}` : '';
  const res = await fetch(`/api/shop/items${query}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('아이템 목록을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * 2. 특정 아이템 단건 상세 조회
 * @param {number|string} itemId
 */
export async function getShopItemDetail(itemId) {
  const res = await fetch(`/api/shop/item?itemId=${itemId}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('아이템 정보를 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || null;
}

/**
 * 3. 로그인 회원의 보관함(인벤토리) 목록 조회
 */
export async function getUserInventory() {
  const res = await fetch('/api/shop/inventory', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error('보관함 목록을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * 4. 아이템 구매 요청 (포인트 차감, 주문 생성, 트랜잭션 기록, 보관함 추가)
 * @param {number|string} itemId
 */
export async function purchaseShopItem(itemId) {
  const res = await fetch('/api/shop/purchase', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ itemId: Number(itemId) }),
  });

  const json = await res.json();
  if (!res.ok) {
    const errorMsg = json.message || '아이템 구매에 실패했습니다.';
    const error = new Error(errorMsg);
    error.code = json.code;
    throw error;
  }
  return json.data;
}

/**
 * 5. 아이템 장착 / 해제 상태 변경 토글
 * @param {number|string} itemId
 */
export async function toggleEquipItem(itemId) {
  const res = await fetch('/api/shop/inventory/equip', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ itemId: Number(itemId) }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || '장착 상태 변경에 실패했습니다.');
  }
  return json.data;
}

/**
 * 6. 회원의 최근 주문 내역 조회
 */
export async function getUserOrders() {
  const res = await fetch('/api/shop/orders', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error('주문 내역을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * 7. 회원의 포인트 변동 트랜잭션 내역 조회
 */
export async function getUserTransactions() {
  const res = await fetch('/api/shop/transactions', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    if (res.status === 401) return [];
    throw new Error('포인트 변동 내역을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * 8. 로그인 회원의 최신 잔여 포인트 조회
 */
export async function getUserPoint() {
  const res = await fetch('/api/shop/point', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return 0;
  }
  const json = await res.json();
  return json.data?.point ?? 0;
}
