import { useState, useRef, useEffect } from 'react'
import '../css/PenaltyKick.css'

const DIFFICULTIES = [
  { label: '하', key: 'easy',   hintMs: 3000, aiPredictRate: 0.35, color: '#2ecc71' },
  { label: '중', key: 'normal', hintMs: 2000, aiPredictRate: 0.60, color: '#f39c12' },
  { label: '상', key: 'hard',   hintMs: 1000, aiPredictRate: 0.85, color: '#e74c3c' },
]

const WIN = 3

const P = {
  INTRO:        'INTRO',
  PLAYER_AIM:   'PLAYER_AIM',
  PLAYER_RUNUP: 'PLAYER_RUNUP', // 대각선 도움닫기 러닝
  PLAYER_KICK:  'PLAYER_KICK',  // 임팩트 및 공 비행
  AI_COUNTDOWN: 'AI_COUNTDOWN', // 3, 2, 1 카운트다운
  AI_HINT:      'AI_HINT',      // AI 킥 & 빨간 원 점멸
  AI_RESOLVE:   'AI_RESOLVE',   // 결과 판정 및 골키퍼 다이빙
  ROUND_RESULT: 'ROUND_RESULT',
  GAME_OVER:    'GAME_OVER',
}

function rnd(a, b) { return a + Math.random() * (b - a) }

