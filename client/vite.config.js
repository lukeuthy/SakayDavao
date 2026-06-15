import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { qrcode } from 'vite-plugin-qrcode'

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Build a NetworkFirst SW cache rule for an optional feed origin, when configured.
  // Both feeds are opt-in; nothing is cached from a hardcoded third-party origin.
  const feedCaching = (url, cacheName, maxAgeSeconds, maxEntries) => {
    if (!url) return []
    try {
      const origin = new URL(url).origin
      return [{
        urlPattern: new RegExp('^' + escapeRegex(origin)),
        handler: 'NetworkFirst',
        options: {
          cacheName,
          expiration: { maxEntries, maxAgeSeconds },
          networkTimeoutSeconds: 5,
        },
      }]
    } catch {
      return [] // invalid URL → skip; the app stays in its offline fallback
    }
  }

  // Real-time vehicle feed (short TTL) and remote routes feed (1-day TTL).
  const realtimeCaching = feedCaching(env.VITE_REALTIME_URL, 'realtime-cache', 60, 10)
  const routesCaching = feedCaching(
    env.VITE_ROUTES_URL || env.VITE_S3_ROUTES_URL,
    'routes-api-cache', 24 * 60 * 60, 20,
  )

  // Optional dev-server tunnel host(s) (e.g. ngrok), comma-separated. Kept out of
  // source so a personal tunnel URL is never committed. Dev server only.
  const devAllowedHosts = (env.VITE_DEV_ALLOWED_HOSTS || '')
    .split(',').map(s => s.trim()).filter(Boolean)

  return {
    plugins: [
      react(),
      qrcode(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icons/*.png', 'icons/*.svg'],
        manifest: {
          name: 'SakayDavao',
          short_name: 'SakayDavao',
          description: 'Know when your bus arrives — offline ETA estimator for Davao City free bus routes.',
          theme_color: '#16613a',
          background_color: '#f0fdf4',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          runtimeCaching: [
            ...routesCaching,
            ...realtimeCaching,
          ],
        },
      }),
    ],
    server: {
      // Empty unless VITE_DEV_ALLOWED_HOSTS is set (e.g. an ngrok tunnel host).
      allowedHosts: devAllowedHosts,
    },
  }
})
