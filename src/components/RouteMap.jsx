import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from 'react-leaflet'
import { formatStopName } from '../utils/routeHelpers.js'
import { formatETA, formatConfidence } from '../utils/eta.js'
import 'leaflet/dist/leaflet.css'

function FitBounds({ stops }) {
  const map = useMap()
  useEffect(() => {
    if (!stops?.length) return
    const bounds = stops.map(s => [s.lat, s.lng])
    map.fitBounds(bounds, { padding: [40, 40] })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

export default function RouteMap({ route, selectedStop, etas, etaLoading, onSelectStop, onDismiss, onArrived }) {
  const stops = route?.stops ?? []
  const center = stops.length
    ? [stops[Math.floor(stops.length / 2)].lat, stops[Math.floor(stops.length / 2)].lng]
    : [7.0707, 125.6087]

  const positions = stops.map(s => [s.lat, s.lng])
  const selectedStopObj = selectedStop !== null ? stops[selectedStop] : null
  const nextEta = selectedStop !== null && etas.length > 0 ? etas[0] : null

  return (
    <div className="route-map-wrap">
      <MapContainer center={center} zoom={13} zoomControl={false} attributionControl={false} style={{ flex: 1 }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds stops={stops} />
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: route?.color ?? '#27AE60', weight: 4, opacity: 0.8 }}
          />
        )}
        {stops.map((stop, idx) => {
          const isPast = selectedStop !== null && idx < selectedStop
          const isCurrent = idx === selectedStop
          const isTerminal = idx === stops.length - 1
          const color = isCurrent
            ? (route?.color ?? '#27AE60')
            : isPast
              ? '#aaa'
              : isTerminal
                ? '#E67E22'
                : '#fff'
          const strokeColor = isCurrent ? (route?.color ?? '#27AE60') : '#888'
          return (
            <CircleMarker
              key={stop.id ?? idx}
              center={[stop.lat, stop.lng]}
              radius={isCurrent ? 10 : 7}
              pathOptions={{ fillColor: color, color: strokeColor, fillOpacity: 1, weight: 2 }}
              eventHandlers={{ click: () => onSelectStop(idx) }}
            />
          )
        })}
      </MapContainer>

      <div className={`map-sheet${selectedStop !== null ? ' open' : ''}`}>
        <div className="map-sheet-handle" />
        {selectedStopObj && (
          <>
            <div className="map-sheet-header">
              <div className="map-sheet-stop-num" style={{ background: route?.color ?? '#27AE60' }}>
                {selectedStop + 1}
              </div>
              <div className="map-sheet-stop-info">
                <div className="map-sheet-stop-name">{formatStopName(selectedStopObj.name)}</div>
                <div className="map-sheet-stop-sub">
                  {stops.length - selectedStop - 1} stop{stops.length - selectedStop - 1 !== 1 ? 's' : ''} remaining
                </div>
              </div>
              <button className="map-sheet-close" onClick={onDismiss} aria-label="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {etaLoading ? (
              <div className="map-sheet-eta-loading">
                <div className="spinner" />
                Calculating ETA…
              </div>
            ) : nextEta ? (
              <div
                className="map-sheet-eta"
                style={{ borderColor: route?.color ?? '#27AE60', color: route?.color ?? '#27AE60' }}
              >
                <div>
                  <div className="map-sheet-eta-label">Next stop ETA</div>
                  <div className="map-sheet-eta-dest">{formatStopName(stops[selectedStop + 1]?.name ?? '')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="map-sheet-eta-value">{formatETA(nextEta)}</div>
                  {nextEta.confidence > 0 && (
                    <div className="map-sheet-eta-conf">{formatConfidence(nextEta)}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="map-sheet-eta" style={{ borderColor: 'var(--line)', color: 'var(--ink-3)' }}>
                <div className="map-sheet-eta-label">Tap "I'm here" to calculate ETA</div>
              </div>
            )}

            <div className="map-sheet-actions">
              <button
                className="map-sheet-btn here"
                onClick={() => onSelectStop(selectedStop)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
                </svg>
                I'm here
              </button>
              <button
                className="map-sheet-btn bus"
                style={{ background: route?.color ?? '#27AE60' }}
                onClick={() => onArrived(selectedStop, selectedStopObj.name)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="14" rx="2"/>
                  <path d="M2 10h20M8 4v6M16 4v6"/>
                  <circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>
                </svg>
                Bus here
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
