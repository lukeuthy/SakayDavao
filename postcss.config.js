// Vite picks this up automatically. Two jobs, both for browser compatibility
// (especially older iOS Safari, which is why the app "looked wrong" on iPhone):
//   1. postcss-oklab-function — emits an rgb() fallback *before* every oklch()
//      color (preserve: true keeps the oklch line for modern browsers).
//   2. autoprefixer — adds vendor prefixes (e.g. -webkit-backdrop-filter) per
//      the browserslist targets in .browserslistrc.
export default {
  plugins: {
    '@csstools/postcss-oklab-function': { preserve: true },
    autoprefixer: {},
  },
}
