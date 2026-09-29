import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import '../css/Prediction.css';

export default function Prediction() {
  const currentTheme = useSelector((state) => state.theme?.mode || 'dark');
  const isLight = currentTheme === 'light';
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'my'
  const [matches, setMatches] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5); // 기본 5개 노출 후 더보기
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(5); // 내 예측 내역 5개 노출 후 더보기
  const [oddsData, setOddsData] = useState({});
  const [myVotes, setMyVotes] = useState({});
  const [rankings, setRankings] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingMatchId, setVotingMatchId] = useState(null);

  // 사이드바 구글 애드센스 Ref 및 푸시 처리
  const sideAdRef = useRef(null);
  const isSideAdPushed = useRef(false);

  useEffect(() => {
    if (isSideAdPushed.current) return;
    try {
      if (typeof window !== 'undefined' && sideAdRef.current) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({});
        isSideAdPushed.current = true;
      }
    } catch (e) {
      console.debug('[Prediction] AdSense init:', e);
    }
  }, []);

  // 인증 헤더 헬퍼
  const getAuthHeaders = () => {
    const token = localStorage.getItem('buildup_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  };

  // 내 예측 내역 비동기 조회
  const fetchMyPredictions = async () => {
    try {
      const headers = getAuthHeaders();
      const myRes = await fetch('/api/predictions/my', {
        headers,
        credentials: 'include',
      });
      if (myRes.ok) {
        const myJson = await myRes.json();
        if (myJson.items) {
          // 최신 경기/예측 순으로 정렬 (최근 것이 상단에 노출)
          const sortedItems = [...myJson.items].sort((a, b) => {
            const dateA = new Date(a.matchDate || a.createdAt || 0).getTime();
            const dateB = new Date(b.matchDate || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
          setMyHistory(sortedItems);
          const voteMap = {};
          sortedItems.forEach((item) => {
            voteMap[item.matchId] = item;
          });
          setMyVotes(voteMap);
        }
      }
    } catch (e) {
      console.error('[Prediction] 내 내역 로드 실패:', e);
    }
  };

  // 1. 경기 목록 및 랭킹 데이터 초기 로드
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);

        // (1) 전체 경기 목록 조회
        const matchRes = await fetch('/api/matches');
        if (matchRes.ok) {
          const matchList = await matchRes.json();
          if (isMounted && Array.isArray(matchList)) {
            // 다가오는 경기(SCHEDULED/TIMED) 위주로 목록 구성 (최대 30경기)
            const upcoming = matchList
              .filter((m) => m.status === 'SCHEDULED' || m.status === 'TIMED');
            
            // 만약 예정된 경기가 적다면 최근 경기 일부 포함
            const displayList = upcoming.length > 0 
              ? upcoming.slice(0, 30)
              : matchList.slice(0, 30);

            setMatches(displayList);

            // 각 경기의 배당률/보상 정보 비동기 로드
            displayList.forEach(async (m) => {
              try {
                const oddsRes = await fetch(`/api/predictions/matches/${m.matchId}/odds`);
                if (oddsRes.ok) {
                  const odds = await oddsRes.json();
                  if (isMounted) {
                    setOddsData((prev) => ({ ...prev, [m.matchId]: odds }));
                  }
                }
              } catch (e) {
                // 개별 배당률 조회 실패 시 기본값 유지
              }
            });
          }
        }

        // (2) 랭킹 조회
        const rankRes = await fetch('/api/predictions/rankings');
        if (rankRes.ok) {
          const rankJson = await rankRes.json();
          if (isMounted && rankJson.rankings) {
            setRankings(rankJson.rankings);
          }
        }

        // (3) 로그인한 경우 내 예측 내역 조회
        if (isLoggedIn || localStorage.getItem('buildup_token')) {
          await fetchMyPredictions();
        }
      } catch (err) {
        console.error('[Prediction] 데이터 로드 실패:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [isLoggedIn]);

  // 2. 투표 참여 및 예측 변경 처리
  const handleVote = async (matchId, predictResult) => {
    if (!isLoggedIn && !localStorage.getItem('buildup_token')) {
      alert('승부예측 투표는 로그인 후 참여하실 수 있습니다.');
      window.location.assign('/plug/login');
      return;
    }

    // 동일한 선택지로 재클릭 시 불필요한 요청 방지
    if (myVotes[matchId] && myVotes[matchId].predictResult === predictResult) {
      alert('이미 해당 결과로 예측에 참여하셨습니다.');
      return;
    }

    try {
      setVotingMatchId(matchId);
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ matchId, predictResult }),
      });

      const json = await res.json();
      if (res.ok && json.status === 'SUCCESS') {
        alert(json.message);

        // 내 예측 내역 및 투표 상태 즉시 동기화
        await fetchMyPredictions();

        // 배당률/투표율 재조회
        const oddsRes = await fetch(`/api/predictions/matches/${matchId}/odds`);
        if (oddsRes.ok) {
          const odds = await oddsRes.json();
          setOddsData((prev) => ({ ...prev, [matchId]: odds }));
        }
      } else {
        alert(json.message || '투표 처리에 실패했습니다.');
      }
    } catch (e) {
      alert('투표 중 네트워크 오류가 발생했습니다.');
    } finally {
      setVotingMatchId(null);
    }
  };

  return (
    <div className={`prediction-page-container ${isLight ? 'is-light' : ''}`}>
      {/* 배경 장식 EPL 사자 엠블럼 (다크모드: 우측 황금 사자 / 일반모드: 좌측 보라 사자) */}
      <div className="prediction-lion-bg" aria-hidden="true">
        <svg viewBox="0 0 84 106" className="prediction-lion-svg">
          <defs>
            {/* 우승팀 전용 챔피언 골드 그라데이션 */}
            <linearGradient id="eplChampionGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff3a8" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>
          </defs>
          <path d="M18.5,9.68a35.54,35.54,0,0,1,7.92,5.06C26.18,13.57,25.29,8,24.79,4.5l10.72,7.42c.82-2.52,3.65-10.74,3.65-10.74s5.11,8.27,6,9.62c1-1.11,7.19-7.92,8.76-9.63.27,3.9.63,9.51.71,10.34A34.67,34.67,0,0,1,61.2,4.78c-1.71,3.36-2.51,8-2.88,11.69A45.08,45.08,0,0,0,24,20.61C22.83,17.09,21,12.62,18.5,9.68Zm47,46.6V50.52a19.45,19.45,0,0,1-5.33-3C54.63,48.4,48,54,48,54l4.73,8.9C57,63.46,63.42,58,65.48,56.28ZM71,66.74a11,11,0,0,0-2.32-4.61l-4.31.1s-5.81,5-9.3,5.11c0,0,1.95,3.63,2.93,5.53,2-.42,5.39-2,6.77-3.57a20.49,20.49,0,0,1,.73,6.42C67.46,74.59,70.1,71.55,71,66.74ZM72.8,47.8a27.49,27.49,0,0,1-4,2.85v5.79A20.12,20.12,0,0,1,73,62.22c2.19-3.92,1.78-9.7-.23-14.43Zm.48-5.17L73.66,40a9.06,9.06,0,0,0-2.29-6.34c-2.51-2.83-8.84-7.37-11.86-8.46a10.57,10.57,0,0,1-1.36,4.31c-6-4.34-9-5.43-9-5.43C42.58,25,38.33,27.58,36,29.58l2,1.71a14.64,14.64,0,0,0-6.56,4.64c0,.06,3.56.56,3.56.56s-.37,4.14,4.83,6.74c4.43,2.23,10.82-.53,16.84,1.88A49,49,0,0,0,50,38.51a15.09,15.09,0,0,0-2.68-.32,13.94,13.94,0,0,1-5.7-.6,22,22,0,0,1-3.31-1.78,13.45,13.45,0,0,1,6.82-3.49,23.31,23.31,0,0,1,6.56,3.18,5.85,5.85,0,0,1,3.94-1.82s-2,1.86-1.39,4.13a76.19,76.19,0,0,1,6,6.28c3.2-1.76,10.15-1.35,11.58.3a40.57,40.57,0,0,0-6.44-6,20.25,20.25,0,0,0-2.82-4.23,12.18,12.18,0,0,1,4,2.33,5.11,5.11,0,0,1,2.91-1.89,4.72,4.72,0,0,1,1.63,3.3,4.5,4.5,0,0,1-1.27,1l3.39,3.67.4-2.61m3,4.77a41.28,41.28,0,0,1,2.83,32.37L75.46,72.6c-.71,11.14-4,19.78-13.56,27.09,0,0-.91-3.49-1.44-5.68-15.77,11.56-29.33,6.27-33.09,4.37,2.95-13.53.67-21.3-1.31-27.24C21.86,78,17.56,83.4,13.27,87c-2.94-6.86-3.17-19.59-.79-27.11-.78.21-5.42,1.68-8,2.45,1-6.9,5.59-16.15,10.41-20.75-.84-.15-3.31-.5-5.26-.83,1.2-2.45,4.69-7,10.06-11.27a8.54,8.54,0,0,0,4.36,8.32C21.9,34.05,21.64,29.38,23.9,27s6.05-1.61,8.47.3a8,8,0,0,0-2.86-3.84,41.23,41.23,0,0,1,24-3.5,31.64,31.64,0,0,1,3.63,4,15.31,15.31,0,0,0-.32-3.38A51.26,51.26,0,0,1,68.54,25c-7.24-7.24-21.9-9.39-34.12-5.88a47.26,47.26,0,0,0-8.16,3.18,6.61,6.61,0,0,0-5.43,3.11C13,30.59,7.25,37.45,4.49,43.18c.61.14,2.47.36,4.13.66C5.13,48.84.55,58.32.85,66.77c.79-.24,5.07-1.55,7.16-2.23C6.89,72,7.22,84.6,12.08,91.78a51.48,51.48,0,0,0,12.6-13c.76,3.7,1.5,10.26-1.1,21.15,2.07,1.64,17.44,9.68,34.79-.83l1.44,5.71,1.87-1.22A35.24,35.24,0,0,0,77.8,80c.48.53,2.41,2.63,3.1,3.34,2.59-7.23,7.89-24.63-4.24-38.57Z" />
        </svg>
      </div>

      <div className="prediction-page-wrapper">
        {/* 상단 헤더 */}
        <header className="prediction-header">
          <span className="prediction-header__eyebrow">PREMIER LEAGUE</span>
          <h1 className="prediction-header__title">승부예측</h1>
          <p className="prediction-header__desc">
            내가 응원하는 애정팀을 선택하고 승부예측 랭킹 1위에 도전하세요!<br />
            <strong>[승리 +100P]</strong> &nbsp;|&nbsp; <strong>[무승부 +150P]</strong> &nbsp;|&nbsp; <strong>[언더독 승리 +250P 🔥]</strong>
          </p>
        </header>

        {/* 탭 네비게이션 */}
        <nav className="prediction-tabs" aria-label="승부예측 탭">
          <button
            type="button"
            className={`prediction-tab-btn ${activeTab === 'matches' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('matches')}
          >
            경기 승부예측
          </button>
          <button
            type="button"
            className={`prediction-tab-btn ${activeTab === 'my' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my')}
          >
            내 예측 내역 {myHistory.length > 0 && `(${myHistory.length})`}
          </button>
        </nav>

        {/* 로딩 표시 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: isLight ? '#38003c' : '#00ff87' }}>
            <p>경기 및 랭킹 데이터를 불러오는 중입니다...</p>
          </div>
        )}

        {/* 본문 레이아웃 (경기/내역 1fr : 랭킹 340px) */}
        {!loading && (
          <div className="prediction-layout">
            {/* 좌측 콘텐츠 영역 */}
            <main className="prediction-main-content">
              {activeTab === 'matches' ? (
                <div className="prediction-matches-list">
                  {matches.length === 0 ? (
                    <div className="prediction-my-empty">예정된 승부예측 경기가 없습니다.</div>
                  ) : (
                    matches.slice(0, visibleCount).map((m) => {
                      const odds = oddsData[m.matchId] || {};
                      const myVote = myVotes[m.matchId];
                      const isFinished = m.status === 'FINISHED';
                      const homePoint = odds.homePoint || 100;
                      const drawPoint = odds.drawPoint || 150;
                      const awayPoint = odds.awayPoint || 100;
                      const isVoting = votingMatchId === m.matchId;

                      return (
                        <article key={m.matchId} className="prediction-card">
                          <div className="prediction-card__header">
                            <span>{m.matchDate ? m.matchDate.substring(0, 16).replace('T', ' ') : '일정 미정'}</span>
                            <span className={`prediction-card__badge ${isFinished ? 'is-finished' : ''}`}>
                              {isFinished
                                ? '경기 종료'
                                : myVote
                                ? '예측 완료 (변경 가능)'
                                : '예측 진행중'}
                            </span>
                          </div>

                          {/* 팀 대진 */}
                          <div className="prediction-teams">
                            <div className="prediction-team is-home">
                              <img
                                src={odds.homeEmblemUrl || m.homeEmblemUrl || 'https://crests.football-data.org/57.png'}
                                alt={odds.homeTeamNameKor || odds.homeTeamName || '홈팀'}
                                className="prediction-team__emblem"
                                onError={(e) => { e.target.src = 'https://crests.football-data.org/57.png'; }}
                              />
                              <div className="prediction-team__info">
                                <span className="prediction-team__name">
                                  {odds.homeTeamNameKor || odds.homeTeamName || `팀 ${m.homeTeamId}`}
                                </span>
                                <span className="prediction-team__rank">
                                  {odds.homeRank ? `${odds.homeRank}위` : ''} {odds.homeUnderdog ? '🔥 언더독' : ''}
                                </span>
                              </div>
                            </div>

                            <div style={{ textAlign: 'center' }}>
                              {isFinished ? (
                                <div className="prediction-score">
                                  {m.homeScore} : {m.awayScore}
                                </div>
                              ) : (
                                <div className="prediction-vs">VS</div>
                              )}
                            </div>

                            <div className="prediction-team is-away">
                              <img
                                src={odds.awayEmblemUrl || m.awayEmblemUrl || 'https://crests.football-data.org/65.png'}
                                alt={odds.awayTeamNameKor || odds.awayTeamName || '원정팀'}
                                className="prediction-team__emblem"
                                onError={(e) => { e.target.src = 'https://crests.football-data.org/65.png'; }}
                              />
                              <div className="prediction-team__info">
                                <span className="prediction-team__name">
                                  {odds.awayTeamNameKor || odds.awayTeamName || `팀 ${m.awayTeamId}`}
                                </span>
                                <span className="prediction-team__rank">
                                  {odds.awayRank ? `${odds.awayRank}위` : ''} {odds.awayUnderdog ? '🔥 언더독' : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 투표 버튼 3개 (경기 시작 전에는 예측 변경 가능) */}
                          <div className="prediction-buttons">
                            <button
                              type="button"
                              className={`prediction-vote-btn ${myVote?.predictResult === 'HOME' ? 'is-selected' : ''}`}
                              onClick={() => handleVote(m.matchId, 'HOME')}
                              disabled={isFinished || isVoting}
                              title={myVote ? '클릭하여 예측을 변경할 수 있습니다' : '홈팀 승 투표'}
                            >
                              <span className="prediction-vote-btn__label">홈팀 승</span>
                              <span className={`prediction-vote-btn__point ${odds.homeUnderdog ? 'is-underdog' : ''}`}>
                                +{homePoint}P {odds.homeUnderdog ? '🔥' : ''}
                              </span>
                            </button>

                            <button
                              type="button"
                              className={`prediction-vote-btn ${myVote?.predictResult === 'DRAW' ? 'is-selected' : ''}`}
                              onClick={() => handleVote(m.matchId, 'DRAW')}
                              disabled={isFinished || isVoting}
                              title={myVote ? '클릭하여 예측을 변경할 수 있습니다' : '무승부 투표'}
                            >
                              <span className="prediction-vote-btn__label">무승부</span>
                              <span className="prediction-vote-btn__point">+{drawPoint}P</span>
                            </button>

                            <button
                              type="button"
                              className={`prediction-vote-btn ${myVote?.predictResult === 'AWAY' ? 'is-selected' : ''}`}
                              onClick={() => handleVote(m.matchId, 'AWAY')}
                              disabled={isFinished || isVoting}
                              title={myVote ? '클릭하여 예측을 변경할 수 있습니다' : '원정팀 승 투표'}
                            >
                              <span className="prediction-vote-btn__label">원정팀 승</span>
                              <span className={`prediction-vote-btn__point ${odds.awayUnderdog ? 'is-underdog' : ''}`}>
                                +{awayPoint}P {odds.awayUnderdog ? '🔥' : ''}
                              </span>
                            </button>
                          </div>


                          {/* 실시간 투표율 게이지 바 (투표가 있거나 내가 투표한 경우) */}
                          {odds.totalVotes > 0 && (
                            <div className="prediction-vote-bar">
                              <div className="prediction-vote-bar__meta">
                                <span>팬 투표율 (총 {odds.totalVotes}표)</span>
                                <span>
                                  홈 {odds.homeVoteRate}% | 무 {odds.drawVoteRate}% | 원정 {odds.awayVoteRate}%
                                </span>
                              </div>
                              <div className="prediction-vote-bar__track">
                                <div className="prediction-vote-bar__seg-home" style={{ width: `${odds.homeVoteRate || 33.3}%` }} />
                                <div className="prediction-vote-bar__seg-draw" style={{ width: `${odds.drawVoteRate || 33.3}%` }} />
                                <div className="prediction-vote-bar__seg-away" style={{ width: `${odds.awayVoteRate || 33.4}%` }} />
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })
                  )}

                  {/* 5개씩 더보기 버튼 */}
                  {activeTab === 'matches' && visibleCount < matches.length && (
                    <div className="prediction-more-wrap">
                      <button
                        type="button"
                        className="prediction-more-btn"
                        onClick={() => setVisibleCount((prev) => prev + 5)}
                      >
                        {Math.min(5, matches.length - visibleCount)}경기 더보기 ▾
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* 내 예측 내역 뷰 */
                <div className="prediction-my-list">
                  {!isLoggedIn ? (
                    <div className="prediction-my-empty">
                      <p>로그인 후 내가 참여한 승부예측 내역을 확인하실 수 있습니다.</p>
                      <a href="/plug/login" className="prediction-tab-btn" style={{ display: 'inline-block', marginTop: '12px' }}>
                        로그인하러 가기
                      </a>
                    </div>
                  ) : myHistory.length === 0 ? (
                    <div className="prediction-my-empty">아직 참여한 승부예측 내역이 없습니다.</div>
                  ) : (
                    <>
                      {myHistory.slice(0, visibleHistoryCount).map((item) => (
                        <article key={item.predictionId} className="prediction-card">
                          <div className="prediction-card__header">
                            <span>{item.matchDate ? item.matchDate.substring(0, 16).replace('T', ' ') : item.createdAt}</span>
                            <span
                              className={`prediction-card__badge ${
                                item.isSuccess === 'Y'
                                  ? 'is-win'
                                  : item.isSuccess === 'N'
                                  ? 'is-lose'
                                  : 'is-wait'
                              }`}
                            >
                              {item.isSuccess === 'Y'
                                ? '적중 성공 (+보상지급)'
                                : item.isSuccess === 'N'
                                ? '미적중'
                                : '경기 결과 대기중'}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong className="prediction-match-title" style={{ fontSize: '1.05rem' }}>
                                {item.homeTeamNameKor || item.homeTeamName} vs {item.awayTeamNameKor || item.awayTeamName}
                              </strong>
                              <div className="prediction-my-choice">
                                내 선택: <strong>{item.predictResult === 'HOME' ? '홈팀 승' : item.predictResult === 'DRAW' ? '무승부' : '원정팀 승'}</strong>
                              </div>
                            </div>
                            {item.homeScore != null && (
                              <div style={{ fontSize: '1.2rem', fontWeight: '800' }}>
                                {item.homeScore} : {item.awayScore}
                              </div>
                            )}
                          </div>
                        </article>
                      ))}

                      {/* 5개씩 더보기 버튼 (내 예측 내역) */}
                      {visibleHistoryCount < myHistory.length && (
                        <div className="prediction-more-wrap">
                          <button
                            type="button"
                            className="prediction-more-btn"
                            onClick={() => setVisibleHistoryCount((prev) => prev + 5)}
                          >
                            {Math.min(5, myHistory.length - visibleHistoryCount)}개 내역 더보기 ▾
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </main>

            {/* 우측 사이드바: 명예의 전당 Top 5 (다승 및 승률 순) & 광고 영역 */}
            <aside className="prediction-sidebar">
              <div className="prediction-ranking-card">
                <h2 className="prediction-ranking-card__title">
                  🏆 승부예측 랭킹
                </h2>
                <p className="prediction-ranking-card__sub">
                  이변과 승리를 맞춘 명예의 전당 (Top 5)
                </p>

                <div className="prediction-ranking-list">
                  {rankings.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                      아직 등록된 랭킹 기록이 없습니다.
                    </div>
                  ) : (
                    rankings.slice(0, 5).map((user, idx) => (
                      <div key={user.userId || idx} className="prediction-ranking-item">
                        <div className="prediction-ranking-item__left">
                          <span className="prediction-ranking-item__rank">{idx + 1}</span>
                          <div>
                            <div className="prediction-ranking-item__name">{user.nickname || `유저 ${user.userId}`}</div>
                            <div className="prediction-ranking-item__meta">
                              {user.predictWin}승 / {user.predictTotal}전
                            </div>
                          </div>
                        </div>
                        <div className="prediction-ranking-item__right">
                          <div className="prediction-ranking-item__point">
                            {user.winRate}%
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 랭킹 하단 스폰서 광고 카드 */}
              <div className="prediction-ad-card">
                <div className="prediction-ad-badge">ADVERTISEMENT</div>
                <div className="prediction-ad-box">
                  {/* 실제 구글 애드센스 광고 단위 */}
                  <ins
                    ref={sideAdRef}
                    className="adsbygoogle prediction-ad-ins"
                    style={{ display: 'block' }}
                    data-ad-client="ca-pub-6961977480009285"
                    data-ad-format="rectangle"
                    data-full-width-responsive="true"
                    data-ad-test="on"
                  />

                  {/* 광고 로드 전 / 로컬 개발 환경용 플레이스홀더 */}
                  <div className="prediction-ad-placeholder" aria-hidden="true">
                    <span className="prediction-ad-icon">📢</span>
                    <strong className="prediction-ad-title">PL:UG 공식 승부예측 스폰서</strong>
                    <p className="prediction-ad-desc">
                      프리미어리그 정품 유니폼 & MD 굿즈 특별 기획전
                    </p>
                    <span className="prediction-ad-cta">스토어 바로가기 →</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
