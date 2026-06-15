import { useState, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import Toast from './components/Toast.jsx'
import InstallBanner from './components/InstallBanner.jsx'
import IosInstallGuide from './components/IosInstallGuide.jsx'
import UpdatePrompt from './components/UpdatePrompt.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import ConsentModal from './components/ConsentModal.jsx'
import { useToast, ToastContext } from './hooks/useToast.js'

// Lazy-load pages so the heavy deps (Leaflet in RouteDetail) split out of the
// initial bundle and load on demand.
const Home = lazy(() => import('./pages/Home.jsx'))
const RoutesPage = lazy(() => import('./pages/RoutesPage.jsx'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage.jsx'))
const RouteDetail = lazy(() => import('./pages/RouteDetail.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const TripPlanner = lazy(() => import('./pages/TripPlanner.jsx'))

function PageFallback() {
  return (
    <div className="loading-row" role="status" aria-live="polite">
      <div className="spinner" />
      <span>Loading…</span>
    </div>
  )
}

function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
}

function OfflineBar() {
  return (
    <div className="offline-bar" role="status">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.56 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>
      </svg>
      Offline — showing cached data
    </div>
  )
}

function TopNav() {
  return (
    <header className="top-nav" aria-label="Main navigation">
      <NavLink to="/" className="top-nav-brand" end>
        <div className="top-nav-brand-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="14" rx="2"/>
            <path d="M2 10h20M8 4v6M16 4v6"/>
            <circle cx="7" cy="17.5" r="1.5"/><circle cx="17" cy="17.5" r="1.5"/>
          </svg>
        </div>
        SakayDavao
      </NavLink>
      <nav className="top-nav-links">
        <NavLink to="/" end className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
        <NavLink to="/routes" className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}>Routes</NavLink>
        <NavLink to="/plan" className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}>Plan</NavLink>
        <NavLink to="/favorites" className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}>Saved</NavLink>
        <NavLink to="/settings" className={({ isActive }) => `top-nav-link${isActive ? ' active' : ''}`}>Settings</NavLink>
      </nav>
    </header>
  )
}

function BottomNav() {
  const { pathname } = useLocation()
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
        <NavLink to="/plan" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
          <span className="nav-tab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h4a4 4 0 0 0 4-4V9"/>
            </svg>
          </span>
          <span className="nav-tab-label">Plan</span>
        </NavLink>
        <NavLink to="/favorites" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
          <span className="nav-tab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </span>
          <span className="nav-tab-label">Saved</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
          <span className="nav-tab-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </span>
          <span className="nav-tab-label">Settings</span>
        </NavLink>
      </nav>
  )
}

export default function App() {
  const toast = useToast()
  const isOnline = useOnlineStatus()

  return (
    <ToastContext.Provider value={toast}>
      <div className="app">
        <TopNav />
        {!isOnline && <OfflineBar />}
        <ErrorBoundary>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/routes" element={<RoutesPage />} />
              <Route path="/plan" element={<TripPlanner />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/route/:routeNumber/:period" element={<RouteDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
        <BottomNav />
        <ConsentModal />
        <InstallBanner />
        <IosInstallGuide />
        <UpdatePrompt />
        <Toast />
      </div>
    </ToastContext.Provider>
  )
}
