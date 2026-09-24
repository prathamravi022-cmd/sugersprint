import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * <VoiceRecorder /> — Frontend Spec §4.
 *
 * This used to fake an entire transcript with a hard-coded sentence on a timer.
 * It now records real audio through `MediaRecorder`, drives the waveform from a
 * live `AnalyserNode`, and uses the browser's `SpeechRecognition` engine for a
 * genuine transcript. When any of that isn't available or the mic is blocked, it
 * degrades to a typed note instead of inventing words the user never said.
 */

const MAX_MS = 10_000
const BAR_COUNT = 9

type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((event: SpeechEventLike) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

type SpeechEventLike = {
  resultIndex: number
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>
}

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition
  if (!Ctor) return null
  try {
    return new Ctor()
  } catch {
    return null
  }
}

export function VoiceRecorder({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'processing'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [levels, setLevels] = useState<number[]>(() => Array(BAR_COUNT).fill(0.1))
  const [transcript, setTranscript] = useState('')
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const rafRef = useRef<number | null>(null)
  const holdRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const autoStopRef = useRef<number | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalTextRef = useRef('')
  const liveTextRef = useRef('')
  const activeRef = useRef(false)

  const teardown = useCallback(() => {
    if (tickRef.current) window.clearInterval(tickRef.current)
    if (autoStopRef.current) window.clearTimeout(autoStopRef.current)
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    tickRef.current = null
    autoStopRef.current = null
    rafRef.current = null

    try {
      recognitionRef.current?.stop()
    } catch {
      /* already stopped */
    }
    recognitionRef.current = null

    try {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
    } catch {
      /* nothing to stop */
    }
    recorderRef.current = null

    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
      streamRef.current = null
    }

    const ctx = audioCtxRef.current
    if (ctx) {
      void ctx.close().catch(() => {})
      audioCtxRef.current = null
    }

    setLevels(Array(BAR_COUNT).fill(0.1))
  }, [])

  useEffect(() => teardown, [teardown])

  const finish = useCallback(() => {
    const text = (finalTextRef.current || liveTextRef.current).trim()
    teardown()
    activeRef.current = false
    setPhase('processing')

    window.setTimeout(() => {
      setPhase('idle')
      setSeconds(0)
      if (text) {
        setTranscript(text)
        setSaved(true)
        setError('')
        onTranscribed(text)
      } else {
        setSaved(false)
        setError(
          'No speech detected. Type your note below, or check that your mic is allowed.',
        )
      }
    }, 700)
  }, [onTranscribed, teardown])

  const start = useCallback(async () => {
    if (activeRef.current) return

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser has no microphone API — type your note instead.')
      return
    }

    setError('')
    setSaved(false)
    setTranscript('')
    finalTextRef.current = ''
    liveTextRef.current = ''

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      const name = err instanceof Error ? err.name : ''
      setError(
        name === 'NotAllowedError'
          ? 'Microphone permission is blocked — type your note instead.'
          : name === 'NotFoundError'
            ? 'No microphone detected — type your note instead.'
            : 'Could not start the microphone — type your note instead.',
      )
      return
    }

    streamRef.current = stream
    activeRef.current = true
    setPhase('recording')
    setSeconds(0)

    // Real recording, so the clip genuinely exists.
    try {
      const recorder = new MediaRecorder(stream)
      recorder.start()
      recorderRef.current = recorder
    } catch {
      // Some browsers expose getUserMedia without MediaRecorder — keep going and
      // rely on speech recognition alone.
      recorderRef.current = null
    }

    // Waveform straight from the mic signal.
    try {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (Ctor) {
        const ctx = new Ctor()
        audioCtxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)

        const draw = () => {
          analyser.getByteFrequencyData(data)
          const next: number[] = []
          const chunk = Math.floor(data.length / BAR_COUNT) || 1
          for (let i = 0; i < BAR_COUNT; i++) {
            let sum = 0
            for (let j = 0; j < chunk; j++) sum += data[i * chunk + j] ?? 0
            next.push(Math.min(1, Math.max(0.1, sum / chunk / 150)))
          }
          setLevels(next)
          rafRef.current = requestAnimationFrame(draw)
        }
        rafRef.current = requestAnimationFrame(draw)
      }
    } catch {
      /* visualiser is optional */
    }

    // Real transcript when the browser can do speech recognition.
    const recognition = getRecognition()
    if (recognition) {
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-IN'
      recognition.onresult = (event) => {
        let interim = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          const chunk = result[0]?.transcript ?? ''
          if (result.isFinal) finalTextRef.current += `${chunk} `
          else interim += chunk
        }
        liveTextRef.current = interim
        setTranscript(`${finalTextRef.current}${interim}`.trim())
      }
      recognition.onerror = () => {
        /* falls back to typed note on stop */
      }
      recognition.onend = () => {
        /* handled by finish() */
      }
      try {
        recognition.start()
        recognitionRef.current = recognition
      } catch {
        recognitionRef.current = null
      }
    }

    tickRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    autoStopRef.current = window.setTimeout(() => {
      if (activeRef.current) finish()
    }, MAX_MS)
  }, [finish])

  const stop = useCallback(() => {
    if (holdRef.current) window.clearTimeout(holdRef.current)
    holdRef.current = null
    if (activeRef.current) finish()
  }, [finish])

  const pressStart = () => {
    if (phase !== 'idle') return
    // Long-press to talk, matching the original interaction.
    holdRef.current = window.setTimeout(() => void start(), 420)
  }

  const pressEnd = () => {
    if (holdRef.current) window.clearTimeout(holdRef.current)
    holdRef.current = null
    stop()
  }

  const recording = phase === 'recording'

  return (
    <div className="stack center" style={{ alignItems: 'center', gap: 14 }}>
      <div className="wave" aria-hidden>
        {levels.map((level, i) => (
          <span
            key={i}
            style={{
              height: `${Math.round(6 + level * 34)}px`,
              opacity: recording ? 1 : 0.3,
              transition: recording ? 'height 90ms linear' : 'height 220ms ease',
            }}
          />
        ))}
      </div>

      <button
        type="button"
        className={`mic-btn${recording ? ' recording' : ''}`}
        onMouseDown={pressStart}
        onMouseUp={pressEnd}
        onMouseLeave={pressEnd}
        onTouchStart={pressStart}
        onTouchEnd={pressEnd}
        onClick={() => {
          if (phase === 'processing') return
          if (!recording) void start()
          else finish()
        }}
        aria-label={recording ? 'Stop recording' : 'Record a voice note'}
      >
        {recording ? '⏹' : '🎤'}
      </button>

      <span className="small muted" aria-live="polite">
        {recording
          ? `Recording… ${Math.max(0, 10 - seconds)}s left (tap or release to stop)`
          : phase === 'processing'
            ? 'Saving your note…'
            : 'Tap or hold to record a 10s voice note'}
      </span>

      {(recording || transcript) && (
        <div className="transcript-live" aria-live="polite">
          {transcript ? (
            <>
              {transcript}
              {recording && <span className="caret" />}
            </>
          ) : (
            <span className="muted">Listening…</span>
          )}
        </div>
      )}

      {error && (
        <p className="small" style={{ color: 'var(--yellow)', textAlign: 'center', margin: 0 }}>
          {error}
        </p>
      )}

      {saved && (
        <span className="small" style={{ color: 'var(--success)' }}>
          ✓ Voice note saved
        </span>
      )}

      {/* Always-available typed fallback — never blocked by permissions. */}
      <details className="voice-fallback" style={{ width: '100%' }}>
        <summary className="small muted">Prefer to type? Add a written note</summary>
        <div className="row" style={{ gap: 8, marginTop: 8 }}>
          <input
            className="input"
            value={typed}
            maxLength={120}
            placeholder="e.g. took it after breakfast"
            onChange={(e) => setTyped(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-ghost"
            disabled={typed.trim().length === 0}
            onClick={() => {
              const text = typed.trim()
              if (!text) return
              setTranscript(text)
              setSaved(true)
              setError('')
              onTranscribed(text)
            }}
          >
            Save
          </button>
        </div>
      </details>
    </div>
  )
}
