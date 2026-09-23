import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { themeFor } from '../constants'
import { currentStreak, sprintDayNumber, useStore } from '../store'
import { CheersRow } from '../components/CheersRow'
import { StreakRing } from '../components/StreakRing'
import { TaskCard } from '../components/TaskCard'
import { Screen, TopBar } from '../components/Toast'
import { ViewToggle } from '../components/ViewToggle'
import { TOTAL_DAYS, diffDays, todayISO } from '../types'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

/**
 * Dashboard — mobile-first single column; at ≥1024px becomes a
 * 3-column grid: progress sidebar · challenge hub · cheer feed + report.
 */
export function Dashboard() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const logs = useStore((s) => s.logs)
  const cheers = useStore((s) => s.cheers)
  const synced = useStore((s) => s.synced)
  const simulateOffline = useStore((s) => s.simulateOffline)
  const undoToday = useStore((s) => s.undoToday)
  const pushToast = useStore((s) => s.pushToast)
  const triggerConfetti = useStore((s) => s.triggerConfetti)

  const todayLog = useMemo(() => logs.find((l) => l.log_date === todayISO()), [logs])
  const streak = currentStreak(logs, sprint)
  const theme = sprint ? themeFor(sprint.sprint_type) : null
  const offline = !synced
  const dayNumber = sprint ? sprintDayNumber(sprint) : 1
  const glucoseValues = logs
    .filter((l) => l.value != null && sprint?.sprint_type === 'glucose')
    .map((l) => Number(l.value))
  const avgGlucose =
    glucoseValues.length > 0
      ? Math.round(glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length)
      : null

  if (!sprint || !user) return null

  return (
    <div className="phone-shell wide">
      <Screen>
        <TopBar name={user.name} onSettings={() => pushToast('⚙️ Settings & data controls (demo)')} />

        <div className="row-between">
          <h1 className="h1">
            {greeting()}, {user.name.split(' ')[0]} 👋
          </h1>
          <ViewToggle />
        </div>

        <div className="dash-grid">
          {/* ---------------- LEFT: 30-day sprint progress ---------------- */}
          <aside className="dash-col left">
            <StreakRing sprint={sprint} streak={streak} logs={logs.length} />

            <div className="card stack" style={{ gap: 10 }}>
              <span className="section-title">
                Day {dayNumber} of {TOTAL_DAYS}
              </span>
              <div className="day-strip">
                {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
                  const d = i + 1
                  const done = i < logs.length || (d < dayNumber && streak >= d)
                  return (
                    <span
                      key={i}
                      className={`day-cell${done ? ' hit' : ''}${d === dayNumber ? ' today' : ''}`}
                    >
                      {d}
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="stat-card">
                <div className="stat-value numeric">{streak}</div>
                <div className="stat-label">Day streak</div>
              </div>
              <div className="stat-card">
                <div className="stat-value numeric">{logs.length}</div>
                <div className="stat-label">Sprints done</div>
              </div>
            </div>
          </aside>

          {/* ---------------- CENTER: daily challenge hub ---------------- */}
          <section className="dash-col center">
            {offline && (
              <div className="badge yellow" role="status">
                📵 Offline mode — your log is saved and will sync
              </div>
            )}

            <div className="stack" style={{ gap: 10 }}>
              <span className="section-title">Today’s challenge · one card, zero clutter</span>
              <TaskCard
                type={sprint.sprint_type}
                log={todayLog}
                streak={streak}
                onClick={() => {
                  if (todayLog) {
                    triggerConfetti()
                    pushToast('🏆 Already completed today — see you tomorrow!')
                  } else {
                    nav('/capture')
                  }
                }}
              />
              {todayLog && (
                <button className="btn-link" onClick={() => void undoToday()}>
                  Undo today’s entry (demo)
                </button>
              )}
            </div>

            {/* Quick capture widgets */}
            <div className="stack" style={{ gap: 10 }}>
              <span className="section-title">Quick actions</span>
              <div className="quick-actions">
                <button className="quick-action" onClick={() => nav('/capture')}>
                  <span className="ico">📷</span>
                  Camera OCR
                </button>
                <button className="quick-action" onClick={() => nav('/capture')}>
                  <span className="ico">🎙️</span>
                  Voice Note
                </button>
                <button className="quick-action" onClick={() => nav('/capture')}>
                  <span className="ico">⏱️</span>
                  Walk Timer
                </button>
              </div>
            </div>

            {/* No-guilt nudge */}
            {!todayLog && diffDays(todayISO(), sprint.start_date) > 0 && streak === 0 && (
              <div className="card stack" style={{ borderLeft: '4px solid var(--gold)' }}>
                <span className="task-label" style={{ color: 'var(--gold)' }}>
                  Fresh start
                </span>
                <p className="sub">
                  Missed a day? No problem. Your historic streak stays on the books — today is
                  a clean slate. One small win, right now. 💪
                </p>
              </div>
            )}

            <CheersRow cheers={cheers} />
          </section>

          {/* ---------------- RIGHT: cheer feed + doctor summary ---------------- */}
          <aside className="dash-col right">
            <div className="card stack" style={{ gap: 6 }}>
              <div className="row-between">
                <span className="section-title">Live cheer feed</span>
                <Link to="/care" className="small">
                  Send →
                </Link>
              </div>
              {cheers.length === 0 ? (
                <p className="sub" style={{ padding: '8px 0' }}>
                  No cheers yet. Your caregiver’s next tap lands here — with confetti. ✨
                </p>
              ) : (
                [...cheers]
                  .reverse()
                  .slice(0, 6)
                  .map((c) => (
                    <div className="cheer-feed-item" key={c.id}>
                      <span className="emo">{c.emoji_type}</span>
                      <span className="stack" style={{ gap: 2 }}>
                        <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                          {c.caregiver_name}
                        </span>
                        <span className="small muted">
                          {relativeTime(c.created_at)} · sprint completed
                        </span>
                      </span>
                    </div>
                  ))
              )}
            </div>

            <div className="report-preview stack" style={{ gap: 10 }}>
              <span className="section-title">Doctor summary preview</span>
              <div className="rp-row">
                <span className="muted">Sprint</span>
                <span>{theme?.name}</span>
              </div>
              <div className="rp-row">
                <span className="muted">Days completed</span>
                <span className="numeric gold-text">{logs.length} / {dayNumber}</span>
              </div>
              <div className="rp-row">
                <span className="muted">Streak</span>
                <span className="numeric gold-text">
                  {streak} day{streak === 1 ? '' : 's'}
                </span>
              </div>
              {avgGlucose != null && (
                <div className="rp-row">
                  <span className="muted">Avg glucose</span>
                  <span className="numeric gold-text">{avgGlucose} mg/dL</span>
                </div>
              )}
              <div className="rp-row">
                <span className="muted">Cheers received</span>
                <span className="numeric gold-text">{cheers.length}</span>
              </div>
              <Link to="/report" className="btn btn-gold" style={{ marginTop: 6 }}>
                📄 Generate PDF Report
              </Link>
            </div>

            <div className="stack" style={{ gap: 10 }}>
              <span className="section-title">Demo controls</span>
              <button
                className="btn btn-ghost"
                onClick={() => simulateOffline(!offline)}
                style={{ fontSize: '0.85rem', padding: '12px 14px' }}
              >
                {offline ? '📶 Go back online' : '📵 Simulate offline'}
              </button>
            </div>
          </aside>
        </div>
      </Screen>
    </div>
  )
}

function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}
