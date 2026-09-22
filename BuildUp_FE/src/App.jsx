import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { silentRefresh, logout, isTokenExpired } from './store/authSlice.js'
import AllUseNav from './pages/AllUseNav.jsx'
import MainPage from './pages/mainpage.jsx'
import TeamsPage, { StandingsPage } from './pages/teams.jsx'
import Team from './pages/team.jsx'
import Community from './pages/Community.jsx'
import FreeBoard from './pages/FreeBoard.jsx'
import TeamBoards from './pages/TeamBoards.jsx'
import PostDetail from './pages/PostDetail.jsx'
import PostWrite from './pages/PostWrite.jsx'
import Prediction from './pages/Prediction.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import MyPage from './pages/MyPage.jsx'
import ChatbotWidget from './components/ChatbotWidget.jsx'
import { communityTeams } from './data/communityTeams.js'
import Match from './pages/Match.jsx'
import Admin from './pages/Admin.jsx'
import './App.css'

function App() {
  const dispatch = useDispatch()
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const lastRefreshTimeRef = useRef(0)

  const pathname = window.location.pathname.replace(/\/$/, '')
  const isMainPage = !pathname || pathname === '' || pathname === '/plug' || pathname === '/plug/mainpage'
  const isTeamsPage = pathname === '/plug/teams'
  const teamMatch = pathname.match(/^\/plug\/team\/(\d+)$/)
  const postMatch = pathname.match(/^\/plug\/community\/posts\/([^/]+)$/)
  const showChatbot = isMainPage || isTeamsPage || Boolean(teamMatch)

  // 커뮤니티 구단별 게시판 라우팅
  const commuTeam = communityTeams.find((item) => pathname === `/plug/community/teams/${item.slug}`)

  // 1. 슬라이딩 세션 자동 연장: 접속 또는 페이지 이동 시 토큰 유효기간을 30분으로 자동 갱신
  useEffect(() => {
    if (!isLoggedIn) return

    const token = localStorage.getItem('buildup_token')
    if (!token) return

    // 30분 이상 미활동으로 이미 만료된 경우 자동 로그아웃
    if (isTokenExpired(token)) {
      dispatch(logout())
      return
    }

    const now = Date.now()
    // 60초 이내 중복 리프레시 요청 방지 (과도한 네트워크 호출 방지)
    if (now - lastRefreshTimeRef.current < 60000) return

    lastRefreshTimeRef.current = now
    dispatch(silentRefresh())
  }, [dispatch, isLoggedIn, pathname])

  // 2. 미활동 장시간 방치 감지: 탭을 열어두고 30분 이상 방치 시 자동 만료 처리
  useEffect(() => {
    if (!isLoggedIn) return

    const interval = setInterval(() => {
      const token = localStorage.getItem('buildup_token')
      if (token && isTokenExpired(token)) {
        dispatch(logout())
      }
    }, 30000) // 30초마다 세션 만료 체크

    return () => clearInterval(interval)
  }, [dispatch, isLoggedIn])

  return (
    <>
      <AllUseNav />
      {/* 메인 및 구단 소개 */}
      {isMainPage && <MainPage />}
      {isTeamsPage && <TeamsPage />}
      {pathname === '/plug/rankpage' && <StandingsPage />}
      {teamMatch && <Team teamId={teamMatch[ 1 ]} />}

      {/* 경기 일정 및 경기 결과 */}
      {pathname === '/plug/match' && <Match />}
      {pathname === '/plug/matchresult' && <Match resultsOnly />}

      {/* 회원 인증 및 마이페이지 */}
      {pathname === '/plug/prediction' && <Prediction />}
      {pathname === '/plug/login' && <Login />}
      {(pathname === '/plug/signin' || pathname === '/plug/signup' || pathname === '/plug/signup/confirm') && <Signup />}
      {pathname === '/plug/mypage' && <MyPage />}
      {pathname === '/plug/admin' && <Admin />}

      {/* 커뮤니티 */}
      {pathname === '/plug/community' && <Community />}
      {pathname === '/plug/community/free' && <FreeBoard />}
      {pathname === '/plug/community/teams' && <TeamBoards />}
      {pathname === '/plug/community/write' && <PostWrite />}
      {postMatch && <PostDetail postId={postMatch[ 1 ]} />}
      {commuTeam && <Community key={commuTeam.slug} selectedTeam={commuTeam} />}
      {pathname.startsWith('/plug/community/teams/') && !commuTeam && (
        <main className="community">
          <h1>팀을 찾을 수 없습니다.</h1>
          <a href="/plug/community/teams">팀 선택으로 돌아가기</a>
        </main>
      )}
      {showChatbot && <ChatbotWidget />}
    </>
  )
}

export default App
