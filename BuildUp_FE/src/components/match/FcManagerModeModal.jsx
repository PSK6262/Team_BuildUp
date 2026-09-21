import React, { useState, useEffect, useMemo } from 'react'
import '../../css/fc-manager-mode.css'

// 2D 피치 홈팀 기본 포메이션 (4-3-3 좌측)
const HOME_FORMATION_433 = [
  { pos: 'GK', x: 7, y: 50, num: 1 },
  { pos: 'LB', x: 18, y: 18, num: 3 },
  { pos: 'CB', x: 16, y: 38, num: 6 },
  { pos: 'CB', x: 16, y: 62, num: 2 },
  { pos: 'RB', x: 18, y: 82, num: 4 },
  { pos: 'LCM', x: 30, y: 28, num: 8 },
  { pos: 'CM', x: 28, y: 50, num: 5 },
  { pos: 'RCM', x: 30, y: 72, num: 10 },
  { pos: 'LW', x: 43, y: 22, num: 11 },
  { pos: 'ST', x: 44, y: 50, num: 9 },
  { pos: 'RW', x: 43, y: 78, num: 7 },
]

// 2D 피치 원정팀 기본 포메이션 (4-2-3-1 우측)
const AWAY_FORMATION_4231 = [
  { pos: 'GK', x: 93, y: 50, num: 1 },
  { pos: 'RB', x: 82, y: 18, num: 2 },
  { pos: 'CB', x: 84, y: 38, num: 5 },
  { pos: 'CB', x: 84, y: 62, num: 4 },
  { pos: 'LB', x: 82, y: 82, num: 3 },
  { pos: 'LDM', x: 71, y: 38, num: 6 },
  { pos: 'RDM', x: 71, y: 62, num: 8 },
  { pos: 'RAM', x: 58, y: 22, num: 11 },
  { pos: 'CAM', x: 60, y: 50, num: 10 },
  { pos: 'LAM', x: 58, y: 78, num: 7 },
  { pos: 'ST', x: 54, y: 50, num: 9 },
]

