import React from 'react';
import { getTeamTheme } from '../../constants/teamTheme.js';

function getHighResEmblemUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace('/50/', '/100/');
}

export default function TeamCard({ team }) {
  const highResEmblem = getHighResEmblemUrl(team.emblemUrl);
  const theme = getTeamTheme(team);
  const isWhiteHex = (theme.hex || '').toUpperCase() === '#FFFFFF';

  return (
    <a
      href={`/plug/team/${team.teamId}`}
      className="team-grid-card"
      style={{
        '--team-hex': theme.hex,
        '--team-glow': theme.glow,
        '--team-hex-light': isWhiteHex ? '#260E36' : theme.hex,
        '--team-glow-light': isWhiteHex ? 'rgba(38, 14, 54, 0.32)' : theme.glow
      }}
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
        {team.teamName && (
          <span className="team-grid-card__name-en">({team.teamName})</span>
        )}
      </div>
    </a>
  );
}

export { TeamCard };


