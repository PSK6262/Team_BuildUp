import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// JWT 토큰 유효기간 만료 여부 판별 (만료되었거나 손상된 경우 true 반환)
export function isTokenExpired(token) {
  if (!token) return true
  try {
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
  } catch (e) {
    return true
  }
}

// 새로고침 시에도 로그인이 풀리지 않도록 localStorage에서 초기 상태 복원
// 단, 토큰이 만료되었거나 누락된 경우 오래된 세션 정보를 자동 정리하여 불필요한 인증 오류 방지
const savedUser = (() => {
  try {
    const token = localStorage.getItem('buildup_token')
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem('buildup_token')
      localStorage.removeItem('buildup_user')
      return null
    }
    const item = localStorage.getItem('buildup_user')
    return item ? JSON.parse(item) : null
  } catch (e) {
    return null
  }
})()

// 슬라이딩 세션 자동 토큰 갱신 비동기 Thunk (/api/auth/refresh)
export const silentRefresh = createAsyncThunk(
  'auth/silentRefresh',
  async (_, { dispatch, rejectWithValue }) => {
    const token = localStorage.getItem('buildup_token')
    if (!token) return null

    // 이미 만료되었으면 즉시 로그아웃
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
      const json = await res.json()
      if (res.ok && (json.code === 'SUC_001' || json.status === 'SUCCESS') && json.data?.token) {
        localStorage.setItem('buildup_token', json.data.token)
        if (json.data.user) {
          dispatch(loginSuccess(json.data.user))
        }
        return json.data
      } else if (res.status === 401 || res.status === 403) {
        dispatch(logout())
        return rejectWithValue('세션 만료')
      }
    } catch (e) {
      // 오프라인이거나 일시적 네트워크 에러 시에는 토큰 유효기간 내에서 상태 보존
      return null
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
    },
    logout(state) {
      state.isLoggedIn = false
      state.user = null
      localStorage.removeItem('buildup_user')
      localStorage.removeItem('buildup_token')
    },
    updateUser(state, action) {
      state.user = { ...state.user, ...action.payload }
      localStorage.setItem('buildup_user', JSON.stringify(state.user))
    },
  },
})

export const { loginSuccess, logout, updateUser } = authSlice.actions
export default authSlice.reducer

