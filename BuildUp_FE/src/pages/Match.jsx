import React, { useState, useEffect, useMemo, useCallback } from 'react'
import teamDbFallback from '../data/teamDbFallback.json'
import { getTeams } from '../api/teamApi.js'
import '../css/match.css'

const teamsData = teamDbFallback.teams

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

// 프리미어리그 홈 경기장 한글 매핑 사전
const STADIUM_NAMES_KOR = {
  // 구단 ID 기반 기본 홈 경기장
  2: '에미레이츠 스타디움', 57: '에미레이츠 스타디움', // 아스널
  3: '빌라 파크', 58: '빌라 파크', // 애스턴 빌라
  1: '바이탈리티 스타디움', 1044: '바이탈리티 스타디움', // 본머스
  4: '지텍 커뮤니티 스타디움', 402: '지텍 커뮤니티 스타디움', // 브렌트포드
  5: '아멕스 스타디움', 397: '아멕스 스타디움', // 브라이튼
  6: '스탬포드 브릿지', 61: '스탬포드 브릿지', // 첼시
  8: '셀허스트 파크', 354: '셀허스트 파크', // 크리스탈 팰리스
  9: '구디슨 파크', 62: '구디슨 파크', // 에버튼
  10: '크레이븐 코티지', 63: '크레이븐 코티지', // 풀럼
  11: '포트먼 로드', 349: '포트먼 로드', // 입스위치
  12: '킹 파워 스타디움', 338: '킹 파워 스타디움', // 레스터 시티
  13: '안필드', 64: '안필드', // 리버풀
  14: '에티하드 스타디움', 65: '에티하드 스타디움', // 맨체스터 시티
  15: '올드 트래포드', 66: '올드 트래포드', // 맨체스터 유나이티드
  16: '세인트 제임스 파크', 67: '세인트 제임스 파크', // 뉴캐슬
  17: '시티 그라운드', 351: '시티 그라운드', // 노팅엄 포레스트
  18: '세인트 메리스 스타디움', 340: '세인트 메리스 스타디움', // 사우샘프턴
  19: '토트넘 홋스퍼 스타디움', 73: '토트넘 홋스퍼 스타디움', // 토트넘
  20: '런던 스타디움', 563: '런던 스타디움', // 웨스트햄
  76: '몰리뉴 스타디움', 7: '몰리뉴 스타디움', // 울버햄튼
  328: '터프 무어',
  341: '앨런드 로드',
  71: '스타디움 오브 라이트',
  // 영문 스타디움명 매핑
  'Emirates Stadium': '에미레이츠 스타디움',
  'Villa Park': '빌라 파크',
  'Vitality Stadium': '바이탈리티 스타디움',
  'Dean Court': '바이탈리티 스타디움',
  'Gtech Community Stadium': '지텍 커뮤니티 스타디움',
  'Brentford Community Stadium': '지텍 커뮤니티 스타디움',
  'American Express Stadium': '아멕스 스타디움',
  'Amex Stadium': '아멕스 스타디움',
  'The American Express Community Stadium': '아멕스 스타디움',
  'Falmer Stadium': '아멕스 스타디움',
  'Stamford Bridge': '스탬포드 브릿지',
  'Selhurst Park': '셀허스트 파크',
  'Goodison Park': '구디슨 파크',
  'Hill Dickinson Stadium': '구디슨 파크',
  'Craven Cottage': '크레이븐 코티지',
  'Portman Road': '포트먼 로드',
  'King Power Stadium': '킹 파워 스타디움',
  'Anfield': '안필드',
  'Etihad Stadium': '에티하드 스타디움',
  'City of Manchester Stadium': '에티하드 스타디움',
  'Old Trafford': '올드 트래포드',
  "St. James' Park": '세인트 제임스 파크',
  "St James' Park": '세인트 제임스 파크',
  'City Ground': '시티 그라운드',
  "The City Ground": '시티 그라운드',
  "St Mary's Stadium": '세인트 메리스 스타디움',
  "St. Mary's Stadium": '세인트 메리스 스타디움',
  'Tottenham Hotspur Stadium': '토트넘 홋스퍼 스타디움',
  'London Stadium': '런던 스타디움',
  'Molineux Stadium': '몰리뉴 스타디움',
  'Turf Moor': '터프 무어',
  'Elland Road': '앨런드 로드',
  'Stadium of Light': '스타디움 오브 라이트',
}

