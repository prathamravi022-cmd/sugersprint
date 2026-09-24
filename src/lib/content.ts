/** Deterministic daily content — rotates by day-of-year. */

const dayIndex = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now.getTime() - start.getTime()) / 86_400_000)
}

export const QUOTES = [
  'Small wins, repeated daily, beat big plans attempted twice.',
  'You are not managing a disease — you are training a habit.',
  'The streak forgives. The ring remembers. Show up anyway.',
  'Two minutes today is worth two hours of intention tomorrow.',
  'Consistency is the compound interest of health.',
  'Nobody climbs a mountain — they just take the next step.',
  'A missed day is a data point, not a verdict.',
  'Your future self is built at 7 a.m., not at midnight.',
  'Progress loves patience. Perfection loves nothing.',
  'The goal is not perfection. The goal is returning.',
  'Care that feels like a chore loses to care that feels like a win.',
  'Every gold ring started as a grey circle.',
]

export const TIPS = [
  'Pair your log with an existing habit — toothbrush first, then glucose log.',
  'A 10-minute walk after dinner blunts the post-meal sugar spike.',
  'Keep the glucometer on the breakfast table, not in a drawer.',
  'Fasting checks are most useful before you eat, not after.',
  'Medication at the same time daily trains your body clock.',
  'Drink water before you judge a high reading — hydration matters.',
  'Sleep under 6 hours raises insulin resistance. Protect the night.',
  'Tell your caregiver your “why” — cheers land harder with context.',
  'Feet check weekly: diabetes care is not only about numbers.',
  'Log the reading even when it is bad. Especially when it is bad.',
  'Spice, fibre and protein slow sugar absorption — plate first, carbs later.',
  'Screens off 30 minutes before bed; morning readings thank you.',
]

export const FACTS = [
  'Walking for just 10 minutes can lower post-meal glucose for hours.',
  'Muscle is your largest glucose sink — every step shops for it.',
  'Your pancreas releases insulin in rhythmic pulses, not a steady stream.',
  'Streaks work because breaking them costs more emotionally than doing the task.',
  'Hinglish voice notes are harder for accents than for humans — keep talking.',
  'The “dawn phenomenon” makes 6–8 a.m. readings naturally higher.',
]

export const quoteOfToday = () => QUOTES[dayIndex() % QUOTES.length]
export const tipOfToday = () => TIPS[dayIndex() % TIPS.length]
export const factOfToday = () => FACTS[dayIndex() % FACTS.length]

export const MOODS = [
  { emoji: '😄', label: 'Great', xp: 5 },
  { emoji: '🙂', label: 'Good', xp: 5 },
  { emoji: '😐', label: 'Okay', xp: 5 },
  { emoji: '😔', label: 'Low', xp: 5 },
  { emoji: '😖', label: 'Rough', xp: 5 },
]

/** Tone guard: rewrites nagging phrases into supportive ones (Caregiver spec). */
export const TONE_GUARD: Array<[RegExp, string]> = [
  [/did you (take|check|do|finish)/i, 'Loved seeing your progress today 💛'],
  [/why (haven’t|haven't|didnt|didn't) you/i, 'Whenever you’re ready — I’m cheering you on'],
  [/you forgot/i, 'No worries at all — today is a fresh start 🌱'],
  [/always|never/i, 'Every small step counts 💪'],
  [/ hurry|fast|quickly/i, 'No pressure — I’ll be here either way'],
]

export function applyToneGuard(text: string): { safe: string; guarded: boolean } {
  let safe = text
  let guarded = false
  for (const [pattern, replacement] of TONE_GUARD) {
    if (pattern.test(safe)) {
      safe = replacement
      guarded = true
      break
    }
  }
  return { safe, guarded }
}
