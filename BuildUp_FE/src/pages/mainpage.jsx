import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/authSlice.js';
import { fetchTeams } from '../store/teamSlice.js';
import TeamQuizModal from '../components/quiz/TeamQuizModal.jsx';
import { getTeamTheme } from '../constants/teamTheme.js';
import '../css/mainpage.css';

const INTRO_SENTENCES = [
  "고요를 삼킨 찰나의 순간",
  "발끝에서 피어오르는 전율",
  "단 한 번의 함성에 요동치는 심장",
  "전 세계를 열광케 한 단 하나의 무대",
  "프리미어리그로!!!"
];

export default function MainPage() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => state.auth?.isLoggedIn);
  const currentUser = useSelector((state) => state.auth?.user);
  const favoriteTeamId = currentUser?.favoriteTeamId
    ? Number(currentUser.favoriteTeamId)
    : (() => {
        try {
          const u = JSON.parse(localStorage.getItem('buildup_user') || '{}');
          return u?.favoriteTeamId ? Number(u.favoriteTeamId) : null;
        } catch {
          return null;
        }
      })();

  const teams = useSelector((state) => state.team?.teams || []);
  const [ hoveredTeam, setHoveredTeam ] = useState(null);
  const hoveredTheme = hoveredTeam ? getTeamTheme(hoveredTeam) : null;
  const [ introIndex, setIntroIndex ] = useState(0);
  const [ isTextVisible, setIsTextVisible ] = useState(true);
  const [ isIntroFinished, setIsIntroFinished ] = useState(false);
  const [ isQuizOpen, setIsQuizOpen ] = useState(false);

  // 로그인 상태일 때 최신 회원 정보(애정 구단 ID 포함) 동기화
  useEffect(() => {
    if (isLoggedIn) {
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
  }, [isLoggedIn, dispatch]);

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  useEffect(() => {
    if (isIntroFinished || introIndex >= INTRO_SENTENCES.length) return;

    // 각 문장 표시 시간 (1700ms 동안 표시 후 450ms 동안 페이드아웃)
    const fadeOutTimer = setTimeout(() => {
      setIsTextVisible(false);
    }, 1700);

    const nextSentenceTimer = setTimeout(() => {
      if (introIndex + 1 >= INTRO_SENTENCES.length) {
        setIsIntroFinished(true);
      } else {
        setIntroIndex((prev) => prev + 1);
        setIsTextVisible(true);
      }
    }, 2150);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(nextSentenceTimer);
    };
  }, [ introIndex, isIntroFinished ]);

  const handleSkipIntro = () => {
    setIsIntroFinished(true);
  };

  return (
    <div className="mainpage-container">
      {/* 프리미어리그 공식 시그니처 딥 플럼 & 곡면 라이트닝 쉐브론 리본 배경 그래픽 (SVG) */}
      <div className="mainpage-bg" aria-hidden="true">
        <svg
          className="mainpage-bg__svg"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 베이스 배경 그라데이션: 프리미어리그 브랜드 딥 플럼 / 어버진 퍼플 */}
            <linearGradient id="eplPlumBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d0631" />
              <stop offset="40%" stopColor="#370c39" />
              <stop offset="70%" stopColor="#2c0630" />
              <stop offset="100%" stopColor="#1e0321" />
            </linearGradient>

            {/* 볼트 쉐브론 리본 그라데이션: 딥 바이올렛 -> 눈부신 라일락 퍼플 */}
            <linearGradient id="eplRibbonGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4d1952" stopOpacity={0.9} />
              <stop offset="30%" stopColor="#64276d" stopOpacity={0.94} />
              <stop offset="60%" stopColor="#833d8c" stopOpacity={0.97} />
              <stop offset="85%" stopColor="#9f56aa" stopOpacity={0.99} />
              <stop offset="100%" stopColor="#b66ac5" stopOpacity={1} />
            </linearGradient>
          </defs>

          {/* 딥 플럼 베이스 배경 사각형 */}
          <rect width="1600" height="1000" fill="url(#eplPlumBg)" />

          {/* 동심원 곡면 라이트닝 쉐브론 리본 그룹 */}
          <g className="mainpage-bg__bolts">
            {/* 1. 좌상단 쉐브론 리본 */}
            <path
              className="bolt bolt--ribbon-1"
              fill="url(#eplRibbonGrad)"
              d="
                M 400,0
                C 480,0 550,0 610,0
                C 540,80 460,180 370,260
                C 260,360 140,460 0,540
                L 0,470
                C 40,440 90,390 120,355
                L 150,370
                L 175,335
                L 220,265
                L 260,195
                L 282,218
                L 295,225
                L 322,170
                L 336,142
                L 366,92
                L 380,60
                L 400,0
                Z
              "
            />

            {/* 2. 중상단 쉐브론 리본 (위에서 두 번째 번개) */}
            <path
              className="bolt bolt--ribbon-2"
              fill="url(#eplRibbonGrad)"
              d="
                M 1032,0
                L 1255,0
                C 1160,130 1040,270 890,410
                C 730,560 520,690 280,775
                C 180,810 90,830 0,840
                L 0,760
                C 70,750 140,730 200,695
                L 205,735
                C 290,690 380,630 455,555
                L 462,605
                C 560,510 660,400 760,285
                L 768,340
                C 850,230 945,115 1032,0
                Z
              "
            />

            {/* 3. 중앙 지배형 곡면 쉐브론 리본 */}
            <path
              className="bolt bolt--ribbon-3"
              fill="url(#eplRibbonGrad)"
              d="
                M 1600,320
                L 1600,430
                C 1420,570 1210,700 970,800
                C 730,900 440,960 0,980
                L 0,910
                C 160,895 320,870 470,820
                L 436,786
                L 488,775
                L 514,768
                L 665,707
                L 658,771
                L 735,746
                L 806,718
                L 876,686
                L 942,657
                L 1001,625
                L 1098,564
                L 1109,643
                L 1175,604
                L 1230,575
                L 1293,532
                L 1371,486
                L 1478,411
                L 1574,339
                L 1600,320
                Z
              "
            />

            {/* 4. 우하단 쉐브론 리본 */}
            <path
              className="bolt bolt--ribbon-4"
              fill="url(#eplRibbonGrad)"
              d="
                M 1600,590
                C 1460,670 1310,750 1150,820
                C 990,890 820,950 630,1000
                L 760,1000
                C 940,950 1120,880 1280,800
                C 1420,730 1530,660 1600,600
                Z
              "
            />

            {/* 5. 최하단 보조 쉐브론 리본 */}
            <path
              className="bolt bolt--ribbon-5"
              fill="url(#eplRibbonGrad)"
              opacity={0.8}
              d="
                M 1600,820
                C 1500,880 1380,940 1250,990
                L 1370,1000
                C 1470,950 1550,900 1600,850
                Z
              "
            />
          </g>
        </svg>

        {/* 배경 비네팅 오버레이 */}
        <div className="mainpage-bg__vignette" />
      </div>

      {/* 메인 콘텐츠 영역: 인트로 문구 순차 재생 -> 완료 후 오빗 무대 전환 */}
      <main className="mainpage-content">
        {!isIntroFinished ? (
          <div className="mainpage-intro-stage" aria-live="polite">
            <h2
              className={`mainpage-intro-text ${isTextVisible ? 'is-visible' : ''} ${introIndex === 4 ? 'is-highlight' : ''
                }`}
            >
              {INTRO_SENTENCES[ introIndex ]}
            </h2>
            <button
              type="button"
              className="mainpage-intro-skip"
              onClick={handleSkipIntro}
              aria-label="인트로 건너뛰기"
            >
              건너뛰기 SKIP ⏭
            </button>
          </div>
        ) : (
          <section className="mainpage-orbit-stage is-revealed" aria-label="프리미어리그 20개 구단 엠블럼">
            {/* 중앙 고정 문구 영역 */}
            <div className="mainpage-orbit-center">
              <h1 className="mainpage-orbit-title">
                이 벅찬 환호 속에서<br />함께 날뛸 단 하나의 엠블럼
              </h1>
              <p className="mainpage-orbit-subtitle" aria-live="polite">
                {hoveredTeam ? (
                  <>
                    <strong
                      className={`team-highlight ${hoveredTheme?.isDarkNeon ? 'is-dark-neon' : ''}`}
                      style={{
                        '--team-color': hoveredTheme?.hex,
                        '--team-glow': hoveredTheme?.glow,
                        '--text-stroke': hoveredTheme?.textStroke || '#ffffff',
                        '--text-glow': hoveredTheme?.textGlow || 'rgba(255, 255, 255, 0.85)'
                      }}
                    >
                      {hoveredTeam.teamNameKor || hoveredTeam.teamName}
                    </strong>
                    <span className="team-details"> ({hoveredTeam.homeGroundKor || hoveredTeam.homeGround})</span>
                  </>
                ) : (
                  <span className="team-placeholder">마우스를 올려 정보를 확인하고, 질문을 통해 운명의 팀을 마주해봐</span>
                )}
              </p>

              {/* 가운데 문구 아래 항상 고정으로 배치된 퀵 밸런스 게임 모달 트리거 버튼 */}
              <div className="mainpage-quiz-trigger-wrap">
                <button
                  type="button"
                  className="mainpage-quiz-trigger-btn"
                  onClick={() => setIsQuizOpen(true)}
                  aria-haspopup="dialog"
                  aria-expanded={isQuizOpen}
                >
                  <span className="quiz-btn-title">함께할 내 운명의 팀 찾기</span>
                </button>
              </div>
            </div>

            {/* 20개 엠블럼 원형 회전 링 */}
            <div className={`mainpage-orbit-ring ${hoveredTeam ? 'is-paused has-hover' : ''}`}>
              {teams.map((team, index) => {
                const angle = (index / (teams.length || 20)) * 360;
                const isHovered = hoveredTeam?.teamId === team.teamId;
                const isFavorite = Boolean(favoriteTeamId && Number(team.teamId) === favoriteTeamId);
                const theme = getTeamTheme(team);

                return (
                  <div
                    key={team.teamId}
                    className="emblem-slot"
                    style={{ '--angle': `${angle}deg` }}
                  >
                    <div className="emblem-rotator">
                      <a
                        href={`/plug/team/${team.teamId}`}
                        className={`emblem-card ${isHovered ? 'is-hovered' : ''} ${isFavorite ? 'is-favorite' : ''}`}
                        style={{
                          '--team-hex': theme.hex,
                          '--team-glow': theme.glow
                        }}
                        onMouseEnter={() => setHoveredTeam(team)}
                        onMouseLeave={() => setHoveredTeam(null)}
                        onFocus={() => setHoveredTeam(team)}
                        onBlur={() => setHoveredTeam(null)}
                        aria-label={`${team.teamNameKor || team.teamName}${isFavorite ? ' (내 애정팀)' : ''} 상세 소개 페이지로 이동`}
                        title={`${team.teamNameKor || team.teamName}${isFavorite ? ' (내 애정팀)' : ''} 상세 보기`}
                      >
                        <img
                          src={team.emblemUrl ? (team.emblemUrl.includes('/badges/50/') ? team.emblemUrl.replace('/badges/50/', '/badges/') : team.emblemUrl) : ''}
                          alt={`${team.teamNameKor || team.teamName} 로고`}
                          className="emblem-img"
                          loading="eager"
                          decoding="sync"
                        />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>

      {/* 퀴즈 모달 (DB TEAMS 테이블 연동 구단 데이터 전달) */}
      <TeamQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        teams={teams}
      />
    </div>
  );
}

export { MainPage };
