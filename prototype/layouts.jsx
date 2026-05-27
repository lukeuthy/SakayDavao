// layouts.jsx — Five home-screen variants (A–E) + Routes modal (F)
//
// Each layout receives a shared `view` props bag:
//   route, eta { totalSec, minutes, label, percentToNext }, progress,
//   upcoming [{minutes}], saved, notify, color,
//   onOpenRoutes, onToggleNotify, onToggleSaved,
//   onZoomIn, onZoomOut, onRecenter, zoom
// ───────────────────────────────────────────────────────────────────

const fmtMin = (sec) => {
  const m = Math.max(0, Math.floor(sec / 60));
  const s = Math.max(0, Math.floor(sec % 60));
  return { m, s, label: `${m}:${String(s).padStart(2, '0')}` };
};

// Small reusable bits ────────────────────────────────────────────
function HamburgerBtn({ onClick, color = 'var(--ink-2)', bg = 'rgba(255,255,255,0.96)' }) {
  return (
    <button onClick={onClick} aria-label="Menu" style={{
      width: 40, height: 40, border: 0, background: bg, color,
      borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <svg width="16" height="14" viewBox="0 0 16 14"><path d="M0 1h16M0 7h16M0 13h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    </button>);

}
function BellBtn({ active, onClick, color = 'var(--ink-2)' }) {
  return (
    <button onClick={onClick} aria-label="Notify me" style={{
      width: 40, height: 40, border: 0,
      background: active ? 'var(--accent)' : 'rgba(255,255,255,0.96)',
      color: active ? '#fff' : color,
      borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.2s, color 0.2s'
    }}>
      <svg width="14" height="16" viewBox="0 0 14 16" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
        <path d="M2 12c0-3 1-7 5-7s5 4 5 7H2zM6 14h2c0 .8-.4 1.5-1 1.5S6 14.8 6 14z" strokeLinejoin="round" />
      </svg>
    </button>);

}
function StarBtn({ active, onClick }) {
  return (
    <button onClick={onClick} aria-label="Save stop" style={{
      width: 36, height: 36, border: '1px solid var(--line)',
      background: '#fff', borderRadius: 10, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? 'var(--accent)' : 'var(--ink-3)'
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
        <path d="M8 1.5l2 4.5 5 .5-3.7 3.3 1 5-4.3-2.5-4.3 2.5 1-5L1 6.5l5-.5 2-4.5z" strokeLinejoin="round" />
      </svg>
    </button>);

}
function RouteChip({ route, onClick, dark = false }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px 7px 9px',
      background: dark ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.96)',
      color: dark ? '#fff' : 'var(--ink)',
      border: 0, borderRadius: 999, boxShadow: 'var(--shadow-sm)',
      fontFamily: 'Geist', fontSize: 14, fontWeight: 500, cursor: 'pointer'
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 22, height: 22, borderRadius: 6, background: 'var(--primary)',
        color: '#fff', fontSize: 11, fontWeight: 600, fontFamily: 'Geist Mono'
      }}>{route.code}</span>
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{route.name}</span>
      </span>
      <svg width="9" height="9" viewBox="0 0 9 9" style={{ marginLeft: 2, opacity: 0.6 }}>
        <path d="M1 3l3.5 3.5L8 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      </svg>
    </button>);

}

// ─────────────────────────────────────────────────────────────────
// LAYOUT A · Classic stack
//   top-left controls, bottom ETA card, FAB for routes
// ─────────────────────────────────────────────────────────────────
function LayoutA(v) {
  return (
    <>
      <DavaoMap progress={v.progress} color={v.color} stops={v.stops} showStopLabels />
      {/* top-left controls cluster */}
      <div style={{ position: 'absolute', top: 62, left: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <HamburgerBtn />
        <BellBtn active={v.notify} onClick={v.onToggleNotify} />
        <button onClick={v.onRecenter} aria-label="Refresh" style={{
          width: 40, height: 40, border: 0, background: 'rgba(255,255,255,0.96)',
          borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          color: 'var(--ink-2)', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M14 6a6 6 0 10-1 5" /><path d="M14 1v5h-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <MapControls orientation="vertical" onZoomIn={v.onZoomIn} onZoomOut={v.onZoomOut} onRecenter={v.onRecenter}
      style={{ top: 62, right: 12 }} />
      <CompassRose />

      {/* FAB — opens routes */}
      <button onClick={v.onOpenRoutes} aria-label="Routes" style={{
        position: 'absolute', right: 16, bottom: 188, width: 56, height: 56,
        borderRadius: 28, border: 0, background: 'var(--primary)', color: '#fff',
        boxShadow: 'var(--shadow-md)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="4" y="3" width="14" height="13" rx="3" />
          <path d="M4 9h14M8 16v3M14 16v3" strokeLinecap="round" />
          <circle cx="8" cy="13" r="0.8" fill="currentColor" />
          <circle cx="14" cy="13" r="0.8" fill="currentColor" />
        </svg>
      </button>

      {/* Bottom ETA card */}
      <div style={{
        position: 'absolute', left: 12, right: 12, bottom: 46,
        background: 'var(--surface)', borderRadius: 22, boxShadow: 'var(--shadow-lg)',
        padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              width: 26, height: 26, borderRadius: 7, background: 'var(--primary)',
              color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 600, fontFamily: 'Geist Mono'
            }}>{v.route.code}</span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{v.route.code} · {v.route.from}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>→ {v.route.to}</span>
            </div>
          </div>
          <StarBtn active={v.saved} onClick={v.onToggleSaved} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6 }}>Next bus at</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{v.eta.stopName} · {v.eta.stopSub}</div>
          </div>
          <div style={{ fontFamily: 'Geist Mono', fontSize: 32, fontWeight: 500, color: 'var(--primary)', lineHeight: 1 }}>
            {v.eta.minutes}<span style={{ fontSize: 14, color: 'var(--ink-3)', marginLeft: 2 }}>min</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--ink-2)' }}>
          <span>then in {v.upcoming[0]}m</span>
          <span style={{ color: 'var(--ink-3)' }}>·</span>
          <span>then in {v.upcoming[1]}m</span>
          <button onClick={v.onOpenRoutes} style={{
            marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--primary)',
            fontWeight: 600, fontSize: 12, cursor: 'pointer'
          }}>see all →</button>
        </div>
      </div>
    </>);

}

// ─── Elmov-style atoms ─────────────────────────────────────────
function StatusPill({ dot, children, tone = 'green' }) {
  const tones = {
    green: { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
    cream: { bg: 'oklch(0.96 0.012 100)', fg: 'var(--ink-2)' },
    dark: { bg: 'rgba(255,255,255,0.14)', fg: 'var(--primary-on)' }
  };
  const c = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: c.bg, color: c.fg,
      fontSize: 10.5, fontWeight: 600, letterSpacing: 0.1,
      padding: '3px 8px 3px 6px', borderRadius: 999,
      whiteSpace: 'nowrap'
    }}>
      {dot &&
      <span style={{
        width: 6, height: 6, borderRadius: 3,
        background: tone === 'dark' ? 'var(--primary-glow)' : 'var(--primary)',
        animation: 'blink-dot 1.6s ease-in-out infinite'
      }} />
      }
      {children}
    </span>);

}

function LeafIcon({ size = 11, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 11 11" fill="none">
      <path d="M9.5 1.5C9.5 6 6 9.5 1.5 9.5C1.5 5 5 1.5 9.5 1.5Z" fill={color} />
      <path d="M2 9L6 5" stroke="white" strokeWidth="0.7" strokeLinecap="round" opacity="0.5" />
    </svg>);

}

function ChevronRight({ size = 10, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill="none">
      <path d="M3 1l4 4-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>);

}

// Route 11 bus card — Elmov's "vehicle option" pattern
function BusOptionCard({ busNo, label, sublabel, eta, etaUnit = 'min', stats, selected, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', cursor: 'pointer',
      background: selected ? 'var(--primary-soft)' : 'var(--surface)',
      border: selected ? '1.5px solid var(--primary)' : '1.5px solid var(--line)',
      borderRadius: 18, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'all 0.18s ease'
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: selected ? 'var(--primary)' : 'oklch(0.96 0.012 100)',
        color: selected ? '#fff' : 'var(--primary)',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="4" y="3" width="14" height="13" rx="2.5" />
          <path d="M4 9h14M8 16v2.5M14 16v2.5" strokeLinecap="round" />
          <circle cx="8" cy="13" r="0.9" fill="currentColor" />
          <circle cx="14" cy="13" r="0.9" fill="currentColor" />
        </svg>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1 }}>{label}</span>
          <StatusPill tone="green">
            <LeafIcon size={9} /> {sublabel}
          </StatusPill>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 500 }}>
          {stats.map((s, i) =>
          <React.Fragment key={i}>
              {i > 0 && <span style={{ width: 3, height: 3, borderRadius: 1.5, background: 'var(--ink-3)', opacity: 0.5 }} />}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                {s.icon}{s.text}
              </span>
            </React.Fragment>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, lineHeight: 1 }}>
          <span style={{ fontFamily: 'Geist', fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.5 }}>{eta}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>{etaUnit}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10.5, color: 'var(--accent-deep)', fontWeight: 600 }}>
          <svg width="9" height="9" viewBox="0 0 9 9"><path d="M4.5 0.5l1.2 2.6 2.8.3-2.1 1.9.5 2.8L4.5 6.7 2.1 8.1l.5-2.8L.5 3.4l2.8-.3z" fill="currentColor" /></svg>
          92<span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>% on-time</span>
        </div>
      </div>
    </button>);

}