export default function PenaltyKick() {
  const [phase, setPhase]         = useState(P.INTRO)
  const [score, setScore]         = useState({ p: 0, ai: 0 })
  const [msg, setMsg]             = useState({ text: '', isGoal: false })
  const [winner, setWinner]       = useState(null)
  const [countdown, setCountdown] = useState(3)

  // 조준점 & 키커 도움닫기 방향 ('left' | 'right')
  const [hover, setHover]               = useState(null)
  const [kickerStance, setKickerStance] = useState('left')

  // 파워 게이지
  const [power, setPower]           = useState(0)
  const [isCharging, setIsCharging] = useState(false)
  const powerDirRef                 = useRef(1)
  const powerAnimRef                = useRef(null)
  const aimLockRef                  = useRef(null)

  // AI 힌트 점
  const [dot, setDot] = useState(null)

  // 골키퍼 위치 및 상태
  const [keeper, setKeeper]         = useState({ x: 50, y: 70 })
  const [keeperDive, setKeeperDive] = useState('')

  // 공 비행 상태
  const [ball, setBall] = useState({
    x: 50,
    y: 82,
    curveClass: '',
  })

  // 심판 휘슬
  const [whistle, setWhistle] = useState(false)

  const sceneRef    = useRef(null)
  const goalRef     = useRef(null)
  const timerRef    = useRef(null)
  const aiAimRef    = useRef(null)
  const diffRef     = useRef(DIFFICULTIES[1])
  const scoreRef    = useRef({ p: 0, ai: 0 })

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      cancelAnimationFrame(powerAnimRef.current)
    }
  }, [])

  // 파워 게이지 왕복 루프
  useEffect(() => {
    if (!isCharging) {
      cancelAnimationFrame(powerAnimRef.current)
      return
    }

    function loop() {
      setPower((prev) => {
        let next = prev + powerDirRef.current * 2.8
        if (next >= 100) {
          next = 100
          powerDirRef.current = -1
        } else if (next <= 0) {
          next = 0
          powerDirRef.current = 1
        }
        return next
      })
      powerAnimRef.current = requestAnimationFrame(loop)
    }

    powerAnimRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(powerAnimRef.current)
  }, [isCharging])

  function getGoalPct(e) {
    if (!goalRef.current) return { x: 50, y: 50 }
    const r = goalRef.current.getBoundingClientRect()
    return {
      x: Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100)),
      y: Math.max(2, Math.min(98, ((e.clientY - r.top) / r.height) * 100)),
    }
  }

  function goalToScene(gx, gy) {
    if (!goalRef.current || !sceneRef.current) return { x: 50, y: 22 }
    const gr = goalRef.current.getBoundingClientRect()
    const sr = sceneRef.current.getBoundingClientRect()
    return {
      x: ((gr.left - sr.left) + (gx / 100) * gr.width) / sr.width * 100,
      y: ((gr.top - sr.top) + (gy / 100) * gr.height) / sr.height * 100,
    }
  }

  // ─── 게임 시작 ───────────────────────────────────────────────
  function startGame(diff) {
    diffRef.current = diff
    const s = { p: 0, ai: 0 }
    scoreRef.current = s
    setScore(s)
    setWinner(null)
    resetField()
    setPhase(P.PLAYER_AIM)
  }

  function resetField() {
    clearTimeout(timerRef.current)
    cancelAnimationFrame(powerAnimRef.current)
    setMsg({ text: '', isGoal: false })
    setDot(null)
    setHover(null)
    setIsCharging(false)
    setPower(0)
    setKeeper({ x: 50, y: 70 })
    setKeeperDive('')
    setBall({ x: 50, y: 82, curveClass: '' })
    setWhistle(false)
  }

  // ─── 마우스 조준 이동 (키커 스탠스 연동) ────────────────────
  function handleGoalMouseMove(e) {
    if (phase !== P.PLAYER_AIM || isCharging) return
    const pt = getGoalPct(e)
    setHover(pt)
    // 조준 위치가 우측이면 키커는 좌측 뒤에서 도움닫기 준비 (대각선 각도)
    setKickerStance(pt.x >= 50 ? 'left' : 'right')
  }

  // ─── 마우스 누름 (MouseDown: 파워 차징 시작) ───────────────
  function handleGoalMouseDown(e) {
    if (phase !== P.PLAYER_AIM) return
    const pt = getGoalPct(e)
    aimLockRef.current = pt
    setHover(pt)
    setPower(0)
    powerDirRef.current = 1
    setIsCharging(true)
  }

  // ─── 마우스 뗌 (MouseUp: 슛 발사) ─────────────────────────
  function handleGoalMouseUp() {
    if (phase !== P.PLAYER_AIM || !isCharging) return
    setIsCharging(false)
    cancelAnimationFrame(powerAnimRef.current)

    const currentAim = aimLockRef.current || { x: 50, y: 50 }
    const currentPower = power

    executePlayerShoot(currentAim, currentPower)
  }

  // ─── 플레이어 슛 실행 ─────────────────────────────────────────
  function executePlayerShoot(aim, shotPower) {
    // 1단계: 대각선 도움닫기 러닝 (0.6초)
    setPhase(P.PLAYER_RUNUP)

    setTimeout(() => {
      // 2단계: 임팩트 및 슛 궤적 연출
      setPhase(P.PLAYER_KICK)

      const isOverPower = shotPower > 88 // 너무 세서 홈런/골대 맞음
      const isPerfect   = shotPower >= 65 && shotPower <= 88 // 완벽한 파워
      const isWeak      = shotPower < 65 // 약한 파워

      // 구석 모서리 판정 (가로 끝 20% 이내, 세로 25% 이내)
      const isCorner = (aim.x < 22 || aim.x > 78) && (aim.y < 30 || aim.y > 70)

      // AI 골키퍼 난이도별 예측
      const predictRate = diffRef.current.aiPredictRate
      const aiPredicted = Math.random() < predictRate

      let kx = 50
      let ky = 70
      let saved = false
      let hitPost = false

      if (isOverPower) {
        // 홈런 또는 크로스바 강타 (실축)
        hitPost = true
        saved = false
        // 공이 골대 위로 솟구침
        aim = { x: aim.x + rnd(-8, 8), y: -15 }
        kx = aim.x < 50 ? 30 : 70
        ky = 30
      } else if (aiPredicted) {
        // AI가 방향을 읽음!
        kx = aim.x + rnd(-6, 6)
        ky = aim.y + rnd(-5, 5)

        if (isPerfect && isCorner) {
          // 완벽한 파워로 구석을 찌른 경우: 골키퍼가 읽어도 손끝 스치며 GOAL!
          saved = false
        } else if (isWeak) {
          // 약한 슛이면 방향 맞췄을 때 100% 선방
          saved = true
        } else {
          // 적당한 파워: 구석이 아니면 대부분 선방
          saved = !isCorner || Math.random() < 0.75
        }
      } else {
        // AI가 역동작에 걸림 (반대편으로 뜀)
        kx = aim.x > 50 ? rnd(15, 35) : rnd(65, 85)
        ky = rnd(30, 80)
        saved = false
      }

      setKeeper({ x: kx, y: ky })
      setKeeperDive(kx < 40 ? 'left' : kx > 60 ? 'right' : 'center')

      // 공 포물선 궤적
      const curve = aim.x < 45 ? 'pk__ball--arc-left' : aim.x > 55 ? 'pk__ball--arc-right' : 'pk__ball--arc-center'
      const t = goalToScene(aim.x, aim.y)

      setBall({
        x: t.x,
        y: t.y,
        curveClass: curve,
      })

      // 3단계: 판정 메시지
      setTimeout(() => {
        let msgText = ''
        let isGoal = false

        if (hitPost) {
          msgText = '🚀 홈런 실축! 골대 위로 벗어남!'
          isGoal = false
        } else if (saved) {
          msgText = isWeak ? '🧤 파워 부족! 골키퍼 정면 선방!' : '🧤 AI 골키퍼 슈퍼세이브에 막힘!'
          isGoal = false
        } else {
          msgText = isPerfect && isCorner ? '🔥 완벽한 궤적의 원더골 GOAL!!' : '⚽ GOAL! 득점 성공!'
          isGoal = true
        }

        const next = isGoal
          ? { ...scoreRef.current, p: scoreRef.current.p + 1 }
          : { ...scoreRef.current }
        scoreRef.current = next
        setScore(next)
        setMsg({ text: msgText, isGoal })
        setPhase(P.ROUND_RESULT)

        setTimeout(() => checkNextTurn(next, 'player'), 1300)
      }, 950)
    }, 600)
  }

  // ─── AI 턴 준비 (3, 2, 1 카운트다운) ──────────────────────
  function startAiTurn(s) {
    resetField()
    setPhase(P.AI_COUNTDOWN)
    setCountdown(3)
    setWhistle(true)

    let count = 3
    const interval = setInterval(() => {
      count -= 1
      if (count > 0) {
        setCountdown(count)
      } else {
        clearInterval(interval)
        setWhistle(false)
        launchAiKick(s)
      }
    }, 700)
  }

  // ─── AI 킥 발사 & 빨간 점 노출 ───────────────────────────
  function launchAiKick(s) {
    const aim = { x: rnd(15, 85), y: rnd(18, 78) }
    aiAimRef.current = aim
    setDot(aim)
    setPhase(P.AI_HINT)

    timerRef.current = setTimeout(() => {
      setDot(null)
      resolveAiKick(null, aim, s, false)
    }, diffRef.current?.hintMs ?? 2000)
  }

  // ─── 플레이어 선방 클릭 ──────────────────────────────────
  function handlePlayerSave(click, directHit = false) {
    clearTimeout(timerRef.current)
    setDot(null)
    const aim = aiAimRef.current
    if (!aim) return

    const dx = Math.abs(click.x - aim.x)
    const dy = Math.abs(click.y - aim.y)
    const saved = directHit || (dx <= 25 && dy <= 35)

    resolveAiKick(click, aim, null, saved)
  }

  // ─── AI 킥 결과 처리 ─────────────────────────────────────
  function resolveAiKick(click, aim, scoreOverride, saved) {
    setPhase(P.AI_RESOLVE)

    if (click) {
      setKeeper(click)
      setKeeperDive(click.x < 45 ? 'left' : click.x > 55 ? 'right' : 'center')
    }

    const t = goalToScene(aim.x, aim.y)
    const curve = aim.x < 45 ? 'pk__ball--arc-left' : aim.x > 55 ? 'pk__ball--arc-right' : 'pk__ball--arc-center'
    setBall({
      x: t.x,
      y: t.y,
      curveClass: curve,
    })

    const base = scoreOverride ?? scoreRef.current
    const next = saved ? base : { ...base, ai: base.ai + 1 }
    scoreRef.current = next
    setScore(next)
    setMsg({ text: saved ? '🧤 슈퍼세이브 선방 성공!' : '⚽ AI 득점 허용...', isGoal: !saved })

    setTimeout(() => {
      setPhase(P.ROUND_RESULT)
      setTimeout(() => checkNextTurn(next, 'ai'), 1300)
    }, 950)
  }

  function checkNextTurn(s, lastTurn) {
    if (s.p >= WIN || s.ai >= WIN) {
      setWinner(s.p >= WIN ? 'player' : 'ai')
      setPhase(P.GAME_OVER)
      return
    }

    if (lastTurn === 'player') {
      startAiTurn(s)
    } else {
      resetField()
      setPhase(P.PLAYER_AIM)
    }
  }

  function restartGame() {
    clearTimeout(timerRef.current)
    cancelAnimationFrame(powerAnimRef.current)
    setPhase(P.INTRO)
    setWinner(null)
    setScore({ p: 0, ai: 0 })
    scoreRef.current = { p: 0, ai: 0 }
    setMsg({ text: '', isGoal: false })
  }

  const isAiming     = phase === P.PLAYER_AIM
  const isAiHint     = phase === P.AI_HINT
  const isCountdown  = phase === P.AI_COUNTDOWN
  const isPlaying    = phase !== P.INTRO && phase !== P.GAME_OVER
  const isPlayerTurn = phase === P.PLAYER_AIM || phase === P.PLAYER_RUNUP || phase === P.PLAYER_KICK

  const ballStyle = {
    left: `${ball.x}%`,
    top:  `${ball.y}%`,
  }

  return (
    <main className="pk" onMouseUp={handleGoalMouseUp}>
      {/* 상단 스코어보드 */}
      <header className="pk__topbar">
        <a className="pk__back" href="/plug/minigames">← 미니게임</a>
        <h1 className="pk__title">⚽ 승부차기 패널티킥</h1>
        {isPlaying && (
          <div className="pk__score">
            <span className="pk__score-team">YOU</span>
            <strong className="pk__score-num">{score.p}</strong>
            <span className="pk__score-sep">:</span>
            <strong className="pk__score-num">{score.ai}</strong>
            <span className="pk__score-team">AI</span>
          </div>
        )}
      </header>

      {/* 난이도 선택 */}
      {phase === P.INTRO && (
        <div className="pk__intro">
          <div className="pk__intro-badge">PENALTY SHOOTOUT</div>
          <h2 className="pk__intro-heading">실력 기반 승부차기 1:1</h2>
          <p className="pk__intro-desc">
            3골을 먼저 득점하면 승리합니다!<br />
            <strong>[슛하는 법]</strong> 골대를 클릭한 채로 <strong>초록색 파워(적정 힘)</strong>에 맞춰 떼세요!<br />
            (너무 세면 홈런, 너무 약하면 AI 골키퍼에게 잡힙니다)<br />
            <strong>[막는 법]</strong> 3, 2, 1 카운트 후 뜨는 <span className="pk__intro-dot">●</span> 힌트 점을 찰나에 클릭!
          </p>
          <div className="pk__diff-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                className="pk__diff-btn"
                style={{ '--dc': d.color }}
                onClick={() => startGame(d)}
              >
                <span className="pk__diff-lv">{d.label}</span>
                <span className="pk__diff-time">{d.hintMs / 1000}초 선방 / AI {Math.round(d.aiPredictRate * 100)}% 예측</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 게임 종료 */}
      {phase === P.GAME_OVER && (
        <div className="pk__over">
          <div className={`pk__over-badge pk__over-badge--${winner === 'player' ? 'win' : 'lose'}`}>
            {winner === 'player' ? '🏆 VICTORY!' : '😞 DEFEAT'}
          </div>
          <p className="pk__over-desc">
            {winner === 'player' ? '치열한 승부 끝에 AI를 꺾고 승리했습니다!' : '아쉽습니다! AI 골키퍼의 벽을 넘지 못했습니다.'}
          </p>
          <div className="pk__over-score">{score.p} : {score.ai}</div>
          <div className="pk__over-btns">
            <button className="pk__over-btn pk__over-btn--retry" onClick={restartGame}>다시 대결하기</button>
            <a className="pk__over-btn pk__over-btn--home" href="/plug/minigames">미니게임 목록</a>
          </div>
        </div>
      )}

      {/* 와이드 축구 경기장 씬 */}
      {isPlaying && (
        <div className="pk__stadium" ref={sceneRef}>
          {/* 관중석 및 조명 */}
          <div className="pk__crowd" aria-hidden="true">
            <div className="pk__stadium-light pk__stadium-light--left" />
            <div className="pk__stadium-light pk__stadium-light--right" />
            <div className="pk__crowd-stand" />
            <div className="pk__ad-boards">
              <span>PREMIER LEAGUE</span>
              <span>PL:UG FOOTBALL</span>
              <span>BUILDUP STADIUM</span>
              <span>PREMIER LEAGUE</span>
            </div>
          </div>

          {/* 잔디 피치 */}
          <div className="pk__pitch-ground" aria-hidden="true">
            <div className="pk__grass-stripes" />
            <div className="pk__pitch-lines">
              <div className="pk__penalty-box" />
              <div className="pk__goal-area" />
              <div className="pk__penalty-spot" />
              <div className="pk__penalty-arc" />
            </div>
          </div>

          {/* 심판 */}
          <div className={`pk__referee ${whistle ? 'pk__referee--whistle' : ''}`} aria-hidden="true">
            <div className="pk__referee-head" />
            <div className="pk__referee-body" />
            <div className="pk__referee-arm" />
            <div className="pk__referee-legs" />
            {whistle && <div className="pk__referee-sound">삐-익!!</div>}
          </div>

          {/* 골대 */}
          <div className="pk__goal-frame">
            <div className="pk__goal-net" aria-hidden="true" />

            {/* 골대 내부 조준 및 클릭 영역 */}
            <div
              ref={goalRef}
              className={[
                'pk__goal-target',
                isAiming ? 'pk__goal-target--aim' : '',
                isAiHint ? 'pk__goal-target--defend' : '',
              ].filter(Boolean).join(' ')}
              onMouseMove={handleGoalMouseMove}
              onMouseDown={handleGoalMouseDown}
              onClick={isAiHint ? (e) => handlePlayerSave(getGoalPct(e)) : undefined}
            >
              {/* 조준 크로스헤어 */}
              {hover && isAiming && (
                <div
                  className="pk__crosshair"
                  style={{ left: `${hover.x}%`, top: `${hover.y}%` }}
                />
              )}

              {/* AI 힌트 점 */}
              {dot && (
                <div
                  className="pk__hint-dot"
                  style={{
                    left: `${dot.x}%`,
                    top:  `${dot.y}%`,
                    animationDuration: `${diffRef.current?.hintMs ?? 2000}ms`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayerSave(dot, true)
                  }}
                  role="button"
                  aria-label="선방하기"
                />
              )}

              {/* 골키퍼 */}
              <div
                className={`pk__goalkeeper ${keeperDive ? `pk__goalkeeper--dive-${keeperDive}` : 'pk__goalkeeper--ready'}`}
                style={{
                  left: `${keeper.x}%`,
                  top:  `${keeper.y}%`,
                }}
                aria-hidden="true"
              >
                <div className="pk__gk-gloves pk__gk-gloves--left" />
                <div className="pk__gk-gloves pk__gk-gloves--right" />
                <div className="pk__gk-head" />
                <div className="pk__gk-body" />
                <div className="pk__gk-legs">
                  <div className="pk__gk-leg pk__gk-leg--l" />
                  <div className="pk__gk-leg pk__gk-leg--r" />
                </div>
              </div>
            </div>

            <div className="pk__post-bar pk__post-bar--top" />
            <div className="pk__post-bar pk__post-bar--left" />
            <div className="pk__post-bar pk__post-bar--right" />
          </div>

          {/* 축구공 */}
          <div
            className={`pk__soccer-ball ${ball.curveClass}`}
            style={ballStyle}
            aria-hidden="true"
          >
            <div className="pk__ball-pattern" />
          </div>

          {/* 키커 (조준 방향에 따른 대각선 스탠스 & 도움닫기 러닝 슛) */}
          {isPlayerTurn && (
            <div
              className={[
                'pk__kicker',
                `pk__kicker--stance-${kickerStance}`,
                phase === P.PLAYER_RUNUP ? 'pk__kicker--runup' : '',
                phase === P.PLAYER_KICK  ? 'pk__kicker--kick'  : '',
              ].filter(Boolean).join(' ')}
              aria-hidden="true"
            >
              <div className="pk__kicker-head" />
              <div className="pk__kicker-jersey">
                <span className="pk__kicker-num">10</span>
              </div>
              <div className="pk__kicker-shorts" />
              <div className="pk__kicker-legs">
                <div className="pk__kicker-leg pk__kicker-leg--support" />
                <div className="pk__kicker-leg pk__kicker-leg--kick" />
              </div>
            </div>
          )}

          {/* 파워 게이지 바 (마우스 누르는 동안 노출) */}
          {isCharging && (
            <div className="pk__power-meter">
              <div className="pk__power-label">
                <span>POWER GAUGE</span>
                <span className={power > 88 ? 'pk__power-txt--over' : power >= 65 ? 'pk__power-txt--perfect' : ''}>
                  {power > 88 ? 'OVER!' : power >= 65 ? 'PERFECT!' : `${Math.round(power)}%`}
                </span>
              </div>
              <div className="pk__power-track">
                <div
                  className={`pk__power-fill ${power > 88 ? 'pk__power-fill--over' : power >= 65 ? 'pk__power-fill--perfect' : 'pk__power-fill--normal'}`}
                  style={{ width: `${power}%` }}
                />
                <div className="pk__power-sweetspot" title="Perfect Zone" />
              </div>
              <div className="pk__power-hint">초록색 구간에서 마우스를 떼세요!</div>
            </div>
          )}

          {/* AI 턴 3, 2, 1 카운트다운 */}
          {isCountdown && (
            <div className="pk__countdown-overlay">
              <div className="pk__countdown-title">AI SHOOT INCOMING!</div>
              <div className="pk__countdown-number" key={countdown}>
                {countdown}
              </div>
              <div className="pk__countdown-sub">골대를 주시하고 점을 막아내세요!</div>
            </div>
          )}

          {/* 판정 배너 */}
          {msg.text && (
            <div
              key={phase + msg.text}
              className={`pk__round-banner pk__round-banner--${msg.isGoal ? 'goal' : 'save'}`}
            >
              {msg.text}
            </div>
          )}

          {/* 하단 상태 가이드 */}
          <div className="pk__status-bar">
            {isAiming && !isCharging && '🖱️ 원하는 코스를 [클릭한 채로 유지]하여 파워 게이지를 모으세요!'}
            {isCharging && '⚡ 초록색 PERFECT 구간에 마우스를 떼어 슛을 날리세요!'}
            {phase === P.PLAYER_RUNUP && '🏃 키커가 도움닫기 전진 후 슛을 날립니다!'}
            {isCountdown && '⚠️ 집중하세요! 3초 후 AI가 강력한 슛을 날립니다!'}
            {isAiHint && '🧤 지금이다! 빨간 점을 클릭해 선방하세요!'}
            {phase === P.ROUND_RESULT && '라운드 종료'}
          </div>
        </div>
      )}
    </main>
  )
}
