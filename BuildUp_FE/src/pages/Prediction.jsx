import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '../utils/navigation.js';
import '../css/Prediction.css';

export default function Prediction() {
  const currentTheme = useSelector((state) => state.theme?.mode || 'dark');
  const isLight = currentTheme === 'light';
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
  const authUser = useSelector((state) => state.auth?.user);
  const isAdmin =
    authUser?.role === 'ADMIN' ||
    authUser?.userRole === 'ADMIN' ||
    authUser?.authority === 'ROLE_ADMIN';
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'my'
  const [allMatches, setAllMatches] = useState([]);
  const [matches, setMatches] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5); // 기본 5개 노출 후 더보기
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(10); // 내 예측 내역 노출 개수
  const [oddsData, setOddsData] = useState({});
  const [myVotes, setMyVotes] = useState({});
  const [rankings, setRankings] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingMatchId, setVotingMatchId] = useState(null);

  // 커스텀 모달 상태 (예측 변경/참여 완료, 임시 경기 포인트 변동 제한 해결, 일반 안내 등)
  const [predictionModal, setPredictionModal] = useState(null);
  const [resolvingDummyLock, setResolvingDummyLock] = useState(false);

  // 날짜 유틸리티: 주간(월요일 ~ 일요일, 총 7일) 표시 및 이전/이후 7일(1주) 단위 이동
  const DAY_MS = 24 * 60 * 60 * 1000;

  const getStartOfDayMs = (dateLike) => {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return Date.now();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // 해당 날짜가 속한 주의 월요일 00:00:00.000 반환 (월~일 7일 기준)
  const getMondayOfWeekMs = (dateLike) => {
    const d = new Date(dateLike);
    if (Number.isNaN(d.getTime())) return getStartOfDayMs(Date.now());
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0(일) ~ 6(토)
    const diffToMonday = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diffToMonday);
    return d.getTime();
  };

  const parseItemTime = (dateStr, fallbackStr) => {
    const raw = dateStr || fallbackStr;
    if (!raw) return null;
    const normalized = String(raw).replace(' ', 'T');
    const t = new Date(normalized).getTime();
    return Number.isNaN(t) ? null : t;
  };

  // 월요일 00:00:00.000 ~ 일요일 23:59:59.999 (총 7일) 구간 반환
  const getWindowBounds = (centerMs) => {
    const start = getMondayOfWeekMs(centerMs);
    const end = start + 7 * DAY_MS - 1;
    return { start, end };
  };

  const formatShortDate = (ms) => {
    const d = new Date(ms);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd}`;
  };

  // 월요일 ~ 일요일 날짜 범위 표시
  const formatRangeText = (centerMs) => {
    const { start, end } = getWindowBounds(centerMs);
    return `${formatShortDate(start)} ~ ${formatShortDate(end)}`;
  };

  const isDummyMatchId = (matchId) => {
    const id = Number(matchId);
    return id >= 999901 && id <= 999910;
  };

  // 현재 임시(더미) 경기가 존재하는지 여부
  const hasDummyMatches = allMatches.some((m) => isDummyMatchId(m.matchId));

  // 경기 승부예측 및 내 예측 내역의 주간(월~일) 기준일 상태
  const [matchCenterMs, setMatchCenterMs] = useState(() => getMondayOfWeekMs(Date.now()));
  const [showAllMatchesPeriod, setShowAllMatchesPeriod] = useState(false);
  const [historyCenterMs, setHistoryCenterMs] = useState(() => getMondayOfWeekMs(Date.now()));
  const [showAllHistory, setShowAllHistory] = useState(false);

  const getChoiceLabel = (choice) => {
    if (choice === 'HOME') return '홈팀 승';
    if (choice === 'DRAW') return '무승부';
    if (choice === 'AWAY') return '원정팀 승';
    return choice || '-';
  };

  // 경기 종료 시 실제 승리 결과 판별 ('HOME' | 'DRAW' | 'AWAY' | null)
  const getActualWinner = (matchObj) => {
    if (!matchObj) return null;
    const status = matchObj.status || matchObj.matchStatus;
    const isFin = status === 'FINISHED';
    const hs = matchObj.homeScore;
    const as = matchObj.awayScore;
    if (!isFin || hs === null || hs === undefined || as === null || as === undefined) {
      return null;
    }
    const homeNum = Number(hs);
    const awayNum = Number(as);
    if (Number.isNaN(homeNum) || Number.isNaN(awayNum)) return null;
    if (homeNum > awayNum) return 'HOME';
    if (homeNum < awayNum) return 'AWAY';
    return 'DRAW';
  };

  // 투표 버튼 상태별 클래스 계산 (맞춘 경우 색상 유지 / 틀린 경우 disabled 느낌 / 승리팀 구분)
  const getVoteButtonClass = (choice, myChoice, isFinished, actualWinner, isMyHit, isMyMiss) => {
    const classes = ['prediction-vote-btn'];
    const isSelected = myChoice === choice;
    const isWinnerChoice = isFinished && actualWinner === choice;

    if (isSelected) {
      classes.push('is-selected');
      if (isFinished) {
        if (isMyHit) {
          classes.push('is-correct-hit');
        } else if (isMyMiss) {
          classes.push('is-wrong-hit');
        }
      }
    }

    if (isWinnerChoice) {
      classes.push('is-actual-winner');
    } else if (isFinished && !isSelected) {
      classes.push('is-finished-dim');
    }

    return classes.join(' ');
  };

  // 모바일 (<= 425px) 1경기씩 카드 넘기기 슬라이더 상태
  const [mobileMatchIndex, setMobileMatchIndex] = useState(0);
  const touchStartXRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartXRef.current - touchEndX;
    if (Math.abs(diffX) > 40) {
      if (diffX > 0) {
        // 오른쪽 -> 왼쪽: 다음 경기
        setMobileMatchIndex((prev) => Math.min(matches.length - 1, prev + 1));
      } else {
        // 왼쪽 -> 오른쪽: 이전 경기
        setMobileMatchIndex((prev) => Math.max(0, prev - 1));
      }
    }
    touchStartXRef.current = null;
  };

  // 사이드바 구글 애드센스 Ref 및 푸시 처리
  const sideAdRef = useRef(null);
  const isSideAdPushed = useRef(false);

  useEffect(() => {
    if (isSideAdPushed.current) return;
    try {
      if (typeof window !== 'undefined' && sideAdRef.current) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({});
        isSideAdPushed.current = true;
      }
    } catch (e) {
      console.debug('[Prediction] AdSense init:', e);
    }
  }, []);

  // 인증 헤더 헬퍼
  const getAuthHeaders = () => {
    const token = localStorage.getItem('buildup_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // 특정 경기들의 배당률/투표율 비동기 로드
  const ensureOddsLoaded = (targetMatches) => {
    if (!Array.isArray(targetMatches)) return;
    targetMatches.slice(0, 30).forEach(async (m) => {
      if (!m || !m.matchId) return;
      try {
        const oddsRes = await fetch(`/api/predictions/matches/${m.matchId}/odds`);
        if (oddsRes.ok) {
          const odds = await oddsRes.json();
          setOddsData((prev) => ({ ...prev, [m.matchId]: odds }));
        }
      } catch {
        // 개별 배당률 조회 실패 시 기본값 유지
      }
    });
  };

  // 전체 경기 목록에서 최근 경기 주간(월~일) 계산 (이번 주 월~일 내 경기가 있으면 이번 주, 없으면 가장 가까운 주간)
  const computeDefaultMatchCenterMs = (matchList) => {
    const nowMs = Date.now();
    const todayBase = getStartOfDayMs(nowMs);
    const thisWeekMonday = getMondayOfWeekMs(nowMs);
    if (!Array.isArray(matchList) || matchList.length === 0) return thisWeekMonday;

    const { start, end } = getWindowBounds(thisWeekMonday);
    const hasInThisWeek = matchList.some((m) => {
      if (isDummyMatchId(m.matchId)) return true;
      const t = parseItemTime(m.matchDate);
      return t !== null && t >= start && t <= end;
    });
    if (hasInThisWeek) return thisWeekMonday;

    // 오늘 이후 가장 가까운 예정 경기 탐색 (오름차순)
    const upcoming = matchList
      .map((m) => parseItemTime(m.matchDate))
      .filter((t) => t !== null && t >= todayBase)
      .sort((a, b) => a - b);
    if (upcoming.length > 0) {
      return getMondayOfWeekMs(upcoming[0]);
    }

    // 예정 경기가 없으면 가장 최근 경기일이 속한 주간(월~일)
    const validTimes = matchList
      .map((m) => parseItemTime(m.matchDate))
      .filter((t) => t !== null)
      .sort((a, b) => b - a);
    return validTimes.length > 0 ? getMondayOfWeekMs(validTimes[0]) : thisWeekMonday;
  };

  // 내 예측 내역에서 최근 경기 주간(월~일) 계산
  const computeDefaultHistoryCenterMs = (historyList) => {
    const nowMs = Date.now();
    const todayBase = getStartOfDayMs(nowMs);
    const thisWeekMonday = getMondayOfWeekMs(nowMs);
    if (!Array.isArray(historyList) || historyList.length === 0) return thisWeekMonday;

    const { start, end } = getWindowBounds(thisWeekMonday);
    const hasInThisWeek = historyList.some((item) => {
      if (isDummyMatchId(item.matchId)) return true;
      const t = parseItemTime(item.matchDate, item.createdAt);
      return t !== null && t >= start && t <= end;
    });
    if (hasInThisWeek) return thisWeekMonday;

    // 오늘 이후 예정된 내역이 있으면 가장 가까운 내역의 주간, 없으면 가장 최근 내역의 주간
    const upcoming = historyList
      .map((item) => parseItemTime(item.matchDate, item.createdAt))
      .filter((t) => t !== null && t >= todayBase)
      .sort((a, b) => a - b);
    if (upcoming.length > 0) {
      return getMondayOfWeekMs(upcoming[0]);
    }

    const latest = historyList
      .map((item) => parseItemTime(item.matchDate, item.createdAt))
      .filter((t) => t !== null)
      .sort((a, b) => b - a);
    return latest.length > 0 ? getMondayOfWeekMs(latest[0]) : thisWeekMonday;
  };

  // 내 예측 내역 비동기 조회 (오름차순 정렬 기반)
  const fetchMyPredictions = async (shouldInitCenter = false) => {
    try {
      const headers = getAuthHeaders();
      const myRes = await fetch('/api/predictions/my', {
        headers,
        credentials: 'include',
      });
      if (myRes.ok) {
        const myJson = await myRes.json();
        if (myJson.items) {
          // 오름차순(ASC) 정렬: 더미 경기 우선 -> 경기 일시 오름차순 -> matchId 오름차순
          const sortedItems = [...myJson.items].sort((a, b) => {
            const dummyA = isDummyMatchId(a.matchId) ? 0 : 1;
            const dummyB = isDummyMatchId(b.matchId) ? 0 : 1;
            if (dummyA !== dummyB) return dummyA - dummyB;

            const dateA = parseItemTime(a.matchDate, a.createdAt) || 0;
            const dateB = parseItemTime(b.matchDate, b.createdAt) || 0;
            if (dateA !== dateB) return dateA - dateB;

            return Number(a.matchId || 0) - Number(b.matchId || 0);
          });
          setMyHistory(sortedItems);
          if (shouldInitCenter && sortedItems.length > 0) {
            setHistoryCenterMs(computeDefaultHistoryCenterMs(sortedItems));
          }
          const voteMap = {};
          sortedItems.forEach((item) => {
            voteMap[item.matchId] = item;
          });
          setMyVotes(voteMap);
        }
      }
    } catch (e) {
      console.error('[Prediction] 내 내역 로드 실패:', e);
    }
  };

  // 전체 경기 목록 재조회 헬퍼
  const reloadAllMatches = async () => {
    try {
      const matchRes = await fetch('/api/matches');
      if (matchRes.ok) {
        const matchList = await matchRes.json();
        if (Array.isArray(matchList)) {
          setAllMatches(matchList);
          setMatchCenterMs(computeDefaultMatchCenterMs(matchList));
          return matchList;
        }
      }
    } catch (e) {
      console.error('[Prediction] 경기 목록 재조회 실패:', e);
    }
    return allMatches;
  };

  // 1. 경기 목록 및 랭킹 데이터 초기 로드
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);

        // (1) 전체 경기 목록 조회
        const matchRes = await fetch('/api/matches');
        if (matchRes.ok) {
          const matchList = await matchRes.json();
          if (isMounted && Array.isArray(matchList)) {
            setAllMatches(matchList);
            setMatchCenterMs(computeDefaultMatchCenterMs(matchList));
          }
        }

        // (2) 랭킹 조회
        const rankRes = await fetch('/api/predictions/rankings');
        if (rankRes.ok) {
          const rankJson = await rankRes.json();
          if (isMounted && rankJson.rankings) {
            setRankings(rankJson.rankings);
          }
        }

        // (3) 로그인한 경우 내 예측 내역 조회
        if (isLoggedIn || localStorage.getItem('buildup_token')) {
          await fetchMyPredictions(true);
        }
      } catch (err) {
        console.error('[Prediction] 데이터 로드 실패:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // 경기 승부예측 탭: 주간(월~일, 7일) 필터링 + 오름차순(ASC) 정렬 반영
  useEffect(() => {
    if (!Array.isArray(allMatches) || allMatches.length === 0) {
      setMatches([]);
      return;
    }

    let filtered;
    if (showAllMatchesPeriod) {
      filtered = [...allMatches];
    } else {
      const { start, end } = getWindowBounds(matchCenterMs);
      const thisWeekMonday = getMondayOfWeekMs(Date.now());
      const isCurrentWeek = start === thisWeekMonday;

      filtered = allMatches.filter((m) => {
        if (isDummyMatchId(m.matchId) && isCurrentWeek) return true;
        const t = parseItemTime(m.matchDate);
        if (t === null) return false;
        return t >= start && t <= end;
      });
    }

    // 오름차순(ASC) 정렬 (더미 경기 최우선 -> 경기일시 오름차순 -> matchId 오름차순)
    filtered.sort((a, b) => {
      const dummyA = isDummyMatchId(a.matchId) ? 0 : 1;
      const dummyB = isDummyMatchId(b.matchId) ? 0 : 1;
      if (dummyA !== dummyB) return dummyA - dummyB;

      const tA = parseItemTime(a.matchDate) || 0;
      const tB = parseItemTime(b.matchDate) || 0;
      if (tA !== tB) return tA - tB;

      return Number(a.matchId || 0) - Number(b.matchId || 0);
    });

    setMatches(filtered);
    setMobileMatchIndex(0);
    setVisibleCount(5);
    ensureOddsLoaded(filtered);
  }, [allMatches, matchCenterMs, showAllMatchesPeriod]);

  // 경기 승부예측 날짜 구간 7일(월~일 1주) 단위 이동
  const shiftMatchWindow = (direction) => {
    setShowAllMatchesPeriod(false);
    setMatchCenterMs((prev) => getMondayOfWeekMs(prev) + direction * 7 * DAY_MS);
  };

  const resetMatchWindow = () => {
    setShowAllMatchesPeriod(false);
    setMatchCenterMs(computeDefaultMatchCenterMs(allMatches));
  };

  // 내 예측 내역 날짜 구간 7일(월~일 1주) 단위 이동
  const shiftHistoryWindow = (direction) => {
    setShowAllHistory(false);
    setVisibleHistoryCount(10);
    setHistoryCenterMs((prev) => getMondayOfWeekMs(prev) + direction * 7 * DAY_MS);
  };

  const resetHistoryWindow = () => {
    setShowAllHistory(false);
    setVisibleHistoryCount(10);
    setHistoryCenterMs(computeDefaultHistoryCenterMs(myHistory));
  };

  // 내 예측 내역 주간(월~일, 7일) 필터링 + 오름차순(ASC) 정렬 목록
  const filteredHistory = (
    showAllHistory
      ? [...myHistory]
      : myHistory.filter((item) => {
          const { start, end } = getWindowBounds(historyCenterMs);
          const thisWeekMonday = getMondayOfWeekMs(Date.now());
          const isCurrentWeek = start === thisWeekMonday;
          if (isDummyMatchId(item.matchId) && isCurrentWeek) return true;
          const t = parseItemTime(item.matchDate, item.createdAt);
          if (t === null) return true;
          return t >= start && t <= end;
        })
  ).sort((a, b) => {
    const dummyA = isDummyMatchId(a.matchId) ? 0 : 1;
    const dummyB = isDummyMatchId(b.matchId) ? 0 : 1;
    if (dummyA !== dummyB) return dummyA - dummyB;

    const tA = parseItemTime(a.matchDate, a.createdAt) || 0;
    const tB = parseItemTime(b.matchDate, b.createdAt) || 0;
    if (tA !== tB) return tA - tB;

    return Number(a.matchId || 0) - Number(b.matchId || 0);
  });

  // 모달에서 임시 경기 일괄 삭제 후 즉시 원래하려던 투표 실행 (해결 액션)
  const handleResolveDummyAndVote = async (pendingMatchId, pendingPredictResult) => {
    try {
      setResolvingDummyLock(true);
      const delRes = await fetch('/api/admin/dummy-matches', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const delJson = await delRes.json().catch(() => ({}));
      if (!delRes.ok || delJson.status === 'ERROR') {
        setPredictionModal({
          type: 'error',
          badge: '권한 또는 요청 안내',
          title: '임시 경기 일괄 삭제 실패',
          message:
            delJson.message ||
            '관리자 권한이 있는 계정에서만 임시 경기를 일괄 삭제할 수 있습니다. 임시 경기로 이동하여 테스트를 진행해주세요.',
        });
        return;
      }

      // 경기 목록 및 내 예측 내역 갱신
      const updatedMatches = await reloadAllMatches();
      await fetchMyPredictions(false);
      setPredictionModal(null);

      // 원래 투표하려던 일반 경기가 있으면 즉시 투표 실행
      if (pendingMatchId && pendingPredictResult) {
        await executeVoteRequest(pendingMatchId, pendingPredictResult, updatedMatches);
      }
    } catch {
      setPredictionModal({
        type: 'error',
        badge: '네트워크 오류',
        title: '임시 경기 정리 중 오류가 발생했습니다',
        message: '잠시 후 다시 시도해주세요.',
      });
    } finally {
      setResolvingDummyLock(false);
    }
  };

  // 실제 서버 투표/변경 API 호출 및 커스텀 모달 표시
  const executeVoteRequest = async (matchId, predictResult, matchListOverride = null) => {
    const sourceMatches = matchListOverride || allMatches;
    const targetMatch = sourceMatches.find((m) => Number(m.matchId) === Number(matchId));
    const odds = oddsData[matchId] || {};
    const prevVote = myVotes[matchId] || null;
    const isChange = Boolean(prevVote && prevVote.predictResult && prevVote.predictResult !== predictResult);

    const homeName =
      odds.homeTeamNameKor ||
      targetMatch?.homeTeamNameKor ||
      odds.homeTeamName ||
      targetMatch?.homeTeamName ||
      '홈팀';
    const awayName =
      odds.awayTeamNameKor ||
      targetMatch?.awayTeamNameKor ||
      odds.awayTeamName ||
      targetMatch?.awayTeamName ||
      '원정팀';
    const homeEmblem =
      odds.homeEmblemUrl || targetMatch?.homeEmblemUrl || 'https://crests.football-data.org/57.png';
    const awayEmblem =
      odds.awayEmblemUrl || targetMatch?.awayEmblemUrl || 'https://crests.football-data.org/65.png';

    const rewardPoint =
      predictResult === 'HOME'
        ? odds.homePoint || 100
        : predictResult === 'DRAW'
        ? odds.drawPoint || 150
        : odds.awayPoint || 100;
    const isUnderdogPick =
      (predictResult === 'HOME' && odds.homeUnderdog) ||
      (predictResult === 'AWAY' && odds.awayUnderdog);

    try {
      setVotingMatchId(matchId);
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ matchId, predictResult }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok && json.status === 'SUCCESS') {
        // 내 예측 내역 및 투표 상태 즉시 동기화
        await fetchMyPredictions(false);

        // 배당률/투표율 재조회
        const oddsRes = await fetch(`/api/predictions/matches/${matchId}/odds`);
        if (oddsRes.ok) {
          const updatedOdds = await oddsRes.json();
          setOddsData((prev) => ({ ...prev, [matchId]: updatedOdds }));
        }

        // 예측 변경 / 신규 참여 완료 커스텀 모달 오픈
        setPredictionModal({
          type: isChange ? 'vote-change' : 'vote-new',
          badge: isChange ? 'PREDICTION UPDATED' : 'PREDICTION SUBMITTED',
          title: isChange ? '승부예측이 변경되었습니다!' : '승부예측 참여가 완료되었습니다!',
          message: json.message,
          homeName,
          awayName,
          homeEmblem,
          awayEmblem,
          prevChoiceLabel: isChange ? getChoiceLabel(prevVote.predictResult) : null,
          newChoiceLabel: getChoiceLabel(predictResult),
          rewardPoint,
          isUnderdogPick,
          isDummy: isDummyMatchId(matchId),
        });
      } else {
        const errMsg = json.message || '투표 처리에 실패했습니다.';
        // 백엔드에서 임시 경기 존재로 인해 포인트 변동을 차단한 경우 해결 모달 표시
        if (errMsg.includes('임시 경기') || errMsg.includes('포인트 변동')) {
          setPredictionModal({
            type: 'dummy-lock',
            badge: 'POINT SAFETY LOCK',
            title: '임시 경기 진행 중 포인트 변동 제한',
            message: errMsg,
            homeName,
            awayName,
            pendingMatchId: matchId,
            pendingPredictResult: predictResult,
          });
        } else {
          setPredictionModal({
            type: 'error',
            badge: 'NOTICE',
            title: '예측 처리 안내',
            message: errMsg,
          });
        }
      }
    } catch {
      setPredictionModal({
        type: 'error',
        badge: 'NETWORK ERROR',
        title: '네트워크 오류가 발생했습니다',
        message: '서버와 통신하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setVotingMatchId(null);
    }
  };

  // 2. 투표 참여 및 예측 변경 처리
  const handleVote = async (matchId, predictResult) => {
    if (!isLoggedIn && !localStorage.getItem('buildup_token')) {
      setPredictionModal({
        type: 'login',
        badge: 'LOGIN REQUIRED',
        title: '로그인이 필요한 서비스입니다',
        message: '승부예측 투표 및 포인트 적립은 로그인 후 참여하실 수 있습니다.',
      });
      return;
    }

    // 동일한 선택지로 재클릭 시 커스텀 모달로 안내
    if (myVotes[matchId] && myVotes[matchId].predictResult === predictResult) {
      setPredictionModal({
        type: 'info',
        badge: 'ALREADY SELECTED',
        title: '이미 선택한 예측 결과입니다',
        message: `현재 [${getChoiceLabel(predictResult)}] 항목으로 예측에 참여 중입니다. 다른 결과 버튼을 클릭하면 예측을 변경하실 수 있습니다.`,
      });
      return;
    }

    // 임시 경기가 존재하는 동안 일반 경기 승부예측 참여/변경 시도 시 모달창으로 차단 및 즉시 해결 지원
    if (hasDummyMatches && !isDummyMatchId(matchId)) {
      const targetMatch = allMatches.find((m) => Number(m.matchId) === Number(matchId));
      const odds = oddsData[matchId] || {};
      const homeName =
        odds.homeTeamNameKor ||
        targetMatch?.homeTeamNameKor ||
        odds.homeTeamName ||
        targetMatch?.homeTeamName ||
        '홈팀';
      const awayName =
        odds.awayTeamNameKor ||
        targetMatch?.awayTeamNameKor ||
        odds.awayTeamName ||
        targetMatch?.awayTeamName ||
        '원정팀';

      setPredictionModal({
        type: 'dummy-lock',
        badge: 'POINT SAFETY LOCK',
        title: '임시 경기 진행 중 포인트 변동 제한 안내',
        message:
          '현재 테스트용 임시 경기가 진행 중입니다. 포인트 정산 오류를 방지하기 위해 임시 경기 승부예측 이외의 일반 경기 예측 및 포인트 변동이 일시 제한됩니다.',
        homeName,
        awayName,
        pendingMatchId: matchId,
        pendingPredictResult: predictResult,
      });
      return;
    }

    await executeVoteRequest(matchId, predictResult);
  };

  // 모바일 슬라이더용 현재 경기 계산값
  const currentMobileMatch = matches[mobileMatchIndex] || null;
  const mobileOdds = currentMobileMatch ? oddsData[currentMobileMatch.matchId] || {} : {};
  const mobileMyVote = currentMobileMatch ? myVotes[currentMobileMatch.matchId] : null;
  const mobileIsFinished = currentMobileMatch?.status === 'FINISHED';
  const mobileActualWinner = getActualWinner(currentMobileMatch);
  const mobileMyChoice = mobileMyVote?.predictResult || null;
  const mobileIsHit = Boolean(
    mobileIsFinished &&
      mobileMyVote &&
      (mobileMyVote.isSuccess === 'Y' || (mobileActualWinner && mobileMyChoice === mobileActualWinner))
  );
  const mobileIsMiss = Boolean(
    mobileIsFinished &&
      mobileMyVote &&
      !mobileIsHit &&
      (mobileMyVote.isSuccess === 'N' || (mobileActualWinner && mobileMyChoice !== mobileActualWinner))
  );

  return (
    <div className={`prediction-page-container ${isLight ? 'is-light' : ''}`}>
      {/* 배경 장식 EPL 사자 엠블럼 (다크모드: 우측 황금 사자 / 일반모드: 좌측 보라 사자) */}
      <div className="prediction-lion-bg" aria-hidden="true">
        <svg viewBox="0 0 84 106" className="prediction-lion-svg">
          <defs>
            {/* 우승팀 전용 챔피언 골드 그라데이션 */}
            <linearGradient id="eplChampionGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff3a8" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>
          <path d="M18.5,9.68a35.54,35.54,0,0,1,7.92,5.06C26.18,13.57,25.29,8,24.79,4.5l10.72,7.42c.82-2.52,3.65-10.74,3.65-10.74s5.11,8.27,6,9.62c1-1.11,7.19-7.92,8.76-9.63.27,3.9.63,9.51.71,10.34A34.67,34.67,0,0,1,61.2,4.78c-1.71,3.36-2.51,8-2.88,11.69A45.08,45.08,0,0,0,24,20.61C22.83,17.09,21,12.62,18.5,9.68Zm47,46.6V50.52a19.45,19.45,0,0,1-5.33-3C54.63,48.4,48,54,48,54l4.73,8.9C57,63.46,63.42,58,65.48,56.28ZM71,66.74a11,11,0,0,0-2.32-4.61l-4.31.1s-5.81,5-9.3,5.11c0,0,1.95,3.63,2.93,5.53,2-.42,5.39-2,6.77-3.57a20.49,20.49,0,0,1,.73,6.42C67.46,74.59,70.1,71.55,71,66.74ZM72.8,47.8a27.49,27.49,0,0,1-4,2.85v5.79A20.12,20.12,0,0,1,73,62.22c2.19-3.92,1.78-9.7-.23-14.43Zm.48-5.17L73.66,40a9.06,9.06,0,0,0-2.29-6.34c-2.51-2.83-8.84-7.37-11.86-8.46a10.57,10.57,0,0,1-1.36,4.31c-6-4.34-9-5.43-9-5.43C42.58,25,38.33,27.58,36,29.58l2,1.71a14.64,14.64,0,0,0-6.56,4.64c0,.06,3.56.56,3.56.56s-.37,4.14,4.83,6.74c4.43,2.23,10.82-.53,16.84,1.88A49,49,0,0,0,50,38.51a15.09,15.09,0,0,0-2.68-.32,13.94,13.94,0,0,1-5.7-.6,22,22,0,0,1-3.31-1.78,13.45,13.45,0,0,1,6.82-3.49,23.31,23.31,0,0,1,6.56,3.18,5.85,5.85,0,0,1,3.94-1.82s-2,1.86-1.39,4.13a76.19,76.19,0,0,1,6,6.28c3.2-1.76,10.15-1.35,11.58.3a40.57,40.57,0,0,0-6.44-6,20.25,20.25,0,0,0-2.82-4.23,12.18,12.18,0,0,1,4,2.33,5.11,5.11,0,0,1,2.91-1.89,4.72,4.72,0,0,1,1.63,3.3,4.5,4.5,0,0,1-1.27,1l3.39,3.67.4-2.61m3,4.77a41.28,41.28,0,0,1,2.83,32.37L75.46,72.6c-.71,11.14-4,19.78-13.56,27.09,0,0-.91-3.49-1.44-5.68-15.77,11.56-29.33,6.27-33.09,4.37,2.95-13.53.67-21.3-1.31-27.24C21.86,78,17.56,83.4,13.27,87c-2.94-6.86-3.17-19.59-.79-27.11-.78.21-5.42,1.68-8,2.45,1-6.9,5.59-16.15,10.41-20.75-.84-.15-3.31-.5-5.26-.83,1.2-2.45,4.69-7,10.06-11.27a8.54,8.54,0,0,0,4.36,8.32C21.9,34.05,21.64,29.38,23.9,27s6.05-1.61,8.47.3a8,8,0,0,0-2.86-3.84,41.23,41.23,0,0,1,24-3.5,31.64,31.64,0,0,1,3.63,4,15.31,15.31,0,0,0-.32-3.38A51.26,51.26,0,0,1,68.54,25c-7.24-7.24-21.9-9.39-34.12-5.88a47.26,47.26,0,0,0-8.16,3.18,6.61,6.61,0,0,0-5.43,3.11C13,30.59,7.25,37.45,4.49,43.18c.61.14,2.47.36,4.13.66C5.13,48.84.55,58.32.85,66.77c.79-.24,5.07-1.55,7.16-2.23C6.89,72,7.22,84.6,12.08,91.78a51.48,51.48,0,0,0,12.6-13c.76,3.7,1.5,10.26-1.1,21.15,2.07,1.64,17.44,9.68,34.79-.83l1.44,5.71,1.87-1.22A35.24,35.24,0,0,0,77.8,80c.48.53,2.41,2.63,3.1,3.34,2.59-7.23,7.89-24.63-4.24-38.57Z" />
        </svg>
      </div>

      <div className="prediction-page-wrapper">
        {/* 상단 헤더 */}
        <header className="prediction-header">
          <span className="prediction-header__eyebrow">PREMIER LEAGUE</span>
          <h1 className="prediction-header__title">승부예측</h1>
          <p className="prediction-header__desc">
            <span className="prediction-header__desc-main">
              내가 응원하는 애정팀을 선택하고<span className="prediction-desc-br"> </span>승부예측 랭킹 1위에 도전하세요!
            </span>
            <span className="prediction-header__chips">
              <span className="prediction-chip">승리 <strong>+100P</strong></span>
              <span className="prediction-chip-sep">|</span>
              <span className="prediction-chip">무승부 <strong>+150P</strong></span>
              <span className="prediction-chip-sep">|</span>
              <span className="prediction-chip prediction-chip--underdog">언더독 승리 <strong>+250P</strong></span>
            </span>
          </p>
        </header>

        {/* 탭 네비게이션 */}
        <nav className="prediction-tabs" aria-label="승부예측 탭">
          <button
            type="button"
            className={`prediction-tab-btn ${activeTab === 'matches' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            경기 승부예측
          </button>
          <button
            type="button"
            className={`prediction-tab-btn ${activeTab === 'my' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            내 예측 내역 {myHistory.length > 0 && `(${myHistory.length})`}
          </button>
        </nav>

        {/* 임시 경기 진행 중 안내 배너 */}
        {!loading && hasDummyMatches && (
          <div className="prediction-dummy-banner">
            <div className="prediction-dummy-banner__text">
              <span className="prediction-dummy-banner__dot" />
              <strong>🧪 임시 테스트 경기가 활성화되어 있습니다.</strong>
              <span>
                포인트 오류 방지를 위해 임시 경기 외 일반 경기의 포인트 변동이 일시 보호됩니다.
              </span>
            </div>
            <button
              type="button"
              className="prediction-dummy-banner__btn"
              onClick={() => {
                setActiveTab('matches');
                resetMatchWindow();
              }}
            >
              임시 경기 보기
            </button>
          </div>
        )}

        {/* 로딩 표시 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: isLight ? '#38003c' : '#00ff87' }}>
            <p>경기 및 랭킹 데이터를 불러오는 중입니다...</p>
          </div>
        )}

        {/* 본문 레이아웃 (경기/내역 1fr : 랭킹 340px) */}
        {!loading && (
          <div className="prediction-layout">
            {/* 좌측 콘텐츠 영역 */}
            <main className="prediction-main-content">
              {activeTab === 'matches' ? (
                <div className="prediction-matches-list">
                  {/* 기준일 ±3일 탐색 바 (이전/이후 클릭 시 6일 단위 이동) */}
                  <div className="prediction-period-nav">
                    <button
                      type="button"
                      className="prediction-period-btn"
                      onClick={() => shiftMatchWindow(-1)}
                    >
                      ◀ 이전 경기
                    </button>
                    <div className="prediction-period-center">
                      <span className="prediction-period-range">
                        {showAllMatchesPeriod
                          ? `전체 경기 (${matches.length}경기)`
                          : formatRangeText(matchCenterMs)}
                      </span>
                      <div className="prediction-period-actions">
                        <button
                          type="button"
                          className={`prediction-period-chip ${!showAllMatchesPeriod ? 'is-active' : ''}`}
                          onClick={resetMatchWindow}
                        >
                          최근 경기
                        </button>
                        <button
                          type="button"
                          className={`prediction-period-chip ${showAllMatchesPeriod ? 'is-active' : ''}`}
                          onClick={() => setShowAllMatchesPeriod((prev) => !prev)}
                        >
                          {showAllMatchesPeriod ? '기간별 보기' : '전체 보기'}
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="prediction-period-btn"
                      onClick={() => shiftMatchWindow(1)}
                    >
                      이후 경기 ▶
                    </button>
                  </div>

                  {matches.length === 0 ? (
                    <div className="prediction-my-empty">
                      <p>해당 기간({formatRangeText(matchCenterMs)})에 예정되거나 진행된 경기가 없습니다.</p>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                        <button type="button" className="prediction-period-btn" onClick={() => shiftMatchWindow(-1)}>
                          ◀ 이전 경기 보기
                        </button>
                        <button type="button" className="prediction-period-btn" onClick={() => shiftMatchWindow(1)}>
                          이후 경기 보기 ▶
                        </button>
                        <button type="button" className="prediction-period-btn" onClick={() => setShowAllMatchesPeriod(true)}>
                          전체 경기 보기
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 1) 모바일 전용: 1경기씩 카드 넘기기 슬라이더 (<= 425px) */}
                      <div
                        className="prediction-mobile-slider"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                      >
                        <div className="prediction-slider-bar">
                          <button
                            type="button"
                            className="prediction-slider-btn is-prev"
                            onClick={() => setMobileMatchIndex((prev) => Math.max(0, prev - 1))}
                            disabled={mobileMatchIndex === 0}
                            aria-label="이전 경기"
                          >
                            ‹
                          </button>
                          <div className="prediction-slider-info">
                            <span className="prediction-slider-counter">
                              경기 {mobileMatchIndex + 1} / {matches.length}
                            </span>
                            <div className="prediction-slider-dots">
                              {matches.slice(0, Math.min(10, matches.length)).map((_, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className={`prediction-slider-dot ${idx === mobileMatchIndex ? 'is-active' : ''}`}
                                  onClick={() => setMobileMatchIndex(idx)}
                                  aria-label={`${idx + 1}번째 경기로 이동`}
                                />
                              ))}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="prediction-slider-btn is-next"
                            onClick={() => setMobileMatchIndex((prev) => Math.min(matches.length - 1, prev + 1))}
                            disabled={mobileMatchIndex >= matches.length - 1}
                            aria-label="다음 경기"
                          >
                            ›
                          </button>
                        </div>

                        {currentMobileMatch && (
                          <article
                            key={currentMobileMatch.matchId}
                            className={`prediction-card ${
                              mobileIsFinished
                                ? mobileIsHit
                                  ? 'is-card-hit'
                                  : mobileIsMiss
                                  ? 'is-card-miss'
                                  : 'is-card-finished'
                                : ''
                            }`}
                          >
                            <div className="prediction-card__header">
                              <span>
                                {currentMobileMatch.matchDate
                                  ? currentMobileMatch.matchDate.substring(0, 16).replace('T', ' ')
                                  : '일정 미정'}
                              </span>
                              <span
                                className={`prediction-card__badge ${
                                  mobileIsFinished
                                    ? mobileIsHit
                                      ? 'is-win'
                                      : mobileIsMiss
                                      ? 'is-lose'
                                      : 'is-finished'
                                    : ''
                                }`}
                              >
                                {mobileIsFinished
                                  ? mobileIsHit
                                    ? '🎯 적중 성공 · 경기 종료'
                                    : mobileIsMiss
                                    ? '미적중 · 경기 종료'
                                    : '경기 종료'
                                  : mobileMyVote
                                  ? '예측 완료 (변경 가능)'
                                  : '예측 진행중'}
                              </span>
                            </div>

                            {/* 팀 대진 */}
                            <div className="prediction-teams">
                              <div className="prediction-team is-home">
                                <img
                                  src={
                                    mobileOdds.homeEmblemUrl ||
                                    currentMobileMatch.homeEmblemUrl ||
                                    'https://crests.football-data.org/57.png'
                                  }
                                  alt={
                                    mobileOdds.homeTeamNameKor ||
                                    currentMobileMatch.homeTeamNameKor ||
                                    mobileOdds.homeTeamName ||
                                    '홈팀'
                                  }
                                  className="prediction-team__emblem"
                                  onError={(e) => {
                                    e.target.src = 'https://crests.football-data.org/57.png';
                                  }}
                                />
                                <div className="prediction-team__info">
                                  <span className="prediction-team__name">
                                    {mobileOdds.homeTeamNameKor ||
                                      currentMobileMatch.homeTeamNameKor ||
                                      mobileOdds.homeTeamName ||
                                      currentMobileMatch.homeTeamName ||
                                      `팀 ${currentMobileMatch.homeTeamId}`}
                                  </span>
                                  <span className="prediction-team__rank">
                                    {mobileOdds.homeRank ? `${mobileOdds.homeRank}위` : ''}{' '}
                                    {mobileOdds.homeUnderdog ? '🔥 언더독' : ''}
                                  </span>
                                </div>
                              </div>

                              <div style={{ textAlign: 'center' }}>
                                {mobileIsFinished ? (
                                  <div className="prediction-score">
                                    {currentMobileMatch.homeScore} : {currentMobileMatch.awayScore}
                                  </div>
                                ) : (
                                  <div className="prediction-vs">VS</div>
                                )}
                              </div>

                              <div className="prediction-team is-away">
                                <img
                                  src={
                                    mobileOdds.awayEmblemUrl ||
                                    currentMobileMatch.awayEmblemUrl ||
                                    'https://crests.football-data.org/65.png'
                                  }
                                  alt={
                                    mobileOdds.awayTeamNameKor ||
                                    currentMobileMatch.awayTeamNameKor ||
                                    mobileOdds.awayTeamName ||
                                    '원정팀'
                                  }
                                  className="prediction-team__emblem"
                                  onError={(e) => {
                                    e.target.src = 'https://crests.football-data.org/65.png';
                                  }}
                                />
                                <div className="prediction-team__info">
                                  <span className="prediction-team__name">
                                    {mobileOdds.awayTeamNameKor ||
                                      currentMobileMatch.awayTeamNameKor ||
                                      mobileOdds.awayTeamName ||
                                      currentMobileMatch.awayTeamName ||
                                      `팀 ${currentMobileMatch.awayTeamId}`}
                                  </span>
                                  <span className="prediction-team__rank">
                                    {mobileOdds.awayRank ? `${mobileOdds.awayRank}위` : ''}{' '}
                                    {mobileOdds.awayUnderdog ? '🔥 언더독' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* 투표 버튼 3개 (경기 종료 시 맞춘 경기는 색 유지, 틀린 경기는 disabled 느낌, 승리 쪽에 👑 왕관) */}
                            <div className="prediction-buttons">
                              <button
                                type="button"
                                className={getVoteButtonClass(
                                  'HOME',
                                  mobileMyChoice,
                                  mobileIsFinished,
                                  mobileActualWinner,
                                  mobileIsHit,
                                  mobileIsMiss
                                )}
                                onClick={() => handleVote(currentMobileMatch.matchId, 'HOME')}
                                disabled={mobileIsFinished || votingMatchId === currentMobileMatch.matchId}
                                title={
                                  mobileIsFinished
                                    ? '종료된 경기입니다'
                                    : mobileMyVote
                                    ? '클릭하여 예측을 변경할 수 있습니다'
                                    : '홈팀 승 투표'
                                }
                              >
                                <span className="prediction-vote-btn__label">
                                  {mobileIsFinished && mobileActualWinner === 'HOME' && (
                                    <span className="prediction-crown" role="img" aria-label="승리">
                                      👑{' '}
                                    </span>
                                  )}
                                  홈팀 승
                                </span>
                                <span
                                  className={`prediction-vote-btn__point ${
                                    mobileOdds.homeUnderdog ? 'is-underdog' : ''
                                  }`}
                                >
                                  +{mobileOdds.homePoint || 100}P {mobileOdds.homeUnderdog ? '🔥' : ''}
                                </span>
                              </button>

                              <button
                                type="button"
                                className={getVoteButtonClass(
                                  'DRAW',
                                  mobileMyChoice,
                                  mobileIsFinished,
                                  mobileActualWinner,
                                  mobileIsHit,
                                  mobileIsMiss
                                )}
                                onClick={() => handleVote(currentMobileMatch.matchId, 'DRAW')}
                                disabled={mobileIsFinished || votingMatchId === currentMobileMatch.matchId}
                                title={
                                  mobileIsFinished
                                    ? '종료된 경기입니다'
                                    : mobileMyVote
                                    ? '클릭하여 예측을 변경할 수 있습니다'
                                    : '무승부 투표'
                                }
                              >
                                <span className="prediction-vote-btn__label">
                                  {mobileIsFinished && mobileActualWinner === 'DRAW' && (
                                    <span className="prediction-crown" role="img" aria-label="무승부 결과">
                                      👑{' '}
                                    </span>
                                  )}
                                  무승부
                                </span>
                                <span className="prediction-vote-btn__point">+{mobileOdds.drawPoint || 150}P</span>
                              </button>

                              <button
                                type="button"
                                className={getVoteButtonClass(
                                  'AWAY',
                                  mobileMyChoice,
                                  mobileIsFinished,
                                  mobileActualWinner,
                                  mobileIsHit,
                                  mobileIsMiss
                                )}
                                onClick={() => handleVote(currentMobileMatch.matchId, 'AWAY')}
                                disabled={mobileIsFinished || votingMatchId === currentMobileMatch.matchId}
                                title={
                                  mobileIsFinished
                                    ? '종료된 경기입니다'
                                    : mobileMyVote
                                    ? '클릭하여 예측을 변경할 수 있습니다'
                                    : '원정팀 승 투표'
                                }
                              >
                                <span className="prediction-vote-btn__label">
                                  {mobileIsFinished && mobileActualWinner === 'AWAY' && (
                                    <span className="prediction-crown" role="img" aria-label="승리">
                                      👑{' '}
                                    </span>
                                  )}
                                  원정팀 승
                                </span>
                                <span
                                  className={`prediction-vote-btn__point ${
                                    mobileOdds.awayUnderdog ? 'is-underdog' : ''
                                  }`}
                                >
                                  +{mobileOdds.awayPoint || 100}P {mobileOdds.awayUnderdog ? '🔥' : ''}
                                </span>
                              </button>
                            </div>

                            {/* 실시간 투표율 게이지 바 */}
                            {(mobileOdds.totalVotes || 0) > 0 && (
                              <div className="prediction-vote-bar">
                                <div className="prediction-vote-bar__meta">
                                  <span>팬 투표율 (총 {mobileOdds.totalVotes}표)</span>
                                  <span>
                                    홈 {mobileOdds.homeVoteRate}% | 무 {mobileOdds.drawVoteRate}% | 원정{' '}
                                    {mobileOdds.awayVoteRate}%
                                  </span>
                                </div>
                                <div className="prediction-vote-bar__track">
                                  <div
                                    className="prediction-vote-bar__seg-home"
                                    style={{ width: `${mobileOdds.homeVoteRate || 33.3}%` }}
                                  />
                                  <div
                                    className="prediction-vote-bar__seg-draw"
                                    style={{ width: `${mobileOdds.drawVoteRate || 33.3}%` }}
                                  />
                                  <div
                                    className="prediction-vote-bar__seg-away"
                                    style={{ width: `${mobileOdds.awayVoteRate || 33.4}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </article>
                        )}
                        <div className="prediction-slider-hint">
                          👈 좌우로 넘겨서 다음 경기를 예측해보세요 👉
                        </div>
                      </div>

                      {/* 2) 데스크톱/태블릿 전용: 5개씩 세로 나열 목록 (> 425px) */}
                      <div className="prediction-desktop-list">
                        {matches.slice(0, visibleCount).map((m) => {
                          const odds = oddsData[m.matchId] || {};
                          const myVote = myVotes[m.matchId];
                          const isFinished = m.status === 'FINISHED';
                          const actualWinner = getActualWinner(m);
                          const myChoice = myVote?.predictResult || null;
                          const isMyHit = Boolean(
                            isFinished &&
                              myVote &&
                              (myVote.isSuccess === 'Y' || (actualWinner && myChoice === actualWinner))
                          );
                          const isMyMiss = Boolean(
                            isFinished &&
                              myVote &&
                              !isMyHit &&
                              (myVote.isSuccess === 'N' || (actualWinner && myChoice !== actualWinner))
                          );

                          const homePoint = odds.homePoint || 100;
                          const drawPoint = odds.drawPoint || 150;
                          const awayPoint = odds.awayPoint || 100;
                          const isVoting = votingMatchId === m.matchId;

                          return (
                            <article
                              key={m.matchId}
                              className={`prediction-card ${
                                isFinished
                                  ? isMyHit
                                    ? 'is-card-hit'
                                    : isMyMiss
                                    ? 'is-card-miss'
                                    : 'is-card-finished'
                                  : ''
                              }`}
                            >
                              <div className="prediction-card__header">
                                <span>{m.matchDate ? m.matchDate.substring(0, 16).replace('T', ' ') : '일정 미정'}</span>
                                <span
                                  className={`prediction-card__badge ${
                                    isFinished
                                      ? isMyHit
                                        ? 'is-win'
                                        : isMyMiss
                                        ? 'is-lose'
                                        : 'is-finished'
                                      : ''
                                  }`}
                                >
                                  {isFinished
                                    ? isMyHit
                                      ? '🎯 적중 성공 · 경기 종료'
                                      : isMyMiss
                                      ? '미적중 · 경기 종료'
                                      : '경기 종료'
                                    : myVote
                                    ? '예측 완료 (변경 가능)'
                                    : '예측 진행중'}
                                </span>
                              </div>

                              {/* 팀 대진 */}
                              <div className="prediction-teams">
                                <div className="prediction-team is-home">
                                  <img
                                    src={
                                      odds.homeEmblemUrl ||
                                      m.homeEmblemUrl ||
                                      'https://crests.football-data.org/57.png'
                                    }
                                    alt={odds.homeTeamNameKor || m.homeTeamNameKor || odds.homeTeamName || '홈팀'}
                                    className="prediction-team__emblem"
                                    onError={(e) => {
                                      e.target.src = 'https://crests.football-data.org/57.png';
                                    }}
                                  />
                                  <div className="prediction-team__info">
                                    <span className="prediction-team__name">
                                      {odds.homeTeamNameKor ||
                                        m.homeTeamNameKor ||
                                        odds.homeTeamName ||
                                        m.homeTeamName ||
                                        `팀 ${m.homeTeamId}`}
                                    </span>
                                    <span className="prediction-team__rank">
                                      {odds.homeRank ? `${odds.homeRank}위` : ''} {odds.homeUnderdog ? '🔥 언더독' : ''}
                                    </span>
                                  </div>
                                </div>

                                <div style={{ textAlign: 'center' }}>
                                  {isFinished ? (
                                    <div className="prediction-score">
                                      {m.homeScore} : {m.awayScore}
                                    </div>
                                  ) : (
                                    <div className="prediction-vs">VS</div>
                                  )}
                                </div>

                                <div className="prediction-team is-away">
                                  <img
                                    src={
                                      odds.awayEmblemUrl ||
                                      m.awayEmblemUrl ||
                                      'https://crests.football-data.org/65.png'
                                    }
                                    alt={odds.awayTeamNameKor || m.awayTeamNameKor || odds.awayTeamName || '원정팀'}
                                    className="prediction-team__emblem"
                                    onError={(e) => {
                                      e.target.src = 'https://crests.football-data.org/65.png';
                                    }}
                                  />
                                  <div className="prediction-team__info">
                                    <span className="prediction-team__name">
                                      {odds.awayTeamNameKor ||
                                        m.awayTeamNameKor ||
                                        odds.awayTeamName ||
                                        m.awayTeamName ||
                                        `팀 ${m.awayTeamId}`}
                                    </span>
                                    <span className="prediction-team__rank">
                                      {odds.awayRank ? `${odds.awayRank}위` : ''} {odds.awayUnderdog ? '🔥 언더독' : ''}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 투표 버튼 3개 (맞춘 경기: 색 유지 / 틀린 경기: disabled 느낌 / 승리 쪽: 👑 왕관) */}
                              <div className="prediction-buttons">
                                <button
                                  type="button"
                                  className={getVoteButtonClass(
                                    'HOME',
                                    myChoice,
                                    isFinished,
                                    actualWinner,
                                    isMyHit,
                                    isMyMiss
                                  )}
                                  onClick={() => handleVote(m.matchId, 'HOME')}
                                  disabled={isFinished || isVoting}
                                  title={
                                    isFinished
                                      ? '종료된 경기입니다'
                                      : myVote
                                      ? '클릭하여 예측을 변경할 수 있습니다'
                                      : '홈팀 승 투표'
                                  }
                                >
                                  <span className="prediction-vote-btn__label">
                                    {isFinished && actualWinner === 'HOME' && (
                                      <span className="prediction-crown" role="img" aria-label="승리">
                                        👑{' '}
                                      </span>
                                    )}
                                    홈팀 승
                                  </span>
                                  <span className={`prediction-vote-btn__point ${odds.homeUnderdog ? 'is-underdog' : ''}`}>
                                    +{homePoint}P {odds.homeUnderdog ? '🔥' : ''}
                                  </span>
                                </button>

                                <button
                                  type="button"
                                  className={getVoteButtonClass(
                                    'DRAW',
                                    myChoice,
                                    isFinished,
                                    actualWinner,
                                    isMyHit,
                                    isMyMiss
                                  )}
                                  onClick={() => handleVote(m.matchId, 'DRAW')}
                                  disabled={isFinished || isVoting}
                                  title={
                                    isFinished
                                      ? '종료된 경기입니다'
                                      : myVote
                                      ? '클릭하여 예측을 변경할 수 있습니다'
                                      : '무승부 투표'
                                  }
                                >
                                  <span className="prediction-vote-btn__label">
                                    {isFinished && actualWinner === 'DRAW' && (
                                      <span className="prediction-crown" role="img" aria-label="무승부 결과">
                                        👑{' '}
                                      </span>
                                    )}
                                    무승부
                                  </span>
                                  <span className="prediction-vote-btn__point">+{drawPoint}P</span>
                                </button>

                                <button
                                  type="button"
                                  className={getVoteButtonClass(
                                    'AWAY',
                                    myChoice,
                                    isFinished,
                                    actualWinner,
                                    isMyHit,
                                    isMyMiss
                                  )}
                                  onClick={() => handleVote(m.matchId, 'AWAY')}
                                  disabled={isFinished || isVoting}
                                  title={
                                    isFinished
                                      ? '종료된 경기입니다'
                                      : myVote
                                      ? '클릭하여 예측을 변경할 수 있습니다'
                                      : '원정팀 승 투표'
                                  }
                                >
                                  <span className="prediction-vote-btn__label">
                                    {isFinished && actualWinner === 'AWAY' && (
                                      <span className="prediction-crown" role="img" aria-label="승리">
                                        👑{' '}
                                      </span>
                                    )}
                                    원정팀 승
                                  </span>
                                  <span className={`prediction-vote-btn__point ${odds.awayUnderdog ? 'is-underdog' : ''}`}>
                                    +{awayPoint}P {odds.awayUnderdog ? '🔥' : ''}
                                  </span>
                                </button>
                              </div>

                              {/* 실시간 투표율 게이지 바 */}
                              {odds.totalVotes > 0 && (
                                <div className="prediction-vote-bar">
                                  <div className="prediction-vote-bar__meta">
                                    <span>팬 투표율 (총 {odds.totalVotes}표)</span>
                                    <span>
                                      홈 {odds.homeVoteRate}% | 무 {odds.drawVoteRate}% | 원정 {odds.awayVoteRate}%
                                    </span>
                                  </div>
                                  <div className="prediction-vote-bar__track">
                                    <div className="prediction-vote-bar__seg-home" style={{ width: `${odds.homeVoteRate || 33.3}%` }} />
                                    <div className="prediction-vote-bar__seg-draw" style={{ width: `${odds.drawVoteRate || 33.3}%` }} />
                                    <div className="prediction-vote-bar__seg-away" style={{ width: `${odds.awayVoteRate || 33.4}%` }} />
                                  </div>
                                </div>
                              )}
                            </article>
                          );
                        })}

                        {/* 5개씩 더보기 버튼 */}
                        {visibleCount < matches.length && (
                          <div className="prediction-more-wrap">
                            <button
                              type="button"
                              className="prediction-more-btn"
                              onClick={() => setVisibleCount((prev) => prev + 5)}
                            >
                              {Math.min(5, matches.length - visibleCount)}경기 더보기 ▾
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* 내 예측 내역 뷰: 기준일 ±3일 탐색 바 (이전/이후 클릭 시 6일씩 이동, 오름차순 정렬) */
                <div className="prediction-my-list">
                  {!isLoggedIn && !localStorage.getItem('buildup_token') ? (
                    <div className="prediction-my-empty">
                      <p>로그인 후 내가 참여한 승부예측 내역을 확인하실 수 있습니다.</p>
                      <a href="#/plug/login" className="prediction-tab-btn" style={{ display: 'inline-block', marginTop: '12px' }}>
                        로그인하러 가기
                      </a>
                    </div>
                  ) : myHistory.length === 0 ? (
                    <div className="prediction-my-empty">아직 참여한 승부예측 내역이 없습니다.</div>
                  ) : (
                    <>
                      {/* 내 예측 내역 ±3일 탐색 바 (이전/이후 클릭 시 6일 단위 이동) */}
                      <div className="prediction-period-nav">
                        <button
                          type="button"
                          className="prediction-period-btn"
                          onClick={() => shiftHistoryWindow(-1)}
                        >
                          ◀ 이전 경기
                        </button>
                        <div className="prediction-period-center">
                          <span className="prediction-period-range">
                            {showAllHistory
                              ? `전체 예측 내역 (${myHistory.length}건)`
                              : formatRangeText(historyCenterMs)}
                          </span>
                          <div className="prediction-period-actions">
                            <button
                              type="button"
                              className={`prediction-period-chip ${!showAllHistory ? 'is-active' : ''}`}
                              onClick={resetHistoryWindow}
                            >
                              최근 경기
                            </button>
                            <button
                              type="button"
                              className={`prediction-period-chip ${showAllHistory ? 'is-active' : ''}`}
                              onClick={() => {
                                setShowAllHistory((prev) => !prev);
                                setVisibleHistoryCount(10);
                              }}
                            >
                              {showAllHistory ? '기간별 보기' : `전체 내역 (${myHistory.length})`}
                            </button>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="prediction-period-btn"
                          onClick={() => shiftHistoryWindow(1)}
                        >
                          이후 경기 ▶
                        </button>
                      </div>

                      {filteredHistory.length === 0 ? (
                        <div className="prediction-my-empty">
                          <p>해당 기간({formatRangeText(historyCenterMs)})에 참여한 예측 내역이 없습니다.</p>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
                            <button type="button" className="prediction-period-btn" onClick={() => shiftHistoryWindow(-1)}>
                              ◀ 이전 경기 보기
                            </button>
                            <button type="button" className="prediction-period-btn" onClick={() => shiftHistoryWindow(1)}>
                              이후 경기 보기 ▶
                            </button>
                            <button type="button" className="prediction-period-btn" onClick={() => setShowAllHistory(true)}>
                              전체 예측 내역 보기 ({myHistory.length}건)
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {filteredHistory.slice(0, visibleHistoryCount).map((item) => {
                            const itemWinner = getActualWinner(item);
                            const isItemFinished =
                              item.matchStatus === 'FINISHED' || item.isSuccess === 'Y' || item.isSuccess === 'N';
                            const isItemHit =
                              item.isSuccess === 'Y' ||
                              (isItemFinished && itemWinner && item.predictResult === itemWinner);
                            const isItemMiss =
                              item.isSuccess === 'N' ||
                              (isItemFinished && itemWinner && item.predictResult !== itemWinner);

                            return (
                              <article
                                key={item.predictionId}
                                className={`prediction-card ${
                                  isItemHit ? 'is-card-hit' : isItemMiss ? 'is-card-miss' : ''
                                }`}
                              >
                                <div className="prediction-card__header">
                                  <span>
                                    {item.matchDate
                                      ? item.matchDate.substring(0, 16).replace('T', ' ')
                                      : item.createdAt}
                                  </span>
                                  <span
                                    className={`prediction-card__badge ${
                                      isItemHit ? 'is-win' : isItemMiss ? 'is-lose' : 'is-wait'
                                    }`}
                                  >
                                    {isItemHit
                                      ? '🎯 적중 성공 (+보상지급)'
                                      : isItemMiss
                                      ? '미적중'
                                      : '경기 결과 대기중'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                  <div>
                                    <strong className="prediction-match-title" style={{ fontSize: '1.05rem' }}>
                                      {itemWinner === 'HOME' && <span className="prediction-crown">👑 </span>}
                                      {item.homeTeamNameKor || item.homeTeamName} vs{' '}
                                      {itemWinner === 'AWAY' && <span className="prediction-crown">👑 </span>}
                                      {item.awayTeamNameKor || item.awayTeamName}
                                    </strong>
                                    <div className="prediction-my-choice">
                                      내 선택:{' '}
                                      <strong>
                                        {item.predictResult === 'HOME'
                                          ? '홈팀 승'
                                          : item.predictResult === 'DRAW'
                                          ? '무승부'
                                          : '원정팀 승'}
                                      </strong>
                                      {itemWinner && (
                                        <span style={{ marginLeft: '10px', opacity: 0.85 }}>
                                          | 실제 결과:{' '}
                                          <strong>
                                            👑{' '}
                                            {itemWinner === 'HOME'
                                              ? '홈팀 승'
                                              : itemWinner === 'DRAW'
                                              ? '무승부'
                                              : '원정팀 승'}
                                          </strong>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {item.homeScore != null && (
                                    <div className="prediction-score" style={{ fontSize: '1.25rem' }}>
                                      {item.homeScore} : {item.awayScore}
                                    </div>
                                  )}
                                </div>

                                {/* 내 예측 내역 카드에서도 3버튼(맞춘 색 유지 / 틀린 disabled 느낌 / 승리 👑) 표시 */}
                                <div className="prediction-buttons" style={{ marginTop: '12px' }}>
                                  <button
                                    type="button"
                                    className={getVoteButtonClass(
                                      'HOME',
                                      item.predictResult,
                                      isItemFinished,
                                      itemWinner,
                                      isItemHit,
                                      isItemMiss
                                    )}
                                    disabled
                                  >
                                    <span className="prediction-vote-btn__label">
                                      {isItemFinished && itemWinner === 'HOME' && (
                                        <span className="prediction-crown" role="img" aria-label="승리">
                                          👑{' '}
                                        </span>
                                      )}
                                      홈팀 승
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    className={getVoteButtonClass(
                                      'DRAW',
                                      item.predictResult,
                                      isItemFinished,
                                      itemWinner,
                                      isItemHit,
                                      isItemMiss
                                    )}
                                    disabled
                                  >
                                    <span className="prediction-vote-btn__label">
                                      {isItemFinished && itemWinner === 'DRAW' && (
                                        <span className="prediction-crown" role="img" aria-label="무승부 결과">
                                          👑{' '}
                                        </span>
                                      )}
                                      무승부
                                    </span>
                                  </button>

                                  <button
                                    type="button"
                                    className={getVoteButtonClass(
                                      'AWAY',
                                      item.predictResult,
                                      isItemFinished,
                                      itemWinner,
                                      isItemHit,
                                      isItemMiss
                                    )}
                                    disabled
                                  >
                                    <span className="prediction-vote-btn__label">
                                      {isItemFinished && itemWinner === 'AWAY' && (
                                        <span className="prediction-crown" role="img" aria-label="승리">
                                          👑{' '}
                                        </span>
                                      )}
                                      원정팀 승
                                    </span>
                                  </button>
                                </div>
                              </article>
                            );
                          })}

                          {/* 더보기 버튼 (내 예측 내역) */}
                          {visibleHistoryCount < filteredHistory.length && (
                            <div className="prediction-more-wrap">
                              <button
                                type="button"
                                className="prediction-more-btn"
                                onClick={() => setVisibleHistoryCount((prev) => prev + 10)}
                              >
                                {Math.min(10, filteredHistory.length - visibleHistoryCount)}개 내역 더보기 ▾
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}
            </main>

            {/* 우측 사이드바: 명예의 전당 Top 5 (다승 및 승률 순) & 광고 영역 */}
            <aside className="prediction-sidebar">
              <div className="prediction-ranking-card">
                <h2 className="prediction-ranking-card__title">
                  🏆 승부예측 랭킹
                </h2>
                <p className="prediction-ranking-card__sub">
                  이변과 승리를 맞춘 명예의 전당 (Top 5)
                </p>

                <div className="prediction-ranking-list">
                  {rankings.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                      아직 등록된 랭킹 기록이 없습니다.
                    </div>
                  ) : (
                    rankings.slice(0, 5).map((user, idx) => (
                      <div key={user.userId || idx} className="prediction-ranking-item">
                        <div className="prediction-ranking-item__left">
                          <span className="prediction-ranking-item__rank">{idx + 1}</span>
                          <div>
                            <div className="prediction-ranking-item__name">{user.nickname || `유저 ${user.userId}`}</div>
                            <div className="prediction-ranking-item__meta">
                              {user.predictWin}승 / {user.predictTotal}전
                            </div>
                          </div>
                        </div>
                        <div className="prediction-ranking-item__right">
                          <div className="prediction-ranking-item__point">
                            {user.winRate}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 랭킹 하단 스폰서 광고 카드 */}
              <div
                className={`prediction-ad-card ${rankings.length > 0 ? 'is-compact' : ''}`}
                style={{ '--ranking-count': Math.min(rankings.length, 5) }}
              >
                <div className="prediction-ad-box">
                  {/* 실제 구글 애드센스 광고 단위 */}
                  <ins
                    ref={sideAdRef}
                    className="adsbygoogle prediction-ad-ins"
                    style={{ display: 'block' }}
                    data-ad-client="ca-pub-6961977480009285"
                    data-ad-format="rectangle"
                    data-full-width-responsive="true"
                  />

                  {/* 광고 로드 전 / 로컬 개발 환경용 플레이스홀더 */}
                  <div className="prediction-ad-placeholder" aria-hidden="true">
                    <span className="prediction-ad-icon">📢</span>
                    <strong className="prediction-ad-title">PL:UG 공식 승부예측 스폰서</strong>
                    <p className="prediction-ad-desc">
                      프리미어리그 정품 유니폼 & MD 굿즈 특별 기획전
                    </p>
                    <span className="prediction-ad-cta">스토어 바로가기 →</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* 커스텀 모달 Alert (예측 변경/참여 완료 & 임시 경기 포인트 변동 차단 해결 모달) */}
      {predictionModal && (
        <div
          className="prediction-modal-backdrop"
          onClick={() => {
            if (!resolvingDummyLock) setPredictionModal(null);
          }}
        >
          <div
            className={`prediction-modal is-${predictionModal.type}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* 상단 아이콘 & 배지 */}
            <div className="prediction-modal__top">
              <div className={`prediction-modal__icon is-${predictionModal.type}`}>
                {predictionModal.type === 'vote-change' && '🔄'}
                {predictionModal.type === 'vote-new' && '⚽'}
                {predictionModal.type === 'dummy-lock' && '🔒'}
                {predictionModal.type === 'login' && '🔑'}
                {predictionModal.type === 'info' && '💡'}
                {predictionModal.type === 'error' && '⚠️'}
              </div>
              <span className={`prediction-modal__badge is-${predictionModal.type}`}>
                {predictionModal.badge}
              </span>
              <h3 className="prediction-modal__title">{predictionModal.title}</h3>
            </div>

            {/* 1) 예측 변경 / 신규 참여 완료 카드 */}
            {(predictionModal.type === 'vote-change' || predictionModal.type === 'vote-new') && (
              <div className="prediction-modal__summary">
                <div className="prediction-modal__matchup">
                  <div className="prediction-modal__team">
                    <img
                      src={predictionModal.homeEmblem}
                      alt={predictionModal.homeName}
                      onError={(e) => {
                        e.target.src = 'https://crests.football-data.org/57.png';
                      }}
                    />
                    <span>{predictionModal.homeName}</span>
                  </div>
                  <span className="prediction-modal__vs">VS</span>
                  <div className="prediction-modal__team">
                    <img
                      src={predictionModal.awayEmblem}
                      alt={predictionModal.awayName}
                      onError={(e) => {
                        e.target.src = 'https://crests.football-data.org/65.png';
                      }}
                    />
                    <span>{predictionModal.awayName}</span>
                  </div>
                </div>

                {predictionModal.type === 'vote-change' ? (
                  <div className="prediction-modal__change-box">
                    <div className="prediction-modal__choice-chip is-prev">
                      <span className="prediction-modal__choice-caption">이전 예측</span>
                      <strong>{predictionModal.prevChoiceLabel}</strong>
                    </div>
                    <span className="prediction-modal__change-arrow">➔</span>
                    <div className="prediction-modal__choice-chip is-new">
                      <span className="prediction-modal__choice-caption">변경된 예측</span>
                      <strong>{predictionModal.newChoiceLabel}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="prediction-modal__change-box is-single">
                    <div className="prediction-modal__choice-chip is-new">
                      <span className="prediction-modal__choice-caption">나의 예측 선택</span>
                      <strong>{predictionModal.newChoiceLabel}</strong>
                    </div>
                  </div>
                )}

                <div className="prediction-modal__reward">
                  <span>적중 시 예상 획득 포인트</span>
                  <strong className={predictionModal.isUnderdogPick ? 'is-underdog' : ''}>
                    +{predictionModal.rewardPoint}P {predictionModal.isUnderdogPick ? '🔥 언더독 보너스' : ''}
                  </strong>
                </div>
              </div>
            )}

            {/* 2) 임시 경기 진행 중 포인트 변동 제한 안내 박스 */}
            {predictionModal.type === 'dummy-lock' && (
              <div className="prediction-modal__lock-box">
                {predictionModal.homeName && predictionModal.awayName && (
                  <div className="prediction-modal__lock-target">
                    선택한 일반 경기: <strong>{predictionModal.homeName} vs {predictionModal.awayName}</strong>
                  </div>
                )}
                <p className="prediction-modal__desc">{predictionModal.message}</p>
                <div className="prediction-modal__lock-guide">
                  <span>💡 해결 방법</span>
                  <ul>
                    <li>현재 진행 중인 <strong>임시 경기(테스트용)</strong>에서만 승부예측 및 포인트 변동이 가능합니다.</li>
                    <li>일반 경기에 참여하거나 포인트를 조정하려면 임시 경기를 먼저 정리해주세요.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 3) 일반 안내 / 로그인 / 에러 메시지 */}
            {predictionModal.type !== 'vote-change' &&
              predictionModal.type !== 'vote-new' &&
              predictionModal.type !== 'dummy-lock' && (
                <p className="prediction-modal__desc">{predictionModal.message}</p>
              )}

            {/* 하단 액션 버튼 영역 */}
            <div className="prediction-modal__actions">
              {predictionModal.type === 'dummy-lock' ? (
                <>
                  <button
                    type="button"
                    className="prediction-modal__btn is-primary"
                    onClick={() => {
                      setPredictionModal(null);
                      setActiveTab('matches');
                      resetMatchWindow();
                    }}
                    disabled={resolvingDummyLock}
                  >
                    🧪 임시 경기로 이동
                  </button>
                  <button
                    type="button"
                    className="prediction-modal__btn is-danger"
                    onClick={() =>
                      handleResolveDummyAndVote(
                        predictionModal.pendingMatchId,
                        predictionModal.pendingPredictResult
                      )
                    }
                    disabled={resolvingDummyLock}
                  >
                    {resolvingDummyLock
                      ? '임시 경기 정리 중...'
                      : isAdmin
                      ? '🗑️ 임시 경기 일괄 삭제 후 예측 반영'
                      : '🗑️ 임시 경기 정리 후 예측 시도'}
                  </button>
                  <button
                    type="button"
                    className="prediction-modal__btn is-ghost"
                    onClick={() => setPredictionModal(null)}
                    disabled={resolvingDummyLock}
                  >
                    닫기
                  </button>
                </>
              ) : predictionModal.type === 'login' ? (
                <>
                  <button
                    type="button"
                    className="prediction-modal__btn is-primary"
                    onClick={() => navigate('/plug/login')}
                  >
                    로그인하러 가기
                  </button>
                  <button
                    type="button"
                    className="prediction-modal__btn is-ghost"
                    onClick={() => setPredictionModal(null)}
                  >
                    취소
                  </button>
                </>
              ) : predictionModal.type === 'vote-change' || predictionModal.type === 'vote-new' ? (
                <>
                  <button
                    type="button"
                    className="prediction-modal__btn is-primary"
                    onClick={() => setPredictionModal(null)}
                  >
                    확인
                  </button>
                  <button
                    type="button"
                    className="prediction-modal__btn is-secondary"
                    onClick={() => {
                      setPredictionModal(null);
                      setActiveTab('my');
                    }}
                  >
                    내 예측 내역 보기
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="prediction-modal__btn is-primary"
                  onClick={() => setPredictionModal(null)}
                >
                  확인
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
