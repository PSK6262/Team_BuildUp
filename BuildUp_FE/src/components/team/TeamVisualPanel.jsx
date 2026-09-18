import React, { useRef, useLayoutEffect } from 'react';
import TeamAudioPlayer from './TeamAudioPlayer.jsx';

// 글자 수 기반 최적 초기 폰트 크기 계산 (단일 행 유지)
function getInitialTitleFontSize(name) {
  const len = (name || '').length;
  if (len <= 5) return 44; // 첼시 FC, 풀럼 FC
  if (len <= 6) return 42; // 아스널 FC, 리버풀 FC, 에버튼 FC
  if (len <= 8) return 36; // AFC 본머스, 선덜랜드 AFC, 브렌트포드 FC, 헐 시티 AFC
  if (len <= 10) return 31; // 맨체스터 시티 FC, 토트넘 홋스퍼 FC, 코벤트리 시티 FC, 입스위치 타운 FC
  if (len <= 12) return 27; // 크리스탈 팰리스 FC, 리즈 유나이티드 FC, 노팅엄 포레스트 FC, 뉴캐슬 유나이티드 FC
  if (len <= 14) return 25; // 맨체스터 유나이티드 FC (13)
  return 22; // 브라이튼 앤 호브 알비온 FC (16)
}

function getInitialSubTitleFontSize(name) {
  const len = (name || '').length;
  if (len <= 12) return 18;
  if (len <= 18) return 16;
  if (len <= 22) return 15;
  return 14; // Brighton & Hove Albion FC (25)
}

// 고해상도 엠블럼 URL 생성 (SVG 벡터 우선, fallback PNG)
function getEmblemSvgUrl(url) {
  if (!url) return '';
  return url.replace('/50/', '/').replace('.png', '.svg');
}

function getHighResPngUrl(url) {
  if (!url) return '';
  return url.replace('/50/', '/100/');
}

export default function TeamVisualPanel({ team, onWheel }) {
  const emblemSvg = getEmblemSvgUrl(team.emblemUrl);
  const emblemPng = getHighResPngUrl(team.emblemUrl);

  const titleName = team.teamNameKor || team.teamName || '';
  const subNameEn = team.teamNameKor && team.teamName ? team.teamName : '';

  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const subTitleRef = useRef(null);

  // 컨테이너 폭과 텍스트 길이에 맞춰 무조건 한 줄에 꼭 맞게 유동 조절
  useLayoutEffect(() => {
    const containerEl = containerRef.current;
    const titleEl = titleRef.current;
    if (!containerEl || !titleEl) return;

    function fitTitle() {
      const initialSize = getInitialTitleFontSize(titleName);
      titleEl.style.fontSize = `${initialSize}px`;

      const availableWidth = containerEl.clientWidth;
      if (!availableWidth) return;

      let size = initialSize;
      while (titleEl.scrollWidth > availableWidth && size > 15) {
        size -= 0.5;
        titleEl.style.fontSize = `${size}px`;
      }
    }

    function fitSubTitle() {
      const subEl = subTitleRef.current;
      if (!subEl || !subNameEn) return;

      const initialSize = getInitialSubTitleFontSize(subNameEn);
      subEl.style.fontSize = `${initialSize}px`;

      const availableWidth = containerEl.clientWidth;
      if (!availableWidth) return;

      let size = initialSize;
      while (subEl.scrollWidth > availableWidth && size > 11) {
        size -= 0.5;
        subEl.style.fontSize = `${size}px`;
      }
    }

    fitTitle();
    fitSubTitle();

    const resizeObserver = new ResizeObserver(() => {
      fitTitle();
      fitSubTitle();
    });

    resizeObserver.observe(containerEl);

    return () => {
      resizeObserver.disconnect();
    };
  }, [titleName, subNameEn]);

  return (
    <aside className="team-left" onWheel={onWheel}>
      {/* 엠블럼으로 좌측 배경 전체를 꽉 채움 (초미세 블러 1.5px) */}
      <div
        className="team-emblem-full-bg"
        style={{ backgroundImage: `url(${emblemPng || team.emblemUrl})` }}
        aria-hidden="true"
      />
      <div className="team-emblem-bg-overlay" aria-hidden="true" />

      {/* 좌측 콘텐츠 */}
      <div className="team-left__content">
        <div className="team-left-top" ref={containerRef}>
          {/* 창단연도 뱃지 */}
          <div className="team-badge-group">
            <span className="team-founded-chip">EST. {team.foundedYear}</span>
          </div>

          {/* 팀 이름 (유동적 폰트 조절로 항상 한 줄 유지) */}
          <h1
            ref={titleRef}
            className="team-name"
            style={{ fontSize: `${getInitialTitleFontSize(titleName)}px` }}
          >
            {titleName}
          </h1>

          {subNameEn && (
            <div
              ref={subTitleRef}
              className="team-subname-en"
              style={{
                fontSize: `${getInitialSubTitleFontSize(subNameEn)}px`,
                color: '#ffffff',
                fontWeight: 600,
                marginTop: '4px',
                letterSpacing: '-0.2px',
                textShadow: '0 2px 10px rgba(0, 0, 0, 0.6)'
              }}
            >
              ({subNameEn})
            </div>
          )}
        </div>

        {/* 중앙: 엠블럼 바탕 위에 감싸는 원 없이 대형 공식 엠블럼 직접 표시 */}
        <div className="team-left-middle">
          <img
            src={emblemSvg || emblemPng || team.emblemUrl}
            alt={`${team.teamName} emblem`}
            className="team-center-emblem"
            onError={(e) => {
              if (e.currentTarget.src !== emblemPng && emblemPng) {
                e.currentTarget.src = emblemPng;
              }
            }}
          />
        </div>

        {/* 하단: 순수 오디오 플레이어 바 (유튜브 링크 없음) */}
        <TeamAudioPlayer anthemUrl={team.anthemUrl || team.anithemUrl} teamName={team.teamNameKor || team.teamName} />
      </div>
    </aside>
  );
}

