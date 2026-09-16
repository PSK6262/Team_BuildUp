import AllUseNav from './pages/AllUseNav.jsx'
import Community from './pages/Community.jsx'
import FreeBoard from './pages/FreeBoard.jsx'
import TeamBoards from './pages/TeamBoards.jsx'
import { communityTeams } from './data/communityTeams.js'
import './App.css'

function App() {
  // 현재 a 링크 방식에 맞춘 화면 분기입니다. 공통 라우터 도입 시 Route로 옮깁니다.
  const path = window.location.pathname.replace(/\/$/, '')
  const team = communityTeams.find((item) => path === `/plug/community/teams/${item.slug}`)

  return (
    <>
      <AllUseNav />
      {path === '/plug/community' && <Community />}
      {path === '/plug/community/free' && <FreeBoard />}
      {path === '/plug/community/teams' && <TeamBoards />}
      {team && <Community key={team.slug} selectedTeam={team.name} />}
      {path.startsWith('/plug/community/teams/') && !team && <main className="community"><h1>팀을 찾을 수 없습니다.</h1><a href="/plug/community/teams">팀 선택으로 돌아가기</a></main>}
    </>
  )
}

export default App
