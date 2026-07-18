# Portfolio Logo Integration & Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scrape/compile portfolio logo assets locally, integrate them inline in the `/profiles` page, add a logo/copyright footer to the retro desktop home page, and clean up/redirect `/links`.

**Architecture:** 
1. Run a custom script to pull vector brand SVGs and PNG favicons into `assets/logos/`, copying the custom Goodreads logo from the brain media directory.
2. Modify `server.js` to support serving `.svg`, `.png`, and `.ico` files and redirect `/links` requests to `/profiles`.
3. Add inline logo images to `profiles.html` and style them with OKLCH variables in `profiles.css`.
4. Inject a `.desktop-footer` into the retro desktop page in `app.js` with all 14 logo links and the copyright text, styled with filter transitions in `styles.css`.
5. Remove the obsolete `links.html` and `links.css` files.

**Tech Stack:** Node.js, HTML5, Vanilla CSS, Vanilla JS.

## Global Constraints
- Target domain is `yash.kalani.name`.
- Copyright footer must read exactly: `2026 Yash Kalani All rights reserved.`
- Logos should have a grayscale hover effect on the desktop wallpaper.
- Contrast ratio must remain >= 4.5:1.

---

### Task 1: Create and Run Logo Downloader Utility Script

**Files:**
- Create: `scripts/download-logos.js`
- Copy Goodreads: From `C:\Users\yash\.gemini\antigravity-ide\brain\41925876-6571-4b05-9fad-ff9c315f76b9\media__1784406206221.png` to `assets/logos/goodreads.png`

**Interfaces:**
- Consumes: Goodreads logo image in the brain artifacts folder.
- Produces: 14 image files inside `assets/logos/` directory.

- [ ] **Step 1: Create the download-logos.js script**
  Create the folder `scripts/` if it doesn't exist, and write `scripts/download-logos.js` using native Node.js libraries to fetch and copy the logos.
  ```javascript
  const fs = require("fs");
  const path = require("path");
  const https = require("https");

  const LOGOS_DIR = path.join(__dirname, "..", "assets", "logos");

  if (!fs.existsSync(LOGOS_DIR)) {
    fs.mkdirSync(LOGOS_DIR, { recursive: true });
  }

  const downloads = [
    { name: "instagram.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/instagram.svg" },
    { name: "linkedin.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg" },
    { name: "substack.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/substack.svg" },
    { name: "spotify.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/spotify.svg" },
    { name: "airbuds.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/f/b/Z/brB03rHvZxppdjfDv4slbkpBXdtIN3dE.png" },
    { name: "github.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg" },
    { name: "beli.ico", url: "https://cdn.allmylinks.com/prod/Site/favicon/6/B/t/JBUMgOh2t8Zs_cg0Qz5DHeYwVd0N_kN3.ico" },
    { name: "letterboxd.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/letterboxd.svg" },
    { name: "clashroyale.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/O/1/0/OC6UeIEsJ-j8DyxaVHillDCSn3N9l5b8.png" },
    { name: "brawlstars.png", url: "https://cdn.allmylinks.com/prod/Site/favicon/7/R/m/rRUW5dllwYuyFz11bLOLKQorJThhfhly.png" },
    { name: "chess.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/chess.svg" },
    { name: "myanimelist.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/myanimelist.svg" },
    { name: "discord.svg", url: "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/discord.svg" }
  ];

  function download(url, dest) {
    return new Promise((resolve, reject) => {
      https.get(url, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download: ${res.statusCode}`));
          return;
        }
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close();
          resolve();
        });
      }).on("error", reject);
    });
  }

  async function run() {
    // Copy Goodreads
    const brainGoodreads = "C:/Users/yash/.gemini/antigravity-ide/brain/41925876-6571-4b05-9fad-ff9c315f76b9/media__1784406206221.png";
    const destGoodreads = path.join(LOGOS_DIR, "goodreads.png");
    if (fs.existsSync(brainGoodreads)) {
      fs.copyFileSync(brainGoodreads, destGoodreads);
      console.log("Goodreads logo copied successfully.");
    } else {
      console.warn("WARNING: Goodreads logo source not found in brain folder.");
    }

    for (const item of downloads) {
      const dest = path.join(LOGOS_DIR, item.name);
      try {
        console.log(`Downloading ${item.name}...`);
        await download(item.url, dest);
        console.log(`Saved ${item.name}`);
      } catch (err) {
        console.error(`Error downloading ${item.name}: ${err.message}`);
      }
    }
    console.log("Download task complete!");
  }

  run();
  ```

- [ ] **Step 2: Run the script to populate assets/logos/**
  Run: `node scripts/download-logos.js`
  Expected: Success logs and 14 files in `assets/logos/` directory.

- [ ] **Step 3: Commit downloaded logos**
  Run:
  ```powershell
  git add scripts/download-logos.js assets/logos/
  git commit -m "feat(assets): download and compile local website logo assets"
  ```

---

### Task 2: Configure Server Routing & Clean up Obsolete /links Page

**Files:**
- Modify: `server.js`
- Delete: `links.html`
- Delete: `links.css`

**Interfaces:**
- Consumes: HTTP request to `/links` or `/links/`
- Produces: Redirect response to `/profiles` with status code 301.

- [ ] **Step 1: Modify server.js mimeTypes and add redirect route**
  Open `server.js` and update `mimeTypes` constant (around line 28) and request router (around line 236).
  
  *MimeTypes target:*
  ```javascript
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
  };
  ```

  *Redirect router insert (put right before `const requestPath = req.url === "/" ...` around line 237):*
  ```javascript
  if (req.url === "/links" || req.url === "/links/") {
    res.statusCode = 301;
    res.setHeader("Location", "/profiles");
    res.end();
    return;
  }
  ```

- [ ] **Step 2: Delete links.html and links.css**
  Run:
  ```powershell
  git rm links.html links.css
  ```

- [ ] **Step 3: Test redirection**
  Start server: `node server.js`
  Test request using PowerShell:
  `Invoke-WebRequest -Uri http://127.0.0.1:4173/links -MaximumRedirection 0 -ErrorAction SilentlyContinue | Select-Object StatusCode, Headers`
  Expected: StatusCode = 301, Location header = `/profiles`.

