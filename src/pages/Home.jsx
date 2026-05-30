import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRoutes } from '../hooks/useRoutes.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useContributions } from '../hooks/useContributions.js'
import { suggestedPeriod, parseTime, nowMinutes } from '../utils/operatingHours.js'
import { formatStopName } from '../utils/routeHelpers.js'

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000
  if (diff < 90) return 'just now'
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`
  return `${Math.round(diff / 86400)} d ago`
}

function greeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Maayong buntag! 🌅'
  if (h >= 12 && h < 18) return 'Maayong hapon! ☀️'
  return 'Maayong gabii! 🌙'
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
      <div className="home-header">
        <div className="home-greeting">{greeting()}</div>
        <div className="home-tagline">
          {syncLoading
            ? 'Syncing routes…'
            : lastUpdated
              ? `Updated ${timeAgo(lastUpdated)}`
              : !isOnline
                ? '📡 Offline — using bundled data'
                : 'Know when your bus arrives.'}
        </div>
      </div>

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
        {routeGroups.slice(0, 5).map(g => <QuickRouteRow key={g.routeNumber} group={g} period={period} />)}
        {routeGroups.length > 5 && (
          <Link to="/routes" style={{
            display: 'block', margin: '4px 16px 12px', padding: '13px',
            textAlign: 'center', borderRadius: 12,
            border: '1.5px dashed var(--line)',
            color: 'var(--primary)', fontSize: 14, fontWeight: 600,
          }}>
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
    <Link to={`/route/${group.routeNumber}/${period}`} style={{ textDecoration: 'none' }}>
      <div className="fav-quick-card" style={{ borderLeftColor: group.color }}>
        <div className="fav-quick-route">{group.routeNumber} · {period}</div>
        <div className="fav-quick-name">{from}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>→ {to}</div>
      </div>
    </Link>
  )
}

function QuickRouteRow({ group, period }) {
  const d = period === 'PM' ? group.pm : group.am
  if (!d) return null
  const from = formatStopName(d.stops[0]?.name ?? '')
  const to = formatStopName(d.stops[d.stops.length - 1]?.name ?? '')
  return (
    <Link to={`/route/${group.routeNumber}/${period}`} style={{ textDecoration: 'none' }}>
      <div className="route-card">
        <div className="route-card-icon" style={{ background: group.color + '18', color: group.color }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="14" rx="2"/>
            <path d="M2 10h20M8 4v6M16 4v6"/>
            <circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>
          </svg>
        </div>
        <div className="route-card-body">
          <div className="route-card-header">
            <span className="route-badge" style={{ background: group.color }}>{group.routeNumber}</span>
            <span className="route-name">{d.name}</span>
          </div>
          <div className="route-stats">
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{from}</span>
            <span className="route-stat-dot" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>{to}</span>
          </div>
        </div>
        <div className="route-card-right">
          <span className={`status-pill ${period === 'AM' ? 'amber' : 'green'}`}>{period}</span>
        </div>
      </div>
    </Link>
  )
}
