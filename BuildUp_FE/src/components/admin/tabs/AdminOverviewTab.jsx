import React, { useState, useMemo } from 'react';
import { useAdminOverview } from '../../../hooks/useAdminOverview.js';
import { getTeamFullNameKor } from '../../../data/communityTeams.js';
import AdminSelect from '../AdminSelect.jsx';

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

  const [visibleInjured, setVisibleInjured] = useState(10);
  const [visiblePoints, setVisiblePoints] = useState(10);

  // --- [부상/결장자 현황 검색 필터 상태] ---
  const [injuredTeamFilter, setInjuredTeamFilter] = useState('');
  const [injuredNameKeyword, setInjuredNameKeyword] = useState('');
  const [injuredPosFilter, setInjuredPosFilter] = useState('');
  const [injuredStatusFilter, setInjuredStatusFilter] = useState('');

  // 등록된 부상자 목록에서 고유 구단명 목록 자동 추출 (DB 기준 한국어 풀네임)
  const uniqueInjuredTeams = useMemo(() => {
    const set = new Set();
    injuredSummary.forEach((i) => {
      const name = getTeamFullNameKor(i.teamId, i.teamNameKor || i.teamName);
      if (name) set.add(name);
    });
    return Array.from(set).sort();
  }, [injuredSummary]);

  // 부상자 필터링 결과
  const filteredInjured = useMemo(() => {
    return injuredSummary.filter((item) => {
      if (injuredTeamFilter) {
        const team = getTeamFullNameKor(item.teamId, item.teamNameKor || item.teamName || '');
        if (team !== injuredTeamFilter) return false;
      }
      if (injuredNameKeyword.trim()) {
        const kw = injuredNameKeyword.trim().toLowerCase();
        const kor = (item.playerNameKor || '').toLowerCase();
        const eng = (item.playerName || '').toLowerCase();
        if (!kor.includes(kw) && !eng.includes(kw)) return false;
      }
      if (injuredPosFilter) {
        const pos = (item.detailPosition || item.mainPosition || '').toUpperCase();
        if (!pos.includes(injuredPosFilter.toUpperCase())) return false;
      }
      if (injuredStatusFilter === 'INJURED' && item.isInjured !== 'Y') return false;
      if (injuredStatusFilter === 'SUSPENDED' && item.isSuspended !== 'Y') return false;
      if (injuredStatusFilter === 'BOTH' && (item.isInjured !== 'Y' || item.isSuspended !== 'Y')) return false;
      return true;
    });
  }, [injuredSummary, injuredTeamFilter, injuredNameKeyword, injuredPosFilter, injuredStatusFilter]);

  // --- [Audit Log 검색 필터 상태] ---
  const [auditUserKeyword, setAuditUserKeyword] = useState('');
  const [auditAdminFilter, setAuditAdminFilter] = useState('');
  const [auditAdminKeyword, setAuditAdminKeyword] = useState('');

  // 포인트 이력 필터링 결과
  const filteredPoints = useMemo(() => {
    return recentPoints.filter((item) => {
      if (auditUserKeyword.trim()) {
        const kw = auditUserKeyword.trim().toLowerCase();
        const nick = (item.nickname || '').toLowerCase();
        const uId = String(item.userId || '');
        const login = (item.loginId || '').toLowerCase();
        if (!nick.includes(kw) && !uId.includes(kw) && !login.includes(kw)) return false;
      }
      const desc = item.description || '';
      const isSystem = Boolean(item.predictionId || desc.includes('[시스템]'));
      if (auditAdminFilter === 'SYSTEM' && !isSystem) return false;
      if (auditAdminFilter === 'ADMIN' && isSystem) return false;

      if (auditAdminKeyword.trim()) {
        const kw = auditAdminKeyword.trim().toLowerCase();
        if (!desc.toLowerCase().includes(kw)) return false;
      }
      return true;
    });
  }, [recentPoints, auditUserKeyword, auditAdminFilter, auditAdminKeyword]);

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
          <div>
            <h2 className="admin-section__title">현재 리그 부상 및 결장자 현황</h2>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              총 {injuredSummary.length}명 관리 중 {filteredInjured.length !== injuredSummary.length && `(검색 결과: ${filteredInjured.length}명)`}
            </div>
          </div>
          <div className="admin-filters">
            {/* 1. 구단별 검색 */}
            <AdminSelect
              className="admin-select"
              value={injuredTeamFilter}
              onChange={(e) => {
                setInjuredTeamFilter(e.target.value);
                setVisibleInjured(10);
              }}
              title="구단별 필터"
            >
              <option value="">전체 구단</option>
              {uniqueInjuredTeams.map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </AdminSelect>

            {/* 2. 포지션별 검색 */}
            <AdminSelect
              className="admin-select"
              value={injuredPosFilter}
              onChange={(e) => {
                setInjuredPosFilter(e.target.value);
                setVisibleInjured(10);
              }}
              title="포지션별 필터"
            >
              <option value="">전체 포지션</option>
              <option value="FW">공격수 (FW)</option>
              <option value="MF">미드필더 (MF)</option>
              <option value="DF">수비수 (DF)</option>
              <option value="GK">골키퍼 (GK)</option>
            </AdminSelect>

            {/* 3. 상태별 검색 */}
            <AdminSelect
              className="admin-select"
              value={injuredStatusFilter}
              onChange={(e) => {
                setInjuredStatusFilter(e.target.value);
                setVisibleInjured(10);
              }}
              title="상태별 필터"
            >
              <option value="">전체 상태</option>
              <option value="INJURED">부상중</option>
              <option value="SUSPENDED">출장정지</option>
              <option value="BOTH">부상 & 정지</option>
            </AdminSelect>

            {/* 4. 선수명별 검색 */}
            <input
              type="text"
              className="admin-input"
              placeholder="선수명 검색 (한글/영문)"
              value={injuredNameKeyword}
              onChange={(e) => {
                setInjuredNameKeyword(e.target.value);
                setVisibleInjured(10);
              }}
              style={{ width: 170 }}
            />

            {(injuredTeamFilter || injuredNameKeyword || injuredPosFilter || injuredStatusFilter) && (
              <button
                type="button"
                className="btn-action btn-action--outline"
                onClick={() => {
                  setInjuredTeamFilter('');
                  setInjuredNameKeyword('');
                  setInjuredPosFilter('');
                  setInjuredStatusFilter('');
                  setVisibleInjured(10);
                }}
              >
                초기화
              </button>
            )}
          </div>
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
              {filteredInjured.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    {injuredSummary.length === 0 ? '현재 등록된 부상 및 결장 선수가 없습니다.' : '일치하는 부상/결장 선수가 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredInjured.slice(0, visibleInjured).map((item) => (
                  <tr key={item.playerId}>
                    <td data-label="구단"><strong>{getTeamFullNameKor(item.teamId, item.teamNameKor || item.teamName)}</strong></td>
                    <td data-label="선수명">{item.playerNameKor || item.playerName}</td>
                    <td data-label="포지션">{item.detailPosition || item.mainPosition}</td>
                    <td data-label="상태">
                      {item.isInjured === 'Y' && <span className="badge badge--red">부상</span>}
                      {item.isSuspended === 'Y' && <span className="badge badge--purple" style={{ marginLeft: 4 }}>출장정지</span>}
                    </td>
                    <td data-label="부상/결장 메모">{item.injuryNote || '-'}</td>
                    <td data-label="관리">
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
        {filteredInjured.length > visibleInjured && (
          <div className="admin-load-more-wrap">
            <button
              type="button"
              className="admin-load-more-btn"
              onClick={() => setVisibleInjured((prev) => prev + 10)}
            >
              10명 더보기 ▾ ({Math.min(visibleInjured, filteredInjured.length)} / {filteredInjured.length})
            </button>
          </div>
        )}
      </section>

      {/* 3. 최근 포인트 변동 이력 (Audit Log) */}
      <section className="admin-section">
        <div className="admin-section__header">
          <div>
            <h2 className="admin-section__title">최근 포인트 변동 이력 (Audit Log)</h2>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              최근 {recentPoints.length}건 기록 {filteredPoints.length !== recentPoints.length && `(검색 결과: ${filteredPoints.length}건)`}
            </div>
          </div>
          <div className="admin-filters">
            {/* 1. 처리 주체 분류 필터 */}
            <AdminSelect
              className="admin-select"
              value={auditAdminFilter}
              onChange={(e) => {
                setAuditAdminFilter(e.target.value);
                setVisiblePoints(10);
              }}
              title="처리 주체 분류"
            >
              <option value="">전체 처리자</option>
              <option value="ADMIN">관리자 직권</option>
              <option value="SYSTEM">시스템 (승부예측)</option>
            </AdminSelect>

            {/* 2. 회원 닉네임/ID 검색 */}
            <input
              type="text"
              className="admin-input"
              placeholder="회원 닉네임 / ID 검색"
              value={auditUserKeyword}
              onChange={(e) => {
                setAuditUserKeyword(e.target.value);
                setVisiblePoints(10);
              }}
              style={{ width: 170 }}
            />

            {/* 3. 처리한 관리자명 검색 */}
            <input
              type="text"
              className="admin-input"
              placeholder="처리 관리자명 검색"
              value={auditAdminKeyword}
              onChange={(e) => {
                setAuditAdminKeyword(e.target.value);
                setVisiblePoints(10);
              }}
              style={{ width: 170 }}
            />

            {(auditUserKeyword || auditAdminFilter || auditAdminKeyword) && (
              <button
                type="button"
                className="btn-action btn-action--outline"
                onClick={() => {
                  setAuditUserKeyword('');
                  setAuditAdminFilter('');
                  setAuditAdminKeyword('');
                  setVisiblePoints(10);
                }}
              >
                초기화
              </button>
            )}
          </div>
        </div>
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>번호</th>
                <th>회원 ID</th>
                <th>회원 닉네임</th>
                <th>변동 포인트</th>
                <th>변동 후 잔액</th>
                <th>사유 내용</th>
                <th>발생 일시</th>
              </tr>
            </thead>
            <tbody>
              {filteredPoints.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    {recentPoints.length === 0 ? '최근 포인트 변동 내역이 없습니다.' : '일치하는 포인트 변동 내역이 없습니다.'}
                  </td>
                </tr>
              ) : (
                filteredPoints.slice(0, visiblePoints).map((item) => (
                  <tr key={item.pointHistoryId}>
                    <td data-label="번호">{item.pointHistoryId}</td>
                    <td data-label="회원 ID"><strong>{item.userId}</strong></td>
                    <td data-label="회원 닉네임">{item.nickname || <span style={{ color: '#94a3b8' }}>-</span>}</td>
                    <td data-label="변동 포인트" style={{ fontWeight: 700, color: item.amount > 0 ? '#16744b' : '#dc2626' }}>
                      {item.amount > 0 ? `+${item.amount.toLocaleString()}` : `${item.amount.toLocaleString()}`} P
                    </td>
                    <td data-label="변동 후 잔액">{item.balanceAfter != null ? item.balanceAfter.toLocaleString() : '-'} P</td>
                    <td data-label="사유 내용">
                      {(() => {
                        const desc = item.description || '';
                        const match = desc.match(/^(\[[^\]]+\])\s*(.*)$/);
                        if (match) {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span className="badge badge--purple">{match[1]}</span>
                              <span>{match[2]}</span>
                            </div>
                          );
                        }
                        if (item.predictionId) {
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span className="badge badge--blue">[시스템]</span>
                              <span>{desc}</span>
                            </div>
                          );
                        }
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span className="badge badge--purple">[관리자 직권]</span>
                            <span>{desc}</span>
                          </div>
                        );
                      })()}
                    </td>
                    <td data-label="발생 일시" style={{ color: '#64748b', fontSize: 13, whiteSpace: 'nowrap' }}>{item.createdAt}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredPoints.length > visiblePoints && (
          <div className="admin-load-more-wrap">
            <button
              type="button"
              className="admin-load-more-btn"
              onClick={() => setVisiblePoints((prev) => prev + 10)}
            >
              10개 더보기 ▾ ({Math.min(visiblePoints, filteredPoints.length)} / {filteredPoints.length})
            </button>
          </div>
        )}
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
                  <AdminSelect
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={injuryModal.isInjured}
                    onChange={(e) => setInjuryModal({ ...injuryModal, isInjured: e.target.value })}
                  >
                    <option value="N">정상 (N)</option>
                    <option value="Y">부상중 (Y)</option>
                  </AdminSelect>
                </div>
                <div className="admin-form-group">
                  <label>출장 정지 (IS_SUSPENDED)</label>
                  <AdminSelect
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={injuryModal.isSuspended}
                    onChange={(e) => setInjuryModal({ ...injuryModal, isSuspended: e.target.value })}
                  >
                    <option value="N">정상 출전 가능 (N)</option>
                    <option value="Y">출장 정지 징계 (Y)</option>
                  </AdminSelect>
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
