---
name: Retro Windows Portfolio
description: Playful, tactile retro-desktop portfolio shell with dynamic app generation.
colors:
  primary: "#0a3b73"
  primary-hi: "#1d5ea8"
  neutral-bg: "#e6e2d4"
  chrome: "#c0c0c0"
  chrome-dark: "#404040"
  chrome-lo: "#808080"
  chrome-hi: "#ffffff"
  text: "#111111"
typography:
  display:
    fontFamily: "'Kenney Future Narrow', Tahoma, Verdana, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.2rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.04em"
  body:
    fontFamily: "Tahoma, Verdana, Segoe UI, Arial, sans-serif"
    fontSize: "12px"
    lineHeight: 1.4
rounded:
  none: "0px"
  sm: "4px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "14px"
components:
  window:
    backgroundColor: "{colors.neutral-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "14px"
  launcher-button:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "0px 16px"
  launcher-chip:
    backgroundColor: "#f6f6f6"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "0px 12px"
---

# Design System: Retro Windows Portfolio

## 1. Overview

**Creative North Star: "Tactile Arcade"**

This system represents a playful, blocky, and vector-inspired layout designed to mimic a vintage desktop environment. It focuses on highly interactive desktop metaphors—draggable windows, desktop icons, a taskbar, and a start menu—while utilizing modern layout discipline. The design communicates a sense of high craft and digital play.

The visual style rejects flat, non-interactive modern SaaS landing pages and overly heavy, slow 3D graphic frameworks. Instead, it relies on pixel-perfect CSS bevel boundaries, classic fonts, and textured backgrounds to create an immersive, tactile desktop experience that loads instantly.

**Key Characteristics:**
- Crisp double-border bevel boundaries.
- Radial desktop backgrounds simulating nostalgic CRT screen glows.
- Custom vector button states and retro typography.
- Keyboard-navigable UI containers and focus states.

## 2. Colors

The color system uses a classic desktop palette: cool teal/blue background gradients paired with neutral grey/beige chrome.

### Primary
- **Redmond Blue** (#0a3b73): Used for window titlebars, active states, and dominant visual accents.
- **Active Accent** (#1d5ea8): Used for hover states, focused navigation elements, and active window borders.

### Neutral
- **Beige Panel** (#e6e2d4): The primary container and workspace surface color.
- **Chrome Silver** (#c0c0c0): Used for static UI framing, menu bars, and button backgrounds.
- **Ink Dark** (#111111): Used for body text, guaranteeing high legibility.

### Named Rules
**The CRT Border Rule.** All interactive containers must implement explicit border shadows: a 1px outset highlight (`#ffffff` on top/left, `#808080` on bottom/right) to simulate physical depth.

## 3. Typography

**Display Font:** 'Kenney Future Narrow' (with Tahoma fallback)
**Body Font:** Tahoma, Verdana, Segoe UI, Arial, sans-serif

The display typeface is a blocky, futurist sans-serif that drives the arcade branding. It is paired with clean, readable Windows-system standard sans-serifs for body content.

### Hierarchy
- **Display** (700, clamp(2rem, 5vw, 3.2rem), 0.95): Used for main app headers and the primary launcher title.
- **Headline** (700, 1.8rem, 1.1): Used for window category headers.
- **Body** (400, 12px, 1.4): Used for all descriptive copy, resume details, and lists. Max body line length capped at 70ch.

## 4. Elevation

The system is flat but simulates depth using inset and outset borders (beveling) rather than blurry modern shadows. Blurry drop shadows are used only for active window focus separation.

### Shadow Vocabulary
- **Active Window Glow** (`box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3)`): Used on draggable windows when active to lift them above background windows.

## 5. Components

### Draggable Windows
- **Shape:** Hard corners (0px)
- **Background:** Beige Panel (`#e6e2d4`)
- **Borders:** 2px Chrome Silver border with outset highlighting.
- **Title Bar:** Redmond Blue (`#0a3b73`) to Active Accent (`#1d5ea8`) linear gradient.

### Interactive Buttons
- **Shape:** Hard corners (0px)
- **Style:** Background gradients resembling physical bevels, with a cursor pointer on hover.

### Chips
- **Style:** Hard border, thin padding, light grey background (`#f6f6f6`), transitioning to a slightly brighter shade on hover.

## 6. Do's and Don'ts

### Do:
- **Do** use exact 1px white border-top/border-left and 1px grey border-bottom/border-right to create bevel effects.
- **Do** preserve the CRT scanline overlays across the entire desktop body to maintain the retro arcade theme.
- **Do** respect the user's system preferences for reduced motion by disabling transform scaling when dragging windows.

### Don't:
- **Don't** use border-left/border-right greater than 1px as a colored accent stripe on cards.
- **Don't** use Tailwind gradients or glassmorphism on windows; design elements must feel solid and physical.
- **Don't** allow window text to overflow its container. Use responsive flex-wrapping.
