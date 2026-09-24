/**
 * Local notifications.
 *
 * Gentle nudges, never alarms — matching the product's tone. Everything is
 * best-effort: unsupported browsers simply get the in-app toast instead.
 */

export function notifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notifyPermission(): NotificationPermission | 'unsupported' {
  if (!notifySupported()) return 'unsupported'
  return Notification.permission
}

export async function askNotifyPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!notifySupported()) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function notify(title: string, body: string): boolean {
  if (!notifySupported() || Notification.permission !== 'granted') return false
  try {
    new Notification(title, { body, icon: '/favicon.svg', tag: 'sugarsprint-nudge' })
    return true
  } catch {
    return false
  }
}

/** Minutes until the next occurrence of "HH:MM", or null if unparseable. */
export function minutesUntil(time: string): number | null {
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const now = new Date()
  const target = new Date(now)
  target.setHours(h, m, 0, 0)
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1)
  return Math.round((target.getTime() - now.getTime()) / 60_000)
}
