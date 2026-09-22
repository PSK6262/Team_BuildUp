import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice.js'
import '../css/AllUseNav.css'

const links = [
  ['팀소개', 'teams'],
  ['경기 일정', 'match'],
  ['커뮤니티', 'community/teams'],
  ['나만의 팀', 'myteam'],
  ['랭킹', 'rankpage'],
  ['예측', 'prediction'],
  ['미니게임', 'minigames'],
]

export default function AllUseNav() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const user = useSelector((state) => state.auth.user)
  const dispatch = useDispatch()
  const pathname = window.location.pathname.replace(/\/$/, '')
  const isAdmin = user && Number(user.roleCode) === 9

  const renderLink = ([label, path]) => (
    <a
      key={path}
      href={`/plug/${path}`}
      aria-current={
        pathname === `/plug/${path}`
          ? 'page'
          : path.startsWith('community') && (pathname === '/plug/community' || pathname.startsWith('/plug/community/'))
          ? 'location'
          : undefined
      }
    >
      {label}
    </a>
  )
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch (e) {
      // 서버 통신 실패 시에도 클라이언트 상태는 로그아웃 처리
    }
    dispatch(logout())
    window.location.assign('/plug/mainpage')
  }

  return (
    <header className="user-nav">
      <nav className="user-nav__inner" aria-label="공통 네비게이션">
        <a className="user-nav__logo" href="/plug/mainpage" aria-label="PL:UG 메인페이지">
          <span className="user-nav__logo-pl">PL</span>
          <span className="user-nav__logo-colon">:</span>
          <span className="user-nav__logo-ug">UG</span>
        </a>
        <div className="user-nav__links">
          {links.map(renderLink)}
        </div>
        <div className="user-nav__account">
          {isLoggedIn ? <>
            {isAdmin && (
              <a
                href="/plug/admin"
                style={{
                  background: '#38003c',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                  textDecoration: 'none',
                }}
              >
                관리자
              </a>
            )}
            <button type="button" onClick={handleLogout}>로그아웃</button>
            <a className="user-nav__primary" href="/plug/mypage">마이페이지</a>
          </> : <>
            <a href="/plug/login">로그인</a>
            <a className="user-nav__primary" href="/plug/signin">회원가입</a>
          </>}
        </div>
      </nav>
    </header>
  )
}
