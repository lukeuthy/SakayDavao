import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatStopName, formatDistance, bearing } from '../utils/routeHelpers.js'
import { formatETA, formatConfidence } from '../utils/eta.js'

const PASSED_COLOR = '#94a3b8' // muted slate for already-passed segments

// Fix Leaflet asset paths broken by Vite's asset hashing
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
})

function stopIcon(idx, isCurrent, isPast, color) {
  const size = isCurrent ? 32 : 22
  const bg = isCurrent ? color : isPast ? '#d1d5db' : '#ffffff'
  const border = isPast ? '#9ca3af' : color
  const text = isCurrent ? '#ffffff' : isPast ? '#6b7280' : color
  const ring = isCurrent
    ? `box-shadow:0 0 0 4px ${color}33,0 2px 10px rgba(0,0,0,0.35);`
    : 'box-shadow:0 1px 5px rgba(0,0,0,0.2);'
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2.5px solid ${border};display:flex;align-items:center;justify-content:center;font-size:${isCurrent ? 12 : 9}px;font-weight:700;color:${text};font-family:-apple-system,BlinkMacSystemFont,sans-serif;${ring}transition:all 0.2s;">${idx + 1}</div>`,
  })
}

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length >= 2) {
      map.fitBounds(L.latLngBounds(positions), { padding: [48, 48], maxZoom: 15 })
    }
  }, [])
  return null
}

function PanToStop({ position }) {
  const map = useMap()
  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.4 })
  }, [position?.[0], position?.[1]])
  return null
}

function userIcon() {
  return L.divIcon({
    className: '',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 4px rgba(37,99,235,0.25),0 1px 4px rgba(0,0,0,0.3);"></div>`,
  })
}

