# IN-PROGRESS

## Current Work
- Fixing Vercel deployment — `server.js` uses `http.createServer().listen()` which crashes on Vercel's serverless runtime.

## Active Plan
- [x] Create `vercel.json` for static file serving
- [x] Create `api/forge.js` as proper Vercel serverless function
- [x] Remove `start` script from `package.json` to prevent auto-detection
- [ ] Deploy to Vercel and verify

## Recently Completed
- Fixed Vercel `FUNCTION_INVOCATION_FAILED` by moving API to `api/forge.js` and configuring static hosting
- Added theme system (5 themes: Retro Purple, Windows 95, Synthwave, Glassmorphic, Matrix Terminal)
- Created Settings app with visual theme selector
- Improved Gemini prompt contract for faster generation
- Added AGENTS.md for workflow documentation

## Blockers
- None.

## Next Steps
- Set `GEMINI_API_KEY` in Vercel environment variables for AI generation to work in production
