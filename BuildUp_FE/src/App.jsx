import { lazy, Suspense, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { silentRefresh, logout, isTokenExpired } from './store/authSlice.js'
import AllUseNav from './pages/AllUseNav.jsx'
import { communityTeams } from './data/communityTeams.js'
import GlobalFooter from './components/GlobalFooter.jsx'
import './App.css'
import './css/mobile-tabs.css'
import './css/page-headings.css'

const TeamsPage = lazy(() => import('./pages/teams.jsx'))
const StandingsPage = lazy(() => import('./pages/teams.jsx').then((module) => ({ default: module.StandingsPage })))
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget.jsx'))
const MainPage = lazy(() => import('./pages/mainpage.jsx'))
const Team = lazy(() => import('./pages/team.jsx'))
const Community = lazy(() => import('./pages/Community.jsx'))
const FreeBoard = lazy(() => import('./pages/FreeBoard.jsx'))
const TeamBoards = lazy(() => import('./pages/TeamBoards.jsx'))
const PostDetail = lazy(() => import('./pages/PostDetail.jsx'))
const PostWrite = lazy(() => import('./pages/PostWrite.jsx'))
const Prediction = lazy(() => import('./pages/Prediction.jsx'))
const PointShop = lazy(() => import('./pages/PointShop.jsx'))
const MyTeam = lazy(() => import('./pages/MyTeam.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const MyPage = lazy(() => import('./pages/MyPage.jsx'))
const Match = lazy(() => import('./pages/Match.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
const MiniGames = lazy(() => import('./pages/MiniGames.jsx'))
const PenaltyKick = lazy(() => import('./pages/PenaltyKick.jsx'))

function App() {
  const dispatch = useDispatch()
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const lastRefreshTimeRef = useRef(0)

  const pathname = window.location.pathname.replace(/\/$/, '')
  const isMainPage = !pathname || pathname === '' || pathname === '/plug' || pathname === '/plug/mainpage'
  const isTeamsPage = pathname === '/plug/teams'
  const teamMatch = pathname.match(/^\/plug\/team\/(\d+)$/)
  const postMatch = pathname.match(/^\/plug\/community\/posts\/([^/]+)$/)
  const showChatbot = isMainPage
    || isTeamsPage
    || Boolean(teamMatch)
    || pathname === '/plug/rankpage'
    || pathname === '/plug/myteam'

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
  }, [ dispatch, isLoggedIn, pathname ])

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
  }, [ dispatch, isLoggedIn ])

  return (
    <>
      <AllUseNav />
      <Suspense
        fallback={
          <div className="app-loading-fallback" role="status" aria-label="로딩 중">
            <div className="app-loading-spinner" />
          </div>
        }
      >
      {/* 메인 및 구단 소개 */}
      {isMainPage && <MainPage />}
      {isTeamsPage && <TeamsPage />}
      {pathname === '/plug/rankpage' && <StandingsPage />}
      {teamMatch && <Team teamId={teamMatch[ 1 ]} />}

      {/* 경기 일정 */}
      {pathname === '/plug/match' && <Match />}

      {/* 회원 인증 및 마이페이지 */}
      {pathname === '/plug/prediction' && <Prediction />}
      {pathname === '/plug/point' && <PointShop />}
      {pathname === '/plug/myteam' && <MyTeam />}
      {pathname === '/plug/login' && <Login />}
      {(pathname === '/plug/signin' || pathname === '/plug/signup' || pathname === '/plug/signup/confirm') && <Signup />}
      {pathname === '/plug/mypage' && <MyPage />}
      {pathname === '/plug/admin' && <Admin />}

      {/* 미니게임 */}
      {pathname === '/plug/minigames' && <MiniGames />}
      {(pathname === '/plug/minigames/shootout' || pathname === '/plug/minigames/penaltykick') && <PenaltyKick />}

      {/* 커뮤니티 */}
      {pathname === '/plug/community' && <Community />}
      {pathname === '/plug/community/free' && <FreeBoard />}
      {pathname === '/plug/community/teams' && <TeamBoards />}
      {pathname === '/plug/community/write' && <PostWrite />}
      {postMatch && <PostDetail key={postMatch[ 1 ]} postId={postMatch[ 1 ]} />}
      {commuTeam && <Community key={commuTeam.slug} selectedTeam={commuTeam} />}
      {pathname.startsWith('/plug/community/teams/') && !commuTeam && (
        <main className="community">
          <h1>팀을 찾을 수 없습니다.</h1>
          <a href="/plug/community/teams">팀 선택으로 돌아가기</a>
        </main>
      )}
      </Suspense>
      <GlobalFooter />
      {showChatbot && <Suspense fallback={null}><ChatbotWidget /></Suspense>}
    </>
  )
}

export default App
