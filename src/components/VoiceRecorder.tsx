import { useEffect, useRef, useState } from 'react'

const SAMPLE = 'Aaj daal-chawal ke baad li, thoda late ho gaya'

/**
 * <VoiceRecorder /> — Frontend Spec §4:
 * Large circular pulsing button (long-press to record, 10s max),
 * animated waveform bars, plus a real-time transcript preview that
 * streams in while you speak (mock Whisper stream).
 */
export function VoiceRecorder({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [liveWords, setLiveWords] = useState<string[]>([])
  const holdRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const recordingRef = useRef(false)
  const wordsRef = useRef<string[]>([])

  useEffect(() => {
    if (!recording) return
    tickRef.current = window.setInterval(() => {
      setSeconds((s) => s + 1)
    }, 1000)

    // Stream the transcript word-by-word while "recording"
    const words = SAMPLE.split(' ')
    let i = 0
    const wordTimer = window.setInterval(() => {
      if (i >= words.length) {
        window.clearInterval(wordTimer)
        return
      }
      wordsRef.current.push(words[i])
      setLiveWords((w) => [...w, words[i]])
      i++
    }, 620)

    // Auto-stop at 10 seconds (spec limit)
    const stopTimer = window.setTimeout(() => stop(), 10_000)

    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
      window.clearInterval(wordTimer)
      window.clearTimeout(stopTimer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording])

  const start = () => {
    if (recordingRef.current) return
    recordingRef.current = true
    setSeconds(0)
    setLiveWords([])
    wordsRef.current = []
    setRecording(true)
  }

  const stop = () => {
    if (!recordingRef.current) return
    recordingRef.current = false
    setRecording(false)
    setTranscribing(true)
    window.setTimeout(() => {
      setTranscribing(false)
      const text = wordsRef.current.join(' ').trim()
      onTranscribed(text.length > 0 ? text : SAMPLE)
      window.setTimeout(() => setLiveWords([]), 1400)
    }, 1300)
  }

  const pressStart = () => {
    holdRef.current = window.setTimeout(start, 420)
  }

  const pressEnd = () => {
    if (holdRef.current) window.clearTimeout(holdRef.current)
    holdRef.current = null
    stop()
  }

  return (
    <div className="stack center" style={{ alignItems: 'center', gap: 14 }}>
      <div className="wave" aria-hidden style={{ visibility: recording ? 'visible' : 'hidden' }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>

      <button
        className={`mic-btn${recording ? ' recording' : ''}`}
        onMouseDown={pressStart}
        onMouseUp={pressEnd}
        onMouseLeave={pressEnd}
        onTouchStart={pressStart}
        onTouchEnd={pressEnd}
        aria-label="Hold to record voice note"
      >
        {recording ? '⏹' : '🎤'}
      </button>

      <span className="small muted">
        {recording
          ? `Recording… ${Math.max(0, 10 - seconds)}s left (release to stop)`
          : transcribing
            ? 'Transcribing with Whisper…'
            : 'Hold to record a 10s voice note'}
      </span>

      {(recording || transcribing || liveWords.length > 0) && (
        <div className="transcript-live" aria-live="polite">
          {liveWords.length === 0 && !transcribing ? (
            <span className="muted">Listening…</span>
          ) : (
            <>
              {liveWords.join(' ')}
              {recording && <span className="caret" />}
              {transcribing && ' …'}
            </>
          )}
        </div>
      )}
    </div>
  )
}
