import { useState, useEffect } from 'react'

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
        alert('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.')
        window.location.assign('/plug/login')
      } else {
        setErrorMsg(data.message || '회원가입 처리 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setErrorMsg('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card auth-card--signup">
        <div className="auth-header">
          <h2>회원가입</h2>
          <p>BUILDUP 회원으로 가입하고 다양한 축구 커뮤니티 활동을 즐겨보세요.</p>
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
