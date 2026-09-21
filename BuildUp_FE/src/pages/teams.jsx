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
  const tabs = [ ['league', '리그 순위표'], ['goals', '득점 랭킹'], ['assists', '도움 랭킹'], ['contributions', '공격포인트'] ];
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
          <span className="teams-page-eyebrow">프리미어리그 (EPL) · 2026/27 시즌</span>
          <h1 className="teams-page-title">리그 순위 &amp; 선수 랭킹</h1>
          <p className="teams-page-desc">프리미어리그 20개 구단 실시간 순위부터 득점왕, 도움왕, 공격포인트까지 한눈에 확인하세요.</p>
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

  if (result.status === 'loading') return <p className="standings-message" role="status">{label}을(를) 불러오는 중입니다...</p>;
  if (result.status === 'error') return <div className="standings-message" role="alert">
    <p>선수 랭킹 데이터를 불러오지 못했습니다.</p>
    <button type="button" onClick={() => { setResult({ status: 'loading', rows: [] }); setAttempt((value) => value + 1); }}>다시 시도</button>
  </div>;
  if (!result.rows.length) return <p className="standings-message" role="status">등록된 {label} 데이터가 없습니다.</p>;

  const rows = [...result.rows].sort((a, b) => score(b) - score(a)).map((row, _index, sorted) => ({
    ...row, rank: sorted.findIndex((other) => score(other) === score(row)) + 1,
  }));
  const leader = rows[0];
  const leaderTeamKor = leader.teamNameKor || getTeamNameKor(leader.teamId, leader.teamName);
  const leaderPlayerKor = leader.playersKor || leader.playerNameKor || leader.nameKor || getPlayerNameKor(leader.playerName, leader.playerNameKor);

  return <>
    <div className="player-ranking-hero">
      <div><span className="player-ranking-kicker">{label} 상위 20</span>
        <h2>{leaderPlayerKor}</h2>
        <p>{leaderTeamKor} · {rows.filter((row) => row.rank === 1).length > 1 ? '공동 1위' : '현재 1위'}</p>
      </div>
      <div className="player-ranking-score"><strong>{score(leader)}</strong><span>{metric === 'goals' ? '골' : metric === 'assists' ? '도움' : '공격포인트'}</span></div>
    </div>
    <p className="standings-note">현재 저장된 선수 공식 기록 기준 · 공격포인트 = 득점 + 도움 · 동일 기록은 공동 순위로 표시합니다.</p>
    <div className="standings-scroll" role="region" aria-label={`${label} 순위표, 가로 스크롤 가능`} tabIndex={0}>
      <table className="standings-table player-rankings-table">
        <caption>{label} 상위 {rows.length}명</caption>
        <thead><tr><th scope="col">순위</th><th scope="col">선수명</th><th scope="col">소속 구단</th>
          <th scope="col">득점</th><th scope="col">도움</th><th scope="col">공격포인트</th></tr></thead>
        <tbody>{rows.map((row) => {
          const teamKor = row.teamNameKor || getTeamNameKor(row.teamId, row.teamName);
          const playerKor = row.playersKor || row.playerNameKor || row.nameKor || getPlayerNameKor(row.playerName, row.playerNameKor);
          return (
            <tr key={row.playerId}>
              <td><span className="standings-rank">{row.rank}</span></td>
              <th scope="row">
                <span style={{ fontWeight: 700 }}>{playerKor}</span>
                {row.playerName && playerKor !== row.playerName && (
                  <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '5px' }}>({row.playerName})</span>
                )}
              </th>
              <td>
                <span className="standings-team">
                  {row.emblemUrl && <img src={row.emblemUrl} alt="" width="28" height="28" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} />}
                  {teamKor}
                </span>
              </td>
              {['goals', 'assists', 'contributions'].map((field) => <td key={field} className={metric === field ? 'standings-points' : undefined}>
                {field === 'contributions' ? (row.goals ?? 0) + (row.assists ?? 0) : row[field] ?? '—'}
              </td>)}
            </tr>
          );
        })}</tbody>
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
