import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { themeFor } from '../constants'
import { useStore } from '../store'
import { generateReport } from '../api'
import type { DoctorReport } from '../api'
import { PhoneShell, Screen, TopBar } from '../components/Toast'
import { TOTAL_DAYS, diffDays, todayISO } from '../types'

/**
 * The Doctor Loop (PRD §5) — 30-day summary for clinical review.
 * Stats + trends + AI insights from optional voice notes.
 * Uses the browser's print-to-PDF for a real, shareable document.
 */
export function Report() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const logs = useStore((s) => s.logs)
  const [report, setReport] = useState<DoctorReport | null>(null)
  const [busy, setBusy] = useState(false)

  const build = async () => {
    if (!user || !sprint) return
    setBusy(true)
    const transcriptions = logs.map((l) => l.transcription).filter((t): t is string => !!t)
    const r = await generateReport(user, sprint, logs, transcriptions)
    setReport(r)
    setBusy(false)
  }

  if (!user || !sprint) {
    return (
      <PhoneShell>
        <Screen>
          <TopBar />
          <div className="card stack">
            <p className="sub">Start a sprint first — the report summarizes 30 days of it.</p>
            <button className="btn btn-yellow" onClick={() => nav('/')}>
              Go home
            </button>
          </div>
        </Screen>
      </PhoneShell>
    )
  }

  return (
    <PhoneShell>
      <Screen>
        <TopBar name={user.name} />
        {!report ? (
          <div className="card stack" style={{ marginTop: 40 }}>
            <span style={{ fontSize: 42, textAlign: 'center' }}>📄</span>
            <h2 className="h2 center">30-Day Doctor Summary</h2>
            <p className="sub center">
              Compiles streaks, glucose trends, and AI-summarized voice notes into a single
              clinician-ready page.
            </p>
            <button className="btn btn-yellow" disabled={busy} onClick={() => void build()}>
              {busy ? '⏳ Compiling…' : 'Generate Report'}
            </button>
          </div>
        ) : (
          <ReportView report={report} onBack={() => nav('/')} />
        )}
      </Screen>
    </PhoneShell>
  )
}

function ReportView({ report, onBack }: { report: DoctorReport; onBack: () => void }) {
  const theme = themeFor(report.sprintType)
  const elapsed = Math.max(
    1,
    Math.min(TOTAL_DAYS, diffDays(todayISO(), report.startDate) + 1),
  )
  const cheersCount = useStore((s) => s.cheers.length)

  const byDay = useMemo(() => {
    const map = new Map<string, number | null>()
    for (let i = 0; i < elapsed; i++) {
      const d = addDaysLocal(report.startDate, i)
      map.set(d, null)
    }
    for (const log of report.logs) {
      if (map.has(log.log_date)) {
        map.set(log.log_date, log.value)
      }
    }
    return map
  }, [report, elapsed])

  const values = [...byDay.values()]
  const maxVal = Math.max(60, ...values.filter((v): v is number => v != null))

  return (
    <div className="report-wrap">
      <div className="no-print row-between">
        <button className="btn-link" onClick={onBack}>
          ← Back
        </button>
        <button className="btn btn-gold" style={{ width: 'auto', padding: '10px 18px' }} onClick={() => window.print()}>
          🖨️ Save as PDF
        </button>
      </div>

      <header className="center" style={{ marginBottom: 6 }}>
        <div className="brand" style={{ justifyContent: 'center' }}>
          <span className="brand-dot" /> SugarSprint
        </div>
        <h1 className="h1" style={{ marginTop: 6 }}>
          30-Day Progress Summary
        </h1>
        <p className="small muted">
          {report.patientName} · {theme.name} · Started {report.startDate} · Generated{' '}
          {new Date(report.generatedAt).toLocaleDateString()}
        </p>
      </header>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value numeric">{report.completed}</div>
          <div className="stat-label">Days Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">{report.missed}</div>
          <div className="stat-label">Days Missed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">
            {Math.round((report.completed / Math.max(1, elapsed)) * 100)}%
          </div>
          <div className="stat-label">Adherence</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">{cheersCount}</div>
          <div className="stat-label">Caregiver Cheers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">{elapsed}</div>
          <div className="stat-label">Day of Sprint</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">{TOTAL_DAYS}</div>
          <div className="stat-label">Sprint Length</div>
        </div>
      </div>

      {/* Trend chart (glucose) or daily completion bars */}
      <div className="card">
        <span className="section-title">
          {report.sprintType === 'glucose' ? 'Fasting Glucose Trend (mg/dL)' : 'Daily Completion'}
        </span>
        <div className="chart" style={{ marginTop: 24 }}>
          {values.map((v, i) => (
            <div
              key={i}
              className={`chart-bar${v == null ? ' miss' : ''}`}
              style={{ height: v == null ? 4 : `${Math.max(6, (v / maxVal) * 100)}%` }}
            >
              {v != null && report.sprintType === 'glucose' && elapsed <= 14 && (
                <span>{v}</span>
              )}
            </div>
          ))}
        </div>
        <p className="small muted" style={{ marginTop: 8 }}>
          {report.sprintType === 'glucose'
            ? 'Grey bars = days without a reading.'
            : 'Grey bars = missed days. Gold = completed.'}
        </p>
      </div>

      {/* Calendar */}
      <div className="card">
        <span className="section-title">Sprint Calendar</span>
        <div className="cal" style={{ marginTop: 14 }}>
          {values.map((v, i) => {
            const day = i + 1
            return (
              <div key={i} className={`cal-cell${v != null ? ' hit' : ''}`} title={`Day ${day}`}>
                {day}
              </div>
            )
          })}
          {Array.from({ length: Math.max(0, TOTAL_DAYS - elapsed) }).map((_, i) => (
            <div key={`f${i}`} className="cal-cell" style={{ opacity: 0.4 }}>
              {elapsed + i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="card">
        <span className="section-title">Insights (AI-generated)</span>
        <div style={{ marginTop: 8 }}>
          {report.insights.map((ins, i) => (
            <div key={i} className="insight">
              <span className="ico">{ins.icon}</span>
              <span>{ins.text}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="small muted center">
        Generated by SugarSprint · Summarized insights only — raw media was deleted after AI
        processing (ephemeral storage policy).
      </p>
    </div>
  )
}

function addDaysLocal(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + days)
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${dt.getFullYear()}-${mm}-${dd}`
}