function getStadiumNameKor(groundName, teamId) {
  if (teamId && STADIUM_NAMES_KOR[ Number(teamId) ]) {
    return STADIUM_NAMES_KOR[ Number(teamId) ]
  }
  if (groundName) {
    const trimmed = String(groundName).trim()
    if (STADIUM_NAMES_KOR[ trimmed ]) return STADIUM_NAMES_KOR[ trimmed ]
    for (const [ key, val ] of Object.entries(STADIUM_NAMES_KOR)) {
      if (typeof key === 'string' && trimmed.toLowerCase().includes(key.toLowerCase())) {
        return val
      }
    }
    return trimmed
  }
  return '홈 경기장'
}

// 백엔드 미응답 시 사용할 기본 순위(Fallback)
const DEFAULT_RANKS = {
  2: 1, 57: 1,      // 아스널 (1위)
  14: 2, 65: 2,     // 맨시티 (2위)
  13: 3, 64: 3,     // 리버풀 (3위)
  6: 4, 61: 4,      // 첼시 (4위)
  3: 5, 58: 5,      // 애스턴 빌라 (5위)
  19: 6, 73: 6,     // 토트넘 (6위)
  16: 7, 67: 7,     // 뉴캐슬 (7위)
  17: 8, 351: 8,    // 노팅엄 (8위)
  5: 9, 397: 9,     // 브라이튼 (9위)
  10: 10, 63: 10,   // 풀럼 (10위)
  4: 11, 402: 11,   // 브렌트포드 (11위)
  1: 12, 1044: 12,  // 본머스 (12위)
  15: 13, 66: 13,   // 맨유 (13위)
  20: 14, 563: 14,  // 웨스트햄 (14위)
  8: 15, 354: 15,   // 크리스탈 팰리스 (15위)
  9: 16, 62: 16,    // 에버튼 (16위)
  12: 17, 338: 17,  // 레스터 시티 (17위)
  7: 18, 76: 18,    // 코번트리 (18위)
  11: 19, 349: 19,  // 입스위치 (19위)
  18: 20, 340: 20,  // 사우샘프턴 (20위)
}

