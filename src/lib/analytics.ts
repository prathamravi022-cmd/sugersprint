import type { DailyLog, Sprint } from '../types'
import { TOTAL_DAYS, addDaysISO, diffDays, todayISO } from '../types'

/**
 * Clinical analytics.
 *
 * Pure functions with no UI coupling, so the Insights screen, the Doctor Report
 * and the dashboard widgets all derive the same numbers from one source.
 *
 * Reference ranges follow the ADA-ish targets the product spec assumes for a
 * non-insulin-dependent adult: 70–140 mg/dL in range, 140–180 elevated,
 * >180 high, <70 low.
 */

export const RANGE = {
  low: 70,
  inRangeMax: 140,
  highMax: 180,
} as const

const round = (n: number) => Math.round(n)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-09-18" → "18 Sep" */
function fmtDay(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1] ?? ''}`.trim()
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const stdev = (xs: number[]) => {
  if (xs.length < 2) return 0
  const m = mean(xs)
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)))
}

/** Estimated A1c from mean glucose (ADAG study formula), in %. */
export function estimateA1c(avgMgdl: number): number {
  return Number(((avgMgdl + 46.7) / 28.7).toFixed(1))
}

export const toMmol = (mgdl: number) => Number((mgdl / 18.0182).toFixed(1))

export interface GlucoseStats {
  count: number
  avg: number | null
  min: number | null
  max: number | null
  low: number
  inRange: number
  elevated: number
  high: number
  tirPct: number
  hba1c: number | null
  cv: number | null
  variability: 'Very stable' | 'Stable' | 'Variable' | 'Highly variable' | null
  fastingAvg: number | null
  postMealAvg: number | null
  fastingCount: number
  postMealCount: number
  slope: 'rising' | 'falling' | 'steady' | null
  slopeDelta: number
  latest: number | null
  previous: number | null
  /** Reading closest to the middle of the in-range band. */
  bestDay: { date: string; value: number } | null
  /** Highest reading of the sprint. */
  peakDay: { date: string; value: number } | null
}

export function glucoseStats(logs: DailyLog[]): GlucoseStats {
  const readings = logs
    .filter((l) => typeof l.value === 'number' && l.value > 0)
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
  const values = readings.map((l) => Number(l.value))

  const fasting = readings.filter((l) => l.tag === 'fasting').map((l) => Number(l.value))
  const postMeal = readings.filter((l) => l.tag === 'postmeal').map((l) => Number(l.value))

  const count = values.length
  const avg = count ? round(mean(values)) : null
  const min = count ? Math.min(...values) : null
  const max = count ? Math.max(...values) : null

  const low = values.filter((v) => v < RANGE.low).length
  const inRange = values.filter((v) => v >= RANGE.low && v <= RANGE.inRangeMax).length
  const elevated = values.filter((v) => v > RANGE.inRangeMax && v <= RANGE.highMax).length
  const high = values.filter((v) => v > RANGE.highMax).length
  const tirPct = count ? Math.round((inRange / count) * 100) : 0

  const sd = stdev(values)
  const cv = count > 1 && mean(values) > 0 ? Number(((sd / mean(values)) * 100).toFixed(1)) : null
  const variability =
    cv == null
      ? null
      : cv < 15
        ? 'Very stable'
        : cv < 25
          ? 'Stable'
          : cv < 36
            ? 'Variable'
            : 'Highly variable'

  // Slope from the last three readings (oldest → newest).
  const tail = values.slice(-3)
  let slope: GlucoseStats['slope'] = null
  let slopeDelta = 0
  if (tail.length === 3) {
    const delta = tail[2] - tail[0]
    slopeDelta = round(delta)
    slope = Math.abs(delta) < 12 ? 'steady' : delta > 0 ? 'rising' : 'falling'
  }

  const target = (RANGE.low + RANGE.inRangeMax) / 2
  let bestDay: GlucoseStats['bestDay'] = null
  let peakDay: GlucoseStats['peakDay'] = null
  for (const log of readings) {
    const value = Number(log.value)
    if (!bestDay || Math.abs(value - target) < Math.abs(bestDay.value - target)) {
      bestDay = { date: log.log_date, value }
    }
    if (!peakDay || value > peakDay.value) peakDay = { date: log.log_date, value }
  }

  return {
    count,
    avg,
    min,
    max,
    low,
    inRange,
    elevated,
    high,
    tirPct,
    hba1c: avg != null ? estimateA1c(avg) : null,
    cv,
    variability,
    fastingAvg: fasting.length ? round(mean(fasting)) : null,
    postMealAvg: postMeal.length ? round(mean(postMeal)) : null,
    fastingCount: fasting.length,
    postMealCount: postMeal.length,
    slope,
    slopeDelta,
    latest: count ? values[count - 1] : null,
    previous: count > 1 ? values[count - 2] : null,
    bestDay,
    peakDay,
  }
}

export interface DayPoint {
  date: string
  label: string
  value: number | null
  done: boolean
}

/** One point per sprint day, for the trend chart. */
export function dailySeries(logs: DailyLog[], sprint: Sprint): DayPoint[] {
  const byDate = new Map(logs.map((l) => [l.log_date, l]))
  const today = todayISO()
  return Array.from({ length: TOTAL_DAYS }, (_, i) => {
    const date = addDaysISO(sprint.start_date, i)
    const log = byDate.get(date)
    return {
      date,
      label: `D${i + 1}`,
      value: log?.value ?? null,
      done: Boolean(log) && date <= today,
    }
  })
}

export interface WeekBucket {
  index: number
  label: string
  avg: number | null
  count: number
  adherencePct: number
}

/** Week-over-week buckets (4 weeks + partial fifth). */
export function weeklyBuckets(logs: DailyLog[], sprint: Sprint): WeekBucket[] {
  const series = dailySeries(logs, sprint)
  const buckets: WeekBucket[] = []
  for (let w = 0; w < Math.ceil(TOTAL_DAYS / 7); w++) {
    const slice = series.slice(w * 7, w * 7 + 7)
    const vals = slice.map((p) => p.value).filter((v): v is number => v != null && v > 0)
    buckets.push({
      index: w + 1,
      label: `Week ${w + 1}`,
      avg: vals.length ? round(mean(vals)) : null,
      count: vals.length,
      adherencePct: Math.round((slice.filter((p) => p.done).length / slice.length) * 100),
    })
  }
  return buckets
}

export interface Adherence {
  logged: number
  elapsed: number
  remaining: number
  pct: number
  missedDates: string[]
  longestGap: number
  currentRun: number
  onPace: boolean
}

export function adherence(logs: DailyLog[], sprint: Sprint, shieldDays: string[] = []): Adherence {
  const today = todayISO()
  const elapsed = Math.max(1, Math.min(TOTAL_DAYS, diffDays(today, sprint.start_date) + 1))
  const done = new Set([...logs.map((l) => l.log_date), ...shieldDays])
  const logged = logs.length
  const pct = Math.min(100, Math.round((done.size / elapsed) * 100))

  const missedDates: string[] = []
  let longestGap = 0
  let run = 0
  for (let i = 0; i < elapsed; i++) {
    const date = addDaysISO(sprint.start_date, i)
    if (done.has(date)) {
      run = 0
    } else {
      run++
      missedDates.push(date)
      longestGap = Math.max(longestGap, run)
    }
  }

  // Trailing consecutive completed days up to today.
  let currentRun = 0
  for (let i = elapsed - 1; i >= 0; i--) {
    const date = addDaysISO(sprint.start_date, i)
    if (done.has(date)) currentRun++
    else break
  }

  return {
    logged,
    elapsed,
    remaining: Math.max(0, TOTAL_DAYS - elapsed),
    pct,
    missedDates,
    longestGap,
    currentRun,
    onPace: pct >= Math.round((elapsed / TOTAL_DAYS) * 100) - 5,
  }
}

export interface RiskFlag {
  level: 'info' | 'watch' | 'alert'
  icon: string
  title: string
  detail: string
}

/**
 * Deterministic, non-diagnostic flags. Deliberately worded as prompts to raise
 * with a clinician rather than advice.
 */
export function riskFlags(stats: GlucoseStats, adh: Adherence): RiskFlag[] {
  const flags: RiskFlag[] = []

  if (stats.low >= 2) {
    flags.push({
      level: 'alert',
      icon: '⚠️',
      title: `${stats.low} low readings`,
      detail: `Readings below ${RANGE.low} mg/dL appeared ${stats.low} times. Worth discussing with your doctor.`,
    })
  }
  if (stats.tirPct > 0 && stats.tirPct < 70) {
    flags.push({
      level: 'watch',
      icon: '🎯',
      title: `Time in range ${stats.tirPct}%`,
      detail: `A common target is 70% or higher. You are currently ${70 - stats.tirPct} points below.`,
    })
  }
  if (stats.variability === 'Highly variable') {
    flags.push({
      level: 'watch',
      icon: '📈',
      title: `Variability ${stats.cv}%`,
      detail: 'Day-to-day swings are wide. Consistent meal timing often smooths this out.',
    })
  }
  if (stats.slope === 'rising' && stats.slopeDelta >= 25) {
    flags.push({
      level: 'watch',
      icon: '↗️',
      title: 'Upward trend across recent readings',
      detail: `Your last three readings climbed ${stats.slopeDelta} mg/dL in total.`,
    })
  }
  if (adh.pct < 60) {
    flags.push({
      level: 'watch',
      icon: '📅',
      title: `Consistency at ${adh.pct}%`,
      detail: `Only ${adh.logged} of ${adh.elapsed} days logged so far. The habit matters more than perfect numbers.`,
    })
  }
  if (adh.longestGap >= 3) {
    flags.push({
      level: 'info',
      icon: '🌱',
      title: `Longest gap was ${adh.longestGap} days`,
      detail: 'Gaps are normal. Restarting without guilt is the part that counts.',
    })
  }
  if (!flags.length) {
    flags.push({
      level: 'info',
      icon: '✅',
      title: 'Nothing flagged',
      detail: 'Your readings and consistency are both within the steady zone for this sprint.',
    })
  }
  return flags
}

export interface Insight {
  icon: string
  text: string
}

/** Plain-language observations, ordered by usefulness. */
export function patternInsights(logs: DailyLog[], stats: GlucoseStats): Insight[] {
  const out: Insight[] = []

  if (stats.fastingAvg != null && stats.postMealAvg != null) {
    const gap = stats.postMealAvg - stats.fastingAvg
    out.push({
      icon: '🍽️',
      text: `Post-meal readings average ${gap > 0 ? '+' : ''}${gap} mg/dL versus fasting — the classic after-meal rise.`,
    })
  }
  if (stats.bestDay) {
    out.push({
      icon: '🌟',
      text: `Your steadiest reading was ${stats.bestDay.value} mg/dL on ${fmtDay(stats.bestDay.date)}.`,
    })
  }
  if (stats.peakDay) {
    out.push({
      icon: '📌',
      text: `Your highest reading was ${stats.peakDay.value} mg/dL on ${fmtDay(stats.peakDay.date)}.`,
    })
  }

  const times = logs.map((l) => new Date(l.created_at).getHours())
  if (times.length >= 3) {
    const morning = times.filter((h) => h < 12).length
    const evening = times.filter((h) => h >= 17).length
    if (morning > evening * 2) {
      out.push({ icon: '🌅', text: 'You mostly log in the morning — steady, but evening checks add context.' })
    } else if (evening > morning * 2) {
      out.push({ icon: '🌙', text: 'You mostly log in the evening. A morning reading would catch the fasting baseline.' })
    }
  }

  const noted = logs.filter((l) => l.transcription).length
  if (noted > 0) {
    out.push({ icon: '🎙️', text: `${noted} voice note${noted === 1 ? '' : 's'} captured context for your doctor.` })
  }
  const photos = logs.filter((l) => l.media_url).length
  if (photos > 0) {
    out.push({ icon: '📷', text: `${photos} photo-backed reading${photos === 1 ? '' : 's'} — the most trustworthy kind.` })
  }

  if (!out.length) {
    out.push({ icon: '🌱', text: 'Two or three logged days is enough for SugarSprint to start spotting patterns.' })
  }
  return out.slice(0, 5)
}

/** Questions worth raising at the next appointment, generated from the data. */
export function doctorQuestions(stats: GlucoseStats, adh: Adherence): string[] {
  const qs: string[] = []
  if (stats.hba1c != null) {
    qs.push(
      `My readings average ${stats.avg} mg/dL — an estimated A1c near ${stats.hba1c.toFixed(1)}%. Is that moving the right way?`,
    )
  }
  if (stats.low > 0) {
    qs.push(`I had ${stats.low} reading${stats.low === 1 ? '' : 's'} below ${RANGE.low} mg/dL. Should I change anything?`)
  }
  if (stats.postMealAvg != null && stats.fastingAvg != null && stats.postMealAvg - stats.fastingAvg > 45) {
    qs.push('My post-meal readings climb a lot. Should I adjust meal timing or composition?')
  }
  if (adh.pct < 70) {
    qs.push('I am missing roughly one in three days — does that change how you read this data?')
  }
  qs.push('Is a 30-day streak of daily readings the right cadence for me, or should I test less often?')
  return qs.slice(0, 4)
}
