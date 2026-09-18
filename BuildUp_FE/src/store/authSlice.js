import { createSlice } from '@reduxjs/toolkit'

// 새로고침 시에도 로그인이 풀리지 않도록 localStorage에서 초기 상태 복원
const savedUser = (() => {
  try {
    const item = localStorage.getItem('buildup_user')
    return item ? JSON.parse(item) : null
  } catch (e) {
    return null
  }
})()

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

