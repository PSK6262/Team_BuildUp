import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useDispatch, useSelector } from 'react-redux'
import { updateUser, logout } from '../store/authSlice.js'
import { getMyActivities, getMyPosts, getMyComments, getMyLikedPosts, getMyPointHistories, getMyShopData, changePassword } from '../api/userApi.js'
import { SHOP_ITEMS } from '../api/shopApi.js'
import { navigate } from '../utils/navigation.js'
import '../css/MyPage.css'

const EMAIL_REGEX = /^[a-zA-Z0-9](?!.*\.\.)[a-zA-Z0-9._-]{2,28}[a-zA-Z0-9]@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,20}$/

// ----------------------------------------------------
// 프로페셔널 축구 플랫폼 전용 모던 SVG 벡터 아이콘 컴포넌트
// ----------------------------------------------------
function IconTarget({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="3" fill={color} fillOpacity="0.25" />
    </svg>
  )
}

function IconBall({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="12,7 15.5,9.5 14,14 10,14 8.5,9.5" fill={color} fillOpacity="0.2" />
      <line x1="12" y1="7" x2="12" y2="2" />
      <line x1="15.5" y1="9.5" x2="20" y2="8" />
      <line x1="14" y1="14" x2="17.5" y2="18" />
      <line x1="10" y1="14" x2="6.5" y2="18" />
      <line x1="8.5" y1="9.5" x2="4" y2="8" />
    </svg>
  )
}

