# ASHA VoiceCare — Status

Last verified: 2026-11-22

## Running now

| Part | URL | Status |
|---|---|---|
| Frontend (Vite) | http://localhost:5173 | serving, build passes |
| Backend (FastAPI) | http://localhost:8000 | healthy |
| API docs | http://localhost:8000/docs | available |

## What was broken (blank white page)

Every component was written as:

```js
const Dashboard = React.FC = () => { ... }
```

That assigns to `React.FC`, which is a read-only export in React 19. The
assignment throws a `TypeError` while the module loads, so `main.jsx` never
mounted anything and the browser showed a blank white page. The Vite terminal
stayed quiet because the error happened at runtime, not at parse time.

Fixes applied:

- Removed all `React.FC =` assignments (7 files).
- `App.jsx` no longer creates its own React root; only `main.jsx` does.
- `App.jsx` renders the selected page and passes `onNavigate` to it.
- `main.jsx` imports `index.css` and wraps the app in the Redux `Provider`.
- `Button` now has a default export (modules import it as default).
- Installed Tailwind 3 + PostCSS + Autoprefixer with real config files, so the
  utility classes actually compile (before, `@tailwind` was never processed).
- Replaced `vite.config.ts` with `vite.config.mjs` (removes the CommonJS warning)
  and added a `/api` dev proxy to port 8000.
- Deleted the stale `.vite` cache.

Verified with `npm run build` (2,158 modules, no errors), a headless Chrome
render check, and a scripted Puppeteer pass over every screen (no console
errors).

## What the app does now

- **Dashboard** — live counts from the backend (beneficiaries, confirmed
  records, open follow-ups, urgent referrals), recent records table, backend
  offline banner with retry.
- **Voice Assistant** — real end-to-end flow:
  1. browser speech recognition (Web Speech API) or typed transcript;
  2. `POST /api/danger-signs` + `POST /api/extract-entities`;
  3. danger signs shown in red, never suppressed;
  4. editable review table, blank fields stay "Unknown (not stated)";
  5. read-back via browser speech synthesis, plus text;
  6. `POST /api/save-record` only after explicit confirmation;
  7. follow-up shown inline and listed under Follow-ups.
- **Visit Records** — real confirmed records from `GET /api/records`, with
  transcript and full field detail per record.
- **Follow-ups** — real tasks from `GET /api/followups`.
- **Settings** — language, read-back speed/volume, reminder toggle (stored in
  `localStorage`), live backend reachability check.

## Backend endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/` | API name/version |
| GET | `/health` | health check |
| POST | `/api/extract-entities` | regex-based entity extraction (no persistence) |
| POST | `/api/danger-signs` | rule-based danger-sign screening |
| POST | `/api/save-record` | confirm + persist record, generate follow-up |
| GET | `/api/records` | confirmed records |
| GET | `/api/followups` | generated follow-up tasks |
| GET | `/api/stats` | dashboard counters |
| WS | `/ws/stt` | placeholder stream (returns empty transcripts) |

## Safety fixes in the rule engine

- Danger-sign patterns now require patient context, so a newborn with fever is
  no longer labelled "fever during pregnancy".
- Removed de-duplication by category: multiple alerts in the same category are
  all returned. Generic duplicates are dropped only when a specific sign fired
  on the same trigger, so nothing urgent is suppressed.
- Extraction no longer persists anything; records are stored only after the ASHA
  worker confirms them.

Verified cases:

| Transcript | Result |
|---|---|
| Newborn + high fever + difficulty breathing | `highFeverNewborn`, `difficultyBreathingNewborn` |
| Pregnant + vaginal bleeding + severe abdominal pain | `bleedingDuringPregnancy`, `severeAbdominalPain` |
| Newborn, normal weight, feeding well | no alerts |
| Difficulty breathing + heavy bleeding (no context) | `difficultyBreathing`, `heavyBleeding` |

## Design system (navy + electric mint)

The UI uses a premium, futuristic healthcare identity rather than a generic
dashboard template.

- **Palette**: Midnight Navy `#101D32` and Deep Blue `#172B49` for the sidebar,
  hero and voice studio; Electric Mint `#16D6B0` for primary actions and active
  states; Bright Cyan `#36CFC9`; AI Violet `#7357F6` for AI-generated info;
  Warm Amber `#FFB84D` for pending follow-ups; Alert Coral `#EF5261` only for
  genuine danger; Success Green `#16A36A`; Cloud White `#F5F7FB` canvas with
  white cards and `#E7ECF3` borders.
- **Type**: Inter throughout (300–800), tight display tracking, balanced
  headings.
- **App shell**: fixed deep-navy sidebar with mint active rail, sticky light
  header with breadcrumb/API status/date/CTA, and a mobile bottom tab bar with a
  raised mint Voice action. Routes, state and API calls are unchanged.
- **Voice studio**: dark midnight listening area, large mint mic, real
  microphone levels from `getUserMedia` + `AnalyserNode` driving the waveform
  (CSS animation fallback when permission or support is unavailable), live
  transcript, language chips, listening/processing/reading states, and a coral
  danger strip above the review form.
- **Components**: layered shadows (`soft` / `card` / `float` / `lift` / `glow`),
  subtle gradients and grid textures, `.card` / `.input-base` / `.chip` /
  `.sidebar-link` primitives, Lucide icons, skeletons, empty states, and a
  lightweight toast system for extraction and save feedback.
- **Motion**: staggered fade-ups, pulsing mic rings, breathing glows, and
  pop-in confirmations. Everything is disabled under
  `prefers-reduced-motion: reduce`.
- **Feedback**: skeleton loaders, empty states, inline error banners, and a
  compact coral danger strip pinned to the top of the review card so alerts stay
  visible after the page auto-scrolls to the form.
- **Accessibility**: visible mint focus rings, `aria-live` on danger and toast
  regions, `aria-pressed` on toggles, semantic tables/lists, and 44px+ touch
  targets.

Verified with `npm run build` (2,160 modules, no errors) and a scripted
Puppeteer pass over every screen at 1440px and 390px (no console errors).

Screenshots (desktop + mobile) are in `C:\Users\Public\shots\`.

## Known limitations (deliberate, not hidden)

- In-memory storage: data resets on backend restart. No PostgreSQL/MongoDB yet.
- Speech recognition is the browser's, not a medical-grade STT model. It is
  labelled "demo mode" in the UI, and typing is always available.
- `/ws/stt` is a placeholder and returns empty transcripts; it is not used by
  the UI.
- Extraction is regex/keyword based. It handles the demo phrasings well and is
  conservative elsewhere (leaves fields unknown rather than guessing).
- No authentication, audit-log persistence, or multi-worker sync.
- No accuracy or latency numbers are shown anywhere, because none were measured.
