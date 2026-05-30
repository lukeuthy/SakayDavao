import { useState, useMemo } from 'react'
import { useRoutes } from '../hooks/useRoutes.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useContributions } from '../hooks/useContributions.js'
import { suggestedPeriod } from '../utils/operatingHours.js'
import RouteCard from '../components/RouteCard.jsx'
import SearchBar from '../components/SearchBar.jsx'

export default function RoutesPage() {
  const { routeGroups, syncLoading } = useRoutes()
  const { isFavorite, toggle } = useFavorites()
  const { countByRoute } = useContributions()
  const [query, setQuery] = useState('')
  const [period, setPeriod] = useState(suggestedPeriod())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return routeGroups
    return routeGroups.filter(g => {
      const d = period === 'PM' ? g.pm : g.am
      if (!d) return false
      return (
        g.routeNumber.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.stops.some(s => s.name.toLowerCase().includes(q))
      )
    })
  }, [routeGroups, query, period])

  return (
    <div className="page">
      <div className="topbar">
        <div>
          <div className="topbar-title">Routes</div>
          {syncLoading && <div className="topbar-subtitle">Syncing…</div>}
        </div>
      </div>
      <div className="page-content">
        <SearchBar value={query} onChange={setQuery} />
        <div className="period-selector">
          <button className={`period-tab${period === 'AM' ? ' active' : ''}`} onClick={() => setPeriod('AM')}>
            AM
          </button>
          <button className={`period-tab${period === 'PM' ? ' active' : ''}`} onClick={() => setPeriod('PM')}>
            PM
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No routes found</div>
            <div className="empty-desc">Try a different route number or stop name.</div>
          </div>
        ) : (
          filtered.map(g => (
            <RouteCard
              key={g.routeNumber}
              group={g}
              period={period}
              isFavorite={isFavorite(g.routeNumber)}
              onToggleFavorite={toggle}
              contribCount={countByRoute(g.routeNumber)}
            />
          ))
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
