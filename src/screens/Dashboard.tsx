import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { themeFor } from '../constants'
import { currentStreak, sprintDayNumber, useStore } from '../store'
import { CheersRow } from '../components/CheersRow'
import { StreakRing } from '../components/StreakRing'
import { TaskCard } from '../components/TaskCard'
import { Screen, TopBar } from '../components/Toast'
import { ViewToggle } from '../components/ViewToggle'
import { Art, type ArtVariant } from '../components/Art'
import { EmptyState, SectionBand } from '../components/SectionBand'
import { TOTAL_DAYS, addDaysISO, diffDays, todayISO } from '../types'
import type { SprintType } from '../types'
import { fmtDate, glucoseUnitLabel, relativeTime } from '../lib/format'
import { levelForXp, levelTitle } from '../lib/badges'
import { MOODS, factOfToday, quoteOfToday, tipOfToday } from '../lib/content'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

const SPRINT_ART: Record<SprintType, ArtVariant> = {
  glucose: 'glucose',
  walk: 'walk',
  med: 'med',
}

const SPRINT_BLURB: Record<SprintType, string> = {
  glucose:
    'One finger-prick, one photo. The camera reads your meter so you never fat-finger a number.',
  walk: 'Fifteen minutes after dinner. The timer keeps counting even if you close the app.',
  med: 'One tap marks the dose. Add a photo or voice note only if you feel like it.',
}

/** Best-ever streak (consecutive run over completed + shield days). */
function bestStreakOf(dates: string[]): number {
  const set = new Set(dates)
  let best = 0
  for (const d of set) {
    const [y, m, day] = d.split('-').map(Number)
    const prev = addDaysISO(d, -1)
    void y
    void m
    void day
    if (set.has(prev)) continue // only start counting at run beginnings
    let run = 0
    let cursor = d
    while (set.has(cursor)) {
      run++
      cursor = addDaysISO(cursor, 1)
    }
    best = Math.max(best, run)
  }
  return best
}

/**
 * Dashboard — mobile-first single column; ≥1024px becomes a 3-column grid:
 * progress sidebar · challenge hub · cheer feed + report.
 * Keyboard: g = home · c = capture · r = report · b = badges · s = settings
 */
