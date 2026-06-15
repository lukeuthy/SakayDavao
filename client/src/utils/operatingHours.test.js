import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  parseTime,
  isRouteActive,
  suggestedPeriod,
  isAMTime,
  isPMTime,
  isWithinServiceHours,
  formatOperatingHours,
  periodWindowLabel,
} from './operatingHours.js'

afterEach(() => vi.useRealTimers())

// Helper: freeze the clock at a given HH:MM on a fixed date.
function at(hhmm) {
  vi.setSystemTime(new Date(`2026-06-03T${hhmm}:00`))
}

describe('parseTime', () => {
  it('converts HH:MM to minutes-since-midnight', () => {
    expect(parseTime('00:00')).toBe(0)
    expect(parseTime('06:30')).toBe(390)
    expect(parseTime('20:00')).toBe(1200)
  })
})

describe('isRouteActive', () => {
  it('is true inside the window', () => {
    at('08:00')
    expect(isRouteActive('06:00', '20:00')).toBe(true)
  })
  it('is false before the window opens', () => {
    at('05:00')
    expect(isRouteActive('06:00', '20:00')).toBe(false)
  })
  it('is false after the window closes', () => {
    at('23:00')
    expect(isRouteActive('06:00', '20:00')).toBe(false)
  })
  it('is inclusive of the boundaries', () => {
    at('06:00')
    expect(isRouteActive('06:00', '20:00')).toBe(true)
  })
})

describe('AM/PM window helpers', () => {
  it('isAMTime true at 07:00, false at 17:00', () => {
    at('07:00'); expect(isAMTime()).toBe(true)
    at('17:00'); expect(isAMTime()).toBe(false)
  })
  it('isPMTime true at 17:00, false at 07:00', () => {
    at('17:00'); expect(isPMTime()).toBe(true)
    at('07:00'); expect(isPMTime()).toBe(false)
  })
  it('isWithinServiceHours false in the midday gap', () => {
    at('13:00')
    expect(isWithinServiceHours()).toBe(false)
  })
})

describe('suggestedPeriod', () => {
  it('returns AM inside the morning window', () => {
    at('07:00')
    expect(suggestedPeriod()).toBe('AM')
  })
  it('returns PM inside the evening window', () => {
    at('18:00')
    expect(suggestedPeriod()).toBe('PM')
  })
  it('shows the next window (PM) in the midday gap once AM is over', () => {
    // 13:00: AM window (06–10) has ended; PM (16–21) is next to open → PM
    at('13:00')
    expect(suggestedPeriod()).toBe('PM')
  })
  it('shows AM late at night once PM is over (wraps to next morning)', () => {
    // 23:00: PM window has ended; the next service to open is tomorrow's AM
    at('23:00')
    expect(suggestedPeriod()).toBe('AM')
  })
})

describe('formatOperatingHours / periodWindowLabel', () => {
  it('renders 12-hour labels', () => {
    expect(formatOperatingHours('06:00', '20:00')).toBe('6:00 AM – 8:00 PM')
  })
  it('keeps non-zero minutes', () => {
    expect(formatOperatingHours('06:30', '21:15')).toBe('6:30 AM – 9:15 PM')
  })
  it('periodWindowLabel uses the representative windows', () => {
    expect(periodWindowLabel('AM')).toBe('6:00 AM – 10:00 AM')
    expect(periodWindowLabel('PM')).toBe('4:00 PM – 9:00 PM')
  })
})
