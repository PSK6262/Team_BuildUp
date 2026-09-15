import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../store/authSlice.js'
import '../css/AllUseNav.css'

const links = [['팀소개', 'teams'], ['경기 일정', 'match'], ['경기결과', 'matchresult'], ['커뮤니티', 'community'], ['랭킹', 'rankpage'], ['예측', 'prediction']]

export default function AllUseNav() {
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const dispatch = useDispatch()
  const teamMenu = useRef(null)
  const pathname = window.location.pathname.replace(/\/$/, '')

  useEffect(() => {
    const closeOutside = (event) => {
      if (!teamMenu.current?.contains(event.target)) teamMenu.current?.removeAttribute('open')
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && teamMenu.current?.open) {
        teamMenu.current.removeAttribute('open')
        teamMenu.current.querySelector('summary').focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  const renderLink = ([label, path]) => (
    <a key={path} href={`/plug/${path}`} aria-current={pathname === `/plug/${path}` ? 'page' : undefined}>{label}</a>
  )
  const handleLogout = () => {
    // 인증 API 연동 시 서버 세션/토큰 해제도 이 흐름에 연결합니다.
    dispatch(logout())
    window.location.assign('/plug/')
  }

  return (
    <header className="user-nav">
      <nav className="user-nav__inner" aria-label="공통 네비게이션">
        <a className="user-nav__logo" href="/plug/" aria-label="BuildUp 메인페이지">BUILD<span>UP</span></a>
        <div className="user-nav__links">
          {links.slice(0, 3).map(renderLink)}
          <details className="user-nav__team" ref={teamMenu} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.removeAttribute('open')
          }}>
            <summary className={['/plug/myteam', '/plug/myteamrank'].includes(pathname) ? 'is-active' : undefined}>
              나만의팀 <span aria-hidden="true">⌄</span>
            </summary>
            <div className="user-nav__dropdown">
              {renderLink(['내 팀', 'myteam'])}
              {renderLink(['내팀 순위', 'myteamrank'])}
            </div>
          </details>
          {links.slice(3).map(renderLink)}
        </div>
        <div className="user-nav__account">
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
