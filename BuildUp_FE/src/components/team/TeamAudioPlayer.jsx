import React, { useState, useRef } from 'react';

// 유튜브 URL에서 임베드용 영상 ID 추출 함수
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default function TeamAudioPlayer({ anthemUrl, teamName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef(null);
  const embedUrl = getYouTubeEmbedUrl(anthemUrl);

  const handleTogglePlay = () => {
    if (!iframeRef.current || !embedUrl) return;

    const command = isPlaying ? 'pauseVideo' : 'playVideo';
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: command, args: '' }),
      '*'
    );
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="team-player-bar">
      <div className="team-player-controls">
        <button
          type="button"
          className={`team-play-btn ${isPlaying ? 'is-playing' : ''}`}
          onClick={handleTogglePlay}
          aria-label={isPlaying ? '응원가 일시정지' : '응원가 재생'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 24 24" className="player-icon" aria-hidden="true">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="player-icon" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className="team-player-info">
          <span className="team-player-title">{teamName} Official Anthem</span>
          <span className="team-player-sub">
            {isPlaying ? '응원가 재생 중...' : '공식 구단 응원가 듣기'}
          </span>
        </div>

        {/* 사운드 웨이브 애니메이션 */}
        <div
          className={`team-sound-wave ${isPlaying ? 'is-active' : ''}`}
          aria-hidden="true"
        >
          <span className="sound-bar" />
          <span className="sound-bar" />
          <span className="sound-bar" />
          <span className="sound-bar" />
        </div>
      </div>

      {/* 백그라운드 오디오 재생용 숨김 iframe */}
      {embedUrl && (
        <iframe
          ref={iframeRef}
          src={`${embedUrl}?enablejsapi=1`}
          title={`${teamName} 응원가 재생기`}
          className="team-hidden-audio-frame"
          allow="autoplay; encrypted-media"
        />
      )}
    </div>
  );
}

