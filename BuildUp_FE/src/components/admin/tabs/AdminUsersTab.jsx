import React from 'react';
import { useAdminUsers } from '../../../hooks/useAdminUsers.js';

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
    fetchUsers,
    handleSaveRole,
    handleSavePoints,
  } = useAdminUsers({ showAlert });

  return (
    <div>
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">전체 회원 및 권한/포인트 관리</h2>
          <div className="admin-filters">
            <select
              className="admin-select"
              value={userRoleFilter}
              onChange={(e) => {
                const next = e.target.value;
                setUserRoleFilter(next);
                fetchUsers(userKeyword, next);
              }}
            >
              <option value="">활성 회원 전체 (기본)</option>
              <option value="1">일반회원 (ROLE_USER - 1)</option>
              <option value="9">시스템 관리자 (ROLE_ADMIN - 9)</option>
              <option value="7">탈퇴회원 (ROLE_WITHDRAWN - 7)</option>
            </select>
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
                users.map((u) => {
                  const isWithdrawn = Number(u.roleCode) === 7;
                  const isAdminRole = Number(u.roleCode) === 9;
                  return (
                    <tr key={u.userId} style={isWithdrawn ? { opacity: 0.65, background: '#f8fafc' } : {}}>
                      <td>{u.userId}</td>
                      <td><strong>{u.loginId}</strong></td>
                      <td>{u.nickname}</td>
                      <td style={{ color: '#64748b' }}>{u.email}</td>
                      <td>
                        {isAdminRole ? (
                          <span className="badge badge--purple">관리자 (9)</span>
                        ) : isWithdrawn ? (
                          <span className="badge badge--gray">탈퇴회원 (7)</span>
                        ) : (
                          <span className="badge badge--green">일반회원 (1)</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 700, color: isWithdrawn ? '#94a3b8' : '#16744b' }}>
                        {u.point !== null ? u.point.toLocaleString() : 0} P
                      </td>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{u.createdAt}</td>
                      <td>
                        {isWithdrawn ? (
                          <span style={{ fontSize: 12, color: '#94a3b8', padding: '6px 8px' }}>
                            탈퇴 계정 (수정 불가)
                          </span>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
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
                              onClick={() => {
                                setRoleModal({
                                  userId: u.userId,
                                  nickname: u.nickname,
                                  roleCode: u.roleCode,
                                });
                              }}
                            >
                              권한 변경
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
                <select
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={roleModal.roleCode}
                  onChange={(e) => setRoleModal({ ...roleModal, roleCode: e.target.value })}
                >
                  <option value="1">일반 회원 (ROLE_USER - 1)</option>
                  <option value="9">시스템 관리자 (ROLE_ADMIN - 9)</option>
                </select>
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
                <label>조정 포인트 (지급은 +500, 차감은 -200 등)</label>
                <input
                  type="number"
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder="예: 500 또는 -300"
                  value={pointModal.amount}
                  onChange={(e) => setPointModal({ ...pointModal, amount: e.target.value })}
                />
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
    </div>
  );
}
