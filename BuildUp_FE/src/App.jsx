import AllUseNav from './pages/AllUseNav.jsx'
import MainPage from './pages/mainpage.jsx'
import TeamsPage from './pages/teams.jsx'
import Team from './pages/team.jsx'
import Community from './pages/Community.jsx'
import FreeBoard from './pages/FreeBoard.jsx'
import TeamBoards from './pages/TeamBoards.jsx'
import PostDetail from './pages/PostDetail.jsx'
import PostWrite from './pages/PostWrite.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import MyPage from './pages/MyPage.jsx'
import { communityTeams } from './data/communityTeams.js'
import './App.css'

function App() {
  const pathname = window.location.pathname.replace(/\/$/, '')
  const isMainPage = !pathname || pathname === '' || pathname === '/plug' || pathname === '/plug/mainpage'
  const isTeamsPage = pathname === '/plug/teams'
  const teamMatch = pathname.match(/^\/plug\/team\/(\d+)$/)
  const postMatch = pathname.match(/^\/plug\/community\/posts\/([^/]+)$/)

  // 커뮤니티 구단별 게시판 라우팅
  const commuTeam = communityTeams.find((item) => pathname === `/plug/community/teams/${item.slug}`)

  return (
    <>
      <AllUseNav />
      {/* 메인 및 구단 소개 */}
      {isMainPage && <MainPage />}
      {isTeamsPage && <TeamsPage />}
      {teamMatch && <Team teamId={teamMatch[1]} />}

      {/* 회원 인증 및 마이페이지 */}
      {pathname === '/plug/login' && <Login />}
      {(pathname === '/plug/signin' || pathname === '/plug/signup') && <Signup />}
      {pathname === '/plug/mypage' && <MyPage />}

      {/* 커뮤니티 */}
      {pathname === '/plug/community' && <Community />}
      {pathname === '/plug/community/free' && <FreeBoard />}
      {pathname === '/plug/community/teams' && <TeamBoards />}
      {pathname === '/plug/community/write' && <PostWrite />}
      {postMatch && <PostDetail postId={postMatch[1]} />}
      {commuTeam && <Community key={commuTeam.slug} selectedTeam={commuTeam} />}
      {pathname.startsWith('/plug/community/teams/') && !commuTeam && (
        <main className="community">
          <h1>팀을 찾을 수 없습니다.</h1>
          <a href="/plug/community/teams">팀 선택으로 돌아가기</a>
        </main>
      )}
    </>
  )
}

export default App
