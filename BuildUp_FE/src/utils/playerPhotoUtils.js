/**
 * 선수 사진 조회 및 캐싱 유틸리티
 * TheSportsDB API를 사용하여 선수 Cutout / Thumbnail 이미지를 조회합니다.
 */

const playerPhotoCache = new Map();

function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

/**
 * 선수명 비교 (대소문자 무시, 악센트 제거, 공백 및 성/이름 순서 차이 보정)
 * 예: "Son Heung-min" <-> "Heung-min Son"
 */
function matchPlayerName(candidateName, targetName) {
  if (!candidateName || !targetName) return false;
  const normTarget = normalize(targetName);
  const normCandidate = normalize(candidateName);
  if (normTarget === normCandidate) return true;

  // 단어 단위 비교 (정렬 후 비교하여 성/이름 순서 일치 확인)
  const wordsTarget = normTarget.split(/\s+/).filter(Boolean);
  const wordsCandidate = normCandidate.split(/\s+/).filter(Boolean);
  if (wordsTarget.length > 0 && wordsCandidate.length > 0) {
    if (wordsTarget.slice().sort().join(' ') === wordsCandidate.slice().sort().join(' ')) {
      return true;
    }
  }
  return false;
}

/**
 * 구단명 비교 (부분 포함 및 표준 구단 키워드 매칭)
 * 예: "Arsenal" <-> "Arsenal FC", "Tottenham" <-> "Tottenham Hotspur"
 */
function matchTeamName(candidateTeam, targetTeam) {
  if (!candidateTeam || !targetTeam) return false;
  const normCand = normalize(candidateTeam);
  const normTarget = normalize(targetTeam);
  if (normCand === normTarget) return true;
  if (normCand.includes(normTarget) || normTarget.includes(normCand)) return true;

  // 주요 키워드 비교 (FC, United, City 등 일반명사 제외 후 핵심 고유명사 비교)
  const stopWords = new Set(['fc', 'afc', 'united', 'city', 'town', 'hotspur', 'wanderers', 'albion']);
  const candCore = normCand.split(/\s+/).filter((w) => !stopWords.has(w) && w.length >= 3);
  const targetCore = normTarget.split(/\s+/).filter((w) => !stopWords.has(w) && w.length >= 3);
  return candCore.some((w) => targetCore.includes(w));
}

/**
 * 선수 ID 및 영문 선수명으로 사진 URL을 조회합니다.
 * @param {number|string} playerId - 선수 고유 ID
 * @param {string} playerName - 영문 선수명 (예: "Bukayo Saka", "Son Heung-min")
 * @param {AbortSignal} [signal] - Fetch 취소 시그널
 * @param {Object} [options] - 소속 구단명 및 국적 보조 옵션
 * @param {string} [options.teamName] - 소속 구단명 (예: "Arsenal", "Liverpool")
 * @param {string} [options.nationality] - 선수 국적 (예: "England", "South Korea")
 * @returns {Promise<string>} 선수 사진 URL (일치하지 않으면 빈 문자열)
 */
export async function getPlayerPhoto(playerId, playerName, signal, options = {}) {
  const { teamName, nationality } = options;
  const cacheKey = playerId ? Number(playerId) : playerName;
  if (cacheKey && playerPhotoCache.has(cacheKey)) {
    return playerPhotoCache.get(cacheKey);
  }

  const cleanName = String(playerName || '').trim();
  if (!cleanName) return '';

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(cleanName)}`,
      { signal }
    );
    if (!res.ok) return '';
    const data = await res.json();
    const players = Array.isArray(data?.player) ? data.player : [];
    const soccerPlayers = players.filter((p) => p.strSport === 'Soccer' || !p.strSport);
    if (soccerPlayers.length === 0) return '';

    let matched = null;

    // 1단계: 이름 완벽 일치 후보군 추출
    const exactNameMatches = soccerPlayers.filter((item) =>
      [item.strPlayer, ...(item.strPlayerAlternate || '').split(';')].some((v) =>
        matchPlayerName(v, cleanName)
      )
    );

    if (exactNameMatches.length === 1) {
      // 1-1. 이름 완벽 일치자가 1명뿐인 경우: 구단 정보가 있다면 다른 리그 구단인지 교차 확인
      const candidate = exactNameMatches[0];
      if (teamName && candidate.strTeam && !matchTeamName(candidate.strTeam, teamName)) {
        // 이름은 같지만 소속 구단이 완전히 다름 (예: 은퇴 선수, 타 리그 동명이인)
        if (nationality && !normalize(candidate.strNationality).includes(normalize(nationality))) {
          matched = null;
        } else {
          matched = candidate;
        }
      } else {
        matched = candidate;
      }
    } else if (exactNameMatches.length > 1) {
      // 1-2. 이름 완벽 일치자가 여러 명(동명이인)인 경우: 구단명 또는 국적으로 특정
      if (teamName) {
        matched = exactNameMatches.find((p) => matchTeamName(p.strTeam, teamName)) || null;
      }
      if (!matched && nationality) {
        matched = exactNameMatches.find((p) =>
          normalize(p.strNationality) === normalize(nationality)
        ) || null;
      }
    }

    // 2단계: 이름 완벽 일치는 아니지만, 구단명이 확실히 일치하는 후보 탐색
    // (예: TheSportsDB 등록명이 "Gabriel"인데 검색어가 "Gabriel Magalhães"이거나 그 반대인 경우)
    if (!matched && teamName) {
      const teamCandidates = soccerPlayers.filter((p) => matchTeamName(p.strTeam, teamName));
      if (teamCandidates.length > 0) {
        // 구단이 일치하는 후보 중 이름의 핵심 단어가 포함되는 선수 탐색
        const normTarget = normalize(cleanName);
        const targetWords = normTarget.split(/\s+/).filter((w) => w.length >= 3);

        const partialMatch = teamCandidates.find((p) => {
          const normCand = normalize(p.strPlayer);
          const candWords = normCand.split(/\s+/).filter((w) => w.length >= 3);
          return targetWords.some((tw) => candWords.includes(tw));
        });

        if (partialMatch) {
          matched = partialMatch;
        } else if (teamCandidates.length === 1) {
          // 해당 팀에 소속된 축구 선수가 검색 결과에 단 1명뿐인 경우
          matched = teamCandidates[0];
        }
      }
    }

    // 3단계: 검색 결과 자체가 단 1명뿐이고 이름의 핵심 단어가 겹치는 경우
    if (!matched && soccerPlayers.length === 1 && !teamName) {
      const single = soccerPlayers[0];
      const normTarget = normalize(cleanName);
      const normCand = normalize(single.strPlayer);
      const targetWords = normTarget.split(/\s+/).filter((w) => w.length >= 3);
      const candWords = normCand.split(/\s+/).filter((w) => w.length >= 3);
      if (targetWords.some((tw) => candWords.includes(tw))) {
        matched = single;
      }
    }

    // ⚠️ [방어 로직 핵심]:
    // 조건에 부합하지 않는 임의의 첫 번째 선수(|| soccerPlayers[0])는 절대 채택하지 않습니다!
    const imageUrl = matched?.strCutout || matched?.strThumb || '';
    const validUrl =
      imageUrl && /^https:\/\/(www\.|r2\.)?thesportsdb\.com\//.test(imageUrl)
        ? imageUrl
        : '';

    if (cacheKey) {
      playerPhotoCache.set(cacheKey, validUrl);
    }
    return validUrl;
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    return '';
  }
}
