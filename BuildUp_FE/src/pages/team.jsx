import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { getTeamById, getTeams } from '../api/teamApi.js';
import TeamVisualPanel from '../components/team/TeamVisualPanel.jsx';
import TeamInfoPanel from '../components/team/TeamInfoPanel.jsx';
import TeamNav from '../components/team/TeamNav.jsx';
import TeamNotFound from '../components/team/TeamNotFound.jsx';
import '../css/team.css';

const LEGACY_ID_MAP = {
  1: 1044, 2: 57, 3: 58, 4: 402, 5: 397, 6: 61, 7: 1076, 8: 354, 9: 62, 10: 63,
  11: 322, 12: 349, 13: 341, 14: 64, 15: 65, 16: 66, 17: 67, 18: 351, 19: 71, 20: 73
};

export default function Team({ teamId }) {
  const currentTheme = useSelector((state) => state.theme?.mode || 'dark');
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

    window.scrollTo(0, 0);
    loadTeamData();

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  useEffect(() => {
    document.body.classList.remove('mainpage-intro-active');
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
  }, []);

  const handleLeftWheel = () => {};

  if (loading) {
    return (
      <div className={`team-container team-container--loading team-container--${currentTheme}`}>
        <p>구단 정보를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!team) {
    return <TeamNotFound teamId={teamId} />;
  }

  const highResEmblem = (team.emblemUrl || '').replace('/50/', '/100/');

  return (
    <div className={`team-container team-container--${currentTheme}`}>
      {/* 반응형 웹(모바일/태블릿) 전용 상단 내비게이션 바 아래 이동 줄 */}
      <div className="team-mobile-top-nav">
        <TeamNav prevTeam={prevTeam || team} nextTeam={nextTeam || team} />
      </div>

      {/* 좌측 구단 고유 컬러(엠블럼 색감)가 우측 다크 퍼플 배경으로 자연스럽게 스며드는 그라데이션 블러 글로우 */}
      <div
        className="team-ambient-bleed"
        style={{ backgroundImage: `url(${highResEmblem || team.emblemUrl})` }}
        aria-hidden="true"
      />

      {/* 좌측 32% 고정 영역: 엠블럼 풀배경 & 창단연도 & 구단명 & 오디오 플레이어 */}
      <TeamVisualPanel team={team} onWheel={handleLeftWheel} />

      {/* 우측 68% 스크롤 영역: 다크 글래스모피즘 홈구장 & 역사 소개 및 내비게이션, 선수단 */}
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
