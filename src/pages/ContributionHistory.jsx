import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useContributions } from '../hooks/useContributions.js'
import { useShowToast } from '../hooks/useToast.js'
import { formatStopName } from '../utils/routeHelpers.js'

function formatTime(ts) {
  return new Date(ts).toLocaleString('en-PH', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function ContributionHistory() {
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
    showToast('All contribution history cleared.')
  }

  return (
    <div className="page">
      <div className="topbar">
        <Link to="/" className="back-btn" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div className="topbar-title">Contributions</div>
          <div className="topbar-subtitle">{contributions.length} total reports</div>
        </div>
      </div>

      <div className="page-content">
        {contributions.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <div className="empty-title">No contributions yet</div>
            <div className="empty-desc">
              Open any route and tap "Bus here" at a stop to log a bus arrival.
              Your reports help improve ETAs for everyone.
            </div>
          </div>
        ) : (
          <>
            <div className="section-header">Your Bus Arrival Reports</div>
            {contributions.map(c => (
              <div key={c.id} className="contribution-item">
                <div className="contribution-route">
                  <span className="route-badge" style={{ fontSize: 11, padding: '2px 6px', marginRight: 6 }}>
                    {c.routeNumber}
                  </span>
                  {c.routeName}
                </div>
                <div className="contribution-stop">📍 {formatStopName(c.stopName)}</div>
                <div className="contribution-time">🕒 {formatTime(c.timestamp)}</div>
              </div>
            ))}

            <button
              className="clear-btn"
              onClick={handleClear}
            >
              {confirmClear ? '⚠️ Tap again to confirm clear all' : 'Clear All History'}
            </button>
          </>
        )}

        <div style={{ height: 32 }} />
      </div>
    </div>
  )
}
