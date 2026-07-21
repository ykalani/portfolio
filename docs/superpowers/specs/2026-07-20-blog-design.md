# Blog System Design

**Date:** 2026-07-20
**Domain:** `yash.kalani.name/blog`
**Author:** Yash Kalani

## Overview

A git-based personal blog. Write markdown files in `blog/`, commit and push to GitHub, Vercel auto-deploys, site renders them at request time. No database, no admin panel, no build step.

## Publisher Workflow

1. Create a `.md` file in `blog/` with YAML frontmatter
2. Commit and push to `origin/master`
3. Vercel auto-deploys — site now serves the new post

## File Format

Each blog post is a markdown file in `blog/` with frontmatter:

```md
---
title: Post Title
date: 2026-07-20
summary: One-line preview shown on listing page.
---

Content body in markdown...
```

The filename (without `.md`) becomes the URL slug:
- `blog/my-first-post.md` → `yash.kalani.name/blog/my-first-post`

## Routes

All handled in `server.js`:

| Route | Method | Behavior |
|---|---|---|
| `/blog` | GET | Lists all posts sorted by date descending. Shows title, date, summary, link to each. |
| `/blog/:slug` | GET | Renders single post. Reads `.md` file, converts to HTML with `marked`, wraps in blog layout. |
| `/blog/*` | GET | 404 if file doesn't exist. |

## Rendering

- **Library**: `marked` (npm) for markdown → HTML conversion
- `blog/*.md` files read from disk on every request (no caching needed — it's Vercel serverless, files deploy with the function)
- Frontmatter parsed manually (split on `---`, extract title/date/summary)

## Styling

- **Font**: Lora (serif) — already loaded on the site for flashcards
- **Background**: `#0a0a0a` (near-black)
- **Text**: `#e8e8e8` (off-white)
- **Max-width**: 720px centered column for reading comfort
- **Post listing**: clean list, each entry shows title + date + summary
- **Post page**: rendered markdown with styled headings, links, code blocks, blockquotes
- **Code blocks**: dark background (`#1a1a1a`), light monospace text
- **No retro desktop chrome** — blog is a standalone minimal page outside the portfolio shell

## Navigation Integration

- Blog link added to the main site footer (alongside Profiles and Directory)
- Blog section is self-contained — no iframes or embedded desktop windows

## File Structure

```
blog/
  my-first-post.md
  another-post.md
server.js          ← blog routes added here
blog.css           ← all blog-specific styles
```

## Future Considerations (Not Implementing Now)

- RSS/Atom feed
- Tags/categories
- Drafts (unlisted posts)
- Image embeds
