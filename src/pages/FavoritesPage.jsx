import { useMemo } from 'react'
import { useRoutes } from '../hooks/useRoutes.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useContributions } from '../hooks/useContributions.js'
import { suggestedPeriod } from '../utils/operatingHours.js'
import RouteCard from '../components/RouteCard.jsx'

export default function FavoritesPage() {
  const { routeGroups } = useRoutes()
  const { favorites, isFavorite, toggle } = useFavorites()
  const { countByRoute } = useContributions()
  const period = suggestedPeriod()

  const favoriteGroups = useMemo(
    () => routeGroups.filter(g => isFavorite(g.routeNumber)),
    [routeGroups, favorites, isFavorite]
  )

  return (
    <div className="page">
      <div className="topbar">
        <div className="topbar-title">Saved Routes</div>
      </div>
      <div className="page-content">
        {favoriteGroups.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🤍</div>
            <div className="empty-title">No saved routes yet</div>
            <div className="empty-desc">
              Tap the heart icon on any route to save it here for quick access.
            </div>
          </div>
        ) : (
          favoriteGroups.map(g => (
            <RouteCard
              key={g.routeNumber}
              group={g}
              period={period}
              isFavorite={true}
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
