import { useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import '../css/MiniGames.css'

const games = [
  {
    title: '승부차기',
    description: '승부차기로 AI와 대결! 3골 선취 시 승리',
    icon: '⚽',
    href: '#/plug/minigames/shootout',
    available: true,
  },
  {
    title: '팀 퀴즈',
    description: '프리미어리그 상식 퀴즈 도전',
    icon: '🧠',
    href: '#',
    available: false,
  },
  {
    title: '선수 맞추기',
    description: '실루엣을 보고 선수를 맞춰라',
    icon: '🔍',
    href: '#',
    available: false,
  },
]

export default function MiniGames() {
  const currentTheme = useSelector((state) => state.theme?.mode || 'dark')
  const isLight = currentTheme === 'light'
  const gridRef = useRef(null)
  const [activeIndex, setActiveIndex] = useState(0)

  const handleScroll = () => {
    const el = gridRef.current
    if (!el) return
    const items = el.querySelectorAll('li')
    if (!items.length) return
    const containerCenter = el.scrollLeft + el.clientWidth / 2
    let closestIdx = 0
    let minDiff = Infinity
    items.forEach((item, idx) => {
      const itemCenter = item.offsetLeft + item.offsetWidth / 2
      const diff = Math.abs(containerCenter - itemCenter)
      if (diff < minDiff) {
        minDiff = diff
        closestIdx = idx
      }
    })
    setActiveIndex(closestIdx)
  }

  const scrollToCard = (idx) => {
    const el = gridRef.current
    if (!el) return
    const items = el.querySelectorAll('li')
    if (!items[idx]) return
    const targetLeft = items[idx].offsetLeft - (el.clientWidth - items[idx].offsetWidth) / 2
    el.scrollTo({ left: targetLeft, behavior: 'smooth' })
    setActiveIndex(idx)
  }

  return (
    <main className={`minigames-page${isLight ? ' minigames-page--light' : ''}`}>
      <div className="minigames-inner">
        <header className="minigames__hero">
          <span className="minigames__eyebrow">MINI GAMES</span>
          <h1 className="minigames__title">미니게임</h1>
          <p className="minigames__subtitle">EPL 팬이라면 도전해보세요</p>
        </header>
        <ul className="minigames__grid" ref={gridRef} onScroll={handleScroll}>
          {games.map((game) => (
            <li key={game.title} className="minigames__grid-item">
              {game.available ? (
                <a className="minigames__card minigames__card--active" href={game.href}>
                  <span className="minigames__card-icon">{game.icon}</span>
                  <strong className="minigames__card-title">{game.title}</strong>
                  <p className="minigames__card-desc">{game.description}</p>
                  <span className="minigames__card-badge">플레이</span>
                </a>
              ) : (
                <div className="minigames__card minigames__card--locked">
                  <span className="minigames__card-icon">{game.icon}</span>
                  <strong className="minigames__card-title">{game.title}</strong>
                  <p className="minigames__card-desc">{game.description}</p>
                  <span className="minigames__card-badge minigames__card-badge--soon">준비중</span>
                </div>
              )}
            </li>
          ))}
        </ul>
        <div className="minigames__swipe-dots" aria-label="게임 슬라이드 탐색">
          {games.map((game, idx) => (
            <button
              key={game.title}
              type="button"
              className={`minigames__swipe-dot${idx === activeIndex ? ' is-active' : ''}`}
              onClick={() => scrollToCard(idx)}
              aria-label={`${game.title} 보기`}
            />
          ))}
        </div>
      </div>
    </main>
  )
}
