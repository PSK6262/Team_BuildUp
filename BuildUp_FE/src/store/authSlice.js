import { createSlice } from '@reduxjs/toolkit'

// 로그인 API 성공 후 dispatch(loginSuccess())로 메뉴를 전환합니다.
// 새로고침 시에는 추후 서버 인증 확인 결과로 상태를 복원해야 합니다.
const authSlice = createSlice({
  name: 'auth',
  initialState: { isLoggedIn: false },
  reducers: {
    loginSuccess(state) { state.isLoggedIn = true },
    logout(state) { state.isLoggedIn = false },
  },
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer
