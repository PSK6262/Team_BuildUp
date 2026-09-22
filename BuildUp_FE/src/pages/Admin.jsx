import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { logout, isTokenExpired } from '../store/authSlice.js'
import { communityTeams } from '../data/communityTeams.js'
import '../css/Admin.css'

export default function Admin() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)

  const [activeTab, setActiveTab] = useState('overview')
  const [alert, setAlert] = useState(null)
  const [loading, setLoading] = useState(false)

  // 1. 개요(Overview) & 통계
  const [summary, setSummary] = useState({
    TOTAL_USERS: 0,
    WITHDRAWN_USERS: 0,
    TOTAL_MATCHES: 0,
    SCHEDULED_MATCHES: 0,
    MISMATCH_MATCHES: 0,
    INJURED_PLAYERS: 0,
    BLIND_POSTS: 0,
    BLIND_COMMENTS: 0,
    DELETED_POSTS: 0,
    DELETED_COMMENTS: 0,
  })
  const [recentPoints, setRecentPoints] = useState([])

  // 2. 경기 & 부상 관리
  const [matches, setMatches] = useState([])
  const [matchDateFilter, setMatchDateFilter] = useState('')
  const [matchStatusFilter, setMatchStatusFilter] = useState('')
  const [matchSortOrder, setMatchSortOrder] = useState('AUTO') // 'AUTO' | 'ASC' | 'DESC'
  const [selectedTeamId, setSelectedTeamId] = useState(57) // 기본 Arsenal
  const [teamPlayers, setTeamPlayers] = useState([])
  const [injuredSummary, setInjuredSummary] = useState([])

  // 3. 커뮤니티 모더레이션
  const [communitySubTab, setCommunitySubTab] = useState('posts')
  const [posts, setPosts] = useState([])
  const [postStatusFilter, setPostStatusFilter] = useState('') // ''(전체) | 'NORMAL' | 'BLIND' | 'DELETED'
  const [postKeyword, setPostKeyword] = useState('')
  const [comments, setComments] = useState([])
  const [commentStatusFilter, setCommentStatusFilter] = useState('') // ''(전체) | 'NORMAL' | 'BLIND' | 'DELETED'
  const [commentKeyword, setCommentKeyword] = useState('')

  // 4. 회원 관리
  const [users, setUsers] = useState([])
  const [userKeyword, setUserKeyword] = useState('')
  const [userRoleFilter, setUserRoleFilter] = useState('')

  // 5. 모달 제어 상태
  const [noticeModal, setNoticeModal] = useState(null) // { matchId, title, notice }
  const [scoreModal, setScoreModal] = useState(null)   // { matchId, homeScore, awayScore, status }
  const [injuryModal, setInjuryModal] = useState(null) // { playerId, name, isInjured, injuryNote, isSuspended }
  const [pointModal, setPointModal] = useState(null)   // { userId, nickname, amount, description }
  const [roleModal, setRoleModal] = useState(null)     // { userId, nickname, roleCode }
  const [viewPostModal, setViewPostModal] = useState(null) // { title, content, nickname, isBlind, unblurred }

  // 6. 데이터 동기화 제어
  const [syncDate, setSyncDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null) // { active: true, message: '...' }

  // 관리자 권한 여부 판별 (ROLE_ADMIN = 9)
  const isAdmin = user && (Number(user.roleCode) === 9)

  // 공통 인증 헤더 생성 함수 (JWT 토큰 탑재)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('buildup_token')
    if (token && isTokenExpired(token)) {
      dispatch(logout())
      return { 'Content-Type': 'application/json' }
    }
    const headers = { 'Content-Type': 'application/json' }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type })
    setTimeout(() => setAlert(null), 4000)
  }

  // 일정 시간 동안 "동기화 중입니다..." 상태를 먼저 표시하고, 실패 시에도 바로 붉은 에러를 띄우지 않고 대기/재시도 후 안내
  const executeWithSyncGrace = async (fetchAction, targetName) => {
    const token = localStorage.getItem('buildup_token')
    if (!token || isTokenExpired(token)) {
      dispatch(logout())
      showAlert('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error')
      return
    }

    setAlert(null)
    setLoading(true)
    setSyncStatus({
      active: true,
      message: `${targetName} 데이터를 동기화하는 중입니다...`,
    })

    const startTime = Date.now()
    const MIN_SYNC_WAIT_MS = 1500 // 최소 동기화 안내 표시 시간 (1.5초)

    let success = false
    let isAuthError = false

    try {
      const ok = await fetchAction()
      if (ok === 'AUTH_ERROR') {
        isAuthError = true
      } else if (ok) {
        success = true
      }
    } catch (e) {
      // 1차 실패 시 아래에서 재시도
    }

    // 일시적 오류 방지를 위해 실패 시 800ms 대기 후 1회 재시도 (단, 인증/권한 에러 시에는 재시도 생략)
    if (!success && !isAuthError) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 800))
        const retryOk = await fetchAction()
        if (retryOk === 'AUTH_ERROR') {
          isAuthError = true
        } else if (retryOk) {
          success = true
        }
      } catch (retryErr) {
        // 재시도 실패
      }
    }

    // 최소 안내 시간 보장 (들어가자마자 실패 경고창이 번쩍이며 뜨는 현상 방지)
    const elapsed = Date.now() - startTime
    if (elapsed < MIN_SYNC_WAIT_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_SYNC_WAIT_MS - elapsed))
    }

    setLoading(false)
    setSyncStatus(null)

    if (isAuthError) {
      dispatch(logout())
      showAlert('로그인 세션(토큰)이 만료되었거나 접근 권한이 없습니다. 다시 로그인해주세요.', 'error')
    } else if (!success) {
      showAlert(
        `${targetName}을(를) 일정 시간 동안 불러오지 못했습니다. 서버 상태를 확인해주세요.`,
        'error'
      )
    }
  }

  // --- API 호출 함수들 ---
  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/admin/summary', {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (res.status === 401 || res.status === 403) {
        dispatch(logout())
        showAlert('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error')
        return
      }
      const json = await res.json()
      if (json.code === 'FORBIDDEN' || json.code === 'ERR_003' || json.code === 'UNAUTHORIZED') {
        dispatch(logout())
        showAlert('로그인 세션(토큰)이 만료되었습니다. 다시 로그인해주세요.', 'error')
        return
      }
      if (json.code === 'SUC_001' && json.data) {
        setSummary(json.data)
      }
    } catch (e) {
      console.warn('요약 통계 조회 실패', e)
    }
  }

  const fetchRecentPoints = async () => {
    try {
      const res = await fetch('/api/admin/points/recent', {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.code === 'SUC_001' && json.data) {
        setRecentPoints(json.data)
      }
    } catch (e) {
      console.warn('최근 포인트 이력 조회 실패', e)
    }
  }

  const fetchMatches = async (overrideSort = null) => {
    return executeWithSyncGrace(async () => {
      const params = new URLSearchParams()
      if (matchDateFilter) params.append('date', matchDateFilter)
      if (matchStatusFilter) params.append('status', matchStatusFilter)

      const sortToUse = overrideSort || matchSortOrder
      if (sortToUse && sortToUse !== 'AUTO') {
        params.append('sort', sortToUse)
      } else {
        // AUTO일 때 상태 기반 자동 정렬: 예정은 가장 가까운 순(ASC), 종료는 최신 순(DESC)
        if (matchStatusFilter === 'SCHEDULED' || matchStatusFilter === 'TIMED') {
          params.append('sort', 'ASC')
        } else if (matchStatusFilter === 'FINISHED') {
          params.append('sort', 'DESC')
        }
      }

      const res = await fetch(`/api/admin/matches?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (res.status === 401 || res.status === 403) {
        return 'AUTH_ERROR'
      }
      const json = await res.json()
      if (json.code === 'FORBIDDEN' || json.code === 'ERR_003' || json.code === 'UNAUTHORIZED') {
        return 'AUTH_ERROR'
      }
      if (json.code === 'SUC_001' && json.data) {
        setMatches(json.data)
        return true
      }
      return false
    }, '경기 일정')
  }

  const fetchTeamPlayers = async (teamId) => {
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/players`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.code === 'SUC_001' && json.data) {
        setTeamPlayers(json.data)
      }
    } catch (e) {
      console.warn('선수 명단 조회 실패', e)
    }
  }

  const fetchInjuredSummary = async () => {
    try {
      const res = await fetch('/api/admin/players/injured-summary', {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.code === 'SUC_001' && json.data) {
        setInjuredSummary(json.data)
      }
    } catch (e) {
      console.warn('부상자 요약 조회 실패', e)
    }
  }

  const fetchPosts = async (overrideStatus, overrideKeyword) => {
    return executeWithSyncGrace(async () => {
      const statusToUse = overrideStatus !== undefined ? overrideStatus : postStatusFilter
      const keywordToUse = overrideKeyword !== undefined ? overrideKeyword : postKeyword
      const params = new URLSearchParams()
      if (statusToUse === 'BLIND') {
        params.append('isBlind', 'Y')
        params.append('isDeleted', 'N')
      } else if (statusToUse === 'DELETED') {
        params.append('isDeleted', 'Y')
      } else if (statusToUse === 'NORMAL') {
        params.append('isBlind', 'N')
        params.append('isDeleted', 'N')
      }
      if (keywordToUse) params.append('keyword', keywordToUse)
      const res = await fetch(`/api/admin/community/posts?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (res.status === 401 || res.status === 403) {
        return 'AUTH_ERROR'
      }
      const json = await res.json()
      if (json.code === 'FORBIDDEN' || json.code === 'ERR_003' || json.code === 'UNAUTHORIZED') {
        return 'AUTH_ERROR'
      }
      if (json.code === 'SUC_001' && json.data) {
        setPosts(json.data)
        return true
      }
      return false
    }, '커뮤니티 게시글')
  }

  const fetchComments = async (overrideStatus, overrideKeyword) => {
    return executeWithSyncGrace(async () => {
      const statusToUse = overrideStatus !== undefined ? overrideStatus : commentStatusFilter
      const keywordToUse = overrideKeyword !== undefined ? overrideKeyword : commentKeyword
      const params = new URLSearchParams()
      if (statusToUse === 'BLIND') {
        params.append('isBlind', 'Y')
        params.append('isDeleted', 'N')
      } else if (statusToUse === 'DELETED') {
        params.append('isDeleted', 'Y')
      } else if (statusToUse === 'NORMAL') {
        params.append('isBlind', 'N')
        params.append('isDeleted', 'N')
      }
      if (keywordToUse) params.append('keyword', keywordToUse)
      const res = await fetch(`/api/admin/community/comments?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (res.status === 401 || res.status === 403) {
        return 'AUTH_ERROR'
      }
      const json = await res.json()
      if (json.code === 'FORBIDDEN' || json.code === 'ERR_003' || json.code === 'UNAUTHORIZED') {
        return 'AUTH_ERROR'
      }
      if (json.code === 'SUC_001' && json.data) {
        setComments(json.data)
        return true
      }
      return false
    }, '커뮤니티 댓글')
  }

  const fetchUsers = async (overrideKeyword, overrideRole) => {
    return executeWithSyncGrace(async () => {
      const keywordToUse = overrideKeyword !== undefined ? overrideKeyword : userKeyword
      const roleToUse = overrideRole !== undefined ? overrideRole : userRoleFilter
      const params = new URLSearchParams()
      if (keywordToUse) params.append('keyword', keywordToUse)
      if (roleToUse) params.append('roleCode', roleToUse)
      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      if (res.status === 401 || res.status === 403) {
        return 'AUTH_ERROR'
      }
      const json = await res.json()
      if (json.code === 'FORBIDDEN' || json.code === 'ERR_003' || json.code === 'UNAUTHORIZED') {
        return 'AUTH_ERROR'
      }
      if (json.code === 'SUC_001' && json.data) {
        setUsers(json.data)
        return true
      }
      return false
    }, '회원 목록')
  }

  // 초기 로딩
  useEffect(() => {
    if (isAdmin) {
      fetchSummary()
      fetchRecentPoints()
      fetchInjuredSummary()
    }
  }, [isAdmin])

  // 탭 전환 시 자동 데이터 로드
  useEffect(() => {
    if (!isAdmin) return
    setAlert(null) // 탭 전환 시 이전 알림 즉시 초기화
    if (activeTab === 'matches') {
      fetchMatches()
      fetchTeamPlayers(selectedTeamId)
      fetchInjuredSummary()
    } else if (activeTab === 'community') {
      if (communitySubTab === 'posts') fetchPosts()
      else fetchComments()
    } else if (activeTab === 'users') {
      fetchUsers()
    } else if (activeTab === 'overview') {
      fetchSummary()
      fetchRecentPoints()
      fetchInjuredSummary()
    }
  }, [activeTab, isAdmin])

  // --- 관리자 액션 핸들러 ---

  // 1. 경기 공지사항 저장
  const handleSaveNotice = async () => {
    if (!noticeModal) return
    try {
      const res = await fetch(`/api/admin/matches/${noticeModal.matchId}/notice`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ notice: noticeModal.notice }),
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        showAlert('경기 공지사항이 성공적으로 등록/수정되었습니다.')
        setNoticeModal(null)
        fetchMatches()
      } else {
        showAlert(json.message || '공지 수정 실패', 'error')
      }
    } catch (e) {
      showAlert('공지사항 수정 요청 중 오류가 발생했습니다.', 'error')
    }
  }

  // 2. 경기 스코어/상태 긴급 정정
  const handleSaveScore = async () => {
    if (!scoreModal) return
    try {
      const res = await fetch(`/api/admin/matches/${scoreModal.matchId}/score`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          homeScore: scoreModal.homeScore !== '' ? Number(scoreModal.homeScore) : null,
          awayScore: scoreModal.awayScore !== '' ? Number(scoreModal.awayScore) : null,
          status: scoreModal.status,
        }),
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        showAlert('경기 스코어 및 상태가 갱신되었습니다.')
        setScoreModal(null)
        fetchMatches()
      } else {
        showAlert(json.message || '스코어 수정 실패', 'error')
      }
    } catch (e) {
      showAlert('경기 스코어 수정 중 오류가 발생했습니다.', 'error')
    }
  }

  // 3. 선수 부상 및 사유 저장
  const handleSaveInjury = async () => {
    if (!injuryModal) return
    try {
      const res = await fetch(`/api/admin/players/${injuryModal.playerId}/injury`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          isInjured: injuryModal.isInjured,
          injuryNote: injuryModal.injuryNote,
          isSuspended: injuryModal.isSuspended,
        }),
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        showAlert('선수 부상 및 결장 정보가 저장되었습니다.')
        setInjuryModal(null)
        fetchTeamPlayers(selectedTeamId)
        fetchInjuredSummary()
        fetchSummary()
      } else {
        showAlert(json.message || '부상 정보 저장 실패', 'error')
      }
    } catch (e) {
      showAlert('부상 정보 저장 중 오류가 발생했습니다.', 'error')
    }
  }

  // 4. 게시글 블라인드 토글
  const handleTogglePostBlind = async (postId, currentBlind) => {
    const nextBlind = currentBlind === 'Y' ? 'N' : 'Y'
    try {
      const res = await fetch(`/api/admin/community/posts/${postId}/blind`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isBlind: nextBlind }),
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        showAlert(`게시글이 ${nextBlind === 'Y' ? '블라인드 처리' : '블라인드 해제'}되었습니다.`)
        fetchPosts()
        fetchSummary()
      } else {
        showAlert('블라인드 상태 변경 실패', 'error')
      }
    } catch (e) {
      showAlert('요청 중 통신 오류가 발생했습니다.', 'error')
    }
  }

  // 5. 관리자가 작성자와 관계없이 게시글을 삭제 처리합니다.
  const handleDeletePost = async (postId, title) => {
    if (!window.confirm(`'${title}' 게시글을 삭제하시겠습니까?`)) return
    try {
      const res = await fetch(`/api/admin/community/posts/${postId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        showAlert('게시글이 삭제 처리되었습니다.')
        fetchPosts()
        fetchSummary()
      } else {
        showAlert(json.message || '게시글 삭제에 실패했습니다.', 'error')
      }
    } catch (e) {
      showAlert('게시글 삭제 중 통신 오류가 발생했습니다.', 'error')
    }
  }

  // 6. 댓글 블라인드 토글
  const handleToggleCommentBlind = async (commentId, currentBlind) => {
    const nextBlind = currentBlind === 'Y' ? 'N' : 'Y'
    try {
      const res = await fetch(`/api/admin/community/comments/${commentId}/blind`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ isBlind: nextBlind }),
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        showAlert(`댓글이 ${nextBlind === 'Y' ? '블라인드 처리' : '블라인드 해제'}되었습니다.`)
        fetchComments()
        fetchSummary()
      } else {
        showAlert('블라인드 상태 변경 실패', 'error')
      }
    } catch (e) {
      showAlert('요청 중 통신 오류가 발생했습니다.', 'error')
    }
  }

  // 7. 회원 권한 변경
  const handleSaveRole = async () => {
    if (!roleModal) return
    try {
      const res = await fetch(`/api/admin/users/${roleModal.userId}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ roleCode: Number(roleModal.roleCode) }),
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        showAlert('회원 권한 등급이 변경되었습니다.')
        setRoleModal(null)
        fetchUsers()
      } else {
        showAlert('권한 변경 실패', 'error')
      }
    } catch (e) {
      showAlert('권한 변경 중 통신 오류가 발생했습니다.', 'error')
    }
  }

  // 8. 포인트 조정
  const handleSavePoints = async () => {
    if (!pointModal || !pointModal.amount) return
    try {
      const res = await fetch(`/api/admin/users/${pointModal.userId}/points`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(pointModal.amount),
          description: pointModal.description || '관리자 수동 조정',
        }),
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        showAlert('포인트가 정상적으로 지급/차감되었습니다.')
        setPointModal(null)
        fetchUsers()
        fetchRecentPoints()
      } else {
        showAlert('포인트 조정 실패', 'error')
      }
    } catch (e) {
      showAlert('포인트 조정 중 통신 오류가 발생했습니다.', 'error')
    }
  }

  // 9. 데이터 동기화 트리거
  const handleTriggerSync = async (endpoint, paramKey = null, paramVal = null, label = '') => {
    try {
      setSyncLoading(true)
      setAlert(null)
      setSyncStatus({ active: true, message: `${label}을(를) 외부 API와 동기화하는 중입니다...` })

      let url = `/api/admin/sync/${endpoint}`
      if (paramKey && paramVal) {
        url += `?${paramKey}=${encodeURIComponent(paramVal)}`
      }
      const res = await fetch(url, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      })
      const json = await res.json()
      if (json.code === 'SUC_001') {
        let detailMsg = ''
        if (json.data?.syncedMatches !== undefined) detailMsg = ` (${json.data.syncedMatches}건)`
        else if (json.data?.syncedEvents !== undefined) detailMsg = ` (${json.data.syncedEvents}건)`
        else if (json.data?.syncedPlayers !== undefined) detailMsg = ` (${json.data.syncedPlayers}명)`
        else if (json.data?.syncedScorers !== undefined) detailMsg = ` (${json.data.syncedScorers}명)`
        else if (json.data?.syncedStandings !== undefined) detailMsg = ` (${json.data.syncedStandings}개 구단)`

        showAlert(`${label} 동기화가 성공적으로 완료되었습니다!${detailMsg}`)
        fetchSummary()
        if (activeTab === 'matches') fetchMatches()
      } else {
        showAlert(`${label} 동기화 실패: ${json.message || '오류가 발생했습니다.'}`, 'error')
      }
    } catch (e) {
      showAlert(`${label} 동기화 요청 실패: 서버 상태를 확인해주세요.`, 'error')
    } finally {
      setSyncLoading(false)
      setSyncStatus(null)
    }
  }

  // 비관리자 또는 미로그인 시 차단 화면
  if (!isLoggedIn || !isAdmin) {
    return (
      <main className="admin-unauthorized">
        <h2>관리자 전용 페이지</h2>
        <p>
          접근 권한이 없습니다.<br />
          이 페이지는 <strong>PL:UG 관리자(ROLE_ADMIN)</strong> 계정만 이용할 수 있습니다.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <a href="/plug/mainpage" style={{ background: '#64748b' }}>메인으로 이동</a>
          <a href="/plug/login">로그인 하기</a>
        </div>
      </main>
    )
  }

  return (
    <div className="admin-container">
      {/* 관리자 헤더 */}
      <header className="admin-header">
        <div className="admin-header__title">
          <h1>PL:UG 관리자 센터</h1>
          <span className="admin-badge">ADMIN CONSOLE</span>
        </div>
        <div className="admin-header__user">
          <span>접속 관리자: <strong>{user.nickname}</strong> ({user.loginId})</span>
          <button
            type="button"
            className="admin-btn-refresh"
            onClick={() => {
              fetchSummary()
              showAlert('지표가 최신화되었습니다.')
            }}
          >
            새로고침
          </button>
        </div>
      </header>

      {/* 동기화 진행 상태 알림 메시지 바 */}
      {syncStatus?.active && (
        <div className="admin-alert admin-alert--syncing">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="admin-spinner">🔄</span>
            <strong>{syncStatus.message}</strong>
          </div>
          <span style={{ fontSize: 12, opacity: 0.8 }}>서버 응답 대기 중</span>
        </div>
      )}

      {/* 피드백 알림 메시지 (동기화 중이 아닐 때만 표시) */}
      {!syncStatus?.active && alert && (
        <div className={`admin-alert admin-alert--${alert.type}`}>
          <span>{alert.message}</span>
          <button type="button" className="admin-alert__close" onClick={() => setAlert(null)}>×</button>
        </div>
      )}

      {/* 5대 핵심 탭 메뉴 */}
      <nav className="admin-tabs">
        <button
          type="button"
          className={`admin-tab ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          대시보드 요약
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'matches' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('matches')}
        >
          경기 & 부상 공지 관리
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'community' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('community')}
        >
          커뮤니티 블라인드 제재
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'users' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          회원 & 포인트 관리
        </button>
        <button
          type="button"
          className={`admin-tab ${activeTab === 'sync' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('sync')}
        >
          데이터 수동 동기화
        </button>
      </nav>

      {/* ==================== 1. 대시보드 요약 탭 ==================== */}
      {activeTab === 'overview' && (
        <div>
          <div className="admin-kpi-grid">
            <div className="admin-kpi-card admin-kpi-card--highlight">
              <div className="admin-kpi-card__label">활성 회원수</div>
              <div className="admin-kpi-card__value">{summary.TOTAL_USERS || 0}명</div>
              <div className="admin-kpi-card__sub">
                활동 회원 {summary.WITHDRAWN_USERS > 0 ? `(탈퇴 ${summary.WITHDRAWN_USERS}명 제외)` : ''}
              </div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-card__label">총 등록 경기</div>
              <div className="admin-kpi-card__value">{summary.TOTAL_MATCHES || 0}경기</div>
              <div className="admin-kpi-card__sub">진행예정 {summary.SCHEDULED_MATCHES || 0}경기</div>
            </div>
            <div
              className={`admin-kpi-card ${Number(summary.MISMATCH_MATCHES || 0) > 0 ? 'admin-kpi-card--danger' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setActiveTab('matches')
                setMatchStatusFilter('MISMATCH')
                fetchMatches('DESC')
              }}
              title="클릭 시 이벤트 불일치 경기 목록으로 이동합니다"
            >
              <div className="admin-kpi-card__label">
                이벤트 불일치 경기 {Number(summary.MISMATCH_MATCHES || 0) > 0 && '⚠️'}
              </div>
              <div className="admin-kpi-card__value" style={Number(summary.MISMATCH_MATCHES || 0) > 0 ? { color: '#e11d48' } : {}}>
                {summary.MISMATCH_MATCHES || 0}경기
              </div>
              <div className="admin-kpi-card__sub">
                {Number(summary.MISMATCH_MATCHES || 0) > 0 ? '스코어-골 이벤트 불일치 (클릭하여 조회)' : '모든 경기 이벤트 정상 매칭'}
              </div>
            </div>
            <div className="admin-kpi-card admin-kpi-card--warning">
              <div className="admin-kpi-card__label">부상/결장 선수</div>
              <div className="admin-kpi-card__value">{summary.INJURED_PLAYERS || 0}명</div>
              <div className="admin-kpi-card__sub">공지 및 라인업 반영 대상</div>
            </div>
            <div className="admin-kpi-card admin-kpi-card--danger">
              <div className="admin-kpi-card__label">블라인드 제재</div>
              <div className="admin-kpi-card__value">
                {(Number(summary.BLIND_POSTS || 0) + Number(summary.BLIND_COMMENTS || 0))}건
              </div>
              <div className="admin-kpi-card__sub">
                글 {summary.BLIND_POSTS || 0}건 / 댓글 {summary.BLIND_COMMENTS || 0}건
              </div>
            </div>
            <div className="admin-kpi-card">
              <div className="admin-kpi-card__label">삭제 내역 (증거보존)</div>
              <div className="admin-kpi-card__value">
                {(Number(summary.DELETED_POSTS || 0) + Number(summary.DELETED_COMMENTS || 0))}건
              </div>
              <div className="admin-kpi-card__sub">
                글 {summary.DELETED_POSTS || 0}건 / 댓글 {summary.DELETED_COMMENTS || 0}건
              </div>
            </div>
          </div>

          {/* 현재 부상 및 결장 선수 요약 */}
          <section className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">현재 리그 부상 및 결장자 현황</h2>
              <span className="badge badge--yellow">총 {injuredSummary.length}명 관리 중</span>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>구단</th>
                    <th>선수명</th>
                    <th>포지션</th>
                    <th>상태</th>
                    <th>부상 사유 및 결장 메모</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {injuredSummary.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                        현재 등록된 부상 및 결장 선수가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    injuredSummary.map((item) => (
                      <tr key={item.playerId}>
                        <td><strong>{item.teamNameKor || item.teamName}</strong></td>
                        <td>{item.playerNameKor || item.playerName}</td>
                        <td>{item.detailPosition || item.mainPosition}</td>
                        <td>
                          {item.isInjured === 'Y' && <span className="badge badge--red">부상</span>}
                          {item.isSuspended === 'Y' && <span className="badge badge--purple" style={{ marginLeft: 4 }}>출장정지</span>}
                        </td>
                        <td>{item.injuryNote || '-'}</td>
                        <td>
                          <button
                            type="button"
                            className="btn-action btn-action--outline"
                            onClick={() => {
                              setInjuryModal({
                                playerId: item.playerId,
                                name: item.playerNameKor || item.playerName,
                                isInjured: item.isInjured,
                                injuryNote: item.injuryNote || '',
                                isSuspended: item.isSuspended || 'N',
                              })
                            }}
                          >
                            수정
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 최근 포인트 변동 이력 */}
          <section className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">최근 포인트 변동 이력 (Audit Log)</h2>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>번호</th>
                    <th>회원 ID</th>
                    <th>변동 포인트</th>
                    <th>변동 후 잔액</th>
                    <th>사유 내용</th>
                    <th>발생 일시</th>
                  </tr>
                </thead>
                <tbody>
                  {recentPoints.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        최근 포인트 변동 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    recentPoints.map((item) => (
                      <tr key={item.pointHistoryId}>
                        <td>{item.pointHistoryId}</td>
                        <td>회원 #{item.userId}</td>
                        <td style={{ fontWeight: 700, color: item.amount > 0 ? '#16744b' : '#dc2626' }}>
                          {item.amount > 0 ? `+${item.amount}` : item.amount} P
                        </td>
                        <td>{item.balanceAfter} P</td>
                        <td>{item.description}</td>
                        <td style={{ color: '#64748b', fontSize: 13 }}>{item.createdAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ==================== 2. 경기 & 부상 공지 관리 탭 ==================== */}
      {activeTab === 'matches' && (
        <div>
          {/* 경기 목록 & 공지사항 수정 섹션 */}
          <section className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">경기 일정 및 결장/알림 공지 관리</h2>
              <div className="admin-filters">
                <input
                  type="date"
                  className="admin-input"
                  value={matchDateFilter}
                  onChange={(e) => setMatchDateFilter(e.target.value)}
                />
                <select
                  className="admin-select"
                  value={matchStatusFilter}
                  onChange={(e) => {
                    const nextStatus = e.target.value
                    setMatchStatusFilter(nextStatus)
                    const autoSort = (nextStatus === 'SCHEDULED' || nextStatus === 'TIMED') ? 'ASC' : (nextStatus === 'FINISHED' ? 'DESC' : 'AUTO')
                    setMatchSortOrder(autoSort)
                  }}
                >
                  <option value="">모든 경기 상태</option>
                  <option value="SCHEDULED">예정 (가장 가까운 순 ⏶)</option>
                  <option value="LIVE">진행중 (LIVE)</option>
                  <option value="FINISHED">종료 (가장 최근 순 ⏷)</option>
                  <option value="MISMATCH">⚠️ 스코어-이벤트 불일치 경기</option>
                  <option value="CANCELLED">취소 (CANCELLED)</option>
                </select>
                <select
                  className="admin-select"
                  value={matchSortOrder}
                  onChange={(e) => setMatchSortOrder(e.target.value)}
                  title="정렬 기준"
                >
                  <option value="AUTO">자동 정렬 (상태 기준)</option>
                  <option value="ASC">가장 가까운 순 (ASC ⏶)</option>
                  <option value="DESC">가장 최근 순 (DESC ⏷)</option>
                </select>
                <button type="button" className="btn-action btn-action--primary" onClick={() => fetchMatches()}>
                  조회
                </button>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>경기일시</th>
                    <th>매치업</th>
                    <th>스코어</th>
                    <th>상태</th>
                    <th>공지사항 (결장/지연 알림)</th>
                    <th>관리 액션</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 경기 데이터를 동기화하는 중입니다...</td></tr>
                  ) : matches.length === 0 ? (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>해당 조건의 경기가 없습니다.</td></tr>
                  ) : (
                    matches.slice(0, 50).map((m) => (
                      <tr key={m.matchId}>
                        <td style={{ whiteSpace: 'nowrap' }}>{m.matchDate}</td>
                        <td>
                          <div className="match-team-cell">
                            {m.homeEmblemUrl && <img src={m.homeEmblemUrl} alt="" className="match-emblem" />}
                            <span>{m.homeTeamNameKor || m.homeTeamName}</span>
                            <span style={{ color: '#94a3b8', margin: '0 4px' }}>vs</span>
                            {m.awayEmblemUrl && <img src={m.awayEmblemUrl} alt="" className="match-emblem" />}
                            <span>{m.awayTeamNameKor || m.awayTeamName}</span>
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          <div>
                            {m.homeScore !== null && m.awayScore !== null
                              ? `${m.homeScore} : ${m.awayScore}`
                              : '-'}
                          </div>
                          {m.status === 'FINISHED' && m.homeScore !== null && m.awayScore !== null && (
                            (m.homeScore !== (m.homeGoalEvents ?? 0)) || (m.awayScore !== (m.awayGoalEvents ?? 0))
                          ) && (
                            <div style={{ marginTop: 4 }}>
                              <span
                                className="badge badge--red"
                                title={`최종 스코어 (${m.homeScore}:${m.awayScore}) vs 타임라인 골 이벤트 (${m.homeGoalEvents ?? 0}:${m.awayGoalEvents ?? 0}) - 총 이벤트 ${m.totalEvents ?? 0}건`}
                                style={{ fontSize: 11, cursor: 'help' }}
                              >
                                ⚠️ 이벤트 {m.homeGoalEvents ?? 0}:{m.awayGoalEvents ?? 0}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${
                            m.status === 'FINISHED' ? 'badge--gray' :
                            m.status === 'LIVE' ? 'badge--red' : 'badge--green'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td>
                          {m.notice ? (
                            <span className="match-notice-text" title={m.notice}>📢 {m.notice}</span>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: 13 }}>공지 없음</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              type="button"
                              className="btn-action btn-action--warning"
                              onClick={() => {
                                setNoticeModal({
                                  matchId: m.matchId,
                                  title: `${m.homeTeamNameKor || m.homeTeamName} vs ${m.awayTeamNameKor || m.awayTeamName}`,
                                  notice: m.notice || '',
                                })
                              }}
                            >
                              공지 편집
                            </button>
                            <button
                              type="button"
                              className="btn-action btn-action--outline"
                              onClick={() => {
                                setScoreModal({
                                  matchId: m.matchId,
                                  title: `${m.homeTeamNameKor || m.homeTeamName} vs ${m.awayTeamNameKor || m.awayTeamName}`,
                                  homeScore: m.homeScore !== null ? m.homeScore : '',
                                  awayScore: m.awayScore !== null ? m.awayScore : '',
                                  status: m.status,
                                })
                              }}
                            >
                              스코어 정정
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* 구단별 선수 부상 현황 편집 섹션 */}
          <section className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">구단별 선수단 부상 및 출장정지 관리</h2>
              <div className="admin-filters">
                <select
                  className="admin-select"
                  value={selectedTeamId}
                  onChange={(e) => {
                    const tId = Number(e.target.value)
                    setSelectedTeamId(tId)
                    fetchTeamPlayers(tId)
                  }}
                >
                  {communityTeams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>선수명</th>
                    <th>한글명</th>
                    <th>포지션</th>
                    <th>부상 여부</th>
                    <th>출장 정지</th>
                    <th>결장 사유 메모</th>
                    <th>수정</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 선수 데이터를 동기화하는 중입니다...</td></tr>
                  ) : teamPlayers.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>선수 데이터가 없습니다.</td></tr>
                  ) : (
                    teamPlayers.map((p) => (
                      <tr key={p.playerId}>
                        <td><strong>{p.playerName}</strong></td>
                        <td>{p.playerNameKor || '-'}</td>
                        <td>
                          <span className="badge badge--blue">{p.detailPosition || p.mainPosition}</span>
                        </td>
                        <td>
                          {p.isInjured === 'Y' ? (
                            <span className="badge badge--red">부상중 (Y)</span>
                          ) : (
                            <span className="badge badge--green">정상 (N)</span>
                          )}
                        </td>
                        <td>
                          {p.isSuspended === 'Y' ? (
                            <span className="badge badge--purple">정지 (Y)</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>N</span>
                          )}
                        </td>
                        <td style={{ maxWidth: 300, color: '#d97706' }}>
                          {p.injuryNote || '-'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn-action btn-action--outline"
                            onClick={() => {
                              setInjuryModal({
                                playerId: p.playerId,
                                name: p.playerNameKor || p.playerName,
                                isInjured: p.isInjured || 'N',
                                injuryNote: p.injuryNote || '',
                                isSuspended: p.isSuspended || 'N',
                              })
                            }}
                          >
                            부상 설정
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ==================== 3. 커뮤니티 블라인드 제재 탭 ==================== */}
      {activeTab === 'community' && (
        <div>
          {/* AI 모더레이션 연동 대비 안내 배너 */}
          <div className="ai-moderation-banner">
            <div className="ai-moderation-banner__text">
              <h4>🤖 AI 유해 게시글 / 욕설 문맥 자동 감지 시스템</h4>
              <p>
                현재 수동 블라인드 제재가 활성화되어 있습니다. 차후 Gemini AI 연동 시 문맥과 비속어를 자동 판별하여 사전 블라인드 제재하며, 유저는 경고 확인 후 열람하게 됩니다.
              </p>
            </div>
            <button
              type="button"
              className="btn-action btn-action--primary"
              onClick={() => showAlert('AI 자동 블라인드 검사 백그라운드 태스크가 대기 상태입니다.')}
            >
              AI 블라인드 검사 예약
            </button>
          </div>

          <section className="admin-section">
            <div className="admin-section__header">
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className={`btn-action ${communitySubTab === 'posts' ? 'btn-action--primary' : 'btn-action--outline'}`}
                  onClick={() => {
                    setCommunitySubTab('posts')
                    fetchPosts()
                  }}
                >
                  게시글 관리
                </button>
                <button
                  type="button"
                  className={`btn-action ${communitySubTab === 'comments' ? 'btn-action--primary' : 'btn-action--outline'}`}
                  onClick={() => {
                    setCommunitySubTab('comments')
                    fetchComments()
                  }}
                >
                  댓글 관리
                </button>
              </div>

              {communitySubTab === 'posts' ? (
                <div className="admin-filters">
                  <select
                    className="admin-select"
                    value={postStatusFilter}
                    onChange={(e) => {
                      const next = e.target.value
                      setPostStatusFilter(next)
                      fetchPosts(next, postKeyword)
                    }}
                  >
                    <option value="">모든 글 (전체 목록)</option>
                    <option value="NORMAL">정상 공개 글</option>
                    <option value="BLIND">🚨 관리자 제재(블라인드)된 글</option>
                    <option value="DELETED">🗑️ 작성자 삭제 글 (증거보존)</option>
                  </select>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="제목 또는 닉네임 검색"
                    value={postKeyword}
                    onChange={(e) => setPostKeyword(e.target.value)}
                  />
                  <button type="button" className="btn-action btn-action--primary" onClick={() => fetchPosts()}>
                    검색
                  </button>
                </div>
              ) : (
                <div className="admin-filters">
                  <select
                    className="admin-select"
                    value={commentStatusFilter}
                    onChange={(e) => {
                      const next = e.target.value
                      setCommentStatusFilter(next)
                      fetchComments(next, commentKeyword)
                    }}
                  >
                    <option value="">모든 댓글 (전체 목록)</option>
                    <option value="NORMAL">정상 댓글</option>
                    <option value="BLIND">🚨 관리자 제재(블라인드)된 댓글</option>
                    <option value="DELETED">🗑️ 작성자 삭제 댓글 (증거보존)</option>
                  </select>
                  <input
                    type="text"
                    className="admin-input"
                    placeholder="내용 또는 닉네임 검색"
                    value={commentKeyword}
                    onChange={(e) => setCommentKeyword(e.target.value)}
                  />
                  <button type="button" className="btn-action btn-action--primary" onClick={() => fetchComments()}>
                    검색
                  </button>
                </div>
              )}
            </div>

            {/* 게시글 서브 탭 */}
            {communitySubTab === 'posts' && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>번호</th>
                      <th>분류</th>
                      <th>제목</th>
                      <th>작성자</th>
                      <th>추천/조회</th>
                      <th>상태</th>
                      <th>작성일시</th>
                      <th>관리 액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 게시글 데이터를 동기화하는 중입니다...</td></tr>
                    ) : posts.length === 0 ? (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>게시글이 없습니다.</td></tr>
                    ) : (
                      posts.map((p) => (
                        <tr key={p.postId}>
                          <td>{p.postId}</td>
                          <td>
                            <span className="badge badge--gray">
                              {p.teamName || p.categoryType || '자유'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            <a
                              href={`/plug/community/posts/${p.postId}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: 'inherit', textDecoration: 'none' }}
                            >
                              {p.title}
                            </a>
                          </td>
                          <td>{p.nickname}</td>
                          <td>{p.likeCount} / {p.viewCount}</td>
                          <td>
                            {p.isDeleted === 'Y' ? (
                              <span className="badge badge--gray">🗑️ 삭제됨</span>
                            ) : p.isBlind === 'Y' ? (
                              <span className="badge badge--red">🚨 제재됨 (Y)</span>
                            ) : (
                              <span className="badge badge--green">정상 (N)</span>
                            )}
                          </td>
                          <td style={{ color: '#64748b', fontSize: 13 }}>{p.createdAt}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              {p.isDeleted === 'Y' ? (
                                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, padding: '4px 6px' }}>
                                  삭제됨 (증거보존)
                                </span>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className={`btn-action ${p.isBlind === 'Y' ? 'btn-action--outline' : 'btn-action--danger'}`}
                                    onClick={() => handleTogglePostBlind(p.postId, p.isBlind)}
                                  >
                                    {p.isBlind === 'Y' ? '제재 해제' : '블라인드 처리'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-action btn-action--danger"
                                    onClick={() => handleDeletePost(p.postId, p.title)}
                                  >
                                    게시글 삭제
                                  </button>
                                </>
                              )}
                              <button
                                type="button"
                                className="btn-action btn-action--outline"
                                onClick={() => setViewPostModal({
                                  title: p.title,
                                  content: p.content,
                                  nickname: p.nickname,
                                  isBlind: p.isBlind,
                                  isDeleted: p.isDeleted,
                                  unblurred: false,
                                })}
                              >
                                내용 보기
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* 댓글 서브 탭 */}
            {communitySubTab === 'comments' && (
              <div className="admin-table-wrapper">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>댓글ID</th>
                      <th>원글ID</th>
                      <th>댓글 본문 내용</th>
                      <th>작성자</th>
                      <th>상태</th>
                      <th>작성일시</th>
                      <th>관리 액션</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 댓글 데이터를 동기화하는 중입니다...</td></tr>
                    ) : comments.length === 0 ? (
                      <tr><td colSpan="7" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>댓글이 없습니다.</td></tr>
                    ) : (
                      comments.map((c) => (
                        <tr key={c.commentId}>
                          <td>{c.commentId}</td>
                          <td>
                            <a href={`/plug/community/posts/${c.postId}`} target="_blank" rel="noreferrer">
                              #{c.postId}
                            </a>
                          </td>
                          <td style={{ maxWidth: 350, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.content}
                          </td>
                          <td>{c.nickname}</td>
                          <td>
                            {c.isDeleted === 'Y' ? (
                              <span className="badge badge--gray">🗑️ 작성자 삭제</span>
                            ) : c.isBlind === 'Y' ? (
                              <span className="badge badge--red">🚨 제재됨 (Y)</span>
                            ) : (
                              <span className="badge badge--green">정상 (N)</span>
                            )}
                          </td>
                          <td style={{ color: '#64748b', fontSize: 13 }}>{c.createdAt}</td>
                          <td>
                            {c.isDeleted === 'Y' ? (
                              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, padding: '4px 6px' }}>
                                삭제됨 (증거보존)
                              </span>
                            ) : (
                              <button
                                type="button"
                                className={`btn-action ${c.isBlind === 'Y' ? 'btn-action--outline' : 'btn-action--danger'}`}
                                onClick={() => handleToggleCommentBlind(c.commentId, c.isBlind)}
                              >
                                {c.isBlind === 'Y' ? '제재 해제' : '블라인드 처리'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ==================== 4. 회원 & 포인트 관리 탭 ==================== */}
      {activeTab === 'users' && (
        <div>
          <section className="admin-section">
            <div className="admin-section__header">
              <h2 className="admin-section__title">전체 회원 및 권한/포인트 관리</h2>
              <div className="admin-filters">
                <select
                  className="admin-select"
                  value={userRoleFilter}
                  onChange={(e) => {
                    const next = e.target.value
                    setUserRoleFilter(next)
                    fetchUsers(userKeyword, next)
                  }}
                >
                  <option value="">활성 회원 전체 (기본)</option>
                  <option value="1">일반회원 (ROLE_USER - 1)</option>
                  <option value="9">시스템 관리자 (ROLE_ADMIN - 9)</option>
                  <option value="7">탈퇴회원 (ROLE_WITHDRAWN - 7)</option>
                </select>
                <input
                  type="text"
                  className="admin-input"
                  placeholder="아이디, 닉네임, 이메일 검색"
                  value={userKeyword}
                  onChange={(e) => setUserKeyword(e.target.value)}
                />
                <button type="button" className="btn-action btn-action--primary" onClick={() => fetchUsers()}>
                  검색
                </button>
              </div>
            </div>

            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>회원ID</th>
                    <th>로그인 아이디</th>
                    <th>닉네임</th>
                    <th>이메일</th>
                    <th>권한 등급</th>
                    <th>보유 포인트</th>
                    <th>가입일시</th>
                    <th>관리 액션</th>
                  </tr>
                </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#0369a1' }}><span className="admin-spinner">🔄</span> 회원 데이터를 동기화하는 중입니다...</td></tr>
                    ) : users.length === 0 ? (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: 24, color: '#94a3b8' }}>일치하는 회원이 없습니다.</td></tr>
                  ) : (
                    users.map((u) => {
                      const isWithdrawn = Number(u.roleCode) === 7
                      const isAdminRole = Number(u.roleCode) === 9
                      return (
                        <tr key={u.userId} style={isWithdrawn ? { opacity: 0.65, background: '#f8fafc' } : {}}>
                          <td>{u.userId}</td>
                          <td><strong>{u.loginId}</strong></td>
                          <td>{u.nickname}</td>
                          <td style={{ color: '#64748b' }}>{u.email}</td>
                          <td>
                            {isAdminRole ? (
                              <span className="badge badge--purple">관리자 (9)</span>
                            ) : isWithdrawn ? (
                              <span className="badge badge--gray">탈퇴회원 (7)</span>
                            ) : (
                              <span className="badge badge--green">일반회원 (1)</span>
                            )}
                          </td>
                          <td style={{ fontWeight: 700, color: isWithdrawn ? '#94a3b8' : '#16744b' }}>
                            {u.point !== null ? u.point.toLocaleString() : 0} P
                          </td>
                          <td style={{ color: '#64748b', fontSize: 13 }}>{u.createdAt}</td>
                          <td>
                            {isWithdrawn ? (
                              <span style={{ fontSize: 12, color: '#94a3b8', padding: '6px 8px' }}>
                                탈퇴 계정 (수정 불가)
                              </span>
                            ) : (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className="btn-action btn-action--outline"
                                  onClick={() => {
                                    setPointModal({
                                      userId: u.userId,
                                      nickname: u.nickname,
                                      amount: '',
                                      description: '',
                                    })
                                  }}
                                >
                                  포인트 조정
                                </button>
                                <button
                                  type="button"
                                  className="btn-action btn-action--warning"
                                  onClick={() => {
                                    setRoleModal({
                                      userId: u.userId,
                                      nickname: u.nickname,
                                      roleCode: u.roleCode,
                                    })
                                  }}
                                >
                                  권한 변경
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ==================== 5. 데이터 수동 동기화 탭 ==================== */}
      {activeTab === 'sync' && (
        <div>
          <div className="sync-grid">
            {/* 경기 일정 및 스코어 동기화 */}
            <div className="sync-card">
              <div>
                <div className="sync-card__title">⚽ 경기 일정 및 스코어 동기화</div>
                <div className="sync-card__desc">
                  Football-Data API를 호출하여 특정 날짜의 프리미어리그 경기 일정 및 스코어 결과를 즉시 DB에 업데이트합니다.
                </div>
              </div>
              <div className="sync-card__actions">
                <input
                  type="date"
                  className="admin-input"
                  value={syncDate}
                  onChange={(e) => setSyncDate(e.target.value)}
                  style={{ width: '150px' }}
                />
                <button
                  type="button"
                  className="btn-action btn-action--primary"
                  disabled={syncLoading}
                  onClick={() => handleTriggerSync('matches', 'date', syncDate, '경기 일정')}
                >
                  동기화
                </button>
              </div>
            </div>

            {/* 경기 타임라인 이벤트 동기화 */}
            <div className="sync-card">
              <div>
                <div className="sync-card__title">⏱️ 경기 타임라인 이벤트 동기화</div>
                <div className="sync-card__desc">
                  BigBalls API를 연동하여 특정 날짜의 골, 어시스트, 카드 등 타임라인 상세 이벤트를 MATCH_EVENTS에 동기화합니다.
                </div>
              </div>
              <div className="sync-card__actions">
                <input
                  type="date"
                  className="admin-input"
                  value={syncDate}
                  onChange={(e) => setSyncDate(e.target.value)}
                  style={{ width: '150px' }}
                />
                <button
                  type="button"
                  className="btn-action btn-action--primary"
                  disabled={syncLoading}
                  onClick={() => handleTriggerSync('events', 'date', syncDate, '타임라인 이벤트')}
                >
                  동기화
                </button>
              </div>
            </div>

            {/* 프리미어리그 순위표 동기화 */}
            <div className="sync-card">
              <div>
                <div className="sync-card__title">🏆 프리미어리그 순위표 동기화</div>
                <div className="sync-card__desc">
                  현재 시즌 20개 구단의 순위, 승무패, 득실차, 승점을 즉시 동기화하여 TEAM_STATS에 적재합니다.
                </div>
              </div>
              <div className="sync-card__actions">
                <button
                  type="button"
                  className="btn-action btn-action--primary"
                  disabled={syncLoading}
                  onClick={() => handleTriggerSync('standings', null, null, '리그 순위표')}
                >
                  순위표 동기화 실행
                </button>
              </div>
            </div>

            {/* 득점 순위 동기화 */}
            <div className="sync-card">
              <div>
                <div className="sync-card__title">🎯 선수 득점 순위 동기화</div>
                <div className="sync-card__desc">
                  공식 득점 랭킹 상위 50명의 골, 어시스트 데이터를 PLAYER_STATS에 업데이트합니다.
                </div>
              </div>
              <div className="sync-card__actions">
                <button
                  type="button"
                  className="btn-action btn-action--primary"
                  disabled={syncLoading}
                  onClick={() => handleTriggerSync('scorers', 'limit', '50', '득점 랭킹')}
                >
                  득점 랭킹 동기화
                </button>
              </div>
            </div>

            {/* 시즌 전체 380경기 일괄 동기화 */}
            <div className="sync-card">
              <div>
                <div className="sync-card__title">📅 시즌 전체 380경기 일괄 동기화</div>
                <div className="sync-card__desc">
                  프리미어리그 최신 시즌의 전체 380개 경기 일정과 확정 스코어를 외부 API에서 일괄 수집하여 DB에 적재합니다.
                </div>
              </div>
              <div className="sync-card__actions">
                <button
                  type="button"
                  className="btn-action btn-action--primary"
                  disabled={syncLoading}
                  onClick={() => handleTriggerSync('season-matches', null, null, '시즌 380경기 전체')}
                >
                  시즌 전경기 동기화
                </button>
              </div>
            </div>

            {/* 전체 구단 및 선수단 일괄 동기화 */}
            <div className="sync-card">
              <div>
                <div className="sync-card__title">👥 전체 20개 구단 및 선수단 동기화</div>
                <div className="sync-card__desc">
                  프리미어리그 20개 구단 프로필과 소속 선수 500여 명의 최신 정보를 외부 API에서 일괄 동기화합니다.
                </div>
              </div>
              <div className="sync-card__actions">
                <button
                  type="button"
                  className="btn-action btn-action--primary"
                  disabled={syncLoading}
                  onClick={() => handleTriggerSync('teams-and-players', null, null, '20개 구단 및 선수단')}
                >
                  구단·선수단 동기화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 모달 창 모음 ==================== */}

      {/* 1. 경기 공지사항(NOTICE) 편집 모달 */}
      {noticeModal && (
        <div className="admin-modal-backdrop" onClick={() => setNoticeModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>경기 공지사항 등록 / 수정</h3>
              <button type="button" className="admin-modal__close" onClick={() => setNoticeModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0', fontWeight: 600, color: '#334155' }}>
                대상 경기: {noticeModal.title}
              </p>
              <div className="admin-form-group">
                <label>공지 내용 (부상/결장 안내, 킥오프 지연 등)</label>
                <textarea
                  value={noticeModal.notice}
                  onChange={(e) => setNoticeModal({ ...noticeModal, notice: e.target.value })}
                  placeholder="예: 홈팀 핵심 공격수 햄스트링 부상으로 결장 예정. 폭설로 인해 킥오프 15분 지연 안내."
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setNoticeModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSaveNotice}>
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 경기 스코어 정정 모달 */}
      {scoreModal && (
        <div className="admin-modal-backdrop" onClick={() => setScoreModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>경기 스코어 및 상태 긴급 정정</h3>
              <button type="button" className="admin-modal__close" onClick={() => setScoreModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0', fontWeight: 600, color: '#334155' }}>
                {scoreModal.title}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="admin-form-group">
                  <label>홈팀 스코어</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={scoreModal.homeScore}
                    onChange={(e) => setScoreModal({ ...scoreModal, homeScore: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>원정팀 스코어</label>
                  <input
                    type="number"
                    className="admin-input"
                    value={scoreModal.awayScore}
                    onChange={(e) => setScoreModal({ ...scoreModal, awayScore: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-form-group">
                <label>경기 진행 상태</label>
                <select
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={scoreModal.status}
                  onChange={(e) => setScoreModal({ ...scoreModal, status: e.target.value })}
                >
                  <option value="SCHEDULED">SCHEDULED (예정)</option>
                  <option value="LIVE">LIVE (실시간 진행중)</option>
                  <option value="FINISHED">FINISHED (경기 종료)</option>
                  <option value="POSTPONED">POSTPONED (연기)</option>
                  <option value="CANCELLED">CANCELLED (취소)</option>
                </select>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setScoreModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSaveScore}>
                정정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 선수 부상/결장 정보 수정 모달 */}
      {injuryModal && (
        <div className="admin-modal-backdrop" onClick={() => setInjuryModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>선수 부상 및 결장 정보 설정</h3>
              <button type="button" className="admin-modal__close" onClick={() => setInjuryModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0', fontWeight: 700, fontSize: 16 }}>
                선수: {injuryModal.name}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="admin-form-group">
                  <label>부상 여부 (IS_INJURED)</label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={injuryModal.isInjured}
                    onChange={(e) => setInjuryModal({ ...injuryModal, isInjured: e.target.value })}
                  >
                    <option value="N">정상 (N)</option>
                    <option value="Y">부상중 (Y)</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>출장 정지 (IS_SUSPENDED)</label>
                  <select
                    className="admin-select"
                    style={{ width: '100%' }}
                    value={injuryModal.isSuspended}
                    onChange={(e) => setInjuryModal({ ...injuryModal, isSuspended: e.target.value })}
                  >
                    <option value="N">정상 출전 가능 (N)</option>
                    <option value="Y">출장 정지 징계 (Y)</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-group">
                <label>부상 상세 메모 및 예상 결장 기간</label>
                <textarea
                  value={injuryModal.injuryNote}
                  onChange={(e) => setInjuryModal({ ...injuryModal, injuryNote: e.target.value })}
                  placeholder="예: 훈련 중 햄스트링 부상. 3주간 결장 예정."
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setInjuryModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSaveInjury}>
                저장하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 회원 권한 변경 모달 */}
      {roleModal && (
        <div className="admin-modal-backdrop" onClick={() => setRoleModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>회원 권한 등급 변경</h3>
              <button type="button" className="admin-modal__close" onClick={() => setRoleModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0' }}>
                대상 회원: <strong>{roleModal.nickname}</strong>
              </p>
              <div className="admin-form-group">
                <label>권한 등급 선택</label>
                <select
                  className="admin-select"
                  style={{ width: '100%' }}
                  value={roleModal.roleCode}
                  onChange={(e) => setRoleModal({ ...roleModal, roleCode: e.target.value })}
                >
                  <option value="1">일반 회원 (ROLE_USER - 1)</option>
                  <option value="9">시스템 관리자 (ROLE_ADMIN - 9)</option>
                </select>
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setRoleModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSaveRole}>
                변경 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 포인트 지급/차감 모달 */}
      {pointModal && (
        <div className="admin-modal-backdrop" onClick={() => setPointModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>포인트 직권 지급 / 차감</h3>
              <button type="button" className="admin-modal__close" onClick={() => setPointModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <p style={{ margin: '0 0 16px 0' }}>
                대상 회원: <strong>{pointModal.nickname}</strong>
              </p>
              <div className="admin-form-group">
                <label>조정 포인트 (지급은 +500, 차감은 -200 등)</label>
                <input
                  type="number"
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder="예: 500 또는 -300"
                  value={pointModal.amount}
                  onChange={(e) => setPointModal({ ...pointModal, amount: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>조정 사유 (이력 로그 기록용)</label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ width: '100%' }}
                  placeholder="예: 승부예측 이벤트 보상 지급"
                  value={pointModal.description}
                  onChange={(e) => setPointModal({ ...pointModal, description: e.target.value })}
                />
              </div>
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--outline" onClick={() => setPointModal(null)}>
                취소
              </button>
              <button type="button" className="btn-action btn-action--primary" onClick={handleSavePoints}>
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. 게시글 전문 확인 모달 */}
      {viewPostModal && (
        <div className="admin-modal-backdrop" onClick={() => setViewPostModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h3>게시글 본문 상세 확인</h3>
              <button type="button" className="admin-modal__close" onClick={() => setViewPostModal(null)}>×</button>
            </div>
            <div className="admin-modal__body">
              <h4 style={{ margin: '0 0 8px 0', fontSize: 16 }}>{viewPostModal.title}</h4>
              <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px 0' }}>
                작성자: {viewPostModal.nickname}
                {viewPostModal.isDeleted === 'Y' && (
                  <span className="badge badge--gray" style={{ marginLeft: 8 }}>🗑️ 작성자 삭제 (증거보존 모드)</span>
                )}
                {viewPostModal.isBlind === 'Y' && (
                  <span className="badge badge--red" style={{ marginLeft: 8 }}>🚨 제재된 게시글 (블라인드)</span>
                )}
              </p>
              {viewPostModal.isDeleted === 'Y' && (
                <div style={{
                  background: '#f1f5f9',
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  color: '#475569',
                  marginBottom: 12,
                }}>
                  ℹ️ 사용자가 직접 삭제한 게시글입니다. 법적/운영 증거 보존용으로 원문이 안전하게 보관되어 있습니다.
                </div>
              )}
              {viewPostModal.isBlind === 'Y' && !viewPostModal.unblurred ? (
                <div style={{
                  position: 'relative',
                  background: '#fef2f2',
                  padding: 24,
                  borderRadius: 10,
                  border: '1px solid #fecdd3',
                  textAlign: 'center',
                }}>
                  <p style={{ color: '#991b1b', fontWeight: 700, margin: '0 0 6px 0' }}>
                    ⚠️ 민감한 단어(욕설/비속어)가 포함되어 블라인드(블러) 처리된 본문입니다.
                  </p>
                  <p style={{ color: '#64748b', fontSize: 13, margin: '0 0 16px 0' }}>
                    관리자 확인을 위해 블러를 해제하시겠습니까?
                  </p>
                  <button
                    type="button"
                    className="btn-action btn-action--warning"
                    onClick={() => setViewPostModal({ ...viewPostModal, unblurred: true })}
                  >
                    블러 해제하고 내용 보기
                  </button>
                  <div style={{
                    filter: 'blur(5px)',
                    opacity: 0.4,
                    marginTop: 16,
                    maxHeight: 90,
                    overflow: 'hidden',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}>
                    {viewPostModal.content}
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#f8fafc',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  whiteSpace: 'pre-wrap',
                  maxHeight: 300,
                  overflowY: 'auto',
                  lineHeight: 1.6,
                }}>
                  {viewPostModal.content}
                </div>
              )}
            </div>
            <div className="admin-modal__footer">
              <button type="button" className="btn-action btn-action--primary" onClick={() => setViewPostModal(null)}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
