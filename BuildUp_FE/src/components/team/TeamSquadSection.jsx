import React, { useState, useEffect,useRef } from 'react';
import { getTeamPlayers, getTeamStaffs, getPlayerStats } from '../../api/teamApi.js';
import { getFlagUrl } from '../../utils/flagUtils.js';
import PlayerStatsModal from './PlayerStatsModal.jsx';

const POSITION_CONFIG = {
  FW: {
    label: '공격수',
    sub: 'Forwards',
    badgeClass: 'badge-fw',
    icon: '⚡',
  },
  MF: {
    label: '미드필더',
    sub: 'Midfielders',
    badgeClass: 'badge-mf',
    icon: '🎯',
  },
  DF: {
    label: '수비수',
    sub: 'Defenders',
    badgeClass: 'badge-df',
    icon: '🛡️',
  },
  GK: {
    label: '골키퍼',
    sub: 'Goalkeepers',
    badgeClass: 'badge-gk',
    icon: '🧤',
  },
};

function PositionSquadSlider({ pos, config, players, onPlayerClick }) {
  const [currentPage, setCurrentPage] = useState(0);
  const trackRef = useRef(null);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const isSwipingRef = useRef(false);

  // 반응형 2열 2줄(4명씩) 청크 분할
  const pageSize = 4;
  const pages = [];
  for (let i = 0; i < players.length; i += pageSize) {
    pages.push(players.slice(i, i + pageSize));
  }
  const totalPages = pages.length;

  const handleScroll = (e) => {
    const el = e.currentTarget;
    if (el && el.clientWidth > 0) {
      const page = Math.round(el.scrollLeft / el.clientWidth);
      if (page !== currentPage && page >= 0 && page < totalPages) {
        setCurrentPage(page);
      }
    }
  };

  const scrollToPage = (pageIdx) => {
    if (!trackRef.current) return;
    const targetLeft = pageIdx * trackRef.current.clientWidth;
    trackRef.current.scrollTo({
      left: targetLeft,
      behavior: 'smooth'
    });
    setCurrentPage(pageIdx);
  };

  // 포지션 탭 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(0);
    if (trackRef.current) {
      trackRef.current.scrollLeft = 0;
    }
  }, [pos]);

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStartXRef.current);
    const deltaY = Math.abs(e.touches[0].clientY - touchStartYRef.current);
    if (deltaX > 8 || deltaY > 8) {
      isSwipingRef.current = true;
    }
  };

  return (
    <div className="team-squad-group">
      <div className="team-group-header">
        <div className="team-group-left">
          <h3 className="team-group-title">
            {config.label}
            <span className="team-group-code">({pos})</span>
          </h3>
          <span className="team-group-count">{players.length}명</span>
        </div>

        {/* 모바일 반응형 2페이지 이상일 때 상단 화살표 네비게이션 */}
        {totalPages > 1 && (
          <div className="team-squad-slider-nav" aria-label={`${config.label} 목록 넘기기`}>
            <button
              type="button"
              className="team-squad-arrow-btn team-squad-arrow-prev"
              onClick={() => scrollToPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              aria-label="이전 선수 목록 보기"
            >
              ‹
            </button>
            <span className="team-squad-page-indicator">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              type="button"
              className="team-squad-arrow-btn team-squad-arrow-next"
              onClick={() => scrollToPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="다음 선수 목록 보기"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="team-squad-slider-container">
        <div
          ref={trackRef}
          className="team-squad-slider-track team-player-grid"
          onScroll={handleScroll}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {pages.map((pagePlayers, pageIdx) => (
            <div key={pageIdx} className="team-squad-slide">
              {pagePlayers.map((player) => (
                <div
                  key={player.playerId || player.id || player.name}
                  className="team-player-card"
                  onClick={() => {
                    if (isSwipingRef.current) return;
                    onPlayerClick(player);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onPlayerClick(player);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  title={`${player.nameKor || player.name} 2026-2027 시즌 스탯 보기`}
                >
                  <div className="team-player-card-top">
                    <span className={`team-player-pos-badge ${(POSITION_CONFIG[(player.mainPosition || pos || 'MF').toUpperCase()] || config).badgeClass}`}>
                      {(player.mainPosition || pos || 'MF').toUpperCase()}
                    </span>
                    <div className="team-player-nat-pill">
                      <span className="team-player-nat-name">
                        {player.nationalityKor || player.nationality}
                      </span>
                    </div>
                  </div>

                  <div className="team-player-card-bottom">
                    <div className="team-player-name-wrap">
                      <div className="team-player-name" title={player.name}>
                        {player.nameKor || player.name}
                      </div>
                      {player.nameKor && player.name && (
                        <div className="team-player-name-en">
                          ({player.name})
                        </div>
                      )}
                    </div>
                    {getFlagUrl(player.nationality, player.nationalityKor) && (
                      <img
                        src={getFlagUrl(player.nationality, player.nationalityKor, 40)}
                        alt={player.nationalityKor || player.nationality}
                        className="team-player-flag-icon"
                        loading="lazy"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 모바일 반응형 2페이지 이상일 때 하단 인디케이터 점 & 스와이프 안내 문구 */}
      {totalPages > 1 && (
        <div className="team-squad-slider-footer">
          <div className="team-squad-dots">
            {pages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`team-squad-dot ${currentPage === idx ? 'is-active' : ''}`}
                onClick={() => scrollToPage(idx)}
                aria-label={`${idx + 1}페이지로 이동`}
              />
            ))}
          </div>
          <span className="team-squad-swipe-hint">스와이프하여 넘겨보기 ↔</span>
        </div>
      )}
    </div>
  );
}

export default function TeamSquadSection({ teamId, teamName }) {
  const numericId = parseInt(teamId, 10);
  const [players, setPlayers] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('ALL');

  // 선수 스탯 모달 상태
  const [activePlayer, setActivePlayer] = useState(null);
  const [playerStats, setPlayerStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  async function handlePlayerClick(player) {
    setActivePlayer(player);
    setStatsLoading(true);
    setPlayerStats(null);
    try {
      const stats = await getPlayerStats(player.playerId);
      setPlayerStats(stats);
    } catch (err) {
      console.error('[TeamSquadSection] 선수 스탯 조회 오류:', err);
    } finally {
      setStatsLoading(false);
    }
  }

  function handleCloseModal() {
    setActivePlayer(null);
    setPlayerStats(null);
  }

  useEffect(() => {
    let isMounted = true;
    async function fetchSquadData() {
      try {
        setLoading(true);
        const [playerList, staffList] = await Promise.all([
          getTeamPlayers(numericId),
          getTeamStaffs(numericId),
        ]);

        if (isMounted) {
          setPlayers(Array.isArray(playerList) ? playerList : []);
          setStaffs(Array.isArray(staffList) ? staffList : []);
        }
      } catch (err) {
        console.error('[TeamSquadSection] 스쿼드 데이터 로드 오류:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (numericId) {
      fetchSquadData();
    }

    return () => {
      isMounted = false;
    };
  }, [numericId]);

  // 감독 (staffRoleId === 1 또는 첫 번째 스태프)
  const manager = staffs.find((s) => s.staffRoleId === 1) || staffs[0] || null;

  // 포지션별 선수 분류 (FW, MF, DF, GK)
  const positions = ['FW', 'MF', 'DF', 'GK'];
  const squad = {
    FW: [],
    MF: [],
    DF: [],
    GK: [],
  };

  players.forEach((p) => {
    const pos = (p.mainPosition || '').toUpperCase();
    if (squad[pos]) {
      squad[pos].push(p);
    } else {
      if (!squad[pos]) squad[pos] = [];
      squad[pos].push(p);
    }
  });

  const totalPlayers = players.length;
  const filterPositions = selectedTab === 'ALL' ? positions : [selectedTab];

  if (loading) {
    return (
      <div className="team-squad-container team-squad-loading">
        <p>선수단 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="team-squad-container">
      {/* 1. 구단 사령탑 (감독) 섹션 */}
      {manager && (
        <section className="team-manager-section">
          <div className="team-squad-section-header">
            <h2 className="team-squad-title">구단 감독</h2>
            <span className="team-squad-subtitle">Head Coach</span>
          </div>

          <div className="team-manager-card">
            <div className="team-manager-info">
              <div>
                <h3 className="team-manager-name">{manager.nameKor || manager.name}</h3>
                {manager.nameKor && manager.name && (
                  <span className="team-manager-name-en">
                    ({manager.name})
                  </span>
                )}
              </div>
              <span className="team-manager-nat-badge">
                <span className="team-nat-text">{manager.nationalityKor || manager.nationality}</span>
              </span>
            </div>
            {getFlagUrl(manager.nationality, manager.nationalityKor) && (
              <img
                src={getFlagUrl(manager.nationality, manager.nationalityKor, 80)}
                alt={manager.nationalityKor || manager.nationality}
                className="team-manager-flag-icon"
                loading="lazy"
              />
            )}
          </div>
        </section>
      )}

      {manager && <div className="team-section-divider" />}

      {/* 2. 포지션별 선수단 (스쿼드) 섹션 */}
      <section className="team-squad-section">
        <div className="team-squad-header-row">
          <div>
            <div className="team-squad-section-header">
              <h2 className="team-squad-title">선수단 스쿼드</h2>
              <span className="team-squad-subtitle">Official Squad ({totalPlayers}명)</span>
            </div>
          </div>

          {/* 포지션 필터 탭 */}
          <div className="team-position-tabs">
            <button
              type="button"
              className={`team-pos-tab ${selectedTab === 'ALL' ? 'is-active' : ''}`}
              onClick={() => setSelectedTab('ALL')}
            >
              전체 ({totalPlayers})
            </button>
            {positions.map((pos) => {
              const count = squad[pos]?.length || 0;
              return (
                <button
                  key={pos}
                  type="button"
                  className={`team-pos-tab ${selectedTab === pos ? 'is-active' : ''}`}
                  onClick={() => setSelectedTab(pos)}
                >
                  {pos} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 포지션별 선수 목록 그리드 및 모바일 스와이프 슬라이더 */}
        <div className="team-squad-groups">
          {filterPositions.map((pos) => {
            const groupPlayers = squad[pos] || [];
            const config = POSITION_CONFIG[pos];

            if (groupPlayers.length === 0) return null;

            return (
              <PositionSquadSlider
                key={pos}
                pos={pos}
                config={config}
                players={groupPlayers}
                onPlayerClick={handlePlayerClick}
              />
            );
          })}
        </div>
      </section>

      {/* 선수 시즌 스탯 모달창 */}
      {activePlayer && (
        <PlayerStatsModal
          player={activePlayer}
          stats={playerStats}
          loading={statsLoading}
          onClose={handleCloseModal}
          teamName={teamName}
        />
      )}
    </div>
  );
}
