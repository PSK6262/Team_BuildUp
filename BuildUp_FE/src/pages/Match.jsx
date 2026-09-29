import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import teamDbFallback from '../data/teamDbFallback.json'
import { getTeams } from '../api/teamApi.js'
import FcManagerModeModal from '../components/match/FcManagerModeModal.jsx'
import '../css/match.css'

const teamsData = teamDbFallback.teams
const SEASONS = [2024, 2025, 2026]
const MATCH_PAGE_SIZE = 10
const EMPTY_MATCHES = []
const seasonLabel = (season) => `${String(season).slice(-2)}-${String(season + 1).slice(-2)}`

// 프리미어리그 시즌 월 목록 (8월 ~ 5월 + 전체)
const MONTH_TABS = [
  { id: 'ALL', label: '전체' },
  { id: '08', label: '8월' },
  { id: '09', label: '9월' },
  { id: '10', label: '10월' },
  { id: '11', label: '11월' },
  { id: '12', label: '12월' },
  { id: '01', label: '1월' },
  { id: '02', label: '2월' },
  { id: '03', label: '3월' },
  { id: '04', label: '4월' },
  { id: '05', label: '5월' },
]

// 프리미어리그 38개 라운드 목록 (1R ~ 38R)
const ROUND_LIST = Array.from({ length: 38 }, (_, i) => i + 1)

// 기본 한글 구단명 매핑 사전
const TEAM_NAMES_KOR = {
  1: '본머스',
  2: '아스널',
  3: '애스턴 빌라',
  4: '브렌트포드',
  5: '브라이튼',
  6: '첼시',
  7: '코번트리 시티',
  8: '크리스탈 팰리스',
  9: '에버튼',
  10: '풀럼',
  11: '입스위치',
  12: '레스터 시티',
  13: '리버풀',
  14: '맨체스터 시티',
  15: '맨체스터 유나이티드',
  16: '뉴캐슬',
  17: '노팅엄',
  18: '사우샘프턴',
  19: '토트넘',
  20: '웨스트햄',
  57: '아스널',
  58: '애스턴 빌라',
  61: '첼시',
  62: '에버튼',
  63: '풀럼',
  64: '리버풀',
  65: '맨체스터 시티',
  66: '맨체스터 유나이티드',
  67: '뉴캐슬',
  71: '선덜랜드',
  73: '토트넘',
  76: '울버햄튼',
  328: '번리',
  338: '레스터 시티',
  340: '사우샘프턴',
  341: '리즈',
  349: '입스위치',
  351: '노팅엄',
  354: '크리스탈 팰리스',
  397: '브라이튼',
  402: '브렌트포드',
  563: '웨스트햄',
  1044: '본머스',
}

// 기본 경기장 한글명 매핑
function getStadiumNameKor(stadium, teamId) {
  if (!stadium) return '홈 구장'
  return stadium
}

// 경기 결과 판별
function getMatchOutcome(match) {
  if (match.homeScore == null || match.awayScore == null) return null
  const h = Number(match.homeScore)
  const a = Number(match.awayScore)
  if (h > a) return 'HOME_WIN'
  if (h < a) return 'AWAY_WIN'
  return 'DRAW'
}

