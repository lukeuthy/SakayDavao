// map.jsx — Stylized SVG map of Davao City with animated bus along route

// HUBS — every real Davao stop/terminal we visualize, with SVG coords
// Davao geography: Toril (south), Mintal (west), Matina/Bangkal (south-central),
// downtown Roxas (central-north), GE Torres/Sandawa (east), Buhangin (north),
// Panacan (far north-east on the gulf).
const HUBS = {
  toril:           { id: 'toril',           name: 'Toril District Hall',  sub: 'Terminal',     x: 60,  y: 560 },
  bagoAplaya:      { id: 'bagoAplaya',      name: 'Bago Aplaya',          sub: 'Stop',         x: 95,  y: 510 },
  cokeUlas:        { id: 'cokeUlas',        name: 'Coke Ulas',            sub: 'Stop',         x: 130, y: 470 },
  mintal:          { id: 'mintal',          name: 'Mintal Palengke',      sub: 'Terminal',     x: 45,  y: 415 },
  catalunan:       { id: 'catalunan',       name: 'Catalunan Pequeño',    sub: 'Stop',         x: 100, y: 380 },
  hopeBangkal:     { id: 'hopeBangkal',     name: 'Hope Ave. Bangkal',    sub: 'Stop',         x: 138, y: 350 },
  spedBangkal:     { id: 'spedBangkal',     name: 'SPED Bangkal',         sub: 'Stop',         x: 162, y: 320 },
  matina:          { id: 'matina',          name: 'Matina Crossing',      sub: 'Transfer',     x: 188, y: 290 },
  ecoland:         { id: 'ecoland',         name: 'Ecoland Terminal',     sub: 'Terminal',     x: 215, y: 340 },
  nccMaa:          { id: 'nccMaa',          name: 'NCCC Maa',             sub: 'Transfer',     x: 230, y: 250 },
  geTorres:        { id: 'geTorres',        name: 'GE Torres',            sub: 'Terminal',     x: 305, y: 245 },
  cmRecto:         { id: 'cmRecto',         name: 'CM Recto Ave.',        sub: 'Stop',         x: 252, y: 165 },
  davaoLight:      { id: 'davaoLight',      name: 'Davao Light',          sub: 'Stop · Roxas', x: 240, y: 185 },
  redCrossRoxas:   { id: 'redCrossRoxas',   name: 'Red Cross Roxas',      sub: 'Terminal',     x: 262, y: 140 },
  nccMallVP:       { id: 'nccMallVP',       name: 'NCCC Mall VP',         sub: 'Transfer',     x: 290, y: 135 },
  abreeza:         { id: 'abreeza',         name: 'Abreeza Mall',         sub: 'Transfer',     x: 282, y: 110 },
  lanang:          { id: 'lanang',          name: 'Lanang',               sub: 'Stop',         x: 308, y: 88  },
  buhangin:        { id: 'buhangin',        name: 'Buhangin',             sub: 'Stop',         x: 274, y: 62  },
  citymallNorth:   { id: 'citymallNorth',   name: 'Citymall Northtown',   sub: 'Terminal',     x: 295, y: 38  },
  angliongto:      { id: 'angliongto',      name: 'Angliongto',           sub: 'Stop',         x: 325, y: 70  },
  rCastillo:       { id: 'rCastillo',       name: 'R. Castillo',          sub: 'Stop',         x: 335, y: 92  },
  sasa:            { id: 'sasa',            name: 'Sasa',                 sub: 'Stop',         x: 330, y: 108 },
  panacanDepot:    { id: 'panacanDepot',    name: 'Panacan Depot',        sub: 'Terminal',     x: 355, y: 50  },
  nccPanacan:      { id: 'nccPanacan',      name: 'NCCC Panacan',         sub: 'Terminal',     x: 360, y: 62  },
};

// Build an array of stop objects (each annotated with t = 0..1 progress) from
// an array of hub keys. The bus path is computed from these coords.
function makeStops(hubKeys) {
  const pts = hubKeys.map(k => HUBS[k]).filter(Boolean);
  if (pts.length < 2) return pts.map((p, i) => ({ ...p, t: i }));
  // compute cumulative path length to assign each stop a t in [0..1]
  let lens = [0];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - pts[i-1].x, pts[i].y - pts[i-1].y);
    lens.push(lens[i-1] + d);
  }
  const total = lens[lens.length - 1] || 1;
  return pts.map((p, i) => ({ ...p, t: lens[i] / total }));
}

// Build a smooth SVG path through a list of points using quadratic curves
// (midpoint-to-midpoint with each point as a control). Gives gentle bends.
function buildPath(pts) {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const midX = (pts[i].x + pts[i+1].x) / 2;
    const midY = (pts[i].y + pts[i+1].y) / 2;
    d += ` Q ${pts[i].x} ${pts[i].y} ${midX} ${midY}`;
  }
  d += ` T ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`;
  return d;
}

