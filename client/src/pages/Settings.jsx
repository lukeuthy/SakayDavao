import { useState } from 'react'
import { useDataConsent } from '../hooks/useDataConsent.js'
import { useContributions } from '../hooks/useContributions.js'
import { useShowToast } from '../hooks/useToast.js'
import { TrashIcon, AlertIcon } from '../components/Icons.jsx'

export default function Settings() {
  const { enabled, setEnabled } = useDataConsent()
  const { contributions, clearAll } = useContributions()
  const showToast = useShowToast()
  const [confirmClear, setConfirmClear] = useState(false)

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 4000)
      return
    }
    clearAll()
    setConfirmClear(false)
    showToast('Your local ride data was cleared.')
  }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Privacy &amp; data</div>
        </div>
      </div>

      <div className="page-content">
        <div className="settings-row">
          <div className="settings-row-text">
            <div className="settings-row-title">Share anonymous bus data</div>
            <div className="settings-row-desc">
              While a route is open, note the stop you're near and the time to improve arrival
              estimates for everyone. No account, no name, never your exact location.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Share anonymous bus data"
            className={`switch${enabled ? ' on' : ''}`}
            onClick={() => setEnabled(!enabled)}
          >
            <span className="switch-knob" />
          </button>
        </div>

        <div className="settings-note">
          {enabled
            ? 'On — collection happens only while the app is open and you have a route open. Turn it off anytime.'
            : 'Off — no boarding data is shared. The app still works fully.'}
        </div>

        <div className="settings-section-label">Your data</div>
        <button type="button" className="clear-btn" onClick={handleClear}>
          {confirmClear ? <AlertIcon size={16} /> : <TrashIcon size={16} />}
          {confirmClear
            ? 'Tap again to confirm'
            : `Clear my local ride data${contributions.length ? ` (${contributions.length})` : ''}`}
        </button>
        <div className="settings-note">
          Clears reports stored on this device. Anonymous data already shared can't be tied back
          to you, so it isn't affected.
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
