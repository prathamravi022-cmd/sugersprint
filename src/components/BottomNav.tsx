import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/app', ico: '🏠', label: 'Home' },
  { to: '/capture', ico: '⚡', label: 'Sprint' },
  { to: '/insights', ico: '📈', label: 'Insights' },
  { to: '/care', ico: '💛', label: 'Caregiver' },
  { to: '/report', ico: '📄', label: 'Report' },
]

/** Sticky bottom navigation — mobile only (hidden ≥1024px by CSS). */
export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Primary">
      {ITEMS.map((it) => (
        <NavLink key={it.to} to={it.to} className={({ isActive }) => (isActive ? 'on' : '')}>
          <span className="ico" aria-hidden>
            {it.ico}
          </span>
          {it.label}
        </NavLink>
      ))}
    </nav>
  )
}
