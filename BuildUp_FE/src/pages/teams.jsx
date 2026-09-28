import React, { useState, useEffect, useRef } from 'react';
import { getTeams, getInitialTeams } from '../api/teamApi.js';
import TeamCard from '../components/team/TeamCard.jsx';
import '../css/teams.css';

export default function TeamsPage() {
  const dispatch = useDispatch();
  const { teams, teamsLoading: loading, teamsError: error } = useSelector((state) => state.team);

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

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

// 프리미어리그 구단 한글명 매핑 사전
const TEAM_NAMES_KOR = {
  57: '아스널 FC', 2: '아스널 FC',
  58: '애스턴 빌라 FC', 3: '애스턴 빌라 FC',
  61: '첼시 FC', 6: '첼시 FC',
  62: '에버튼 FC', 9: '에버튼 FC',
  63: '풀럼 FC', 10: '풀럼 FC',
  64: '리버풀 FC', 13: '리버풀 FC',
  65: '맨체스터 시티 FC', 14: '맨체스터 시티 FC',
  66: '맨체스터 유나이티드 FC', 15: '맨체스터 유나이티드 FC',
  67: '뉴캐슬 유나이티드 FC', 16: '뉴캐슬 유나이티드 FC',
  71: '선덜랜드 AFC',
  73: '토트넘 홋스퍼 FC', 19: '토트넘 홋스퍼 FC',
  76: '울버햄튼 원더러스 FC', 7: '울버햄튼 원더러스 FC',
  328: '번리 FC',
  338: '레스터 시티 FC', 12: '레스터 시티 FC',
  340: '사우샘프턴 FC', 18: '사우샘프턴 FC',
  341: '리즈 유나이티드 FC',
  349: '입스위치 타운 FC', 11: '입스위치 타운 FC',
  351: '노팅엄 포레스트 FC', 17: '노팅엄 포레스트 FC',
  354: '크리스탈 팰리스 FC', 8: '크리스탈 팰리스 FC',
  397: '브라이튼 & 호브 알비온 FC', 5: '브라이튼 & 호브 알비온 FC',
  402: '브렌트포드 FC', 4: '브렌트포드 FC',
  563: '웨스트햄 유나이티드 FC', 20: '웨스트햄 유나이티드 FC',
  1044: 'AFC 본머스', 1: 'AFC 본머스',
  'Arsenal FC': '아스널 FC',
  'Aston Villa FC': '아스턴 빌라 FC',
  'Chelsea FC': '첼시 FC',
  'Everton FC': '에버튼 FC',
  'Fulham FC': '풀럼 FC',
  'Liverpool FC': '리버풀 FC',
  'Manchester City FC': '맨체스터 시티 FC',
  'Manchester United FC': '맨체스터 유나이티드 FC',
  'Newcastle United FC': '뉴캐슬 유나이티드 FC',
  'Tottenham Hotspur FC': '토트넘 홋스퍼 FC',
  'Wolverhampton Wanderers FC': '울버햄튼 원더러스 FC',
  'Burnley FC': '번리 FC',
  'Leicester City FC': '레스터 시티 FC',
  'Southampton FC': '사우샘프턴 FC',
  'Ipswich Town FC': '입스위치 타운 FC',
  'Nottingham Forest FC': '노팅엄 포레스트 FC',
  'Crystal Palace FC': '크리스탈 팰리스 FC',
  'Brighton & Hove Albion FC': '브라이튼 & 호브 알비온 FC',
  'Brentford FC': '브렌트포드 FC',
  'West Ham United FC': '웨스트햄 유나이티드 FC',
  'AFC Bournemouth': 'AFC 본머스',
};

function getTeamNameKor(teamId, teamName) {
  if (teamId && TEAM_NAMES_KOR[Number(teamId)]) return TEAM_NAMES_KOR[Number(teamId)];
  if (teamName && TEAM_NAMES_KOR[teamName]) return TEAM_NAMES_KOR[teamName];
  return teamName || '구단명 미등록';
}

// 프리미어리그 주요 스타 선수 한글명 사전
const PLAYER_NAMES_KOR = {
  'Erling Haaland': '엘링 홀란',
  'Mohamed Salah': '모하메드 살라',
  'Son Heung-min': '손흥민',
  'Heung-min Son': '손흥민',
  'Bukayo Saka': '부카요 사카',
  'Cole Palmer': '콜 파머',
  'Kevin De Bruyne': '케빈 더 브라위너',
  'Bruno Fernandes': '브루노 페르난데스',
  'Ollie Watkins': '올리 왓킨스',
  'Alexander Isak': '알렉산데르 이삭',
  'Phil Foden': '필 포든',
  'Declan Rice': '데클란 라이스',
  'Martin Ødegaard': '마르틴 외데고르',
  'Rodri': '로드리',
  'Virgil van Dijk': '버질 반 다이크',
  'Nicolas Jackson': '니콜라 잭슨',
  'Kai Havertz': '카이 하베르츠',
  'Dominic Solanke': '도미닉 솔랑케',
  'Bryan Mbeumo': '브라이언 음뵈모',
  'Chris Wood': '크리스 우드',
  'Yoane Wissa': '요안 위사',
  'Matheus Cunha': '마테우스 쿠냐',
  'Hwang Hee-chan': '황희찬',
  'Hee-chan Hwang': '황희찬',
  'Kaoru Mitoma': '미토마 카오루',
  'Luis Díaz': '루이스 디아스',
  'Darwin Núñez': '다르윈 누녜스',
  'Cody Gakpo': '코디 학포',
  'Alejandro Garnacho': '알레한드로 가르나초',
  'Rasmus Højlund': '라스무스 회이룬',
  'Marcus Rashford': '마커스 래시포드',
  'Brennan Johnson': '브레넌 존슨',
  'James Maddison': '제임스 매디슨',
  'Dejan Kulusevski': '데얀 쿨루셉스키',
  'Bernardo Silva': '베르나르두 실바',
  'Ilkay Gündogan': '일카이 귄도안',
  'Eberechi Eze': '에베레치 에제',
  'Jean-Philippe Mateta': '장필리프 마테타',
  'Jarrod Bowen': '재러드 보웬',
  'Lucas Paquetá': '루카스 파케타',
  'Liam Delap': '리암 델랍',
  'Danny Welbeck': '대니 웰백',
  'Raúl Jiménez': '라울 히메네스',
  'Alex Iwobi': '알렉스 이워비',
  'Dwight McNeil': '드와이트 맥닐',
  'Antoine Semenyo': '앙투안 세메뇨',
  'Evanilson': '에바니우송',
  'Justin Kluivert': '저스틴 클라위버르트',
  'Emile Smith Rowe': '에밀 스미스 로우',
};

function getPlayerNameKor(name, korName) {
  if (korName && String(korName).trim()) return korName;
  if (!name) return '선수명 미등록';
  const trimmed = String(name).trim();
  if (PLAYER_NAMES_KOR[trimmed]) return PLAYER_NAMES_KOR[trimmed];
  return trimmed;
}

const standingsColumns = [
  [ 'matchesPlayed', '경기' ], [ 'wins', '승' ], [ 'draws', '무' ],
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
  const tabs = [ ['league', '리그 순위표'], ['goals', '득점랭킹'], ['assists', '도움랭킹'], ['contributions', '공격포인트 순위'] ];
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

  if (result.status === 'loading') return <p className="standings-message" role="status">{label}을(를) 불러오는 중입니다...</p>;
  if (result.status === 'error') return <div className="standings-message" role="alert">
    <p>선수 랭킹 데이터를 불러오지 못했습니다.</p>
    <button type="button" onClick={() => { setResult({ status: 'loading', rows: [] }); setAttempt((value) => value + 1); }}>다시 시도</button>
  </div>;
  if (!result.rows.length) return <p className="standings-message" role="status">등록된 {label} 데이터가 없습니다.</p>;

  const rows = [...result.rows].sort((a, b) => score(b) - score(a)).map((row, _index, sorted) => ({
    ...row, rank: sorted.findIndex((other) => score(other) === score(row)) + 1,
  }));
  return <>
    <p className="standings-note">현재 저장된 선수 기록 기준 · 공격포인트 = 득점 + 도움 · 동일 기록은 공동 순위로 표시합니다.</p>
    <div className="standings-scroll" role="region" aria-label={`${label} 순위표, 가로 스크롤 가능`} tabIndex={0}>
      <table className="standings-table player-rankings-table">
        <caption>{label} 상위 {rows.length}명</caption>
        <thead><tr><th scope="col">순위</th><th scope="col">선수명</th><th scope="col">소속 구단</th>
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

  if (result.status === 'loading') return <p className="standings-message" role="status">프리미어리그 순위표를 불러오는 중입니다...</p>;
  if (result.status === 'error') return (
    <div className="standings-message" role="alert">
      <p>순위표 데이터를 불러오지 못했습니다.</p>
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
        <span><strong>{season}/{String(season + 1).slice(-2)} 시즌</strong> · 총 <strong>{result.rows.length}개 구단</strong></span>
        <span>전체 경기 성적 기준</span>
      </div>
      <div className="standings-scroll" role="region" aria-label="프리미어리그 순위표, 가로 스크롤 가능" tabIndex={0}>
        <table className="standings-table">
          <caption>{season}/{String(season + 1).slice(-2)} 프리미어리그 공식 순위표</caption>
          <thead><tr>
            <th scope="col">순위</th><th scope="col">구단명</th>
            {standingsColumns.map(([ field, label ]) => <th key={field} scope="col">{label}</th>)}
          </tr></thead>
          <tbody>{result.rows.map((row) => {
            const teamKor = row.teamNameKor || getTeamNameKor(row.teamId, row.teamName);
            return (
              <tr key={row.teamId}>
                <td><span className="standings-rank">{row.currentRank ?? '—'}</span></td>
                <th scope="row"><a className="standings-team" href={`/plug/team/${row.teamId}`} title={`${teamKor} 상세 정보 보기`}>
                  {row.emblemUrl && <img src={row.emblemUrl} alt="" width="28" height="28" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />}
                  <span style={{ fontWeight: 700 }}>{teamKor}</span>
                  {row.teamName && teamKor !== row.teamName && (
                    <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '5px' }}>({row.teamName})</span>
                  )}
                </a></th>
                {standingsColumns.map(([ field ]) => (
                  <td key={field} className={field === 'points' ? 'standings-points' : undefined}>
                    {row[ field ] == null ? '—' : field === 'goalDiff' && row[ field ] > 0 ? `+${row[ field ]}` : row[ field ]}
                  </td>
                ))}
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <p className="standings-note">순위 산정 기준: 승점 → 득실차 → 다득점 순입니다. (상위 1~4위 챔피언스리그 진출권 / 18~20위 강등권)</p>
      {updatedAt && <p className="standings-note">최근 순위 갱신 일시: {updatedAt}</p>}
    </>
  );
}

export function MemberRankings({ type, refreshKey = 0 }) {
  const [result, setResult] = useState({ status: 'loading', rows: [] });
  const [attempt, setAttempt] = useState(0);
  const userId = useSelector((state) => state.auth.user?.userId);
  const prediction = type === 'prediction';
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timer = setTimeout(() => controller.abort(), 15000);
    setResult({ status: 'loading', rows: [] });
    fetch(prediction ? '/api/predictions/rankings' : '/api/customs/rankings', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('조회 실패');
        const data = await response.json();
        if (!Array.isArray(data.rankings) || !data.rankings.every((row) => row && row.userId != null
          && Number.isInteger(row[prediction ? 'predictWin' : 'wins'])
          && Number.isInteger(row[prediction ? 'predictTotal' : 'totalMatches']))) throw new Error('응답 오류');
        if (active) setResult({ status: 'ready', rows: data.rankings });
      })
      .catch(() => { if (active) setResult({ status: 'error', rows: [] }); })
      .finally(() => clearTimeout(timer));
    return () => { active = false; clearTimeout(timer); controller.abort(); };
  }, [prediction, attempt, refreshKey]);
  return <section className="member-rankings" aria-label={prediction ? '승부예측 적중 랭킹' : '가상 대결 승리수 랭킹'}>
    <h2>{prediction ? '승부예측 적중' : '나만의 팀 가상 대결 승리수'} TOP 10</h2>
    <p>{prediction ? '정산된 예측의 적중 수 → 적중률 순입니다.' : '로그인 후 진행한 가상 대결의 승리수 → 승률 순입니다. 무승부는 승리에 포함되지 않습니다.'}</p>
    <div className="member-ranking-actions">
      <a href={prediction ? '/plug/prediction' : '/plug/myteam'}>{prediction ? '승부예측 참여하기' : '나만의 팀 대결하기'}</a>
      <button type="button" disabled={result.status === 'loading'} onClick={() => setAttempt((value) => value + 1)}>새로고침</button>
    </div>
    {result.status === 'loading' ? <p role="status">랭킹을 불러오는 중입니다...</p>
      : result.status === 'error' ? <p role="alert">랭킹을 불러오지 못했습니다. 새로고침으로 다시 시도해주세요.</p>
      : result.rows.length === 0 ? <p>아직 집계된 기록이 없습니다.</p>
      : <div className="member-ranking-scroll"><table className="standings-table">
        <thead><tr><th scope="col">순위</th><th scope="col">회원</th>{!prediction && <th scope="col">팀</th>}<th scope="col">{prediction ? '적중' : '승리'}</th><th scope="col">{prediction ? '정산 예측' : '대결'}</th><th scope="col">{prediction ? '적중률' : '승률'}</th>{!prediction && <><th scope="col">무승부</th><th scope="col">패배</th></>}</tr></thead>
        <tbody>{result.rows.map((row, index) => {
          const wins = prediction ? row.predictWin : row.wins;
          const total = prediction ? row.predictTotal : row.totalMatches;
          const mine = userId != null && String(userId) === String(row.userId);
          return <tr key={row.userId} className={mine ? 'member-ranking-mine' : undefined}>
            <td>{index + 1}</td><th scope="row">{row.nickname || '회원'}{mine && ' (나)'}</th>
            {!prediction && <td>{row.teamName}</td>}<td><strong>{wins}</strong></td><td>{total}</td><td>{(total ? wins / total * 100 : 0).toFixed(1)}%</td>
            {!prediction && <><td>{row.draws}</td><td>{row.losses}</td></>}
          </tr>;
        })}</tbody>
      </table></div>}
  </section>;
}
