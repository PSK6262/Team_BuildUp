import { useState, useEffect, useRef } from 'react'
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
  ['커뮤니티', 'community'],
  ['나만의 팀', 'myteam'],
  ['랭킹', 'rankpage'],
  ['예측', 'prediction'],
  ['포인트샵', 'point'],
  ['미니게임', 'minigames'],
]

export default function AllUseNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const navContainerRef = useRef(null)

  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const user = useSelector((state) => state.auth.user)
  const currentTheme = useSelector((state) => state.theme?.mode || 'dark')
  const dispatch = useDispatch()

  const getNavPathname = () => {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
    let hash = window.location.hash.replace(/^#/, '').split('?')[0]
    if (hash) {
      if (base && hash.startsWith(base)) hash = hash.slice(base.length)
      return hash.replace(/\/$/, '') || '/plug/mainpage'
    }
    let path = window.location.pathname.replace(/\/$/, '')
    if (base && path.startsWith(base)) path = path.slice(base.length)
    return path || '/plug/mainpage'
  }

  const [pathname, setPathname] = useState(getNavPathname)

  useEffect(() => {
    const handleHashChange = () => setPathname(getNavPathname())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const isMainPage = !pathname || pathname === '' || pathname === '/plug' || pathname === '/plug/mainpage' || pathname === '/plug/teams'
  const isAdmin = user && Number(user.roleCode) === 9
  const nickname = user?.nickname?.trim() || '내 계정'

  // 외부 클릭 시 모바일 메뉴 닫기 & ESC 키로 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (navContainerRef.current && !navContainerRef.current.contains(event.target)) {
        setIsMenuOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  // 화면 크기가 1024px 초과로 확장되면 모바일 메뉴 상태 자동 리셋
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1024) {
        setIsMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isLinkActive = (path) => {
    return (
      pathname === `/plug/${path}` ||
      (path.startsWith('community') && (pathname === '/plug/community' || pathname.startsWith('/plug/community/'))) ||
      (path === 'minigames' && pathname.startsWith('/plug/minigames/'))
    )
  }

  const renderLink = ([label, path]) => (
    <a
      key={path}
      href={`/plug/${path}`}
      className={path === 'admin' ? 'user-nav__link--admin' : undefined}
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
    <header
      ref={navContainerRef}
      className={`user-nav ${isMainPage ? 'user-nav--mainpage' : 'user-nav--subpage'} ${isMenuOpen ? 'user-nav--menu-open' : ''}`}
    >
      <nav className="user-nav__inner" aria-label="공통 네비게이션">
        <a className="user-nav__logo" href="/plug/mainpage" aria-label="PL:UG 메인페이지">
          <span className="user-nav__logo-pl">PL</span>
          <span className="user-nav__logo-colon">:</span>
          <span className="user-nav__logo-ug">UG</span>
        </a>

        {/* 데스크톱 전용 메뉴 링크들 */}
        <div className="user-nav__links">
          {links.map(renderLink)}
          {isAdmin && renderLink(['관리', 'admin'])}
        </div>

        {/* 우측 계정 및 모바일 제어 영역 */}
        <div className="user-nav__account">
          {/* 다크모드 / 일반모드 전환 아이콘 토글 */}
          <button
            type="button"
            className={`user-nav__theme-btn ${currentTheme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={() => dispatch(toggleTheme())}
            title={currentTheme === 'dark' ? '일반모드(라이트)로 전환' : '다크모드로 전환'}
            aria-label={currentTheme === 'dark' ? '일반모드(라이트)로 전환' : '다크모드로 전환'}
          >
            <span className="user-nav__theme-icon user-nav__theme-icon--sun">
              <IconSun size={17} color="#ffd700" />
            </span>
            <span className="user-nav__theme-icon user-nav__theme-icon--moon">
              <IconMoon size={17} color="#d886ed" />
            </span>
          </button>

          {/* 인증 상태별 버튼 */}
          {isLoggedIn ? (
            <>
              <button
                type="button"
                className="user-nav__logout-btn"
                onClick={handleLogout}
              >
                로그아웃
              </button>
              <div className="user-nav__profile">
                <a className="user-nav__primary user-nav__mypage-top" href="/plug/mypage" aria-label={`${nickname} · 마이페이지`}>
                  <svg className="user-nav__profile-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.5" />
                    <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
                  </svg>
                  <span className="user-nav__profile-copy">
                    <span className="user-nav__nickname">{nickname}</span>
                    <span className="user-nav__profile-label">마이페이지</span>
                  </span>
                </a>
                <span className="user-nav__nickname-tooltip" aria-hidden="true">{nickname}</span>
              </div>
            </>
          ) : (
            <>
              <a className="user-nav__login-btn" href="/plug/login">로그인</a>
              <a className="user-nav__primary" href="/plug/signin">회원가입</a>
            </>
          )}

          {/* 모바일 햄버거 토글 버튼 (1024px 이하에서만 노출) */}
          <button
            type="button"
            className={`user-nav__hamburger ${isMenuOpen ? 'is-active' : ''}`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label={isMenuOpen ? '메뉴 닫기' : '전체 메뉴 열기'}
            aria-expanded={isMenuOpen}
          >
            <span className="user-nav__hamburger-box">
              <span className="user-nav__hamburger-line" />
              <span className="user-nav__hamburger-line" />
              <span className="user-nav__hamburger-line" />
            </span>
          </button>
        </div>
      </nav>

      {/* 모바일 슬라이드다운 메뉴 패널 */}
      <div
        className={`user-nav__mobile-panel ${isMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <div className="user-nav__mobile-panel-inner">
          {isLoggedIn && (
            <div className="user-nav__mobile-account">
              <span className="user-nav__mobile-nickname">{nickname}<small>로그인 중</small></span>
              <button type="button" className="user-nav__logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          )}
          <div className="user-nav__mobile-grid">
            {links.map(([label, path]) => {
              const active = isLinkActive(path)
              return (
                <a
                  key={path}
                  href={`/plug/${path}`}
                  onClick={() => setIsMenuOpen(false)}
                  className={`user-nav__mobile-item ${active ? 'is-active' : ''}`}
                >
                  <span className="user-nav__mobile-item-title">{label}</span>
                  {active && <span className="user-nav__mobile-item-dot" />}
                </a>
              )
            })}
            {isLoggedIn && (
              <a
                href="/plug/mypage"
                onClick={() => setIsMenuOpen(false)}
                className={`user-nav__mobile-item user-nav__mobile-item--mypage ${pathname === '/plug/mypage' ? 'is-active' : ''}`}
              >
                <span className="user-nav__mobile-item-title">마이페이지</span>
                {pathname === '/plug/mypage' && <span className="user-nav__mobile-item-dot" />}
              </a>
            )}
            {isAdmin && (
              <a
                href="/plug/admin"
                onClick={() => setIsMenuOpen(false)}
                className={`user-nav__mobile-item user-nav__mobile-item--admin ${pathname === '/plug/admin' ? 'is-active' : ''}`}
              >
                <span className="user-nav__mobile-item-title">관리</span>
                {pathname === '/plug/admin' && <span className="user-nav__mobile-item-dot" />}
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