- [ ] **Step 4: Commit router changes and removals**
  Run:
  ```powershell
  git add server.js
  git commit -m "feat(router): redirect /links to /profiles and delete old links files"
  ```

---

### Task 3: Update Linktree Profiles Page with Inline Logos

**Files:**
- Modify: `profiles.html`
- Modify: `profiles.css`

**Interfaces:**
- Consumes: Local image files in `assets/logos/`
- Produces: Rendered link list inside `/profiles` displaying inline logo icons.

- [ ] **Step 1: Modify profiles.html**
  Open `profiles.html` and modify the navigation list to add the logo `img` element inside each anchor link.
  ```html
        <a href="https://www.instagram.com/_yashtagram" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/instagram.svg" alt="" class="profile-link-icon" />
            Instagram
          </span>
          <span>@_yashtagram</span>
        </a>
        <a href="https://www.linkedin.com/in/ykalani" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/linkedin.svg" alt="" class="profile-link-icon" />
            LinkedIn
          </span>
          <span>/in/ykalani</span>
        </a>
        <a href="https://substack.com/@ykalani" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/substack.svg" alt="" class="profile-link-icon" />
            Substack
          </span>
          <span>@ykalani</span>
        </a>
        <a href="https://open.spotify.com/user/wryc9ygbfzza83otspz3wrdd2" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/spotify.svg" alt="" class="profile-link-icon" />
            Spotify
          </span>
          <span>Listening now</span>
        </a>
        <a href="https://i.airbuds.fm/ykal/yGCsWrQ6Uo" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/airbuds.png" alt="" class="profile-link-icon" />
            Airbuds
          </span>
          <span>@ykal</span>
        </a>
        <a href="https://github.com/ykalani" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/github.svg" alt="" class="profile-link-icon" />
            GitHub
          </span>
          <span>@ykalani</span>
        </a>
        <a href="https://beliapp.co/app/ykalani" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/beli.ico" alt="" class="profile-link-icon" />
            Beli
          </span>
          <span>@ykalani</span>
        </a>
        <a href="https://letterboxd.com/ykalani" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/letterboxd.svg" alt="" class="profile-link-icon" />
            Letterboxd
          </span>
          <span>@ykalani</span>
        </a>
        <a href="https://www.goodreads.com/user/show/202569379-yash-kalani" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/goodreads.png" alt="" class="profile-link-icon" />
            Goodreads
          </span>
          <span>Yash Kalani</span>
        </a>
        <a href="https://link.clashroyale.com/invite/friend/en?tag=2VGYGC8Q0" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/clashroyale.png" alt="" class="profile-link-icon" />
            Clash Royale
          </span>
          <span>2VGYGC8Q0</span>
        </a>
        <a href="https://link.brawlstars.com/invite/friend/en/?tag=GUPPR8UYC" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/brawlstars.png" alt="" class="profile-link-icon" />
            Brawl Stars
          </span>
          <span>GUPPR8UYC</span>
        </a>
        <a href="https://www.chess.com/member/minimagnus2017" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/chess.svg" alt="" class="profile-link-icon" />
            Chess.com
          </span>
          <span>Play a game</span>
        </a>
        <a href="https://myanimelist.net/profile/ykal" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/myanimelist.svg" alt="" class="profile-link-icon" />
            MyAnimeList
          </span>
          <span>@ykal</span>
        </a>
        <a href="https://discord.com/users/733835629926023209" target="_blank" rel="noreferrer">
          <span class="profile-link-content">
            <img src="/assets/logos/discord.svg" alt="" class="profile-link-icon" />
            Discord
          </span>
          <span>Yash Kalani</span>
        </a>
  ```

