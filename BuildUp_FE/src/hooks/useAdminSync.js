import { useState } from 'react';
import * as adminApi from '../api/adminApi.js';

/**
 * [관리자 데이터 수동 동기화 커스텀 훅 - BuildUp_FE/src/hooks/useAdminSync.js]
 * 
 * 경기 일정, 타임라인 이벤트, AI 강제 정합성 일치, 리그 순위표, 득점 순위 등의
 * 외부 API 수동 동기화 실행 및 기간/일자 선택 상태를 전담합니다.
 */
export function useAdminSync({ showAlert, setSyncStatus }) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [matchSyncRange, setMatchSyncRange] = useState(false);
  const [matchSyncFrom, setMatchSyncFrom] = useState(todayStr);
  const [matchSyncTo, setMatchSyncTo] = useState(todayStr);

  const [eventSyncRange, setEventSyncRange] = useState(false);
  const [eventSyncFrom, setEventSyncFrom] = useState(todayStr);
  const [eventSyncTo, setEventSyncTo] = useState(todayStr);

  const [aiAlignRange, setAiAlignRange] = useState(false);
  const [aiAlignFrom, setAiAlignFrom] = useState(todayStr);
  const [aiAlignTo, setAiAlignTo] = useState(todayStr);

  const [syncLoading, setSyncLoading] = useState(false);

  // 동기화 트리거
  const handleTriggerSync = async (endpoint, paramKeyOrParams = null, paramVal = null, label = '') => {
    try {
      setSyncLoading(true);
      let actualLabel = label;
      let queryParams = {};

      if (paramKeyOrParams) {
        if (typeof paramKeyOrParams === 'object' && paramKeyOrParams !== null) {
          actualLabel = paramVal || '';
          queryParams = paramKeyOrParams;
        } else if (paramVal !== null) {
          queryParams[paramKeyOrParams] = paramVal;
        }
      }

      setSyncStatus?.({ active: true, message: `${actualLabel || '데이터'}을(를) 외부 API와 동기화하는 중입니다...` });
      const res = await adminApi.triggerDataSync(endpoint, queryParams);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        let detailMsg = '';
        if (json.data?.syncedMatches !== undefined) detailMsg = ` (${json.data.syncedMatches}건)`;
        else if (json.data?.syncedEvents !== undefined) detailMsg = ` (${json.data.syncedEvents}건)`;
        else if (json.data?.syncedPlayers !== undefined) detailMsg = ` (${json.data.syncedPlayers}명)`;
        else if (json.data?.syncedPlayersKorean !== undefined) detailMsg = ` (${json.data.syncedPlayersKorean}명 번역 완료)`;
        else if (json.data?.syncedTeamsKorean !== undefined) detailMsg = ` (${json.data.syncedTeamsKorean}개 구단 완료)`;
        else if (json.data?.syncedStaffsKorean !== undefined) detailMsg = ` (${json.data.syncedStaffsKorean}명 완료)`;
        else if (json.data?.syncedPositions !== undefined) detailMsg = ` (${json.data.syncedPositions}명 적재 완료)`;
        else if (json.data?.syncedScorers !== undefined) detailMsg = ` (${json.data.syncedScorers}명)`;
        else if (json.data?.syncedStandings !== undefined) detailMsg = ` (${json.data.syncedStandings}개 구단)`;
        else if (json.data?.updatedCount !== undefined) detailMsg = ` (${json.data.updatedCount}건 갱신)`;
        else if (json.data?.message) detailMsg = ` (${json.data.message})`;
        else if (json.data?.fixedMatches !== undefined) {
          detailMsg = ` (보정 ${json.data.fixedMatches}경기, 취소골 ${json.data.deletedEvents || 0}건 삭제)`;
        }

        showAlert?.(`${actualLabel} 동기화가 성공적으로 완료되었습니다!${detailMsg}`);
      } else {
        showAlert?.(`${actualLabel} 동기화 실패: ${json.message || '오류가 발생했습니다.'}`, 'error');
      }
    } catch {
      showAlert?.(`${label} 동기화 요청 실패: 서버 상태를 확인해주세요.`, 'error');
    } finally {
      setSyncLoading(false);
      setSyncStatus?.(null);
    }
  };

  return {
    todayStr,
    matchSyncRange,
    setMatchSyncRange,
    matchSyncFrom,
    setMatchSyncFrom,
    matchSyncTo,
    setMatchSyncTo,

    eventSyncRange,
    setEventSyncRange,
    eventSyncFrom,
    setEventSyncFrom,
    eventSyncTo,
    setEventSyncTo,

    aiAlignRange,
    setAiAlignRange,
    aiAlignFrom,
    setAiAlignFrom,
    aiAlignTo,
    setAiAlignTo,

    syncLoading,
    handleTriggerSync,
  };
}
