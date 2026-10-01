import { useRef } from 'react'

export default function useHorizontalSwipe(onSwipe) {
  const gesture = useRef(null)
  const suppressClick = useRef(false)
  return {
    onTouchStart: event => {
        suppressClick.current = false
        const touch = event.touches[0]
        gesture.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY, vertical: false } : null
      },
    onTouchMove: event => {
        const origin = gesture.current
        if (!origin) return
        if (event.touches.length !== 1) { gesture.current = null; suppressClick.current = true; return }
        const dx = event.touches[0].clientX - origin.x
        const dy = event.touches[0].clientY - origin.y
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) suppressClick.current = true
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) origin.vertical = true
      },
    onTouchEnd: event => {
        const origin = gesture.current
        gesture.current = null
        if (!origin || origin.vertical || event.touches.length) return
        const dx = event.changedTouches[0].clientX - origin.x
        const dy = event.changedTouches[0].clientY - origin.y
        if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          suppressClick.current = true
          onSwipe(dx < 0 ? 1 : -1)
        }
      },
    onTouchCancel: () => { gesture.current = null; suppressClick.current = true },
    onClickCapture: event => {
        if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation() }
        suppressClick.current = false
      },
  }
}