export function Dashboard() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const logs = useStore((s) => s.logs)
  const cheers = useStore((s) => s.cheers)
  const synced = useStore((s) => s.synced)
  const shieldDays = useStore((s) => s.shieldDays)
  const profile = useStore((s) => s.profile)
  const xp = useStore((s) => s.xp)
  const badgesCount = useStore((s) => s.badges.length)
  const simulateOffline = useStore((s) => s.simulateOffline)
  const undoToday = useStore((s) => s.undoToday)
  const pushToast = useStore((s) => s.pushToast)
  const triggerConfetti = useStore((s) => s.triggerConfetti)
  const setMood = useStore((s) => s.setMood)
  const useShield = useStore((s) => s.useShield)
  const [water, setWater] = useState(0)

  const today = todayISO()
  const todayLog = useMemo(() => logs.find((l) => l.log_date === today), [logs, today])
  const streak = currentStreak(logs, sprint, shieldDays)
  const theme = sprint ? themeFor(sprint.sprint_type) : null
  const offline = !synced
  const dayNumber = sprint ? sprintDayNumber(sprint) : 1
  const start = sprint?.start_date ?? today
  const elapsed = Math.max(1, diffDays(today, start) + 1)
  const completionPct = Math.round((logs.length / elapsed) * 100)
  const best = bestStreakOf([...logs.map((l) => l.log_date), ...shieldDays])
  const shieldToday = shieldDays.includes(today)
  const canShield = !todayLog && !shieldToday
  const moodToday = profile.moodDate === today ? profile.mood : null
  const dow = new Date().getDay()
  const weekend = dow === 0 || dow === 6

  const glucoseValues = useMemo(
    () =>
      sprint?.sprint_type === 'glucose'
        ? logs
            .map((l) => l.value)
            .filter((v): v is number => v != null)
            .slice(-10)
        : [],
    [logs, sprint],
  )

  const shareProgress = async () => {
    const text = `🏆 SugarSprint — ${user?.name}: ${logs.length} sprint${logs.length === 1 ? '' : 's'} done, ${streak}-day streak, day ${dayNumber}/30 of "${theme?.name}". Two minutes a day, no guilt.`
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My SugarSprint progress', text })
        return
      }
    } catch {
      return // user dismissed the share sheet
    }
    try {
      await navigator.clipboard.writeText(text)
      pushToast('📋 Progress summary copied to clipboard')
    } catch {
      pushToast('⚠️ Sharing is not available here')
    }
  }

  // Keyboard shortcuts (ignored while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const map: Record<string, string> = { g: '/app', c: '/capture', r: '/report', b: '/badges', s: '/settings' }
      const dest = map[e.key.toLowerCase()]
      if (dest) nav(dest)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nav])

  if (!sprint || !user) return null

  const dayStripHit = (i: number): { hit: boolean; isToday: boolean } => {
    const date = addDaysISO(start, i)
    const doneDates = new Set([...logs.map((l) => l.log_date), ...shieldDays])
    return { hit: doneDates.has(date) && date <= today, isToday: date === today }
  }

  const sparkMax = Math.max(1, ...glucoseValues)
  const level = levelForXp(xp)

  return (
    <div className="phone-shell wide">
      <Screen>
        <TopBar name={user.name} onSettings={() => nav('/settings')} />

        <div className="row-between">
          <div className="stack" style={{ gap: 3 }}>
            <h1 className="h1">
              {greeting()}, {user.name.split(' ')[0]} {weekend ? '🏖️' : '👋'}
            </h1>
            <span className="small muted">{fmtDate(today)} · Day {dayNumber} of {TOTAL_DAYS}</span>
          </div>
          <ViewToggle />
        </div>

        <div className="dash-grid">
          {/* ---------------- LEFT: progress ---------------- */}
          <aside className="dash-col left">
            <StreakRing sprint={sprint} streak={streak} logs={logs.length} />

            <div className="card stack" style={{ gap: 10 }}>
              <span className="section-title">30-day map · shielded days glow</span>
              <div className="day-strip">
                {Array.from({ length: TOTAL_DAYS }).map((_, i) => {
                  const { hit, isToday } = dayStripHit(i)
                  const shielded = shieldDays.includes(addDaysISO(start, i))
                  return (
                    <span
                      key={i}
                      className={`day-cell${hit ? ' hit' : ''}${isToday ? ' today' : ''}`}
                      title={shielded ? 'Protected by Streak Shield' : undefined}
                    >
                      {shielded ? '🛡' : i + 1}
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
                <div className="stat-value numeric">{best}</div>
                <div className="stat-label">Best ever</div>
              </div>
              <div className="stat-card">
                <div className="stat-value numeric">{logs.length}</div>
                <div className="stat-label">Sprints done</div>
              </div>
              <div className="stat-card">
                <div className="stat-value numeric">{completionPct}%</div>
                <div className="stat-label">On track</div>
              </div>
            </div>

            {/* XP / level */}
            <Link to="/badges" className="card stack" style={{ gap: 10, color: 'inherit' }}>
              <div className="row-between">
                <span className="section-title">
                  L{level} · {levelTitle(xp)}
                </span>
                <span className="numeric yellow-text" style={{ fontSize: '0.9rem' }}>
                  {xp} XP
                </span>
              </div>
              <div className="timer-ring">
                <div style={{ width: `${xp % 100}%` }} />
              </div>
              <span className="small muted">
                {badgesCount} badges unlocked · view gallery →
              </span>
            </Link>
          </aside>

          {/* ---------------- CENTER: challenge hub ---------------- */}
          <section className="dash-col center">
            {offline && (
              <div className="badge yellow" role="status">
                📵 Offline mode — your log is saved and will sync
              </div>
            )}

            {/* Hero band — bundled artwork so the top of the page is never bare */}
            <SectionBand
              variant={SPRINT_ART[sprint.sprint_type]}
              title={`Today · ${theme?.name ?? 'Your sprint'}`}
              copy={SPRINT_BLURB[sprint.sprint_type]}
              emoji={theme?.emoji}
              cta={
                <button className="btn btn-yellow" onClick={() => nav('/capture')}>
                  {todayLog ? '✅ Logged — add another' : '▶ Start today’s sprint'}
                </button>
              }
            />

            {/* Mood check-in */}
            <div className="card stack" style={{ gap: 10 }}>
              <span className="section-title">How do you feel today?</span>
              <div className="row" style={{ gap: 6 }}>
                {MOODS.map((m) => (
                  <button
                    key={m.label}
                    className={`mood-chip${moodToday === m.emoji ? ' on' : ''}`}
                    onClick={() => setMood(m.emoji)}
                    aria-label={`Mood ${m.label}`}
                  >
                    <span className="me">{m.emoji}</span>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="stack" style={{ gap: 10 }}>
              <span className="section-title">
                Today’s challenge · one card, zero clutter
              </span>
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
              <div className="row-between">
                {todayLog ? (
                  <button className="btn-link" onClick={() => void undoToday()}>
                    Undo today’s entry (demo)
                  </button>
                ) : (
                  <span className="small muted">Nothing logged yet today — tap the card above</span>
                )}
                <button className="btn-link" onClick={() => void shareProgress()}>
                  📤 Share progress
                </button>
              </div>
              {canShield && (
                <button className="btn btn-gold" onClick={useShield}>
                  🛡️ Use Streak Shield for today ({3 - shieldDays.length} left this sprint)
                </button>
              )}
              {shieldToday && !todayLog && (
                <span className="badge gold">🛡️ Today is protected — come back anytime</span>
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

            {/* Water tracker */}
            <div className="card stack" style={{ gap: 10 }}>
              <div className="row-between">
                <span className="section-title">Hydration</span>
                <span className="small muted">{water}/8 glasses</span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <button
                    key={i}
                    className="chip"
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderColor: i < water ? 'var(--gold)' : undefined,
                      color: i < water ? 'var(--gold)' : undefined,
                    }}
                    onClick={() => setWater(i + 1 === water ? i : i + 1)}
                    aria-label={`Set water to ${i + 1}`}
                  >
                    {i < water ? '💧' : '🥛'}
                  </button>
                ))}
              </div>
              {water === 8 && (
                <span className="small gold-text">🏆 8/8 — hydration win for today!</span>
              )}
            </div>

            {/* Glucose sparkline */}
            {sprint.sprint_type === 'glucose' && glucoseValues.length > 1 && (
              <div className="card stack" style={{ gap: 8 }}>
                <span className="section-title">
                  Last {glucoseValues.length} readings ({glucoseUnitLabel('mgdl')})
                </span>
                <div className="spark" aria-hidden>
                  {glucoseValues.map((v, i) => (
                    <span key={i} style={{ height: `${(v / sparkMax) * 100}%` }} />
                  ))}
                </div>
                <span className="small muted">
                  Latest {glucoseValues[glucoseValues.length - 1]} · min{' '}
                  {Math.min(...glucoseValues)} · max {Math.max(...glucoseValues)}
                </span>
              </div>
            )}

            <CheersRow cheers={cheers} />

            <div className="quote-card">“{quoteOfToday()}”</div>
          </section>

          {/* ---------------- RIGHT: feed + report ---------------- */}
          <aside className="dash-col right">
            <div className="card stack" style={{ gap: 6 }}>
              <div className="row-between">
                <span className="section-title">Live cheer feed</span>
                <Link to="/care" className="small">
                  Send →
                </Link>
              </div>
              {cheers.length === 0 ? (
                <EmptyState
                  compact
                  variant="family"
                  emoji="👏"
                  title="No cheers yet"
                  copy="Your caregiver’s next tap lands here — with confetti. Send them the invite link to get started."
                  action={
                    <Link to="/care" className="btn btn-ghost">
                      Open care circle
                    </Link>
                  }
                />
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
                        <span className="small muted">{relativeTime(c.created_at)}</span>
                        {c.message && (
                          <span className="small gold-text">“{c.message}”</span>
                        )}
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
                <span className="numeric gold-text">
                  {logs.length} / {dayNumber}
                </span>
              </div>
              <div className="rp-row">
                <span className="muted">Streak</span>
                <span className="numeric gold-text">
                  {streak} day{streak === 1 ? '' : 's'}
                </span>
              </div>
              {sprint.sprint_type === 'glucose' && glucoseValues.length > 0 && (
                <div className="rp-row">
                  <span className="muted">Avg glucose</span>
                  <span className="numeric gold-text">
                    {Math.round(
                      glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length,
                    )}{' '}
                    mg/dL
                  </span>
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

            <div className="mini-band">
              <div className="mini-art">
                <Art variant="spark" />
              </div>
              <div>
                <h4 className="mini-title">💡 Today’s tip</h4>
                <p className="mini-copy">{tipOfToday()}</p>
              </div>
            </div>
            <div className="quote-card" style={{ borderLeftColor: 'var(--yellow)', color: 'var(--text-dim)' }}>
              🧠 {factOfToday()}
            </div>

            <Link to="/insights" className="mini-band" style={{ color: 'inherit', textDecoration: 'none' }}>
              <div className="mini-art">
                <Art variant="chart" />
              </div>
              <div>
                <h4 className="mini-title">📈 Insights</h4>
                <p className="mini-copy">
                  Time in range, estimated A1c, weekly trends and questions for your doctor.
                </p>
              </div>
            </Link>

            <div className="stack" style={{ gap: 10 }}>
              <span className="section-title">Demo controls</span>
              <button
                className="btn btn-ghost"
                onClick={() => simulateOffline(!offline)}
                style={{ fontSize: '0.85rem', padding: '12px 14px' }}
              >
                {offline ? '📶 Go back online' : '📵 Simulate offline'}
              </button>
              <span className="small muted">Shortcuts: g home · c capture · r report · b badges</span>
            </div>
          </aside>
        </div>
      </Screen>
    </div>
  )
}
