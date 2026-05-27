import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useRoutes } from '../hooks/useRoutes.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useContributions } from '../hooks/useContributions.js'
import RouteCard from '../components/RouteCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import { suggestedPeriod } from '../utils/operatingHours.js'
import { formatStopName } from '../utils/routeHelpers.js'

export default function Home() {
  const { routeGroups, lastUpdated, isOnline, syncLoading } = useRoutes()
  const { favorites, toggle, isFavorite } = useFavorites()
  const { countByRoute } = useContributions()
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState(suggestedPeriod())

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return routeGroups
    return routeGroups.filter(g => {
      const data = period === 'PM' ? g.pm : g.am
      if (!data) return false
      if (g.routeNumber.toLowerCase().includes(q)) return true
      if (g.name.toLowerCase().includes(q)) return true
      return data.stops.some(s => formatStopName(s.name).toLowerCase().includes(q))
    })
  }, [routeGroups, search, period])

  const favoriteGroups = useMemo(() =>
    filtered.filter(g => isFavorite(g.routeNumber)), [filtered, isFavorite])
  const otherGroups = useMemo(() =>
    filtered.filter(g => !isFavorite(g.routeNumber)), [filtered, isFavorite])

  const updatedText = useMemo(() => {
    if (!lastUpdated) return null
    const d = new Date(lastUpdated)
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }, [lastUpdated])

  return (
    <div className="page">
      <div className="home-header">
        <div className="home-title">SakayDavao</div>
        <div className="home-tagline">Know when your bus arrives.</div>
        <div className="home-header-bottom">
          <span style={{ fontSize: 12, opacity: 0.75 }}>
            {syncLoading ? 'Syncing routes…' :
             !isOnline ? '📡 Offline — using cached data' :
             updatedText ? `Updated ${updatedText}` : 'Route data loaded'}
          </span>
          <Link to="/history" className="nav-link">
            Contributions
          </Link>
        </div>
      </div>

      <div className="page-content">
        {/* Period selector */}
        <div className="period-selector">
          <button
            className={`period-tab${period === 'AM' ? ' active' : ''}`}
            onClick={() => setPeriod('AM')}
          >
            AM Routes (6–10 AM)
          </button>
          <button
            className={`period-tab${period === 'PM' ? ' active' : ''}`}
            onClick={() => setPeriod('PM')}
          >
            PM Routes (4–9 PM)
          </button>
        </div>

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} />

        {/* Favorites */}
        {favoriteGroups.length > 0 && (
          <>
            <div className="section-header">Favorites</div>
            {favoriteGroups.map(g => (
              <RouteCard
                key={g.routeNumber}
                group={g}
                isFavorite={true}
                onToggleFavorite={toggle}
                period={period}
                contribCount={countByRoute(g.routeNumber)}
              />
            ))}
          </>
        )}

        {/* All routes */}
        {otherGroups.length > 0 && (
          <>
            <div className="section-header">
              {favoriteGroups.length > 0 ? 'All Routes' : 'Routes'}
              {search && ` — ${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            </div>
            {otherGroups.map(g => (
              <RouteCard
                key={g.routeNumber}
                group={g}
                isFavorite={false}
                onToggleFavorite={toggle}
                period={period}
                contribCount={countByRoute(g.routeNumber)}
              />
            ))}
          </>
        )}

        {filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-title">No routes found</div>
            <div className="empty-desc">Try searching by route number or stop name.</div>
          </div>
        )}

        <div style={{ height: 24 }} />
      </div>
    </div>
  )
}
