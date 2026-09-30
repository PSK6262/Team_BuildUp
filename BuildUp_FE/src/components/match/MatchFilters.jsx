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

export function MatchRoundPicker({ value, onChange }) {
  const [start, setStart] = useState(() => value === 'ALL' ? 0 : Math.min(33, Math.floor((Number(value) - 1) / 5) * 5))
  return <section className="match-round-picker" aria-label="라운드별 일정 필터">
    <div className="match-round-heading">
      <button type="button" className="match-round-all" aria-pressed={value === 'ALL'} onClick={() => onChange('ALL')}>전체 라운드</button>
      <span>{value === 'ALL' ? '전체 선택' : `${value}R 선택`}</span>
    </div>
    <div className="match-round-controls">
      <button type="button" className="match-round-arrow" aria-label="이전 5개 라운드" disabled={start === 0} onClick={() => setStart(current => Math.max(0, current - 5))}>‹</button>
      <div className="match-round-window" role="group" aria-label={`${start + 1}부터 ${start + 5}라운드`}>
        <div className="match-round-track" style={{ transform: `translateX(calc(${start} * (100% + var(--round-gap)) / -5))` }}>
          {Array.from({ length: 38 }, (_, index) => index + 1).map(round => {
            const visible = round > start && round <= start + 5
            return <button type="button" key={round}
              className="match-round-choice" aria-pressed={Number(value) === round}
              aria-hidden={!visible} tabIndex={visible ? 0 : -1}
              onPointerDown={event => {
                // Select before the moving button leaves the pointer on release.
                if (event.isPrimary && event.button === 0) onChange(round)
              }}
              onClick={event => {
                // Keyboard and assistive-technology activation has no pointer press.
                if (event.detail === 0) onChange(round)
              }}>{round}R</button>
          })}
        </div>
      </div>
      <button type="button" className="match-round-arrow" aria-label="다음 5개 라운드" disabled={start === 33} onClick={() => setStart(current => Math.min(33, current + 5))}>›</button>
    </div>
    <p className="match-round-range" aria-live="polite">{start + 1}–{start + 5} / 38 라운드</p>
  </section>
}
