import { lazy, Suspense, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { silentRefresh, logout, isTokenExpired, recordUserActivity } from './store/authSlice.js'
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
  const lastActivityWriteRef = useRef(0)

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

  // 1. 최초 진입 및 페이지 이동 시: 만료 여부 및 서버 재시작 여부 즉시 검증 + 슬라이딩 세션 갱신
  useEffect(() => {
    if (!isLoggedIn) return

    const token = localStorage.getItem('buildup_token')
    if (!token || isTokenExpired(token)) {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
      dispatch(logout())
      return
    }

    recordUserActivity()
    lastRefreshTimeRef.current = Date.now()
    dispatch(silentRefresh())
  }, [ dispatch, isLoggedIn, pathname ])

  // 2. 30분 타 탭/창 방치 자동 로그아웃 & 사용자 활동 감지 및 포커스 복귀 시 서버 재기동 체크
  useEffect(() => {
    if (!isLoggedIn) return

    const expireSessionNow = () => {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
      dispatch(logout())
    }

    // 사용자 입력(마우스/키보드/스크롤/터치) 시 만료 여부를 먼저 확인한 뒤 활동 시각 갱신
    const handleUserActivity = () => {
      const now = Date.now()
      if (now - lastActivityWriteRef.current < 10000) return

      const token = localStorage.getItem('buildup_token')
      if (!token || isTokenExpired(token)) {
        expireSessionNow()
        return
      }

      lastActivityWriteRef.current = now
      recordUserActivity()

      // 활동 중인 경우 5분 주기로 백엔드 JWT 만료시간(30분) 슬라이딩 연장
      if (now - lastRefreshTimeRef.current >= 5 * 60 * 1000) {
        lastRefreshTimeRef.current = now
        dispatch(silentRefresh())
      }
    }

    // 다른 곳(다른 탭/프로그램/IDE)에 있다가 브라우저로 돌아왔을 때 즉시 검사
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'hidden') return
      const token = localStorage.getItem('buildup_token')
      if (!token || isTokenExpired(token)) {
        expireSessionNow()
        return
      }
      const now = Date.now()
      if (now - lastRefreshTimeRef.current >= 3000) {
        lastRefreshTimeRef.current = now
        dispatch(silentRefresh())
      }
    }

    // 다른 탭에서 로그아웃된 경우 동기화
    const handleStorageChange = (e) => {
      if (e.key === 'buildup_token' && !e.newValue) {
        dispatch(logout())
      }
    }

    const interval = setInterval(() => {
      const token = localStorage.getItem('buildup_token')
      if (!token || isTokenExpired(token)) {
        expireSessionNow()
      }
    }, 15000) // 15초마다 30분 미활동 만료 여부 점검

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove']
    activityEvents.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }))
    window.addEventListener('focus', handleVisibilityOrFocus)
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      clearInterval(interval)
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleUserActivity))
      window.removeEventListener('focus', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('storage', handleStorageChange)
    }
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
