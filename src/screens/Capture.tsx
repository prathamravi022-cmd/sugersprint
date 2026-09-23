import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { themeFor } from '../constants'
import { useStore } from '../store'
import { PhoneShell, Screen, TopBar } from '../components/Toast'
import { CameraOverlay } from '../components/CameraOverlay'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { runOcr } from '../api'
import type { SprintType } from '../types'

/**
 * Quick Capture (Frontend Spec §5B) — routes to the correct flow
 * for the active sprint: Glucose OCR, Walk Timer, or Med Check-In.
 * Photo and voice attachments are always OPTIONAL extras.
 */
export function Capture() {
  const nav = useNavigate()
  const sprint = useStore((s) => s.sprint)
  const user = useStore((s) => s.user)

  if (!sprint || !user) {
    return (
      <PhoneShell>
        <Screen>
          <TopBar />
          <div className="card stack">
            <p className="sub">No active sprint — start one first.</p>
            <button className="btn btn-yellow" onClick={() => nav('/')}>
              Go home
            </button>
          </div>
        </Screen>
      </PhoneShell>
    )
  }

  return (
    <PhoneShell>
      <Screen>
        <TopBar name={user.name} />
        {sprint.sprint_type === 'glucose' && <GlucoseFlow />}
        {sprint.sprint_type === 'walk' && <WalkFlow />}
        {sprint.sprint_type === 'med' && <MedFlow sprintType={sprint.sprint_type} />}
      </Screen>
    </PhoneShell>
  )
}

/* ===================================================================== */
/* Glucose — camera OCR with manual numpad fallback (PRD §4B)            */
/* ===================================================================== */
function GlucoseFlow() {
  const nav = useNavigate()
  const completeToday = useStore((s) => s.completeToday)
  const pushToast = useStore((s) => s.pushToast)
  const triggerConfetti = useStore((s) => s.triggerConfetti)
  const [stage, setStage] = useState<'camera' | 'confirm' | 'manual'>('camera')
  const [ocr, setOcr] = useState<{ value: number; confidence: number } | null>(null)
  const [manual, setManual] = useState('')

  const confirmed = async (value: number) => {
    await completeToday({ value })
    triggerConfetti()
    pushToast('🩸 Glucose logged — sprint complete!')
    nav('/')
  }

  if (stage === 'camera') {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <h2 className="h2">Snap your glucometer</h2>
        <CameraOverlay
          onCaptured={async () => {
            const res = await runOcr()
            if (res.value == null) {
              setStage('manual')
              return
            }
            setOcr({ value: res.value, confidence: res.confidence })
            setStage('confirm')
          }}
        />
        <button className="btn btn-ghost" onClick={() => setStage('manual')}>
          ⌨️ Type manually instead
        </button>
      </div>
    )
  }

  if (stage === 'confirm' && ocr) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <h2 className="h2">Confirm reading</h2>
        <div className="readout">
          <span className="value">{ocr.value}</span>
          <span className="unit">mg/dL</span>
        </div>
        <p className="small muted center">
          OCR confidence {Math.round(ocr.confidence * 100)}% · edit below if the number looks off
        </p>
        <input
          className="input"
          inputMode="decimal"
          value={String(ocr.value)}
          onChange={(e) => setOcr({ ...ocr, value: Number(e.target.value) || 0 })}
        />
        <button className="btn btn-yellow" onClick={() => void confirmed(ocr.value)}>
          Save & Complete Sprint
        </button>
        <button className="btn btn-ghost" onClick={() => setStage('manual')}>
          Wrong number? Type manually
        </button>
      </div>
    )
  }

  // Manual numpad fallback — treated as first-class, not an afterthought.
  return (
    <div className="stack" style={{ gap: 16 }}>
      <h2 className="h2">Enter fasting sugar</h2>
      <div className="readout">
        <span className="value">{manual || '–––'}</span>
        <span className="unit">mg/dL</span>
      </div>
      <Numpad
        onDigit={(d) => setManual((m) => (m + d).slice(0, 3))}
        onBackspace={() => setManual((m) => m.slice(0, -1))}
      />
      <button
        className="btn btn-yellow"
        disabled={manual.length === 0}
        onClick={() => void confirmed(Number(manual))}
      >
        Save & Complete Sprint
      </button>
      <button className="btn-link" onClick={() => setStage('camera')}>
        ← Try camera OCR again
      </button>
    </div>
  )
}

function Numpad({
  onDigit,
  onBackspace,
}: {
  onDigit: (d: string) => void
  onBackspace: () => void
}) {
  return (
    <div className="numpad">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} onClick={() => onDigit(d)}>
          {d}
        </button>
      ))}
      <button onClick={onBackspace}>⌫</button>
      <button onClick={() => onDigit('0')}>0</button>
      <button disabled style={{ opacity: 0.35 }}>
        ·
      </button>
    </div>
  )
}

