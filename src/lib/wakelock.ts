import { useEffect, useRef, useState } from 'react'

/**
 * Screen Wake Lock.
 *
 * A walk timer is useless if the phone sleeps two minutes in. The spec calls for
 * no wearables and no fuss, so we keep the screen awake only while the timer
 * runs, and re-acquire after the tab returns (browsers drop the lock on hide).
 */

interface WakeLockSentinelLike {
  released: boolean
  release: () => Promise<void>
  addEventListener: (type: 'release', listener: () => void) => void
}

type WakeLockContainer = {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>
  }
}

export function useWakeLock(active: boolean): { supported: boolean; held: boolean } {
  const [held, setHeld] = useState(false)
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null)
  const container = typeof navigator === 'undefined' ? undefined : (navigator as unknown as WakeLockContainer)
  const supported = Boolean(container?.wakeLock)

  useEffect(() => {
    let cancelled = false

    const acquire = async () => {
      if (!supported || !active) return
      try {
        const sentinel = await container!.wakeLock!.request('screen')
        if (cancelled) {
          void sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        setHeld(true)
        sentinel.addEventListener('release', () => setHeld(false))
      } catch {
        setHeld(false)
      }
    }

    const release = () => {
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      setHeld(false)
      if (sentinel && !sentinel.released) void sentinel.release().catch(() => {})
    }

    if (active) {
      void acquire()
    } else {
      release()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible' && active && !sentinelRef.current) void acquire()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      release()
    }
  }, [active, supported, container])

  return { supported, held }
}
