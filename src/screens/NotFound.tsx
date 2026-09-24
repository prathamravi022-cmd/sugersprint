import { Link } from 'react-router-dom'
import { Art } from '../components/Art'
import { Screen, TopBar } from '../components/Toast'

const SHORTCUTS = [
  { to: '/app', emoji: '🎯', title: 'Today’s challenge', copy: 'Jump back into your sprint' },
  { to: '/capture', emoji: '📷', title: 'Quick capture', copy: 'Log a reading, walk or dose' },
  { to: '/report', emoji: '📄', title: 'Doctor report', copy: 'Generate a clinician-ready summary' },
  { to: '/badges', emoji: '🏆', title: 'Achievements', copy: 'See your badges and level' },
  { to: '/care', emoji: '💛', title: 'Care circle', copy: 'Cheer someone on' },
  { to: '/settings', emoji: '⚙️', title: 'Settings', copy: 'Units, reminders and your data' },
]

/** Custom 404 — keeps the brand instead of silently redirecting home. */
export function NotFound() {
  return (
    <div className="phone-shell">
      <Screen>
        <TopBar />
        <div className="empty-state" style={{ marginTop: 12 }}>
          <div className="empty-art">
            <Art variant="night" />
            <span className="empty-emoji" aria-hidden>
              🧭
            </span>
          </div>
          <h1 className="empty-title">404 — Off the track</h1>
          <p className="empty-copy">
            This page isn’t part of the sprint. Nothing is lost — your streak and logs are
            exactly where you left them. Pick a path below.
          </p>
          <div className="empty-action" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link to="/app" className="btn btn-yellow" style={{ width: 'auto', padding: '13px 20px' }}>
              ← Back to dashboard
            </Link>
            <Link to="/" className="btn btn-ghost" style={{ width: 'auto', padding: '13px 20px' }}>
              Landing page
            </Link>
          </div>
        </div>

        <span className="section-title">Popular places</span>
        <div className="link-grid">
          {SHORTCUTS.map((s) => (
            <Link key={s.to} to={s.to} className="link-tile">
              <span className="lt-emoji" aria-hidden>
                {s.emoji}
              </span>
              <span className="lt-title">{s.title}</span>
              <span className="lt-copy">{s.copy}</span>
            </Link>
          ))}
        </div>

        <p className="small muted">
          Typed the address by hand? Double-check the URL, or use the navigation bar at the top.
        </p>
      </Screen>
    </div>
  )
}
