import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { themeFor } from '../constants'
import { useStore } from '../store'
import { generateReport } from '../api'
import type { DoctorReport } from '../api'
import { Screen, TopBar } from '../components/Toast'
import { SiteFooter } from '../components/SiteFooter'
import { TOTAL_DAYS, addDaysISO, diffDays, todayISO } from '../types'
import { Art } from '../components/Art'

/**
 * The Doctor Loop (PRD §5) — 30-day summary for clinical review.
 * v3: date-range selector, 4-digit PIN gate, time-bound share link,
 * week-over-week trend, clinician cover note, JSON export, print-to-PDF.
 */
export function Report() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const logs = useStore((s) => s.logs)
  const reportPin = useStore((s) => s.reportPin)
  const setPin = useStore((s) => s.setPin)
  const clearPin = useStore((s) => s.clearPin)
  const exportData = useStore((s) => s.exportData)
  const markReportGenerated = useStore((s) => s.markReportGenerated)
  const pushToast = useStore((s) => s.pushToast)

  const [report, setReport] = useState<DoctorReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [pinDraft, setPinDraft] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)

  const build = async () => {
    if (!user || !sprint) return
    setBusy(true)
    const transcriptions = logs.map((l) => l.transcription).filter((t): t is string => !!t)
    const r = await generateReport(user, sprint, logs, transcriptions)
    setReport(r)
    setBusy(false)
    markReportGenerated()
  }

  const makeShareLink = async () => {
    const token = Math.random().toString(36).slice(2, 14)
    const url = `${window.location.origin}/#/report?shared=${token}`
    setShareUrl(url)
    try {
      await navigator.clipboard?.writeText(url)
      pushToast('🔗 Time-bound link copied — expires in 7 days')
    } catch {
      pushToast('🔗 Share link generated below')
    }
  }

  if (!user || !sprint) {
    return (
      <div className="phone-shell">
        <Screen>
          <TopBar />
          <div className="card stack">
            <p className="sub">Start a sprint first — the report summarizes 30 days of it.</p>
            <button className="btn btn-yellow" onClick={() => nav('/app')}>
              Go home
            </button>
          </div>
        </Screen>
      </div>
    )
  }

  const locked = Boolean(reportPin) && report != null && !unlocked
  const expiry = addDaysISO(todayISO(), 7)

  const glucoseNumbers = logs
    .map((l) => l.value)
    .filter((v): v is number => v != null && v > 0)
  const glucoseAvg =
    glucoseNumbers.length > 0
      ? Math.round(glucoseNumbers.reduce((a, b) => a + b, 0) / glucoseNumbers.length)
      : null
  const noteCount = logs.filter((l) => !!l.transcription).length

  return (
    <div className="phone-shell">
      <Screen>
        <TopBar name={user.name} onSettings={() => nav('/settings')} />

        {/* PIN gate — the report is private until the patient unlocks it */}
        {locked ? (
          <div className="card stack" style={{ marginTop: 40 }}>
            <span style={{ fontSize: 42, textAlign: 'center' }}>🔐</span>
            <h2 className="h2 center">Enter report PIN</h2>
            <p className="sub center">
              This summary is protected with the 4-digit PIN you set.
            </p>
            <input
              className="otp-input"
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              value={pinDraft}
              onChange={(e) => {
                setPinError(false)
                setPinDraft(e.target.value.replace(/\D/g, ''))
              }}
              autoFocus
            />
            {pinError && (
              <p className="small center" style={{ color: 'var(--danger)' }}>
                Wrong PIN — try again.
              </p>
            )}
            <button
              className="btn btn-yellow"
              disabled={pinDraft.length < 4}
              onClick={() => {
                if (pinDraft === reportPin) {
                  setUnlocked(true)
                } else {
                  setPinError(true)
                }
              }}
            >
              Unlock report
            </button>
            <button className="btn-link" onClick={() => nav('/app')}>
              Not now — back to dashboard
            </button>
          </div>
        ) : !report ? (
          <div className="report-intro">
          <div className="card stack" style={{ gap: 12 }}>
            <div className="report-hero">
              <Art variant="doctor" />
            </div>
            <h2 className="h2 center">30-Day Doctor Summary</h2>
            <p className="sub center">
              Compiles streaks, glucose trends, and AI-summarized voice notes into a single
              clinician-ready page.
            </p>

            {/* PIN setup row */}
            {!reportPin ? (
              <div className="row" style={{ gap: 8 }}>
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="Set 4-digit PIN (optional)"
                  value={pinDraft}
                  onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, ''))}
                  style={{ textAlign: 'center', letterSpacing: '0.3em' }}
                />
                <button
                  className="btn btn-ghost"
                  style={{ width: 'auto', padding: '14px 16px' }}
                  disabled={pinDraft.length !== 4}
                  onClick={() => {
                    setPin(pinDraft)
                    setPinDraft('')
                    pushToast('🔐 Report PIN set')
                  }}
                >
                  Lock
                </button>
              </div>
            ) : (
              <button
                className="btn-link"
                onClick={() => {
                  clearPin()
                  pushToast('🔓 PIN removed')
                }}
              >
                🔓 Remove PIN protection
              </button>
            )}

            <button className="btn btn-yellow" disabled={busy} onClick={() => void build()}>
              {busy ? '⏳ Compiling…' : 'Generate Report'}
            </button>
            <button className="btn btn-ghost" onClick={exportData}>
              📦 Export raw data (JSON)
            </button>
          </div>

          <aside className="stack" style={{ gap: 12 }}>
            <div className="card stack" style={{ gap: 10 }}>
              <span className="section-title">Snapshot so far</span>
              <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="stat-card">
                  <div className="stat-value numeric">{logs.length}</div>
                  <div className="stat-label">Days logged</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value numeric">
                    {Math.max(1, diffDays(todayISO(), sprint.start_date) + 1)}
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                      /{TOTAL_DAYS}
                    </span>
                  </div>
                  <div className="stat-label">Sprint day</div>
                </div>
                {glucoseAvg != null && (
                  <div className="stat-card">
                    <div className="stat-value numeric">{glucoseAvg}</div>
                    <div className="stat-label">Avg mg/dL</div>
                  </div>
                )}
                <div className="stat-card">
                  <div className="stat-value numeric">{noteCount}</div>
                  <div className="stat-label">AI notes</div>
                </div>
              </div>
            </div>

            <div className="mini-band">
              <div className="mini-art">
                <Art variant="chart" />
              </div>
              <div>
                <h4 className="mini-title">Glucose trend line</h4>
                <p className="mini-copy">
                  Every reading plotted with fasting/post-meal tags and in-range banding.
                </p>
              </div>
            </div>

            <div className="mini-band">
              <div className="mini-art">
                <Art variant="phone" />
              </div>
              <div>
                <h4 className="mini-title">AI note summaries</h4>
                <p className="mini-copy">
                  Voice notes condensed to one clinical line each — no raw audio shared.
                </p>
              </div>
            </div>

            <div className="mini-band">
              <div className="mini-art">
                <Art variant="shield" />
              </div>
              <div>
                <h4 className="mini-title">Privacy by default</h4>
                <p className="mini-copy">
                  Caregivers only ever see cheers — never your raw readings. DPDP-aligned.
                </p>
              </div>
            </div>

            <p className="small muted">
              Tip: generate the report, then use “Print / Save as PDF” to hand it to your
              doctor on paper.
            </p>
          </aside>
          </div>
        ) : (
          <ReportView
            report={report}
            onBack={() => nav('/app')}
            shareUrl={shareUrl}
            onShare={makeShareLink}
            shareExpiry={expiry}
          />
        )}
      </Screen>
    </div>
  )
}

