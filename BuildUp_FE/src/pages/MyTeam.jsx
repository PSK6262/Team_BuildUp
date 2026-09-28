import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getAllPremierLeaguePlayers, getInitialTeams, getTeams } from '../api/teamApi.js';
import '../css/MyTeam.css';

// 지정 프리셋 포메이션 정의 (DF - MF - FW 합계는 모두 10)
const FORMATION_PRESETS = [
  { label: '4-3-3', df: 4, mf: 3, fw: 3 },
  { label: '4-4-2', df: 4, mf: 4, fw: 2 },
  { label: '3-5-2', df: 3, mf: 5, fw: 2 },
  { label: '3-4-3', df: 3, mf: 4, fw: 3 },
  { label: '4-2-3-1', df: 4, mf: 5, fw: 1 },
  { label: '5-3-2', df: 5, mf: 3, fw: 2 },
  { label: '5-4-1', df: 5, mf: 4, fw: 1 },
  { label: '4-1-4-1', df: 4, mf: 5, fw: 1 },
  { label: '5-2-3', df: 5, mf: 2, fw: 3 },
];

const LOCAL_STORAGE_KEY = 'buildup_custom_squad_v1';
const CLUB_EMBLEM_FALLBACKS = new Map(getInitialTeams().map((team) => [String(team.teamId), team.emblemUrl]));

function RosterClubEmblem({ club, className }) {
  const [failedUrls, setFailedUrls] = useState([]);
  const src = [club.emblemUrl, CLUB_EMBLEM_FALLBACKS.get(String(club.teamId))]
    .find((url) => url && !failedUrls.includes(url));
  return src ? (
    <img src={src} alt={`${club.teamNameKor || club.teamName} 로고`} className={className}
      draggable={false} onError={() => setFailedUrls((urls) => [...urls, src])} />
  ) : <span className="club-card-fallback" role="img" aria-label={`${club.teamNameKor || club.teamName} 로고 로딩 실패`}>🛡️</span>;
}

