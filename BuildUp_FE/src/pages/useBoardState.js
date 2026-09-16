import { useEffect, useState } from 'react'

// 같은 탭에서 상세를 보고 돌아올 때 목록 상태를 복원합니다.
export default function useBoardState(field, initialValue) {
  const key = `plugin:board:${window.location.pathname}:${field}`
  const [value, setValue] = useState(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(key))
      return typeof saved === typeof initialValue ? saved : initialValue
    } catch { return initialValue }
  })
  useEffect(() => {
    try { sessionStorage.setItem(key, JSON.stringify(value)) } catch { /* 저장 불가 시 현재 화면 상태만 유지합니다. */ }
  }, [key, value])
  return [value, setValue]
}
