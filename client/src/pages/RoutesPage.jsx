import { useState, useMemo } from 'react'
import { useRoutes } from '../hooks/useRoutes.js'
import { useFavorites } from '../hooks/useFavorites.js'
import { useContributions } from '../hooks/useContributions.js'
import RouteCard from '../components/RouteCard.jsx'
import SearchBar from '../components/SearchBar.jsx'
import EmptyState from '../components/EmptyState.jsx'
import { SearchIcon, AlertIcon } from '../components/Icons.jsx'
import { suggestedPeriod, isRouteActive, periodWindowLabel, parseTime, nowMinutes } from '../utils/operatingHours.js'
import { formatStopName } from '../utils/routeHelpers.js'

function formatDuration(mins) {
  if (mins < 60) return `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function RoutesPage() {
  const { routeGroups } = useRoutes()
  const { toggle, isFavorite } = useFavorites()
  const { countByRoute } = useContributions()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // 'all' | 'active' | <area>

  // Period is chosen automatically from the current time (closest service window).
  const period = suggestedPeriod()

  // Service status across all routes: is anything running now, and when's next?
  const ops = useMemo(() => {
    const now = nowMinutes()
    let anyActive = false
    let soonest = Infinity
    routeGroups.forEach(g => {
      for (const p of ['am', 'pm']) {
        const d = g[p]
        if (!d) continue
        const s = parseTime(d.startTime)
        const e = parseTime(d.endTime)
        if (now >= s && now <= e) anyActive = true
        else if (s > now && s - now < soonest) soonest = s - now
      }
    })
    return { anyActive, soonest: Number.isFinite(soonest) ? soonest : null }
  }, [routeGroups])

  // Unique service areas for the current period (for the filter chips).
  const areas = useMemo(() => {
    const set = new Set()
    routeGroups.forEach(g => {
      const area = (period === 'PM' ? g.pm : g.am)?.area
      if (area) set.add(area)
    })
    return [...set].sort()
  }, [routeGroups, period])

  // Filter + search → array of { g, d, matchedStop }, active routes sorted first.
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    let list = routeGroups
      .map(g => ({ g, d: period === 'PM' ? g.pm : g.am }))
      .filter(x => x.d)

    if (filter === 'active') {
      list = list.filter(x => isRouteActive(x.d.startTime, x.d.endTime))
    } else if (filter !== 'all') {
      list = list.filter(x => (x.d.area || '') === filter)
    }

    const result = []
    for (const { g, d } of list) {
      let matchedStop = null
      if (q) {
        const inHeader = g.routeNumber.toLowerCase().includes(q) || g.name.toLowerCase().includes(q)
        if (!inHeader) {
          const sIdx = d.stops.findIndex(s => formatStopName(s.name).toLowerCase().includes(q))
          if (sIdx === -1) continue
          matchedStop = { name: formatStopName(d.stops[sIdx].name), index: sIdx }
        }
      }
      result.push({ g, d, matchedStop })
    }

    result.sort((a, b) => {
      const aActive = isRouteActive(a.d.startTime, a.d.endTime) ? 0 : 1
      const bActive = isRouteActive(b.d.startTime, b.d.endTime) ? 0 : 1
      if (aActive !== bActive) return aActive - bActive
      return a.g.routeNumber.localeCompare(b.g.routeNumber)
    })
    return result
  }, [routeGroups, search, period, filter])

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-title">Routes</div>
          <div className="page-subtitle">
            Showing {period} schedule · {periodWindowLabel(period)}
          </div>
        </div>
      </div>

      <SearchBar value={search} onChange={setSearch} />

      <div className="filter-chips">
        <button type="button" className={`filter-chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button type="button" className={`filter-chip${filter === 'active' ? ' active' : ''}`} onClick={() => setFilter('active')}>
          <span className="filter-chip-dot" />Active now
        </button>
        {areas.map(area => (
          <button type="button"
            key={area}
            className={`filter-chip${filter === area ? ' active' : ''}`}
            onClick={() => setFilter(area)}
          >
            {area}
          </button>
        ))}
      </div>

      <div className="page-content">
        {!ops.anyActive && (
          <div className="warning-banner">
            <AlertIcon size={16} />
            <span>
              Buses aren’t running right now — showing the next ({period}) schedule.
              {ops.soonest != null && ` Next service in ${formatDuration(ops.soonest)}.`}
              {' '}ETA is based on historical data.
            </span>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<SearchIcon />}
            title="Walay nakit-an"
            desc={
              search
                ? `No routes match "${search}". Try a stop name or route number.`
                : filter === 'active'
                  ? 'No routes are running right now. Try the “All” filter.'
                  : 'No routes in this area for the selected period.'
            }
          />
        ) : (
          <>
            <div className="section-header">
              {search
                ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`
                : filter === 'all'
                  ? `All Routes (${filtered.length})`
                  : `${filtered.length} route${filtered.length !== 1 ? 's' : ''}`}
            </div>
            <div className="card-grid">
              {filtered.map(({ g, matchedStop }) => (
                <RouteCard
                  key={g.routeNumber}
                  group={g}
                  isFavorite={isFavorite(g.routeNumber)}
                  onToggleFavorite={toggle}
                  period={period}
                  contribCount={countByRoute(g.routeNumber)}
                  matchedStop={matchedStop}
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
