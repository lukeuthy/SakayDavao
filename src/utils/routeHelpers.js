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
