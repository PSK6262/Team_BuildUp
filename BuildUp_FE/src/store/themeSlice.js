import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  const saved = localStorage.getItem('buildup_theme');
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return 'dark'; // 기본값은 다크모드
};

const initialMode = getInitialTheme();
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initialMode);
}

export const themeSlice = createSlice({
  name: 'theme',
  initialState: {
    mode: initialMode,
  },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'dark' ? 'light' : 'dark';
      localStorage.setItem('buildup_theme', state.mode);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', state.mode);
      }
    },
    setTheme: (state, action) => {
      const mode = action.payload;
      if (mode === 'dark' || mode === 'light') {
        state.mode = mode;
        localStorage.setItem('buildup_theme', mode);
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', mode);
        }
      }
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
