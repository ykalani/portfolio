# Yash Kalani's Portfolio Project Specs (`yash.kalani.name`)

This project is a high-craft, retro Windows-inspired interactive desktop shell serving as Yash Kalani's professional developer portfolio. It integrates multiple application layers and domain routes seamlessly.

---

## 1. Domain Configuration
- **Target Domain:** `yash.kalani.name`
- **Port Structure (Local):** Node.js main web server on port `4173` (proxies flashcard APIs to `5000`).

---

## 2. Directory Layout & Sub-Applications

```
/C:/Users/yash/cse/proj/
├── portfolio/                     <-- [Main Portfolio Application]
│   ├── assets/
│   │   ├── kenney/                <-- Retro font files
│   │   └── Yash_Kalani_Resume-AI.pdf <-- Official PDF Resume
│   ├── docs/
│   │   └── superpowers/plans/     <-- Implementation plans
│   ├── index.html                 <-- Desktop shell DOM container
│   ├── app.js                     <-- Main JS shell engine (window management, drag & drop)
│   ├── content.js                 <-- Yash Kalani's resume & project data modules
│   ├── styles.css                 <-- Bevel borders, layout rules, OKLCH styling
│   ├── server.js                  <-- Node.js server (serving routes & proxying flask APIs)
│   ├── profiles.html              <-- Stands alone at /profiles (Internal premium Linktree)
│   ├── profiles.css               <-- Customized OKLCH style sheet for /profiles
│   └── vercel.json
│
└── flashcard-review/              <-- [Flashcard Review Application]
    ├── templates/index.html       <-- Frontpage template loaded at yash.kalani.name/flashcards
    ├── static/                    <-- Static flashcard bundles (app.js, style.css) served under /static/
    └── app.py                     <-- Flask API server (GROQ/DSPy processing, SQlite reviews) running at port 5000
```

---

## 3. Integrations & Features

### A. About Me & Resume Integration
The "About Me" and "Resume" tabs utilize the OCR-extracted data from Yash Kalani's official resume (`C:\Users\yash\cse\Job_apps\Yash_Kalani_Resume-AI.pdf`).
- **Downloadable PDF:** Served directly from `./assets/Yash_Kalani_Resume-AI.pdf` with beveled floppy-disk controls.
- **Experience Panels:** Renders experience at GE Aerospace, American Axle & Manufacturing, FRIB Particle Accelerator, DTE Energy, and MSU AI Club.

### B. Prettier Profiles Page (`/profiles`)
Replacing `https://allmylinks.com/yash-kalani` with a prettier internal version.
- **Standalone Layout:** Fully responsive, vertical-scroll friendly link page.
- **Theme Matching:** Inherits the classic Redmond-style beveled look with beautiful custom styling.
- **Profile Links Included:**
  1. Instagram (`instagram.com/_yashtagram`)
  2. LinkedIn (`linkedin.com/in/ykalani`)
  3. Substack (`substack.com/@ykalani`)
  4. Spotify (`open.spotify.com/user/wryc9ygbfzza83otspz3wrdd2`)
  5. Airbuds (`i.airbuds.fm/ykal/yGCsWrQ6Uo`)
  6. GitHub (`github.com/ykalani`)
  7. Beli (`beliapp.co/app/ykalani`)
  8. Letterboxd (`letterboxd.com/ykalani`)
  9. Goodreads (`goodreads.com/user/show/202569379-yash-kalani`)
  10. Clash Royale (`link.clashroyale.com/invite/friend/en?tag=2VGYGC8Q0`)
  11. Brawl Stars (`link.brawlstars.com/invite/friend/en/?tag=GUPPR8UYC`)
  12. Chess.com (`link.chess.com/friend/RYQxLk`)
  13. MyAnimeList (`myanimelist.net/profile/ykal`)
  14. Discord (`discord.com/users/733835629926023209`)

### C. Flashcards Ingestion & Review (`/flashcards`)
Routed directly under the main portfolio website using routing mappings inside `server.js`.
- **Static Assets:** Serves `flashcard-review` files transparently.
- **APIs Proxy:** Any request starting with `/api/` (except App Forge generator endpoint `/api/forge`) is forwarded automatically to the Flask backend running on `http://127.0.0.1:5000`.

### D. App Forge Explorer
An interactive project explorer that links directly to the codebase:
- **Visual File Tree:** Exposes main files like `app.js`, `server.js`, `content.js` to explore from within the browser.
- **Code Viewer:** Displays file contents in a retro green-phosphor monospaced editor window.

---

## 4. How to Launch and Test

1. **Start the Flask Backend** (For flashcard review processing):
   ```bash
   cd ../flashcard-review
   python app.py
   ```
2. **Start the Node.js Server** (Serves the desktop shell, profiles, and proxies flashcards):
   ```bash
   cd ../portfolio
   npm run dev
   ```
3. **Open Browser:** Visit `http://127.0.0.1:4173/` for the main site, `http://127.0.0.1:4173/profiles` for the links directory, and `http://127.0.0.1:4173/flashcards` for the flashcards app.
