import React, { useState, useEffect } from 'react';
import { getTeams, getInitialTeams } from '../api/teamApi.js';
import TeamCard from '../components/team/TeamCard.jsx';
import '../css/teams.css';

export default function TeamsPage() {
  const [ teams, setTeams ] = useState(() => getInitialTeams());
  const [ loading, setLoading ] = useState(false);
  const [ error, setError ] = useState(null);

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

const standingsColumns = [
  [ 'matchesPlayed', '경기수' ], [ 'wins', '승' ], [ 'draws', '무' ],
  [ 'losses', '패' ], [ 'goalsFor', '득점' ], [ 'goalsAgainst', '실점' ],
  [ 'goalDiff', '득실차' ], [ 'points', '승점' ],
];

function isStandingRow(row) {
  return row && typeof row === 'object'
    && Number.isInteger(row.teamId) && row.teamId > 0
    && (row.currentRank == null || (Number.isInteger(row.currentRank) && row.currentRank > 0))
    && standingsColumns.every(([ field ]) => row[field] == null
      || (Number.isInteger(row[field]) && (field === 'goalDiff' || row[field] >= 0)));
}

export function StandingsPage() {
  const [ season, setSeason ] = useState(() => {
    const value = Number(new URLSearchParams(window.location.search).get('season'));
    return [ 2026, 2025, 2024 ].includes(value) ? value : 2026;
  });

  function changeSeason(event) {
    const value = Number(event.target.value);
    const url = new URL(window.location.href);
    url.searchParams.set('season', String(value));
    window.history.replaceState(null, '', url);
    setSeason(value);
  }

  return (
    <main className="teams-page-container">
      <div className="teams-page-wrapper">
        <header className="teams-page-header">
          <span className="teams-page-eyebrow">PREMIER LEAGUE</span>
          <h1 className="teams-page-title">리그 순위표</h1>
          <p className="teams-page-desc">공식 리그 순위 데이터에 따른 구단별 경기 기록입니다.</p>
        </header>
        <div className="standings-toolbar">
          <label htmlFor="standings-season">시즌</label>
          <select id="standings-season" value={season} onChange={changeSeason}>
            {[ 2026, 2025, 2024 ].map((year) => (
              <option key={year} value={year}>{year}/{String(year + 1).slice(-2)}</option>
            ))}
          </select>
        </div>
        <StandingsTable key={season} season={season} />
      </div>
    </main>
  );
}

function StandingsTable({ season }) {
  const [ result, setResult ] = useState({ status: 'loading', rows: [] });
  const [ attempt, setAttempt ] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/teams/standings?season=${season}`, { signal: controller.signal });
        if (!response.ok) throw new Error('순위 조회 실패');
        const rows = await response.json();
        if (!Array.isArray(rows) || !rows.every(isStandingRow)
          || new Set(rows.map((row) => row.teamId)).size !== rows.length) {
          throw new Error('잘못된 순위 응답');
        }
        if (!controller.signal.aborted) {
          setResult({
            status: 'success', rows: [ ...rows ].sort((a, b) =>
              (a.currentRank ?? Infinity) - (b.currentRank ?? Infinity))
          });
        }
      } catch {
        if (!controller.signal.aborted) setResult({ status: 'error', rows: [] });
      }
    }
    load();
    return () => controller.abort();
  }, [ season, attempt ]);

  if (result.status === 'loading') return <p className="standings-message" role="status">순위표를 불러오는 중입니다...</p>;
  if (result.status === 'error') return (
    <div className="standings-message" role="alert">
      <p>순위표를 불러오지 못했습니다.</p>
      <button type="button" onClick={() => {
        setResult({ status: 'loading', rows: [] });
        setAttempt((value) => value + 1);
      }}>다시 시도</button>
    </div>
  );
  if (result.rows.length === 0) return <p className="standings-message" role="status">해당 시즌에 등록된 순위 데이터가 없습니다.</p>;

  const updatedAt = result.rows.map((row) => row.updatedAt).filter(Boolean).sort().at(-1);
  return (
    <>
      <div className="standings-summary">
        <span>시즌 {season}/{String(season + 1).slice(-2)} · <strong>{result.rows.length}개 구단</strong></span>
        <span>전체 경기 기준</span>
      </div>
      <div className="standings-scroll" role="region" aria-label="리그 순위표, 가로 스크롤 가능" tabIndex={0}>
        <table className="standings-table">
          <caption>{season}/{String(season + 1).slice(-2)} 프리미어리그 순위</caption>
          <thead><tr>
            <th scope="col">순위</th><th scope="col">구단</th>
            {standingsColumns.map(([ field, label ]) => <th key={field} scope="col">{label}</th>)}
          </tr></thead>
          <tbody>{result.rows.map((row) => (
            <tr key={row.teamId}>
              <td><span className="standings-rank">{row.currentRank ?? '—'}</span></td>
              <th scope="row"><a className="standings-team" href={`/plug/team/${row.teamId}`}>
                {row.emblemUrl && <img src={row.emblemUrl} alt="" width="28" height="28" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />}
                {row.teamName || '구단명 미등록'}
              </a></th>
              {standingsColumns.map(([ field ]) => (
                <td key={field} className={field === 'points' ? 'standings-points' : undefined}>
                  {row[ field ] == null ? '—' : field === 'goalDiff' && row[ field ] > 0 ? `+${row[ field ]}` : row[ field ]}
                </td>
              ))}
            </tr>
          ))}</tbody>
        </table>
      </div>
      <p className="standings-note">득실차 = 득점 − 실점 · 순위와 승점은 서버에 저장된 리그 기록을 그대로 표시합니다.</p>
      {updatedAt && <p className="standings-note">최근 데이터 갱신: {updatedAt}</p>}
    </>
  );
}