function IconSettings({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

function IconArticle({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  )
}

function IconComment({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function IconHeart({ size = 18, color = 'currentColor', className = '', style = {}, filled = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function IconLock({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function IconAlertTriangle({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconCoins({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="M17 12h1v4" />
    </svg>
  )
}

function IconShoppingBag({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  )
}

function IconReceipt({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
      <line x1="8" y1="9" x2="16" y2="9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="12" y2="17" />
    </svg>
  )
}

function IconX({ size = 18, color = 'currentColor', className = '', style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// 팀 소개 페이지(TeamVisualPanel)와 동일한 고해상도 SVG 엠블럼 URL 생성 (리버풀 t14는 레드 엠블럼 통일을 위해 100px PNG 사용)
function getEmblemSvgUrl(url) {
  if (!url || typeof url !== 'string' || url.includes('/t14.')) return ''
  return url.replace('/50/', '/').replace('.png', '.svg')
}

function getHighResPngUrl(url) {
  if (!url || typeof url !== 'string') return ''
  return url.replace('/50/', '/100/')
}

function TeamEmblemImg({ url, alt = '', className = '' }) {
  const emblemSvg = getEmblemSvgUrl(url)
  const emblemPng = getHighResPngUrl(url)
  const initialSrc = emblemSvg || emblemPng || url || ''

  if (!initialSrc) return null

  return (
    <img
      src={initialSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        if (emblemPng && e.currentTarget.src !== emblemPng) {
          e.currentTarget.src = emblemPng
        } else if (url && e.currentTarget.src !== url) {
          e.currentTarget.src = url
        }
      }}
    />
  )
}

export default function MyPage() {
  const dispatch = useDispatch()
  const reduxUser = useSelector((state) => state.auth.user)
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn)
  const currentTheme = useSelector((state) => state.theme?.mode || 'dark')

  const [teamList, setTeamList] = useState([])
  const [profile, setProfile] = useState(null)
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [favoriteTeamId, setFavoriteTeamId] = useState('')

  // 마이페이지 탭 상태 ('profile' | 'posts' | 'comments' | 'likes')
  const [activeTab, setActiveTab] = useState('profile')
  const [activityCounts, setActivityCounts] = useState({ postCount: 0, commentCount: 0, likedPostCount: 0 })
  const [postsData, setPostsData] = useState({ list: [], totalCount: 0, totalPages: 0, currentPage: 1 })
  const [commentsData, setCommentsData] = useState({ list: [], totalCount: 0, totalPages: 0, currentPage: 1 })
  const [likesData, setLikesData] = useState({ list: [], totalCount: 0, totalPages: 0, currentPage: 1 })
  const [listLoading, setListLoading] = useState(false)

  // 커스텀 구단 드롭다운 열림/닫힘 상태
  const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false)
  const teamDropdownRef = useRef(null)

  // 사이드바 애드센스 광고 Ref 및 초기화
  const sideAdRef = useRef(null)
  const isSideAdPushed = useRef(false)

  useEffect(() => {
    if (isSideAdPushed.current) return
    try {
      if (typeof window !== 'undefined' && sideAdRef.current) {
        ;(window.adsbygoogle = window.adsbygoogle || []).push({})
        isSideAdPushed.current = true
      }
    } catch (e) {
      console.debug('MyPage Sidebar AdSense init:', e)
    }
  }, [])

  // 승부예측 전적 및 경기 일정 데이터
  const [predictStats, setPredictStats] = useState({ win: 0, fail: 0, rate: '0.0', loaded: false })
  const [matches, setMatches] = useState([])

  // 승부예측 전적 조회 (/api/predictions/my) - 결과 확정(Y/N)된 경기만으로 성공/실패 및 적중률 계산
  useEffect(() => {
    if (!isLoggedIn) return
    const token = localStorage.getItem('buildup_token')
    fetch('/api/predictions/my', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'SUCCESS' && Array.isArray(data.items)) {
          const items = data.items
          const win = items.filter((p) => p.isSuccess === 'Y').length
          const fail = items.filter((p) => p.isSuccess === 'N').length
          const settled = win + fail
          const rate = settled > 0 ? ((win / settled) * 100).toFixed(1) : '0.0'
          setPredictStats({ win, fail, rate, loaded: true })
        }
      })
      .catch(() => {})
  }, [isLoggedIn])

  // 전체 경기 일정 조회 (/api/matches)
  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMatches(data)
      })
      .catch(() => {})
  }, [])

  // 실제 DB 구단 목록 직접 조회 (/api/teams)
  useEffect(() => {
    fetch('/api/teams')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTeamList(data)
      })
      .catch(() => {})
  }, [])

  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // 닉네임 중복확인 상태
  const [nicknameChecked, setNicknameChecked] = useState(false)
  const [nicknameCheckMsg, setNicknameCheckMsg] = useState('')

  // 이메일 변경 인증 상태
  const [emailVerified, setEmailVerified] = useState(false)
  const [emailVerifyMsg, setEmailVerifyMsg] = useState('')
  const [emailCodeSent, setEmailCodeSent] = useState(false)
  const [sendingEmailCode, setSendingEmailCode] = useState(false)
  const [emailAuthCode, setEmailAuthCode] = useState('')
  const [verifyingEmailCode, setVerifyingEmailCode] = useState(false)

  // 회원 탈퇴 경고 모달 상태
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAgreed, setWithdrawAgreed] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)

  // 포인트 변동 이력 모달 상태
  const [showPointModal, setShowPointModal] = useState(false)
  const [pointHistories, setPointHistories] = useState([])
  const [pointHistoriesLoading, setPointHistoriesLoading] = useState(false)

  // 비밀번호 변경 모달 상태
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSubmitting, setPwSubmitting] = useState(false)

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault()
    setPwMsg('')
    setPwSuccess(false)

    if (!pwCurrent) {
      setPwMsg('현재 비밀번호를 입력해주세요.')
      return
    }
    if (!pwNew || pwNew.length < 8 || pwNew.length > 20) {
      setPwMsg('새 비밀번호는 8자 이상 20자 이하로 입력해주세요.')
      return
    }
    if (pwNew !== pwConfirm) {
      setPwMsg('새 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }
    if (pwCurrent === pwNew) {
      setPwMsg('현재 비밀번호와 다른 새 비밀번호를 입력해주세요.')
      return
    }

    try {
      setPwSubmitting(true)
      await changePassword(pwCurrent, pwNew)
      setPwSuccess(true)
      setPwMsg('비밀번호가 안전하게 변경되었습니다!')
      setTimeout(() => {
        setShowPasswordModal(false)
        setPwCurrent('')
        setPwNew('')
        setPwConfirm('')
        setPwMsg('')
        setPwSuccess(false)
      }, 1500)
    } catch (err) {
      setPwSuccess(false)
      setPwMsg(err.message || '비밀번호 변경에 실패했습니다.')
    } finally {
      setPwSubmitting(false)
    }
  }

  const handleOpenPointModal = async () => {
    setShowPointModal(true)
    setPointHistoriesLoading(true)
    try {
      const histories = await getMyPointHistories()
      setPointHistories(histories || [])
    } catch (err) {
      console.error('포인트 변동 이력 로드 오류:', err)
      setPointHistories([])
    } finally {
      setPointHistoriesLoading(false)
    }
  }

  // 커스텀 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (teamDropdownRef.current && !teamDropdownRef.current.contains(e.target)) {
        setIsTeamDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  // 응원 구단의 가장 가까운 다음 경기 계산
  const nextFavoriteMatch = useMemo(() => {
    const favId = profile?.favoriteTeamId ? Number(profile.favoriteTeamId) : null
    if (!favId || !Array.isArray(matches) || matches.length === 0) return null

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)

    const parseDate = (dateStr) => {
      if (!dateStr) return null
      const normalized = String(dateStr).trim().replace(' ', 'T')
      const d = new Date(normalized)
      return isNaN(d.getTime()) ? null : d
    }

    const upcoming = matches
      .filter((m) => {
        const isMyTeam = Number(m.homeTeamId) === favId || Number(m.awayTeamId) === favId
        if (!isMyTeam) return false
        const d = parseDate(m.matchDate)
        if (!d) return false
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
        return dayStart.getTime() >= todayStart.getTime()
      })
      .map((m) => {
        const d = parseDate(m.matchDate)
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
        return {
          ...m,
          _matchTime: d.getTime(),
          _matchDayStart: dayStart.getTime(),
          _dateObj: d
        }
      })
      .sort((a, b) => a._matchTime - b._matchTime)

    if (upcoming.length === 0) return null

    const closest = upcoming[0]
    const diffDays = Math.round((closest._matchDayStart - todayStart.getTime()) / (1000 * 60 * 60 * 24))
    const dDayTag = diffDays === 0 ? 'D-DAY' : `D-${diffDays}`

    const isHome = Number(closest.homeTeamId) === favId
    const opponentId = isHome ? Number(closest.awayTeamId) : Number(closest.homeTeamId)
    const opponentTeam = teamList.find((t) => Number(t.teamId) === opponentId)
    const homeTeam = teamList.find((t) => Number(t.teamId) === Number(closest.homeTeamId))
    const favTeam = teamList.find((t) => Number(t.teamId) === favId)

    const opponentName = isHome
      ? (closest.awayTeamNameKor || opponentTeam?.teamNameKor || closest.awayTeamName || opponentTeam?.teamName || '상대팀')
      : (closest.homeTeamNameKor || opponentTeam?.teamNameKor || closest.homeTeamName || opponentTeam?.teamName || '상대팀')

    const favTeamName = favTeam?.teamNameKor || favTeam?.teamName || '응원 구단'
    const stadium =
      closest.homeGroundKor ||
      homeTeam?.homeGroundKor ||
      closest.homeGround ||
      homeTeam?.homeGround ||
      (isHome ? '홈 경기장' : '원정 경기장')

    const favEmblemRaw =
      favTeam?.emblemUrl || (isHome ? closest.homeEmblemUrl : closest.awayEmblemUrl) || ''
    const opponentEmblemRaw =
      opponentTeam?.emblemUrl || (isHome ? closest.awayEmblemUrl : closest.homeEmblemUrl) || ''

    const matchDateStr = closest._dateObj
      ? `${closest._dateObj.getMonth() + 1}월 ${closest._dateObj.getDate()}일 (${['일', '월', '화', '수', '목', '금', '토'][closest._dateObj.getDay()]}) ${String(closest._dateObj.getHours()).padStart(2, '0')}:${String(closest._dateObj.getMinutes()).padStart(2, '0')}`
      : closest.matchDate

    return {
      matchId: closest.matchId,
      dDayTag,
      diffDays,
      isHome,
      favTeamName,
      favTeamEmblem: favEmblemRaw,
      opponentName,
      opponentEmblem: opponentEmblemRaw,
      stadium,
      matchDateStr
    }
  }, [profile?.favoriteTeamId, matches, teamList])

  // 포인트샵 보유 아이템 및 구매 내역 상태
  const [ownedShopItems, setOwnedShopItems] = useState([])
  const [shopOrders, setShopOrders] = useState([])

  // 내 보유 아이템 전체보기 모달 & 포인트샵 구매 내역 전체보기 모달 상태 (카드형 스와이프 지원)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [invModalTab, setInvModalTab] = useState('ALL') // 'ALL' | 'icon' | 'emoticon'
  const [invModalPage, setInvModalPage] = useState(0)
  const invSliderRef = useRef(null)

  const [showOrdersModal, setShowOrdersModal] = useState(false)
  const [ordModalPage, setOrdModalPage] = useState(0)
  const ordSliderRef = useRef(null)

  const SHOP_MODAL_PAGE_SIZE = 4 // 한 슬라이드당 2열 x 2줄 (4개씩)

  const filteredModalInventory = useMemo(() => {
    if (invModalTab === 'ALL') return ownedShopItems
    return ownedShopItems.filter((item) => item.type === invModalTab)
  }, [ownedShopItems, invModalTab])

  const invModalPages = useMemo(() => {
    const chunks = []
    for (let i = 0; i < filteredModalInventory.length; i += SHOP_MODAL_PAGE_SIZE) {
      chunks.push(filteredModalInventory.slice(i, i + SHOP_MODAL_PAGE_SIZE))
    }
    return chunks
  }, [filteredModalInventory])

  const ordModalPages = useMemo(() => {
    const chunks = []
    for (let i = 0; i < shopOrders.length; i += SHOP_MODAL_PAGE_SIZE) {
      chunks.push(shopOrders.slice(i, i + SHOP_MODAL_PAGE_SIZE))
    }
    return chunks
  }, [shopOrders])

  const scrollModalSlider = (ref, setPage, pageIdx) => {
    if (!ref.current) return
    const targetLeft = pageIdx * ref.current.clientWidth
    ref.current.scrollTo({ left: targetLeft, behavior: 'smooth' })
    setPage(pageIdx)
  }

  const handleModalSliderScroll = (e, currentPage, setPage, totalPages) => {
    const el = e.currentTarget
    if (el && el.clientWidth > 0) {
      const page = Math.round(el.scrollLeft / el.clientWidth)
      if (page !== currentPage && page >= 0 && page < totalPages) {
        setPage(page)
      }
    }
  }

  const handleOpenInventoryModal = () => {
    setInvModalTab('ALL')
    setInvModalPage(0)
    setShowInventoryModal(true)
  }

  const handleOpenOrdersModal = () => {
    setOrdModalPage(0)
    setShowOrdersModal(true)
  }

  // 모달 오픈 상태에서 ESC 키 입력 시 닫기
  useEffect(() => {
    if (!showInventoryModal && !showOrdersModal && !showPointModal && !showWithdrawModal) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showInventoryModal) setShowInventoryModal(false)
        if (showOrdersModal) setShowOrdersModal(false)
        if (showPointModal) setShowPointModal(false)
        if (showWithdrawModal && !withdrawing) setShowWithdrawModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showInventoryModal, showOrdersModal, showPointModal, showWithdrawModal, withdrawing])

  // 포인트샵 보관함(USER_INVENTORY) & 구매 내역(ITEM_ORDERS) 로드 (DB + localStorage 양방향 병합)
  const loadShopData = async (targetUserId) => {
    const uid = targetUserId || profile?.userId || reduxUser?.userId
    if (!uid) return

    let localIds = []
    let localHistory = []
    try {
      const savedIds = localStorage.getItem(`buildup_purchased_items_${uid}`)
      if (savedIds) localIds = JSON.parse(savedIds)
    } catch {}
    try {
      const savedHist = localStorage.getItem(`buildup_purchase_history_${uid}`)
      if (savedHist) localHistory = JSON.parse(savedHist)
    } catch {}

    let dbInventory = []
    let dbOrders = []
    try {
      const shopData = await getMyShopData()
      if (shopData) {
        if (Array.isArray(shopData.inventory)) dbInventory = shopData.inventory
        if (Array.isArray(shopData.orders)) dbOrders = shopData.orders
      }
    } catch {}

    // 1) 보유 아이템 목록 병합 (DB USER_INVENTORY 우선 + localStorage 폴백)
    const ownedMap = new Map()
    dbInventory.forEach((inv) => {
      const catalogItem = SHOP_ITEMS.find((s) => s.name === inv.itemName)
      const isIcon = String(inv.itemType || catalogItem?.type || '').toUpperCase() === 'ICON'
      ownedMap.set(inv.itemName, {
        id: catalogItem?.id || `db_${inv.itemId}`,
        name: inv.itemName,
        type: isIcon ? 'icon' : 'emoticon',
        categoryName: isIcon ? '아이콘' : '이모티콘',
        visual: inv.imageUrl || catalogItem?.visual || (isIcon ? '🏆' : '🔥'),
        price: Number(inv.point ?? catalogItem?.price ?? 0),
        desc: inv.description || catalogItem?.desc || '',
        purchasedAt: inv.purchasedAt || '',
        isEquipped: inv.isEquipped === 'Y',
      })
    })

    if (Array.isArray(localIds)) {
      localIds.forEach((itemId) => {
        const catalogItem = SHOP_ITEMS.find(
          (s) => s.id === itemId || Number(s.id) === Number(itemId) || Number(s.itemId) === Number(itemId)
        )
        if (catalogItem && !ownedMap.has(catalogItem.name)) {
          ownedMap.set(catalogItem.name, {
            id: catalogItem.id,
            name: catalogItem.name,
            type: catalogItem.type,
            categoryName: catalogItem.categoryName,
            visual: catalogItem.visual,
            price: catalogItem.price,
            desc: catalogItem.desc || '',
            purchasedAt: '',
            isEquipped: false,
          })
        }
      })
    }
    const mergedOwned = Array.from(ownedMap.values())
    setOwnedShopItems(mergedOwned)

    // 2) 구매 내역 목록 병합 (DB ITEM_ORDERS 우선 + localStorage 구매이력 + 보유아이템 폴백)
    const orderList = []
    const seenOrderItemNames = new Set()

    dbOrders.forEach((ord) => {
      const catalogItem = SHOP_ITEMS.find((s) => s.name === ord.itemName)
      const isIcon = String(ord.itemType || catalogItem?.type || '').toUpperCase() === 'ICON'
      seenOrderItemNames.add(ord.itemName)
      orderList.push({
        orderId: ord.orderId,
        itemName: ord.itemName,
        type: isIcon ? 'icon' : 'emoticon',
        categoryName: isIcon ? '아이콘' : '이모티콘',
        visual: ord.imageUrl || catalogItem?.visual || (isIcon ? '🏆' : '🔥'),
        point: Number(ord.point ?? catalogItem?.price ?? 0),
        desc: ord.description || catalogItem?.desc || '',
        orderStatus: ord.orderStatus || 'COMPLETED',
        orderedAt: ord.orderedAt || '구매 완료',
      })
    })

    if (Array.isArray(localHistory)) {
      localHistory.forEach((lh) => {
        if (lh && lh.itemName && !seenOrderItemNames.has(lh.itemName)) {
          const catalogItem = SHOP_ITEMS.find((s) => s.name === lh.itemName || s.id === lh.itemId)
          const isIcon = String(lh.itemType || catalogItem?.type || '').toUpperCase() === 'ICON'
          seenOrderItemNames.add(lh.itemName)
          orderList.push({
            orderId: lh.orderId || `LOCAL_${lh.itemName}`,
            itemName: lh.itemName,
            type: isIcon ? 'icon' : 'emoticon',
            categoryName: lh.categoryName || (isIcon ? '아이콘' : '이모티콘'),
            visual: lh.imageUrl || catalogItem?.visual || (isIcon ? '🏆' : '🔥'),
            point: Number(lh.point ?? catalogItem?.price ?? 0),
            desc: lh.description || catalogItem?.desc || '',
            orderStatus: lh.orderStatus || 'COMPLETED',
            orderedAt: lh.orderedAt || '구매 완료',
          })
        }
      })
    }

    // 기존 localStorage로만 구매해둔 아이템이 있다면 구매 내역에도 누락 없이 표시
    mergedOwned.forEach((owned) => {
      if (!seenOrderItemNames.has(owned.name)) {
        seenOrderItemNames.add(owned.name)
        orderList.push({
          orderId: `OWNED_${owned.id}`,
          itemName: owned.name,
          type: owned.type,
          categoryName: owned.categoryName,
          visual: owned.visual,
          point: owned.price,
          desc: owned.desc || '',
          orderStatus: 'COMPLETED',
          orderedAt: owned.purchasedAt || '보유중',
        })
      }
    })

    setShopOrders(orderList)
  }

  // 활동 요약 통계 로드
  const loadActivities = async () => {
    try {
      const counts = await getMyActivities()
      setActivityCounts(counts)
    } catch (e) {
      // ignore
    }
  }

  const PAGE_SIZE = 5

  // 탭 목록 로드 (5개 단위 페이징)
  const loadTabList = async (tab, page = 1) => {
    setListLoading(true)
    try {
      if (tab === 'posts') {
        const data = await getMyPosts(page, PAGE_SIZE)
        setPostsData(data)
      } else if (tab === 'comments') {
        const data = await getMyComments(page, PAGE_SIZE)
        setCommentsData(data)
      } else if (tab === 'likes') {
        const data = await getMyLikedPosts(page, PAGE_SIZE)
        setLikesData(data)
      }
    } catch (err) {
      console.error('[마이페이지 목록 조회 오류]', err)
    } finally {
      setListLoading(false)
    }
  }

  // 넘버링 지원 모던 다크 페이지네이션 렌더러 (항목이 5개 이하(1페이지)라도 일관되게 노출)
  const renderPagination = (tabName, currentData) => {
    if (!currentData || !currentData.list || currentData.list.length === 0) return null

    const totalPages = Math.max(1, currentData.totalPages || 1)
    const currentPage = currentData.currentPage || 1

    const pages = []
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }

    return (
      <div className="mypage-dark-pagination">
        <button
          type="button"
          disabled={currentPage <= 1 || listLoading}
          onClick={() => loadTabList(tabName, currentPage - 1)}
          className="mypage-page-nav-btn"
        >
          &lt; 이전
        </button>

        <div className="mypage-page-numbers">
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`mypage-page-num-btn ${p === currentPage ? 'is-active' : ''}`}
              disabled={listLoading}
              onClick={() => loadTabList(tabName, p)}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={currentPage >= totalPages || listLoading}
          onClick={() => loadTabList(tabName, currentPage + 1)}
          className="mypage-page-nav-btn"
        >
          다음 &gt;
        </button>
      </div>
    )
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab !== 'profile') {
      loadTabList(tab, 1)
    }
  }

  // 사용자 상세 정보 로드
  useEffect(() => {
    if (!isLoggedIn) {
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
          loadActivities()
          loadShopData(userObj.userId)
        } else {
          // 백엔드 세션 만료 시 리덕스 데이터로 1차 폴백
          if (reduxUser) {
            setProfile(reduxUser)
            setNickname(reduxUser.nickname || '')
            setEmail(reduxUser.email || '')
            setFavoriteTeamId(reduxUser.favoriteTeamId ? String(reduxUser.favoriteTeamId) : '')
            loadActivities()
            loadShopData(reduxUser.userId)
          }
        }
      } catch {
        if (reduxUser) {
          setProfile(reduxUser)
          setNickname(reduxUser.nickname || '')
          setEmail(reduxUser.email || '')
          setFavoriteTeamId(reduxUser.favoriteTeamId ? String(reduxUser.favoriteTeamId) : '')
          loadShopData(reduxUser.userId)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [isLoggedIn, reduxUser])

  // 닉네임 중복확인
  const handleCheckNickname = async () => {
    const trimmed = nickname.trim()
    if (!trimmed) {
      setNicknameCheckMsg('닉네임을 입력해주세요.')
      return
    }
    if (!NICKNAME_REGEX.test(trimmed)) {
      setNicknameChecked(false)
      if (trimmed.length < 2) {
        setNicknameCheckMsg('✕ 닉네임은 최소 2자 이상이어야 합니다.')
      } else if (/\s/.test(trimmed)) {
        setNicknameCheckMsg('✕ 닉네임에 공백을 사용할 수 없습니다.')
      } else if (/[^가-힣a-zA-Z0-9]/.test(trimmed)) {
        setNicknameCheckMsg('✕ 특수문자는 사용할 수 없습니다. (한글, 영문, 숫자만 허용)')
      } else {
        setNicknameCheckMsg('✕ 닉네임 형식이 올바르지 않습니다.')
      }
      return
    }

    // 본인의 기존 닉네임과 동일한 경우 통과
    if (trimmed.toLowerCase() === profile?.nickname?.toLowerCase()) {
      setNicknameChecked(true)
      setNicknameCheckMsg('✓ 현재 사용 중인 회원님의 닉네임입니다.')
      return
    }

    try {
      const res = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(trimmed)}`)
      const data = await res.json()
      if (res.ok && (data.data === true || data.status === 'SUCCESS' || data.code === 'SUC_001')) {
        setNicknameChecked(true)
        setNicknameCheckMsg('✓ 사용 가능한 닉네임입니다.')
      } else {
        setNicknameChecked(false)
        setNicknameCheckMsg(data.message || '✕ 이미 사용 중인 닉네임입니다.')
      }
    } catch (err) {
      setNicknameChecked(false)
      setNicknameCheckMsg('중복확인 중 오류가 발생했습니다.')
    }
  }

  // 이메일 인증번호 발송
  const handleSendEmailCode = async () => {
    const trimmed = email.trim()
    if (!trimmed) {
      setEmailVerifyMsg('이메일을 입력해주세요.')
      return
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailVerifyMsg('올바른 이메일 형식을 입력해주세요.')
      return
    }

    setSendingEmailCode(true)
    setEmailVerifyMsg('')
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`/api/auth/send-email-change-code?email=${encodeURIComponent(trimmed)}`, {
        method: 'POST',
        headers,
      })
      const data = await res.json()
      if (res.ok && (data.status === 'SUCCESS' || data.code === 'SUC_001')) {
        setEmailCodeSent(true)
        setEmailVerifyMsg('✓ 인증번호가 발송되었습니다. 메일함을 확인해주세요.')
      } else {
        setEmailVerifyMsg(data.message || '인증번호 발송에 실패했습니다. (중복된 이메일 여부를 확인해주세요)')
      }
    } catch (err) {
      setEmailVerifyMsg('서버와 통신할 수 없습니다.')
    } finally {
      setSendingEmailCode(false)
    }
  }

  // 이메일 인증번호 검증
  const handleVerifyEmailCode = async () => {
    const trimmedCode = emailAuthCode.trim()
    if (!trimmedCode) {
      setEmailVerifyMsg('인증번호 6자리를 입력해주세요.')
      return
    }

    setVerifyingEmailCode(true)
    try {
      const token = localStorage.getItem('buildup_token')
      const headers = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(
        `/api/auth/verify-email-change-code?email=${encodeURIComponent(email.trim())}&code=${encodeURIComponent(trimmedCode)}`,
        {
          method: 'POST',
          headers,
        }
      )
      const data = await res.json()
      if (res.ok && (data.status === 'SUCCESS' || data.code === 'SUC_001')) {
        setEmailVerified(true)
        setEmailVerifyMsg('✓ 이메일 인증이 완료되었습니다.')
      } else {
        setEmailVerified(false)
        setEmailVerifyMsg(data.message || '인증번호가 일치하지 않거나 만료되었습니다.')
      }
    } catch (err) {
      setEmailVerifyMsg('인증 확인 중 오류가 발생했습니다.')
    } finally {
      setVerifyingEmailCode(false)
    }
  }

  // 프로필 저장
  const handleSave = async (e) => {
    e.preventDefault()
    setMessage('')
    setErrorMsg('')

    const trimmedNickname = nickname.trim()
    const trimmedEmail = (email || profile?.email || '').trim()

    if (!trimmedNickname) {
      setErrorMsg('닉네임을 입력해주세요.')
      return
    }

    if (!NICKNAME_REGEX.test(trimmedNickname)) {
      setErrorMsg('닉네임은 2~20자의 한글, 영문, 숫자만 사용할 수 있습니다.')
      return
    }

    if (trimmedNickname.toLowerCase() !== profile?.nickname?.toLowerCase() && !nicknameChecked) {
      setErrorMsg('닉네임 중복확인을 진행해주세요.')
      return
    }

    if (trimmedEmail && !EMAIL_REGEX.test(trimmedEmail)) {
      setErrorMsg('올바른 이메일 형식을 입력해주세요.')
      return
    }

    if (profile?.email && trimmedEmail.toLowerCase() !== profile.email.toLowerCase() && !emailVerified) {
      setErrorMsg('변경된 이메일의 인증을 완료해주세요.')
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
          nickname: trimmedNickname,
          email: trimmedEmail,
          favoriteTeamId: favoriteTeamId ? Number(favoriteTeamId) : null
        })
      })

      const data = await res.json()
      const updatedUser = data.data || data.user

      if (res.ok && (data.status === 'SUCCESS' || data.code === 'SUC_001') && updatedUser) {
        setProfile(updatedUser)
        dispatch(updateUser(updatedUser))
        setMessage('회원 정보가 성공적으로 변경되었습니다.')
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

  // 회원 탈퇴 버튼 클릭
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
        navigate('/plug/login')
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

  if (isLoggedIn && loading) {
    return (
      <div className={`mypage-dashboard-bg ${currentTheme === 'light' ? 'mypage-light-mode' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: currentTheme === 'light' ? '#38003c' : '#00ff87', fontSize: '16px', fontWeight: 700 }}>회원 대시보드를 불러오는 중입니다...</p>
      </div>
    )
  }

  if (!isLoggedIn || !profile) {
    return (
      <div className={`mypage-dashboard-bg ${currentTheme === 'light' ? 'mypage-light-mode' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="mypage-card-surface" style={{ maxWidth: '440px', padding: '40px 32px', textAlign: 'center' }}>
          <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255, 22, 107, 0.12)', border: '1px solid rgba(255, 22, 107, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconLock size={26} color="#ff3377" />
            </div>
          </div>
          <h2 style={{ color: currentTheme === 'light' ? '#0f172a' : '#ffffff', fontSize: '22px', fontWeight: 800, margin: '0 0 8px' }}>로그인이 필요합니다</h2>
          <p style={{ color: currentTheme === 'light' ? '#64748b' : '#a795b5', fontSize: '14px', margin: '0 0 24px' }}>마이페이지는 회원 로그인 후 이용하실 수 있습니다.</p>
          <a
            href="#/plug/login"
            className="mypage-primary-btn"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', padding: '0 28px' }}
          >
            로그인하러 가기
          </a>
        </div>
      </div>
    )
  }

  // 선택된 응원 구단 데이터 (DB 조회 데이터 기준)
  const selectedFavoriteTeam = teamList.find((t) => String(t.teamId) === String(favoriteTeamId))
  const profileFavoriteTeam =
    teamList.find((t) => String(t.teamId) === String(profile?.favoriteTeamId)) ||
    (profile?.favoriteTeamId && profile?.favoriteTeamEmblemUrl
      ? {
          teamId: profile.favoriteTeamId,
          teamName: profile.favoriteTeamName,
          teamNameKor: profile.favoriteTeamNameKor,
          emblemUrl: profile.favoriteTeamEmblemUrl
        }
      : null)

  return (
    <div className={`mypage-dashboard-bg ${currentTheme === 'light' ? 'mypage-light-mode' : ''}`}>
      {/* 프리미어리그 시그니처 곡면 라일락 리본 & 앰비언트 하이라이트 배경 (대시보드 전용) */}
      <div className="mypage-bg-decor" aria-hidden="true">
        <svg
          className="mypage-bg-svg"
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="mypageRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d886ed" stopOpacity="0.15" />
              <stop offset="40%" stopColor="#a33eb0" stopOpacity="0.10" />
              <stop offset="75%" stopColor="#641670" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#2c0533" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="mypageRibbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f0aeff" stopOpacity="0.14" />
              <stop offset="45%" stopColor="#962ba3" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#2c0533" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="mypageNeonGreenGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00ff87" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#00ff87" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#00ff87" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="mypagePinkGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff166b" stopOpacity="0.09" />
              <stop offset="60%" stopColor="#ff166b" stopOpacity="0.02" />
              <stop offset="100%" stopColor="#ff166b" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="mypageTopGlow" cx="50%" cy="0%" r="65%">
              <stop offset="0%" stopColor="#e8a8fc" stopOpacity="0.18" />
              <stop offset="35%" stopColor="#b446c7" stopOpacity="0.11" />
              <stop offset="70%" stopColor="#691175" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#2c0533" stopOpacity="0" />
            </radialGradient>
            <filter id="ribbonSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="18" />
            </filter>
          </defs>

          {/* ★ 네비바 바로 아래를 화사하게 밝히는 상단 중앙 라일락 오로라 빔 ★ */}
          <ellipse cx="720" cy="50" rx="650" ry="180" fill="url(#mypageTopGlow)" filter="url(#ribbonSoftGlow)" />

          {/* 좌상단 비비드 핑크 앰비언트 글로우 */}
          <circle cx="120" cy="180" r="260" fill="url(#mypagePinkGlow)" />

          {/* 우하단 네온 그린 앰비언트 글로우 */}
          <circle cx="1280" cy="740" r="320" fill="url(#mypageNeonGreenGlow)" />

          {/* 네비바 바로 아래를 비추며 우측으로 뻗어나가는 상단 아크 리본 0 */}
          <path
            d="M 280,0 C 460,70 780,110 1140,40 L 1260,0 C 880,90 540,55 350,0 Z"
            fill="url(#mypageRibbonGrad2)"
            filter="url(#ribbonSoftGlow)"
          />

          {/* 우상단에서 중앙으로 흐르는 라일락 아크 리본 1 */}
          <path
            d="M 960,-60 C 1140,80 1300,220 1480,360 L 1480,210 C 1310,90 1160,-20 1020,-60 Z"
            fill="url(#mypageRibbonGrad1)"
            filter="url(#ribbonSoftGlow)"
          />

          {/* 우측 상단에서 좌하단으로 유려하게 가로지르는 메인 쉐브론 곡면 리본 2 */}
          <path
            d="M 1440,70 C 1220,180 1040,330 850,530 C 700,690 550,800 280,890 L 210,820 C 490,730 650,620 800,450 C 970,270 1170,130 1440,-10 Z"
            fill="url(#mypageRibbonGrad2)"
            filter="url(#ribbonSoftGlow)"
          />

          {/* 좌상단 보조 쉐브론 곡선 3 */}
          <path
            d="M -40,110 C 130,170 270,280 390,450 L 320,490 C 210,330 80,230 -40,170 Z"
            fill="url(#mypageRibbonGrad1)"
            filter="url(#ribbonSoftGlow)"
          />
        </svg>
      </div>

      <div className="mypage-dashboard-wrapper">
        {/* 상단 대시보드 헤더 */}
        <header className="mypage-top-header">
          <div className="mypage-top-title-area">
            <h1>
              MY <span className="mypage-title-highlight">DASHBOARD</span>
            </h1>
            <p>프리미어리그 팬 커뮤니티 활동과 프로필을 한눈에 관리하세요</p>
          </div>
          <div className="mypage-top-meta-badge">
            <span className="dot"></span>
            <span>{profile.roleName || (profile.roleCode === 9 ? '최고 관리자' : '정규 회원')}</span>
          </div>
        </header>

        {/* 2열 메인 대시보드 그리드 */}
        <div className="mypage-grid">
          {/* 좌측 패널: 프로필 카드 & 사이드 네비게이션 */}
          <aside className="mypage-sidebar">
            <div className="mypage-card-surface mypage-profile-card">
              <div className="mypage-avatar-frame">
                {profileFavoriteTeam?.emblemUrl ? (
                  <TeamEmblemImg
                    url={profileFavoriteTeam.emblemUrl}
                    alt={profileFavoriteTeam.teamNameKor || profileFavoriteTeam.teamName}
                    className="mypage-avatar-img"
                  />
                ) : (
                  <span className="mypage-avatar-default">
                    <IconBall size={42} color="#00ff87" />
                  </span>
                )}
              </div>
              <h3 className="mypage-user-name">{profile.nickname}</h3>
              <p className="mypage-user-id">@{profile.loginId}</p>

              <div className="mypage-badge-group">
                <span className="mypage-role-badge">
                  {profile.roleName || (profile.roleCode === 9 ? 'ADMIN' : 'MEMBER')}
                </span>
                {profileFavoriteTeam && (
                  <span className="mypage-fav-team-badge">
                    {profileFavoriteTeam.teamNameKor || profileFavoriteTeam.teamName}
                  </span>
                )}
              </div>

              <div
                className="mypage-point-box"
                onClick={handleOpenPointModal}
                title="클릭하여 최근 5번의 포인트 변동 이력을 확인하세요"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleOpenPointModal()
                  }
                }}
              >
                <span className="mypage-point-label">
                  보유 포인트
                  <span className="mypage-point-hint">내역</span>
                </span>
                <span className="mypage-point-val">{profile.point?.toLocaleString() || 100} P</span>
              </div>
            </div>

            {/* 사이드 탭 메뉴 (레퍼런스 사이드바 스타일) */}
            <div className="mypage-card-surface mypage-side-nav">
              <button
                type="button"
                className={`mypage-side-btn ${activeTab === 'profile' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('profile')}
              >
                <span className="mypage-side-btn-label">
                  <IconSettings size={18} />
                  <span>프로필 정보 설정</span>
                </span>
              </button>
              <button
                type="button"
                className={`mypage-side-btn ${activeTab === 'posts' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('posts')}
              >
                <span className="mypage-side-btn-label">
                  <IconArticle size={18} />
                  <span>내가 쓴 글</span>
                </span>
                <span className="mypage-side-badge">{activityCounts.postCount}</span>
              </button>
              <button
                type="button"
                className={`mypage-side-btn ${activeTab === 'comments' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('comments')}
              >
                <span className="mypage-side-btn-label">
                  <IconComment size={18} />
                  <span>내가 쓴 댓글</span>
                </span>
                <span className="mypage-side-badge">{activityCounts.commentCount}</span>
              </button>
              <button
                type="button"
                className={`mypage-side-btn ${activeTab === 'likes' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('likes')}
              >
                <span className="mypage-side-btn-label">
                  <IconHeart size={18} />
                  <span>좋아하는 글</span>
                </span>
                <span className="mypage-side-badge">{activityCounts.likedPostCount}</span>
              </button>
            </div>

            {/* 좌측 사이드바: 애드센스 스폰서 배너 카드 (300x250) */}
            <div className="mypage-card-surface mypage-ad-card">
              <div className="mypage-ad-badge">ADVERTISEMENT</div>
              <div className="mypage-ad-box">
                {/* 실제 애드센스 단위 */}
                <ins
                  ref={sideAdRef}
                  className="adsbygoogle mypage-ad-ins"
                  style={{ display: 'block' }}
                  data-ad-client="ca-pub-6961977480009285"
                  data-ad-format="rectangle"
                  data-full-width-responsive="true"
                />

                {/* 광고 로드 전 / 로컬 개발 환경용 플레이스홀더 */}
                <div className="mypage-ad-placeholder" aria-hidden="true">
                  <span className="mypage-ad-icon">
                    <IconBall size={30} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                  </span>
                  <div className="mypage-ad-text">
                    <strong>PLUGIN SIDEBAR AD BANNER</strong>
                    <p>프리미어리그 실시간 분석 & 팬 커뮤니티 PL:UG</p>
                  </div>
                  <span className="mypage-ad-subtag">Official Partner</span>
                </div>
              </div>
            </div>
          </aside>

          {/* 우측 패널: 상단 3구 스탯 위젯 + 메인 워크스페이스 */}
          <main className="mypage-content-area">
            {/* 3구 요약 통계 위젯 바 (레퍼런스 카드 스타일) */}
            <section className="mypage-stat-grid" aria-label="활동 통계 요약">
              <div
                className={`mypage-card-surface mypage-stat-card ${activeTab === 'posts' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('posts')}
              >
                <div className="mypage-stat-card-info">
                  <span className="mypage-stat-card-title">작성한 게시글</span>
                  <span className="mypage-stat-card-num">{activityCounts.postCount}</span>
                </div>
                <div className="mypage-stat-card-icon">
                  <IconArticle size={22} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                </div>
              </div>

              <div
                className={`mypage-card-surface mypage-stat-card ${activeTab === 'comments' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('comments')}
              >
                <div className="mypage-stat-card-info">
                  <span className="mypage-stat-card-title">남긴 댓글</span>
                  <span className="mypage-stat-card-num">{activityCounts.commentCount}</span>
                </div>
                <div className="mypage-stat-card-icon">
                  <IconComment size={22} color="#d886ed" />
                </div>
              </div>

              <div
                className={`mypage-card-surface mypage-stat-card ${activeTab === 'likes' ? 'is-active' : ''}`}
                onClick={() => handleTabChange('likes')}
              >
                <div className="mypage-stat-card-info">
                  <span className="mypage-stat-card-title">좋아하는 글</span>
                  <span className="mypage-stat-card-num">{activityCounts.likedPostCount}</span>
                </div>
                <div className="mypage-stat-card-icon">
                  <IconHeart size={22} color="#ff166b" filled />
                </div>
              </div>
            </section>

            {/* 알림 메시지 배너 */}
            {message && (
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'rgba(0, 255, 135, 0.12)',
                  border: '1px solid rgba(0, 255, 135, 0.4)',
                  color: '#00ff87',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              >
                ✓ {message}
              </div>
            )}
            {errorMsg && (
              <div
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  background: 'rgba(255, 22, 107, 0.12)',
                  border: '1px solid rgba(255, 22, 107, 0.4)',
                  color: '#ff3377',
                  fontSize: '14px',
                  fontWeight: 700
                }}
              >
                ✕ {errorMsg}
              </div>
            )}

            {/* 메인 탭 콘텐츠 카드 */}
            <div className="mypage-card-surface mypage-main-panel">
              {/* ---------------- 탭 1: 프로필 설정 ---------------- */}
              {activeTab === 'profile' && (
                <div className="mypage-panel-tab-pane">
                  <div className="mypage-panel-header">
                    <div className="mypage-panel-header-top">
                      <h2>
                        <IconSettings size={22} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                        프로필 정보 관리
                      </h2>
                      {!isEditing && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="mypage-action-outline-btn"
                            onClick={() => {
                              setShowPasswordModal(true)
                              setPwCurrent('')
                              setPwNew('')
                              setPwConfirm('')
                              setPwMsg('')
                              setPwSuccess(false)
                            }}
                          >
                            🔒 비밀번호 변경
                          </button>
                          <button
                            type="button"
                            className="mypage-action-outline-btn"
                            onClick={() => {
                              setIsEditing(true)
                              setNicknameChecked(true)
                              setNicknameCheckMsg('')
                              setEmailVerified(true)
                              setEmailVerifyMsg('')
                              setEmailCodeSent(false)
                              setEmailAuthCode('')
                            }}
                          >
                            프로필 수정하기
                          </button>
                        </div>
                      )}
                    </div>
                    <p>기본 회원 정보 및 응원하는 구단을 수정할 수 있습니다.</p>
                  </div>

                  {!isEditing ? (
                    <>
                      <div className="mypage-view-table">
                      <div className="mypage-view-row">
                        <span className="mypage-view-row-label">로그인 아이디</span>
                        <span className="mypage-view-row-val">{profile.loginId}</span>
                      </div>
                      <div className="mypage-view-row">
                        <span className="mypage-view-row-label">닉네임</span>
                        <span className="mypage-view-row-val">{profile.nickname}</span>
                      </div>
                      <div className="mypage-view-row">
                        <span className="mypage-view-row-label">이메일 계정</span>
                        <span className="mypage-view-row-val">{profile.email || '미등록'}</span>
                      </div>
                      <div className="mypage-view-row">
                        <span className="mypage-view-row-label">마이 응원 구단</span>
                        <div className="mypage-fav-team-display">
                          {profileFavoriteTeam ? (
                            <>
                              <TeamEmblemImg
                                url={profileFavoriteTeam.emblemUrl}
                                alt={profileFavoriteTeam.teamNameKor}
                                className="mypage-fav-team-emblem-sm"
                              />
                              <span className="mypage-view-row-val">
                                {profileFavoriteTeam.teamNameKor} ({profileFavoriteTeam.teamName})
                              </span>
                            </>
                          ) : (
                            <span className="mypage-view-row-val" style={{ color: '#8e7a9c' }}>
                              선택된 구단 없음
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mypage-view-row">
                        <span className="mypage-view-row-label">가입 일자</span>
                        <span className="mypage-view-row-val">
                          {profile.createdAt ? profile.createdAt.split(' ')[0] : '2026-09-18'}
                        </span>
                      </div>
                    </div>

                    {/* 2열 하단 대시보드 위젯: 1) 나의 승부예측 전적/적중률  2) 마이 응원 구단 다음 경기 */}
                    <div className="mypage-dashboard-subwidgets">
                      {/* 위젯 1: 나의 승부예측 전적 & 적중률 */}
                      <div className="mypage-subwidget-card">
                        <div className="mypage-subwidget-header">
                          <span className="mypage-subwidget-title">
                            <IconTarget size={18} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                            승부예측 전적 & 적중률
                          </span>
                          <a href="#/plug/prediction" className="mypage-subwidget-link">
                            예측하기 →
                          </a>
                        </div>

                        <div className="mypage-pred-stat-row">
                          <div className="mypage-pred-stat-box">
                            <span className="mypage-pred-stat-lbl">적중 성공</span>
                            <strong className="mypage-pred-stat-val mypage-pred-stat-win-val">
                              {predictStats.win}회
                            </strong>
                          </div>
                          <div className="mypage-pred-stat-box">
                            <span className="mypage-pred-stat-lbl">적중 실패</span>
                            <strong className="mypage-pred-stat-val">
                              {predictStats.fail}회
                            </strong>
                          </div>
                          <div className="mypage-pred-stat-box mypage-pred-stat-rate-box">
                            <span className="mypage-pred-stat-lbl">적중률</span>
                            <strong className="mypage-pred-rate-val">{predictStats.rate}%</strong>
                          </div>
                        </div>

                        {/* 적중률 프로그레스 게이지 바 */}
                        <div className="mypage-pred-progress-wrap">
                          <div
                            className="mypage-pred-progress-bar"
                            style={{ width: `${Math.min(Number(predictStats.rate) || 0, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* 위젯 2: 내 응원 구단 다음 경기 프리뷰 (클릭 시 경기 일정 해당 위치로 스크롤 & 포커싱) */}
                      <div
                        className={`mypage-subwidget-card ${nextFavoriteMatch ? 'is-clickable-match-card' : ''}`}
                        onClick={
                          nextFavoriteMatch
                            ? () => navigate(`/plug/match?matchId=${nextFavoriteMatch.matchId}`)
                            : undefined
                        }
                        onKeyDown={
                          nextFavoriteMatch
                            ? (e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault()
                                  navigate(`/plug/match?matchId=${nextFavoriteMatch.matchId}`)
                                }
                              }
                            : undefined
                        }
                        role={nextFavoriteMatch ? 'button' : undefined}
                        tabIndex={nextFavoriteMatch ? 0 : undefined}
                        title={nextFavoriteMatch ? '클릭하여 경기 일정에서 해당 경기 보기' : undefined}
                      >
                        <div className="mypage-subwidget-header">
                          <span className="mypage-subwidget-title">
                            <IconBall size={18} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                            응원 구단 다음 경기
                          </span>
                          {nextFavoriteMatch && (
                            <span className="mypage-match-dday-badge">{nextFavoriteMatch.dDayTag}</span>
                          )}
                        </div>

                        {nextFavoriteMatch ? (
                          <div className="mypage-next-match-content">
                            <div className="mypage-next-match-teams">
                              <div className="mypage-match-team-col">
                                {nextFavoriteMatch.favTeamEmblem ? (
                                  <TeamEmblemImg
                                    url={nextFavoriteMatch.favTeamEmblem}
                                    alt={nextFavoriteMatch.favTeamName}
                                    className="mypage-match-emblem"
                                  />
                                ) : (
                                  <IconBall size={32} color="#8b7899" />
                                )}
                                <span className="mypage-match-team-name">{nextFavoriteMatch.favTeamName}</span>
                              </div>

                              <div className="mypage-match-vs">VS</div>

                              <div className="mypage-match-team-col">
                                {nextFavoriteMatch.opponentEmblem ? (
                                  <TeamEmblemImg
                                    url={nextFavoriteMatch.opponentEmblem}
                                    alt={nextFavoriteMatch.opponentName}
                                    className="mypage-match-emblem"
                                  />
                                ) : (
                                  <IconBall size={32} color="#8b7899" />
                                )}
                                <span className="mypage-match-team-name">{nextFavoriteMatch.opponentName}</span>
                              </div>
                            </div>

                            <div className="mypage-match-meta-bar">
                              <span>{nextFavoriteMatch.matchDateStr}</span>
                              <span className="mypage-match-meta-dot">•</span>
                              <span>{nextFavoriteMatch.stadium}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="mypage-next-match-empty">
                            {profileFavoriteTeam ? (
                              <p>예정된 가까운 경기 일정이 없습니다.</p>
                            ) : (
                              <>
                                <p>응원 구단을 등록하시면 다음 경기 일정이 표시됩니다.</p>
                                <button
                                  type="button"
                                  className="mypage-subwidget-action-btn"
                                  onClick={() => setIsEditing(true)}
                                >
                                  응원 구단 선택하기
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2열 하단 포인트샵 위젯: 3) 내 보유 아이템 보관함  4) 포인트샵 구매 내역 */}
                    <div className="mypage-dashboard-subwidgets mypage-shop-subwidgets">
                      {/* 위젯 3: 내 보유 아이템 (USER_INVENTORY - 가로 50%씩 한 줄에 2개) */}
                      <div className="mypage-subwidget-card mypage-shop-card">
                        <div className="mypage-subwidget-header">
                          <span className="mypage-subwidget-title">
                            <IconShoppingBag size={17} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                            <span>내 보유 아이템</span>
                            <span className="mypage-shop-count-badge">{ownedShopItems.length}</span>
                          </span>
                          <button
                            type="button"
                            className="mypage-subwidget-link mypage-subwidget-link-btn"
                            onClick={handleOpenInventoryModal}
                          >
                            전체보기 →
                          </button>
                        </div>

                        {ownedShopItems.length > 0 ? (
                          <div className="mypage-shop-inventory-grid">
                            {ownedShopItems.slice(0, 4).map((item) => (
                              <div
                                key={item.id || item.name}
                                className="mypage-shop-item-chip"
                                title={`${item.name} (${item.categoryName}) - 클릭하여 전체보기`}
                                onClick={handleOpenInventoryModal}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleOpenInventoryModal()
                                  }
                                }}
                              >
                                <span className="mypage-shop-item-visual">{item.visual}</span>
                                <div className="mypage-shop-item-meta">
                                  <span className="mypage-shop-item-name">{item.name}</span>
                                  <span className={`mypage-shop-item-type is-${item.type}`}>
                                    {item.categoryName}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mypage-next-match-empty mypage-shop-empty">
                            <p>보유한 포인트샵 아이템이 없습니다.</p>
                            <a href="#/plug/point" className="mypage-subwidget-action-btn" style={{ textDecoration: 'none' }}>
                              포인트샵 구경하기
                            </a>
                          </div>
                        )}
                      </div>

                      {/* 위젯 4: 포인트샵 구매 내역 (ITEM_ORDERS - 가로 50%씩 한 줄에 2개) */}
                      <div className="mypage-subwidget-card mypage-shop-card">
                        <div className="mypage-subwidget-header">
                          <span className="mypage-subwidget-title">
                            <IconReceipt size={17} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                            <span>포인트샵 구매 내역</span>
                            <span className="mypage-shop-count-badge">{shopOrders.length}</span>
                          </span>
                          <button
                            type="button"
                            className="mypage-subwidget-link mypage-subwidget-link-btn"
                            onClick={handleOpenOrdersModal}
                          >
                            전체보기 →
                          </button>
                        </div>

                        {shopOrders.length > 0 ? (
                          <div className="mypage-shop-order-grid">
                            {shopOrders.slice(0, 4).map((ord, idx) => (
                              <div
                                key={ord.orderId || idx}
                                className="mypage-shop-order-chip"
                                title={`${ord.itemName} (-${Number(ord.point || 0).toLocaleString()} P) - 클릭하여 전체보기`}
                                onClick={handleOpenOrdersModal}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    handleOpenOrdersModal()
                                  }
                                }}
                              >
                                <span className="mypage-shop-order-icon">{ord.visual}</span>
                                <div className="mypage-shop-order-meta">
                                  <span className="mypage-shop-order-name">{ord.itemName}</span>
                                  <div className="mypage-shop-order-subrow">
                                    <span className="mypage-shop-order-pt">
                                      -{Number(ord.point || 0).toLocaleString()} P
                                    </span>
                                    <span className="mypage-shop-order-date">
                                      {String(ord.orderedAt || '').split(' ')[0] || '완료'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mypage-next-match-empty mypage-shop-empty">
                            <p>포인트샵 구매 내역이 없습니다.</p>
                            <button
                              type="button"
                              className="mypage-subwidget-action-btn"
                              onClick={handleOpenOrdersModal}
                            >
                              내역 확인하기
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                  ) : (
                    <form onSubmit={handleSave} className="mypage-dark-form">
                      <div className="mypage-form-field">
                        <label>아이디 (변경 불가)</label>
                        <input type="text" className="mypage-dark-input" value={profile.loginId} disabled />
                      </div>

                      <div className="mypage-form-field">
                        <label htmlFor="editNickname">닉네임</label>
                        <div className="mypage-input-with-btn">
                          <input
                            id="editNickname"
                            type="text"
                            className="mypage-dark-input"
                            placeholder="한글, 영문, 숫자 2~20자"
                            maxLength={20}
                            value={nickname}
                            onChange={(e) => {
                              setNickname(e.target.value)
                              setNicknameChecked(false)
                              setNicknameCheckMsg('')
                            }}
                          />
                          <button
                            type="button"
                            className="mypage-action-outline-btn"
                            onClick={handleCheckNickname}
                          >
                            중복확인
                          </button>
                        </div>
                        {nicknameCheckMsg && (
                          <span className={`mypage-form-hint ${nicknameChecked ? 'is-ok' : 'is-err'}`}>
                            {nicknameCheckMsg}
                          </span>
                        )}
                      </div>

                      <div className="mypage-form-field">
                        <label htmlFor="editEmail">이메일</label>
                        <div className="mypage-input-with-btn">
                          <input
                            id="editEmail"
                            type="email"
                            className="mypage-dark-input"
                            placeholder="example@domain.com"
                            value={email}
                            onChange={(e) => {
                              const newEmail = e.target.value
                              setEmail(newEmail)
                              if (newEmail.trim().toLowerCase() === profile?.email?.toLowerCase()) {
                                setEmailVerified(true)
                                setEmailVerifyMsg('')
                                setEmailCodeSent(false)
                              } else {
                                setEmailVerified(false)
                                setEmailVerifyMsg('')
                                setEmailCodeSent(false)
                              }
                            }}
                          />
                          {email.trim().toLowerCase() !== profile?.email?.toLowerCase() && (
                            <button
                              type="button"
                              className="mypage-action-outline-btn"
                              onClick={handleSendEmailCode}
                              disabled={sendingEmailCode || emailVerified}
                            >
                              {sendingEmailCode ? '발송 중...' : emailCodeSent ? '재발송' : '인증번호 발송'}
                            </button>
                          )}
                        </div>
                        {email && (
                          <span
                            className={`mypage-form-hint ${
                              EMAIL_REGEX.test(email.trim()) ? 'is-ok' : 'is-err'
                            }`}
                          >
                            {EMAIL_REGEX.test(email.trim())
                              ? '✓ 올바른 이메일 형식입니다.'
                              : '✕ 올바른 이메일 형식이 아닙니다.'}
                          </span>
                        )}

                        {/* 인증번호 입력 필드 */}
                        {email.trim().toLowerCase() !== profile?.email?.toLowerCase() &&
                          emailCodeSent &&
                          !emailVerified && (
                            <div className="mypage-input-with-btn" style={{ marginTop: '8px' }}>
                              <input
                                type="text"
                                className="mypage-dark-input"
                                placeholder="인증번호 6자리 입력"
                                maxLength={6}
                                value={emailAuthCode}
                                onChange={(e) => setEmailAuthCode(e.target.value)}
                              />
                              <button
                                type="button"
                                className="mypage-action-outline-btn"
                                onClick={handleVerifyEmailCode}
                                disabled={verifyingEmailCode}
                              >
                                {verifyingEmailCode ? '확인 중...' : '인증 확인'}
                              </button>
                            </div>
                          )}

                        {emailVerifyMsg && (
                          <span className={`mypage-form-hint ${emailVerified ? 'is-ok' : 'is-err'}`}>
                            {emailVerifyMsg}
                          </span>
                        )}
                      </div>

                      {/* ★ 핵심: 엠블럼이 포함된 커스텀 구단 드롭다운 셀렉트 UI ★ */}
                      <div className="mypage-form-field">
                        <label>응원 구단 선택</label>
                        <div className={`custom-team-select-wrap ${isTeamDropdownOpen ? 'is-open' : ''}`} ref={teamDropdownRef}>
                          <button
                            type="button"
                            className={`custom-team-trigger ${isTeamDropdownOpen ? 'is-open' : ''}`}
                            onClick={() => setIsTeamDropdownOpen((prev) => !prev)}
                          >
                            <div className="custom-team-selected-content">
                              {selectedFavoriteTeam ? (
                                <>
                                  <div className="custom-team-emblem-badge">
                                    <TeamEmblemImg
                                      url={selectedFavoriteTeam.emblemUrl}
                                      alt={selectedFavoriteTeam.teamNameKor}
                                    />
                                  </div>
                                  <span className="custom-team-name-primary">
                                    {selectedFavoriteTeam.teamNameKor}
                                  </span>
                                  <span className="custom-team-name-sub">
                                    ({selectedFavoriteTeam.teamName})
                                  </span>
                                </>
                              ) : (
                                <span style={{ color: '#a795b5' }}>응원하는 구단을 선택해주세요</span>
                              )}
                            </div>
                            <span className={`custom-team-chevron ${isTeamDropdownOpen ? 'is-open' : ''}`}>
                              ▼
                            </span>
                          </button>

                          {/* 팝오버 드롭다운 목록 */}
                          {isTeamDropdownOpen && (
                            <div className="custom-team-dropdown">
                              <div
                                className={`custom-team-option ${!favoriteTeamId ? 'is-selected' : ''}`}
                                onClick={() => {
                                  setFavoriteTeamId('')
                                  setIsTeamDropdownOpen(false)
                                }}
                              >
                                <div className="custom-team-option-left">
                                  <span style={{ fontSize: '18px', width: '28px', textAlign: 'center' }}>⚪</span>
                                  <span style={{ fontSize: '14px', color: '#c5b4d1' }}>선택 안 함</span>
                                </div>
                                {!favoriteTeamId && <span className="custom-team-check-mark">✓</span>}
                              </div>

                              {teamList.map((team) => {
                                const isSelected = String(team.teamId) === String(favoriteTeamId)
                                return (
                                  <div
                                    key={team.teamId}
                                    className={`custom-team-option ${isSelected ? 'is-selected' : ''}`}
                                    onClick={() => {
                                      setFavoriteTeamId(String(team.teamId))
                                      setIsTeamDropdownOpen(false)
                                    }}
                                  >
                                    <div className="custom-team-option-left">
                                      <div className="custom-team-emblem-badge">
                                        <TeamEmblemImg
                                          url={team.emblemUrl}
                                          alt={team.teamNameKor || team.teamName}
                                        />
                                      </div>
                                      <div>
                                        <span className="custom-team-name-primary" style={{ fontSize: '14px' }}>
                                          {team.teamNameKor || team.teamName}
                                        </span>
                                        <span className="custom-team-name-sub" style={{ fontSize: '12px' }}>
                                          {team.teamName}
                                        </span>
                                      </div>
                                    </div>
                                    {isSelected && <span className="custom-team-check-mark">✓</span>}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mypage-form-btn-row">
                        <button type="submit" className="mypage-primary-btn" disabled={saving}>
                          {saving ? '저장 중...' : '변경사항 저장 완료'}
                        </button>
                        <button
                          type="button"
                          className="mypage-secondary-btn"
                          onClick={() => {
                            setIsEditing(false)
                            setNickname(profile.nickname || '')
                            setEmail(profile.email || '')
                            setFavoriteTeamId(profile.favoriteTeamId ? String(profile.favoriteTeamId) : '')
                            setErrorMsg('')
                            setNicknameChecked(false)
                            setNicknameCheckMsg('')
                            setEmailVerified(false)
                            setEmailVerifyMsg('')
                            setEmailCodeSent(false)
                            setEmailAuthCode('')
                            setIsTeamDropdownOpen(false)
                          }}
                        >
                          수정 취소
                        </button>
                      </div>
                    </form>
                  )}

                  {/* 프로필 정보 관리 패널 오른쪽 맨 아래: 회원탈퇴 신청 */}
                  <div className="mypage-profile-withdraw-area">
                    <button
                      type="button"
                      className="mypage-profile-withdraw-btn"
                      onClick={handleWithdrawClick}
                    >
                      회원탈퇴 신청
                    </button>
                  </div>
                </div>
              )}

              {/* ---------------- 탭 2: 내가 쓴 글 ---------------- */}
              {activeTab === 'posts' && (
                <div className="mypage-panel-tab-pane">
                  <div className="mypage-panel-header">
                    <div>
                      <h2>
                        <IconArticle size={22} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                        내가 작성한 게시글
                      </h2>
                      <p>커뮤니티에 직접 등록한 게시글 목록입니다 (총 {postsData.totalCount}건)</p>
                    </div>
                  </div>

                  {listLoading ? (
                    <div className="mypage-empty-box">
                      <p>게시글 목록을 불러오는 중입니다...</p>
                    </div>
                  ) : postsData.list.length === 0 ? (
                    <div className="mypage-empty-box">
                      <span className="mypage-empty-icon">
                        <IconArticle size={36} color="#8b7899" />
                      </span>
                      <p>아직 작성하신 게시글이 없습니다.</p>
                      <a href="#/plug/community/posts/write" className="mypage-empty-action">
                        첫 게시글 작성하러 가기
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="mypage-card-list">
                        {postsData.list.map((post) => (
                          <div
                            key={post.postId}
                            className="mypage-card-item"
                            onClick={() => navigate(`/plug/community/posts/${post.postId}`)}
                          >
                            <div className="mypage-card-main">
                              <div className="mypage-card-meta">
                                <span className="mypage-tag-category">{post.categoryType || '자유'}</span>
                                {post.teamName && <span className="mypage-tag-team">{post.teamName}</span>}
                                {post.isBlind === 'Y' && <span className="mypage-tag-blind">블라인드</span>}
                                <span className="mypage-card-date">{post.createdAt}</span>
                              </div>
                              <h4 className="mypage-card-title">
                                {post.title}
                                {post.commentCount > 0 && (
                                  <span className="mypage-card-cmt-num">[{post.commentCount}]</span>
                                )}
                              </h4>
                            </div>
                            <div className="mypage-card-stats">
                              <span>조회 {post.viewCount || 0}</span>
                              <span className="mypage-stat-like-num" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <IconHeart size={13} color="#ff3377" filled />
                                {post.likeCount || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {renderPagination('posts', postsData)}
                    </>
                  )}
                </div>
              )}

              {/* ---------------- 탭 3: 내가 쓴 댓글 ---------------- */}
              {activeTab === 'comments' && (
                <div className="mypage-panel-tab-pane">
                  <div className="mypage-panel-header">
                    <div>
                      <h2>
                        <IconComment size={22} color="#d886ed" />
                        내가 작성한 댓글
                      </h2>
                      <p>회원님께서 다른 글에 남기신 의견 목록입니다 (총 {commentsData.totalCount}건)</p>
                    </div>
                  </div>

                  {listLoading ? (
                    <div className="mypage-empty-box">
                      <p>댓글 목록을 불러오는 중입니다...</p>
                    </div>
                  ) : commentsData.list.length === 0 ? (
                    <div className="mypage-empty-box">
                      <span className="mypage-empty-icon">
                        <IconComment size={36} color="#8b7899" />
                      </span>
                      <p>아직 남기신 댓글이 없습니다.</p>
                      <a href="#/plug/community/teams" className="mypage-empty-action">
                        커뮤니티 둘러보기
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="mypage-card-list">
                        {commentsData.list.map((comment) => (
                          <div
                            key={comment.commentId}
                            className="mypage-card-item"
                            onClick={() => navigate(`/plug/community/posts/${comment.postId}`)}
                          >
                            <div className="mypage-card-main">
                              <div className="mypage-card-meta">
                                <span className="mypage-tag-category">{comment.categoryType || '자유'}</span>
                                {comment.teamName && <span className="mypage-tag-team">{comment.teamName}</span>}
                                <span className="mypage-card-meta-extra">원문: {comment.postTitle || '게시글'}</span>
                                {comment.isBlind === 'Y' && <span className="mypage-tag-blind">블라인드</span>}
                                <span className="mypage-card-date">{comment.createdAt}</span>
                              </div>
                              <h4 className="mypage-card-title">{comment.content}</h4>
                            </div>
                            <div className="mypage-card-stats">
                              <span>조회 {comment.viewCount || 0}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {renderPagination('comments', commentsData)}
                    </>
                  )}
                </div>
              )}

              {/* ---------------- 탭 4: 좋아하는 글 ---------------- */}
              {activeTab === 'likes' && (
                <div className="mypage-panel-tab-pane">
                  <div className="mypage-panel-header">
                    <div>
                      <h2>
                        <IconHeart size={22} color="#ff166b" filled />
                        좋아하는 글
                      </h2>
                      <p>회원님께서 공감을 누르신 추천 게시글 목록입니다 (총 {likesData.totalCount}건)</p>
                    </div>
                  </div>

                  {listLoading ? (
                    <div className="mypage-empty-box">
                      <p>좋아요 목록을 불러오는 중입니다...</p>
                    </div>
                  ) : likesData.list.length === 0 ? (
                    <div className="mypage-empty-box">
                      <span className="mypage-empty-icon">
                        <IconHeart size={36} color="#8b7899" />
                      </span>
                      <p>아직 좋아요를 누른 게시글이 없습니다.</p>
                      <a href="#/plug/community/teams" className="mypage-empty-action">
                        인기 게시글 보러가기
                      </a>
                    </div>
                  ) : (
                    <>
                      <div className="mypage-card-list">
                        {likesData.list.map((post) => (
                          <div
                            key={post.postId}
                            className="mypage-card-item"
                            onClick={() => navigate(`/plug/community/posts/${post.postId}`)}
                          >
                            <div className="mypage-card-main">
                              <div className="mypage-card-meta">
                                <span className="mypage-tag-category">{post.categoryType || '자유'}</span>
                                {post.teamName && <span className="mypage-tag-team">{post.teamName}</span>}
                                <span className="mypage-card-meta-extra">작성자: {post.nickname}</span>
                                <span className="mypage-card-date">{post.createdAt}</span>
                              </div>
                              <h4 className="mypage-card-title">
                                {post.title}
                                {post.commentCount > 0 && (
                                  <span className="mypage-card-cmt-num">[{post.commentCount}]</span>
                                )}
                              </h4>
                            </div>
                            <div className="mypage-card-stats">
                              <span>조회 {post.viewCount || 0}</span>
                              <span className="mypage-stat-like-num" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <IconHeart size={13} color="#ff3377" filled />
                                {post.likeCount || 0}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {renderPagination('likes', likesData)}
                    </>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      {/* 포털 모달 렌더링: document.body 직속에 마운트하여 스크롤 시 푸터/네비바에 절대 가려지지 않도록 보장 */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className={`mypage-portal-root ${currentTheme === 'light' ? 'mypage-light-mode' : ''}`}>
            {/* 회원 탈퇴 경고 모달 */}
            {showWithdrawModal && (
              <div
                className="withdraw-modal-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget && !withdrawing) setShowWithdrawModal(false)
                }}
              >
                <div className="withdraw-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="withdraw-modal-header">
                    <IconAlertTriangle size={24} color="#ff3377" />
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

            {/* 포인트 변동 이력 모달 (최근 5건) */}
            {showPointModal && (
              <div
                className="point-modal-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowPointModal(false)
                }}
              >
                <div className="point-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="point-modal-header">
                    <div className="point-modal-header-left">
                      <IconCoins size={22} color="#00ff87" />
                      <h3 className="point-modal-title">최근 포인트 변동 이력</h3>
                    </div>
                    <button
                      type="button"
                      className="point-modal-close-btn"
                      onClick={() => setShowPointModal(false)}
                      title="닫기"
                    >
                      <IconX size={20} />
                    </button>
                  </div>

                  <div className="point-modal-summary">
                    <span className="point-modal-summary-lbl">현재 보유 포인트</span>
                    <span className="point-modal-summary-val">{profile?.point?.toLocaleString() || 100} P</span>
                  </div>

                  <div className="point-modal-list-title">
                    <span>변동 내역 (최근 5건)</span>
                    <span>변동 금액 / 잔여</span>
                  </div>

                  <div className="point-modal-list">
                    {pointHistoriesLoading ? (
                      <div className="point-modal-empty">
                        <p>포인트 내역을 불러오는 중입니다...</p>
                      </div>
                    ) : pointHistories.length === 0 ? (
                      <div className="point-modal-empty">
                        <p>최근 포인트 변동 이력이 없습니다.</p>
                        <span style={{ fontSize: '12px', color: '#8e7a9c', marginTop: '4px', display: 'inline-block' }}>
                          회원가입 기본 지급 포인트: 100 P
                        </span>
                      </div>
                    ) : (
                      pointHistories.slice(0, 5).map((history, idx) => {
                        const amount = Number(history.amount) || 0
                        const isPlus = amount >= 0
                        return (
                          <div key={history.pointHistoryId || idx} className="point-modal-item">
                            <div className="point-modal-item-left">
                              <span className="point-modal-item-desc">
                                {history.description || (isPlus ? '포인트 적립' : '포인트 사용')}
                              </span>
                              <span className="point-modal-item-date">{history.createdAt}</span>
                            </div>
                            <div className="point-modal-item-right">
                              <span className={`point-modal-item-amount ${isPlus ? 'is-plus' : 'is-minus'}`}>
                                {isPlus ? `+${amount.toLocaleString()}` : amount.toLocaleString()} P
                              </span>
                              <span className="point-modal-item-bal">
                                잔여 {history.balanceAfter != null ? history.balanceAfter.toLocaleString() : profile?.point?.toLocaleString()} P
                              </span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 내 보유 아이템 전체보기 모달 (2x2 카드형 스와이프 슬라이더 지원, 하단 닫기 버튼 제거 및 바깥 클릭 닫기) */}
            {showInventoryModal && (
              <div
                className="point-modal-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowInventoryModal(false)
                }}
              >
                <div className="point-modal-content mypage-shop-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="point-modal-header">
                    <div className="point-modal-header-left">
                      <IconShoppingBag size={20} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                      <h3 className="point-modal-title">내 보유 아이템 전체보기</h3>
                    </div>
                    <button
                      type="button"
                      className="point-modal-close-btn"
                      onClick={() => setShowInventoryModal(false)}
                      title="닫기"
                    >
                      <IconX size={20} />
                    </button>
                  </div>

                  {/* 상단 카테고리 필터 탭 & 포인트샵 이동 링크 */}
                  <div className="mypage-shop-modal-toolbar">
                    <div className="mypage-shop-modal-tabs">
                      <button
                        type="button"
                        className={`mypage-shop-modal-tab ${invModalTab === 'ALL' ? 'is-active' : ''}`}
                        onClick={() => {
                          setInvModalTab('ALL')
                          setInvModalPage(0)
                          if (invSliderRef.current) invSliderRef.current.scrollLeft = 0
                        }}
                      >
                        전체 <span>{ownedShopItems.length}</span>
                      </button>
                      <button
                        type="button"
                        className={`mypage-shop-modal-tab ${invModalTab === 'icon' ? 'is-active' : ''}`}
                        onClick={() => {
                          setInvModalTab('icon')
                          setInvModalPage(0)
                          if (invSliderRef.current) invSliderRef.current.scrollLeft = 0
                        }}
                      >
                        아이콘 <span>{ownedShopItems.filter((i) => i.type === 'icon').length}</span>
                      </button>
                      <button
                        type="button"
                        className={`mypage-shop-modal-tab ${invModalTab === 'emoticon' ? 'is-active' : ''}`}
                        onClick={() => {
                          setInvModalTab('emoticon')
                          setInvModalPage(0)
                          if (invSliderRef.current) invSliderRef.current.scrollLeft = 0
                        }}
                      >
                        이모티콘 <span>{ownedShopItems.filter((i) => i.type === 'emoticon').length}</span>
                      </button>
                    </div>
                    <a href="#/plug/point" className="mypage-shop-goto-link">
                      포인트샵 가기 →
                    </a>
                  </div>

                  {filteredModalInventory.length === 0 ? (
                    <div className="point-modal-empty" style={{ padding: '28px 16px' }}>
                      <div style={{ fontSize: '34px', marginBottom: '8px' }}>🎁</div>
                      <p>보유 중인 아이템이 없습니다.</p>
                      <a
                        href="#/plug/point"
                        className="mypage-subwidget-action-btn"
                        style={{ display: 'inline-block', marginTop: '10px', textDecoration: 'none' }}
                      >
                        포인트샵에서 아이템 구매하기
                      </a>
                    </div>
                  ) : (
                    <div className="mypage-shop-swipe-container">
                      {invModalPages.length > 1 && (
                        <div className="mypage-shop-swipe-nav" aria-label="보유 아이템 슬라이드 넘기기">
                          <button
                            type="button"
                            className="mypage-shop-swipe-arrow"
                            disabled={invModalPage === 0}
                            onClick={() => scrollModalSlider(invSliderRef, setInvModalPage, Math.max(0, invModalPage - 1))}
                            aria-label="이전 페이지"
                          >
                            ‹
                          </button>
                          <span className="mypage-shop-swipe-indicator">
                            {invModalPage + 1} / {invModalPages.length}
                          </span>
                          <button
                            type="button"
                            className="mypage-shop-swipe-arrow"
                            disabled={invModalPage >= invModalPages.length - 1}
                            onClick={() => scrollModalSlider(invSliderRef, setInvModalPage, Math.min(invModalPages.length - 1, invModalPage + 1))}
                            aria-label="다음 페이지"
                          >
                            ›
                          </button>
                        </div>
                      )}

                      <div
                        ref={invSliderRef}
                        className="mypage-shop-swipe-track"
                        onScroll={(e) => handleModalSliderScroll(e, invModalPage, setInvModalPage, invModalPages.length)}
                      >
                        {invModalPages.map((pageItems, pIdx) => (
                          <div key={pIdx} className="mypage-shop-swipe-slide">
                            {pageItems.map((item) => (
                              <article key={item.id || item.name} className="mypage-shop-modal-card">
                                <div className="mypage-shop-modal-card-top">
                                  <span className={`mypage-shop-item-type is-${item.type}`}>
                                    {item.categoryName}
                                  </span>
                                  <span className="mypage-shop-owned-pill">✓ 보유중</span>
                                </div>
                                <div className="mypage-shop-modal-visual-box">
                                  <span className="mypage-shop-modal-emoji">{item.visual}</span>
                                </div>
                                <h4 className="mypage-shop-modal-item-title">{item.name}</h4>
                                {item.desc && <p className="mypage-shop-modal-item-desc">{item.desc}</p>}
                                <div className="mypage-shop-modal-item-footer">
                                  <span className="mypage-shop-modal-price">{Number(item.price || 0).toLocaleString()} P</span>
                                  {item.purchasedAt && (
                                    <span className="mypage-shop-modal-date">{String(item.purchasedAt).split(' ')[0]}</span>
                                  )}
                                </div>
                              </article>
                            ))}
                          </div>
                        ))}
                      </div>

                      {invModalPages.length > 1 && (
                        <div className="mypage-shop-swipe-footer">
                          <div className="mypage-shop-swipe-dots">
                            {invModalPages.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className={`mypage-shop-swipe-dot ${invModalPage === idx ? 'is-active' : ''}`}
                                onClick={() => scrollModalSlider(invSliderRef, setInvModalPage, idx)}
                                aria-label={`${idx + 1}페이지로 이동`}
                              />
                            ))}
                          </div>
                          <span className="mypage-shop-swipe-hint">스와이프하여 넘겨보기 ↔</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 포인트샵 구매 내역 전체보기 모달 (2x2 카드형 스와이프 슬라이더 지원, 하단 닫기 버튼 제거 및 바깥 클릭 닫기) */}
            {showOrdersModal && (
              <div
                className="point-modal-overlay"
                onClick={(e) => {
                  if (e.target === e.currentTarget) setShowOrdersModal(false)
                }}
              >
                <div className="point-modal-content mypage-shop-modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="point-modal-header">
                    <div className="point-modal-header-left">
                      <IconReceipt size={20} color={currentTheme === 'light' ? '#38003c' : '#00ff87'} />
                      <h3 className="point-modal-title">포인트샵 구매 내역 전체보기</h3>
                    </div>
                    <button
                      type="button"
                      className="point-modal-close-btn"
                      onClick={() => setShowOrdersModal(false)}
                      title="닫기"
                    >
                      <IconX size={20} />
                    </button>
                  </div>

                  <div className="point-modal-summary mypage-shop-modal-summary">
                    <span className="point-modal-summary-lbl">총 구매 건수 ({shopOrders.length}건)</span>
                    <span className="point-modal-summary-val">
                      총 {shopOrders.reduce((acc, cur) => acc + (Number(cur.point) || 0), 0).toLocaleString()} P 사용
                    </span>
                  </div>

                  {shopOrders.length === 0 ? (
                    <div className="point-modal-empty" style={{ padding: '28px 16px' }}>
                      <div style={{ fontSize: '34px', marginBottom: '8px' }}>🧾</div>
                      <p>포인트샵 구매 내역이 없습니다.</p>
                      <a
                        href="#/plug/point"
                        className="mypage-subwidget-action-btn"
                        style={{ display: 'inline-block', marginTop: '10px', textDecoration: 'none' }}
                      >
                        포인트샵 구경하기
                      </a>
                    </div>
                  ) : (
                    <div className="mypage-shop-swipe-container">
                      {ordModalPages.length > 1 && (
                        <div className="mypage-shop-swipe-nav" aria-label="구매 내역 슬라이드 넘기기">
                          <button
                            type="button"
                            className="mypage-shop-swipe-arrow"
                            disabled={ordModalPage === 0}
                            onClick={() => scrollModalSlider(ordSliderRef, setOrdModalPage, Math.max(0, ordModalPage - 1))}
                            aria-label="이전 페이지"
                          >
                            ‹
                          </button>
                          <span className="mypage-shop-swipe-indicator">
                            {ordModalPage + 1} / {ordModalPages.length}
                          </span>
                          <button
                            type="button"
                            className="mypage-shop-swipe-arrow"
                            disabled={ordModalPage >= ordModalPages.length - 1}
                            onClick={() => scrollModalSlider(ordSliderRef, setOrdModalPage, Math.min(ordModalPages.length - 1, ordModalPage + 1))}
                            aria-label="다음 페이지"
                          >
                            ›
                          </button>
                        </div>
                      )}

                      <div
                        ref={ordSliderRef}
                        className="mypage-shop-swipe-track"
                        onScroll={(e) => handleModalSliderScroll(e, ordModalPage, setOrdModalPage, ordModalPages.length)}
                      >
                        {ordModalPages.map((pageOrders, pIdx) => (
                          <div key={pIdx} className="mypage-shop-swipe-slide">
                            {pageOrders.map((ord, idx) => (
                              <article key={ord.orderId || idx} className="mypage-shop-modal-card is-order-card">
                                <div className="mypage-shop-modal-card-top">
                                  <span className={`mypage-shop-item-type is-${ord.type}`}>
                                    {ord.categoryName}
                                  </span>
                                  <span className={`mypage-shop-order-status ${ord.orderStatus === 'REFUNDED' ? 'is-refunded' : 'is-completed'}`}>
                                    {ord.orderStatus === 'REFUNDED' ? '환불됨' : '구매완료'}
                                  </span>
                                </div>
                                <div className="mypage-shop-modal-visual-box">
                                  <span className="mypage-shop-modal-emoji">{ord.visual}</span>
                                </div>
                                <h4 className="mypage-shop-modal-item-title">{ord.itemName}</h4>
                                <div className="mypage-shop-modal-item-footer">
                                  <span className="mypage-shop-order-pt">
                                    -{Number(ord.point || 0).toLocaleString()} P
                                  </span>
                                  <span className="mypage-shop-modal-date">{ord.orderedAt}</span>
                                </div>
                              </article>
                            ))}
                          </div>
                        ))}
                      </div>

                      {ordModalPages.length > 1 && (
                        <div className="mypage-shop-swipe-footer">
                          <div className="mypage-shop-swipe-dots">
                            {ordModalPages.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                className={`mypage-shop-swipe-dot ${ordModalPage === idx ? 'is-active' : ''}`}
                                onClick={() => scrollModalSlider(ordSliderRef, setOrdModalPage, idx)}
                                aria-label={`${idx + 1}페이지로 이동`}
                              />
                            ))}
                          </div>
                          <span className="mypage-shop-swipe-hint">스와이프하여 넘겨보기 ↔</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}

      {/* 회원 비밀번호 변경 모달 */}
      {showPasswordModal && typeof document !== 'undefined' && createPortal(
        <div
          className="point-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pwSubmitting) setShowPasswordModal(false)
          }}
          style={{ zIndex: 99999 }}
        >
          <div className="point-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', padding: '28px' }}>
            <div className="point-modal-header" style={{ marginBottom: '20px' }}>
              <div className="point-modal-header-left">
                <h3 className="point-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 'bold' }}>
                  🔒 비밀번호 변경
                </h3>
              </div>
              <button
                type="button"
                className="point-modal-close-btn"
                onClick={() => !pwSubmitting && setShowPasswordModal(false)}
                title="닫기"
              >
                <IconX size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#8e7a9c', marginBottom: '20px', lineHeight: '1.5' }}>
              현재 사용 중인 비밀번호를 확인한 후, 새 비밀번호(8~20자)로 안전하게 변경합니다.
            </p>

            <form onSubmit={handlePasswordChangeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>현재 비밀번호</label>
                <input
                  type="password"
                  value={pwCurrent}
                  onChange={(e) => { setPwCurrent(e.target.value); setPwMsg(''); }}
                  placeholder="현재 비밀번호를 입력하세요"
                  required
                  className="mypage-form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>새 비밀번호</label>
                <input
                  type="password"
                  value={pwNew}
                  onChange={(e) => { setPwNew(e.target.value); setPwMsg(''); }}
                  placeholder="새 비밀번호 (8~20자)"
                  required
                  className="mypage-form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>새 비밀번호 확인</label>
                <input
                  type="password"
                  value={pwConfirm}
                  onChange={(e) => { setPwConfirm(e.target.value); setPwMsg(''); }}
                  placeholder="새 비밀번호를 한 번 더 입력하세요"
                  required
                  className="mypage-form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {pwMsg && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  backgroundColor: pwSuccess ? 'rgba(0, 255, 135, 0.1)' : 'rgba(255, 77, 79, 0.1)',
                  color: pwSuccess ? '#00ff87' : '#ff4d4f',
                  border: pwSuccess ? '1px solid rgba(0, 255, 135, 0.3)' : '1px solid rgba(255, 77, 79, 0.3)',
                }}>
                  {pwMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="mypage-action-outline-btn"
                  style={{ flex: 1, padding: '12px' }}
                  disabled={pwSubmitting}
                  onClick={() => setShowPasswordModal(false)}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="mypage-action-primary-btn"
                  style={{ flex: 1, padding: '12px' }}
                  disabled={pwSubmitting}
                >
                  {pwSubmitting ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