// 전체 38개 라운드 및 8~5월 경기 데이터 (경기 결과용 완료 경기 + 경기 일정용 예정 경기 모두 포함)
const SAMPLE_MATCHES = [
  // [8월] 완료 경기 (1R~3R)
  { matchId: 101, season: 2026, round: 1, matchDate: '2026-08-16 20:30', homeTeamId: 2, awayTeamId: 20, homeScore: 2, awayScore: 0, status: 'FINISHED' },
  { matchId: 102, season: 2026, round: 1, matchDate: '2026-08-16 23:00', homeTeamId: 13, awayTeamId: 11, homeScore: 2, awayScore: 0, status: 'FINISHED' },
  { matchId: 103, season: 2026, round: 1, matchDate: '2026-08-17 01:30', homeTeamId: 6, awayTeamId: 14, homeScore: 0, awayScore: 2, status: 'FINISHED' },
  { matchId: 104, season: 2026, round: 1, matchDate: '2026-08-17 22:00', homeTeamId: 19, awayTeamId: 12, homeScore: 1, awayScore: 1, status: 'FINISHED' },
  { matchId: 105, season: 2026, round: 1, matchDate: '2026-08-18 04:00', homeTeamId: 15, awayTeamId: 10, homeScore: 1, awayScore: 0, status: 'FINISHED' },
  { matchId: 106, season: 2026, round: 2, matchDate: '2026-08-23 20:30', homeTeamId: 5, awayTeamId: 15, homeScore: 2, awayScore: 1, status: 'FINISHED' },
  { matchId: 107, season: 2026, round: 2, matchDate: '2026-08-23 23:00', homeTeamId: 14, awayTeamId: 11, homeScore: 4, awayScore: 1, status: 'FINISHED' },
  { matchId: 108, season: 2026, round: 2, matchDate: '2026-08-24 01:30', homeTeamId: 3, awayTeamId: 2, homeScore: 0, awayScore: 2, status: 'FINISHED' },
  { matchId: 109, season: 2026, round: 3, matchDate: '2026-08-30 20:30', homeTeamId: 2, awayTeamId: 5, homeScore: 1, awayScore: 1, status: 'FINISHED' },
  { matchId: 110, season: 2026, round: 3, matchDate: '2026-08-31 01:30', homeTeamId: 15, awayTeamId: 13, homeScore: 0, awayScore: 3, status: 'FINISHED' },
  // [8월] 예정 경기 (일정 모드용)
  { matchId: 111, season: 2026, round: 1, matchDate: '2026-08-20 03:00', homeTeamId: 16, awayTeamId: 8, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 112, season: 2026, round: 2, matchDate: '2026-08-27 03:00', homeTeamId: 4, awayTeamId: 9, homeScore: null, awayScore: null, status: 'TIMED' },

  // [9월] 완료 경기 (4R~6R)
  { matchId: 113, season: 2026, round: 4, matchDate: '2026-09-14 20:30', homeTeamId: 18, awayTeamId: 15, homeScore: 0, awayScore: 3, status: 'FINISHED' },
  { matchId: 114, season: 2026, round: 4, matchDate: '2026-09-15 22:00', homeTeamId: 19, awayTeamId: 2, homeScore: 0, awayScore: 1, status: 'FINISHED' },
  { matchId: 115, season: 2026, round: 5, matchDate: '2026-09-21 20:30', homeTeamId: 20, awayTeamId: 6, homeScore: 0, awayScore: 3, status: 'FINISHED' },
  { matchId: 116, season: 2026, round: 5, matchDate: '2026-09-22 00:30', homeTeamId: 14, awayTeamId: 2, homeScore: 2, awayScore: 2, status: 'FINISHED' },
  { matchId: 117, season: 2026, round: 6, matchDate: '2026-09-28 20:30', homeTeamId: 16, awayTeamId: 14, homeScore: 1, awayScore: 1, status: 'FINISHED' },
  { matchId: 118, season: 2026, round: 6, matchDate: '2026-09-29 01:30', homeTeamId: 20, awayTeamId: 13, homeScore: 1, awayScore: 2, status: 'FINISHED' },
  // [9월] 예정 경기 (일정 모드용)
  { matchId: 119, season: 2026, round: 4, matchDate: '2026-09-24 03:00', homeTeamId: 13, awayTeamId: 3, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 120, season: 2026, round: 5, matchDate: '2026-09-30 03:00', homeTeamId: 6, awayTeamId: 5, homeScore: null, awayScore: null, status: 'TIMED' },

  // [10월] 완료 경기 (7R~9R)
  { matchId: 121, season: 2026, round: 7, matchDate: '2026-10-05 20:30', homeTeamId: 8, awayTeamId: 13, homeScore: 0, awayScore: 1, status: 'FINISHED' },
  { matchId: 122, season: 2026, round: 7, matchDate: '2026-10-06 00:30', homeTeamId: 5, awayTeamId: 19, homeScore: 3, awayScore: 2, status: 'FINISHED' },
  { matchId: 123, season: 2026, round: 8, matchDate: '2026-10-19 20:30', homeTeamId: 19, awayTeamId: 20, homeScore: 4, awayScore: 1, status: 'FINISHED' },
  { matchId: 124, season: 2026, round: 8, matchDate: '2026-10-20 00:30', homeTeamId: 13, awayTeamId: 6, homeScore: 2, awayScore: 1, status: 'FINISHED' },
  { matchId: 125, season: 2026, round: 9, matchDate: '2026-10-26 23:00', homeTeamId: 14, awayTeamId: 18, homeScore: 1, awayScore: 0, status: 'FINISHED' },
  { matchId: 126, season: 2026, round: 9, matchDate: '2026-10-28 01:30', homeTeamId: 2, awayTeamId: 13, homeScore: 2, awayScore: 2, status: 'FINISHED' },
  // [10월] LIVE 경기 및 예정 경기
  { matchId: 199, season: 2026, round: 7, matchDate: '2026-10-28 23:00', homeTeamId: 13, awayTeamId: 2, homeScore: 1, awayScore: 1, status: 'LIVE' },
  { matchId: 127, season: 2026, round: 7, matchDate: '2026-10-29 03:45', homeTeamId: 15, awayTeamId: 12, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 128, season: 2026, round: 8, matchDate: '2026-10-31 03:45', homeTeamId: 3, awayTeamId: 10, homeScore: null, awayScore: null, status: 'TIMED' },

  // [11월] 완료 경기 (10R~13R)
  { matchId: 129, season: 2026, round: 10, matchDate: '2026-11-02 21:30', homeTeamId: 16, awayTeamId: 2, homeScore: 1, awayScore: 0, status: 'FINISHED' },
  { matchId: 130, season: 2026, round: 11, matchDate: '2026-11-10 02:30', homeTeamId: 5, awayTeamId: 14, homeScore: 2, awayScore: 1, status: 'FINISHED' },
  { matchId: 131, season: 2026, round: 12, matchDate: '2026-11-24 02:30', homeTeamId: 14, awayTeamId: 19, homeScore: 0, awayScore: 4, status: 'FINISHED' },
  { matchId: 132, season: 2026, round: 13, matchDate: '2026-11-30 22:30', homeTeamId: 13, awayTeamId: 14, homeScore: 2, awayScore: 0, status: 'FINISHED' },
  // [11월] 예정 경기 (일정 모드용)
  { matchId: 133, season: 2026, round: 10, matchDate: '2026-11-15 02:30', homeTeamId: 6, awayTeamId: 2, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 134, season: 2026, round: 11, matchDate: '2026-11-28 02:30', homeTeamId: 15, awayTeamId: 4, homeScore: null, awayScore: null, status: 'TIMED' },

  // [12월] 예정 경기 (14R~19R)
  { matchId: 135, season: 2026, round: 14, matchDate: '2026-12-05 05:15', homeTeamId: 2, awayTeamId: 15, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 136, season: 2026, round: 15, matchDate: '2026-12-08 21:30', homeTeamId: 9, awayTeamId: 13, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 137, season: 2026, round: 16, matchDate: '2026-12-15 02:30', homeTeamId: 14, awayTeamId: 15, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 138, season: 2026, round: 17, matchDate: '2026-12-22 02:30', homeTeamId: 19, awayTeamId: 13, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 139, season: 2026, round: 18, matchDate: '2026-12-26 23:00', homeTeamId: 6, awayTeamId: 10, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 140, season: 2026, round: 19, matchDate: '2026-12-30 05:00', homeTeamId: 15, awayTeamId: 16, homeScore: null, awayScore: null, status: 'TIMED' },

  // [1월] 예정 경기 (20R~22R)
  { matchId: 141, season: 2026, round: 20, matchDate: '2027-01-04 21:30', homeTeamId: 19, awayTeamId: 16, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 142, season: 2026, round: 21, matchDate: '2027-01-15 05:00', homeTeamId: 2, awayTeamId: 19, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 143, season: 2026, round: 22, matchDate: '2027-01-25 23:00', homeTeamId: 14, awayTeamId: 6, homeScore: null, awayScore: null, status: 'TIMED' },

  // [2월] 예정 경기 (23R~26R)
  { matchId: 144, season: 2026, round: 23, matchDate: '2027-02-01 22:00', homeTeamId: 13, awayTeamId: 2, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 145, season: 2026, round: 24, matchDate: '2027-02-15 02:30', homeTeamId: 15, awayTeamId: 19, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 146, season: 2026, round: 25, matchDate: '2027-02-22 01:30', homeTeamId: 14, awayTeamId: 13, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 147, season: 2026, round: 26, matchDate: '2027-02-28 23:00', homeTeamId: 18, awayTeamId: 2, homeScore: null, awayScore: null, status: 'TIMED' },

  // [3월] 예정 경기 (27R~29R)
  { matchId: 148, season: 2026, round: 27, matchDate: '2027-03-08 02:30', homeTeamId: 19, awayTeamId: 14, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 149, season: 2026, round: 28, matchDate: '2027-03-15 00:00', homeTeamId: 6, awayTeamId: 2, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 150, season: 2026, round: 29, matchDate: '2027-03-29 23:00', homeTeamId: 2, awayTeamId: 6, homeScore: null, awayScore: null, status: 'TIMED' },

  // [4월] 예정 경기 (30R~34R)
  { matchId: 151, season: 2026, round: 30, matchDate: '2027-04-05 02:30', homeTeamId: 13, awayTeamId: 15, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 152, season: 2026, round: 31, matchDate: '2027-04-12 01:30', homeTeamId: 14, awayTeamId: 3, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 153, season: 2026, round: 32, matchDate: '2027-04-19 23:00', homeTeamId: 15, awayTeamId: 2, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 154, season: 2026, round: 33, matchDate: '2027-04-26 00:30', homeTeamId: 19, awayTeamId: 13, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 155, season: 2026, round: 34, matchDate: '2027-04-29 03:00', homeTeamId: 6, awayTeamId: 14, homeScore: null, awayScore: null, status: 'TIMED' },

  // [5월] 예정 경기 (35R~38R 최종전)
  { matchId: 156, season: 2026, round: 35, matchDate: '2027-05-03 01:30', homeTeamId: 2, awayTeamId: 14, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 157, season: 2026, round: 36, matchDate: '2027-05-10 01:30', homeTeamId: 13, awayTeamId: 19, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 158, season: 2026, round: 37, matchDate: '2027-05-17 00:00', homeTeamId: 14, awayTeamId: 2, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 159, season: 2026, round: 38, matchDate: '2027-05-24 00:00', homeTeamId: 2, awayTeamId: 18, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 160, season: 2026, round: 38, matchDate: '2027-05-24 00:00', homeTeamId: 14, awayTeamId: 4, homeScore: null, awayScore: null, status: 'TIMED' },
  { matchId: 161, season: 2026, round: 38, matchDate: '2027-05-24 00:00', homeTeamId: 13, awayTeamId: 5, homeScore: null, awayScore: null, status: 'TIMED' },
]

