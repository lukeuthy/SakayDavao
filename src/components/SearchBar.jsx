export default function SearchBar({ value, onChange, placeholder = 'Search routes or stops…' }) {
  return (
    <div className="search-wrap" style={{ position: 'relative' }}>
      <span className="search-icon" style={{ position: 'absolute', left: 28, top: '50%', transform: 'translateY(-50%)' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
      </span>
      <input
        className="search-input"
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search"
        autoComplete="off"
      />
    </div>
  )
}
