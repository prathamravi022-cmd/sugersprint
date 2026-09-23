import { themeFor } from '../constants'
import type { DailyLog, SprintType } from '../types'

/**
 * <TaskCard /> — per Frontend Spec §4:
 * Dark grey surface, yellow left-border when pending, transitions to a
 * Metallic Gold "Sprint Complete" state on success. Scales to 95% on press.
 */
export function TaskCard({
  type,
  log,
  streak,
  onClick,
}: {
  type: SprintType
  log: DailyLog | undefined
  streak: number
  onClick: () => void
}) {
  const theme = themeFor(type)
  const done = Boolean(log)

  return (
    <button className={`task-card${done ? ' done' : ''}`} onClick={onClick}>
      <div className="task-card-top">
        <span className="task-emoji">{done ? '🏆' : theme.emoji}</span>
        <span className={`task-check${done ? ' on' : ''}`}>{done ? '✓' : ''}</span>
      </div>
      <span className="task-label">{done ? 'Sprint Complete' : "Today's Sprint"}</span>
      <span className="task-title">{done ? `${theme.name} — done!` : theme.name}</span>
      <span className="task-meta">
        {done
          ? `Streak: ${streak} day${streak === 1 ? '' : 's'} · great work today`
          : `${theme.taskCta} · takes ~2 minutes`}
      </span>
    </button>
  )
}
