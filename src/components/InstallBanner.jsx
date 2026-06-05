import { useInstallPrompt } from '../hooks/useInstallPrompt.js'

export default function InstallBanner() {
  const { isInstallable, install, dismiss } = useInstallPrompt()

  if (!isInstallable) return null

  return (
    <div className="install-banner" role="banner">
      <div className="install-banner-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="14" rx="2"/>
          <path d="M2 10h20M8 4v6M16 4v6"/>
          <circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>
        </svg>
      </div>
      <div className="install-banner-body">
        <div className="install-banner-title">Add to Home Screen</div>
        <div className="install-banner-sub">Use offline — no internet needed after install</div>
      </div>
      <button className="install-banner-btn" onClick={install}>Install</button>
      <button className="install-banner-close" onClick={dismiss} aria-label="Dismiss">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}
