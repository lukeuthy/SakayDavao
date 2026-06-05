import { useMemo } from 'react'
import { useRoutes } from '../hooks/useRoutes.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useContributions } from '../hooks/useContributions.js'
import RouteCard from '../components/RouteCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { HeartIcon } from '../components/Icons.jsx'
import { suggestedPeriod } from '../utils/operatingHours.js'

export default function FavoritesPage() {
  const { routeGroups } = useRoutes()
  const { toggle, isFavorite } = useFavorites()
  const { countByRoute } = useContributions()
  const period = suggestedPeriod()

  const favoriteGroups = useMemo(
    () => routeGroups.filter(g => isFavorite(g.routeNumber)),
    [routeGroups, isFavorite]
  )

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-title">Saved Routes</div>
          <div className="page-subtitle">{favoriteGroups.length} saved</div>
        </div>
      </div>

      <div className="page-content">
        {favoriteGroups.length === 0 ? (
          <EmptyState
            icon={<HeartIcon />}
            title="Wala pa'y paborito"
            desc="I-tap ang heart icon sa bisan unsang route para ma-save dinhi."
          />
        ) : (
          <>
            <div className="section-header">Your saved routes</div>
            <div className="card-grid">
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
            </div>
          </>
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
