import React from 'react';
import teamsData from '../../Assets/data/teamsData.js';
import TeamVisualPanel from '../components/team/TeamVisualPanel.jsx';
import TeamInfoPanel from '../components/team/TeamInfoPanel.jsx';
import TeamNotFound from '../components/team/TeamNotFound.jsx';
import '../css/team.css';

export default function Team({ teamId }) {
  const numericId = parseInt(teamId, 10);
  const teamIndex = teamsData.findIndex((t) => t.teamId === numericId);
  const team = teamsData[teamIndex];

  if (!team) {
    return <TeamNotFound teamId={teamId} />;
  }

  const prevTeam = teamsData[(teamIndex - 1 + teamsData.length) % teamsData.length];
  const nextTeam = teamsData[(teamIndex + 1) % teamsData.length];

  return (
    <div className="team-container">
      {/* 좌측 30% 영역: 엠블럼 풀배경 & 창단연도 & 구단명 & 오디오 플레이어 */}
      <TeamVisualPanel team={team} />

      {/* 우측 70% 영역: 화이트 에디토리얼 홈구장 & 역사 소개 및 내비게이션 */}
      <TeamInfoPanel team={team} prevTeam={prevTeam} nextTeam={nextTeam} />
    </div>
  );
}

export { Team };
