import { useEffect, useRef, useState } from 'react'
import '../css/ChatbotWidget.css'

const BUTTON_SIZE = 56
const EDGE = 16
const STORAGE_KEY = 'plugin_chatbot_position'
const SCORE_PATTERN = /\d{1,2}\s*(?:대|:)\s*\d{1,2}/

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function initialPosition() {
  const fallback = {
    x: Math.max(EDGE, window.innerWidth - BUTTON_SIZE - 24),
    y: Math.max(EDGE, window.innerHeight - BUTTON_SIZE - 24),
  }
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (Number.isFinite(stored?.x) && Number.isFinite(stored?.y)) {
      return {
        x: clamp(stored.x, EDGE, Math.max(EDGE, window.innerWidth - BUTTON_SIZE - EDGE)),
        y: clamp(stored.y, EDGE, Math.max(EDGE, window.innerHeight - BUTTON_SIZE - EDGE)),
      }
    }
  } catch {
    // 저장된 위치를 읽을 수 없으면 기본 위치를 사용합니다.
  }
  return fallback
}

// 여러 경기 결과를 날짜·점수·승리 팀으로 나누어 표시합니다.
function renderMessageContent(text) {
  const lines = text.split('\n')
  if (lines.length < 2 || !lines.slice(1).every((line) => line.startsWith('- '))) return text

  return <>
    <strong className="chatbot-widget__result-title">{lines[0]}</strong>
    <ul className="chatbot-widget__result-list">
      {lines.slice(1).map((line, index) => {
        const item = line.slice(2)
        const dated = item.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2})\s+(.+)$/)
        const date = dated?.[1]
        const detail = dated?.[2] || item
        const winner = detail.match(/\s+\(승리:\s*(.+)\)$/)
        const matchup = winner ? detail.slice(0, winner.index) : detail
        return <li key={index}>
          {date && <time dateTime={date.replace(' ', 'T')}>{date}</time>}
          <span className="chatbot-widget__result-match">
            {matchup.split(/(\d{1,2}:\d{1,2})/).map((part, partIndex) =>
              /^\d{1,2}:\d{1,2}$/.test(part)
                ? <b key={partIndex}>{part}</b>
                : <span key={partIndex}>{part}</span>,
            )}
          </span>
          {winner && <small>승리 · {winner[1]}</small>}
        </li>
      })}
    </ul>
  </>
}

