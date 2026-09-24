# SugarSprint — Feature Inventory

Everything below is implemented, typechecked, and exercised in the browser.
Areas: **L**anding · **O**nboarding · **D**ashboard · **G**lucose · **W**alk · **M**edication · **C**aregiver · **R**eport · **S**ettings · **A**chievements · **X** (system/platform)

## Landing page
1. Sticky glass navigation with section anchors + "Open App" CTA
2. Hero with gradient headline and dual CTAs (Start Sprint / Caregiver Join)
3. Hero phone mockup with animated gold streak ring
4. Floating glowing "18-day streak" badge (float animation)
5. Floating caregiver cheer bubble
6. Avatar stack with real photography + automatic fallback
7. Emoji feature ticker (infinite marquee)
8. Animated count-up stats strip (IntersectionObserver)
9. "How it works" 3-step cards with hover lift
10. Human imagery band — 3 captioned photo cards (fallback-safe)
11. Security band — photo + 5-point security checklist
12. Doctor band — photo + live report preview + deep link to /report
13. Before/After emotional comparison cards (grayscale → gold)
14. Capability comparison matrix vs traditional diabetes apps
15. Testimonials with 5-star ratings and avatar photos
16. Interactive FAQ accordion (6 entries, animated)
17. Final CTA glow box
18. Newsletter capture with email validation + success state
19. App Store / Google Play / PWA coming-soon badges
20. Golden scroll-progress bar
21. Back-to-top floating button (appears after 700px)
22. Footer: nav columns, DPDP privacy note, "Made with ❤️ by Starway"
23. Smooth-scroll anchor navigation

## Onboarding
24. Phone → OTP flow with on-screen demo OTP
25. 5-step progress indicator
26. DPDP consent checkbox (required to proceed)
27. One-tap demo mode ("Explore the demo")
28. Profile name + 10-avatar picker
29. Caregiver invite link generation (unique token)
30. Copy invite to clipboard
31. WhatsApp deep-link share
32. SMS deep-link share
33. Family photo banner in the invite step (fallback-safe)
34. Sprint selector — 3 visual cards (Glucose / Walk / Med)
35. Healthy-thali photo banner in sprint selection
36. Back-to-landing link from onboarding

## Dashboard
37. Time-aware greeting with date, day-of-sprint, weekend emoji
38. Dual-view Patient ⇄ Caregiver segmented toggle
39. Animated StreakRing with gold glow (grey→gold draw-on-mount)
40. 30-day map with Streak Shield glyphs and today marker
41. Stats grid: streak · best-ever · sprints done · on-track %
42. XP & level card with progress bar → achievements gallery
43. Mood check-in (5 moods, daily XP award)
44. Single TaskCard — pending/done states with gold completion glow
45. Undo today's entry (demo)
46. Share progress (Web Share API → clipboard fallback)
47. Streak Shield — protect a missed day (3 per sprint, counts in streak)
48. Quick actions: Camera OCR · Voice Note · Walk Timer
49. Hydration tracker (8-glass tap counter + win state)
50. Glucose sparkline (last 10 readings + min/max/latest)
51. Recent cheers horizontal row
52. Quote of the day
53. Live cheer feed sidebar (relative time + custom messages)
54. Doctor summary preview with Generate-PDF button
55. Health tip of the day
56. Did-you-know fact of the day
57. Offline simulation toggle + badge + queued writes + auto-sync toast
58. Keyboard shortcuts (g home · c capture · r report · b badges · s settings)
59. Desktop 3-column layout with sticky sidebars (≥1024px)
60. Mobile sticky bottom nav (Home · Sprint · Caregiver · Report)
61. Desktop header nav pills
62. Settings cog → settings screen
63. Weekend-aware microcopy

## Glucose capture
64. Camera viewfinder with golden brackets, scanline, "Hold Steady"
65. Shutter → "AI is reading" processing overlay → OCR result
66. Real photo upload (gallery/camera) with preview on confirm
67. OCR confidence display + editable reading
68. Fasting / Post-meal context tags
69. Target-range color coding (low / in-range / high) + guidance text
70. mmol/L display per unit preference
71. Recent-readings mini bar chart with unit-aware labels
72. Manual numpad fallback (first-class, not hidden)
73. Haptic + sound + XP celebration on save

