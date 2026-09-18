import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateUser } from '../store/authSlice.js'

export default function MyPage() {
  const dispatch = useDispatch()
  const reduxUser = useSelector((state) => state.auth.user)
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)

  const [profile, setProfile] = useState(null)
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

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 사용자 상세 정보 로드
  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('buildup_token')
        const headers = {}
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }

        const res = await fetch('/api/users/me', { headers })
        const data = await res.json()

        if (res.ok && data.status === 'SUCCESS' && data.user) {
          setProfile(data.user)
          setNickname(data.user.nickname || '')
          setEmail(data.user.email || '')
          setFavoriteTeamId(data.user.favoriteTeamId ? String(data.user.favoriteTeamId) : '')
        } else {
          // 백엔드 세션 만료 시 리덕스 데이터로 1차 폴백
          if (reduxUser) {
            setProfile(reduxUser)
            setNickname(reduxUser.nickname || '')
            setEmail(reduxUser.email || '')
            setFavoriteTeamId(reduxUser.favoriteTeamId ? String(reduxUser.favoriteTeamId) : '')
          }
        }
      } catch (err) {
        if (reduxUser) {
          setProfile(reduxUser)
          setNickname(reduxUser.nickname || '')
          setEmail(reduxUser.email || '')
          setFavoriteTeamId(reduxUser.favoriteTeamId ? String(reduxUser.favoriteTeamId) : '')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isLoggedIn, reduxUser])

  // 정보 수정 저장
  const handleSave = async (e) => {
    e.preventDefault()
    setMessage('')
    setErrorMsg('')

    if (!nickname.trim()) {
      setErrorMsg('닉네임을 입력해주세요.')
      return
    }

    setSaving(true)

    try {
      const token = localStorage.getItem('buildup_token')
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          nickname: nickname.trim(),
          email: email.trim(),
          favoriteTeamId: favoriteTeamId ? Number(favoriteTeamId) : null
        })
      })

      const data = await res.json()

      if (res.ok && data.status === 'SUCCESS') {
        setMessage('회원 정보가 성공적으로 수정되었습니다.')
        setProfile(data.user)
        dispatch(updateUser(data.user))
        setIsEditing(false)
      } else {
        setErrorMsg(data.message || '정보 수정 중 오류가 발생했습니다.')
      }
    } catch (err) {
      setErrorMsg('서버와 통신할 수 없습니다.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="mypage-loading">회원 정보를 불러오는 중입니다...</div>
  }

  if (!isLoggedIn || !profile) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h2>로그인이 필요합니다</h2>
            <p>마이페이지는 로그인 후 이용하실 수 있습니다.</p>
          </div>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <a href="/plug/login" className="auth-submit-btn" style={{ display: 'inline-block', textDecoration: 'none' }}>
              로그인하러 가기
            </a>
          </div>
        </div>
      </div>
    )
  }

  // 응원 구단 데이터 찾기 (실제 DB 구단 목록 탐색)
  const favoriteTeam = teamList.find((t) => String(t.teamId) === String(profile.favoriteTeamId))

  return (
    <div className="mypage-container">
      <div className="mypage-card">
        {/* 상단 프로필 요약 헤더 */}
        <div className="mypage-header">
          <div className="mypage-avatar-area">
            {favoriteTeam?.emblemUrl ? (
              <img
                src={favoriteTeam.emblemUrl}
                alt={favoriteTeam.teamNameKor || favoriteTeam.teamName}
                className="mypage-team-emblem"
              />
            ) : (
              <div className="mypage-default-avatar">⚽</div>
            )}
          </div>
          <div className="mypage-user-title">
            <h2>{profile.nickname} <span>님</span></h2>
            <p className="mypage-login-id">@{profile.loginId}</p>
            {favoriteTeam && (
              <span className="mypage-team-badge">응원 구단: {favoriteTeam.teamNameKor || favoriteTeam.teamName}</span>
            )}
          </div>
        </div>

        {/* 포인트 및 활동 요약 바 */}
        <div className="mypage-stat-bar">
          <div className="mypage-stat-item">
            <span className="mypage-stat-label">보유 포인트</span>
            <span className="mypage-stat-value">{profile.point?.toLocaleString() || 100} P</span>
          </div>
          <div className="mypage-stat-item">
            <span className="mypage-stat-label">회원 등급</span>
            <span className="mypage-stat-value">{profile.roleName || (profile.roleCode === 9 ? '관리자' : '일반회원')}</span>
          </div>
          <div className="mypage-stat-item">
            <span className="mypage-stat-label">가입일</span>
            <span className="mypage-stat-value">{profile.createdAt ? profile.createdAt.split(' ')[0] : '2026-09-18'}</span>
          </div>
        </div>

        {message && <div className="auth-success-banner">{message}</div>}
        {errorMsg && <div className="auth-error-banner">{errorMsg}</div>}

        {/* 프로필 상세 및 수정 폼 */}
        {!isEditing ? (
          <div className="mypage-view-section">
            <div className="mypage-info-row">
              <span className="mypage-info-label">아이디</span>
              <span className="mypage-info-value">{profile.loginId}</span>
            </div>
            <div className="mypage-info-row">
              <span className="mypage-info-label">닉네임</span>
              <span className="mypage-info-value">{profile.nickname}</span>
            </div>
            <div className="mypage-info-row">
              <span className="mypage-info-label">이메일</span>
              <span className="mypage-info-value">{profile.email || '미등록'}</span>
            </div>
            <div className="mypage-info-row">
              <span className="mypage-info-label">응원 구단</span>
              <span className="mypage-info-value">
                {favoriteTeam ? (favoriteTeam.teamNameKor || favoriteTeam.teamName) : '선택된 구단 없음'}
              </span>
            </div>

            <div className="mypage-actions">
              <button
                type="button"
                className="auth-submit-btn"
                onClick={() => setIsEditing(true)}
              >
                회원 정보 수정
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="auth-form" style={{ marginTop: '20px' }}>
            <div className="auth-field">
              <label>아이디 (변경 불가)</label>
              <input type="text" value={profile.loginId} disabled />
            </div>

            <div className="auth-field">
              <label htmlFor="editNickname">닉네임</label>
              <input
                id="editNickname"
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="editEmail">이메일</label>
              <input
                id="editEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="editTeam">응원 구단</label>
              <select
                id="editTeam"
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

            <div className="mypage-actions">
              <button type="submit" className="auth-submit-btn" disabled={saving}>
                {saving ? '저장 중...' : '수정 완료'}
              </button>
              <button
                type="button"
                className="mypage-cancel-btn"
                onClick={() => {
                  setIsEditing(false)
                  setNickname(profile.nickname || '')
                  setEmail(profile.email || '')
                  setFavoriteTeamId(profile.favoriteTeamId ? String(profile.favoriteTeamId) : '')
                  setErrorMsg('')
                }}
              >
                취소
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
