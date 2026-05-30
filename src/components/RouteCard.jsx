import { Link } from 'react-router-dom'
import { formatOperatingHours } from '../utils/operatingHours.js'
import { formatStopName } from '../utils/routeHelpers.js'

function BusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="14" rx="2"/>
      <path d="M2 10h20M8 4v6M16 4v6"/>
      <circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>
    </svg>
  )
}

export default function RouteCard({ group, isFavorite, onToggleFavorite, period, contribCount }) {
  const data = period === 'PM' ? group.pm : group.am
  if (!data) return null

  const from = formatStopName(data.stops[0]?.name ?? '')
  const to = formatStopName(data.stops[data.stops.length - 1]?.name ?? '')
  const [minD, maxD] = data.durationRange

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
          </div>
          <div className="route-stats">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{from}</span>
            <span className="route-stat-dot" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{to}</span>
            {contribCount > 0 && (
              <>
                <span className="route-stat-dot" />
                <span className="contrib-count">{contribCount}</span>
              </>
            )}
          </div>
        </div>
        <div className="route-card-right">
          <button
            className={`fav-btn${isFavorite ? ' active' : ''}`}
            onClick={e => { e.stopPropagation(); onToggleFavorite(group.routeNumber) }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          <span className={`status-pill ${period === 'AM' ? 'amber' : 'green'}`}>
            {minD}–{maxD} min
          </span>
        </div>
      </div>
      <div className="route-actions">
        {group.am && (
          <Link to={`/route/${group.routeNumber}/AM`} style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
            <button className={`route-action-btn${period === 'AM' ? ' active' : ''}`} style={{ width: '100%' }}>
              AM · {formatOperatingHours(group.am.startTime, group.am.endTime)}
            </button>
          </Link>
        )}
        {group.pm && (
          <Link to={`/route/${group.routeNumber}/PM`} style={{ flex: 1 }} onClick={e => e.stopPropagation()}>
            <button className={`route-action-btn${period === 'PM' ? ' active' : ''}`} style={{ width: '100%' }}>
              PM · {formatOperatingHours(group.pm.startTime, group.pm.endTime)}
            </button>
          </Link>
        )}
      </div>
    </div>
  )
}
