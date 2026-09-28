import React from 'react';
import { useAdminOverview } from '../../../hooks/useAdminOverview.js';

/**
 * [관리자 대시보드 개요 탭 - BuildUp_FE/src/components/admin/tabs/AdminOverviewTab.jsx]
 * 
 * 주요 핵심 지표(KPI), 현재 리그 부상/결장 선수 목록, 최근 포인트 변동 이력(Audit Log)을 렌더링합니다.
 */
export default function AdminOverviewTab({ onNavigateToMatches, showAlert }) {
  const {
    summary,
    recentPoints,
    injuredSummary,
    injuryModal,
    setInjuryModal,
    handleSaveInjury,
  } = useAdminOverview({ showAlert });

  return (
    <div>
      {/* 1. 핵심 KPI 카드 그리드 */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card admin-kpi-card--highlight">
          <div className="admin-kpi-card__label">활성 회원수</div>
          <div className="admin-kpi-card__value">{summary.TOTAL_USERS || 0}명</div>
          <div className="admin-kpi-card__sub">
            활동 회원 {summary.WITHDRAWN_USERS > 0 ? `(탈퇴 ${summary.WITHDRAWN_USERS}명 제외)` : ''}
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-card__label">총 등록 경기</div>
          <div className="admin-kpi-card__value">{summary.TOTAL_MATCHES || 0}경기</div>
          <div className="admin-kpi-card__sub">진행예정 {summary.SCHEDULED_MATCHES || 0}경기</div>
        </div>
        <div
          className={`admin-kpi-card ${Number(summary.MISMATCH_MATCHES || 0) > 0 ? 'admin-kpi-card--danger' : ''}`}
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateToMatches?.('MISMATCH')}
          title="클릭 시 이벤트 불일치 경기 목록으로 이동합니다"
        >
          <div className="admin-kpi-card__label">
            이벤트 불일치 경기 {Number(summary.MISMATCH_MATCHES || 0) > 0 && '⚠️'}
          </div>
          <div className="admin-kpi-card__value" style={Number(summary.MISMATCH_MATCHES || 0) > 0 ? { color: '#e11d48' } : {}}>
            {summary.MISMATCH_MATCHES || 0}경기
          </div>
          <div className="admin-kpi-card__sub">
            {Number(summary.MISMATCH_MATCHES || 0) > 0 ? '스코어-골 이벤트 불일치 (클릭하여 조회)' : '모든 경기 이벤트 정상 매칭'}
          </div>
        </div>
        <div className="admin-kpi-card admin-kpi-card--warning">
          <div className="admin-kpi-card__label">부상/결장 선수</div>
          <div className="admin-kpi-card__value">{summary.INJURED_PLAYERS || 0}명</div>
          <div className="admin-kpi-card__sub">공지 및 라인업 반영 대상</div>
        </div>
        <div className="admin-kpi-card admin-kpi-card--danger">
          <div className="admin-kpi-card__label">블라인드 제재</div>
          <div className="admin-kpi-card__value">
            {(Number(summary.BLIND_POSTS || 0) + Number(summary.BLIND_COMMENTS || 0))}건
          </div>
          <div className="admin-kpi-card__sub">
            글 {summary.BLIND_POSTS || 0}건 / 댓글 {summary.BLIND_COMMENTS || 0}건
          </div>
        </div>
        <div className="admin-kpi-card">
          <div className="admin-kpi-card__label">삭제 내역 (증거보존)</div>
          <div className="admin-kpi-card__value">
            {(Number(summary.DELETED_POSTS || 0) + Number(summary.DELETED_COMMENTS || 0))}건
          </div>
          <div className="admin-kpi-card__sub">
            글 {summary.DELETED_POSTS || 0}건 / 댓글 {summary.DELETED_COMMENTS || 0}건
          </div>
        </div>
      </div>

      {/* 2. 현재 부상 및 결장 선수 현황 */}
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">현재 리그 부상 및 결장자 현황</h2>
          <span className="badge badge--yellow">총 {injuredSummary.length}명 관리 중</span>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>구단</th>
                <th>선수명</th>
                <th>포지션</th>
                <th>상태</th>
                <th>부상 사유 및 결장 메모</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {injuredSummary.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    현재 등록된 부상 및 결장 선수가 없습니다.
                  </td>
                </tr>
              ) : (
                injuredSummary.map((item) => (
                  <tr key={item.playerId}>
                    <td><strong>{item.teamNameKor || item.teamName}</strong></td>
                    <td>{item.playerNameKor || item.playerName}</td>
                    <td>{item.detailPosition || item.mainPosition}</td>
                    <td>
                      {item.isInjured === 'Y' && <span className="badge badge--red">부상</span>}
                      {item.isSuspended === 'Y' && <span className="badge badge--purple" style={{ marginLeft: 4 }}>출장정지</span>}
                    </td>
                    <td>{item.injuryNote || '-'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-action btn-action--outline"
                        onClick={() => {
                          setInjuryModal({
                            playerId: item.playerId,
                            name: item.playerNameKor || item.playerName,
                            isInjured: item.isInjured,
                            injuryNote: item.injuryNote || '',
                            isSuspended: item.isSuspended || 'N',
                          });
                        }}
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 최근 포인트 변동 이력 (Audit Log) */}
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">최근 포인트 변동 이력 (Audit Log)</h2>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>회원 ID</th>
                <th>변동 포인트</th>
                <th>변동 후 잔액</th>
                <th>사유 내용</th>
                <th>발생 일시</th>
              </tr>
            </thead>
            <tbody>
              {recentPoints.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    최근 포인트 변동 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                recentPoints.map((item) => (
                  <tr key={item.pointHistoryId}>
                    <td>{item.pointHistoryId}</td>
                    <td>회원 #{item.userId}</td>
                    <td style={{ fontWeight: 700, color: item.amount > 0 ? '#16744b' : '#dc2626' }}>
                      {item.amount > 0 ? `+${item.amount}` : item.amount} P
                    </td>
                    <td>{item.balanceAfter} P</td>
                    <td>{item.description}</td>
                    <td style={{ color: '#64748b', fontSize: 13 }}>{item.createdAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 선수 부상/결장 정보 수정 모달 */}
      {injuryModal && (
        <div className="admin-modal-backdrop" onClick={() => setInjuryModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>선수 부상 및 결장 정보 설정</h3>
              <button type="button" className="admin-modal__close" onClick={() => setInjuryModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0', fontWeight: 700, fontSize: 16 }}>
                선수: {injuryModal.name}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="admin-form-group">
                  <label>부상 여부 (IS_INJURED)</label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={injuryModal.isInjured}
                    onChange={(e) => setInjuryModal({ ...injuryModal, isInjured: e.target.value })}
                  >
                    <option value="N">정상 (N)</option>
                    <option value="Y">부상중 (Y)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>출장 정지 (IS_SUSPENDED)</label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={injuryModal.isSuspended}
                    onChange={(e) => setInjuryModal({ ...injuryModal, isSuspended: e.target.value })}
                  >
                    <option value="N">정상 출전 가능 (N)</option>
                    <option value="Y">출장 정지 징계 (Y)</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label>부상 상세 메모 및 예상 결장 기간</label>
                <textarea
                  value={injuryModal.injuryNote}
                  onChange={(e) => setInjuryModal({ ...injuryModal, injuryNote: e.target.value })}
                  placeholder="예: 훈련 중 햄스트링 부상. 3주간 결장 예정."
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setInjuryModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSaveInjury}>
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
