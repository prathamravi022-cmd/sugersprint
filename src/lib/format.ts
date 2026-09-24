/** Formatting, unit conversion and estimation helpers. */

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

/** "Tue, 23 Sep" */
export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return `${WEEKDAYS[dt.getDay()]}, ${d} ${MONTHS[m - 1]}`
}

export function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function relativeTime(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

/** mmol/L ⇄ mg/dL (factor 18.0182). */
export const toDisplayGlucose = (mgdl: number, unit: 'mgdl' | 'mmoll'): number =>
  unit === 'mmoll' ? Math.round((mgdl / 18.0182) * 10) / 10 : Math.round(mgdl)

export const glucoseUnitLabel = (unit: 'mgdl' | 'mmoll'): string =>
  unit === 'mgdl' ? 'mg/dL' : 'mmol/L'

/** Fasting target band: 80–130 mg/dL (ADA-ish); color coded. */
export function glucoseBand(mgdl: number): { key: 'low' | 'in' | 'high'; msg: string } {
  if (mgdl < 70) return { key: 'low', msg: 'Below range — have a quick snack and re-check.' }
  if (mgdl <= 130) return { key: 'in', msg: 'In target range. Excellent!' }
  if (mgdl <= 180) return { key: 'high', msg: 'Slightly above fasting range.' }
  return { key: 'high', msg: 'Well above range — worth mentioning to your doctor.' }
}

/** ~4.5 km/h brisk walk. */
export const estimateKm = (minutes: number): string => (minutes * 0.075).toFixed(2)

/** ~4.2 kcal/min for a ~60 kg adult walking. */
export const estimateKcal = (minutes: number): number => Math.round(minutes * 4.2)

export function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.max(0, totalSeconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Haptic feedback where supported (Frontend Spec §8). */
export function haptic(pattern: number | number[] = 30): void {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* unsupported */
  }
}

/** Small celebratory blip via WebAudio — no assets needed. */
let audioCtx: AudioContext | null = null
export function blip(enabled: boolean, kind: 'done' | 'cheer' | 'badge' = 'done'): void {
  if (!enabled) return
  try {
    audioCtx ??= new AudioContext()
    const ctx = audioCtx
    const notes = kind === 'badge' ? [660, 880] : kind === 'cheer' ? [740] : [523, 784]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      const t0 = ctx.currentTime + i * 0.12
      gain.gain.exponentialRampToValueAtTime(0.08, t0 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22)
      osc.connect(gain).connect(ctx.destination)
      osc.start(t0)
      osc.stop(t0 + 0.25)
    })
  } catch {
    /* audio unavailable */
  }
}
