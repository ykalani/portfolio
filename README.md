# yash.kalani.name

##### THIS PORTFOLIO HAS BEEN UPDATED VISIT github.com/ykalani/postcardfolio!!!

Yash Kalani's personal website — a multi-surface portfolio deployed on Vercel at [yash.kalani.name](https://yash.kalani.name).

The site is a small Node server (`server.js`) fronted by a Vercel serverless function (`api/index.js`). It routes requests to four distinct surfaces that share a common design language.

---

## Surfaces

| Path | Page | Description |
|---|---|---|
| `/` | `index.html` | Landing card with avatar, role, and social links |
| `/dir` | `dir.html` | Site directory of all surfaces |
| `/profiles` | `profiles.html` | Mobile-first social profiles page (Linktree-style) |
| `/yashOS` | `yashOS/index.html` | Retro Windows-style desktop portfolio shell (App Forge, draggable windows, taskbar) |
| `/flashcards` | `flashcards-static/index.html` | SM-2 spaced repetition flashcard app with AI card generation + LLM judge |

Each surface targets a separate audience and use case but shares the same deployment.

---

## Quick Start

```bash
# Local dev
npm install
npm run dev          # http://127.0.0.1:4173 (auto-increments if busy)

# Production deploy
vercel --prod --yes
```

Environment variables (set in `.env` locally, Vercel env in production):
- `GROQ_API_KEY` — required for flashcard AI features (parse, judge, image)
- `GEMINI_API_KEY` — required for yashOS App Forge AI app generation

---

## Architecture

```
portfolio/
├── api/
│   ├── forge.js              # Standalone Gemini App Forge serverless function (legacy)
│   └── index.js              # Catch-all serverless handler wrapping server.js
├── server.js                 # Node HTTP server, routes, flashcard endpoints
├── vercel.json               # Rewrites (/(.*) -> /api/index)
├── package.json              # groq-sdk, sql.js
├── opencode.json             # Permission config for opencode CLI
├── index.html                # Landing page
├── dir.html                  # Site directory page
├── profiles.html             # Mobile-first social profiles
├── profiles.css              # Profiles page styling
├── favicon.png
├── download.webp             # Avatar
├── assets/
│   ├── kenney/               # Retro UI assets and fonts for yashOS
│   ├── logos/                # Social platform logos for profiles
│   └── Yash_Kalani_Resume-AI.pdf
├── yashOS/                   # Retro Windows desktop shell
│   ├── index.html            # Tab title: "yashOS"
│   ├── app.js                # Window manager, state, event handlers (~2600 lines)
│   ├── content.js            # Portfolio data (projects, experience, contact)
│   ├── generator.js          # App Forge launcher manifest builder, offline templates
│   └── styles.css            # All yashOS styling (~2200 lines)
├── flashcards-static/        # Flashcard app frontend
│   ├── index.html            # Tab title: "Flashcard Review"
│   ├── app.js                # Mobile-first SPA (home, create, review, results)
│   └── style.css             # Dark theme, responsive
├── fc-db.js                  # SQLite via sql.js (in-memory on Vercel, file locally)
├── fc-groq.js                # Groq SDK client (parse, judge, parse-image)
├── fc-sm2.js                 # SM-2 spaced repetition algorithm
├── flashcards.db             # Local SQLite database (gitignored)
└── docs/
    └── superpowers/          # Implementation plans and specs
```

### Request Routing

`vercel.json` catches all traffic and routes to `api/index.js`, which wraps `server.js`'s `createRequestHandler()`. The handler matches in this order:

1. `/flashcards*` and `/flashcards-static/*` → flashcard API + static assets
2. `POST /api/forge` → Gemini app generation for yashOS
3. `GET /api/source?file=...` → serve source of listed files (dev tool)
4. Other `/api/*` → proxied to `http://127.0.0.1:5000` (dev only, for legacy Flask)
5. `/links` → 301 redirect to `/profiles`
6. Everything else → static file lookup with `.html` extension fallback

### yashOS Desktop Shell

- **Entry**: `yashOS/index.html` loads `app.js` as ES module
- **State**: `app.js` owns a plain state object. Persisted to `localStorage` key `portfolio:desktop-state`
- **Windows**: Draggable, focusable, minimizable, closable. Touch events disabled on mobile; windows stack vertically below 900px
- **App Forge**: `generator.js` has offline templates (paint, snake, weather, music, console, producer-consumer). Tries Gemini API first, falls back to local templates
- **Generated apps**: Provide `html`/`css`/`js` fields. CSS uses `{{ID}}` placeholder replaced with window's `data-window-id`. JS runs via `new Function("container", "state", js)` — must query inside `container`, never `document.querySelector`
- **Keyboard**: `Ctrl/Cmd+K` focuses launcher, `Escape` closes start menu, arrow keys move focused window

### Flashcard Review

- **Frontend**: `flashcards-static/` — mobile-first SPA, dark theme
- **Backend**: Routes in `server.js` at `/flashcards/api/*` prefix
- **Database**: `fc-db.js` uses sql.js (SQLite compiled to WASM). In-memory on Vercel (data is ephemeral per cold start), file-backed locally at `flashcards.db`
- **AI**: `fc-groq.js` uses Groq SDK
  - `llama-3.3-70b-versatile` for text parsing + LLM judge
  - `llama-3.2-90b-vision-preview` for image OCR → cards
- **Spaced repetition**: `fc-sm2.js` implements SM-2. Quality 0-3 maps to intervals; ease factor floors at 1.3
- **LLM Judge**: After the user rates their answer, the LLM independently evaluates it against the correct definition, returns a 0-3 quality score with reasoning. The user's rating always takes precedence — they can accept or override the judge's verdict

