import { Link } from 'react-router-dom'
import { formatOperatingHours } from '../utils/operatingHours.js'
import { formatStopName } from '../utils/routeHelpers.js'

export default function RouteCard({ group, isFavorite, onToggleFavorite, period, contribCount }) {
  const data = period === 'PM' ? group.pm : group.am
  if (!data) return null

  const from = formatStopName(data.stops[0]?.name ?? '')
  const to = formatStopName(data.stops[data.stops.length - 1]?.name ?? '')
  const [minD, maxD] = data.durationRange

  return (
    <div className="route-card" style={{ borderLeftColor: group.color, borderLeftWidth: 4 }}>
      <div className="route-card-header">
        <span className="route-badge" style={{ background: group.color }}>{group.routeNumber}</span>
        <span className="route-name">{data.name}</span>
        <button
          className={`fav-btn${isFavorite ? ' active' : ''}`}
          onClick={e => { e.stopPropagation(); onToggleFavorite(group.routeNumber) }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>
      </div>

      <div className="route-meta">
        <span className="route-stops">{from} → {to}</span>
      </div>

      <div className="route-meta">
        <span className={`period-badge ${data.period.toLowerCase()}`}>{data.period}</span>
        <span className="route-duration">{minD}–{maxD} min</span>
        <span className="route-stops">{data.stops.length} stops</span>
        {contribCount > 0 && (
          <span className="contrib-count">📊 {contribCount} reports</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        {group.am && (
          <Link
            to={`/route/${group.routeNumber}/AM`}
            style={{ flex: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className={`period-tab${period === 'AM' ? ' active' : ''}`}
              style={{ width: '100%' }}
            >
              AM · {formatOperatingHours(group.am.startTime, group.am.endTime)}
            </button>
          </Link>
        )}
        {group.pm && (
          <Link
            to={`/route/${group.routeNumber}/PM`}
            style={{ flex: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <button
              className={`period-tab${period === 'PM' ? ' active' : ''}`}
              style={{ width: '100%' }}
            >
              PM · {formatOperatingHours(group.pm.startTime, group.pm.endTime)}
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