## Walk timer
74. Preset chips: 5 / 10 / 15 / 20 minutes
75. Large countdown + progress bar
76. Pause / Resume
77. Session persistence across refresh (resumes countdown)
78. Live distance estimate (km)
79. Live calorie estimate (kcal)
80. Finish-early option with minutes logged
81. Post-walk session summary card

## Medication check-in
82. One-tap gold "Mark as Taken" mega button
83. Already-logged-today guard
84. Daily reminder time display
85. Optional photo upload with thumbnail preview + remove
86. Photo size guard for local storage quota
87. Voice recorder — hold-to-record, pulsing button, waveform, 10s cap
88. Live word-by-word transcript streaming while recording
89. Saved voice-note card with mock playback
90. Optional free-text dose note (80 chars)

## Caregiver mode
91. Dual-view toggle shared with patient dashboard
92. Status banner (completed/pending + streak)
93. Push-notification preview card
94. 1-tap emoji cheers (👏 ❤️ 🔥) → confetti + haptic + sound
95. Custom 60-char message with Enter-to-send
96. Tone Guard — rewrites nagging phrases into supportive ones
97. Scheduled morning cheer toggle (8:00 AM nudge)
98. Caregiver display-name (nickname) setting
99. RBAC transparency matrix (what is visible / hidden by design)
100. Recent activity feed with message + timestamp
101. Care-avatar card with total cheers sent
102. Site footer with Starway credit line

## Doctor report
103. Generate flow with compiling state (AI insight build)
104. 4-digit PIN setup → lock → unlock gate
105. Clinician cover-note letter
106. Range selector 7 / 14 / 30 days (stats, chart, calendar recompute)
107. Stats grid: days done · missed · adherence · cheers · day · length
108. Week-over-week trend with ↑/↓ arrow (last 7 vs previous 7)
109. Glucose trend chart / daily completion bars with miss markers
110. Sprint calendar (30 cells, hit/miss states)
111. AI insights (adherence, voice-note summary, glucose average, walk total, cheer loop)
112. Time-bound share link with visible 7-day expiry
113. Download PDF via print pipeline + suggested filename
114. Route-level code splitting (report loads on demand)
115. Shield days counted as adherent

## Settings & data rights (DPDP)
116. Level + XP display
117. Display-name field
118. Avatar picker
119. Daily reminder time picker
120. Glucose unit switcher (mg/dL ⇄ mmol/L)
121. Completion sound toggle (WebAudio blips, no assets)
122. Export my data (JSON download)
123. Import backup (validated file restore)
124. Delete account & data (two-step confirm + storage wipe)
125. Version + credit line

## Achievements & gamification
126. 7 XP level tiers with titles (Rookie Sprinter → Sprint Legend)
127. 20 unlockable badges with criteria (streaks, voice, offline, shield, comeback…)
128. Locked/unlocked badge visual states with gold glow
129. Badge unlock toasts + confetti + XP awards + level-up announcement
130. XP economy: completions (50), photos (+10), voice (+15), moods, cheers, reports

## Platform & quality
131. Error boundary with friendly recovery + local-data reset
132. Branded 404 screen (no silent redirects)
133. Scroll-to-top on every route change
134. Stacked toast queue (max 3 visible)
135. Cross-tab live sync — cheers/status update across windows instantly
136. PWA manifest (installable, dark theme color)
137. prefers-reduced-motion respected
138. Focus-visible accessibility rings + aria labels/roles
139. Zero horizontal overflow (verified at 390px)
140. Broken-image fallback (gradient + emoji, never a broken icon)
141. Optimistic UI + offline write queue + auto-sync
142. Simulated caregiver bot cheer after every completion
143. Bottom-nav height reservation via CSS var
144. Glassmorphism design system with Inter/Outfit typography
145. Mobile-first responsive architecture (phone column ↔ desktop grid)

**Total: 145 numbered features.**

---

# Pass 2 — real camera, offline artwork, clinical analytics

## Real device camera (replaces the earlier mock)
146. Live `getUserMedia` video feed in the glucose viewfinder (the old build only faked OCR)
147. Canvas frame capture → JPEG data URL, stored with the log
148. Rear (`environment`) camera preferred, with front/back flip
149. Torch / light toggle when the device exposes the capability
150. Escalating constraint ladder — ideal facingMode + 720p → exact facingMode → `{video: true}`
151. Camera preflight via `navigator.mediaDevices` + `isSecureContext` detection
152. Device enumeration check so a camera-less device reports instantly instead of hanging
153. 10-second start timeout behind unanswered permission prompts
154. Plain-language banners for `NotAllowedError`, `NotFoundError`, `NotReadableError`, `OverconstrainedError` and timeouts
155. "Retry camera" action in every failure banner
156. Generation counter so StrictMode double-mounts never orphan a MediaStream
157. All `MediaStreamTrack`s stopped on unmount, stage change and route exit
158. Shutter rendered only while the camera is genuinely live — no dead buttons
159. Upload-photo and type-manually fallbacks kept first-class in every camera failure state
160. Lens artwork shown when no stream exists, so the viewfinder is never a blank rectangle
161. Camera capture wired into the medication flow with its own viewfinder
162. Camera-less / headless environments get an explicit demo-mode message

