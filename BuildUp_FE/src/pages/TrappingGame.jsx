import { useEffect, useRef, useState } from 'react'
import '../css/TrappingGame.css'

const W = 480, H = 640, R = 15, GROUND = H - 40, KICK_HEIGHT = 42
const PLAYER_MIN = 60, PLAYER_MAX = W - 60
const hazards = [
  { name: '돌풍', hint: '공이 바람 방향으로 밀립니다', color: '#b9f3ff' },
  { name: '짙은 구름', hint: '공 주변 시야가 좁아집니다', color: '#e8dcff' },
  { name: '우주 잔해', hint: '잔해에 맞으면 공의 방향이 바뀝니다', color: '#ffca9c' },
]
const layers = [
  { at: 0, name: '킥오프 · 지상', top: '#12394b', bottom: '#7fc5cc' },
  { at: 1000, name: '구름 위 · 대류권', top: '#144a70', bottom: '#83badc' },
  { at: 12000, name: '성층권', top: '#142747', bottom: '#3c6997' },
  { at: 50000, name: '중간권', top: '#15172f', bottom: '#34355a' },
  { at: 85000, name: '열권 · 오로라', top: '#080e20', bottom: '#193e49' },
  { at: 100000, name: '우주 경계 · 카르만선', top: '#080915', bottom: '#1c214b' },
  { at: 600000, name: '외기권', top: '#050611', bottom: '#141b31' },
  { at: 2000000, name: '깊은 우주', top: '#04040c', bottom: '#211336' },
]
const layerAt = (height) => [...layers].reverse().find((layer) => height >= layer.at) || layers[0]
const altitude = (height) => Math.max(0, Math.round(height * 30))
const formatHeight = (height) => height >= 1000 ? `${(height / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })} km` : `${height} m`
const newGame = () => ({ x: 240, y: 220, vx: 95, vy: 0, camera: 0, following: false, footX: 240, kickSide: -1, kickPose: 0, kick: 0, cooldown: 0, eventWait: 5, event: null, hits: 0, peak: 0, flash: 0, trail: [], status: 'ready' })

