import { useContext } from 'react'
import { ToastContext } from '../hooks/useToast.js'

export default function Toast() {
  const ctx = useContext(ToastContext)
  if (!ctx || !ctx.toasts.length) return null
  return (
    <div className="toast-wrap">
      {ctx.toasts.map(t => (
        <div key={t.id} className="toast">{t.message}</div>
      ))}
    </div>
  )
}