// Small chevron pointing in the travel direction (rotated by compass heading).
function arrowIcon(deg, arrowColor) {
  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div style="width:16px;height:16px;display:flex;align-items:center;justify-content:center;color:${arrowColor};transform:rotate(${deg}deg);">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 14 12 8 18 14"/></svg>
    </div>`,
  })
}

export default function RouteMap({
  route,
  selectedStop,
  etas,
  etaLoading,
  onSelectStop,
  onDismiss,
  onArrived,
  userPos,
  onLocate,
  locating,
  nearest,
}) {
  const stops = route.stops
  const color = route.color || '#16613a'
  const mapRef = useRef(null)

  const rawPts = route.rawPoints ?? stops
  const stopPositions = stops.map(s => [s.latitude, s.longitude])
  const selectedPos = selectedStop !== null ? stopPositions[selectedStop] : null
  const userLatLng = userPos ? [userPos.latitude, userPos.longitude] : null
  const nearestPos = nearest && stopPositions[nearest.index] ? stopPositions[nearest.index] : null

  // Map each stop's ordinal → its index within rawPts, so we can split the
  // polyline at the selected ("you are here") stop into passed vs upcoming.
  const stopRawIndices = []
  rawPts.forEach((p, i) => { if (p.kind === 'stop' || !p.kind) stopRawIndices.push(i) })
  const splitRaw = selectedStop !== null ? (stopRawIndices[selectedStop] ?? null) : null

  const toLatLng = p => [p.latitude, p.longitude]
  const passedPts = splitRaw !== null ? rawPts.slice(0, splitRaw + 1).map(toLatLng) : []
  const upcomingPts = splitRaw !== null ? rawPts.slice(splitRaw).map(toLatLng) : rawPts.map(toLatLng)

  // Direction arrows — sample ~9 points evenly, orient by heading (or bearing).
  const ARROW_TARGET = 9
  const stride = Math.max(1, Math.floor(rawPts.length / ARROW_TARGET))
  const arrows = []
  for (let i = stride; i < rawPts.length - 1; i += stride) {
    const p = rawPts[i]
    const deg = typeof p.heading === 'number'
      ? p.heading
      : bearing(p.latitude, p.longitude, rawPts[i + 1].latitude, rawPts[i + 1].longitude)
    const isPassed = splitRaw !== null && i < splitRaw
    arrows.push({ key: p.id ?? i, pos: toLatLng(p), deg, color: isPassed ? PASSED_COLOR : color })
  }

  // Fit the route to view on mount; re-fit to include the user + nearest stop
  // whenever a new location is acquired.
  const fitAll = () => {
    const m = mapRef.current
    if (!m) return
    const pts = [...stopPositions]
    if (userLatLng) pts.push(userLatLng)
    if (pts.length >= 2) m.fitBounds(L.latLngBounds(pts), { padding: [48, 48], maxZoom: 15 })
  }
  useEffect(() => {
    if (!userLatLng || !mapRef.current) return
    const pts = nearestPos ? [userLatLng, nearestPos] : [userLatLng, ...stopPositions]
    if (pts.length >= 2) mapRef.current.fitBounds(L.latLngBounds(pts), { padding: [64, 64], maxZoom: 16 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos?.latitude, userPos?.longitude])

  const nextEta = selectedStop !== null && etas.length > 0 ? etas[0] : null
  const finalEta = etas.length > 1 ? etas[etas.length - 1] : null

  return (
    <div className="route-map-wrap">
      <MapContainer
        ref={mapRef}
        center={stopPositions[0] ?? [7.07, 125.61]}
        zoom={13}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <FitBounds positions={stopPositions} />
        {selectedPos && <PanToStop position={selectedPos} />}

        {/* Passed segment (muted) + upcoming segment (route color) */}
        {passedPts.length > 1 && (
          <Polyline
            positions={passedPts}
            pathOptions={{ color: PASSED_COLOR, weight: 5, opacity: 0.55, lineJoin: 'round', lineCap: 'round' }}
          />
        )}
        <Polyline
          positions={upcomingPts}
          pathOptions={{ color, weight: 5, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }}
        />

        {/* Direction-of-travel arrows */}
        {arrows.map(a => (
          <Marker key={`arr-${a.key}`} position={a.pos} icon={arrowIcon(a.deg, a.color)} interactive={false} />
        ))}

        {/* User → nearest-stop connector (dashed) */}
        {userLatLng && nearestPos && (
          <Polyline
            positions={[userLatLng, nearestPos]}
            pathOptions={{ color: '#2563eb', weight: 3, opacity: 0.7, dashArray: '4 8', lineCap: 'round' }}
          />
        )}

        {stops.map((stop, idx) => (
          <Marker
            key={stop.id ?? idx}
            position={stopPositions[idx]}
            icon={stopIcon(
              idx,
              idx === selectedStop,
              selectedStop !== null && idx < selectedStop,
              color,
            )}
            eventHandlers={{ click: () => onSelectStop(idx) }}
          />
        ))}

        {userLatLng && <Marker position={userLatLng} icon={userIcon()} />}
      </MapContainer>

      {/* Map controls — top-right stack: locate + recenter */}
      <div className="map-controls">
        {onLocate && (
          <button
            className="map-control-btn"
            onClick={onLocate}
            disabled={locating}
            aria-label="Find my location"
          >
            {locating ? (
              <div className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
            )}
          </button>
        )}
        <button
          className="map-control-btn"
          onClick={fitAll}
          aria-label="Recenter on route"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/>
          </svg>
        </button>
      </div>

      {/* Distance to nearest stop — top-left badge after locating */}
      {nearest && nearestPos && (
        <div className="map-distance-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          <span>{formatDistance(nearest.distance)} to nearest stop</span>
        </div>
      )}

      {/* Bottom sheet */}
      <div className={`map-sheet${selectedStop !== null ? ' open' : ''}`}>
        <div className="map-sheet-handle" />

        {selectedStop !== null && (
          <>
            <div className="map-sheet-header">
              <div
                className="map-sheet-stop-num"
                style={{ background: color }}
              >
                {selectedStop + 1}
              </div>
              <div className="map-sheet-stop-info">
                <div className="map-sheet-stop-name">
                  {formatStopName(stops[selectedStop]?.name ?? '')}
                </div>
                <div className="map-sheet-stop-sub">
                  Stop {selectedStop + 1} of {stops.length}
                  {finalEta && ` · ${formatETA(finalEta)} to final stop`}
                </div>
              </div>
              <button className="map-sheet-close" onClick={onDismiss} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {etaLoading ? (
              <div className="map-sheet-eta-loading">
                <div className="spinner" style={{ width: 16, height: 16, borderTopColor: color }} />
                <span>Calculating ETA…</span>
              </div>
            ) : nextEta ? (
              <div className="map-sheet-eta" style={{ background: color + '18', borderColor: color + '40' }}>
                <div>
                  <div className="map-sheet-eta-label" style={{ color }}>Next stop ETA</div>
                  <div className="map-sheet-eta-value" style={{ color }}>
                    {formatETA(nextEta)}
                    {nextEta.confidence > 0 && (
                      <span className="map-sheet-eta-conf"> {formatConfidence(nextEta)}</span>
                    )}
                  </div>
                  <div className="map-sheet-eta-dest">
                    to {formatStopName(stops[selectedStop + 1]?.name ?? 'next stop')}
                  </div>
                </div>
                <div className={`eta-source-chip ${nextEta.source === 'onnx' ? 'ai' : nextEta.source === 'historical' ? 'crowd' : 'est'}`}>
                  {nextEta.source === 'onnx' ? 'AI model' : nextEta.source === 'historical' ? 'Crowd' : 'Estimate'}
                </div>
              </div>
            ) : null}

            <div className="map-sheet-actions">
              <button
                className="map-sheet-btn here"
                onClick={() => onSelectStop(selectedStop)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                </svg>
                I'm here
              </button>
              <button
                className="map-sheet-btn bus"
                style={{ background: color, borderColor: color }}
                onClick={() => onArrived(selectedStop, stops[selectedStop]?.name ?? '')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M8 19v2M16 19v2M2 10h20M7 5V3M17 5V3"/>
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
