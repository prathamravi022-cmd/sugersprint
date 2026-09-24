import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SPRINT_THEMES } from '../constants'
import { useStore } from '../store'
import { PhoneShell, Screen, TopBar } from '../components/Toast'
import { Photo, unsplash } from '../components/Photo'
import type { SprintType } from '../types'

const AVATARS = ['🧑', '👨', '👩', '👵', '👴', '🦸', '🐱', '🐶', '🌻', '⚡']

/**
 * Onboarding — PRD §4A:
 * phone OTP → profile → invite caregiver (SMS/WhatsApp) → pick a sprint.
 * The patient commits to ONE 30-day goal, no blank dashboard.
 */
export function Onboarding() {
  const [step, setStep] = useState<'phone' | 'otp' | 'profile' | 'invite' | 'sprint'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const avatar = useStore((s) => s.profile.avatar)
  const setAvatar = useStore((s) => s.setAvatar)

  const requestOtp = useStore((s) => s.requestOtp)
  const confirmOtp = useStore((s) => s.confirmOtp)
  const saveProfile = useStore((s) => s.saveProfile)
  const inviteCaregiver = useStore((s) => s.inviteCaregiver)
  const startSprint = useStore((s) => s.startSprint)
  const pushToast = useStore((s) => s.pushToast)

  const progress = { phone: 0, otp: 1, profile: 2, invite: 3, sprint: 4 }[step]

  return (
    <PhoneShell>
      <Screen>
        <TopBar />
        <Link to="/" className="btn-link" style={{ alignSelf: 'flex-start' }}>
          ← Back to home
        </Link>
        <div className="steps">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`step-dot${i <= progress ? ' on' : ''}`} />
          ))}
        </div>

        {step === 'phone' && (
          <>
            <div className="center" style={{ marginTop: 18 }}>
              <div style={{ fontSize: 52 }}>🏃‍♂️</div>
              <h1 className="h1">Turn diabetes care into a daily win.</h1>
              <p className="sub" style={{ marginTop: 8 }}>
                30-day micro-habit sprints. Two minutes a day. Streaks, cheers, and a doctor-ready
                summary at the finish line.
              </p>
            </div>
            <div className="card stack">
              <span className="section-title">Get started</span>
              <div className="field">
                <label htmlFor="phone">Phone number</label>
                <input
                  id="phone"
                  className="input"
                  inputMode="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <label
                className="row"
                style={{ gap: 10, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-dim)' }}
              >
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: '#FACC15' }}
                />
                <span>
                  I consent to processing of my health logs under the DPDP Act 2023 — explicit
                  consent, data minimisation, delete anytime.
                </span>
              </label>
              <button
                className="btn btn-yellow"
                disabled={phone.replace(/\D/g, '').length < 10 || !consent || busy}
                onClick={async () => {
                  setBusy(true)
                  await requestOtp(phone)
                  setBusy(false)
                  setStep('otp')
                }}
              >
                Send OTP
              </button>
              <button
                className="btn btn-ghost"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  useStore.setState((s) => ({ profile: { ...s.profile, consent: true } }))
                  await saveProfile('Rahul')
                  await startSprint('glucose')
                  setBusy(false)
                }}
              >
                🎮 Explore the demo (skip signup)
              </button>
              <p className="small muted">
                Phone OTP keeps sign-in frictionless for less tech-savvy family members.
              </p>
            </div>
          </>
        )}

        {step === 'otp' && (
          <div className="card stack" style={{ marginTop: 12 }}>
            <span className="section-title">Verify OTP</span>
            <p className="sub">
              (Demo) Your OTP is <b className="yellow-text numeric">{useStore.getState().expectedOtp}</b>
            </p>
            <input
              className="otp-input"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            {error && <p className="small" style={{ color: 'var(--danger)' }}>{error}</p>}
            <button
              className="btn btn-yellow"
              disabled={otp.length < 6 || busy}
              onClick={() => {
                if (confirmOtp(otp)) {
                  setError(null)
                  setStep('profile')
                } else {
                  setError('Incorrect code — please try again.')
                }
              }}
            >
              Verify & Continue
            </button>
          </div>
        )}

        {step === 'profile' && (
          <div className="card stack" style={{ marginTop: 12 }}>
            <span className="section-title">Your profile</span>
            <div className="field">
              <label htmlFor="name">What should we call you?</label>
              <input
                id="name"
                className="input"
                placeholder="Rahul"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Choose your avatar</label>
              <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    className="icon-btn"
                    style={{
                      fontSize: '1.3rem',
                      borderColor: avatar === a ? 'var(--yellow)' : undefined,
                    }}
                    onClick={() => setAvatar(a)}
                    aria-label={`Avatar ${a}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-yellow"
              disabled={name.trim().length < 2 || busy}
              onClick={async () => {
                setBusy(true)
                await saveProfile(name.trim())
                setBusy(false)
                setStep('invite')
              }}
            >
              Continue
            </button>
          </div>
        )}

        {step === 'invite' && (
          <div className="card stack" style={{ marginTop: 12 }}>
            <div
              style={{
                position: 'relative',
                height: 130,
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <Photo
                src={unsplash('photo-1511895426328-dc8714191300', 800)}
                alt="Family together — caregiving made lighter"
                emoji="👨‍👩‍👧"
              />
            </div>
            <span className="section-title">Invite a caregiver</span>
            <p className="sub">
              A spouse or child gets a magic link on WhatsApp/SMS. They cheer you on — they never
              see raw numbers unless you share a report.
            </p>
            {link ? (
              <div className="stack">
                <div className="readout" style={{ justifyContent: 'flex-start' }}>
                  <span className="small gold-text" style={{ wordBreak: 'break-all' }}>
                    {link}
                  </span>
                </div>
                <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      void navigator.clipboard?.writeText(link)
                      pushToast('🔗 Link copied')
                    }}
                  >
                    📋 Copy
                  </button>
                  <a
                    className="btn btn-ghost"
                    href={`https://wa.me/?text=${encodeURIComponent(`Join my SugarSprint as my caregiver 💛 ${link}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    💬 WhatsApp
                  </a>
                  <a
                    className="btn btn-ghost"
                    href={`sms:?&body=${encodeURIComponent(`SugarSprint caregiver invite: ${link}`)}`}
                  >
                    ✉️ SMS
                  </a>
                </div>
                <button className="btn btn-ghost" onClick={() => setStep('sprint')}>
                  Continue →
                </button>
              </div>
            ) : (
              <button
                className="btn btn-gold"
                disabled={busy}
                onClick={async () => {
                  setBusy(true)
                  setLink(await inviteCaregiver())
                  setBusy(false)
                }}
              >
                Generate secure invite link
              </button>
            )}
            <button className="btn-link" onClick={() => setStep('sprint')}>
              Continue →
            </button>
          </div>
        )}

        {step === 'sprint' && (
          <>
            <div className="center" style={{ marginTop: 16 }}>
              <h1 className="h1">Pick your sprint</h1>
              <p className="sub">One goal. Thirty days. You've got this, {name || 'champion'}.</p>
            </div>
            <div
              style={{
                position: 'relative',
                height: 120,
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid var(--border)',
              }}
            >
              <Photo
                src={unsplash('photo-1585937421612-70a008356fbe', 800)}
                alt="A healthy thali — care that fits real life"
                emoji="🍛"
              />
            </div>
            <div className="stack">
              {SPRINT_THEMES.map((t) => (
                <button
                  key={t.type}
                  className="sprint-option"
                  onClick={async () => {
                    setBusy(true)
                    await startSprint(t.type as SprintType)
                    setBusy(false)
                  }}
                >
                  <span className="sprint-icon">{t.emoji}</span>
                  <span className="stack" style={{ gap: 2 }}>
                    <span className="sprint-name">{t.name}</span>
                    <span className="sprint-desc">{t.tagline}</span>
                  </span>
                  <span style={{ marginLeft: 'auto', color: 'var(--text-faint)' }}>›</span>
                </button>
              ))}
            </div>
          </>
        )}
      </Screen>
    </PhoneShell>
  )
}
