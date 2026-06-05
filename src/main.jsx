import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <HashRouter>
    <App />
  </HashRouter>,
)

// ── Dismiss the launch splash once the app has painted ──
// Keep it on-screen for a brief minimum so it never flashes on fast loads, but
// don't wait on window.load (which would block on fonts/network).
const SPLASH_MIN_MS = 700
const splashStart = performance.now()
const splash = document.getElementById('splash')
if (splash) {
  const wait = Math.max(0, SPLASH_MIN_MS - (performance.now() - splashStart))
  // Two rAFs ensure the React tree has actually painted before we start fading.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    setTimeout(() => {
      splash.classList.add('splash--hide')
      splash.addEventListener('transitionend', () => splash.remove(), { once: true })
      setTimeout(() => splash.remove(), 600) // fallback if transitionend doesn't fire
    }, wait)
  }))
}
