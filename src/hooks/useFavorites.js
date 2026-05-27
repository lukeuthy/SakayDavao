import { useLocalStorage } from './useLocalStorage.js'
import { useCallback } from 'react'

const KEY = 'sakay_favorites'

export function useFavorites() {
  const [favorites, setFavorites] = useLocalStorage(KEY, [])

  const toggle = useCallback((routeNumber) => {
    setFavorites(prev => {
      const set = new Set(prev)
      if (set.has(routeNumber)) set.delete(routeNumber)
      else set.add(routeNumber)
      return Array.from(set)
    })
  }, [setFavorites])

  const isFavorite = useCallback((routeNumber) => {
    return favorites.includes(routeNumber)
  }, [favorites])

  return { favorites, toggle, isFavorite }
}
