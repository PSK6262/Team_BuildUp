import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import '../css/Prediction.css';

export default function Prediction() {
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
  const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'my'
  const [matches, setMatches] = useState([]);
  const [oddsData, setOddsData] = useState({});
  const [myVotes, setMyVotes] = useState({});
  const [rankings, setRankings] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [votingMatchId, setVotingMatchId] = useState(null);

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
          setMyHistory(myJson.items);
          const voteMap = {};
          myJson.items.forEach((item) => {
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
            // 다가오는 경기(SCHEDULED/TIMED) 위주로 정렬하여 상위 10경기 노출
            const upcoming = matchList
              .filter((m) => m.status === 'SCHEDULED' || m.status === 'TIMED')
              .slice(0, 10);
            
            // 만약 예정된 경기가 적다면 최근 경기 일부 포함
            const displayList = upcoming.length > 0 
              ? upcoming 
              : matchList.slice(0, 10);

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
    <div className="prediction-page-container">
      <div className="prediction-page-wrapper">
        {/* 상단 헤더 */}
        <header className="prediction-header">
          <span className="prediction-header__eyebrow">PREMIRE LEAGUE</span>
          <h1 className="prediction-header__title">승부예측</h1>
          <p className="prediction-header__desc">
            내가 응원하는 애정팀을 선택하고 승부예측 랭킹 1위에 도전하세요!<br />
            <strong>[정배 +100P]</strong> &nbsp;|&nbsp; <strong>[무승부 +150P]</strong> &nbsp;|&nbsp; <strong>[언더독 승리 +250P 🔥]</strong>
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
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#00ff87' }}>
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
                    matches.map((m) => {
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
                    myHistory.map((item) => (
                      <article key={item.predictionId} className="prediction-card">
                        <div className="prediction-card__header">
                          <span>{item.matchDate ? item.matchDate.substring(0, 16).replace('T', ' ') : item.createdAt}</span>
                          <span
                            className="prediction-card__badge"
                            style={{
                              background:
                                item.isSuccess === 'Y'
                                  ? 'rgba(0, 255, 135, 0.2)'
                                  : item.isSuccess === 'N'
                                  ? 'rgba(239, 68, 68, 0.2)'
                                  : 'rgba(255, 255, 255, 0.1)',
                              color:
                                item.isSuccess === 'Y'
                                  ? '#00ff87'
                                  : item.isSuccess === 'N'
                                  ? '#ef4444'
                                  : '#cbd5e1',
                            }}
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
                            <strong style={{ fontSize: '1.05rem' }}>
                              {item.homeTeamNameKor || item.homeTeamName} vs {item.awayTeamNameKor || item.awayTeamName}
                            </strong>
                            <div style={{ color: '#baa8c2', fontSize: '0.85rem', marginTop: '4px' }}>
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
                    ))
                  )}
                </div>
              )}
            </main>

            {/* 우측 사이드바: 명예의 전당 Top 10 (다승 및 승률 순) */}
            <aside className="prediction-sidebar">
              <div className="prediction-ranking-card">
                <h2 className="prediction-ranking-card__title">
                  🏆 승부예측 랭킹
                </h2>
                <p className="prediction-ranking-card__sub">
                  이변과 승리를 맞춘 명예의 전당 (다승 및 승률 순)
                </p>

                <div className="prediction-ranking-list">
                  {rankings.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                      아직 등록된 랭킹 기록이 없습니다.
                    </div>
                  ) : (
                    rankings.map((user, idx) => (
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
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
