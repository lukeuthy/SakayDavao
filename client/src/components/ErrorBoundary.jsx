import { Component } from 'react'

/**
 * App-level error boundary. Catches render-time crashes (e.g. a malformed route
 * file or a Leaflet hiccup) and shows a recoverable fallback instead of a blank
 * white screen, so the PWA still feels alive offline.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-fallback" role="alert">
          <div className="error-fallback-card">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <path d="M12 9v4M12 17h.01" />
            </svg>
            <h1 className="error-fallback-title">Something went wrong</h1>
            <p className="error-fallback-desc">
              The app hit an unexpected error. Your saved routes and reports are safe.
            </p>
            <button type="button" className="error-fallback-btn" onClick={this.handleReload}>
              Reload SakayDavao
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
