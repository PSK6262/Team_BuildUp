import React, { useState, useEffect } from 'react';
import '../css/MatchEventOverlay.css';

/**
 * AI 대전 리플레이 피치용 방송 중계 스타일 이벤트 오버레이
 *
 * @param {Object} props
 * @param {Object} props.currentEvent - 타임라인에서 선택된 경기 이벤트 객체
 * @param {string} props.homeName - 홈팀 이름
 * @param {string} props.opponentName - 원정팀(상대팀) 이름
 * @param {boolean} props.isFinalEvent - 마지막 이벤트(경기 종료) 여부
 */
export default function MatchEventOverlay({
  currentEvent,
  homeName = '홈팀',
  opponentName = '원정팀',
  isFinalEvent = false,
}) {
  const [active, setActive] = useState(true);

  // 이벤트 판정 플래그
  const isFullTime = Boolean(
    isFinalEvent ||
    currentEvent?.label?.includes('종료') ||
    currentEvent?.description?.includes('경기 종료 휘슬')
  );

  // 이벤트 변경 시 2.3초 표시 타이머 (FULL TIME 제외)
  useEffect(() => {
    setActive(true);
    if (isFullTime) return;

    const timer = setTimeout(() => {
      setActive(false);
    }, 2300);

    return () => clearTimeout(timer);
  }, [currentEvent, isFullTime]);

  if (!currentEvent || !active) return null;

  const eventType = currentEvent.type || '';
  const label = currentEvent.label || '';
  const description = currentEvent.description || '';
  const isGoal = Boolean(currentEvent.isGoal || eventType === 'goal');
  const side = currentEvent.side;
  const teamName = side === 0 ? homeName : side === 1 ? opponentName : '';

  // 세부 이벤트 타입 판별
  const isYellow = eventType === 'yellow';
  const isRed = eventType === 'red';
  const isCard = isYellow || isRed;
  const isSecondYellow = isCard && (
    label.includes('누적') ||
    description.includes('누적') ||
    description.includes('두 번째 옐로카드') ||
    (isRed && label.includes('경고'))
  );
  const isDirectRed = isRed && !isSecondYellow;

  const isSave = eventType === 'save';
  const isCorner = eventType === 'corner';
  const isFreeKick = eventType === 'free-kick';
  const isPk = eventType === 'penalty';
  const isKickoff = !isFullTime && (
    eventType === 'period' ||
    label.includes('킥오프') ||
    label.includes('시작') ||
    label.includes('하프타임')
  );
  const isOffside = eventType === 'offside';

  // 고유 이벤트 키 (애니메이션 재시작 트리거)
  const eventKey = `${eventType}-${currentEvent.minute ?? 0}-${side ?? 'n'}-${description.slice(0, 8)}`;

  // 1. 경기 종료 (FULL TIME) - 딤드 + 전광판 고정 노출
  if (isFullTime) {
    const scoreText = Array.isArray(currentEvent.score) ? currentEvent.score.join(' : ') : 'VS';
    const homeScore = Array.isArray(currentEvent.score) ? currentEvent.score[0] : 0;
    const awayScore = Array.isArray(currentEvent.score) ? currentEvent.score[1] : 0;

    let verdict = '무승부';
    if (homeScore > awayScore) verdict = `${homeName} 승리!`;
    else if (awayScore > homeScore) verdict = `${opponentName} 승리!`;

    return (
      <div className="match-event-overlay-container match-overlay--dimmed" key={eventKey} aria-live="polite">
        <div className="match-overlay-scoreboard-card">
          <div className="scoreboard-card__badge">경기 종료 (풀타임)</div>
          <h4 className="scoreboard-card__title">최종 경기 결과</h4>

          <div className="scoreboard-card__score-row">
            <span className="scoreboard-card__team scoreboard-card__team--home">{homeName}</span>
            <div className="scoreboard-card__score-box">
              <span className="scoreboard-card__score">{scoreText}</span>
            </div>
            <span className="scoreboard-card__team scoreboard-card__team--away">{opponentName}</span>
          </div>

          <div className="scoreboard-card__verdict">{verdict}</div>
          {description && <p className="scoreboard-card__desc">{description}</p>}
        </div>
      </div>
    );
  }

  // 2. 골 (GOAL) - 플래시 + 네온 스케일업 + 셰이크 애니메이션
  if (isGoal) {
    return (
      <div className="match-event-overlay-container" key={eventKey} aria-live="assertive">
        <div className="match-overlay-goal-flash" aria-hidden="true" />
        <div className="match-overlay-goal-content">
          <div className="match-overlay-goal-title">
            <span className="goal-text-glow">GOAL</span>
          </div>
          {teamName && (
            <div className={`match-overlay-team-badge ${side === 0 ? 'badge--home' : 'badge--away'}`}>
              ⚽ {teamName}
            </div>
          )}
          {description && (
            <p className="match-overlay-event-desc goal-desc">{description}</p>
          )}
        </div>
      </div>
    );
  }

  // 3. 카드 판정 (CARD)
  if (isCard) {
    return (
      <div className="match-event-overlay-container" key={eventKey} aria-live="polite">
        <div className="match-overlay-card-content">
          {isSecondYellow ? (
            // [경고 누적 퇴장]: 옐로카드 드롭 후 0.6초 뒤 Y축 180도 회전(3D Flip)하여 레드카드로 모핑
            <div className="card-flip-stage">
              <div className="card-flip-flipper">
                <div className="card-face card-face--yellow" />
                <div className="card-face card-face--red" />
              </div>
              <div className="match-overlay-card-tag tag--red">경고 2장 누적 퇴장!</div>
            </div>
          ) : isDirectRed ? (
            // [다이렉트 레드카드]: 붉은 섬광과 함께 강한 임팩트 드롭
            <div className="card-single-stage stage--red">
              <div className="card-rect card-rect--red" />
              <div className="match-overlay-card-tag tag--red">다이렉트 레드카드 (퇴장)</div>
            </div>
          ) : (
            // [일반 옐로카드]: 부드러운 드롭다운 & 네온 옐로
            <div className="card-single-stage stage--yellow">
              <div className="card-rect card-rect--yellow" />
              <div className="match-overlay-card-tag tag--yellow">경고 (옐로카드)</div>
            </div>
          )}

          {teamName && (
            <div className={`match-overlay-team-badge ${side === 0 ? 'badge--home' : 'badge--away'}`}>
              {teamName}
            </div>
          )}
          {description && <p className="match-overlay-event-desc">{description}</p>}
        </div>
      </div>
    );
  }

  // 4. 선방 (SAVE) - 장갑 아이콘 + 좌측 슬라이드 인 슬림 배너
  if (isSave) {
    return (
      <div className="match-event-overlay-container" key={eventKey} aria-live="polite">
        <div className="match-overlay-banner banner--save">
          <div className="banner-icon-box">🧤</div>
          <div className="banner-text-box">
            <span className="banner-title">골키퍼 슈퍼 세이브!</span>
            {description && <span className="banner-sub">{description}</span>}
          </div>
        </div>
      </div>
    );
  }

  // 5. 코너킥 (CORNER) - 코너 플래그 + 옐로 앰버 슬라이드 배너
  if (isCorner) {
    return (
      <div className="match-event-overlay-container" key={eventKey} aria-live="polite">
        <div className="match-overlay-banner banner--corner">
          <div className="banner-icon-box">🚩</div>
          <div className="banner-text-box">
            <div className="banner-header-row">
              <span className="banner-title">코너킥 찬스</span>
              {teamName && <span className="banner-team-tag">{teamName}</span>}
            </div>
            {description && <span className="banner-sub">{description}</span>}
          </div>
        </div>
      </div>
    );
  }

  // 6. 프리킥 & 페널티킥 (FREE KICK & PK)
  if (isFreeKick || isPk) {
    const isPenalty = isPk;
    return (
      <div className="match-event-overlay-container" key={eventKey} aria-live="polite">
        <div className={`match-overlay-banner ${isPenalty ? 'banner--pk' : 'banner--freekick'}`}>
          <div className="banner-icon-box">{isPenalty ? '🎯' : '⚡'}</div>
          <div className="banner-text-box">
            <div className="banner-header-row">
              <span className="banner-title">{isPenalty ? '페널티킥 (PK)' : '프리킥 찬스'}</span>
              {teamName && <span className="banner-team-tag">{teamName}</span>}
            </div>
            {description && <span className="banner-sub">{description}</span>}
          </div>
        </div>
      </div>
    );
  }

  // 7. 킥오프 / 피리어드 (KICKOFF) - 센터서클 펄스 확대 후 페이드
  if (isKickoff) {
    return (
      <div className="match-event-overlay-container" key={eventKey} aria-live="polite">
        <div className="match-overlay-kickoff-pulse">
          <div className="kickoff-whistle-icon">📢</div>
          <div className="kickoff-title">{label || '경기 시작 (킥오프)'}</div>
          {description && <p className="kickoff-sub">{description}</p>}
        </div>
      </div>
    );
  }

  // 8. 오프사이드 (OFFSIDE)
  if (isOffside) {
    return (
      <div className="match-event-overlay-container" key={eventKey} aria-live="polite">
        <div className="match-overlay-banner banner--offside">
          <div className="banner-icon-box">🚩</div>
          <div className="banner-text-box">
            <span className="banner-title">오프사이드 판정</span>
            {description && <span className="banner-sub">{description}</span>}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
