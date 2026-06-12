import { useLocalStorage } from './useLocalStorage.js'
import { useCallback } from 'react'
import { uploadContribution } from '../lib/contributionsApi.js'

const KEY = 'sakay_contributions'

export function useContributions() {
  const [contributions, setContributions] = useLocalStorage(KEY, [])

  const addContribution = useCallback((routeNumber, routeName, stopIndex, stopName) => {
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      routeNumber,
      routeName,
      stopIndex,
      stopName,
      timestamp: Date.now(),
      dayOfWeek: new Date().getDay(),
      hour: new Date().getHours(),
      minute: new Date().getMinutes(),
    }
    setContributions(prev => [entry, ...prev].slice(0, 500)) // cap at 500
    uploadContribution(entry) // fire-and-forget sync to the contributions API
    return entry
  }, [setContributions])

  const clearAll = useCallback(() => setContributions([]), [setContributions])

  const countByRoute = useCallback((routeNumber) => {
    return contributions.filter(c => c.routeNumber === routeNumber).length
  }, [contributions])

  return { contributions, addContribution, clearAll, countByRoute }
}
