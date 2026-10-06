/**
 * 선수 사진 조회 및 캐싱 유틸리티
 * TheSportsDB API를 사용하여 선수 Cutout / Thumbnail 이미지를 조회합니다.
 */

const playerPhotoCache = new Map();

/**
 * 선수명 비교 (대소문자 무시, 악센트 제거, 공백 및 성/이름 순서 차이 보정)
 * 예: "Son Heung-min" <-> "Heung-min Son"
 */
function matchPlayerName(candidateName, targetName) {
  if (!candidateName || !targetName) return false;
  const normalize = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .trim();

  const normTarget = normalize(targetName);
  const normCandidate = normalize(candidateName);
  if (normTarget === normCandidate) return true;

  // 단어 단위 비교 (정렬 후 비교하여 성/이름 순서 일치 확인)
  const wordsTarget = normTarget.split(/\s+/).filter(Boolean).sort().join(' ');
  const wordsCandidate = normCandidate.split(/\s+/).filter(Boolean).sort().join(' ');
  return wordsTarget === wordsCandidate;
}

/**
 * 선수 ID 및 영문 선수명으로 사진 URL을 조회합니다.
 * @param {number|string} playerId - 선수 고유 ID
 * @param {string} playerName - 영문 선수명 (예: "Bukayo Saka", "Son Heung-min")
 * @param {AbortSignal} [signal] - Fetch 취소 시그널
 * @returns {Promise<string>} 선수 사진 URL (없으면 빈 문자열)
 */
export async function getPlayerPhoto(playerId, playerName, signal) {
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

    // 1. 단어/이름 완벽 매칭 축구 선수 우선 검색
    const matched =
      soccerPlayers.find((item) =>
        [item.strPlayer, ...(item.strPlayerAlternate || '').split(';')].some((v) =>
          matchPlayerName(v, cleanName)
        )
      ) ||
      (soccerPlayers.length === 1 ? soccerPlayers[0] : null) ||
      soccerPlayers[0];

    // 2. cutout 우선, 없을 시 thumbnail
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
