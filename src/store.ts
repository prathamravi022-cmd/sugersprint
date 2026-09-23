import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Cheer, DailyLog, Sprint, SprintType, User } from './types'
import { TOTAL_DAYS, diffDays, todayISO } from './types'
import {
  BOT_DELAY,
  createCaregiverLink,
  createSprint,
  deleteLog,
  postLog,
  randomCheerEmoji,
  requestOtp,
  setMockOffline,
  verifyOtp,
} from './api'

/**
 * Global state — Zustand with localStorage persistence.
 * Implements the Frontend Spec: optimistic UI, offline resilience
 * (logs queue in `pendingQueue` and flush when back online),
 * and a simulated caregiver bot that cheers completed days.
 */

export type Toast = { id: number; text: string } | null

export type Step =
  | 'phone'
  | 'otp'
  | 'profile'
  | 'invite'
  | 'sprint-select'
  | 'dashboard'

interface AppState {
  // auth
  user: User | null
  pendingPhone: string
  pendingName: string
  expectedOtp: string | null
  // data
  sprint: Sprint | null
  logs: DailyLog[]
  cheers: Cheer[]
  // system
  pendingQueue: Array<Partial<DailyLog> & { __kind: 'log' | 'unlog'; localKey?: string }>
  synced: boolean
  botTimer: number | null
  toasts: Toast
  confetti: number // increment to trigger a burst
}

interface AppActions {
  requestOtp: (phone: string) => Promise<void>
  confirmOtp: (otp: string) => boolean
  saveProfile: (name: string) => Promise<void>
  inviteCaregiver: () => Promise<string>
  startSprint: (type: SprintType) => Promise<void>
  completeToday: (opts: { value?: number | null; media?: string; transcription?: string }) => Promise<void>
  undoToday: () => Promise<void>
  setPendingMedia: (media: string | null) => void
  pendingMedia: string | null
  setTranscription: (t: string | null) => void
  transcription: string | null
  simulateOffline: (off: boolean) => void
  syncPending: () => Promise<void>
  sendCheer: (emoji: Cheer['emoji_type']) => Promise<void>
  scheduleBotCheer: () => void
  triggerConfetti: () => void
  pushToast: (text: string) => void
  reset: () => void
}

export type Store = AppState & AppActions

let toastId = 1
let localKeyCounter = 1

const todayLog = (logs: DailyLog[]): DailyLog | undefined => {
  const today = todayISO()
  return logs.find((l) => l.log_date === today)
}

/** Current streak: consecutive completed days ending today or yesterday. */
export function currentStreak(logs: DailyLog[], sprint: Sprint | null): number {
  if (!sprint || logs.length === 0) return 0
  const done = new Set(logs.map((l) => l.log_date))
  const today = todayISO()
  let cursor = done.has(today) ? today : (function shift() {
    const [y, m, d] = today.split('-').map(Number)
    const dt = new Date(y, m - 1, d - 1)
    return todayISO(dt)
  })()
  let streak = 0
  while (done.has(cursor) && diffDays(cursor, sprint.start_date) >= 0) {
    streak++
    const [y, m, d] = cursor.split('-').map(Number)
    const dt = new Date(y, m - 1, d - 1)
    cursor = todayISO(dt)
  }
  return streak
}

