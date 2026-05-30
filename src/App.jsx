import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Home from './pages/Home.jsx'
import RoutesPage from './pages/RoutesPage.jsx'
import FavoritesPage from './pages/FavoritesPage.jsx'
import RouteDetail from './pages/RouteDetail.jsx'
import ContributionHistory from './pages/ContributionHistory.jsx'
import Toast from './components/Toast.jsx'
import InstallBanner from './components/InstallBanner.jsx'
import { useToast, ToastContext } from './hooks/useToast.js'

function BottomNav() {
  const { pathname } = useLocation()
  // Hide on route detail pages
  if (pathname.startsWith('/route/')) return null

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <NavLink to="/" end className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
        <span className="nav-tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </span>
        <span className="nav-tab-label">Home</span>
      </NavLink>

      <NavLink to="/routes" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
        <span className="nav-tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path d="M8 19v2M16 19v2M2 10h20M7 5V3M17 5V3"/>
          </svg>
        </span>
        <span className="nav-tab-label">Routes</span>
      </NavLink>

      <NavLink to="/favorites" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
        <span className="nav-tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </span>
        <span className="nav-tab-label">Saved</span>
      </NavLink>

      <NavLink to="/history" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
        <span className="nav-tab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </span>
        <span className="nav-tab-label">History</span>
      </NavLink>
    </nav>
  )
}

export default function App() {
  const toast = useToast()
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return (
    <ToastContext.Provider value={toast}>
      <div className="app">
        {!online && <div className="offline-bar">📡 Offline — showing bundled data</div>}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/route/:routeNumber/:period" element={<RouteDetail />} />
          <Route path="/history" element={<ContributionHistory />} />
        </Routes>
        <InstallBanner />
        <BottomNav />
        <Toast />
      </div>
    </ToastContext.Provider>
  )
}
