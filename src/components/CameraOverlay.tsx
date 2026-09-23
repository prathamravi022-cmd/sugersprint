import { useEffect, useState } from 'react'

/**
 * <CameraOverlay /> — per Frontend Spec §4:
 * Transparent center with dark opaque edges, golden corner brackets guiding
 * the user, "HOLD STEADY" in Electric Yellow. Simulates the device camera
 * API used for glucometer OCR and optional medication/meal photos.
 */
export function CameraOverlay({ onCaptured }: { onCaptured: () => void }) {
  const [scanning, setScanning] = useState(true)

  useEffect(() => {
    const t = window.setTimeout(() => {
      setScanning(false)
      onCaptured()
    }, 2000)
    return () => window.clearTimeout(t)
  }, [onCaptured])

  return (
    <div className="camera-view" role="img" aria-label="Camera viewfinder">
      <div className="lcd-hint">Position glucometer LCD inside the frame</div>
      <div className="camera-frame">
        <div className="gold-frame" />
      </div>
      {scanning && <div className="scanline" />}
      <div className="hold-steady">{scanning ? 'Hold Steady' : 'Captured ✓'}</div>
    </div>
  )
}
