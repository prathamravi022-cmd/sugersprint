import { todayISO } from '../types'
import type { Cheer, DailyLog, Sprint, User } from '../types'

/** Unlockable achievement badges (Achievements gallery). */
export interface Badge {
  id: string
  icon: string
  name: string
  desc: string
  xp: number
}

export const BADGES: Badge[] = [
  { id: 'first-sprint', icon: '🏁', name: 'First Step', desc: 'Complete your first daily sprint', xp: 50 },
  { id: 'streak-3', icon: '🔥', name: 'Kindling', desc: 'Reach a 3-day streak', xp: 30 },
  { id: 'streak-7', icon: '⚡', name: 'One Week Strong', desc: 'Reach a 7-day streak', xp: 70 },
  { id: 'streak-14', icon: '🌟', name: 'Fortnight Fire', desc: 'Reach a 14-day streak', xp: 140 },
  { id: 'streak-21', icon: '🏆', name: 'Habit Forming', desc: 'Reach a 21-day streak', xp: 210 },
  { id: 'streak-30', icon: '👑', name: 'Sprint Champion', desc: 'Complete the full 30-day sprint', xp: 300 },
  { id: 'photo-shot', icon: '📸', name: 'Sharp Shooter', desc: 'Log glucose with a photo', xp: 20 },
  { id: 'voice-note', icon: '🎙️', name: 'Voice of the Sprint', desc: 'Record an optional voice note', xp: 25 },
  { id: 'walker', icon: '🚶', name: 'Pavement Pioneer', desc: 'Finish a timed walk sprint', xp: 40 },
  { id: 'med-taken', icon: '💊', name: 'On Time', desc: 'Mark a medication dose as taken', xp: 40 },
  { id: 'first-cheer', icon: '💛', name: 'Encouraged', desc: 'Receive your first caregiver cheer', xp: 15 },
  { id: 'cheer-sender', icon: '👏', name: 'Hype Squad', desc: 'Send a cheer as a caregiver', xp: 15 },
  { id: 'caregiver-linked', icon: '🤝', name: 'Not Alone', desc: 'Generate a caregiver invite link', xp: 25 },
  { id: 'report-made', icon: '📄', name: 'Doctor Ready', desc: 'Generate your first doctor summary', xp: 30 },
  { id: 'early-bird', icon: '🌅', name: 'Early Bird', desc: 'Complete a sprint before 9:00 AM', xp: 20 },
  { id: 'comeback', icon: '🌱', name: 'Comeback Kid', desc: 'Log again after a missed day', xp: 35 },
  { id: 'offline-hero', icon: '📡', name: 'Offline Hero', desc: 'Complete a sprint while offline', xp: 30 },
  { id: 'shield-used', icon: '🛡️', name: 'Shield Bearer', desc: 'Protect a day with a Streak Shield', xp: 25 },
  { id: 'mood-check', icon: '🧘', name: 'Self Aware', desc: 'Check in with your mood', xp: 10 },
  { id: 'ten-sprints', icon: '🎯', name: 'Double Digits', desc: 'Complete 10 sprints', xp: 100 },
]

export interface BadgeContext {
  logs: DailyLog[]
  cheers: Cheer[]
  streak: number
  user: User | null
  sprint: Sprint | null
  badges: string[]
  shieldDays: string[]
  linked: boolean
  offlineComplete: boolean
  sentCheers: number
  reportMade: boolean
  moodSet: boolean
}

/** Returns badge ids that should unlock given current state. */
export function evaluateBadges(ctx: BadgeContext): string[] {
  const have = new Set(ctx.badges)
  const done = new Set(ctx.logs.map((l) => l.log_date))
  const unlocked: string[] = []
  const add = (id: string, cond: boolean) => {
    if (cond && !have.has(id)) unlocked.push(id)
  }

  add('first-sprint', ctx.logs.length >= 1)
  add('streak-3', ctx.streak >= 3)
  add('streak-7', ctx.streak >= 7)
  add('streak-14', ctx.streak >= 14)
  add('streak-21', ctx.streak >= 21)
  add('streak-30', ctx.streak >= 30 || ctx.logs.length >= 30)
  add('ten-sprints', ctx.logs.length >= 10)
  add('photo-shot', ctx.logs.some((l) => l.media_url != null && l.media_url.startsWith('data:')))
  add('voice-note', ctx.logs.some((l) => l.transcription != null))
  add('walker', ctx.sprint?.sprint_type === 'walk' && ctx.logs.length >= 1)
  add('med-taken', ctx.sprint?.sprint_type === 'med' && ctx.logs.length >= 1)
  add('first-cheer', ctx.cheers.length >= 1)
  add('caregiver-linked', ctx.linked)
  add('report-made', ctx.reportMade)
  add(
    'early-bird',
    ctx.logs.some((l) => {
      const t = new Date(l.created_at)
      return t.getHours() < 9
    }),
  )
  add(
    'comeback',
    ctx.logs.some((l) => {
      const start = ctx.sprint?.start_date ?? l.log_date
      if (diffDays(l.log_date, start) <= 0) return false
      const [y, m, d] = l.log_date.split('-').map(Number)
      const prevIso = todayISO(new Date(y, m - 1, d - 1))
      return !done.has(prevIso)
    }),
  )
  add('offline-hero', ctx.offlineComplete)
  add('shield-used', ctx.shieldDays.length > 0)
  add('mood-check', ctx.moodSet)
  add('cheer-sender', ctx.sentCheers > 0)

  return unlocked
}

function diffDays(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round(
    (new Date(ay, am - 1, ad).getTime() - new Date(by, bm - 1, bd).getTime()) / 86_400_000,
  )
}

export const badgeById = (id: string): Badge | undefined => BADGES.find((b) => b.id === id)

export const LEVEL_TITLES = [
  'Rookie Sprinter',
  'Habit Builder',
  'Streak Keeper',
  'Sprint Warrior',
  'Gold Ring Runner',
  'Diabetes Dynamo',
  'Sprint Legend',
]

export const levelForXp = (xp: number) => Math.min(LEVEL_TITLES.length, Math.floor(xp / 100) + 1)
export const levelTitle = (xp: number) => LEVEL_TITLES[levelForXp(xp) - 1] ?? LEVEL_TITLES[0]
