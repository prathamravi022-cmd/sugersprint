import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { themeFor } from '../constants'
import { useStore } from '../store'
import { Screen, TopBar } from '../components/Toast'
import { VoiceRecorder } from '../components/VoiceRecorder'
import { CameraView, Shutter } from '../components/CameraView'
import { useCamera } from '../lib/camera'
import { useWakeLock } from '../lib/wakelock'
import { runOcr } from '../api'
import type { SprintType } from '../types'
import {
  estimateKcal,
  estimateKm,
  glucoseBand,
  glucoseUnitLabel,
  haptic,
} from '../lib/format'

/**
 * Quick Capture (Frontend Spec §5B) — routes to the correct flow
 * for the active sprint: Glucose OCR, Walk Timer, or Med Check-In.
 * Photo and voice attachments stay OPTIONAL extras.
 */
export function Capture() {
  const nav = useNavigate()
  const sprint = useStore((s) => s.sprint)
  const user = useStore((s) => s.user)

  if (!sprint || !user) {
    return (
      <div className="phone-shell">
        <Screen>
          <TopBar />
          <div className="card stack">
            <p className="sub">No active sprint — start one first.</p>
            <button className="btn btn-yellow" onClick={() => nav('/app')}>
              Go home
            </button>
          </div>
        </Screen>
      </div>
    )
  }

  return (
    <div className="phone-shell">
      <Screen>
        <TopBar name={user.name} onSettings={() => nav('/settings')} />
        {sprint.sprint_type === 'glucose' && <GlucoseFlow />}
        {sprint.sprint_type === 'walk' && <WalkFlow />}
        {sprint.sprint_type === 'med' && <MedFlow sprintType={sprint.sprint_type} />}
      </Screen>
    </div>
  )
}

/* ===================================================================== */
/* Glucose — camera OCR with tags, range coding, numpad fallback         */
/* ===================================================================== */
function GlucoseFlow() {
  const nav = useNavigate()
  const completeToday = useStore((s) => s.completeToday)
  const pushToast = useStore((s) => s.pushToast)
  const triggerConfetti = useStore((s) => s.triggerConfetti)
  const unit = useStore((s) => s.settings.unit)
  const logs = useStore((s) => s.logs)
  const [stage, setStage] = useState<'camera' | 'confirm' | 'manual'>('camera')
  const [ocr, setOcr] = useState<{ value: number; confidence: number } | null>(null)
  const [manual, setManual] = useState('')
  const [processing, setProcessing] = useState(false)
  const [shot, setShot] = useState<string | null>(null)
  const [tag, setTag] = useState<'fasting' | 'postmeal'>('fasting')
  const fileRef = useRef<HTMLInputElement | null>(null)
  // Live device camera — only running while the viewfinder is visible.
  const camera = useCamera({ active: stage === 'camera' && shot === null })

  const prevReadings = useMemo(
    () =>
      logs
        .filter((l) => l.value != null)
        .map((l) => Number(l.value))
        .slice(-5),
    [logs],
  )

  const runAi = async (preview: string | null) => {
    setProcessing(true)
    setShot(preview)
    const res = await runOcr()
    setProcessing(false)
    if (res.value == null) {
      setStage('manual')
      return
    }
    setOcr({ value: res.value, confidence: res.confidence })
    setStage('confirm')
  }

  const confirmed = async (valueMgdl: number) => {
    await completeToday({ value: valueMgdl, tag, media: shot ?? undefined })
    triggerConfetti()
    haptic([40, 35, 70])
    pushToast('🩸 Glucose logged — sprint complete!')
    nav('/app')
  }

  const onUpload = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => void runAi(String(reader.result))
    reader.readAsDataURL(file)
  }

  /** Real shutter: grab the device frame, then release the camera. */
  const shoot = () => {
    if (processing) return
    const frame = camera.capture()
    camera.stop()
    void runAi(frame)
  }

  const band = ocr ? glucoseBand(ocr.value) : null
  const bandColor =
    band?.key === 'in'
      ? 'var(--success)'
      : band?.key === 'high'
        ? 'var(--danger)'
        : 'var(--yellow)'

  if (stage === 'camera') {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <h2 className="h2">Snap your glucometer</h2>
        {shot ? (
          <div className="camera-view is-live">
            <img className="preview" src={shot} alt="Captured glucometer" />
            {processing && (
              <div className="ocr-processing">
                <span className="spin" style={{ fontSize: '1.4rem' }}>
                  ◌
                </span>
                AI is reading your glucometer…
              </div>
            )}
          </div>
        ) : (
          <CameraView
            camera={camera}
            hint="Position the LCD inside the golden frame"
            processing={processing}
            processingLabel="AI is reading your glucometer…"
            emptyLabel={
              camera.status === 'unavailable' || camera.status === 'insecure'
                ? 'Camera not available — upload a photo below'
                : 'Point at your glucometer LCD'
            }
          >
            <Shutter onClick={shoot} disabled={processing || !camera.live} />
          </CameraView>
        )}
        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
            📷 Upload photo
          </button>
          <button className="btn btn-ghost" onClick={() => setStage('manual')}>
            ⌨️ Type manually
          </button>
        </div>
        {!camera.live && camera.status !== 'starting' && camera.status !== 'idle' && (
          <p className="small muted center">
            Camera unavailable? Upload a photo or type the reading — same result, no penalty.
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => onUpload(e.target.files?.[0])}
        />
        {prevReadings.length > 0 && <RecentReadings values={prevReadings} unit={unit} />}
      </div>
    )
  }

  if (stage === 'confirm' && ocr) {
    return (
      <div className="stack" style={{ gap: 16 }}>
        <h2 className="h2">Confirm reading</h2>
        {shot && (
          <div className="camera-view" style={{ aspectRatio: '16 / 7' }}>
            <img className="preview" src={shot} alt="Uploaded glucometer" />
          </div>
        )}

        <div className="chip-row">
          <button
            className={`chip${tag === 'fasting' ? ' on' : ''}`}
            onClick={() => setTag('fasting')}
          >
            🌅 Fasting
          </button>
          <button
            className={`chip${tag === 'postmeal' ? ' on' : ''}`}
            onClick={() => setTag('postmeal')}
          >
            🍽️ Post-meal
          </button>
        </div>

        <div
          className="readout"
          style={{ borderColor: bandColor, boxShadow: `0 0 24px ${bandColor}33` }}
        >
          <span className="value">{ocr.value}</span>
          <span className="unit">
            {unit === 'mgdl' ? 'mg/dL' : glucoseUnitLabel(unit)}
          </span>
        </div>
        {band && (
          <p className="small center" style={{ color: bandColor, fontWeight: 600 }}>
            {band.msg}
            {unit === 'mmoll' && ` · ${glucoseDisplay(ocr.value, unit)}`}
          </p>
        )}
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
      <div className="chip-row">
        <button
          className={`chip${tag === 'fasting' ? ' on' : ''}`}
          onClick={() => setTag('fasting')}
        >
          🌅 Fasting
        </button>
        <button
          className={`chip${tag === 'postmeal' ? ' on' : ''}`}
          onClick={() => setTag('postmeal')}
        >
          🍽️ Post-meal
        </button>
      </div>
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
      <button
        className="btn-link"
        onClick={() => {
          setShot(null)
          setStage('camera')
        }}
      >
        ← Try camera OCR again
      </button>
    </div>
  )
}

