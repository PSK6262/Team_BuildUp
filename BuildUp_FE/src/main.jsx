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
// 배포 환경(GitHub Pages 등)에서의 백엔드 API Base URL 자동 매핑
// -------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? 'https://psk6262buildup.duckdns.org' : '');

if (API_BASE_URL) {
  const originalFetch = window.fetch;
  window.fetch = function (input, init) {
    if (typeof input === 'string' && input.startsWith('/api')) {
      input = `${API_BASE_URL}${input}`;
    } else if (input instanceof URL && input.pathname.startsWith('/api')) {
      input = new URL(`${API_BASE_URL}${input.pathname}${input.search}`);
    } else if (input instanceof Request && input.url.startsWith('/api')) {
      input = new Request(`${API_BASE_URL}${input.url}`, input);
    }
    return originalFetch.call(this, input, init);
  };
}

// -------------------------------------------------------------
// GitHub Pages SPA 환경을 위한 초기 URL 정규화
// base: /Team_BuildUp/
// -------------------------------------------------------------
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

(function sanitizeInitialUrl() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  
  if (currentPath) {
    const prefix = BASE && currentPath.startsWith(BASE) ? BASE : '';
    const route = currentPath.slice(prefix.length);
    if (route.startsWith('/plug')) {
      const search = window.location.search || '';
      const newUrl = `${window.location.origin}${prefix}/#${route}${search}`;
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