export default function Match() {
  // 필터 모드: 'MONTH' (월별) 또는 'ROUND' (라운드별)
  const [ filterMode, setFilterMode ] = useState('MONTH')

  // 월별 필터 상태 (기본값: 전체)
  const [ selectedMonth, setSelectedMonth ] = useState('ALL')

  // 라운드별 필터 상태 (기본값: 전체)
  const [ selectedRound, setSelectedRound ] = useState('ALL')

  // 구단 선택 필터 (기본값: 전체 구단)
  const [ selectedTeamId, setSelectedTeamId ] = useState('ALL')

  const [ rawMatches, setRawMatches ] = useState(SAMPLE_MATCHES)
  const [ teamRanks, setTeamRanks ] = useState(new Map())
  const [ dataSource, setDataSource ] = useState('database') // 'database' | 'sample'
  const [ dbError, setDbError ] = useState('')
  const [ loading, setLoading ] = useState(false)
  const [ reload, setReload ] = useState(0)
  const [ syncing, setSyncing ] = useState(false)

  const handleSyncMatches = async () => {
    if (syncing) return
    if (!window.confirm('외부 축구 API에서 2026 시즌 전체 380경기 일정을 DB(MATCHES)로 동기화하시겠습니까?')) return
    try {
      setSyncing(true)
      const res = await fetch('/api/matches/sync-season?season=2026')
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

    // Fallback 순위 등록
    Object.entries(DEFAULT_RANKS).forEach(([ id, rank ]) => {
      rankMap.set(Number(id), Number(rank))
    })

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)

    fetch('/api/teams/standings?season=2026', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((standings) => {
        clearTimeout(timeoutId)
        if (!active || !Array.isArray(standings) || standings.length === 0) return
        standings.forEach((s) => {
          if (s.teamId && s.currentRank) {
            rankMap.set(Number(s.teamId), Number(s.currentRank))
          }
        })
        if (active) setTeamRanks(new Map(rankMap))
      })
      .catch(() => {
        clearTimeout(timeoutId)
        if (active) setTeamRanks(new Map(rankMap))
      })

    return () => {
      active = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [ reload ])

  // 2. DB MATCHES 테이블 데이터 로드 (경기종료, LIVE, 경기예정 전체 통합 로드)
  useEffect(() => {
    let active = true
    setLoading(true)
    setDbError('')

    const apiUrl = '/api/matches?season=2026'
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

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
        if (Array.isArray(data) && data.length > 0) {
          setRawMatches(data)
          setDataSource('database')
          setDbError('')
        } else {
          // DB에 아직 2026 데이터가 비어있을 때는 샘플 데이터 유지
          setRawMatches(SAMPLE_MATCHES)
          setDataSource('sample')
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId)
        if (!active) return
        console.warn('[Match] 백엔드(/api/matches) 연결 지연 또는 실패:', err.message)
        // DB 연결 실패 시 무한 로딩에 빠지지 않고 샘플 데이터로 즉시 화면 렌더링
        setRawMatches(SAMPLE_MATCHES)
        setDataSource('sample')
        setDbError('오라클 DB 연결 실패 (' + (err.name === 'AbortError' ? '연결 지연' : err.message) + ')')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [ reload ])

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

    // 전체 경기 시간순(오름차순) 정렬: 과거 경기(종료) -> 현재(LIVE) -> 미래(예정) 순서로 자연스럽게 배치
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
    let result = matches

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
  }, [ matches, selectedTeamId, filterMode, selectedMonth, selectedRound ])

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
        title={`현재 프리미어리그 ${rank}위`}
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
        {/* 헤더 (한글화 및 통합) */}
        <header className="match-page-header">
          <span className="match-page-eyebrow">
            잉글랜드 프리미어리그 경기 일정 & 결과
          </span>
          <h1 className="match-page-title">
            프리미어리그 경기 일정 & 결과
          </h1>
          <p className="match-page-desc">
            종료된 경기의 스코어부터 LIVE 경기, 다가오는 예정 일정까지 월별 및 라운드별로 한눈에 확인하세요.
          </p>
        </header>

        {/* DB 연결 상태 안내 배너 (연결 지연 시 안내 및 동기화 버튼) */}
        {dbError && (
          <div style={{
            background: '#fffbeb',
            border: '1px solid #fef08a',
            color: '#854d0e',
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
                color: '#854d0e',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              title="알림 닫기"
            >
              ✕
            </button>
            <strong>⚠️ {dbError}</strong><br />
            <span style={{ fontSize: '13px', color: '#a16207' }}>
              백엔드 DB 응답이 지연되어 현재 <strong>[샘플 데이터 모드]</strong>로 즉시 렌더링되었습니다.
              모든 월별/라운드별 필터 및 배지를 정상 체험하실 수 있습니다.
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
              <option value="ALL">전체 구단 ({dbTeams.length})</option>
              {dbTeams.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamNameKor} ({team.teamName})
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
            총 <strong>{filteredMatches.length}</strong>개의 경기
            {filterMode === 'MONTH' && selectedMonth !== 'ALL' && (
              <span> ({MONTH_TABS.find((t) => t.id === selectedMonth)?.label})</span>
            )}
            {filterMode === 'ROUND' && selectedRound !== 'ALL' && (
              <span> ({selectedRound} 라운드)</span>
            )}
            {selectedTeam && (
              <span style={{ color: '#38003c', fontWeight: 800 }}>
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
              경기 일정을 불러오는 중입니다...
            </p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="match-empty">
            <div className="match-empty__icon">⚽</div>
            <p className="match-empty__text">
              {selectedTeam
                ? `${selectedTeam.teamNameKor}의 해당 조건 경기가 없습니다.`
                : filterMode === 'MONTH'
                  ? '선택하신 월에는 등록된 경기가 없습니다.'
                  : `${selectedRound} 라운드에는 등록된 경기가 없습니다.`}
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
            {filteredMatches.map((match) => {
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

              return (
                <article
                  key={match.matchId}
                  className={`match-card ${
                    isFinished
                      ? 'match-card--result'
                      : isLive
                        ? 'match-card--live'
                        : 'match-card--scheduled'
                  }`}
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
                          {awayTeam.teamNameKor}
                          {isAwayWinner && <span className="match-win-badge">승</span>}
                        </span>
                        <span className="match-team__name-eng">({awayTeam.teamName})</span>
                      </div>
                    </div>
                  </div>

                  {/* 홈 경기장 안내 (TEAMS.HOME_GROUND_KOR 우선 반영) */}
                  <div className="match-card__ground">
                    <span className="match-ground-pill">
                      📍 {match.displayHomeGround || match.homeGroundKor || homeTeam.homeGroundKor || getStadiumNameKor(match.homeGround || homeTeam.homeGround, match.homeTeamId)}
                    </span>
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
