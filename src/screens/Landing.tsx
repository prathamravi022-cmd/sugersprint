import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Avatar, Photo, unsplash } from '../components/Photo'
import { SiteFooter } from '../components/SiteFooter'

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    q: 'Do I need a wearable or a smart glucometer?',
    a: 'No. SugarSprint uses your phone camera with OCR to read a normal glucometer screen — and a manual numpad is always one tap away. The walk timer lives inside the app, so no Google Fit or Apple Health setup is required.',
  },
  {
    q: 'What happens if I miss a day? Is my streak gone?',
    a: 'Never. We follow a strict “No Guilt” design: a missed day shows an encouraging restart message and keeps your historic streak visible. Shame does not build habits — momentum does.',
  },
  {
    q: 'Can my caregiver see my raw glucose numbers?',
    a: 'No. Caregivers see only whether today’s sprint is done — nothing else. Raw values, medication photos and voice notes are hidden by design (role-based access control), so support never turns into nagging.',
  },
  {
    q: 'Are my voice notes and photos stored forever?',
    a: 'No. Media is processed by AI (transcription / OCR) and then permanently deleted from storage — only the extracted text stays. All traffic is TLS 1.3 encrypted, and you can delete your entire account and data in one tap.',
  },
  {
    q: 'What does my doctor actually get?',
    a: 'A single printable page: days completed vs missed, glucose trend, calendar view of your sprint, and AI-summarised highlights from your optional voice notes — shared via a time-bound, PIN-protected link.',
  },
  {
    q: 'How long is each daily task?',
    a: 'About two minutes. Log fasting sugar with a photo, start a 10-minute post-dinner walk, or tap “Mark as Taken” for your dose. Micro-habits beat lifestyle overhauls.',
  },
]

const MATRIX: Array<{ k: string; win: string; lose: string }> = [
  { k: 'Daily effort', win: '2-minute micro-task', lose: '20+ min logging marathons' },
  { k: 'Getting started', win: 'One sprint picked in 60 seconds', lose: '20-field onboarding forms' },
  { k: 'Data entry', win: 'Camera OCR + voice, numpad fallback', lose: 'Endless manual dropdowns' },
  { k: 'Caregiver role', win: '1-tap cheers & confetti', lose: 'Nagging texts, or no involvement' },
  { k: 'Missed a day', win: 'No-guilt restart, history kept', lose: 'Streak reset to zero 💔' },
  { k: 'Wearables', win: 'Not required', lose: '“Sync your band first”' },
  { k: 'Doctor handoff', win: '1-page summary in one tap', lose: 'Screenshots and memory' },
]

const TESTIMONIALS = [
  {
    stars: '★★★★★',
    quote:
      '“I had ignored my sugar log for six years. Two minutes before breakfast, and my streak hit 18 days — that gold ring is the only reason I haven’t broken it.”',
    name: 'Rahul Mehta',
    role: 'Patient · Type 2 Diabetes · Pune',
    img: 'photo-1500648767791-00dcc994a43e',
    emoji: '🧑',
  },
  {
    stars: '★★★★★',
    quote:
      '“I used to message ‘did you take your meds?’ four times a day. Now I just tap 👏 when he’s done. He’s never been more consistent — and we stopped fighting about it.”',
    name: 'Meera Nair',
    role: 'Caregiver · Daughter · Bengaluru',
    img: 'photo-1494790108377-be9c29b29330',
    emoji: '👩',
  },
  {
    stars: '★★★★★',
    quote:
      '“The one-page summary with voice-note highlights gives me context, not just numbers. My fifteen-minute visits finally feel like clinical conversations again.”',
    name: 'Dr. Ananya Iyer',
    role: 'Endocrinologist · Chennai',
    img: 'photo-1544005313-94ddf0286df2',
    emoji: '👩‍⚕️',
  },
]

const STEPS = [
  {
    n: '01',
    ico: '🎯',
    h: 'Pick your 30-day sprint',
    p: 'Choose one focused goal — pre-breakfast glucose log, 10-min post-dinner walk, or med on time. One goal beats twenty open loops.',
  },
  {
    n: '02',
    ico: '⚡',
    h: 'Log in 2 minutes daily',
    p: 'Snap the glucometer, start the timer, or tap “Mark as Taken”. Optional photo & voice note add context without adding friction.',
  },
  {
    n: '03',
    ico: '💛',
    h: 'Cheer & share the report',
    p: 'Your caregiver sends 🔥👏❤️ the moment you complete. At day 30, your doctor gets a clean one-page summary.',
  },
]

