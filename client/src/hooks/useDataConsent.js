import { useSyncExternalStore, useCallback } from 'react'

// One shared consent flag for anonymous data sharing: 'unset' | 'granted' | 'denied'.
// Backed by a tiny module-level store so the consent modal, Settings toggle, and the
// auto-collect hook all stay in sync instantly (no prop drilling, no context).

const KEY = 'sakay_data_consent'
const listeners = new Set()

function read() {
  try { return localStorage.getItem(KEY) || 'unset' } catch { return 'unset' }
}
function write(value) {
  try { localStorage.setItem(KEY, value) } catch {}
  listeners.forEach(fn => fn())
}
function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Sync read for non-React callers (e.g. the upload gate). True only when granted. */
export function isSharingEnabled() {
  return read() === 'granted'
}

export function useDataConsent() {
  const consent = useSyncExternalStore(subscribe, read, () => 'unset')
  const grant = useCallback(() => write('granted'), [])
  const deny = useCallback(() => write('denied'), [])
  const setEnabled = useCallback((on) => write(on ? 'granted' : 'denied'), [])
  return {
    consent,
    decided: consent !== 'unset',
    enabled: consent === 'granted',
    grant,
    deny,
    setEnabled,
  }
}
