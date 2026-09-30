import { usePendingRequests } from './usePendingRequests.js';
import { useState, useCallback } from 'react';
import { useDeferredLoad } from './useDeferredLoad.js';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice.js';
import * as adminApi from '../api/adminApi.js';

/**
 * [관리자 회원 및 포인트 관리 커스텀 훅 - BuildUp_FE/src/hooks/useAdminUsers.js]
 * 
 * 회원 목록 조회, 검색/등급 필터링, 회원 권한 등급 변경 모달, 포인트 직권 지급/차감 모달 로직을 전담합니다.
 */
export function useAdminUsers({ showAlert }) {
  const dispatch = useDispatch();

  const [users, setUsers] = useState([]);
  const [userKeyword, setUserKeyword] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [loading, trackRequest] = usePendingRequests();

  // 모달 상태
  const [roleModal, setRoleModal] = useState(null);   // { userId, nickname, roleCode }
  const [pointModal, setPointModal] = useState(null); // { userId, nickname, amount, description }

  // 1. 회원 목록 조회
  const fetchUsers = useCallback(async (overrideKeyword, overrideRole) => {
    trackRequest(true);
    try {
      const keywordToUse = overrideKeyword !== undefined ? overrideKeyword : userKeyword;
      const roleToUse = overrideRole !== undefined ? overrideRole : userRoleFilter;

      const res = await adminApi.getAdminUsers({
        keyword: keywordToUse,
        roleCode: roleToUse,
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
        setUsers(json.data);
      }
    } catch (e) {
      console.warn('회원 목록 조회 실패', e);
    } finally {
      trackRequest(false);
    }
  }, [userKeyword, userRoleFilter, dispatch, showAlert, trackRequest]);

  // 마운트 시 회원 목록 로드
  useDeferredLoad(fetchUsers);

  // 회원 권한 등급 변경
  const handleSaveRole = async () => {
    if (!roleModal) return;
    try {
      const res = await adminApi.updateUserRole(roleModal.userId, roleModal.roleCode);
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('회원 권한 등급이 변경되었습니다.');
        setRoleModal(null);
        fetchUsers();
      } else {
        showAlert?.('권한 변경 실패', 'error');
      }
    } catch {
      showAlert?.('권한 변경 중 통신 오류가 발생했습니다.', 'error');
    }
  };

  // 포인트 직권 지급/차감 (한번에 최대 +-10,000P 제한)
  const handleSavePoints = async () => {
    if (!pointModal || pointModal.amount === '' || pointModal.amount === null) {
      showAlert?.('변경할 포인트를 입력해주세요.', 'error');
      return;
    }
    const amountNum = Number(pointModal.amount);
    if (isNaN(amountNum) || amountNum === 0) {
      showAlert?.('0이 아닌 유효한 포인트 숫자를 입력해주세요.', 'error');
      return;
    }
    if (amountNum > 10000 || amountNum < -10000) {
      showAlert?.('한 번에 변경할 수 있는 포인트는 최대 ±10,000P 입니다.', 'error');
      return;
    }

    try {
      const res = await adminApi.adjustUserPoints(pointModal.userId, {
        amount: amountNum,
        description: pointModal.description || '관리자 수동 조정',
      });
      const json = await res.json();
      if (json.code === 'SUC_001') {
        showAlert?.('포인트가 정상적으로 지급/차감되었습니다.');
        setPointModal(null);
        fetchUsers();
      } else {
        showAlert?.(json.message || '포인트 조정 실패', 'error');
      }
    } catch {
      showAlert?.('포인트 조정 중 통신 오류가 발생했습니다.', 'error');
    }
  };

  return {
    users,
    userKeyword,
    setUserKeyword,
    userRoleFilter,
    setUserRoleFilter,
    loading,
    roleModal,
    setRoleModal,
    pointModal,
    setPointModal,
    fetchUsers,
    handleSaveRole,
    handleSavePoints,
  };
}
