import React, { useState, useRef, useEffect } from 'react';
import { VERIFIED_ANTHEM_URLS } from '../../api/teamApi.js';

// 유튜브 URL에서 임베드용 영상 ID 추출 함수 (&list=..., &start_radio=1 등 쿼리 파라미터 포함 대응)
function getYouTubeVideoId(url) {
  if (!url) return null;
  const vMatch = url.match(/[?&]v=([\w-]{11})/);
  if (vMatch) return vMatch[1];
  const shortMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/))([\w-]{11})/);
  return shortMatch ? shortMatch[1] : null;
}

// YouTube IFrame API 전역 로더
let ytApiPromise = null;
function loadYouTubeIframeApi() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not available'));
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT);
  }
  if (ytApiPromise) {
    return ytApiPromise;
  }
  ytApiPromise = new Promise((resolve) => {
    const existingScript = document.getElementById('yt-iframe-api-script');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousCallback === 'function') {
        try { previousCallback(); } catch (_) {}
      }
      resolve(window.YT);
    };

    const interval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        clearInterval(interval);
        resolve(window.YT);
      }
    }, 100);

    setTimeout(() => {
      clearInterval(interval);
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
      }
    }, 5000);
  });
  return ytApiPromise;
}

export default function TeamAudioPlayer({ teamId, anthemUrl, teamName }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const playerRef = useRef(null);
  const mountRef = useRef(null);
  const iframeFallbackRef = useRef(null);
  const userWantsPlayRef = useRef(false);

  const resolvedUrl = VERIFIED_ANTHEM_URLS[Number(teamId)] || anthemUrl;
  const videoId = getYouTubeVideoId(resolvedUrl);

  // 팀 변경 시 재생 상태 초기화
  useEffect(() => {
    setIsPlaying(false);
    userWantsPlayRef.current = false;

    if (playerRef.current && typeof playerRef.current.cueVideoById === 'function') {
      try {
        playerRef.current.pauseVideo();
        if (videoId) {
          playerRef.current.cueVideoById(videoId);
          playerRef.current.unMute();
          playerRef.current.setVolume(100);
        }
      } catch (err) {
        console.warn('[TeamAudioPlayer] cueVideoById error:', err);
      }
    }
  }, [teamId, videoId]);

  // YouTube IFrame API 플레이어 초기화
  useEffect(() => {
    let isCancelled = false;

    loadYouTubeIframeApi()
      .then((YT) => {
        if (isCancelled || !mountRef.current || !videoId) return;

        if (!playerRef.current) {
          try {
            playerRef.current = new YT.Player(mountRef.current, {
              height: '200',
              width: '200',
              videoId: videoId,
              playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                origin: window.location.origin
              },
              events: {
                onReady: (event) => {
                  if (isCancelled) return;
                  try {
                    event.target.unMute();
                    event.target.setVolume(100);
                    if (userWantsPlayRef.current) {
                      event.target.playVideo();
                    }
                  } catch (_) {}
                },
                onStateChange: (event) => {
                  if (isCancelled) return;
                  // 1: PLAYING, 2: PAUSED, 0: ENDED
                  if (event.data === 1) {
                    setIsPlaying(true);
                    userWantsPlayRef.current = true;
                  } else if (event.data === 2) {
                    setIsPlaying(false);
                    userWantsPlayRef.current = false;
                  } else if (event.data === 0) {
                    // 무한 반복 재생
                    try {
                      event.target.seekTo(0);
                      event.target.playVideo();
                    } catch (_) {}
                  }
                },
                onError: (err) => {
                  console.warn('[TeamAudioPlayer] YT error event:', err);
                  setUseFallback(true);
                }
              }
            });
          } catch (err) {
            console.warn('[TeamAudioPlayer] YT.Player init fail:', err);
            setUseFallback(true);
          }
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setUseFallback(true);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [videoId]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
          playerRef.current = null;
        } catch (_) {}
      }
    };
  }, []);

  // 재생 / 일시정지 제어
  const handleTogglePlay = () => {
    if (!videoId) return;

    if (isPlaying) {
      userWantsPlayRef.current = false;
      setIsPlaying(false);

      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try {
          playerRef.current.pauseVideo();
        } catch (_) {}
      } else if (iframeFallbackRef.current?.contentWindow) {
        iframeFallbackRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
          '*'
        );
      }
    } else {
      userWantsPlayRef.current = true;
      setIsPlaying(true);

      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        try {
          playerRef.current.unMute();
          playerRef.current.setVolume(100);
          playerRef.current.playVideo();
        } catch (_) {}
      } else if (iframeFallbackRef.current?.contentWindow) {
        iframeFallbackRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
          '*'
        );
        iframeFallbackRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }),
          '*'
        );
        iframeFallbackRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
          '*'
        );
      }
    }
  };

  const handleFallbackLoad = () => {
    const win = iframeFallbackRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }), '*');
    win.postMessage(JSON.stringify({ event: 'command', func: 'unMute', args: [] }), '*');
    win.postMessage(JSON.stringify({ event: 'command', func: 'setVolume', args: [100] }), '*');
    if (userWantsPlayRef.current) {
      win.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
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

      {/* 공식 YouTube IFrame API 플레이어 마운트 래퍼 */}
      {!useFallback && (
        <div className="team-hidden-audio-wrap" aria-hidden="true">
          <div ref={mountRef} id="team-youtube-player-mount" />
        </div>
      )}

      {/* IFrame API 차단/실패 시 대체 iframe 폴백 */}
      {useFallback && videoId && (
        <div className="team-hidden-audio-wrap" aria-hidden="true">
          <iframe
            ref={iframeFallbackRef}
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&playsinline=1&rel=0&origin=${encodeURIComponent(window.location.origin)}`}
            title={`${teamName} 응원가`}
            className="team-hidden-audio-frame"
            allow="autoplay; encrypted-media"
            onLoad={handleFallbackLoad}
          />
        </div>
      )}
    </div>
  );
}