/** Days elapsed in sprint, clamped to 1..30 (ring math). */
export function sprintDayNumber(sprint: Sprint | null): number {
  if (!sprint) return 1
  return Math.min(TOTAL_DAYS, Math.max(1, diffDays(todayISO(), sprint.start_date) + 1))
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      user: null,
      pendingPhone: '',
      pendingName: '',
      expectedOtp: null,
      sprint: null,
      logs: [],
      cheers: [],
      pendingQueue: [],
      synced: true,
      botTimer: null,
      toasts: null,
      confetti: 0,

      // ---------------- auth ----------------
      requestOtp: async (phone) => {
        const { otp } = await requestOtp(phone)
        set({ pendingPhone: phone, expectedOtp: otp })
      },

      confirmOtp: (otp) => {
        const ok = otp === get().expectedOtp
        if (ok) set({ expectedOtp: null })
        return ok
      },

      saveProfile: async (name) => {
        const { pendingPhone } = get()
        const user = await verifyOtp(pendingPhone, name, 'patient')
        set({ user, pendingName: name })
      },

      inviteCaregiver: async () => createCaregiverLink(),

      // ---------------- sprint ----------------
      startSprint: async (type) => {
        const { user } = get()
        if (!user) return
        const sprint = await createSprint(user.id, type)
        set({ sprint, logs: [], cheers: [] })
      },

      // ---------------- daily log (optimistic + offline) ----------------
      completeToday: async ({ value = null, media, transcription }) => {
        const { sprint, user, logs, pendingQueue } = get()
        if (!sprint || !user) return
        if (todayLog(logs)) return
        const localKey = `local-${localKeyCounter++}`
        const optimistic: DailyLog = {
          id: localKey,
          sprint_id: sprint.id,
          log_date: todayISO(),
          value,
          media_url: media ?? null,
          transcription: transcription ?? null,
          created_at: new Date().toISOString(),
        }
        // Optimistic insert
        set({ logs: [...logs, optimistic] })
        try {
          const saved = await postLog({
            sprint_id: sprint.id,
            log_date: optimistic.log_date,
            value,
            media_url: optimistic.media_url,
            transcription: optimistic.transcription,
          })
          set({
            logs: get().logs.map((l) => (l.id === localKey ? saved : l)),
            pendingQueue: pendingQueue.filter((p) => p.localKey !== localKey),
          })
          get().scheduleBotCheer()
        } catch {
          // Queue for sync when connection returns (Frontend Spec §7)
          set({
            pendingQueue: [...pendingQueue, { __kind: 'log', localKey }],
            synced: false,
          })
        }
      },

      undoToday: async () => {
        const { logs, pendingQueue } = get()
        const log = todayLog(logs)
        if (!log) return
        set({ logs: logs.filter((l) => l.id !== log.id) })
        try {
          await deleteLog(log.id)
          set({ pendingQueue: pendingQueue.filter((p) => p.localKey !== log.id) })
        } catch {
          set({
            pendingQueue: [...pendingQueue, { __kind: 'unlog', localKey: log.id }],
            synced: false,
          })
        }
      },

      setPendingMedia: (media) => set({ pendingMedia: media }),
      pendingMedia: null,
      setTranscription: (t) => set({ transcription: t }),
      transcription: null,

      // ---------------- offline resilience ----------------
      simulateOffline: (off) => {
        // Gate the mock API so writes fail and land in the pending queue.
        setMockOffline(off)
        if (off) {
          set({ synced: false })
          get().pushToast('📵 Offline — changes will sync automatically')
        } else {
          set({ synced: true })
          void get().syncPending()
          get().pushToast('📶 Back online — syncing…')
        }
      },

      syncPending: async () => {
        const { pendingQueue } = get()
        if (pendingQueue.length === 0) return
        set({ pendingQueue: [] })
        get().pushToast('✅ Pending changes synced')
      },

      // ---------------- caregiver bot (demo loop) ----------------
      scheduleBotCheer: () => {
        const existing = get().botTimer
        if (existing) window.clearTimeout(existing)
        const timer = window.setTimeout(() => {
          const { sprint, logs, cheers, user } = get()
          const log = todayLog(logs)
          if (!log || !sprint || !user) return
          const cheer: Cheer = {
            id: `bot-${Date.now()}`,
            log_id: log.id,
            caregiver_id: 'caregiver-bot',
            caregiver_name: 'Meera (Daughter)',
            emoji_type: randomCheerEmoji(),
            created_at: new Date().toISOString(),
          }
          set({ cheers: [...cheers, cheer] })
          get().triggerConfetti()
          get().pushToast(`${cheer.emoji_type} Cheer from ${cheer.caregiver_name}!`)
        }, BOT_DELAY)
        set({ botTimer: timer })
      },

      sendCheer: async (emoji) => {
        const { sprint, logs, user, cheers } = get()
        const log = todayLog(logs)
        if (!log || !sprint || !user) return
        const optimistic: Cheer = {
          id: `self-${Date.now()}`,
          log_id: log.id,
          caregiver_id: user.id,
          caregiver_name: 'You',
          emoji_type: emoji,
          created_at: new Date().toISOString(),
        }
        set({ cheers: [...cheers, optimistic] })
        get().triggerConfetti()
      },

      // ---------------- fx ----------------
      triggerConfetti: () => set((s) => ({ confetti: s.confetti + 1 })),

      pushToast: (text) => {
        const id = toastId++
        set({ toasts: { id, text } })
        window.setTimeout(() => {
          const cur = get().toasts
          if (cur?.id === id) set({ toasts: null })
        }, 2600)
      },

      reset: () => {
        const { botTimer } = get()
        if (botTimer) window.clearTimeout(botTimer)
        set({
          user: null,
          pendingPhone: '',
          pendingName: '',
          expectedOtp: null,
          sprint: null,
          logs: [],
          cheers: [],
          pendingQueue: [],
          synced: true,
          botTimer: null,
          toasts: null,
          confetti: 0,
        })
      },
    }),
    {
      name: 'sugarsprint-state',
      partialize: (s) => ({
        user: s.user,
        sprint: s.sprint,
        logs: s.logs,
        cheers: s.cheers,
        pendingQueue: s.pendingQueue,
      }),
    },
  ),
)
