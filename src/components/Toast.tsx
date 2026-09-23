import type { ReactNode } from 'react'
import type { Toast } from '../store'

export function Toasts({ toasts }: { toasts: Toast }) {
  if (!toasts) return null
  return <div className="toast">{toasts.text}</div>
}

export function TopBar({
  name,
  onSettings,
}: {
  name?: string
  onSettings?: () => void
}) {
  const initials = (name ?? 'S')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="topbar">
      <div className="brand">
        <span className="brand-dot" />
        SugarSprint
      </div>
      <div className="row" style={{ gap: 8 }}>
        {name && <div className="avatar">{initials}</div>}
        {onSettings && (
          <button className="icon-btn" onClick={onSettings} aria-label="Settings">
            ⚙️
          </button>
        )}
      </div>
    </div>
  )
}

export function Screen({ children }: { children: ReactNode }) {
  return <div className="screen">{children}</div>
}

export function PhoneShell({ children }: { children: ReactNode }) {
  return <div className="phone-shell">{children}</div>
}