## Real voice notes (replaces a fabricated transcript)
163. `MediaRecorder`-backed audio capture with a genuine clip
164. Live waveform driven by an `AnalyserNode` on the mic signal
165. Browser `SpeechRecognition` for a real transcript, EN-IN
166. Typed-note fallback that is never blocked by permissions
167. Distinct messages for mic denied, mic absent, and unsupported browsers
168. Tap-to-toggle *and* hold-to-talk interaction
169. 10-second auto-stop limit retained

## Offline-safe artwork
170. Bundled inline-SVG illustration set (12 scenes: glucometer, walk, meds, doctor, family, shield, trophy, chart, night, spark, confetti, phone)
171. `SectionBand` — art underneath, remote photo layered on top, photo removes itself on error
172. `EmptyState` — headline, reason and next action wherever a list is empty
173. `mini-band` helper tiles for contextual art in side columns
174. Ambient desktop backdrop so gutters beside narrow screens never read as void
175. Per-badge artwork washes on all 20 achievement tiles
176. Photo failure in a band reveals artwork rather than a blank box

## Clinical analytics engine
177. Time in Range (TIR) percentage with low / in-range / elevated / high split
178. Estimated A1c from mean glucose (ADAG formula)
179. Coefficient of variation with a 4-band variability verdict
180. Fasting vs post-meal averages and their gap
181. Trend slope detection across the last three readings (rising / falling / steady)
182. Best (closest to mid-range) and peak reading with dates
183. Day-by-day sprint series with colour-coded zones
184. Week-by-week buckets with averages and adherence
185. Adherence engine — logged vs elapsed, missed dates, longest gap, current run, on-pace flag
186. Risk flags with info / watch / alert levels and non-diagnostic wording
187. Plain-language pattern insights (post-meal rise, logging time-of-day bias, note/photo usage)
188. Auto-generated questions to raise at the next appointment
189. 7 / 14 / 30-day window selector on every statistic
190. mmol/L display support throughout the analytics

## Insights screen (new route)
191. New `/#/insights` destination with hero band and headline metric
192. Consistency card with progress bar, longest run and longest gap
193. Time-in-range stacked bar with legend
194. Six-up key statistic grid
195. Trend chart with hatched empty-day slots
196. Week-by-week breakdown
197. "Worth a look" flag list with a data-not-advice disclaimer
198. "What your data is saying" insight list
199. "Ask your doctor" generated question list with a deep link into the report
200. Bottom navigation extended to five destinations

## Command palette
201. ⌘K / Ctrl+K palette available on every route
202. Search across 8 destinations with keyword aliases
203. Action commands: unit switch, sound toggle, offline simulation, export, print, demo reset
204. Full keyboard control (↑ ↓ Enter Esc) with an active-row highlight
205. Floating ⌘ launcher button for pointer users
206. Hidden entirely until a user exists

## Accessibility, display & notifications
207. Text-size preference (Compact / Normal / Large) applied at the document root
208. Reduce-motion preference that neutralises animations globally
209. OS-level `prefers-reduced-motion` still respected
210. Real local notifications with permission request and honest status reporting
211. "Send a test nudge" action, disabled until permission is granted
212. Next-reminder countdown in minutes
213. Screen Wake Lock held while a walk timer runs, re-acquired after tab changes
214. "Screen staying awake" indicator during a walk

## Structure & layout fixes
215. Sub-screens widened to 820px on desktop so gutters stop reading as empty
216. Camera viewfinder capped at 560px so it cannot dominate a wide screen
217. Badge grid goes four-up on desktop
218. Report landing rebuilt as a two-column layout with a live data snapshot
219. Report explainer bands (trend line, AI notes, privacy)
220. 404 rebuilt with illustration, two primary actions and six navigable destination tiles

**Total: 220 numbered features.**
