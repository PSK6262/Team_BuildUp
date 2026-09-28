/**
 * [관리자 전용 순수 API 통신 모듈 - BuildUp_FE/src/api/adminApi.js]
 * 
 * 단일 책임 원칙(SRP)과 관심사의 분리(SoC)를 위해,
 * UI 컴포넌트나 비즈니스 훅에서 직접 fetch를 호출하지 않고
 * 백엔드 관리자 RESTful 엔드포인트(/api/admin/*)와의 HTTP 통신을 전담합니다.
 */

/**
 * Authorization Bearer JWT 헤더를 포함한 기본 JSON 헤더를 생성합니다.
 */
export function getAdminAuthHeaders() {
  const token = localStorage.getItem('buildup_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * 1. 관리자 대시보드 요약 통계 조회 (GET /api/admin/summary)
 */
export async function getAdminSummary() {
  const res = await fetch('/api/admin/summary', {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 2. 최근 포인트 지급/차감 이력 조회 (GET /api/admin/points/recent)
 */
export async function getRecentPoints() {
  const res = await fetch('/api/admin/points/recent', {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 3. 경기 일정 목록 조회 (GET /api/admin/matches?date=&status=&sort=)
 */
export async function getAdminMatches(params = {}) {
  const qs = new URLSearchParams();
  if (params.date) qs.append('date', params.date);
  if (params.status) qs.append('status', params.status);
  if (params.sort) qs.append('sort', params.sort);

  const res = await fetch(`/api/admin/matches?${qs.toString()}`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 4. 특정 구단 선수단 조회 (GET /api/admin/teams/{teamId}/players)
 */
export async function getAdminTeamPlayers(teamId) {
  const res = await fetch(`/api/admin/teams/${teamId}/players`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 5. 전체 부상/결장 선수 요약 조회 (GET /api/admin/players/injured-summary)
 */
export async function getInjuredSummary() {
  const res = await fetch('/api/admin/players/injured-summary', {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 6. 커뮤니티 게시글 목록 조회 (GET /api/admin/community/posts?status=&keyword=)
 */
export async function getAdminPosts(params = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.append('status', params.status);
  if (params.keyword) qs.append('keyword', params.keyword);

  const res = await fetch(`/api/admin/community/posts?${qs.toString()}`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 7. 커뮤니티 댓글 목록 조회 (GET /api/admin/community/comments?isBlind=&isDeleted=&keyword=)
 */
export async function getAdminComments(params = {}) {
  const qs = new URLSearchParams();
  if (params.isBlind) qs.append('isBlind', params.isBlind);
  if (params.isDeleted) qs.append('isDeleted', params.isDeleted);
  if (params.keyword) qs.append('keyword', params.keyword);

  const res = await fetch(`/api/admin/community/comments?${qs.toString()}`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 8. 회원 목록 조회 (GET /api/admin/users?keyword=&roleCode=)
 */
export async function getAdminUsers(params = {}) {
  const qs = new URLSearchParams();
  if (params.keyword) qs.append('keyword', params.keyword);
  if (params.roleCode) qs.append('roleCode', params.roleCode);

  const res = await fetch(`/api/admin/users?${qs.toString()}`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 9. 경기 공지사항 수정 (PUT /api/admin/matches/{matchId}/notice)
 */
export async function updateMatchNotice(matchId, notice) {
  const res = await fetch(`/api/admin/matches/${matchId}/notice`, {
    method: 'PUT',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ notice }),
  });
  return res;
}

/**
 * 10. 경기 스코어 및 상태 긴급 정정 (PUT /api/admin/matches/{matchId}/score)
 */
export async function updateMatchScore(matchId, scoreData) {
  const res = await fetch(`/api/admin/matches/${matchId}/score`, {
    method: 'PUT',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(scoreData),
  });
  return res;
}

/**
 * 11. 경기 타임라인 이벤트 목록 조회 (GET /api/admin/matches/{matchId}/events)
 */
export async function getMatchEvents(matchId) {
  const res = await fetch(`/api/admin/matches/${matchId}/events`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 12. 경기 타임라인 이벤트 단건 수동 삭제 (DELETE /api/admin/matches/events/{eventId})
 */
export async function deleteMatchEvent(eventId) {
  const res = await fetch(`/api/admin/matches/events/${eventId}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 13. 경기 타임라인 이벤트 수동 등록 (POST /api/admin/matches/{matchId}/events)
 */
export async function addMatchEvent(matchId, eventData) {
  const res = await fetch(`/api/admin/matches/${matchId}/events`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(eventData),
  });
  return res;
}

/**
 * 14. 외부 API 원본 데이터 재동기화 (POST /api/admin/matches/{matchId}/resync)
 */
export async function resyncSingleMatch(matchId) {
  const res = await fetch(`/api/admin/matches/${matchId}/resync`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 15. Gemini AI 스코어 불일치 분석 조언 조회 (GET /api/admin/matches/{matchId}/ai-advice)
 */
export async function getMatchAiAdvice(matchId) {
  const res = await fetch(`/api/admin/matches/${matchId}/ai-advice`, {
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 16. 선수 부상/결장 정보 수정 (PUT /api/admin/players/{playerId}/injury)
 */
export async function updatePlayerInjury(playerId, injuryData) {
  const res = await fetch(`/api/admin/players/${playerId}/injury`, {
    method: 'PUT',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(injuryData),
  });
  return res;
}

/**
 * 17. 게시글 블라인드 상태 수정 (PUT /api/admin/community/posts/{postId}/blind)
 */
export async function updatePostBlind(postId, isBlind) {
  const res = await fetch(`/api/admin/community/posts/${postId}/blind`, {
    method: 'PUT',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ isBlind }),
  });
  return res;
}

/**
 * 18. 게시글 직권 삭제 (DELETE /api/admin/community/posts/{postId})
 */
export async function deleteAdminPost(postId) {
  const res = await fetch(`/api/admin/community/posts/${postId}`, {
    method: 'DELETE',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 19. 댓글 블라인드 상태 수정 (PUT /api/admin/community/comments/{commentId}/blind)
 */
export async function updateCommentBlind(commentId, isBlind) {
  const res = await fetch(`/api/admin/community/comments/${commentId}/blind`, {
    method: 'PUT',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ isBlind }),
  });
  return res;
}

/**
 * 20. 회원 권한 등급 수정 (PUT /api/admin/users/{userId}/role)
 */
export async function updateUserRole(userId, roleCode) {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PUT',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ roleCode: Number(roleCode) }),
  });
  return res;
}

/**
 * 21. 회원 포인트 직권 지급/차감 (POST /api/admin/users/{userId}/points)
 */
export async function adjustUserPoints(userId, pointData) {
  const res = await fetch(`/api/admin/users/${userId}/points`, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify(pointData),
  });
  return res;
}

/**
 * 22. 데이터 일괄 수동 동기화 트리거 (POST /api/admin/sync/{endpoint})
 */
export async function triggerDataSync(endpoint, queryParams = {}) {
  let url = `/api/admin/sync/${endpoint}`;
  if (queryParams && typeof queryParams === 'object') {
    const qs = Object.entries(queryParams)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
  });
  return res;
}

/**
 * 23. AI 커뮤니티 유해 게시글/욕설 일괄 모더레이션 즉시 실행 (POST /api/admin/community/ai-moderation)
 */
export async function triggerAiModeration(limit = 30) {
  const res = await fetch('/api/admin/community/ai-moderation', {
    method: 'POST',
    headers: getAdminAuthHeaders(),
    credentials: 'include',
    body: JSON.stringify({ limit }),
  });
  return res;
}
