import React, { useState, useRef, useEffect } from 'react';
import { VERIFIED_ANTHEM_URLS } from '../../api/teamApi.js';

// 유튜브 URL에서 임베드용 영상 ID 추출 함수
function getYouTubeVideoId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export default function TeamAudioPlayer({ teamId, anthemUrl, teamName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const iframeRef = useRef(null);

  const resolvedUrl = VERIFIED_ANTHEM_URLS[Number(teamId)] || anthemUrl;
  const videoId = getYouTubeVideoId(resolvedUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  // 구단 이동 시 오디오 재생 상태 초기화
  useEffect(() => {
    setIsPlaying(false);
    setHasStarted(false);
  }, [teamId, videoId]);

  const sendCommand = (func, args = []) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: 'command', func, args }), '*');
  };

  const handleIframeLoad = () => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
    sendCommand('unMute', []);
    sendCommand('setVolume', [100]);
    if (isPlaying) {
      sendCommand('playVideo', []);
    }
  };

  const handleTogglePlay = () => {
    if (!embedUrl) return;

    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
      return;
    }

    if (isPlaying) {
      sendCommand('pauseVideo', []);
      setIsPlaying(false);
    } else {
      sendCommand('unMute', []);
      sendCommand('setVolume', [100]);
      sendCommand('playVideo', []);
      setIsPlaying(true);
    }
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

      {/* 백그라운드 오디오 재생용 숨김 iframe (첫 재생 클릭 시 마운트 및 자동재생) */}
      {embedUrl && hasStarted && (
        <iframe
          key={`${teamId || ''}-${videoId}`}
          ref={iframeRef}
          src={`${embedUrl}?autoplay=1&enablejsapi=1&playsinline=1&rel=0&loop=1&playlist=${videoId}`}
          title={`${teamName} 응원가 재생기`}
          className="team-hidden-audio-frame"
          allow="autoplay; encrypted-media"
          onLoad={handleIframeLoad}
        />
      )}
    </div>
  );
}


