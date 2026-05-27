import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useRoutes } from '../hooks/useRoutes.js'
import { useContributions } from '../hooks/useContributions.js'
import { useShowToast } from '../hooks/useToast.js'
import { estimateAllETAs, formatETA, formatConfidence } from '../utils/eta.js'
import { isRouteActive, formatOperatingHours } from '../utils/operatingHours.js'
import { getRouteData, formatStopName } from '../utils/routeHelpers.js'

export default function RouteDetail() {
  const { routeNumber, period } = useParams()
  const { routeGroups } = useRoutes()
  const { contributions, addContribution, countByRoute } = useContributions()
  const showToast = useShowToast()

  const route = getRouteData(routeGroups, routeNumber, period)

  const [selectedStop, setSelectedStop] = useState(null)
  const [etas, setEtas] = useState([]) // [{ stopIndex, minutes, confidence, source }]
  const [etaLoading, setEtaLoading] = useState(false)

  // Recalculate ETAs when selected stop changes
  useEffect(() => {
    if (selectedStop === null || !route) return
    setEtaLoading(true)
    estimateAllETAs(route, selectedStop, contributions)
      .then(results => setEtas(results))
      .finally(() => setEtaLoading(false))
  }, [selectedStop, route?.routeNumber, period])

  const handleSelectStop = useCallback((idx) => {
    setSelectedStop(prev => prev === idx ? null : idx)
    setEtas([])
  }, [])

  const handleArrived = useCallback((idx, stopName) => {
    addContribution(routeNumber, route?.name ?? routeNumber, idx, stopName)
    showToast(`Thanks! Bus arrival logged at ${formatStopName(stopName)}`)
  }, [routeNumber, route, addContribution, showToast])

  if (!route) {
    return (
      <div className="page">
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
    <div className="page">
      {/* Top bar */}
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

      <div className="page-content">
        {/* Operating hours warning */}
        {!isActive && (
          <div className="warning-banner">
            <span>⚠️</span>
            <span>
              This route only runs {formatOperatingHours(route.startTime, route.endTime)}.
              ETAs shown are estimates only.
            </span>
          </div>
        )}

        {/* ETA hero when a stop is selected */}
        {selectedStop !== null && (
          <div className="eta-hero">
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
                  {nextEta.source === 'onnx' ? '🤖 AI model' :
                   nextEta.source === 'historical' ? `📊 ${contribCount} crowd reports` :
                   '📐 Route estimate'}
                </div>
              </>
            ) : (
              <div>Tap a stop below to see ETA</div>
            )}
          </div>
        )}

        {/* Instruction if no stop selected */}
        {selectedStop === null && (
          <div style={{ padding: '12px 16px', fontSize: 14, color: 'var(--text-muted)' }}>
            Tap <strong>"I'm here"</strong> on any stop to calculate ETA.
            Tap <strong>"Bus here"</strong> to report a bus arrival.
          </div>
        )}

        {/* Stop list */}
        <div className="stop-list">
          {stops.map((stop, idx) => {
            const isPast = selectedStop !== null && idx < selectedStop
            const isCurrent = idx === selectedStop
            const stopEta = etas.find(e => e.stopIndex === idx)
            const name = formatStopName(stop.name)

            return (
              <div key={stop.id ?? idx} className="stop-row">
                <div className="stop-dot-wrap">
                  <div className={`stop-dot${isCurrent ? ' current' : isPast ? ' past' : ''}`} />
                </div>
                <div className="stop-info">
                  <span className={`stop-name${isPast ? ' muted' : ''}`}>{name}</span>
                  <span className="stop-idx">Stop {idx + 1} of {stops.length}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>
                      📍 You are here
                    </span>
                  )}
                </div>
                {stopEta && !isCurrent && (
                  <span className={`stop-eta${isPast ? ' dim' : ''}`}>
                    {formatETA(stopEta)}
                  </span>
                )}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    className={`here-btn${isCurrent ? ' active' : ''}`}
                    onClick={() => handleSelectStop(idx)}
                  >
                    {isCurrent ? '✓ Here' : "I'm here"}
                  </button>
                  <button
                    className="arrived-btn"
                    onClick={() => handleArrived(idx, stop.name)}
                    title="Report bus arrival at this stop"
                  >
                    Bus here
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
