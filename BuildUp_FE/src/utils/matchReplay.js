import { matchPitchPoint } from './matchPlacement.js';

export function replaySavingKeeper(event, homeLineup, awayLineup) {
  if (event.type !== 'save' || ![0, 1].includes(event.side)) return null;
  const lineup = event.side === 0 ? homeLineup : awayLineup;
  const slot = lineup.find(({ player }) => String(player.playerId) === String(event.playerId))
    || lineup.find(({ pos }) => pos === 'GK') || lineup[0];
  if (!slot) return null;
  const placed = event.side === 0 ? matchPitchPoint(slot) : null;
  return { playerId: slot.player.playerId, name: slot.player.nameKor || slot.player.name, side: event.side,
    // A keeper moved upfield in the builder must return to their own goal to save.
    x: Math.max(140, Math.min(220, placed?.x ?? 180)),
    y: Math.max(380, Math.min(410, placed?.y ?? 392)) };
}

export function replayPlayerPoint(point, side, secondHalf) {
  return (side === 1) !== secondHalf ? { x: 360 - point.x, y: 440 - point.y } : { x: point.x, y: point.y };
}

// A save belongs to the defending side; other attacking events belong to the attacker.
export function replayAttackingSide(event) {
  if (event.side !== 0 && event.side !== 1) return null;
  return event.type === 'save' ? 1 - event.side : event.side;
}

export function replaySetPiece(event) {
  return ['corner', 'penalty', 'free-kick'].includes(event.type) ? event.type : null;
}

export function replayNextIndex(index, count) {
  return Math.min(index + 1, Math.max(0, count - 1));
}

export function replayKicker(lineup, event) {
  if (!lineup || lineup.length === 0 || !event) return null;

  // 1. 이벤트 객체에 직접 등록된 playerId가 있는 경우
  if (event.playerId != null) {
    const direct = lineup.find(({ player }) => String(player.playerId) === String(event.playerId));
    if (direct) return direct;
  }

  const desc = event.description || '';

  // 2. 타임라인 설명 문구에서 선수명 직접 포함 여부 확인 (이름 길이 긴 순으로 정렬하여 부분 오인칭 방지)
  const sortedLineup = [...lineup].sort((a, b) =>
    (b.player.nameKor || b.player.name || '').length - (a.player.nameKor || a.player.name || '').length
  );

  const directMatch = sortedLineup.find(({ player }) =>
    [player.nameKor, player.name].some(name => name && desc.includes(name))
  );
  if (directMatch) return directMatch;

  // 3. 타임라인 설명 시작 부분에서 키커명 추출 ("OOO의 코너킥", "OOO의 크로스" 등)
  const prefixMatch = desc.match(/^(.+?)(?:의|이|가)\s*(?:코너킥|크로스|직접|페널티킥|프리킥|슈팅|돌파)/);
  const kickerName = prefixMatch ? prefixMatch[1].trim() : null;
  if (kickerName) {
    const cleanKicker = kickerName.replace(/\s+/g, '').toLowerCase();
    const prefixPlayer = sortedLineup.find(({ player }) => {
      const pKor = (player.nameKor || '').trim();
      const pEng = (player.name || '').trim();
      const pKorClean = pKor.replace(/\s+/g, '').toLowerCase();
      const pEngClean = pEng.replace(/\s+/g, '').toLowerCase();

      return (pKor && (pKor.includes(kickerName) || kickerName.includes(pKor) || pKorClean.includes(cleanKicker) || cleanKicker.includes(pKorClean))) ||
             (pEng && (pEng.toLowerCase().includes(kickerName.toLowerCase()) || kickerName.toLowerCase().includes(pEng.toLowerCase()) || pEngClean.includes(cleanKicker) || cleanKicker.includes(pEngClean)));
    });
    if (prefixPlayer) return prefixPlayer;
  }

  // 4. 공백 제거 후 설명 문구 내 이름 포함 여부 확인 (띄어쓰기 불일치 보정)
  const cleanDesc = desc.replace(/\s+/g, '').toLowerCase();
  const cleanMatch = sortedLineup.find(({ player }) => {
    const pKorClean = (player.nameKor || '').replace(/\s+/g, '').toLowerCase();
    const pEngClean = (player.name || '').replace(/\s+/g, '').toLowerCase();
    return (pKorClean && cleanDesc.includes(pKorClean)) ||
           (pEngClean && cleanDesc.includes(pEngClean));
  });
  if (cleanMatch) return cleanMatch;

  // 5. 기본 Fallback: 공격수(FW) -> 미드필더(MF) -> 첫 번째 선수
  return lineup.find(slot => slot.pos === 'FW') || lineup.find(slot => slot.pos === 'MF') || lineup[0] || null;
}

