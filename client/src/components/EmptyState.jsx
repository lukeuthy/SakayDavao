// Unified empty-state block — SVG icon in a soft circle, title, description.
// Replaces the per-page emoji empty states across Routes / Favorites / History.

export default function EmptyState({ icon, title, desc, children }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {desc && <div className="empty-desc">{desc}</div>}
      {children}
    </div>
  )
}
