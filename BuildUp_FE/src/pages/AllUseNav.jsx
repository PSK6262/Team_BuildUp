import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice.js'
import { toggleTheme } from '../store/themeSlice.js'
import '../css/AllUseNav.css'

function IconSun({ size = 15, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function IconMoon({ size = 15, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

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
  const currentTheme = useSelector((state) => state.theme?.mode || 'dark')
  const dispatch = useDispatch()
  const pathname = window.location.pathname.replace(/\/$/, '')
  const isMainPage = !pathname || pathname === '' || pathname === '/plug' || pathname === '/plug/mainpage' || pathname === '/plug/teams'
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
          : path === 'minigames' && pathname.startsWith('/plug/minigames/')
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
    } catch {
      // 서버 통신 실패 시에도 클라이언트 상태는 로그아웃 처리
    }
    dispatch(logout())
    window.location.assign('/plug/mainpage')
  }

  return (
    <header className={`user-nav ${isMainPage ? 'user-nav--mainpage' : 'user-nav--subpage'}`}>
      <nav className="user-nav__inner" aria-label="공통 네비게이션">
        <a className="user-nav__logo" href="/plug/mainpage" aria-label="PL:UG 메인페이지">
          <span className="user-nav__logo-pl">PL</span>
          <span className="user-nav__logo-colon">:</span>
          <span className="user-nav__logo-ug">UG</span>
        </a>
        <div className="user-nav__links">
          {links.map(renderLink)}
          {isAdmin && renderLink(['관리', 'admin'])}
        </div>
        <div className="user-nav__account">
          {/* 다크모드 / 일반모드 전환 아이콘 토글 */}
          <button
            type="button"
            className="user-nav__theme-btn"
            onClick={() => dispatch(toggleTheme())}
            title={currentTheme === 'dark' ? '일반모드(라이트)로 전환' : '다크모드로 전환'}
            aria-label={currentTheme === 'dark' ? '일반모드(라이트)로 전환' : '다크모드로 전환'}
          >
            {currentTheme === 'dark' ? (
              <IconSun size={17} color="#ffd700" />
            ) : (
              <IconMoon size={17} color="#d886ed" />
            )}
          </button>
          {isLoggedIn ? <>
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
