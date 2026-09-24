import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Screen, TopBar } from '../components/Toast'
import { Art } from '../components/Art'
import { EmptyState, SectionBand } from '../components/SectionBand'
import { TOTAL_DAYS, addDaysISO, todayISO } from '../types'
import {
  RANGE,
  adherence,
  dailySeries,
  doctorQuestions,
  glucoseStats,
  patternInsights,
  riskFlags,
  toMmol,
  weeklyBuckets,
} from '../lib/analytics'

const RANGES = [7, 14, 30] as const

/** Insights — everything derived from the logs, in one clinician-flavoured view. */
export function Insights() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const logs = useStore((s) => s.logs)
  const shieldDays = useStore((s) => s.shieldDays)
  const unit = useStore((s) => s.settings.unit)
  const [windowDays, setWindowDays] = useState<(typeof RANGES)[number]>(30)

  const isGlucose = sprint?.sprint_type === 'glucose'

  const windowed = useMemo(() => {
    if (!sprint) return []
    const cutoff = addDaysISO(todayISO(), -(windowDays - 1))
    return logs.filter((l) => l.log_date >= cutoff)
  }, [logs, sprint, windowDays])

  const stats = useMemo(() => glucoseStats(windowed), [windowed])
  const allStats = useMemo(() => glucoseStats(logs), [logs])
  const adh = useMemo(
    () => (sprint ? adherence(logs, sprint, shieldDays) : null),
    [logs, sprint, shieldDays],
  )
  const series = useMemo(() => (sprint ? dailySeries(logs, sprint) : []), [logs, sprint])
  const weeks = useMemo(() => (sprint ? weeklyBuckets(logs, sprint) : []), [logs, sprint])
  const flags = useMemo(
    () => (adh ? riskFlags(allStats, adh) : []),
    [allStats, adh],
  )
  const insights = useMemo(() => patternInsights(logs, allStats), [logs, allStats])
  const questions = useMemo(
    () => (adh ? doctorQuestions(allStats, adh) : []),
    [allStats, adh],
  )

  if (!user || !sprint || !adh) {
    return (
      <div className="phone-shell">
        <Screen>
          <TopBar />
          <EmptyState
            variant="chart"
            emoji="📊"
            title="No sprint yet"
            copy="Insights light up once you have a sprint and a few logged days behind you."
            action={
              <Link to="/app" className="btn btn-yellow">
                Start a sprint
              </Link>
            }
          />
        </Screen>
      </div>
    )
  }

  const show = (mgdl: number) =>
    unit === 'mmoll' ? `${toMmol(mgdl)} mmol/L` : `${mgdl} mg/dL`
  const visible = series.filter((p) => p.date <= todayISO())
  const chartMax = Math.max(180, ...visible.map((p) => p.value ?? 0))
  const total = stats.count || 1

  return (
    <div className="phone-shell">
      <Screen>
        <TopBar name={user.name} onSettings={() => nav('/settings')} />

        <div className="row-between">
          <h1 className="h1">Insights</h1>
          <span className="badge gold">{adh.pct}% on track</span>
        </div>

        <SectionBand
          variant="chart"
          title={
            isGlucose && stats.avg != null
              ? `Average ${show(stats.avg)}`
              : `${adh.logged} logged · ${adh.currentRun}-day run`
          }
          copy={
            isGlucose && stats.hba1c != null
              ? `Estimated A1c ${stats.hba1c.toFixed(1)}% from ${stats.count} reading${stats.count === 1 ? '' : 's'}. This is an estimate, not a lab result.`
              : `You are on day ${adh.elapsed} of ${TOTAL_DAYS}, with ${adh.remaining} to go. Consistency is the whole game.`
          }
          emoji="📈"
          cta={
            <div className="chip-row">
              {RANGES.map((r) => (
                <button
                  key={r}
                  className={`chip${windowDays === r ? ' on' : ''}`}
                  onClick={() => setWindowDays(r)}
                >
                  {r === 30 ? 'All 30 days' : `Last ${r}`}
                </button>
              ))}
            </div>
          }
        />

        {/* ---- Consistency ---- */}
        <div className="card stack" style={{ gap: 10 }}>
          <div className="row-between">
            <span className="section-title">Consistency</span>
            <span className="small muted">
              {adh.logged}/{adh.elapsed} days · {adh.remaining} left
            </span>
          </div>
          <div className="timer-ring">
            <div style={{ width: `${adh.pct}%` }} />
          </div>
          <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge${adh.onPace ? ' gold' : ''}`}>
              {adh.onPace ? '✓ On pace' : '⚠️ Behind pace'}
            </span>
            <span className="badge">🔥 Longest run {adh.currentRun}</span>
            <span className="badge">🕳️ Longest gap {adh.longestGap}d</span>
          </div>
        </div>

        {/* ---- Glucose analytics ---- */}
        {isGlucose && stats.count === 0 ? (
          <EmptyState
            variant="glucose"
            emoji="🩸"
            title="No readings in this window"
            copy="Switch to a wider range, or log a reading with the camera — OCR takes about two seconds."
            action={
              <Link to="/capture" className="btn btn-yellow">
                📷 Log a reading
              </Link>
            }
          />
        ) : isGlucose ? (
          <>
            <div className="card stack" style={{ gap: 12 }}>
              <div className="row-between">
                <span className="section-title">Time in range</span>
                <span className="numeric gold-text" style={{ fontSize: '1.1rem' }}>
                  {stats.tirPct}%
                </span>
              </div>
              <div className="tir-bar" role="img" aria-label={`Time in range ${stats.tirPct} percent`}>
                <span className="tir-low" style={{ width: `${(stats.low / total) * 100}%` }} />
                <span className="tir-in" style={{ width: `${(stats.inRange / total) * 100}%` }} />
                <span className="tir-elev" style={{ width: `${(stats.elevated / total) * 100}%` }} />
                <span className="tir-high" style={{ width: `${(stats.high / total) * 100}%` }} />
              </div>
              <div className="legend">
                <span>
                  <i className="dot low" /> Low &lt;{RANGE.low}
                </span>
                <span>
                  <i className="dot in" /> In range
                </span>
                <span>
                  <i className="dot elev" /> Elevated
                </span>
                <span>
                  <i className="dot high" /> High &gt;{RANGE.highMax}
                </span>
              </div>
              <span className="small muted">
                Target is usually 70% or higher. {stats.inRange} of {stats.count} readings sit in
                range.
              </span>
            </div>

            <div className="stat-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="stat-card">
                <div className="stat-value numeric">{stats.avg ?? '—'}</div>
                <div className="stat-label">Average</div>
              </div>
              <div className="stat-card">
                <div className="stat-value numeric">
                  {stats.hba1c != null ? stats.hba1c.toFixed(1) : '—'}%
                </div>
                <div className="stat-label">Est. A1c</div>
              </div>
              <div className="stat-card">
                <div className="stat-value numeric">{stats.cv ?? '—'}%</div>
                <div className="stat-label">Variability</div>
              </div>
              <div className="stat-card">
                <div className="stat-value numeric">{stats.fastingAvg ?? '—'}</div>
                <div className="stat-label">Fasting avg</div>
              </div>
              <div className="stat-card">
                <div className="stat-value numeric">{stats.postMealAvg ?? '—'}</div>
                <div className="stat-label">Post-meal avg</div>
              </div>
              <div className="stat-card">
                <div className="stat-value numeric">{stats.count}</div>
                <div className="stat-label">Readings</div>
              </div>
            </div>

            {stats.variability && (
              <div className="mini-band">
                <div className="mini-art">
                  <Art variant="spark" />
                </div>
                <div>
                  <h4 className="mini-title">{stats.variability}</h4>
                  <p className="mini-copy">
                    Coefficient of variation {stats.cv}%. Below 25% is generally considered steady.
                  </p>
                </div>
              </div>
            )}

            {/* ---- Trend chart ---- */}
            <div className="card stack" style={{ gap: 10 }}>
              <div className="row-between">
                <span className="section-title">Trend across the sprint</span>
                <span className="small muted">peak {stats.peakDay?.value ?? '—'}</span>
              </div>
              <div className="trend-chart" aria-hidden>
                {series.map((p) => {
                  const h = p.value ? Math.max(6, (p.value / chartMax) * 100) : 12
                  const zone = !p.value
                    ? 'none'
                    : p.value < RANGE.low
                      ? 'low'
                      : p.value <= RANGE.inRangeMax
                        ? 'in'
                        : p.value <= RANGE.highMax
                          ? 'elev'
                          : 'high'
                  return (
                    <span
                      key={p.date}
                      className={`trend-bar ${zone}${p.date > todayISO() ? ' future' : ''}`}
                      style={{ height: `${h}%` }}
                      title={p.value ? `${p.date}: ${show(p.value)}` : p.date}
                    />
                  )
                })}
              </div>
              <span className="small muted">
                Every bar is one day. Missing bars are days without a reading.
              </span>
            </div>

            {/* ---- Weekly ---- */}
            <div className="card stack" style={{ gap: 10 }}>
              <span className="section-title">Week by week</span>
              {weeks.map((w) => {
                const slice = series.slice((w.index - 1) * 7, (w.index - 1) * 7 + 7)
                if (slice.every((p) => p.date > todayISO())) return null
                return (
                  <div key={w.index} className="week-row">
                    <span className="wk">{w.label}</span>
                    <span className="week-bar">
                      <span style={{ width: `${w.adherencePct}%` }} />
                    </span>
                    <span className="small muted wk-val">
                      {w.avg != null ? show(w.avg) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <EmptyState
            variant={sprint.sprint_type === 'walk' ? 'walk' : 'med'}
            emoji={sprint.sprint_type === 'walk' ? '🚶' : '💊'}
            title="Habit sprint"
            copy="Glucose analytics apply once your sprint is a glucose one. Here is how your consistency looks instead."
            action={
              <Link to="/app" className="btn btn-ghost">
                Back to dashboard
              </Link>
            }
          />
        )}

        {/* ---- Risk flags ---- */}
        <div className="card stack" style={{ gap: 10 }}>
          <span className="section-title">Worth a look</span>
          {flags.map((f) => (
            <div key={f.title} className={`flag ${f.level}`}>
              <span className="flag-ico" aria-hidden>
                {f.icon}
              </span>
              <span className="stack" style={{ gap: 2 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{f.title}</span>
                <span className="small muted">{f.detail}</span>
              </span>
            </div>
          ))}
          <span className="small muted">
            These are patterns in your own data, not medical advice. Only your doctor can
            interpret them.
          </span>
        </div>

        {/* ---- Patterns ---- */}
        <div className="card stack" style={{ gap: 10 }}>
          <span className="section-title">What your data is saying</span>
          {insights.map((i) => (
            <div key={i.text} className="insight-row">
              <span aria-hidden>{i.icon}</span>
              <span className="small">{i.text}</span>
            </div>
          ))}
        </div>

        {/* ---- Doctor questions ---- */}
        <div className="card stack" style={{ gap: 10 }}>
          <span className="section-title">Ask your doctor</span>
          <ul className="q-list">
            {questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <Link to="/report" className="btn btn-yellow">
            📄 Put this in the 30-day report
          </Link>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <Link to="/app" className="btn btn-ghost">
            ← Dashboard
          </Link>
          <Link to="/capture" className="btn btn-ghost">
            📷 Quick capture
          </Link>
        </div>
      </Screen>
    </div>
  )
}
