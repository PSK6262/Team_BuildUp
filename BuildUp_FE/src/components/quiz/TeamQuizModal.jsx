import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../store/authSlice.js';
import { communityTeams } from '../../data/communityTeams.js';
import {
  BASE_QUESTIONS,
  QUIZ_QUESTIONS,
  CLUBS_DATA,
  evaluateBaseAnswers,
  calculateQuizResultWithSkip,
  findDifferentiatingTieBreakers,
  filterCandidatesByTieBreaker,
  getDbEmblemUrl
} from '../../data/quizData.js';
import { getTeams, getTeamById } from '../../api/teamApi.js';
import '../../css/TeamQuizModal.css';

// 고해상도 엠블럼 URL 처리 함수 (50px -> 100px 변환 지원)
function getHighResEmblemUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/50/', '/100/');
}

export default function TeamQuizModal({ isOpen, onClose, teams = [] }) {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
  const currentUser = useSelector((state) => state.auth?.user);

  // 1. 기본 퀴즈 상태
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);

  // 2. 동점 방지 타이브레이커(Tie-breaker) 상태
  const [isTieBreakerBanner, setIsTieBreakerBanner] = useState(false);
  const [isTieBreakerActive, setIsTieBreakerActive] = useState(false);
  const [tieBreakerCandidates, setTieBreakerCandidates] = useState([]);
  const [activeTieBreakers, setActiveTieBreakers] = useState([]);
  const [currentTBIndex, setCurrentTBIndex] = useState(0);
  const [baseMatchScore, setBaseMatchScore] = useState(100);

  // 3. 최종 결과 상태 및 스킵 예외 상태
  const [isCompleted, setIsCompleted] = useState(false);
  const [isAllSkipped, setIsAllSkipped] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const currentQuizResultRef = useRef(null);

  // 4. 애정팀(FAVORITE_TEAM_ID) 설정 상태
  const [isSettingFavorite, setIsSettingFavorite] = useState(false);
  const [favoriteFeedback, setFavoriteFeedback] = useState(null);

  // 5. DB TEAMS 테이블 연동 상태
  const [dbTeams, setDbTeams] = useState(teams || []);
  const [liveEmblemUrl, setLiveEmblemUrl] = useState('');

  const bannerTimerRef = useRef(null);

  // teams prop 변경 반영 또는 비어있을 시 DB teams fetch
  useEffect(() => {
    if (Array.isArray(teams) && teams.length > 0) {
      setDbTeams(teams);
    } else {
      getTeams().then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbTeams(data);
        }
      });
    }
  }, [teams]);

  // 모달 열릴 때 body 스크롤 차단
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 결과 구단이 결정되었을 때, DB TEAMS 테이블의 단건 API(GET /api/teams/{teamId})로 최신 EMBLEM_URL 조회
  useEffect(() => {
    if (!matchResult?.bestClub?.teamId) {
      setLiveEmblemUrl('');
      return;
    }

    const teamId = matchResult.bestClub.teamId;

    // 1차: props 또는 캐시된 dbTeams에서 조회
    const initialEmblem = getDbEmblemUrl(teamId, dbTeams);
    if (initialEmblem) {
      setLiveEmblemUrl(initialEmblem);
    }

    // 2차: DB TEAMS 테이블 단건 조회 API를 통해 최신 EMBLEM_URL 동기화
    getTeamById(teamId)
      .then((dbTeamData) => {
        if (dbTeamData?.emblemUrl) {
          setLiveEmblemUrl(dbTeamData.emblemUrl);
        }
      })
      .catch((err) => {
        console.warn('[TeamQuizModal] DB TEAMS 단건 조회 알림:', err.message);
      });
  }, [matchResult?.bestClub?.teamId, dbTeams]);

  // 모달 열릴 때 로그인된 회원의 최신 정보(애정 구단 ID 포함) 동기화
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      const token = localStorage.getItem('buildup_token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch('/api/users/me', { headers })
        .then((res) => res.json())
        .then((data) => {
          const userObj = data.data || data.user;
          if (userObj) {
            dispatch(updateUser(userObj));
          }
        })
        .catch(() => {});
    }
  }, [isOpen, isLoggedIn, dispatch]);

  // 다시 테스트 하기
  const handleRestart = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setCurrentStep(0);
    setUserAnswers([]);
    setSelectedOption(null);
    setIsTieBreakerBanner(false);
    setIsTieBreakerActive(false);
    setTieBreakerCandidates([]);
    setActiveTieBreakers([]);
    setCurrentTBIndex(0);
    setBaseMatchScore(100);
    setIsAllSkipped(false);
    setIsCompleted(false);
    setMatchResult(null);
    setLiveEmblemUrl('');
    setFavoriteFeedback(null);
    setIsSettingFavorite(false);
    currentQuizResultRef.current = null;
  }, []);

  // 애정팀 설정 처리 (USERS 테이블의 FAVORITE_TEAM_ID 갱신)
  const handleSetFavoriteTeam = async () => {
    if (!matchResult?.bestClub?.teamId || isSettingFavorite) return;
    setIsSettingFavorite(true);
    setFavoriteFeedback(null);

    const targetTeamId = Number(matchResult.bestClub.teamId);
    const token = localStorage.getItem('buildup_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      let nickname = currentUser?.nickname;
      let email = currentUser?.email;

      if (!nickname) {
        try {
          const profileRes = await fetch('/api/users/me', { headers });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            const userObj = profileData.data || profileData.user;
            if (userObj) {
              nickname = userObj.nickname;
              email = userObj.email;
            }
          }
        } catch (e) {
          console.warn('사용자 프로필 사전 로드 건너뜀:', e);
        }
      }

      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          nickname: (nickname || '').trim(),
          email: (email || '').trim(),
          favoriteTeamId: targetTeamId,
        }),
      });

      const data = await res.json();
      const updatedUser = data.data || data.user;

      if (res.ok && (data.status === 'SUCCESS' || data.code === 'SUC_001') && updatedUser) {
        dispatch(updateUser(updatedUser));
        setFavoriteFeedback({
          type: 'success',
          message: `🎉 ${matchResult.bestClub.name}이(가) 나의 애정팀으로 등록되었습니다!`,
        });
      } else {
        setFavoriteFeedback({
          type: 'error',
          message: data.message || '애정팀 등록 중 오류가 발생했습니다.',
        });
      }
    } catch (err) {
      console.error('애정팀 등록 오류:', err);
      setFavoriteFeedback({
        type: 'error',
        message: '서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsSettingFavorite(false);
    }
  };

  // 모달 닫기
  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      handleRestart();
    }, 250);
  }, [onClose, handleRestart]);

  // 서든데스 배너에서 타이브레이커 질문으로 즉시 진입
  const handleStartTieBreaker = useCallback(() => {
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    setIsTieBreakerBanner(false);
    setIsTieBreakerActive(true);
  }, []);

  // 모든 질문 스킵 시 기본 대표 구단 추천
  const handleRecommendDefault = useCallback(() => {
    const arsenalClub = CLUBS_DATA.find((c) => c.id === 'arsenal') || CLUBS_DATA[0];
    const cityClub = CLUBS_DATA.find((c) => c.id === 'mancity') || CLUBS_DATA[1];
    const liverpoolClub = CLUBS_DATA.find((c) => c.id === 'liverpool') || CLUBS_DATA[2];

    const defaultClub = {
      ...arsenalClub,
      emblemUrl: getDbEmblemUrl(arsenalClub.teamId, dbTeams) || arsenalClub.emblemUrl
    };

    const subList = [
      {
        club: {
          ...cityClub,
          emblemUrl: getDbEmblemUrl(cityClub.teamId, dbTeams) || cityClub.emblemUrl
        },
        matchedCount: 0,
        matchRate: 100
      },
      {
        club: {
          ...liverpoolClub,
          emblemUrl: getDbEmblemUrl(liverpoolClub.teamId, dbTeams) || liverpoolClub.emblemUrl
        },
        matchedCount: 0,
        matchRate: 100
      }
    ];

    setMatchResult({
      bestClub: defaultClub,
      matchPercentage: 100,
      subClubs: subList,
      totalValidQuestions: 0,
      wonByTieBreaker: false,
      isDefaultRecommended: true
    });
    setIsAllSkipped(false);
    setIsCompleted(true);
  }, [dbTeams]);

  // 기본 7문항 옵션 선택 처리 ('A' | 'B' | 'SKIP')
  const handleSelectOption = (value) => {
    if (selectedOption) return; // 연속 클릭 방지
    setSelectedOption(value);

    const nextAnswers = [...userAnswers];
    nextAnswers[currentStep] = value;
    setUserAnswers(nextAnswers);

    setTimeout(() => {
      setSelectedOption(null);
      if (currentStep < BASE_QUESTIONS.length - 1) {
        setCurrentStep((prev) => prev + 1);
      } else {
        // 7문항 완료 -> calculateQuizResultWithSkip 수행
        const quizResult = calculateQuizResultWithSkip(nextAnswers, dbTeams);
        const { topClub, topRate, subClubs, topClubs, totalValidQuestions } = quizResult;
        currentQuizResultRef.current = quizResult;

        // 예외 케이스: 7개 문항을 모두 스킵한 경우
        if (totalValidQuestions === 0) {
          setIsAllSkipped(true);
          return;
        }

        setBaseMatchScore(topRate);

        if (topClubs.length === 1) {
          // 동점 없음: 단독 1위 구단으로 즉시 결과 확정
          setMatchResult({
            bestClub: topClub,
            matchPercentage: topRate,
            subClubs,
            totalValidQuestions,
            wonByTieBreaker: false
          });
          setIsCompleted(true);
        } else {
          // 동점 발생 (2개 이상 구단): 변별력 있는 타이브레이커 질문 선별
          const diffQuestions = findDifferentiatingTieBreakers(topClubs);

          if (diffQuestions.length > 0) {
            setTieBreakerCandidates(topClubs);
            setActiveTieBreakers(diffQuestions);
            setCurrentTBIndex(0);
            setIsTieBreakerBanner(true);

            // 1.6초 후 서든데스 질문으로 자동 전환
            bannerTimerRef.current = setTimeout(() => {
              setIsTieBreakerBanner(false);
              setIsTieBreakerActive(true);
            }, 1600);
          } else {
            // 변별 가능한 질문이 없을 경우 후보 중 무작위 1팀 선정
            const pick = topClubs[Math.floor(Math.random() * topClubs.length)];
            const remainingSubs = subClubs.filter((s) => s.club.id !== pick.id);
            setMatchResult({
              bestClub: pick,
              matchPercentage: topRate,
              subClubs: remainingSubs,
              totalValidQuestions,
              wonByTieBreaker: false
            });
            setIsCompleted(true);
          }
        }
      }
    }, 200);
  };

  // 타이브레이커 옵션 선택 처리
  const handleSelectTieBreakerOption = (value) => {
    if (selectedOption) return;
    setSelectedOption(value);

    const currentTB = activeTieBreakers[currentTBIndex];

    setTimeout(() => {
      setSelectedOption(null);
      const tieId = currentTB.id || currentTB.key;
      const filtered = filterCandidatesByTieBreaker(tieBreakerCandidates, tieId, value);

      const finalizeWinner = (winnerClub) => {
        const runnerUps = tieBreakerCandidates
          .filter((c) => c.id !== winnerClub.id)
          .map((c) => ({
            club: c,
            matchedCount: c.matchedCount || 0,
            matchRate: baseMatchScore
          }));
        const existingSubs = currentQuizResultRef.current?.subClubs || [];
        const otherSubs = existingSubs.filter(
          (s) => s.club.id !== winnerClub.id && !runnerUps.some((r) => r.club.id === s.club.id)
        );
        const combinedSubClubs = [...runnerUps, ...otherSubs].slice(0, 3);

        setMatchResult({
          bestClub: winnerClub,
          matchPercentage: baseMatchScore,
          subClubs: combinedSubClubs,
          totalValidQuestions: currentQuizResultRef.current?.totalValidQuestions || BASE_QUESTIONS.length,
          wonByTieBreaker: true
        });
        setIsTieBreakerActive(false);
        setIsCompleted(true);
      };

      if (filtered.length === 1) {
        // 단독 1위 가려냄 완료!
        finalizeWinner(filtered[0]);
      } else if (filtered.length > 1) {
        // 여전히 2개 이상이고 추가 타이브레이커 질문이 있는 경우 (최대 2문항)
        if (currentTBIndex + 1 < activeTieBreakers.length) {
          setTieBreakerCandidates(filtered);
          setCurrentTBIndex((prev) => prev + 1);
        } else {
          // 추가 질문 소진 시 남은 후보 중 1팀 확정
          const finalClub = filtered[Math.floor(Math.random() * filtered.length)];
          finalizeWinner(finalClub);
        }
      } else {
        // 예외 방어: 일치 후보가 없을 경우 첫 번째 후보 선택
        finalizeWinner(tieBreakerCandidates[0]);
      }
    }, 200);
  };

  // 이전 질문으로 돌아가기 (기본 문항에서만 지원)
  const handlePrevStep = () => {
    if (currentStep > 0 && !isCompleted && !isTieBreakerActive && !isTieBreakerBanner) {
      setCurrentStep((prev) => prev - 1);
      setSelectedOption(null);
    }
  };

  if (!isOpen) return null;

  const currentQuestion = BASE_QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep + (isCompleted ? 1 : 0)) / BASE_QUESTIONS.length) * 100);

  // 최종 엠블럼 URL: 실시간 DB TEAMS 조회값 > props DB teams 조회값 > 기본 fallback 순
  const finalEmblemUrl =
    liveEmblemUrl ||
    (matchResult?.bestClub?.teamId && getDbEmblemUrl(matchResult.bestClub.teamId, dbTeams)) ||
    matchResult?.bestClub?.emblemUrl;

  const currentTBQuestion = activeTieBreakers[currentTBIndex];

  return (
    <div
      className="team-quiz-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quiz-modal-title"
    >
      <div
        className={`team-quiz-card ${isTieBreakerActive || isTieBreakerBanner ? 'is-tie-breaker-mode' : ''}`}
      >
        {/* 상단 닫기 버튼 */}
        <button
          type="button"
          className="team-quiz-close-btn"
          onClick={handleClose}
          aria-label="모달 닫기"
        >
          ✕
        </button>

        {/* ========================================================
           0. 모든 질문 스킵(All-Skip) 예외 방어 안내 화면
           ======================================================== */}
        {isAllSkipped ? (
          <div className="team-quiz-all-skip-stage" role="alert" aria-live="polite">
            <div className="all-skip-icon">🤔</div>
            <h2 className="all-skip-title">모든 질문을 넘기셨어요!</h2>
            <p className="all-skip-desc">
              나만의 PL 운명 구단을 분석하려면 <strong>최소 1개 이상의 질문</strong>에 답해주셔야 해요.<br />
              원하시면 프리미어리그 대표 인기 구단을 바로 추천해 드릴 수도 있습니다!
            </p>
            <div className="all-skip-action-group">
              <button
                type="button"
                className="team-quiz-btn team-quiz-btn--primary"
                onClick={handleRestart}
              >
                🔄 처음부터 다시 풀기
              </button>
              <button
                type="button"
                className="team-quiz-btn team-quiz-btn--restart"
                onClick={handleRecommendDefault}
              >
                ⭐ PL 대표 인기 구단 바로 보기
              </button>
            </div>
          </div>
        ) : isTieBreakerBanner ? (
          <div className="team-quiz-tie-banner-stage" role="alert" aria-live="assertive">
            <div className="tie-banner-fire-icon">🔥</div>
            <div className="team-quiz-tie-banner">
              <h2 className="tie-banner-title">
                운명의 라이벌 발생!<br />
                <span className="tie-banner-highlight">승부를 가를 결정타 질문!</span>
              </h2>
            </div>

            {/* 경합 중인 후보 구단 프리뷰 */}
            <div className="tie-candidates-preview">
              <span className="tie-candidates-label">⚡ 현재 공동 1위 경합 구단 ⚡</span>
              <div className="tie-candidates-list">
                {tieBreakerCandidates.map((club, idx) => (
                  <React.Fragment key={club.id}>
                    <div className="tie-candidate-chip">
                      <img
                        src={getHighResEmblemUrl(club.emblemUrl)}
                        alt={club.name}
                        className="tie-candidate-emblem"
                      />
                      <span className="tie-candidate-name">{club.name}</span>
                    </div>
                    {idx < tieBreakerCandidates.length - 1 && (
                      <span className="tie-candidate-vs">VS</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="tie-loader-wrap">
              <div className="tie-spinner" />
              <button
                type="button"
                className="tie-start-btn"
                onClick={handleStartTieBreaker}
              >
                결정타 질문으로 이동 ⚔️
              </button>
            </div>
          </div>
        ) : isTieBreakerActive && currentTBQuestion ? (
          /* ========================================================
             2. 서든데스 타이브레이커 질문 화면
             ======================================================== */
          <div className="team-quiz-question-stage is-tie-breaker">
            <div className="tie-breaker-header-top">
              <span className="tie-breaker-main-badge">🔥 서든데스 타이브레이커</span>
              <span className="tie-breaker-step-badge">
                결정타 {currentTBIndex + 1} / {activeTieBreakers.length}
              </span>
            </div>

            {/* 후보 구단 대진표 축약 바 */}
            <div className="tie-compact-candidates">
              <span className="tie-compact-label">경합 후보:</span>
              <div className="tie-compact-list">
                {tieBreakerCandidates.map((c) => (
                  <span key={c.id} className="tie-compact-name">
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            {/* 질문 타이틀 */}
            <div className="team-quiz-header">
              <span className="team-quiz-q-badge tie-q-badge">
                {currentTBQuestion.badge || currentTBQuestion.badgeText}
              </span>
              <h2 id="quiz-modal-title" className="team-quiz-title tie-title">
                {currentTBQuestion.title}
              </h2>
            </div>

            {/* 2지선다 옵션 카드 A vs B */}
            <div className="team-quiz-options-grid">
              <button
                type="button"
                className={`team-quiz-option-card option-a tie-card ${
                  selectedOption === 'A' ? 'is-selected' : ''
                }`}
                onClick={() => handleSelectTieBreakerOption('A')}
              >
                <div className="option-badge tie-badge">A</div>
                <div className="option-content">
                  <span className="option-label">{currentTBQuestion.optionA.label}</span>
                </div>
              </button>

              <div className="team-quiz-vs-divider tie-divider">
                <span>VS</span>
              </div>

              <button
                type="button"
                className={`team-quiz-option-card option-b tie-card ${
                  selectedOption === 'B' ? 'is-selected' : ''
                }`}
                onClick={() => handleSelectTieBreakerOption('B')}
              >
                <div className="option-badge tie-badge">B</div>
                <div className="option-content">
                  <span className="option-label">{currentTBQuestion.optionB.label}</span>
                </div>
              </button>
            </div>
          </div>
        ) : !isCompleted ? (
          /* ========================================================
             3. 기본 7문항 퀴즈 진행 화면 (Q1 ~ Q7)
             ======================================================== */
          <div className="team-quiz-question-stage">
            {/* 프로그레스 인디케이터 */}
            <div className="team-quiz-progress-wrap">
              <div className="team-quiz-step-info">
                <span className="team-quiz-step-tag">PL 입덕 밸런스 퀴즈</span>
                <span className="team-quiz-step-number">
                  <strong>{currentStep + 1}</strong> / {BASE_QUESTIONS.length}
                </span>
              </div>
              <div className="team-quiz-progress-track">
                <div
                  className="team-quiz-progress-bar"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 질문 타이틀 */}
            <div className="team-quiz-header">
              <div className="team-quiz-badge-group">
                <span className="team-quiz-q-badge">Q{currentQuestion.id}</span>
                {currentQuestion.category && (
                  <span className="team-quiz-category-tag">{currentQuestion.category}</span>
                )}
              </div>
              <h2 id="quiz-modal-title" className="team-quiz-title">
                {currentQuestion.title}
              </h2>
            </div>

            {/* 2지선다 옵션 카드 A vs B */}
            <div className="team-quiz-options-grid">
              <button
                type="button"
                className={`team-quiz-option-card option-a ${
                  selectedOption === 'A' || userAnswers[currentStep] === 'A' ? 'is-selected' : ''
                }`}
                onClick={() => handleSelectOption('A')}
              >
                <div className="option-badge">A</div>
                <div className="option-content">
                  <span className="option-label">{currentQuestion.optionA.label}</span>
                </div>
              </button>

              <div className="team-quiz-vs-divider">
                <span>VS</span>
              </div>

              <button
                type="button"
                className={`team-quiz-option-card option-b ${
                  selectedOption === 'B' || userAnswers[currentStep] === 'B' ? 'is-selected' : ''
                }`}
                onClick={() => handleSelectOption('B')}
              >
                <div className="option-badge">B</div>
                <div className="option-content">
                  <span className="option-label">{currentQuestion.optionB.label}</span>
                </div>
              </button>
            </div>

            {/* 넘어가기 (Skip) 버튼 */}
            <div className="team-quiz-skip-wrap">
              <button
                type="button"
                className={`team-quiz-skip-btn ${
                  selectedOption === 'SKIP' || userAnswers[currentStep] === 'SKIP' ? 'is-selected' : ''
                }`}
                onClick={() => handleSelectOption('SKIP')}
              >
                <span className="skip-btn-text">잘 모르겠어요 (Skip)</span>
                <span className="skip-btn-icon">⏭️</span>
              </button>
            </div>

            {/* 하단 이전 문항 네비게이션 */}
            <div className="team-quiz-footer-nav">
              {currentStep > 0 && (
                <button
                  type="button"
                  className="team-quiz-back-step-btn"
                  onClick={handlePrevStep}
                >
                  ← 이전 질문으로
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ========================================================
             4. 퀴즈 최종 결과 화면 (Result)
             ======================================================== */
          <div className="team-quiz-result-stage">
            <div className="team-quiz-result-badge">
              {matchResult?.isDefaultRecommended ? (
                <span className="team-quiz-tb-win-badge">
                  ⭐ 모든 질문 스킵 맞춤: 대표 인기 구단 추천
                </span>
              ) : matchResult?.wonByTieBreaker ? (
                <span className="team-quiz-tb-win-badge">
                  ⚔️ 서든데스 접전 끝에 운명 매칭!
                </span>
              ) : (
                <span>🎯 분석 완료! 당신의 운명 구단</span>
              )}
            </div>

            {matchResult?.bestClub && (
              <>
                {/* 매칭 엠블럼 (DB TEAMS 테이블 EMBLEM_URL 연동) */}
                <div className="team-quiz-emblem-wrap">
                  <div className="team-quiz-emblem-glow" />
                  <img
                    src={getHighResEmblemUrl(finalEmblemUrl)}
                    alt={`${matchResult.bestClub.name} 엠블럼`}
                    className="team-quiz-result-emblem"
                  />
                </div>

                {/* 매칭 문구 (요구사항 필수 반영) */}
                <div className="team-quiz-result-message-box">
                  <h3 className="team-quiz-match-headline">
                    {matchResult.isDefaultRecommended ? (
                      <>입문자 맞춤 추천 팀은 <span className="highlight-club">{matchResult.bestClub.name}</span>입니다!</>
                    ) : (
                      <>
                        <span className="match-headline-team">
                          당신과 어울리는 팀은 <span className="highlight-club">{matchResult.bestClub.name}</span>이며
                        </span>
                        <br />
                        <span className="match-headline-rate">
                          매칭률은 <span className="highlight-rate">{matchResult.matchPercentage}%</span>입니다
                        </span>
                      </>
                    )}
                  </h3>
                  <p className="team-quiz-result-desc">
                    "{matchResult.bestClub.description}"
                  </p>
                </div>

                {/* 다각도 매칭률 & TOP 1~3 성향 지분 분석 */}
                {matchResult?.subClubs && matchResult.subClubs.length > 0 && (
                  <div className="team-quiz-top3-breakdown">
                    <div className="top3-header">
                      <span className="top3-badge">📊 나의 PL 성향 지분율 분석 (TOP 3)</span>
                      {matchResult.totalValidQuestions > 0 && matchResult.totalValidQuestions < BASE_QUESTIONS.length && (
                        <span className="top3-valid-tag">
                          유효 답변 {matchResult.totalValidQuestions}/7문항 기준
                        </span>
                      )}
                    </div>

                    <div className="top3-list">
                      {/* 1위 구단 (운명의 구단) */}
                      <div className="top3-item rank-1">
                        <div className="top3-rank-pill pill-gold">1위</div>
                        <img
                          src={getHighResEmblemUrl(finalEmblemUrl)}
                          alt={matchResult.bestClub.name}
                          className="top3-emblem"
                        />
                        <div className="top3-content">
                          <div className="top3-row">
                            <span className="top3-name">{matchResult.bestClub.name}</span>
                            <span className="top3-rate">{matchResult.matchPercentage}%</span>
                          </div>
                          <div className="top3-track">
                            <div
                              className="top3-fill fill-rank-1"
                              style={{ width: `${matchResult.matchPercentage}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2위, 3위 구단 */}
                      {matchResult.subClubs.slice(0, 2).map((item, idx) => (
                        <div key={item.club.id || idx} className={`top3-item rank-${idx + 2}`}>
                          <div className={`top3-rank-pill ${idx === 0 ? 'pill-silver' : 'pill-bronze'}`}>
                            {idx + 2}위
                          </div>
                          <img
                            src={getHighResEmblemUrl(item.club.emblemUrl)}
                            alt={item.club.name}
                            className="top3-emblem"
                          />
                          <div className="top3-content">
                            <div className="top3-row">
                              <span className="top3-name">{item.club.name}</span>
                              <span className="top3-rate">{item.matchRate}%</span>
                            </div>
                            <div className="top3-track">
                              <div
                                className={`top3-fill fill-rank-${idx + 2}`}
                                style={{ width: `${item.matchRate}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 그룹 */}
                {(() => {
                  const targetTeamId = Number(matchResult.bestClub.teamId);
                  const commuTeam =
                    communityTeams.find((item) => Number(item.teamId) === targetTeamId) ||
                    communityTeams.find((item) => item.name === matchResult.bestClub.name);
                  const communityUrl = commuTeam ? `/plug/community/teams/${commuTeam.slug}` : '/plug/community/teams';
                  const hasFavoriteTeam = Boolean(currentUser?.favoriteTeamId);
                  const isCurrentClubMyFavorite = hasFavoriteTeam && Number(currentUser.favoriteTeamId) === targetTeamId;
                  const showSetFavoriteBtn = isLoggedIn && !hasFavoriteTeam;

                  return (
                    <div className="team-quiz-action-group">
                      {/* 상세 페이지 이동 */}
                      <a
                        href={`/plug/team/${matchResult.bestClub.teamId}`}
                        className="team-quiz-btn team-quiz-btn--primary"
                      >
                        ⚽ {matchResult.bestClub.name} 상세 페이지 보러가기
                      </a>

                      {/* 1등 팀 커뮤니티 이동 */}
                      <a
                        href={communityUrl}
                        className="team-quiz-btn team-quiz-btn--community"
                      >
                        💬 {matchResult.bestClub.name} 커뮤니티 바로가기
                      </a>

                      {/* 로그인 유저용 애정팀 정하기 버튼 (애정팀 미설정 시 노출) */}
                      {showSetFavoriteBtn && (
                        <button
                          type="button"
                          className="team-quiz-btn team-quiz-btn--favorite"
                          onClick={handleSetFavoriteTeam}
                          disabled={isSettingFavorite}
                        >
                          {isSettingFavorite ? '⏳ 애정팀 설정 중...' : `⭐ ${matchResult.bestClub.name} 애정팀으로 정하기`}
                        </button>
                      )}

                      {/* 이미 애정팀으로 설정된 경우 안내 배지 */}
                      {isCurrentClubMyFavorite && (
                        <div className="team-quiz-my-favorite-badge">
                          💖 나의 애정팀으로 등록된 구단입니다
                        </div>
                      )}

                      {/* 애정팀 피드백 메시지 */}
                      {favoriteFeedback && (
                        <div className={`team-quiz-favorite-alert alert-${favoriteFeedback.type}`} role="alert">
                          {favoriteFeedback.message}
                        </div>
                      )}

                      {/* 다시 풀기 */}
                      <button
                        type="button"
                        className="team-quiz-btn team-quiz-btn--restart"
                        onClick={handleRestart}
                      >
                        🔄 다시 테스트 하기
                      </button>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
