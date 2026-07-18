# Design Spec: Portfolio Logo Integration & Footer

**Date:** 2026-07-18  
**Author:** Antigravity AI  
**Goal:** Gather and host logo assets locally for Yash Kalani's 14 portfolio profiles, integrate them into the Linktree `/profiles` page, add a logo/copyright footer to the desktop wallpaper of the main page, and delete/redirect the old `/links` page.

---

## 1. Scope & Goals
- **Scrape & Host Local Logos**: Download SVGs for major brand logos (Instagram, LinkedIn, Substack, Spotify, GitHub, Chess.com, MyAnimeList, Discord, Letterboxd) via Simple Icons, copy the provided Goodreads custom logo, and download cropped PNGs for the remainder (Airbuds, Beli, Clash Royale, Brawl Stars).
- **Web Site Footer**: Center a horizontal row of the 14 logos at the bottom of the desktop workspace (above the taskbar) with the copyright text: `2026 Yash Kalani All rights reserved.`
- **Profiles Linktree Updates**: Inline the 14 local logos next to the text on the `/profiles` page.
- **Cleanup**: Delete `/links` template files (`links.html`, `links.css`) and configure `server.js` to redirect `/links` and `/links/` to `/profiles`.

---

## 2. Proposed Changes

### A. Asset Fetcher Utility
#### [NEW] [download-logos.js](file:///c:/Users/yash/cse/proj/portfolio/scripts/download-logos.js)
A Node.js script that:
- Ensures `assets/logos/` directory exists.
- Copies the uploaded `media__1784406206221.png` to `assets/logos/goodreads.png`.
- Downloads SVGs from jsDelivr/Simple-Icons CDN for major brands.
- Downloads PNGs from the existing AllMyLinks CDN for niche platforms.

Mapping table for downloads:
- `instagram` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/instagram.svg` (SVG)
- `linkedin` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/linkedin.svg` (SVG)
- `substack` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/substack.svg` (SVG)
- `spotify` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/spotify.svg` (SVG)
- `airbuds` -> `https://cdn.allmylinks.com/prod/Site/favicon/f/b/Z/brB03rHvZxppdjfDv4slbkpBXdtIN3dE.png` (PNG)
- `github` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg` (SVG)
- `beli` -> `https://cdn.allmylinks.com/prod/Site/favicon/6/B/t/JBUMgOh2t8Zs_cg0Qz5DHeYwVd0N_kN3.ico` (ICO)
- `letterboxd` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/letterboxd.svg` (SVG)
- `goodreads` -> Local copy of `media__1784406206221.png`
- `clashroyale` -> `https://cdn.allmylinks.com/prod/Site/favicon/O/1/0/OC6UeIEsJ-j8DyxaVHillDCSn3N9l5b8.png` (PNG)
- `brawlstars` -> `https://cdn.allmylinks.com/prod/Site/favicon/7/R/m/rRUW5dllwYuyFz11bLOLKQorJThhfhly.png` (PNG)
- `chess` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/chess.svg` (SVG)
- `myanimelist` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/myanimelist.svg` (SVG)
- `discord` -> `https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/discord.svg` (SVG)

### B. Main Desktop Interface
#### [MODIFY] [app.js](file:///c:/Users/yash/cse/proj/portfolio/app.js)
Inject the new footer in the `render()` function:
```html
<footer class="desktop-footer" aria-label="Desktop footer">
  <div class="desktop-footer__logos">
    <!-- 14 logo links using local images -->
  </div>
  <p class="desktop-footer__copyright">2026 Yash Kalani All rights reserved.</p>
</footer>
```
Ensure this sits before the `taskbar` tag inside `main.desktop`.

#### [MODIFY] [styles.css](file:///c:/Users/yash/cse/proj/portfolio/styles.css)
Add CSS rules for `.desktop-footer`:
- Position: `absolute`, bottom: `calc(var(--taskbar-h) + 12px)`, left: `50%`, transform: `translateX(-50%)`, z-index: `1` (behind active windows but on top of wallpaper).
- Style: Text alignment centered, flex column gap.
- Grayscale filters on images: default grayscale(1) opacity(0.5) transition, hover grayscale(0) opacity(1).

### C. Profiles Linktree Page
#### [MODIFY] [profiles.html](file:///c:/Users/yash/cse/proj/portfolio/profiles.html)
Add `<img>` tags for each link containing the local logo path, e.g.:
```html
<a href="https://www.instagram.com/_yashtagram" target="_blank" rel="noreferrer">
  <span class="profile-link-content">
    <img src="/assets/logos/instagram.svg" alt="" class="profile-link-icon" />
    Instagram
  </span>
  <span>@_yashtagram</span>
</a>
```

#### [MODIFY] [profiles.css](file:///c:/Users/yash/cse/proj/portfolio/profiles.css)
Update the link flex layout:
- Style `.profile-link-content` to display flex with `align-items: center` and `gap: 0.5rem`.
- Set `.profile-link-icon` width/height to `20px` (or `24px`), object-fit `contain`.
- In dark themes / classic, make sure the SVG/PNG colors contrast nicely.

### D. Routing & Cleanups
#### [MODIFY] [server.js](file:///c:/Users/yash/cse/proj/portfolio/server.js)
Interchange `/links` request matching to issue a redirection response:
```javascript
if (requestPath === "/links" || requestPath === "/links/") {
  res.statusCode = 301;
  res.setHeader("Location", "/profiles");
  res.end();
  return;
}
```
Add `.svg`, `.png`, and `.ico` support to `mimeTypes` mapping if not already present:
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

#### [DELETE] [links.html](file:///c:/Users/yash/cse/proj/portfolio/links.html)
#### [DELETE] [links.css](file:///c:/Users/yash/cse/proj/portfolio/links.css)

---

## 3. Verification Plan
1. Run `node scripts/download-logos.js` and verify all 14 logo assets are saved in `assets/logos/`.
2. Start the local server: `node server.js` and browse:
   - `http://127.0.0.1:4173/` (Verify the footer logos show at the bottom on the wallpaper, grayscale by default, colored on hover, and the copyright is centered).
   - `http://127.0.0.1:4173/profiles` (Verify the linktree buttons display inline logos to the left of the titles).
   - `http://127.0.0.1:4173/links` (Verify it redirects to `/profiles`).
