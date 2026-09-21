import { useState, useEffect, useRef } from 'react'

const EMAIL_REGEX = /^[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9._-]{2,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export default function Signup() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [favoriteTeamId, setFavoriteTeamId] = useState('')
  const [teamList, setTeamList] = useState([])

  // 실제 DB 구단 목록 조회 (/api/teams)
  useEffect(() => {
    fetch('/api/teams')
      .then((res) => {
        if (!res.ok) throw new Error('구단 목록 조회 실패')
        return res.json()
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setTeamList(data)
        }
      })
      .catch((err) => {
        console.error('[구단 목록 로드 실패]', err)
      })
  }, [])

  // 중복확인 상태 관리
  const [idChecked, setIdChecked] = useState(false)
  const [idCheckMsg, setIdCheckMsg] = useState('')
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameCheckMsg, setNicknameCheckMsg] = useState('')

  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // 가입 인증 메일 발송 완료 상태 관리
  const [signupMailSent, setSignupMailSent] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  // URL에서 이메일 인증키 추출 (?key=...)
  const searchParams = new URLSearchParams(window.location.search)
  const confirmKey = searchParams.get('key')
  const isConfirmMode = Boolean(confirmKey || window.location.pathname === '/plug/signup/confirm')

  const [confirmStatus, setConfirmStatus] = useState(isConfirmMode ? 'loading' : 'idle')
  const [confirmMsg, setConfirmMsg] = useState('')
  const hasRequestedRef = useRef(false)

  // 인증 링크로 진입했을 때 자동 검증 처리 (중복 실행 방지)
  useEffect(() => {
    if (!confirmKey) {
      if (isConfirmMode) {
        setConfirmStatus('error')
        setConfirmMsg('인증키가 존재하지 않거나 누락되었습니다.')
      }
      return
    }

    if (hasRequestedRef.current) return
    hasRequestedRef.current = true

    setConfirmStatus('loading')
    fetch(`/api/auth/confirm-signup?key=${encodeURIComponent(confirmKey.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'SUCCESS' || data.code === 'SUC_001') {
          setConfirmStatus('success')
        } else {
          setConfirmStatus('error')
          setConfirmMsg(data.message || '인증 링크가 유효하지 않거나 유효시간(30분)이 만료되었습니다.')
        }
      })
      .catch((err) => {
        console.error('[이메일 인증 오류]', err)
        setConfirmStatus('error')
        setConfirmMsg('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.')
      })
  }, [confirmKey, isConfirmMode])

  // 아이디 중복확인
  const handleCheckId = async () => {
    if (!loginId.trim()) {
      setIdCheckMsg('아이디를 입력해주세요.')
      return
    }
    try {
      const res = await fetch(`/api/auth/check-id?loginId=${encodeURIComponent(loginId.trim())}`)
      if (!res.ok) {
        throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
      }
      const data = await res.json()
      const isAvailable = Boolean(data.data === true || data.available || data.data?.available || (data.code === 'SUC_001' && data.status !== 'FAIL'))
      if (isAvailable) {
        setIdChecked(true)
        setIdCheckMsg('✓ 사용 가능한 아이디입니다.')
      } else {
        setIdChecked(false)
        setIdCheckMsg(data.message || '✕ 이미 사용 중인 아이디입니다.')
      }
    } catch (err) {
      console.error('[아이디 중복확인 실패]', err)
      setIdCheckMsg('중복확인 중 오류가 발생했습니다. (서버 연결 상태를 확인해주세요)')
    }
  }

  // 닉네임 중복확인
  const handleCheckNickname = async () => {
    if (!nickname.trim()) {
      setNicknameCheckMsg('닉네임을 입력해주세요.')
      return
    }
    try {
      const res = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(nickname.trim())}`)
      if (!res.ok) {
        throw new Error(`서버 응답 오류 (HTTP ${res.status})`)
      }
      const data = await res.json()
      const isAvailable = Boolean(data.data === true || data.available || data.data?.available || (data.code === 'SUC_001' && data.status !== 'FAIL'))
      if (isAvailable) {
        setNicknameChecked(true)
        setNicknameCheckMsg('✓ 사용 가능한 닉네임입니다.')
      } else {
        setNicknameChecked(false)
        setNicknameCheckMsg(data.message || '✕ 이미 사용 중인 닉네임입니다.')
      }
    } catch (err) {
      console.error('[닉네임 중복확인 실패]', err)
      setNicknameCheckMsg('중복확인 중 오류가 발생했습니다. (서버 연결 상태를 확인해주세요)')
    }
  }

  // 회원가입 제출
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!loginId.trim()) return setErrorMsg('아이디를 입력해주세요.')
    if (!idChecked) return setErrorMsg('아이디 중복확인을 진행해주세요.')
    if (!password) return setErrorMsg('비밀번호를 입력해주세요.')
    if (password !== passwordConfirm) return setErrorMsg('비밀번호가 일치하지 않습니다.')
    if (!nickname.trim()) return setErrorMsg('닉네임을 입력해주세요.')
    if (!nicknameChecked) return setErrorMsg('닉네임 중복확인을 진행해주세요.')
    if (!email.trim()) return setErrorMsg('이메일을 입력해주세요.')
    if (!EMAIL_REGEX.test(email.trim())) return setErrorMsg('올바른 이메일 형식을 입력해주세요. (영문, 숫자, 특수문자 . _ - 허용, 4~30자)')

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginId: loginId.trim(),
          password,
          nickname: nickname.trim(),
          email: email.trim(),
          favoriteTeamId: favoriteTeamId ? Number(favoriteTeamId) : null
        })
      })

      const data = await res.json()
      const isSuccess = res.ok && (data.status === 'SUCCESS' || data.code === 'SUC_001')

      if (isSuccess) {
        setSignupMailSent(true)
        setSentEmail(email.trim())
      } else {
        setErrorMsg(data.message || '회원가입 처리 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setErrorMsg('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 1. 이메일 인증 링크로 접근했을 때의 화면
  if (isConfirmMode) {
    if (confirmStatus === 'loading') {
      return (
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center', padding: '44px 32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1f2a37', margin: '0 0 10px 0' }}>
              이메일 인증 확인 중
            </h2>
            <p style={{ color: '#6b7280', fontSize: '15px', lineHeight: '1.6', margin: '0' }}>
              회원가입 인증키를 검증하고 있습니다.<br />
              잠시만 기다려주세요...
            </p>
          </div>
        </div>
      )
    }

    if (confirmStatus === 'success') {
      return (
        <div className="auth-container">
          <div className="auth-card" style={{ textAlign: 'center', padding: '44px 32px' }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1f2a37', margin: '0 0 12px 0' }}>
              회원가입 완료!
            </h2>
            <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: '1.6', wordBreak: 'keep-all', margin: '0 0 28px 0' }}>
              이메일 인증이 성공적으로 완료되었습니다.<br />
              지금 로그인하여 <strong>PL:UG</strong>의 모든 서비스를 즐겨보세요!
            </p>
            <div>
              <a
                href="/plug/login"
                className="auth-submit-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  height: '46px',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                로그인하러 가기
              </a>
            </div>
          </div>
        </div>
      )
    }

    // error (실제 실패 시 깔끔하고 안정적인 화면)
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', padding: '44px 32px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1f2a37', margin: '0 0 12px 0' }}>
            인증 실패
          </h2>
          <p style={{ color: '#dc2626', fontSize: '15px', lineHeight: '1.6', wordBreak: 'keep-all', margin: '0 0 28px 0' }}>
            {confirmMsg || '인증 링크가 유효하지 않거나 유효시간(30분)이 만료되었습니다.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href="/plug/signup"
              className="auth-submit-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                height: '46px',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              회원가입 다시 하기
            </a>
            <a
              href="/plug/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                height: '44px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                border: '1px solid #d1d5db',
                transition: 'background-color 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              로그인 화면으로 이동
            </a>
          </div>
        </div>
      </div>
    )
  }

  // 2. 가입 요청 완료 후 인증 메일 발송 안내 화면
  if (signupMailSent) {
    return (
      <div className="auth-container">
        <div className="auth-card" style={{ textAlign: 'center', padding: '44px 32px' }}>
          <div style={{ fontSize: '52px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#1f2a37', margin: '0 0 12px 0' }}>
            인증 메일이 발송되었습니다!
          </h2>
          <p style={{ marginTop: '16px', lineHeight: '1.7', color: '#4b5563', fontSize: '15px', wordBreak: 'keep-all' }}>
            <strong style={{ color: '#16744b' }}>{sentEmail}</strong> (으)로 가입 인증 메일을 보냈습니다.<br />
            수신된 이메일의 <strong>[회원가입 완료하기]</strong> 링크를 클릭하시면<br />
            회원가입이 최종 완료됩니다. (30분간 유효)
          </p>
          <p style={{ marginTop: '14px', fontSize: '13px', color: '#9ca3af' }}>
            ※ 메일이 오지 않은 경우 스팸 메일함을 확인해주세요.
          </p>
          <div style={{ marginTop: '28px' }}>
            <a
              href="/plug/login"
              className="auth-submit-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                height: '46px',
                fontSize: '15px',
                fontWeight: '600'
              }}
            >
              로그인 페이지로 이동
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--signup">
        <div className="auth-header">
          <h2>회원가입</h2>
          <p>PL:UG 회원으로 가입하고 다양한 축구 커뮤니티 활동을 즐겨보세요.</p>
        </div>

        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* 아이디 & 중복확인 */}
          <div className="auth-field">
            <label htmlFor="signupId">아이디</label>
            <div className="auth-input-group">
              <input
                id="signupId"
                type="text"
                placeholder="영문, 숫자 4~20자"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value)
                  setIdChecked(false)
                  setIdCheckMsg('')
                }}
              />
              <button
                type="button"
                className="auth-check-btn"
                onClick={handleCheckId}
              >
                중복확인
              </button>
            </div>
            {idCheckMsg && (
              <span className={`auth-hint ${idChecked ? 'auth-hint--ok' : 'auth-hint--err'}`}>
                {idCheckMsg}
              </span>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="auth-field">
            <label htmlFor="signupPassword">비밀번호</label>
            <input
              id="signupPassword"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div className="auth-field">
            <label htmlFor="signupPasswordConfirm">비밀번호 확인</label>
            <input
              id="signupPasswordConfirm"
              type="password"
              placeholder="비밀번호를 다시 한 번 입력하세요"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
            {passwordConfirm && (
              <span className={`auth-hint ${password === passwordConfirm ? 'auth-hint--ok' : 'auth-hint--err'}`}>
                {password === passwordConfirm ? '✓ 비밀번호가 일치합니다.' : '✕ 비밀번호가 일치하지 않습니다.'}
              </span>
            )}
          </div>

          {/* 닉네임 & 중복확인 */}
          <div className="auth-field">
            <label htmlFor="signupNickname">닉네임</label>
            <div className="auth-input-group">
              <input
                id="signupNickname"
                type="text"
                placeholder="활동에 사용할 닉네임"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value)
                  setNicknameChecked(false)
                  setNicknameCheckMsg('')
                }}
              />
              <button
                type="button"
                className="auth-check-btn"
                onClick={handleCheckNickname}
              >
                중복확인
              </button>
            </div>
            {nicknameCheckMsg && (
              <span className={`auth-hint ${nicknameChecked ? 'auth-hint--ok' : 'auth-hint--err'}`}>
                {nicknameCheckMsg}
              </span>
            )}
          </div>

          {/* 이메일 */}
          <div className="auth-field">
            <label htmlFor="signupEmail">이메일</label>
            <input
              id="signupEmail"
              type="email"
              placeholder="example@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {email && (
              <span className={`auth-hint ${EMAIL_REGEX.test(email.trim()) ? 'auth-hint--ok' : 'auth-hint--err'}`}>
                {EMAIL_REGEX.test(email.trim()) ? '✓ 올바른 이메일 형식입니다.' : '✕ 올바른 이메일 형식이 아닙니다. (영문/숫자 시작·끝, 특수문자 . _ - 허용, 4~30자)'}
              </span>
            )}
          </div>

          {/* 선호 구단 선택 */}
          <div className="auth-field">
            <label htmlFor="signupTeam">응원 구단 (선택)</label>
            <select
              id="signupTeam"
              value={favoriteTeamId}
              onChange={(e) => setFavoriteTeamId(e.target.value)}
            >
              <option value="">선택 안 함</option>
              {teamList.map((team) => (
                <option key={team.teamId} value={team.teamId}>
                  {team.teamNameKor ? `${team.teamNameKor} (${team.teamName})` : team.teamName}
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? '가입 처리 중...' : '회원가입 완료'}
          </button>
        </form>

        <div className="auth-footer">
          <span>이미 계정이 있으신가요?</span>
          <a href="/plug/login">로그인</a>
        </div>
      </div>
    </div>
  )
}
