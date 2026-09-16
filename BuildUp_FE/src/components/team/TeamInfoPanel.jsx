import React from 'react';
import TeamNav from './TeamNav.jsx';

export default function TeamInfoPanel({ team, prevTeam, nextTeam }) {
  return (
    <main className="team-right">
      <div className="team-right-inner">
        {/* 상단 내비게이션 바 */}
        <TeamNav prevTeam={prevTeam} nextTeam={nextTeam} />

        {/* 1. 홈구장 섹션 */}
        <section className="team-stadium-section">
          <h2 className="team-stadium-name">{team.homeGround}</h2>
          <p className="team-stadium-desc">
            {team.teamName}의 역사와 열정이 살아 숨 쉬는 공식 연고 홈 경기장입니다.
          </p>
        </section>

        <div className="team-section-divider" />

        {/* 2. 구단 역사 섹션 */}
        <section className="team-history-section">
          <h2 className="team-history-title">{team.teamName}의 역사와 발자취</h2>
          <div className="team-history-body">
            <p className="team-history-text">{team.history}</p>
          </div>
        </section>
      </div>
    </main>
  );
}

