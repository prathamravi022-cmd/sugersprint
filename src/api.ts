import type { Cheer, DailyLog, OcrResult, Sprint, SprintType, TranscriptionResult, User } from './types'
import { addDaysISO, todayISO } from './types'
import { CHEER_EMOJIS } from './constants'

/**
 * Mock API layer — mirrors the FastAPI + Supabase contract from the
 * Technical Architecture spec so the real backend can be swapped in later
 * (only this file changes). Simulated latency keeps optimistic-UI and
 * offline paths exercised during development.
 */

const LATENCY_MS = 260

/** Demo switch used by the in-app "offline" toggle (Frontend Spec §7). */
let mockOffline = false
export function setMockOffline(off: boolean): void {
  mockOffline = off
}

function assertOnline(): void {
  if (mockOffline || !navigator.onLine) throw new Error('offline')
}

const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

export const BOT_DELAY = 420

function delay(ms = LATENCY_MS): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

/** Wait until the user's browser is online (offline resilience spec §7). */
function waitForOnline(): Promise<void> {
  return new Promise((res) => {
    if (navigator.onLine) return res()
    const handler = () => {
      window.removeEventListener('online', handler)
      res()
    }
    window.addEventListener('online', handler)
  })
}

// ---------------------------------------------------------------------------
// Auth (mock stand-in for Supabase Phone-OTP + caregiver magic link)
// ---------------------------------------------------------------------------

export async function requestOtp(phone: string): Promise<{ otp: string }> {
  void phone // production: POST /api/v1/auth/otp { phone }
  await delay()
  return { otp: String(100000 + Math.floor(Math.random() * 899999)) }
}

export async function verifyOtp(phone: string, name: string, role: User['role']): Promise<User> {
  await delay()
  return { id: uid(), name, phone, role }
}

export async function createCaregiverLink(): Promise<string> {
  await delay()
  // In production: POST /api/v1/auth/link → returns a presigned magic link.
  return `${window.location.origin}/#/care?link=${uid().replace(/-/g, '').slice(0, 12)}`
}

// ---------------------------------------------------------------------------
// Sprints — POST /api/v1/sprints/ { user_id, sprint_type }
// ---------------------------------------------------------------------------

export async function createSprint(userId: string, sprintType: SprintType): Promise<Sprint> {
  await delay()
  return {
    id: uid(),
    user_id: userId,
    sprint_type: sprintType,
    start_date: todayISO(),
    is_active: true,
  }
}

// ---------------------------------------------------------------------------
// Logs — POST /api/v1/logs/ (updates streak counter server-side in prod)
// ---------------------------------------------------------------------------

export async function postLog(
  log: Omit<DailyLog, 'id' | 'created_at'>,
): Promise<DailyLog> {
  assertOnline()
  await waitForOnline()
  await delay()
  return { ...log, id: uid(), created_at: new Date().toISOString() }
}

export async function deleteLog(logId: string): Promise<void> {
  await waitForOnline()
  await delay()
  void logId
}

// ---------------------------------------------------------------------------
// Cheers — POST /api/v1/cheers/ { log_id, emoji }
// ---------------------------------------------------------------------------

export async function postCheer(cheer: Omit<Cheer, 'id' | 'created_at'>): Promise<Cheer> {
  assertOnline()
  await waitForOnline()
  await delay()
  return { ...cheer, id: uid(), created_at: new Date().toISOString() }
}

// ---------------------------------------------------------------------------
// AI pipeline — POST /api/v1/logs/upload (ephemeral: purge after processing)
// ---------------------------------------------------------------------------

export async function runOcr(): Promise<OcrResult> {
  await delay(1600)
  // Demo values from a typical glucometer LCD read.
  const values = [96, 104, 112, 118, 124, 132, 141, 145, 152, 163]
  const value = values[Math.floor(Math.random() * values.length)]
  return { value, confidence: 0.72 + Math.random() * 0.25 }
}

export async function transcribeVoice(): Promise<TranscriptionResult> {
  await delay(1800)
  const samples = [
    'Aaj daal-chawal ke baad li, thoda late ho gaya',
    'Took it a bit late today after breakfast',
    'Dose taken on time with water',
  ]
  return { text: samples[Math.floor(Math.random() * samples.length)] }
}

// ---------------------------------------------------------------------------
// Report — GET /api/v1/reports/generate
// ---------------------------------------------------------------------------

export interface ReportInsight {
  icon: string
  text: string
}

export interface DoctorReport {
  patientName: string
  sprintType: SprintType
  startDate: string
  completed: number
  missed: number
  logs: DailyLog[]
  insights: ReportInsight[]
  generatedAt: string
}

export async function generateReport(
  patient: User,
  sprint: Sprint,
  logs: DailyLog[],
  transcriptions: string[],
): Promise<DoctorReport> {
  await delay()
  const today = todayISO()
  const elapsed = Math.min(30, Math.max(0, (await import('./types')).diffDays(today, sprint.start_date) + 1))
  void addDaysISO // keep import list stable for future use
  const missed = Math.max(0, elapsed - logs.length)
  const insights: ReportInsight[] = [
    {
      icon: '📈',
      text: `${logs.length} of ${elapsed} logged days in this sprint (${Math.round(
        (logs.length / Math.max(1, elapsed)) * 100,
      )}% adherence).`,
    },
  ]
  if (transcriptions.length > 0) {
    insights.push({
      icon: '🎙️',
      text: `AI summary of ${transcriptions.length} voice note(s): patient frequently mentions taking medication later on days after a heavy dinner.`,
    })
  } else {
    insights.push({
      icon: '🎙️',
      text: 'No voice notes recorded — optional feature not used this sprint.',
    })
  }
  if (sprint.sprint_type === 'glucose') {
    const values = logs.map((l) => l.value).filter((v): v is number => v != null)
    if (values.length > 0) {
      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      insights.push({
        icon: '🩸',
        text: `Average fasting glucose ${avg} mg/dL across ${values.length} reading(s); range ${Math.min(...values)}–${Math.max(...values)}.`,
      })
    }
  }
  if (sprint.sprint_type === 'walk') {
    const total = logs.reduce((a, l) => a + (l.value ?? 0), 0)
    insights.push({ icon: '🚶', text: `Total recorded walking time: ${total} minutes.` })
  }
  insights.push({
    icon: '⭐',
    text: `Cheer activity from caregiver kept motivation high — ${logs.length} positive reinforcement loop(s) closed.`,
  })
  return {
    patientName: patient.name,
    sprintType: sprint.sprint_type,
    startDate: sprint.start_date,
    completed: logs.length,
    missed,
    logs,
    insights,
    generatedAt: new Date().toISOString(),
  }
}

export const randomCheerEmoji = () => CHEER_EMOJIS[Math.floor(Math.random() * CHEER_EMOJIS.length)]
