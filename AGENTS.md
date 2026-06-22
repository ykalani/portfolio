# Agents

## Commands

| What | Command | Notes |
|---|---|---|
| Dev server | `npm run dev` | Serves at `http://127.0.0.1:4173`, auto-increments if busy |
| Static file | `node server.js` | Same as above |

No build step. No lint/typecheck/test scripts. Edit source then refresh browser.

## Architecture

- **Entry**: `index.html` loads `app.js` as ES module
- **State**: `app.js` owns a plain state object. Persisted to `localStorage` key `retro-windows-portfolio:desktop-state`
- **Content**: edit `content.js` for portfolio text (name, projects, experience, contact)
- **Server**: `server.js` — static file server + `POST /api/forge` for Gemini app generation
- **App Forge**: `generator.js` has offline templates (paint, snake, weather, music, console, producer-consumer). Tries Gemini API first, falls back to local
- **Icons**: pixelarticons from unpkg CDN via CSS mask on `.pixel-icon`
- **Font**: Kenney Future Narrow from `assets/kenney/ui-pack/Font/`
- **UI assets**: `assets/kenney/ui-pack/` (SVG button/input backgrounds)

## Dynamic App Gotchas

- Generated apps provide `html`, `css`, `js` fields in their manifest
- CSS uses `{{ID}}` placeholder — replaced with the window's actual `data-window-id`
- JS executes via `new Function("container", "state", js)` — **must** query inside `container`, never `document.querySelector`
- CSS for generated apps is injected as `<style>` into `<head>`

## Backend (Gemini)

- Set `GEMINI_API_KEY` env var to enable. Endpoint: `POST /api/forge` expects `{ "prompt": "..." }`
- Response is a JSON app manifest. Without the key, falls back to local `generator.js` templates

## Responsive

- `< 900px` windows stack vertically, no dragging, taskbar window list hidden
- Window dragging uses pointer events, disabled on mobile

## Keyboard

- `Ctrl/Cmd+K` focuses launcher
- `Escape` closes start menu
- Arrow keys move focused window title bar

## Key Files

| File | Purpose |
|---|---|
| `content.js` | All portfolio data (name, projects, experience, contact) |
| `app.js` | Window manager, state, event handlers (~2600 lines) |
| `generator.js` | Launcher manifest builder, offline app templates |
| `server.js` | Static server + Gemini `/api/forge` endpoint |
| `styles.css` | All styles (~2200 lines) |
| `app-generator-prompt.md` | Prompt contract for backend model |
| `0to1.md` | Full architecture guide |
| `install.cmd` | Unrelated (Antigravity CLI installer, ignore) |
