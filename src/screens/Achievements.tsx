import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { Screen, TopBar } from '../components/Toast'
import { BADGES, LEVEL_TITLES, levelForXp, levelTitle } from '../lib/badges'
import { Art, type ArtVariant } from '../components/Art'
import { SectionBand } from '../components/SectionBand'

/** Each badge gets bundled artwork so the gallery is never a wall of text. */
const BADGE_ART: Record<string, ArtVariant> = {
  'first-sprint': 'celebrate',
  'streak-3': 'trophy',
  'streak-7': 'trophy',
  'streak-14': 'trophy',
  'streak-21': 'trophy',
  'streak-30': 'trophy',
  'photo-shot': 'glucose',
  'voice-note': 'phone',
  walker: 'walk',
  'med-taken': 'med',
  'first-cheer': 'family',
  'cheer-sender': 'family',
  'caregiver-linked': 'family',
  'report-made': 'doctor',
  'early-bird': 'night',
  comeback: 'spark',
  'offline-hero': 'shield',
  'shield-used': 'shield',
  'mood-check': 'night',
  'ten-sprints': 'chart',
}

/** Achievements gallery — unlocked badges glow, locked ones tease. */
export function Achievements() {
  const nav = useNavigate()
  const user = useStore((s) => s.user)
  const badges = useStore((s) => s.badges)
  const xp = useStore((s) => s.xp)
  const level = levelForXp(xp)
  const intoLevel = xp % 100
  const unlockedSet = new Set(badges)

  const nextBadge = BADGES.filter((b) => !unlockedSet.has(b.id)).sort((a, b) => a.xp - b.xp)[0]
  const totalXpAvailable = BADGES.reduce((sum, b) => sum + b.xp, 0)
  const earnedXp = BADGES.filter((b) => unlockedSet.has(b.id)).reduce((s, b) => s + b.xp, 0)
  const pctComplete = Math.round((badges.length / BADGES.length) * 100)

  return (
    <div className="phone-shell">
      <Screen>
        <TopBar name={user?.name} onSettings={() => nav('/settings')} />

        <div className="row-between">
          <h1 className="h1">Achievements</h1>
          <span className="badge gold">
            {badges.length}/{BADGES.length}
          </span>
        </div>

        <SectionBand
          variant="trophy"
          title={`${pctComplete}% of the trophy case filled`}
          copy={
            nextBadge
              ? `Next up: ${nextBadge.icon} ${nextBadge.name} — ${nextBadge.desc} (+${nextBadge.xp} XP).`
              : 'Every badge unlocked. You are officially a Sprint Legend. 🏆'
          }
          emoji="🏆"
          cta={
            <span className="badge">
              {earnedXp} / {totalXpAvailable} badge XP
            </span>
          }
        />

        {/* XP / level header */}
        <div className="card stack" style={{ gap: 12 }}>
          <div className="row-between">
            <span className="stack" style={{ gap: 2 }}>
              <span className="section-title">Level {level}</span>
              <span className="numeric gold-text" style={{ fontSize: '1.4rem' }}>
                {levelTitle(xp)}
              </span>
            </span>
            <span className="numeric yellow-text">{xp} XP</span>
          </div>
          <div className="timer-ring">
            <div style={{ width: `${intoLevel}%` }} />
          </div>
          <span className="small muted">
            {100 - intoLevel} XP to level {Math.min(LEVEL_TITLES.length, level + 1)} ·{' '}
            {LEVEL_TITLES.length} levels total
          </span>
        </div>

        {/* Badge grid */}
        <div className="badge-grid">
          {BADGES.map((b) => {
            const got = unlockedSet.has(b.id)
            return (
              <div key={b.id} className={`badge-card${got ? ' got' : ''}`}>
                <span className="badge-art" aria-hidden>
                  <Art variant={BADGE_ART[b.id] ?? 'spark'} />
                </span>
                <span className="badge-body">
                  <span className="bi">{got ? b.icon : '🔒'}</span>
                  <span className="bn">{b.name}</span>
                  <span className="bd">{b.desc}</span>
                  <span className="bx">
                    {got ? '✓ Unlocked · ' : ''}+{b.xp} XP
                  </span>
                </span>
              </div>
            )
          })}
        </div>

        <button className="btn btn-ghost" onClick={() => nav('/app')}>
          ← Back to dashboard
        </button>
      </Screen>
    </div>
  )
}
