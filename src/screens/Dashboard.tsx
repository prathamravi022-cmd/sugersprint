import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { themeFor } from '../constants'
import { currentStreak, sprintDayNumber, useStore } from '../store'
import { CheersRow } from '../components/CheersRow'
import { StreakRing } from '../components/StreakRing'
import { TaskCard } from '../components/TaskCard'
import { PhoneShell, Screen, TopBar } from '../components/Toast'
import { TOTAL_DAYS, diffDays, todayISO } from '../types'

/** Time-aware greeting per Frontend Spec §5A. */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Morning'
  if (h < 17) return 'Afternoon'
  return 'Evening'
}

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

  return (
    <PhoneShell>
      <Screen>
        <TopBar
          name={user?.name}
          onSettings={() => pushToast('⚙️ Settings & data controls (demo)')}
        />

        <div className="row-between">
          <h1 className="h1">
            {greeting()}, {user?.name?.split(' ')[0]} 👋
          </h1>
        </div>

        {offline && (
          <div className="badge yellow" role="status">
            📵 Offline mode — your log is saved and will sync
          </div>
        )}

        {/* Hero — The Streak */}
        <StreakRing sprint={sprint} streak={streak} logs={logs.length} />

        {/* Action — The Sprint: exactly ONE task card */}
        {theme && sprint && (
          <div className="stack" style={{ gap: 10 }}>
            <span className="section-title">Your sprint · Day {sprintDayNumber(sprint)} of {TOTAL_DAYS}</span>
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
                Undo today's entry (demo)
              </button>
            )}
          </div>
        )}

        {/* No-guilt nudge when a day was missed */}
        {!todayLog && sprint && diffDays(todayISO(), sprint.start_date) > 0 && streak === 0 && (
          <div className="card stack" style={{ borderLeft: '4px solid var(--gold)' }}>
            <span className="task-label" style={{ color: 'var(--gold)' }}>
              Fresh start
            </span>
            <p className="sub">
              Missed a day? No problem. Your historic streak stays on the books — today is a clean
              slate. One small win, right now. 💪
            </p>
          </div>
        )}

        {/* Recent Cheers */}
        <CheersRow cheers={cheers} />

        <hr className="divider" />

        {/* Demo utilities */}
        <div className="stack" style={{ gap: 10 }}>
          <span className="section-title">Demo controls</span>
          <div className="row">
            <button
              className="btn btn-ghost"
              onClick={() => simulateOffline(!offline)}
              style={{ fontSize: '0.85rem', padding: '12px 14px' }}
            >
              {offline ? '📶 Go back online' : '📵 Simulate offline'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => nav('/report')}
              style={{ fontSize: '0.85rem', padding: '12px 14px' }}
            >
              📄 Doctor report
            </button>
          </div>
        </div>
      </Screen>
    </PhoneShell>
  )
}
