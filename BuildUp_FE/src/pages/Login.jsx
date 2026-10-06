import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginSuccess, recordUserActivity } from '../store/authSlice.js'
import { navigate } from '../utils/navigation.js'
import '../css/Auth.css'

export default function Login() {
  const dispatch = useDispatch()
  const currentTheme = useSelector((state) => state.theme?.mode || 'dark')
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!loginId.trim() || !password.trim()) {
      setErrorMsg('아이디와 비밀번호를 모두 입력해주세요.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId: loginId.trim(), password })
      })

      const data = await res.json()
      const isSuccess = res.ok && (data.status === 'SUCCESS' || data.code === 'SUC_001')

      if (isSuccess) {
        const token = data.data?.token || data.token
        const user = data.data?.user || data.user

        recordUserActivity()
        if (token) {
          localStorage.setItem('buildup_token', token)
        }
        if (user) {
          dispatch(loginSuccess(user))
        }
        navigate('/plug/mainpage')
      } else {
        setErrorMsg(data.message || '아이디 또는 비밀번호가 일치하지 않습니다.')
      }
    } catch {
      setErrorMsg('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`auth-container ${currentTheme === 'light' ? 'auth-light-mode' : 'auth-dark-mode'}`}>
      <header className="auth-header">
        <span className="auth-brand-badge">PL:UG FOOTBALL</span>
        <h2>로그인</h2>
        <p>프리미어리그 팬 커뮤니티 PL:UG에 오신 것을 환영합니다.</p>
      </header>

      <div className="auth-card">
        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="loginId">아이디</label>
            <input
              id="loginId"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="아이디를 입력하세요"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              autoFocus
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? '로그인 처리 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-footer">
          <span>아직 계정이 없으신가요?</span>
          <a href="#/plug/signin">회원가입 하러 가기</a>
        </div>
      </div>
    </div>
  )
}