export function replayFreeKickWall(lineup) {
  return lineup.filter(slot => slot.pos !== 'GK')
    .sort((a, b) => ['DF', 'MF', 'FW'].indexOf(a.pos) - ['DF', 'MF', 'FW'].indexOf(b.pos)).slice(0, 4);
}

// Positions are in each team's own coordinates: their goal is at the bottom (y = 420), opponent goal at top (y = 10~20).
export function replayFreeKickPosition({ localBall, attacking, isKicker, pos, wallIndex, wallCount, supportIndex = 0 }) {
  if (isKicker) return { x: localBall.x, y: localBall.y + 42 };
  if (pos === 'GK') return { x: 180, y: attacking ? 392 : 420 };
  if (!attacking && wallIndex >= 0) {
    return {
      x: localBall.x + (180 - localBall.x) * 0.45 + (wallIndex - (wallCount - 1) / 2) * 30,
      y: localBall.y + 42,
    };
  }

  const idx = Math.max(0, supportIndex);

  if (attacking) {
    // 1. 공격팀 FW: 페널티 박스 안 골문 앞 헤더 경합 지점으로 쇄도/침투 분산 (상대 골문 y = 10~20 앞 박스 y = 42~58)
    if (pos === 'FW') {
      const offsetX = ((idx % 3) - 1) * 34 + (idx % 2 === 0 ? -6 : 6);
      const offsetY = Math.floor(idx / 3) * 10 + (idx % 2 === 0 ? 0 : 5);
      return {
        x: Math.max(120, Math.min(240, 180 + offsetX)),
        y: Math.max(42, Math.min(58, 46 + offsetY)),
      };
    }
    // 2. 공격팀 MF: 박스 바깥 아크/페널티 라인 전방(y = 66~76) 및 측면 세컨드볼 대기
    // 프리키커(y = 137, 공 y = 95) 주변 반경을 완전히 비워 키커만 홀로 공 앞에 위치하도록 함
    if (pos === 'MF') {
      const sideOffset = idx % 2 === 0 ? -1 : 1;
      const rank = Math.floor(idx / 2);
      let mfX = 180 + sideOffset * (55 + rank * 35);
      if (Math.abs(mfX - localBall.x) < 36) {
        mfX = localBall.x + (mfX >= localBall.x ? 44 : -44);
      }
      return {
        x: Math.max(65, Math.min(295, mfX)),
        y: Math.max(66, Math.min(76, 70 + (idx % 2 === 0 ? -3 : 3))),
      };
    }
    // 3. 공격팀 DF: 상대 역습 차단을 위해 후방/하프라인 라인 형성 (y = 210~230)
    if (pos === 'DF') {
      const lineX = ((idx % 4) - 1.5) * 48;
      const staggerY = idx % 2 === 0 ? -8 : 8;
      return {
        x: Math.max(70, Math.min(290, 180 + lineX)),
        y: Math.max(198, Math.min(235, 215 + staggerY)),
      };
    }
  } else {
    // 4. 수비팀 DF: 골문 앞 공격수들을 둘러싸는 대인 마크(맨마킹) 배치 (자책 골문 y = 420 앞 박스 y = 382~398, flipped y = 42~58)
    if (pos === 'DF') {
      const markX = ((idx % 3) - 1) * 36 + (idx % 2 === 0 ? 8 : -8);
      const markY = (idx % 3) * 6;
      return {
        x: Math.max(120, Math.min(240, 180 + markX)),
        y: Math.max(382, Math.min(398, 394 - markY)),
      };
    }
    // 5. 수비팀 MF: 박스 정면/측면 세컨드볼 차단 (자책 박스 아크 라인 y = 362~374, flipped y = 66~78)
    if (pos === 'MF') {
      const sideOffset = idx % 2 === 0 ? -1 : 1;
      const rank = Math.floor(idx / 2);
      let defMfX = 180 + sideOffset * (50 + rank * 35);
      if (Math.abs(defMfX - localBall.x) < 36) {
        defMfX = localBall.x + (defMfX >= localBall.x ? 44 : -44);
      }
      return {
        x: Math.max(65, Math.min(295, defMfX)),
        y: Math.max(362, Math.min(374, 368 + (idx % 2 === 0 ? -3 : 3))),
      };
    }
    // 6. 수비팀 FW: 전방 역습 대기 위치 (하프라인 y = 220 주변 대기)
    if (pos === 'FW') {
      const counterX = ((idx % 3) - 1) * 45;
      const counterY = idx % 2 === 0 ? -10 : 10;
      return {
        x: Math.max(90, Math.min(270, 180 + counterX)),
        y: Math.max(205, Math.min(235, 220 + counterY)),
      };
    }
  }

  // Fallback for unclassified position
  return { x: 60 + (idx % 4) * 80, y: 205 + Math.floor(idx / 4) * 55 };
}

