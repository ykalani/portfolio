# macOS-Style Liquid Glass Desktop Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the Windows 95/98 desktop shell layout to a modern macOS-inspired glassmorphic shell with a top menu bar, bottom magnifying dock, and standalone App Forge app.

**Architecture:** Redesign the DOM rendering in `app.js` and styles in `styles.css`. Keep state management for dragging and windows identical, but switch UI frames to rounded translucent glass panels.

**Tech Stack:** Vanilla JavaScript (ES Modules), Vanilla CSS.

## Global Constraints
- Target platform: Modern browsers (supporting CSS backdrop-filter).
- Layout: 26px top menu bar, absolute-positioned bottom floating dock, centered logo grid above the dock.
- Keep comments and other features (drag/drop, window state) intact.

---

### Task 1: Update Content Configuration

**Files:**
- Modify: [content.js](file:///c:/Users/yash/cse/proj/portfolio/content.js)

**Interfaces:**
- Consumes: Existing portfolio structure
- Produces: Updated windows list (with App Forge as a base window, and old taskbar buttons removed)

- [ ] **Step 1: Edit `content.js` to update window definitions and project list**
  Replace lines 19-36 with the updated start menu list, window definitions (including `forge` as a default window, removing `settings` from desktop grid but keeping in start menu/dock), and add App Forge as a listed project.

  ```javascript
  export const portfolio = {
    // ... preceding fields kept verbatim ...
    startMenu: [
      { id: "about", label: "About Me", icon: "user" },
      { id: "projects", label: "Projects", icon: "code" },
      { id: "experience", label: "Experience", icon: "briefcase" },
      { id: "forge", label: "App Forge", icon: "zap" },
      { id: "resume", label: "Resume", icon: "file" },
      { id: "contact", label: "Contact", icon: "mail" },
      { id: "settings", label: "System Settings", icon: "sliders" },
    ],
    windows: [
      { id: "about", label: "About", glyph: "user", title: "About Me", type: "about", x: 56, y: 72, width: 420, height: 340, openByDefault: false },
      { id: "projects", label: "Projects", glyph: "code", title: "Selected Projects", type: "projects", x: 500, y: 64, width: 470, height: 380, openByDefault: false },
      { id: "experience", label: "Experience", glyph: "briefcase", title: "Experience", type: "experience", x: 96, y: 420, width: 430, height: 340, openByDefault: false },
      { id: "forge", label: "App Forge", glyph: "zap", title: "App Forge — Dynamic App Generator", type: "forge", x: 500, y: 180, width: 590, height: 410, openByDefault: false },
      { id: "contact", label: "Contact", glyph: "mail", title: "Contact", type: "contact", x: 540, y: 424, width: 420, height: 320, openByDefault: false },
      { id: "resume", label: "Resume", glyph: "file", title: "Resume", type: "resume", x: 980, y: 96, width: 380, height: 280, openByDefault: false },
      { id: "settings", label: "System Settings", glyph: "sliders", title: "System Settings", type: "settings", x: 320, y: 150, width: 460, height: 380, openByDefault: false },
    ],
    // ... about and other fields ...
    projects: [
      { title: "App Forge", description: "An interactive, dynamic app generator running in a mock macOS environment. Type prompts to dynamically spin up application layers.", tags: ["Gemini API", "HTML/CSS/JS", "Translucency"] },
      { title: "AutoSched", description: "Extracts lectures and exams from uploaded syllabi or screenshots, then syncs them to Google Calendar. 1st Place at Code Green Hackathon.", tags: ["React", "OpenAI API", "Tesseract OCR", "Google Calendar"] },
      { title: "Michigan Logistics Case Study", description: "Analyzed routes and recommended multi-carrier optimizations. 1st Place at Broad Datathon.", tags: ["Python", "Pandas", "XGBoost", "Power BI"] },
      { title: "AI-Driven Music Translation", description: "Translates musical parameters into Ruby code through a web editor and dockerized audio runtime.", tags: ["Next.js", "FastAPI", "Python", "Docker"] },
    ],
  ```

- [ ] **Step 2: Run verification on content.js**
  Run: `node -e "require('./content.js')"`
  Expected: Successful compilation without errors.

- [ ] **Step 3: Commit changes**
  ```bash
  git add content.js
  git commit -m "chore(config): add App Forge window definition and project entry"
  ```

---

### Task 2: Implement Glassmorphism and macOS Window Style CSS

**Files:**
- Modify: [styles.css](file:///c:/Users/yash/cse/proj/portfolio/styles.css)

**Interfaces:**
- Consumes: Base themes and window structures
- Produces: CSS rules for `.mac-window`, `.mac-titlebar`, `.mac-dot` controls, and glassmorphic panels.

- [ ] **Step 1: Append styles to `styles.css` for macOS window styles**
  Append these styles to the end of the file:

  ```css
  /* macOS Glassmorphic Windows */
  .window.is-macos {
    border-radius: 12px !important;
    border: 1px solid rgba(255, 255, 255, 0.15) !important;
    background: rgba(255, 255, 255, 0.18) !important;
    backdrop-filter: blur(20px) !important;
    -webkit-backdrop-filter: blur(20px) !important;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2) !important;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  body.theme-dark .window.is-macos {
    background: rgba(25, 25, 25, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45) !important;
  }

  /* macOS Titlebar */
  .mac-titlebar {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 14px;
    height: 38px;
    background: rgba(0, 0, 0, 0.03);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    position: relative;
    user-select: none;
    cursor: move;
  }

  .mac-titlebar__dots {
    display: flex;
    gap: 8px;
    position: absolute;
    left: 14px;
  }

  .mac-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 0.5px solid rgba(0, 0, 0, 0.12);
    cursor: pointer;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mac-dot--close { background: #ff5f56; }
  .mac-dot--minimize { background: #ffbd2e; }
  .mac-dot--maximize { background: #27c93f; }

  .mac-dot::after {
    font-size: 8px;
    font-weight: bold;
    color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .mac-titlebar__dots:hover .mac-dot--close::after { content: "×"; opacity: 1; }
  .mac-titlebar__dots:hover .mac-dot--minimize::after { content: "−"; opacity: 1; }
  .mac-titlebar__dots:hover .mac-dot--maximize::after { content: "+"; opacity: 1; }

  .mac-titlebar__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  /* Adjust Window content inside macOS chrome */
  .window.is-macos .window__content {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 14px;
    flex: 1;
    overflow-y: auto;
  }
  ```

- [ ] **Step 2: Commit the styling additions**
  ```bash
  git add styles.css
  git commit -m "style(windows): implement macOS-style titlebar and glassmorphic window chrome"
  ```

---

### Task 3: Implement macOS Top Menubar and Bottom Dock CSS

**Files:**
- Modify: [styles.css](file:///c:/Users/yash/cse/proj/portfolio/styles.css)

**Interfaces:**
- Consumes: Color variables
- Produces: CSS layout rules for `.mac-menubar` and `.mac-dock`

- [ ] **Step 1: Append Dock and Menubar CSS rules**
  Append these styles to the end of `styles.css`:

  ```css
  /* macOS Top Menubar */
  .mac-menubar {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 26px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 12px;
    font-size: 13px;
    color: var(--text);
    z-index: 9999;
    font-family: var(--font);
  }

  body.theme-dark .mac-menubar {
    background: rgba(0, 0, 0, 0.35);
    border-bottom-color: rgba(255, 255, 255, 0.05);
  }

  .mac-menubar__left, .mac-menubar__right {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .mac-menubar__item {
    cursor: pointer;
    font-weight: 500;
  }

  .mac-menubar__item--title {
    font-weight: 700;
  }

  .mac-menubar__icon {
    display: inline-flex;
    align-items: center;
    font-size: 13px;
    opacity: 0.95;
  }

  /* macOS Bottom Dock */
  .mac-dock-container {
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9998;
    pointer-events: auto;
  }

  .mac-dock {
    display: flex;
    align-items: flex-end;
    gap: 10px;
    padding: 4px 8px 6px 8px;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    height: 58px;
  }

  body.theme-dark .mac-dock {
    background: rgba(0, 0, 0, 0.35);
    border-color: rgba(255, 255, 255, 0.06);
  }

  .mac-dock__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    cursor: pointer;
    transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1);
  }

  .mac-dock__item:hover {
    transform: scale(1.3) translateY(-8px);
  }

  .mac-dock__icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: 8px;
  }

  .mac-dock__indicator {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--text);
    opacity: 0.7;
    position: absolute;
    bottom: -6px;
    display: none;
  }

  .mac-dock__item.is-open .mac-dock__indicator {
    display: block;
  }

  /* Shift logo grid and other elements up to clear dock & menubar */
  .desktop {
    padding-top: 26px !important;
    height: 100vh !important;
  }

  .desktop-footer {
    bottom: 84px !important; /* Above the 58px dock + 12px margin */
  }
  ```

- [ ] **Step 2: Commit the Dock styling**
  ```bash
  git add styles.css
  git commit -m "style(dock): implement glassmorphic macOS menubar and bottom dock styles"
  ```

---

### Task 4: Implement macOS Top Menubar and Bottom Dock UI in `app.js`

**Files:**
- Modify: [app.js](file:///c:/Users/yash/cse/proj/portfolio/app.js)

**Interfaces:**
- Consumes: `content.js` portfolio definition
- Produces: Updated HTML shell layout containing top bar, dock items, clock updater, and active window dots.

- [ ] **Step 1: Remove wallpaper app launcher and inject macOS top bar / bottom dock**
  Update the main `render()` function in `app.js` (lines 323-377). Replace the taskbar and background launcher rendering with the new top menubar and bottom dock. Map the dock icons to trigger window open actions.

  In `app.js`:
  ```javascript
  function render() {
    app.innerHTML = `
      <main class="desktop" aria-label="Retro desktop">
        <!-- macOS Top Menubar -->
        <header class="mac-menubar">
          <div class="mac-menubar__left">
            <span class="mac-menubar__item mac-menubar__item--title"></span>
            <span class="mac-menubar__item">Finder</span>
            <span class="mac-menubar__item">File</span>
            <span class="mac-menubar__item">Edit</span>
            <span class="mac-menubar__item">View</span>
            <span class="mac-menubar__item">Go</span>
            <span class="mac-menubar__item">Window</span>
            <span class="mac-menubar__item">Help</span>
          </div>
          <div class="mac-menubar__right">
            <span class="mac-menubar__icon">${renderIconHtml("wifi", "pixel-icon--xs")}</span>
            <span class="mac-menubar__icon">${renderIconHtml("battery", "pixel-icon--xs")}</span>
            <span class="mac-menubar__icon" data-action="open-window" data-target="settings">${renderIconHtml("sliders", "pixel-icon--xs")}</span>
            <span class="mac-menubar__time">${escapeHtml(state.clock)}</span>
          </div>
        </header>

        <section class="desktop__icons" aria-label="Desktop shortcuts" style="display:none;">
          <!-- Hide Windows-style shortcuts -->
        </section>

        <section class="desktop__workarea" aria-label="Open windows">
          ${getAllWindows()
            .map((window) => renderWindow(window))
            .join("")}
        </section>

        <!-- macOS Bottom Dock -->
        <div class="mac-dock-container">
          <nav class="mac-dock" aria-label="Applications Dock">
            ${baseWindows.map((win) => {
              const isOpen = state.windows[win.id]?.open;
              const cleanLabel = win.label;
              
              // Map app IDs to beautiful colored icons
              let iconName = win.id;
              if (iconName === "forge") iconName = "substack"; // Substack orange logo fits nicely for App Forge icon
              
              return `
                <button 
                  class="mac-dock__item ${isOpen ? "is-open" : ""}" 
                  type="button" 
                  data-action="open-window" 
                  data-target="${win.id}" 
                  title="${escapeHtml(cleanLabel)}"
                >
                  <img class="mac-dock__icon" src="/assets/logos/${iconName === "settings" ? "beli.ico" : (iconName === "about" ? "spotify.png" : (iconName === "projects" ? "github.png" : (iconName === "forge" ? "substack.png" : (iconName === "experience" ? "linkedin.png" : (iconName === "resume" ? "myanimelist.png" : "discord.png")))))}" alt="${escapeHtml(cleanLabel)}" />
                  <span class="mac-dock__indicator"></span>
                </button>
              `;
            }).join("")}
          </nav>
        </div>

        <footer class="desktop-footer" aria-label="Desktop Footer">
          <div class="desktop-footer__logos">
            <!-- Footer brand links render verbatim ... -->
  ```

- [ ] **Step 2: Update clock formatting to match macOS menu bar**
  Ensure the clock updater sets the date and time format dynamically. Search for `clock` or `state.clock` in `app.js` and set the format to `Sat Jul 18  5:00 PM`.

- [ ] **Step 3: Commit the main layout changes**
  ```bash
  git add app.js
  git commit -m "feat(ui): update app.js to render macOS status bar and bottom applications dock"
  ```

---

### Task 5: Implement macOS Window Chrome and App Forge Application Window

**Files:**
- Modify: [app.js](file:///c:/Users/yash/cse/proj/portfolio/app.js)

**Interfaces:**
- Consumes: Window structures and HTML rendering case statements
- Produces: macOS-styled window wrapper and App Forge form panel

- [ ] **Step 1: Modify `renderWindow()` to output macOS titlebar and close/minimize actions**
  Update `renderWindow(window)` in `app.js`. Replace the classic titlebar rendering with the macOS traffic light dots on the left, window title centered, and wrap the container with the `is-macos` class.

  In `app.js`:
  ```javascript
  function renderWindow(window) {
    const winState = state.windows[window.id];
    if (!winState.open) return "";
    const active = state.activeWindowId === window.id && !winState.minimized;
    
    return `
      <div 
        class="window is-macos ${active ? "is-active" : ""}" 
        id="win-${window.id}" 
        style="
          position: absolute; 
          left: ${winState.x}px; 
          top: ${winState.y}px; 
          width: ${winState.width}px; 
          height: ${winState.height}px; 
          z-index: ${winState.zIndex};
          display: ${winState.minimized ? "none" : "flex"};
        "
        data-window-id="${window.id}"
      >
        <!-- macOS Traffic Lights Titlebar -->
        <header class="mac-titlebar" data-action="window-drag" data-target="${window.id}">
          <div class="mac-titlebar__dots">
            <button class="mac-dot mac-dot--close" type="button" data-action="close-window" data-target="${window.id}" aria-label="Close"></button>
            <button class="mac-dot mac-dot--minimize" type="button" data-action="minimize-window" data-target="${window.id}" aria-label="Minimize"></button>
            <button class="mac-dot mac-dot--maximize" type="button" data-action="maximize-window" data-target="${window.id}" aria-label="Maximize"></button>
          </div>
          <div class="mac-titlebar__title">${escapeHtml(window.title)}</div>
        </header>

        <div class="window__content">
          ${renderWindowBody(window.type || window.id)}
        </div>
      </div>
    `;
  }
  ```

- [ ] **Step 2: Update `renderWindowBody()` for the App Forge case**
  Find the `case "forge":` block in `renderWindowBody(type)` and replace the source file inspector with the **App Forge AI launcher** (relocating it from the background to this window body).

  In `app.js`:
  ```javascript
      case "forge":
        return `
          <div style="display:flex; flex-direction:column; gap:12px; height:100%;">
            <div style="display:flex; gap:12px; align-items:center;">
              <span class="pixel-icon pixel-icon--md" style="--icon-url: url('https://unpkg.com/pixelarticons@latest/svg/zap.svg'); color: #eab308;"></span>
              <div>
                <h2 style="margin:0; font-size:16px;">App Forge AI App Generator</h2>
                <p style="margin:2px 0 0 0; font-size:12px; color:var(--muted);">Spin up custom mock applications from natural language prompts.</p>
              </div>
            </div>
            
            <form class="launcher__form" data-launcher-form style="margin-top:10px;">
              <label class="launcher__field" style="display:flex; flex-direction:column; gap:4px; width:100%;">
                <span class="sr-only">Describe the app you want to create</span>
                <input
                  class="retro-input"
                  style="width:100%; padding:10px; font-size:13px;"
                  type="search"
                  name="query"
                  placeholder="AutoSched, weather forecast, cassettes..."
                  autocomplete="off"
                  spellcheck="false"
                  value="${escapeHtml(state.launcherQuery)}"
                />
              </label>
              <button class="button" type="submit" style="margin-top:8px; width:100%; display:flex; align-items:center; justify-content:center; gap:6px;">
                <span class="pixel-icon pixel-icon--xs" style="--icon-url: url('https://unpkg.com/pixelarticons@latest/svg/arrow-up.svg');"></span>
                Create app
              </button>
            </form>

            <div style="margin-top:8px;">
              <p style="margin:0 0 6px 0; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--muted);">Try suggestions:</p>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                ${portfolio.launcher.examples.map(ex => `
                  <button class="button button--ghost" style="font-size:11px; padding:4px 8px;" type="button" data-action="launch-example" data-query="${escapeHtml(ex.query)}">
                    ${escapeHtml(ex.label)}
                  </button>
                `).join("")}
              </div>
            </div>
            
            <div style="margin-top:auto; font-size:10px; color:var(--muted); border-top:1px solid rgba(255,255,255,0.06); padding-top:10px; display:flex; justify-content:space-between;">
              <span>Gemini Model Integration active</span>
              <span>JSON Contract Loaded</span>
            </div>
          </div>
        `;
  ```

- [ ] **Step 3: Verify build and test window drag & application creation**
  Launch the server, verify the windows open in the macOS glassmorphic layout, drag windows, close them, and test using the App Forge window to generate mock applications.

- [ ] **Step 4: Commit window chrome changes**
  ```bash
  git add app.js
  git commit -m "feat(windows): configure macOS traffic light actions and inline App Forge generator panel"
  ```
