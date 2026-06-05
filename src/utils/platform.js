// Lightweight platform detection for install affordances.
// iOS Safari never fires `beforeinstallprompt`, so we detect it explicitly
// to show a manual "Add to Home Screen" guide instead.

export function isIos() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  if (/iphone|ipad|ipod/i.test(ua)) return true
  // iPadOS 13+ reports as desktop Safari ("MacIntel") but has touch points.
  return navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

export function isInStandaloneMode() {
  if (typeof window === 'undefined') return false
  // iOS uses the non-standard navigator.standalone; everything else uses display-mode.
  return (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  )
}