export default function ChatbotWidget() {
  const [position, setPosition] = useState(initialPosition)
  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 })
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '안녕하세요! 프리미어리그에 대해 궁금한 점을 물어보세요.' },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const drag = useRef(null)
  const panelDrag = useRef(null)
  const ignoreClick = useRef(false)
  const bottomRef = useRef(null)

  // 창 크기가 바뀌어도 플로팅 버튼을 화면 안에 유지합니다.
  useEffect(() => {
    const onResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight })
      setPosition((current) => ({
        x: clamp(current.x, EDGE, Math.max(EDGE, window.innerWidth - BUTTON_SIZE - EDGE)),
        y: clamp(current.y, EDGE, Math.max(EDGE, window.innerHeight - BUTTON_SIZE - EDGE)),
      }))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // 새 질문과 답변이 추가되면 대화의 마지막으로 이동합니다.
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, loading, open])

  const onPointerDown = (event) => {
    if (event.button !== 0) return
    ignoreClick.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      x: position.x,
      y: position.y,
      left: panelLeft,
      top: panelTop,
      moved: false,
    }
  }

  const onPointerMove = (event) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    const dx = event.clientX - current.startX
    const dy = event.clientY - current.startY
    if (!current.moved && Math.hypot(dx, dy) < 6) return
    current.moved = true
    if (open) {
      moveTogether(current, dx, dy)
    } else {
      setPosition({
        x: clamp(current.x + dx, EDGE, Math.max(EDGE, viewport.width - BUTTON_SIZE - EDGE)),
        y: clamp(current.y + dy, EDGE, Math.max(EDGE, viewport.height - BUTTON_SIZE - EDGE)),
      })
    }
  }

  const onPointerUp = (event) => {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (current.moved) {
      const next = open ? moveTogether(current,
        event.clientX - current.startX, event.clientY - current.startY) : {
        x: clamp(current.x + event.clientX - current.startX, EDGE, Math.max(EDGE, viewport.width - BUTTON_SIZE - EDGE)),
        y: clamp(current.y + event.clientY - current.startY, EDGE, Math.max(EDGE, viewport.height - BUTTON_SIZE - EDGE)),
      }
      setPosition(next)
      ignoreClick.current = true
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // 저장이 차단돼도 현재 페이지의 버튼 이동은 유지합니다.
      }
    }
    drag.current = null
  }

  const toggle = () => {
    if (ignoreClick.current) {
      ignoreClick.current = false
      return
    }
    setOpen((current) => !current)
  }

  const sendQuestion = async (event) => {
    event.preventDefault()
    const text = question.trim()
    if (!text || loading) return
    setMessages((current) => [...current, { role: 'user', text }])
    setQuestion('')
    setError('')
    setLoading(true)
    try {
      const scoreContext = messages.filter((message) => message.role === 'user')
        .slice(-4).reverse().map((message) => message.text.match(SCORE_PATTERN)?.[0])
        .find(Boolean) || ''
      const response = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, pagePath: window.location.pathname, scoreContext }),
      })
      const isJson = response.headers.get('content-type')?.includes('application/json')
      const result = isJson ? await response.json() : null
      if (!response.ok || typeof result?.data !== 'string' || !result.data.trim()) {
        throw new Error(result?.message || '답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.')
      }
      setMessages((current) => [...current, { role: 'assistant', text: result.data }])
    } catch (exception) {
      setError(exception.message || '답변을 가져오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const panelWidth = Math.min(360, viewport.width - 24)
  const panelHeight = Math.min(480, viewport.height - 100)
  const basePanelLeft = clamp(position.x + BUTTON_SIZE - panelWidth, 12, viewport.width - panelWidth - 12)
  const basePanelTop = position.y >= panelHeight + 12
    ? position.y - panelHeight - 12
    : clamp(position.y + BUTTON_SIZE + 12, 12, viewport.height - panelHeight - 12)
  const panelLeft = clamp(basePanelLeft + panelOffset.x, 12, viewport.width - panelWidth - 12)
  const panelTop = clamp(basePanelTop + panelOffset.y, 12, viewport.height - panelHeight - 12)

  // 열린 창과 X 버튼을 같은 거리만큼 함께 이동합니다.
  const moveTogether = (current, deltaX, deltaY) => {
    const dx = clamp(deltaX,
      Math.max(EDGE - current.x, 12 - current.left),
      Math.min(viewport.width - BUTTON_SIZE - EDGE - current.x,
        viewport.width - panelWidth - 12 - current.left))
    const dy = clamp(deltaY,
      Math.max(EDGE - current.y, 12 - current.top),
      Math.min(viewport.height - BUTTON_SIZE - EDGE - current.y,
        viewport.height - panelHeight - 12 - current.top))
    const next = { x: current.x + dx, y: current.y + dy }
    const nextBaseLeft = clamp(next.x + BUTTON_SIZE - panelWidth, 12, viewport.width - panelWidth - 12)
    const nextBaseTop = next.y >= panelHeight + 12
      ? next.y - panelHeight - 12
      : clamp(next.y + BUTTON_SIZE + 12, 12, viewport.height - panelHeight - 12)
    setPosition(next)
    setPanelOffset({
      x: current.left + dx - nextBaseLeft,
      y: current.top + dy - nextBaseTop,
    })
    return next
  }

  // 열린 창의 제목 표시줄을 끌면 창을 화면 안에서 이동합니다.
  const onPanelPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest('button')) return
    event.currentTarget.setPointerCapture(event.pointerId)
    panelDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      left: panelLeft,
      top: panelTop,
      x: position.x,
      y: position.y,
    }
  }

  const movePanel = (event) => {
    const current = panelDrag.current
    if (!current || current.pointerId !== event.pointerId) return
    return moveTogether(current, event.clientX - current.startX, event.clientY - current.startY)
  }

  const onPanelPointerUp = (event) => {
    const next = movePanel(event)
    if (next) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // 저장이 차단돼도 현재 페이지의 이동 위치는 유지합니다.
      }
    }
    panelDrag.current = null
  }

  return <>
    {open && <section
      className="chatbot-widget__panel"
      style={{ left: panelLeft, top: panelTop, width: panelWidth, height: panelHeight }}
      aria-label="EPL 챗봇"
    >
      <header
        className="chatbot-widget__header"
        onPointerDown={onPanelPointerDown}
        onPointerMove={movePanel}
        onPointerUp={onPanelPointerUp}
        onPointerCancel={() => { panelDrag.current = null }}
      >
        <div><strong>EPL 챗봇</strong><small>프리미어리그 질문을 해보세요</small></div>
        <button type="button" onClick={() => setOpen(false)} aria-label="챗봇 닫기">×</button>
      </header>
      <div className="chatbot-widget__messages" aria-live="polite">
        {messages.map((message, index) => <div
          className={`chatbot-widget__message chatbot-widget__message--${message.role}${message.role === 'assistant' && message.text.includes('\n- ') ? ' chatbot-widget__message--list' : ''}`}
          key={index}
        >{renderMessageContent(message.text)}</div>)}
        {loading && <p className="chatbot-widget__pending">답변을 작성하고 있습니다...</p>}
        <div ref={bottomRef} />
      </div>
      {error && <p className="chatbot-widget__error" role="alert">{error}</p>}
      <form className="chatbot-widget__form" onSubmit={sendQuestion}>
        <label className="chatbot-widget__sr-only" htmlFor="chatbot-question">EPL 질문</label>
        <input
          id="chatbot-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="EPL에 대해 질문하세요"
          maxLength={1000}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !question.trim()}>전송</button>
      </form>
    </section>}
    <button
      type="button"
      className="chatbot-widget__launcher"
      style={{ left: position.x, top: position.y }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => { drag.current = null }}
      onClick={toggle}
      aria-label={open ? 'EPL 챗봇 닫기' : 'EPL 챗봇 열기'}
      aria-expanded={open}
    >
      <span aria-hidden="true">{open ? '×' : '⚽'}</span>
    </button>
  </>
}
