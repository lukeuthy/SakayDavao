export function parseTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function isRouteActive(startTime, endTime) {
  const now = nowMinutes()
  const start = parseTime(startTime)
  const end = parseTime(endTime)
  return now >= start && now <= end
}

export function isAMTime() {
  const h = new Date().getHours()
  return h >= 6 && h < 12
}

export function isPMTime() {
  const h = new Date().getHours()
  return h >= 16 && h < 21
}

export function suggestedPeriod() {
  return isPMTime() ? 'PM' : 'AM'
}

export function formatOperatingHours(startTime, endTime) {
  return `${fmt12(startTime)} – ${fmt12(endTime)}`
}

function fmt12(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}:00 ${ampm}` : `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}
