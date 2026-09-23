import type { CheerEmoji, SprintType } from './types'

export interface SprintTheme {
  type: SprintType
  name: string
  tagline: string
  emoji: string
  taskCta: string
  capture: string
  unit: string
}

export const SPRINT_THEMES: SprintTheme[] = [
  {
    type: 'glucose',
    name: 'Log Fasting Sugar Every Morning',
    tagline: 'Pre-breakfast log with camera OCR',
    emoji: '🩸',
    taskCta: 'Log Now',
    capture: 'Camera OCR or Manual Numpad',
    unit: 'mg/dL',
  },
  {
    type: 'walk',
    name: '10-Min Post-Dinner Walk',
    tagline: 'Simple countdown timer — no wearables needed',
    emoji: '🚶',
    taskCta: 'Start Walk',
    capture: 'In-App Timer',
    unit: 'min',
  },
  {
    type: 'med',
    name: 'Med on Time',
    tagline: "One tap to mark today's dose as taken",
    emoji: '💊',
    taskCta: 'Mark as Taken',
    capture: 'One-Tap Confirm + Optional Photo/Voice',
    unit: 'dose',
  },
]

export function themeFor(type: SprintType): SprintTheme {
  return SPRINT_THEMES.find((t) => t.type === type) ?? SPRINT_THEMES[0]
}

export const CHEER_EMOJIS: CheerEmoji[] = ['👏', '❤️', '🔥']

/** Files live only as long as the AI needs them (Security Spec §3). */
export const MEDIA_RETENTION_NOTE =
  'Photos & voice notes are processed by AI, then permanently deleted from storage.'
