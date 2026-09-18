  import React, { useEffect } from 'react';
import { getFlagUrl } from '../../utils/flagUtils.js';

export default function PlayerStatsModal({ player, stats, loading, onClose }) {
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

        {/* 상단 영역: [선수 한국어/영어 이름] (좌)  vs  [국적표기 / 국적아이콘] (우) */}
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

