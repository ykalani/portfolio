# Retro Windows Portfolio

A browser-based, retro Windows-style portfolio shell featuring draggable windows, a taskbar, and an "App Forge" launcher that generates application windows from user prompts.

## Project Overview

*   **Technologies:** Vanilla JavaScript (ES Modules), Vanilla CSS, Node.js (Static Server).
*   **Visual Style:** Retro Windows desktop aesthetic using [Kenney UI assets](https://kenney.nl/assets/ui-pack).
*   **Architecture:** 
    *   `index.html`: Entry point with an app shell.
    *   `app.js`: Main application logic, state management, and window manager.
    *   `server.js`: Lightweight Node.js server for static file delivery.
    *   `content.js`: Centralized configuration for portfolio data (projects, experience, contact info).
    *   `generator.js`: Logic for the "App Forge" launcher, mapping prompts to application manifests.
    *   `styles.css`: Comprehensive styling for the desktop environment and components.

## Building and Running

### Prerequisites
*   Node.js installed.

### Commands
*   **Run Development Server:** `npm run dev` or `npm start`.
    *   The server runs on `http://127.0.0.1:4173` by default. It will automatically increment the port if `4173` is in use.
*   **Install Dependencies:** `npm install` (Note: Currently no external dependencies are listed in `package.json`).

## Development Conventions

*   **State Management:** Managed within `app.js` using a simple state object. Desktop state (window positions, open/closed status) is persisted to `localStorage`.
*   **Component Rendering:** Uses template literals in JavaScript to generate HTML dynamically based on state.
*   **Responsive Design:** 
    *   **Desktop:** Features draggable windows and a multi-tasking taskbar.
    *   **Mobile:** Windows stack vertically, and the taskbar's window list is hidden for simplicity.
*   **Asset Usage:** UI icons and fonts are sourced from `assets/kenney/ui-pack`.
*   **Content Updates:** To change portfolio information, modify `content.js`.
*   **App Forge Extension:** To add new "kinds" of apps the launcher can generate, update the `KIND_LIBRARY` in `generator.js`.

## Key Files
*   `app.js`: The core window manager and event handler.
*   `server.js`: The static file server implementation.
*   `content.js`: Data file for projects, experience, and contact details.
*   `generator.js`: The "AI" generation simulation logic.
*   `styles.css`: Defines the retro look and feel.