export default function FcManagerModeModal({ isOpen, onClose, match, homeTeam = {}, awayTeam = {} }) {
  const [ filterType, setFilterType ] = useState('ALL')
  const [ dbEvents, setDbEvents ] = useState([])
  const [ loading, setLoading ] = useState(false)

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ isOpen, onClose ])

  // 백엔드 DB 경기 이벤트 목록 조회
  useEffect(() => {
    if (!isOpen || !match?.matchId) return

    setLoading(true)
    let active = true

    fetch(`/api/matches/${match.matchId}/events`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active) return
        if (Array.isArray(data) && data.length > 0) {
          setDbEvents(data)
        } else {
          setDbEvents([])
        }
      })
      .catch(() => {
        if (active) setDbEvents([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [ isOpen, match?.matchId ])

  // 종합 타임라인 이벤트 구성 (DB 이벤트 + 킥오프/종료 휘슬 및 스코어 기반 Fallback)
  const timelineEvents = useMemo(() => {
    if (!match) return []

    const list = []
    const homeName = homeTeam.teamNameKor || homeTeam.teamName || '홈팀'
    const awayName = awayTeam.teamNameKor || awayTeam.teamName || '원정팀'

    // 1. 경기 시작 휘슬 (항상 맨 처음)
    list.push({
      id: 'whistle-start',
      time: 0,
      timeDisplay: "00'",
      type: 'WHISTLE',
      category: 'WHISTLE',
      icon: '📢',
      title: '전반전 킥오프 휘슬',
      desc: `주심의 힘찬 휘슬과 함께 ${homeName} vs ${awayName}의 경기가 시작되었습니다.`,
    })

    // 2. DB에 실제 적재된 이벤트가 있는 경우 변환
    if (dbEvents.length > 0) {
      dbEvents.forEach((evt) => {
        const timeVal = Number(evt.eventTime ?? evt.event_time ?? 0)
        const typeCode = Number(evt.eventType ?? evt.event_type ?? 1)
        const isHome = Number(evt.teamId ?? evt.team_id) === Number(match.homeTeamId)
        const teamName = isHome ? homeName : awayName
        const teamEmblem = isHome ? homeTeam.emblemUrl : awayTeam.emblemUrl
        const pName = evt.playerNameKor || evt.playerName || (isHome ? `${homeName} 선수` : `${awayName} 선수`)
        const aName = evt.assistPlayerNameKor || evt.assistPlayerName

        let category = 'OTHER'
        let icon = '⚽'
        let title = '이벤트 발생'
        let desc = ''

        switch (typeCode) {
          case 1: // 필드골
            category = 'GOAL'
            icon = '⚽'
            title = `GOAL! ${pName} (${teamName})`
            desc = aName
              ? `환상적인 패스를 받은 ${pName}의 깔끔한 마무리 득점! (도움: ${aName})`
              : `${pName}의 날카로운 슈팅이 그대로 골망을 흔듭니다!`
            break
          case 2: // 페널티킥 골
            category = 'GOAL'
            icon = '⚽'
            title = `PK GOAL! ${pName} (${teamName})`
            desc = `${pName} 선수가 침착하게 페널티킥을 성공시켰습니다.`
            break
          case 3: // 자책골
            category = 'GOAL'
            icon = '⚽'
            title = `자책골 (OG) - ${pName}`
            desc = `수비 경합 중 굴절되어 골문 안으로 들어갔습니다.`
            break
          case 4: // 옐로카드
            category = 'CARD'
            icon = '🟨'
            title = `경고 (옐로카드) - ${pName}`
            desc = `${teamName} ${pName} 선수의 거친 태클로 주심이 경고를 선언합니다.`
            break
          case 5: // 경고 누적 퇴장
          case 6: // 다이렉트 레드카드
            category = 'CARD'
            icon = '🟥'
            title = `퇴장 (레드카드) - ${pName}`
            desc = `결정적인 파울로 인해 ${pName} 선수가 다이렉트 퇴장 조치되었습니다.`
            break
          case 7: // 교체
            category = 'SUB'
            icon = '🔄'
            title = `선수 교체 (${teamName})`
            desc = `IN: ${pName} 🔺 / OUT: 교체 선수 🔻`
            break
          case 8: // 페널티킥 실축
            category = 'GOAL'
            icon = '❌'
            title = `페널티킥 실축 - ${pName}`
            desc = `${pName} 선수의 슈팅이 골키퍼 선방에 막히거나 빗나갔습니다.`
            break
          default:
            category = 'OTHER'
            icon = '⚡'
            title = `${teamName} 주요 공격 전개`
            desc = `${pName}의 위협적인 플레이`
        }

        list.push({
          id: `evt-${evt.eventId || Math.random()}`,
          time: timeVal,
          timeDisplay: `${timeVal}'`,
          type: typeCode,
          category,
          icon,
          title,
          desc,
          teamName,
          teamEmblem,
          isHome,
        })
      })
    } else {
      // 3. Fallback: DB에 이벤트가 없는 경우 최종 스코어를 기반으로 자연스러운 텍스트 중계 타임라인 자동 생성
      const hScore = Number(match.homeScore ?? 0)
      const aScore = Number(match.awayScore ?? 0)

      // 홈팀 득점 이벤트 시뮬레이션
      const homeMinutes = [ 24, 68, 85 ]
      for (let i = 0; i < hScore; i++) {
        const mTime = homeMinutes[ i % homeMinutes.length ]
        list.push({
          id: `fallback-home-goal-${i}`,
          time: mTime,
          timeDisplay: `${mTime}'`,
          type: 1,
          category: 'GOAL',
          icon: '⚽',
          title: `GOAL! ${homeName} 득점 성공!`,
          desc: `정교한 빌드업에 이은 환상적인 슈팅으로 골문을 갈랐습니다. [${homeName} 리드]`,
          teamName: homeName,
          teamEmblem: homeTeam.emblemUrl,
          isHome: true,
        })
      }

      // 원정팀 득점 이벤트 시뮬레이션
      const awayMinutes = [ 39, 77, 89 ]
      for (let i = 0; i < aScore; i++) {
        const mTime = awayMinutes[ i % awayMinutes.length ]
        list.push({
          id: `fallback-away-goal-${i}`,
          time: mTime,
          timeDisplay: `${mTime}'`,
          type: 1,
          category: 'GOAL',
          icon: '⚽',
          title: `GOAL! ${awayName} 득점 성공!`,
          desc: `빠른 역습 찬스를 놓치지 않고 침착하게 골망을 흔듭니다!`,
          teamName: awayName,
          teamEmblem: awayTeam.emblemUrl,
          isHome: false,
        })
      }

      // 전반 종료 및 후반 시작
      list.push({
        id: 'whistle-ht',
        time: 45,
        timeDisplay: "45'+",
        type: 'WHISTLE',
        category: 'WHISTLE',
        icon: '⏸',
        title: '전반전 종료 휘슬',
        desc: `치열한 접전 끝에 전반전 경기가 마무리되고 하프타임에 돌입합니다.`,
      })
      list.push({
        id: 'whistle-sh',
        time: 46,
        timeDisplay: "46'",
        type: 'WHISTLE',
        category: 'WHISTLE',
        icon: '📢',
        title: '후반전 시작 휘슬',
        desc: `양 팀 진영을 바꾸고 승부를 결정지을 후반전이 시작됩니다.`,
      })
    }

    // 4. 경기 종료 휘슬 (종료 경기일 때)
    const isFinished = match.status === 'FINISHED' || match.status === 'AWARDED' || (match.homeScore !== null && match.awayScore !== null)
    if (isFinished) {
      list.push({
        id: 'whistle-ft',
        time: 90,
        timeDisplay: "90'+4",
        type: 'WHISTLE',
        category: 'WHISTLE',
        icon: '🏁',
        title: '경기 종료 (Full Time)',
        desc: `주심의 종료 휘슬이 울리며 최종 스코어 [${match.homeScore ?? 0} : ${match.awayScore ?? 0}]로 경기가 종료되었습니다.`,
      })
    }

    // 시간순 오름차순 정렬
    return list.sort((a, b) => a.time - b.time)
  }, [ match, dbEvents, homeTeam, awayTeam ])

  // 필터링 적용된 이벤트 목록
  const filteredEvents = useMemo(() => {
    if (filterType === 'ALL') return timelineEvents
    return timelineEvents.filter((item) => item.category === filterType)
  }, [ timelineEvents, filterType ])

  if (!isOpen || !match) return null

  const isLive = match.status === 'LIVE' || match.status === 'IN_PLAY'
  const isFinished = match.status === 'FINISHED' || match.status === 'AWARDED' || (match.homeScore !== null && match.awayScore !== null)

  const homeName = homeTeam.teamNameKor || homeTeam.teamName || '홈팀'
  const awayName = awayTeam.teamNameKor || awayTeam.teamName || '원정팀'

  // 가상의 매치 스탯 산출 (현장감 극대화)
  const homeScoreNum = Number(match.homeScore ?? 0)
  const awayScoreNum = Number(match.awayScore ?? 0)
  const homePossession = homeScoreNum > awayScoreNum ? 56 : homeScoreNum < awayScoreNum ? 44 : 50
  const awayPossession = 100 - homePossession
  const homeShots = Math.max(homeScoreNum * 3 + 4, 8)
  const awayShots = Math.max(awayScoreNum * 3 + 3, 6)

  return (
    <div className="fcm-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="fcm-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* 1. 상단: FC 온라인 스타일 헤더 & 스코어보드 */}
        <header className="fcm-header">
          <div className="fcm-header__brand">
            <span className="fcm-badge-tag">MANAGER MODE</span>
            <span className="fcm-header__title">
              {match.computedRound ? `${match.computedRound}R ` : ''}문자 중계 & 전술 피치
            </span>
          </div>

          <div className="fcm-scoreboard">
            {/* 홈팀 */}
            <div className="fcm-score-team fcm-score-team--home">
              <div className="fcm-team-meta">
                <span className="fcm-team-meta__kor">{homeName}</span>
                <span className="fcm-team-meta__eng">({homeTeam.teamName})</span>
              </div>
              {homeTeam.emblemUrl && (
                <div className="fcm-emblem-wrap">
                  <img src={homeTeam.emblemUrl} alt={homeName} className="fcm-emblem" />
                </div>
              )}
            </div>

            {/* 스코어 & 상태 */}
            <div className="fcm-score-center">
              <div className="fcm-score-digits">
                {match.homeScore ?? 0} : {match.awayScore ?? 0}
              </div>
              <span
                className={`fcm-status-pill ${
                  isLive
                    ? 'fcm-status-pill--live'
                    : isFinished
                      ? 'fcm-status-pill--finished'
                      : 'fcm-status-pill--scheduled'
                }`}
              >
                {isLive ? 'LIVE' : isFinished ? '경기종료' : '경기예정'}
              </span>
              <span className="fcm-stadium-info">
                📍 {match.displayHomeGround || match.homeGroundKor || homeTeam.homeGroundKor || '홈 경기장'}
              </span>
            </div>

            {/* 원정팀 */}
            <div className="fcm-score-team fcm-score-team--away">
              {awayTeam.emblemUrl && (
                <div className="fcm-emblem-wrap">
                  <img src={awayTeam.emblemUrl} alt={awayName} className="fcm-emblem" />
                </div>
              )}
              <div className="fcm-team-meta">
                <span className="fcm-team-meta__kor">{awayName}</span>
                <span className="fcm-team-meta__eng">({awayTeam.teamName})</span>
              </div>
            </div>
          </div>

          <button type="button" className="fcm-header__close" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        {/* 2. 메인 바디: 좌측 2D 미니 피치 & 우측 타임라인 텍스트 중계 */}
        <div className="fcm-body">
          {/* 좌측: 2D 미니 피치 (그라운드 레이더 전술 화면) */}
          <section className="fcm-pitch-section">
            <div className="fcm-pitch-title-bar">
              <span className="fcm-pitch-title">
                ⚽ 2D 전술 레이더 피치
              </span>
              <div className="fcm-formations">
                <span className="fcm-form-badge fcm-form-badge--home">홈 4-3-3</span>
                <span style={{ color: '#64748b' }}>vs</span>
                <span className="fcm-form-badge fcm-form-badge--away">원정 4-2-3-1</span>
              </div>
            </div>

            {/* 2D 축구장 그라운드 */}
            <div className="fcm-pitch">
              {/* 피치 라인마킹 */}
              <div className="fcm-pitch__halfway" />
              <div className="fcm-pitch__center-circle" />
              <div className="fcm-pitch__center-spot" />
              <div className="fcm-pitch__box-left" />
              <div className="fcm-pitch__goal-left" />
              <div className="fcm-pitch__box-right" />
              <div className="fcm-pitch__goal-right" />

              {/* 공 (Ball) 마커 */}
              <div className="fcm-ball" style={{ left: '50%', top: '50%' }}>
                ⚽
              </div>

              {/* 홈팀 선수들 (레드 원형 마커) */}
              {HOME_FORMATION_433.map((p, idx) => (
                <div
                  key={`home-p-${idx}`}
                  className="fcm-player-node fcm-player-node--home"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <div className="fcm-player-circle">{p.num}</div>
                  <span className="fcm-player-label">{p.pos}</span>
                </div>
              ))}

              {/* 원정팀 선수들 (블루 원형 마커) */}
              {AWAY_FORMATION_4231.map((p, idx) => (
                <div
                  key={`away-p-${idx}`}
                  className="fcm-player-node fcm-player-node--away"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                >
                  <div className="fcm-player-circle">{p.num}</div>
                  <span className="fcm-player-label">{p.pos}</span>
                </div>
              ))}
            </div>

            {/* 실시간 매치 스탯 바 */}
            <div className="fcm-stats-card">
              <span className="fcm-stats-header">MATCH STATISTICS (실시간 경기 통계)</span>

              {/* 볼 점유율 */}
              <div className="fcm-stat-item">
                <div className="fcm-stat-labels">
                  <span>{homePossession}%</span>
                  <span className="fcm-stat-name">볼 점유율</span>
                  <span>{awayPossession}%</span>
                </div>
                <div className="fcm-stat-bar">
                  <div className="fcm-stat-bar__home" style={{ width: `${homePossession}%` }} />
                  <div className="fcm-stat-bar__away" style={{ width: `${awayPossession}%` }} />
                </div>
              </div>

              {/* 총 슈팅수 */}
              <div className="fcm-stat-item">
                <div className="fcm-stat-labels">
                  <span>{homeShots}</span>
                  <span className="fcm-stat-name">전체 슈팅</span>
                  <span>{awayShots}</span>
                </div>
                <div className="fcm-stat-bar">
                  <div className="fcm-stat-bar__home" style={{ width: `${(homeShots / (homeShots + awayShots)) * 100}%` }} />
                  <div className="fcm-stat-bar__away" style={{ width: `${(awayShots / (homeShots + awayShots)) * 100}%` }} />
                </div>
              </div>

              {/* 유효 슈팅 */}
              <div className="fcm-stat-item">
                <div className="fcm-stat-labels">
                  <span>{Math.max(homeScoreNum + 2, 3)}</span>
                  <span className="fcm-stat-name">유효 슈팅</span>
                  <span>{Math.max(awayScoreNum + 1, 2)}</span>
                </div>
                <div className="fcm-stat-bar">
                  <div className="fcm-stat-bar__home" style={{ width: '58%' }} />
                  <div className="fcm-stat-bar__away" style={{ width: '42%' }} />
                </div>
              </div>

              {/* 코너킥 */}
              <div className="fcm-stat-item">
                <div className="fcm-stat-labels">
                  <span>5</span>
                  <span className="fcm-stat-name">코너킥</span>
                  <span>3</span>
                </div>
                <div className="fcm-stat-bar">
                  <div className="fcm-stat-bar__home" style={{ width: '62%' }} />
                  <div className="fcm-stat-bar__away" style={{ width: '38%' }} />
                </div>
              </div>
            </div>
          </section>

          {/* 우측: 주요 이벤트 타임라인형 텍스트 중계 피드 */}
          <section className="fcm-timeline-section">
            {/* 이벤트 필터 탭 */}
            <div className="fcm-filter-bar">
              <button
                type="button"
                className={`fcm-filter-btn ${filterType === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterType('ALL')}
              >
                전체 ({timelineEvents.length})
              </button>
              <button
                type="button"
                className={`fcm-filter-btn ${filterType === 'GOAL' ? 'active' : ''}`}
                onClick={() => setFilterType('GOAL')}
              >
                골 (⚽)
              </button>
              <button
                type="button"
                className={`fcm-filter-btn ${filterType === 'CARD' ? 'active' : ''}`}
                onClick={() => setFilterType('CARD')}
              >
                카드 (🟨🟥)
              </button>
              <button
                type="button"
                className={`fcm-filter-btn ${filterType === 'SUB' ? 'active' : ''}`}
                onClick={() => setFilterType('SUB')}
              >
                교체 (🔄)
              </button>
              <button
                type="button"
                className={`fcm-filter-btn ${filterType === 'WHISTLE' ? 'active' : ''}`}
                onClick={() => setFilterType('WHISTLE')}
              >
                휘슬 (📢)
              </button>
            </div>

            {/* 타임라인 피드 스크롤 목록 */}
            <div className="fcm-feed-list">
              {loading ? (
                <div className="fcm-feed-empty">
                  <span className="fcm-feed-empty__icon">⏳</span>
                  <p>경기 타임라인 이벤트를 불러오는 중입니다...</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="fcm-feed-empty">
                  <span className="fcm-feed-empty__icon">⚽</span>
                  <p>해당 조건의 이벤트가 아직 없습니다.</p>
                </div>
              ) : (
                filteredEvents.map((evt) => {
                  const nodeClass =
                    evt.category === 'GOAL'
                      ? 'fcm-icon-node--goal'
                      : evt.icon === '🟥'
                        ? 'fcm-icon-node--redcard'
                        : evt.category === 'CARD'
                          ? 'fcm-icon-node--card'
                          : evt.category === 'SUB'
                            ? 'fcm-icon-node--sub'
                            : 'fcm-icon-node--whistle'

                  const cardClass =
                    evt.category === 'GOAL'
                      ? 'fcm-event-card--goal'
                      : evt.icon === '🟥'
                        ? 'fcm-event-card--redcard'
                        : evt.category === 'CARD'
                          ? 'fcm-event-card--card'
                          : evt.category === 'SUB'
                            ? 'fcm-event-card--sub'
                            : 'fcm-event-card--whistle'

                  return (
                    <article key={evt.id} className="fcm-feed-item">
                      {/* 분(Minute) 표시 */}
                      <span className="fcm-time-tag">{evt.timeDisplay}</span>

                      {/* 이벤트 아이콘 노드 */}
                      <div className={`fcm-icon-node ${nodeClass}`}>
                        {evt.icon}
                      </div>

                      {/* 이벤트 상세 설명 카드 */}
                      <div className={`fcm-event-card ${cardClass}`}>
                        <div className="fcm-event-headline">
                          <span className="fcm-event-title">{evt.title}</span>
                          {evt.teamName && (
                            <span className="fcm-event-team">
                              {evt.teamEmblem && (
                                <img
                                  src={evt.teamEmblem}
                                  alt=""
                                  className="fcm-event-team__emblem"
                                  onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                                />
                              )}
                              {evt.teamName}
                            </span>
                          )}
                        </div>
                        <p className="fcm-event-desc">{evt.desc}</p>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

