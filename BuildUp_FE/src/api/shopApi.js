/**
 * [포인트샵 및 보관함 관련 API 클라이언트 모듈]
 */

// 포인트샵 상품 목록 (SHOP_ITEMS 테이블 연동 및 초기/오프라인 폴백용)
export const DEFAULT_SHOP_ITEMS = [
  // --- 아이콘 카테고리 (ITEM_ID: 1~8) ---
  {
    itemId: 1,
    id: 1,
    type: 'icon',
    categoryName: '아이콘',
    name: '골든 트로피',
    visual: '🏆',
    price: 300,
    desc: '프리미어리그 챔피언의 영광을 상징하는 황금 트로피 프로필 아이콘',
  },
  {
    itemId: 2,
    id: 2,
    type: 'icon',
    categoryName: '아이콘',
    name: '불타는 축구공',
    visual: '⚽',
    price: 150,
    desc: '경기장을 뜨겁게 달구는 클래식 축구공 시그니처 아이콘',
  },
  {
    itemId: 3,
    id: 3,
    type: 'icon',
    categoryName: '아이콘',
    name: '골든 부츠',
    visual: '👟',
    price: 250,
    desc: '리그 최고의 골잡이에게 주어지는 득점왕 골든부츠 아이콘',
  },
  {
    itemId: 4,
    id: 4,
    type: 'icon',
    categoryName: '아이콘',
    name: '황금 왕관',
    visual: '👑',
    price: 400,
    desc: 'PL 명예의 전당 레전드를 위한 시그니처 크라운 프로필 아이콘',
  },
  {
    itemId: 5,
    id: 5,
    type: 'icon',
    categoryName: '아이콘',
    name: '철벽 방패',
    visual: '🛡️',
    price: 200,
    desc: '무실점 클린시트를 지켜내는 단단한 수호의 방패 아이콘',
  },
  {
    itemId: 6,
    id: 6,
    type: 'icon',
    categoryName: '아이콘',
    name: '캡틴 완장',
    visual: '🎖️',
    price: 250,
    desc: '피치 위 팀을 이끄는 리더십의 상징 주장 완장 아이콘',
  },
  {
    itemId: 7,
    id: 7,
    type: 'icon',
    categoryName: '아이콘',
    name: '마법의 패서',
    visual: '🎯',
    price: 350,
    desc: '환상적인 어시스트를 찔러주는 플레이메이커의 마법 아이콘',
  },
  {
    itemId: 8,
    id: 8,
    type: 'icon',
    categoryName: '아이콘',
    name: '거미손 글러브',
    visual: '🧤',
    price: 200,
    desc: '슈퍼 세이브로 팀을 구원하는 수문장의 골키퍼 글러브 아이콘',
  },

  // --- 이모티콘 카테고리 (ITEM_ID: 9~16) ---
  {
    itemId: 9,
    id: 9,
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '골 세레머니',
    visual: '🔥',
    price: 100,
    desc: '짜릿한 득점 순간 열광하는 시그니처 축하 응원 이모티콘',
  },
  {
    itemId: 10,
    id: 10,
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '심판 레드카드',
    visual: '🟥',
    price: 150,
    desc: '거친 파울과 판정에 분노를 표현하는 레드카드 이모티콘',
  },
  {
    itemId: 11,
    id: 11,
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '승리의 축포',
    visual: '🎉',
    price: 120,
    desc: '극적인 역전승과 우승을 자축하는 화려한 팡파르 이모티콘',
  },
  {
    itemId: 12,
    id: 12,
    type: 'emoticon',
    categoryName: '이모티콘',
    name: 'VAR 판독중',
    visual: '📺',
    price: 150,
    desc: '숨죽이고 주심의 판독을 기다리는 긴장감 넘치는 VAR 모니터',
  },
  {
    itemId: 13,
    id: 13,
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '열광의 나팔',
    visual: '📣',
    price: 100,
    desc: '경기장을 가득 메우는 서포터즈의 열렬한 함성과 나팔 이모티콘',
  },
  {
    itemId: 14,
    id: 14,
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '통곡의 벽',
    visual: '🧱',
    price: 120,
    desc: '상대의 파상 공세를 빈틈없이 막아내는 짠물 수비 이모티콘',
  },
  {
    itemId: 15,
    id: 15,
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '승점 3점 V',
    visual: '✌️',
    price: 80,
    desc: '경기 종료 휘슬 후 승점 3점을 만끽하는 승리의 V 이모티콘',
  },
  {
    itemId: 16,
    id: 16,
    type: 'emoticon',
    categoryName: '이모티콘',
    name: '눈물바다',
    visual: '😭',
    price: 80,
    desc: '아쉬운 실점과 패배에 눈물 흘리는 서포터즈의 오열 이모티콘',
  },
];

export const SHOP_ITEMS = DEFAULT_SHOP_ITEMS;

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
