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
// GitHub Pages 등 SPA 환경을 위한 글로벌 HashRouter 브릿지
// base: /Team_BuildUp/
// -------------------------------------------------------------
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

function normalizeHashRoute(target) {
  let s = String(target || '').trim();
  if (s.startsWith(window.location.origin)) {
    s = s.slice(window.location.origin.length);
  }
  if (BASE && s.startsWith(BASE)) {
    s = s.slice(BASE.length);
  }
  if (!s.startsWith('/')) {
    s = '/' + s;
  }
  return `#${s}`;
}

// 최초 진입 시 pathname 정규화:
// 만약 브라우저가 /Team_BuildUp/plug/mainpage 같은 직접 경로로 들어왔다면
// /Team_BuildUp/#/plug/mainpage 로 즉시 리다이렉트 (브라우저 주소창 중복 방지)
(function sanitizeInitialUrl() {
  const currentPath = window.location.pathname.replace(/\/$/, '');
  const baseNorm = BASE;
  if (currentPath && baseNorm && currentPath.startsWith(baseNorm) && currentPath !== baseNorm) {
    const route = currentPath.slice(baseNorm.length);
    if (route.startsWith('/plug')) {
      const search = window.location.search || '';
      const newUrl = `${window.location.origin}${baseNorm}/#${route}${search}`;
      window.history.replaceState(null, '', newUrl);
      return;
    }
  }
  // 해시가 아예 비어있다면 기본 메인페이지 해시 부여
  if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
    window.location.hash = '#/plug/mainpage';
  }
})();

// 1. window.location.assign / replace 인터셉트:
// '/plug/...' 또는 '/Team_BuildUp/plug/...' 이동 시 '#/plug/...'로 변환
const origAssign = window.location.assign.bind(window.location);
const origReplace = window.location.replace.bind(window.location);
try {
  window.location.assign = (url) => {
    const s = String(url);
    if (s.includes('/plug')) {
      window.location.hash = normalizeHashRoute(s);
      return;
    }
    origAssign(s);
  };
  window.location.replace = (url) => {
    const s = String(url);
    if (s.includes('/plug')) {
      window.location.hash = normalizeHashRoute(s);
      return;
    }
    origReplace(s);
  };
} catch {
  // 브라우저에 따라 window.location 메서드가 read-only일 수 있음
}

// 2. 문서 전체 a태그 클릭 가로채기: href에 /plug가 포함된 링크 클릭 시 hash 변경으로 위임
document.addEventListener('click', (event) => {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return;
  }
  const anchor = event.target.closest?.('a[href]');
  if (!anchor) return;
  const rawHref = anchor.getAttribute('href');
  if (rawHref && (rawHref.startsWith('/plug') || (BASE && rawHref.startsWith(`${BASE}/plug`)))) {
    event.preventDefault();
    const hashTarget = normalizeHashRoute(rawHref);
    if (anchor.target === '_blank') {
      const baseEntry = `${window.location.origin}${BASE}/`;
      window.open(`${baseEntry}${hashTarget}`, '_blank', 'noopener,noreferrer');
    } else {
      window.location.hash = hashTarget;
    }
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
