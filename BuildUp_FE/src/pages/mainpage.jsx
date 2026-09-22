import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeams } from '../store/teamSlice.js';
import TeamQuizModal from '../components/quiz/TeamQuizModal.jsx';
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
  const teams = useSelector((state) => state.team.teams);
  const [ hoveredTeam, setHoveredTeam ] = useState(null);
  const [ introIndex, setIntroIndex ] = useState(0);
  const [ isTextVisible, setIsTextVisible ] = useState(true);
  const [ isIntroFinished, setIsIntroFinished ] = useState(false);
  const [ isQuizOpen, setIsQuizOpen ] = useState(false);

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
      {/* 프리미어리그 시그니처 지그재그 번개 방사형 배경 (SVG) */}
      <div className="mainpage-bg" aria-hidden="true">
        <svg
          className="mainpage-bg__svg"
          viewBox="0 0 1600 1000"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* 배경 방사형 그라데이션: 프리미어리그 공식 딥 로열 퍼플 */}
            <radialGradient id="eplBg" cx="800" cy="850" r="950" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#35063d" />
              <stop offset="50%" stopColor="#26022c" />
              <stop offset="100%" stopColor="#16011a" />
            </radialGradient>

            {/* 1. 좌측 하단 번개 그라데이션 */}
            <linearGradient id="rayBottomLeft" x1="0" y1="650" x2="660" y2="880" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a45bb3" />
              <stop offset="30%" stopColor="#9346a2" />
              <stop offset="65%" stopColor="#6f247c" />
              <stop offset="90%" stopColor="#3d0746" />
              <stop offset="100%" stopColor="#26022c" stopOpacity="0" />
            </linearGradient>

            {/* 2. 좌측 상단 번개 그라데이션 */}
            <linearGradient id="rayMidLeft" x1="200" y1="-20" x2="680" y2="680" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#aa62b9" />
              <stop offset="35%" stopColor="#9346a2" />
              <stop offset="70%" stopColor="#672074" />
              <stop offset="92%" stopColor="#3d0746" />
              <stop offset="100%" stopColor="#26022c" stopOpacity="0" />
            </linearGradient>

            {/* 3. 중앙 수직 번개 그라데이션 */}
            <linearGradient id="rayCenter" x1="800" y1="-20" x2="800" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#aa62b9" />
              <stop offset="35%" stopColor="#9346a2" />
              <stop offset="70%" stopColor="#672074" />
              <stop offset="92%" stopColor="#3d0746" />
              <stop offset="100%" stopColor="#26022c" stopOpacity="0" />
            </linearGradient>

            {/* 4. 우측 상단 번개 그라데이션 */}
            <linearGradient id="rayUpperRight" x1="1600" y1="120" x2="870" y2="690" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#aa62b9" />
              <stop offset="35%" stopColor="#9346a2" />
              <stop offset="70%" stopColor="#672074" />
              <stop offset="92%" stopColor="#3d0746" />
              <stop offset="100%" stopColor="#26022c" stopOpacity="0" />
            </linearGradient>

            {/* 5. 우측 하단 번개 그라데이션 */}
            <linearGradient id="rayLowerRight" x1="1600" y1="700" x2="980" y2="890" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#a45bb3" />
              <stop offset="30%" stopColor="#9346a2" />
              <stop offset="65%" stopColor="#6f247c" />
              <stop offset="90%" stopColor="#3d0746" />
              <stop offset="100%" stopColor="#26022c" stopOpacity="0" />
            </linearGradient>

            {/* 6. 우측 최하단 보조 번개 그라데이션 */}
            <linearGradient id="rayFarBottomRight" x1="1600" y1="880" x2="1200" y2="980" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#9d54ab" />
              <stop offset="50%" stopColor="#732782" />
              <stop offset="100%" stopColor="#26022c" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* 딥 퍼플 베이스 배경 사각형 */}
          <rect width="1600" height="1000" fill="url(#eplBg)" />

          {/* 방사형 지그재그 번개 그룹 */}
          <g className="mainpage-bg__bolts">
            {/* 1. 좌측 하단 번개 */}
            <path
              className="bolt bolt--bottom-left"
              fill="url(#rayBottomLeft)"
              d="
                M -20,540
                L 110,630 L 70,650
                L 230,725 L 190,750
                L 370,810 L 330,835
                L 510,875 L 480,895
                L 630,920
                Q 320,910 -20,770
                Z
              "
            />

            {/* 2. 좌측 상단 곡선 번개 */}
            <path
              className="bolt bolt--mid-left"
              fill="url(#rayMidLeft)"
              d="
                M 210,-40
                L 245,120  L 305,100
                L 345,260  L 410,240
                L 450,400  L 515,380
                L 555,540  L 615,520
                L 665,670
                Q 360,460 110,-40
                Z
              "
            />

            {/* 3. 중앙 수직 번개 */}
            <path
              className="bolt bolt--center"
              fill="url(#rayCenter)"
              d="
                M 750,-40
                L 720,130 L 765,115
                L 720,290 L 770,275
                L 730,450 L 780,435
                L 745,590 L 785,580
                L 765,685
                L 835,685
                L 815,580 L 855,590
                L 820,435 L 870,450
                L 830,275 L 880,290
                L 835,115 L 880,130
                L 850,-40
                Z
              "
            />

            {/* 4. 우측 상단 곡선 번개 */}
            <path
              className="bolt bolt--upper-right"
              fill="url(#rayUpperRight)"
              d="
                M 1650,140
                L 1420,225 L 1465,245
                L 1250,345 L 1295,368
                L 1080,480 L 1120,505
                L 930,625  L 965,645
                L 870,700
                Q 1220,550 1650,300
                Z
              "
            />

            {/* 5. 우측 하단 번개 */}
            <path
              className="bolt bolt--lower-right"
              fill="url(#rayLowerRight)"
              d="
                M 1650,600
                L 1420,685 L 1465,705
                L 1250,775 L 1290,798
                L 1100,850 L 1135,870
                L 980,915
                Q 1330,880 1650,750
                Z
              "
            />

            {/* 6. 우측 최하단 보조 번개 */}
            <path
              className="bolt bolt--far-bottom-right"
              fill="url(#rayFarBottomRight)"
              d="
                M 1650,810
                L 1490,875 L 1525,895
                L 1340,945 L 1370,965
                L 1220,995
                Q 1460,980 1650,920
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
                    <strong className="team-highlight">{hoveredTeam.teamNameKor || hoveredTeam.teamName}</strong>
                    <span className="team-details"> ({hoveredTeam.homeGroundKor || hoveredTeam.homeGround})</span>
                  </>
                ) : (
                  <span className="team-placeholder">마우스를 올려 탐을 만나보거나, 질문을 통해 운명의 팀을 마주해봐</span>
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

                return (
                  <div
                    key={team.teamId}
                    className="emblem-slot"
                    style={{ '--angle': `${angle}deg` }}
                  >
                    <div className="emblem-rotator">
                      <a
                        href={`/plug/team/${team.teamId}`}
                        className={`emblem-card ${isHovered ? 'is-hovered' : ''}`}
                        onMouseEnter={() => setHoveredTeam(team)}
                        onMouseLeave={() => setHoveredTeam(null)}
                        onFocus={() => setHoveredTeam(team)}
                        onBlur={() => setHoveredTeam(null)}
                        aria-label={`${team.teamNameKor || team.teamName} 상세 소개 페이지로 이동`}
                        title={`${team.teamNameKor || team.teamName} 상세 보기`}
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
