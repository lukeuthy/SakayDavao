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

// Representative service windows (consistent across all routes in the dataset).
const AM_WINDOW = { start: 6 * 60, end: 10 * 60 }   // 06:00–10:00
const PM_WINDOW = { start: 16 * 60, end: 21 * 60 }  // 16:00–21:00

export function isAMTime() {
  const now = nowMinutes()
  return now >= AM_WINDOW.start && now <= AM_WINDOW.end
}

export function isPMTime() {
  const now = nowMinutes()
  return now >= PM_WINDOW.start && now <= PM_WINDOW.end
}

/**
 * Time-aware period ('AM' | 'PM'): the active bucket when inside a service
 * window, otherwise the NEXT bucket to open — so once the AM window is over we
 * show PM, and once PM is over we show the next day's AM (wraps past midnight).
 */
export function suggestedPeriod() {
  const now = nowMinutes()
  if (now >= AM_WINDOW.start && now <= AM_WINDOW.end) return 'AM'
  if (now >= PM_WINDOW.start && now <= PM_WINDOW.end) return 'PM'
  const DAY = 1440
  const untilAM = (AM_WINDOW.start - now + DAY) % DAY
  const untilPM = (PM_WINDOW.start - now + DAY) % DAY
  return untilAM <= untilPM ? 'AM' : 'PM'
}

/** Are we currently inside ANY service window? */
export function isWithinServiceHours() {
  return isAMTime() || isPMTime()
}

/** Short label for a period's representative hours, e.g. "6:00 – 10:00 AM". */
export function periodWindowLabel(period) {
  const w = period === 'PM' ? PM_WINDOW : AM_WINDOW
  return formatOperatingHours(toHHMM(w.start), toHHMM(w.end))
}

function toHHMM(mins) {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
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
