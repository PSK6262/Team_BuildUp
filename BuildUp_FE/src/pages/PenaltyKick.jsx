import { useState, useRef } from 'react'
import '../css/PenaltyKick.css'

const DIFFICULTIES = [
  { label: '하', key: 'easy',   hintMs: 1000, color: '#2ecc71' },
  { label: '중', key: 'normal', hintMs: 500,  color: '#f39c12' },
  { label: '상', key: 'hard',   hintMs: 250,  color: '#e74c3c' },
]

const WIN = 3
const HIT_R = 13   // % 반경 — 이 안에 클릭하면 선방

const P = {
  INTRO:        'INTRO',
  PLAYER_AIM:   'PLAYER_AIM',
  PLAYER_KICK:  'PLAYER_KICK',
  AI_HINT:      'AI_HINT',
  AI_RESOLVE:   'AI_RESOLVE',
  ROUND_RESULT: 'ROUND_RESULT',
  GAME_OVER:    'GAME_OVER',
}

function rnd(a, b) { return a + Math.random() * (b - a) }
function dist(x1, y1, x2, y2) { return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) }

export default function PenaltyKick() {
  const [phase, setPhase]   = useState(P.INTRO)
  const [score, setScore]   = useState({ p: 0, ai: 0 })
  const [msg, setMsg]       = useState({ text: '', isGoal: false })
  const [winner, setWinner] = useState(null)

  // 골대 호버 크로스헤어
  const [hover, setHover] = useState(null)   // { x, y } % within goal-inside

  // AI 킥 힌트 점
  const [dot, setDot] = useState(null)       // { x, y } % within goal-inside

  // 골키퍼 (goal-inside 내부 % 위치)
  const [keeper, setKeeper]         = useState({ x: 50, y: 65 })
  const [keeperAnim, setKeeperAnim] = useState(false)

  // 공: x/y = scene % 기준
  const [ball, setBall] = useState({ x: 50, y: 74, scale: 1, tr: false })

  const sceneRef = useRef(null)
  const goalRef  = useRef(null)
  const hintRef  = useRef(null)
  const aiAimRef = useRef(null)
  const diffRef  = useRef(null)
  const scoreRef = useRef({ p: 0, ai: 0 })

  // ─── 좌표 변환 헬퍼 ─────────────────────────────────────────
  function getGoalPct(e) {
    const r = goalRef.current.getBoundingClientRect()
    return {
      x: Math.max(3, Math.min(97, (e.clientX - r.left) / r.width  * 100)),
      y: Math.max(3, Math.min(97, (e.clientY - r.top)  / r.height * 100)),
    }
  }

  // goal-inside 내 % → scene 전체 % 변환 (공 비행 target 계산용)
  function goalToScene(gx, gy) {
    if (!goalRef.current || !sceneRef.current) return { x: 50, y: 20 }
    const gr = goalRef.current.getBoundingClientRect()
    const sr = sceneRef.current.getBoundingClientRect()
    return {
      x: ((gr.left - sr.left) + gx / 100 * gr.width)  / sr.width  * 100,
      y: ((gr.top  - sr.top)  + gy / 100 * gr.height) / sr.height * 100,
    }
  }

  // ─── 게임 시작 ───────────────────────────────────────────────
  function startGame(diff) {
    diffRef.current = diff
    const s = { p: 0, ai: 0 }
    scoreRef.current = s
    setScore(s)
    setWinner(null)
    clearRound()
    setPhase(P.PLAYER_AIM)
  }

  function clearRound() {
    clearTimeout(hintRef.current)
    setMsg({ text: '', isGoal: false })
    setDot(null)
    setHover(null)
    setKeeper({ x: 50, y: 65 })
    setKeeperAnim(false)
    setBall({ x: 50, y: 74, scale: 1, tr: false })
  }

  // ─── 골대 클릭 핸들러 ─────────────────────────────────────────
  function onGoalClick(e) {
    if (phase === P.PLAYER_AIM) doPlayerShoot(getGoalPct(e))
    else if (phase === P.AI_HINT) doPlayerSave(getGoalPct(e))
  }

  // ─── 플레이어 슛 ─────────────────────────────────────────────
  function doPlayerShoot(aim) {
    // AI 골키퍼 랜덤 다이빙
    const kx = rnd(10, 90)
    const ky = rnd(15, 85)
    const saved = dist(aim.x, aim.y, kx, ky) < 22

    setHover(null)
    setPhase(P.PLAYER_KICK)
    setKeeper({ x: kx, y: ky })
    setKeeperAnim(true)

    // 공이 goal aim 위치로 날아감
    const t = goalToScene(aim.x, aim.y)
    setBall({ x: t.x, y: t.y, scale: 0.26, tr: true })

    setTimeout(() => {
      setKeeperAnim(false)
      const goal = !saved
      const next = goal
        ? { ...scoreRef.current, p: scoreRef.current.p + 1 }
        : { ...scoreRef.current }
      scoreRef.current = next
      setScore(next)
      setMsg({ text: goal ? '⚽ 골!' : '🧤 막혔다!', isGoal: goal })
      setPhase(P.ROUND_RESULT)
      setTimeout(() => advanceFrom(next, 'player'), 1100)
    }, 950)
  }

  // ─── AI 킥 시작 ──────────────────────────────────────────────
  function doAiKick(s) {
    clearRound()
    const aim = { x: rnd(10, 90), y: rnd(10, 85) }
    aiAimRef.current = aim
    setDot(aim)
    setPhase(P.AI_HINT)

    hintRef.current = setTimeout(() => {
      setDot(null)
      resolveAiKick(null, aim, s, false)
    }, diffRef.current?.hintMs ?? 500)
  }

  // ─── 플레이어 선방 클릭 ───────────────────────────────────────
  function doPlayerSave(click) {
    clearTimeout(hintRef.current)
    setDot(null)
    const aim = aiAimRef.current
    const saved = dist(click.x, click.y, aim.x, aim.y) < HIT_R
    resolveAiKick(click, aim, null, saved)
  }

  // ─── AI 킥 결과 처리 ─────────────────────────────────────────
  function resolveAiKick(click, aim, scoreOverride, saved) {
    // 골키퍼가 클릭한 위치로 다이빙
    if (click) {
      setKeeper(click)
      setKeeperAnim(true)
    }

    // 공 — AI aim 위치로 날아가는 애니메이션 적용
    const t = goalToScene(aim.x, aim.y)
    setBall({ x: t.x, y: t.y, scale: 0.28, tr: true })

    setPhase(P.AI_RESOLVE)
    const base = scoreOverride ?? scoreRef.current
    const next = saved ? base : { ...base, ai: base.ai + 1 }
    scoreRef.current = next
    setScore(next)
    setMsg({ text: saved ? '🧤 선방!' : '⚽ AI 득점!', isGoal: !saved })

    setTimeout(() => {
      setKeeperAnim(false)
      setPhase(P.ROUND_RESULT)
      setTimeout(() => advanceFrom(next, 'ai'), 1100)
    }, 950)
  }

  // ─── 다음 단계 분기 ──────────────────────────────────────────
  function advanceFrom(s, lastTurn) {
    if (s.p >= WIN || s.ai >= WIN) {
      setWinner(s.p >= WIN ? 'player' : 'ai')
      setPhase(P.GAME_OVER)
      return
    }
    if (lastTurn === 'player') {
      doAiKick(s)
    } else {
      clearRound()
      setPhase(P.PLAYER_AIM)
    }
  }

  // ─── 재시작 ──────────────────────────────────────────────────
  function restart() {
    clearTimeout(hintRef.current)
    setPhase(P.INTRO)
    setWinner(null)
    setScore({ p: 0, ai: 0 })
    scoreRef.current = { p: 0, ai: 0 }
    setMsg({ text: '', isGoal: false })
  }

  // ─── 파생 플래그 ─────────────────────────────────────────────
  const isAiming  = phase === P.PLAYER_AIM
  const isAiHint  = phase === P.AI_HINT
  const isKicking = phase === P.PLAYER_KICK
  const isKeeping = isAiHint || phase === P.AI_RESOLVE
  const isPlaying = phase !== P.INTRO && phase !== P.GAME_OVER

  const ballStyle = {
    left:      `${ball.x}%`,
    top:       `${ball.y}%`,
    transform: `translate(-50%, -50%) scale(${ball.scale})`,
    transition: ball.tr
      ? 'left 0.72s ease-in, top 0.72s ease-in, transform 0.72s ease-in'
      : 'none',
  }

  return (
    <main className="pk">
      {/* ── 상단 바 ── */}
      <div className="pk__topbar">
        <a className="pk__back" href="/plug/minigames">← 미니게임</a>
        <h1 className="pk__title">⚽ 패널티킥</h1>
        {isPlaying && (
          <div className="pk__score">
            <span>나</span>
            <strong>{score.p}</strong>
            <span className="pk__score-sep">:</span>
            <strong>{score.ai}</strong>
            <span>AI</span>
          </div>
        )}
      </div>

      {/* ── 난이도 선택 ── */}
      {phase === P.INTRO && (
        <div className="pk__intro">
          <p className="pk__intro-desc">
            3골을 먼저 넣으면 승리!<br />
            AI 킥 시 골대에 뜨는{' '}
            <span className="pk__intro-dot">●</span>{' '}
            빨간 점을 클릭해서 막으세요.
          </p>
          <p className="pk__intro-sub">난이도 선택</p>
          <div className="pk__diff-row">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                className="pk__diff-btn"
                style={{ '--dc': d.color }}
                onClick={() => startGame(d)}
              >
                <span className="pk__diff-lv">{d.label}</span>
                <span className="pk__diff-time">{d.hintMs / 1000}초</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 게임 종료 ── */}
      {phase === P.GAME_OVER && (
        <div className="pk__over">
          <div className={`pk__over-badge pk__over-badge--${winner === 'player' ? 'win' : 'lose'}`}>
            {winner === 'player' ? '🏆 승리!' : '😞 패배...'}
          </div>
          <div className="pk__over-score">{score.p} : {score.ai}</div>
          <div className="pk__over-btns">
            <button className="pk__over-btn pk__over-btn--retry" onClick={restart}>
              다시하기
            </button>
            <a className="pk__over-btn pk__over-btn--home" href="/plug/minigames">
              목록으로
            </a>
          </div>
        </div>
      )}

      {/* ── 게임 씬 ── */}
      {isPlaying && (
        <div className="pk__scene" ref={sceneRef}>

          {/* 배경: 하늘 + 필드 */}
          <div className="pk__sky" aria-hidden="true" />
          <div className="pk__ground" aria-hidden="true" />

          {/* 피치 원근선 (SVG) */}
          <svg
            className="pk__pitch"
            viewBox="0 0 560 510"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* 소실점 방사선 */}
            <line x1="280" y1="38"  x2="0"   y2="510" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <line x1="280" y1="38"  x2="560" y2="510" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5"/>
            <line x1="280" y1="38"  x2="140" y2="510" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            <line x1="280" y1="38"  x2="420" y2="510" stroke="rgba(255,255,255,0.04)" strokeWidth="1"/>
            {/* 수평 원근선 */}
            <line x1="152" y1="152" x2="408" y2="152" stroke="rgba(255,255,255,0.1)"  strokeWidth="1"/>
            <line x1="62"  y1="268" x2="498" y2="268" stroke="rgba(255,255,255,0.1)"  strokeWidth="1"/>
            <line x1="0"   y1="390" x2="560" y2="390" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
            {/* 페널티 에어리어 */}
            <line x1="172" y1="78"  x2="388" y2="78"  stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
            <line x1="172" y1="78"  x2="138" y2="190" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
            <line x1="388" y1="78"  x2="422" y2="190" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
            <line x1="138" y1="190" x2="422" y2="190" stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
            {/* 페널티 스팟 */}
            <circle cx="280" cy="128" r="4.5" fill="rgba(255,255,255,0.3)"/>
            {/* 페널티 아크 */}
            <path d="M 208 190 Q 280 250 352 190" fill="none"
              stroke="rgba(255,255,255,0.22)" strokeWidth="1.5"/>
          </svg>

          {/* ── 골대 ── */}
          <div className="pk__goal-wrap">
            {/* 그물 배경 */}
            <div className="pk__net" aria-hidden="true">
              <svg width="100%" height="100%" preserveAspectRatio="none">
                {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
                  <line key={`v${i}`}
                    x1={`${i * 10}%`} y1="0"
                    x2={`${i * 10}%`} y2="100%"
                    stroke="rgba(210,210,210,0.2)" strokeWidth="0.7"/>
                ))}
                {[0,1,2,3,4,5,6].map(i => (
                  <line key={`h${i}`}
                    x1="0" y1={`${i * 16.6}%`}
                    x2="100%" y2={`${i * 16.6}%`}
                    stroke="rgba(210,210,210,0.2)" strokeWidth="0.7"/>
                ))}
              </svg>
            </div>

            {/* 클릭 가능한 골대 내부 */}
            <div
              ref={goalRef}
              className={[
                'pk__goal-inside',
                isAiming ? 'pk__goal-inside--aim' : '',
                isAiHint ? 'pk__goal-inside--defend' : '',
              ].filter(Boolean).join(' ')}
              onClick={isAiming || isAiHint ? onGoalClick : undefined}
              onMouseMove={isAiming ? (e) => setHover(getGoalPct(e)) : undefined}
              onMouseLeave={isAiming ? () => setHover(null) : undefined}
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
                  className="pk__dot"
                  style={{
                    left: `${dot.x}%`,
                    top:  `${dot.y}%`,
                    animationDuration: `${diffRef.current?.hintMs ?? 500}ms`,
                  }}
                />
              )}

              {/* 골키퍼 (골대 안 작은 캐릭터) */}
              <div
                className="pk__keeper"
                style={{
                  left: `${keeper.x}%`,
                  top:  `${keeper.y}%`,
                  transition: keeperAnim
                    ? 'left 0.42s ease-out, top 0.42s ease-out'
                    : 'none',
                }}
                aria-hidden="true"
              >
                <div className="pk__keeper-head" />
                <div className="pk__keeper-body" />
              </div>
            </div>

            {/* 골대 기둥 */}
            <div className="pk__post pk__post--left"     aria-hidden="true" />
            <div className="pk__post pk__post--right"    aria-hidden="true" />
            <div className="pk__post pk__post--crossbar" aria-hidden="true" />
          </div>

          {/* ── 공 ── */}
          <div className="pk__ball" style={ballStyle} aria-hidden="true" />

          {/* ── 선수 (등 뒤 시점) ── */}
          <div
            className={[
              'pk__player',
              isKicking ? 'pk__player--kick'   : '',
              isKeeping ? 'pk__player--keeper' : '',
            ].filter(Boolean).join(' ')}
            aria-hidden="true"
          >
            <div className="pk__pl-head" />
            <div className="pk__pl-neck" />
            <div className="pk__pl-shoulders" />
            <div className="pk__pl-jersey" />
            <div className="pk__pl-shorts" />
            <div className="pk__pl-legs">
              <div className="pk__pl-leg pk__pl-leg--l" />
              <div className="pk__pl-leg pk__pl-leg--r" />
            </div>
          </div>

          {/* ── 라운드 메시지 ── */}
          {msg.text && (
            <div
              key={phase + msg.text}
              className={`pk__msg pk__msg--${msg.isGoal ? 'goal' : 'save'}`}
            >
              {msg.text}
            </div>
          )}

          {/* ── 안내 바 ── */}
          {(isAiming || isAiHint) && (
            <div className={`pk__bar${isAiHint ? ' pk__bar--urgent' : ''}`}>
              {isAiming && '골대 안을 클릭해서 슛!'}
              {isAiHint && '⚡ 빨간 점을 클릭해서 막아라!'}
            </div>
          )}
        </div>
      )}
    </main>
  )
}
