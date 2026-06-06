import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useRoutes } from '../hooks/useRoutes.js'
import { useContributions } from '../hooks/useContributions.js'
import { useShowToast } from '../hooks/useToast.js'
import { estimateAllETAs, formatETA, formatConfidence } from '../utils/eta.js'
import { isRouteActive, formatOperatingHours } from '../utils/operatingHours.js'
import { getRouteData, formatStopName, nearestStop, formatDistance } from '../utils/routeHelpers.js'
import { useGeolocation } from '../hooks/useGeolocation.js'
import { useLiveBuses } from '../hooks/useLiveBuses.js'
import RouteMap from '../components/RouteMap.jsx'
import { AlertIcon, LocationIcon } from '../components/Icons.jsx'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

export default function RouteDetail() {
  const { routeNumber, period } = useParams()
  const { routeGroups } = useRoutes()
  const { contributions, addContribution, countByRoute } = useContributions()
  const showToast = useShowToast()

  const route = getRouteData(routeGroups, routeNumber, period)

  const isDesktop = useIsDesktop()
  const { position: userPos, loading: locating, permission, requestLocation } = useGeolocation()
  const [searchParams] = useSearchParams()
  const [view, setView] = useState('list')
  const [selectedStop, setSelectedStop] = useState(null)
  const [nearest, setNearest] = useState(null)
  const [etas, setEtas] = useState([])
  const [etaLoading, setEtaLoading] = useState(false)

  // Live/simulated buses for the map (no-op until route loads).
  const { buses, source: busSource } = useLiveBuses(route)

  // Auto-select a stop when arriving via a search "jump to stop" link (?stop=N).
  useEffect(() => {
    const s = searchParams.get('stop')
    if (s === null || !route) return
    const idx = Number(s)
    if (Number.isInteger(idx) && idx >= 0 && idx < route.stops.length) setSelectedStop(idx)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route?.routeNumber, period])

  // Mount RouteMap only when its container is visible:
  // - desktop: always (both columns shown via CSS)
  // - mobile: only when map tab is active
  // Leaflet needs a visible, non-zero container at init time.
  const shouldMountMap = isDesktop || view === 'map'

  useEffect(() => {
    if (selectedStop === null || !route) return
    setEtaLoading(true)
    estimateAllETAs(route, selectedStop, contributions)
      .then(results => setEtas(results))
      .finally(() => setEtaLoading(false))
    // Recompute on stop/route/period change only — not on every new contribution.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStop, route?.routeNumber, period])

  // List view: toggle select/deselect
  const handleSelectStop = useCallback((idx) => {
    setSelectedStop(prev => prev === idx ? null : idx)
    setEtas([])
  }, [])

  // Map view: always select (never toggle off by tapping)
  const handleMapSelectStop = useCallback((idx) => {
    setSelectedStop(prev => {
      if (prev !== idx) setEtas([])
      return idx
    })
  }, [])

  const handleDismiss = useCallback(() => {
    setSelectedStop(null)
    setEtas([])
  }, [])

  const handleArrived = useCallback((idx, stopName) => {
    addContribution(routeNumber, route?.name ?? routeNumber, idx, stopName)
    showToast(`Thanks! Bus arrival logged at ${formatStopName(stopName)}`)
  }, [routeNumber, route, addContribution, showToast])

  // Locate the user and auto-select the closest stop on this route.
  const handleLocate = useCallback(async () => {
    const coords = await requestLocation()
    if (!coords || !route) {
      if (permission === 'denied') {
        showToast('Location is off. Enable it in your browser settings.')
      } else {
        showToast('Could not get your location. Try again outdoors.')
      }
      return
    }
    const near = nearestStop(route.stops, coords.latitude, coords.longitude)
    if (!near) {
      showToast('No stops with coordinates on this route.')
      return
    }
    setNearest(near)
    setSelectedStop(near.index)
    setEtas([])
    showToast(
      `Nearest stop: ${formatStopName(route.stops[near.index].name)} · ${formatDistance(near.distance)} away`
    )
  }, [requestLocation, route, permission, showToast])

  if (!route) {
    return (
      <div className="page detail-page">
        <div className="topbar">
          <Link to="/" className="back-btn" aria-label="Back">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <span className="topbar-title">{routeNumber}</span>
        </div>
        <div className="loading-row">
          <div className="spinner" />
          <span>Loading route…</span>
        </div>
      </div>
    )
  }

  const isActive = isRouteActive(route.startTime, route.endTime)
  const stops = route.stops
  const contribCount = countByRoute(routeNumber)

  const nextEta = selectedStop !== null && etas.length > 0 ? etas[0] : null
  const lastStop = stops[stops.length - 1]

  return (
    <div className="page detail-page">
      <div className="topbar">
        <Link to="/" className="back-btn" aria-label="Back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <div style={{ flex: 1 }}>
          <div className="topbar-title" style={{ fontSize: 17 }}>{routeNumber} · {route.name}</div>
          <div className="topbar-subtitle">{formatOperatingHours(route.startTime, route.endTime)}</div>
        </div>
        <span className={`period-badge ${period.toLowerCase()}`}>{period}</span>
      </div>

      {/* View toggle */}
      <div className="view-tabs">
        <button type="button"
          className={`view-tab${view === 'list' ? ' active' : ''}`}
          onClick={() => setView('list')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
          </svg>
          List
        </button>
        <button type="button"
          className={`view-tab${view === 'map' ? ' active' : ''}`}
          onClick={() => setView('map')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          Map
        </button>
      </div>

      <div className="detail-columns">
        {/* List column — mobile: hidden when map active; desktop: always visible */}
        <div className={`detail-col-list${view === 'map' ? ' hidden-mobile' : ''}`}>
          <div className="page-content">
            {!isActive && (
              <div className="warning-banner">
                <AlertIcon size={16} />
                <span>
                  This route only runs {formatOperatingHours(route.startTime, route.endTime)}.
                  ETAs shown are estimates only.
                </span>
              </div>
            )}

            {selectedStop !== null && (
              <div className="eta-hero" role="status" aria-live="polite">
                {etaLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    <span>Calculating ETA…</span>
                  </div>
                ) : nextEta ? (
                  <>
                    <div className="eta-hero-label">Next stop ETA from {formatStopName(stops[selectedStop]?.name ?? '')}</div>
                    <div className="eta-hero-time">{formatETA(nextEta)}</div>
                    <div className="eta-hero-sub">
                      to {formatStopName(stops[selectedStop + 1]?.name ?? '')}
                      {nextEta.confidence > 0 && ` (${formatConfidence(nextEta)})`}
                    </div>
                    {lastStop && (
                      <div className="eta-hero-sub" style={{ marginTop: 2 }}>
                        Final stop: {formatStopName(lastStop.name)} ·{' '}
                        {etas[etas.length - 1] ? formatETA(etas[etas.length - 1]) : '…'}
                      </div>
                    )}
                    <div className="eta-source">
                      {nextEta.source === 'onnx' ? 'AI model' :
                       nextEta.source === 'historical' ? `${contribCount} crowd reports` :
                       'Route estimate'}
                    </div>
                  </>
                ) : (
                  <div>Tap a stop below to see ETA</div>
                )}
              </div>
            )}

            {selectedStop === null && (
              <div style={{ padding: '12px 16px', fontSize: 14, color: 'var(--ink-3)' }}>
                Tap <strong>"I'm here"</strong> on any stop to calculate ETA.
                Tap <strong>"Bus here"</strong> to report a bus arrival.
              </div>
            )}

            <div style={{ padding: '4px 16px 0' }}>
              <button type="button" className="locate-btn" onClick={handleLocate} disabled={locating}>
                {locating ? (
                  <>
                    <div className="spinner" style={{ width: 15, height: 15 }} />
                    Locating…
                  </>
                ) : (
                  <>
                    <LocationIcon size={15} />
                    Find my nearest stop
                  </>
                )}
              </button>
              {permission === 'denied' && (
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 6, paddingLeft: 2 }}>
                  Location is blocked. Enable it in your browser settings to use this.
                </div>
              )}
            </div>

            <div className="stop-list">
              {stops.map((stop, idx) => {
                const isPast = selectedStop !== null && idx < selectedStop
                const isCurrent = idx === selectedStop
                const isTerminal = idx === stops.length - 1
                const stopEta = etas.find(e => e.stopIndex === idx)
                const name = formatStopName(stop.name)

                return (
                  <div key={stop.id ?? idx} className={`stop-row${isPast ? ' past' : ''}`}>
                    <div className="stop-dot-wrap">
                      <div className={`stop-dot${isCurrent ? ' current' : isPast ? ' past' : isTerminal ? ' terminal' : ''}`} />
                    </div>
                    <div
                      className={`stop-card${isCurrent ? ' current' : isPast ? ' past' : ''}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Select stop ${idx + 1}, ${name}`}
                      onClick={() => handleSelectStop(idx)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectStop(idx) }
                      }}
                    >
                      <div className="stop-card-icon">
                        <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                      </div>
                      <div className="stop-card-body">
                        <div className={`stop-name${isPast ? ' muted' : ''}`}>{name}</div>
                        <div className="stop-meta">
                          <span>Stop {idx + 1} of {stops.length}</span>
                          {stopEta && !isCurrent && (
                            <>
                              <span className="stop-meta-dot" />
                              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{formatETA(stopEta)}</span>
                            </>
                          )}
                          {isCurrent && (
                            <>
                              <span className="stop-meta-dot" />
                              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>You are here</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button type="button"
                          className={`here-btn${isCurrent ? ' active' : ''}`}
                          onClick={() => handleSelectStop(idx)}
                        >
                          {isCurrent ? '✓ Here' : "I'm here"}
                        </button>
                        <button type="button"
                          className="arrived-btn"
                          onClick={() => handleArrived(idx, stop.name)}
                        >
                          Bus here
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ height: 32 }} />
          </div>
        </div>

        {/* Map column — mobile: hidden when list active; desktop: always visible */}
        <div className={`detail-col-map${view === 'list' ? ' hidden-mobile' : ''}`}>
          <div className="page-content map-view">
            {!isActive && (
              <div className="warning-banner" style={{ margin: '8px 12px', borderRadius: 8 }}>
                <AlertIcon size={16} />
                <span>Route only runs {formatOperatingHours(route.startTime, route.endTime)}. ETAs are estimates.</span>
              </div>
            )}
            {shouldMountMap && (
              <RouteMap
                route={route}
                selectedStop={selectedStop}
                etas={etas}
                etaLoading={etaLoading}
                onSelectStop={handleMapSelectStop}
                onDismiss={handleDismiss}
                onArrived={handleArrived}
                userPos={userPos}
                onLocate={handleLocate}
                locating={locating}
                nearest={nearest}
                buses={buses}
                busSource={busSource}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
