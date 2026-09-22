import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { getTeams, getInitialTeams } from '../api/teamApi.js'

// 1. 구단 목록 조회 비동기 Thunk (/api/teams - API 및 Fallback 스냅샷 연동)
export const fetchTeams = createAsyncThunk(
  'team/fetchTeams',
  async (_, { getState, rejectWithValue }) => {
    const { team } = getState()
    // 이미 로드된 구단 목록이 있으면 불필요한 네트워크 재호출 방지
    if (team.teamsLoaded && team.teams.length > 0) {
      return team.teams
    }

    try {
      const data = await getTeams()
      return Array.isArray(data) ? data : []
    } catch (err) {
      return rejectWithValue(err.message || '구단 목록 로드 중 오류가 발생했습니다.')
    }
  }
)

// 2. 커뮤니티 카테고리 목록 조회 비동기 Thunk (/api/communities/categories)
export const fetchCategories = createAsyncThunk(
  'team/fetchCategories',
  async (_, { getState, rejectWithValue }) => {
    const { team } = getState()
    // 이미 로드된 카테고리 목록이 있으면 재호출 방지
    if (team.categoriesLoaded && team.categories.length > 0) {
      return team.categories
    }

    try {
      const res = await fetch('/api/communities/categories')
      if (!res.ok) {
        throw new Error('카테고리를 불러오지 못했습니다.')
      }
      const json = await res.json()
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
      return list
    } catch (err) {
      return rejectWithValue(err.message || '카테고리 로드 중 오류가 발생했습니다.')
    }
  }
)

const teamSlice = createSlice({
  name: 'team',
  initialState: {
    teams: getInitialTeams(),
    teamsLoading: false,
    teamsLoaded: false,
    teamsError: null,

    categories: [],
    categoriesLoading: false,
    categoriesLoaded: false,
    categoriesError: null,
  },
  reducers: {
    // 필요한 경우 강제 캐시 초기화 액션
    resetTeamState(state) {
      state.teams = getInitialTeams()
      state.teamsLoaded = false
      state.categories = []
      state.categoriesLoaded = false
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchTeams
      .addCase(fetchTeams.pending, (state) => {
        state.teamsLoading = true
        state.teamsError = null
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.teamsLoading = false
        state.teams = action.payload
        state.teamsLoaded = true
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.teamsLoading = false
        state.teamsLoaded = true
        state.teamsError = action.payload || '구단 목록 로드 실패'
      })

      // fetchCategories
      .addCase(fetchCategories.pending, (state) => {
        state.categoriesLoading = true
        state.categoriesError = null
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false
        state.categories = action.payload
        state.categoriesLoaded = true
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.categoriesLoading = false
        state.categoriesLoaded = true
        state.categoriesError = action.payload || '카테고리 로드 실패'
      })
  },
})

export const { resetTeamState } = teamSlice.actions
export default teamSlice.reducer