### Profiles Page

- Mobile-first design (`profiles.css` enforces small-screen base styles, scales up at `min-width` breakpoints)
- Touch-friendly 44px+ targets
- Logos served from `assets/logos/`

---

## Design System

**Landing, directory, profiles**: Lora (serif) display + body. System-aware light/dark via `prefers-color-scheme`. Redmond Blue accent (`#0a3b73` light, `#5b9bd5` dark). Favicon: `/favicon.png` everywhere.

**yashOS**: "Tactile Arcade" — retro 16-bit desktop aesthetic. Kenney Future Narrow display font, Tahoma body. Bevel borders (1px outset `#ffffff`/`#808080`). Redmond Blue title bars. CRT scanline overlays. See `DESIGN.md` for full token reference.

**Flashcards**: Dark theme mobile-first, Lora font, glassmorphism buttons.

See `DESIGN.md` for the full yashOS design token table (colors, typography, components, do's and don'ts).

---

## API Reference

### Flashcard API (prefix: `/flashcards/api`)

| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/health` | — | `{ ok, groq_key_set, groq_key_len }` |
| GET | `/sets` | — | `[ { id, title, source, created_at } ]` |
| POST | `/sets` | `{ title, source }` | `{ id }` (201) |
| GET | `/sets/:id` | — | `{ id, title, cards, stats }` |
| DELETE | `/sets/:id` | — | 204 |
| POST | `/sets/:id/cards` | `{ cards: [{ term, definition }] }` | `{ count }` (201) |
| GET | `/sets/:id/review` | — | Due cards array |
| POST | `/sets/:id/review` | `{ card_id, quality }` | `{ ok }` |
| POST | `/parse` | `{ text, method }` | `{ cards, method }` |
| POST | `/parse-image` | multipart image | `{ cards }` |
| POST | `/judge` | `{ term, definition, answer }` | `{ quality, reasoning }` |
| POST | `/progress` | `{ reviews: [{ card_id, quality }] }` | `{ ok }` |

Rate limits: `/parse` 15/hr, `/parse-image` 5/hr per IP.

### yashOS API

| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/api/forge` | `{ prompt }` | App manifest JSON (title, html, css, js, window) |
| GET | `/api/source?file=...` | — | Source file content (limited allowlist) |

### SM-2 Algorithm (Quality → Interval)

| Quality | Interval |
|---|---|
| 0 | 1 minute |
| 1 | 10 minutes |
| 2 | × ease factor |
| 3 | × ease factor × 1.3 |

Ease factor floors at 1.3. Implemented in `fc-sm2.js`.

---

## Deployment

```bash
vercel --prod --yes
```

Vercel project: `prj_MRWrVGkfg3qZz5GeSIU2El5WUX1g`, GitHub: `ykalani/portfolio`, domain: `yash.kalani.name`.

Required env vars (Vercel):
- `GROQ_API_KEY` — flashcard AI features
- `GEMINI_API_KEY` — yashOS App Forge

Vercel quirks:
- Env vars may get trailing newlines (stripped in `fc-groq.js`)
- Cold starts ~5s
- Flashcard data is ephemeral (SQLite in `/tmp`). For persistence, set `DATABASE_URL` to a Neon Postgres connection string and redeploy (auto-detected, no code changes)

---

## Supported Skills

This project uses opencode skills to enforce workflow discipline:

- `impeccable` — mobile-first UI, dark theme, touch targets, responsive layout (used for profiles page + flashcard UI)
- `customize-opencode` — opencode agent/plugin config
- `brainstorming` — explore intent before creative work
- `using-superpowers`, `systematic-debugging`, `test-driven-development`, `verification-before-completion` — process discipline
- `ponytail` — over-engineering guardrails

Skills directory: `C:\Users\yash\.gemini\config\plugins\superpowers\` and `C:\Users\yash\.gemini\config\plugins\ponytail\`. Config in `opencode.json` (project-scoped, `permission: {"*":"allow"}`).

---

## Local Development Notes

- No build step. No lint/typecheck/test scripts. Edit source then refresh browser.
- `server.js` reads `.env` if present (does not require dotenv).
- Flashcard endpoints expect JSON bodies. `/parse-image` accepts raw multipart bytes.
- To test flashcards locally: `node server.js` then visit `http://127.0.0.1:4173/flashcards`. `GROQ_API_KEY` must be set in `.env`.
- `flashcards.db` is created automatically on first run (gitignored).
- yashOS App Forge falls back to local templates if `GEMINI_API_KEY` is unset.

---

## Commit Policy

Group commits by domain:
- Doc files (`.md`) → one commit
- CSS changes → one commit
- Everything else → one commit

Never lump unrelated files into a single commit. Commit and push after each logical unit of work.

---

## Secrets

| Secret | Where |
|---|---|
| `GROQ_API_KEY` | `.env` (local), Vercel env (production) |
| `GEMINI_API_KEY` | `.env` (local), Vercel env (production) |
| Vercel token | OS keychain (`gho_*`), user `ykalani` |

---

## Further Reading

- `0to1.md` — Original architecture, deployment, and model selection notes
- `DESIGN.md` — Full yashOS design system (colors, typography, components, rules)
- `PRODUCT.md` — Register, users, brand, design principles
- `FEATURES.md` — Full yashOS feature scope (window manager, App Forge, app presets, simulator engine)
- `PROJECT.md` — Project specs and directory layout
- `IN-PROGRESS.md` — Current work and blockers
- `AGENTS.md` — Workflow docs (commands, architecture, gotchas, key files)
- `app-generator-prompt.md` — Prompt contract for App Forge backend model
- `docs/superpowers/plans/` — Implementation plans
