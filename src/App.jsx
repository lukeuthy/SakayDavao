import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import RouteDetail from './pages/RouteDetail.jsx'
import ContributionHistory from './pages/ContributionHistory.jsx'
import Toast from './components/Toast.jsx'
import { useToast } from './hooks/useToast.js'
import { ToastContext } from './hooks/useToast.js'

export default function App() {
  const toast = useToast()
  return (
    <ToastContext.Provider value={toast}>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/route/:routeNumber/:period" element={<RouteDetail />} />
          <Route path="/history" element={<ContributionHistory />} />
        </Routes>
        <Toast />
      </div>
    </ToastContext.Provider>
  )
}
