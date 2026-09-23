import { useEffect, useMemo, useState } from 'react'

const COLORS = ['#FFE600', '#D4AF37', '#F1E5AC', '#ffffff', '#CCB800']

/**
 * Confetti burst — per Frontend Spec §8:
 * particles originate from the bottom of the screen and fade out after ~2s.
 * Rendered when a cheer arrives or a task is completed.
 */
export function Confetti({ trigger }: { trigger: number }) {
  const [bursts, setBursts] = useState<number[]>([])

  useEffect(() => {
    if (trigger === 0) return
    setBursts((b) => [...b, trigger])
    const t = window.setTimeout(() => {
      setBursts((b) => b.filter((x) => x !== trigger))
    }, 2200)
    return () => window.clearTimeout(t)
  }, [trigger])

  if (bursts.length === 0) return null
  return (
    <>
      {bursts.map((b) => (
        <Burst key={b} seed={b} />
      ))}
    </>
  )
}

function Burst({ seed }: { seed: number }) {
  const pieces = useMemo(() => {
    // Deterministic pseudo-random per burst so re-renders stay stable.
    const rand = (n: number) => {
      const x = Math.sin(seed * 999 + n * 77) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: 26 }, (_, i) => ({
      left: 4 + rand(i) * 92,
      delay: rand(i + 40) * 0.35,
      duration: 1.5 + rand(i + 80) * 0.6,
      color: COLORS[Math.floor(rand(i + 120) * COLORS.length)],
      scale: 0.7 + rand(i + 160) * 0.8,
    }))
  }, [seed])

  return (
    <div className="confetti-layer" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `scale(${p.scale})`,
          }}
        />
      ))}
    </div>
  )
}