export default function Match() {
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), [])
  const focusedMatchId = useMemo(() => {
    const id = urlParams.get('matchId')
    return id ? Number(id) : null
  }, [ urlParams ])

  // 필터 모드: 'MONTH' (월별) 또는 'ROUND' (라운드별)
  const [ filterMode, setFilterMode ] = useState('MONTH')

  // 월별 필터 상태 (기본값: 전체)
  const [ selectedMonth, setSelectedMonth ] = useState('ALL')

  // 라운드별 필터 상태 (기본값: 전체)
  const [ selectedRound, setSelectedRound ] = useState('ALL')

  // 구단 선택 필터 (기본값: 전체 구단)
  const [ selectedTeamId, setSelectedTeamId ] = useState('ALL')
  const [ selectedSeason, setSelectedSeason ] = useState(2026)
  const [ visibleCount, setVisibleCount ] = useState(MATCH_PAGE_SIZE)

  const [ rawMatches, setRawMatches ] = useState([])
  const [ rankResult, setRankResult ] = useState({ season: null, ranks: new Map() })
  const teamRanks = rankResult.season === selectedSeason ? rankResult.ranks : new Map()
  const [ dbError, setDbError ] = useState('')
  const [ loading, setLoading ] = useState(false)
  const [ reload, setReload ] = useState(0)
  const [ activeMatchForModal, setActiveMatchForModal ] = useState(null)

  const handleSyncMatches = async () => {
    if (syncing) return
    if (!window.confirm('외부 축구 API에서 2026 시즌 전체 380경기 일정을 DB(MATCHES)로 동기화하시겠습니까?')) return
    try {
      setSyncing(true)
      const token = localStorage.getItem('token')
      const res = await fetch('/api/matches/sync-season?season=2026', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
      })
      const data = await res.json()
      alert(data.message || 'DB 동기화가 완료되었습니다!')
      setReload((v) => v + 1)
    } catch (err) {
      alert('동기화 중 오류가 발생했습니다: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  // 1. 실시간 리그 순위 데이터 로드 (DB TEAM_STATS 연동)
  useEffect(() => {
    let active = true
    const rankMap = new Map()

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    fetch(`/api/teams/standings?season=${selectedSeason}`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((standings) => {
        clearTimeout(timeoutId)
        if (!active) return
        if (!Array.isArray(standings)) throw new Error('잘못된 순위 응답')
        standings.forEach((s) => {
          if (Number(s.season) === selectedSeason && s.teamId && Number(s.currentRank) > 0) {
            rankMap.set(Number(s.teamId), Number(s.currentRank))
          }
        })
        if (active) setRankResult({ season: selectedSeason, ranks: rankMap })
      })
      .catch(() => {
        clearTimeout(timeoutId)
        if (active) setRankResult({ season: selectedSeason, ranks: new Map() })
      })

    return () => {
      active = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [ reload, selectedSeason ])

  // 2. DB MATCHES 테이블 데이터 로드 (경기종료, LIVE, 경기예정 전체 통합 로드)
  useEffect(() => {
    let active = true
    setLoading(true)
    setDbError('')

    setRawMatches([])
    const apiUrl = `/api/matches?season=${selectedSeason}`

    const controller = new AbortController()
    // 연결 지연 시 오류 안내
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    fetch(apiUrl, { signal: controller.signal })
      .then((res) => {
        clearTimeout(timeoutId)
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (!active) return
        if (Array.isArray(data)) {
          setRawMatches(data)
          setDbError('')
        } else {
          throw new Error('경기 목록 응답 형식 오류')
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        if (!active) return
        console.warn('[Match] 백엔드(/api/matches) 연결 지연 또는 실패:', err.message)
        setRawMatches([])
        setDbError('오라클 DB 연결 실패 (' + (err.name === 'AbortError' ? '연결 타임아웃' : err.message) + ')')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [ reload, selectedSeason ])

  // 2-1. DB TEAMS 테이블 실시간 로드 (구단 선택에는 DB API에서 가져오는 구단만 노출)
  const [ dbTeamsList, setDbTeamsList ] = useState([])
  useEffect(() => {
    let active = true
    getTeams().then((data) => {
      if (active && Array.isArray(data) && data.length > 0) {
        setDbTeamsList(data)
      }
    })
    return () => {
      active = false
    }
  }, [ reload ])

  // 3. 구단 목록 실시간 추출 (구단 선택 드롭다운용: DB API 결과만 반영 및 한국어 가나다순 정렬)
  const dbTeams = useMemo(() => {
    const sourceList = dbTeamsList.length > 0 ? dbTeamsList : teamsData

    return sourceList
      .map((t) => {
        const id = Number(t.teamId)
        return {
          teamId: id,
          teamName: t.teamName,
          teamNameKor: t.teamNameKor || TEAM_NAMES_KOR[ id ] || t.teamName,
          emblemUrl: t.emblemUrl || '',
          homeGround: t.homeGround || '홈 경기장',
          homeGroundKor: t.homeGroundKor || getStadiumNameKor(t.homeGround, id),
        }
      })
      .sort((a, b) => a.teamNameKor.localeCompare(b.teamNameKor, 'ko'))
  }, [ dbTeamsList ])

  // 4. 구단 ID로 정보(이름, 엠블럼, 경기장) 조회
  const getTeamInfo = useCallback(
    (teamId) => {
      const numId = Number(teamId)
      const foundFromDb = dbTeams.find((t) => t.teamId === numId)
      if (foundFromDb) return foundFromDb

      const foundFromStatic = teamsData.find((t) => t.teamId === numId)
      if (foundFromStatic) {
        return {
          teamId: numId,
          teamName: foundFromStatic.teamName,
          teamNameKor: foundFromStatic.teamNameKor || TEAM_NAMES_KOR[ numId ] || foundFromStatic.teamName,
          emblemUrl: foundFromStatic.emblemUrl || '',
          homeGround: foundFromStatic.homeGround,
          homeGroundKor: foundFromStatic.homeGroundKor || getStadiumNameKor(foundFromStatic.homeGround, numId),
        }
      }

      return {
        teamId: numId,
        teamName: `팀 #${teamId}`,
        teamNameKor: TEAM_NAMES_KOR[ numId ] || `팀 #${teamId}`,
        emblemUrl: '',
        homeGround: '홈 경기장',
        homeGroundKor: getStadiumNameKor('', numId),
      }
    },
    [ dbTeams ]
  )

  // 5. 현재 선택된 구단 정보
  const selectedTeam = useMemo(() => {
    if (selectedTeamId === 'ALL') return null
    return getTeamInfo(Number(selectedTeamId))
  }, [ selectedTeamId, getTeamInfo ])

  // 6. 경기 목록 가공 및 정렬
  const matches = useMemo(() => {
    const list = [ ...rawMatches ].map((m) => {
      const homeInfo = getTeamInfo(m.homeTeamId)
      const awayInfo = getTeamInfo(m.awayTeamId)

      return {
        ...m,
        computedRound: m.round ?? m.matchday ?? null,
        displayHomeTeamName: m.homeTeamNameKor || homeInfo.teamNameKor,
        displayAwayTeamName: m.awayTeamNameKor || awayInfo.teamNameKor,
        displayHomeEmblem: m.homeEmblemUrl || homeInfo.emblemUrl,
        displayAwayEmblem: m.awayEmblemUrl || awayInfo.emblemUrl,
        displayHomeGround: m.homeGroundKor || homeInfo.homeGroundKor || getStadiumNameKor(m.homeGround || homeInfo.homeGround, m.homeTeamId),
      }
    })

    // 경기 일정은 날짜 오름차순으로 표시
    const sorted = list.sort((a, b) => {
      const dateA = a.matchDate || ''
      const dateB = b.matchDate || ''
      return dateA.localeCompare(dateB)
    })

    return sorted.map((m, idx) => ({
      ...m,
      computedRound: m.round ?? m.matchday ?? (Math.floor(idx / 10) + 1),
    }))
  }, [ rawMatches, getTeamInfo ])

  // 7. 필터링 로직 (월별 / 라운드별 + 구단 선택) - 경기종료, LIVE, 경기예정 모두 통합!
  const filteredMatches = useMemo(() => {
    let result = matches.filter((match) => {
      if (match.season != null) return Number(match.season) === selectedSeason
      const date = String(match.matchDate || '').match(/^(\d{4})[-/](\d{1,2})/)
      if (!date) return false
      const season = Number(date[1]) - (Number(date[2]) < 7 ? 1 : 0)
      return season === selectedSeason
    })

    // 구단 필터
    if (selectedTeamId !== 'ALL') {
      const targetId = Number(selectedTeamId)
      result = result.filter(
        (m) => Number(m.homeTeamId) === targetId || Number(m.awayTeamId) === targetId
      )
    }

    // 모드별 필터 (월별 vs 라운드별)
    if (filterMode === 'MONTH') {
      if (selectedMonth !== 'ALL') {
        const targetMonthNum = Number(selectedMonth)
        result = result.filter((m) => {
          if (!m.matchDate) return false
          const mParts = String(m.matchDate).match(/(?:^\d{4}[-/]|[-/])(\d{1,2})/)
          if (mParts) {
            return Number(mParts[ 1 ]) === targetMonthNum
          }
          const d = new Date(m.matchDate)
          if (!isNaN(d.getTime())) {
            return (d.getMonth() + 1) === targetMonthNum
          }
          return false
        })
      }
    } else if (filterMode === 'ROUND') {
      if (selectedRound !== 'ALL') {
        const targetRound = Number(selectedRound)
        result = result.filter((m) => {
          const r = Number(m.computedRound ?? m.round ?? m.matchday)
          return r === targetRound
        })
      }
    }

    return result
  }, [ matches, selectedSeason, selectedTeamId, filterMode, selectedMonth, selectedRound ])

  const hasFocusedScrolledRef = useRef(false)

  useEffect(() => {
    setVisibleCount(MATCH_PAGE_SIZE)
  }, [selectedSeason, selectedTeamId, filterMode, selectedMonth, selectedRound, reload])

  // 애정팀 예정경기 클릭(?matchId=...)으로 진입 시 해당 경기가 있는 위치까지 더보기 목록을 자동 확장
  const focusedMatchIndex = useMemo(() => {
    if (!focusedMatchId) return -1
    return filteredMatches.findIndex((m) => Number(m.matchId) === focusedMatchId)
  }, [focusedMatchId, filteredMatches])

  const requiredVisibleForFocus =
    !hasFocusedScrolledRef.current && focusedMatchIndex >= 0
      ? Math.ceil((focusedMatchIndex + 1) / MATCH_PAGE_SIZE) * MATCH_PAGE_SIZE
      : MATCH_PAGE_SIZE

  const effectiveVisibleCount = Math.max(visibleCount, requiredVisibleForFocus)
  const visibleMatches = filteredMatches.slice(0, effectiveVisibleCount)

  useEffect(() => {
    if (!focusedMatchId || loading || focusedMatchIndex < 0 || hasFocusedScrolledRef.current) {
      return
    }

    const neededCount = Math.ceil((focusedMatchIndex + 1) / MATCH_PAGE_SIZE) * MATCH_PAGE_SIZE
    if (visibleCount < neededCount) {
      setVisibleCount(neededCount)
    }

    const timer = setTimeout(() => {
      const targetEl = document.getElementById(`match-card-${focusedMatchId}`)
      if (targetEl) {
        hasFocusedScrolledRef.current = true
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
        targetEl.focus({ preventScroll: true })
      }
    }, 120)

    return () => clearTimeout(timer)
  }, [focusedMatchId, focusedMatchIndex, loading, visibleCount])

  // 승/패 판정 도우미
  const getMatchOutcome = (m) => {
    if (m.homeScore === null || m.awayScore === null) return 'UPCOMING'
    if (Number(m.homeScore) > Number(m.awayScore)) return 'HOME_WIN'
    if (Number(m.awayScore) > Number(m.homeScore)) return 'AWAY_WIN'
    return 'DRAW'
  }

  // 실시간 리그 순위 배지 렌더링 도우미 (팀명 옆 표기)
  const renderTeamRankBadge = (teamId) => {
    const rank = teamRanks.get(Number(teamId))
    if (!rank) return null

    let modifier = 'default'
    if (rank >= 1 && rank <= 4) {
      modifier = 'top' // 1~4위 챔피언스리그권 (로열 퍼플 & 그린 포인트)
    } else if (rank >= 18 && rank <= 20) {
      modifier = 'danger' // 18~20위 강등권 (주의 레드)
    }

    return (
      <span
        className={`match-team-rank-badge match-team-rank-badge--${modifier}`}
        title={`${seasonLabel(selectedSeason)} 시즌 프리미어리그 ${rank}위`}
      >
        {rank}위
      </span>
    )
  }

  // 경기 상태 및 스코어 배지 렌더링 (경기종료 / LIVE / 경기예정)
  const renderStatusBadge = (match) => {
    const { status, homeScore, awayScore } = match
    const isFinished =
      status === 'FINISHED' ||
      status === 'AWARDED' ||
      (homeScore !== null && awayScore !== null)
    const isLive = status === 'LIVE' || status === 'IN_PLAY'

    if (isFinished) {
      return (
        <div className="match-score-box match-score-box--result">
          <div className="match-score match-score--large">
            <span className="match-score__num">{homeScore ?? 0}</span>
            <span className="match-score__divider">:</span>
            <span className="match-score__num">{awayScore ?? 0}</span>
          </div>
          <span className="match-badge match-badge--finished">
            {status === 'AWARDED' ? '몰수 경기' : '경기종료'}
          </span>
        </div>
      )
    }

    if (isLive) {
      return (
        <div className="match-score-box">
          <div className="match-score">
            {homeScore ?? 0} : {awayScore ?? 0}
          </div>
          <span className="match-badge match-badge--live">LIVE</span>
        </div>
      )
    }

    return (
      <div className="match-score-box">
        <span className="match-score--vs">VS</span>
        <span className="match-badge match-badge--scheduled">경기예정</span>
      </div>
    )
  }

  return (
    <div className="match-page-container">
      <div className="match-page-wrapper">
        {/* 헤더 */}
        <header className="match-page-header">
          <span className="match-page-eyebrow">
            Premier League Schedule
          </span>
          <h1 className="match-page-title">
            프리미어리그 경기 일정
          </h1>
          <p className="match-page-desc">
            {seasonLabel(selectedSeason)} 시즌 프리미어리그 전체 경기 일정을 월별/라운드별로 필터링하여 확인하세요.
          </p>
        </header>

        <div className="match-season-tabs" role="group" aria-label="시즌 선택">
          {SEASONS.map((season) => (
            <button
              key={season}
              type="button"
              className={`match-season-tab ${selectedSeason === season ? 'is-active' : ''}`}
              aria-pressed={selectedSeason === season}
              onClick={() => setSelectedSeason(season)}
            >
              {seasonLabel(season)} 시즌
            </button>
          ))}
        </div>

        {/* DB 연결 상태 안내 배너 (연결 지연 시 안내) */}
        {dbError && (
          <div style={{
            background: 'var(--match-warning-bg)',
            border: '1px solid var(--match-warning-line)',
            color: 'var(--match-warning-text)',
            padding: '14px 18px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '14px',
            lineHeight: '1.6',
            boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => setDbError('')}
              style={{
                position: 'absolute',
                top: '12px',
                right: '14px',
                background: 'none',
                border: 'none',
                fontSize: '16px',
                color: 'var(--match-warning-text)',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              title="알림 닫기"
            >
              ✕
            </button>
            <strong>⚠️ {dbError}</strong><br />
            <span style={{ fontSize: '13px', color: 'var(--match-warning-muted)' }}>
              {seasonLabel(selectedSeason)} 시즌 경기 데이터를 불러오지 못했습니다. 잠시 후 새로고침해 주세요.
            </span>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="team-filter-reset-btn"
                style={{ backgroundColor: '#854d0e', color: '#fff', fontSize: '12px', padding: '5px 12px', borderRadius: '6px' }}
                onClick={() => setReload((v) => v + 1)}
              >
                🔄 DB 다시 연결
              </button>
              <button
                type="button"
                className="team-filter-reset-btn"
                style={{ backgroundColor: '#38003c', color: '#00ff87', fontSize: '12px', padding: '5px 12px', borderRadius: '6px' }}
                disabled={syncing}
                onClick={handleSyncMatches}
              >
                {syncing ? '동기화 중...' : '⚡ 외부 API 경기 데이터 DB 동기화'}
              </button>
            </div>
          </div>
        )}

        {/* 필터 모드 전환 토글 (월별 보기 vs 라운드별 보기) */}
        <div className="filter-mode-toggle">
          <div className="filter-mode-toggle__inner">
            <button
              type="button"
              className={`filter-mode-btn ${filterMode === 'MONTH' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('MONTH')
                setSelectedRound('ALL')
              }}
            >
              📅 월별 보기
            </button>
            <button
              type="button"
              className={`filter-mode-btn ${filterMode === 'ROUND' ? 'active' : ''}`}
              onClick={() => {
                setFilterMode('ROUND')
                setSelectedMonth('ALL')
              }}
            >
              🏆 라운드별 보기
            </button>
          </div>
        </div>

        {/* 구단(팀) 선택 필터 바 - DB 구단 및 실시간 순위 함께 표기 */}
        <div className="team-filter-bar">
          <span className="team-filter-label">구단 선택:</span>
          <div className="team-filter-select-wrapper">
            {selectedTeam?.emblemUrl && (
              <img
                src={selectedTeam.emblemUrl}
                alt={selectedTeam.teamNameKor || selectedTeam.teamName}
                className="team-filter-emblem"
              />
            )}
            <select
              className="team-filter-select"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              aria-label="구단 선택"
            >
              <option value="ALL">전체 구단</option>
              {dbTeams.map((team) => {
                return (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamNameKor} ({team.teamName})
                  </option>
                )
              })}
            </select>
            <span className="team-filter-arrow">▼</span>
          </div>

          {selectedTeamId !== 'ALL' && (
            <button
              type="button"
              className="team-filter-reset-btn"
              onClick={() => setSelectedTeamId('ALL')}
            >
              ✕ 전체 보기
            </button>
          )}
        </div>

        {/* 1. 월별 필터 탭 바 (MONTH 모드일 때 노출) */}
        {filterMode === 'MONTH' && (
          <section className="month-filter-container" aria-label="월별 일정 필터">
            <div className="month-filter-nav">
              {MONTH_TABS.map((tab) => {
                const isActive = selectedMonth === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`month-filter-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedMonth(tab.id)}
                    aria-pressed={isActive}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* 2. 라운드별 필터 UI (ROUND 모드일 때 노출) */}
        {filterMode === 'ROUND' && (
          <section className="round-filter-container" aria-label="라운드별 일정 필터">
            <div className="round-filter-nav">
              <button
                type="button"
                className={`round-filter-btn ${selectedRound === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedRound('ALL')}
              >
                전체
              </button>
              {ROUND_LIST.map((r) => {
                const isActive = Number(selectedRound) === r
                return (
                  <button
                    key={r}
                    type="button"
                    className={`round-filter-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedRound(r)}
                  >
                    {r}R
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* 경기 카운트 및 새로고침 상태바 */}
        <div className="match-status-bar">
          <button
            type="button"
            className="team-filter-reset-btn match-reload-btn"
            disabled={loading}
            onClick={() => {
              setLoading(true)
              setReload((value) => value + 1)
            }}
          >
            🔄 새로고침
          </button>
          <span className="match-count">
            {seasonLabel(selectedSeason)} 시즌 ·{' '}
            총 <strong>{filteredMatches.length}</strong>개의{' '}
            경기
            {filterMode === 'MONTH' && selectedMonth !== 'ALL' && (
              <span> ({MONTH_TABS.find((t) => t.id === selectedMonth)?.label})</span>
            )}
            {filterMode === 'ROUND' && selectedRound !== 'ALL' && (
              <span> ({selectedRound} 라운드)</span>
            )}
            {selectedTeam && (
              <span style={{ color: 'var(--match-accent-text)', fontWeight: 800 }}>
                {' '}
                · {selectedTeam.teamNameKor} ({selectedTeam.teamName})
              </span>
            )}
          </span>
        </div>

        {/* 경기 카드 목록 리스트 */}
        {loading ? (
          <div className="match-empty">
            <div className="match-loading-spinner" />
            <p className="match-empty__text">
              {seasonLabel(selectedSeason)} 시즌 ·{' '}
              경기 일정을 불러오는 중입니다...
            </p>
          </div>
        ) : dbError ? (
          <div className="match-empty">
            <p className="match-empty__text">경기 일정을 불러오지 못했습니다.</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="match-empty">
            <div className="match-empty__icon">⚽</div>
            <p className="match-empty__text">
              {selectedTeam
                ? `${selectedTeam.teamNameKor}의 해당 기간 경기 일정이 없습니다.`
                : filterMode === 'MONTH'
                    ? '선택하신 조건에 해당하는 경기 일정이 없습니다.'
                    : '선택하신 라운드에 해당하는 경기 일정이 없습니다.'}
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="team-filter-reset-btn"
                onClick={() => {
                  setSelectedMonth('ALL')
                  setSelectedRound('ALL')
                  setSelectedTeamId('ALL')
                }}
              >
                전체 경기 보기
              </button>
            </div>
          </div>
        ) : (
          <div className="match-grid">
            {visibleMatches.map((match) => {
              const homeTeam = getTeamInfo(match.homeTeamId)
              const awayTeam = getTeamInfo(match.awayTeamId)
              const [ dateStr, timeStr ] = (match.matchDate || '').split(' ')

              const { status, homeScore, awayScore } = match
              const isFinished =
                status === 'FINISHED' ||
                status === 'AWARDED' ||
                (homeScore !== null && awayScore !== null)
              const isLive = status === 'LIVE' || status === 'IN_PLAY'

              const outcome = getMatchOutcome(match)
              const isHomeWinner = isFinished && outcome === 'HOME_WIN'
              const isAwayWinner = isFinished && outcome === 'AWAY_WIN'
              const isFocusedMatch = Boolean(focusedMatchId && Number(match.matchId) === focusedMatchId)

              return (
                <article
                  key={match.matchId}
                  id={`match-card-${match.matchId}`}
                  tabIndex={isFocusedMatch ? -1 : undefined}
                  className={`match-card ${isFocusedMatch ? 'match-card--focused' : ''}`}
                >
                  {/* 일시 및 라운드 태그 */}
                  <div className="match-card__datetime">
                    {match.computedRound && (
                      <span className="match-card__round-tag">{match.computedRound}R</span>
                    )}
                    <span className="match-card__date">{dateStr}</span>
                    <span className="match-card__time">
                      {timeStr ? `${timeStr} (KST)` : '시간 미정'}
                    </span>
                  </div>

                  {/* 대결 팀 (홈 vs 원정): 한국어명(영문명) 및 엠블럼 */}
                  <div className="match-card__versus">
                    {/* 홈팀 */}
                    <div
                      className={`match-team match-team--home ${
                        isHomeWinner
                          ? 'match-team--winner'
                          : isAwayWinner
                            ? 'match-team--loser'
                            : ''
                      }`}
                    >
                      <div className="match-team__info">
                        <span className="match-team__name-kor">
                          {renderTeamRankBadge(match.homeTeamId)}
                          {homeTeam.teamNameKor}
                          {isHomeWinner && <span className="match-win-badge">승</span>}
                        </span>
                        <span className="match-team__name-eng">({homeTeam.teamName})</span>
                      </div>
                      {homeTeam.emblemUrl && (
                        <div className="match-team__emblem-wrap">
                          <img
                            src={homeTeam.emblemUrl}
                            alt={homeTeam.teamNameKor || homeTeam.teamName}
                            className="match-team__emblem"
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                          />
                        </div>
                      )}
                    </div>

                    {/* 스코어 또는 VS */}
                    {renderStatusBadge(match)}

                    {/* 원정팀 */}
                    <div
                      className={`match-team match-team--away ${
                        isAwayWinner
                          ? 'match-team--winner'
                          : isHomeWinner
                            ? 'match-team--loser'
                            : ''
                      }`}
                    >
                      {awayTeam.emblemUrl && (
                        <div className="match-team__emblem-wrap">
                          <img
                            src={awayTeam.emblemUrl}
                            alt={awayTeam.teamNameKor || awayTeam.teamName}
                            className="match-team__emblem"
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                          />
                        </div>
                      )}
                      <div className="match-team__info">
                        <span className="match-team__name-kor">
                          {renderTeamRankBadge(match.awayTeamId)}
                          {awayTeam.teamNameKor}
                          {isAwayWinner && <span className="match-win-badge">승</span>}
                        </span>
                        <span className="match-team__name-eng">({awayTeam.teamName})</span>
                      </div>
                    </div>
                  </div>

                  {/* 홈 경기장 안내 및 감독모드 텍스트 중계 버튼 (종료된 경기 및 진행 중 LIVE 경기에만 노출) */}
                  <div className="match-card__ground">
                    <span className="match-ground-pill">
                      📍 {match.displayHomeGround || match.homeGroundKor || homeTeam.homeGroundKor || getStadiumNameKor(match.homeGround || homeTeam.homeGround, match.homeTeamId)}
                    </span>
                    {(isFinished || isLive) && (
                      <button
                        type="button"
                        className="match-manager-mode-btn"
                        onClick={() => setActiveMatchForModal(match)}
                        title="FC 온라인 감독모드 스타일 2D 피치 & 문자 중계 열기"
                      >
                        🎮 감독모드 중계
                      </button>
                    )}
                  </div>
                </article>
              )
            })}
            {visibleMatches.length < filteredMatches.length && (
              <button
                type="button"
                className="match-load-more"
                onClick={() => setVisibleCount(effectiveVisibleCount + MATCH_PAGE_SIZE)}
              >
                더보기 ({visibleMatches.length} / {filteredMatches.length})
              </button>
            )}
          </div>
        )}

        {/* FC 온라인 감독모드 스타일 2D 피치 & 타임라인 텍스트 중계 모달 */}
        {activeMatchForModal && (
          <FcManagerModeModal
            isOpen={Boolean(activeMatchForModal)}
            onClose={() => setActiveMatchForModal(null)}
            match={activeMatchForModal}
            homeTeam={getTeamInfo(activeMatchForModal.homeTeamId)}
            awayTeam={getTeamInfo(activeMatchForModal.awayTeamId)}
          />
        )}
      </div>
    </div>
  )
}
