import React from 'react';

export default function TeamNotFound({ teamId }) {
  return (
    <div className="team-container">
      <div className="team-not-found">
        <h2>존재하지 않는 구단입니다.</h2>
        <p>요청하신 팀 ID ({teamId})를 찾을 수 없습니다.</p>
        <a href="/plug/mainpage" className="team-back-btn">
          ← 메인페이지로 돌아가기
        </a>
      </div>
    </div>
  );
}

