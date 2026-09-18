  import React, { useState, useEffect } from 'react';
import { getFlagUrl } from '../../utils/flagUtils.js';

// 메인 포지션 한글 설명 매핑
const MAIN_POS_DESC = {
  FW: 'FW-공격수',
  MF: 'MF-미드필더',
  DF: 'DF-수비수',
  GK: 'GK-골키퍼',
};

// 세부 포지션 한글 설명 매핑
const DETAIL_POS_DESC = {
  ST: 'ST-스트라이커(중앙 공격수)',
  CF: 'CF-중앙 공격수(세컨드 스트라이커)',
  LW: 'LW-왼쪽 공격수(레프트 윙어)',
  RW: 'RW-오른쪽 공격수(라이트 윙어)',
  SS: 'SS-세컨드 스트라이커',
  CAM: 'CAM-공격형 미드필더',
  CM: 'CM-중앙 미드필더',
  CDM: 'CDM-수비형 미드필더',
  LM: 'LM-왼쪽 미드필더(레프트 미드필더)',
  RM: 'RM-오른쪽 미드필더(라이트 미드필더)',
  CB: 'CB-중앙 수비수(센터백)',
  LB: 'LB-왼쪽 수비수(레프트백)',
  RB: 'RB-오른쪽 수비수(라이트백)',
  LWB: 'LWB-왼쪽 윙백',
  RWB: 'RWB-오른쪽 윙백',
  GK: 'GK-골키퍼',
};

export default function PlayerStatsModal({ player, stats, loading, onClose }) {
  const [isPosHovered, setIsPosHovered] = useState(false);

  // ESC 키를 누르면 모달창 닫기
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);

    // 모달창 오픈 시 배경 스크롤 방지
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  if (!player) return null;

  const nameKor = player.nameKor || player.name || stats?.playerNameKor;
  const nameEn = player.name || stats?.playerName;
  const nationalityKor = player.nationalityKor || player.nationality || stats?.nationalityKor || stats?.nationality;
  const nationalityEn = player.nationality || stats?.nationality;
  const flagUrl = getFlagUrl(nationalityEn, nationalityKor, 80);

  const goals = stats?.goals ?? player.goals ?? 0;
  const assists = stats?.assists ?? player.assists ?? 0;
  const isInjured = (stats?.isInjured ?? player.isInjured) === 'Y';
  const isSuspended = (stats?.isSuspended ?? player.isSuspended) === 'Y';

  // 메인포지션 · 디테일 포지션 (골키퍼는 GK 하나로 통일, 동일 포지션 중복 방지)
  const mainPos = (player.mainPosition || stats?.mainPosition || '').toUpperCase();
  const detailPos = (player.detailPosition || stats?.detailPosition || '').toUpperCase();

  let positionText = '';
  if (mainPos === 'GK' || detailPos === 'GK') {
    positionText = 'GK';
  } else if (mainPos && detailPos && mainPos !== detailPos) {
    positionText = `${mainPos} · ${detailPos}`;
  } else {
    positionText = mainPos || detailPos || '';
  }

  const posBadgeClass = mainPos ? `badge-${mainPos.toLowerCase()}` : 'badge-mf';

  // 호버 시 노출할 포지션 설명 (라인 1: 메인, 라인 2: 세부 포지션)
  const mainPosDesc = MAIN_POS_DESC[mainPos] || (mainPos ? `${mainPos}-포지션` : '');
  const detailPosDesc = (detailPos && detailPos !== mainPos && detailPos !== 'GK')
    ? (DETAIL_POS_DESC[detailPos] || `${detailPos}-상세 포지션`)
    : null;

  return (
    <div
      className="player-stats-modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-modal-title"
    >
      <div
        className="player-stats-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 우측 상단 닫기 버튼 */}
        <button
          className="player-stats-modal-close"
          onClick={onClose}
          aria-label="닫기"
        >
          ✕
        </button>

        {/* 상단 시즌 라벨 */}
        <div className="player-stats-modal-eyebrow">
          <span>2026-2027 시즌 스탯</span>
          {isInjured && <span className="player-status-badge badge-injured">부상</span>}
          {isSuspended && <span className="player-status-badge badge-suspended">출장정지</span>}
        </div>

        {/* 상단 영역: [선수 한국어/영어 이름 + 포지션 배지 및 호버 안내] (좌)  vs  [국적표기 / 국적아이콘] (우) */}
        <div className="player-stats-modal-header">
          <div className="player-stats-name-col">
            <h2 id="player-modal-title" className="player-stats-name-kor">
              {nameKor}
            </h2>
            {nameEn && (
              <div className="player-stats-name-en">
                ({nameEn})
              </div>
            )}
            {positionText && (
              <div
                className="player-stats-position-group"
                onMouseEnter={() => setIsPosHovered(true)}
                onMouseLeave={() => setIsPosHovered(false)}
              >
                <div
                  className={`player-stats-position-pill ${posBadgeClass}`}
                  onClick={() => setIsPosHovered((prev) => !prev)}
                  tabIndex={0}
                  role="button"
                  title="마우스를 올리면 포지션 설명이 표시됩니다"
                >
                  {positionText}
                </div>

                {/* 태그 밑 안내 문구 / 호버 시 포지션 설명 전환 영역 */}
                <div className="player-stats-position-guide">
                  {isPosHovered ? (
                    <div className="position-desc-box">
                      <div className="position-desc-line">{mainPosDesc}</div>
                      {detailPosDesc && (
                        <div className="position-desc-line">{detailPosDesc}</div>
                      )}
                    </div>
                  ) : (
                    <div className="position-guide-hint">
                      태그에 마우스를 올려보세요
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="player-stats-nat-col">
            <span className="player-stats-nat-name">{nationalityKor}</span>
            {flagUrl && (
              <img
                src={flagUrl}
                alt={nationalityKor || nationalityEn}
                className="player-stats-flag-icon"
                loading="lazy"
              />
            )}
          </div>
        </div>

        {/* 구분선 */}
        <div className="player-stats-modal-divider" />

        {/* 하단 영역: Goal : 몇 골    Assist : 몇 어시스트 */}
        <div className="player-stats-modal-body">
          {loading ? (
            <div className="player-stats-loading">기록 불러오는 중...</div>
          ) : (
            <div className="player-stats-grid">
              <div className="player-stat-item stat-item-goal">
                <span className="stat-label">Goal :</span>
                <span className="stat-value">{goals}골</span>
              </div>
              <div className="player-stat-item stat-item-assist">
                <span className="stat-label">Assist :</span>
                <span className="stat-value">{assists} 어시스트</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

