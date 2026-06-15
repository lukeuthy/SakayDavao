import { defineConfig } from 'vitest/config'

// Isolated from vite.config.js on purpose: unit tests don't need the PWA /
// ONNX-copy build pipeline, and loading those plugins would slow the runner.
export default defineConfig({
  test: {
    // Default to the fast Node environment; files that need a DOM/window opt in
    // per-file with a `// @vitest-environment jsdom` comment (see platform.test.js).
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    globals: false,
  },
})
