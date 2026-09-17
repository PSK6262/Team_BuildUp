import React, { useRef } from 'react';
import teamsData from '../../Assets/data/teamsData.js';
import TeamVisualPanel from '../components/team/TeamVisualPanel.jsx';
import TeamInfoPanel from '../components/team/TeamInfoPanel.jsx';
import TeamNotFound from '../components/team/TeamNotFound.jsx';
import '../css/team.css';

export default function Team({ teamId }) {
  const numericId = parseInt(teamId, 10);
  const teamIndex = teamsData.findIndex((t) => t.teamId === numericId);
  const team = teamsData[teamIndex];

  const rightPanelRef = useRef(null);

  if (!team) {
    return <TeamNotFound teamId={teamId} />;
  }

  const prevTeam = teamsData[(teamIndex - 1 + teamsData.length) % teamsData.length];
  const nextTeam = teamsData[(teamIndex + 1) % teamsData.length];

  // 좌측 고정 패널 위에서 마우스 휠을 굴려도 우측 스크롤 영역이 자연스럽게 스크롤되도록 연동
  const handleLeftWheel = (e) => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop += e.deltaY;
    }
  };

  return (
    <div className="team-container">
      {/* 좌측 30% 고정 영역: 엠블럼 풀배경 & 창단연도 & 구단명 & 오디오 플레이어 */}
      <TeamVisualPanel team={team} onWheel={handleLeftWheel} />

      {/* 우측 70% 스크롤 영역: 화이트 에디토리얼 홈구장 & 역사 소개 및 내비게이션, 선수단 */}
      <TeamInfoPanel ref={rightPanelRef} team={team} prevTeam={prevTeam} nextTeam={nextTeam} />
    </div>
  );
}

export { Team };