export default function TrappingGame() {
  const pageRef = useRef(null)
  const arenaRef = useRef(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const canvasRef = useRef(null)
  const stateRef = useRef(newGame())
  const [hud, setHud] = useState({ height: 0, hits: 0, speed: 1, status: 'ready', best: 0 })
  const bestRef = useRef(0)
  useEffect(() => {
    const sync = () => { setFullscreen(document.fullscreenElement === arenaRef.current); canvasRef.current?.focus({ preventScroll: true }) }
    const escape = (event) => { if (event.key === 'Escape' && !document.fullscreenElement) setFullscreen(false) }
    document.addEventListener('fullscreenchange', sync)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('fullscreenchange', sync); document.removeEventListener('keydown', escape) }
  }, [])
  useEffect(() => {
    if (!fullscreen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [fullscreen])
  const toggleFullscreen = async () => {
    if (fullscreen) {
      if (document.fullscreenElement === arenaRef.current) await document.exitFullscreen()
      else setFullscreen(false)
    } else {
      try {
        if (!arenaRef.current.requestFullscreen) throw new Error('unsupported')
        await arenaRef.current.requestFullscreen()
      } catch { setFullscreen(true) }
    }
    canvasRef.current?.focus({ preventScroll: true })
  }
  useEffect(() => {
    const fit = () => {
      const page = pageRef.current
      if (page) page.style.setProperty('--trap-top', `${Math.max(0, page.getBoundingClientRect().top + window.scrollY)}px`)
    }
    fit()
    window.addEventListener('resize', fit)
    const nav = document.querySelector('nav')
    const observer = new ResizeObserver(fit)
    if (nav) observer.observe(nav)
    return () => { window.removeEventListener('resize', fit); observer.disconnect() }
  }, [])
  useEffect(() => {
    try { bestRef.current = Number(localStorage.getItem('plug:trapping:best')) || 0 } catch { /* 저장 불가 환경 */ }
    setHud((current) => ({ ...current, best: bestRef.current }))
  }, [])
  const publish = () => {
    const s = stateRef.current
    setHud({ height: altitude(s.peak), hits: s.hits, speed: 1 + Math.min(5, altitude(s.peak) / 70000), status: s.status, best: bestRef.current })
  }
  const start = () => {
    stateRef.current = { ...newGame(), status: 'playing' }
    publish()
    canvasRef.current?.focus()
  }
  const togglePause = () => {
    const s = stateRef.current
    if (s.status === 'playing') s.status = 'paused'
    else if (s.status === 'paused') s.status = 'playing'
    publish()
  }
  const kick = (side = -1) => {
    const s = stateRef.current
    if (s.status === 'playing' && s.cooldown <= 0) { s.kickSide = side; s.kick = .18; s.kickPose = .22; s.cooldown = .32 }
  }
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let frame, previous = 0, accumulator = 0, hudTime = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const finish = (s) => {
      s.status = 'over'
      bestRef.current = Math.max(bestRef.current, altitude(s.peak))
      try { localStorage.setItem('plug:trapping:best', String(bestRef.current)) } catch { /* 기록은 현재 실행 동안 유지 */ }
      publish()
    }
    const step = (dt) => {
      const s = stateRef.current
      if (s.status !== 'playing') return
      const oldY = s.y, oldX = s.x
      const gravity = 420 * (1 + Math.min(5, altitude(s.peak) / 70000))
      const eligible = altitude(s.y) >= 30000
      if (!eligible) s.event = null
      if (eligible && !s.event) {
        s.eventWait -= dt
        if (s.eventWait <= 0) {
          s.eventWait = 9 + Math.random() * 5
          if (Math.random() < .55) {
            const choices = altitude(s.y) >= 100000 ? [0, 2] : [0, 1]
            s.event = { type: choices[Math.floor(Math.random() * choices.length)], remaining: 4.2, direction: Math.random() < .5 ? -1 : 1, hit: false }
          }
        }
      }
      if (s.event) {
        s.event.remaining -= dt
        if (s.event.remaining <= 0) s.event = null
        else if (s.event.type === 0 && s.event.remaining < 3.2) s.vx = Math.max(-420, Math.min(420, s.vx + s.event.direction * 145 * dt))
        else if (s.event.type === 2 && s.event.remaining < 2 && !s.event.hit) {
          s.event.hit = true; s.vx = s.event.direction * (160 + Math.random() * 100); s.flash = .3
        }
      }
      s.vy -= gravity * dt
      s.x += s.vx * dt; s.y += s.vy * dt
      if (s.x < 28 + R) { s.x = 28 + R; s.vx = Math.abs(s.vx); s.flash = .16 }
      if (s.x > W - 28 - R) { s.x = W - 28 - R; s.vx = -Math.abs(s.vx); s.flash = .16 }
      const contactY = KICK_HEIGHT + R
      // 한 줄을 통과하는 순간뿐 아니라 공과 발이 겹치는 높이 구간 전체에서 판정합니다.
      const contactTop = contactY + R, contactBottom = KICK_HEIGHT - R
      const crossing = s.vy < 0 && oldY >= contactBottom && s.y <= contactTop
      const fraction = crossing && oldY > contactTop ? Math.max(0, Math.min(1, (oldY - contactTop) / (oldY - s.y))) : 0
      const contactX = oldX + (s.x - oldX) * fraction
      const footCenter = s.footX + s.kickSide * 18
      const centralContact = Math.abs(contactX - s.footX) <= 18 + R
      if (crossing && s.kick > dt * fraction && (centralContact || Math.abs(contactX - footCenter) <= 32 + R)) {
        s.y = Math.max(contactY, s.y)
        s.hits++
        // 목표 고도를 매번 높이고 고도에 따른 중력으로 발사 속도를 계산합니다.
        const targetRise = 110 + 48 * Math.pow(1.34, Math.min(s.hits, 28)) + Math.max(0, s.hits - 28) * 1500
        s.vy = Math.sqrt(2 * gravity * targetRise)
        const offset = centralContact ? (contactX - s.footX) / 48 : (contactX - footCenter) / 32
        s.vx = Math.max(-360, Math.min(360, s.vx * .45 + offset * 230))
        if (Math.abs(s.vx) < 60) s.vx = (s.vx < 0 ? -1 : 1) * 60
        s.flash = .3
        s.kick = 0
      }
      s.peak = Math.max(s.peak, s.y)
      // 기본 화면을 벗어난 뒤에만 공을 추적하고, 하강하면 지상 시점으로 돌아옵니다.
      if (s.y > GROUND - R) s.following = true
      const cameraTarget = s.following ? Math.max(0, s.y - (GROUND - 180)) : 0
      s.camera += (cameraTarget - s.camera) * Math.min(1, dt * 12)
      if (cameraTarget === 0 && s.camera < .5) { s.camera = 0; s.following = false }
      if (s.y <= R) finish(s)
      s.kick = Math.max(0, s.kick - dt)
      s.kickPose = Math.max(0, s.kickPose - dt)
      s.cooldown = Math.max(0, s.cooldown - dt)
      s.flash = Math.max(0, s.flash - dt)
      s.trail.push({ x: s.x, y: s.y }); if (s.trail.length > 18) s.trail.shift()
    }
    const draw = (time) => {
      const s = stateRef.current, layer = layerAt(altitude(s.camera))
      const gradient = ctx.createLinearGradient(0, 0, 0, H)
      gradient.addColorStop(0, layer.top); gradient.addColorStop(1, layer.bottom)
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, W, H)
      const skyHeight = altitude(s.camera)
      const glow = ctx.createRadialGradient(370, 95, 4, 370, 95, 210)
      glow.addColorStop(0, skyHeight < 50000 ? '#ffe9a94d' : '#ad83ff25'); glow.addColorStop(1, '#ffffff00')
      ctx.fillStyle = glow; ctx.fillRect(28, 0, W - 56, H)
      if (skyHeight < 50000) {
        ctx.fillStyle = '#fff0c5'; ctx.beginPath(); ctx.arc(370, 95, 22, 0, Math.PI * 2); ctx.fill()
      } else {
        ctx.save(); ctx.translate(365, 115)
        const planet = ctx.createRadialGradient(-14, -18, 2, 0, 0, 48)
        planet.addColorStop(0, '#ddd4fb'); planet.addColorStop(.55, '#7e82bc'); planet.addColorStop(1, '#303b69')
        ctx.fillStyle = planet; ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill()
        ctx.strokeStyle = '#cbc2ff55'; ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, 0, 66, 12, -.4, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
      }
      const high = altitude(s.camera) > 50000
      for (let i = 0; i < (high ? 65 : 9); i++) {
        const x = (i * 137 + 29) % W, y = ((i * 83 + s.camera * (high ? .03 : .18)) % (H + 100)) - 50
        ctx.fillStyle = high ? `rgba(255,255,255,${.35 + (i % 4) * .15})` : 'rgba(255,255,255,.18)'
        ctx.beginPath(); ctx.ellipse(x, y, high ? 1.4 : 42, high ? 1.4 : 10, 0, 0, Math.PI * 2); ctx.fill()
        if (!high) { ctx.beginPath(); ctx.ellipse(x - 13, y - 6, 19, 13, 0, 0, Math.PI * 2); ctx.ellipse(x + 12, y - 8, 24, 17, 0, 0, Math.PI * 2); ctx.fill() }
      }
      if (altitude(s.camera) > 85000) {
        for (let ribbon = 0; ribbon < 3; ribbon++) {
          ctx.strokeStyle = ['#67ffd724', '#a282ff20', '#8df4d718'][ribbon]; ctx.lineWidth = 22 + ribbon * 14
          ctx.beginPath(); ctx.moveTo(28, 180 + ribbon * 28); ctx.bezierCurveTo(150, 100 + Math.sin(time * .0003) * 30, 210, 260 + ribbon * 25, W - 28, 120); ctx.stroke()
        }
      }
      // 경기장은 지면과 함께 카메라 밖으로 사라집니다.
      const stadiumY = GROUND + s.camera
      if (stadiumY - 170 < H) {
        ctx.save(); ctx.translate(0, stadiumY)
        ctx.fillStyle = '#17384d'; ctx.beginPath(); ctx.moveTo(28, -155); ctx.quadraticCurveTo(240, -104, W - 28, -155); ctx.lineTo(W - 28, 0); ctx.lineTo(28, 0); ctx.fill()
        for (let row = 0; row < 4; row++) {
          ctx.fillStyle = row % 2 ? '#294e65' : '#224257'; ctx.fillRect(28, -104 + row * 22, W - 56, 20)
          for (let col = 0; col < 38; col++) { ctx.fillStyle = ['#a987c7', '#bad3d5', '#7fa8a9', '#c4ba8c'][(col * 7 + row) % 4]; ctx.beginPath(); ctx.arc(34 + col * 11, -94 + row * 22, 2.2, 0, Math.PI * 2); ctx.fill() }
        }
        ctx.strokeStyle = '#c7ddea66'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(28, -155); ctx.quadraticCurveTo(240, -104, W - 28, -155); ctx.stroke()
        for (const x of [55, W - 55]) {
          ctx.fillStyle = '#7c98ab'; ctx.fillRect(x - 2, -228, 4, 112)
          ctx.fillStyle = '#e3f8ed'; ctx.fillRect(x - 16, -232, 32, 10)
          const lamp = ctx.createRadialGradient(x, -227, 0, x, -227, 65); lamp.addColorStop(0, '#ebfff93d'); lamp.addColorStop(1, '#ebfff900'); ctx.fillStyle = lamp; ctx.fillRect(x - 65, -292, 130, 130)
        }
        ctx.restore()
      }
      ctx.fillStyle = '#071725aa'; ctx.fillRect(0, 0, 28, H); ctx.fillRect(W - 28, 0, 28, H)
      ctx.strokeStyle = s.flash > 0 ? '#d7ff87' : '#82daca77'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(28, 0); ctx.lineTo(28, H); ctx.moveTo(W - 28, 0); ctx.lineTo(W - 28, H); ctx.stroke()
      const interval = 120
      for (let y = Math.floor(s.camera / interval) * interval; y < s.camera + H; y += interval) {
        const sy = GROUND - (y - s.camera)
        ctx.fillStyle = '#c3e9eb99'; ctx.font = '10px sans-serif'; ctx.fillText(formatHeight(altitude(y)), 34, sy)
        ctx.fillRect(W - 38, sy, 10, 1)
      }
      const groundY = GROUND + s.camera
      if (groundY < H) {
        ctx.fillStyle = '#32815c'; ctx.fillRect(28, groundY, W - 56, H)
        for (let stripe = 0; stripe < 8; stripe++) { ctx.fillStyle = stripe % 2 ? '#286d4c' : '#32815c'; ctx.fillRect(28 + stripe * 53, groundY, 53, H) }
        ctx.fillStyle = '#c7efdc'; ctx.fillRect(28, groundY + 2, W - 56, 2)
        ctx.strokeStyle = '#c7efdc55'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(W / 2, groundY + 28, 68, 14, 0, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = '#07172544'; ctx.beginPath(); ctx.ellipse(s.x, groundY + 5, Math.max(4, 18 - s.y / 35), 3, 0, 0, Math.PI * 2); ctx.fill()
      }
      s.trail.forEach((p, i) => {
        ctx.fillStyle = `rgba(220,255,163,${i / s.trail.length * .22})`
        ctx.beginPath(); ctx.arc(p.x, GROUND - (p.y - s.camera), R * i / s.trail.length, 0, Math.PI * 2); ctx.fill()
      })
      const by = GROUND - (s.y - s.camera)
      if (s.event && s.event.remaining < 3.2) {
        ctx.save()
        if (s.event.type === 0) {
          ctx.strokeStyle = '#b9f3ff65'; ctx.lineWidth = 2
          for (let i = 0; i < 9; i++) { const x = ((time * .14 * s.event.direction + i * 97) % W + W) % W, y = 80 + i * 56; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + s.event.direction * 25, y - 7, x + s.event.direction * 60, y); ctx.stroke() }
        } else if (s.event.type === 1) {
          // 공의 윤곽과 선수 핀은 숨기지 않고 주변 시야만 좁힙니다.
          const fog = ctx.createRadialGradient(s.x, by, 35, s.x, by, 240)
          fog.addColorStop(0, '#d6d9ec00'); fog.addColorStop(.45, '#d6d9ec35'); fog.addColorStop(1, '#d6d9ecb0')
          ctx.fillStyle = fog; ctx.fillRect(28, 0, W - 56, H)
        } else {
          const progress = Math.max(0, Math.min(1, (3.2 - s.event.remaining) / 1.2))
          const startX = s.event.direction > 0 ? 28 : W - 28
          const rockX = startX + (s.x - startX) * progress, rockY = by - 120 * (1 - progress)
          ctx.strokeStyle = '#ffca9c99'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(rockX - s.event.direction * 30, rockY - 16); ctx.lineTo(rockX, rockY); ctx.stroke()
          if (!s.event.hit) { ctx.fillStyle = '#bca59a'; ctx.beginPath(); ctx.moveTo(rockX - 10, rockY - 5); ctx.lineTo(rockX + 3, rockY - 11); ctx.lineTo(rockX + 12, rockY + 3); ctx.lineTo(rockX - 3, rockY + 10); ctx.closePath(); ctx.fill() }
        }
        ctx.restore()
      }
      // 선수의 좌표는 지면 기준이며 카메라만 이동합니다.
      ctx.save(); ctx.translate(s.footX, groundY)
      const kicking = s.kickPose > 0
      ctx.fillStyle = '#07172544'; ctx.beginPath(); ctx.ellipse(0, 0, 35, 7, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#e4ae87'; ctx.lineWidth = 10; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(-17, -83); ctx.lineTo(-27, -55); ctx.moveTo(17, -83); ctx.lineTo(28, -66); ctx.stroke()
      const jersey = ctx.createLinearGradient(-21, 0, 21, 0); jersey.addColorStop(0, '#6942a7'); jersey.addColorStop(.45, '#b18af0'); jersey.addColorStop(1, '#7952bc')
      ctx.fillStyle = jersey; ctx.beginPath(); ctx.roundRect(-21, -94, 42, 47, 9); ctx.fill()
      ctx.fillStyle = '#b891f0'; ctx.beginPath(); ctx.roundRect(-26, -93, 13, 17, 4); ctx.roundRect(13, -93, 13, 17, 4); ctx.fill()
      ctx.strokeStyle = '#e4f7b2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-7, -93); ctx.lineTo(0, -85); ctx.lineTo(7, -93); ctx.stroke()
      ctx.fillStyle = '#d9ff7c'; ctx.fillRect(-15, -82, 5, 6)
      ctx.strokeStyle = '#e8d7ff40'; ctx.lineWidth = 1; for (const x of [-10, 0, 10]) { ctx.beginPath(); ctx.moveTo(x, -77); ctx.lineTo(x, -50); ctx.stroke() }
      ctx.fillStyle = '#effff6'; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('10', 0, -59)
      ctx.fillStyle = '#20213b'; ctx.beginPath(); ctx.roundRect(-20, -49, 40, 18, 4); ctx.fill()
      ctx.fillStyle = '#b18af0'; ctx.fillRect(-19, -46, 3, 13); ctx.fillRect(16, -46, 3, 13)
      ctx.strokeStyle = '#e4ae87'; ctx.lineWidth = 11
      for (const side of [-1, 1]) {
        const raised = kicking && s.kickSide === side
        const legX = side * (raised ? 18 : 14)
        ctx.strokeStyle = '#e4ae87'; ctx.lineWidth = 11
        ctx.beginPath(); ctx.moveTo(side * 11, -32); ctx.lineTo(legX, raised ? -48 : -18); ctx.stroke()
        ctx.strokeStyle = '#f1f5ff'; ctx.lineWidth = 10
        ctx.beginPath(); ctx.moveTo(legX, raised ? -48 : -18); ctx.lineTo(legX, raised ? -40 : -7); ctx.stroke()
        ctx.fillStyle = '#d9ff7c'; ctx.beginPath(); ctx.roundRect(legX - (raised ? 32 : 14), raised ? -KICK_HEIGHT : -8, raised ? 64 : 28, 8, 3); ctx.fill()
        const shoeY = raised ? -KICK_HEIGHT : -8, shoeWidth = raised ? 64 : 28
        ctx.fillStyle = '#244133'; ctx.fillRect(legX - shoeWidth / 2 + 2, shoeY + 6, shoeWidth - 4, 3)
        ctx.strokeStyle = '#526a39'; ctx.lineWidth = 1; for (let lace = -5; lace <= 5; lace += 5) { ctx.beginPath(); ctx.moveTo(legX + lace, shoeY + 1); ctx.lineTo(legX + lace + 3, shoeY + 5); ctx.stroke() }
      }
      ctx.fillStyle = '#e4ae87'; ctx.beginPath(); ctx.arc(0, -111, 17, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#d99a77'; ctx.beginPath(); ctx.ellipse(0, -105, 13, 10, 0, 0, Math.PI); ctx.fill()
      ctx.fillStyle = '#222231'; ctx.beginPath(); ctx.arc(0, -115, 17, Math.PI, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#222231'; ctx.fillRect(-8, -112, 3, 3); ctx.fillRect(6, -112, 3, 3)
      ctx.strokeStyle = '#905a49'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, -108, 5, .25, Math.PI - .25); ctx.stroke()
      if (s.camera === 0 && s.status === 'playing') { ctx.fillStyle = '#ffffffba'; ctx.font = '11px sans-serif'; ctx.fillText(kicking ? 'KICK!' : '좌클릭 / 우클릭', 0, 25) }
      ctx.restore()
      // 공은 선수보다 앞에서 보이도록 마지막에 그립니다.
      ctx.save(); ctx.translate(s.x, by); ctx.rotate(time * .002 * Math.sign(s.vx))
      ctx.shadowColor = '#dfff92'; ctx.shadowBlur = s.flash > 0 ? 22 : 7
      const ballShade = ctx.createRadialGradient(-5, -6, 1, 2, 3, R + 2)
      ballShade.addColorStop(0, '#ffffff'); ballShade.addColorStop(.6, '#eaf0ed'); ballShade.addColorStop(1, '#8baba7')
      ctx.fillStyle = ballShade; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill()
      ctx.shadowBlur = 0; ctx.fillStyle = '#18282c'; ctx.beginPath()
      for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; const x = Math.cos(a) * 7, y = Math.sin(a) * 7; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y) }
      ctx.closePath(); ctx.fill()
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.clip()
      ctx.strokeStyle = '#738e91'; ctx.lineWidth = .7
      for (let i = 0; i < 5; i++) {
        const a = i * Math.PI * 2 / 5 - Math.PI / 2
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 7, Math.sin(a) * 7); ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); ctx.stroke()
        ctx.fillStyle = '#203339'; ctx.beginPath(); ctx.arc(Math.cos(a) * 17, Math.sin(a) * 17, 5, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore(); ctx.fillStyle = '#ffffff8a'; ctx.beginPath(); ctx.ellipse(-5, -7, 4, 2, -.5, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      if (groundY > H && s.status !== 'ready') {
        // 지상에 남은 선수의 실제 가로 위치를 화면 하단에 표시합니다.
        ctx.save(); ctx.translate(s.footX, H - 22)
        ctx.fillStyle = '#12192ee8'; ctx.beginPath(); ctx.roundRect(-29, -38, 58, 32, 10); ctx.fill()
        ctx.strokeStyle = '#d9ff7c'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#d9ff7c'; ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(7, -6); ctx.lineTo(0, 3); ctx.closePath(); ctx.fill()
        ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('선수 ↓', 0, -18)
        ctx.restore()
      }
      if (s.event) {
        const hazard = hazards[s.event.type]
        ctx.save(); ctx.fillStyle = '#101b30e6'; ctx.beginPath(); ctx.roundRect(80, 18, W - 160, 52, 12); ctx.fill()
        ctx.fillStyle = hazard.color; ctx.textAlign = 'center'; ctx.font = 'bold 13px sans-serif'
        ctx.fillText(`${s.event.remaining > 3.2 ? '곧 발생 · ' : ''}${hazard.name}${s.event.type === 0 ? s.event.direction > 0 ? ' →' : ' ←' : ''}`, W / 2, 39)
        ctx.fillStyle = '#dce5ef'; ctx.font = '10px sans-serif'; ctx.fillText(hazard.hint, W / 2, 57); ctx.restore()
      }
    }
    const loop = (time) => {
      const elapsed = previous ? Math.min((time - previous) / 1000, .05) : 0
      previous = time; accumulator += elapsed
      while (accumulator >= 1 / 120) { step(1 / 120); accumulator -= 1 / 120 }
      draw(time)
      if (time - hudTime > 100) { publish(); hudTime = time }
      frame = requestAnimationFrame(loop)
    }
    const visibility = () => { if (document.hidden && stateRef.current.status === 'playing') { stateRef.current.status = 'paused'; publish() } }
    window.addEventListener('resize', resize); document.addEventListener('visibilitychange', visibility)
    frame = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility) }
  }, [])
  const moveFoot = (event) => {
    const rect = canvasRef.current.getBoundingClientRect(), s = stateRef.current
    s.footX = Math.max(PLAYER_MIN, Math.min(PLAYER_MAX, (event.clientX - rect.left) / rect.width * W))
  }
  return <main ref={pageRef} className={`trapping-page${guideOpen ? ' trapping-page--guide-open' : ''}`}>
    <header className="trapping-heading"><a href="#/plug/minigames">← 미니게임</a><h1>스카이 트래핑</h1><button className="trapping-guide-toggle" type="button" aria-expanded={guideOpen} aria-controls="trapping-guide" onClick={() => setGuideOpen(!guideOpen)}>{guideOpen ? '설명 닫기' : '게임 설명'}</button></header>
    <div className="trapping-layout">
      <section ref={arenaRef} className={`trapping-arena${fullscreen ? ' trapping-arena--fullscreen' : ''}`} aria-label="트래핑 게임">
        <div className="trapping-hud"><div><small>최고 고도</small><strong>{formatHeight(hud.height)}</strong></div><div><small>터치</small><strong>{hud.hits}</strong></div><div><small>중력</small><strong>×{hud.speed.toFixed(1)}</strong></div></div>
        <div className="trapping-canvas-wrap">
          <canvas ref={canvasRef} tabIndex={0} aria-label="마우스나 방향키로 지상의 선수를 좌우 이동하고 공이 발에 닿을 때 좌클릭 또는 Z로 왼발, 우클릭 또는 X로 오른발을 사용하세요. 터치는 공 방향에 맞는 발을 사용합니다."
            onContextMenu={(event) => event.preventDefault()}
            onPointerMove={moveFoot} onPointerDown={(event) => { if (event.pointerType === 'mouse' && ![0, 2].includes(event.button)) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus(); moveFoot(event); kick(event.button === 2 ? 1 : event.pointerType !== 'mouse' && stateRef.current.x >= stateRef.current.footX ? 1 : -1) }}
            onKeyDown={(event) => { const s = stateRef.current; if (['ArrowLeft', 'ArrowRight'].includes(event.key)) { event.preventDefault(); s.footX = Math.max(PLAYER_MIN, Math.min(PLAYER_MAX, s.footX + (event.key === 'ArrowLeft' ? -24 : 24))) } if (['KeyZ', 'KeyX'].includes(event.code)) { event.preventDefault(); if (!event.repeat) kick(event.code === 'KeyX' ? 1 : -1) } if (event.code === 'KeyP' && !event.repeat) togglePause() }} />
          {hud.status !== 'playing' && <div className="trapping-overlay"><span>{hud.status === 'over' ? 'FINAL ALTITUDE' : hud.status === 'paused' ? 'TIME OUT' : 'READY TO FLY?'}</span><h2>{hud.status === 'over' ? formatHeight(hud.height) : hud.status === 'paused' ? '잠깐 쉬어가기' : '공을 우주까지'}</h2><p>{hud.status === 'over' ? `${hud.hits}번의 킥 · ${layerAt(hud.height).name}` : '선수를 공 아래로 옮기고 발에 내려올 때 클릭·터치로 킥하세요.'}</p><button type="button" onClick={hud.status === 'paused' ? togglePause : start}>{hud.status === 'paused' ? '계속하기' : hud.status === 'over' ? '다시 도전' : '킥오프'}</button></div>}
        </div>
        <div className="trapping-stage"><span>{layerAt(hud.height).name}</span><div className="trapping-stage-actions"><button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? '전체화면 종료' : '게임 전체화면으로 보기'}>{fullscreen ? '↙ 화면 복귀' : '⛶ 전체화면'}</button><button type="button" onClick={togglePause} disabled={!['playing', 'paused'].includes(hud.status)}>{hud.status === 'paused' ? '계속하기' : '일시정지'}</button></div></div>
      </section>
      <aside id="trapping-guide" className="trapping-guide"><p className="trapping-guide-label">FLIGHT LOG</p><h2>발끝에서 우주까지</h2><p>축구복을 입은 선수는 항상 지면에 있습니다. 마우스나 손가락으로 좌우 이동하고, 공이 발에 내려오는 타이밍에 좌클릭으로 왼발, 우클릭으로 오른발을 사용하세요. 모바일 터치는 공 방향에 맞는 발을 사용합니다. 킥 동작은 0.18초 동안 유지됩니다.</p><p>벽에 맞으면 공이 튕기고, 킥에 성공할수록 높이 올라갑니다. 공이 기본 화면 위를 벗어나면 카메라가 따라가며, 내려오면 지상으로 돌아옵니다. 고도에 따라 중력이 최대 6배까지 강해지고 공을 바닥에 떨어뜨리면 끝납니다. 현재 고도 30km부터 확률로 돌풍·짙은 구름이 발생하며, 우주에서는 잔해가 날아옵니다. 이벤트는 1초 전에 예고하고 30km 아래에서는 끝납니다.</p><strong className="trapping-best">내 최고 기록 <span>{formatHeight(hud.best)}</span></strong><ol>{layers.filter((layer) => layer.at > 0).map((layer) => <li key={layer.at} className={hud.height >= layer.at ? 'reached' : ''}><span>{layer.name}</span><small>{formatHeight(layer.at)}</small></li>)}</ol><small>좌우 방향키: 이동 · Z: 왼발 · X: 오른발 · P: 일시정지<br />게임용 고도·중력 연출입니다.</small></aside>
    </div>
  </main>
}
