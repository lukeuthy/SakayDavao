import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRoutes } from '../hooks/useRoutes.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useContributions } from '../hooks/useContributions.js'
import { suggestedPeriod, parseTime, nowMinutes } from '../utils/operatingHours.js'
import { formatStopName } from '../utils/routeHelpers.js'
import { SearchIcon, SparkIcon, BusIcon, ClockIcon, PinIcon } from '../components/Icons.jsx'

function greetingSub() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Maayong buntag'
  if (h >= 12 && h < 18) return 'Maayong hapon'
  return 'Maayong gabii'
}

function timeAgo(isoString) {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  return `${Math.floor(diff / 86400)} d ago`
}

function useRouteStatus(routeGroups) {
  return useMemo(() => {
    const now = nowMinutes()
    const period = suggestedPeriod()
    const active = routeGroups.some(g => {
      const d = period === 'PM' ? g.pm : g.am
      if (!d) return false
      return now >= parseTime(d.startTime) && now <= parseTime(d.endTime)
    })
    if (active) return { kind: 'active', text: `${period} routes are active now` }

    let soonest = Infinity
    routeGroups.forEach(g => {
      ['am', 'pm'].forEach(p => {
        const d = g[p]
        if (!d) return
        const start = parseTime(d.startTime)
        if (start > now && start - now < soonest) soonest = start - now
      })
    })
    if (soonest < 120) return { kind: 'soon', text: `Routes start in ${Math.round(soonest)} min` }
    return { kind: 'inactive', text: 'No active routes right now' }
  }, [routeGroups])
}

export default function Home() {
  const { routeGroups, syncLoading, isOnline, lastUpdated } = useRoutes()
  const { isFavorite } = useFavorites()
  const { contributions } = useContributions()
  const status = useRouteStatus(routeGroups)
  const period = suggestedPeriod()

  const favoriteGroups = useMemo(
    () => routeGroups.filter(g => isFavorite(g.routeNumber)),
    [routeGroups, isFavorite]
  )

  const recentGroups = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const c of contributions) {
      if (!seen.has(c.routeNumber)) {
        seen.add(c.routeNumber)
        const g = routeGroups.find(g => g.routeNumber === c.routeNumber)
        if (g) result.push(g)
        if (result.length >= 3) break
      }
    }
    return result
  }, [contributions, routeGroups])

  return (
    <div className="page">
      <div className="home-hero">
        <div className="home-greeting-sub">
          <SparkIcon size={14} />
          {greetingSub()}
        </div>
        <h1 className="home-hero-title">
          Know when your<br /><span className="accent">bus arrives.</span>
        </h1>
        <p className="home-hero-sub">
          {syncLoading
            ? 'Syncing the latest Davao routes…'
            : lastUpdated
              ? `Routes updated ${timeAgo(lastUpdated)}`
              : isOnline
                ? 'Live ETAs for Davao City’s free bus routes.'
                : 'Showing bundled route data offline.'}
        </p>
      </div>

      <Link to="/routes" className="home-search-entry" aria-label="Search routes or stops">
        <span className="home-search-entry-icon"><SearchIcon size={18} /></span>
        <span className="home-search-entry-text">Search routes or stops…</span>
        <span className="home-search-entry-kbd">Browse</span>
      </Link>

      <div className="page-content">
        <div className={`route-status ${status.kind}`}>
          <div className="route-status-dot" />
          {status.text}
        </div>

        {favoriteGroups.length > 0 && (
          <>
            <div className="section-header">Favorites</div>
            <div className="favorites-scroll">
              {favoriteGroups.map(g => <QuickCard key={g.routeNumber} group={g} period={period} />)}
            </div>
          </>
        )}

        {recentGroups.length > 0 && (
          <>
            <div className="section-header">Recent</div>
            <div className="favorites-scroll">
              {recentGroups.map(g => <QuickCard key={g.routeNumber} group={g} period={period} />)}
            </div>
          </>
        )}

        <div className="section-header">All Routes</div>
        <div className="card-grid">
          {routeGroups.slice(0, 6).map(g => <QuickRouteRow key={g.routeNumber} group={g} period={period} />)}
        </div>
        {routeGroups.length > 6 && (
          <Link to="/routes" className="view-all-link">
            View all {routeGroups.length} routes →
          </Link>
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}

function QuickCard({ group, period }) {
  const d = period === 'PM' ? group.pm : group.am
  if (!d) return null
  const from = formatStopName(d.stops[0]?.name ?? '')
  const to = formatStopName(d.stops[d.stops.length - 1]?.name ?? '')
  return (
    <Link to={`/route/${group.routeNumber}/${period}`} className="fav-quick-link">
      <div className="fav-quick-card" style={{ borderLeftColor: group.color }}>
        <div className="fav-quick-route">{group.routeNumber} · {period}</div>
        <div className="fav-quick-name">{from}</div>
        <div className="fav-quick-to">→ {to}</div>
      </div>
    </Link>
  )
}

function QuickRouteRow({ group, period }) {
  const d = period === 'PM' ? group.pm : group.am
  if (!d) return null
  const to = formatStopName(d.stops[d.stops.length - 1]?.name ?? '')
  const [minD, maxD] = d.durationRange
  const stopCount = d.stops.length
  return (
    <Link to={`/route/${group.routeNumber}/${period}`} className="route-card-link">
      <div className="route-card">
        <div className="route-card-icon" style={{ background: group.color + '18', color: group.color }}>
          <BusIcon size={18} />
        </div>
        <div className="route-card-body">
          <div className="route-card-header">
            <span className="route-badge" style={{ background: group.color }}>{group.routeNumber}</span>
            <span className="route-name">{d.name}</span>
            <span className={`status-pill ${period === 'AM' ? 'amber' : 'green'} route-card-period`}>{period}</span>
          </div>
          <div className="route-stats">
            <span className="route-stat-inline"><ClockIcon size={11} /> {minD}–{maxD} min</span>
            <span className="route-stat-dot" />
            <span className="route-stat-inline"><PinIcon size={11} /> {stopCount} stops</span>
          </div>
        </div>
        <div className="route-card-right">
          <div className="route-dest">
            <div className="route-dest-name">{to.split(' ')[0]}</div>
            <div className="route-dest-label">destination</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
