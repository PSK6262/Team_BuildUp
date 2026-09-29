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

/**
 * 5. 특정 선수 상세 스탯 조회 (GET /api/teams/players/{playerId}/stats)
 * - DB의 PLAYER_STATS 테이블 데이터와 1:1 연동
 */
export async function getPlayerStats(playerId) {
  const numId = parseInt(playerId, 10);
  if (!numId) return null;

  try {
    const res = await fetch(`/api/teams/players/${numId}/stats`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.playerId) {
        return data;
      }
    }
  } catch (err) {
    console.warn(`[teamApi] 선수 스탯(/api/teams/players/${numId}/stats) 조회 실패, DB 스냅샷 사용:`, err.message);
  }

  return (fallbackBundle.playerStats || []).find((s) => s.playerId === numId) || null;
}

/**
 * 6. 특정 구단 소속 선수 전체 스탯 목록 조회
 * - 해당 구단 선수들의 PLAYER_STATS 목록을 반환
 */
export async function getTeamPlayerStats(teamId) {
  const numId = parseInt(teamId, 10);
  if (isExcludedTeam({ teamId: numId })) {
    return [];
  }

  try {
    const res = await fetch(`/api/teams/${numId}/player-stats`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    // 백엔드 개별 지원 및 폴백 번들 연동
  }

  return (fallbackBundle.playerStats || []).filter((s) => s.teamId === numId);
}

/**
 * 7. 프리미어리그 득점 랭킹 조회 (GET /api/teams/top-scorers?limit={limit})
 * - PLAYER_STATS 테이블의 득점(GOALS) 기준 상위 랭킹
 */
export async function getTopScorers(limit = 20) {
  try {
    const res = await fetch(`/api/teams/top-scorers?limit=${limit}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[teamApi] 득점 랭킹(/api/teams/top-scorers) 조회 실패, DB 스냅샷 사용:', err.message);
  }

  return [...(fallbackBundle.playerStats || [])]
    .filter((s) => s.goals > 0)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, limit);
}

/**
 * 8. 특정 구단 소속 선수 목록 + 개인 스탯(PLAYER_STATS) 통합 조회
 * - 선수 기본 정보에 시즌 골, 어시스트, 경고, 퇴장, 부상/출전정지 상태를 결합하여 반환
 */
export async function getTeamPlayersWithStats(teamId) {
  const [players, stats] = await Promise.all([
    getTeamPlayers(teamId),
    getTeamPlayerStats(teamId)
  ]);

  const statsMap = new Map((stats || []).map((s) => [s.playerId, s]));
  return (players || []).map((p) => {
    const st = statsMap.get(p.playerId);
    return {
      ...p,
      stats: st || null,
      goals: st?.goals ?? 0,
      assists: st?.assists ?? 0,
      yellowCards: st?.yellowCards ?? 0,
      redCards: st?.redCards ?? 0,
      isInjured: st?.isInjured ?? 'N',
      injuryNote: st?.injuryNote ?? null,
      isSuspended: st?.isSuspended ?? 'N'
    };
  });
}

/**
 * 9. 프리미어리그 전체 선수 목록 조회 (나만의 팀 / 포메이션 빌더용)
 * - 팀 엠블럼, 팀 한글명 및 선수 정보를 통합하여 반환
 */
export async function getAllPremierLeaguePlayers() {
  const teams = await getTeams();
  const teamMap = new Map((teams || []).map((t) => [t.teamId, t]));

  const rawPlayers = fallbackBundle.players || [];
  return rawPlayers
    .filter((p) => !isExcludedTeam(p.teamId))
    .map((p) => {
      const t = teamMap.get(p.teamId) || {};
      return {
        ...p,
        teamName: t.teamName || 'Premier League',
        teamNameKor: t.teamNameKor || t.teamName || '프리미어리그',
        teamEmblem: t.emblemUrl || null,
      };
    });
}

