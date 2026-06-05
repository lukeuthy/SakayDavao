import { useInstallPrompt } from '../hooks/useInstallPrompt.js'

export default function IosInstallGuide() {
  const { showIosGuide, dismissIos } = useInstallPrompt()

  if (!showIosGuide) return null

  return (
    <div className="ios-install-guide" role="banner">
      <div className="install-banner-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="14" rx="2"/>
          <path d="M2 10h20M8 4v6M16 4v6"/>
          <circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>
        </svg>
      </div>
      <div className="install-banner-body">
        <div className="install-banner-title">Install SakayDavao</div>
        <div className="install-banner-sub">
          Tap the Share
          <svg className="ios-share-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          button, then <strong>Add to Home Screen</strong>
        </div>
      </div>
      <button className="install-banner-close" onClick={dismissIos} aria-label="Dismiss">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  )
}
