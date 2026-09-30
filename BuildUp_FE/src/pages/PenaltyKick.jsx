import { useState, useRef, useEffect } from 'react'
import '../css/PenaltyKick.css'

const DIFFICULTIES = [
  { label: '하', key: 'easy', hintMs: 3000, cursorMs: 2400, saveX: 12, saveY: 17, color: '#2ecc71', winScore: 3, shotChanceMultiplier: 1, eventRateMultiplier: 2 },
  { label: '중', key: 'normal', hintMs: 2000, cursorMs: 1700, saveX: 8, saveY: 12, color: '#f39c12', winScore: 3, shotChanceMultiplier: 1, eventRateMultiplier: 2 },
  { label: '상', key: 'hard', hintMs: 1000, cursorMs: 1100, saveX: 5, saveY: 8, color: '#e74c3c', winScore: 3, shotChanceMultiplier: 0.95, eventRateMultiplier: 2 },
  { label: '익스트림', key: 'extreme', hintMs: 650, cursorMs: 450, saveX: 4.5, saveY: 10, color: '#c026d3', winScore: 15, shotChanceMultiplier: 0.78, eventRateMultiplier: 5 },
]

const SHOT_LIMIT_MS = 5000
const SAVE_REBOUND_DELAY_MS = 1020
const SHOT_RESULT_DELAY_MS = 1600
const CROWD_COLORS = ['#ef4444', '#2563eb', '#facc15', '#f8fafc', '#16a34a', '#f97316', '#a855f7']
const CROWD = Array.from({ length: 56 }, (_, index) => ({
  color: CROWD_COLORS[index % CROWD_COLORS.length],
  delay: `${(index % 8) * -0.11}s`,
}))
const RARE_EVENTS = [
  { key: 'mosquito', label: '모기 난입', phase: 'meter', rate: 0.012, impactRate: 0.65, chanceMultiplier: 0.65, cursorJitter: 4 },
  { key: 'fake-whistle', label: '관중의 가짜 휘슬', phase: 'meter', rate: 0.008, impactRate: 0.7, chanceMultiplier: 0.55, speedMultiplier: 1.4 },
  { key: 'camera-flash', label: '카메라 플래시', phase: 'meter', rate: 0.006, impactRate: 0.6, chanceMultiplier: 0.65 },
  { key: 'rain', label: '갑작스러운 빗방울', phase: 'meter', rate: 0.009, impactRate: 0.7, chanceMultiplier: 0, speedMultiplier: 1.12, forcedMissType: 'wide' },
  { key: 'scoreboard-glitch', label: '전광판 오류', phase: 'meter', rate: 0.005, impactRate: 0.65, chanceMultiplier: 0.6 },
  { key: 'bird', label: '버드 스트라이크', phase: 'shot', rate: 0.01, impactRate: 0.75, chanceMultiplier: 0, forcedMissType: 'wide' },
  { key: 'wind', label: '갑작스러운 돌풍', phase: 'shot', rate: 0.022, impactRate: 0.7, chanceMultiplier: 0.45 },
  { key: 'sprinkler', label: '스프링클러 오작동', phase: 'shot', rate: 0.01, impactRate: 0.7, chanceMultiplier: 0, forcedMissType: 'wide' },
  { key: 'beach-ball', label: '비치볼 난입', phase: 'shot', rate: 0.012, impactRate: 0.75, chanceMultiplier: 0, forcedMissType: 'post' },
  { key: 'blackout', label: '조명 깜빡임', phase: 'shot', rate: 0.0085, impactRate: 0.65, chanceMultiplier: 0.45 },
  { key: 'drone', label: '촬영 드론 난입', phase: 'meter', rate: 0.012, impactRate: 0.7, chanceMultiplier: 0.55, speedMultiplier: 1.35, cursorJitter: 7, extremeOnly: true },
  { key: 'pitch-invader', label: '관중 난입', phase: 'shot', rate: 0.012, impactRate: 0.8, chanceMultiplier: 0, forcedMissType: 'wide', extremeOnly: true },
  { key: 'giant-balloon', label: '대형 풍선 난입', phase: 'shot', rate: 0.011, impactRate: 0.7, chanceMultiplier: 0, forcedMissType: 'post', extremeOnly: true },
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

function pickRareEvent(phase, difficulty) {
  const roll = Math.random()
  let accumulatedRate = 0
  const eventRateMultiplier = difficulty?.eventRateMultiplier ?? 1

  for (const event of RARE_EVENTS.filter((item) => (
    item.phase === phase && (!item.extremeOnly || difficulty?.key === 'extreme')
  ))) {
    accumulatedRate += event.rate * eventRateMultiplier
    if (roll < accumulatedRate) {
      return { ...event, didImpact: Math.random() < (event.impactRate ?? 1) }
    }
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
  const aiResolvedRef = useRef(false)
  const aiDeadlineRef = useRef(0)
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
      const cursorMs = diffRef.current.cursorMs / (event?.didImpact ? (event.speedMultiplier ?? 1) : 1)
      const cycle = (elapsed % cursorMs) / cursorMs
      const basePosition = cycle <= 0.5 ? cycle * 200 : (1 - cycle) * 200
      const jitter = event?.didImpact && event.cursorJitter ? Math.sin(elapsed / 34) * event.cursorJitter : 0
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

  function getMeterZone(position, difficultyKey) {
    const isExtreme = difficultyKey === 'extreme'
    const greenStart = isExtreme ? 45 : 38
    const greenEnd = isExtreme ? 55 : 62
    const orangeStart = isExtreme ? 28 : 20
    const orangeEnd = isExtreme ? 72 : 80

    if (position >= greenStart && position <= greenEnd) return { key: 'green', label: '정확', chance: 0.95 }
    if ((position >= orangeStart && position < greenStart) || (position > greenEnd && position <= orangeEnd)) {
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
    const selectedDistraction = pickRareEvent('meter', diffRef.current)
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
    const zone = getMeterZone(meterPositionRef.current, diffRef.current.key)
    const latePenalty = elapsed <= 3500 ? 1 : Math.max(0.55, 1 - ((elapsed - 3500) / 1500) * 0.45)
    const chance = timedOut
      ? 0
      : zone.chance * latePenalty * (diffRef.current.shotChanceMultiplier ?? 1)

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

      const eventCandidate = shot.timedOut
        ? rareEventRef.current
        : rareEventRef.current ?? pickRareEvent('shot', diffRef.current)
      const selectedEvent = eventCandidate ?? null
      const forcedMissType = selectedEvent?.didImpact ? selectedEvent.forcedMissType : null
      const adjustedChance = shot.chance * (selectedEvent?.didImpact ? selectedEvent.chanceMultiplier : 1)
      const scored = !shot.timedOut
        && !forcedMissType
        && Math.random() < adjustedChance

      setRareEvent(selectedEvent)
      rareEventRef.current = selectedEvent

      let kx = 50
      let ky = 70
      let saved = false
      let missType = ''
      let actualAim = { ...aim }

      if (scored) {
        if (selectedEvent?.key === 'wind' && selectedEvent.didImpact) {
          actualAim.x = Math.max(4, Math.min(96, aim.x + rnd(-10, 10)))
        }
        kx = aim.x > 50 ? rnd(15, 34) : rnd(66, 85)
        ky = rnd(34, 72)
      } else if (selectedEvent?.key === 'wind' && selectedEvent.didImpact) {
        missType = 'wind'
        actualAim = {
          x: aim.x < 50 ? rnd(101, 108) : rnd(-8, -1),
          y: Math.max(15, aim.y + rnd(-12, 12)),
        }
        kx = aim.x < 50 ? 28 : 72
        ky = 48
      } else if (forcedMissType) {
        missType = selectedEvent.key

        if (forcedMissType === 'post') {
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
            : `pk__soccer-ball--miss-${forcedMissType ?? missType}`,
      })

      if (saved) reboundSavedBall(t, actualAim.x)

      // 3단계: 판정 메시지
      setTimeout(() => {
        let msgText = ''
        let isGoal = false

        if (scored) {
          if (selectedEvent?.key === 'wind' && selectedEvent.didImpact) {
            msgText = '🌬️ 돌풍을 뚫어낸 원더골 GOAL!!'
          } else if (selectedEvent?.key === 'blackout' && selectedEvent.didImpact) {
            msgText = '💡 조명 혼란 속에서도 침착하게 GOAL!!'
          } else if (selectedEvent?.didImpact) {
            msgText = `✨ ${selectedEvent.label} 방해를 이겨내고 GOAL!!`
          } else if (selectedEvent) {
            msgText = `⚡ ${selectedEvent.label}을 피하고 GOAL!!`
          } else {
            msgText = shot.zone === 'green' ? '🔥 정확한 타이밍! GOAL!!' : '⚽ GOAL! 득점 성공!'
          }
          isGoal = true
        } else if (missType === 'bird') {
          msgText = '🐦 버드 스트라이크! 날아든 새 떼에 공이 굴절됐습니다.'
        } else if (missType === 'rain') {
          msgText = '🌧️ 젖은 잔디에서 미끄러져 넘어지며 슛이 빗나갔습니다!'
        } else if (missType === 'sprinkler') {
          msgText = '💦 스프링클러 오작동! 미끄러진 슛이 빗나갔습니다.'
        } else if (missType === 'beach-ball') {
          msgText = '🏖️ 비치볼과 충돌! 공이 골대를 맞고 나왔습니다.'
        } else if (missType === 'pitch-invader') {
          msgText = '🏃 관중이 경기장에 난입해 슛이 크게 빗나갔습니다!'
        } else if (missType === 'giant-balloon') {
          msgText = '🎈 대형 풍선과 충돌한 공이 골대를 맞고 나왔습니다!'
        } else if (selectedEvent?.didImpact && selectedEvent.key === 'wind') {
          msgText = '🌬️ 갑작스러운 돌풍에 슛 궤적이 틀어졌습니다!'
        } else if (selectedEvent?.didImpact && selectedEvent.key === 'blackout') {
          msgText = '💡 조명이 깜빡이는 순간 타이밍을 놓쳤습니다!'
        } else if (selectedEvent?.didImpact && selectedEvent.key === 'mosquito') {
          msgText = '🦟 모기가 시야를 가려 슛 타이밍이 흔들렸습니다!'
        } else if (selectedEvent?.didImpact && selectedEvent.key === 'fake-whistle') {
          msgText = '📣 가짜 휘슬에 속아 타이밍을 놓쳤습니다!'
        } else if (selectedEvent?.didImpact && selectedEvent.key === 'camera-flash') {
          msgText = '📸 카메라 플래시에 순간적으로 시야를 잃었습니다!'
        } else if (selectedEvent?.didImpact && selectedEvent.key === 'scoreboard-glitch') {
          msgText = '📺 전광판 오류로 게이지를 잘못 읽었습니다!'
        } else if (selectedEvent?.didImpact && selectedEvent.key === 'drone') {
          msgText = '🚁 촬영 드론이 시야와 슛 타이밍을 방해했습니다!'
        } else if (shot.timedOut) {
          msgText = '⏱️ 시간 초과! 집중력이 흐트러져 실축했습니다.'
        } else if (missType === 'saved' || saved) {
          msgText = '🧤 골키퍼가 방향을 읽고 막았습니다!'
        } else if (missType === 'over') {
          msgText = '🚀 공이 크로스바 위로 날아갔습니다!'
        } else if (missType === 'wide') {
          msgText = '💨 공이 골문 옆으로 벗어났습니다!'
        } else if (missType === 'post') {
          msgText = '🥅 골대를 맞고 튕겨 나왔습니다!'
        }

        const retryGranted = Boolean(selectedEvent?.didImpact && !isGoal && Math.random() < 0.5)

        const next = isGoal
          ? { ...scoreRef.current, p: scoreRef.current.p + 1 }
          : { ...scoreRef.current }
        scoreRef.current = next
        setScore(next)
        setMsg({ text: msgText, isGoal, retry: retryGranted })
        setPhase(P.ROUND_RESULT)

        setTimeout(() => {
          if (retryGranted) {
            resetField()
            setPhase(P.PLAYER_AIM)
            return
          }
          checkNextTurn(next, 'player')
        }, retryGranted ? 1900 : 1300)
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
    aiResolvedRef.current = false
    aiDeadlineRef.current = performance.now() + (diffRef.current?.hintMs ?? 2000)
    setDot(aim)
    setPhase(P.AI_HINT)

    timerRef.current = setTimeout(() => {
      if (aiResolvedRef.current) return
      aiResolvedRef.current = true
      setDot(null)
      const lateDive = {
        x: aim.x < 50 ? Math.min(92, aim.x + 30) : Math.max(8, aim.x - 30),
        y: Math.min(88, aim.y + 14),
      }
      resolveAiKick(lateDive, aim, s, false, 'timeout')
    }, diffRef.current?.hintMs ?? 2000)
  }

  // ─── 플레이어 선방 클릭 ──────────────────────────────────
  function handlePlayerSave(click) {
    if (aiResolvedRef.current) return
    aiResolvedRef.current = true
    clearTimeout(timerRef.current)
    setDot(null)
    const aim = aiAimRef.current
    if (!aim) return

    // 타이머 실행이 늦어져도 실제 제한 시간을 넘긴 클릭은 선방으로 인정하지 않습니다.
    if (performance.now() >= aiDeadlineRef.current) {
      const lateDive = { x: aim.x < 50 ? 92 : 8, y: Math.min(88, aim.y + 14) }
      resolveAiKick(lateDive, aim, null, false, 'timeout')
      return
    }

    const dx = Math.abs(click.x - aim.x)
    const dy = Math.abs(click.y - aim.y)
    const saveX = diffRef.current.saveX
    const saveY = diffRef.current.saveY
    const isInsideSaveArea = ((dx / saveX) ** 2) + ((dy / saveY) ** 2) <= 1
    const saved = isInsideSaveArea
    // 성공한 선방은 공의 충돌 위치까지 손을 뻗도록 표시합니다.
    let keeperTarget = saved ? { ...aim } : click

    if (!saved) {
      const xRatio = dx / saveX
      const yRatio = dy / saveY

      if (xRatio >= yRatio) {
        const direction = click.x >= aim.x ? 1 : -1
        keeperTarget = { ...click, x: Math.max(5, Math.min(95, aim.x + direction * (saveX + 7))) }
      } else {
        const direction = click.y >= aim.y ? 1 : -1
        keeperTarget = { ...click, y: Math.max(8, Math.min(92, aim.y + direction * (saveY + 10))) }
      }
    }

    resolveAiKick(keeperTarget, aim, null, saved, saved ? 'saved' : 'position')
  }

  // ─── AI 킥 결과 처리 ─────────────────────────────────────
  function resolveAiKick(click, aim, scoreOverride, saved, resultReason) {
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
    const resultText = saved
      ? '🧤 슈퍼세이브 선방 성공!'
      : resultReason === 'timeout'
        ? '⏱️ 반응이 늦었습니다. 골키퍼가 반대 방향으로 뒤늦게 몸을 날렸습니다.'
        : '🥅 방향은 읽었지만 손끝이 공에 닿지 않았습니다.'
    setMsg({ text: resultText, isGoal: !saved })

    setTimeout(() => {
      setPhase(P.ROUND_RESULT)
      setTimeout(() => checkNextTurn(next, 'ai'), 1300)
    }, SHOT_RESULT_DELAY_MS)
  }

  function checkNextTurn(s, lastTurn) {
    const winScore = diffRef.current.winScore ?? 3

    if (s.p >= winScore || s.ai >= winScore) {
      setWinner(s.p >= winScore ? 'player' : 'ai')
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
  const meterZone = getMeterZone(meterPosition, difficulty.key)

  return (
    <main className="pk">
      {/* 상단 스코어보드 (플레이 중에만 노출) */}
      {isPlaying && (
        <header className="pk__topbar">
          <div className="pk__score" aria-label={`${difficulty.winScore}골 선취 경기`}>
            <span className="pk__score-team">YOU</span>
            <strong className="pk__score-num">{score.p}</strong>
            <span className="pk__score-sep">:</span>
            <strong className="pk__score-num">{score.ai}</strong>
            <span className="pk__score-team">AI</span>
            <span className="pk__score-target">/{difficulty.winScore}</span>
          </div>
        </header>
      )}

      {/* 난이도 선택 */}
      {phase === P.INTRO && (
        <div className="pk__intro">
          <a className="pk__back" href="/plug/minigames">돌아가기</a>
          <header className="pk__intro-header">
            <span className="pk__intro-badge">SHOOTOUT</span>
            <h2 className="pk__intro-heading">실력 기반 승부차기 1:1</h2>
            <p className="pk__intro-desc">
              하·중·상은 3골, 익스트림은 15골을 먼저 득점하면 승리합니다.<br />
              <strong>[슛하는 법]</strong> 코스를 클릭하면 5초 타이밍 바가 시작됩니다.<br />
              초록색 95% · 주황색 55% · 빨간색 15% 구간에서 다시 클릭하세요.<br />
              익스트림은 어려움보다 약 2.5배 빠르고 판정 범위가 좁으며 돌발 상황도 크게 증가합니다.<br />
              돌발 상황의 직접 피해로 실축하면 50% 확률로 같은 슛을 다시 찰 수 있습니다.<br />
              <strong>[막는 법]</strong> 3, 2, 1 카운트 후 뜨는 <span className="pk__intro-dot">●</span> 힌트 점을 찰나에 클릭!
            </p>
          </header>
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
                <span className="pk__diff-goal">{d.winScore}골 선취</span>
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
            <br />{difficulty.label} 난이도 · {difficulty.winScore}골 선취전
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
        <div
          className={`pk__stadium pk__stadium--phase-${phase.toLowerCase()} ${rareEvent ? `pk__stadium--event-${rareEvent.key}` : ''} ${rareEvent?.didImpact ? 'pk__stadium--event-impact' : ''}`}
          ref={sceneRef}
        >
          <a className="pk__back pk__back--stadium" href="/plug/minigames">돌아가기</a>
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
              <div className="pk__rare-event-label">
                {rareEvent.didImpact ? '💥 EVENT IMPACT' : '⚠ SPECIAL EVENT'} · {rareEvent.label}
              </div>
              {rareEvent.key === 'bird' && (
                <>
                  <div className="pk__bird-flock"><span /><span /><span /><span /></div>
                  <div className="pk__bird-feathers"><span>◜</span><span>◝</span><span>⌁</span></div>
                </>
              )}
              {rareEvent.key === 'wind' && (
                <>
                  <div className="pk__hurricane"><span>🌪️</span><i /><i /><i /></div>
                  <div className="pk__wind-lines"><span /><span /><span /><span /></div>
                </>
              )}
              {rareEvent.key === 'sprinkler' && (
                <>
                  <div className="pk__sprinkler"><span /><span /><span /><span /></div>
                  <div className="pk__sprinkler-splash"><span /><span /><span /></div>
                </>
              )}
              {rareEvent.key === 'beach-ball' && (
                <>
                  <div className="pk__beach-ball" />
                  <div className="pk__beach-ball-impact"><span /><span /><span /></div>
                </>
              )}
              {rareEvent.key === 'blackout' && (
                <><div className="pk__blackout-flash" /><div className="pk__emergency-lights"><span /><span /></div></>
              )}
              {rareEvent.key === 'mosquito' && (
                <div className="pk__mosquito"><span>🦟</span><span>🦟</span><span>🦟</span></div>
              )}
              {rareEvent.key === 'fake-whistle' && (
                <div className="pk__fake-whistle">삐익?!<span /><span /><span /></div>
              )}
              {rareEvent.key === 'camera-flash' && (
                <><div className="pk__camera-flash" /><div className="pk__camera-row"><span>📸</span><span>📸</span><span>📸</span></div></>
              )}
              {rareEvent.key === 'rain' && (
                <>
                  <div className="pk__rain"><span /><span /><span /><span /><span /><span /></div>
                  <div className="pk__rain-puddle"><span /><span /><span /></div>
                </>
              )}
              {rareEvent.key === 'scoreboard-glitch' && (
                <div className="pk__scoreboard-glitch"><span>88:88</span><i>ERROR · VAR LOST</i></div>
              )}
              {rareEvent.key === 'drone' && <div className="pk__drone">🚁<span>REC</span></div>}
              {rareEvent.key === 'pitch-invader' && (
                <>
                  <div className="pk__pitch-invader">🏃</div>
                  <div className="pk__pitch-steward">🏃‍♂️<span>STOP!</span></div>
                </>
              )}
              {rareEvent.key === 'giant-balloon' && (
                <><div className="pk__giant-balloon">🎈</div><div className="pk__balloon-impact">BANG!</div></>
              )}
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
              <div className={`pk__power-track ${difficulty.key === 'extreme' ? 'pk__power-track--extreme' : ''}`} aria-label="슛 정확도 타이밍 바">
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
              <span>{msg.text}</span>
              {msg.retry && (
                <strong className="pk__round-banner-retry">🎟️ 이벤트 피해 보상 · 다시 찰 기회!</strong>
              )}
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
