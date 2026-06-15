import { useDataConsent } from '../hooks/useDataConsent.js'

// One-time, up-front ask. Shown until the user decides (then never again unless they
// change it in Settings). Keeps the rest of the app free of per-action prompts.
export default function ConsentModal() {
  const { consent, grant, deny } = useDataConsent()
  if (consent !== 'unset') return null

  return (
    <div className="consent-overlay" role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className="consent-card">
        <div className="consent-icon" aria-hidden="true">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="5" width="20" height="14" rx="2.5" /><path d="M2 10h20M8 5v5M16 5v5" />
            <circle cx="7" cy="17.5" r="1.4" /><circle cx="17" cy="17.5" r="1.4" />
          </svg>
        </div>
        <h2 id="consent-title" className="consent-title">Help improve bus times?</h2>
        <p className="consent-body">
          While you have a route open, SakayDavao can anonymously note the stop you're near
          and the time — so arrival estimates get better for everyone. No account, no name,
          and never your exact location. You can turn this off anytime in Settings.
        </p>
        <div className="consent-actions">
          <button type="button" className="consent-btn ghost" onClick={deny}>Not now</button>
          <button type="button" className="consent-btn primary" onClick={grant}>Allow</button>
        </div>
      </div>
    </div>
  )
}
