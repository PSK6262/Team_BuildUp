import React, { useState, useEffect, useMemo } from 'react'
import teamsData from '../../Assets/data/teamsData.js'
import '../css/match.css'

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

// 프리미어리그 38개 라운드 목록 생성 (1R ~ 38R)
const ROUND_LIST = Array.from({ length: 38 }, (_, i) => i + 1)

// 기본 샘플 데이터 (백엔드 데이터가 없을 때 표시)
const SAMPLE_MATCHES = [
    // 1 라운드 (8월)
    {
        matchId: 101,
        matchDate: '2026-08-16 20:30',
        round: 1,
        homeTeamId: 2, // Arsenal
        awayTeamId: 3, // Aston Villa
        homeScore: 2,
        awayScore: 1,
        status: 'FINISHED',
    },
    {
        matchId: 102,
        matchDate: '2026-08-17 01:30',
        round: 1,
        homeTeamId: 1, // Bournemouth
        awayTeamId: 4, // Brentford
        homeScore: 1,
        awayScore: 1,
        status: 'FINISHED',
    },
    // 2 라운드 (8월)
    {
        matchId: 103,
        matchDate: '2026-08-23 23:00',
        round: 2,
        homeTeamId: 3, // Aston Villa
        awayTeamId: 1, // Bournemouth
        homeScore: 3,
        awayScore: 0,
        status: 'FINISHED',
    },
    {
        matchId: 104,
        matchDate: '2026-08-24 01:30',
        round: 2,
        homeTeamId: 4, // Brentford
        awayTeamId: 2, // Arsenal
        homeScore: 0,
        awayScore: 2,
        status: 'FINISHED',
    },
    // 3 라운드 (9월)
    {
        matchId: 105,
        matchDate: '2026-09-13 22:00',
        round: 3,
        homeTeamId: 2, // Arsenal
        awayTeamId: 1, // Bournemouth
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED',
    },
    {
        matchId: 106,
        matchDate: '2026-09-14 01:30',
        round: 3,
        homeTeamId: 4, // Brentford
        awayTeamId: 3, // Aston Villa
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED',
    },
    // 4 라운드 (9월)
    {
        matchId: 107,
        matchDate: '2026-09-20 20:30',
        round: 4,
        homeTeamId: 3, // Aston Villa
        awayTeamId: 2, // Arsenal
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED',
    },
]

