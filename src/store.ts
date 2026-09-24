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
import { blip, haptic } from './lib/format'
import { badgeById, evaluateBadges, levelForXp } from './lib/badges'

/**
 * Global state — Zustand with localStorage persistence.
 * Implements the Frontend Spec: optimistic UI, offline resilience
 * (logs queue in `pendingQueue` and flush when back online),
 * and a simulated caregiver bot that cheers completed days.
 */

/** Accessible text sizing. Applied to <html> so rem-based type scales with it. */
export type FontScale = 'sm' | 'md' | 'lg'

export type ToastItem = { id: number; text: string }
export type Toast = ToastItem | null

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
  toasts: ToastItem[]
  confetti: number // increment to trigger a burst
  // ---- v3 feature state ----
  profile: {
    avatar: string
    mood: string | null
    moodDate: string | null
    reminderTime: string
    consent: boolean
  }
  settings: {
    sound: boolean
    unit: 'mgdl' | 'mmoll'
    reduceMotion: boolean
    fontScale: FontScale
    notify: boolean
  }
  xp: number
  badges: string[]
  shieldDays: string[]
  walkSession: { preset: number; endsAt: number; pausedLeft: number | null } | null
  reportPin: string | null
  reportGenerated: boolean
  sentCheers: number
  offlineCompleted: boolean
  linkedCaregiver: boolean
  prefs: { caregiverNick: string; scheduledCheer: boolean }
}

interface AppActions {
  requestOtp: (phone: string) => Promise<void>
  confirmOtp: (otp: string) => boolean
  saveProfile: (name: string) => Promise<void>
  inviteCaregiver: () => Promise<string>
  startSprint: (type: SprintType) => Promise<void>
  completeToday: (opts: {
    value?: number | null
    media?: string
    transcription?: string
    tag?: 'fasting' | 'postmeal'
    note?: string
  }) => Promise<void>
  undoToday: () => Promise<void>
  setPendingMedia: (media: string | null) => void
  pendingMedia: string | null
  setTranscription: (t: string | null) => void
  transcription: string | null
  simulateOffline: (off: boolean) => void
  syncPending: () => Promise<void>
  sendCheer: (emoji: Cheer['emoji_type'], message?: string) => Promise<void>
  scheduleBotCheer: () => void
  triggerConfetti: () => void
  pushToast: (text: string) => void
  reset: () => void
  // ---- v3 actions ----
  checkBadges: () => void
  setMood: (emoji: string) => void
  setAvatar: (a: string) => void
  setReminder: (t: string) => void
  setUnit: (u: 'mgdl' | 'mmoll') => void
  setSound: (on: boolean) => void
  setReduceMotion: (on: boolean) => void
  setFontScale: (s: FontScale) => void
  setNotify: (on: boolean) => void
  setPin: (pin: string) => void
  clearPin: () => void
  exportData: () => void
  importData: (json: string) => boolean
  deleteAccount: () => void
  useShield: () => void
  setWalkSession: (s: { preset: number; endsAt: number; pausedLeft: number | null } | null) => void
  markReportGenerated: () => void
  setPrefs: (p: Partial<{ caregiverNick: string; scheduledCheer: boolean }>) => void
}

export type Store = AppState & AppActions

let toastId = 1
let localKeyCounter = 1

const todayLog = (logs: DailyLog[]): DailyLog | undefined => {
  const today = todayISO()
  return logs.find((l) => l.log_date === today)
}

/** Current streak: consecutive completed days ending today or yesterday.
 *  Streak Shield days count as done (no-guilt design). */
