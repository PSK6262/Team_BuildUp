import { useEffect, useRef, useState } from 'react'
import '../../css/MatchFilters.css'

function ClubEmblem({ team }) {
  const [failed, setFailed] = useState(false)
  return <span className="match-club-emblem" aria-hidden="true">
    {team?.emblemUrl && !failed
      ? <img src={team.emblemUrl} alt="" onError={() => setFailed(true)} />
      : <span>{team ? (team.teamNameKor || team.teamName).slice(0, 1) : '⚽'}</span>}
  </span>
}

export function MatchClubPicker({ teams, value, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const triggerRef = useRef(null)
  const selected = teams.find(team => String(team.teamId) === String(value))

  useEffect(() => {
    if (!open) return
    const onPointerDown = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  function choose(id) {
    onChange(String(id))
    setOpen(false)
    triggerRef.current?.focus()
  }

  return <div className="match-club-picker" ref={rootRef}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}
    onKeyDown={event => {
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }}>
    <button type="button" ref={triggerRef} className="match-club-trigger"
      aria-expanded={open} aria-controls="match-club-options" onClick={() => setOpen(current => !current)}>
      <ClubEmblem key={selected?.teamId ?? 'ALL'} team={selected} />
      <span className="match-club-trigger-text"><small>구단 선택</small><strong>{selected?.teamNameKor || selected?.teamName || '전체 구단'}</strong></span>
      <svg className="match-club-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
    </button>
    {open && <div className="match-club-options" id="match-club-options" role="group" aria-label="경기를 확인할 구단 선택">
      <div className="match-club-options-heading"><strong>응원하는 구단을 선택하세요</strong><span>{teams.length}개 구단</span></div>
      <div className="match-club-grid">
        <button type="button" className="match-club-option match-club-option--all" aria-pressed={value === 'ALL'} onClick={() => choose('ALL')}>
          <ClubEmblem /><span>전체 구단</span><span className="match-club-check" aria-hidden="true">{value === 'ALL' ? '✓' : ''}</span>
        </button>
        {teams.map(team => {
          const active = String(team.teamId) === String(value)
          return <button type="button" key={team.teamId} className="match-club-option" aria-pressed={active} onClick={() => choose(team.teamId)}>
            <ClubEmblem team={team} /><span>{team.teamNameKor || team.teamName}</span><span className="match-club-check" aria-hidden="true">{active ? '✓' : ''}</span>
          </button>
        })}
      </div>
    </div>}
  </div>
}

function MatchPeriodPicker({ value, onChange, items, unit }) {
  const maxStart = Math.max(0, items.length - 5)
  const [start, setStart] = useState(() => Math.min(maxStart, Math.floor(Math.max(0, items.findIndex(item => item.id === value)) / 5) * 5))
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  const move = direction => setStart(current => Math.max(0, Math.min(maxStart, current + direction * 5)))
  return <section className="match-round-picker" aria-label={`${unit}별 일정 필터`}>
    <div className="month-filter-nav match-round-controls"
      onTouchStart={event => {
        suppressClick.current = false
        const touch = event.touches[0]
        gesture.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY, vertical: false } : null
      }}
      onTouchMove={event => {
        const origin = gesture.current
        if (!origin) return
        if (event.touches.length !== 1) { gesture.current = null; suppressClick.current = true; return }
        const dx = event.touches[0].clientX - origin.x
        const dy = event.touches[0].clientY - origin.y
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) suppressClick.current = true
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) origin.vertical = true
      }}
      onTouchEnd={event => {
        const origin = gesture.current
        gesture.current = null
        if (!origin || origin.vertical || event.touches.length) return
        const dx = event.changedTouches[0].clientX - origin.x
        const dy = event.changedTouches[0].clientY - origin.y
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          suppressClick.current = true
          move(dx < 0 ? 1 : -1)
        }
      }}
      onTouchCancel={() => { gesture.current = null; suppressClick.current = true }}
      onClickCapture={event => {
        if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation() }
        suppressClick.current = false
      }}>
      <button type="button" className={`month-filter-btn match-round-all ${value === 'ALL' ? 'active' : ''}`} aria-label={`전체 ${unit}`} aria-pressed={value === 'ALL'} onClick={() => onChange('ALL')}>전체</button>
      <button type="button" className="month-filter-btn match-round-arrow" aria-label={`이전 5개 ${unit}`} disabled={start === 0} onClick={() => move(-1)}>‹</button>
      <div className="match-round-window" role="group" aria-label={`${items[start].label}부터 ${items[start + 4].label}`}>
        <div className="match-round-track" style={{ transform: `translateX(calc(${start} * (100% + var(--round-gap)) / -5))` }}>
          {items.map((item, index) => {
            const visible = index >= start && index < start + 5
            return <button type="button" key={item.id}
              className={`month-filter-btn match-round-choice ${value === item.id ? 'active' : ''}`} aria-pressed={value === item.id}
              aria-hidden={!visible} tabIndex={visible ? 0 : -1}
              onClick={() => onChange(item.id)}>{item.label}</button>
          })}
        </div>
      </div>
      <button type="button" className="month-filter-btn match-round-arrow" aria-label={`다음 5개 ${unit}`} disabled={start === maxStart} onClick={() => move(1)}>›</button>
    </div>
    <p className="match-round-range" aria-live="polite">{items[start].label}–{items[start + 4].label} / {items.length}개 {unit}</p>
  </section>
}

const ROUND_ITEMS = Array.from({ length: 38 }, (_, index) => ({ id: index + 1, label: `${index + 1}R` }))

export function MatchRoundPicker({ value, onChange }) {
  return <MatchPeriodPicker value={value} onChange={onChange} items={ROUND_ITEMS} unit="라운드" />
}

export function MatchMonthPicker({ value, onChange, months }) {
  return <MatchPeriodPicker value={value} onChange={onChange} items={months.filter(month => month.id !== 'ALL')} unit="월" />
}