const MEDIA = [
  {
    id: 'photo-1511895426328-dc8714191300',
    emoji: '👨‍👩‍👧',
    h: 'Family, not surveillance',
    p: 'Caregivers cheer completions — they never see raw numbers unless you share them.',
  },
  {
    id: 'photo-1476480862126-209bfaa8edc8',
    emoji: '🌅',
    h: 'Morning walks, real streaks',
    p: 'The 10-minute post-dinner timer needs nothing but your phone in your pocket.',
  },
  {
    id: 'photo-1585937421612-70a008356fbe',
    emoji: '🍛',
    h: 'Built for Indian homes',
    p: 'Voice notes in Hinglish, festival-aware nudges, and zero judgment about dinner.',
  },
]

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="landing">
      {/* ---------- Nav ---------- */}
      <header className="landing-nav">
        <Link to="/" className="brand">
          <span className="brand-dot" />
          SugarSprint
        </Link>
        <nav className="links" aria-label="Landing">
          <a href="#how">How it works</a>
          <a href="#why">Why us</a>
          <a href="#stories">Stories</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Link to="/app" className="btn btn-yellow nav-cta">
          Open App
        </Link>
      </header>

      {/* ---------- Hero ---------- */}
      <section className="hero">
        <div>
          <span className="eyebrow">🏃 30-Day Micro-Habit Sprints</span>
          <h1 className="landing-h1">
            Diabetes care that feels like{' '}
            <span className="accent">a game you win daily.</span>
          </h1>
          <p className="landing-lede">
            Two minutes a day. Golden streaks that forgive missed days. Cheers from the people
            who love you — and a doctor-ready summary at the finish line. Built for people with
            Type 2 diabetes and the families cheering them on.
          </p>
          <div className="hero-ctas">
            <Link to="/app" className="btn btn-yellow">
              Start Your 30-Day Sprint →
            </Link>
            <Link to="/care" className="btn btn-ghost">
              💛 Caregiver Join
            </Link>
          </div>
          <div className="trust-row">
            <div className="avatar-stack" aria-hidden>
              <span className="av">
                <Avatar src={unsplash('photo-1494790108377-be9c29b29330', 120)} alt="" emoji="👩" />
              </span>
              <span className="av">
                <Avatar src={unsplash('photo-1500648767791-00dcc994a43e', 120)} alt="" emoji="🧑" />
              </span>
              <span className="av">
                <Avatar src={unsplash('photo-1472099645785-5658abf4ff4e', 120)} alt="" emoji="👨" />
              </span>
            </div>
            <p className="t-text">
              <b>18-day average streak</b> in pilot families · No wearable required ·
              DPDP-aligned privacy
            </p>
          </div>
        </div>

        {/* Phone mock */}
        <div className="hero-visual">
          <div className="phone-mock">
            <div className="pm-inner">
              <p className="pm-greet">
                Morning, <b>Rahul 👋</b>
              </p>
              <div className="pm-ring">
                <MiniRing />
              </div>
              <div className="pm-task">
                <span className="lbl">TODAY’S SPRINT</span>
                <span className="ttl">Log Fasting Sugar</span>
              </div>
              <div className="pm-cheers">
                <span className="pm-cheer">👏</span>
                <span className="pm-cheer">❤️</span>
                <span className="pm-cheer">🔥</span>
              </div>
            </div>
          </div>
          <div className="streak-badge">
            <span className="flame">🔥</span>
            <span>
              <span className="num">18</span>{' '}
              <span className="lbl">day streak</span>
            </span>
          </div>
          <div className="cheer-float">
            <b>Meera</b> cheered <b>👏</b> — keep going!
          </div>
        </div>
      </section>

      {/* ---------- Stats ---------- */}
      <section className="stats-strip">
        <div className="stat-block">
          <div className="v">2 min</div>
          <div className="k">Daily effort</div>
        </div>
        <div className="stat-block">
          <div className="v">30 days</div>
          <div className="k">To a real habit</div>
        </div>
        <div className="stat-block">
          <div className="v">0</div>
          <div className="k">Guilt streak resets</div>
        </div>
        <div className="stat-block">
          <div className="v">1 tap</div>
          <div className="k">Cheer from family</div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="section" id="how">
        <div className="section-head center">
          <span className="eyebrow">How it works</span>
          <h2 className="landing-h2">Three steps. That’s the whole app.</h2>
        </div>
        <div className="steps-grid">
          {STEPS.map((s) => (
            <div className="step-card" key={s.n}>
              <div className="n">{s.n}</div>
              <div className="ico">{s.ico}</div>
              <h3>{s.h}</h3>
              <p>{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Imagery band ---------- */}
      <section className="section" id="why" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <span className="eyebrow">Made for real life</span>
          <h2 className="landing-h2">Health support that feels human.</h2>
          <p className="landing-lede" style={{ marginTop: 12 }}>
            No clinical whites, no data tables, no nagging. Just warm encouragement, a golden
            ring to fill, and family in your corner.
          </p>
        </div>
        <div className="media-grid">
          {MEDIA.map((m) => (
            <div className="media-card" key={m.id}>
              <Photo src={unsplash(m.id)} alt={m.h} emoji={m.emoji} />
              <div className="cap">
                <h4>{m.h}</h4>
                <p>{m.p}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Comparison matrix ---------- */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head center">
          <span className="eyebrow">Why SugarSprint</span>
          <h2 className="landing-h2">Against traditional diabetes apps</h2>
        </div>
        <div className="compare-wrap">
          <table className="compare">
            <thead>
              <tr>
                <th>Capability</th>
                <th className="win">SugarSprint</th>
                <th>Traditional apps</th>
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((r) => (
                <tr key={r.k}>
                  <td className="row-k">{r.k}</td>
                  <td className="win">✓ {r.win}</td>
                  <td className="lose">✗ {r.lose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- Testimonials ---------- */}
      <section className="section" id="stories" style={{ paddingTop: 0 }}>
        <div className="section-head center">
          <span className="eyebrow">Stories</span>
          <h2 className="landing-h2">Streaks saved. Nagging stopped.</h2>
        </div>
        <div className="testi-grid">
          {TESTIMONIALS.map((t) => (
            <figure className="testi" key={t.name}>
              <div className="stars" aria-label="5 out of 5 stars">
                {t.stars}
              </div>
              <blockquote>{t.quote}</blockquote>
              <figcaption className="who">
                <span className="pic">
                  <Avatar src={unsplash(t.img, 160)} alt={t.name} emoji={t.emoji} />
                </span>
                <span>
                  <span className="nm">{t.name}</span>
                  <br />
                  <span className="rl">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ---------- FAQ ---------- */}
      <section className="section" id="faq" style={{ paddingTop: 0 }}>
        <div className="section-head center">
          <span className="eyebrow">FAQ</span>
          <h2 className="landing-h2">Questions, answered</h2>
        </div>
        <div className="faq-list">
          {FAQS.map((f, i) => (
            <div key={f.q} className={`faq-item${openFaq === i ? ' open' : ''}`}>
              <button
                className="faq-q"
                aria-expanded={openFaq === i}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                {f.q}
                <span className="caret" aria-hidden>
                  ▼
                </span>
              </button>
              <div className="faq-a">
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- Final CTA ---------- */}
      <section className="final-cta">
        <div className="box">
          <h2 className="landing-h2">Your Day 1 is waiting.</h2>
          <p>
            Pick one sprint. Two minutes tomorrow morning. Watch the ring turn gold — and let
            your family cheer you there.
          </p>
          <Link to="/app" className="btn btn-yellow">
            Start Your 30-Day Sprint →
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

/* Mini animated ring for the hero phone mockup */
function MiniRing() {
  const r = 52
  const c = 2 * Math.PI * r
  const done = 0.6
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="ring-svg">
      <circle cx="70" cy="70" r={r} fill="none" stroke="#1b1b1f" strokeWidth="11" />
      <circle
        cx="70"
        cy="70"
        r={r}
        fill="none"
        stroke="url(#goldGrad)"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={`${c * done} ${c}`}
        transform="rotate(-90 70 70)"
      />
      <defs>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FACC15" />
          <stop offset="100%" stopColor="#FFD700" />
        </linearGradient>
      </defs>
      <text
        x="70"
        y="66"
        textAnchor="middle"
        className="ring-center"
        fontSize="26"
        fill="#FFE97A"
      >
        Day 18
      </text>
      <text x="70" y="88" textAnchor="middle" fontSize="11" fill="#a1a1aa">
        of 30
      </text>
    </svg>
  )
}
