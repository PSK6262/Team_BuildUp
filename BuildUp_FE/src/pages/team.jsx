import React, { useState, useEffect, useRef } from 'react';
import { getTeamById, getTeams } from '../api/teamApi.js';
import TeamVisualPanel from '../components/team/TeamVisualPanel.jsx';
import TeamInfoPanel from '../components/team/TeamInfoPanel.jsx';
import TeamNotFound from '../components/team/TeamNotFound.jsx';
import '../css/team.css';

const LEGACY_ID_MAP = {
  1: 1044, 2: 57, 3: 58, 4: 402, 5: 397, 6: 61, 7: 1076, 8: 354, 9: 62, 10: 63,
  11: 322, 12: 349, 13: 341, 14: 64, 15: 65, 16: 66, 17: 67, 18: 351, 19: 71, 20: 73
};

export default function Team({ teamId }) {
  const numericId = parseInt(teamId, 10);
  const effectiveId = LEGACY_ID_MAP[numericId] || numericId;

  const [team, setTeam] = useState(null);
  const [prevTeam, setPrevTeam] = useState(null);
  const [nextTeam, setNextTeam] = useState(null);
  const [loading, setLoading] = useState(true);

  const rightPanelRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTeamData() {
      try {
        setLoading(true);
        const [targetTeam, allTeams] = await Promise.all([
          getTeamById(effectiveId),
          getTeams()
        ]);

        if (isMounted) {
          setTeam(targetTeam);

          if (Array.isArray(allTeams) && allTeams.length > 0) {
            const teamIndex = allTeams.findIndex((t) => t.teamId === effectiveId);
            if (teamIndex !== -1) {
              setPrevTeam(allTeams[(teamIndex - 1 + allTeams.length) % allTeams.length]);
              setNextTeam(allTeams[(teamIndex + 1) % allTeams.length]);
            }
          }
        }
      } catch (err) {
        console.error('[TeamPage] 구단 상세 로드 오류:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTeamData();

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  // 좌측 고정 패널 위에서 마우스 휠을 굴려도 우측 스크롤 영역이 자연스럽게 스크롤되도록 연동
  const handleLeftWheel = (e) => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop += e.deltaY;
    }
  };

  if (loading) {
    return (
      <div className="team-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0d14', color: '#ffffff' }}>
        <p>구단 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!team) {
    return <TeamNotFound teamId={teamId} />;
  }

  return (
    <div className="team-container">
      {/* 좌측 30% 고정 영역: 엠블럼 풀배경 & 창단연도 & 구단명 & 오디오 플레이어 */}
      <TeamVisualPanel team={team} onWheel={handleLeftWheel} />

      {/* 우측 70% 스크롤 영역: 화이트 에디토리얼 홈구장 & 역사 소개 및 내비게이션, 선수단 */}
      <TeamInfoPanel
        ref={rightPanelRef}
        team={team}
        prevTeam={prevTeam || team}
        nextTeam={nextTeam || team}
      />
    </div>
  );
}

export { Team };
