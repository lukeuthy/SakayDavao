import { Link } from 'react-router-dom'
import { formatOperatingHours, isRouteActive } from '../utils/operatingHours.js'
import { formatStopName } from '../utils/routeHelpers.js'

function BusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3" width="14" height="13" rx="2.5"/>
      <path d="M4 9h14M8 16v2.5M14 16v2.5"/>
      <circle cx="8" cy="13" r="0.9" fill="currentColor"/>
      <circle cx="14" cy="13" r="0.9" fill="currentColor"/>
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
      <path d="M9.5 1.5C9.5 6 6 9.5 1.5 9.5C1.5 5 5 1.5 9.5 1.5Z" fill="currentColor"/>
      <path d="M2 9L6 5" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity="0.5"/>
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="4.5" cy="4.5" r="3.5"/>
      <path d="M4.5 2.5V4.5L6 5.5" strokeLinecap="round"/>
    </svg>
  )
}

function StopIcon() {
  return (
    <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor">
      <path d="M4.5 0C2 0 0 1.8 0 4.2 0 7.3 4.5 11 4.5 11S9 7.3 9 4.2C9 1.8 7 0 4.5 0zm0 5.6a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8z"/>
    </svg>
  )
}

export default function RouteCard({ group, isFavorite, onToggleFavorite, period, contribCount, matchedStop }) {
  const data = period === 'PM' ? group.pm : group.am
  if (!data) return null

  const to = formatStopName(data.stops[data.stops.length - 1]?.name ?? '')
  const [minD, maxD] = data.durationRange
  const stopCount = data.stops.length
  const active = isRouteActive(data.startTime, data.endTime)

  return (
    <div className="route-card route-card-full">
      <div className="route-card-inner">
        <div className="route-card-icon" style={{ background: group.color + '18', color: group.color }}>
          <BusIcon />
        </div>

        <div className="route-card-body">
          <div className="route-card-header">
            <span className="route-badge" style={{ background: group.color }}>{group.routeNumber}</span>
            <span className="route-name">{data.name}</span>
            <span className="route-badge-free">
              <LeafIcon /> Free
            </span>
          </div>
          <div className="route-stats">
            {active && (
              <>
                <span className="route-active-mini"><span className="route-active-dot" />Active now</span>
                <span className="route-stat-dot" />
              </>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <ClockIcon /> {minD}–{maxD} min
            </span>
            <span className="route-stat-dot" />
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <StopIcon /> {stopCount} stops
            </span>
            {contribCount > 0 && (
              <>
                <span className="route-stat-dot" />
                <span className="contrib-count">{contribCount}</span>
              </>
            )}
          </div>
        </div>

        <div className="route-card-right">
          <button type="button"
            className={`fav-btn${isFavorite ? ' active' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleFavorite(group.routeNumber) }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Geist', sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.5, lineHeight: 1 }}>
              {to.split(' ')[0]}
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, marginTop: 2 }}>destination</div>
          </div>
        </div>
      </div>

      {matchedStop && (
        <Link
          to={`/route/${group.routeNumber}/${period}?stop=${matchedStop.index}`}
          className="matched-stop"
          onClick={e => e.stopPropagation()}
        >
          <StopIcon />
          <span>matches stop: <strong>{matchedStop.name}</strong></span>
        </Link>
      )}

      <div className="route-actions">
        {group.am && (
          <Link to={`/route/${group.routeNumber}/AM`} style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
            <button type="button" className={`route-action-btn${period === 'AM' ? ' active' : ''}`} style={{ width: '100%' }}>
              AM · {formatOperatingHours(group.am.startTime, group.am.endTime)}
            </button>
          </Link>
        )}
        {group.pm && (
          <Link to={`/route/${group.routeNumber}/PM`} style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
            <button type="button" className={`route-action-btn${period === 'PM' ? ' active' : ''}`} style={{ width: '100%' }}>
              PM · {formatOperatingHours(group.pm.startTime, group.pm.endTime)}
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
