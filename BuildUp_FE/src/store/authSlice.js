import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// 30분(1,800,000ms) 동안 활동이 없으면 자동 로그아웃
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

// 사용자 활동 시각 기록
export function recordUserActivity() {
  localStorage.setItem('buildup_last_activity', String(Date.now()))
}

// JWT 토큰 유효기간 만료 또는 30분 미활동 여부 판별 (만료되었거나 손상된 경우 true 반환)
export function isTokenExpired(token) {
  if (!token) return true
  try {
    // 1. 마지막 활동 시각 기준 30분 경과 여부 확인 (다른 탭/창 방치 감지)
    const lastActivity = Number(localStorage.getItem('buildup_last_activity') || 0)
    if (lastActivity > 0 && Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
      return true
    }

    // 2. JWT 자체 만료 시각(exp) 확인
    const parts = token.split('.')
    if (parts.length < 2) return true
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    const payload = JSON.parse(jsonPayload)
    if (!payload.exp) return false
    // Date.now()는 ms, payload.exp는 초 단위
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

// 새로고침 시에도 로그인이 풀리지 않도록 localStorage에서 초기 상태 복원
// 단, 토큰이 만료되었거나 30분 이상 미활동인 경우 오래된 세션 정보를 자동 정리
const savedUser = (() => {
  try {
    const token = localStorage.getItem('buildup_token')
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('buildup_token')
      localStorage.removeItem('buildup_user')
      localStorage.removeItem('buildup_last_activity')
      return null
    }
    const item = localStorage.getItem('buildup_user')
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
})()

// 슬라이딩 세션 자동 토큰 갱신 및 서버 재기동 검증 비동기 Thunk (/api/auth/refresh)
export const silentRefresh = createAsyncThunk(
  'auth/silentRefresh',
  async (_, { dispatch, rejectWithValue }) => {
    const token = localStorage.getItem('buildup_token')
    if (!token) {
      dispatch(logout())
      return null
    }

    // 이미 만료되었거나 30분 이상 다른 곳에 있어 미활동 상태면 즉시 로그아웃
    if (isTokenExpired(token)) {
      dispatch(logout())
      return rejectWithValue('세션 만료')
    }

    try {
      const res = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json && (json.code === 'SUC_001' || json.status === 'SUCCESS') && json.data?.token) {
        localStorage.setItem('buildup_token', json.data.token)
        if (!localStorage.getItem('buildup_last_activity')) {
          recordUserActivity()
        }
        if (json.data.user) {
          dispatch(loginSuccess(json.data.user))
        }
        return json.data
      } else {
        // 서버가 재시작되어 bootId가 달라졌거나(REJ_003), 토큰이 무효화된 경우 즉시 로그아웃
        dispatch(logout())
        return rejectWithValue('세션 만료')
      }
    } catch {
      // 서버가 종료되었거나 응답 불가 상태인 경우에도 보안상 로그아웃 처리
      dispatch(logout())
      return rejectWithValue('서버 연결 만료')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isLoggedIn: !!savedUser,
    user: savedUser,
  },
  reducers: {
    loginSuccess(state, action) {
      state.isLoggedIn = true
      state.user = action.payload || null
      if (action.payload) {
        localStorage.setItem('buildup_user', JSON.stringify(action.payload))
      }
      if (!localStorage.getItem('buildup_last_activity')) {
        recordUserActivity()
      }
    },
    logout(state) {
      state.isLoggedIn = false
      state.user = null
      localStorage.removeItem('buildup_user')
      localStorage.removeItem('buildup_token')
      localStorage.removeItem('buildup_last_activity')
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('buildup_user', JSON.stringify(state.user))
    },
  },
})

export const { loginSuccess, logout, updateUser } = authSlice.actions
export default authSlice.reducer

