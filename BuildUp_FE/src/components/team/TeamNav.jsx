import React from 'react';

export default function TeamNav({ prevTeam, nextTeam }) {
  return (
    <div className="team-right-nav">
      <a href="/plug/mainpage" className="team-back-link">
        ← 메인페이지로 돌아가기
      </a>
      <div className="team-quick-nav">
        <a
          href={`/plug/team/${prevTeam.teamId}`}
          className="team-nav-arrow"
          title={`이전: ${prevTeam.teamName}`}
        >
          ◀ {prevTeam.teamName}
        </a>
        <span className="team-nav-divider">|</span>
        <a
          href={`/plug/team/${nextTeam.teamId}`}
          className="team-nav-arrow"
          title={`다음: ${nextTeam.teamName}`}
        >
          {nextTeam.teamName} ▶
        </a>
      </div>
    </div>
  );
}

