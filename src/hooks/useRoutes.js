import { useState, useEffect } from 'react'
import { buildRouteGroups } from '../utils/routeHelpers.js'

// Import all local route JSON files as seed data
import R102AM from '../data/routes/R102-AM.json'
import R102PM from '../data/routes/R102-PM.json'
import R103AM from '../data/routes/R103-AM.json'
import R103PM from '../data/routes/R103-PM.json'
import R402AM from '../data/routes/R402-AM.json'
import R402PM from '../data/routes/R402-PM.json'
import R403AM from '../data/routes/R403-AM.json'
import R403PM from '../data/routes/R403-PM.json'
import R503AM from '../data/routes/R503-AM.json'
import R503PM from '../data/routes/R503-PM.json'
import R603AM from '../data/routes/R603-AM.json'
import R603PM from '../data/routes/R603-PM.json'
import R763AM from '../data/routes/R763-AM.json'
import R763PM from '../data/routes/R763-PM.json'
import R783AM from '../data/routes/R783-AM.json'
import R783PM from '../data/routes/R783-PM.json'
import R793AM from '../data/routes/R793-AM.json'
import R793PM from '../data/routes/R793-PM.json'

const SEED_FILES = [
  R102AM, R102PM, R103AM, R103PM,
  R402AM, R402PM, R403AM, R403PM,
  R503AM, R503PM, R603AM, R603PM,
  R763AM, R763PM, R783AM, R783PM,
  R793AM, R793PM,
]

// Override with VITE_ROUTES_URL in a .env file to point at a real routes endpoint;
// falls back to the placeholder (which fails silently → bundled seed data) when unset.
const REMOTE_URL = import.meta.env.VITE_ROUTES_URL || 'https://raw.githubusercontent.com/ttg-eng/routes/main/routes.json'
const LS_REMOTE_KEY = 'sakay_remote_routes'
const LS_UPDATED_KEY = 'sakay_routes_updated'

export function useRoutes() {
  // Start with seed data; may be overridden by cached remote data
  const [rawFiles, setRawFiles] = useState(() => {
    try {
      const cached = localStorage.getItem(LS_REMOTE_KEY)
      if (cached) return JSON.parse(cached)
    } catch {}
    return SEED_FILES
  })

  const [lastUpdated, setLastUpdated] = useState(() => localStorage.getItem(LS_UPDATED_KEY))
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [syncLoading, setSyncLoading] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!navigator.onLine) return
    setSyncLoading(true)
    fetch(REMOTE_URL, { signal: AbortSignal.timeout(8000) })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json() })
      .then(data => {
        // remote may be an array of route files or wrapped object
        const files = Array.isArray(data) ? data : data.routes ?? data
        if (Array.isArray(files) && files.length > 0) {
          setRawFiles(files)
          try {
            localStorage.setItem(LS_REMOTE_KEY, JSON.stringify(files))
            const ts = new Date().toISOString()
            localStorage.setItem(LS_UPDATED_KEY, ts)
            setLastUpdated(ts)
          } catch {}
        }
      })
      .catch(() => {}) // silently fall back to seed / cached data
      .finally(() => setSyncLoading(false))
  }, [])

  const routeGroups = buildRouteGroups(rawFiles)

  return { routeGroups, rawFiles, lastUpdated, isOnline, syncLoading }
}
