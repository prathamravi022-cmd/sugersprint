import { useState } from 'react'
import { themeFor } from '../constants'
import { currentStreak, useStore } from '../store'
import { Screen, TopBar } from '../components/Toast'
import { ViewToggle } from '../components/ViewToggle'
import { SiteFooter } from '../components/SiteFooter'
import { CHEER_EMOJIS } from '../constants'
import { todayISO } from '../types'

/**
 * Caregiver Dashboard (Frontend Spec §6) — frictionless web view.
 * Strictly positive reinforcement only: no raw numbers, no nagging.
 * Status first, then a 3-tap emoji cheer grid.
 */
export function Caregiver() {
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const logs = useStore((s) => s.logs)
  const cheers = useStore((s) => s.cheers)
  const sendCheer = useStore((s) => s.sendCheer)
  const [sent, setSent] = useState<string | null>(null)

  const todayLog = logs.find((l) => l.log_date === todayISO())
  const streak = currentStreak(logs, sprint)
  const theme = sprint ? themeFor(sprint.sprint_type) : null
  const patientName = user?.name ?? 'Your loved one'

  const statusText = todayLog
    ? `${patientName} completed today's sprint${streak > 1 ? ` — ${streak} day streak!` : '!'}`
    : `${patientName} hasn't done today's sprint yet. A gentle cheer can work wonders.`

  return (
    <div className="care-shell">
      <TopBar />
      <Screen>
        <div className="row-between">
          <div className="stack" style={{ gap: 4 }}>
            <h1 className="h1">Family Corner 💛</h1>
            <p className="sub">Positive vibes only — because support beats nagging.</p>
          </div>
          <ViewToggle />
        </div>

        {/* Status banner — the only thing that matters here */}
        <div className="status-banner">
          <span className="status-emoji">{todayLog ? '✅' : '⏳'}</span>
          <div>
            <p style={{ fontWeight: 700 }}>{statusText}</p>
            {theme && (
              <p className="small muted" style={{ marginTop: 4 }}>
                Sprint: {theme.emoji} {theme.name} · Streak: {streak} day{streak === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>

        {/* Cheer grid */}
        <div className="card stack">
          <span className="section-title">Send a cheer</span>
          <div className="cheer-grid">
            {CHEER_EMOJIS.map((e) => (
              <button
                key={e}
                className={`cheer-btn${sent === e ? ' sent' : ''}`}
                onClick={async () => {
                  await sendCheer(e)
                  setSent(e)
                  window.setTimeout(() => setSent(null), 1600)
                }}
              >
                {sent === e ? 'Sent!' : e}
              </button>
            ))}
          </div>
          <p className="small muted">
            Cheering does not reveal any health data — just a burst of encouragement on their
            screen.
          </p>
        </div>

        {/* Recent cheers activity */}
        {cheers.length > 0 && (
          <div className="card stack">
            <span className="section-title">Recent activity</span>
            {[...cheers]
              .reverse()
              .slice(0, 6)
              .map((c) => (
                <div key={c.id} className="row-between">
                  <span>
                    {c.emoji_type} <span className="muted small">{c.caregiver_name}</span>
                  </span>
                  <span className="small muted">
                    {new Date(c.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
          </div>
        )}

        <p className="small muted center" style={{ marginTop: 'auto', paddingTop: 8 }}>
          Raw glucose values are hidden by design (Security Spec §2). Ask for a doctor report
          instead — it's kinder and more useful.
        </p>
      </Screen>
      <SiteFooter />
    </div>
  )
}
