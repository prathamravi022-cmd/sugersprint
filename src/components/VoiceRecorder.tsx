import { useEffect, useRef, useState } from 'react'

/**
 * <VoiceRecorder /> — per Frontend Spec §4:
 * Large circular button, Electric Yellow pulsing effect while recording,
 * visual waveform during speech. Long-press (600ms) initiates the optional
 * 10-second voice note; release transcribes it.
 */
export function VoiceRecorder({ onTranscribed }: { onTranscribed: (text: string) => void }) {
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const holdRef = useRef<number | null>(null)
  const tickRef = useRef<number | null>(null)
  const barRef = useRef<HTMLDivElement | null>(null)

  // Animate the waveform bars while recording
  useEffect(() => {
    const bar = barRef.current
    if (!bar) return
    if (recording) {
      bar.style.display = 'flex'
    } else {
      bar.style.display = 'none'
    }
  }, [recording])

  useEffect(() => {
    if (!recording) return
    tickRef.current = window.setInterval(() => {
      setSeconds((s) => {
        if (s >= 10) {
          stop()
          return s
        }
        return s + 1
      })
    }, 1000)
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current)
    }
  }, [recording])

  const start = () => {
    setRecording(true)
    setSeconds(0)
  }

  const stop = () => {
    if (!recording) return
    setRecording(false)
    setTranscribing(true)
    // Mock Whisper round-trip
    window.setTimeout(() => {
      setTranscribing(false)
      onTranscribed('Aaj daal-chawal ke baad li, thoda late ho gaya')
    }, 1400)
  }

  const pressStart = () => {
    holdRef.current = window.setTimeout(() => {
      start()
    }, 450)
  }

  const pressEnd = () => {
    if (holdRef.current) window.clearTimeout(holdRef.current)
    stop()
  }

  return (
    <div className="stack center" style={{ alignItems: 'center', gap: 14 }}>
      <div className="wave" ref={barRef} style={{ display: 'none' }}>
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
          ? `Recording… ${10 - seconds}s left (release to stop)`
          : transcribing
            ? 'Transcribing with Whisper…'
            : 'Hold to record a 10s voice note'}
      </span>
    </div>
  )
}