function createSquadImage(teamName, formation, slots) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 1440;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('스쿼드 이미지를 만들 수 없는 브라우저입니다.');
  ctx.fillStyle = '#101d2c';
  ctx.fillRect(0, 0, 1200, 1440);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#00ff87';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('PL:UG MY TEAM', 600, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(teamName.trim() || '나만의 드림 스쿼드', 600, 108, 1080);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '24px sans-serif';
  const formationText = formation.presetLabel || `${formation.df}-${formation.mf}-${formation.fw}`;
  ctx.fillText(`${formationText}  ·  ${slots.filter((slot) => slot.player).length}/11명`, 600, 152);

  const pitch = { x: 40, y: 190, width: 1120, height: 1180 };
  for (let stripe = 0; stripe < 10; stripe++) {
    ctx.fillStyle = stripe % 2 ? '#194f3a' : '#154631';
    ctx.fillRect(pitch.x, pitch.y + stripe * pitch.height / 10, pitch.width, pitch.height / 10);
  }
  ctx.strokeStyle = '#a7c9ba';
  ctx.lineWidth = 3;
  ctx.strokeRect(pitch.x + 18, pitch.y + 18, pitch.width - 36, pitch.height - 36);
  ctx.beginPath();
  ctx.moveTo(pitch.x + 18, pitch.y + pitch.height / 2);
  ctx.lineTo(pitch.x + pitch.width - 18, pitch.y + pitch.height / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(600, pitch.y + pitch.height / 2, 115, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeRect(350, pitch.y + 18, 500, 165);
  ctx.strokeRect(350, pitch.y + pitch.height - 183, 500, 165);

  const colors = { GK: '#facc15', DF: '#60a5fa', MF: '#4ade80', FW: '#fb923c' };
  slots.forEach((slot) => {
    const x = pitch.x + Math.max(8, Math.min(92, slot.x ?? 50)) / 100 * pitch.width;
    const y = pitch.y + Math.max(7, Math.min(93, slot.y ?? 50)) / 100 * pitch.height;
    ctx.fillStyle = slot.player ? '#142333' : '#234d40';
    ctx.beginPath();
    ctx.roundRect(x - 82, y - 46, 164, 108, 12);
    ctx.fill();
    ctx.strokeStyle = colors[slot.pos] || '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = colors[slot.pos] || '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(slot.pos, x, y - 17);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 21px sans-serif';
    ctx.fillText(slot.player ? slot.player.nameKor || slot.player.name : '빈 자리', x, y + 13, 150);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px sans-serif';
    ctx.fillText(slot.player?.teamNameKor || slot.player?.teamName || '', x, y + 42, 150);
  });
  return new Promise((resolve, reject) => canvas.toBlob((blob) => {
    if (blob) resolve(blob);
    else reject(new Error('스쿼드 이미지 생성에 실패했습니다.'));
  }, 'image/png'));
}

function AiMatchTimeline({ match }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const activeEventRef = useRef(null);

  useEffect(() => {
    if (!playing || selectedIndex < 6 || selectedIndex >= match.events.length - 6) return;
    const frame = requestAnimationFrame(() => {
      activeEventRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [selectedIndex, playing, match.events.length]);

  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      const nextIndex = Math.min(selectedIndex + 1, match.events.length - 1);
      setSelectedIndex(nextIndex);
      if (nextIndex === selectedIndex) setPlaying(false);
    }, 2400);
    return () => clearTimeout(timer);
  }, [playing, selectedIndex, match]);

  const event = match.events[Math.min(selectedIndex, match.events.length - 1)];
  const bookedPlayers = useMemo(() => new Set(match.events
    .slice(0, selectedIndex + 1)
    .filter((item) => item.type === 'yellow' && item.playerId != null)
    .map((item) => `${item.side}-${item.playerId}`)), [match.events, selectedIndex]);
  const neutral = ['period', 'yellow', 'red'].includes(event.type);
  const attacking = !neutral && (event.type === 'save' ? event.side === 0 : event.side === 1);
  const phase = neutral ? '기본 대형' : attacking ? '공격 전개' : '수비 복귀';
  const lineup = match.opponent.lineup.filter(({ player }) => !event.dismissedAiIds.includes(player.playerId));
  const homeLineup = match.home.filter(({ player }) => !(event.dismissedHomeIds || []).includes(player.playerId));
  const selectEvent = (index) => { setSelectedIndex(index); setPlaying(false); };

  // 이벤트별 공(Ball) 위치 및 전술 라벨 계산
  const getBallPosition = (currentEvent, index) => {
    if (!currentEvent) return { x: 180, y: 220, label: '킥오프' };
    const isAi = currentEvent.side === 1;

    switch (currentEvent.type) {
      case 'period':
        return { x: 180, y: 220, label: currentEvent.label || '킥오프' };

      case 'goal':
        return isAi
          ? { x: 180, y: 24, label: '골!' } // 상대(위) 골망
          : { x: 180, y: 416, label: '골!' }; // 우리(아래) 골망

      case 'penalty':
        return isAi
          ? { x: 180, y: 55, label: 'PK' } // 페널티 스팟
          : { x: 180, y: 385, label: 'PK' };

      case 'miss':
        return isAi
          ? { x: index % 2 === 0 ? 130 : 230, y: 20, label: '슈팅' }
          : { x: index % 2 === 0 ? 130 : 230, y: 420, label: '슈팅' };

      case 'save':
        return isAi
          ? { x: 180 + ((index % 3) - 1) * 26, y: 38, label: '선방' }
          : { x: 180 + ((index % 3) - 1) * 26, y: 402, label: '선방' };

      case 'corner': {
        const isLeft = index % 2 === 0;
        return isAi
          ? { x: isLeft ? 24 : 336, y: 24, label: '코너킥' }
          : { x: isLeft ? 24 : 336, y: 416, label: '코너킥' };
      }

      case 'free-kick':
        return isAi
          ? { x: 135 + (index % 4) * 30, y: 95, label: '프리킥' }
          : { x: 135 + (index % 4) * 30, y: 345, label: '프리킥' };

      case 'offside':
        return isAi
          ? { x: 120 + (index % 3) * 60, y: 110, label: '오프사이드' }
          : { x: 120 + (index % 3) * 60, y: 330, label: '오프사이드' };

      case 'yellow':
      case 'red':
        return {
          x: 100 + (index % 5) * 40,
          y: 175 + (index % 3) * 35,
          label: currentEvent.type === 'red' ? '퇴장' : '파울',
        };

      default:
        return { x: 180, y: 220, label: '경기 중' };
    }
  };

  // 현재 선택된 이벤트 기준 공(Ball) 위치 및 라벨 계산
  const isSecondHalf = event.minute >= 46;
  const baseBallPos = getBallPosition(event, selectedIndex) || { x: 180, y: 220, label: '경기 중' };
  const ballPos = isSecondHalf
    ? { ...baseBallPos, x: 360 - baseBallPos.x, y: 440 - baseBallPos.y }
    : baseBallPos;

  // 세트피스 상황 판정 (코너킥, PK, 프리킥)
  const isCorner = event.type === 'corner';
  const isPk = event.type === 'penalty' || (event.label && event.label.includes('PK'));
  const isFreeKick = event.type === 'free-kick' || (event.label && event.label.includes('프리킥'));
  const isSetPiece = isCorner || isPk || isFreeKick;

  // 세트피스 전담 키커 (FW 우선, 없으면 MF 첫 번째 선수)
  const setPieceKickerId = useMemo(() => {
    if (!isSetPiece) return null;
    const fw = lineup.find((s) => s.pos === 'FW');
    if (fw) return fw.player.playerId;
    const mf = lineup.find((s) => s.pos === 'MF');
    if (mf) return mf.player.playerId;
    return lineup[0]?.player.playerId || null;
  }, [isSetPiece, lineup]);

  // 세트피스(코너킥, PK, 프리킥) 궤적 곡선/직선 경로
  const setPieceTrajectoryPath = useMemo(() => {
    if (!isSetPiece) return null;
    const isAi = event.side === 1;
    const startX = baseBallPos.x;
    const startY = baseBallPos.y;

    if (isCorner) {
      // 코너킥 크로스 포물선 궤적
      const targetX = 180;
      const targetY = isAi ? 50 : 390;
      const ctrlX = startX < 180 ? 115 : 245;
      const ctrlY = isAi ? 85 : 355;
      return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`;
    }

    if (isPk) {
      // PK 직선 슈팅 궤적 (페널티 스팟 -> 골문 구석)
      const targetX = selectedIndex % 2 === 0 ? 165 : 195;
      const targetY = isAi ? 18 : 422;
      return `M ${startX} ${startY} L ${targetX} ${targetY}`;
    }

    if (isFreeKick) {
      // 프리킥 감아 차는 바나나킥 곡선 궤적 (수비벽을 넘김)
      const targetX = 180 + ((selectedIndex % 3) - 1) * 20;
      const targetY = isAi ? 18 : 422;
      const ctrlX = startX < 180 ? startX - 25 : startX + 25;
      const ctrlY = isAi ? startY - 45 : startY + 45;
      return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`;
    }

    return null;
  }, [isSetPiece, isCorner, isPk, isFreeKick, event.side, baseBallPos.x, baseBallPos.y, selectedIndex]);

  return (
    <section aria-label="주요 사건과 AI 포메이션 움직임">
      <h3>주요 사건 타임라인</h3>
      <div className="myteam-ai-replay">
        <ol className="myteam-ai-events" aria-label="경기 주요 사건 시간순 기록">
          {match.events.map((item, index) => (
            <li key={index} ref={selectedIndex === index ? activeEventRef : null}
              aria-current={selectedIndex === index ? 'step' : undefined}
              className={`myteam-ai-event myteam-ai-event--${item.type}${item.isGoal ? ` myteam-ai-event--goal-${item.side === 0 ? 'home' : 'away'}` : ''}`}>
              <button type="button" className="myteam-ai-event-select" onClick={() => selectEvent(index)} aria-pressed={selectedIndex === index}>
                <span className="myteam-ai-event-minute">{item.minute}분</span>
                <span>
                  <strong>{item.label}</strong>
                  {item.side !== null && <span className="myteam-ai-event-team"> · {item.side === 0 ? match.homeName : match.opponentName}</span>}
                  <span className="myteam-ai-event-description">{item.description}</span>
                </span>
                <span className="myteam-ai-event-score" aria-label={`현재 점수 ${item.score[0]} 대 ${item.score[1]}`}>{item.score.join(' : ')}</span>
              </button>
            </li>
          ))}
        </ol>
        <aside className="myteam-ai-movement">
          <h3>{match.opponentName} · {match.opponent.formation.label} · {phase}</h3>
          <p aria-live="polite">{event.minute}분 · {event.label} · {event.score.join(' : ')}</p>
          <div className="myteam-ai-actions">
            <button type="button" className="myteam-btn myteam-btn-secondary" disabled={selectedIndex === 0} onClick={() => selectEvent(selectedIndex - 1)}>이전</button>
            <button type="button" className="myteam-btn myteam-btn-primary" onClick={() => {
              if (!playing && selectedIndex >= match.events.length - 1) setSelectedIndex(0);
              setPlaying(!playing);
            }}>{playing ? '일시정지' : '움직임 재생'}</button>
            <button type="button" className="myteam-btn myteam-btn-secondary" disabled={selectedIndex >= match.events.length - 1} onClick={() => selectEvent(selectedIndex + 1)}>다음</button>
          </div>
          <p>{isSecondHalf ? '후반' : '전반'} · <span style={{ color: '#60a5fa' }}>● {match.homeName} {homeLineup.length}명 · {isSecondHalf ? '↑' : '↓'} 공격</span>{' / '}<span style={{ color: '#f87171' }}>● {match.opponentName} {lineup.length}명 · {isSecondHalf ? '↓' : '↑'} 공격</span></p>
          <svg className="myteam-ai-mini-pitch" viewBox="0 0 360 440" role="img" aria-label={`양 팀 선수 배치: ${match.homeName} ${homeLineup.length}명, ${match.opponentName} ${lineup.length}명`}>
            <rect x="10" y="10" width="340" height="420" rx="8" fill="#123e30" stroke="#a7c9ba" />
            <path d="M10 220H350 M100 10V70H260V10 M100 430V370H260V430" fill="none" stroke="#a7c9ba" />
            <circle cx="180" cy="220" r="45" fill="none" stroke="#a7c9ba" />
            <text x="180" y="30" textAnchor="middle" fill="#d1fae5" fontSize="12">{isSecondHalf ? '↓' : '↑'} AI 공격 방향</text>

            {/* 세트피스(코너킥/PK/프리킥) 궤적 곡선/직선 점선 */}
            {setPieceTrajectoryPath && (
              <g className="corner-trajectory-group" transform={isSecondHalf ? 'rotate(180 180 220)' : undefined}>
                <path
                  d={setPieceTrajectoryPath}
                  fill="none"
                  stroke="#00ff87"
                  strokeWidth="2.5"
                  strokeDasharray="5,4"
                  opacity="0.88"
                >
                  <animate attributeName="stroke-dashoffset" values="18;0" dur="0.8s" repeatCount="indefinite" />
                </path>
                {/* 킥/슈팅 타겟 지점 펄스 링 */}
                <circle
                  cx={isCorner ? 180 : selectedIndex % 2 === 0 ? 165 : 195}
                  cy={isCorner ? (event.side === 1 ? 50 : 390) : (event.side === 1 ? 18 : 422)}
                  r="9"
                  fill="none"
                  stroke="#00ff87"
                  strokeWidth="1.2"
                  strokeDasharray="3,3"
                >
                  <animate attributeName="r" values="6;13;6" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.2;0.9" dur="1.4s" repeatCount="indefinite" />
                </circle>
              </g>
            )}

            {/* 선수 마커 렌더링 */}
            {[
              { side: 1, fullLineup: match.opponent.lineup, activeLineup: lineup },
              { side: 0, fullLineup: match.home, activeLineup: homeLineup },
            ].flatMap(({ side, fullLineup, activeLineup }) => activeLineup.map(({ pos, player }) => {
              const isBooked = bookedPlayers.has(`${side}-${player.playerId}`);
              const originalRow = fullLineup.filter((slot) => slot.pos === pos);
              const teamAttacking = !neutral && (event.type === 'save' ? event.side !== side : event.side === side);
              const localBall = side === 1 ? baseBallPos : { ...baseBallPos, x: 360 - baseBallPos.x, y: 440 - baseBallPos.y };
              const kickerId = side === 1 ? setPieceKickerId : (activeLineup.find((slot) => slot.pos === 'FW')
                || activeLineup.find((slot) => slot.pos === 'MF') || activeLineup[0])?.player.playerId;
              const index = originalRow.findIndex((slot) => slot.player.playerId === player.playerId);
              const rowSize = Math.min(originalRow.length, 5);
              const subRow = Math.floor(index / 5);
              const count = Math.min(rowSize, originalRow.length - subRow * 5);
              const baseX = 35 + (index % 5 + 1) * 290 / (count + 1);
              const baseY = { GK: 392, DF: 315, MF: 225, FW: 125 }[pos];
              const shift = pos === 'GK' || neutral ? 0 : teamAttacking ? -38 : 35;
              const wide = event.type === 'corner' || event.type === 'free-kick';
              const flank = selectedIndex % 2 === 0 ? -1 : 1;
              const lateral = neutral ? 0 : wide ? flank * 24 : teamAttacking ? (180 - baseX) * 0.2 : flank * 10;

              let x = Math.max(30, Math.min(330, baseX + lateral));
              let y = Math.max(58, Math.min(392, baseY + subRow * 38 + shift));

              // 세트피스(코너킥, PK, 프리킥) 전담 키커 여부
              const isKicker = isSetPiece && player.playerId === kickerId && event.side === side;

              if (isKicker) {
                // 키커가 공과 함께 정확한 위치로 이동!
                if (isCorner) {
                  const isLeft = localBall.x < 180;
                  x = isLeft ? localBall.x + 12 : localBall.x - 12;
                  y = localBall.y + (localBall.y < 220 ? 12 : -12);
                } else if (isPk) {
                  // PK: 공 바로 뒤 중앙 (킥 대기)
                  x = localBall.x;
                  y = localBall.y + 16;
                } else if (isFreeKick) {
                  // 프리킥: 공 바로 뒤 대각
                  x = localBall.x + (localBall.x < 180 ? -8 : 8);
                  y = localBall.y + 14;
                }
              } else if (isPk && event.side === side && pos !== 'GK') {
                // PK 시 나머지 선수들은 페널티 박스 바깥 아크 주위에 도열
                const pIdx = activeLineup.findIndex((s) => s.player.playerId === player.playerId);
                x = 85 + (pIdx * 20);
                y = 88 + ((pIdx % 2) * 8);
              } else if (isPk && event.side !== side && pos === 'GK') {
                // 상대가 PK 찰 때: AI 골키퍼가 골문 정중앙 라인에서 선방 대기
                x = 180;
                y = 422;
              } else if (isFreeKick && event.side !== side && pos !== 'GK') {
                // 상대가 프리킥 찰 때: AI 선수들이 공 앞 30px 지점에 수비벽(Wall) 구축
                const pIdx = activeLineup.findIndex((s) => s.player.playerId === player.playerId);
                if (pIdx < 4) {
                  x = localBall.x - 24 + (pIdx * 16);
                  y = localBall.y - 28;
                }
              } else if (isCorner && event.side === side && pos !== 'GK') {
                // 코너킥 시 나머지 선수들은 박스 안 헤더 쇄도
                const pIdx = activeLineup.findIndex((s) => s.player.playerId === player.playerId);
                x = 135 + ((pIdx * 35) % 100);
                y = 42 + ((pIdx * 16) % 32);
              }

              if (side === 0) { x = 360 - x; y = 440 - y; }
              if (isSecondHalf) { x = 360 - x; y = 440 - y; }

              // 키커 배지 텍스트
              let kickerBadge = '';
              if (isKicker) {
                if (isCorner) kickerBadge = '🚩 ';
                else if (isPk) kickerBadge = '🎯 ';
                else if (isFreeKick) kickerBadge = '⚡ ';
              }

              return (
                <g
                  key={`${side}-${player.playerId}`}
                  className={`myteam-ai-marker ${isKicker ? 'is-corner-kicker' : ''}`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                >
                  <g
                    className="myteam-ai-marker-inner"
                    style={{
                      animationDelay: `${(-((index * 0.35) % 1.5)).toFixed(2)}s`,
                      animationDuration: `${(3.2 + (index % 3) * 0.4).toFixed(1)}s`,
                    }}
                  >
                    <title>
                      {side === 0 ? match.homeName : match.opponentName} · {player.nameKor || player.name} · {pos}
                      {isBooked ? ' · 경고 1회' : ''}
                      {isKicker ? (isCorner ? ' (코너킥 전담)' : isPk ? ' (PK 전담)' : ' (프리킥 전담)') : ''}
                    </title>
                    <circle
                      r={isKicker ? 10 : 9}
                      fill={side === 0 ? '#60a5fa' : '#f87171'}
                      stroke={isKicker ? '#00ff87' : pos === 'GK' ? '#facc15' : '#fff'}
                      strokeWidth={isKicker ? 2 : 1}
                    />
                    <text textAnchor="middle" y="3" fontSize="7" fill="#17212b" fontWeight="800">{pos}</text>
                    {isBooked && (
                      <rect x={isKicker ? 5 : 4.5} y={isKicker ? -15 : -13.5}
                        width={isKicker ? 7 : 6.3} height={isKicker ? 10 : 9}
                        rx="1" fill="#facc15" stroke="#713f12" strokeWidth="0.7"
                        role="img" aria-label="옐로카드" />
                    )}
                    <text textAnchor="middle" y="20" fontSize="7.5" fill="#fff" fontWeight={isKicker ? '700' : 'normal'}>
                      {kickerBadge}{player.nameKor || player.name}
                    </text>
                  </g>
                </g>
              );
            }))}

            {/* 필드 위 공(Ball) 마커 - 스핀 회전 및 다이나믹 바운스 */}
            <g
              className="myteam-ai-ball-marker dynamic-ball"
              style={{
                transform: `translate(${ballPos.x}px, ${ballPos.y}px)`,
              }}
            >
              <title>⚽ 현재 공 위치: {ballPos.label}</title>
              {/* 바닥 다이나믹 그림자 (공이 통통 뛸 때 크기 변화) */}
              <ellipse cx="0" cy="11" rx="9" ry="3.5" fill="rgba(0, 0, 0, 0.5)">
                <animate attributeName="rx" values="9;7;9" dur="1.4s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.3;0.5" dur="1.4s" calcMode="spline" keyTimes="0;0.5;1" keySplines="0.42 0 0.58 1;0.42 0 0.58 1" repeatCount="indefinite" />
              </ellipse>

              {/* 빛나는 펄스 원 */}
              <circle r="15" fill="rgba(0, 255, 135, 0.22)" stroke="#00ff87" strokeWidth="1.5">
                <animate attributeName="r" values="12;21;12" dur="1.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;0.25;0.85" dur="1.6s" repeatCount="indefinite" />
              </circle>

              {/* 통통 튀며 회전하는 축구공 그룹 */}
              <g>
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0; 0,-3; 0,0"
                  dur="1.4s"
                  calcMode="spline"
                  keyTimes="0;0.5;1"
                  keySplines="0.42 0 0.58 1;0.42 0 0.58 1"
                  repeatCount="indefinite"
                />
                {/* 축구공 본체 */}
                <circle r="9" fill="#ffffff" stroke="#111827" strokeWidth="1.4" />
                {/* 고속 회전하는 축구공 오각형 무늬 */}
                <g>
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    from="0"
                    to="360"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <polygon points="0,-3.5 -3,-1.2 -1.8,2.8 1.8,2.8 3,-1.2" fill="#111827" />
                  <line x1="0" y1="-3.5" x2="0" y2="-8" stroke="#111827" strokeWidth="0.8" />
                  <line x1="-3" y1="-1.2" x2="-7" y2="-2.5" stroke="#111827" strokeWidth="0.8" />
                  <line x1="3" y1="-1.2" x2="7" y2="-2.5" stroke="#111827" strokeWidth="0.8" />
                  <line x1="-1.8" y1="2.8" x2="-4.5" y2="7" stroke="#111827" strokeWidth="0.8" />
                  <line x1="1.8" y1="2.8" x2="4.5" y2="7" stroke="#111827" strokeWidth="0.8" />
                </g>
              </g>

              {/* 상단 공 상태 배지 라벨 */}
              <rect
                x="-24"
                y="-27"
                width="48"
                height="14"
                rx="4"
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#00ff87"
                strokeWidth="0.8"
              />
              <text
                x="0"
                y="-17"
                textAnchor="middle"
                fontSize="8.5"
                fill="#00ff87"
                fontWeight="800"
              >
                ⚽ {ballPos.label}
              </text>
            </g>
          </svg>
          <p>재생하면 선수 이동·대각선 침투 및 <strong>공의 위치(⚽)와 코너킥 키커(🚩)</strong>가 사건에 맞춰 생동감 있게 움직입니다.</p>
        </aside>
      </div>
    </section>
  );
}

export default function MyTeam() {
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
  const currentUser = useSelector((state) => state.auth?.user);

  // 1. 전체 선수 & 구단 데이터
  const [allPlayers, setAllPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copyingSquad, setCopyingSquad] = useState(false);
  const [squadLoadError, setSquadLoadError] = useState('');
  const [reloadSquad, setReloadSquad] = useState(0);
  const savePendingRef = useRef(false);
  const accountVersionRef = useRef(0);
  const [aiMatch, setAiMatch] = useState(null);
  const [matching, setMatching] = useState(false);
  const matchRequestRef = useRef(null);
  const aiMatchIdRef = useRef(0);
  const [opponentMode, setOpponentMode] = useState('RANDOM');
  const [opponentClubId, setOpponentClubId] = useState('');

  // 2. 팀 및 포메이션 상태
  const [teamName, setTeamName] = useState('나만의 드림 스쿼드');
  const [formation, setFormation] = useState({ df: 4, mf: 3, fw: 3 });
  
  // 커스텀 포메이션 입력기 상태 (각 위치 1~5, 합계 10)
  const [customDf, setCustomDf] = useState(4);
  const [customMf, setCustomMf] = useState(3);
  const [customFw, setCustomFw] = useState(3);

  // 3. 필드 11개 슬롯 상태
  // slot: { id: number, pos: 'FW'|'MF'|'DF'|'GK', player: Player|null }
  const [slots, setSlots] = useState([]);

  // 클릭으로 선수 배치할 때 활성화된 대상 슬롯 ID
  const [selectedSlotId, setSelectedSlotId] = useState(null);

  // 드래그 앤 드롭 중 대상 슬롯 하이라이트
  const [dragOverSlotId, setDragOverSlotId] = useState(null);

  // 피치 및 자유 드래그 위치 이동 관리
  const pitchRef = useRef(null);
  const dragInfoRef = useRef(null); // { slotId, startX, startY, hasMoved }
  const [activeDragSlotId, setActiveDragSlotId] = useState(null);

  // 4. 선수 검색 & 필터 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosTab, setSelectedPosTab] = useState('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');

  // 4-1. 팀별 선수 보기 모드 상태
  // 'BY_TEAM' (20개 구단별 보기) | 'ALL' (전체 선수 검색)
  const [rosterViewMode, setRosterViewMode] = useState('BY_TEAM');
  // 선택된 특정 구단 ID (null이면 20개 구단 선택 그리드 표시, 값이 있으면 해당 구단 선수단 표시)
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [clubSearchTerm, setClubSearchTerm] = useState('');
  const [clubPosTab, setClubPosTab] = useState('ALL');
  const [clubPickerQuery, setClubPickerQuery] = useState('');

  // 5. 토스트 알림 상태
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef(null);

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // 포메이션별 기본 좌표 계산 헬퍼 (DF, MF, FW, GK)
  // 4-2-3-1, 4-1-4-1 등 라인이 세분화된 포메이션은 동일 선상에 두지 않고 전술적 높낮이(단차) 부여
  const calculateDefaultCoordinates = (dfCount, mfCount, fwCount, presetLabel = null) => {
    const coords = [];
    let idCounter = 0;

    // 1. [4-1-4-1 전용 배치] (DF: 4, MF: 5 [1 홀딩 수미 + 4 미드필더], FW: 1)
    if (presetLabel === '4-1-4-1') {
      // FW: 원톱 스트라이커 (전방 배치)
      coords.push({ id: idCounter++, pos: 'FW', x: 50, y: 16 });

      // MF (5명): 2선 4명 넓게 배치 (위) + 1 홀딩 수미 정중앙 배치 (아래)
      coords.push({ id: idCounter++, pos: 'MF', x: 16, y: 38 }); // LM (좌측 윙어)
      coords.push({ id: idCounter++, pos: 'MF', x: 38, y: 40 }); // LCM (좌측 중앙 미드)
      coords.push({ id: idCounter++, pos: 'MF', x: 62, y: 40 }); // RCM (우측 중앙 미드)
      coords.push({ id: idCounter++, pos: 'MF', x: 84, y: 38 }); // RM (우측 윙어)
      coords.push({ id: idCounter++, pos: 'MF', x: 50, y: 57 }); // CDM (원 볼란치 단독 홀딩)

      // DF (4명): 4백 수비 라인
      coords.push({ id: idCounter++, pos: 'DF', x: 14, y: 70 }); // LB
      coords.push({ id: idCounter++, pos: 'DF', x: 38, y: 76 }); // LCB
      coords.push({ id: idCounter++, pos: 'DF', x: 62, y: 76 }); // RCB
      coords.push({ id: idCounter++, pos: 'DF', x: 86, y: 70 }); // RB

      // GK: 골키퍼
      coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });
      return coords;
    }

    // 2. [4-2-3-1 전용 배치] (DF: 4, MF: 5 [2 더블 볼란치 + 3 공미], FW: 1)
    if (presetLabel === '4-2-3-1' || (!presetLabel && dfCount === 4 && mfCount === 5 && fwCount === 1)) {
      // FW: 원톱 스트라이커
      coords.push({ id: idCounter++, pos: 'FW', x: 50, y: 16 });

      // MF (5명): 2선 공격형 미드필더 3명 (위) + 3선 수비형 미드필더 2명 (아래 투볼란치)
      coords.push({ id: idCounter++, pos: 'MF', x: 19, y: 36 }); // LAM
      coords.push({ id: idCounter++, pos: 'MF', x: 50, y: 34 }); // CAM (중앙 공미)
      coords.push({ id: idCounter++, pos: 'MF', x: 81, y: 36 }); // RAM
      coords.push({ id: idCounter++, pos: 'MF', x: 34, y: 55 }); // LDM (좌측 볼란치)
      coords.push({ id: idCounter++, pos: 'MF', x: 66, y: 55 }); // RDM (우측 볼란치)

      // DF (4명): 4백 수비 라인
      coords.push({ id: idCounter++, pos: 'DF', x: 14, y: 70 }); // LB
      coords.push({ id: idCounter++, pos: 'DF', x: 38, y: 76 }); // LCB
      coords.push({ id: idCounter++, pos: 'DF', x: 62, y: 76 }); // RCB
      coords.push({ id: idCounter++, pos: 'DF', x: 86, y: 70 }); // RB

      // GK: 골키퍼
      coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });
      return coords;
    }

    // 3. [4-3-3 전용 배치] (DF: 4, MF: 3 [1 수미 + 2 중미], FW: 3 [2 윙 + 1 톱])
    if (presetLabel === '4-3-3' || (dfCount === 4 && mfCount === 3 && fwCount === 3)) {
      // FW: 윙어(약간 뒤/측면), 원톱(전방 침투)
      coords.push({ id: idCounter++, pos: 'FW', x: 18, y: 22 }); // LW
      coords.push({ id: idCounter++, pos: 'FW', x: 50, y: 15 }); // ST
      coords.push({ id: idCounter++, pos: 'FW', x: 82, y: 22 }); // RW

      // MF (역삼각형 3명): CM 2명(약간 올림) + CDM 1명(약간 내림)
      coords.push({ id: idCounter++, pos: 'MF', x: 32, y: 41 }); // LCM
      coords.push({ id: idCounter++, pos: 'MF', x: 68, y: 41 }); // RCM
      coords.push({ id: idCounter++, pos: 'MF', x: 50, y: 54 }); // CDM

      // DF (4명): 풀백(약간 올림), 센터백
      coords.push({ id: idCounter++, pos: 'DF', x: 14, y: 70 });
      coords.push({ id: idCounter++, pos: 'DF', x: 38, y: 76 });
      coords.push({ id: idCounter++, pos: 'DF', x: 62, y: 76 });
      coords.push({ id: idCounter++, pos: 'DF', x: 86, y: 70 });

      // GK
      coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });
      return coords;
    }

    // 4. [4-4-2 전용 배치] (DF: 4, MF: 4, FW: 2)
    if (presetLabel === '4-4-2' || (dfCount === 4 && mfCount === 4 && fwCount === 2)) {
      // FW: 투톱
      coords.push({ id: idCounter++, pos: 'FW', x: 35, y: 17 });
      coords.push({ id: idCounter++, pos: 'FW', x: 65, y: 17 });

      // MF: 양 측면 윙어는 전진(y: 44), 중앙 미드필더는 균형(y: 50)
      coords.push({ id: idCounter++, pos: 'MF', x: 15, y: 44 }); // LM
      coords.push({ id: idCounter++, pos: 'MF', x: 38, y: 50 }); // LCM
      coords.push({ id: idCounter++, pos: 'MF', x: 62, y: 50 }); // RCM
      coords.push({ id: idCounter++, pos: 'MF', x: 85, y: 44 }); // RM

      // DF (4명)
      coords.push({ id: idCounter++, pos: 'DF', x: 14, y: 70 });
      coords.push({ id: idCounter++, pos: 'DF', x: 38, y: 76 });
      coords.push({ id: idCounter++, pos: 'DF', x: 62, y: 76 });
      coords.push({ id: idCounter++, pos: 'DF', x: 86, y: 70 });

      // GK
      coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });
      return coords;
    }

    // 5. [3-5-2 전용 배치] (DF: 3, MF: 5, FW: 2)
    if (presetLabel === '3-5-2' || (dfCount === 3 && mfCount === 5 && fwCount === 2)) {
      // FW: 투톱
      coords.push({ id: idCounter++, pos: 'FW', x: 35, y: 17 });
      coords.push({ id: idCounter++, pos: 'FW', x: 65, y: 17 });

      // MF: 윙백 2명(y: 47) + 공미 2명(y: 39) + 수미 1명(y: 55)
      coords.push({ id: idCounter++, pos: 'MF', x: 12, y: 47 }); // LWB
      coords.push({ id: idCounter++, pos: 'MF', x: 33, y: 39 }); // LCM
      coords.push({ id: idCounter++, pos: 'MF', x: 67, y: 39 }); // RCM
      coords.push({ id: idCounter++, pos: 'MF', x: 88, y: 47 }); // RWB
      coords.push({ id: idCounter++, pos: 'MF', x: 50, y: 55 }); // CDM

      // DF: 3백
      coords.push({ id: idCounter++, pos: 'DF', x: 22, y: 76 });
      coords.push({ id: idCounter++, pos: 'DF', x: 50, y: 77 });
      coords.push({ id: idCounter++, pos: 'DF', x: 78, y: 76 });

      // GK
      coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });
      return coords;
    }

    // 6. [3-4-3 전용 배치] (DF: 3, MF: 4, FW: 3)
    if (presetLabel === '3-4-3' || (dfCount === 3 && mfCount === 4 && fwCount === 3)) {
      coords.push({ id: idCounter++, pos: 'FW', x: 18, y: 21 });
      coords.push({ id: idCounter++, pos: 'FW', x: 50, y: 15 });
      coords.push({ id: idCounter++, pos: 'FW', x: 82, y: 21 });

      coords.push({ id: idCounter++, pos: 'MF', x: 14, y: 44 });
      coords.push({ id: idCounter++, pos: 'MF', x: 38, y: 51 });
      coords.push({ id: idCounter++, pos: 'MF', x: 62, y: 51 });
      coords.push({ id: idCounter++, pos: 'MF', x: 86, y: 44 });

      coords.push({ id: idCounter++, pos: 'DF', x: 22, y: 76 });
      coords.push({ id: idCounter++, pos: 'DF', x: 50, y: 77 });
      coords.push({ id: idCounter++, pos: 'DF', x: 78, y: 76 });

      coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });
      return coords;
    }

    // 7. [5백 포메이션: 5-3-2 / 5-4-1 / 5-2-3]
    if (dfCount === 5) {
      if (fwCount === 1) {
        coords.push({ id: idCounter++, pos: 'FW', x: 50, y: 16 });
      } else if (fwCount === 2) {
        coords.push({ id: idCounter++, pos: 'FW', x: 35, y: 17 });
        coords.push({ id: idCounter++, pos: 'FW', x: 65, y: 17 });
      } else if (fwCount === 3) {
        coords.push({ id: idCounter++, pos: 'FW', x: 18, y: 21 });
        coords.push({ id: idCounter++, pos: 'FW', x: 50, y: 15 });
        coords.push({ id: idCounter++, pos: 'FW', x: 82, y: 21 });
      }

      if (mfCount === 4) {
        coords.push({ id: idCounter++, pos: 'MF', x: 15, y: 43 });
        coords.push({ id: idCounter++, pos: 'MF', x: 38, y: 50 });
        coords.push({ id: idCounter++, pos: 'MF', x: 62, y: 50 });
        coords.push({ id: idCounter++, pos: 'MF', x: 85, y: 43 });
      } else if (mfCount === 3) {
        coords.push({ id: idCounter++, pos: 'MF', x: 32, y: 44 });
        coords.push({ id: idCounter++, pos: 'MF', x: 50, y: 52 });
        coords.push({ id: idCounter++, pos: 'MF', x: 68, y: 44 });
      } else if (mfCount === 2) {
        coords.push({ id: idCounter++, pos: 'MF', x: 36, y: 48 });
        coords.push({ id: idCounter++, pos: 'MF', x: 64, y: 48 });
      }

      // DF (5명): 양쪽 윙백을 올려 3백+2윙백 형태
      coords.push({ id: idCounter++, pos: 'DF', x: 12, y: 67 }); // LWB
      coords.push({ id: idCounter++, pos: 'DF', x: 31, y: 76 }); // LCB
      coords.push({ id: idCounter++, pos: 'DF', x: 50, y: 77 }); // CB
      coords.push({ id: idCounter++, pos: 'DF', x: 69, y: 76 }); // RCB
      coords.push({ id: idCounter++, pos: 'DF', x: 88, y: 67 }); // RWB

      coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });
      return coords;
    }

    // 8. [일반 / 커스텀 포메이션 - 축구 전술적 단차 기본 지원]
    const getXPositions = (count) => {
      if (count <= 0) return [];
      if (count === 1) return [50];
      if (count === 2) return [32, 68];
      if (count === 3) return [20, 50, 80];
      if (count === 4) return [15, 38, 62, 85];
      if (count === 5) return [12, 31, 50, 69, 88];
      const step = 76 / (count - 1);
      return Array.from({ length: count }, (_, i) => Math.round(12 + i * step));
    };

    // FW
    const fwX = getXPositions(fwCount);
    fwX.forEach((x, idx) => {
      let y = 18;
      if (fwCount === 3) {
        y = idx === 1 ? 15 : 21; // 중앙 원톱 전진, 양 윙 약간 뒤
      } else if (fwCount === 1) {
        y = 16;
      }
      coords.push({ id: idCounter++, pos: 'FW', x, y });
    });

    // MF: 5명이면 3명 공미(y=36) + 2명 수미(y=55)로 자동 분리!
    if (mfCount === 5) {
      coords.push({ id: idCounter++, pos: 'MF', x: 19, y: 36 });
      coords.push({ id: idCounter++, pos: 'MF', x: 50, y: 34 });
      coords.push({ id: idCounter++, pos: 'MF', x: 81, y: 36 });
      coords.push({ id: idCounter++, pos: 'MF', x: 34, y: 55 });
      coords.push({ id: idCounter++, pos: 'MF', x: 66, y: 55 });
    } else {
      const mfX = getXPositions(mfCount);
      mfX.forEach((x, idx) => {
        let y = 48;
        if (mfCount === 4) {
          y = (idx === 0 || idx === 3) ? 44 : 50; // 양 윙어 약간 올림
        } else if (mfCount === 3) {
          y = idx === 1 ? 54 : 42; // 중앙 수미 내림
        }
        coords.push({ id: idCounter++, pos: 'MF', x, y });
      });
    }

    // DF: 4명 이상이면 양 끝 풀백은 약간 올림(y: 70), 중앙 센터백은 안정(y: 76)
    const dfX = getXPositions(dfCount);
    dfX.forEach((x, idx) => {
      let y = 74;
      if (dfCount >= 4) {
        const isWingBack = (idx === 0 || idx === dfCount - 1);
        y = isWingBack ? 70 : 76;
      }
      coords.push({ id: idCounter++, pos: 'DF', x, y });
    });

    // GK (골키퍼 1명 고정)
    coords.push({ id: idCounter++, pos: 'GK', x: 50, y: 91 });

    return coords;
  };

  // 포메이션 생성 헬퍼 함수 (각 슬롯에 기본 좌표 부여)
  const buildInitialSlots = (dfCount, mfCount, fwCount, existingSlots = [], presetLabel = null) => {
    const existingPlayersByPos = {
      FW: [],
      MF: [],
      DF: [],
      GK: [],
    };

    // 기존에 배치된 선수들을 포지션별로 모음
    existingSlots.forEach((s) => {
      if (s.player) {
        existingPlayersByPos[s.pos]?.push(s.player);
      }
    });

    const defaultCoords = calculateDefaultCoordinates(dfCount, mfCount, fwCount, presetLabel);
    const posCounters = { FW: 0, MF: 0, DF: 0, GK: 0 };

    return defaultCoords.map((coord) => {
      const pIdx = posCounters[coord.pos]++;
      return {
        id: coord.id,
        pos: coord.pos,
        x: coord.x,
        y: coord.y,
        player: existingPlayersByPos[coord.pos]?.[pIdx] || null,
      };
    });
  };

  // 로그인 사용자는 DB 저장 스쿼드 복원, 비회원은 기존 로컬 초안 복원
  useEffect(() => {
    let isMounted = true;
    accountVersionRef.current++;
    matchRequestRef.current?.abort();
    matchRequestRef.current = null;
    setMatching(false);

    async function loadData() {
      try {
        setLoading(true);
        setSquadLoadError('');
        setTeamName('나만의 드림 스쿼드');
        setFormation({ df: 4, mf: 3, fw: 3, presetLabel: '4-3-3' });
        setCustomDf(4);
        setCustomMf(3);
        setCustomFw(3);
        setSlots(buildInitialSlots(4, 3, 3, [], '4-3-3'));
        setSelectedSlotId(null);
        setAiMatch(null);
        const [playersData, teamsData] = await Promise.all([
          getAllPremierLeaguePlayers(),
          getTeams(),
        ]);

        if (!isMounted) return;

        setAllPlayers(playersData || []);
        setTeams(teamsData || []);

        if (isLoggedIn) {
          const token = localStorage.getItem('buildup_token');
          const response = await fetch('/api/customs', {
            credentials: 'include',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!response.ok) throw new Error(response.status === 401
            ? '로그인이 만료되었습니다. 다시 로그인해주세요.' : '저장된 스쿼드를 불러오지 못했습니다. 다시 불러오기를 눌러주세요.');
          const body = await response.text();
          const savedTeam = body ? JSON.parse(body) : null;
          if (!isMounted) return;
          if (savedTeam) {
            let df = 4;
            let mf = 3;
            let fw = 3;
            let presetLabel = savedTeam.formation || null;
            const parts = savedTeam.formation?.split('-').map(Number);

            if (parts && parts.length === 4 && parts.reduce((sum, n) => sum + n, 0) === 10) {
              // 4-2-3-1, 4-1-4-1 등 4열 포메이션
              df = parts[0];
              mf = parts[1] + parts[2];
              fw = parts[3];
              presetLabel = savedTeam.formation;
            } else if (parts && parts.length === 3 && parts.reduce((sum, n) => sum + n, 0) === 10) {
              // 4-3-3, 4-4-2 등 3열 포메이션
              [df, mf, fw] = parts;
            } else {
              throw new Error('저장된 스쿼드 형식이 올바르지 않습니다.');
            }

            if (!Array.isArray(savedTeam.squads)) {
              throw new Error('저장된 스쿼드 형식이 올바르지 않습니다.');
            }

            const restoredSlots = buildInitialSlots(df, mf, fw, [], presetLabel).map((slot) => {
              const entry = savedTeam.squads.find((s) => Number(s.positionNo) === slot.id + 1);
              const player = entry ? (playersData || []).find((p) => Number(p.playerId) === Number(entry.playerId)) || {
                playerId: entry.playerId,
                name: entry.playerName,
                nameKor: entry.playerName,
                mainPosition: entry.mainPosition,
              } : null;
              return { ...slot, player };
            });
            setTeamName(savedTeam.teamName);
            setFormation({ df, mf, fw, presetLabel });
            setCustomDf(df);
            setCustomMf(mf);
            setCustomFw(fw);
            setSlots(restoredSlots);
          }
          return;
        }

        // 로컬스토리지에서 이전 저장된 스쿼드 복원 시도
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.formation) {
              setTeamName(parsed.teamName || '나만의 드림 스쿼드');
              setFormation(parsed.formation);
              setCustomDf(parsed.formation.df ?? 4);
              setCustomMf(parsed.formation.mf ?? 3);
              setCustomFw(parsed.formation.fw ?? 3);

              if (Array.isArray(parsed.slots) && parsed.slots.length === 11) {
                // 저장된 플레이어 ID로 최신 선수 객체 매핑 및 좌표 복원
                const defaultCoords = calculateDefaultCoordinates(
                  parsed.formation.df ?? 4,
                  parsed.formation.mf ?? 3,
                  parsed.formation.fw ?? 3,
                  parsed.formation.presetLabel ?? null
                );

                const restoredSlots = parsed.slots.map((s, idx) => {
                  const matchedPlayer = s.player?.playerId
                    ? (playersData || []).find((p) => p.playerId === s.player.playerId) || s.player
                    : null;
                  return {
                    ...s,
                    x: s.x !== undefined ? s.x : defaultCoords[idx]?.x ?? 50,
                    y: s.y !== undefined ? s.y : defaultCoords[idx]?.y ?? 50,
                    player: matchedPlayer,
                  };
                });
                setSlots(restoredSlots);
                return;
              }
            }
          } catch (e) {
            console.warn('[MyTeam] 로컬스토리지 복원 실패, 기본값으로 초기화:', e);
          }
        }

        // 기본 4-3-3 포메이션으로 초기 슬롯 생성
        setSlots(buildInitialSlots(4, 3, 3, [], '4-3-3'));
      } catch (err) {
        console.error('[MyTeam] 데이터 로드 오류:', err);
        if (isMounted) setSquadLoadError(err.message || '스쿼드를 불러오지 못했습니다.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
      accountVersionRef.current++;
      matchRequestRef.current?.abort();
      matchRequestRef.current = null;
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [isLoggedIn, currentUser?.userId, reloadSquad]);

  // 커스텀 포메이션 합계 계산 (1~5 규칙 및 합계 10)
  const customSum = customDf + customMf + customFw;
  const isCustomSumValid = customSum === 10;

  // 포메이션 변경 핸들러
  const handleApplyFormation = (newDf, newMf, newFw, presetLabel = null) => {
    if (newDf + newMf + newFw !== 10) {
      showToast(`⚠️ 수비+중앙+공격 합계는 10명이어야 합니다. (현재: ${newDf + newMf + newFw}명)`);
      return;
    }
    if (newDf < 0 || newDf > 10 || newMf < 0 || newMf > 10 || newFw < 0 || newFw > 10) {
      showToast('⚠️ 각 위치(수비, 중앙, 공격)는 최소 0명, 최대 10명까지 가능합니다.');
      return;
    }

    setFormation({ df: newDf, mf: newMf, fw: newFw, presetLabel });
    setCustomDf(newDf);
    setCustomMf(newMf);
    setCustomFw(newFw);
    setSlots((prev) => buildInitialSlots(newDf, newMf, newFw, prev, presetLabel));
    setSelectedSlotId(null);
    showToast(`✅ 포메이션이 ${presetLabel || `${newDf}-${newMf}-${newFw}`}로 변경되었습니다.`);
  };

  // 프리셋 클릭
  const handlePresetSelect = (preset) => {
    handleApplyFormation(preset.df, preset.mf, preset.fw, preset.label);
  };

  // 커스텀 스텝퍼 변경 핸들러 (최소 0명 ~ 최대 10명 제어)
  const handleCustomStepper = (pos, delta) => {
    if (pos === 'DF') {
      const next = Math.max(0, Math.min(10, customDf + delta));
      setCustomDf(next);
    } else if (pos === 'MF') {
      const next = Math.max(0, Math.min(10, customMf + delta));
      setCustomMf(next);
    } else if (pos === 'FW') {
      const next = Math.max(0, Math.min(10, customFw + delta));
      setCustomFw(next);
    }
  };

  // 이미 필드에 배치된 선수 ID Set
  const assignedPlayerIds = useMemo(() => {
    const ids = new Set();
    slots.forEach((s) => {
      if (s.player?.playerId) ids.add(s.player.playerId);
    });
    return ids;
  }, [slots]);

  // 필터링된 선수 목록
  const filteredPlayers = useMemo(() => {
    let list = allPlayers;

    // 1. 포지션 필터
    if (selectedPosTab !== 'ALL') {
      list = list.filter((p) => p.mainPosition === selectedPosTab);
    }

    // 2. 구단 필터
    if (selectedTeamFilter !== 'ALL') {
      const numTeamId = Number(selectedTeamFilter);
      list = list.filter((p) => Number(p.teamId) === numTeamId);
    }

    // 3. 검색어 필터
    if (searchTerm.trim()) {
      const kw = searchTerm.trim().toLowerCase();
      list = list.filter((p) => {
        const nameKor = (p.nameKor || '').toLowerCase();
        const nameEn = (p.name || '').toLowerCase();
        const teamKor = (p.teamNameKor || '').toLowerCase();
        const teamEn = (p.teamName || '').toLowerCase();
        return (
          nameKor.includes(kw) ||
          nameEn.includes(kw) ||
          teamKor.includes(kw) ||
          teamEn.includes(kw)
        );
      });
    }

    return list;
  }, [allPlayers, selectedPosTab, selectedTeamFilter, searchTerm]);

  // 각 구단별 소속 선수 수 매핑
  const teamPlayerCounts = useMemo(() => {
    const counts = {};
    allPlayers.forEach((p) => {
      if (p.teamId) {
        counts[p.teamId] = (counts[p.teamId] || 0) + 1;
      }
    });
    return counts;
  }, [allPlayers]);

  // 20개 구단 선택창에서 검색어 필터링된 구단 목록
  const filteredClubs = useMemo(() => {
    if (!clubPickerQuery.trim()) return teams;
    const q = clubPickerQuery.trim().toLowerCase();
    return teams.filter((t) => {
      const kor = (t.teamNameKor || '').toLowerCase();
      const en = (t.teamName || '').toLowerCase();
      return kor.includes(q) || en.includes(q);
    });
  }, [teams, clubPickerQuery]);

  // 현재 선택된 특정 구단 객체
  const activeClub = useMemo(() => {
    if (!selectedClubId) return null;
    return teams.find((t) => Number(t.teamId) === Number(selectedClubId)) || null;
  }, [teams, selectedClubId]);

  // 선택된 특정 구단의 선수 목록 (포지션 탭 + 검색어 필터링)
  const activeClubPlayers = useMemo(() => {
    if (!selectedClubId) return [];
    let list = allPlayers.filter((p) => Number(p.teamId) === Number(selectedClubId));

    // 구단 내 포지션 필터
    if (clubPosTab !== 'ALL') {
      list = list.filter((p) => p.mainPosition === clubPosTab);
    }

    // 구단 내 선수 검색어
    if (clubSearchTerm.trim()) {
      const q = clubSearchTerm.trim().toLowerCase();
      list = list.filter((p) => {
        const kor = (p.nameKor || '').toLowerCase();
        const en = (p.name || '').toLowerCase();
        return kor.includes(q) || en.includes(q);
      });
    }

    return list;
  }, [allPlayers, selectedClubId, clubPosTab, clubSearchTerm]);

  // 포지션 제한 없이 슬롯에 선수 배치
  const assignPlayerToSlot = (slotId, player) => {
    const targetSlot = slots.find((s) => s.id === slotId);
    if (!targetSlot) return false;

    setSlots((prev) => {
      // 만약 선수가 이미 다른 슬롯에 배치되어 있다면 그 슬롯을 비움 (이동)
      const next = prev.map((s) => {
        if (s.id === slotId) {
          return { ...s, player };
        }
        if (s.player?.playerId === player.playerId) {
          return { ...s, player: null };
        }
        return s;
      });
      return next;
    });
    setSelectedSlotId(null);
    showToast(`⚽ ${player.nameKor || player.name} (${player.mainPosition}) 선수가 배치되었습니다.`);
    return true;
  };

  // 포지션 제한 없이 두 슬롯의 선수 맞바꿈
  const swapSlots = (slotIdA, slotIdB) => {
    const slotA = slots.find((s) => s.id === slotIdA);
    const slotB = slots.find((s) => s.id === slotIdB);
    if (!slotA || !slotB) return;

    setSlots((prev) => {
      return prev.map((s) => {
        if (s.id === slotIdA) return { ...s, player: slotB.player };
        if (s.id === slotIdB) return { ...s, player: slotA.player };
        return s;
      });
    });
    showToast('🔄 두 선수의 위치를 맞바꿨습니다.');
  };

  // 슬롯에서 선수 제거
  const handleRemovePlayerFromSlot = (slotId, e) => {
    if (e) e.stopPropagation();
    setSlots((prev) =>
      prev.map((s) => (s.id === slotId ? { ...s, player: null } : s))
    );
    if (selectedSlotId === slotId) setSelectedSlotId(null);
  };

  // 슬롯 클릭 핸들러
  const handleSlotClick = (slotId) => {
    if (selectedSlotId === slotId) {
      setSelectedSlotId(null); // 토글 해제
    } else {
      setSelectedSlotId(slotId);
    }
  };

  // 선수 목록에서 클릭하면 선택한 슬롯 또는 빈 슬롯에 배치
  const handlePlayerCardClick = (player) => {
    // 1. 이미 선택된 슬롯이 있는 경우
    if (selectedSlotId !== null) {
      assignPlayerToSlot(selectedSlotId, player);
      return;
    }

    // 같은 포지션의 빈 슬롯을 우선하고, 없으면 다른 빈 슬롯 사용
    const emptyMatchingSlot = slots.find(
      (s) => s.pos === player.mainPosition && !s.player
    ) || slots.find((s) => !s.player);
    if (emptyMatchingSlot) {
      assignPlayerToSlot(emptyMatchingSlot.id, player);
      return;
    }

    showToast('⚠️ 비어있는 슬롯이 없습니다. 교체할 슬롯을 먼저 클릭해주세요.');
  };

  // =========================================================
  // 드래그 & 드롭 (HTML5 Drag & Drop) 이벤트
  // =========================================================

  // 1. 선수 카드 드래그 시작 (검색 목록)
  const handleDragStartFromRoster = (e, player) => {
    const dragPayload = {
      type: 'ROSTER_PLAYER',
      player,
    };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragPayload));
    e.dataTransfer.effectAllowed = 'copyMove';
  };

  // 3. 슬롯 위로 드래그 진입 / 이동
  const handleDragOverSlot = (e, slotId) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverSlotId !== slotId) {
      setDragOverSlotId(slotId);
    }
  };

  const handleDragLeaveSlot = (slotId) => {
    if (dragOverSlotId === slotId) {
      setDragOverSlotId(null);
    }
  };

  // 4. 슬롯에 드롭
  const handleDropOnSlot = (e, targetSlotId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlotId(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);

      if (data.type === 'ROSTER_PLAYER' && data.player) {
        // 검색 목록에서 필드로 드롭
        assignPlayerToSlot(targetSlotId, data.player);
      } else if (data.type === 'PITCH_SLOT' && data.slotId !== undefined) {
        // 필드 슬롯 간 맞바꿈 (Swap)
        if (data.slotId !== targetSlotId) {
          swapSlots(data.slotId, targetSlotId);
        }
      }
    } catch (err) {
      console.error('[MyTeam] 드롭 파싱 오류:', err);
    }
  };

  // =========================================================
  // 필드 위 슬롯 자유 드래그 이동 (Pointer Drag)
  // =========================================================
  const handleSlotPointerDown = (slotId, e) => {
    // 마우스 우클릭 제외, 삭제 버튼 클릭 제외
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (e.target.closest('.slot-remove-btn')) return;
    if (dragInfoRef.current) return;

    const pitchEl = pitchRef.current;
    const slot = slots.find((s) => s.id === slotId);
    if (!pitchEl || !slot) return;

    dragInfoRef.current = {
      slotId,
      pointerId: e.pointerId,
      originX: slot.x ?? 50,
      originY: slot.y ?? 50,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handleSlotPointerMove = (slotId, e) => {
    const dragInfo = dragInfoRef.current;
    if (!dragInfo || dragInfo.slotId !== slotId || dragInfo.pointerId !== e.pointerId) return;

    const dx = Math.abs(e.clientX - dragInfo.startX);
    const dy = Math.abs(e.clientY - dragInfo.startY);
    if (dx > 3 || dy > 3) {
      dragInfo.hasMoved = true;
    }

    if (!dragInfo.hasMoved) return;
    setActiveDragSlotId(slotId);

    const pitchEl = pitchRef.current;
    if (!pitchEl) return;

    const rect = pitchEl.getBoundingClientRect();
    const rawX = dragInfo.originX + ((e.clientX - dragInfo.startX) / rect.width) * 100;
    const rawY = dragInfo.originY + ((e.clientY - dragInfo.startY) / rect.height) * 100;

    // 경기장 내부 영역 제한 (좌우 6~94%, 상하 7~93%)
    const clampedX = Math.max(6, Math.min(94, Math.round(rawX * 10) / 10));
    const clampedY = Math.max(7, Math.min(93, Math.round(rawY * 10) / 10));

    setSlots((prev) =>
      prev.map((s) =>
        s.id === slotId ? { ...s, x: clampedX, y: clampedY } : s
      )
    );
  };

  const handleSlotPointerUp = (slotId, e) => {
    const dragInfo = dragInfoRef.current;
    if (!dragInfo || dragInfo.slotId !== slotId || dragInfo.pointerId !== e.pointerId) return;
    const cancelled = e.type === 'pointercancel' || e.type === 'lostpointercapture';
    if (cancelled) {
      setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, x: dragInfo.originX, y: dragInfo.originY } : s));
    } else {
      if (!dragInfo.hasMoved) {
        // 단순 클릭(이동 없음)일 때는 정상 슬롯 선택 동작 수행
        handleSlotClick(slotId);
      } else {
        const pitchEl = pitchRef.current;
        let swapTargetSlotId = null;

        // 1. 직접 마우스가 닿은 다른 슬롯 엘리먼트 감지
        const targetEl = document.elementsFromPoint(e.clientX, e.clientY)
          .map((el) => el.closest('[data-pitch-slot-id]'))
          .find((el) => el && el !== e.currentTarget && pitchRef.current?.contains(el));

        if (targetEl) {
          swapTargetSlotId = Number(targetEl.dataset.pitchSlotId);
        } else if (pitchEl) {
          // 2. 슬롯 바로 위가 아니더라도, 드롭한 위치에서 반경 16% 이내 가장 가까운 슬롯과 스왑
          const rect = pitchEl.getBoundingClientRect();
          const releaseX = ((e.clientX - rect.left) / rect.width) * 100;
          const releaseY = ((e.clientY - rect.top) / rect.height) * 100;

          const nearbySlots = slots
            .filter((s) => s.id !== slotId)
            .map((s) => ({
              id: s.id,
              dist: Math.hypot((s.x ?? 50) - releaseX, (s.y ?? 50) - releaseY),
            }))
            .sort((a, b) => a.dist - b.dist);

          if (nearbySlots.length > 0 && nearbySlots[0].dist <= 16) {
            swapTargetSlotId = nearbySlots[0].id;
          }
        }

        if (swapTargetSlotId !== null && swapTargetSlotId !== slotId) {
          // 원래 위치로 복귀시킨 뒤 두 슬롯의 선수 맞바꿈
          setSlots((prev) => prev.map((s) => s.id === slotId ? { ...s, x: dragInfo.originX, y: dragInfo.originY } : s));
          swapSlots(slotId, swapTargetSlotId);
        }
      }
    }
    dragInfoRef.current = null;
    setActiveDragSlotId(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
  };

  // 피치 잔디 공간에 선수 드롭 시: 마우스 놓은 위치에서 가장 가까운 슬롯에 배치
  const handleDropOnPitch = (e) => {
    e.preventDefault();
    setDragOverSlotId(null);

    const pitchEl = pitchRef.current;
    if (!pitchEl) return;

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);
      if (data.type === 'ROSTER_PLAYER' && data.player) {
        const rect = pitchEl.getBoundingClientRect();
        const dropX = Math.max(6, Math.min(94, (((e.clientX - rect.left) / rect.width) * 100)));
        const dropY = Math.max(7, Math.min(93, (((e.clientY - rect.top) / rect.height) * 100)));

        // 드롭한 마우스 위치(dropX, dropY)와 각 슬롯 간의 물리적 거리 계산
        const slotsByDistance = slots
          .map((s) => ({
            slot: s,
            dist: Math.hypot((s.x ?? 50) - dropX, (s.y ?? 50) - dropY),
          }))
          .sort((a, b) => a.dist - b.dist);

        if (slotsByDistance.length === 0) return;

        // 1순위: 가장 가까운 위치의 '빈 슬롯'
        // (단, 마우스 위치 주변 22% 반경 내에 원래 포지션과 일치하는 빈 슬롯이 있다면 우선 배려)
        const emptySlotsByDist = slotsByDistance.filter(({ slot }) => !slot.player);

        let targetSlot = null;
        if (emptySlotsByDist.length > 0) {
          const nearestEmpty = emptySlotsByDist[0];
          const nearbyMatchingEmpty = emptySlotsByDist.find(
            ({ slot, dist }) => slot.pos === data.player.mainPosition && dist <= nearestEmpty.dist + 22
          );
          targetSlot = nearbyMatchingEmpty ? nearbyMatchingEmpty.slot : nearestEmpty.slot;
        } else {
          // 2순위: 빈 슬롯이 없으면, 드롭한 위치에서 절대적으로 '가장 가까운 슬롯'과 교체/배치
          targetSlot = slotsByDistance[0].slot;
        }

        if (targetSlot) {
          assignPlayerToSlot(targetSlot.id, data.player);
        }
      }
    } catch (err) {
      console.error('[MyTeam] 드롭 오류:', err);
    }
  };

  // 포메이션 기본 좌표로 재정렬
  const handleResetPositions = () => {
    const defaultCoords = calculateDefaultCoordinates(formation.df, formation.mf, formation.fw, formation.presetLabel);

    setSlots((prev) =>
      prev.map((s) => {
        const c = defaultCoords.find((dc) => dc.id === s.id) || {
          x: s.x ?? 50,
          y: s.y ?? 50,
        };
        return {
          ...s,
          x: c.x,
          y: c.y,
        };
      })
    );
    showToast('🔄 선수들의 위치가 포메이션 기본 위치로 재정렬되었습니다.');
  };

  // =========================================================
  // 편의 기능: 초기화, 자동완성, 저장, 공유
  // =========================================================

  // 스쿼드 전체 초기화
  const handleResetSquad = () => {
    if (window.confirm('현재 필드에 배치된 모든 선수를 비우시겠습니까?')) {
      setSlots((prev) => prev.map((s) => ({ ...s, player: null })));
      setSelectedSlotId(null);
      showToast('스쿼드가 초기화되었습니다.');
    }
  };

  // 포지션 상관 없이 자동 완성 (Auto-Fill)
  const handleAutoFillSquad = () => {
    if (loading || slots.length === 0) return;
    const availablePlayers = [...new Map(allPlayers.filter((p) => p.playerId != null)
      .map((p) => [String(p.playerId), p])).values()];
    if (availablePlayers.length < slots.length) {
      showToast('전체 스쿼드를 구성할 선수가 부족합니다.');
      return;
    }

    // 매번 다양하고 재미있는 라인업을 위해 무작위 셔플
    const shuffled = [...availablePlayers];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const currentIds = new Set(slots.filter((slot) => slot.player).map((slot) => String(slot.player.playerId)));
    const candidates = [
      ...shuffled.filter((player) => !currentIds.has(String(player.playerId))),
      ...shuffled.filter((player) => currentIds.has(String(player.playerId))),
    ];
    const nextSlots = slots.map((slot) => {
      const index = candidates.findIndex((player) => String(player.playerId) !== String(slot.player?.playerId));
      const [player] = candidates.splice(index === -1 ? 0 : index, 1);
      return { ...slot, player };
    });
    // 후보가 11명뿐인 경우에도 같은 슬롯에 같은 선수가 남지 않도록 교환.
    nextSlots.forEach((slot, index) => {
      if (String(slot.player.playerId) !== String(slots[index].player?.playerId)) return;
      const other = nextSlots.findIndex((candidate, otherIndex) => otherIndex !== index
        && String(candidate.player.playerId) !== String(slots[index].player?.playerId)
        && String(slot.player.playerId) !== String(slots[otherIndex].player?.playerId));
      if (other !== -1) [nextSlots[index].player, nextSlots[other].player] = [nextSlots[other].player, nextSlots[index].player];
    });
    setSlots(nextSlots);
    setSelectedSlotId(null);
    showToast('⚡ 기존 선수를 포함해 전체 스쿼드를 새로 자동 구성했습니다!');
  };

  // 로그인 사용자의 팀과 선수 배치를 DB에 저장
  const handleSaveSquad = async () => {
    if (!isLoggedIn) {
      showToast('스쿼드를 저장하려면 로그인해주세요.');
      return;
    }
    if (loading || squadLoadError || savePendingRef.current) return;
    const name = teamName.trim();
    if (!name || new TextEncoder().encode(name).length > 100) {
      showToast('스쿼드 이름은 비어 있지 않아야 하며 UTF-8 기준 100바이트 이내여야 합니다.');
      return;
    }
    const payload = {
      teamName: name,
      formation: formation.presetLabel || `${formation.df}-${formation.mf}-${formation.fw}`,
      squads: slots.map((slot) => ({
        positionNo: slot.id + 1,
        position: slot.pos,
        playerId: slot.player?.playerId ?? null,
      })),
    };
    const accountVersion = accountVersionRef.current;
    savePendingRef.current = true;
    setSaving(true);
    try {
      const token = localStorage.getItem('buildup_token');
      const response = await fetch('/api/customs', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || '스쿼드를 저장하지 못했습니다.');
      if (!result?.customTeamId) throw new Error('스쿼드 저장 결과를 확인하지 못했습니다.');
      if (accountVersion === accountVersionRef.current) showToast(`💾 스쿼드 #${result.customTeamId}가 DB에 저장되었습니다.`);
    } catch (e) {
      if (accountVersion === accountVersionRef.current) showToast(e.message || '저장 중 오류가 발생했습니다.');
    } finally {
      savePendingRef.current = false;
      setSaving(false);
    }
  };

  // 현재 배치 좌표를 반영한 PNG 이미지를 클립보드에 복사
  const handleCopyLineup = async () => {
    if (copyingSquad || loading) return;
    if (!window.isSecureContext || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      showToast('이미지 복사를 지원하는 브라우저에서 HTTPS 또는 localhost로 접속해주세요.');
      return;
    }
    setCopyingSquad(true);
    try {
      const image = createSquadImage(teamName, formation, slots);
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': image })]);
      showToast('📋 스쿼드 사진이 복사되었습니다! 이미지 붙여넣기가 가능한 곳에 붙여넣으세요.');
    } catch (error) {
      console.warn('[MyTeam] 스쿼드 이미지 복사 실패:', error);
      showToast('사진을 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해주세요.');
    } finally {
      setCopyingSquad(false);
    }
  };

  // 현재 완성된 인원수 (총 11명)
  const filledCount = slots.filter((s) => s.player).length;
  const selectedOpponentClub = teams.find((team) => String(team.teamId) === opponentClubId);

  const handleAiMatch = async () => {
    if (matchRequestRef.current) return;
    if (loading || slots.length !== 11 || filledCount !== 11 ||
      new Set(slots.map((slot) => String(slot.player?.playerId))).size !== 11) {
      showToast('대전하려면 서로 다른 선수 11명을 먼저 배치해주세요.');
      return;
    }
    const club = opponentMode === 'CLUB'
      ? teams.find((team) => String(team.teamId) === opponentClubId)
      : null;
    if (opponentMode === 'CLUB' && !club) {
      showToast('대결할 상대 구단을 선택해주세요.');
      return;
    }
    const controller = new AbortController();
    matchRequestRef.current = controller;
    setMatching(true);
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch('/api/customs/ai-matches', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: teamName.trim() || '나만의 드림 스쿼드',
          presetLabel: formation.presetLabel,
          opponentTeamId: club?.teamId ?? null,
          squads: slots.map((slot) => ({ positionNo: slot.id + 1, position: slot.pos, playerId: slot.player.playerId })),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'AI 대전을 생성하지 못했습니다.');
      if (!Array.isArray(result?.events) || result.events.length === 0 || !Array.isArray(result?.positionPenalties)
        || !Array.isArray(result?.home) || !Array.isArray(result?.opponent?.lineup) || !Array.isArray(result?.score)) {
        throw new Error('AI 대전 결과를 확인하지 못했습니다.');
      }
      if (matchRequestRef.current === controller && !controller.signal.aborted) {
        setAiMatch({ ...result, replayId: ++aiMatchIdRef.current });
      }
    } catch (error) {
      if (matchRequestRef.current === controller) {
        showToast(error.name === 'AbortError' ? 'AI 대전 요청 시간이 초과되었습니다. 다시 시도해주세요.' : error.message || 'AI 대전 서버에 연결하지 못했습니다.');
      }
    } finally {
      clearTimeout(timeout);
      if (matchRequestRef.current === controller) {
        matchRequestRef.current = null;
        setMatching(false);
      }
    }
  };

  const handleEndAiMatch = () => {
    matchRequestRef.current?.abort();
    matchRequestRef.current = null;
    setMatching(false);
    setAiMatch(null);
  };

  // 슬롯들을 포메이션 행(FW, MF, DF, GK)으로 분류
  const fwSlots = slots.filter((s) => s.pos === 'FW');
  const mfSlots = slots.filter((s) => s.pos === 'MF');
  const dfSlots = slots.filter((s) => s.pos === 'DF');
  const gkSlots = slots.filter((s) => s.pos === 'GK');

  return (
    <div className="myteam-page">
      <div className="myteam-container">
        {/* 1. 상단 헤더 & 툴바 */}
        <header className="myteam-header">
          <div className="myteam-title-box">
            <h1>
              나만의 팀 & 포메이션 빌더
              <span className="myteam-title-badge">PL:UG MY TEAM</span>
            </h1>
            <p>포메이션을 자유롭게 설정하고, 원하는 프리미어리그 선수들을 필드에 드래그하거나 클릭하여 배치하세요.</p>
          </div>

          <div className="myteam-toolbar">
            <input
              type="text"
              className="myteam-name-input"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="구단명 입력"
              title="팀 이름 변경"
            />

            <div className="myteam-squad-counter">
              <span>스쿼드:</span>
              <span className="counter-num">{filledCount} / 11명</span>
            </div>

            <button type="button" className="myteam-btn myteam-btn-secondary" onClick={handleResetSquad} title="스쿼드 초기화">
              🗑️ 비우기
            </button>
            <button type="button" className="myteam-btn myteam-btn-secondary" onClick={handleAutoFillSquad} title="스쿼드 자동 채우기">
              ⚡ 자동완성
            </button>
            <button type="button" className="myteam-btn myteam-btn-secondary" onClick={handleCopyLineup} disabled={copyingSquad || loading} title="스쿼드 사진을 클립보드에 복사">
              {copyingSquad ? '사진 복사 중...' : '📋 공유'}
            </button>
            <button type="button" className="myteam-btn myteam-btn-primary" onClick={handleSaveSquad} disabled={loading || saving || !!squadLoadError} title="스쿼드 DB 저장">
              {saving ? '저장 중...' : '💾 저장하기'}
            </button>
          </div>
        </header>
        {squadLoadError && (
          <div role="alert">
            <p>{squadLoadError}</p>
            <button type="button" className="myteam-btn myteam-btn-secondary" onClick={() => setReloadSquad((value) => value + 1)}>다시 불러오기</button>
          </div>
        )}

        {/* 2. 포메이션 설정 바 */}
        <section className="formation-panel" aria-label="포메이션 설정">
          <div className="formation-panel-inner">
            {/* 프리셋 포메이션 선택기 */}
            <div className="formation-presets-row">
              <span className="formation-label">⭐ 추천 포메이션:</span>
              <div className="preset-chip-group">
                {FORMATION_PRESETS.map((p) => {
                  const isActive = p.label === (formation.presetLabel ?? `${formation.df}-${formation.mf}-${formation.fw}`);
                  return (
                    <button
                      key={p.label}
                      type="button"
                      className={`preset-chip ${isActive ? 'active' : ''}`}
                      aria-pressed={isActive}
                      onClick={() => handlePresetSelect(p)}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 커스텀 포메이션 조작 행 (합계 10명) */}
            <div className="formation-custom-row">
              <span className="formation-label">⚙️ 커스텀 포메이션 (총합 10명):</span>

              <div className="custom-steppers">
                {/* 수비수 (DF) */}
                <div className="stepper-item">
                  <span className="stepper-tag df">DF 수비</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('DF', -1)}
                    disabled={customDf <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="stepper-input"
                    value={customDf}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0));
                      setCustomDf(v);
                    }}
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('DF', 1)}
                    disabled={customDf >= 10}
                  >
                    +
                  </button>
                </div>

                {/* 미드필더 (MF) */}
                <div className="stepper-item">
                  <span className="stepper-tag mf">MF 미드</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('MF', -1)}
                    disabled={customMf <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="stepper-input"
                    value={customMf}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0));
                      setCustomMf(v);
                    }}
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('MF', 1)}
                    disabled={customMf >= 10}
                  >
                    +
                  </button>
                </div>

                {/* 공격수 (FW) */}
                <div className="stepper-item">
                  <span className="stepper-tag fw">FW 공격</span>
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('FW', -1)}
                    disabled={customFw <= 0}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    className="stepper-input"
                    value={customFw}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(10, parseInt(e.target.value, 10) || 0));
                      setCustomFw(v);
                    }}
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={() => handleCustomStepper('FW', 1)}
                    disabled={customFw >= 10}
                  >
                    +
                  </button>
                </div>

                <div className="stepper-gk-info">
                  🧤 GK 골키퍼: 1명 고정
                </div>
              </div>

              {/* 합계 및 적용 버튼 */}
              <div className="formation-status-indicator">
                <span className={`sum-badge ${isCustomSumValid ? 'valid' : 'invalid'}`}>
                  {isCustomSumValid
                    ? `✓ 합계: ${customSum}/10명 (완료)`
                    : `⚠️ 합계: ${customSum}/10명 (10명이어야 합니다)`}
                </span>

                <button
                  type="button"
                  className="myteam-btn myteam-btn-primary"
                  onClick={() => handleApplyFormation(customDf, customMf, customFw)}
                  disabled={!isCustomSumValid}
                  style={{ opacity: isCustomSumValid ? 1 : 0.4, cursor: isCustomSumValid ? 'pointer' : 'not-allowed' }}
                >
                  포메이션 적용
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="myteam-ai-panel" aria-labelledby="ai-match-title">
          <div className="myteam-ai-heading">
            <div className="myteam-opponent-section">
              <h2 id="ai-match-title">AI 팀과 대전</h2>
              <p>매판 무작위 포메이션과 선수로 구성된 AI 팀에 도전하세요. AI는 각 자리에 같은 포지션의 선수만 배치합니다.</p>
              <p>90분 경기를 즉시 시뮬레이션합니다. 원래 포지션과 다른 자리에 배치한 선수 1명당 팀의 득점 확률이 5%씩, 최대 50% 감소합니다. 일반 슈팅·PK·프리킥에 모두 적용되며 실제 선수 능력치는 반영하지 않습니다.</p>
              <p>현재 내 팀: 포지션 불일치 {slots.filter(({ pos, player }) => player && pos !== player.mainPosition).length}명</p>
              <div className="myteam-opponent-modes" role="group" aria-label="대전 상대 유형">
                <button type="button" className="myteam-opponent-mode"
                  aria-pressed={opponentMode === 'RANDOM'} onClick={() => setOpponentMode('RANDOM')}>
                  <span aria-hidden="true">🎲</span><span><strong>랜덤 AI 대전</strong><small>전체 구단 선수로 구성된 랜덤 상대</small></span>
                </button>
                <button type="button" className="myteam-opponent-mode"
                  aria-pressed={opponentMode === 'CLUB'} onClick={() => setOpponentMode('CLUB')}>
                  <span aria-hidden="true">🛡️</span><span><strong>구단 선택 대전</strong><small>20개 구단 중 원하는 상대를 직접 선택</small></span>
                </button>
              </div>
                {opponentMode === 'CLUB' && (
                  <div className="myteam-opponent-picker">
                    <div className="myteam-opponent-picker-heading">
                      <h3>상대 구단 선택 <span>{teams.length}개 구단</span></h3>
                      <span className="myteam-opponent-selection" role="status">
                        {selectedOpponentClub ? `✓ ${selectedOpponentClub.teamNameKor || selectedOpponentClub.teamName} 선택됨` : '아래 구단 카드를 선택해주세요'}
                      </span>
                    </div>
                    <div className="myteam-opponent-grid" role="group" aria-label="상대 구단 선택">
                      {loading ? <p>구단 목록을 불러오는 중입니다...</p> : teams.length === 0 ? <p>선택 가능한 구단이 없습니다.</p> : teams.map((team) => {
                        const selected = String(team.teamId) === opponentClubId;
                        return (
                          <button type="button" key={team.teamId} className="myteam-opponent-club"
                            aria-pressed={selected} onClick={() => setOpponentClubId(String(team.teamId))}>
                            <span className="myteam-opponent-emblem" aria-hidden="true">
                              {team.emblemUrl ? <img src={team.emblemUrl} alt="" draggable={false}
                                onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : '🛡️'}
                            </span>
                            <span>{team.teamNameKor || team.teamName}</span>
                            <span className="myteam-opponent-check" aria-hidden="true">{selected ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              {opponentMode === 'CLUB' && <p>선택한 구단 소속 선수만으로 매판 포메이션과 선발 11명을 무작위 구성합니다. 모든 선수는 원래 포지션에 배치됩니다.</p>}
            </div>
            <div className="myteam-ai-actions">
              {(aiMatch || matching) && (
                <button type="button" className="myteam-btn myteam-btn-secondary"
                  onClick={handleEndAiMatch}>
                  대전 끝내기
                </button>
              )}
              <button type="button" className="myteam-btn myteam-btn-primary"
                onClick={handleAiMatch} disabled={loading || matching || filledCount !== 11 || (opponentMode === 'CLUB' && !opponentClubId)}>
                {matching ? 'AI 대전 준비 중...' : opponentMode === 'CLUB' ? (selectedOpponentClub ? `${selectedOpponentClub.teamNameKor || selectedOpponentClub.teamName} 상대 대전 시작` : '상대 구단을 먼저 선택해주세요') : (aiMatch ? '새 AI 팀과 다시 대전' : 'AI 대전 시작')}
              </button>
            </div>
          </div>
          {filledCount !== 11 && <p>선수 11명을 배치하면 대전을 시작할 수 있습니다. ({filledCount}/11명)</p>}
          {aiMatch && (
            <div className="myteam-ai-result">
              <div className="myteam-ai-score" role="status">
                <span>{aiMatch.homeName}</span>
                <strong>{aiMatch.score[0]} : {aiMatch.score[1]}</strong>
                <span>{aiMatch.opponentName}</span>
                <b>{aiMatch.score[0] === aiMatch.score[1] ? '무승부' : aiMatch.score[0] > aiMatch.score[1] ? '승리!' : '패배'} · 경기 종료</b>
              </div>
              <div className="myteam-ai-lineups">
                {[
                  { name: aiMatch.homeName, formation: aiMatch.homeFormation, lineup: aiMatch.home },
                  { name: aiMatch.opponentName, formation: aiMatch.opponent.formation.label, lineup: aiMatch.opponent.lineup },
                ].map((team, index) => {
                  const penalty = aiMatch.positionPenalties[index];
                  const positionOrder = ['GK', 'DF', 'MF', 'FW'];
                  const displayLineup = [...team.lineup].sort((a, b) =>
                    positionOrder.indexOf(a.pos) - positionOrder.indexOf(b.pos));
                  return (
                    <div key={index} className="myteam-ai-lineup-column">
                      <h3>{team.name} · {team.formation}</h3>
                      <div className="myteam-ai-lineup-effects">
                      {penalty.isPerfectSynergy ? (
                        <div style={{ marginBottom: '10px', background: 'rgba(0, 255, 135, 0.12)', border: '1px solid #00ff87', borderRadius: '8px', padding: '8px 12px' }}>
                          <p style={{ color: '#00ff87', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                            🔥 [완벽한 팀 시너지 버프] 11명 전원 포지션 일치!
                          </p>
                          <p style={{ color: '#a7f3d0', fontSize: '11px', margin: '0 0 6px 0' }}>
                            모든 선수가 최적의 역할을 수행하여 팀 전체 스탯이 대폭 강화됩니다.
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
                            <span style={{ background: 'rgba(0, 255, 135, 0.22)', border: '1px solid #00ff87', color: '#00ff87', padding: '2px 6px', borderRadius: '4px' }}>
                              ⚽ 골 결정력 +20%
                            </span>
                            <span style={{ background: 'rgba(0, 255, 135, 0.22)', border: '1px solid #00ff87', color: '#00ff87', padding: '2px 6px', borderRadius: '4px' }}>
                              🎯 패스 성공률 +20%
                            </span>
                            <span style={{ background: 'rgba(0, 255, 135, 0.22)', border: '1px solid #00ff87', color: '#00ff87', padding: '2px 6px', borderRadius: '4px' }}>
                              🛡️ 수비 효율 +25%
                            </span>
                            <span style={{ background: 'rgba(0, 255, 135, 0.22)', border: '1px solid #00ff87', color: '#00ff87', padding: '2px 6px', borderRadius: '4px' }}>
                              🧤 선방 확률 +15%
                            </span>
                          </div>
                        </div>
                      ) : penalty.mismatchCount === 0 ? null : penalty.isAllMismatch ? (
                        <div style={{ marginBottom: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '8px 12px' }}>
                          <p style={{ color: '#f87171', fontWeight: 'bold', margin: '0 0 4px 0' }}>
                            🚨 [극심한 전술 붕괴 디버프] 11명 전원 포지션 불일치!
                          </p>
                          <p style={{ color: '#fca5a5', fontSize: '11px', margin: '0 0 6px 0' }}>
                            전원 부적응으로 팀 조직력이 완전히 와해되어 모든 스탯이 추가 -25% 급감합니다.
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
                            <span style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid #ef4444', color: '#fecaca', padding: '2px 6px', borderRadius: '4px' }}>
                              ⚽ 골 확률 {penalty.fwPenaltyPercent}% 감소
                            </span>
                            <span style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid #ef4444', color: '#fecaca', padding: '2px 6px', borderRadius: '4px' }}>
                              🎯 패스 확률 {penalty.mfPenaltyPercent}% 감소
                            </span>
                            <span style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid #ef4444', color: '#fecaca', padding: '2px 6px', borderRadius: '4px' }}>
                              🛡️ 수비 효율 {penalty.dfPenaltyPercent}% 감소
                            </span>
                            <span style={{ background: 'rgba(239, 68, 68, 0.25)', border: '1px solid #ef4444', color: '#fecaca', padding: '2px 6px', borderRadius: '4px' }}>
                              🧤 선방 확률 {penalty.gkPenaltyPercent}% 감소
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div style={{ marginBottom: '10px' }}>
                          <p style={{ color: '#f87171', fontWeight: 'bold', margin: '4px 0' }}>
                            ⚠️ 포지션 불일치 {penalty.mismatchCount}명 패널티 적용 중
                          </p>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '11px', marginTop: '4px' }}>
                            {penalty.fwMismatchCount > 0 && (
                              <span style={{ background: 'rgba(239, 68, 68, 0.18)', border: '1px solid #ef4444', color: '#fca5a5', padding: '2px 6px', borderRadius: '4px' }}>
                                ⚽ FW 불일치 {penalty.fwMismatchCount}명: 골 확률 {penalty.fwPenaltyPercent}% 감소
                              </span>
                            )}
                            {penalty.mfMismatchCount > 0 && (
                              <span style={{ background: 'rgba(234, 179, 8, 0.18)', border: '1px solid #eab308', color: '#fde047', padding: '2px 6px', borderRadius: '4px' }}>
                                🎯 MF 불일치 {penalty.mfMismatchCount}명: 패스 확률 {penalty.mfPenaltyPercent}% 감소
                              </span>
                            )}
                            {penalty.dfMismatchCount > 0 && (
                              <span style={{ background: 'rgba(59, 130, 246, 0.18)', border: '1px solid #3b82f6', color: '#93c5fd', padding: '2px 6px', borderRadius: '4px' }}>
                                🛡️ DF 불일치 {penalty.dfMismatchCount}명: 수비 효율 {penalty.dfPenaltyPercent}% 감소
                              </span>
                            )}
                            {penalty.gkMismatchCount > 0 && (
                              <span style={{ background: 'rgba(217, 70, 239, 0.18)', border: '1px solid #d946ef', color: '#f0abfc', padding: '2px 6px', borderRadius: '4px' }}>
                                🧤 GK 불일치: 선방 확률 {penalty.gkPenaltyPercent}% 감소
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      </div>
                      <ul>
                        {displayLineup.map(({ pos, player }) => {
                          const isMismatch = pos !== player.mainPosition;
                          const penaltyLabel = isMismatch
                            ? pos === 'FW' ? ' · ⚠ 골 확률 감소'
                            : pos === 'MF' ? ' · ⚠ 패스 확률 감소'
                            : pos === 'DF' ? ' · ⚠ 수비 효율 감소'
                            : ' · ⚠ 선방 확률 감소'
                            : '';
                          return (
                            <li key={player.playerId}>
                              <span className="myteam-ai-position">{pos}</span>
                              <span>
                                {player.nameKor || player.name}
                                <small>
                                  {player.teamNameKor || player.teamName} · 원래 포지션 {player.mainPosition}
                                  {isMismatch && <span style={{ color: '#f87171', fontWeight: 'bold' }}>{penaltyLabel}</span>}
                                </small>
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
              <AiMatchTimeline key={aiMatch.replayId} match={aiMatch} />
            </div>
          )}
        </section>

        {/* 3. 메인 빌더 레이아웃 (축구 경기장 피치 vs 선수 검색 패널) */}
        <div className="myteam-main-layout">
          {/* 3-A. 축구 경기장 (Pitch) */}
          <section className="myteam-pitch-card">
            <div className="pitch-header-info">
              <div className="pitch-formation-display">
                <span>📍 현재 포메이션:</span>
                <span style={{ color: '#00ff87' }}>{formation.presetLabel || `${formation.df}-${formation.mf}-${formation.fw}`}</span>
                <button
                  type="button"
                  className="myteam-btn-mini"
                  onClick={handleResetPositions}
                  title="선수들을 포메이션 기본 위치로 재정렬"
                >
                  🔄 위치 정렬
                </button>
              </div>
              <div className="pitch-hint">
                {selectedSlotId !== null ? (
                  <span style={{ color: '#00ff87', fontWeight: 700 }}>
                    👉 우측 목록에서 배치할 선수를 클릭하세요!
                  </span>
                ) : (
                  '💡 선수를 드래그하여 필드 원하는 곳으로 자유롭게 움직이세요'
                )}
              </div>
            </div>

            <div
              className="myteam-pitch"
              ref={pitchRef}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
              }}
              onDrop={handleDropOnPitch}
            >
              {/* 축구장 라인 그래픽 */}
              <div className="pitch-lines">
                <div className="pitch-box-top" />
                <div className="pitch-center-circle" />
                <div className="pitch-center-spot" />
                <div className="pitch-box-bottom" />
                <div className="pitch-box-bottom-small" />
              </div>

              {/* 자유 이동 배치된 11개 슬롯들 */}
              {slots.map((slot) => renderSlot(slot))}
            </div>
          </section>

          {/* 3-B. 선수 검색 & 구단별 로스터 패널 */}
          <section className="myteam-roster-panel" aria-label="선수 검색 및 명단">
            {/* 상단 탭: 구단별 선수 보기 vs 전체 검색 */}
            <div className="roster-view-nav">
              <button
                type="button"
                className={`roster-nav-btn ${rosterViewMode === 'BY_TEAM' ? 'active' : ''}`}
                aria-pressed={rosterViewMode === 'BY_TEAM'}
                onClick={() => setRosterViewMode('BY_TEAM')}
              >
                <span className="nav-icon">🛡️</span>
                팀별 선수 보기
              </button>
              <button
                type="button"
                className={`roster-nav-btn ${rosterViewMode === 'ALL' ? 'active' : ''}`}
                aria-pressed={rosterViewMode === 'ALL'}
                onClick={() => setRosterViewMode('ALL')}
              >
                <span className="nav-icon">🔍</span>
                전체 검색
              </button>
            </div>

            {rosterViewMode === 'BY_TEAM' ? (
              /* [모드 1] 구단별 보기 */
              selectedClubId === null ? (
                /* [1-A] 20개 구단 선택 화면 */
                <div className="club-picker-view">
                  <div className="club-picker-header">
                    <div>
                      <h3 className="club-picker-title">프리미어리그 구단 선택</h3>
                      <p className="club-picker-subtitle">원하는 구단을 클릭하면 소속 선수들을 확인할 수 있습니다.</p>
                    </div>
                    <span className="club-total-badge">{loading ? '불러오는 중' : `${teams.length}개 구단`}</span>
                  </div>

                  {/* 구단 검색창 */}
                  <div className="club-search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="roster-search-input"
                      placeholder="구단명 검색 (예: 아스널, 맨체스터, 리버풀...)"
                      aria-label="구단명 검색"
                      value={clubPickerQuery}
                      onChange={(e) => setClubPickerQuery(e.target.value)}
                    />
                    {clubPickerQuery && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => setClubPickerQuery('')}
                        title="검색어 지우기"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* 20개 구단 그리드 */}
                  <div className="club-grid-scroll">
                    {loading ? (
                      <div className="roster-empty-state">구단 목록을 불러오는 중입니다...</div>
                    ) : filteredClubs.length === 0 ? (
                      <div className="roster-empty-state">검색된 구단이 없습니다.</div>
                    ) : (
                      filteredClubs.map((club) => {
                        const count = teamPlayerCounts[club.teamId] || 0;
                        return (
                          <button
                            type="button"
                            key={club.teamId}
                            className="club-select-card"
                            onClick={() => {
                              setSelectedClubId(club.teamId);
                              setClubSearchTerm('');
                              setClubPosTab('ALL');
                            }}
                            title={`${club.teamNameKor || club.teamName} 선수단 보기`}
                          >
                            <div className="club-card-emblem-wrap">
                              <RosterClubEmblem club={club} className="club-card-emblem" />
                            </div>
                            <div className="club-card-names">
                              <span className="club-card-name-kor">{club.teamNameKor || club.teamName}</span>
                              <span className="club-card-name-en">{club.teamName}</span>
                            </div>
                            <div className="club-card-footer">
                              <span className="club-player-count-badge">{count}명</span>
                              <span className="club-enter-arrow">선수단 보기 →</span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* [1-B] 선택된 구단 소속 선수단 화면 */
                <div className="club-roster-view">
                  {/* 상단 선택된 구단 헤더 & 뒤로가기 버튼 */}
                  <div className="selected-club-banner">
                    <button
                      type="button"
                      className="btn-back-to-clubs"
                      onClick={() => setSelectedClubId(null)}
                      title="20개 구단 목록으로 돌아가기"
                    >
                      ← 구단 다시 선택
                    </button>

                    <div className="club-banner-info">
                      {activeClub && <RosterClubEmblem key={activeClub.teamId} club={activeClub} className="club-banner-emblem" />}
                      <div className="club-banner-text">
                        <span className="club-banner-name-kor">{activeClub?.teamNameKor || activeClub?.teamName}</span>
                        <span className="club-banner-name-en">{activeClub?.teamName} · {activeClubPlayers.length}명</span>
                      </div>
                    </div>
                  </div>

                  {/* 구단 내 선수 검색창 */}
                  <div className="roster-search-box">
                    <span className="search-icon">🔍</span>
                    <input
                      type="text"
                      className="roster-search-input"
                      placeholder={`${activeClub?.teamNameKor || '구단'} 선수 검색...`}
                      aria-label="선택한 구단의 선수 검색"
                      value={clubSearchTerm}
                      onChange={(e) => setClubSearchTerm(e.target.value)}
                    />
                    {clubSearchTerm && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => setClubSearchTerm('')}
                        title="검색어 지우기"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* 구단 내 포지션 필터 탭 */}
                  <div className="roster-filters">
                    <div className="position-filter-tabs">
                      {['ALL', 'FW', 'MF', 'DF', 'GK'].map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          className={`pos-tab ${clubPosTab === pos ? 'active' : ''}`}
                          onClick={() => setClubPosTab(pos)}
                        >
                          {pos === 'ALL' ? '전체' : pos}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 구단 소속 선수 목록 스크롤 */}
                  <div className="roster-list-scroll">
                    {activeClubPlayers.length === 0 ? (
                      <div className="roster-empty-state">해당 포지션/검색 조건의 선수가 없습니다.</div>
                    ) : (
                      activeClubPlayers.map((player) => renderPlayerCard(player))
                    )}
                  </div>
                </div>
              )
            ) : (
              /* [모드 2] 전체 선수 검색 */
              <div className="all-players-view">
                <div className="roster-header">
                  <h2>
                    전체 선수 검색
                    <span className="roster-count">{filteredPlayers.length}명 검색됨</span>
                  </h2>
                </div>

                {/* 검색창 */}
                <div className="roster-search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    type="text"
                    className="roster-search-input"
                    placeholder="선수명, 구단명 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchTerm('')}
                      title="검색어 지우기"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 필터 탭 (포지션 탭 + 팀 드롭다운) */}
                <div className="roster-filters">
                  <div className="position-filter-tabs">
                    {['ALL', 'FW', 'MF', 'DF', 'GK'].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        className={`pos-tab ${selectedPosTab === pos ? 'active' : ''}`}
                        onClick={() => setSelectedPosTab(pos)}
                      >
                        {pos === 'ALL' ? '전체' : pos}
                      </button>
                    ))}
                  </div>

                  <select
                    className="team-filter-select"
                    value={selectedTeamFilter}
                    onChange={(e) => setSelectedTeamFilter(e.target.value)}
                  >
                    <option value="ALL">전체 20개 구단</option>
                    {teams.map((t) => (
                      <option key={t.teamId} value={t.teamId}>
                        {t.teamNameKor || t.teamName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 선수 목록 스크롤 */}
                <div className="roster-list-scroll">
                  {loading ? (
                    <div className="roster-empty-state">선수 데이터를 불러오는 중입니다...</div>
                  ) : filteredPlayers.length === 0 ? (
                    <div className="roster-empty-state">검색 조건에 맞는 선수가 없습니다.</div>
                  ) : (
                    filteredPlayers.map((player) => renderPlayerCard(player))
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* 토스트 알림 메시지 */}
      {toastMessage && (
        <div className="myteam-toast" role="status">
          {toastMessage}
        </div>
      )}
    </div>
  );

  // 슬롯 렌더링 헬퍼
  function renderSlot(slot) {
    const isSelected = selectedSlotId === slot.id;
    const isDragOver = dragOverSlotId === slot.id;
    const isPointerDragging = activeDragSlotId === slot.id;
    const hasPlayer = Boolean(slot.player);

    return (
      <div
        key={slot.id}
        className={`pitch-slot ${isSelected ? 'slot-selected' : ''} ${
          isDragOver ? 'drop-target-active' : ''
        } ${isPointerDragging ? 'is-dragging' : ''}`}
        style={{
          left: `${slot.x ?? 50}%`,
          top: `${slot.y ?? 50}%`,
        }}
        onPointerDown={(e) => handleSlotPointerDown(slot.id, e)}
        onPointerMove={(e) => handleSlotPointerMove(slot.id, e)}
        onPointerUp={(e) => handleSlotPointerUp(slot.id, e)}
        onPointerCancel={(e) => handleSlotPointerUp(slot.id, e)}
        onLostPointerCapture={(e) => handleSlotPointerUp(slot.id, e)}
        onDragOver={(e) => handleDragOverSlot(e, slot.id)}
        onDragLeave={() => handleDragLeaveSlot(slot.id)}
        onDrop={(e) => handleDropOnSlot(e, slot.id)}
        data-pitch-slot-id={slot.id}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        title={
          hasPlayer
            ? `${slot.player.nameKor || slot.player.name} (${slot.pos}) - 드래그하여 필드 원하는 위치로 이동하거나 ✕를 눌러 제거`
            : `${slot.pos} 빈 슬롯 - 드래그하여 원하는 위치로 이동하거나 클릭하여 선수 영입`
        }
      >
        {hasPlayer ? (
          <div className="slot-filled-card">
            <button
              type="button"
              className="slot-remove-btn"
              onClick={(e) => handleRemovePlayerFromSlot(slot.id, e)}
              title="선수 제외"
            >
              ✕
            </button>

            <div className="slot-player-avatar-box">
              <span className="slot-player-jersey">👕</span>
              {slot.player.teamEmblem && (
                <img
                  src={slot.player.teamEmblem}
                  alt={slot.player.teamName || 'team'}
                  className="slot-team-crest"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>

            <div className="slot-player-info">
              <span className="slot-player-name">
                {slot.player.nameKor || slot.player.name}
              </span>
              <span className="slot-player-team">
                {slot.player.teamNameKor || slot.player.teamName}
              </span>
            </div>
          </div>
        ) : (
          <div className="slot-empty-circle">
            <span className={`slot-pos-badge ${slot.pos.toLowerCase()}`}>
              {slot.pos}
            </span>
            <span className="slot-plus-icon">+</span>
          </div>
        )}
      </div>
    );
  }

  // 선수 카드 렌더링 헬퍼 (구단별 보기 및 전체 검색 공통 사용)
  function renderPlayerCard(player) {
    const isAssigned = assignedPlayerIds.has(player.playerId);

    return (
      <div
        key={player.playerId}
        className={`roster-player-card ${isAssigned ? 'is-assigned' : ''}`}
        draggable={true}
        onDragStart={(e) => handleDragStartFromRoster(e, player)}
        onDragEnd={() => setDragOverSlotId(null)}
        onClick={() => handlePlayerCardClick(player)}
        title={
          isAssigned
            ? '이미 스쿼드에 배치된 선수입니다 (클릭 시 다른 슬롯으로 이동)'
            : '드래그하거나 클릭하여 필드에 배치'
        }
      >
        <div className="player-card-left">
          <span className={`player-pos-tag ${player.mainPosition.toLowerCase()}`}>
            {player.mainPosition}
          </span>

          {player.teamEmblem && (
            <img
              src={player.teamEmblem}
              alt=""
              className="player-card-team-emblem"
              draggable={false}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          <div className="player-names">
            <span className="player-name-kor">
              {player.nameKor || player.name}
            </span>
            <span className="player-sub-info">
              {player.teamNameKor || player.teamName} · {player.detailPosition || player.mainPosition}
            </span>
          </div>
        </div>

        <div className="player-card-right">
          {isAssigned ? (
            <span className="in-squad-badge">배치됨</span>
          ) : (
            <button
              type="button"
              className="card-action-btn"
              title="필드에 배치"
              onClick={(e) => {
                e.stopPropagation();
                handlePlayerCardClick(player);
              }}
            >
              +
            </button>
          )}
        </div>
      </div>
    );
  }
}
