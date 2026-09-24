import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Screen, TopBar } from '../components/Toast'
import { levelForXp, levelTitle } from '../lib/badges'
import type { FontScale } from '../store'
import {
  askNotifyPermission,
  minutesUntil,
  notify,
  notifyPermission,
} from '../lib/notify'

const FONT_SCALES: { id: FontScale; label: string }[] = [
  { id: 'sm', label: 'Compact' },
  { id: 'md', label: 'Normal' },
  { id: 'lg', label: 'Large' },
]

const AVATARS = ['🧑', '👨', '👩', '👵', '👴', '🦸', '🐱', '🐶', '🌻', '⚡']

/** Settings & data controls — profile, preferences, DPDP data rights. */
export function Settings() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const profile = useStore((s) => s.profile)
  const settings = useStore((s) => s.settings)
  const xp = useStore((s) => s.xp)
  const badges = useStore((s) => s.badges)
  const setAvatar = useStore((s) => s.setAvatar)
  const setReminder = useStore((s) => s.setReminder)
  const setUnit = useStore((s) => s.setUnit)
  const setSound = useStore((s) => s.setSound)
  const setReduceMotion = useStore((s) => s.setReduceMotion)
  const setFontScale = useStore((s) => s.setFontScale)
  const setNotifyEnabled = useStore((s) => s.setNotify)
  const exportData = useStore((s) => s.exportData)
  const importData = useStore((s) => s.importData)
  const deleteAccount = useStore((s) => s.deleteAccount)
  const pushToast = useStore((s) => s.pushToast)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>(() =>
    notifyPermission(),
  )

  if (!user) {
    return (
      <div className="phone-shell">
        <Screen>
          <TopBar />
          <div className="card stack">
            <p className="sub">Sign in first to manage your settings.</p>
            <Link to="/app" className="btn btn-yellow">
              Go to onboarding
            </Link>
          </div>
        </Screen>
      </div>
    )
  }

  return (
    <div className="phone-shell">
      <Screen>
        <TopBar
          name={user.name}
          onSettings={() => nav('/app')}
        />

        <div className="row-between">
          <h1 className="h1">Settings</h1>
          <span className="badge gold">
            L{levelForXp(xp)} · {levelTitle(xp)}
          </span>
        </div>

        {/* Profile */}
        <div className="card stack">
          <span className="section-title">Profile</span>
          <div className="field">
            <label>Display name</label>
            <input className="input" value={user.name} readOnly />
          </div>
          <div className="field">
            <label>Pick your avatar</label>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {AVATARS.map((a) => (
                <button
                  key={a}
                  className={`icon-btn${profile.avatar === a ? '' : ''}`}
                  style={{
                    fontSize: '1.3rem',
                    borderColor: profile.avatar === a ? 'var(--yellow)' : undefined,
                  }}
                  onClick={() => setAvatar(a)}
                  aria-label={`Avatar ${a}`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="rem">Daily reminder time</label>
            <input
              id="rem"
              type="time"
              className="input"
              value={profile.reminderTime}
              onChange={(e) => setReminder(e.target.value)}
            />
          </div>
          <p className="small muted">
            Reminders arrive as a gentle nudge — never an alarm. (Demo: time is stored locally.)
          </p>
        </div>

        {/* Preferences */}
        <div className="card stack">
          <span className="section-title">Preferences</span>
          <div className="row-between">
            <span className="sub">Glucose unit</span>
            <div className="view-toggle">
              <button
                className={settings.unit === 'mgdl' ? 'on' : ''}
                onClick={() => setUnit('mgdl')}
              >
                mg/dL
              </button>
              <button
                className={settings.unit === 'mmoll' ? 'on' : ''}
                onClick={() => setUnit('mmoll')}
              >
                mmol/L
              </button>
            </div>
          </div>
          <div className="row-between">
            <span className="sub">Completion sound</span>
            <div className="view-toggle">
              <button className={settings.sound ? 'on' : ''} onClick={() => setSound(true)}>
                🔊 On
              </button>
              <button className={!settings.sound ? 'on' : ''} onClick={() => setSound(false)}>
                🔇 Off
              </button>
            </div>
          </div>
          <div className="row-between">
            <span className="sub">Achievements</span>
            <Link to="/badges" className="small">
              {badges.length} unlocked →
            </Link>
          </div>
        </div>

        {/* Accessibility & display */}
        <div className="card stack">
          <span className="section-title">Accessibility &amp; display</span>

          <div className="row-between">
            <span className="sub">Text size</span>
            <div className="view-toggle">
              {FONT_SCALES.map((f) => (
                <button
                  key={f.id}
                  className={(settings.fontScale ?? 'md') === f.id ? 'on' : ''}
                  onClick={() => setFontScale(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="row-between">
            <span className="sub">Reduce motion</span>
            <div className="view-toggle">
              <button
                className={settings.reduceMotion ? 'on' : ''}
                onClick={() => setReduceMotion(true)}
              >
                On
              </button>
              <button
                className={!settings.reduceMotion ? 'on' : ''}
                onClick={() => setReduceMotion(false)}
              >
                Off
              </button>
            </div>
          </div>
          <p className="small muted">
            Reduce motion calms the confetti, ring spins and marquees — every flow still works
            exactly the same. Your OS-level preference is respected either way.
          </p>
        </div>

        {/* Reminders & notifications */}
        <div className="card stack">
          <span className="section-title">Reminders &amp; notifications</span>
          <div className="row-between">
            <span className="sub">Device nudges</span>
            <span className="badge">
              {permission === 'granted'
                ? '✅ Enabled'
                : permission === 'denied'
                  ? '🚫 Blocked in browser'
                  : permission === 'unsupported'
                    ? '— Not supported here'
                    : 'Not set up'}
            </span>
          </div>
          <p className="small muted">
            Next nudge is scheduled for {profile.reminderTime} ({minutesUntil(profile.reminderTime) ?? '—'}{' '}
            minutes away). Nudges are optional and stay on this device.
          </p>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-ghost"
              disabled={permission === 'unsupported'}
              onClick={() => {
                void (async () => {
                  const res = await askNotifyPermission()
                  setPermission(res)
                  setNotifyEnabled(res === 'granted')
                  pushToast(
                    res === 'granted'
                      ? '🔔 Device nudges enabled'
                      : res === 'unsupported'
                        ? 'This browser cannot show notifications'
                        : '🚫 Notifications were blocked',
                  )
                })()
              }}
            >
              🔔 Enable device nudges
            </button>
            <button
              className="btn btn-ghost"
              disabled={permission !== 'granted'}
              onClick={() => {
                const ok = notify(
                  'SugarSprint · gentle nudge',
                  'Your daily sprint is waiting — one tap is all it takes. 💛',
                )
                pushToast(ok ? '🔔 Test nudge sent' : 'Allow notifications first')
              }}
            >
              Send a test nudge
            </button>
          </div>
        </div>

        {/* Data rights (DPDP) */}
        <div className="card stack">
          <span className="section-title">My data, my rights (DPDP)</span>
          <p className="small muted">
            Export everything SugarSprint knows about you, restore a backup later, or erase it
            all in one tap. Photos and voice notes were already deleted after AI processing.
          </p>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-ghost" onClick={exportData}>
              📦 Export my data
            </button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              📥 Import backup
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                const reader = new FileReader()
                reader.onload = () => {
                  const ok = importData(String(reader.result))
                  if (ok) nav('/app')
                }
                reader.readAsText(f)
                e.target.value = ''
              }}
            />
          </div>
        </div>

        {/* Danger zone */}
        <div className="card stack" style={{ borderColor: 'rgba(248,113,113,0.4)' }}>
          <span className="section-title" style={{ color: 'var(--danger)' }}>
            Danger zone
          </span>
          {!confirming ? (
            <button
              className="btn btn-ghost"
              style={{ borderColor: 'rgba(248,113,113,0.5)', color: 'var(--danger)' }}
              onClick={() => setConfirming(true)}
            >
              🗑️ Delete my account &amp; data
            </button>
          ) : (
            <div className="stack">
              <p className="small">
                This erases your profile, sprint, logs, cheers and badges from this device —
                permanently. Export first if you want a copy.
              </p>
              <div className="row" style={{ gap: 10 }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    deleteAccount()
                    pushToast('👋 Account & data deleted')
                    nav('/')
                  }}
                  style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                >
                  Yes, erase everything
                </button>
                <button className="btn btn-ghost" onClick={() => setConfirming(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="small muted center">
          SugarSprint v0.2.0 · Made with ❤️ by Starway
        </p>
      </Screen>
    </div>
  )
}