export default function Match() {
    // 필터 모드: 'MONTH' (월별) 또는 'ROUND' (라운드별)
    const [ filterMode, setFilterMode ] = useState('MONTH')

    // 월별 필터 상태 (기본값: 전체)
    const [ selectedMonth, setSelectedMonth ] = useState('ALL')

    // 라운드별 필터 상태 (기본값: 1라운드)
    const [ selectedRound, setSelectedRound ] = useState(1)

    // 구단 선택 필터 (기본값: 전체 구단)
    const [ selectedTeamId, setSelectedTeamId ] = useState('ALL')

    const [ rawMatches, setRawMatches ] = useState([])
    const [ loading, setLoading ] = useState(true)

    // 20개 구단 가나다/알파벳순 정렬 목록
    const sortedTeams = useMemo(() => {
        return [ ...teamsData ].sort((a, b) => a.teamName.localeCompare(b.teamName))
    }, [])

    // 팀 ID로 구단 정보(이름, 엠블럼, 경기장) 조회
    const getTeamInfo = (teamId) => {
        const found = teamsData.find((t) => t.teamId === Number(teamId))
        return (
            found || {
                teamName: `팀 #${teamId}`,
                emblemUrl: '',
                homeGround: '경기장',
            }
        )
    }

    // 현재 선택된 구단 정보
    const selectedTeam = useMemo(() => {
        if (selectedTeamId === 'ALL') return null
        return teamsData.find((t) => t.teamId === Number(selectedTeamId))
    }, [ selectedTeamId ])

    // 백엔드 API 호출 (/api/matches)
    useEffect(() => {
        fetch('/api/matches')
            .then((res) => {
                if (!res.ok) throw new Error('API 응답 실패')
                return res.json()
            })
            .then((data) => {
                if (Array.isArray(data) && data.length > 0) {
                    setRawMatches(data)
                } else {
                    setRawMatches(SAMPLE_MATCHES)
                }
            })
            .catch((_err) => {
                setRawMatches(SAMPLE_MATCHES)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])

    // 백엔드에 round 필드가 없을 경우 대비한 자동 라운드 매핑 보정
    const matches = useMemo(() => {
        const sorted = [ ...rawMatches ].sort((a, b) => {
            return (a.matchDate || '').localeCompare(b.matchDate || '')
        })

        return sorted.map((m, index) => {
            const explicitRound = m.round || m.matchday
            if (explicitRound) {
                return { ...m, computedRound: Number(explicitRound) }
            }
            const fallbackRound = Math.min(38, Math.floor(index / 10) + 1)
            return { ...m, computedRound: fallbackRound }
        })
    }, [ rawMatches ])

    // 필터링 적용 (월별/라운드별 + 구단 선택 필터)
    const filteredMatches = useMemo(() => {
        let result = matches

        // 1. 월별 / 라운드별 기본 필터
        if (filterMode === 'MONTH') {
            if (selectedMonth !== 'ALL') {
                result = result.filter((match) => {
                    if (!match.matchDate) return false
                    const datePart = match.matchDate.split(' ')[ 0 ] || ''
                    const parts = datePart.split('-')
                    const matchMonth = parts[ 1 ] // "08", "09", ...
                    return matchMonth === selectedMonth
                })
            }
        } else if (filterMode === 'ROUND') {
            if (selectedRound !== 'ALL') {
                result = result.filter(
                    (match) => match.computedRound === Number(selectedRound)
                )
            }
        }

        // 2. 구단(팀) 선택 필터
        if (selectedTeamId !== 'ALL') {
            const targetId = Number(selectedTeamId)
            result = result.filter(
                (m) => m.homeTeamId === targetId || m.awayTeamId === targetId
            )
        }

        return result
    }, [ matches, filterMode, selectedMonth, selectedRound, selectedTeamId ])

    // 경기 상태 배지 렌더링
    const renderStatusBadge = (status, match) => {
        if (status === 'FINISHED') {
            return (
                <div className="match-score-box">
                    <div className="match-score">
                        {match.homeScore ?? 0} : {match.awayScore ?? 0}
                    </div>
                    <span className="match-badge match-badge--finished">종료</span>
                </div>
            )
        }

        if (status === 'LIVE' || status === 'IN_PLAY') {
            return (
                <div className="match-score-box">
                    <div className="match-score">
                        {match.homeScore ?? 0} : {match.awayScore ?? 0}
                    </div>
                    <span className="match-badge match-badge--live">LIVE</span>
                </div>
            )
        }

        return (
            <div className="match-score-box">
                <span className="match-score--vs">VS</span>
                <span className="match-badge match-badge--scheduled">예정</span>
            </div>
        )
    }

    return (
        <div className="match-page-container">
            <div className="match-page-wrapper">
                {/* 헤더 */}
                <header className="match-page-header">
                    <span className="match-page-eyebrow">Premier League Schedule</span>
                    <h1 className="match-page-title">프리미어리그 경기 일정</h1>
                    <p className="match-page-desc">
                        월별 또는 라운드별로 원하는 프리미어리그 경기 일정을 확인하세요.
                    </p>
                </header>

                {/* 상단 보기 모드 전환 토글 (월별 보기 / 라운드별 보기) */}
                <div className="filter-mode-toggle">
                    <div className="filter-mode-toggle__inner">
                        <button
                            type="button"
                            className={`filter-mode-btn ${filterMode === 'MONTH' ? 'active' : ''}`}
                            onClick={() => setFilterMode('MONTH')}
                        >
                            📅 월별 보기
                        </button>
                        <button
                            type="button"
                            className={`filter-mode-btn ${filterMode === 'ROUND' ? 'active' : ''}`}
                            onClick={() => setFilterMode('ROUND')}
                        >
                            🏆 라운드별 보기
                        </button>
                    </div>
                </div>

                {/* 구단(팀) 선택 필터 바 */}
                <div className="team-filter-bar">
                    <span className="team-filter-label">구단 선택:</span>
                    <div className="team-filter-select-wrapper">
                        {selectedTeam?.emblemUrl && (
                            <img
                                src={selectedTeam.emblemUrl}
                                alt={selectedTeam.teamName}
                                className="team-filter-emblem"
                            />
                        )}
                        <select
                            className="team-filter-select"
                            value={selectedTeamId}
                            onChange={(e) => setSelectedTeamId(e.target.value)}
                            aria-label="구단 선택"
                        >
                            <option value="ALL">전체 20개 구단</option>
                            {sortedTeams.map((team) => (
                                <option key={team.teamId} value={team.teamId}>
                                    {team.teamName}
                                </option>
                            ))}
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
                            {ROUND_LIST.map((r) => {
                                const isActive = selectedRound === r
                                return (
                                    <button
                                        key={r}
                                        type="button"
                                        className={`round-filter-btn ${isActive ? 'active' : ''}`}
                                        onClick={() => setSelectedRound(r)}
                                        aria-pressed={isActive}
                                    >
                                        {r}R
                                    </button>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* 경기 카운트 표시 */}
                <div className="match-status-bar">
                    <span className="match-count">
                        총 <strong>{filteredMatches.length}</strong>개의 경기
                        {filterMode === 'MONTH' && selectedMonth !== 'ALL' && (
                            <span> ({MONTH_TABS.find((t) => t.id === selectedMonth)?.label})</span>
                        )}
                        {filterMode === 'ROUND' && <span> ({selectedRound} 라운드)</span>}
                        {selectedTeam && (
                            <span style={{ color: '#38003c', fontWeight: 800 }}>
                                {' '}
                                · {selectedTeam.teamName}
                            </span>
                        )}
                    </span>
                </div>

                {/* 경기 카드 목록 리스트 */}
                {loading ? (
                    <div className="match-empty">
                        <p className="match-empty__text">경기 일정을 불러오는 중입니다...</p>
                    </div>
                ) : filteredMatches.length === 0 ? (
                    <div className="match-empty">
                        <div className="match-empty__icon">⚽</div>
                        <p className="match-empty__text">
                            {selectedTeam
                                ? `${selectedTeam.teamName}의 해당 기간 경기 일정이 없습니다.`
                                : filterMode === 'MONTH'
                                    ? '선택하신 월에는 예정된 경기가 없습니다.'
                                    : `${selectedRound} 라운드에는 등록된 경기 일정이 없습니다.`}
                        </p>
                    </div>
                ) : (
                    <div className="match-grid">
                        {filteredMatches.map((match) => {
                            const homeTeam = getTeamInfo(match.homeTeamId)
                            const awayTeam = getTeamInfo(match.awayTeamId)

                            const [ dateStr, timeStr ] = (match.matchDate || '').split(' ')

                            return (
                                <article key={match.matchId} className="match-card">
                                    {/* 일시 및 라운드 태그 */}
                                    <div className="match-card__datetime">
                                        {match.computedRound && (
                                            <span className="match-card__round-tag">
                                                {match.computedRound}R
                                            </span>
                                        )}
                                        <span className="match-card__date">{dateStr}</span>
                                        <span className="match-card__time">
                                            {timeStr ? `${timeStr} (KST)` : '시간 미정'}
                                        </span>
                                    </div>

                                    {/* 대결 팀 (홈 vs 원정) */}
                                    <div className="match-card__versus">
                                        <div className="match-team match-team--home">
                                            <span className="match-team__name">{homeTeam.teamName}</span>
                                            {homeTeam.emblemUrl && (
                                                <img
                                                    src={homeTeam.emblemUrl}
                                                    alt={homeTeam.teamName}
                                                    className="match-team__emblem"
                                                />
                                            )}
                                        </div>

                                        {/* 스코어 또는 VS */}
                                        {renderStatusBadge(match.status, match)}

                                        <div className="match-team match-team--away">
                                            {awayTeam.emblemUrl && (
                                                <img
                                                    src={awayTeam.emblemUrl}
                                                    alt={awayTeam.teamName}
                                                    className="match-team__emblem"
                                                />
                                            )}
                                            <span className="match-team__name">{awayTeam.teamName}</span>
                                        </div>
                                    </div>

                                    {/* 홈 경기장 안내 */}
                                    <div className="match-card__ground">
                                        📍 {homeTeam.homeGround || '홈 구장'}
                                    </div>
                                </article>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}