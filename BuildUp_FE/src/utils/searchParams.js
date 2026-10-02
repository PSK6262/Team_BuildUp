export function getAppSearchParams() {
  const hash = window.location.hash || ''
  const qIndex = hash.indexOf('?')
  if (qIndex !== -1) {
    return new URLSearchParams(hash.slice(qIndex))
  }
  return new URLSearchParams(window.location.search)
}
