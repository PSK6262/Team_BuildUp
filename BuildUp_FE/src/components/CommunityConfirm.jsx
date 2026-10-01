import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import '../css/CommunityConfirm.css'

export function useCommunityConfirm() {
  const [request, setRequest] = useState(null)
  const pending = useRef(null)
  useEffect(() => () => { pending.current?.(false); pending.current = null }, [])
  const settle = (accepted) => {
    const resolve = pending.current
    pending.current = null
    setRequest(null)
    resolve?.(accepted)
  }
  const confirm = (message, title = '삭제하시겠어요?') => {
    if (pending.current) return Promise.resolve(false)
    return new Promise((resolve) => {
      pending.current = resolve
      setRequest({ message, title })
    })
  }
  return { confirm, confirmation: request ? <CommunityConfirm {...request} onClose={settle} /> : null }
}

function CommunityConfirm({ message, title, onClose }) {
  const dialog = useRef(null)
  const cancel = useRef(null)
  const id = useId()
  useEffect(() => {
    const previousFocus = document.activeElement
    const element = dialog.current
    element.showModal()
    cancel.current?.focus()
    return () => { element.close(); if (previousFocus?.isConnected) previousFocus.focus() }
  }, [])
  return createPortal(<dialog ref={dialog} className="community-confirm" aria-labelledby={`${id}-title`} aria-describedby={`${id}-message`}
    onCancel={(event) => { event.preventDefault(); onClose(false) }}>
    <div className="community-confirm__icon" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" /></svg>
    </div>
    <span className="community-confirm__badge">삭제 확인</span>
    <h2 id={`${id}-title`}>{title}</h2>
    <p id={`${id}-message`}>{message}</p>
    <div className="community-confirm__actions">
      <button type="button" className="community-confirm__delete" onClick={() => onClose(true)}>삭제</button>
      <button ref={cancel} type="button" onClick={() => onClose(false)}>취소</button>
    </div>
  </dialog>, document.body)
}
