import { usePendingRequests } from './usePendingRequests.js';
import { useState, useCallback } from 'react';
import { useDeferredLoad } from './useDeferredLoad.js';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import * as adminApi from '../api/adminApi.js';

/**
 * [관리자 대시보드 개요 훅 - BuildUp_FE/src/hooks/useAdminOverview.js]
 * 
 * 대시보드 요약 KPI 통계, 최근 포인트 변동 이력, 리그 부상자 현황 조회를 전담합니다.
 */
export function useAdminOverview({ showAlert }) {
  const dispatch = useDispatch();

  const [summary, setSummary] = useState({
    TOTAL_USERS: 0,
    WITHDRAWN_USERS: 0,
    TOTAL_MATCHES: 0,
    SCHEDULED_MATCHES: 0,
    MISMATCH_MATCHES: 0,
    INJURED_PLAYERS: 0,
    BLIND_POSTS: 0,
    BLIND_COMMENTS: 0,
    DELETED_POSTS: 0,
    DELETED_COMMENTS: 0,
  });

  const [recentPoints, setRecentPoints] = useState([]);
  const [injuredSummary, setInjuredSummary] = useState([]);
  const [loading, trackRequest] = usePendingRequests();
  const [injuryModal, setInjuryModal] = useState(null); // { playerId, name, isInjured, injuryNote, isSuspended }

  // 1. 요약 통계 지표 조회
  const fetchSummary = useCallback(async () => {
    try {
      const res = await adminApi.getAdminSummary();
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
        setSummary(json.data);
      }
    } catch (e) {
      console.warn('요약 통계 조회 실패', e);
    }
  }, [dispatch, showAlert]);

  // 2. 최근 포인트 변동 이력 조회
  const fetchRecentPoints = useCallback(async () => {
    try {
      const res = await adminApi.getRecentPoints();
      const json = await res.json();
      if (json.code === 'SUC_001' && json.data) {
        setRecentPoints(json.data);
      }
    } catch (e) {
      console.warn('최근 포인트 이력 조회 실패', e);
    }
  }, []);

  // 3. 부상자 요약 조회
  const fetchInjuredSummary = useCallback(async () => {
    try {
      const res = await adminApi.getInjuredSummary();
      const json = await res.json();
      if (json.code === 'SUC_001' && json.data) {
        setInjuredSummary(json.data);
      }
    } catch (e) {
      console.warn('부상자 요약 조회 실패', e);
    }
  }, []);

  // 전체 데이터 일괄 로드
  const fetchOverviewData = useCallback(async () => {
    trackRequest(true);
    await Promise.all([fetchSummary(), fetchRecentPoints(), fetchInjuredSummary()]);
    trackRequest(false);
  }, [fetchSummary, fetchRecentPoints, fetchInjuredSummary, trackRequest]);

  // 부상 정보 저장 핸들러
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
        showAlert?.('선수 부상/결장 정보가 성공적으로 반영되었습니다.');
        setInjuryModal(null);
        fetchInjuredSummary();
        fetchSummary();
      } else {
        showAlert?.(json.message || '부상 정보 저장에 실패했습니다.', 'error');
      }
    } catch {
      showAlert?.('부상 정보 저장 중 네트워크 오류가 발생했습니다.', 'error');
    }
  };

  useDeferredLoad(fetchOverviewData);

  return {
    summary,
    recentPoints,
    injuredSummary,
    loading,
    injuryModal,
    setInjuryModal,
    fetchOverviewData,
    handleSaveInjury,
  };
}
