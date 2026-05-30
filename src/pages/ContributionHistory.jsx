import { useState, useMemo } from 'react'
import { useContributions } from '../hooks/useContributions.js'
import { useShowToast } from '../hooks/useToast.js'
import { formatStopName } from '../utils/routeHelpers.js'

function dayLabel(ts) {
  const d = new Date(ts)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

export default function ContributionHistory() {
  const { contributions, clearAll } = useContributions()
  const showToast = useShowToast()
  const [confirmClear, setConfirmClear] = useState(false)

  const grouped = useMemo(() => {
    const groups = []
    let currentLabel = null
    let currentItems = []
    for (const c of contributions) {
      const label = dayLabel(c.timestamp)
      if (label !== currentLabel) {
        if (currentItems.length) groups.push({ label: currentLabel, items: currentItems })
        currentLabel = label
        currentItems = [c]
      } else {
        currentItems.push(c)
      }
    }
    if (currentItems.length) groups.push({ label: currentLabel, items: currentItems })
    return groups
  }, [contributions])

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
      <div style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        padding: '14px 16px',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>History</div>
        <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 3 }}>
          {contributions.length} bus arrival report{contributions.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="page-content">
        {contributions.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🚌</div>
            <div className="empty-title">Wala pa'y report</div>
            <div className="empty-desc">
              Open any route, then tap "Bus here" at a stop to log a bus arrival. Your reports help everyone!
            </div>
          </div>
        ) : (
          <>
            {grouped.map(group => (
              <div key={group.label} className="history-date-group">
                <div className="history-date-label">{group.label}</div>
                {group.items.map(c => (
                  <div key={c.id} className="contribution-item">
                    <div
                      className="contribution-route-badge"
                    >
                      {c.routeNumber}
                    </div>
                    <div className="contribution-body">
                      <div className="contribution-stop">{formatStopName(c.stopName)}</div>
                      <div className="contribution-time">{c.routeName} · {formatTime(c.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <button className="clear-btn" onClick={handleClear}>
              {confirmClear ? '⚠️ Tap again to confirm' : 'Clear All History'}
            </button>
          </>
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
