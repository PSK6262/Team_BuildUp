import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { Provider } from 'react-redux';
import store from './store/store.js';

if (import.meta.env.DEV) {
  window.__store = store;
}

// -------------------------------------------------------------
// GitHub Pages SPA 환경을 위한 초기 URL 정규화
// base: /Team_BuildUp/
// -------------------------------------------------------------
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

(function sanitizeInitialUrl() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  
  // 사용자가 /Team_BuildUp/plug/... 같은 경로로 직접 진입한 경우
  // /Team_BuildUp/#/plug/... 로 깔끔하게 정규화
  if (currentPath && BASE && currentPath.startsWith(BASE) && currentPath !== BASE) {
    const route = currentPath.slice(BASE.length);
    if (route.startsWith('/plug')) {
      const search = window.location.search || '';
      const newUrl = `${window.location.origin}${BASE}/#${route}${search}`;
      window.history.replaceState(null, '', newUrl);
      return;
    }
  }

  // 초기 진입 시 해시가 없으면 기본 메인페이지 해시 부여
  if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
    window.location.hash = '#/plug/mainpage';
  }
})();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