/**
 * 코너킥 상황 선수 위치 계산 (공격팀 박스 침투 및 수비팀 1:1 대인 마크)
 */
export function replayCornerPosition({ localBall, attacking, isKicker, pos, outfieldIndex = 0 }) {
  // 공격팀 관점에서 볼이 좌측 코너인지 여부 (수비팀 좌표계에서는 좌우가 반전되므로 x > 180이 공격팀 좌측에 대응)
  const isAttackerLeftCorner = attacking ? localBall.x < 180 : localBall.x > 180;

  // 1. 코너키커: 코너 플래그 지점
  if (isKicker) {
    return {
      x: isAttackerLeftCorner ? localBall.x + 12 : localBall.x - 12,
      y: localBall.y + (localBall.y < 220 ? 12 : -12),
    };
  }

  // 2. 골키퍼: 골문 앞 방어
  if (pos === 'GK') {
    return { x: 180, y: attacking ? 392 : 422 };
  }

  // 코너킥 시 공격팀의 위험 지역 쇄도 지점 (상대 박스 y = 36~76)
  const attackSpots = [
    { x: isAttackerLeftCorner ? 145 : 215, y: 42 }, // 니어 포스트 쇄도
    { x: 180, y: 52 },                              // 페널티 스팟
    { x: isAttackerLeftCorner ? 215 : 145, y: 44 }, // 파 포스트
    { x: 165, y: 36 },                              // 6야드 박스 좌측
    { x: 195, y: 36 },                              // 6야드 박스 우측
    { x: 138, y: 62 },                              // 박스 좌측
    { x: 222, y: 62 },                              // 박스 우측
    { x: isAttackerLeftCorner ? 120 : 240, y: 76 }, // 박스 외곽 세컨드볼 대기
  ];

  const idx = Math.max(0, outfieldIndex);

  if (attacking) {
    // 공격팀 후방 역습 대비 (DF 2명 등)
    if (idx >= 8 || (pos === 'DF' && idx >= 6)) {
      const dfOffset = (idx % 2 === 0 ? -24 : 24);
      return { x: 180 + dfOffset, y: 220 };
    }
    // 박스 안 공격수 침투 지점
    return attackSpots[idx % attackSpots.length];
  } else {
    // 수비팀: 공격팀을 1:1로 철저히 맨마킹 (대인 마크)
    // 수비팀 자체 좌표계(자책 골문 y = 420)에서 공격수와 자책 골문 사이에 위치하도록 배치
    if (idx < attackSpots.length) {
      const targetSpot = attackSpots[idx];
      const tightX = (idx % 2 === 0 ? 5 : -5);
      const tightY = (idx % 2 === 0 ? 6 : 8);
      return {
        x: Math.max(100, Math.min(260, 360 - targetSpot.x + tightX)),
        y: Math.max(364, Math.min(412, 440 - targetSpot.y + tightY)),
      };
    }
    // 추가 수비: 니어포스트 골라인 커버 또는 전방 역습 대기
    if (idx === attackSpots.length) {
      return { x: isAttackerLeftCorner ? 148 : 212, y: 422 };
    }
    return { x: 180, y: 225 };
  }
}

