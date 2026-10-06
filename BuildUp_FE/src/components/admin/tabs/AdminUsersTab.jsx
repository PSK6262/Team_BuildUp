import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useAdminUsers } from '../../../hooks/useAdminUsers.js';
import AdminSelect from '../AdminSelect.jsx';

/**
 * [관리자 회원 & 포인트 관리 탭 - BuildUp_FE/src/components/admin/tabs/AdminUsersTab.jsx]
 * 
 * 전체 회원 목록 조회, 검색/등급 필터링, 권한 변경 및 포인트 수동 지급/차감 모달을 전담하는 컴포넌트입니다.
 */
export default function AdminUsersTab({ showAlert }) {
  const {
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
    dummyLockModal,
    setDummyLockModal,
    resolvingDummy,
    fetchUsers,
    handleSaveRole,
    handleSavePoints,
    handleResolveDummyAndSavePoints,
  } = useAdminUsers({ showAlert });

  const currentUser = useSelector((state) => state.auth?.user);
  const isSuperAdmin = currentUser && Number(currentUser.roleCode) === 9;
  const [visibleUsers, setVisibleUsers] = useState(10);

  return (
    <div>
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">전체 회원 및 권한/포인트 관리</h2>
          <div className="admin-filters">
            <AdminSelect
              className="admin-select"
              value={userRoleFilter}
              onChange={(e) => {
                const next = e.target.value;
                setUserRoleFilter(next);
                fetchUsers(userKeyword, next);
              }}
            >
              <option value="">전체 회원</option>
              <option value="1">일반회원</option>
              <option value="8">부매니저 (부관리자)</option>
              <option value="9">매니저 (최고관리자)</option>
              <option value="7">탈퇴회원</option>
            </AdminSelect>
            <input
              type="text"
              className="admin-input"
              placeholder="아이디, 닉네임, 이메일 검색"
              value={userKeyword}
              onChange={(e) => setUserKeyword(e.target.value)}
            />
            <button type="button" className="btn-action btn-action--primary" onClick={() => fetchUsers()}>
              검색
            </button>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>회원ID</th>
                <th>로그인 아이디</th>
                <th>닉네임</th>
                <th>이메일</th>
                <th>권한 등급</th>
                <th>보유 포인트</th>
                <th>가입일시</th>
                <th>관리 액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 회원 데이터를 동기화하는 중입니다...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>일치하는 회원이 없습니다.</td></tr>
              ) : (
                users.slice(0, visibleUsers).map((u) => {
                  const uRole = Number(u.roleCode);
                  const isWithdrawn = uRole === 7;
                  const isSuperAdminRole = uRole === 9;
                  const isSubAdminRole = uRole === 8;
                  const isRootManager = String(u.loginId || '').toUpperCase() === 'BUILDUP62';
                  const cannotEditRole = (!isSuperAdmin && isSuperAdminRole) || isRootManager;

                  return (
                    <tr key={u.userId} style={isWithdrawn ? { opacity: 0.65, background: '#f8fafc' } : {}}>
                      <td data-label="회원ID">{u.userId}</td>
                      <td data-label="로그인 아이디"><strong>{u.loginId}</strong></td>
                      <td data-label="닉네임">{u.nickname}</td>
                      <td data-label="이메일" style={{ color: '#64748b' }}>{u.email}</td>
                      <td data-label="권한 등급">
                        {isSuperAdminRole ? (
                          <span className="badge badge--purple">매니저 (최고관리자)</span>
                        ) : isSubAdminRole ? (
                          <span className="badge badge--blue" style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#0284c7', border: '1px solid rgba(14, 165, 233, 0.35)' }}>부매니저 (부관리자)</span>
                        ) : isWithdrawn ? (
                          <span className="badge badge--gray">탈퇴회원</span>
                        ) : (
                          <span className="badge badge--green">일반회원</span>
                        )}
                      </td>
                      <td data-label="보유 포인트" style={{ fontWeight: 700, color: isWithdrawn ? '#94a3b8' : '#16744b' }}>
                        {u.point !== null ? u.point.toLocaleString() : 0} P
                      </td>
                      <td data-label="가입일시" style={{ color: '#64748b', fontSize: 13 }}>{u.createdAt}</td>
                      <td data-label="관리 액션">
                        {isWithdrawn ? (
                          <span style={{ fontSize: 12, color: '#94a3b8', padding: '6px 8px' }}>
                            탈퇴 계정 (수정 불가)
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="btn-action btn-action--outline"
                              onClick={() => {
                                setPointModal({
                                  userId: u.userId,
                                  nickname: u.nickname,
                                  amount: '',
                                  description: '',
                                });
                              }}
                            >
                              포인트 조정
                            </button>
                            <button
                              type="button"
                              className="btn-action btn-action--warning"
                              disabled={cannotEditRole}
                              title={
                                isRootManager
                                  ? 'BUILDUP62 최고 매니저 계정의 권한은 변경할 수 없습니다.'
                                  : cannotEditRole
                                  ? '부매니저는 최고관리자(매니저)의 권한을 변경할 수 없습니다.'
                                  : undefined
                              }
                              onClick={() => {
                                if (cannotEditRole) return;
                                setRoleModal({
                                  userId: u.userId,
                                  nickname: u.nickname,
                                  roleCode: String(u.roleCode),
                                });
                              }}
                            >
                              {isRootManager ? '고정 매니저' : cannotEditRole ? '변경 불가' : '권한 변경'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {users.length > visibleUsers && (
          <div className="admin-load-more-wrap">
            <button
              type="button"
              className="admin-load-more-btn"
              onClick={() => setVisibleUsers((prev) => prev + 10)}
            >
              10명 더보기 ▾ ({Math.min(visibleUsers, users.length)} / {users.length})
            </button>
          </div>
        )}
      </section>

      {/* 1. 회원 권한 변경 모달 */}
      {roleModal && (
        <div className="admin-modal-backdrop" onClick={() => setRoleModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>회원 권한 등급 변경</h3>
              <button type="button" className="admin-modal__close" onClick={() => setRoleModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0' }}>
                대상 회원: <strong>{roleModal.nickname}</strong>
              </p>
              <div className="admin-form-group">
                <label>권한 등급 선택</label>
                <AdminSelect
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={String(roleModal.roleCode)}
                  onChange={(e) => setRoleModal({ ...roleModal, roleCode: e.target.value })}
                >
                  <option value="1">일반회원</option>
                  <option value="8">부매니저 (부관리자)</option>
                  {isSuperAdmin && <option value="9">매니저 (최고관리자)</option>}
                </AdminSelect>
                {!isSuperAdmin && (
                  <small style={{ color: '#64748b', fontSize: 12, marginTop: 6, display: 'block' }}>
                    * 부매니저(부관리자)는 일반회원 및 부매니저 등급까지만 권한을 변경할 수 있습니다.
                  </small>
                )}
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setRoleModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSaveRole}>
                변경 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 포인트 지급/차감 모달 */}
      {pointModal && (
        <div className="admin-modal-backdrop" onClick={() => setPointModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>포인트 직권 지급 / 차감</h3>
              <button type="button" className="admin-modal__close" onClick={() => setPointModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0' }}>
                대상 회원: <strong>{pointModal.nickname}</strong>
              </p>
              <div className="admin-form-group">
                <label>조정 포인트 (지급은 +500, 차감은 -200 등, 최대 ±10,000P)</label>
                <input
                  type="number"
                  className="admin-input"
                  style={{ width: '100%' }}
                  min="-10000"
                  max="10000"
                  placeholder="예: 500 또는 -300 (최대 ±10,000P)"
                  value={pointModal.amount}
                  onChange={(e) => setPointModal({ ...pointModal, amount: e.target.value })}
                />
                <small style={{ color: '#64748b', fontSize: 12, marginTop: 4, display: 'block' }}>
                  * 한 번에 변경할 수 있는 포인트는 최대 ±10,000P로 제한됩니다.
                </small>
              </div>
              <div className="admin-form-group">
                <label>조정 사유 (이력 로그 기록용)</label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder="예: 승부예측 이벤트 보상 지급"
                  value={pointModal.description}
                  onChange={(e) => setPointModal({ ...pointModal, description: e.target.value })}
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setPointModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSavePoints}>
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 임시 경기 존재 시 포인트 변동 차단 및 원클릭 해결 모달 */}
      {dummyLockModal && (
        <div className="admin-modal-backdrop" onClick={() => setDummyLockModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>🔒 포인트 변동 제한 안내 (임시 경기 진행 중)</h3>
              <button type="button" className="admin-modal__close" onClick={() => setDummyLockModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <div
                style={{
                  background: '#fff1f2',
                  border: '1px solid #fecdd3',
                  borderRadius: 10,
                  padding: '14px 16px',
                  color: '#9f1239',
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  marginBottom: 14,
                }}
              >
                <strong>⚠️ 임시(더미) 경기가 존재하는 동안에는 다른 포인트 변동이 금지됩니다.</strong>
                <p style={{ margin: '8px 0 0 0', color: '#be123c' }}>
                  {dummyLockModal.message}
                </p>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                아래 <strong>[임시 경기 일괄 삭제 후 포인트 적용]</strong> 버튼을 누르면 테스트용 더미 경기와 관련 결과를 안전하게 초기화한 뒤 요청하신 포인트 조정을 즉시 완료합니다.
              </p>
            </div>
            <div className="admin-modal__footer">
              <button
                type="button"
                className="btn-action btn-action--outline"
                onClick={() => setDummyLockModal(null)}
                disabled={resolvingDummy}
              >
                닫기
              </button>
              <button
                type="button"
                className="btn-action btn-action--danger"
                onClick={handleResolveDummyAndSavePoints}
                disabled={resolvingDummy}
              >
                {resolvingDummy ? '정리 중...' : '🗑️ 임시 경기 일괄 삭제 후 포인트 적용'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
