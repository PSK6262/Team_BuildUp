/**
 * 앱 라우팅 및 네비게이션 유틸리티
 * GitHub Pages 및 로컬 SPA 환경에서 해시(#) 기반 라우팅을 지원합니다.
 */

export const BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')

/**
 * 앱 내부 경로를 해시 URL로 변환합니다.
 * @param {string} path - 예: '/plug/mainpage' 또는 'plug/login'
 * @returns {string} 예: '#/plug/mainpage'
 */
export function toAppUrl(path = '') {
  let clean = String(path).trim()
  if (BASE_URL && clean.startsWith(BASE_URL)) {
    clean = clean.slice(BASE_URL.length)
  }
  if (clean.startsWith('#')) {
    return clean
  }
  if (!clean.startsWith('/')) {
    clean = '/' + clean
  }
  return `#${clean}`
}

/**
 * SPA 내부 페이지로 이동합니다.
 * 베이스 URL을 온전히 보존하면서 해시를 변경합니다.
 * @param {string} path - 예: '/plug/mainpage'
 */
export function navigate(path = '') {
  const hashTarget = toAppUrl(path)
  const currentPath = window.location.pathname.replace(/\/$/, '')

  // 현재 브라우저의 pathname이 BASE_URL과 다를 경우 (예: 레거시 직접 URL로 진입했던 경우)
  // 올바른 베이스 경로를 갖는 URL로 이동
  if (BASE_URL && currentPath !== BASE_URL) {
    window.location.href = `${window.location.origin}${BASE_URL}/${hashTarget}`
  } else {
    window.location.hash = hashTarget
  }
}
