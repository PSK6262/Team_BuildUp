import React from 'react';


function getHighResEmblemUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/50/', '/100/');
}

export default function TeamCard({ team }) {
  const highResEmblem = getHighResEmblemUrl(team.emblemUrl);

  return (
    <a
      href={`/plug/team/${team.teamId}`}
      className="team-grid-card"
      title={`${team.teamNameKor || team.teamName} 상세 소개 보기`}
    >
      <div className="team-grid-card__emblem-wrap">
        <img
          src={highResEmblem}
          alt={`${team.teamNameKor || team.teamName} 엠블럼`}
          className="team-grid-card__emblem"
          loading="lazy"
        />
      </div>
      <div className="team-grid-card__info">
        <span className="team-grid-card__name">{team.teamNameKor || team.teamName}</span>
      </div>
    </a>
  );
}

export { TeamCard };

