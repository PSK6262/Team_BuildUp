import React from 'react';
import TeamAudioPlayer from './TeamAudioPlayer.jsx';

// 고해상도 엠블럼 URL 생성 (50px -> 100px)
function getHighResEmblemUrl(url) {
  if (!url) return '';
  return url.replace('/50/', '/100/');
}

export default function TeamVisualPanel({ team }) {
  const highResEmblem = getHighResEmblemUrl(team.emblemUrl);

  return (
    <aside className="team-left">
      {/* 엠블럼으로 좌측 배경 전체를 꽉 채움 (초미세 블러 1.5px) */}
      <div
        className="team-emblem-full-bg"
        style={{ backgroundImage: `url(${highResEmblem})` }}
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

        {/* 중앙: 엠블럼의 고유 문양이 시원하게 드러나는 여백 */}
        <div className="team-left-middle" />

        {/* 하단: 순수 오디오 플레이어 바 (유튜브 링크 없음) */}
        <TeamAudioPlayer anthemUrl={team.anithemUrl} teamName={team.teamName} />
      </div>
    </aside>
  );
}

