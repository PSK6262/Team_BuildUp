import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

let latest = null
const listeners = new Set()
export function notifyCommunity(message) {
  latest = { message, expires: Date.now() + 4500 }
  listeners.forEach((listener) => listener(latest))
}
export default function CommunityToast() {
  const [notice, setNotice] = useState(() => latest?.expires > Date.now() ? latest : null)
  useEffect(() => { listeners.add(setNotice); return () => listeners.delete(setNotice) }, [])
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), Math.max(0, notice.expires - Date.now()))
    return () => window.clearTimeout(timer)
  }, [notice])
  const dismiss = () => { latest = null; setNotice(null) }
  return createPortal(<div className="community-toast" role="status" aria-live="polite" aria-atomic="true">
    {notice && <div className="community-toast__body"><span aria-hidden="true">✓</span><span>{notice.message}</span><button type="button" aria-label="완료 안내 닫기" onClick={dismiss}>×</button></div>}
  </div>, document.body)
}
