// @vitest-environment jsdom
// platform.js reads window.navigator / window.matchMedia, so this file needs a DOM.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { isIos, isInStandaloneMode } from './platform.js'

afterEach(() => vi.unstubAllGlobals())

function setNavigator(props) {
  vi.stubGlobal('navigator', {
    userAgent: '', platform: '', maxTouchPoints: 0, ...props,
  })
}

describe('isIos', () => {
  it('true for an iPhone UA', () => {
    setNavigator({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' })
    expect(isIos()).toBe(true)
  })
  it('true for an iPad UA', () => {
    setNavigator({ userAgent: 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X)' })
    expect(isIos()).toBe(true)
  })
  it('true for iPadOS-13+ posing as desktop (MacIntel + touch points)', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari',
      platform: 'MacIntel', maxTouchPoints: 5,
    })
    expect(isIos()).toBe(true)
  })
  it('false for a real Mac (MacIntel, no touch)', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) Safari',
      platform: 'MacIntel', maxTouchPoints: 0,
    })
    expect(isIos()).toBe(false)
  })
  it('false for Android', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel) Chrome',
      platform: 'Linux armv8l', maxTouchPoints: 5,
    })
    expect(isIos()).toBe(false)
  })
  it('false for Windows desktop', () => {
    setNavigator({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome',
      platform: 'Win32', maxTouchPoints: 0,
    })
    expect(isIos()).toBe(false)
  })
})

describe('isInStandaloneMode', () => {
  it('true when navigator.standalone is true (installed iOS PWA)', () => {
    setNavigator({ standalone: true })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(isInStandaloneMode()).toBe(true)
  })
  it('true when display-mode: standalone matches (installed elsewhere)', () => {
    setNavigator({ standalone: false })
    vi.stubGlobal('matchMedia', (q) => ({ matches: q.includes('standalone') }))
    expect(isInStandaloneMode()).toBe(true)
  })
  it('false in a normal browser tab', () => {
    setNavigator({ standalone: false })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    expect(isInStandaloneMode()).toBe(false)
  })
})
