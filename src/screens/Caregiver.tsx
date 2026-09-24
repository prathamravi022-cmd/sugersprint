import { useState } from 'react'
import { themeFor } from '../constants'
import { currentStreak, useStore } from '../store'
import { Screen, TopBar } from '../components/Toast'
import { ViewToggle } from '../components/ViewToggle'
import { SiteFooter } from '../components/SiteFooter'
import { CHEER_EMOJIS } from '../constants'
import { todayISO } from '../types'
import { applyToneGuard } from '../lib/content'
import { Avatar, unsplash } from '../components/Photo'

/**
 * Caregiver Dashboard (Frontend Spec §6) — frictionless, positivity-only.
 * v3: custom message w/ tone guard, scheduled cheer, nickname, RBAC matrix,
 * notification preview.
 */
export function Caregiver() {
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const logs = useStore((s) => s.logs)
  const cheers = useStore((s) => s.cheers)
  const prefs = useStore((s) => s.prefs)
  const sendCheer = useStore((s) => s.sendCheer)
  const setPrefs = useStore((s) => s.setPrefs)
  const pushToast = useStore((s) => s.pushToast)
  const [sent, setSent] = useState<string | null>(null)
  const [custom, setCustom] = useState('')

  const todayLog = logs.find((l) => l.log_date === todayISO())
  const streak = currentStreak(logs, sprint, useStore.getState().shieldDays)
  const theme = sprint ? themeFor(sprint.sprint_type) : null
  const patientName = user?.name ?? 'Your loved one'
  const guarded = applyToneGuard(custom)

  const statusText = todayLog
    ? `${patientName} completed today’s sprint${streak > 1 ? ` — ${streak}-day streak!` : '!'}`
    : `${patientName} hasn’t done today’s sprint yet. A gentle cheer can work wonders.`

  const cheer = async (emoji: (typeof CHEER_EMOJIS)[number], message?: string) => {
    const clean = message?.trim()
    await sendCheer(emoji, clean || undefined)
    setSent(emoji)
    window.setTimeout(() => setSent(null), 1600)
    if (clean && applyToneGuard(clean).guarded) {
      pushToast('🛡️ Tone guard softened your message 💛')
    }
  }

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

        {/* Status banner */}
        <div className="status-banner">
          <span className="status-emoji">{todayLog ? '✅' : '⏳'}</span>
          <div>
            <p style={{ fontWeight: 700 }}>{statusText}</p>
            {theme && (
              <p className="small muted" style={{ marginTop: 4 }}>
                Sprint: {theme.emoji} {theme.name} · Streak: {streak} day
                {streak === 1 ? '' : 's'}
              </p>
            )}
          </div>
        </div>

        {/* Notification preview — what the push looks like on their phone */}
        <div className="card stack" style={{ gap: 10 }}>
          <span className="section-title">Push notification preview</span>
          <div
            className="row"
            style={{
              gap: 12,
              background: 'var(--glass-2)',
              border: '1px solid var(--border)',
              borderRadius: 14,
              padding: 12,
            }}
          >
            <span
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: 'linear-gradient(140deg, var(--gold), var(--gold-deep))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
              }}
            >
              🏃
            </span>
            <span className="stack" style={{ gap: 2 }}>
              <span className="small" style={{ fontWeight: 700 }}>
                SugarSprint · now
              </span>
              <span className="small muted">
                {patientName.split(' ')[0]} completed today’s
                {theme ? ` ${theme.emoji} ${theme.type}` : ''} sprint
                {streak > 1 ? `! ${streak}-day streak!` : '!'} Tap to cheer 👏
              </span>
            </span>
          </div>
        </div>

        {/* Cheer grid + custom message */}
        <div className="card stack">
          <span className="section-title">Send a cheer</span>
          <div className="cheer-grid">
            {CHEER_EMOJIS.map((e) => (
              <button
                key={e}
                className={`cheer-btn${sent === e ? ' sent' : ''}`}
                onClick={() => void cheer(e)}
              >
                {sent === e ? 'Sent!' : e}
              </button>
            ))}
          </div>

          <div className="field" style={{ marginTop: 6 }}>
            <label htmlFor="custom">Add a kind word (optional, 60 chars)</label>
            <div className="row" style={{ gap: 8 }}>
              <input
                id="custom"
                className="input"
                placeholder="e.g. So proud of you today!"
                maxLength={60}
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && custom.trim()) {
                    void cheer('❤️', custom)
                    setCustom('')
                  }
                }}
              />
              <button
                className="btn btn-yellow"
                style={{ width: 'auto', padding: '14px 18px' }}
                disabled={!custom.trim()}
                onClick={() => {
                  void cheer('❤️', custom)
                  setCustom('')
                }}
              >
                Send
              </button>
            </div>
            {guarded.guarded && (
              <span className="small gold-text">
                🛡️ Tone guard will deliver: “{guarded.safe}”
              </span>
            )}
          </div>

          <p className="small muted">
            Cheering does not reveal any health data — just a burst of encouragement on their
            screen.
          </p>
        </div>

        {/* Scheduled cheer */}
        <div className="card stack" style={{ gap: 10 }}>
          <div className="row-between">
            <span className="section-title">Scheduled morning cheer</span>
            <div className="view-toggle">
              <button
                className={prefs.scheduledCheer ? 'on' : ''}
                onClick={() => {
                  setPrefs({ scheduledCheer: !prefs.scheduledCheer })
                  pushToast(
                    prefs.scheduledCheer
                      ? '⏰ Morning cheer paused'
                      : '⏰ Every day at 8:00 AM, a cheer sends automatically',
                  )
                }}
              >
                {prefs.scheduledCheer ? 'On' : 'Off'}
              </button>
            </div>
          </div>
          <p className="small muted">
            {prefs.scheduledCheer
              ? '🌅 “Rise & shine — your streak is waiting!” will be sent daily at 8:00 AM.'
              : 'Turn on to send an automatic good-morning nudge — kind, never demanding.'}
          </p>
          <div className="field">
            <label htmlFor="nick">Your display name</label>
            <input
              id="nick"
              className="input"
              maxLength={28}
              value={prefs.caregiverNick}
              onChange={(e) => setPrefs({ caregiverNick: e.target.value })}
            />
          </div>
        </div>

        {/* RBAC transparency matrix */}
        <div className="card stack" style={{ gap: 8 }}>
          <span className="section-title">What you can see (by design)</span>
          <div className="rp-row">
            <span className="muted">Daily sprint status</span>
            <span className="gold-text">✅ Visible</span>
          </div>
          <div className="rp-row">
            <span className="muted">Streak count</span>
            <span className="gold-text">✅ Visible</span>
          </div>
          <div className="rp-row">
            <span className="muted">Raw glucose values</span>
            <span style={{ color: 'var(--danger)' }}>🚫 Hidden</span>
          </div>
          <div className="rp-row">
            <span className="muted">Photos & voice notes</span>
            <span style={{ color: 'var(--danger)' }}>🚫 Hidden</span>
          </div>
          <p className="small muted">
            Least-privilege access keeps you a motivator, not a monitor (Security Spec §2).
          </p>
        </div>

        {/* Recent activity */}
        {cheers.length > 0 && (
          <div className="card stack">
            <span className="section-title">Recent activity</span>
            {[...cheers]
              .reverse()
              .slice(0, 6)
              .map((c) => (
                <div key={c.id} className="row-between">
                  <span>
                    {c.emoji_type}{' '}
                    <span className="muted small">{c.caregiver_name}</span>
                    {c.message && <span className="small gold-text"> — “{c.message}”</span>}
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

        {/* Care avatar + reminder */}
        <div className="card row" style={{ gap: 14 }}>
          <span style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', flex: '0 0 auto', border: '1px solid var(--border-strong)' }}>
            <Avatar
              src={unsplash('photo-1494790108377-be9c29b29330', 160)}
              alt="Caregiver"
              emoji="👩"
            />
          </span>
          <span className="stack" style={{ gap: 3 }}>
            <span style={{ fontWeight: 700 }}>You’re {prefs.caregiverNick}</span>
            <span className="small muted">
              Your cheers reached {patientName.split(' ')[0]} {cheers.length} time
              {cheers.length === 1 ? '' : 's'}. Keep it kind — that’s the whole superpower.
            </span>
          </span>
        </div>

        <p className="small muted center" style={{ marginTop: 'auto', paddingTop: 8 }}>
          Raw glucose values are hidden by design (Security Spec §2). Ask for a doctor report
          instead — it’s kinder and more useful.
        </p>
      </Screen>
      <SiteFooter />
    </div>
  )
}