function glucoseDisplay(mgdl: number, unit: 'mgdl' | 'mmoll'): string {
  if (unit === 'mgdl') return `${mgdl} mg/dL`
  return `${(mgdl / 18.0182).toFixed(1)} mmol/L`
}

function RecentReadings({ values, unit }: { values: number[]; unit: 'mgdl' | 'mmoll' }) {
  const max = Math.max(1, ...values)
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <span className="section-title">Recent readings</span>
      <div className="spark" aria-hidden style={{ height: 40 }}>
        {values.map((v, i) => (
          <span key={i} style={{ height: `${(v / max) * 100}%` }} />
        ))}
      </div>
      <span className="small muted">
        {values.map((v) => glucoseDisplay(v, unit)).join(' · ')}
      </span>
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
/* Walk — presets, pause/resume, persistence, estimates                  */
/* ===================================================================== */
const WALK_PRESETS = [5, 10, 15, 20]

function WalkFlow() {
  const nav = useNavigate()
  const completeToday = useStore((s) => s.completeToday)
  const pushToast = useStore((s) => s.pushToast)
  const triggerConfetti = useStore((s) => s.triggerConfetti)
  const walkSession = useStore((s) => s.walkSession)
  const setWalkSession = useStore((s) => s.setWalkSession)

  const [preset, setPreset] = useState(walkSession?.preset ?? 10)
  const [left, setLeft] = useState(() => {
    if (walkSession?.pausedLeft != null) return walkSession.pausedLeft
    if (walkSession) return Math.max(0, Math.round((walkSession.endsAt - Date.now()) / 1000))
    return 10 * 60
  })
  const [running, setRunning] = useState(() => walkSession != null && walkSession.pausedLeft == null)
  const finishedRef = useRef(false)
  // Keep the phone awake so a pocketed timer does not get slept mid-walk.
  const wake = useWakeLock(running)

  const total = preset * 60
  const done = left === 0
  const elapsed = total - left
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  // Tick + persist the session so a refresh doesn't lose the countdown
  useEffect(() => {
    if (!running) return
    const iv = window.setInterval(() => {
      setLeft((l) => {
        const next = Math.max(0, l - 1)
        setWalkSession({ preset, endsAt: Date.now() + next * 1000, pausedLeft: null })
        if (next === 0 && !finishedRef.current) {
          finishedRef.current = true
          setRunning(false)
          haptic([60, 40, 60])
          pushToast('⏱️ Time! Tap Done to lock it in')
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(iv)
  }, [running, preset, setWalkSession, pushToast])

  const choosePreset = (min: number) => {
    setPreset(min)
    setLeft(min * 60)
    setRunning(false)
    finishedRef.current = false
    setWalkSession(null)
  }

  const pause = () => {
    setRunning(false)
    setWalkSession({ preset, endsAt: Date.now() + left * 1000, pausedLeft: left })
    pushToast('⏸️ Timer paused')
  }

  const resume = () => {
    setRunning(true)
    setWalkSession({ preset, endsAt: Date.now() + left * 1000, pausedLeft: null })
  }

  const finish = async () => {
    const minutes = Math.max(1, Math.round(elapsed / 60))
    await completeToday({ value: minutes })
    setWalkSession(null)
    triggerConfetti()
    haptic([40, 35, 70])
    pushToast(`🚶 ${minutes} min logged — sprint complete!`)
    nav('/app')
  }

  return (
    <div className="timer-screen">
      <h2 className="h2">Post-Dinner Walk</h2>

      {/* Presets */}
      <div className="chip-row" style={{ justifyContent: 'center' }}>
        {WALK_PRESETS.map((m) => (
          <button
            key={m}
            className={`chip${preset === m ? ' on' : ''}`}
            onClick={() => choosePreset(m)}
            disabled={running}
          >
            {m} min
          </button>
        ))}
      </div>

      <div className="timer-digits numeric">
        {mm}:{ss}
      </div>
      <div className="timer-ring">
        <div style={{ width: `${(elapsed / total) * 100}%` }} />
      </div>

      {/* Live estimates */}
      <div className="row" style={{ justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span className="badge">📏 {estimateKm(Math.round(elapsed / 60))} km (est.)</span>
        <span className="badge">🔥 {estimateKcal(Math.round(elapsed / 60))} kcal (est.)</span>
        {wake.held && <span className="badge gold">🔆 Screen staying awake</span>}
      </div>

      <p className="small muted">
        {running
          ? 'Keep going — you are doing great!'
          : done
            ? 'Time!'
            : left < total
              ? 'Paused — resume whenever you are ready.'
              : 'Ready when you are.'}
      </p>

      {!running && !done && left === total && (
        <button className="btn btn-yellow btn-mega" onClick={resume}>
          ▶ Start Walk
        </button>
      )}
      {running && (
        <button className="btn btn-ghost" onClick={pause}>
          ⏸ Pause
        </button>
      )}
      {!running && left < total && left > 0 && (
        <button className="btn btn-yellow btn-mega" onClick={resume}>
          ▶ Resume ({mm}:{ss} left)
        </button>
      )}
      {running && elapsed > 60 && (
        <button className="btn-link" onClick={() => void finish()}>
          Finish early ({Math.max(1, Math.round(elapsed / 60))} min)
        </button>
      )}
      {done && (
        <button className="btn btn-yellow btn-mega pulsing" onClick={() => void finish()}>
          ✓ Done — {preset} minutes
        </button>
      )}

      {/* Post-walk summary teaser */}
      {done && (
        <div className="card stack center" style={{ gap: 6 }}>
          <span className="section-title">Session summary</span>
          <span className="numeric gold-text" style={{ fontSize: '1.5rem' }}>
            {preset} min · {estimateKm(preset)} km · {estimateKcal(preset)} kcal
          </span>
        </div>
      )}

      <button className="btn-link" onClick={() => nav('/app')}>
        Cancel
      </button>
    </div>
  )
}

/* ===================================================================== */
/* Medication — one-tap + photo upload + voice + dose note               */
/* ===================================================================== */
function MedFlow({ sprintType }: { sprintType: SprintType }) {
  const nav = useNavigate()
  const completeToday = useStore((s) => s.completeToday)
  const pushToast = useStore((s) => s.pushToast)
  const triggerConfetti = useStore((s) => s.triggerConfetti)
  const profile = useStore((s) => s.profile)
  const logs = useStore((s) => s.logs)
  const [photo, setPhoto] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [doseNote, setDoseNote] = useState('')
  const [showExtras, setShowExtras] = useState(false)
  const [showCam, setShowCam] = useState(false)
  const [playing, setPlaying] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const camera = useCamera({ active: showCam })
  const theme = themeFor(sprintType)

  const snapMed = () => {
    const frame = camera.capture()
    camera.stop()
    setShowCam(false)
    if (!frame) {
      pushToast('📷 No camera frame — upload a photo instead')
      return
    }
    setPhoto(frame)
    pushToast('📷 Photo attached (auto-deleted after AI)')
  }

  const alreadyLogged = logs.some(
    (l) => l.log_date === new Date().toISOString().slice(0, 10),
  )

  const onPhoto = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = String(reader.result)
      if (data.length > 400_000) {
        pushToast('⚠️ Photo too large for local demo — try a smaller one')
        return
      }
      setPhoto(data)
      pushToast('📷 Photo attached (auto-deleted after AI)')
    }
    reader.readAsDataURL(file)
  }

  const complete = async () => {
    await completeToday({
      media: photo ?? undefined,
      transcription: note ?? undefined,
      note: doseNote.trim() || undefined,
    })
    triggerConfetti()
    haptic([40, 35, 70])
    pushToast('💊 Medication marked — sprint complete!')
    nav('/app')
  }

  const mockPlay = () => {
    if (playing) return
    setPlaying(true)
    window.setTimeout(() => setPlaying(false), 2400)
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="center">
        <h2 className="h2">Med on Time</h2>
        <p className="sub">Taking it now? One tap finishes today’s sprint.</p>
        <p className="small muted" style={{ marginTop: 6 }}>
          ⏰ Daily reminder set for {profile.reminderTime}
          {alreadyLogged && ' · already logged today'}
        </p>
      </div>

      <button
        className="btn btn-gold btn-mega"
        style={{ padding: '38px 20px', fontSize: '1.35rem' }}
        onClick={() => void complete()}
        disabled={alreadyLogged}
      >
        {alreadyLogged ? '✅ Already taken today' : '💊 Mark as Taken'}
      </button>

      <div className="row" style={{ justifyContent: 'center', gap: 18 }}>
        <button
          className="icon-btn"
          style={{ width: 56, height: 56, borderRadius: 14, fontSize: '1.4rem' }}
          onClick={() => setShowCam((v) => !v)}
          aria-label="Add optional photo with camera"
        >
          {showCam ? '✖️' : photo ? '✅' : '📷'}
        </button>
        <button
          className="icon-btn"
          style={{ width: 56, height: 56, borderRadius: 14, fontSize: '1.4rem' }}
          onClick={() => setShowExtras((v) => !v)}
          aria-label="Add optional voice note"
        >
          🎙️
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => onPhoto(e.target.files?.[0])}
        />
      </div>
      <p className="small muted center">Optional — never required to complete your day.</p>

      {showCam && (
        <div className="stack" style={{ gap: 10 }}>
          <CameraView
            camera={camera}
            hint="Frame the medicine strip or your meal"
            emptyLabel="Camera preview"
          >
            <Shutter onClick={snapMed} label="Capture medicine photo" />
          </CameraView>
          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              🖼️ Upload instead
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                camera.stop()
                setShowCam(false)
              }}
            >
              Close camera
            </button>
          </div>
        </div>
      )}

      {(showExtras || photo || note) && (
        <div className="card stack" style={{ gap: 14 }}>
          <span className="section-title">Optional attachments</span>

          {photo && (
            <div className="row" style={{ gap: 12 }}>
              <img
                src={photo}
                alt="Medication attachment"
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                }}
              />
              <span className="stack" style={{ gap: 4 }}>
                <span className="small">Photo attached ✓</span>
                <span className="small muted">Purged from storage after AI processing</span>
                <button className="btn-link" style={{ padding: 0 }} onClick={() => setPhoto(null)}>
                  Remove
                </button>
              </span>
            </div>
          )}

          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-ghost" onClick={() => setShowCam(true)}>
              {photo ? '🔄 Retake with camera' : '📷 Open camera'}
            </button>
            <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>
              🖼️ Upload from device
            </button>
          </div>

          <VoiceRecorder onTranscribed={(text) => setNote(text)} />

          {note && (
            <div className="transcript-live">
              <div className="row-between">
                <span className="section-title" style={{ color: 'var(--gold)' }}>
                  🎙️ Saved note
                </span>
                <button className="chip" onClick={mockPlay} style={{ padding: '4px 12px' }}>
                  {playing ? '⏸ playing…' : '▶ play'}
                </button>
              </div>
              <span style={{ display: 'block', marginTop: 6 }}>“{note}”</span>
            </div>
          )}

          <div className="field">
            <label htmlFor="dose">Dose note (optional)</label>
            <input
              id="dose"
              className="input"
              placeholder={`e.g. ${theme.unit === 'dose' ? '1 tablet, after breakfast' : 'with water'}`}
              value={doseNote}
              onChange={(e) => setDoseNote(e.target.value)}
              maxLength={80}
            />
          </div>
          <p className="small muted">
            Context helps your doctor report, but is never mandatory.
          </p>
        </div>
      )}
    </div>
  )
}
