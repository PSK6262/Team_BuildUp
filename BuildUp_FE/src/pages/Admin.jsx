import React, { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import AdminOverviewTab from '../components/admin/tabs/AdminOverviewTab.jsx';
import AdminMatchesTab from '../components/admin/tabs/AdminMatchesTab.jsx';
import AdminCommunityTab from '../components/admin/tabs/AdminCommunityTab.jsx';
import AdminUsersTab from '../components/admin/tabs/AdminUsersTab.jsx';
import AdminSyncTab from '../components/admin/tabs/AdminSyncTab.jsx';
import '../css/Admin.css';

/**
 * [관리자 센터 메인 셸 페이지 - BuildUp_FE/src/pages/Admin.jsx]
 * 
 * 대형 단일 컴포넌트 구조를 기능별 독립 탭 컴포넌트와 커스텀 훅으로 분할하여,
 * 최상위에서는 권한 가드, 전역 알림 및 탭 네비게이션 셸 역할만 수행합니다.
 */
export default function Admin() {
  const user = useSelector((state) => state.auth.user);
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  // 관리자 권한 여부 판별 (ROLE_ADMIN = 9)
  const isAdmin = user && (Number(user.roleCode) === 9);

  // 현재 활성 탭 ('overview' | 'matches' | 'community' | 'users' | 'sync')
  const [activeTab, setActiveTab] = useState('overview');

  // 대시보드에서 특정 조건(예: 불일치 경기)을 클릭하여 경기 탭 진입 시 전달할 초기 필터
  const [matchInitialFilter, setMatchInitialFilter] = useState(null);

  // 전역 알림 메시지 상태
  const [alert, setAlert] = useState(null);

  // 백그라운드 동기화 상태 바
  const [syncStatus, setSyncStatus] = useState(null);

  const showAlert = useCallback((message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 4000);
  }, []);

  // 비관리자 또는 미로그인 시 차단 화면
  if (!isLoggedIn || !isAdmin) {
    return (
      <main className="admin-unauthorized">
        <h2>관리자 전용 페이지</h2>
        <p>
          접근 권한이 없습니다.<br />
          이 페이지는 <strong>PL:UG 관리자(ROLE_ADMIN)</strong> 계정만 이용할 수 있습니다.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a href="/plug/mainpage" style={{ background: '#64748b' }}>메인으로 이동</a>
          <a href="/plug/login">로그인 하기</a>
        </div>
      </main>
    );
  }

  return (
    <div className="admin-container">
      {/* 1. 관리자 상단 헤더 */}
      <header className="admin-header">
        <div className="admin-header__title">
          <h1>PL:UG 관리자 센터</h1>
          <span className="admin-badge">ADMIN CONSOLE</span>
        </div>
        <div className="admin-header__user">
          <span>접속 관리자: <strong>{user?.nickname}</strong> ({user?.loginId})</span>
          <button
            type="button"
            className="admin-btn-refresh"
            onClick={() => {
              showAlert('새로고침을 위해 페이지를 갱신합니다.');
              window.location.reload();
            }}
          >
            새로고침
          </button>
        </div>
      </header>

      {/* 2. 동기화 진행 상태 알림 메시지 바 */}
      {syncStatus?.active && (
        <div className="admin-alert admin-alert--syncing">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="admin-spinner">🔄</span>
            <strong>{syncStatus.message}</strong>
          </div>
          <span style={{ fontSize: 12, opacity: 0.8 }}>서버 응답 대기 중</span>
        </div>
      )}

      {/* 3. 피드백 알림 메시지 바 */}
      {!syncStatus?.active && alert && (
        <div className={`admin-alert admin-alert--${alert.type}`}>
          <span>{alert.message}</span>
          <button type="button" className="admin-alert__close" onClick={() => setAlert(null)}>×</button>
        </div>
      )}

      {/* 4. 5대 핵심 도메인 탭 메뉴 */}
      <nav className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          대시보드 요약
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'matches' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          경기 & 부상 공지 관리
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'community' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          커뮤니티 블라인드 제재
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'users' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          회원 & 포인트 관리
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'sync' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          데이터 수동 동기화
        </button>
      </nav>

      {/* 5. 각 기능별 탭 컴포넌트 렌더링 */}
      {activeTab === 'overview' && (
        <AdminOverviewTab
          showAlert={showAlert}
          onNavigateToMatches={(filter) => {
            setMatchInitialFilter(filter);
            setActiveTab('matches');
          }}
        />
      )}

      {activeTab === 'matches' && (
        <AdminMatchesTab
          showAlert={showAlert}
          initialFilter={matchInitialFilter}
          onClearInitialFilter={() => setMatchInitialFilter(null)}
        />
      )}

      {activeTab === 'community' && (
        <AdminCommunityTab showAlert={showAlert} />
      )}

      {activeTab === 'users' && (
        <AdminUsersTab showAlert={showAlert} />
      )}

      {activeTab === 'sync' && (
        <AdminSyncTab
          showAlert={showAlert}
          setSyncStatus={setSyncStatus}
        />
      )}
    </div>
  );
}
