import { useInstallPrompt } from '../hooks/useInstallPrompt.js'

export default function InstallBanner() {
  const { isInstallable, install, dismiss } = useInstallPrompt()
  if (!isInstallable) return null
  return (
    <div className="install-banner">
      <span className="install-banner-icon">🚌</span>
      <span className="install-banner-text">Add SakayDavao to your home screen</span>
      <button className="install-banner-btn" onClick={install}>Install</button>
      <button className="install-banner-close" onClick={dismiss} aria-label="Dismiss">✕</button>
    </div>
  )
}
