import { useState, type ReactNode } from 'react'
import { Art, type ArtVariant } from './Art'

/**
 * <SectionBand /> — a full-width content band that always looks finished.
 *
 * The bundled `<Art>` renders underneath unconditionally; a remote photo is
 * layered on top and simply removes itself if it fails to load. That means
 * offline, blocked-CDN, or slow-network users still see real artwork instead of
 * an empty rectangle.
 */
export function SectionBand({
  variant,
  src,
  title,
  copy,
  emoji,
  cta,
  reverse = false,
  compact = false,
}: {
  variant: ArtVariant
  src?: string
  title: string
  copy: string
  emoji?: string
  cta?: ReactNode
  reverse?: boolean
  compact?: boolean
}) {
  const [photoFailed, setPhotoFailed] = useState(false)

  return (
    <section className={`band${reverse ? ' reverse' : ''}${compact ? ' compact' : ''}`}>
      <div className="band-media">
        <Art variant={variant} className="band-art" />
        {src && !photoFailed && (
          <img
            className="band-photo"
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setPhotoFailed(true)}
          />
        )}
        {emoji && (
          <span className="band-emoji" aria-hidden>
            {emoji}
          </span>
        )}
      </div>
      <div className="band-body">
        <h3 className="band-title">{title}</h3>
        <p className="band-copy">{copy}</p>
        {cta && <div className="band-cta">{cta}</div>}
      </div>
    </section>
  )
}

/**
 * <EmptyState /> — replaces the bare, wordless gaps that used to appear when a
 * list had nothing in it. Always gives the user a headline, a reason, and a way
 * forward.
 */
export function EmptyState({
  variant = 'spark',
  emoji,
  title,
  copy,
  action,
  compact = false,
}: {
  variant?: ArtVariant
  emoji?: string
  title: string
  copy: string
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={`empty-state${compact ? ' compact' : ''}`}>
      <div className="empty-art">
        <Art variant={variant} />
        {emoji && (
          <span className="empty-emoji" aria-hidden>
            {emoji}
          </span>
        )}
      </div>
      <h4 className="empty-title">{title}</h4>
      <p className="empty-copy">{copy}</p>
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}
