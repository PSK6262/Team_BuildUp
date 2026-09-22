import { useState, useRef, useEffect } from 'react'
import '../css/PenaltyKick.css'

const DIFFICULTIES = [
  { label: '하', key: 'easy',   hintMs: 3000, cursorMs: 2400, saveX: 12, saveY: 17, color: '#2ecc71' },
  { label: '중', key: 'normal', hintMs: 2000, cursorMs: 1700, saveX: 8, saveY: 12, color: '#f39c12' },
  { label: '상', key: 'hard',   hintMs: 1000, cursorMs: 1100, saveX: 5, saveY: 8, color: '#e74c3c' },
]

const WIN = 3
const SHOT_LIMIT_MS = 5000
const SAVE_REBOUND_DELAY_MS = 1020
const SHOT_RESULT_DELAY_MS = 1600
const CROWD_COLORS = ['#ef4444', '#2563eb', '#facc15', '#f8fafc', '#16a34a', '#f97316', '#a855f7']
const CROWD = Array.from({ length: 56 }, (_, index) => ({
  color: CROWD_COLORS[index % CROWD_COLORS.length],
  delay: `${(index % 8) * -0.11}s`,
}))
const RARE_EVENTS = [
  { key: 'mosquito', label: '모기 난입', phase: 'meter', rate: 0.012, chanceMultiplier: 0.85, cursorJitter: 4 },
  { key: 'fake-whistle', label: '관중의 가짜 휘슬', phase: 'meter', rate: 0.008, chanceMultiplier: 0.8, speedMultiplier: 1.4 },
  { key: 'camera-flash', label: '카메라 플래시', phase: 'meter', rate: 0.006, chanceMultiplier: 0.9 },
  { key: 'rain', label: '갑작스러운 빗방울', phase: 'meter', rate: 0.009, chanceMultiplier: 0.88, speedMultiplier: 1.12 },
  { key: 'scoreboard-glitch', label: '전광판 오류', phase: 'meter', rate: 0.005, chanceMultiplier: 0.78 },
  { key: 'bird', label: '버드 스트라이크', phase: 'shot', rate: 0.01, chanceMultiplier: 0, forcedMissType: 'wide' },
  { key: 'wind', label: '갑작스러운 돌풍', phase: 'shot', rate: 0.022, chanceMultiplier: 0.7 },
  { key: 'sprinkler', label: '스프링클러 오작동', phase: 'shot', rate: 0.01, chanceMultiplier: 0, forcedMissType: 'wide' },
  { key: 'beach-ball', label: '비치볼 난입', phase: 'shot', rate: 0.012, chanceMultiplier: 0, forcedMissType: 'post' },
  { key: 'blackout', label: '조명 깜빡임', phase: 'shot', rate: 0.0085, chanceMultiplier: 0.55 },
]

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

function pickRareEvent(phase) {
  const roll = Math.random()
  let accumulatedRate = 0

  for (const event of RARE_EVENTS.filter((item) => item.phase === phase)) {
    accumulatedRate += event.rate
    if (roll < accumulatedRate) return event
  }

  return null
}

