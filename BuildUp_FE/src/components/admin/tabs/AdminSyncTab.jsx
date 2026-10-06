import React from 'react';
import { useAdminSync } from '../../../hooks/useAdminSync.js';

/**
 * [관리자 데이터 수동 동기화 탭 - BuildUp_FE/src/components/admin/tabs/AdminSyncTab.jsx]
 * 
 * 프리미어리그 경기 일정, 경기 타임라인 이벤트, AI 강제 정합성 일치, 순위표 및 득점 랭킹 등의
 * 수동 동기화 카드를 제공하는 컴포넌트입니다.
 */
export default function AdminSyncTab({ showAlert, setSyncStatus }) {
  const {
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
  } = useAdminSync({ showAlert, setSyncStatus });

  return (
    <div>
      <div className="sync-grid">
        {/* 1. 경기 일정 및 스코어 동기화 */}
        <div className="sync-card">
          <div>
            <div className="sync-card__title">⚽ 경기 일정 및 스코어 동기화</div>
            <div className="sync-card__desc">
              {matchSyncRange
                ? '지정한 기간(From ~ To) 동안의 프리미어리그 경기 일정 및 스코어 결과를 외부 API에서 일괄 업데이트합니다.'
                : 'Football-Data API를 호출하여 특정 날짜의 프리미어리그 경기 일정 및 스코어 결과를 즉시 DB에 업데이트합니다.'}
            </div>
          </div>
          <div className="sync-card__actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {matchSyncRange ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <input
                  type="date"
                  className="admin-input"
                  value={matchSyncFrom}
                  onChange={(e) => setMatchSyncFrom(e.target.value)}
                  style={{ width: '135px' }}
                  title="시작일 (From)"
                />
                <span style={{ color: '#64748b', fontWeight: 700 }}>~</span>
                <input
                  type="date"
                  className="admin-input"
                  value={matchSyncTo}
                  onChange={(e) => setMatchSyncTo(e.target.value)}
                  style={{ width: '135px' }}
                  title="종료일 (To)"
                />
                <button
                  type="button"
                  className="btn-action btn-action--outline"
                  style={{ padding: '6px 10px', fontSize: 13, minWidth: 32 }}
                  onClick={() => setMatchSyncRange(false)}
                  title="단일 일자 선택으로 돌아가기 (−)"
                >
                  − 단일
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="date"
                  className="admin-input"
                  value={matchSyncFrom}
                  onChange={(e) => {
                    setMatchSyncFrom(e.target.value);
                    setMatchSyncTo(e.target.value);
                  }}
                  style={{ width: '145px' }}
                  title="동기화 일자"
                />
                <button
                  type="button"
                  className="btn-action btn-action--outline"
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    color: '#0284c7',
                    borderColor: '#38bdf8',
                    fontWeight: 600,
                  }}
                  onClick={() => setMatchSyncRange(true)}
                  title="기간(From ~ To) 범위 선택 모드로 전환 (+)"
                >
                  + 기간
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => {
                if (matchSyncRange) {
                  handleTriggerSync('matches', { startDate: matchSyncFrom, endDate: matchSyncTo }, `${matchSyncFrom} ~ ${matchSyncTo} 경기 일정`);
                } else {
                  handleTriggerSync('matches', { date: matchSyncFrom }, `${matchSyncFrom} 경기 일정`);
                }
              }}
            >
              동기화
            </button>
          </div>
        </div>

        {/* 2. 경기 타임라인 이벤트 동기화 */}
        <div className="sync-card">
          <div>
            <div className="sync-card__title">⏱️ 경기 타임라인 이벤트 동기화</div>
            <div className="sync-card__desc">
              {eventSyncRange
                ? '지정한 기간(From ~ To) 동안 치러진 모든 경기의 타임라인 상세 이벤트를 MATCH_EVENTS에 일괄 동기화합니다.'
                : 'BigBalls API를 연동하여 특정 날짜의 골, 어시스트, 카드 등 타임라인 상세 이벤트를 MATCH_EVENTS에 동기화합니다.'}
            </div>
          </div>
          <div className="sync-card__actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {eventSyncRange ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <input
                  type="date"
                  className="admin-input"
                  value={eventSyncFrom}
                  onChange={(e) => setEventSyncFrom(e.target.value)}
                  style={{ width: '135px' }}
                  title="시작일 (From)"
                />
                <span style={{ color: '#64748b', fontWeight: 700 }}>~</span>
                <input
                  type="date"
                  className="admin-input"
                  value={eventSyncTo}
                  onChange={(e) => setEventSyncTo(e.target.value)}
                  style={{ width: '135px' }}
                  title="종료일 (To)"
                />
                <button
                  type="button"
                  className="btn-action btn-action--outline"
                  style={{ padding: '6px 10px', fontSize: 13, minWidth: 32 }}
                  onClick={() => setEventSyncRange(false)}
                  title="단일 일자 선택으로 돌아가기 (−)"
                >
                  − 단일
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="date"
                  className="admin-input"
                  value={eventSyncFrom}
                  onChange={(e) => {
                    setEventSyncFrom(e.target.value);
                    setEventSyncTo(e.target.value);
                  }}
                  style={{ width: '145px' }}
                  title="동기화 일자"
                />
                <button
                  type="button"
                  className="btn-action btn-action--outline"
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    color: '#0284c7',
                    borderColor: '#38bdf8',
                    fontWeight: 600,
                  }}
                  onClick={() => setEventSyncRange(true)}
                  title="기간(From ~ To) 범위 선택 모드로 전환 (+)"
                >
                  + 기간
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => {
                if (eventSyncRange) {
                  handleTriggerSync('events', { startDate: eventSyncFrom, endDate: eventSyncTo }, `${eventSyncFrom} ~ ${eventSyncTo} 타임라인 이벤트`);
                } else {
                  handleTriggerSync('events', { date: eventSyncFrom }, `${eventSyncFrom} 타임라인 이벤트`);
                }
              }}
            >
              동기화
            </button>
          </div>
        </div>

        {/* 3. AI 스코어 정합성 강제 일치 */}
        <div className="sync-card" style={{ borderColor: '#fbcfe8', background: '#fdf2f8' }}>
          <div>
            <div className="sync-card__title" style={{ color: '#9d174d', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🤖</span> AI 스코어 정합성 강제 일치
            </div>
            <div className="sync-card__desc" style={{ color: '#831843' }}>
              지정한 기간(From ~ To) 동안 공식 스코어와 골 이벤트가 불일치하는 경기들을 Gemini AI가 분석하여 VAR 취소골/무효골을 DB에서 자동으로 찾아 삭제·보정합니다.
            </div>
          </div>
          <div className="sync-card__actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            {aiAlignRange ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <input
                  type="date"
                  className="admin-input"
                  style={{ fontSize: 13, padding: '6px 10px' }}
                  value={aiAlignFrom}
                  onChange={(e) => setAiAlignFrom(e.target.value)}
                  title="시작일 (From)"
                />
                <span style={{ color: '#9d174d', fontWeight: 700 }}>~</span>
                <input
                  type="date"
                  className="admin-input"
                  style={{ fontSize: 13, padding: '6px 10px' }}
                  value={aiAlignTo}
                  onChange={(e) => setAiAlignTo(e.target.value)}
                  title="종료일 (To)"
                />
                <button
                  type="button"
                  className="btn-action btn-action--outline"
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    color: '#9d174d',
                    borderColor: '#f472b6',
                    fontWeight: 600,
                  }}
                  onClick={() => setAiAlignRange(false)}
                  title="단일 일자 선택 모드로 전환 (−)"
                >
                  − 단일
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="date"
                  className="admin-input"
                  style={{ fontSize: 13, padding: '6px 10px' }}
                  value={aiAlignFrom}
                  onChange={(e) => setAiAlignFrom(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-action btn-action--outline"
                  style={{
                    padding: '6px 10px',
                    fontSize: 13,
                    color: '#9d174d',
                    borderColor: '#f472b6',
                    fontWeight: 600,
                  }}
                  onClick={() => setAiAlignRange(true)}
                  title="기간(From ~ To) 범위 선택 모드로 전환 (+)"
                >
                  + 기간
                </button>
              </div>
            )}
            <button
              type="button"
              className="btn-action btn-action--warning"
              style={{ background: '#db2777', borderColor: '#db2777', color: '#ffffff', fontWeight: 700 }}
              disabled={syncLoading}
              onClick={() => {
                const label = aiAlignRange ? `${aiAlignFrom} ~ ${aiAlignTo} AI 강제 일치` : `${aiAlignFrom} AI 강제 일치`;
                if (!window.confirm(`선택한 기간(${label})의 불일치 경기들을 Gemini AI 분석을 통해 자동으로 취소골을 삭제하고 공식 스코어와 강제 일치시키겠습니까?`)) return;
                if (aiAlignRange) {
                  handleTriggerSync('ai-force-align', { startDate: aiAlignFrom, endDate: aiAlignTo }, `${aiAlignFrom} ~ ${aiAlignTo} AI 스코어 강제 일치`);
                } else {
                  handleTriggerSync('ai-force-align', { date: aiAlignFrom }, `${aiAlignFrom} AI 스코어 강제 일치`);
                }
              }}
            >
              AI 강제 일치 실행
            </button>
          </div>
        </div>

        {/* 4. 프리미어리그 순위표 동기화 */}
        <div className="sync-card">
          <div>
            <div className="sync-card__title">🏆 프리미어리그 순위표 동기화</div>
            <div className="sync-card__desc">
              현재 시즌 20개 구단의 순위, 승무패, 득실차, 승점을 즉시 동기화하여 TEAM_STATS에 적재합니다.
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => handleTriggerSync('standings', null, null, '리그 순위표')}
            >
              순위표 동기화 실행
            </button>
          </div>
        </div>

        {/* 5. 득점 순위 동기화 */}
        <div className="sync-card">
          <div>
            <div className="sync-card__title">🎯 선수 득점 순위 동기화</div>
            <div className="sync-card__desc">
              공식 득점 랭킹 상위 50명의 골, 어시스트 데이터를 PLAYER_STATS에 업데이트합니다.
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => handleTriggerSync('scorers', 'limit', '50', '득점 랭킹')}
            >
              득점 랭킹 동기화
            </button>
          </div>
        </div>

        {/* 6. 시즌 전체 380경기 일괄 동기화 */}
        <div className="sync-card">
          <div>
            <div className="sync-card__title">📅 시즌 전체 380경기 일괄 동기화</div>
            <div className="sync-card__desc">
              프리미어리그 최신 시즌의 전체 380개 경기 일정과 확정 스코어를 외부 API에서 일괄 수집하여 DB에 적재합니다.
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => handleTriggerSync('season-matches', null, null, '시즌 380경기 전체')}
            >
              시즌 전경기 동기화
            </button>
          </div>
        </div>

        {/* 7. 전체 구단 및 선수단 일괄 동기화 */}
        <div className="sync-card">
          <div>
            <div className="sync-card__title">👥 전체 20개 구단 및 선수단 동기화</div>
            <div className="sync-card__desc">
              프리미어리그 20개 구단 프로필과 소속 선수 500여 명의 최신 정보를 외부 API에서 일괄 동기화합니다.
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => handleTriggerSync('teams-and-players', null, null, '20개 구단 및 선수단')}
            >
              구단·선수단 동기화
            </button>
          </div>
        </div>

        {/* 8. [Gemini AI] 전체 구단 및 선수단 한국어 번역 & 역사 일괄 자동 적재 */}
        <div className="sync-card" style={{ borderColor: '#86efac', background: '#f0fdf4' }}>
          <div>
            <div className="sync-card__title" style={{ color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🤖</span> Gemini AI 전체 한국어 번역 일괄 실행 (백그라운드)
            </div>
            <div className="sync-card__desc" style={{ color: '#15803d' }}>
              20개 구단 한글명, 홈 경기장, 구단 역사와 코칭스태프, 500여 명 선수단의 한글 이름 및 국적을 Gemini AI가 일괄 번역하여 DB에 적재합니다. (비동기 백그라운드 파이프라인 가동)
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--success"
              style={{ background: '#16a34a', borderColor: '#16a34a', color: '#ffffff', fontWeight: 700 }}
              disabled={syncLoading}
              onClick={() => {
                if (!window.confirm('전체 20개 구단 정보, 코칭스태프 및 500여 명 선수단의 한글 번역 일괄 작업을 백그라운드에서 시작하시겠습니까?\n(서버 콘솔에서 단계별 진행 로그가 출력됩니다.)')) return;
                handleTriggerSync('ai-korean', null, null, '전체 AI 한국어 번역 일괄');
              }}
            >
              전체 AI 한글화 일괄 실행
            </button>
          </div>
        </div>

        {/* 9. [Gemini AI] 선수단 한글 번역 단독 실행 */}
        <div className="sync-card" style={{ borderColor: '#bbf7d0' }}>
          <div>
            <div className="sync-card__title">🏃 선수단 한글명 번역 (단독 실행)</div>
            <div className="sync-card__desc">
              20개 구단 500여 명 선수들의 영문 이름을 공식 국문 표기법에 맞춰 Gemini AI가 한글명과 국적으로 번역하여 PLAYERS 테이블을 갱신합니다.
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => {
                if (!window.confirm('전체 선수단 한글명 및 국적 번역을 실행하시겠습니까? (약 10~20초 소요)')) return;
                handleTriggerSync('ai-players', null, null, '선수단 한글 번역');
              }}
            >
              선수단 한글화 실행
            </button>
          </div>
        </div>

        {/* 10. [Gemini AI] 20개 구단 한글명 및 구단 역사 생성 */}
        <div className="sync-card" style={{ borderColor: '#bbf7d0' }}>
          <div>
            <div className="sync-card__title">🛡️ 20개 구단 한글명 & 구단 역사 생성</div>
            <div className="sync-card__desc">
              20개 구단의 공식 한글 구단명, 홈 경기장 한글명, 3~4문장의 역사 요약을 생성하여 TEAMS 테이블에 적재합니다.
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => {
                if (!window.confirm('20개 구단 한글명 및 역사 생성을 실행하시겠습니까?')) return;
                handleTriggerSync('ai-teams', null, null, '구단 한글명 및 역사');
              }}
            >
              구단 정보 한글화 실행
            </button>
          </div>
        </div>

        {/* 11. [Gemini AI] 감독 및 코칭스태프 한글 번역 */}
        <div className="sync-card" style={{ borderColor: '#bbf7d0' }}>
          <div>
            <div className="sync-card__title">👔 감독 및 코칭스태프 한글 번역</div>
            <div className="sync-card__desc">
              20개 구단 감독 및 주요 코칭스태프의 한글 이름과 국적을 번역하여 STAFFS 테이블을 갱신합니다.
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--primary"
              disabled={syncLoading}
              onClick={() => {
                if (!window.confirm('코칭스태프(감독) 한글명 번역을 실행하시겠습니까?')) return;
                handleTriggerSync('ai-staffs', null, null, '코칭스태프 한글 번역');
              }}
            >
              스태프 한글화 실행
            </button>
          </div>
        </div>

        {/* 12. [Gemini AI] 선수 세부 포지션(CB, LB, CDM, ST 등) AI 판별 및 DB 적재 */}
        <div className="sync-card" style={{ borderColor: '#c7d2fe' }}>
          <div>
            <div className="sync-card__title">📍 선수 20개 구단 세부 포지션 AI 판별</div>
            <div className="sync-card__desc">
              선수들의 주 활동 영역과 역할을 Gemini AI가 분석하여 4대 대분류 외 세부 포지션(CB, LB, RB, CDM, CAM, CM, ST, LW, RW 등)을 정밀 판별하여 DB에 적재합니다.
            </div>
          </div>
          <div className="sync-card__actions">
            <button
              type="button"
              className="btn-action btn-action--primary"
              style={{ background: '#4f46e5', borderColor: '#4f46e5' }}
              disabled={syncLoading}
              onClick={() => {
                if (!window.confirm('20개 구단 전체 선수의 세부 포지션 AI 판별 및 DB 적재를 실행하시겠습니까?')) return;
                handleTriggerSync('ai-positions', null, null, '선수 세부 포지션');
              }}
            >
              세부 포지션 AI 적재 실행
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
