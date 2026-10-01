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
 * 로그인 회원의 최신 프로필 정보 조회
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


