import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Real device camera.
 *
 * The earlier build only *pretended* to use a camera — the shutter just ran a
 * mock OCR. This hook talks to `navigator.mediaDevices.getUserMedia` for real,
 * and reports a precise, human-readable status for every failure mode so the
 * capture screens can always offer a working alternative.
 */

export type CameraStatus =
  | 'idle'
  | 'starting'
  | 'live'
  | 'denied'
  | 'unavailable'
  | 'insecure'
  | 'busy'
  | 'error'

export interface CameraSupport {
  ok: boolean
  status: CameraStatus
  message: string
}

/** Preflight: can this browser even attempt to open a camera? */
export function cameraSupport(): CameraSupport {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      ok: false,
      status: 'unavailable',
      message: 'This browser has no camera API — upload a photo or type the number instead.',
    }
  }
  if (typeof window !== 'undefined' && window.isSecureContext === false) {
    return {
      ok: false,
      status: 'insecure',
      message: 'Cameras need HTTPS or localhost — upload a photo or type the number instead.',
    }
  }
  return { ok: true, status: 'idle', message: '' }
}

/**
 * Ask the browser whether a camera exists at all.
 * Returns null when the answer can't be determined (some browsers hide devices
 * until permission is granted), so we only short-circuit on a definite "no".
 */
async function hasAnyCamera(): Promise<boolean | null> {
  try {
    if (!navigator.mediaDevices?.enumerateDevices) return null
    const devices = await navigator.mediaDevices.enumerateDevices()
    if (devices.length === 0) return null
    return devices.some((d) => d.kind === 'videoinput')
  } catch {
    return null
  }
}

/** getUserMedia can hang forever behind an unanswered permission prompt. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      const err = new Error('Camera did not start in time')
      err.name = 'TimeoutError'
      reject(err)
    }, ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        window.clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/** Translate a DOMException from getUserMedia into plain language. */
function describe(err: unknown): { status: CameraStatus; message: string } {
  const name = err instanceof Error ? err.name : ''
  switch (name) {
    case 'TimeoutError':
      return {
        status: 'unavailable',
        message:
          'The camera did not respond — it may be waiting on a permission prompt. Upload a photo or type the number instead.',
      }
    case 'NotAllowedError':
    case 'SecurityError':
      return {
        status: 'denied',
        message: 'Camera permission is blocked. Allow it in your browser settings, or upload a photo.',
      }
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return {
        status: 'unavailable',
        message: 'No camera detected on this device — upload a photo or type the number instead.',
      }
    case 'NotReadableError':
    case 'TrackStartError':
      return {
        status: 'busy',
        message: 'Your camera is busy in another app. Close it and retry, or upload a photo.',
      }
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return { status: 'error', message: 'Trying a simpler camera mode…' }
    default:
      return {
        status: 'error',
        message: 'Could not start the camera — upload a photo or type the number instead.',
      }
  }
}

export type Facing = 'environment' | 'user'

export interface CameraApi {
  videoRef: React.MutableRefObject<HTMLVideoElement | null>
  status: CameraStatus
  message: string
  live: boolean
  facing: Facing
  torchOn: boolean
  torchAvailable: boolean
  start: (facing?: Facing) => Promise<void>
  stop: () => void
  flip: () => void
  toggleTorch: () => void
  /** Grab the current frame as a JPEG data URL, or null if not live. */
  capture: () => string | null
}

