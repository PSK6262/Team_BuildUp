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
  const tabs = [ ['league', '리그 순위'], ['goals', '득점왕'], ['assists', '도움'], ['contributions', '공격포인트'] ];
  const [ tab, setTab ] = useState(() => {
    const value = new URLSearchParams(window.location.search).get('tab');
    return tabs.some(([ id ]) => id === value) ? value : 'league';
  });
  function changeTab(value) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    url.searchParams.delete('season');
    window.history.replaceState(null, '', url);
    setTab(value);
  }

  return (
    <main className="teams-page-container">
      <div className="teams-page-wrapper">
        <header className="teams-page-header">
          <span className="teams-page-eyebrow">PREMIER LEAGUE · 2026/27</span>
          <h1 className="teams-page-title">리그 & 선수 랭킹</h1>
          <p className="teams-page-desc">구단 순위부터 득점, 도움, 공격포인트까지 한눈에 확인하세요.</p>
        </header>
        <div className="ranking-tabs" role="tablist" aria-label="랭킹 종류">
          {tabs.map(([ id, label ], index) => (
            <button key={id} id={`ranking-tab-${id}`} type="button" role="tab"
              aria-selected={tab === id} aria-controls="ranking-panel" tabIndex={tab === id ? 0 : -1}
              onClick={() => changeTab(id)} onKeyDown={(event) => {
                const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length
                  : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length
                    : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : null;
                if (next == null) return;
                event.preventDefault();
                changeTab(tabs[next][0]);
                document.getElementById(`ranking-tab-${tabs[next][0]}`).focus();
              }}>{label}</button>
          ))}
        </div>
        <section id="ranking-panel" role="tabpanel" aria-labelledby={`ranking-tab-${tab}`} tabIndex={0}>
        {tab === 'league' ? <StandingsTable season={2026} />
          : <PlayerRankings key={tab} metric={tab} label={tabs.find(([ id ]) => id === tab)[1]} />}
        </section>
      </div>
    </main>
  );
}

function PlayerRankings({ metric, label }) {
  const [ result, setResult ] = useState({ status: 'loading', rows: [] });
  const [ attempt, setAttempt ] = useState(0);
  const score = (row) => metric === 'contributions' ? (row.goals ?? 0) + (row.assists ?? 0) : row[metric] ?? 0;

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/teams/player-rankings?metric=${metric}`, { signal: controller.signal });
        if (!response.ok) throw new Error('선수 순위 조회 실패');
        const rows = await response.json();
        if (!Array.isArray(rows) || rows.some((row) => !row || !Number.isInteger(row.playerId)
          || ['goals', 'assists'].some((field) => row[field] != null && (!Number.isInteger(row[field]) || row[field] < 0)))) {
          throw new Error('잘못된 선수 기록');
        }
        if (!controller.signal.aborted) setResult({ status: 'success', rows });
      } catch {
        if (!controller.signal.aborted) setResult({ status: 'error', rows: [] });
      }
    }
    load();
    return () => controller.abort();
  }, [ metric, attempt ]);

  if (result.status === 'loading') return <p className="standings-message" role="status">{label} 랭킹을 불러오는 중입니다...</p>;
  if (result.status === 'error') return <div className="standings-message" role="alert">
    <p>선수 랭킹을 불러오지 못했습니다.</p>
    <button type="button" onClick={() => { setResult({ status: 'loading', rows: [] }); setAttempt((value) => value + 1); }}>다시 시도</button>
  </div>;
  if (!result.rows.length) return <p className="standings-message" role="status">등록된 {label} 기록이 없습니다.</p>;

  const rows = [...result.rows].sort((a, b) => score(b) - score(a)).map((row, _index, sorted) => ({
    ...row, rank: sorted.findIndex((other) => score(other) === score(row)) + 1,
  }));
  const leader = rows[0];
  return <>
    <div className="player-ranking-hero">
      <div><span className="player-ranking-kicker">{label} TOP 20</span>
        <h2>{leader.playerNameKor || leader.playerName || '선수명 미등록'}</h2>
        <p>{leader.teamName} · {rows.filter((row) => row.rank === 1).length > 1 ? '공동 1위' : '1위'}</p>
      </div>
      <div className="player-ranking-score"><strong>{score(leader)}</strong><span>{metric === 'goals' ? '골' : metric === 'assists' ? '도움' : '공격포인트'}</span></div>
    </div>
    <p className="standings-note">현재 저장된 선수 기록 기준 · 공격포인트 = 득점 + 도움 · 동일 기록은 공동 순위로 표시합니다.</p>
    <div className="standings-scroll" role="region" aria-label={`${label} 순위표, 가로 스크롤 가능`} tabIndex={0}>
      <table className="standings-table player-rankings-table">
        <caption>{label} TOP {rows.length}</caption>
        <thead><tr><th scope="col">순위</th><th scope="col">선수</th><th scope="col">구단</th>
          <th scope="col">득점</th><th scope="col">도움</th><th scope="col">공격포인트</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.playerId}>
          <td><span className="standings-rank">{row.rank}</span></td>
          <th scope="row">{row.playerNameKor || row.playerName || '선수명 미등록'}</th>
          <td><span className="standings-team">{row.emblemUrl && <img src={row.emblemUrl} alt="" width="28" height="28" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />}{row.teamName || '구단명 미등록'}</span></td>
          {['goals', 'assists', 'contributions'].map((field) => <td key={field} className={metric === field ? 'standings-points' : undefined}>
            {field === 'contributions' ? (row.goals ?? 0) + (row.assists ?? 0) : row[field] ?? '—'}
          </td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </>;
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
