import type { ReactNode } from 'react'
import type { CameraApi } from '../lib/camera'

/**
 * <CameraView /> — the shared viewfinder chrome.
 *
 * Renders a real `<video>` fed by the `useCamera()` stream, the golden bracket
 * frame + scanline from the original design, and — crucially — a plain-language
 * status banner whenever the camera can't run, so the user is never left
 * staring at a button that does nothing.
 */
export function CameraView({
  camera,
  hint,
  processing,
  processingLabel = 'Reading your glucometer…',
  emptyLabel = 'Camera preview',
  children,
}: {
  camera: CameraApi
  hint: string
  processing?: boolean
  processingLabel?: string
  emptyLabel?: string
  children?: ReactNode
}) {
  const {
    videoRef,
    live,
    status,
    message,
    facing,
    torchOn,
    torchAvailable,
    flip,
    toggleTorch,
    start,
  } = camera

  const busy = status === 'starting'
  const showBanner = status !== 'live' && status !== 'idle'

  return (
    <div className={`camera-view${live ? ' is-live' : ''}`}>
      <video
        ref={videoRef}
        className="camera-video"
        autoPlay
        playsInline
        muted
        aria-label="Live camera preview"
      />

      {!live && (
        <div className="camera-lens" aria-hidden>
          <span className="lens-ring" />
          <span className="lens-em">{busy ? '🔍' : '📷'}</span>
        </div>
      )}

      <div className="lcd-hint">{live ? hint : emptyLabel}</div>

      <div className="camera-frame">
        <div className="gold-frame" />
      </div>

      {live && <div className="scanline" />}

      {(busy || live) && (
        <div className="hold-steady">{busy ? 'Starting…' : 'Hold Steady'}</div>
      )}

      {live && (
        <div className="camera-tools">
          <button type="button" className="cam-tool" onClick={flip} aria-label="Switch camera">
            🔄 <span>{facing === 'environment' ? 'Front' : 'Back'}</span>
          </button>
          {torchAvailable && (
            <button
              type="button"
              className={`cam-tool${torchOn ? ' on' : ''}`}
              onClick={toggleTorch}
              aria-label="Toggle light"
            >
              {torchOn ? '🔆' : '🔅'} <span>Light</span>
            </button>
          )}
        </div>
      )}

      {showBanner && (
        <div className={`camera-status${busy ? ' working' : ''}`} role="status">
          <span>{message || 'Camera is off.'}</span>
          {!busy && (
            <button type="button" className="btn-link" onClick={() => void start()}>
              Retry camera
            </button>
          )}
        </div>
      )}

      {processing && (
        <div className="ocr-processing">
          <span className="spin" style={{ fontSize: '1.4rem' }}>
            ◌
          </span>
          {processingLabel}
        </div>
      )}

      {/* The shutter only exists while the camera is actually live — a dead
          button is worse than no button. */}
      {live && children}
    </div>
  )
}

/** Round shutter button used by the capture flows. */
export function Shutter({
  onClick,
  disabled,
  label = 'Capture photo',
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      className="ocr-shutter"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    />
  )
}
