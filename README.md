# SugarSprint 🏃‍♂️💛

**30-day micro-habit sprints for diabetes self-care.** Turns logging glucose, walking,
and taking medication into daily 2-minute challenges — with streaks, caregiver cheers,
and a doctor-ready PDF summary.

Built to the four SugarSprint spec documents:

| Spec | What it drove |
| --- | --- |
| PRD (Corrected v2) | 3 sprint types (`glucose` · `walk` · `med`), no-guilt streaks, caregiver & doctor loops |
| Frontend Spec v2 | Dark Mode #121212, Electric Yellow #FFE600, Metallic Gold #D4AF37, Poppins, 1px borders, glow rings |
| Technical Architecture | FastAPI-endpoint-shaped mock API, schema (users/sprints/daily_logs/cheers), OCR→Whisper pipeline |
| Security & Access | Phone-OTP + magic-link framing, RBAC (caregiver can't see raw values), ephemeral media, rate-limit notes |

## Quick start

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build
```

## Demo script (happy path, ~60 seconds)

1. **Onboarding** — any phone number → the OTP is shown on screen (demo) → name →
   generate a caregiver invite link → pick a sprint (try *Log Fasting Sugar*).
2. **Dashboard** — animated golden StreakRing, one TaskCard, empty cheers row.
3. **Tap the TaskCard** — camera scan animation → OCR confirm (editable) → Save.
   Confetti + haptic toast + the task flips to gold *Sprint Complete*.
4. **~0.5s later** — caregiver bot sends a cheer (❤️ Meera) into *Recent Cheers*.
5. **`/#/care`** — caregiver dashboard: status banner, 3-tap cheer grid, RBAC note.
   A sent cheer triggers confetti on the patient screen.
6. **`/#/report`** — generate the 30-day doctor summary: stats, glucose chart,
   calendar, AI insights → *Save as PDF* uses the browser print dialog.
7. **Walk / Med sprints** — re-run onboarding (clear site data) and pick another
   sprint: 10-minute countdown timer, or one-tap *Mark as Taken* with optional
   photo + long-press voice note (waveform → mock Whisper transcript).

Offline resilience: **Simulate offline** on the dashboard → completes stay optimistic
in localStorage and queue up → going back online flushes the queue with a toast.

## Architecture

```
src/
├── api.ts              # Mock API — mirrors FastAPI contract (swap point for real backend)
├── store.ts            # Zustand + persist: optimistic UI, offline queue, bot cheers
├── constants.ts        # Sprint themes (PRD §4)
├── types.ts            # Types = Supabase schema columns
├── styles.css          # Design system (tokens per Frontend Spec §2–3)
├── components/         # StreakRing · TaskCard · CameraOverlay · VoiceRecorder · Confetti · CheersRow
└── screens/            # Onboarding · Dashboard · Capture · Caregiver · Report

supabase/migrations/001_init.sql   # Schema + RLS + ephemeral media bucket
```

### Swapping in the real backend

Every network call funnels through `src/api.ts`, shaped exactly like the spec's
endpoints (`POST /api/v1/sprints/`, `/logs/`, `/cheers/`, `/logs/upload`,
`/reports/generate`). To go live:

1. Run `supabase/migrations/001_init.sql` in the Supabase SQL editor.
2. Replace each mock function body with a `fetch(\`${import.meta.env.VITE_API_URL}/…\`)`
   call to your FastAPI service (keep the same signatures — nothing else changes).
3. Wire Supabase Auth (phone OTP) in place of `requestOtp/confirmOtp`.
4. Backend AI pipeline: Tesseract for glucometer OCR (Cloud Vision fallback),
   Whisper for voice notes; **purge the uploads immediately after processing**
   (Security Spec §3). Rate-limit `/logs/upload` to 5 req/user/day → 429.

### Security posture (implemented or documented)

- **RBAC**: caregiver UI exposes streak status only — never raw glucose or media
  (mirrored by DB policies: no SELECT on `daily_logs` for caregivers).
- **Ephemeral media**: `media_url` entries are demo placeholders; real backend
  must delete the object right after AI extraction.
- **Rate limiting / presigned report URLs / DPDP consent**: backend concerns —
  documented in the migration comments and `README` swap guide.
