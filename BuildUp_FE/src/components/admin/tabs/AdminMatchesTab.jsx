import React, { useState } from 'react';
import { useAdminMatches } from '../../../hooks/useAdminMatches.js';
import { communityTeams, getTeamFullNameKor } from '../../../data/communityTeams.js';
import AdminSelect from '../AdminSelect.jsx';

/**
 * [관리자 경기 & 부상 관리 탭 - BuildUp_FE/src/components/admin/tabs/AdminMatchesTab.jsx]
 * 
 * 경기 일정 및 스코어 조회/정정, 공지사항 등록, 경기 타임라인 이벤트 상세 검증(AI 조언 포함),
 * 구단별 선수 부상/출장정지 관리를 전담하는 모듈화 컴포넌트입니다.
 */
export default function AdminMatchesTab({ showAlert, initialFilter, onClearInitialFilter }) {
  const {
    matches,
    matchStartDate,
    setMatchStartDate,
    matchEndDate,
    setMatchEndDate,
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
  } = useAdminMatches({ showAlert, initialFilter, onClearInitialFilter });

  const [visibleMatches, setVisibleMatches] = useState(10);
  const [visibleTeamPlayers, setVisibleTeamPlayers] = useState(10);

  return (
    <div>
      {/* 1. 경기 목록 & 공지사항 수정 섹션 */}
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">경기 일정 및 결장/알림 공지 관리</h2>
          <div className="admin-filters">
            <div className="admin-date-range">
              <input
                type="date"
                className="admin-input"
                value={matchStartDate}
                onChange={(e) => setMatchStartDate(e.target.value)}
                title="조회 시작일 (From)"
              />
              <span className="admin-date-separator">~</span>
              <input
                type="date"
                className="admin-input"
                value={matchEndDate}
                onChange={(e) => setMatchEndDate(e.target.value)}
                title="조회 종료일 (To)"
              />
            </div>
            <AdminSelect
              className="admin-select"
              value={matchStatusFilter}
              onChange={(e) => {
                const nextStatus = e.target.value;
                setMatchStatusFilter(nextStatus);
                setVisibleMatches(10);
              }}
            >
              <option value="">모든 경기 상태</option>
              <option value="LIVE">진행중 (LIVE)</option>
              <option value="CANCELLED_OR_POSTPONED">취소 및 연기됨</option>
              <option value="MISMATCH">⚠️ 스코어-이벤트 불일치 경기</option>
            </AdminSelect>
            <AdminSelect
              className="admin-select"
              value={matchSortOrder}
              onChange={(e) => {
                setMatchSortOrder(e.target.value);
                setVisibleMatches(10);
              }}
              title="정렬 기준"
            >
              <option value="AUTO">자동 정렬 (상태 기준)</option>
              <option value="ASC">오름차순 (ASC ⏶)</option>
              <option value="DESC">내림차순 (DESC ⏷)</option>
            </AdminSelect>
            <button
              type="button"
              className="btn-action btn-action--primary"
              onClick={() => {
                setVisibleMatches(10);
                fetchMatches();
              }}
            >
              조회
            </button>
          </div>
        </div>

        {/* 스코어-이벤트 불일치 안내 배너 */}
        {mismatchCount > 0 && (
          <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: 8,
            padding: '12px 18px',
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#be123c', fontWeight: 600, fontSize: 13 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span>
                현재 공식 스코어와 골 타임라인 이벤트가 일치하지 않는 경기가 <strong>{mismatchCount}건</strong> 있습니다.
                AI가 임의로 수정하지 않도록 안전 조치되었으므로, 관리자가 직접 <strong>[이벤트 관리]</strong>를 통해 취소골을 삭제하거나 스코어를 정정해주세요.
              </span>
            </div>
            {matchStatusFilter !== 'MISMATCH' && (
              <button
                type="button"
                className="btn-action btn-action--danger"
                style={{ fontSize: 12, padding: '6px 12px', whiteSpace: 'nowrap' }}
                onClick={() => {
                  setMatchStatusFilter('MISMATCH');
                  setMatchSortOrder('DESC');
                  setVisibleMatches(10);
                  fetchMatches({ status: 'MISMATCH', sort: 'DESC' });
                }}
              >
                불일치 경기만 모아보기 ({mismatchCount}건)
              </button>
            )}
          </div>
        )}

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>경기일시</th>
                <th>매치업</th>
                <th>스코어</th>
                <th>상태</th>
                <th>공지사항</th>
                <th>관리 액션</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 경기 데이터를 동기화하는 중입니다...</td></tr>
              ) : matches.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>해당 조건의 경기가 없습니다.</td></tr>
              ) : (
                matches.slice(0, visibleMatches).map((m) => {
                  const isMismatch = m.status === 'FINISHED' && m.homeScore !== null && m.awayScore !== null &&
                    ((m.homeScore !== (m.homeGoalEvents ?? 0)) || (m.awayScore !== (m.awayGoalEvents ?? 0)));

                  return (
                    <tr key={m.matchId} style={isMismatch ? { background: '#fff5f5' } : {}}>
                      <td data-label="경기일시" style={{ whiteSpace: 'nowrap' }}>{m.matchDate}</td>
                      <td data-label="매치업">
                        <div className="match-team-cell">
                          {m.homeEmblemUrl && <img src={m.homeEmblemUrl} alt="" className="match-emblem" />}
                          <span className="match-team-name" title={getTeamFullNameKor(m.homeTeamId, m.homeTeamNameKor || m.homeTeamName)}>
                            {getTeamFullNameKor(m.homeTeamId, m.homeTeamNameKor || m.homeTeamName)}
                          </span>
                          <span className="match-vs-tag">vs</span>
                          {m.awayEmblemUrl && <img src={m.awayEmblemUrl} alt="" className="match-emblem" />}
                          <span className="match-team-name" title={getTeamFullNameKor(m.awayTeamId, m.awayTeamNameKor || m.awayTeamName)}>
                            {getTeamFullNameKor(m.awayTeamId, m.awayTeamNameKor || m.awayTeamName)}
                          </span>
                        </div>
                      </td>
                      <td data-label="스코어" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <div>
                          {m.homeScore !== null && m.awayScore !== null
                            ? `${m.homeScore} : ${m.awayScore}`
                            : '-'}
                        </div>
                        {isMismatch && (
                          <div style={{ marginTop: 4 }}>
                            <span
                              className="badge badge--red"
                              title={`공식 스코어 (${m.homeScore}:${m.awayScore}) vs 골 이벤트 (${m.homeGoalEvents ?? 0}:${m.awayGoalEvents ?? 0}) - 총 이벤트 ${m.totalEvents ?? 0}건`}
                              style={{ fontSize: 11, cursor: 'help' }}
                            >
                              ⚠️ 불일치 (이벤트 {m.homeGoalEvents ?? 0}:{m.awayGoalEvents ?? 0})
                            </span>
                          </div>
                        )}
                      </td>
                      <td data-label="상태">
                        <span className={`badge ${
                          m.status === 'FINISHED' ? 'badge--gray' :
                          m.status === 'LIVE' ? 'badge--red' : 'badge--green'
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td data-label="공지사항">
                        {m.notice ? (
                          <span className="match-notice-text" title={m.notice}>📢 {m.notice}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: 13 }}>공지 없음</span>
                        )}
                      </td>
                      <td data-label="관리 액션">
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={`btn-action ${isMismatch ? 'btn-action--danger' : 'btn-action--outline'}`}
                            onClick={() => handleOpenEventModal(m)}
                            title="경기 타임라인 상세 이벤트 목록 확인 및 관리"
                          >
                            {isMismatch ? '⚠️ 이벤트 관리' : '이벤트 확인'}
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action--warning"
                            onClick={() => {
                              setNoticeModal({
                                matchId: m.matchId,
                                title: `${getTeamFullNameKor(m.homeTeamId, m.homeTeamNameKor || m.homeTeamName)} vs ${getTeamFullNameKor(m.awayTeamId, m.awayTeamNameKor || m.awayTeamName)}`,
                                notice: m.notice || '',
                              });
                            }}
                          >
                            공지 편집
                          </button>
                          <button
                            type="button"
                            className="btn-action btn-action--outline"
                            onClick={() => {
                              setScoreModal({
                                matchId: m.matchId,
                                title: `${getTeamFullNameKor(m.homeTeamId, m.homeTeamNameKor || m.homeTeamName)} vs ${getTeamFullNameKor(m.awayTeamId, m.awayTeamNameKor || m.awayTeamName)}`,
                                homeScore: m.homeScore !== null ? m.homeScore : '',
                                awayScore: m.awayScore !== null ? m.awayScore : '',
                                status: m.status,
                              });
                            }}
                          >
                            스코어 정정
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {matches.length > visibleMatches && (
          <div className="admin-load-more-wrap">
            <button
              type="button"
              className="admin-load-more-btn"
              onClick={() => setVisibleMatches((prev) => prev + 10)}
            >
              10경기 더보기 ▾ ({Math.min(visibleMatches, matches.length)} / {matches.length})
            </button>
          </div>
        )}
      </section>

      {/* 2. 구단별 선수 부상 현황 관리 섹션 */}
      <section className="admin-section">
        <div className="admin-section__header">
          <h2 className="admin-section__title">구단별 선수단 부상 및 출장정지 관리</h2>
          <div className="admin-filters">
            <AdminSelect
              className="admin-select"
              value={selectedTeamId}
              onChange={(e) => {
                const tId = Number(e.target.value);
                setSelectedTeamId(tId);
                fetchTeamPlayers(tId);
                setVisibleTeamPlayers(10);
              }}
            >
              {communityTeams.map((t) => (
                <option key={t.teamId} value={t.teamId}>
                  {t.fullNameKor || t.name}
                </option>
              ))}
            </AdminSelect>
          </div>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>선수명</th>
                <th>한글명</th>
                <th>포지션</th>
                <th>부상 여부</th>
                <th>출장 정지</th>
                <th>결장 사유 메모</th>
                <th>수정</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 선수 데이터를 동기화하는 중입니다...</td></tr>
              ) : teamPlayers.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>선수 데이터가 없습니다.</td></tr>
              ) : (
                teamPlayers.slice(0, visibleTeamPlayers).map((p) => (
                  <tr key={p.playerId}>
                    <td data-label="선수명"><strong>{p.playerName}</strong></td>
                    <td data-label="한글명">{p.playerNameKor || '-'}</td>
                    <td data-label="포지션">
                      <span className="badge badge--blue">{p.detailPosition || p.mainPosition}</span>
                    </td>
                    <td data-label="부상 여부">
                      {p.isInjured === 'Y' ? (
                        <span className="badge badge--red">부상중 (Y)</span>
                      ) : (
                        <span className="badge badge--green">정상 (N)</span>
                      )}
                    </td>
                    <td data-label="출장 정지">
                      {p.isSuspended === 'Y' ? (
                        <span className="badge badge--purple">정지 (Y)</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>N</span>
                      )}
                    </td>
                    <td data-label="결장 사유 메모" style={{ maxWidth: 300, color: '#d97706' }}>
                      {p.injuryNote || '-'}
                    </td>
                    <td data-label="수정">
                      <button
                        type="button"
                        className="btn-action btn-action--outline"
                        onClick={() => {
                          setInjuryModal({
                            playerId: p.playerId,
                            name: p.playerNameKor || p.playerName,
                            isInjured: p.isInjured || 'N',
                            injuryNote: p.injuryNote || '',
                            isSuspended: p.isSuspended || 'N',
                          });
                        }}
                      >
                        부상 설정
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {teamPlayers.length > visibleTeamPlayers && (
          <div className="admin-load-more-wrap">
            <button
              type="button"
              className="admin-load-more-btn"
              onClick={() => setVisibleTeamPlayers((prev) => prev + 10)}
            >
              선수 10명 더보기 ▾ ({Math.min(visibleTeamPlayers, teamPlayers.length)} / {teamPlayers.length})
            </button>
          </div>
        )}
      </section>

      {/* ================= 모달 모음 ================= */}

      {/* 1. 경기 공지사항 편집 모달 */}
      {noticeModal && (
        <div className="admin-modal-backdrop" onClick={() => setNoticeModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>경기 공지사항 등록 / 수정</h3>
              <button type="button" className="admin-modal__close" onClick={() => setNoticeModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0', fontWeight: 600, color: '#334155' }}>
                대상 경기: {noticeModal.title}
              </p>
              <div className="admin-form-group">
                <label>공지 내용 (부상/결장 안내, 킥오프 지연 등)</label>
                <textarea
                  value={noticeModal.notice}
                  onChange={(e) => setNoticeModal({ ...noticeModal, notice: e.target.value })}
                  placeholder="예: 홈팀 핵심 공격수 햄스트링 부상으로 결장 예정. 폭설로 인해 킥오프 15분 지연 안내."
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setNoticeModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSaveNotice}>
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 경기 스코어 정정 모달 */}
      {scoreModal && (
        <div className="admin-modal-backdrop" onClick={() => setScoreModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>경기 스코어 및 상태 긴급 정정</h3>
              <button type="button" className="admin-modal__close" onClick={() => setScoreModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0', fontWeight: 600, color: '#334155' }}>
                {scoreModal.title}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="admin-form-group">
                  <label>홈팀 스코어</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={scoreModal.homeScore}
                    onChange={(e) => setScoreModal({ ...scoreModal, homeScore: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>원정팀 스코어</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={scoreModal.awayScore}
                    onChange={(e) => setScoreModal({ ...scoreModal, awayScore: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label>경기 진행 상태</label>
                <AdminSelect
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={scoreModal.status}
                  onChange={(e) => setScoreModal({ ...scoreModal, status: e.target.value })}
                >
                  <option value="SCHEDULED">SCHEDULED (예정)</option>
                  <option value="LIVE">LIVE (실시간 진행중)</option>
                  <option value="FINISHED">FINISHED (경기 종료)</option>
                  <option value="POSTPONED">POSTPONED (연기)</option>
                  <option value="CANCELLED">CANCELLED (취소)</option>
                </AdminSelect>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setScoreModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSaveScore}>
                정정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 경기 타임라인 이벤트 관리 및 불일치 수동 정정 모달 */}
      {eventModal && (
        <div className="admin-modal-backdrop" onClick={() => setEventModal(null)}>
          <div className="admin-modal" style={{ maxWidth: 860, width: '95%' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>⏱️</span>
                <h3 style={{ margin: 0 }}>경기 타임라인 이벤트 검증 및 관리</h3>
              </div>
              <button type="button" className="admin-modal__close" onClick={() => setEventModal(null)}>×</button>
            </div>

            <div className="admin-modal__body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {/* 경기 요약 & 스코어 대조 카드 */}
              {eventModal.match && (() => {
                const m = eventModal.match;
                const homeGoals = eventModal.events.filter(e => e.teamId === m.homeTeamId && [1, 2, 3].includes(Number(e.eventType || e.event_type))).length;
                const awayGoals = eventModal.events.filter(e => e.teamId === m.awayTeamId && [1, 2, 3].includes(Number(e.eventType || e.event_type))).length;
                const isGoalMismatch = m.status === 'FINISHED' && m.homeScore !== null && m.awayScore !== null &&
                  (m.homeScore !== homeGoals || m.awayScore !== awayGoals);

                return (
                  <div style={{
                    background: isGoalMismatch ? '#fff1f2' : '#f8fafc',
                    border: `1px solid ${isGoalMismatch ? '#fecdd3' : '#e2e8f0'}`,
                    borderRadius: 10,
                    padding: '16px 20px',
                    marginBottom: 16,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {m.homeEmblemUrl && <img src={m.homeEmblemUrl} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />}
                          <strong style={{ fontSize: 16 }}>{m.homeTeamNameKor || m.homeTeamName}</strong>
                        </div>
                        <span style={{ color: '#94a3b8', fontWeight: 700 }}>VS</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {m.awayEmblemUrl && <img src={m.awayEmblemUrl} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />}
                          <strong style={{ fontSize: 16 }}>{m.awayTeamNameKor || m.awayTeamName}</strong>
                        </div>
                        <span className="badge badge--gray" style={{ marginLeft: 8 }}>{m.matchDate}</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          type="button"
                          className="btn-action btn-action--outline"
                          style={{ fontSize: 12, padding: '5px 10px' }}
                          onClick={() => {
                            setScoreModal({
                              matchId: m.matchId,
                              title: `${m.homeTeamNameKor || m.homeTeamName} vs ${m.awayTeamNameKor || m.awayTeamName}`,
                              homeScore: m.homeScore !== null ? m.homeScore : '',
                              awayScore: m.awayScore !== null ? m.awayScore : '',
                              status: m.status,
                            });
                          }}
                        >
                          ✏️ 스코어 정정
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-action--primary"
                          style={{ fontSize: 12, padding: '5px 10px' }}
                          disabled={eventModal.loading}
                          onClick={handleResyncSingleMatch}
                          title="Football API 결과 및 BigBalls 원본 이벤트를 AI 임의 삭제 없이 다시 불러옵니다."
                        >
                          🔄 외부 원본 다시 불러오기
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-action--warning"
                          style={{ fontSize: 12, padding: '5px 10px' }}
                          disabled={eventModal.aiLoading}
                          onClick={handleGetAiAdvice}
                          title="Gemini AI에게 불일치 원인 및 취소골 추론 분석 조언을 다시 요청합니다 (참고용)"
                        >
                          {eventModal.aiLoading ? '🤖 AI 분석중...' : '🔄 AI 재분석'}
                        </button>
                      </div>
                    </div>

                    {/* 스코어 vs 이벤트 카운트 대조 바 */}
                    <div style={{
                      marginTop: 14,
                      paddingTop: 12,
                      borderTop: `1px solid ${isGoalMismatch ? '#fecdd3' : '#e2e8f0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 12,
                    }}>
                      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: 12, color: '#64748b' }}>공식 최종 스코어: </span>
                          <strong style={{ fontSize: 16, color: '#0f172a' }}>
                            {m.homeScore !== null ? m.homeScore : '-'} : {m.awayScore !== null ? m.awayScore : '-'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ fontSize: 12, color: '#64748b' }}>타임라인 골 이벤트: </span>
                          <strong style={{ fontSize: 16, color: isGoalMismatch ? '#e11d48' : '#059669' }}>
                            {homeGoals} : {awayGoals}
                          </strong>
                        </div>
                      </div>

                      <div>
                        {isGoalMismatch ? (
                          <span className="badge badge--red" style={{ fontSize: 12, padding: '4px 10px' }}>
                            ⚠️ 불일치 발생! (골 이벤트 {homeGoals + awayGoals}건 vs 공식 스코어 {(m.homeScore ?? 0) + (m.awayScore ?? 0)}점)
                          </span>
                        ) : (
                          <span className="badge badge--green" style={{ fontSize: 12, padding: '4px 10px' }}>
                            ✅ 정합성 일치 (공식 스코어와 골 이벤트 수 동일)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* AI 분석 로딩 카드 */}
              {eventModal.aiLoading && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px dashed #cbd5e1',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}>
                  <span style={{ fontSize: 18 }}>🤖</span>
                  <div>
                    <strong style={{ color: '#1e293b' }}>Gemini AI 분석 참고의견 조회 중...</strong>
                    <span style={{ marginLeft: 6, fontSize: 12, color: '#64748b' }}>공식 스코어와 타임라인 이벤트의 일치 여부 및 취소골 가능성을 분석하고 있습니다.</span>
                  </div>
                </div>
              )}

              {/* AI 분석 조언 결과 알림창 */}
              {eventModal.aiAdvice && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 16,
                  fontSize: 13,
                  color: '#166534',
                }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>🤖 Gemini AI 분석 참고의견</span>
                    <span style={{ fontSize: 11, color: '#15803d', fontWeight: 400 }}>(DB에 자동 반영되지 않으며, 관리자 검토 후 직접 삭제 버튼을 눌러야 합니다)</span>
                  </div>
                  <div>
                    {eventModal.aiAdvice.isMismatch ? (
                      <div>
                        {eventModal.aiAdvice.homeDisallowedMinutes?.length > 0 && (
                          <p style={{ margin: '4px 0' }}>
                            • 홈팀 취소/무효 의심 골 시간대: <strong>{eventModal.aiAdvice.homeDisallowedMinutes.join(', ')}분</strong> (VAR 판독 취소 가능성)
                          </p>
                        )}
                        {eventModal.aiAdvice.awayDisallowedMinutes?.length > 0 && (
                          <p style={{ margin: '4px 0' }}>
                            • 원정팀 취소/무효 의심 골 시간대: <strong>{eventModal.aiAdvice.awayDisallowedMinutes.join(', ')}분</strong> (VAR 판독 취소 가능성)
                          </p>
                        )}
                        {(!eventModal.aiAdvice.homeDisallowedMinutes?.length && !eventModal.aiAdvice.awayDisallowedMinutes?.length) && (
                          <p style={{ margin: '4px 0' }}>
                            • AI 분석 결과 명확한 취소골 기록을 특정하지 못했습니다. 실제 매치리포트를 참고하여 아래 이벤트 목록에서 수동으로 정정해주세요.
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ margin: '4px 0' }}>• 스코어와 골 이벤트 수가 일치하여 별도의 취소골 제거가 필요하지 않습니다.</p>
                    )}
                  </div>
                </div>
              )}

              {/* 이벤트 목록 테이블 */}
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: 14, color: '#334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>📋 등록된 경기 타임라인 이벤트 ({eventModal.events.length}건)</span>
                  <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>잘못 기재된 취소골/중복골은 [삭제] 버튼을 눌러주세요</span>
                </h4>

                <div className="admin-table-wrapper" style={{ maxHeight: 280, overflowY: 'auto' }}>
                  <table className="admin-table" style={{ fontSize: 13 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 60 }}>시간</th>
                        <th>구단</th>
                        <th>유형</th>
                        <th>선수명</th>
                        <th>도움 선수</th>
                        <th style={{ width: 70 }}>삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventModal.loading ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#0369a1' }}>이벤트를 불러오는 중입니다...</td></tr>
                      ) : eventModal.events.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>등록된 타임라인 이벤트가 없습니다. [외부 원본 다시 불러오기]를 실행해보세요.</td></tr>
                      ) : (
                        eventModal.events.map((ev) => {
                          const evId = ev.eventId || ev.event_id;
                          const evTime = ev.eventTime || ev.event_time;
                          const evType = Number(ev.eventType || ev.event_type);
                          const isGoal = [1, 2, 3].includes(evType);
                          const pName = ev.playerNameKor || ev.playerName || ev.player_name || '선수 미확인';
                          const aName = ev.assistPlayerNameKor || ev.assistPlayerName || ev.assist_player_name || '-';
                          const tName = ev.teamNameKor || ev.teamName || (ev.teamId === eventModal.match?.homeTeamId ? (eventModal.match?.homeTeamNameKor || eventModal.match?.homeTeamName) : (eventModal.match?.awayTeamNameKor || eventModal.match?.awayTeamName));

                          const typeBadge =
                            evType === 1 ? <span className="badge badge--green">⚽ 골</span> :
                            evType === 2 ? <span className="badge badge--green">⚽ PK 골</span> :
                            evType === 3 ? <span className="badge badge--red">🥅 자책골</span> :
                            evType === 4 ? <span className="badge badge--warning">🟨 옐로카드</span> :
                            evType === 5 ? <span className="badge badge--red">🟨🟥 경고누적</span> :
                            evType === 6 ? <span className="badge badge--red">🟥 다이렉트 퇴장</span> :
                            evType === 7 ? <span className="badge badge--gray">🔄 교체</span> :
                            evType === 8 ? <span className="badge badge--gray">❌ PK 실축</span> :
                            <span className="badge badge--gray">{ev.eventTypeName || `기타(${evType})`}</span>;

                          return (
                            <tr key={evId || `${evTime}-${ev.playerId}`} style={isGoal ? { background: '#f8fafc' } : {}}>
                              <td style={{ fontWeight: 700 }}>{evTime}&apos;</td>
                              <td>{tName}</td>
                              <td>{typeBadge}</td>
                              <td><strong>{pName}</strong></td>
                              <td style={{ color: '#64748b' }}>{aName}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn-action btn-action--danger"
                                  style={{ fontSize: 11, padding: '3px 8px' }}
                                  onClick={() => handleDeleteEvent(evId, `${evTime}분 ${pName} ${isGoal ? '골' : '이벤트'}`)}
                                >
                                  삭제
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 이벤트 수동 추가 섹션 */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>➕</span> 이벤트 수동 직접 추가 <span style={{ fontSize: 11, fontWeight: 400, color: '#64748b' }}>(누락된 골/카드 등록)</span>
                  </h4>
                </div>
                <div
                  className="admin-event-add-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '85px minmax(160px, 1.8fr) minmax(135px, 1.2fr) minmax(160px, 1.8fr) auto',
                    gap: 10,
                    alignItems: 'end',
                  }}
                >
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      시간(분)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="130"
                      className="admin-input"
                      style={{ width: '100%', height: 38, boxSizing: 'border-box' }}
                      placeholder="예: 45"
                      value={eventModal.newEvent.eventTime}
                      onChange={(e) => setEventModal({
                        ...eventModal,
                        newEvent: { ...eventModal.newEvent, eventTime: e.target.value }
                      })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      소속 구단
                    </label>
                    <AdminSelect
                      className="admin-select"
                      style={{ width: '100%', height: 38, boxSizing: 'border-box' }}
                      value={eventModal.newEvent.teamId}
                      onChange={(e) => setEventModal({
                        ...eventModal,
                        newEvent: { ...eventModal.newEvent, teamId: Number(e.target.value), playerId: '' }
                      })}
                    >
                      <option value={eventModal.match?.homeTeamId}>
                        [홈] {getTeamFullNameKor(eventModal.match?.homeTeamId, eventModal.match?.homeTeamNameKor || eventModal.match?.homeTeamName)}
                      </option>
                      <option value={eventModal.match?.awayTeamId}>
                        [원정] {getTeamFullNameKor(eventModal.match?.awayTeamId, eventModal.match?.awayTeamNameKor || eventModal.match?.awayTeamName)}
                      </option>
                    </AdminSelect>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      이벤트 유형
                    </label>
                    <AdminSelect
                      className="admin-select"
                      style={{ width: '100%', height: 38, boxSizing: 'border-box' }}
                      value={eventModal.newEvent.eventType}
                      onChange={(e) => setEventModal({
                        ...eventModal,
                        newEvent: { ...eventModal.newEvent, eventType: Number(e.target.value) }
                      })}
                    >
                      <option value="1">⚽ 일반 골 (1)</option>
                      <option value="2">⚽ PK 골 (2)</option>
                      <option value="3">🥅 자책골 (3)</option>
                      <option value="4">🟨 옐로카드 (4)</option>
                      <option value="5">🟨🟥 경고누적 (5)</option>
                      <option value="6">🟥 퇴장 (6)</option>
                      <option value="8">❌ PK 실축 (8)</option>
                    </AdminSelect>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                      선수 선택
                    </label>
                    <AdminSelect
                      className="admin-select"
                      style={{ width: '100%', height: 38, boxSizing: 'border-box' }}
                      value={eventModal.newEvent.playerId}
                      onChange={(e) => setEventModal({
                        ...eventModal,
                        newEvent: { ...eventModal.newEvent, playerId: e.target.value }
                      })}
                    >
                      <option value="">-- 선수 선택 --</option>
                      {eventModalPlayers
                        .filter(p => Number(p.teamId) === Number(eventModal.newEvent.teamId))
                        .map(p => (
                          <option key={p.playerId} value={p.playerId}>
                            {p.nameKor || p.name} ({p.position || '선수'})
                          </option>
                        ))
                      }
                    </AdminSelect>
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn-action btn-action--primary"
                      style={{ height: 38, padding: '0 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      onClick={handleAddEvent}
                    >
                      등록하기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setEventModal(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 선수 부상/결장 정보 수정 모달 */}
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