export default function PenaltyKick() {
  const [phase, setPhase]         = useState(P.INTRO)
  const [score, setScore]         = useState({ p: 0, ai: 0 })
  const [msg, setMsg]             = useState({ text: '', isGoal: false })
  const [winner, setWinner]       = useState(null)
  const [countdown, setCountdown] = useState(3)
  const [difficulty, setDifficulty] = useState(DIFFICULTIES[1])
  const [rareEvent, setRareEvent] = useState(null)

  // 조준점 & 키커 도움닫기 방향 ('left' | 'right')
  const [hover, setHover]               = useState(null)
  const [kickerStance, setKickerStance] = useState('left')

  // 5초 타이밍 게이지
  const [meterPosition, setMeterPosition] = useState(0)
  const [shotTimeLeft, setShotTimeLeft]   = useState(5)
  const [isMeterActive, setIsMeterActive] = useState(false)
  const meterPositionRef                  = useRef(0)
  const meterStartedAtRef                 = useRef(0)
  const meterElapsedRef                   = useRef(0)
  const meterActiveRef                    = useRef(false)
  const meterAnimRef                      = useRef(null)
  const shotTimeoutRef                    = useRef(null)
  const aimLockRef                        = useRef(null)

  // AI 힌트 점
  const [dot, setDot] = useState(null)

  // 골키퍼 위치 및 상태
  const [keeper, setKeeper]         = useState({ x: 50, y: 70 })
  const [keeperDive, setKeeperDive] = useState('')

  // 공 비행 상태
  const [ball, setBall] = useState({
    x: 50,
    y: 82,
    startX: 50,
    startY: 82,
    curveClass: '',
    outcomeClass: '',
  })

  // 심판 휘슬
  const [whistle, setWhistle] = useState(false)

  const sceneRef    = useRef(null)
  const goalRef     = useRef(null)
  const timerRef    = useRef(null)
  const aiAimRef    = useRef(null)
  const diffRef     = useRef(DIFFICULTIES[1])
  const scoreRef    = useRef({ p: 0, ai: 0 })
  const rareEventRef = useRef(null)

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current)
      clearTimeout(shotTimeoutRef.current)
      cancelAnimationFrame(meterAnimRef.current)
    }
  }, [])

  // 실제 경과 시간을 기준으로 커서를 일정한 속도로 왕복시킨다.
  useEffect(() => {
    if (!isMeterActive) {
      cancelAnimationFrame(meterAnimRef.current)
      return
    }

    function moveCursor(now) {
      const elapsed = now - meterStartedAtRef.current
      meterElapsedRef.current = elapsed
      const event = rareEventRef.current
      const cursorMs = diffRef.current.cursorMs / (event?.speedMultiplier ?? 1)
      const cycle = (elapsed % cursorMs) / cursorMs
      const basePosition = cycle <= 0.5 ? cycle * 200 : (1 - cycle) * 200
      const jitter = event?.cursorJitter ? Math.sin(elapsed / 34) * event.cursorJitter : 0
      const next = Math.max(0, Math.min(100, basePosition + jitter))

      meterPositionRef.current = next
      setMeterPosition(next)
      setShotTimeLeft(Math.max(0, (SHOT_LIMIT_MS - elapsed) / 1000))
      meterAnimRef.current = requestAnimationFrame(moveCursor)
    }

    meterAnimRef.current = requestAnimationFrame(moveCursor)
    return () => cancelAnimationFrame(meterAnimRef.current)
  }, [isMeterActive])

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
    setDifficulty(diff)
    const s = { p: 0, ai: 0 }
    scoreRef.current = s
    setScore(s)
    setWinner(null)
    resetField()
    setPhase(P.PLAYER_AIM)
  }

  function resetField() {
    clearTimeout(timerRef.current)
    clearTimeout(shotTimeoutRef.current)
    cancelAnimationFrame(meterAnimRef.current)
    setMsg({ text: '', isGoal: false })
    setDot(null)
    setHover(null)
    meterActiveRef.current = false
    setIsMeterActive(false)
    setMeterPosition(0)
    setShotTimeLeft(5)
    setKeeper({ x: 50, y: 70 })
    setKeeperDive('')
    setBall({ x: 50, y: 82, startX: 50, startY: 82, curveClass: '', outcomeClass: '' })
    setWhistle(false)
    setRareEvent(null)
    rareEventRef.current = null
  }

  // ─── 마우스 조준 이동 (키커 스탠스 연동) ────────────────────
  function handleGoalMouseMove(e) {
    if (phase !== P.PLAYER_AIM || isMeterActive) return
    const pt = getGoalPct(e)
    setHover(pt)
    // 조준 위치가 우측이면 키커는 좌측 뒤에서 도움닫기 준비 (대각선 각도)
    setKickerStance(pt.x >= 50 ? 'left' : 'right')
  }

  function getMeterZone(position) {
    if (position >= 42 && position <= 58) return { key: 'green', label: '정확', chance: 0.95 }
    if ((position >= 27 && position < 42) || (position > 58 && position <= 73)) {
      return { key: 'orange', label: '주의', chance: 0.55 }
    }
    return { key: 'red', label: '위험', chance: 0.15 }
  }

  // 첫 클릭은 조준과 게이지 시작, 두 번째 클릭은 현재 위치에서 슛한다.
  function handleGoalClick(e) {
    if (phase !== P.PLAYER_AIM) return

    if (meterActiveRef.current) {
      finishPlayerShot(false)
      return
    }

    const pt = getGoalPct(e)
    aimLockRef.current = pt
    setHover(pt)
    meterPositionRef.current = 0
    meterStartedAtRef.current = e.timeStamp
    meterElapsedRef.current = 0
    meterActiveRef.current = true
    const selectedDistraction = pickRareEvent('meter')
    rareEventRef.current = selectedDistraction
    setRareEvent(selectedDistraction)
    setMeterPosition(0)
    setShotTimeLeft(5)
    setIsMeterActive(true)
    shotTimeoutRef.current = setTimeout(() => finishPlayerShot(true), SHOT_LIMIT_MS)
  }

  function finishPlayerShot(timedOut) {
    if (!meterActiveRef.current) return

    meterActiveRef.current = false
    setIsMeterActive(false)
    clearTimeout(shotTimeoutRef.current)
    cancelAnimationFrame(meterAnimRef.current)

    const elapsed = meterElapsedRef.current
    const zone = getMeterZone(meterPositionRef.current)
    const latePenalty = elapsed <= 3500 ? 1 : Math.max(0.55, 1 - ((elapsed - 3500) / 1500) * 0.45)
    const chance = timedOut ? 0 : zone.chance * latePenalty

    executePlayerShoot(aimLockRef.current || { x: 50, y: 50 }, {
      chance,
      timedOut,
      zone: zone.key,
    })
  }

  // 골키퍼에게 막힌 공을 충돌 지점에서 경기장 앞으로 튕겨낸다.
  function reboundSavedBall(hitPoint, aimX) {
    const horizontalDirection = aimX < 50 ? 1 : -1

    setTimeout(() => {
      setBall({
        x: Math.max(12, Math.min(88, hitPoint.x + horizontalDirection * rnd(6, 11))),
        y: Math.min(78, hitPoint.y + rnd(22, 28)),
        startX: hitPoint.x,
        startY: hitPoint.y,
        curveClass: 'pk__ball--rebound',
        outcomeClass: 'pk__soccer-ball--saved',
      })
    }, SAVE_REBOUND_DELAY_MS)
  }

  // ─── 플레이어 슛 실행 ─────────────────────────────────────────
  function executePlayerShoot(aim, shot) {
    // 1단계: 대각선 도움닫기
    setPhase(P.PLAYER_RUNUP)

    setTimeout(() => {
      setPhase(P.PLAYER_KICK)

      const selectedEvent = shot.timedOut
        ? rareEventRef.current
        : rareEventRef.current ?? pickRareEvent('shot')
      const adjustedChance = shot.chance * (selectedEvent?.chanceMultiplier ?? 1)
      const scored = !shot.timedOut
        && !selectedEvent?.forcedMissType
        && Math.random() < adjustedChance

      setRareEvent(selectedEvent)
      rareEventRef.current = selectedEvent

      let kx = 50
      let ky = 70
      let saved = false
      let missType = ''
      let actualAim = { ...aim }

      if (scored) {
        if (selectedEvent?.key === 'wind') {
          actualAim.x = Math.max(4, Math.min(96, aim.x + rnd(-10, 10)))
        }
        kx = aim.x > 50 ? rnd(15, 34) : rnd(66, 85)
        ky = rnd(34, 72)
      } else if (selectedEvent?.key === 'wind') {
        missType = 'wind'
        actualAim = {
          x: aim.x < 50 ? rnd(101, 108) : rnd(-8, -1),
          y: Math.max(15, aim.y + rnd(-12, 12)),
        }
        kx = aim.x < 50 ? 28 : 72
        ky = 48
      } else if (selectedEvent?.forcedMissType) {
        missType = selectedEvent.key

        if (selectedEvent.forcedMissType === 'post') {
          actualAim = { x: aim.x < 50 ? 1 : 99, y: Math.max(8, aim.y) }
          kx = aim.x < 50 ? 24 : 76
          ky = aim.y
        } else {
          actualAim = {
            x: aim.x < 50 ? rnd(101, 108) : rnd(-8, -1),
            y: selectedEvent.key === 'bird' ? Math.max(12, aim.y) : Math.max(58, aim.y),
          }
          kx = aim.x < 50 ? 30 : 70
          ky = 52
        }
      } else {
        const missRoll = shot.timedOut ? 0.5 : Math.random()
        if (missRoll < 0.46) {
          missType = 'saved'
          saved = true
          kx = aim.x + rnd(-4, 4)
          ky = aim.y + rnd(-4, 4)
          actualAim = { x: kx, y: ky }
        } else if (missRoll < 0.72) {
          missType = 'over'
          actualAim = { x: aim.x + rnd(-7, 7), y: -18 }
          kx = aim.x < 50 ? 35 : 65
          ky = 35
        } else if (missRoll < 0.92) {
          missType = 'wide'
          actualAim = { x: aim.x < 50 ? -8 : 108, y: Math.max(18, aim.y) }
          kx = aim.x < 50 ? 28 : 72
          ky = 55
        } else {
          missType = 'post'
          actualAim = { x: aim.x < 50 ? 1 : 99, y: Math.max(8, aim.y) }
          kx = aim.x < 50 ? 24 : 76
          ky = aim.y
        }
      }

      setKeeper({ x: kx, y: ky })
      setKeeperDive(kx < 40 ? 'left' : kx > 60 ? 'right' : 'center')

      // 공 포물선 궤적
      const curve = actualAim.x < 45 ? 'pk__ball--arc-left' : actualAim.x > 55 ? 'pk__ball--arc-right' : 'pk__ball--arc-center'
      const t = goalToScene(actualAim.x, actualAim.y)

      setBall({
        x: t.x,
        y: t.y,
        startX: 50,
        startY: 82,
        curveClass: curve,
        outcomeClass: saved
          ? 'pk__soccer-ball--saved'
          : scored
            ? 'pk__soccer-ball--goal'
            : `pk__soccer-ball--miss-${selectedEvent?.forcedMissType ?? missType}`,
      })

      if (saved) reboundSavedBall(t, actualAim.x)

      // 3단계: 판정 메시지
      setTimeout(() => {
        let msgText = ''
        let isGoal = false

        if (shot.timedOut) {
          msgText = '⏱️ 시간 초과! 집중력이 흐트러져 실축했습니다.'
        } else if (missType === 'bird') {
          msgText = '🐦 버드 스트라이크! 날아든 새 떼에 공이 굴절됐습니다.'
        } else if (missType === 'sprinkler') {
          msgText = '💦 스프링클러 오작동! 미끄러진 슛이 빗나갔습니다.'
        } else if (missType === 'beach-ball') {
          msgText = '🏖️ 비치볼과 충돌! 공이 골대를 맞고 나왔습니다.'
        } else if (selectedEvent?.key === 'wind') {
          msgText = '🌬️ 갑작스러운 돌풍에 슛 궤적이 틀어졌습니다!'
        } else if (selectedEvent?.key === 'blackout') {
          msgText = '💡 조명이 깜빡이는 순간 타이밍을 놓쳤습니다!'
        } else if (selectedEvent?.key === 'mosquito') {
          msgText = '🦟 모기가 시야를 가려 슛 타이밍이 흔들렸습니다!'
        } else if (selectedEvent?.key === 'fake-whistle') {
          msgText = '📣 가짜 휘슬에 속아 타이밍을 놓쳤습니다!'
        } else if (selectedEvent?.key === 'camera-flash') {
          msgText = '📸 카메라 플래시에 순간적으로 시야를 잃었습니다!'
        } else if (selectedEvent?.key === 'rain') {
          msgText = '🌧️ 갑작스러운 빗방울에 발이 미끄러졌습니다!'
        } else if (selectedEvent?.key === 'scoreboard-glitch') {
          msgText = '📺 전광판 오류로 게이지를 잘못 읽었습니다!'
        } else if (missType === 'saved' || saved) {
          msgText = '🧤 골키퍼가 방향을 읽고 막았습니다!'
        } else if (missType === 'over') {
          msgText = '🚀 공이 크로스바 위로 날아갔습니다!'
        } else if (missType === 'wide') {
          msgText = '💨 공이 골문 옆으로 벗어났습니다!'
        } else if (missType === 'post') {
          msgText = '🥅 골대를 맞고 튕겨 나왔습니다!'
        } else {
          if (selectedEvent?.key === 'wind') {
            msgText = '🌬️ 돌풍을 뚫어낸 원더골 GOAL!!'
          } else if (selectedEvent?.key === 'blackout') {
            msgText = '💡 조명 혼란 속에서도 침착하게 GOAL!!'
          } else if (selectedEvent) {
            msgText = `✨ ${selectedEvent.label} 방해를 이겨내고 GOAL!!`
          } else {
            msgText = shot.zone === 'green' ? '🔥 정확한 타이밍! GOAL!!' : '⚽ GOAL! 득점 성공!'
          }
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
      }, SHOT_RESULT_DELAY_MS)
    }, 760)
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
  function handlePlayerSave(click) {
    clearTimeout(timerRef.current)
    setDot(null)
    const aim = aiAimRef.current
    if (!aim) return

    const dx = Math.abs(click.x - aim.x)
    const dy = Math.abs(click.y - aim.y)
    const saveX = diffRef.current.saveX
    const saveY = diffRef.current.saveY
    const isInsideSaveArea = ((dx / saveX) ** 2) + ((dy / saveY) ** 2) <= 1
    const saved = isInsideSaveArea

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
      startX: 50,
      startY: 82,
      curveClass: curve,
      outcomeClass: saved ? 'pk__soccer-ball--saved' : 'pk__soccer-ball--goal',
    })

    if (saved) reboundSavedBall(t, aim.x)

    const base = scoreOverride ?? scoreRef.current
    const next = saved ? base : { ...base, ai: base.ai + 1 }
    scoreRef.current = next
    setScore(next)
    setMsg({ text: saved ? '🧤 슈퍼세이브 선방 성공!' : '⚽ AI 득점 허용...', isGoal: !saved })

    setTimeout(() => {
      setPhase(P.ROUND_RESULT)
      setTimeout(() => checkNextTurn(next, 'ai'), 1300)
    }, SHOT_RESULT_DELAY_MS)
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
    clearTimeout(shotTimeoutRef.current)
    cancelAnimationFrame(meterAnimRef.current)
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
    '--ball-end-x': `${ball.x}%`,
    '--ball-end-y': `${ball.y}%`,
    '--ball-start-x': `${ball.startX}%`,
    '--ball-start-y': `${ball.startY}%`,
  }
  const meterZone = getMeterZone(meterPosition)

  return (
    <main className="pk">
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
            <strong>[슛하는 법]</strong> 코스를 클릭하면 5초 타이밍 바가 시작됩니다.<br />
            초록색 95% · 주황색 55% · 빨간색 15% 구간에서 다시 클릭하세요.<br />
            경기 중에는 낮은 확률로 예상하지 못한 돌발 상황이 발생합니다.<br />
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
                <span className="pk__diff-time">커서 {d.cursorMs / 1000}초 왕복 / 선방 힌트 {d.hintMs / 1000}초</span>
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
        <div className={`pk__stadium ${rareEvent ? `pk__stadium--event-${rareEvent.key}` : ''}`} ref={sceneRef}>
          {/* 관중석 및 조명 */}
          <div className="pk__crowd" aria-hidden="true">
            <div className="pk__stadium-light pk__stadium-light--left" />
            <div className="pk__stadium-light pk__stadium-light--right" />
            <div className="pk__crowd-stand" />
            <div className="pk__spectators">
              {CROWD.map((person, index) => (
                <span
                  className="pk__spectator"
                  key={index}
                  style={{ '--shirt': person.color, '--delay': person.delay }}
                />
              ))}
            </div>
            <div className="pk__ad-boards">
              <span>PREMIER LEAGUE</span>
              <span>PL:UG FOOTBALL</span>
              <span>PLUGIN STADIUM</span>
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

          {/* 낮은 확률로 나타나는 경기장 돌발 상황 */}
          {rareEvent && (
            <div className={`pk__rare-event pk__rare-event--${rareEvent.key}`} aria-hidden="true">
              <div className="pk__rare-event-label">⚠ SPECIAL EVENT · {rareEvent.label}</div>
              {rareEvent.key === 'bird' && (
                <div className="pk__bird-flock"><span /><span /><span /><span /></div>
              )}
              {rareEvent.key === 'wind' && (
                <>
                  <div className="pk__hurricane"><span>🌪️</span><i /><i /><i /></div>
                  <div className="pk__wind-lines"><span /><span /><span /><span /></div>
                </>
              )}
              {rareEvent.key === 'sprinkler' && (
                <div className="pk__sprinkler"><span /><span /><span /><span /></div>
              )}
              {rareEvent.key === 'beach-ball' && <div className="pk__beach-ball" />}
              {rareEvent.key === 'blackout' && <div className="pk__blackout-flash" />}
              {rareEvent.key === 'mosquito' && <div className="pk__mosquito">🦟</div>}
              {rareEvent.key === 'fake-whistle' && <div className="pk__fake-whistle">삐익?!</div>}
              {rareEvent.key === 'camera-flash' && <div className="pk__camera-flash" />}
              {rareEvent.key === 'rain' && (
                <div className="pk__rain"><span /><span /><span /><span /><span /><span /></div>
              )}
              {rareEvent.key === 'scoreboard-glitch' && <div className="pk__scoreboard-glitch">88:88</div>}
            </div>
          )}

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
              onClick={isAiHint ? (e) => handlePlayerSave(getGoalPct(e)) : handleGoalClick}
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
                    animationDuration: `${difficulty.hintMs}ms`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePlayerSave(getGoalPct(e))
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
            className={`pk__soccer-ball ${ball.curveClass} ${ball.outcomeClass}`}
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

          {/* 5초 타이밍 게이지 */}
          {isMeterActive && (
            <div className="pk__power-meter">
              <div className="pk__power-label">
                <span>SHOT TIMING</span>
                <span className={shotTimeLeft <= 1.5 ? 'pk__power-txt--over' : ''}>
                  {shotTimeLeft.toFixed(1)}초
                </span>
              </div>
              <div className="pk__power-track" aria-label="슛 정확도 타이밍 바">
                <div className="pk__meter-zone pk__meter-zone--red-left" />
                <div className="pk__meter-zone pk__meter-zone--orange-left" />
                <div className="pk__meter-zone pk__meter-zone--green" />
                <div className="pk__meter-zone pk__meter-zone--orange-right" />
                <div className="pk__meter-zone pk__meter-zone--red-right" />
                <div className="pk__meter-cursor" style={{ left: `${meterPosition}%` }} />
              </div>
              <div className={`pk__power-hint pk__power-hint--${meterZone.key}`}>
                {shotTimeLeft <= 1.5 ? '집중력 저하! 지금 클릭하세요.' : `${meterZone.label} 구간 · 골대를 다시 클릭해 슛`}
              </div>
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
            {isAiming && !isMeterActive && '🎯 골대에서 원하는 코스를 한 번 클릭하세요.'}
            {isMeterActive && '⚡ 5초 안에 초록색 구간을 노려 골대를 다시 클릭하세요!'}
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
