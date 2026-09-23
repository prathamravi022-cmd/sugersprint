import { useEffect, useRef, useState } from 'react'
import type { Sprint } from '../types'
import { TOTAL_DAYS } from '../types'

/**
 * <StreakRing /> — per Frontend Spec §4:
 * Circular SVG chart, stroke transitions grey (incomplete) → Metallic Gold,
 * animates the draw on mount, glow via CSS drop-shadow.
 */
export function StreakRing({
  sprint,
  streak,
  logs,
}: {
  sprint: Sprint | null
  streak: number
  logs: number
}) {
  const [drawn, setDrawn] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    let start: number | null = null
    const animate = (ts: number) => {
      if (start === null) start = ts
      const p = Math.min(1, (ts - start) / 1100)
      const eased = 1 - Math.pow(1 - p, 3)
      setDrawn(eased)
      if (p < 1) rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const size = 230
  const stroke = 14
  const r = (size - stroke) / 2 - 6
  const circumference = 2 * Math.PI * r
  const dayNumber = sprint
    ? Math.min(TOTAL_DAYS, Math.max(1, dayOfSprint(sprint.start_date)))
    : 0
  const portion = dayNumber / TOTAL_DAYS
  const complete = streak >= dayNumber && dayNumber > 0
  const color = complete ? 'var(--gold)' : streak > 0 ? 'var(--gold)' : '#8a8a8a'
  const dash = circumference * portion * drawn

  return (
    <div className="ring-wrap">
      <svg className="ring-svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Track = full 30-day sprint */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        {/* Grey segment = days still ahead */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#8a8a8a"
          strokeOpacity={0.5}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={0}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            strokeDasharray: `${circumference * (1 - portion) * drawn} ${circumference}`,
            strokeDashoffset: -circumference * portion * drawn,
          }}
        />
        {/* Gold segment = days completed */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="47%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="ring-center"
          fontSize={34}
        >
          Day {dayNumber || '—'}
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--text-dim)"
          fontSize={13}
          fontWeight={600}
        >
          of {TOTAL_DAYS}
        </text>
      </svg>
      <div className="ring-days numeric">
        {streak} day{streak === 1 ? '' : 's'} streak · {logs} logged
      </div>
    </div>
  )
}

function dayOfSprint(startISO: string): number {
  const [sy, sm, sd] = startISO.split('-').map(Number)
  const now = new Date()
  const diff = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
      new Date(sy, sm - 1, sd).getTime()) /
      86_400_000,
  )
  return diff + 1
}
