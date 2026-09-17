import React from 'react';
import TeamAudioPlayer from './TeamAudioPlayer.jsx';

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
        <div className="team-left-top">
          {/* 창단연도 뱃지 */}
          <div className="team-badge-group">
            <span className="team-founded-chip">EST. {team.foundedYear}</span>
          </div>

          {/* 팀 이름 */}
          <h1 className="team-name">{team.teamName}</h1>
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
        <TeamAudioPlayer anthemUrl={team.anithemUrl} teamName={team.teamName} />
      </div>
    </aside>
  );
}

