/**
 * <Art /> — bundled, offline-safe illustrations.
 *
 * Every screen previously depended on remote Unsplash photos; when those failed
 * a section collapsed to bare background. These are inline SVGs shipped in the
 * bundle, so there is always real artwork behind (or instead of) a photo.
 */

export type ArtVariant =
  | 'glucose'
  | 'walk'
  | 'med'
  | 'doctor'
  | 'family'
  | 'shield'
  | 'trophy'
  | 'chart'
  | 'night'
  | 'spark'
  | 'celebrate'
  | 'phone'

const PALETTE: Record<ArtVariant, [string, string]> = {
  glucose: ['#2a1f04', '#0e0e10'],
  walk: ['#10240f', '#0e0e10'],
  med: ['#241a2e', '#0e0e10'],
  doctor: ['#06222b', '#0e0e10'],
  family: ['#2b1414', '#0e0e10'],
  shield: ['#1a1f2e', '#0e0e10'],
  trophy: ['#2d2306', '#0e0e10'],
  chart: ['#0d2430', '#0e0e10'],
  night: ['#161a33', '#0e0e10'],
  spark: ['#2a2308', '#0e0e10'],
  celebrate: ['#2c1a26', '#0e0e10'],
  phone: ['#1d2116', '#0e0e10'],
}

const LABELS: Record<ArtVariant, string> = {
  glucose: 'Glucometer illustration',
  walk: 'Evening walk illustration',
  med: 'Medication illustration',
  doctor: 'Doctor report illustration',
  family: 'Caregiver cheer illustration',
  shield: 'Privacy shield illustration',
  trophy: 'Achievement trophy illustration',
  chart: 'Trend chart illustration',
  night: 'Sleep and rest illustration',
  spark: 'Celebration spark illustration',
  celebrate: 'Confetti illustration',
  phone: 'App preview illustration',
}

