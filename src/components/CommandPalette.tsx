import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

/**
 * Command palette (⌘K / Ctrl+K).
 *
 * One search box for every destination and every app action, with full keyboard
 * control. Rendered once at the app root so it works on any route.
 */

interface Command {
  id: string
  icon: string
  label: string
  hint: string
  keywords: string
  run: () => void
}

export function CommandPalette() {
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const user = useStore((s) => s.user)
  const sprint = useStore((s) => s.sprint)
  const synced = useStore((s) => s.synced)
  const settings = useStore((s) => s.settings)
  const simulateOffline = useStore((s) => s.simulateOffline)
  const pushToast = useStore((s) => s.pushToast)
  const exportData = useStore((s) => s.exportData)
  const setSound = useStore((s) => s.setSound)
  const setUnit = useStore((s) => s.setUnit)
  const reset = useStore((s) => s.reset)

  const commands = useMemo<Command[]>(() => {
    const list: Command[] = [
      { id: 'home', icon: '🏠', label: 'Dashboard', hint: 'Today’s challenge and stats', keywords: 'home app today', run: () => nav('/app') },
      { id: 'capture', icon: '⚡', label: 'Quick capture', hint: 'Log a reading, walk or dose', keywords: 'sprint log camera ocr', run: () => nav('/capture') },
      { id: 'insights', icon: '📈', label: 'Insights', hint: 'Time in range, A1c estimate, trends', keywords: 'analytics chart tir hba1c', run: () => nav('/insights') },
      { id: 'care', icon: '💛', label: 'Care circle', hint: 'Send a cheer as a caregiver', keywords: 'caregiver cheer family', run: () => nav('/care') },
      { id: 'report', icon: '📄', label: 'Doctor report', hint: 'Generate the 30-day summary', keywords: 'pdf doctor print export', run: () => nav('/report') },
      { id: 'badges', icon: '🏆', label: 'Achievements', hint: 'Badges, XP and levels', keywords: 'badge xp level trophy', run: () => nav('/badges') },
      { id: 'settings', icon: '⚙️', label: 'Settings', hint: 'Units, reminders and your data', keywords: 'preferences units backup', run: () => nav('/settings') },
      { id: 'landing', icon: '🌐', label: 'Landing page', hint: 'Marketing site and FAQ', keywords: 'home marketing about', run: () => nav('/') },
    ]

    list.push({
      id: 'unit',
      icon: '🔢',
      label: settings.unit === 'mgdl' ? 'Switch to mmol/L' : 'Switch to mg/dL',
      hint: 'Change the glucose unit everywhere',
      keywords: 'units mgdl mmoll convert metric',
      run: () => {
        const next = settings.unit === 'mgdl' ? 'mmoll' : 'mgdl'
        setUnit(next)
        pushToast(next === 'mgdl' ? '🔢 Showing mg/dL' : '🔢 Showing mmol/L')
      },
    })

    list.push({
      id: 'sound',
      icon: settings.sound ? '🔇' : '🔊',
      label: settings.sound ? 'Turn completion sound off' : 'Turn completion sound on',
      hint: 'Chime when a sprint completes',
      keywords: 'audio mute volume chime',
      run: () => {
        setSound(!settings.sound)
        pushToast(settings.sound ? '🔇 Sound off' : '🔊 Sound on')
      },
    })

    list.push({
      id: 'offline',
      icon: '📵',
      label: synced ? 'Simulate offline' : 'Go back online',
      hint: 'Demo the offline queue and sync',
      keywords: 'network wifi queue sync demo',
      run: () => {
        simulateOffline(synced)
        pushToast(synced ? '📵 Offline mode on' : '📶 Back online')
      },
    })

    list.push({
      id: 'export',
      icon: '📦',
      label: 'Export my data (JSON)',
      hint: 'Download everything SugarSprint holds',
      keywords: 'backup download gdpr dpdp json',
      run: () => exportData(),
    })

    list.push({
      id: 'print',
      icon: '🖨️',
      label: 'Print / Save as PDF',
      hint: 'Uses the browser print dialog',
      keywords: 'paper doctor pdf save',
      run: () => window.print(),
    })

    if (user) {
      list.push({
        id: 'reset',
        icon: '♻️',
        label: 'Reset the demo',
        hint: 'Wipe local state and start over',
        keywords: 'clear delete fresh restart',
        run: () => {
          reset()
          pushToast('♻️ Demo reset')
          nav('/app')
        },
      })
    }

    return list
  }, [nav, settings, synced, user, simulateOffline, pushToast, exportData, setSound, setUnit, reset])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter((c) =>
      `${c.label} ${c.hint} ${c.keywords}`.toLowerCase().includes(q),
    )
  }, [commands, query])

  // Global shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
        setQuery('')
        setCursor(0)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Keep the cursor inside the result list
  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, results.length - 1)))
  }, [results.length])

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 30)
  }, [open])

  if (!open) {
    return (
      <button
        type="button"
        className="palette-fab"
        onClick={() => {
          setOpen(true)
          setQuery('')
          setCursor(0)
        }}
        aria-label="Open command palette"
        title="Command palette — Ctrl/⌘ K"
      >
        ⌘
      </button>
    )
  }

  const runAt = (index: number) => {
    const cmd = results[index]
    if (!cmd) return
    cmd.run()
    setOpen(false)
  }

  return (
    <div
      className="palette-backdrop"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="palette-input-row">
          <span aria-hidden>🔎</span>
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Search actions and pages…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setCursor(0)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setCursor((c) => Math.min(results.length - 1, c + 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setCursor((c) => Math.max(0, c - 1))
              } else if (e.key === 'Enter') {
                e.preventDefault()
                runAt(cursor)
              }
            }}
          />
          <kbd className="palette-kbd">Esc</kbd>
        </div>

        <div className="palette-results" role="listbox" aria-label="Commands">
          {results.length === 0 ? (
            <p className="small muted" style={{ padding: '14px 4px' }}>
              Nothing matches “{query}”. Try “report”, “offline” or “unit”.
            </p>
          ) : (
            results.map((c, i) => (
              <button
                key={c.id}
                type="button"
                role="option"
                aria-selected={i === cursor}
                className={`palette-item${i === cursor ? ' on' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => runAt(i)}
              >
                <span className="pi-ico" aria-hidden>
                  {c.icon}
                </span>
                <span className="pi-body">
                  <span className="pi-label">{c.label}</span>
                  <span className="pi-hint">{c.hint}</span>
                </span>
              </button>
            ))
          )}
        </div>

        <div className="palette-foot">
          <span className="small muted">
            ↑↓ to move · Enter to run · Esc to close
          </span>
          {sprint && <span className="badge">{sprint.sprint_type} sprint</span>}
        </div>
      </div>
    </div>
  )
}
