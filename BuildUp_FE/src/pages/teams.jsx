import React, { useState, useEffect, useRef } from 'react';
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
          <span className="teams-page-eyebrow">PREMIER LEAGUE{tab === 'league' ? ' · 2026/27' : ''}</span>
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
  const [selectedPlayer, setSelectedPlayer] = useState(null);
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
  return <>
    <p className="standings-note">현재 저장된 선수 기록 기준 · 공격포인트 = 득점 + 도움 · 동일 기록은 공동 순위로 표시합니다.</p>
    <div className="standings-scroll" role="region" aria-label={`${label} 순위표, 가로 스크롤 가능`} tabIndex={0}>
      <table className="standings-table player-rankings-table">
        <caption>{label} TOP {rows.length}</caption>
        <thead><tr><th scope="col">순위</th><th scope="col">선수</th><th scope="col">구단</th>
          <th scope="col">득점</th><th scope="col">도움</th><th scope="col">공격포인트</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.playerId}>
          <td><span className="standings-rank">{row.rank}</span></td>
          <th scope="row"><button type="button" className="ranking-player-link" aria-haspopup="dialog" onClick={() => setSelectedPlayer(row)}>{row.playerNameKor || row.playerName || '선수명 미등록'}</button></th>
          <td><span className="standings-team">{row.emblemUrl && <img src={row.emblemUrl} alt="" width="28" height="28" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />}{row.teamName || '구단명 미등록'}</span></td>
          {['goals', 'assists', 'contributions'].map((field) => <td key={field} className={metric === field ? 'standings-points' : undefined}>
            {field === 'contributions' ? (row.goals ?? 0) + (row.assists ?? 0) : row[field] ?? '—'}
          </td>)}
        </tr>)}</tbody>
      </table>
    </div>
    {selectedPlayer && <RankingPlayerDetails key={selectedPlayer.playerId} player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />}
  </>;
}

const playerPhotoCache = new Map();

function RankingPlayerDetails({ player, onClose }) {
  const dialogRef = useRef(null);
  const [events, setEvents] = useState({ status: 'loading', rows: [] });
  const [attempt, setAttempt] = useState(0);
  const [photo, setPhoto] = useState({ status: 'loading', url: '' });
  const name = player.playerNameKor || player.playerName || '선수명 미등록';

  useEffect(() => {
    const dialog = dialogRef.current;
    const trigger = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = originalOverflow;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 10000);
    fetch(`/api/matches/players/${player.playerId}/events?season=2026`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('기록 조회 실패');
        return response.json();
      })
      .then((rows) => {
        if (!Array.isArray(rows) || rows.some((row) => !row || row.eventId == null
          || ![1, 2].includes(Number(row.eventType))
          || (Number(row.playerId) !== player.playerId && Number(row.assistPlayerId) !== player.playerId))) {
          throw new Error('잘못된 기록 응답');
        }
        if (active) setEvents({ status: 'ready', rows });
      })
      .catch(() => { if (active) setEvents({ status: 'error', rows: [] }); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [player.playerId, attempt]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 8000);
    async function loadPhoto() {
      try {
        let url = playerPhotoCache.get(player.playerId);
        if (url === undefined) {
          if (!player.playerName) throw new Error('선수명 없음');
          const response = await fetch(`https://www.thesportsdb.com/api/v1/json/123/searchplayers.php?p=${encodeURIComponent(player.playerName)}`, { signal: controller.signal });
          if (!response.ok) throw new Error('사진 조회 실패');
          const data = await response.json();
          const normalize = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
          const candidates = (Array.isArray(data.player) ? data.player : []).filter((item) =>
            item.strSport === 'Soccer' && [item.strPlayer, ...(item.strPlayerAlternate || '').split(';')]
              .some((value) => normalize(value) === normalize(player.playerName)));
          const candidate = candidates.length === 1 ? candidates[0] : null;
          const imageUrl = candidate?.strCutout || candidate?.strThumb;
          url = imageUrl && /^https:\/\/(www\.|r2\.)?thesportsdb\.com\//.test(imageUrl) ? imageUrl : '';
          if (url) playerPhotoCache.set(player.playerId, url);
        }
        if (active) setPhoto({ status: url ? 'ready' : 'empty', url });
      } catch {
        if (active) setPhoto({ status: 'empty', url: '' });
      } finally {
        clearTimeout(timeout);
      }
    }
    loadPhoto();
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [player.playerId, player.playerName]);

  return <dialog ref={dialogRef} className="ranking-player-dialog" aria-labelledby="ranking-player-title"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="ranking-player-details">
      <button type="button" className="ranking-player-close" onClick={onClose} aria-label="선수 상세 닫기" autoFocus>닫기 ✕</button>
      <header className="ranking-player-header">
        <div className="ranking-player-photo">
          {photo.status === 'ready' ? <img src={photo.url} alt={`${name} 선수 사진`} onError={() => setPhoto({ status: 'empty', url: '' })} />
            : <span>{photo.status === 'loading' ? '사진 불러오는 중…' : '등록된 선수 사진이 없습니다.'}</span>}
        </div>
        <div><p>26-27 시즌</p><h2 id="ranking-player-title">{name}</h2><p>{player.teamName}</p>
          <p>득점 {player.goals ?? '—'} · 도움 {player.assists ?? '—'}</p>
          {photo.status === 'ready' && <a href="https://www.thesportsdb.com/" target="_blank" rel="noreferrer">사진: TheSportsDB</a>}
        </div>
      </header>
      <p className="standings-note">경기별 상세 기록은 집계된 득점·도움 수와 차이가 있을 수 있습니다. 경기 시작 일시는 한국 시간(KST)입니다.</p>
      {events.status === 'loading' ? <p role="status">득점·도움 기록을 불러오는 중입니다…</p>
        : events.status === 'error' ? <div role="alert"><p>상세 기록을 불러오지 못했습니다.</p><button type="button" onClick={() => { setEvents({ status: 'loading', rows: [] }); setAttempt((value) => value + 1); }}>다시 시도</button></div>
          : [['goals', '득점 기록', 'playerId'], ['assists', '도움 기록', 'assistPlayerId']].map(([key, title, field]) => {
            const rows = events.rows.filter((row) => Number(row[field]) === player.playerId);
            return <section key={key} className="ranking-player-events"><h3>{title} ({rows.length})</h3>
              {rows.length === 0 ? <p>등록된 {title}이 없습니다.</p> : <ul>{rows.map((row) => <li key={row.eventId}>
                <time>{row.matchDate || '일시 미등록'}</time>
                <span>{row.homeTeamName} vs {row.awayTeamName}</span>
                <strong>{row.eventTime == null ? '시간 미등록' : `${row.eventTime}분`}{key === 'goals' && Number(row.eventType) === 2 ? ' · 페널티킥' : ''}</strong>
              </li>)}</ul>}
            </section>;
          })}
    </div>
  </dialog>;
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
        if (!Array.isArray(rows) || !rows.every((row) => isStandingRow(row) && Number(row.season) === season)
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
