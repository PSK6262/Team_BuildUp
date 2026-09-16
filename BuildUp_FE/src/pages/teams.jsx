import React from 'react';
import teamsData from '../../Assets/data/teamsData.js';
import TeamCard from '../components/team/TeamCard.jsx';
import '../css/teams.css';

export default function TeamsPage() {
  return (
    <div className="teams-page-container">
      <div className="teams-page-wrapper">
        {/* 상단 헤더 영역 */}
        <header className="teams-page-header">
          <span className="teams-page-eyebrow">PREMIER LEAGUE</span>
          <h1 className="teams-page-title">20개 구단 소개</h1>
          <p className="teams-page-desc">
            잉글랜드 프리미어리그를 빛내는 20개 구단의 고유 엠블럼과 역사, 공식 응원가를 확인해 보겠나.....
          </p>
        </header>

        {/* 4열 5행 구단 카드 그리드 (총 20개 구단) */}
        <main className="teams-grid" aria-label="프리미어리그 20개 구단 목록">
          {teamsData.map((team) => (
            <TeamCard key={team.teamId} team={team} />
          ))}
        </main>
      </div>
    </div>
  );
}

export { TeamsPage };

