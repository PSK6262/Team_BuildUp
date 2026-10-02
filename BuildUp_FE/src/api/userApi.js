/**
 * [마이페이지 및 회원 활동 관련 API 클라이언트 모듈]
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
 * 로그인 회원의 활동 요약 통계 (작성글, 작성댓글, 좋아요 수)
 */
export async function getMyActivities() {
  const res = await fetch('/api/users/me/activities', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('활동 요약 정보를 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || { postCount: 0, commentCount: 0, likedPostCount: 0 };
}

/**
 * 로그인 회원이 작성한 게시글 목록 (페이징)
 */
export async function getMyPosts(page = 1, size = 5) {
  const res = await fetch(`/api/users/me/posts?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('작성글 목록을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || { list: [], totalCount: 0, totalPages: 0, currentPage: page };
}

/**
 * 로그인 회원이 작성한 댓글 목록 (페이징)
 */
export async function getMyComments(page = 1, size = 5) {
  const res = await fetch(`/api/users/me/comments?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('작성댓글 목록을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || { list: [], totalCount: 0, totalPages: 0, currentPage: page };
}

/**
 * 로그인 회원이 좋아요(추천)한 게시글 목록 (페이징)
 */
export async function getMyLikedPosts(page = 1, size = 5) {
  const res = await fetch(`/api/users/me/likes?page=${page}&size=${size}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('좋아요한 게시글 목록을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || { list: [], totalCount: 0, totalPages: 0, currentPage: page };
}

/**
 * 로그인 회원의 최근 포인트 변동 이력 (최근 5건)
 */
export async function getMyPointHistories() {
  const res = await fetch('/api/users/me/points/history', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('포인트 변동 이력을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || [];
}

/**
 * 로그인 회원의 포인트샵 보유 아이템(USER_INVENTORY) 및 구매 내역(ITEM_ORDERS) 조회
 */
export async function getMyProfile() {
  const res = await fetch('/api/users/me', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    return null;
  }
  const json = await res.json();
  return json.data || null;
}

/**
 * 로그인 회원의 포인트샵 보유 아이템(USER_INVENTORY) 및 구매 내역(ITEM_ORDERS) 조회
 * (/api/shop/inventory, /api/shop/orders 및 /api/users/me/shop 통합 연동)
 */
export async function getMyShopData() {
  const headers = getAuthHeaders();
  try {
    const [invRes, ordRes] = await Promise.all([
      fetch('/api/shop/inventory', { headers }),
      fetch('/api/shop/orders', { headers }),
    ]);
    if (invRes.ok && ordRes.ok) {
      const invJson = await invRes.json();
      const ordJson = await ordRes.json();
      return {
        inventory: Array.isArray(invJson.data) ? invJson.data : [],
        orders: Array.isArray(ordJson.data) ? ordJson.data : [],
      };
    }
  } catch {}

  const res = await fetch('/api/users/me/shop', { headers });
  if (!res.ok) {
    throw new Error('포인트샵 보관함 및 구매 내역을 불러올 수 없습니다.');
  }
  const json = await res.json();
  return json.data || { inventory: [], orders: [] };
}

/**
 * 포인트샵 아이템 구매 요청 (DB 인벤토리/주문내역/포인트차감 반영)
 */
export async function purchaseShopItem(item) {
  const res = await fetch('/api/users/me/shop/purchase', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      id: item.id,
      name: item.name,
      type: item.type,
      price: item.price,
      visual: item.visual,
      desc: item.desc,
    }),
  });
  if (!res.ok) {
    throw new Error('포인트샵 구매 요청에 실패했습니다.');
  }
  const json = await res.json();
  return json.data || null;
}