- [ ] **Step 2: Modify profiles.css**
  Open `profiles.css` and append logo styles to `.profile-link-content` and `.profile-link-icon`.
  ```css
  .profile-link-content {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }
  .profile-link-icon {
    width: 24px;
    height: 24px;
    object-fit: contain;
    /* In dark theme buttons, inverted SVGs can look better, but let's keep them clean and colored/original */
  }
  ```
  Also update `nav a` selector in `profiles.css` (around line 11) to center elements appropriately if baseline is offset. Replace `align-items: baseline` with `align-items: center`.

- [ ] **Step 3: Commit profiles changes**
  Run:
  ```powershell
  git add profiles.html profiles.css
  git commit -m "feat(profiles): render inline logo icons for profile links"
  ```

---

### Task 4: Add Desktop Footer with Logo Grid and Copyright

**Files:**
- Modify: `app.js`
- Modify: `styles.css`

**Interfaces:**
- Consumes: Local image files in `assets/logos/`
- Produces: Wallpaper footer rendering on the main retro desktop background.

- [ ] **Step 1: Modify app.js to render the footer**
  Open `app.js` and locate the `render()` function (around line 324). Insert the footer element right above the `taskbar` HTML string.
  
  *HTML string to insert:*
  ```javascript
        <footer class="desktop-footer" aria-label="Desktop Footer">
          <div class="desktop-footer__logos">
            <a class="desktop-footer__logo-link" href="https://www.instagram.com/_yashtagram" target="_blank" rel="noreferrer" title="Instagram">
              <img class="desktop-footer__logo-img" src="/assets/logos/instagram.svg" alt="Instagram" />
            </a>
            <a class="desktop-footer__logo-link" href="https://www.linkedin.com/in/ykalani" target="_blank" rel="noreferrer" title="LinkedIn">
              <img class="desktop-footer__logo-img" src="/assets/logos/linkedin.svg" alt="LinkedIn" />
            </a>
            <a class="desktop-footer__logo-link" href="https://substack.com/@ykalani" target="_blank" rel="noreferrer" title="Substack">
              <img class="desktop-footer__logo-img" src="/assets/logos/substack.svg" alt="Substack" />
            </a>
            <a class="desktop-footer__logo-link" href="https://open.spotify.com/user/wryc9ygbfzza83otspz3wrdd2" target="_blank" rel="noreferrer" title="Spotify">
              <img class="desktop-footer__logo-img" src="/assets/logos/spotify.svg" alt="Spotify" />
            </a>
            <a class="desktop-footer__logo-link" href="https://i.airbuds.fm/ykal/yGCsWrQ6Uo" target="_blank" rel="noreferrer" title="Airbuds">
              <img class="desktop-footer__logo-img" src="/assets/logos/airbuds.png" alt="Airbuds" />
            </a>
            <a class="desktop-footer__logo-link" href="https://github.com/ykalani" target="_blank" rel="noreferrer" title="GitHub">
              <img class="desktop-footer__logo-img" src="/assets/logos/github.svg" alt="GitHub" />
            </a>
            <a class="desktop-footer__logo-link" href="https://beliapp.co/app/ykalani" target="_blank" rel="noreferrer" title="Beli">
              <img class="desktop-footer__logo-img" src="/assets/logos/beli.ico" alt="Beli" />
            </a>
            <a class="desktop-footer__logo-link" href="https://letterboxd.com/ykalani" target="_blank" rel="noreferrer" title="Letterboxd">
              <img class="desktop-footer__logo-img" src="/assets/logos/letterboxd.svg" alt="Letterboxd" />
            </a>
            <a class="desktop-footer__logo-link" href="https://www.goodreads.com/user/show/202569379-yash-kalani" target="_blank" rel="noreferrer" title="Goodreads">
              <img class="desktop-footer__logo-img" src="/assets/logos/goodreads.png" alt="Goodreads" />
            </a>
            <a class="desktop-footer__logo-link" href="https://link.clashroyale.com/invite/friend/en?tag=2VGYGC8Q0" target="_blank" rel="noreferrer" title="Clash Royale">
              <img class="desktop-footer__logo-img" src="/assets/logos/clashroyale.png" alt="Clash Royale" />
            </a>
            <a class="desktop-footer__logo-link" href="https://link.brawlstars.com/invite/friend/en/?tag=GUPPR8UYC" target="_blank" rel="noreferrer" title="Brawl Stars">
              <img class="desktop-footer__logo-img" src="/assets/logos/brawlstars.png" alt="Brawl Stars" />
            </a>
            <a class="desktop-footer__logo-link" href="https://www.chess.com/member/minimagnus2017" target="_blank" rel="noreferrer" title="Chess.com">
              <img class="desktop-footer__logo-img" src="/assets/logos/chess.svg" alt="Chess.com" />
            </a>
            <a class="desktop-footer__logo-link" href="https://myanimelist.net/profile/ykal" target="_blank" rel="noreferrer" title="MyAnimeList">
              <img class="desktop-footer__logo-img" src="/assets/logos/myanimelist.svg" alt="MyAnimeList" />
            </a>
            <a class="desktop-footer__logo-link" href="https://discord.com/users/733835629926023209" target="_blank" rel="noreferrer" title="Discord">
              <img class="desktop-footer__logo-img" src="/assets/logos/discord.svg" alt="Discord" />
            </a>
          </div>
          <p class="desktop-footer__copyright">2026 Yash Kalani All rights reserved.</p>
        </footer>
  ```

