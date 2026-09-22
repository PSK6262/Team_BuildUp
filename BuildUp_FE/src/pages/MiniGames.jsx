import '../css/MiniGames.css'

const games = [
  {
    title: '패널티킥',
    description: '승부차기로 AI와 대결! 3골 선취 시 승리',
    icon: '⚽',
    href: '/plug/minigames/penaltykick',
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
  return (
    <main className="minigames">
      <div className="minigames__hero">
        <h1 className="minigames__title">⚽ 미니게임</h1>
        <p className="minigames__subtitle">EPL 팬이라면 도전해보세요</p>
      </div>
      <ul className="minigames__grid">
        {games.map((game) => (
          <li key={game.title}>
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
    </main>
  )
}