// Default route — R503 Bangkal → Roxas (matches the default tracked route)
const DEFAULT_ROUTE_STOPS = makeStops(['hopeBangkal', 'spedBangkal', 'matina', 'nccMaa', 'davaoLight']);

// Backwards-compat alias (some code may still reference the old name)
const ROUTE_11_STOPS = DEFAULT_ROUTE_STOPS;
const ROUTE_11_PATH = buildPath(DEFAULT_ROUTE_STOPS);

// Background road network — purely decorative
const ROADS = [
  "M 10 580 Q 80 560 120 540 T 200 470 T 280 400 T 360 320",
  "M 50 50 Q 100 90 150 130 T 250 220 T 340 320 T 400 420",
  "M 0 300 Q 80 290 160 295 T 320 285 T 400 280",
  "M 200 0 Q 210 80 220 160 T 240 320 T 250 500 T 260 600",
  "M 0 200 Q 90 185 180 195 T 360 200",
  "M 80 0 L 100 60 L 95 130 L 130 220 L 145 300",
  "M 300 600 L 295 520 L 320 440 L 315 360",
];

function CompassRose({ dark }) {
  const c = dark ? '#fff' : 'var(--ink-2)';
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12,
      width: 36, height: 36, borderRadius: 18,
      background: 'rgba(255,255,255,0.9)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 1,
    }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: c, letterSpacing: 0.5, lineHeight: 1 }}>N</span>
      <svg width="16" height="14" viewBox="0 0 16 14">
        <path d="M8 1 L11 11 L8 9 L5 11 Z" fill={c} />
      </svg>
    </div>
  );
}

// Bus dot — moves along route based on progress 0..1
function BusOnRoute({ progress, color, pathRef, startPt }) {
  const [pos, setPos] = React.useState({ x: startPt.x, y: startPt.y });
  React.useEffect(() => {
    if (!pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    const pt = pathRef.current.getPointAtLength(len * Math.max(0, Math.min(1, progress)));
    setPos({ x: pt.x, y: pt.y });
  }, [progress, pathRef]);
  return (
    <g transform={`translate(${pos.x}, ${pos.y})`}>
      {/* pulse */}
      <circle r="10" fill={color} opacity="0.18">
        <animate attributeName="r" values="10;22;10" dur="2.2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35" dur="2.2s" repeatCount="indefinite" />
      </circle>
      {/* halo */}
      <circle r="11" fill="#fff" stroke={color} strokeWidth="2" />
      {/* bus icon */}
      <g transform="translate(-6,-6)">
        <rect x="0" y="1" width="12" height="10" rx="2" fill={color} />
        <rect x="2" y="3" width="3" height="2.5" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <rect x="7" y="3" width="3" height="2.5" rx="0.5" fill="rgba(255,255,255,0.85)" />
        <circle cx="3" cy="11" r="1.2" fill="#222" />
        <circle cx="9" cy="11" r="1.2" fill="#222" />
      </g>
    </g>
  );
}

// Stop marker — dot + optional label
function StopMarker({ stop, isCurrent, isPast, color, showLabel = false }) {
  const fill = isCurrent ? color : (isPast ? '#fff' : '#fff');
  const stroke = isCurrent ? color : 'var(--ink-3)';
  const r = isCurrent ? 6 : 4;
  return (
    <g transform={`translate(${stop.x}, ${stop.y})`}>
      {isCurrent && (
        <circle r="14" fill={color} opacity="0.15">
          <animate attributeName="r" values="6;18;6" dur="2.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="2.4s" repeatCount="indefinite" />
        </circle>
      )}
      <circle r={r} fill={fill} stroke={stroke} strokeWidth="2" />
      {showLabel && (
        <g>
          <rect
            x="9" y="-8" rx="3" ry="3"
            width={stop.name.length * 5.2 + 10} height="14"
            fill="rgba(255,255,255,0.92)" stroke="var(--line)" strokeWidth="0.5"
          />
          <text x="14" y="2" fontSize="9" fontFamily="Geist, sans-serif" fontWeight="500" fill="var(--ink-2)">
            {stop.name}
          </text>
        </g>
      )}
    </g>
  );
}

// Main map component — full-bleed inside its container
function DavaoMap({
  progress = 0.62, color = 'var(--primary)', showStopLabels = true,
  zoom = 1, onZoomIn, onZoomOut, onRecenter, dim = false,
  stops = DEFAULT_ROUTE_STOPS,
}) {
  const pathRef = React.useRef(null);
  const pathD = React.useMemo(() => buildPath(stops), [stops]);
  // Find which stop the bus is approaching: smallest stop.t >= progress
  const nextStopIdx = stops.findIndex(s => s.t >= progress);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'var(--map-land)' }}>
      <svg
        viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice"
        style={{
          width: '100%', height: '100%',
          transform: `scale(${zoom})`, transformOrigin: 'center',
          transition: 'transform 0.4s cubic-bezier(0.22, 0.61, 0.36, 1)',
        }}
      >
        {/* defs */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="oklch(0.93 0.008 80)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="water-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="oklch(0.93 0.025 230)" />
            <stop offset="1" stopColor="oklch(0.89 0.030 220)" />
          </linearGradient>
        </defs>

        {/* land + grid */}
        <rect width="400" height="600" fill="var(--map-land)" />
        <rect width="400" height="600" fill="url(#grid)" opacity="0.6" />

        {/* Davao Gulf (water) — right edge */}
        <path
          d="M 400 0 L 400 600 L 340 600 Q 320 500 350 400 Q 380 320 360 220 Q 340 130 380 50 L 400 0 Z"
          fill="url(#water-grad)"
        />
        {/* water ripples */}
        <path d="M 370 100 q 6 4 0 8 t 0 8" fill="none" stroke="oklch(0.85 0.020 220)" strokeWidth="1" opacity="0.6" />
        <path d="M 365 200 q 6 4 0 8 t 0 8" fill="none" stroke="oklch(0.85 0.020 220)" strokeWidth="1" opacity="0.6" />
        <path d="M 360 350 q 6 4 0 8 t 0 8" fill="none" stroke="oklch(0.85 0.020 220)" strokeWidth="1" opacity="0.6" />

        {/* decorative road network */}
        {ROADS.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="var(--map-road)" strokeWidth="8" strokeLinecap="round" opacity="0.95" />
        ))}
        {ROADS.map((d, i) => (
          <path key={'l'+i} d={d} fill="none" stroke="var(--map-road-line)" strokeWidth="0.6" strokeDasharray="3 4" opacity="0.7" />
        ))}

        {/* district labels */}
        <text x="50" y="540" fontSize="9" fill="var(--ink-3)" fontFamily="Geist, sans-serif" fontWeight="500" letterSpacing="1">TORIL</text>
        <text x="60" y="380" fontSize="9" fill="var(--ink-3)" fontFamily="Geist, sans-serif" fontWeight="500" letterSpacing="1">MATINA</text>
        <text x="105" y="280" fontSize="9" fill="var(--ink-3)" fontFamily="Geist, sans-serif" fontWeight="500" letterSpacing="1">BANGKAL</text>
        <text x="160" y="180" fontSize="9" fill="var(--ink-3)" fontFamily="Geist, sans-serif" fontWeight="500" letterSpacing="1">POBLACION</text>
        <text x="230" y="80" fontSize="9" fill="var(--ink-3)" fontFamily="Geist, sans-serif" fontWeight="500" letterSpacing="1">AGDAO</text>
        <text x="345" y="280" fontSize="8" fill="oklch(0.50 0.06 230)" fontFamily="Geist, sans-serif" fontStyle="italic" letterSpacing="0.5">Davao Gulf</text>

        {/* Route — outline + main */}
        <path d={pathD} fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
        <path ref={pathRef} d={pathD} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />

        {/* Stops */}
        {stops.map((s, i) => (
          <StopMarker
            key={s.id || i}
            stop={s}
            color={color}
            isCurrent={i === nextStopIdx}
            isPast={i < nextStopIdx}
            showLabel={showStopLabels}
          />
        ))}

        {/* Bus */}
        <BusOnRoute progress={progress} color={color} pathRef={pathRef} startPt={stops[0]} />
      </svg>

      {/* dim overlay (for layouts where map should recede) */}
      {dim && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />}
    </div>
  );
}

