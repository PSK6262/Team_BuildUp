import fallbackBundle from '../data/teamDbFallback.json';

// 프리미어리그 제외 구단 목록 (레스터시티, 사우샘프턴, 번리, 울버햄튼, 웨스트햄)
const EXCLUDED_TEAM_IDS = new Set([338, 340, 328, 76, 563]);
const EXCLUDED_KEYWORDS = [
  '레스터', '사우샘프턴', '번리', '울버햄튼', '웨스트햄',
  'leicester', 'southampton', 'burnley', 'wolverhampton', 'west ham'
];

export function isExcludedTeam(t) {
  if (!t) return false;
  const id = Number(t.teamId || t);
  if (EXCLUDED_TEAM_IDS.has(id)) return true;

  const nameKor = t.teamNameKor || '';
  const nameEn = (t.teamName || '').toLowerCase();
  return EXCLUDED_KEYWORDS.some((kw) => nameKor.includes(kw) || nameEn.includes(kw.toLowerCase()));
}

// 창단연도 순수 연도(4자리 숫자) 정제 함수
function normalizeTeam(t) {
  if (!t) return null;
  let year = t.foundedYear;
  if (typeof year === 'string') {
    const match = year.match(/\d{4}/);
    year = match ? parseInt(match[0], 10) : 1900;
  }
  return {
    ...t,
    foundedYear: year,
    anthemUrl: t.anthemUrl || t.anithemUrl,
  };
}

/**
 * 0. 초기 동기 렌더링용 구단 목록 반환 (20개 프리미어리그 구단)
 */
export function getInitialTeams() {
  return (fallbackBundle.teams || [])
    .map(normalizeTeam)
    .filter((t) => !isExcludedTeam(t));
}

/**
 * 1. 전체 구단 목록 조회 (GET /api/teams) - 제외 구단 필터링 적용 (총 20개 구단)
 */
export async function getTeams() {
  try {
    const res = await fetch('/api/teams');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data
          .map(normalizeTeam)
          .filter((t) => !isExcludedTeam(t));
      }
    }
  } catch (err) {
    console.warn('[teamApi] 백엔드(/api/teams) 응답 없음, DB 스냅샷 Fallback 사용:', err.message);
  }
  return (fallbackBundle.teams || [])
    .map(normalizeTeam)
    .filter((t) => !isExcludedTeam(t));
}

/**
 * 2. 특정 구단 상세 조회 (GET /api/teams/{teamId})
 */
export async function getTeamById(teamId) {
  const numId = parseInt(teamId, 10);
  if (isExcludedTeam({ teamId: numId })) {
    return null;
  }

  try {
    const res = await fetch(`/api/teams/${numId}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.teamId && !isExcludedTeam(data)) {
        return normalizeTeam(data);
      }
    }
  } catch (err) {
    console.warn(`[teamApi] 백엔드(/api/teams/${numId}) 응답 없음, DB 스냅샷 Fallback 사용:`, err.message);
  }

  const fallback = (fallbackBundle.teams || []).find((t) => t.teamId === numId && !isExcludedTeam(t));
  return normalizeTeam(fallback);
}

/**
 * 3. 특정 구단 소속 선수단 조회 (GET /api/teams/{teamId}/players)
 */
export async function getTeamPlayers(teamId) {
  const numId = parseInt(teamId, 10);
  if (isExcludedTeam({ teamId: numId })) {
    return [];
  }

  try {
    const res = await fetch(`/api/teams/${numId}/players`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`[teamApi] 백엔드(/api/teams/${numId}/players) 응답 없음, DB 스냅샷 Fallback 사용:`, err.message);
  }

  return (fallbackBundle.players || []).filter((p) => p.teamId === numId);
}

/**
 * 4. 특정 구단 소속 스태프/감독 조회 (GET /api/teams/{teamId}/staffs)
 */
export async function getTeamStaffs(teamId) {
  const numId = parseInt(teamId, 10);
  if (isExcludedTeam({ teamId: numId })) {
    return [];
  }

  try {
    const res = await fetch(`/api/teams/${numId}/staffs`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`[teamApi] 백엔드(/api/teams/${numId}/staffs) 응답 없음, DB 스냅샷 Fallback 사용:`, err.message);
  }

  return (fallbackBundle.staffs || []).filter((s) => s.teamId === numId);
}