function Scene({ variant }: { variant: ArtVariant }) {
  switch (variant) {
    case 'glucose':
      return (
        <>
          <rect x="128" y="46" width="144" height="176" rx="22" fill="#17171a" stroke="#FFD700" strokeWidth="2" />
          <rect x="150" y="70" width="100" height="58" rx="8" fill="#0b2011" stroke="#1f7a3a" strokeWidth="1.5" />
          <text x="200" y="110" textAnchor="middle" fontFamily="monospace" fontSize="34" fontWeight="700" fill="#38e07b">
            118
          </text>
          <circle cx="164" cy="158" r="7" fill="#FACC15" />
          <circle cx="186" cy="158" r="7" fill="#2a2a2e" />
          <rect x="152" y="182" width="96" height="10" rx="5" fill="#2a2a2e" />
          <rect x="272" y="150" width="14" height="70" rx="4" fill="#3a3a40" transform="rotate(-14 279 185)" />
          <circle cx="286" cy="222" r="9" fill="#e5484d" opacity="0.85" />
        </>
      )
    case 'walk':
      return (
        <>
          <circle cx="316" cy="66" r="26" fill="#FACC15" opacity="0.85" />
          <path d="M20 236 C 110 200, 150 150, 215 150 S 320 190, 392 120" stroke="#FFD700" strokeWidth="3" fill="none" strokeDasharray="10 9" opacity="0.8" />
          <ellipse cx="120" cy="222" rx="13" ry="20" fill="#8a8a92" opacity="0.55" transform="rotate(-8 120 222)" />
          <ellipse cx="152" cy="206" rx="13" ry="20" fill="#b9b9c0" opacity="0.5" transform="rotate(-8 152 206)" />
          <ellipse cx="238" cy="168" rx="12" ry="18" fill="#8a8a92" opacity="0.45" transform="rotate(-4 238 168)" />
          <rect x="20" y="24" width="86" height="26" rx="13" fill="#17171a" stroke="#2f2f34" />
          <text x="63" y="42" textAnchor="middle" fontSize="13" fill="#FFD700" fontFamily="sans-serif">20 min</text>
        </>
      )
    case 'med':
      return (
        <>
          <rect x="146" y="70" width="108" height="140" rx="14" fill="#1b1b20" stroke="#FFD700" strokeWidth="2" />
          <rect x="146" y="70" width="108" height="30" rx="14" fill="#FFD700" opacity="0.85" />
          <rect x="164" y="120" width="72" height="66" rx="8" fill="#0f0f12" stroke="#2f2f34" />
          <rect x="176" y="136" width="48" height="8" rx="4" fill="#FACC15" opacity="0.8" />
          <rect x="176" y="152" width="34" height="8" rx="4" fill="#3a3a40" />
          <g transform="rotate(-18 300 190)">
            <rect x="272" y="176" width="60" height="28" rx="14" fill="#ff9d4d" />
            <rect x="302" y="176" width="30" height="28" rx="14" fill="#ffe0bd" />
          </g>
          <circle cx="66" cy="190" r="24" fill="#e8e8ee" />
          <rect x="42" y="186" width="48" height="8" rx="4" fill="#c9c9d2" />
        </>
      )
    case 'doctor':
      return (
        <>
          <rect x="112" y="40" width="176" height="188" rx="16" fill="#17171a" stroke="#2f2f34" />
          <rect x="150" y="28" width="100" height="26" rx="10" fill="#FFD700" opacity="0.9" />
          <rect x="136" y="82" width="128" height="8" rx="4" fill="#3a3a40" />
          <polyline points="136,180 168,150 196,166 232,110 264,132" fill="none" stroke="#FACC15" strokeWidth="3.5" strokeLinecap="round" />
          <rect x="136" y="200" width="56" height="10" rx="5" fill="#2a2a2e" />
          <rect x="204" y="200" width="60" height="10" rx="5" fill="#2a2a2e" />
          <circle cx="336" cy="200" r="30" fill="#0b2a33" stroke="#34d3e0" strokeWidth="2" />
          <text x="336" y="209" textAnchor="middle" fontSize="22" fill="#34d3e0" fontFamily="sans-serif">A1c</text>
        </>
      )
    case 'family':
      return (
        <>
          <circle cx="200" cy="96" r="30" fill="#FFD700" opacity="0.22" />
          <path
            d="M200 128 C 172 108, 156 126, 200 160 C 244 126, 228 108, 200 128 Z"
            fill="#e5484d"
            opacity="0.9"
          />
          <circle cx="104" cy="140" r="22" fill="#c9c9d2" />
          <rect x="76" y="166" width="56" height="62" rx="24" fill="#8a8a92" />
          <circle cx="296" cy="140" r="22" fill="#c9c9d2" />
          <rect x="268" y="166" width="56" height="62" rx="24" fill="#8a8a92" />
          <circle cx="200" cy="196" r="26" fill="#e8e8ee" />
          <rect x="166" y="226" width="68" height="34" rx="16" fill="#b9b9c0" />
        </>
      )
    case 'shield':
      return (
        <>
          <path d="M200 34 L288 70 v76 c0 54-38 84-88 100 -50-16-88-46-88-100 V70 Z" fill="#17171a" stroke="#FFD700" strokeWidth="2.5" />
          <path d="M168 132 l24 26 42-52" fill="none" stroke="#38e07b" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="84" cy="72" r="7" fill="#FACC15" opacity="0.7" />
          <circle cx="322" cy="196" r="9" fill="#FACC15" opacity="0.5" />
        </>
      )
    case 'trophy':
      return (
        <>
          <path d="M148 62 h104 v44 a52 52 0 0 1 -104 0 Z" fill="#FFD700" />
          <path d="M148 74 h-26 a26 26 0 0 0 26 26 M252 74 h26 a26 26 0 0 1 -26 26" fill="none" stroke="#FFD700" strokeWidth="6" />
          <rect x="188" y="156" width="24" height="34" fill="#c9a000" />
          <rect x="158" y="190" width="84" height="16" rx="6" fill="#FFD700" />
          <text x="200" y="98" textAnchor="middle" fontSize="30" fill="#3a2c00" fontFamily="sans-serif" fontWeight="700">★</text>
          <circle cx="310" cy="72" r="5" fill="#FACC15" />
          <circle cx="96" cy="168" r="6" fill="#FACC15" opacity="0.7" />
        </>
      )
    case 'chart':
      return (
        <>
          <rect x="72" y="44" width="256" height="172" rx="14" fill="#17171a" stroke="#2f2f34" />
          <polyline points="96,180 136,150 176,162 216,104 256,124 300,74" fill="none" stroke="#FFD700" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M96 180 L136 150 L176 162 L216 104 L256 124 L300 74 L300 196 L96 196 Z" fill="#FFD700" opacity="0.14" />
          <line x1="96" y1="196" x2="300" y2="196" stroke="#3a3a40" strokeWidth="2" />
          <circle cx="216" cy="104" r="6" fill="#FACC15" />
          <circle cx="300" cy="74" r="6" fill="#FACC15" />
        </>
      )
    case 'night':
      return (
        <>
          <path d="M244 58 a54 54 0 1 0 46 84 a44 44 0 0 1 -46 -84 Z" fill="#FFD700" opacity="0.9" />
          <circle cx="120" cy="80" r="3.5" fill="#fff" opacity="0.8" />
          <circle cx="164" cy="128" r="2.5" fill="#fff" opacity="0.6" />
          <circle cx="92" cy="164" r="3" fill="#fff" opacity="0.7" />
          <circle cx="312" cy="186" r="2.5" fill="#fff" opacity="0.5" />
          <path d="M40 228 h320" stroke="#2f2f34" strokeWidth="3" />
        </>
      )
    case 'celebrate':
      return (
        <>
          <circle cx="200" cy="140" r="42" fill="#FFD700" opacity="0.25" />
          <circle cx="200" cy="140" r="20" fill="#FACC15" />
          <rect x="88" y="70" width="14" height="14" rx="3" fill="#e5484d" transform="rotate(24 95 77)" />
          <rect x="298" y="92" width="14" height="14" rx="3" fill="#34d3e0" transform="rotate(-18 305 99)" />
          <rect x="120" y="196" width="14" height="14" rx="3" fill="#38e07b" transform="rotate(40 127 203)" />
          <rect x="286" y="200" width="14" height="14" rx="3" fill="#ff9d4d" transform="rotate(-30 293 207)" />
          <circle cx="248" cy="62" r="6" fill="#FACC15" />
          <circle cx="136" cy="120" r="5" fill="#34d3e0" />
        </>
      )
    case 'phone':
      return (
        <>
          <rect x="150" y="34" width="104" height="196" rx="20" fill="#17171a" stroke="#FFD700" strokeWidth="2" />
          <rect x="162" y="52" width="80" height="128" rx="10" fill="#0f0f12" />
          <circle cx="202" cy="98" r="30" fill="none" stroke="#FFD700" strokeWidth="6" strokeDasharray="128 32" strokeLinecap="round" transform="rotate(-90 202 98)" />
          <text x="202" y="106" textAnchor="middle" fontSize="20" fill="#FFD700" fontFamily="sans-serif" fontWeight="700">24</text>
          <rect x="176" y="150" width="52" height="8" rx="4" fill="#2f2f34" />
          <rect x="186" y="168" width="32" height="8" rx="4" fill="#2f2f34" />
          <circle cx="202" cy="208" r="7" fill="#2f2f34" />
        </>
      )
    case 'spark':
    default:
      return (
        <>
          <circle cx="200" cy="130" r="70" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.5" />
          <circle cx="200" cy="130" r="44" fill="none" stroke="#FACC15" strokeWidth="2.5" opacity="0.75" />
          <circle cx="200" cy="130" r="18" fill="#FACC15" />
          <path d="M200 26 v28 M200 206 v28 M96 130 h28 M276 130 h28" stroke="#FFD700" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        </>
      )
  }
}

export function Art({
  variant = 'spark',
  className,
}: {
  variant?: ArtVariant
  className?: string
}) {
  const [from, to] = PALETTE[variant] ?? PALETTE.spark
  const id = `art-grad-${variant}`
  return (
    <div className={`art ${className ?? ''}`} aria-hidden={false}>
      <svg
        viewBox="0 0 400 260"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={LABELS[variant] ?? 'Illustration'}
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <rect width="400" height="260" fill={`url(#${id})`} />
        <Scene variant={variant} />
      </svg>
    </div>
  )
}
