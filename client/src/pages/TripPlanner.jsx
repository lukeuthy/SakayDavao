import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useRoutes } from '../hooks/useRoutes.js'
import { useContributions } from '../hooks/useContributions.js'
import { buildPlaces, planTrip } from '../utils/tripPlanner.js'
import EmptyState from '../components/EmptyState.jsx'
import { RouteIcon, SwapIcon, ArrowRightIcon, ClockIcon, BusIcon, PinIcon } from '../components/Icons.jsx'

/** Autocomplete picker over the deduplicated place list. */
function PlacePicker({ label, places, value, onChange, exclude }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const onDoc = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const matches = useMemo(() => {
    const q = query.toLowerCase().trim()
    return places
      .filter(p => p.id !== exclude?.id && (!q || p.name.toLowerCase().includes(q)))
      .slice(0, 8)
  }, [query, places, exclude])

  const pick = p => { onChange(p); setQuery(''); setOpen(false) }

  return (
    <div className="plan-field" ref={wrapRef}>
      <label className="plan-field-label">{label}</label>
      {value ? (
        <button type="button" className="plan-field-chip" onClick={() => { onChange(null); setOpen(true) }}>
          <PinIcon size={14} />
          <span>{value.name}</span>
          <span className="plan-field-clear" aria-hidden="true">×</span>
        </button>
      ) : (
        <div className="plan-field-input-wrap">
          <input
            className="plan-field-input"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder={`Choose ${label.toLowerCase()}…`}
            aria-label={label}
          />
          {open && matches.length > 0 && (
            <ul className="plan-suggestions">
              {matches.map(p => (
                <li key={p.id}>
                  <button type="button" className="plan-suggestion" onClick={() => pick(p)}>
                    <PinIcon size={13} />
                    <span>{p.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function ItineraryCard({ itinerary }) {
  const { legs, totalMinutes, transfers } = itinerary
  return (
    <div className="itinerary-card">
      <div className="itinerary-summary">
        <span className="itinerary-total"><ClockIcon size={14} /> ~{totalMinutes} min</span>
        <span className="itinerary-transfers">
          {transfers === 0 ? 'Direct' : `${transfers} transfer${transfers > 1 ? 's' : ''}`}
        </span>
      </div>
      <div className="itinerary-legs">
        {legs.map((leg, i) => (
          <div className="itinerary-leg-row" key={`${leg.routeNumber}-${leg.fromIdx}-${leg.toIdx}`}>
            {i > 0 && (
              <div className="itinerary-transfer-note">
                <SwapIcon size={13} /> Transfer at {leg.fromName}
              </div>
            )}
            <Link
              to={`/route/${leg.routeNumber}/${leg.period}?stop=${leg.fromIdx}`}
              className="itinerary-leg"
              style={{ borderLeftColor: leg.color }}
            >
              <span className="itinerary-leg-badge" style={{ background: leg.color }}>
                {leg.routeNumber}
              </span>
              <span className="itinerary-leg-body">
                <span className="itinerary-leg-path">
                  {leg.fromName} <ArrowRightIcon size={13} /> {leg.toName}
                </span>
                <span className="itinerary-leg-meta">
                  <BusIcon size={12} /> {leg.stopCount} stop{leg.stopCount !== 1 ? 's' : ''} · ~{leg.etaMinutes} min
                </span>
              </span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TripPlanner() {
  const { routeGroups } = useRoutes()
  const { contributions } = useContributions()

  const { places } = useMemo(() => buildPlaces(routeGroups), [routeGroups])

  const [origin, setOrigin] = useState(null)
  const [dest, setDest] = useState(null)
  const [results, setResults] = useState(null) // null = not searched yet
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!origin || !dest) { setResults(null); return }
    let cancelled = false
    setLoading(true)
    planTrip(routeGroups, origin, dest, contributions)
      .then(r => { if (!cancelled) setResults(r) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [origin, dest, routeGroups, contributions])

  const swap = () => { setOrigin(dest); setDest(origin) }

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-title">Plan a trip</div>
          <div className="page-subtitle">
            Across all DC Bus routes · both directions
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="plan-form">
          <PlacePicker label="From" places={places} value={origin} onChange={setOrigin} exclude={dest} />
          <button type="button" className="plan-swap" onClick={swap} aria-label="Swap origin and destination" disabled={!origin && !dest}>
            <SwapIcon size={16} />
          </button>
          <PlacePicker label="To" places={places} value={dest} onChange={setDest} exclude={origin} />
        </div>

        {loading && (
          <div className="loading-row">
            <div className="spinner" />
            <span>Finding routes…</span>
          </div>
        )}

        {!loading && results !== null && results.length > 0 && (
          <>
            <div className="section-header">
              {results.length} option{results.length !== 1 ? 's' : ''}
            </div>
            <div className="itinerary-list">
              {results.map(it => (
                <ItineraryCard
                  key={it.legs.map(l => `${l.routeNumber}:${l.fromIdx}`).join('>')}
                  itinerary={it}
                />
              ))}
            </div>
          </>
        )}

        {!loading && results !== null && results.length === 0 && (
          <EmptyState
            icon={<RouteIcon />}
            title="No route found"
            desc="No direct or single-transfer trip connects these stops on the current schedule. Try nearby stops."
          />
        )}

        {results === null && !loading && (
          <EmptyState
            icon={<RouteIcon />}
            title="Where to?"
            desc="Pick a start and destination stop to see which buses get you there."
          />
        )}
        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
