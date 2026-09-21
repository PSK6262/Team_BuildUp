import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../store/authSlice.js'

export default function Login() {
  const dispatch = useDispatch()
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

        if (token) {
          localStorage.setItem('buildup_token', token)
        }
        if (user) {
          dispatch(loginSuccess(user))
        }
        window.location.assign('/plug/mainpage')
      } else {
        setErrorMsg(data.message || '아이디 또는 비밀번호가 일치하지 않습니다.')
      }
    } catch (err) {
      setErrorMsg('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>로그인</h2>
          <p>PL:UG 서비스에 오신 것을 환영합니다.</p>
        </div>

        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="loginId">아이디</label>
            <input
              id="loginId"
              type="text"
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
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div className="auth-footer">
          <span>아직 계정이 없으신가요?</span>
          <a href="/plug/signin">회원가입</a>
        </div>
      </div>
    </div>
  )
}
