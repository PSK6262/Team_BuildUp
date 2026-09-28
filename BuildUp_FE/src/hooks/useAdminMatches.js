import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import * as adminApi from '../api/adminApi.js';

/**
 * [관리자 경기 & 부상 관리 커스텀 훅 - BuildUp_FE/src/hooks/useAdminMatches.js]
 * 
 * 경기 일정/스코어 목록 조회, 검색/필터링, 공지/스코어/타임라인이벤트/부상선수 관리 모달 로직을 전담합니다.
 */
export function useAdminMatches({ showAlert, initialFilter, onClearInitialFilter }) {
  const dispatch = useDispatch();

  const [matches, setMatches] = useState([]);
  const [matchDateFilter, setMatchDateFilter] = useState('');
  const [matchStatusFilter, setMatchStatusFilter] = useState(initialFilter || '');
  const [matchSortOrder, setMatchSortOrder] = useState(initialFilter === 'MISMATCH' ? 'DESC' : 'AUTO');
  const [selectedTeamId, setSelectedTeamId] = useState(57); // 기본 Arsenal
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [mismatchCount, setMismatchCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 모달 상태들
  const [noticeModal, setNoticeModal] = useState(null); // { matchId, title, notice }
  const [scoreModal, setScoreModal] = useState(null);   // { matchId, title, homeScore, awayScore, status }
  const [injuryModal, setInjuryModal] = useState(null); // { playerId, name, isInjured, injuryNote, isSuspended }
  const [eventModal, setEventModal] = useState(null);   // { matchId, match, events, loading, aiAdvice, aiLoading, newEvent }
  const [eventModalPlayers, setEventModalPlayers] = useState([]);

  // initialFilter가 전달되었을 때 상태 반영
  useEffect(() => {
    if (initialFilter) {
      setMatchStatusFilter(initialFilter);
      if (initialFilter === 'MISMATCH') {
        setMatchSortOrder('DESC');
      }
      onClearInitialFilter?.();
    }
  }, [initialFilter, onClearInitialFilter]);

  // 불일치 경기 카운트 갱신 (배너용)
  const refreshMismatchCount = useCallback(async () => {
    try {
      const res = await adminApi.getAdminSummary();
      const json = await res.json();
      if (json.code === 'SUC_001' && json.data) {
        setMismatchCount(Number(json.data.MISMATCH_MATCHES || 0));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // 1. 경기 목록 조회
  const fetchMatches = useCallback(async (overrideSort = null) => {
    setLoading(true);
    try {
      const sortToUse = overrideSort || matchSortOrder;
      let finalSort = sortToUse;
      if (!sortToUse || sortToUse === 'AUTO') {
        if (matchStatusFilter === 'SCHEDULED' || matchStatusFilter === 'TIMED') {
          finalSort = 'ASC';
        } else if (matchStatusFilter === 'FINISHED') {
          finalSort = 'DESC';
        } else {
          finalSort = '';
        }
      }

      const res = await adminApi.getAdminMatches({
        date: matchDateFilter,
        status: matchStatusFilter,
        sort: finalSort,
      });

      if (res.status === 401 || res.status === 403) {
        dispatch(logout());
        showAlert?.('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error');
        return;
      }

      const json = await res.json();
      if (json.code === 'FORBIDDEN' || json.code === 'ERR_003' || json.code === 'UNAUTHORIZED') {
        dispatch(logout());
        showAlert?.('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error');
        return;
      }

      if (json.code === 'SUC_001' && json.data) {
        setMatches(json.data);
      }
    } catch (e) {
      console.warn('경기 목록 조회 실패', e);
    } finally {
      setLoading(false);
    }
  }, [matchDateFilter, matchStatusFilter, matchSortOrder, dispatch, showAlert]);

  // 2. 구단별 선수단 조회
  const fetchTeamPlayers = useCallback(async (teamId) => {
    try {
      const res = await adminApi.getAdminTeamPlayers(teamId);
      const json = await res.json();
      if (json.code === 'SUC_001' && json.data) {
        setTeamPlayers(json.data);
      }
    } catch (e) {
      console.warn('팀 선수단 조회 실패', e);
    }
  }, []);

  // 마운트 시 데이터 로드
  useEffect(() => {
    fetchMatches();
    fetchTeamPlayers(selectedTeamId);
    refreshMismatchCount();
  }, [fetchMatches, fetchTeamPlayers, selectedTeamId, refreshMismatchCount]);

  // 경기 공지사항 저장
  const handleSaveNotice = async () => {
    if (!noticeModal) return;
    try {
      const res = await adminApi.updateMatchNotice(noticeModal.matchId, noticeModal.notice);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('경기 공지사항이 성공적으로 등록/수정되었습니다.');
        setNoticeModal(null);
        fetchMatches();
      } else {
        showAlert?.(json.message || '공지 수정 실패', 'error');
      }
    } catch (e) {
      showAlert?.('공지사항 수정 요청 중 오류가 발생했습니다.', 'error');
    }
  };

  // 경기 스코어/상태 긴급 정정
  const handleSaveScore = async () => {
    if (!scoreModal) return;
    try {
      const res = await adminApi.updateMatchScore(scoreModal.matchId, {
        homeScore: scoreModal.homeScore !== '' ? Number(scoreModal.homeScore) : null,
        awayScore: scoreModal.awayScore !== '' ? Number(scoreModal.awayScore) : null,
        status: scoreModal.status,
      });
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('경기 스코어 및 상태가 갱신되었습니다.');
        setScoreModal(null);
        fetchMatches();
        refreshMismatchCount();
      } else {
        showAlert?.(json.message || '스코어 수정 실패', 'error');
      }
    } catch (e) {
      showAlert?.('경기 스코어 수정 중 오류가 발생했습니다.', 'error');
    }
  };

  // 타임라인 이벤트 모달 열기
  const handleOpenEventModal = async (match) => {
    setEventModal({
      matchId: match.matchId,
      match,
      events: [],
      loading: true,
      aiAdvice: null,
      aiLoading: true,
      newEvent: {
        eventTime: '',
        teamId: match.homeTeamId,
        playerId: '',
        eventType: 1,
      },
    });

    try {
      const res = await adminApi.getMatchEvents(match.matchId);
      const json = await res.json();
      const evts = (json.code === 'SUC_001' && json.data) ? json.data : [];

      const [homeRes, awayRes] = await Promise.all([
        adminApi.getAdminTeamPlayers(match.homeTeamId),
        adminApi.getAdminTeamPlayers(match.awayTeamId),
      ]);
      const [homeJson, awayJson] = await Promise.all([homeRes.json(), awayRes.json()]);
      const allPlayers = [
        ...(homeJson.code === 'SUC_001' && homeJson.data ? homeJson.data.map(p => ({ ...p, teamType: 'HOME', teamName: match.homeTeamNameKor || match.homeTeamName })) : []),
        ...(awayJson.code === 'SUC_001' && awayJson.data ? awayJson.data.map(p => ({ ...p, teamType: 'AWAY', teamName: match.awayTeamNameKor || match.awayTeamName })) : []),
      ];

      setEventModalPlayers(allPlayers);
      setEventModal(prev => prev ? {
        ...prev,
        events: evts,
        loading: false,
        newEvent: {
          ...prev.newEvent,
          playerId: allPlayers.length > 0 ? allPlayers[0].playerId : '',
        },
      } : null);

      fetchAiAdvice(match.matchId);
    } catch (e) {
      showAlert?.('경기 이벤트를 불러오는 중 통신 오류가 발생했습니다.', 'error');
      setEventModal(prev => prev ? { ...prev, loading: false, aiLoading: false } : null);
    }
  };

  // 경기 이벤트 단건 수동 삭제
  const handleDeleteEvent = async (eventId, eventDesc) => {
    if (!window.confirm(`선택한 이벤트(${eventDesc})를 정말 삭제하시겠습니까?\n삭제 후 스코어 정합성이 다시 계산됩니다.`)) return;
    try {
      const res = await adminApi.deleteMatchEvent(eventId);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('이벤트가 성공적으로 삭제되었습니다.');
        if (eventModal) {
          const updatedEvents = eventModal.events.filter(e => e.eventId !== eventId && e.event_id !== eventId);
          setEventModal({ ...eventModal, events: updatedEvents });
        }
        fetchMatches();
        refreshMismatchCount();
      } else {
        showAlert?.(json.message || '이벤트 삭제 실패', 'error');
      }
    } catch (e) {
      showAlert?.('이벤트 삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // 경기 이벤트 수동 추가
  const handleAddEvent = async () => {
    if (!eventModal) return;
    const { newEvent, matchId } = eventModal;
    if (!newEvent.eventTime || isNaN(newEvent.eventTime)) {
      showAlert?.('발생 시간을 숫자로 입력해주세요 (예: 45).', 'error');
      return;
    }
    if (!newEvent.playerId) {
      showAlert?.('이벤트 발생 선수를 선택해주세요.', 'error');
      return;
    }

    try {
      const res = await adminApi.addMatchEvent(matchId, {
        matchId,
        teamId: Number(newEvent.teamId),
        eventTime: Number(newEvent.eventTime),
        eventType: Number(newEvent.eventType),
        playerId: Number(newEvent.playerId),
      });
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('새로운 경기 이벤트가 등록되었습니다.');
        const evRes = await adminApi.getMatchEvents(matchId);
        const evJson = await evRes.json();
        if (evJson.code === 'SUC_001') {
          setEventModal(prev => ({
            ...prev,
            events: evJson.data || [],
            newEvent: { ...prev.newEvent, eventTime: '' },
          }));
        }
        fetchMatches();
        refreshMismatchCount();
      } else {
        showAlert?.(json.message || '이벤트 등록 실패', 'error');
      }
    } catch (e) {
      showAlert?.('이벤트 등록 중 오류가 발생했습니다.', 'error');
    }
  };

  // 외부 API 원본 다시 불러오기
  const handleResyncSingleMatch = async () => {
    if (!eventModal) return;
    if (!window.confirm('외부 축구 API에서 이 경기의 공식 결과(스코어)와 원본 타임라인 이벤트를 다시 불러오시겠습니까?\nAI 임의 삭제 없이 순수 원본 데이터로 재적재됩니다.')) return;

    try {
      setEventModal(prev => ({ ...prev, loading: true }));
      const res = await adminApi.resyncSingleMatch(eventModal.matchId);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.(`경기 데이터 및 원본 이벤트(${json.data?.syncedEvents ?? 0}건)를 다시 불러왔습니다.`);
        const evRes = await adminApi.getMatchEvents(eventModal.matchId);
        const evJson = await evRes.json();
        setEventModal(prev => ({
          ...prev,
          match: json.data?.match || prev.match,
          events: evJson.data || [],
          loading: false,
          aiAdvice: null,
        }));
        fetchMatches();
        refreshMismatchCount();
        fetchAiAdvice(eventModal.matchId);
      } else {
        showAlert?.(json.message || '다시 불러오기 실패', 'error');
        setEventModal(prev => ({ ...prev, loading: false }));
      }
    } catch (e) {
      showAlert?.('외부 API 재동기화 중 오류가 발생했습니다.', 'error');
      setEventModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Gemini AI 조언 조회
  const fetchAiAdvice = async (matchId) => {
    try {
      setEventModal(prev => prev && prev.matchId === matchId ? { ...prev, aiLoading: true } : prev);
      const res = await adminApi.getMatchAiAdvice(matchId);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        setEventModal(prev => prev && prev.matchId === matchId ? {
          ...prev,
          aiAdvice: json.data,
          aiLoading: false,
        } : prev);
      } else {
        setEventModal(prev => prev && prev.matchId === matchId ? {
          ...prev,
          aiLoading: false,
        } : prev);
      }
    } catch (e) {
      setEventModal(prev => prev && prev.matchId === matchId ? {
        ...prev,
        aiLoading: false,
      } : prev);
    }
  };

  const handleGetAiAdvice = () => {
    if (!eventModal) return;
    fetchAiAdvice(eventModal.matchId);
  };

  // 선수 부상 저장
  const handleSaveInjury = async () => {
    if (!injuryModal) return;
    try {
      const res = await adminApi.updatePlayerInjury(injuryModal.playerId, {
        isInjured: injuryModal.isInjured,
        injuryNote: injuryModal.injuryNote,
        isSuspended: injuryModal.isSuspended,
      });
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('선수 부상 및 결장 정보가 저장되었습니다.');
        setInjuryModal(null);
        fetchTeamPlayers(selectedTeamId);
      } else {
        showAlert?.(json.message || '부상 정보 저장 실패', 'error');
      }
    } catch (e) {
      showAlert?.('부상 정보 저장 중 오류가 발생했습니다.', 'error');
    }
  };

  return {
    matches,
    matchDateFilter,
    setMatchDateFilter,
    matchStatusFilter,
    setMatchStatusFilter,
    matchSortOrder,
    setMatchSortOrder,
    selectedTeamId,
    setSelectedTeamId,
    teamPlayers,
    mismatchCount,
    loading,
    fetchMatches,
    fetchTeamPlayers,

    // 모달들
    noticeModal,
    setNoticeModal,
    handleSaveNotice,

    scoreModal,
    setScoreModal,
    handleSaveScore,

    injuryModal,
    setInjuryModal,
    handleSaveInjury,

    eventModal,
    setEventModal,
    eventModalPlayers,
    handleOpenEventModal,
    handleDeleteEvent,
    handleAddEvent,
    handleResyncSingleMatch,
    handleGetAiAdvice,
  };
}
