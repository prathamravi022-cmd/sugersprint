import { useState } from 'react'

/**
 * Resilient photo — if the CDN image fails to load, we swap to a tasteful
 * gradient + emoji fallback so no broken-image icon ever appears.
 */
export function Photo({
  src,
  alt,
  emoji,
  lazy = true,
  className,
}: {
  src: string
  alt: string
  emoji: string
  lazy?: boolean
  className?: string
}) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`photo-fallback ${className ?? ''}`} role="img" aria-label={alt}>
        <span className="em">{emoji}</span>
        <span>{alt}</span>
      </div>
    )
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading={lazy ? 'lazy' : 'eager'}
      onError={() => setFailed(true)}
    />
  )
}

/** Circular avatar with the same fallback guarantee. */
export function Avatar({ src, alt, emoji }: { src: string; alt: string; emoji: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="photo-fallback" style={{ borderRadius: '50%', fontSize: '1.1rem' }}>
        <span className="em" style={{ fontSize: '1.1rem' }}>
          {emoji}
        </span>
      </div>
    )
  }
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
}

/** Stable Unsplash image helper (auto format, right-sized). */
export const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`
