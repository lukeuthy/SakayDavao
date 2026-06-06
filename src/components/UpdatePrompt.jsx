import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Service-worker update banner. With `registerType: 'prompt'`, a new build does
 * NOT silently swap in — we surface a "new version available" banner so an
 * in-progress trip view isn't reloaded out from under the user.
 */
export default function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="update-prompt" role="status">
      <span className="update-prompt-text">A new version of SakayDavao is available.</span>
      <div className="update-prompt-actions">
        <button type="button" className="update-prompt-btn primary" onClick={() => updateServiceWorker(true)}>
          Reload
        </button>
        <button type="button" className="update-prompt-btn" onClick={() => setNeedRefresh(false)} aria-label="Dismiss update">
          Later
        </button>
      </div>
    </div>
  )
}
