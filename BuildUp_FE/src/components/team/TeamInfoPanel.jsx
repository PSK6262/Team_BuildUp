import React, { forwardRef } from 'react';
import TeamNav from './TeamNav.jsx';
import TeamSquadSection from './TeamSquadSection.jsx';

const TeamInfoPanel = forwardRef(function TeamInfoPanel(
  { team, prevTeam, nextTeam },
  ref
) {
  return (
    <main ref={ref} className="team-right">
      <div className="team-right-inner">
        {/* 상단 내비게이션 바 */}
        <TeamNav prevTeam={prevTeam} nextTeam={nextTeam} />

        {/* 1. 홈구장 섹션 */}
        <section className="team-stadium-section">
          <h2 className="team-stadium-name">{team.homeGroundKor || team.homeGround}</h2>
          {team.homeGround && (
            <p className="team-stadium-desc">{team.homeGround}</p>
          )}
        </section>

        <div className="team-section-divider" />

        {/* 2. 구단 역사 섹션 */}
        <section className="team-history-section">
          <h2 className="team-history-title">{team.teamNameKor || team.teamName}의 역사와 발자취</h2>
          <div className="team-history-body">
            <p className="team-history-text">{team.history}</p>
          </div>
        </section>

        <div className="team-section-divider" />

        {/* 3. 구단 감독 및 포지션별 선수단 (스쿼드) 섹션 */}
        <TeamSquadSection teamId={team.teamId} />
      </div>
    </main>
  );
});

export default TeamInfoPanel;

