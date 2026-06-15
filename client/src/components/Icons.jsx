// Central SVG icon set — replaces emoji throughout the app and dedupes
// repeated inline SVGs. All icons share a 24×24 viewBox and inherit color via
// `currentColor`, so size/color are controlled by the parent (font-size or
// explicit width/height). Stroke icons use round caps to match the brand.

function Svg({ size = 18, stroke = true, children, ...rest }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={stroke ? 'none' : 'currentColor'}
      stroke={stroke ? 'currentColor' : 'none'}
      strokeWidth={stroke ? 2 : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function BusIcon({ size = 18 }) {
  return (
    <Svg size={size} strokeWidth={1.75}>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <path d="M2 10h20M8 4v6M16 4v6" />
      <circle cx="7" cy="17.5" r="1.5" />
      <circle cx="17" cy="17.5" r="1.5" />
    </Svg>
  )
}

export function SearchIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </Svg>
  )
}

export function HeartIcon({ size = 18, filled = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function AlertIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Svg>
  )
}

export function ClockIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </Svg>
  )
}

export function LocationIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </Svg>
  )
}

export function PinIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </Svg>
  )
}

export function TrashIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </Svg>
  )
}

export function SparkIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </Svg>
  )
}

export function RouteIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <circle cx="6" cy="19" r="3" />
      <circle cx="18" cy="5" r="3" />
      <path d="M9 19h4a4 4 0 0 0 4-4V9" />
    </Svg>
  )
}

export function SwapIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M7 10l-3 3 3 3M4 13h11M17 14l3-3-3-3M20 11H9" />
    </Svg>
  )
}

export function ArrowRightIcon({ size = 18 }) {
  return (
    <Svg size={size}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  )
}
