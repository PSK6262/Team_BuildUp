import React, { useState, useEffect } from 'react';
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

export default function TeamSquadSection({ teamId }) {
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
      <div className="team-squad-container" style={{ padding: '30px 0', textAlign: 'center', color: '#64748b' }}>
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
                  <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600, display: 'block', marginTop: '1px' }}>
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

        {/* 포지션별 선수 목록 그리드 */}
        <div className="team-squad-groups">
          {filterPositions.map((pos) => {
            const groupPlayers = squad[pos] || [];
            const config = POSITION_CONFIG[pos];

            if (groupPlayers.length === 0) return null;

            return (
              <div key={pos} className="team-squad-group">
                <div className="team-group-header">
                  <h3 className="team-group-title">
                    {config.label}
                    <span className="team-group-code">({pos})</span>
                  </h3>
                  <span className="team-group-count">{groupPlayers.length}명</span>
                </div>

                <div className="team-player-grid">
                  {groupPlayers.map((player) => (
                    <div
                      key={player.playerId || player.id || player.name}
                      className="team-player-card"
                      onClick={() => handlePlayerClick(player)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePlayerClick(player);
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
                        <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
                          <div className="team-player-name" title={player.name}>
                            {player.nameKor || player.name}
                          </div>
                          {player.nameKor && player.name && (
                            <div style={{ fontSize: '11px', color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
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
              </div>
            );
          })}
        </div>
      </section>

      {/* 선수 시즌 스탯 모달창 */}
      <PlayerStatsModal
        player={activePlayer}
        stats={playerStats}
        loading={statsLoading}
        onClose={handleCloseModal}
      />
    </div>
  );
}
