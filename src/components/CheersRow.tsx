import type { Cheer } from '../types'

/**
 * Recent Cheers row — Frontend Spec §5A: small horizontally scrolling row
 * of recent emoji cheers from the Caregiver.
 */
export function CheersRow({ cheers }: { cheers: Cheer[] }) {
  const recent = [...cheers].reverse().slice(0, 12)
  return (
    <div className="stack" style={{ gap: 10 }}>
      <div className="row-between">
        <span className="section-title">Recent Cheers</span>
        {cheers.length > 0 && <span className="small muted">{cheers.length} total</span>}
      </div>
      {recent.length === 0 ? (
        <p className="sub">No cheers yet — your caregiver will see today's completion 👀</p>
      ) : (
        <div className="cheers-row">
          {recent.map((c) => (
            <div key={c.id} className="cheer-bubble">
              <span>{c.emoji_type}</span>
              <small>{c.caregiver_name}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