export function currentStreak(
  logs: DailyLog[],
  sprint: Sprint | null,
  shieldDays: string[] = [],
): number {
  if (!sprint || logs.length === 0) return 0
  const done = new Set([...logs.map((l) => l.log_date), ...shieldDays])
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
      toasts: [],
      confetti: 0,
      profile: { avatar: '🧑', mood: null, moodDate: null, reminderTime: '08:00', consent: false },
      settings: { sound: true, unit: 'mgdl', reduceMotion: false, fontScale: 'md', notify: false },
      xp: 0,
      badges: [],
      shieldDays: [],
      walkSession: null,
      reportPin: null,
      reportGenerated: false,
      sentCheers: 0,
      offlineCompleted: false,
      linkedCaregiver: false,
      prefs: { caregiverNick: 'Meera (Daughter)', scheduledCheer: false },

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

      inviteCaregiver: async () => {
        if (!get().linkedCaregiver) set({ linkedCaregiver: true })
        get().checkBadges()
        return createCaregiverLink()
      },

      // ---------------- sprint ----------------
      startSprint: async (type) => {
        const { user } = get()
        if (!user) return
        const sprint = await createSprint(user.id, type)
        set({ sprint, logs: [], cheers: [] })
      },

      // ---------------- daily log (optimistic + offline) ----------------
      completeToday: async ({ value = null, media, transcription, tag, note }) => {
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
          ...(tag ? { tag } : {}),
          ...(note ? { note } : {}),
        }
        // Optimistic insert
        set({ logs: [...logs, optimistic] })

        // ---- celebration: haptics, sound, XP, milestone, badges ----
        const hadPrev = logs.length > 0
        const prevStreak = currentStreak(logs, sprint, get().shieldDays)
        const streak = currentStreak(get().logs, sprint, get().shieldDays)
        let gained = 50
        if (media?.startsWith('data:')) gained += 10
        if (transcription) gained += 15
        if (!navigator.onLine && !get().offlineCompleted) set({ offlineCompleted: true })
        haptic([40, 35, 70])
        blip(get().settings.sound, 'done')
        set({ xp: get().xp + gained })
        get().pushToast(`⚡ +${gained} XP — sprint complete!`)
        if ([3, 7, 14, 21, 30].includes(streak) && streak > prevStreak) {
          get().triggerConfetti()
          get().pushToast(`🎉 ${streak}-day streak milestone reached!`)
        }
        get().checkBadges()
        void hadPrev

        try {
          const saved = await postLog({
            sprint_id: sprint.id,
            log_date: optimistic.log_date,
            value,
            media_url: optimistic.media_url,
            transcription: optimistic.transcription,
            ...(tag ? { tag } : {}),
            ...(note ? { note } : {}),
          })
          set({
            logs: get().logs.map((l) => (l.id === localKey ? saved : l)),
            pendingQueue: pendingQueue.filter((p) => p.localKey !== localKey),
          })
          get().scheduleBotCheer()
        } catch {
          // Queue for sync when connection returns (Frontend Spec §7)
          if (!get().offlineCompleted) set({ offlineCompleted: true })
          set({
            pendingQueue: [...pendingQueue, { __kind: 'log', localKey }],
            synced: false,
          })
          get().checkBadges()
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

      sendCheer: async (emoji, message) => {
        const { sprint, logs, user, cheers, prefs } = get()
        const log = todayLog(logs)
        if (!log || !sprint || !user) return
        const optimistic: Cheer = {
          id: `self-${Date.now()}`,
          log_id: log.id,
          caregiver_id: user.id,
          caregiver_name: prefs.caregiverNick || 'You',
          emoji_type: emoji,
          created_at: new Date().toISOString(),
          ...(message ? { message } : {}),
        }
        set({ cheers: [...cheers, optimistic], sentCheers: get().sentCheers + 1, xp: get().xp + 5 })
        get().triggerConfetti()
        haptic(25)
        blip(get().settings.sound, 'cheer')
        get().checkBadges()
      },

      // ---------------- fx ----------------
      triggerConfetti: () => set((s) => ({ confetti: s.confetti + 1 })),

      pushToast: (text) => {
        const id = toastId++
        set((s) => ({ toasts: [...s.toasts, { id, text }].slice(-3) })) // stacked queue, max 3
        window.setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, 3000)
      },

      // ---------------- v3: badges / XP ----------------
      checkBadges: () => {
        const s = get()
        const unlocked = evaluateBadges({
          logs: s.logs,
          cheers: s.cheers,
          streak: currentStreak(s.logs, s.sprint, s.shieldDays),
          user: s.user,
          sprint: s.sprint,
          badges: s.badges,
          shieldDays: s.shieldDays,
          linked: s.linkedCaregiver,
          offlineComplete: s.offlineCompleted,
          sentCheers: s.sentCheers,
          reportMade: s.reportGenerated,
          moodSet: s.profile.mood != null,
        })
        if (unlocked.length === 0) return
        set({ badges: [...s.badges, ...unlocked] })
        for (const id of unlocked) {
          const b = badgeById(id)
          if (!b) continue
          set({ xp: get().xp + b.xp })
          get().pushToast(`${b.icon} Badge unlocked: ${b.name} +${b.xp} XP`)
        }
        get().triggerConfetti()
        haptic([30, 40, 30])
        blip(get().settings.sound, 'badge')
        const newLevel = levelForXp(get().xp)
        if (newLevel !== levelForXp(s.xp)) {
          get().pushToast(`🚀 Level up! You are now level ${newLevel}`)
        }
      },

      setMood: (emoji) => {
        const today = todayISO()
        const firstToday = get().profile.moodDate !== today
        set({
          profile: { ...get().profile, mood: emoji, moodDate: today },
          xp: get().xp + (firstToday ? 5 : 0),
        })
        if (firstToday) get().pushToast('+5 XP — mood logged 🧘')
        get().checkBadges()
      },

      setAvatar: (a) => set({ profile: { ...get().profile, avatar: a } }),
      setReminder: (t) => set({ profile: { ...get().profile, reminderTime: t } }),
      setUnit: (u) => set({ settings: { ...get().settings, unit: u } }),
      setSound: (on) => set({ settings: { ...get().settings, sound: on } }),
      setReduceMotion: (on) => set({ settings: { ...get().settings, reduceMotion: on } }),
      setFontScale: (s) => set({ settings: { ...get().settings, fontScale: s } }),
      setNotify: (on) => set({ settings: { ...get().settings, notify: on } }),
      setPin: (pin) => set({ reportPin: pin }),
      clearPin: () => set({ reportPin: null }),

      markReportGenerated: () => {
        if (get().reportGenerated) return
        set({ reportGenerated: true, xp: get().xp + 30 })
        get().pushToast('+30 XP — doctor summary ready 📄')
        get().checkBadges()
      },

      setPrefs: (p) => set({ prefs: { ...get().prefs, ...p } }),

      setWalkSession: (s) => set({ walkSession: s }),

      useShield: () => {
        const today = todayISO()
        if (get().shieldDays.includes(today) || todayLog(get().logs)) return
        set({ shieldDays: [...get().shieldDays, today], xp: get().xp + 25 })
        get().pushToast('🛡️ Streak Shield used — today is protected')
        haptic([25, 25, 50])
        get().checkBadges()
      },

      // ---------------- DPDP: data portability ----------------
      exportData: () => {
        const s = get()
        const payload = JSON.stringify(
          {
            app: 'SugarSprint',
            exportedAt: new Date().toISOString(),
            user: s.user,
            profile: s.profile,
            sprint: s.sprint,
            logs: s.logs,
            cheers: s.cheers,
            xp: s.xp,
            badges: s.badges,
          },
          null,
          2,
        )
        const blob = new Blob([payload], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sugarsprint-backup-${todayISO()}.json`
        a.click()
        URL.revokeObjectURL(url)
        get().pushToast('📦 Data export downloaded')
      },

      importData: (json) => {
        try {
          const parsed = JSON.parse(json) as {
            user?: User
            sprint?: Sprint
            logs?: DailyLog[]
            cheers?: Cheer[]
            xp?: number
            badges?: string[]
            profile?: AppState['profile']
          }
          if (!parsed.sprint && !parsed.logs) return false
          set({
            user: parsed.user ?? get().user,
            sprint: parsed.sprint ?? get().sprint,
            logs: parsed.logs ?? [],
            cheers: parsed.cheers ?? [],
            xp: parsed.xp ?? get().xp,
            badges: parsed.badges ?? [],
            profile: parsed.profile ?? get().profile,
          })
          get().pushToast('📥 Backup restored successfully')
          return true
        } catch {
          get().pushToast('⚠️ Invalid backup file')
          return false
        }
      },

      deleteAccount: () => {
        try {
          localStorage.removeItem('sugarsprint-state')
        } catch {
          /* storage unavailable */
        }
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
          toasts: [],
          confetti: 0,
          xp: 0,
          badges: [],
          shieldDays: [],
          walkSession: null,
          reportPin: null,
          reportGenerated: false,
          sentCheers: 0,
          offlineCompleted: false,
          linkedCaregiver: false,
          profile: {
            avatar: '🧑',
            mood: null,
            moodDate: null,
            reminderTime: '08:00',
            consent: false,
          },
          settings: { sound: true, unit: 'mgdl', reduceMotion: false, fontScale: 'md', notify: false },
          prefs: { caregiverNick: 'Meera (Daughter)', scheduledCheer: false },
        })
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
          toasts: [],
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
        profile: s.profile,
        settings: s.settings,
        xp: s.xp,
        badges: s.badges,
        shieldDays: s.shieldDays,
        walkSession: s.walkSession,
        reportPin: s.reportPin,
        reportGenerated: s.reportGenerated,
        sentCheers: s.sentCheers,
        offlineCompleted: s.offlineCompleted,
        linkedCaregiver: s.linkedCaregiver,
        prefs: s.prefs,
      }),
    },
  ),
)