// ─────────────────────────────────────────────────────────────────
// LAYOUT B · ETA hero  —  redesigned in Elmov language
//   Greeting · search-pill route · "Bus Found" header card
//   Selected upcoming-bus card · stats grid · dark pill CTA
//   Compact map strip at top
// ─────────────────────────────────────────────────────────────────
function LayoutB(v) {
  return (
    <>
      {/* Soft cream background — sits behind everything below the map */}
      <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)' }} data-comment-anchor="aea149783f-div-280-7" />

      {/* ────── TOP: greeting + actions ────── */}
      <div style={{
        position: 'absolute', top: 50, left: 18, right: 18,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        zIndex: 5
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>Magandang umaga ·</span>
          <span style={{ fontSize: 19, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.3 }}>
            Tracking <span style={{ fontFamily: 'Geist Mono', fontWeight: 700 }}>{v.route.code}</span> · {v.route.toShort}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={v.onToggleNotify} aria-label="Notify" style={{
            width: 38, height: 38, border: 0, borderRadius: 12,
            background: v.notify ? 'var(--primary)' : 'var(--surface)',
            color: v.notify ? '#fff' : 'var(--ink-2)',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="14" height="16" viewBox="0 0 14 16" fill={v.notify ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
              <path d="M2 12c0-3 1-7 5-7s5 4 5 7H2zM6 14h2c0 .8-.4 1.5-1 1.5S6 14.8 6 14z" strokeLinejoin="round" />
            </svg>
          </button>
          <button onClick={v.onToggleDark} aria-label="Toggle dark mode" style={{
            width: 38, height: 38, border: 0, borderRadius: 12,
            background: v.dark ? 'var(--primary)' : 'var(--surface)',
            color: v.dark ? '#fff' : 'var(--ink-2)',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s, color 0.2s'
          }}>
            {v.dark ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M7 1C4 1 1.5 3.5 1.5 6.5S4 12 7 12c2.2 0 4.1-1.2 5.1-3-.4.1-.8.1-1.2.1-3.3 0-6-2.7-6-6 0-.9.2-1.7.6-2.5C5.1 1.2 6 1 7 1z" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="7" cy="7" r="2.5" />
                <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13M3.1 3.1l1.1 1.1M9.8 9.8l1.1 1.1M3.1 10.9l1.1-1.1M9.8 4.2l1.1-1.1" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ────── Search-style "Where to?" pill ────── */}
      <button onClick={v.onOpenRoutes} style={{
        position: 'absolute', top: 102, left: 18, right: 18, height: 44,
        background: 'var(--surface)', border: 0, borderRadius: 14,
        boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px',
        fontFamily: 'Geist', textAlign: 'left'
      }}>
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--ink-3)" strokeWidth="1.6">
          <circle cx="6.5" cy="6.5" r="4" /><path d="M9.5 9.5l4 4" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: 13.5, color: 'var(--ink-3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.route.from} <span style={{ opacity: 0.5, margin: '0 4px' }}>→</span> {v.route.to}</span>
        <StatusPill tone="green">
          <span style={{ width: 5, height: 5, borderRadius: 2.5, background: 'var(--primary)' }} />
          {ALL_ROUTES.length} routes
        </StatusPill>
      </button>

      {/* ────── MAP STRIP ────── */}
      <div style={{
        position: 'absolute', top: 158, left: 18, right: 18,
        height: 180, borderRadius: 22, overflow: 'hidden',
        boxShadow: 'var(--shadow-md)', background: 'var(--surface)'
      }}>
        <DavaoMap progress={v.progress} color={v.color} stops={v.stops} showStopLabels={false} />

        {/* Floating "Bus Found" badge — top-left of map (echoes Elmov "Driver Found") */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(255,255,255,0.96)', borderRadius: 12, padding: '7px 11px 7px 9px',
          boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 8,
          backdropFilter: 'blur(10px)'
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: 4, background: 'var(--primary)',
            boxShadow: '0 0 0 3px oklch(0.42 0.10 155 / 0.18)',
            animation: 'blink-dot 1.6s ease-in-out infinite'
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>Bus Found</span>
            <span style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>tracking now</span>
          </div>
        </div>

        {/* Battery-style chip on map showing distance traveled */}
        <div style={{
          position: 'absolute', top: '46%', left: '38%',
          background: 'var(--primary)', color: '#fff',
          padding: '3px 8px', borderRadius: 999,
          fontSize: 11, fontWeight: 700, fontFamily: 'Geist',
          boxShadow: '0 4px 12px rgba(20,50,35,0.25)',
          letterSpacing: -0.2
        }}>{Math.round(v.progress * 100)}%</div>

        {/* Destination card — bottom-right of map */}
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'rgba(255,255,255,0.97)', borderRadius: 12, padding: '7px 11px',
          boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: 7,
          backdropFilter: 'blur(10px)'
        }}>
          <svg width="12" height="14" viewBox="0 0 12 14" fill="var(--primary)">
            <path d="M6 0C2.7 0 0 2.5 0 5.6c0 4.2 6 8.4 6 8.4s6-4.2 6-8.4C12 2.5 9.3 0 6 0zm0 7.6a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: 9, color: 'var(--ink-3)', fontWeight: 500 }}>Destination</span>
            <span style={{ fontSize: 11.5, color: 'var(--ink)', fontWeight: 600 }}>{v.eta.stopName}</span>
          </div>
        </div>

        {/* compact zoom controls */}
        <MapControls orientation="vertical" onZoomIn={v.onZoomIn} onZoomOut={v.onZoomOut} onRecenter={v.onRecenter}
        style={{ top: 10, right: 10 }} />
      </div>

      {/* ────── "Upcoming Buses" section ────── */}
      <div style={{
        position: 'absolute', top: 358, left: 18, right: 18,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', letterSpacing: -0.2 }}>
          Upcoming Buses
        </span>
        <StatusPill tone="green">
          <span style={{ width: 5, height: 5, borderRadius: 2.5, background: 'var(--primary)' }} />
          {v.upcoming.length + 1} arriving
        </StatusPill>
      </div>

      {/* Selected (next bus) — light-green tinted card */}
      <div style={{ position: 'absolute', top: 388, left: 18, right: 18 }}>
        <BusOptionCard
          busNo={v.route.busNo}
          label={`Bus #${v.route.busNo}`}
          sublabel="On-time"
          eta={v.eta.minutes}
          etaUnit="min"
          selected
          stats={[
          { icon: <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="4.5" cy="4.5" r="3.5" /><path d="M4.5 2.5V4.5L6 5.5" strokeLinecap="round" /></svg>, text: `${v.eta.minutes} Min` },
          { icon: <LeafIcon size={9} color="var(--primary)" />, text: `${Math.round(v.progress * 100)}%` },
          { icon: null, text: v.route.toShort }]
          } />
        
      </div>

      {/* Next bus — white card */}
      <div style={{ position: 'absolute', top: 464, left: 18, right: 18 }}>
        <BusOptionCard
          busNo={String(Number(v.route.busNo) + 1)}
          label={`Bus #${Number(v.route.busNo) + 1}`}
          sublabel="On-time"
          eta={v.upcoming[0]}
          etaUnit="min"
          stats={[
          { icon: <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="4.5" cy="4.5" r="3.5" /><path d="M4.5 2.5V4.5L6 5.5" strokeLinecap="round" /></svg>, text: `${v.upcoming[0]} Min` },
          { icon: <LeafIcon size={9} color="var(--primary)" />, text: '88%' },
          { icon: null, text: v.route.from }]
          }
          onClick={v.onOpenRoutes} />
        
      </div>

      {/* ────── BOTTOM: secondary actions + primary CTA ────── */}
      <div style={{
        position: 'absolute', left: 18, right: 18, bottom: 46,
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        {/* row of round icon buttons */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--surface)', borderRadius: 999, padding: 6, boxShadow: 'var(--shadow-sm)'
        }}>
          <button onClick={v.onToggleSaved} aria-label="Save stop" style={{
            width: 38, height: 38, borderRadius: 999, border: 0, cursor: 'pointer',
            background: v.saved ? 'var(--primary-soft)' : 'transparent',
            color: v.saved ? 'var(--primary)' : 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill={v.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
              <path d="M7.5 1.5l1.9 4 4.4.4-3.3 3 1 4.4-4-2.4-4 2.4 1-4.4-3.3-3 4.4-.4z" strokeLinejoin="round" />
            </svg>
          </button>
          <button aria-label="Share" style={{
            width: 38, height: 38, borderRadius: 999, border: 0, cursor: 'pointer',
            background: 'transparent', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="3.5" cy="7.5" r="1.7" /><circle cx="11.5" cy="3.5" r="1.7" /><circle cx="11.5" cy="11.5" r="1.7" />
              <path d="M5 7l5-3M5 8l5 3" />
            </svg>
          </button>
          <button aria-label="History" style={{
            width: 38, height: 38, borderRadius: 999, border: 0, cursor: 'pointer',
            background: 'transparent', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="7.5" cy="7.5" r="5.5" /><path d="M7.5 4v3.5l2.5 1.5" strokeLinecap="round" />
            </svg>
          </button>
          <span style={{ width: 1, height: 22, background: 'var(--line)' }} />
          <button onClick={v.onOpenRoutes} style={{
            flex: 1, height: 38, borderRadius: 999, border: 0, cursor: 'pointer',
            background: 'transparent', color: 'var(--ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontFamily: 'Geist', fontSize: 13, fontWeight: 600
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="2" width="10" height="9" rx="2" /><path d="M2 6h10M5 11v1.5M9 11v1.5" strokeLinecap="round" />
            </svg>
            Switch route
          </button>
        </div>

        {/* primary CTA — dark green pill */}
        <button onClick={v.onToggleNotify} style={{
          height: 54, borderRadius: 999, border: 0, cursor: 'pointer',
          background: v.notify ? 'var(--primary-deep)' : 'var(--primary)',
          color: 'var(--primary-on)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'Geist', fontSize: 15, fontWeight: 600, letterSpacing: -0.1,
          boxShadow: 'var(--shadow-hero)'
        }}>
          {v.notify ?
          <>✓ Notifying at 3 min</> :
          <>Notify me at 3 min away <ChevronRight size={12} /></>
          }
        </button>
      </div>
    </>);

}

function TabIcon({ name, active }) {
  const stroke = active ? 'var(--primary)' : 'var(--ink-2)';
  if (name === 'bus') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="11" rx="2.5" /><path d="M3 8h14M7 14v2M13 14v2" strokeLinecap="round" />
      <circle cx="7" cy="11.5" r="0.8" fill={stroke} /><circle cx="13" cy="11.5" r="0.8" fill={stroke} />
    </svg>);

  if (name === 'pin') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth="1.5">
      <path d="M10 2c-3 0-5 2.2-5 5 0 3.5 5 10 5 10s5-6.5 5-10c0-2.8-2-5-5-5z" strokeLinejoin="round" />
      <circle cx="10" cy="7" r="1.6" />
    </svg>);

  if (name === 'bell') return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={stroke} strokeWidth="1.5">
      <path d="M4 14c0-4 1-9 6-9s6 5 6 9H4zM8 16h4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>);

  return null;
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT C · Bottom sheet
//   Map is hero, drag handle peeks ETA, controls drift right
// ─────────────────────────────────────────────────────────────────
function LayoutC(v) {
  return (
    <>
      <DavaoMap progress={v.progress} color={v.color} stops={v.stops} showStopLabels />

      {/* top bar */}
      <div style={{
        position: 'absolute', top: 50, left: 12, right: 12,
        display: 'flex', alignItems: 'center', gap: 8
      }}>
        <HamburgerBtn />
        <button onClick={v.onOpenRoutes} style={{
          flex: 1, height: 40, border: 0, background: 'rgba(255,255,255,0.96)',
          borderRadius: 12, boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px',
          fontFamily: 'Geist', fontWeight: 500, color: 'var(--ink)', fontSize: 14
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 6, background: 'var(--primary)', color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'Geist Mono', fontSize: 11, fontWeight: 600
          }}>{v.route.code}</span>
          <span>{v.route.code}</span>
          <span style={{ color: 'var(--ink-3)', fontSize: 11.5, marginLeft: 'auto' }}>tap to switch</span>
          <svg width="9" height="9" viewBox="0 0 9 9" style={{ opacity: 0.5 }}>
            <path d="M1 3l3.5 3.5L8 3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          </svg>
        </button>
        <CompassRose />
      </div>

      {/* right-side controls */}
      <MapControls orientation="vertical" onZoomIn={v.onZoomIn} onZoomOut={v.onZoomOut} onRecenter={v.onRecenter}
      style={{ top: 102, right: 12 }} />
      <div style={{ position: 'absolute', top: 246, right: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button onClick={v.onToggleSaved} aria-label="Save" style={{
          width: 36, height: 36, border: 0, background: v.saved ? 'var(--accent)' : 'rgba(255,255,255,0.96)',
          color: v.saved ? '#fff' : 'var(--ink-2)',
          borderRadius: 10, boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill={v.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
            <path d="M7 1c-2.5 0-4.5 2-4.5 4.5 0 3 4.5 7.5 4.5 7.5s4.5-4.5 4.5-7.5C11.5 3 9.5 1 7 1z" strokeLinejoin="round" />
            <circle cx="7" cy="5.5" r="1.4" />
          </svg>
        </button>
        <BellBtn active={v.notify} onClick={v.onToggleNotify} />
      </div>

      {/* bottom sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--surface)',
        borderTopLeftRadius: 24, borderTopRightRadius: 24,
        boxShadow: 'var(--shadow-lg)', padding: '8px 18px 50px'
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 2, background: 'var(--line)',
          margin: '0 auto 12px'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 600 }}>Next bus</span>
          <span style={{ fontSize: 10.5, color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-soft)', padding: '2px 7px', borderRadius: 999 }}>historical avg</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontFamily: 'Geist', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>Bus #{v.route.busNo}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>approaching {v.eta.stopName}</div>
          </div>
          <div style={{ fontFamily: 'Geist Mono', fontSize: 38, fontWeight: 500, color: 'var(--primary)', lineHeight: 1 }}>
            {v.eta.minutes}<span style={{ fontSize: 14, color: 'var(--ink-3)', marginLeft: 2 }}>min</span>
          </div>
        </div>

        {/* stop progress bar */}
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 0 }}>
          {v.stops.map((s, i) => {
            const passed = s.t < v.progress;
            const current = i > 0 && v.stops[i - 1].t < v.progress && s.t >= v.progress;
            return (
              <React.Fragment key={s.id}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 0 }}>
                  <div style={{
                    width: current ? 12 : 8, height: current ? 12 : 8, borderRadius: '50%',
                    background: passed || current ? 'var(--primary)' : '#fff',
                    border: `2px solid ${passed || current ? 'var(--primary)' : 'var(--line)'}`
                  }} />
                  <div style={{
                    fontSize: 10, color: current ? 'var(--primary)' : 'var(--ink-3)',
                    fontWeight: current ? 600 : 500, marginTop: 4, whiteSpace: 'nowrap'
                  }}>{s.name.split(' ')[0]}</div>
                </div>
                {i < v.stops.length - 1 &&
                <div style={{
                  flex: 1, height: 2, marginTop: -10,
                  background: v.stops[i + 1].t < v.progress ? 'var(--primary)' :
                  s.t < v.progress ? `linear-gradient(90deg, var(--primary), var(--line))` : 'var(--line)'
                }} />
                }
              </React.Fragment>);

          })}
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <button onClick={v.onToggleNotify} style={{
            flex: 1, height: 40, borderRadius: 12, border: 0,
            background: v.notify ? 'var(--accent)' : 'var(--ink)', color: '#fff',
            fontFamily: 'Geist', fontWeight: 600, fontSize: 13, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
          }}>
            {v.notify ? '✓ Notifying at 3 min' : 'Notify me at 3 min'}
          </button>
          <button aria-label="Share" style={{
            width: 40, height: 40, borderRadius: 12, border: '1px solid var(--line)',
            background: '#fff', color: 'var(--ink-2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M7 1v8M3 5l4-4 4 4M1 9v3a1 1 0 001 1h10a1 1 0 001-1V9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </>);

}

// ─────────────────────────────────────────────────────────────────
// LAYOUT D · Side rail
//   Vertical rail of controls · slim ETA ticker · max map
// ─────────────────────────────────────────────────────────────────
function LayoutD(v) {
  return (
    <>
      <DavaoMap progress={v.progress} color={v.color} stops={v.stops} showStopLabels />

      {/* top — hamburger + compass only */}
      <div style={{ position: 'absolute', top: 56, left: 12 }}><HamburgerBtn /></div>
      <CompassRose />

      {/* slim ETA ticker */}
      <div style={{
        position: 'absolute', top: 56, left: 64, right: 64, height: 40,
        background: 'rgba(255,255,255,0.96)', borderRadius: 12, boxShadow: 'var(--shadow-sm)',
        display: 'flex', alignItems: 'center', padding: '0 12px', gap: 10
      }}>
        <span style={{
          fontSize: 9.5, fontWeight: 700, color: 'var(--primary)',
          background: 'var(--primary-soft)', padding: '3px 7px', borderRadius: 999, letterSpacing: 0.4
        }}>NOW TRACKING</span>
        <button onClick={v.onOpenRoutes} style={{
          background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4,
          fontFamily: 'Geist', fontWeight: 600, fontSize: 13, color: 'var(--ink)'
        }}>
          {v.route.code}
          <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 2l3 3 3-3" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" /></svg>
        </button>
      </div>

      {/* vertical rail — right side */}
      <div style={{
        position: 'absolute', top: 110, right: 12, padding: 6,
        background: 'rgba(255,255,255,0.96)', borderRadius: 14,
        boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 4
      }}>
        {[
        { id: 'bus', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="12" height="10" rx="2" /><path d="M3 8h12M6 13v2M12 13v2" /></svg>, onClick: v.onOpenRoutes, active: true },
        { id: 'pin', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 2c-2.8 0-4.5 2-4.5 4.5C4.5 9.5 9 14 9 14s4.5-4.5 4.5-7.5C13.5 4 11.8 2 9 2z" /><circle cx="9" cy="6.5" r="1.5" /></svg> },
        { id: 'bell', icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 13c0-3.5.8-7 5-7s5 3.5 5 7H4zM7.5 14.5h3" /></svg>, onClick: v.onToggleNotify, active: v.notify },
        { divider: true },
        { id: 'recenter', icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="3" /><circle cx="8" cy="8" r="0.6" fill="currentColor" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2" strokeLinecap="round" /></svg>, onClick: v.onRecenter },
        { id: 'in', icon: <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>, onClick: v.onZoomIn },
        { id: 'out', icon: <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>, onClick: v.onZoomOut },
        { id: 'refresh', icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5a5 5 0 10-1 4.5" /><path d="M12 1v4h-4" strokeLinecap="round" strokeLinejoin="round" /></svg> }].
        map((b, i) => b.divider ?
        <div key={i} style={{ height: 1, background: 'var(--line)', margin: '2px 4px' }} /> :

        <button key={b.id} onClick={b.onClick} aria-label={b.id} style={{
          width: 36, height: 36, border: 0, cursor: 'pointer',
          background: b.active ? 'var(--primary-soft)' : 'transparent',
          color: b.active ? 'var(--primary)' : 'var(--ink-2)',
          borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>{b.icon}</button>
        )}
      </div>

      {/* bottom slim ticker */}
      <div style={{
        position: 'absolute', left: 12, right: 12, bottom: 46,
        background: 'rgba(255,255,255,0.97)', borderRadius: 16, padding: '12px 14px',
        boxShadow: 'var(--shadow-md)', display: 'flex', alignItems: 'center', gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span style={{ fontFamily: 'Geist Mono', fontSize: 30, fontWeight: 600, color: 'var(--primary)', lineHeight: 1 }}>{v.eta.minutes}</span>
          <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>m</span>
          <svg width="10" height="14" viewBox="0 0 10 14" style={{ marginLeft: 4 }}>
            <path d="M5 1v12M1 5l4-4 4 4" stroke="var(--primary)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ flex: 1, lineHeight: 1.25 }}>
          <div style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>next at {v.eta.stopName}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>then {v.upcoming[0]}m · {v.upcoming[1]}m</div>
        </div>
        <button onClick={v.onOpenRoutes} style={{
          background: 'transparent', border: 0, color: 'var(--primary)',
          fontWeight: 600, fontSize: 12.5, cursor: 'pointer', padding: 0
        }}>details →</button>
      </div>
    </>);

}

// ─────────────────────────────────────────────────────────────────
// LAYOUT E · Glanceable
//   Almost no chrome · one bubble shows ETA · everything else is on tap
// ─────────────────────────────────────────────────────────────────
function LayoutE(v) {
  return (
    <>
      <DavaoMap progress={v.progress} color={v.color} stops={v.stops} showStopLabels />

      {/* minimal top */}
      <div style={{
        position: 'absolute', top: 56, left: 12, right: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <HamburgerBtn />
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={v.onRecenter} aria-label="Recenter" style={{
            width: 40, height: 40, border: 0, borderRadius: 12,
            background: 'rgba(255,255,255,0.96)', color: 'var(--ink-2)',
            boxShadow: 'var(--shadow-sm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="7" cy="7" r="2.5" /><circle cx="7" cy="7" r="0.5" fill="currentColor" />
              <path d="M7 1v1.5M7 11.5V13M1 7h1.5M11.5 7H13" strokeLinecap="round" />
            </svg>
          </button>
          <BellBtn active={v.notify} onClick={v.onToggleNotify} />
        </div>
      </div>

      {/* The Bubble */}
      <div style={{
        position: 'absolute', left: '50%', top: '38%', transform: 'translate(-50%, -50%)',
        background: 'var(--surface)', borderRadius: 28, padding: '22px 26px',
        boxShadow: '0 10px 40px rgba(20,20,15,0.15), 0 30px 80px rgba(20,20,15,0.15)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        minWidth: 220
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, lineHeight: 0.9 }}>
          <span style={{ fontFamily: 'Geist', fontSize: 82, fontWeight: 600, color: 'var(--ink)', letterSpacing: -3 }}>{v.eta.minutes}</span>
          <span style={{ fontSize: 22, color: 'var(--ink-2)', fontWeight: 500 }}>min</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--ink-2)', marginTop: 10, textAlign: 'center' }}>
          to <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{v.eta.stopName}</span> · {v.eta.stopSub}
        </div>
        <div style={{
          marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)',
          width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: 1 }}>{v.route.code} · NEXT</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'Geist Mono',
            fontSize: 14, fontWeight: 500, color: 'var(--ink-2)'
          }}>
            <span>{v.upcoming[0]}m</span>
            <span style={{ color: 'var(--ink-3)' }}>·</span>
            <span>{v.upcoming[1]}m</span>
            <span style={{ color: 'var(--ink-3)' }}>·</span>
            <span>{v.upcoming[2]}m</span>
          </div>
          <button onClick={v.onOpenRoutes} style={{
            marginTop: 4, background: 'transparent', border: 0, color: 'var(--primary)',
            fontWeight: 600, fontSize: 12, cursor: 'pointer'
          }}>schedule →</button>
        </div>
      </div>

      {/* bottom actions */}
      <div style={{
        position: 'absolute', left: 12, right: 12, bottom: 46,
        display: 'flex', gap: 8
      }}>
        <button onClick={v.onOpenRoutes} style={{
          flex: 1, height: 48, borderRadius: 16, border: 0, cursor: 'pointer',
          background: 'var(--ink)', color: '#fff',
          fontFamily: 'Geist', fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="2.5" y="2.5" width="11" height="9" rx="2" /><path d="M2.5 7h11M5 11.5v2M11 11.5v2" />
          </svg>
          Switch route
        </button>
        <button onClick={v.onToggleNotify} style={{
          width: 48, height: 48, borderRadius: 16, border: 0, cursor: 'pointer',
          background: v.notify ? 'var(--accent)' : 'var(--surface)',
          color: v.notify ? '#fff' : 'var(--ink-2)',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <svg width="16" height="18" viewBox="0 0 16 18" fill={v.notify ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
            <path d="M3 13c0-3.5 1-8 5-8s5 4.5 5 8H3zM6.5 15h3" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </>);

}

// ─────────────────────────────────────────────────────────────────
// ROUTES MODAL (F) — slides up from bottom
// ─────────────────────────────────────────────────────────────────
// Real DC Bus routes — 9 active routes connecting Davao City districts.
// Service is free, runs AM (6–10am) + PM (4–9pm). Each route lists a simplified
// 5-stop corridor for map visualization plus real ridership metadata.
const ALL_ROUTES = [
  {
    id: 'R102', code: 'R102', name: 'Toril – GE Torres',
    from: 'Toril District Hall', to: 'GE Torres', toShort: 'Sandawa',
    stations: 17, duration: '60–70 min', service: 'AM/PM',
    busNo: '2401', eta: 12,
    stopKeys: ['toril', 'bagoAplaya', 'cokeUlas', 'matina', 'geTorres'],
  },
  {
    id: 'R103', code: 'R103', name: 'Toril – Roxas',
    from: 'Toril District Hall', to: 'Red Cross Roxas', toShort: 'Roxas',
    stations: 9, duration: '45–50 min', service: 'AM/PM',
    busNo: '1308', eta: 18,
    stopKeys: ['toril', 'bagoAplaya', 'ecoland', 'cmRecto', 'redCrossRoxas'],
  },
  {
    id: 'R402', code: 'R402', name: 'Mintal – GE Torres',
    from: 'Mintal Palengke', to: 'GE Torres', toShort: 'Sandawa',
    stations: 15, duration: '55–65 min', service: 'AM/PM',
    busNo: '4011', eta: 9,
    stopKeys: ['mintal', 'catalunan', 'spedBangkal', 'matina', 'geTorres'],
  },
  {
    id: 'R403', code: 'R403', name: 'Mintal – Roxas',
    from: 'Mintal Palengke', to: 'Davao Light', toShort: 'Roxas',
    stations: 17, duration: '65–75 min', service: 'AM/PM',
    busNo: '4034', eta: 15,
    stopKeys: ['mintal', 'spedBangkal', 'matina', 'nccMaa', 'davaoLight'],
  },
  {
    id: 'R503', code: 'R503', name: 'Bangkal – Roxas',
    from: 'Hope Ave. Bangkal', to: 'Davao Light', toShort: 'Roxas',
    stations: 14, duration: '50–60 min', service: 'AM/PM',
    busNo: '5031', eta: 7,
    stopKeys: ['hopeBangkal', 'spedBangkal', 'matina', 'nccMaa', 'davaoLight'],
  },
  {
    id: 'R603', code: 'R603', name: 'Buhangin – Roxas',
    from: 'Citymall Northtown', to: 'Red Cross Roxas', toShort: 'Roxas',
    stations: 9, duration: '35–40 min', service: 'AM/PM',
    busNo: '6022', eta: 4,
    stopKeys: ['citymallNorth', 'buhangin', 'lanang', 'abreeza', 'redCrossRoxas'],
  },
  {
    id: 'R763', code: 'R763', name: 'Panacan via Buhangin – Roxas',
    from: 'Panacan Depot', to: 'Red Cross Roxas', toShort: 'Roxas',
    stations: 13, duration: '45–55 min', service: 'AM/PM',
    busNo: '7611', eta: 14,
    stopKeys: ['panacanDepot', 'buhangin', 'lanang', 'abreeza', 'redCrossRoxas'],
  },
  {
    id: 'R783', code: 'R783', name: 'Panacan via Angliongto – Roxas',
    from: 'Panacan Depot', to: 'Red Cross Roxas', toShort: 'Roxas',
    stations: 15, duration: '60–70 min', service: 'AM/PM',
    busNo: '7822', eta: 22,
    stopKeys: ['panacanDepot', 'angliongto', 'lanang', 'nccMallVP', 'redCrossRoxas'],
  },
  {
    id: 'R793', code: 'R793', name: 'Panacan via R. Castillo – Roxas',
    from: 'NCCC Panacan', to: 'Red Cross Roxas', toShort: 'Roxas',
    stations: 16, duration: '50–60 min', service: 'AM/PM',
    busNo: '7935', eta: 11,
    stopKeys: ['nccPanacan', 'rCastillo', 'sasa', 'abreeza', 'redCrossRoxas'],
  },
];


function RoutesModal({ open, onClose, currentRouteId, onSelect }) {
  const [search, setSearch] = React.useState('');
  const [closing, setClosing] = React.useState(false);
  React.useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  if (!open && !closing) return null;

  const close = () => {
    setClosing(true);
    setTimeout(() => {setClosing(false);onClose();}, 220);
  };

  const filtered = ALL_ROUTES.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.from.toLowerCase().includes(q) || r.to.toLowerCase().includes(q);
  });

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      pointerEvents: open ? 'auto' : 'none'
    }}>
      {/* scrim */}
      <div onClick={close} style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20,20,15,0.45)',
        animation: closing ? 'fade-in 0.22s reverse forwards' : 'fade-in 0.22s ease forwards'
      }} />
      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        background: 'var(--surface)',
        borderTopLeftRadius: 26, borderTopRightRadius: 26,
        boxShadow: '0 -10px 40px rgba(20,20,15,0.18)',
        padding: '8px 0 38px',
        maxHeight: '78%',
        display: 'flex', flexDirection: 'column',
        transform: closing ? 'translateY(100%)' : 'translateY(0)',
        animation: closing ? 'none' : 'slide-up 0.28s cubic-bezier(0.22, 0.61, 0.36, 1)',
        transition: 'transform 0.22s cubic-bezier(0.55, 0.06, 0.68, 0.19)'
      }}>
        {/* handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--line)', margin: '6px auto 14px' }} />

        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px 12px' }}>
          <h2 style={{ margin: 0, fontFamily: 'Geist', fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>Routes</h2>
          <button onClick={close} aria-label="Close" style={{
            width: 32, height: 32, border: 0, background: 'oklch(0.94 0.008 80)',
            borderRadius: 16, cursor: 'pointer', color: 'var(--ink-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="12" height="12" viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* search */}
        <div style={{ padding: '0 18px 12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'oklch(0.96 0.006 80)', borderRadius: 12, padding: '10px 14px'
          }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="var(--ink-3)" strokeWidth="1.6">
              <circle cx="6.5" cy="6.5" r="4" /><path d="M9.5 9.5l4 4" strokeLinecap="round" />
            </svg>
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="search by stop or route #"
              style={{
                flex: 1, border: 0, background: 'transparent', outline: 'none',
                fontFamily: 'Geist', fontSize: 14, color: 'var(--ink)'
              }} />
            
          </div>
        </div>

        {/* section label */}
        <div style={{ padding: '4px 22px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-2)' }}>Available Routes</span>
          <StatusPill tone="green">
            <span style={{ width: 5, height: 5, borderRadius: 2.5, background: 'var(--primary)' }} />
            {filtered.length} Available
          </StatusPill>
        </div>

        {/* route list — Elmov vehicle-option style */}
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 14px 4px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((r) => {
            const isCurrent = r.id === currentRouteId;
            return (
              <button key={r.id} onClick={() => {onSelect(r);close();}} style={{
                width: '100%', textAlign: 'left', cursor: 'pointer',
                background: isCurrent ? 'var(--primary-soft)' : 'var(--surface)',
                border: isCurrent ? '1.5px solid var(--primary)' : '1.5px solid var(--line)',
                borderRadius: 18, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'all 0.15s ease'
              }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: isCurrent ? 'var(--primary)' : 'oklch(0.96 0.012 100)',
                  color: isCurrent ? '#fff' : 'var(--primary)',
                  display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, gap: 0, lineHeight: 1,
                }}>
                  <span style={{ fontFamily: 'Geist Mono', fontSize: 13.5, fontWeight: 700, letterSpacing: -0.2 }}>{r.code}</span>
                  <span style={{ fontSize: 8, opacity: 0.7, marginTop: 3, fontWeight: 600, letterSpacing: 0.4 }}>FREE</span>
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.1 }}>
                      {r.name}
                    </span>
                    {isCurrent && (
                      <StatusPill tone="green">
                        <span style={{ width: 5, height: 5, borderRadius: 2.5, background: 'var(--primary)', animation: 'blink-dot 1.6s ease-in-out infinite' }} />
                        Tracking
                      </StatusPill>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 11.5, color: 'var(--ink-3)', fontWeight: 500 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><path d="M4.5 0C2 0 0 1.8 0 4.2 0 7.3 4.5 11 4.5 11S9 7.3 9 4.2C9 1.8 7 0 4.5 0zm0 5.6a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8z"/></svg>
                      {r.stations} stops
                    </span>
                    <span style={{ width: 3, height: 3, borderRadius: 1.5, background: 'var(--ink-3)', opacity: 0.5 }} />
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="4.5" cy="4.5" r="3.5" /><path d="M4.5 2.5V4.5L6 5.5" strokeLinecap="round" /></svg>
                      {r.duration}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, lineHeight: 1 }}>
                    <span style={{ fontFamily: 'Geist', fontSize: 22, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.5 }}>{r.eta}</span>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>min</span>
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--ink-3)', fontWeight: 500 }}>next bus</span>
                </div>
              </button>);

          })}
          <div style={{ textAlign: 'center', padding: '8px 0 4px', fontSize: 12, color: 'var(--ink-3)' }}>
            + more routes coming soon
          </div>
        </div>

        {/* Footer — "Ride Details" summary + primary CTA */}
        <div style={{
          padding: '12px 18px 0', borderTop: '1px solid var(--line)',
          background: 'var(--surface)'
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10,
            padding: '12px 0 14px'
          }}>
            {[
            { label: 'Routes', value: ALL_ROUTES.length },
            { label: 'Avg wait', value: '8m' },
            { label: 'On-time', value: '92%' }].
            map((s) =>
            <div key={s.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2,
              paddingLeft: 2
            }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', letterSpacing: -0.4, lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontSize: 11, color: 'var(--ink-3)', fontWeight: 500 }}>{s.label}</span>
              </div>
            )}
          </div>
          <button onClick={close} style={{
            width: '100%', height: 50, borderRadius: 999, border: 0, cursor: 'pointer',
            background: 'var(--primary)', color: 'var(--primary-on)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Geist', fontSize: 14.5, fontWeight: 600, letterSpacing: -0.1,
            boxShadow: 'var(--shadow-hero)'
          }}>
            Track this route <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { LayoutA, LayoutB, LayoutC, LayoutD, LayoutE, RoutesModal, ALL_ROUTES, fmtMin });