// Compact controls cluster — used by layouts A, C, D
function MapControls({ orientation = 'vertical', onZoomIn, onZoomOut, onRecenter, style = {} }) {
  const horiz = orientation === 'horizontal';
  const btnStyle = {
    width: 36, height: 36, border: 0, background: 'rgba(255,255,255,0.96)',
    borderRadius: 10, boxShadow: 'var(--shadow-sm)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--ink-2)',
  };
  return (
    <div style={{
      position: 'absolute', display: 'flex', flexDirection: horiz ? 'row' : 'column',
      gap: 8, ...style,
    }}>
      <button style={btnStyle} onClick={onRecenter} title="Recenter">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="8" cy="8" r="0.5" fill="currentColor" />
          <path d="M8 1v2M8 13v2M1 8h2M13 8h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>
      <div style={{
        display: 'flex', flexDirection: horiz ? 'row' : 'column',
        background: 'rgba(255,255,255,0.96)', borderRadius: 10, boxShadow: 'var(--shadow-sm)', overflow: 'hidden',
      }}>
        <button style={{ ...btnStyle, background: 'transparent', boxShadow: 'none', borderRadius: 0 }} onClick={onZoomIn}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
        <div style={{ height: horiz ? '60%' : 0.5, width: horiz ? 0.5 : '60%', background: 'var(--line)', alignSelf: 'center' }} />
        <button style={{ ...btnStyle, background: 'transparent', boxShadow: 'none', borderRadius: 0 }} onClick={onZoomOut}>
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { DavaoMap, MapControls, CompassRose, HUBS, makeStops, buildPath, DEFAULT_ROUTE_STOPS, ROUTE_11_STOPS, ROUTE_11_PATH });
