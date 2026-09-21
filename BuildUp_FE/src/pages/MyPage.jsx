import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateUser, logout } from '../store/authSlice.js'

const EMAIL_REGEX = /^[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9._-]{2,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

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

  // 회원 탈퇴 경고 모달 상태
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAgreed, setWithdrawAgreed] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

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
        const userObj = data.data || data.user

        if (res.ok && (data.status === 'SUCCESS' || data.code === 'SUC_001') && userObj) {
          setProfile(userObj)
          setNickname(userObj.nickname || '')
          setEmail(userObj.email || '')
          setFavoriteTeamId(userObj.favoriteTeamId ? String(userObj.favoriteTeamId) : '')
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

    if (!email.trim()) {
      setErrorMsg('이메일을 입력해주세요.')
      return
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setErrorMsg('올바른 이메일 형식을 입력해주세요. (영문, 숫자, 특수문자 . _ - 허용, 4~30자)')
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
      const updatedUser = data.data || data.user

      if (res.ok && (data.status === 'SUCCESS' || data.code === 'SUC_001') && updatedUser) {
        setMessage('회원 정보가 성공적으로 수정되었습니다.')
        setProfile(updatedUser)
        dispatch(updateUser(updatedUser))
        setIsEditing(false)
      } else {
        setErrorMsg(data.message || '정보 수정 중 오류가 발생했습니다.')
      }
    } catch (err) {
      console.error('[프로필 수정 오류]', err)
      setErrorMsg('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setSaving(false)
    }
  }

  // 회원 탈퇴 모달 열기
  const handleWithdrawClick = () => {
    setWithdrawAgreed(false)
    setShowWithdrawModal(true)
  }

  // 회원 탈퇴 최종 실행
  const handleConfirmWithdraw = async () => {
    if (!withdrawAgreed) {
      alert('탈퇴 유의사항을 확인하시고 동의 체크박스를 선택해 주세요.')
      return
    }

    setWithdrawing(true)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers
      })

      const data = await res.json()
      if (data.status === 'SUCCESS' || data.code === 'SUC_001') {
        alert('회원 탈퇴가 완료되었습니다.\n작성하신 게시글과 댓글은 커뮤니티 보존을 위해 (탈퇴회원)으로 유지됩니다.')
        setShowWithdrawModal(false)
        dispatch(logout())
        window.location.assign('/plug/login')
      } else {
        alert(data.message || '회원 탈퇴 처리 중 오류가 발생했습니다.')
      }
    } catch (err) {
      console.error('[회원 탈퇴 오류]', err)
      alert('서버와 통신할 수 없습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setWithdrawing(false)
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

        {/* 회원 탈퇴 링크 (마이페이지 하단, 회색 글자로 작게) */}
        <div style={{ marginTop: '28px', textAlign: 'center', borderTop: '1px solid #f1f3f5', paddingTop: '16px' }}>
          <button
            type="button"
            onClick={handleWithdrawClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '4px 8px'
            }}
          >
            회원탈퇴
          </button>
        </div>
      </div>

      {/* 회원 탈퇴 경고 모달 */}
      {showWithdrawModal && (
        <div className="withdraw-modal-overlay" onClick={() => !withdrawing && setShowWithdrawModal(false)}>
          <div className="withdraw-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="withdraw-modal-header">
              <span style={{ fontSize: '22px' }}>⚠️</span>
              <h3>회원 탈퇴 전 필수 확인 사항</h3>
            </div>

            <div className="withdraw-warning-box">
              <div className="withdraw-warning-item">
                <h4 className="withdraw-item-title">1. 작성된 게시글 및 댓글 보존</h4>
                <p className="withdraw-item-desc">
                  회원 탈퇴를 진행하더라도 기존에 작성하신 게시글과 댓글은 삭제되지 않고 사이트에 영구 보존되며, 작성자명은 <strong>(탈퇴회원)</strong>으로 안전하게 익명화 처리됩니다.
                </p>
              </div>

              <div className="withdraw-warning-item">
                <h4 className="withdraw-item-title">2. 작성글 수정 및 삭제 영구 불가 (중요)</h4>
                <p className="withdraw-item-desc">
                  탈퇴 완료 즉시 계정이 소멸되므로, 이후에는 본인이 작성했던 글이나 댓글을 다시 수정하거나 삭제할 수 없습니다.
                </p>
                <p className="withdraw-item-desc">
                  삭제를 원하시는 게시물이나 댓글이 있다면 <strong>반드시 탈퇴 전에 먼저 직접 삭제</strong>해 주시기 바랍니다.
                </p>
              </div>

              <div className="withdraw-warning-item">
                <h4 className="withdraw-item-title">3. 계정 복구 불가 및 재가입 안내</h4>
                <p className="withdraw-item-desc">
                  탈퇴 즉시 보유 포인트 및 계정 정보는 초기화되며 복구가 불가능합니다. 추후 동일한 이메일로 다시 회원가입을 하실 수는 있으나, 새로운 계정으로 생성되므로 <strong>이전 작성글에 대한 관리 권한은 절대 복구되지 않습니다.</strong>
                </p>
              </div>
            </div>

            <label className="withdraw-agree-label">
              <input
                type="checkbox"
                checked={withdrawAgreed}
                onChange={(e) => setWithdrawAgreed(e.target.checked)}
                disabled={withdrawing}
              />
              <span>위 유의사항을 모두 확인하였으며, 이에 동의하고 탈퇴를 진행합니다. (필수)</span>
            </label>

            <div className="withdraw-modal-actions">
              <button
                type="button"
                className="withdraw-cancel-modal-btn"
                onClick={() => setShowWithdrawModal(false)}
                disabled={withdrawing}
              >
                취소
              </button>
              <button
                type="button"
                className="withdraw-confirm-btn"
                onClick={handleConfirmWithdraw}
                disabled={!withdrawAgreed || withdrawing}
              >
                {withdrawing ? '탈퇴 처리 중...' : '탈퇴 완료하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
