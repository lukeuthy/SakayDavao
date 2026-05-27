import { useState, useCallback, createContext, useContext } from 'react'

export const ToastContext = createContext(null)

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, duration = 2500) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  return { toasts, show }
}

export function useShowToast() {
  const ctx = useContext(ToastContext)
  return ctx?.show ?? (() => {})
}
