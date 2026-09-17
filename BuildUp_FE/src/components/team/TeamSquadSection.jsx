import React, { useState } from 'react';
import teamSquadData from '../../data/teamSquadData.js';
import { getFlagUrl } from '../../utils/flagUtils.js';

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
  const clubData =
    teamSquadData[numericId] ||
    teamSquadData[String(numericId)] ||
    Object.values(teamSquadData).find(
      (c) => c.apiTeamId === numericId || c.teamId === numericId
    );
  const [selectedTab, setSelectedTab] = useState('ALL');

  if (!clubData) {
    return null;
  }

  const { manager, squad } = clubData;
  const positions = ['FW', 'MF', 'DF', 'GK'];
  const totalPlayers = positions.reduce(
    (acc, pos) => acc + (squad[pos]?.length || 0),
    0
  );

  const filterPositions =
    selectedTab === 'ALL' ? positions : [selectedTab];

  return (
    <div className="team-squad-container">
      {/* 1. 구단 사령탑 (감독) 섹션 */}
      <section className="team-manager-section">
        <div className="team-squad-section-header">
          <h2 className="team-squad-title">구단 감독</h2>
          <span className="team-squad-subtitle">Head Coach</span>
        </div>

        <div className="team-manager-card">
          <div className="team-manager-info">
            <h3 className="team-manager-name">{manager.name}</h3>
            <span className="team-manager-nat-badge">
              <span className="team-nat-text">{manager.koreanNation}</span>
            </span>
          </div>
          {getFlagUrl(manager.nationality, manager.koreanNation) && (
            <img
              src={getFlagUrl(manager.nationality, manager.koreanNation, 80)}
              alt={manager.koreanNation}
              className="team-manager-flag-icon"
              loading="lazy"
            />
          )}
        </div>
      </section>

      <div className="team-section-divider" />

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
            const players = squad[pos] || [];
            const config = POSITION_CONFIG[pos];

            if (players.length === 0) return null;

            return (
              <div key={pos} className="team-squad-group">
                <div className="team-group-header">
                  <h3 className="team-group-title">
                    {config.label}
                    <span className="team-group-code">({pos})</span>
                  </h3>
                  <span className="team-group-count">{players.length}명</span>
                </div>

                <div className="team-player-grid">
                  {players.map((player) => (
                    <div key={player.id} className="team-player-card">
                      <div className="team-player-card-top">
                        <span className={`team-player-pos-badge ${config.badgeClass}`}>
                          {pos}
                        </span>
                        <div className="team-player-nat-pill">
                          <span className="team-player-nat-name">
                            {player.koreanNation}
                          </span>
                        </div>
                      </div>

                      <div className="team-player-card-bottom">
                        <div className="team-player-name" title={player.name}>
                          {player.name}
                        </div>
                        {getFlagUrl(player.nationality, player.koreanNation) && (
                          <img
                            src={getFlagUrl(player.nationality, player.koreanNation, 40)}
                            alt={player.koreanNation}
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
    </div>
  );
}