export function useCamera(opts: { active?: boolean; facing?: Facing } = {}): CameraApi {
  const { active = true } = opts
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  /** Bumped on every start/stop so a late-resolving stream can be discarded. */
  const genRef = useRef(0)
  const facingRef = useRef<Facing>(opts.facing ?? 'environment')

  const [status, setStatus] = useState<CameraStatus>('idle')
  const [message, setMessage] = useState('')
  const [facing, setFacing] = useState<Facing>(facingRef.current)
  const [torchOn, setTorchOn] = useState(false)
  const [torchAvailable, setTorchAvailable] = useState(false)

  const detach = useCallback(() => {
    genRef.current++
    const stream = streamRef.current
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const attach = useCallback(async () => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return
    if (video.srcObject !== stream) video.srcObject = stream
    try {
      await video.play()
    } catch {
      // Autoplay can resolve a tick later once metadata arrives; the
      // `status === 'live'` effect re-attaches, so this is safe to swallow.
    }
  }, [])

  const stop = useCallback(() => {
    detach()
    setTorchOn(false)
    setTorchAvailable(false)
    setStatus('idle')
    setMessage('')
  }, [detach])

  const start = useCallback(
    async (want?: Facing) => {
      const target = want ?? facingRef.current
      facingRef.current = target
      setFacing(target)

      const support = cameraSupport()
      if (!support.ok) {
        setStatus(support.status)
        setMessage(support.message)
        return
      }

      detach()
      const gen = genRef.current
      setStatus('starting')
      setMessage('Waiting for camera permission…')

      // Don't sit on "Requesting camera…" forever on a device that has none.
      if ((await hasAnyCamera()) === false) {
        if (gen === genRef.current) {
          setStatus('unavailable')
          setMessage(
            'No camera detected on this device — upload a photo or type the number instead.',
          )
        }
        return
      }

      // Climb down the constraint ladder so stubborn devices still open.
      const attempts: MediaStreamConstraints[] = [
        {
          video: { facingMode: { ideal: target }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        },
        { video: { facingMode: target }, audio: false },
        { video: true, audio: false },
      ]

      let lastError: unknown = null

      for (const constraints of attempts) {
        try {
          const stream = await withTimeout(
            navigator.mediaDevices.getUserMedia(constraints),
            10_000,
          )

          // A newer start()/stop() superseded us while we were waiting.
          if (gen !== genRef.current) {
            for (const track of stream.getTracks()) track.stop()
            return
          }

          streamRef.current = stream
          await attach()

          const track = stream.getVideoTracks()[0]
          let caps: Record<string, unknown> = {}
          try {
            caps = (track?.getCapabilities?.() ?? {}) as Record<string, unknown>
          } catch {
            caps = {}
          }
          setTorchAvailable(Boolean(caps.torch))
          setTorchOn(false)
          setStatus('live')
          setMessage('')
          return
        } catch (err) {
          lastError = err
          const d = describe(err)
          // Hard failures won't be fixed by loosening constraints.
          if (d.status === 'denied' || d.status === 'unavailable' || d.status === 'busy') {
            setStatus(d.status)
            setMessage(d.message)
            return
          }
        }
      }

      const final = describe(lastError)
      setStatus('error')
      setMessage(final.message)
    },
    [attach, detach],
  )

  const flip = useCallback(() => {
    void start(facingRef.current === 'environment' ? 'user' : 'environment')
  }, [start])

  const toggleTorch = useCallback(() => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const next = !torchOn
    track
      .applyConstraints({
        advanced: [{ torch: next } as unknown as MediaTrackConstraintSet],
      })
      .then(() => setTorchOn(next))
      .catch(() => {
        setTorchAvailable(false)
        setTorchOn(false)
      })
  }, [torchOn])

  const capture = useCallback((): string | null => {
    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    if (facingRef.current === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    try {
      return canvas.toDataURL('image/jpeg', 0.85)
    } catch {
      return null
    }
  }, [])

  // The <video> element mounts after the hook starts, so re-attach when live.
  useEffect(() => {
    if (status === 'live') void attach()
  }, [status, attach])

  // Start on mount (and when `active` flips), always tearing the stream down.
  useEffect(() => {
    if (!active) {
      stop()
      return
    }
    void start()
    return () => stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  return {
    videoRef,
    status,
    message,
    live: status === 'live',
    facing,
    torchOn,
    torchAvailable,
    start,
    stop,
    flip,
    toggleTorch,
    capture,
  }
}
