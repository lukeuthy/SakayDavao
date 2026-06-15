import { useState, useCallback, useEffect } from 'react'

/**
 * Geolocation hook with explicit permission + error states.
 *
 * Returns:
 *   position    — { latitude, longitude, accuracy } | null
 *   error       — human-readable error string | null
 *   loading     — true while a request is in flight
 *   permission  — 'prompt' | 'granted' | 'denied' | 'unsupported'
 *   requestLocation() — triggers a one-shot getCurrentPosition; resolves to coords | null
 *   clear()     — drops the current position (e.g. on unmount of a feature)
 *
 * Note: the browser only exposes geolocation in a secure context (HTTPS or
 * localhost). Testing over a plain http://<LAN-IP> dev URL on a phone will
 * fail with a permission/secure-context error — the deployed HTTPS PWA works.
 */
export function useGeolocation() {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [permission, setPermission] = useState('prompt')

  // Track the live permission state when the Permissions API is available.
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setPermission('unsupported')
      return
    }
    if (!navigator.permissions?.query) return
    let status
    let cancelled = false
    navigator.permissions
      .query({ name: 'geolocation' })
      .then(s => {
        if (cancelled) return
        status = s
        setPermission(s.state)
        s.onchange = () => setPermission(s.state)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (status) status.onchange = null
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setPermission('unsupported')
      setError('Location is not supported on this device.')
      return Promise.resolve(null)
    }
    setLoading(true)
    setError(null)
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const coords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }
          setPosition(coords)
          setPermission('granted')
          setLoading(false)
          resolve(coords)
        },
        err => {
          setLoading(false)
          if (err.code === err.PERMISSION_DENIED) {
            setPermission('denied')
            setError('Location permission denied. Enable it in your browser settings.')
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setError('Location unavailable. Try again outdoors.')
          } else if (err.code === err.TIMEOUT) {
            setError('Location request timed out. Try again.')
          } else {
            setError('Could not get your location.')
          }
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      )
    })
  }, [])

  const clear = useCallback(() => {
    setPosition(null)
    setError(null)
  }, [])

  return { position, error, loading, permission, requestLocation, clear }
}
