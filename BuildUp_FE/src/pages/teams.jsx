import React, { useState, useEffect } from 'react';
import { getTeams, getInitialTeams } from '../api/teamApi.js';
import TeamCard from '../components/team/TeamCard.jsx';
import '../css/teams.css';

export default function TeamsPage() {
  const [teams, setTeams] = useState(() => getInitialTeams());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      try {
        setLoading(true);
        const data = await getTeams();
        if (isMounted) {
          setTeams(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[TeamsPage] 구단 목록 로드 오류:', err);
          setError('구단 데이터를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="teams-page-container">
      <div className="teams-page-wrapper">
        {/* 상단 헤더 영역 */}
        <header className="teams-page-header">
          <span className="teams-page-eyebrow">PREMIER LEAGUE</span>
          <h1 className="teams-page-title">20개 구단 소개</h1>
          <p className="teams-page-desc">
            프리미어리그를 빛내는 20개 구단의 엠블럼과 역사, 응원가를 확인해 보세요!
          </p>
        </header>

        {/* 로딩 인디케이터 (초기 데이터 없을 때만 표시) */}
        {loading && teams.length === 0 && (
          <div className="teams-loading-wrap" style={{ textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
            <p>구단 데이터를 데이터베이스에서 불러오는 중입니다...</p>
          </div>
        )}

        {/* 에러 메시지 */}
        {!loading && error && teams.length === 0 && (
          <div className="teams-error-wrap" style={{ textAlign: 'center', padding: '40px 0', color: '#ef4444' }}>
            <p>{error}</p>
          </div>
        )}

        {/* 4열 5행 구단 카드 그리드 (총 20개 구단) */}
        {teams.length > 0 && (
          <main className="teams-grid" aria-label="프리미어리그 20개 구단 목록">
            {teams.map((team) => (
              <TeamCard key={team.teamId} team={team} />
            ))}
          </main>
        )}
      </div>
    </div>
  );
}

export { TeamsPage };