/* ===================================================================== */
/* Walk — 10-minute countdown (PRD §4B)                                  */
/* ===================================================================== */
function WalkFlow() {
  const nav = useNavigate()
  const completeToday = useStore((s) => s.completeToday)
  const pushToast = useStore((s) => s.pushToast)
  const triggerConfetti = useStore((s) => s.triggerConfetti)
  const [running, setRunning] = useState(false)
  const [left, setLeft] = useState(10 * 60)
  const done = left === 0
  const finishedRef = useRef(false)

  useEffect(() => {
    if (!running) return
    const iv = window.setInterval(() => {
      setLeft((l) => Math.max(0, l - 1))
    }, 1000)
    return () => window.clearInterval(iv)
  }, [running])

  useEffect(() => {
    if (left === 0 && !finishedRef.current) {
      finishedRef.current = true
      setRunning(false)
    }
  }, [left])

  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')
  const elapsed = 600 - left

  const finish = async () => {
    await completeToday({ value: Math.max(1, Math.round(elapsed / 60)) })
    triggerConfetti()
    pushToast('🚶 Walk logged — sprint complete!')
    nav('/')
  }

  return (
    <div className="timer-screen">
      <h2 className="h2">Post-Dinner Walk</h2>
      <div className="timer-digits numeric">
        {mm}:{ss}
      </div>
      <div className="timer-ring">
        <div style={{ width: `${(elapsed / 600) * 100}%` }} />
      </div>
      <p className="small muted">
        {running ? 'Keep going — you are doing great!' : done ? 'Time!' : 'Ready when you are.'}
      </p>
      {!running && !done && (
        <button className="btn btn-yellow btn-mega" onClick={() => setRunning(true)}>
          ▶ Start Walk
        </button>
      )}
      {running && (
        <button className="btn btn-ghost" onClick={() => void finish()}>
          Finish early ({Math.max(1, Math.round(elapsed / 60))} min)
        </button>
      )}
      {done && (
        <button className="btn btn-yellow btn-mega pulsing" onClick={() => void finish()}>
          ✓ Done — 10 minutes
        </button>
      )}
      <button className="btn-link" onClick={() => nav('/')}>
        Cancel
      </button>
    </div>
  )
}

/* ===================================================================== */
/* Medication — one-tap confirm + optional photo/voice (PRD §4B)         */
/* ===================================================================== */
function MedFlow({ sprintType }: { sprintType: SprintType }) {
  const nav = useNavigate()
  const completeToday = useStore((s) => s.completeToday)
  const pushToast = useStore((s) => s.pushToast)
  const triggerConfetti = useStore((s) => s.triggerConfetti)
  const [photo, setPhoto] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [showExtras, setShowExtras] = useState(false)
  const theme = themeFor(sprintType)

  const complete = async () => {
    await completeToday({ media: photo ?? undefined, transcription: note ?? undefined })
    triggerConfetti()
    pushToast('💊 Medication marked — sprint complete!')
    nav('/')
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="center">
        <h2 className="h2">Med on Time</h2>
        <p className="sub">Taking it now? One tap finishes today's sprint.</p>
      </div>

      <button className="btn btn-gold btn-mega" style={{ padding: '38px 20px', fontSize: '1.35rem' }} onClick={() => void complete()}>
        💊 Mark as Taken
      </button>

      <div className="row" style={{ justifyContent: 'center', gap: 18 }}>
        <button
          className="icon-btn"
          style={{ width: 56, height: 56, borderRadius: 14, fontSize: '1.4rem' }}
          onClick={() => setShowExtras((v) => !v)}
          aria-label="Add optional photo or voice note"
        >
          📷
        </button>
        <button
          className="icon-btn"
          style={{ width: 56, height: 56, borderRadius: 14, fontSize: '1.4rem' }}
          onClick={() => setShowExtras((v) => !v)}
          aria-label="Add optional voice note"
        >
          🎙️
        </button>
      </div>
      <p className="small muted center">Optional — never required to complete your day.</p>

      {showExtras && (
        <div className="card stack" style={{ gap: 14 }}>
          <span className="section-title">Optional attachments</span>
          <button
            className="btn btn-ghost"
            onClick={() =>
              // Ephemeral storage (Security Spec §3): purged after AI processing.
              setPhoto(`mem://ephemeral-${Date.now()}`)
            }
          >
            {photo ? '✅ Photo attached (auto-deleted after AI)' : '📷 Snap medicine strip / meal'}
          </button>
          <VoiceRecorder onTranscribed={(text) => setNote(text)} />
          {note && <p className="small gold-text">🎙️ "{note}"</p>}
          <p className="small muted">{theme.unit === 'dose' ? 'Context helps your doctor report, but is never mandatory.' : ''}</p>
        </div>
      )}
    </div>
  )
}
