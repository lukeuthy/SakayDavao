// Derives the human-readable duration range from actual stop counts.
const DURATION_LOOKUP = {
  R102: [60, 70], R103: [45, 50],
  R402: [55, 65], R403: [65, 75],
  R503: [50, 60], R603: [35, 40],
  R763: [45, 55], R783: [60, 70],
  R793: [50, 60],
}

export function getStops(routeFile) {
  return routeFile.points.filter(p => p.kind === 'stop' || !p.kind)
}

export function buildRouteGroups(rawFiles) {
  const map = {}
  rawFiles.forEach(file => {
    const rn = file.route_number
    if (!map[rn]) map[rn] = { routeNumber: rn, name: file.name, color: file.color, am: null, pm: null }
    const stops = getStops(file)
    const period = file.time_period?.toUpperCase()
    const data = {
      routeNumber: rn,
      name: file.name,
      area: file.area,
      color: file.color,
      period,
      startTime: file.start_time,
      endTime: file.end_time,
      stops,
      rawPoints: file.points ?? stops,
      durationRange: DURATION_LOOKUP[rn] ?? [30, 60],
    }
    if (period === 'AM') map[rn].am = data
    else if (period === 'PM') map[rn].pm = data
  })
  return Object.values(map).sort((a, b) => a.routeNumber.localeCompare(b.routeNumber))
}

export function getRouteData(routeGroups, routeNumber, period) {
  const group = routeGroups.find(g => g.routeNumber === routeNumber)
  if (!group) return null
  return period === 'AM' ? group.am : group.pm
}

export function formatStopName(name) {
  return name.replace(/ Station$/i, '').trim()
}

/** Great-circle distance between two lat/lng points, in meters (haversine). */
export function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000 // earth radius in meters
  const toRad = d => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Finds the stop closest to a given coordinate.
 * @returns { index, distance } where distance is in meters, or null if no stops.
 */
export function nearestStop(stops, latitude, longitude) {
  if (!stops?.length) return null
  let best = null
  stops.forEach((s, index) => {
    if (typeof s.latitude !== 'number' || typeof s.longitude !== 'number') return
    const distance = haversineMeters(latitude, longitude, s.latitude, s.longitude)
    if (!best || distance < best.distance) best = { index, distance }
  })
  return best
}

/** Formats a meter distance into a short human label (e.g. "120 m", "1.4 km"). */
export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Initial compass bearing (degrees, 0=N clockwise) from point A → point B.
 * Used to orient direction-arrow markers when a point has no `heading` field.
 */
export function bearing(lat1, lon1, lat2, lon2) {
  const toRad = d => (d * Math.PI) / 180
  const φ1 = toRad(lat1)
  const φ2 = toRad(lat2)
  const Δλ = toRad(lon2 - lon1)
  const y = Math.sin(Δλ) * Math.cos(φ2)
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}
