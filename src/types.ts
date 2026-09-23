export type SprintType = 'glucose' | 'walk' | 'med'

export type Role = 'patient' | 'caregiver'

export interface User {
  id: string
  name: string
  phone: string
  role: Role
}

export interface Sprint {
  id: string
  user_id: string
  sprint_type: SprintType
  start_date: string // YYYY-MM-DD
  is_active: boolean
}

export interface DailyLog {
  id: string
  sprint_id: string
  log_date: string // YYYY-MM-DD
  value: number | null // glucose mg/dL or minutes walked (null for med)
  media_url: string | null // optional photo/audio (ephemeral per security spec)
  transcription: string | null // optional Whisper transcription
  created_at: string
}

export type CheerEmoji = '👏' | '❤️' | '🔥'

export interface Cheer {
  id: string
  log_id: string
  caregiver_id: string
  caregiver_name: string
  emoji_type: CheerEmoji
  created_at: string
}

export interface OcrResult {
  value: number | null
  confidence: number
}

export interface TranscriptionResult {
  text: string
}

export const TOTAL_DAYS = 30

/** Local date as YYYY-MM-DD (no UTC drift). */
export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  return todayISO(dt)
}

export function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round(
    (new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime()) / 86_400_000,
  )
}
