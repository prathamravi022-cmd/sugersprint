import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Dual-view toggle (Feature §3.3): instantly switches between
 * Patient View and Caregiver View without a page reload feel.
 */
export function ViewToggle() {
  const nav = useNavigate()
  const { pathname } = useLocation()
  const onCare = pathname.startsWith('/care')

  return (
    <div className="view-toggle" role="tablist" aria-label="Switch view">
      <button
        role="tab"
        aria-selected={!onCare}
        className={!onCare ? 'on' : ''}
        onClick={() => nav('/app')}
      >
        🧑‍⚕️ Patient
      </button>
      <button
        role="tab"
        aria-selected={onCare}
        className={onCare ? 'on' : ''}
        onClick={() => nav('/care')}
      >
        💛 Caregiver
      </button>
    </div>
  )
}