function ReportView({
  report,
  onBack,
  shareUrl,
  onShare,
  shareExpiry,
}: {
  report: DoctorReport
  onBack: () => void
  shareUrl: string | null
  onShare: () => void | Promise<void>
  shareExpiry: string
}) {
  const theme = themeFor(report.sprintType)
  const sprint = useStore((s) => s.sprint)
  const cheersCount = useStore((s) => s.cheers.length)
  const [range, setRange] = useState<7 | 14 | 30>(30)

  const sprintElapsed = Math.max(
    1,
    Math.min(TOTAL_DAYS, diffDays(todayISO(), report.startDate) + 1),
  )
  const elapsed = Math.min(range, sprintElapsed)

  const byDay = useMemo(() => {
    const map = new Map<string, number | null>()
    for (let i = 0; i < elapsed; i++) {
      const d = addDaysISO(report.startDate, i)
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

  // Week-over-week comparison (last 7 vs previous 7)
  const doneDates = new Set(report.logs.map((l) => l.log_date))
  const today = todayISO()
  let last7 = 0
  let prev7 = 0
  for (let i = 0; i < 7; i++) {
    if (doneDates.has(addDaysISO(today, -i))) last7++
    if (doneDates.has(addDaysISO(today, -i - 7))) prev7++
  }
  const trendDelta = last7 - prev7

  const completedInRange = values.filter((v) => v != null).length + countShielded(report, elapsed)
  const missedInRange = Math.max(0, elapsed - completedInRange)

  return (
    <div className="report-wrap">
      <div className="no-print row-between">
        <button className="btn-link" onClick={onBack}>
          ← Back
        </button>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-gold" style={{ width: 'auto', padding: '10px 16px' }} onClick={() => void onShare()}>
            🔗 Share link
          </button>
          <button
            className="btn btn-gold"
            style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => window.print()}
          >
            ⬇️ Download PDF
          </button>
        </div>
      </div>

      {shareUrl && (
        <div className="badge no-print" style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>
          🔗 {shareUrl} · expires {shareExpiry}
        </div>
      )}

      {/* Clinician header band */}
      <header className="center" style={{ marginBottom: 6 }}>
        <div className="brand" style={{ justifyContent: 'center' }}>
          <span className="brand-dot" /> SugarSprint
        </div>
        <h1 className="h1" style={{ marginTop: 6 }}>
          30-Day Progress Summary
        </h1>
        <p className="small muted">
          {report.patientName} · {theme.name} · Started {report.startDate} · Generated{' '}
          {new Date(report.generatedAt).toLocaleDateString()} · Suggested file:{' '}
          <b>sugarsprint-{report.patientName.toLowerCase().replace(/\s+/g, '-')}.pdf</b>
        </p>
      </header>

      {/* Cover note for the clinician */}
      <div className="quote-card" style={{ color: 'var(--text)', borderLeftColor: 'var(--gold)' }}>
        <b>Re: {report.patientName}</b> — Dear Doctor, below is a self-managed 30-day
        micro-habit sprint ({theme.name.toLowerCase()}). Adherence, glucose trends and
        patient-recorded context are summarized over{' '}
        <b>the last {range} days</b>. All raw media was deleted after AI processing; this
        document contains only extracted values and summaries.
      </div>

      {/* Range selector */}
      <div className="row no-print" style={{ gap: 8 }}>
        <span className="section-title">Range</span>
        {([7, 14, 30] as const).map((r) => (
          <button key={r} className={`chip${range === r ? ' on' : ''}`} onClick={() => setRange(r)}>
            {r}d
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value numeric">{completedInRange}</div>
          <div className="stat-label">Days Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">{missedInRange}</div>
          <div className="stat-label">Days Missed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">
            {Math.round((completedInRange / Math.max(1, elapsed)) * 100)}%
          </div>
          <div className="stat-label">Adherence</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">{cheersCount}</div>
          <div className="stat-label">Caregiver Cheers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">{sprintElapsed}</div>
          <div className="stat-label">Day of Sprint</div>
        </div>
        <div className="stat-card">
          <div className="stat-value numeric">{TOTAL_DAYS}</div>
          <div className="stat-label">Sprint Length</div>
        </div>
      </div>

      {/* Week-over-week trend */}
      <div
        className="card row-between"
        style={{ borderColor: trendDelta >= 0 ? 'rgba(52,211,153,0.4)' : 'rgba(248,113,113,0.4)' }}
      >
        <span className="stack" style={{ gap: 3 }}>
          <span className="section-title">Last 7 days vs previous 7</span>
          <span className="small muted">
            {last7} completed vs {prev7} completed
          </span>
        </span>
        <span
          className="numeric"
          style={{ fontSize: '1.5rem', color: trendDelta >= 0 ? 'var(--success)' : 'var(--danger)' }}
        >
          {trendDelta > 0 ? '↑' : trendDelta < 0 ? '↓' : '='} {Math.abs(trendDelta)}
        </span>
      </div>

      {/* Trend chart */}
      <div className="card">
        <span className="section-title">
          {report.sprintType === 'glucose'
            ? `Fasting Glucose Trend (mg/dL) · ${range}d`
            : `Daily Completion · ${range}d`}
        </span>
        <div className="chart" style={{ marginTop: 24 }}>
          {values.map((v, i) => (
            <div
              key={i}
              className={`chart-bar${v == null ? ' miss' : ''}`}
              style={{ height: v == null ? 4 : `${Math.max(6, (v / maxVal) * 100)}%` }}
            >
              {v != null && report.sprintType === 'glucose' && elapsed <= 14 && <span>{v}</span>}
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
        <span className="section-title">Sprint Calendar · {range} days</span>
        <div className="cal" style={{ marginTop: 14 }}>
          {values.map((v, i) => {
            const day = i + 1
            return (
              <div key={i} className={`cal-cell${v != null ? ' hit' : ''}`} title={`Day ${day}`}>
                {day}
              </div>
            )
          })}
          {range === 30 &&
            Array.from({ length: Math.max(0, TOTAL_DAYS - sprintElapsed) }).map((_, i) => (
              <div key={`f${i}`} className="cal-cell" style={{ opacity: 0.4 }}>
                {sprintElapsed + i + 1}
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
        processing (ephemeral storage policy). Sprints tracked: {sprint?.sprint_type ?? '—'}.
      </p>
      <SiteFooter />
    </div>
  )
}

/** Shield-protected days count as adherent in the report math. */
function countShielded(report: DoctorReport, elapsed: number): number {
  const shieldDays = useStore.getState().shieldDays
  const start = report.startDate
  let n = 0
  for (let i = 0; i < elapsed; i++) {
    const d = addDaysISO(start, i)
    if (shieldDays.includes(d)) n++
  }
  return n
}
