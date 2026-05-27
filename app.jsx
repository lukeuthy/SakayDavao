chponst TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "layout": "B",
  "accent": "forest",
  "simSpeed": 20,
  "showHistoricalBadge": true
}/*EDITMODE-END*/;

const ACCENT_PRESETS = {
  forest:  { primary: 'oklch(0.42 0.10 155)', soft: 'oklch(0.95 0.04 155)' },
  jeepney: { primary: 'oklch(0.50 0.16 30)',  soft: 'oklch(0.95 0.04 30)'  },
  ocean:   { primary: 'oklch(0.48 0.12 230)', soft: 'oklch(0.95 0.04 230)' },
  twilight:{ primary: 'oklch(0.40 0.13 290)', soft: 'oklch(0.95 0.04 290)' },
};

const LAYOUT_RENDERS = { A: LayoutA, B: LayoutB, C: LayoutC, D: LayoutD, E: LayoutE };
const LAYOUT_LABELS = {
  A: 'A · Classic stack',
  B: 'B · ETA hero',
  C: 'C · Bottom sheet',
  D: 'D · Side rail',
  E: 'E · Glanceable',
};

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply accent to CSS vars
  React.useEffect(() => {
    const a = ACCENT_PRESETS[t.accent] || ACCENT_PRESETS.forest;
    document.documentElement.style.setProperty('--primary', a.primary);
    document.documentElement.style.setProperty('--primary-soft', a.soft);
  }, [t.accent]);

  // ─── App state ─────────────────────────────────────────────
  const [dark, setDark] = React.useState(false);

  React.useEffect(() => {
    const el = document.documentElement;
    if (dark) {
      el.style.setProperty('--bg',           'oklch(0.12 0.015 155)');
      el.style.setProperty('--surface',      'oklch(0.17 0.012 155)');
      el.style.setProperty('--ink',          'oklch(0.94 0.008 155)');
      el.style.setProperty('--ink-2',        'oklch(0.72 0.010 80)');
      el.style.setProperty('--ink-3',        'oklch(0.52 0.008 80)');
      el.style.setProperty('--line',         'oklch(0.24 0.010 155)');
      el.style.setProperty('--map-land',     'oklch(0.20 0.012 90)');
      el.style.setProperty('--map-water',    'oklch(0.17 0.025 230)');
      el.style.setProperty('--map-road',     'oklch(0.27 0.005 80)');
      el.style.setProperty('--map-road-line','oklch(0.30 0.008 80)');
    } else {
      el.style.setProperty('--bg',           'oklch(0.97 0.012 155)');
      el.style.setProperty('--surface',      '#ffffff');
      el.style.setProperty('--ink',          'oklch(0.20 0.012 155)');
      el.style.setProperty('--ink-2',        'oklch(0.42 0.012 80)');
      el.style.setProperty('--ink-3',        'oklch(0.62 0.010 80)');
      el.style.setProperty('--line',         'oklch(0.93 0.008 155)');
      el.style.setProperty('--map-land',     'oklch(0.96 0.012 90)');
      el.style.setProperty('--map-water',    'oklch(0.92 0.022 230)');
      el.style.setProperty('--map-road',     'oklch(0.99 0.003 80)');
      el.style.setProperty('--map-road-line','oklch(0.86 0.008 80)');
    }
  }, [dark]);

  const [routeId, setRouteId] = React.useState('R503');
  const [notify, setNotify] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [modal, setModal] = React.useState(null); // 'routes' | null
  const [zoom, setZoom] = React.useState(1);
  const [toast, setToast] = React.useState(null);

  const route = ALL_ROUTES.find(r => r.id === routeId) || ALL_ROUTES[0];

  // ─── ETA simulation ─────────────────────────────────────────
  // Each "trip" lasts trip.totalSec; eta counts down from totalSec to 0.
  // On reaching 0, advance to next bus in the upcoming queue.
  const initialQueue = [route.eta * 60, 22 * 60, 38 * 60, 54 * 60, 70 * 60];
  const [queue, setQueue] = React.useState(initialQueue);
  const [tripTotal, setTripTotal] = React.useState(route.eta * 60);
  const [etaSec, setEtaSec] = React.useState(route.eta * 60);

  // Reset queue when route changes
  React.useEffect(() => {
    const q = [route.eta * 60, 22 * 60, 38 * 60, 54 * 60, 70 * 60];
    setQueue(q);
    setTripTotal(route.eta * 60);
    setEtaSec(route.eta * 60);
  }, [route.id]);

  // Tick
  React.useEffect(() => {
    const speed = Math.max(1, Number(t.simSpeed) || 1); // sim seconds per real second
    const id = setInterval(() => {
      setEtaSec(prev => {
        if (prev <= 1) {
          // arrived — advance queue
          setQueue(q => {
            const newQ = q.slice(1);
            const nextTotal = (newQ[0] ?? 22 * 60);
            setTripTotal(nextTotal);
            // push another future bus on the end
            const tail = (newQ[newQ.length - 1] ?? 60 * 60) + 16 * 60;
            return [...newQ, tail];
          });
          setToast({
            kind: 'arrived',
            text: `Bus arrived at ${route.to}`,
          });
          setTimeout(() => setToast(null), 2400);
          // next bus's eta from the (just-shifted) queue
          return (queue[1] ?? 22 * 60);
        }
        return prev - 1;
      });
    }, Math.max(40, Math.round(1000 / speed)));
    return () => clearInterval(id);
  }, [t.simSpeed, queue]);

  // Trigger notify-confirmation toast
  const onToggleNotify = () => {
    setNotify(n => {
      const next = !n;
      setToast({
        kind: 'notify',
        text: next ? `We'll buzz you at 3 min away` : 'Notifications off',
      });
      setTimeout(() => setToast(null), 2200);
      return next;
    });
  };
  const onToggleSaved = () => {
    setSaved(s => {
      const next = !s;
      setToast({
        kind: 'save',
        text: next ? `Saved ${route.to}` : 'Removed from saved',
      });
      setTimeout(() => setToast(null), 1800);
      return next;
    });
  };

  // Route stops + destination derived from active route metadata
  const routeStops = React.useMemo(() => makeStops(route.stopKeys), [route.id]);
  const destStop = routeStops[routeStops.length - 1] || {};
  const destT = destStop.t ?? 1;
  // As eta approaches 0, bus reaches destination.
  const progress = destT * (1 - Math.max(0, Math.min(1, etaSec / Math.max(1, tripTotal))));

  // ETA display values
  const etaMin = Math.max(0, Math.ceil(etaSec / 60));
  const etaPretty = fmtMin(etaSec);
  const upcoming = queue.slice(1, 4).map(s => Math.ceil(s / 60));

  // Build view props passed to each layout
  const accent = ACCENT_PRESETS[t.accent] || ACCENT_PRESETS.forest;
  const view = {
    route,
    stops: routeStops,
    eta: {
      totalSec: etaSec,
      minutes: etaMin,
      label: etaPretty.label,
      stopName: route.to,
      stopSub: route.toShort,
    },
    upcoming,
    progress,
    color: accent.primary,
    saved,
    notify,
    dark,
    zoom,
    onOpenRoutes: () => setModal('routes'),
    onToggleDark: () => setDark(d => !d),
    onToggleNotify,
    onToggleSaved,
    onZoomIn: () => setZoom(z => Math.min(1.6, z + 0.15)),
    onZoomOut: () => setZoom(z => Math.max(0.7, z - 0.15)),
    onRecenter: () => setZoom(1),
  };

  const LayoutComponent = LAYOUT_RENDERS[t.layout] || LayoutB;

  return (
    <>
      <IOSDevice width={402} height={874} dark={dark}>
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--bg)' }}>
          <LayoutComponent {...view} />

          {/* Routes modal */}
          <RoutesModal
            open={modal === 'routes'}
            onClose={() => setModal(null)}
            currentRouteId={routeId}
            onSelect={(r) => setRouteId(r.id)}
          />

          {/* Toast */}
          {toast && (
            <div style={{
              position: 'absolute', top: 102, left: 12, right: 12, zIndex: 200,
              background: toast.kind === 'arrived' ? 'var(--accent-deep)' : 'rgba(20,20,15,0.92)',
              color: '#fff', borderRadius: 12, padding: '10px 14px',
              fontFamily: 'Geist', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: 'var(--shadow-md)',
              animation: 'fade-in 0.2s ease',
            }}>
              {toast.kind === 'arrived' && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 7l3 3 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              {toast.kind === 'notify' && (
                <svg width="13" height="14" viewBox="0 0 13 14" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M2 11c0-3 1-7 4.5-7s4.5 4 4.5 7H2zM5 12.5h3" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              )}
              <span>{toast.text}</span>
            </div>
          )}
        </div>
      </IOSDevice>

      {/* Tweaks panel */}
      <TweaksPanel title="Tweaks">
        <TweakSection label="Layout">
          <TweakRadio
            label="Direction"
            value={t.layout}
            options={['A', 'B', 'C', 'D', 'E']}
            onChange={v => setTweak('layout', v)}
          />
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.55)', padding: '2px 4px 8px',
            fontFamily: 'Geist, system-ui',
          }}>{LAYOUT_LABELS[t.layout]}</div>
        </TweakSection>

        <TweakSection label="Accent">
          <TweakRadio
            label="Theme"
            value={t.accent}
            options={['forest', 'jeepney', 'ocean', 'twilight']}
            onChange={v => setTweak('accent', v)}
          />
        </TweakSection>

        <TweakSection label="Simulation">
          <TweakSlider
            label="ETA speed"
            value={t.simSpeed}
            min={1} max={60} step={1} unit="×"
            onChange={v => setTweak('simSpeed', v)}
          />
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.55)', padding: '2px 4px 4px',
            fontFamily: 'Geist, system-ui',
          }}>
            Real time → sim. {t.simSpeed}× lets you watch the bus arrive.
          </div>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
