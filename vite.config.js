import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { qrcode } from 'vite-plugin-qrcode'

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Cache the optional real-time vehicle feed (NetworkFirst, short TTL) when configured.
  const realtimeCaching = []
  if (env.VITE_REALTIME_URL) {
    try {
      const origin = new URL(env.VITE_REALTIME_URL).origin
      realtimeCaching.push({
        urlPattern: new RegExp('^' + escapeRegex(origin)),
        handler: 'NetworkFirst',
        options: {
          cacheName: 'realtime-cache',
          expiration: { maxEntries: 10, maxAgeSeconds: 60 },
          networkTimeoutSeconds: 5,
        },
      })
    } catch {
      // invalid URL → skip; useRealtime stays in fallback mode
    }
  }

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
          globIgnores: ['**/onnx/**', '**/ort-wasm*'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/raw\.githubusercontent\.com\/ttg-eng\/routes/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'routes-api-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 24 * 60 * 60 },
                networkTimeoutSeconds: 5,
              },
            },
            {
              urlPattern: /\.wasm$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'wasm-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 7 * 24 * 60 * 60 },
              },
            },
            ...realtimeCaching,
          ],
        },
      }),
    ],
    optimizeDeps: {
      exclude: ['onnxruntime-web'],
    },
    server: {
      allowedHosts: ['shadily-tremor-booting.ngrok-free.dev'],
    },
  }
})