- [ ] **Step 2: Modify styles.css to style the footer**
  Open `styles.css` and append the new footer style rules.
  ```css
  .desktop-footer {
    position: absolute;
    bottom: calc(var(--taskbar-h) + 16px);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    z-index: 1; /* Floating wallpaper background widget: sits below active windows (z-index 10+) but above wallpaper background */
    pointer-events: auto;
    text-align: center;
  }

  .desktop-footer__logos {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 12px;
    padding: 6px 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 20px;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  .desktop-footer__logo-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.15s ease;
  }

  .desktop-footer__logo-link:hover {
    transform: scale(1.15);
  }

  .desktop-footer__logo-img {
    width: 20px;
    height: 20px;
    object-fit: contain;
    filter: grayscale(1) brightness(0.9);
    opacity: 0.6;
    transition: filter 0.15s ease, opacity 0.15s ease;
  }

  .desktop-footer__logo-link:hover .desktop-footer__logo-img {
    filter: none;
    opacity: 1;
  }

  .desktop-footer__copyright {
    margin: 0;
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    text-shadow: 1px 1px 0 rgba(0, 0, 0, 0.35);
    font-family: var(--font);
    letter-spacing: 0.02em;
  }
  ```

- [ ] **Step 3: Commit footer changes**
  Run:
  ```powershell
  git add app.js styles.css
  git commit -m "feat(footer): integrate desktop wallpaper logo footer and copyright"
  ```

---

## Verification Plan

### Manual Verification
1. Run `node scripts/download-logos.js` and verify folder `assets/logos/` contains 14 files.
2. Start server `node server.js` and verify in browser:
   - `http://127.0.0.1:4173/`: Verify the footer is placed at the bottom, centered, styled in grayscale which turns colored on hover, and links work.
   - `http://127.0.0.1:4173/profiles`: Verify each profile row has its logo to the left of its name.
   - `http://127.0.0.1:4173/links`: Verify it successfully redirects to `/profiles`.
