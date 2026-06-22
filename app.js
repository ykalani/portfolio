import { portfolio } from "./content.js";
import { buildGeneratedApp, MASTER_APP_PROMPT } from "./generator.js";

const app = document.getElementById("app");
const storageKey = "retro-windows-portfolio:desktop-state";
const baseWindows = portfolio.windows;
const baseWindowById = Object.fromEntries(baseWindows.map((window) => [window.id, window]));

function createBaseWindowStates() {
  return Object.fromEntries(
    baseWindows.map((window) => [
      window.id,
      {
        open: Boolean(window.openByDefault),
        minimized: false,
        x: window.x,
        y: window.y,
        width: window.width,
        height: window.height,
        zIndex: window.openByDefault ? 1 : 0,
      },
    ]),
  );
}

const DEFAULT_APP_STATES = {
  calculator: { display: "0", expression: "", resetOnNext: false },
  notes: {
    activeNoteId: "note-1",
    list: [
      { id: "note-1", title: "Ideas", content: "1. Build a retro portfolio (done!)\n2. Add interactive apps (done!)\n3. Check out the dashboard next." }
    ]
  },
  todo: {
    list: [
      { id: "todo-1", text: "Drag windows by their title bars", completed: true },
      { id: "todo-2", text: "Create a Focus Timer pomodoro run", completed: false },
      { id: "todo-3", text: "Test the calculator app", completed: false }
    ],
    filter: "all"
  },
  timer: {
    timeRemaining: 1500, // 25 minutes
    isRunning: false,
    activePreset: "pomodoro",
    duration: 1500
  },
  dashboard: {
    traffic: 45,
    cpu: 18,
    memory: 42,
    mode: "normal",
    firewall: true,
    cdn: false,
    logs: [
      "System boot successful.",
      "Firewall active (v4.2).",
      "Static assets serving on port 4174."
    ]
  },
  chat: {
    messages: [
      { sender: "assistant", text: "Hello! I am your portfolio helper. Ask me anything about this site, the creator's skills, or selected projects! You can also type prompts in the desktop launcher to generate brand new windows." }
    ]
  },
  browser: {
    url: "vibe://welcome",
    history: ["vibe://welcome"]
  },
  settings: {
    theme: "default"
  }
};

const PLAUSIBLE_PROJECTS = [
  { title: "Multi-Threaded Producer-Consumer C++ Simulator", query: "Multi-Threaded Producer-Consumer Simulator", icon: "sliders" },
  { title: "Decentralized Chat Protocol Client", query: "Decentralized Chat Protocol Client", icon: "message" },
  { title: "3D Pixel Canvas Editor", query: "3D Pixel Canvas Editor", icon: "paint" },
  { title: "Retro Snake Arcade Game", query: "Retro Snake Arcade Game", icon: "gamepad" },
  { title: "Vintage Cassette Synth Player", query: "Vintage Cassette Synth Player", icon: "music" },
  { title: "Distributed KV Store Database Stats", query: "Distributed KV Store Database Stats", icon: "dashboard" },
  { title: "System Resource Command Monitor", query: "System Resource Command Monitor", icon: "dashboard" },
  { title: "Interactive Focus Timer Pomodoro", query: "Interactive Focus Timer Pomodoro", icon: "clock" },
  { title: "Local Markdown Document Notepad", query: "Local Markdown Document Notepad", icon: "file" },
  { title: "Interactive Web Viewer Shell", query: "Interactive Web Viewer Shell", icon: "globe" },
  { title: "Weather Doppler Forecast Lookup", query: "Weather Doppler Forecast Lookup", icon: "cloud" }
];

function createDefaultState() {
  return {
    booting: true,
    startMenuOpen: false,
    activeWindowId: "",
    launcherQuery: "",
    zCounter: 10,
    windows: createBaseWindowStates(),
    generatedWindows: [],
    drag: null,
    clock: "",
    appStates: JSON.parse(JSON.stringify(DEFAULT_APP_STATES))
  };
}

const state = createDefaultState();

function getAllWindows() {
  return [...baseWindows, ...state.generatedWindows];
}

function getWindowDefinition(id) {
  return baseWindowById[id] ?? state.generatedWindows.find((window) => window.id === id) ?? null;
}

function getStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    console.warn("Desktop layout persistence is unavailable.", error);
    return null;
  }
}

function persistState() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const snapshot = {
    activeWindowId: state.activeWindowId,
    startMenuOpen: state.startMenuOpen,
    launcherQuery: state.launcherQuery,
    zCounter: state.zCounter,
    windows: Object.fromEntries(
      Object.entries(state.windows).map(([id, winState]) => [
        id,
        {
          open: winState.open,
          minimized: winState.minimized,
          x: winState.x,
          y: winState.y,
          width: winState.width,
          height: winState.height,
          zIndex: winState.zIndex,
        },
      ]),
    ),
    generatedWindows: state.generatedWindows.map((window) => ({
      id: window.id,
      kind: window.kind,
      title: window.title,
      label: window.label,
      glyph: window.glyph,
      summary: window.summary,
      accent: window.accent,
      accentHi: window.accentHi,
      prompt: window.prompt,
      tags: window.tags,
      window: window.window,
      panels: window.panels,
      actions: window.actions,
      notes: window.notes,
      html: window.html || "",
      css: window.css || "",
      js: window.js || "",
    })),
    appStates: state.appStates,
  };

  try {
    storage.setItem(storageKey, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("Unable to save desktop layout.", error);
  }
}

function hydrateState() {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  const raw = storage.getItem(storageKey);
  if (!raw) {
    return;
  }

  let saved;
  try {
    saved = JSON.parse(raw);
  } catch (error) {
    console.warn("Ignoring invalid saved desktop layout.", error);
    storage.removeItem(storageKey);
    return;
  }
  if (!saved || typeof saved !== "object") {
    return;
  }

  if (typeof saved.activeWindowId === "string" && state.windows[saved.activeWindowId]) {
    state.activeWindowId = saved.activeWindowId;
  }

  if (typeof saved.startMenuOpen === "boolean") {
    state.startMenuOpen = saved.startMenuOpen;
  }

  if (typeof saved.launcherQuery === "string") {
    state.launcherQuery = saved.launcherQuery;
  }

  if (Number.isFinite(saved.zCounter)) {
    state.zCounter = Math.max(state.zCounter, saved.zCounter);
  }

  const savedWindows = saved.windows && typeof saved.windows === "object" ? saved.windows : null;
  if (!savedWindows) {
    return;
  }

  baseWindows.forEach((window) => {
    const winState = state.windows[window.id];
    const savedWindow = savedWindows[window.id];
    if (!savedWindow || typeof savedWindow !== "object") {
      return;
    }

    if (typeof savedWindow.open === "boolean") {
      winState.open = savedWindow.open;
    }

    if (typeof savedWindow.minimized === "boolean") {
      winState.minimized = savedWindow.minimized;
    }

    for (const key of ["x", "y", "width", "height", "zIndex"]) {
      if (Number.isFinite(savedWindow[key])) {
        winState[key] = savedWindow[key];
      }
    }
  });

  const generatedWindows = Array.isArray(saved.generatedWindows) ? saved.generatedWindows : [];
  state.generatedWindows = generatedWindows
    .map((window) => {
      if (!window || typeof window !== "object" || typeof window.id !== "string") {
        return null;
      }

      const savedWindow = savedWindows[window.id] && typeof savedWindows[window.id] === "object" ? savedWindows[window.id] : {};
      const width = Number.isFinite(savedWindow.width) ? savedWindow.width : Number.isFinite(window.window?.width) ? window.window.width : 600;
      const height = Number.isFinite(savedWindow.height) ? savedWindow.height : Number.isFinite(window.window?.height) ? window.window.height : 520;
      state.windows[window.id] = {
        open: typeof savedWindow.open === "boolean" ? savedWindow.open : true,
        minimized: typeof savedWindow.minimized === "boolean" ? savedWindow.minimized : false,
        x: Number.isFinite(savedWindow.x) ? savedWindow.x : Number.isFinite(window.window?.x) ? window.window.x : 120,
        y: Number.isFinite(savedWindow.y) ? savedWindow.y : Number.isFinite(window.window?.y) ? window.window.y : 120,
        width,
        height,
        zIndex: Number.isFinite(savedWindow.zIndex) ? savedWindow.zIndex : Number.isFinite(window.zIndex) ? window.zIndex : ++state.zCounter,
      };

      return {
        id: window.id,
        kind: window.kind || "custom",
        title: window.title || "Custom App",
        label: window.label || window.title || "Custom App",
        glyph: window.glyph || "★",
        summary: window.summary || "",
        accent: window.accent || "#0a3b73",
        accentHi: window.accentHi || "#2b74c5",
        prompt: window.prompt || "",
        tags: Array.isArray(window.tags) ? window.tags : [],
        html: window.html || "",
        css: window.css || "",
        js: window.js || "",
        window: {
          x: state.windows[window.id].x,
          y: state.windows[window.id].y,
          width: state.windows[window.id].width,
          height: state.windows[window.id].height,
        },
        panels: Array.isArray(window.panels) ? window.panels : [],
        actions: Array.isArray(window.actions) ? window.actions : [],
        notes: Array.isArray(window.notes) ? window.notes : [],
      };
    })
    .filter(Boolean);

  state.zCounter = Math.max(state.zCounter, ...getAllWindows().map((window) => state.windows[window.id]?.zIndex ?? 0));

  const fallbackActive = getAllWindows().find((window) => state.windows[window.id]?.open && !state.windows[window.id]?.minimized)?.id ?? "";
  state.activeWindowId = state.windows[state.activeWindowId]?.open ? state.activeWindowId : fallbackActive;

  if (saved.appStates && typeof saved.appStates === "object") {
    state.appStates = {
      ...JSON.parse(JSON.stringify(DEFAULT_APP_STATES)),
      ...saved.appStates
    };
  }
}

hydrateState();

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderIconHtml(name, className = "", style = "") {
  const iconName = name;
  if (!iconName) return "";
  if (iconName.length <= 2) {
    return `<span class="icon-fallback ${className}" style="${style}">${escapeHtml(iconName)}</span>`;
  }
  return `<span class="pixel-icon ${className}" style="--icon-url: url('https://unpkg.com/pixelarticons@latest/svg/${iconName}.svg'); ${style}" aria-hidden="true"></span>`;
}

function render() {
  app.innerHTML = `
    <main class="desktop" aria-label="Retro desktop">
      ${renderLauncher()}

      <section class="desktop__icons" aria-label="Desktop shortcuts">
        ${baseWindows
          .map(
            (window) => `
              <button class="desktop-icon" type="button" data-action="open-window" data-target="${window.id}">
                <span class="desktop-icon__glyph" aria-hidden="true">
                  ${renderIconHtml(window.glyph, "pixel-icon--md")}
                </span>
                <span class="desktop-icon__label">${escapeHtml(window.label)}</span>
              </button>
            `,
          )
          .join("")}
      </section>

      <section class="desktop__workarea" aria-label="Open windows">
        ${getAllWindows()
          .map((window) => renderWindow(window))
          .join("")}
      </section>

      ${renderStartMenu()}

      <footer class="taskbar" aria-label="Taskbar">
        <button class="taskbar__start" type="button" data-action="toggle-start" aria-expanded="${state.startMenuOpen}">
          ${renderIconHtml("device-desktop", "pixel-icon--sm taskbar__start-icon")}
          <span>Start</span>
        </button>
        <div class="taskbar__windows" aria-label="Open windows">
          ${getAllWindows()
            .filter((window) => state.windows[window.id]?.open)
            .map((window) => {
              const winState = state.windows[window.id];
              const active = state.activeWindowId === window.id && !winState.minimized;
              return `
                <button
                  class="taskbar__window ${active ? "is-active" : ""}"
                  type="button"
                  data-action="taskbar-window"
                  data-target="${window.id}"
                >
                  ${renderIconHtml(window.glyph, "pixel-icon--xs taskbar__window-icon")}
                  <span>${escapeHtml(window.label)}</span>
                </button>
              `;
            })
            .join("")}
        </div>
        <div class="taskbar__clock" aria-label="Clock">${escapeHtml(state.clock)}</div>
      </footer>
    </main>

    ${state.booting ? renderBootScreen() : ""}
  `;
}

function renderWindow(window) {
  const winState = state.windows[window.id];

  if (!winState.open) {
    return "";
  }

  const minimizedClass = winState.minimized ? "is-minimized" : "";
  const activeClass = state.activeWindowId === window.id && !winState.minimized ? "is-active" : "";
  const kindClass = window.type === "generated" ? "window--generated" : "";
  const body = window.type === "generated" ? renderGeneratedWindowBody(window) : renderWindowBody(window.type);
  const accentStyle = window.type === "generated"
    ? `--generated-accent:${window.accent};--generated-accent-hi:${window.accentHi};`
    : "";

  return `
    <section
      class="window ${kindClass} ${minimizedClass} ${activeClass}"
      data-window-id="${window.id}"
      data-window-kind="${window.type}"
      style="left:${winState.x}px;top:${winState.y}px;width:${winState.width}px;height:${winState.height}px;z-index:${winState.zIndex};${accentStyle}"
      aria-label="${escapeHtml(window.title)}"
    >
      <header class="window__titlebar" data-drag-handle data-window-id="${window.id}" tabindex="0" aria-label="${escapeHtml(window.title)} title bar. Press arrow keys to move window.">
        <div class="window__title">
          ${window.type === "generated"
            ? `<span class="window__title-icon window__title-icon--generated" aria-hidden="true">${escapeHtml(window.glyph)}</span>`
            : `<span class="window__title-icon" aria-hidden="true">${renderIconHtml(window.glyph, "pixel-icon--xs")}</span>`}
          <span>${escapeHtml(window.title)}</span>
        </div>
        <div class="window__controls">
          <button type="button" class="window__control" data-action="minimize-window" data-target="${window.id}" aria-label="Minimize ${escapeHtml(window.title)}">_</button>
          <button type="button" class="window__control" data-action="close-window" data-target="${window.id}" aria-label="Close ${escapeHtml(window.title)}">x</button>
        </div>
      </header>
      <div class="window__body">
        ${body}
      </div>
    </section>
  `;
}

function renderLauncher() {
  const examples = portfolio.launcher.examples
    .map(
      (example) => `
        <button class="launcher__chip" type="button" data-action="launch-example" data-query="${escapeHtml(example.query)}">
          ${escapeHtml(example.label)}
        </button>
      `,
    )
    .join("");

  return `
    <section class="launcher" aria-label="App launcher">
      <div class="launcher__hero">
        ${renderIconHtml("zap", "launcher__icon-pixel")}
        <div>
          <p class="eyebrow">App forge</p>
          <h1 class="launcher__title">${escapeHtml(portfolio.launcher.title)}</h1>
          <p class="launcher__subtitle">${escapeHtml(portfolio.launcher.subtitle)}</p>
        </div>
      </div>

      <form class="launcher__form" data-launcher-form>
        <label class="launcher__field">
          <span class="sr-only">Describe the app you want to create</span>
          <input
            class="launcher__input"
            type="search"
            name="query"
            placeholder="${escapeHtml(portfolio.launcher.placeholder)}"
            autocomplete="off"
            spellcheck="false"
            value="${escapeHtml(state.launcherQuery)}"
          />
          <div class="launcher__suggestions" id="launcher-suggestions" style="display: none;" aria-label="Suggestions list"></div>
        </label>
        <button class="launcher__submit" type="submit">
          ${renderIconHtml("arrow-up", "launcher__submit-icon")}
          Create app
        </button>
      </form>

      <div class="launcher__examples" aria-label="Suggested app ideas">
        ${examples}
      </div>

      <div class="launcher__footnote">
        <span>Master prompt ready for backend generation.</span>
        <span class="launcher__divider" aria-hidden="true"></span>
        <span>JSON contract loaded locally.</span>
      </div>
    </section>
  `;
}

function renderWindowBody(type) {
  switch (type) {
    case "about":
      return `
        <section class="panel">
          <p class="eyebrow">Profile</p>
          <h1 class="headline">${escapeHtml(portfolio.name)}</h1>
          <p class="lede">${escapeHtml(portfolio.role)}</p>
          <p>${escapeHtml(portfolio.about.summary)}</p>
          <div class="chip-row">
            ${portfolio.about.highlights.map((item) => `<span class="chip">${escapeHtml(item)}</span>`).join("")}
          </div>
        </section>
        <article class="project-card">
          <div class="project-card__header">
            <h2>Try this first</h2>
          </div>
          <ul class="resume-list">
            ${portfolio.about.quickStart.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ul>
        </article>
        <section class="stats-grid" aria-label="Highlights">
          ${portfolio.about.stats
            .map(
              (stat) => `
                <article class="stat-card">
                  <span class="stat-card__label">${escapeHtml(stat.label)}</span>
                  <strong class="stat-card__value">${escapeHtml(stat.value)}</strong>
                </article>
              `,
            )
            .join("")}
        </section>
      `;
    case "projects":
      return `
        <div class="stack">
          ${portfolio.projects
            .map(
              (project) => `
                <article class="project-card">
                  <div class="project-card__header">
                    <h2>${escapeHtml(project.title)}</h2>
                  </div>
                  <p>${escapeHtml(project.description)}</p>
                  <div class="chip-row">
                    ${project.tags.map((tag) => `<span class="chip chip--dim">${escapeHtml(tag)}</span>`).join("")}
                  </div>
                </article>
              `,
            )
            .join("")}
        </div>
      `;
    case "experience":
      return `
        <div class="timeline">
          ${portfolio.experience
            .map(
              (entry) => `
                <article class="timeline-item">
                  <div class="timeline-item__meta">
                    <strong>${escapeHtml(entry.role)}</strong>
                    <span>${escapeHtml(entry.company)}</span>
                    <span>${escapeHtml(entry.period)}</span>
                  </div>
                  <p>${escapeHtml(entry.details)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      `;
    case "contact":
      return `
        <section class="panel">
          <p>${escapeHtml(portfolio.contact.intro)}</p>
          <form class="contact-form" data-contact-form>
            <label>
              <span>Name</span>
              <input type="text" name="name" autocomplete="name" required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" name="email" autocomplete="email" required />
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" rows="5" required></textarea>
            </label>
            <div class="contact-form__actions">
              <button class="button" type="submit">Open Mail App</button>
              <button class="button button--ghost" type="button" data-action="copy-email" data-target="contact">Copy Email</button>
            </div>
            <p class="form-status" aria-live="polite" data-form-status></p>
          </form>
          <div class="contact-links">
            ${portfolio.contact.fields
              .map(
                (field) => `
                  <a class="contact-link" href="${escapeHtml(field.href)}"${field.href.startsWith("mailto:") ? "" : ' target="_blank" rel="noreferrer"'}>
                    <span>${escapeHtml(field.label)}</span>
                    <strong>${escapeHtml(field.value)}</strong>
                  </a>
                `,
              )
              .join("")}
          </div>
        </section>
      `;
    case "resume":
      return `
        <section class="panel">
          <p>${escapeHtml(portfolio.resume.summary)}</p>
          <ul class="resume-list">
            ${portfolio.resume.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
          </ul>
          <div class="contact-form__actions">
            <button class="button" type="button" data-action="open-window" data-target="contact">Contact Me</button>
            <a class="button button--ghost" href="mailto:${escapeHtml(portfolio.email)}?subject=${encodeURIComponent("Resume request")}">Request Resume</a>
          </div>
        </section>
      `;
    case "settings":
      return renderSettingsApp();
    default:
      return `<p>Content unavailable.</p>`;
  }
}

function renderGeneratedWindowBody(window) {
  if (window.html) {
    return renderDynamicCustomApp(window);
  }

  switch (window.kind) {
    case "calculator":
      return renderCalculatorApp(window);
    case "notes":
      return renderNotesApp(window);
    case "todo":
      return renderTodoApp(window);
    case "timer":
      return renderTimerApp(window);
    case "dashboard":
      return renderDashboardApp(window);
    case "chat":
      return renderChatApp(window);
    case "browser":
      return renderBrowserApp(window);
    default:
      return renderDefaultGeneratedWindowBody(window);
  }
}

function renderDefaultGeneratedWindowBody(window) {
  return `
    <section class="panel generated-panel">
      <div class="generated-panel__header">
        <p class="eyebrow">Generated app</p>
        <h2 class="headline">${escapeHtml(window.title)}</h2>
        <p class="lede">${escapeHtml(window.summary)}</p>
      </div>
      <div class="chip-row">
        ${window.tags.map((tag) => `<span class="chip chip--generated">${escapeHtml(tag)}</span>`).join("")}
      </div>
    </section>

    <div class="generated-grid">
      ${window.panels
        .map(
          (panel) => `
            <article class="generated-card">
              <div class="generated-card__title">${escapeHtml(panel.title)}</div>
              <p>${escapeHtml(panel.body)}</p>
              <ul>
                ${panel.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
              </ul>
            </article>
          `,
        )
        .join("")}
    </div>

    <section class="generated-notes">
      <div class="generated-notes__header">
        <span>Launcher prompt</span>
        <strong>${escapeHtml(window.kind.toUpperCase())}</strong>
      </div>
      <p>${escapeHtml(window.prompt || MASTER_APP_PROMPT.split("\n")[0])}</p>
      <div class="contact-form__actions">
        ${window.actions
          .map(
            (action) => `
              <button class="button button--ghost" type="button" data-action="generated-action" data-target="${window.id}" data-intent="${escapeHtml(action.intent)}">
                ${escapeHtml(action.label)}
              </button>
            `,
          )
          .join("")}
      </div>
      <ul class="resume-list">
        ${window.notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}
      </ul>
    </section>
  `;
}

function applyTheme(themeName) {
  const themes = ["theme-default", "theme-classic", "theme-cyberpunk", "theme-glassmorphic", "theme-matrix"];
  themes.forEach(t => document.body.classList.remove(t));
  document.body.classList.add(`theme-${themeName}`);
  
  if (!state.appStates.settings) {
    state.appStates.settings = { theme: "default" };
  }
  state.appStates.settings.theme = themeName;
  
  const settingsWindow = getAllWindows().find(w => w.id === "settings" && state.windows[w.id]?.open);
  if (settingsWindow) {
    const bodyElement = app.querySelector(`[data-window-id="settings"] .window__body`);
    if (bodyElement) {
      bodyElement.innerHTML = renderSettingsApp();
    }
  }
  
  persistState();
}

function renderSettingsApp() {
  const currentTheme = state.appStates.settings?.theme || "default";
  const themes = [
    { id: "default", name: "Retro Purple", colors: ["#3b2d54", "#fcf8ee", "#ffd166", "#653c94"] },
    { id: "classic", name: "Windows 95 Classic", colors: ["#008080", "#d4d0c8", "#d4d0c8", "#000080"] },
    { id: "cyberpunk", name: "Synthwave Neon", colors: ["#0d0115", "#1a0826", "#ff007f", "#00ffff"] },
    { id: "glassmorphic", name: "Glassmorphic Glow", colors: ["#1a1528", "rgba(255,255,255,0.45)", "rgba(255,255,255,0.5)", "#653c94"] },
    { id: "matrix", name: "Matrix Terminal", colors: ["#000000", "#0a0f08", "#0f2c0b", "#1eff00"] }
  ];

  return `
    <section class="panel settings-app">
      <p class="eyebrow">Control Panel</p>
      <h2 class="headline">Theme Selector</h2>
      <p class="lede">Choose a visual system to transform your retro desktop environment instantly.</p>
      
      <div class="theme-grid">
        ${themes.map(t => {
          const active = t.id === currentTheme ? "is-active-theme" : "";
          return `
            <div class="theme-card ${active}" data-action="set-theme" data-theme="${t.id}">
              <div class="theme-card__preview">
                <span class="theme-card__dot" style="background-color: ${t.colors[0]}" title="Desktop Background"></span>
                <span class="theme-card__dot" style="background-color: ${t.colors[1]}" title="Window Panel"></span>
                <span class="theme-card__dot" style="background-color: ${t.colors[2]}" title="Chrome/Controls"></span>
                <span class="theme-card__dot" style="background-color: ${t.colors[3]}" title="Title Bar"></span>
              </div>
              <div class="theme-card__info">
                <strong class="theme-card__name">${escapeHtml(t.name)}</strong>
                <span class="theme-card__status">${t.id === currentTheme ? "Active" : "Apply Theme"}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

// Interactive Apps Preset Renders
function renderCalculatorApp(window) {
  const calcState = state.appStates.calculator;
  return `
    <div class="calc-app">
      <div class="calc-app__display" id="calc-display-${window.id}">${escapeHtml(calcState.display)}</div>
      <div class="calc-app__keypad" data-window-id="${window.id}">
        <button class="button calc-key calc-key--clear" type="button" data-calc-key="C">C</button>
        <button class="button calc-key calc-key--back" type="button" data-calc-key="Backspace">&lt;</button>
        <button class="button calc-key" type="button" data-calc-key="(">(</button>
        <button class="button calc-key" type="button" data-calc-key=")">)</button>
        
        <button class="button calc-key" type="button" data-calc-key="7">7</button>
        <button class="button calc-key" type="button" data-calc-key="8">8</button>
        <button class="button calc-key" type="button" data-calc-key="9">9</button>
        <button class="button calc-key calc-key--op" type="button" data-calc-key="/">/</button>
        
        <button class="button calc-key" type="button" data-calc-key="4">4</button>
        <button class="button calc-key" type="button" data-calc-key="5">5</button>
        <button class="button calc-key" type="button" data-calc-key="6">6</button>
        <button class="button calc-key calc-key--op" type="button" data-calc-key="*">*</button>
        
        <button class="button calc-key" type="button" data-calc-key="1">1</button>
        <button class="button calc-key" type="button" data-calc-key="2">2</button>
        <button class="button calc-key" type="button" data-calc-key="3">3</button>
        <button class="button calc-key calc-key--op" type="button" data-calc-key="-">-</button>
        
        <button class="button calc-key" type="button" data-calc-key="0">0</button>
        <button class="button calc-key" type="button" data-calc-key=".">.</button>
        <button class="button calc-key calc-key--equals" type="button" data-calc-key="=">=</button>
        <button class="button calc-key calc-key--op" type="button" data-calc-key="+">+</button>
      </div>
      <div class="calc-app__info">Prompt: "${escapeHtml(window.prompt || 'Calculator')}"</div>
    </div>
  `;
}

function renderNotesApp(window) {
  const notesState = state.appStates.notes;
  const activeNote = notesState.list.find(n => n.id === notesState.activeNoteId) || { title: "", content: "" };
  
  const sidebarItems = notesState.list.map(note => `
    <button type="button" class="notes-app__sidebar-item ${note.id === notesState.activeNoteId ? 'is-active' : ''}" data-action="select-note" data-note-id="${note.id}" data-window-id="${window.id}">
      <span class="notes-app__item-title">${escapeHtml(note.title || 'Untitled')}</span>
    </button>
  `).join("");

  return `
    <div class="notes-app" data-window-id="${window.id}">
      <aside class="notes-app__sidebar">
        <button type="button" class="button notes-app__new-btn" data-action="new-note" data-window-id="${window.id}">
          ${renderIconHtml("plus", "pixel-icon--xs")}
          <span>New Note</span>
        </button>
        <div class="notes-app__list">
          ${sidebarItems || '<p class="notes-app__empty">No notes</p>'}
        </div>
      </aside>
      <main class="notes-app__editor">
        <input type="text" class="notes-app__title-input" id="note-title-${window.id}" placeholder="Note Title" value="${escapeHtml(activeNote.title)}" data-window-id="${window.id}" />
        <textarea class="notes-app__textarea" id="note-content-${window.id}" placeholder="Type your note here..." data-window-id="${window.id}">${escapeHtml(activeNote.content)}</textarea>
        <div class="notes-app__actions">
          <button type="button" class="button" data-action="save-note" data-window-id="${window.id}">
            ${renderIconHtml("save", "pixel-icon--xs")}
            <span>Save</span>
          </button>
          <button type="button" class="button button--ghost" data-action="delete-note" data-window-id="${window.id}" ${!notesState.activeNoteId ? 'disabled' : ''}>
            ${renderIconHtml("trash", "pixel-icon--xs")}
            <span>Delete</span>
          </button>
        </div>
      </main>
    </div>
  `;
}

function renderTodoApp(window) {
  const todoState = state.appStates.todo;
  const filter = todoState.filter || "all";
  
  const filteredList = todoState.list.filter(item => {
    if (filter === "active") return !item.completed;
    if (filter === "completed") return item.completed;
    return true;
  });

  const todoItems = filteredList.map(item => `
    <li class="todo-app__item ${item.completed ? 'is-completed' : ''}" data-todo-id="${item.id}" data-window-id="${window.id}">
      <input type="checkbox" class="todo-app__checkbox" data-action="toggle-todo" data-todo-id="${item.id}" data-window-id="${window.id}" ${item.completed ? 'checked' : ''} />
      <span class="todo-app__text">${escapeHtml(item.text)}</span>
      <button type="button" class="todo-app__delete" data-action="delete-todo" data-todo-id="${item.id}" data-window-id="${window.id}">×</button>
    </li>
  `).join("");

  return `
    <div class="todo-app" data-window-id="${window.id}">
      <form class="todo-app__form" data-action="add-todo-form" data-window-id="${window.id}">
        <input type="text" class="todo-app__input" placeholder="What needs to be done?" required />
        <button type="submit" class="button">
          ${renderIconHtml("plus", "pixel-icon--xs")}
          <span>Add</span>
        </button>
      </form>
      <ul class="todo-app__list">
        ${todoItems || '<li class="todo-app__empty">No tasks here!</li>'}
      </ul>
      <footer class="todo-app__footer">
        <span class="todo-app__count">${todoState.list.filter(t => !t.completed).length} items left</span>
        <div class="todo-app__filters">
          <button type="button" class="todo-app__filter-btn ${filter === 'all' ? 'is-active' : ''}" data-action="filter-todo" data-filter="all" data-window-id="${window.id}">All</button>
          <button type="button" class="todo-app__filter-btn ${filter === 'active' ? 'is-active' : ''}" data-action="filter-todo" data-filter="active" data-window-id="${window.id}">Active</button>
          <button type="button" class="todo-app__filter-btn ${filter === 'completed' ? 'is-active' : ''}" data-action="filter-todo" data-filter="completed" data-window-id="${window.id}">Completed</button>
        </div>
        <button type="button" class="button button--ghost todo-app__clear-btn" data-action="clear-completed-todos" data-window-id="${window.id}">
          ${renderIconHtml("close", "pixel-icon--xs")}
          <span>Clear Completed</span>
        </button>
      </footer>
    </div>
  `;
}function renderTimerApp(window) {
  const timerState = state.appStates.timer;
  const mins = Math.floor(timerState.timeRemaining / 60);
  const secs = timerState.timeRemaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPercent = ((timerState.duration - timerState.timeRemaining) / timerState.duration) * 100;

  return `
    <div class="timer-app" data-window-id="${window.id}">
      <div class="timer-app__clock">${timeStr}</div>
      
      <div class="timer-app__progress-bar">
        <div class="timer-app__progress-fill" style="width: ${progressPercent}%"></div>
      </div>
 
      <div class="timer-app__controls">
        <button type="button" class="button timer-app__btn" data-action="toggle-timer" data-window-id="${window.id}">
          ${timerState.isRunning ? renderIconHtml("pause", "pixel-icon--xs") : renderIconHtml("play", "pixel-icon--xs")}
          <span>${timerState.isRunning ? 'Pause' : 'Start'}</span>
        </button>
        <button type="button" class="button button--ghost timer-app__btn" data-action="reset-timer" data-window-id="${window.id}">
          ${renderIconHtml("reload", "pixel-icon--xs")}
          <span>Reset</span>
        </button>
      </div>

      <div class="timer-app__presets">
        <button type="button" class="button timer-app__preset-btn ${timerState.activePreset === 'pomodoro' ? 'is-active' : ''}" data-action="preset-timer" data-preset="pomodoro" data-duration="1500" data-window-id="${window.id}">Pomodoro (25m)</button>
        <button type="button" class="button timer-app__preset-btn ${timerState.activePreset === 'short' ? 'is-active' : ''}" data-action="preset-timer" data-preset="short" data-duration="300" data-window-id="${window.id}">Short Break (5m)</button>
        <button type="button" class="button timer-app__preset-btn ${timerState.activePreset === 'long' ? 'is-active' : ''}" data-action="preset-timer" data-preset="long" data-duration="900" data-window-id="${window.id}">Long Break (15m)</button>
      </div>
    </div>
  `;
}

function renderDashboardApp(window) {
  const dashState = state.appStates.dashboard;
  
  const chartBars = Array.from({ length: 8 }).map((_, i) => {
    const seed = (i * 17) % 23;
    const height = Math.min(Math.max((dashState.traffic * 0.7) + (dashState.cpu * 0.3) + seed - 10, 10), 100);
    return `
      <div class="dash-chart__bar-col">
        <div class="dash-chart__bar-fill" style="height: ${height}%" title="Bar ${i+1}: ${Math.round(height)}%"></div>
        <span class="dash-chart__bar-label">M${i+1}</span>
      </div>
    `;
  }).join("");

  const logItems = dashState.logs.slice(-6).map(log => `
    <div class="dash-logs__item">${escapeHtml(log)}</div>
  `).join("");

  return `
    <div class="dash-app" data-window-id="${window.id}">
      <section class="dash-metrics">
        <article class="stat-card dash-metric">
          <span class="stat-card__label">TRAFFIC RATE</span>
          <strong class="stat-card__value">${dashState.traffic} req/s</strong>
        </article>
        <article class="stat-card dash-metric">
          <span class="stat-card__label">CPU LOAD</span>
          <strong class="stat-card__value">${dashState.cpu}%</strong>
        </article>
        <article class="stat-card dash-metric">
          <span class="stat-card__label">MEM USAGE</span>
          <strong class="stat-card__value">${dashState.memory}%</strong>
        </article>
      </section>

      <section class="dash-layout-grid">
        <article class="project-card dash-controls">
          <h3>Simulation Controls</h3>
          <div class="dash-controls__field">
            <label>
              <span>Traffic Load (req/s)</span>
              <input type="range" min="0" max="100" value="${dashState.traffic}" data-action="slider-traffic" data-window-id="${window.id}" />
            </label>
          </div>
          <div class="dash-controls__field">
            <label>
              <span>Load Profile</span>
              <select class="dash-select" data-action="select-mode" data-window-id="${window.id}">
                <option value="idle" ${dashState.mode === 'idle' ? 'selected' : ''}>Idle (Low Traffic)</option>
                <option value="normal" ${dashState.mode === 'normal' ? 'selected' : ''}>Normal Operation</option>
                <option value="stress" ${dashState.mode === 'stress' ? 'selected' : ''}>Stress Test Mode</option>
              </select>
            </label>
          </div>
          <div class="dash-controls__checkboxes">
            <label class="dash-checkbox">
              <input type="checkbox" data-action="toggle-firewall" data-window-id="${window.id}" ${dashState.firewall ? 'checked' : ''} />
              <span>Firewall Active</span>
            </label>
            <label class="dash-checkbox">
              <input type="checkbox" data-action="toggle-cdn" data-window-id="${window.id}" ${dashState.cdn ? 'checked' : ''} />
              <span>CDN Edge Cache</span>
            </label>
          </div>
        </article>

        <article class="project-card dash-chart">
          <h3>Traffic Over Time</h3>
          <div class="dash-chart__bars">
            ${chartBars}
          </div>
        </article>
      </section>

      <section class="dash-logs-wrapper">
        <div class="dash-logs-header">System Events Log</div>
        <div class="dash-logs__list">
          ${logItems}
        </div>
      </section>
    </div>
  `;
}

function renderChatApp(window) {
  const chatState = state.appStates.chat;
  
  const msgItems = chatState.messages.map(msg => `
    <div class="chat-app__msg chat-app__msg--${msg.sender === 'user' ? 'outgoing' : 'incoming'}">
      <div class="chat-app__msg-bubble">${escapeHtml(msg.text)}</div>
    </div>
  `).join("");

  return `
    <div class="chat-app" data-window-id="${window.id}">
      <div class="chat-app__history" id="chat-history-${window.id}">
        ${msgItems}
        <div class="chat-app__typing-indicator" id="chat-typing-${window.id}" style="display: none;">
          <span></span><span></span><span></span>
        </div>
      </div>
      <form class="chat-app__form" data-action="send-chat-form" data-window-id="${window.id}">
        <input type="text" class="chat-app__input" placeholder="Ask about skills, projects, contact info..." required autocomplete="off" />
        <button type="submit" class="button">
          ${renderIconHtml("message", "pixel-icon--xs")}
          <span>Send</span>
        </button>
      </form>
    </div>
  `;
}

function renderBrowserApp(window) {
  const browserState = state.appStates.browser;
  const content = renderMockWebsiteContent(browserState.url);

  return `
    <div class="browser-app" data-window-id="${window.id}">
      <header class="browser-app__chrome">
        <div class="browser-app__nav-buttons">
          <button type="button" class="button browser-app__nav-btn" data-action="browser-back" data-window-id="${window.id}" aria-label="Back">
            ${renderIconHtml("arrow-left", "pixel-icon--xs")}
          </button>
          <button type="button" class="button browser-app__nav-btn" data-action="browser-forward" data-window-id="${window.id}" aria-label="Forward">
            ${renderIconHtml("arrow-right", "pixel-icon--xs")}
          </button>
          <button type="button" class="button browser-app__nav-btn" data-action="browser-refresh" data-window-id="${window.id}" aria-label="Refresh">
            ${renderIconHtml("reload", "pixel-icon--xs")}
          </button>
        </div>
        <input type="text" class="browser-app__address" id="browser-address-${window.id}" value="${escapeHtml(browserState.url)}" data-window-id="${window.id}" />
        <button type="button" class="button" data-action="browser-go" data-window-id="${window.id}">
          ${renderIconHtml("search", "pixel-icon--xs")}
          <span>Go</span>
        </button>
      </header>
      
      <div class="browser-app__content">
        ${content}
      </div>
      
      <footer class="browser-app__status">
        <span>Zone: Local Sandbox (Safe Mode)</span>
        <span class="browser-app__status-sep">|</span>
        <span>Secure: Yes</span>
      </footer>
    </div>
  `;
}

function renderMockWebsiteContent(url) {
  const normUrl = url.toLowerCase().trim();
  
  if (normUrl.includes("welcome") || normUrl === "vibe://welcome") {
    return `
      <div class="web-page web-page--welcome">
        <h1>Welcome to Vibe OS!</h1>
        <p class="web-page__lead">A simulated 16-bit browser workspace running inside a window manager.</p>
        <div class="web-page__card">
          <h3>Featured Components</h3>
          <ul>
            <li><strong>App Forge Launcher:</strong> Generate fully active apps like Pomodoro timers or calculators directly from natural prompts.</li>
            <li><strong>Draggable Windows:</strong> Full multitasking z-order window manager built in pure ES Modules.</li>
            <li><strong>State Persistence:</strong> Your layout, tasks, notepad, and dashboard metrics automatically sync to <code>localStorage</code>.</li>
          </ul>
        </div>
        <p>Type other addresses like <code>google.com</code>, <code>github.com</code>, or <code>linkedin.com</code> in the browser bar above to test safe simulated web renders!</p>
      </div>
    `;
  }
  
  if (normUrl.includes("github.com")) {
    return `
      <div class="web-page web-page--github">
        <header class="web-page__github-header">
          <div class="web-page__github-avatar">${portfolio.name[0]}</div>
          <div>
            <h2>${escapeHtml(portfolio.name)}</h2>
            <p>@yourname • ${escapeHtml(portfolio.role)}</p>
          </div>
        </header>
        <div class="web-page__github-stats">
          <span><strong>124</strong> followers</span> • <span><strong>12</strong> following</span> • <span><strong>48</strong> stars</span>
        </div>
        <h3>Popular Repositories</h3>
        <div class="web-page__github-grid">
          ${portfolio.projects.map(p => `
            <div class="web-page__github-repo">
              <h4><a href="#" onclick="return false;">${escapeHtml(p.title)}</a></h4>
              <p>${escapeHtml(p.description)}</p>
              <div class="web-page__github-repo-meta">
                <span class="web-page__github-lang"><span style="color:#f1e05a">●</span> JS</span>
                <span>★ 38</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (normUrl.includes("linkedin.com")) {
    return `
      <div class="web-page web-page--linkedin">
        <div class="web-page__linkedin-banner"></div>
        <div class="web-page__linkedin-profile">
          <div class="web-page__linkedin-avatar">${portfolio.name[0]}</div>
          <h2>${escapeHtml(portfolio.name)}</h2>
          <p class="web-page__linkedin-title">${escapeHtml(portfolio.role)}</p>
          <p class="web-page__linkedin-loc">${escapeHtml(portfolio.location)} • <a href="#" onclick="return false;">Contact info</a></p>
          <div style="display:flex;gap:6px;">
            <button class="button" style="height:26px;font-size:11px;">Connect</button>
            <button class="button button--ghost" style="height:26px;font-size:11px;">Message</button>
          </div>
        </div>
        <div class="web-page__linkedin-section">
          <h3>About</h3>
          <p>${escapeHtml(portfolio.about.summary)}</p>
        </div>
        <div class="web-page__linkedin-section">
          <h3>Experience</h3>
          ${portfolio.experience.map(exp => `
            <div class="web-page__linkedin-exp">
              <h4 style="margin:0 0 2px;">${escapeHtml(exp.role)}</h4>
              <h5 style="margin:0 0 2px;color:var(--muted);">${escapeHtml(exp.company)}</h5>
              <p class="web-page__linkedin-period" style="margin:0 0 4px;font-size:10px;color:var(--muted);">${escapeHtml(exp.period)}</p>
              <p style="margin:0;font-size:11px;">${escapeHtml(exp.details)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (normUrl.includes("google.com")) {
    return `
      <div class="web-page web-page--google">
        <h1 class="web-page__google-logo"><span>G</span><span>o</span><span>o</span><span>g</span><span>l</span><span>e</span></h1>
        <div class="web-page__google-search">
          <input type="text" class="web-page__google-input" placeholder="Search Google or type a URL" value="${escapeHtml(portfolio.name)}" />
          <div class="web-page__google-btns">
            <button class="button">Google Search</button>
            <button class="button button--ghost">I'm Feeling Lucky</button>
          </div>
        </div>
        <div class="web-page__google-results">
          <h3>Search Results for: <em>${escapeHtml(portfolio.name)}</em></h3>
          <div class="web-page__google-result">
            <h4><a href="#" onclick="return false;">${escapeHtml(portfolio.name)} - ${escapeHtml(portfolio.role)}</a></h4>
            <p>${escapeHtml(portfolio.about.summary)}</p>
          </div>
          <div class="web-page__google-result">
            <h4><a href="#" onclick="return false;">Portfolio Selected Projects</a></h4>
            <p>${portfolio.projects.map(p => p.title).join(" • ")}</p>
          </div>
        </div>
      </div>
    `;
  }

  const secureUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
  return `
    <div class="web-page web-page--iframe-container">
      <div class="web-page__iframe-alert">
        <p>⚠️ Sandbox Viewport. If page is blank, frame loading is blocked. Try visiting <a href="${escapeHtml(secureUrl)}" target="_blank">the site directly</a>.</p>
      </div>
      <iframe src="${escapeHtml(secureUrl)}" class="web-page__iframe" sandbox="allow-scripts allow-forms"></iframe>
    </div>
  `;
}

// Logic Helpers
function evaluateExpression(expr) {
  try {
    if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
      return "Error";
    }
    const result = new Function(`return (${expr})`)();
    if (result === undefined || Number.isNaN(result) || !Number.isFinite(result)) {
      return "Error";
    }
    return String(Number(result.toFixed(8)));
  } catch {
    return "Error";
  }
}

function playTimerAlert() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.15);
    
    gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch (err) {
    console.warn("Audio Context blocked or unsupported.", err);
  }
}

// Custom App DOM Updaters
function updateTimerDOM(windowId) {
  const timerWindow = app.querySelector(`[data-window-id="${windowId}"]`);
  if (!timerWindow) return;
  const timerState = state.appStates.timer;
  const mins = Math.floor(timerState.timeRemaining / 60);
  const secs = timerState.timeRemaining % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const progressPercent = ((timerState.duration - timerState.timeRemaining) / timerState.duration) * 100;
  
  const clockElement = timerWindow.querySelector(".timer-app__clock");
  if (clockElement) clockElement.textContent = timeStr;
  
  const fillElement = timerWindow.querySelector(".timer-app__progress-fill");
  if (fillElement) fillElement.style.width = `${progressPercent}%`;
  
  const toggleBtn = timerWindow.querySelector("[data-action='toggle-timer']");
  if (toggleBtn) toggleBtn.textContent = timerState.isRunning ? 'Pause' : 'Start';
}

function updateDashboardDOM(windowId) {
  const dashWindow = app.querySelector(`[data-window-id="${windowId}"]`);
  if (!dashWindow) return;
  const dashState = state.appStates.dashboard;
  
  const metrics = dashWindow.querySelectorAll(".dash-metric .stat-card__value");
  if (metrics.length >= 3) {
    metrics[0].textContent = `${dashState.traffic} req/s`;
    metrics[1].textContent = `${dashState.cpu}%`;
    metrics[2].textContent = `${dashState.memory}%`;
  }
  
  const bars = dashWindow.querySelectorAll(".dash-chart__bar-fill");
  bars.forEach((bar, i) => {
    const seed = (i * 17) % 23;
    const height = Math.min(Math.max((dashState.traffic * 0.7) + (dashState.cpu * 0.3) + seed - 10, 10), 100);
    bar.style.height = `${height}%`;
    bar.title = `Bar ${i+1}: ${Math.round(height)}%`;
  });
  
  const logsList = dashWindow.querySelector(".dash-logs__list");
  if (logsList) {
    logsList.innerHTML = dashState.logs.slice(-6).map(log => `
      <div class="dash-logs__item">${escapeHtml(log)}</div>
    `).join("");
    logsList.scrollTop = logsList.scrollHeight;
  }
}

function updateTodoDOM(windowId) {
  const todoWindow = app.querySelector(`[data-window-id="${windowId}"]`);
  if (!todoWindow) return;
  const todoState = state.appStates.todo;
  const filter = todoState.filter || "all";
  
  const filteredList = todoState.list.filter(item => {
    if (filter === "active") return !item.completed;
    if (filter === "completed") return item.completed;
    return true;
  });

  const todoItems = filteredList.map(item => `
    <li class="todo-app__item ${item.completed ? 'is-completed' : ''}" data-todo-id="${item.id}" data-window-id="${windowId}">
      <input type="checkbox" class="todo-app__checkbox" data-action="toggle-todo" data-todo-id="${item.id}" data-window-id="${windowId}" ${item.completed ? 'checked' : ''} />
      <span class="todo-app__text">${escapeHtml(item.text)}</span>
      <button type="button" class="todo-app__delete" data-action="delete-todo" data-todo-id="${item.id}" data-window-id="${windowId}">×</button>
    </li>
  `).join("");

  const listElement = todoWindow.querySelector(".todo-app__list");
  if (listElement) listElement.innerHTML = todoItems || '<li class="todo-app__empty">No tasks here!</li>';
  
  const countElement = todoWindow.querySelector(".todo-app__count");
  if (countElement) countElement.textContent = `${todoState.list.filter(t => !t.completed).length} items left`;
  
  todoWindow.querySelectorAll(".todo-app__filter-btn").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.filter === filter);
  });
}

function updateChatDOM(windowId) {
  const chatWindow = app.querySelector(`[data-window-id="${windowId}"]`);
  if (!chatWindow) return;
  const chatState = state.appStates.chat;
  const history = chatWindow.querySelector(".chat-app__history");
  if (!history) return;
  
  const typInd = history.querySelector(".chat-app__typing-indicator");
  const msgItems = chatState.messages.map(msg => `
    <div class="chat-app__msg chat-app__msg--${msg.sender === 'user' ? 'outgoing' : 'incoming'}">
      <div class="chat-app__msg-bubble">${escapeHtml(msg.text)}</div>
    </div>
  `).join("");
  
  history.innerHTML = msgItems;
  if (typInd) {
    history.appendChild(typInd);
  }
  history.scrollTop = history.scrollHeight;
}

function updateNotepadSidebar(windowId) {
  const notesState = state.appStates.notes;
  const sidebar = app.querySelector(`[data-window-id="${windowId}"] .notes-app__list`);
  if (!sidebar) return;
  
  sidebar.innerHTML = notesState.list.map(note => `
    <button type="button" class="notes-app__sidebar-item ${note.id === notesState.activeNoteId ? 'is-active' : ''}" data-action="select-note" data-note-id="${note.id}" data-window-id="${windowId}">
      <span class="notes-app__item-title">${escapeHtml(note.title || 'Untitled')}</span>
    </button>
  `).join("") || '<p class="notes-app__empty">No notes</p>';
}

function saveCurrentNotepadContent(windowId) {
  const activeNoteId = state.appStates.notes.activeNoteId;
  if (!activeNoteId) return;
  const titleEl = app.querySelector(`#note-title-${windowId}`);
  const contentEl = app.querySelector(`#note-content-${windowId}`);
  const note = state.appStates.notes.list.find(n => n.id === activeNoteId);
  if (note) {
    if (titleEl) note.title = titleEl.value.trim() || "Untitled";
    if (contentEl) note.content = contentEl.value;
  }
  persistState();
}

function navigateBrowser(url, windowId) {
  if (!url) return;
  const browserState = state.appStates.browser;
  let targetUrl = url.trim();
  if (!targetUrl.startsWith("vibe://") && !targetUrl.includes(".") && !targetUrl.startsWith("http")) {
    targetUrl = `https://www.google.com/search?q=${encodeURIComponent(targetUrl)}`;
  }
  browserState.url = targetUrl;
  if (browserState.history[browserState.history.length - 1] !== targetUrl) {
    browserState.history.push(targetUrl);
    if (browserState.history.length > 20) browserState.history.shift();
  }
  const input = app.querySelector(`#browser-address-${windowId}`);
  if (input) input.value = targetUrl;
  updateBrowserDOM(windowId);
  persistState();
}

function updateBrowserDOM(windowId) {
  const browserWindow = app.querySelector(`[data-window-id="${windowId}"]`);
  if (!browserWindow) return;
  const browserState = state.appStates.browser;
  const contentEl = browserWindow.querySelector(".browser-app__content");
  if (contentEl) {
    contentEl.innerHTML = renderMockWebsiteContent(browserState.url);
  }
}

function generateBotReply(message) {
  const text = message.toLowerCase().trim();
  if (text.includes("help") || text.includes("command") || text.includes("menu")) {
    return "Ask me about 'skills', 'experience', 'projects', 'contact' or 'resume'. Or generate apps in the desktop launcher by typing e.g. 'notes app'.";
  }
  if (text.includes("skill") || text.includes("stack") || text.includes("tech") || text.includes("language")) {
    return `Skills: ${portfolio.about.highlights.join(" | ")}. Focused on Frontend engineering & UI design.`;
  }
  if (text.includes("project") || text.includes("portfolio")) {
    return `Projects:\n` + portfolio.projects.map(p => `• ${p.title}: ${p.description}`).join("\n");
  }
  if (text.includes("experience") || text.includes("job") || text.includes("career")) {
    return `Experience:\n` + portfolio.experience.map(e => `• ${e.role} at ${e.company} (${e.period})`).join("\n");
  }
  if (text.includes("contact") || text.includes("email") || text.includes("reach") || text.includes("github") || text.includes("linkedin")) {
    return `Contact details:\n• Email: ${portfolio.contact.fields[0].value}\n• GitHub: ${portfolio.contact.fields[1].value}\n• LinkedIn: ${portfolio.contact.fields[2].value}`;
  }
  if (text.includes("resume") || text.includes("cv")) {
    return `Resume Info: ${portfolio.resume.summary}\n` + portfolio.resume.bullets.map(b => `• ${b}`).join("\n");
  }
  if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
    return `Hello! I'm the portfolio assistant. Let me know if you want to query skills, experience, projects, or contact info!`;
  }
  return "I'm not sure. Try asking about 'skills', 'experience', 'projects', or type 'calculator' in the launcher to spin up a math window!";
}

function handleCalculatorInput(key, windowId) {
  const calcState = state.appStates.calculator;
  const displayEl = app.querySelector(`#calc-display-${windowId}`);
  
  if (key === "C") {
    calcState.display = "0";
    calcState.expression = "";
    calcState.resetOnNext = false;
  } else if (key === "Backspace") {
    if (calcState.display.length > 1) {
      calcState.display = calcState.display.slice(0, -1);
      calcState.expression = calcState.expression.slice(0, -1);
    } else {
      calcState.display = "0";
      calcState.expression = "";
    }
  } else if (key === "=") {
    const result = evaluateExpression(calcState.expression || calcState.display);
    calcState.display = result;
    calcState.expression = result === "Error" ? "" : result;
    calcState.resetOnNext = true;
  } else {
    const isOp = ["+", "-", "*", "/"].includes(key);
    if (calcState.resetOnNext) {
      if (isOp) {
        calcState.expression = calcState.display + key;
        calcState.display = calcState.display + key;
      } else {
        calcState.expression = key;
        calcState.display = key;
      }
      calcState.resetOnNext = false;
    } else {
      if (calcState.display === "0" && !isOp && key !== ".") {
        calcState.display = key;
        calcState.expression = key;
      } else {
        calcState.display += key;
        calcState.expression += key;
      }
    }
  }
  if (displayEl) {
    displayEl.textContent = calcState.display;
  }
  persistState();
}

function renderStartMenu() {
  return `
    <aside class="start-menu ${state.startMenuOpen ? "is-open" : ""}" aria-label="Start menu">
      <div class="start-menu__header">
        <strong>${escapeHtml(portfolio.name)}</strong>
        <span>${escapeHtml(portfolio.role)}</span>
      </div>
      <div class="start-menu__items">
        ${portfolio.startMenu
          .map(
            (item) => `
              <button type="button" class="start-menu__item" data-action="open-window" data-target="${item.id}">
                ${renderIconHtml(item.icon, "pixel-icon--sm start-menu__icon")}
                <span>${escapeHtml(item.label)}</span>
              </button>
            `,
          )
          .join("")}
      </div>
      <div class="start-menu__footer">
        <button type="button" class="start-menu__item" data-action="reset-layout">
          ${renderIconHtml("reload", "pixel-icon--sm start-menu__icon")}
          <span>Reset Desktop</span>
        </button>
        <button type="button" class="start-menu__item" data-action="minimize-all">
          ${renderIconHtml("minus", "pixel-icon--sm start-menu__icon")}
          <span>Minimize All</span>
        </button>
      </div>
    </aside>
  `;
}

function renderBootScreen() {
  return `
    <div class="boot-screen" aria-hidden="true">
      <div class="boot-screen__card">
        <div class="boot-screen__logo">VIBE OS</div>
        <div class="boot-screen__bar"><span></span></div>
        <p>Loading retro workspace...</p>
      </div>
    </div>
  `;
}

function focusLauncher() {
  app.querySelector(".launcher__input")?.focus({ preventScroll: true });
}

function syncDynamicDom() {
  getAllWindows().forEach((window) => {
    const winState = state.windows[window.id];
    const element = app.querySelector(`[data-window-id="${window.id}"]`);
    if (!element) {
      return;
    }

    element.classList.toggle("is-active", state.activeWindowId === window.id && !winState.minimized);
    element.classList.toggle("is-minimized", winState.minimized);
    element.style.left = `${winState.x}px`;
    element.style.top = `${winState.y}px`;
    element.style.width = `${winState.width}px`;
    element.style.height = `${winState.height}px`;
    element.style.zIndex = String(winState.zIndex);
  });

  app.querySelectorAll(".taskbar__window").forEach((button) => {
    const target = button.dataset.target;
    const winState = state.windows[target];
    button.classList.toggle("is-active", state.activeWindowId === target && !!winState && !winState.minimized);
  });

  const startButton = app.querySelector(".taskbar__start");
  if (startButton) {
    startButton.setAttribute("aria-expanded", String(state.startMenuOpen));
  }

  const startMenu = app.querySelector(".start-menu");
  if (startMenu) {
    startMenu.classList.toggle("is-open", state.startMenuOpen);
  }

  persistState();
}

function registerGeneratedWindow(manifest) {
  const index = state.generatedWindows.length;
  const windowDef = {
    id: manifest.id,
    kind: manifest.kind,
    type: "generated",
    label: manifest.title,
    title: manifest.title,
    glyph: manifest.icon,
    summary: manifest.summary,
    accent: manifest.accent,
    accentHi: manifest.accentHi,
    prompt: manifest.prompt,
    tags: manifest.tags,
    window: manifest.window,
    panels: manifest.panels,
    actions: manifest.actions,
    notes: manifest.notes,
    html: manifest.html || "",
    css: manifest.css || "",
    js: manifest.js || "",
    x: 120 + index * 24,
    y: 110 + index * 18,
    width: manifest.window.width,
    height: manifest.window.height,
    openByDefault: true,
  };

  state.generatedWindows = [...state.generatedWindows, windowDef];
  state.windows[windowDef.id] = {
    open: true,
    minimized: false,
    x: windowDef.x,
    y: windowDef.y,
    width: windowDef.width,
    height: windowDef.height,
    zIndex: ++state.zCounter,
  };
  state.activeWindowId = windowDef.id;
  state.startMenuOpen = false;
  state.launcherQuery = "";
  render();
}

function renderDynamicCustomApp(windowDef) {
  if (windowDef.css) {
    const styleId = `style-${windowDef.id}`;
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.textContent = windowDef.css.replace(/\{\{ID\}\}/g, windowDef.id);
      document.head.appendChild(styleEl);
    }
  }

  requestAnimationFrame(() => {
    runDynamicCustomAppScript(windowDef);
  });

  return `
    <div class="dynamic-custom-app" data-app-root="${windowDef.id}">
      ${windowDef.html}
    </div>
  `;
}

function runDynamicCustomAppScript(windowDef) {
  const container = app.querySelector(`[data-window-id="${windowDef.id}"]`);
  if (!container) return;

  if (container.dataset.scriptInitialized === "true") return;
  container.dataset.scriptInitialized = "true";

  if (windowDef.js) {
    try {
      const scriptFunc = new Function("container", "state", windowDef.js);
      scriptFunc(container, state);
    } catch (err) {
      console.error(`Error in generated app script (${windowDef.title}):`, err);
      const errEl = container.querySelector(".dynamic-custom-app");
      if (errEl) {
        errEl.innerHTML += `
          <div style="margin-top:10px;padding:8px;background:#fde8e8;border:1px solid #f8b4b4;color:#9b1c1c;font-size:11px;">
            <strong>Script Error:</strong> ${escapeHtml(err.message)}
          </div>
        `;
      }
    }
  }
}

const GENERAL_LOGS = [
  "[sandbox] Fetching repository template for \"{{QUERY}}\"...",
  "[sandbox] Resolving dependencies and loading retro CSS variables...",
  "[compiler] Bundling interface widgets and retro-card templates...",
  "[compiler] Linking standard styles and event hooks...",
  "[compiler] Checking JS runtime sandbox integrity...",
  "[compiler] Injecting dynamic window controls...",
  "[linker] Bundling components to standard canvas frame...",
  "[system] Sandbox container environment verified.",
  "[system] Compiling static assets and offline scripts...",
  "[system] Sandboxed application compiled successfully! Booting..."
];

const PROD_CONS_LOGS = [
  "[sandbox] Fetching git:github.com/retro-sys/cpp-producer-consumer...",
  "[sandbox] Resolution complete. Found main.cpp, buffer.hpp, queue.hpp.",
  "[compiler] g++ -std=c++20 -O3 -pthread main.cpp -o producer_consumer",
  "[compiler] Resolving systems headers: <thread>, <mutex>, <condition_variable>",
  "[compiler] Compiling buffer queue memory allocator...",
  "[compiler] Linking static thread library...",
  "[linker] Executable compiled successfully (1.4MB).",
  "[loader] Instantiating POSIX thread pool and circular buffer...",
  "[loader] Spawning worker threads (TID: 0x7f02, 0x7f03)...",
  "[system] Producer-Consumer C++ simulation initialized! Booting..."
];

function showAppCompiler(query) {
  state.generatedWindows = state.generatedWindows.filter(w => w.id !== "app-compiler");
  
  const loaderManifest = {
    id: "app-compiler",
    kind: "custom",
    title: "App Compiler",
    icon: "⚙",
    summary: "Compiling code for your custom request...",
    accent: "#555555",
    accentHi: "#888888",
    prompt: query,
    tags: ["compiler", "forge", "loading"],
    window: { width: 460, height: 260 },
    html: `
      <div class="compiler-progress" style="padding: 10px; display: flex; flex-direction: column; gap: 8px; height: 100%; box-sizing: border-box;">
        <p style="margin: 0; font-size: 12px; font-weight: bold;">Compiling dynamic container: <em>\${escapeHtml(query)}</em></p>
        <div class="retro-terminal" id="compiler-terminal" style="flex: 1; min-height: 140px; max-height: 180px;">
          <p class="retro-log-line">[SYSTEM] Initializing compilation context...</p>
        </div>
        <div class="boot-screen__bar" style="width: 100%; height: 12px; margin-top: 4px; border: 2px solid #111; border-radius: 4px; background: #fff; overflow: hidden;">
          <span id="compiler-progress-bar" style="width: 0%; height: 100%; display: block; background: linear-gradient(90deg, var(--accent), var(--accent-hi, #ff69b4)); animation: none; transition: width 0.2s ease-in-out;"></span>
        </div>
      </div>
    `,
    css: ``,
    js: ``,
    panels: [],
    actions: [],
    notes: []
  };

  registerGeneratedWindow(loaderManifest);
}

function runCompilationLogs(query, onComplete) {
  const terminal = app.querySelector("#compiler-terminal");
  const progressBar = app.querySelector("#compiler-progress-bar");
  if (!terminal) {
    onComplete();
    return;
  }

  const isProdCons = query.toLowerCase().includes("producer") && query.toLowerCase().includes("consumer");
  const logs = isProdCons ? PROD_CONS_LOGS : GENERAL_LOGS;
  
  let currentStep = 0;
  const totalSteps = logs.length;
  const intervalTime = 4200 / totalSteps; // exactly 4.2 seconds total

  // Clear existing terminal logs if any
  terminal.innerHTML = "";

  function addLogLine() {
    if (currentStep < totalSteps) {
      const lineText = logs[currentStep].replace("{{QUERY}}", query);
      const p = document.createElement("p");
      p.className = "retro-log-line";
      p.textContent = lineText;
      terminal.appendChild(p);
      terminal.scrollTop = terminal.scrollHeight;

      // Update progress bar
      if (progressBar) {
        const percent = Math.round(((currentStep + 1) / totalSteps) * 100);
        progressBar.style.width = `\${percent}%`;
      }

      currentStep++;
      setTimeout(addLogLine, intervalTime);
    } else {
      onComplete();
    }
  }

  addLogLine();
}

function generateAppFromBackend(query) {
  showAppCompiler(query);
  
  let compiledPromiseResolve;
  const compiledPromise = new Promise((resolve) => {
    compiledPromiseResolve = resolve;
  });

  // Start the 4.2s compilation log sequence
  runCompilationLogs(query, () => {
    compiledPromiseResolve();
  });

  // Start the actual fetch call in parallel
  const fetchPromise = fetch("/api/forge", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: query })
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(err => { throw new Error(err.error || `Server responded with \${res.status}`); });
    }
    return res.json();
  });

  // Combine both promises. When both are done, register the window!
  Promise.all([fetchPromise, compiledPromise])
    .then(([manifest]) => {
      closeWindow("app-compiler");
      state.generatedWindows = state.generatedWindows.filter(w => w.id !== "app-compiler");
      
      const title = manifest.title || "Custom App";
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 32);
      manifest.id = `gen-\${slug}-\${Date.now().toString(36)}`;
      manifest.prompt = query;
      if (!manifest.notes) manifest.notes = [];
      manifest.notes.push("Generated by Gemini 2.5 Flash on the fly.");
      
      registerGeneratedWindow(manifest);
    })
    .catch(err => {
      console.warn("App Forge generation failed, falling back to local simulation:", err.message);
      
      // Wait for compilation logs to finish if they haven't yet
      compiledPromise.then(() => {
        const statusEl = app.querySelector("#compiler-terminal");
        if (statusEl) {
          const p = document.createElement("p");
          p.className = "retro-log-line";
          p.style.color = "#ff3939";
          p.textContent = `[error] Connection failed: \${err.message}. Initializing local compiler fallback...`;
          statusEl.appendChild(p);
          statusEl.scrollTop = statusEl.scrollHeight;
        }
        
        window.setTimeout(() => {
          closeWindow("app-compiler");
          state.generatedWindows = state.generatedWindows.filter(w => w.id !== "app-compiler");
          
          const manifest = buildGeneratedApp(query, state.generatedWindows.length);
          if (!manifest.notes) manifest.notes = [];
          manifest.notes.push(`Gemini API key check failed: \${err.message}`);
          manifest.notes.push("Compiled via offline fallback heuristics generator.");
          
          registerGeneratedWindow(manifest);
        }, 1200);
      });
    });
}

function launchFromQuery(query) {
  const trimmed = query.trim();
  if (!trimmed) {
    return;
  }

  const existingWindow = getAllWindows().find((window) => window.title.toLowerCase().includes(trimmed.toLowerCase()) || window.label.toLowerCase().includes(trimmed.toLowerCase()));
  state.launcherQuery = "";
  if (existingWindow) {
    openWindow(existingWindow.id);
    return;
  }

  generateAppFromBackend(trimmed);
}

function openWindow(id) {
  const window = getWindowDefinition(id);
  const winState = state.windows[id];
  if (!window || !winState) {
    return;
  }

  if (winState.open) {
    winState.minimized = false;
    winState.zIndex = ++state.zCounter;
    state.activeWindowId = id;
    state.startMenuOpen = false;
    syncDynamicDom();
    return;
  }

  winState.open = true;
  winState.minimized = false;
  winState.zIndex = ++state.zCounter;
  state.activeWindowId = id;
  state.startMenuOpen = false;
  render();
}

function closeWindow(id) {
  const window = getWindowDefinition(id);
  const winState = state.windows[id];
  if (!window || !winState) {
    return;
  }

  winState.open = false;
  winState.minimized = false;
  winState.zIndex = 0;
  state.activeWindowId = getAllWindows().find((entry) => state.windows[entry.id]?.open)?.id ?? "";
  state.startMenuOpen = false;
  render();
}

function focusWindow(id) {
  const winState = state.windows[id];
  if (!winState || !winState.open) {
    return;
  }

  winState.minimized = false;
  winState.zIndex = ++state.zCounter;
  state.activeWindowId = id;
  syncDynamicDom();
}

function minimizeWindow(id) {
  const winState = state.windows[id];
  if (!winState || !winState.open) {
    return;
  }

  winState.minimized = true;
  state.activeWindowId = getAllWindows().find((entry) => state.windows[entry.id]?.open && !state.windows[entry.id].minimized)?.id ?? "";
  syncDynamicDom();
}

function minimizeAll() {
  getAllWindows().forEach((window) => {
    if (state.windows[window.id].open) {
      state.windows[window.id].minimized = true;
    }
  });
  state.activeWindowId = "";
  state.startMenuOpen = false;
  syncDynamicDom();
}

function toggleStartMenu() {
  state.startMenuOpen = !state.startMenuOpen;
  syncDynamicDom();
}

function resetLayout() {
  const defaults = createDefaultState();
  state.startMenuOpen = defaults.startMenuOpen;
  state.activeWindowId = defaults.activeWindowId;
  state.zCounter = defaults.zCounter;
  state.windows = defaults.windows;
  state.generatedWindows = [];
  state.launcherQuery = "";
  state.drag = null;
  render();
}

function clampWindowsToViewport() {
  const maxWidth = Math.max(window.innerWidth - 80, 320);
  const maxHeight = Math.max(window.innerHeight - 120, 240);

  getAllWindows().forEach((windowDef) => {
    const winState = state.windows[windowDef.id];
    if (!winState.open) {
      return;
    }

    winState.x = Math.min(winState.x, maxWidth - 40);
    winState.y = Math.min(winState.y, maxHeight - 40);
  });

  syncDynamicDom();
}

function updateClock() {
  state.clock = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const clock = app.querySelector(".taskbar__clock");
  if (clock) {
    clock.textContent = state.clock;
  }
}

function startDrag(event) {
  const handle = event.target.closest("[data-drag-handle]");
  if (!handle || event.target.closest(".window__controls") || event.target.closest("[data-action]") || window.innerWidth < 900) {
    return;
  }

  const windowId = handle.dataset.windowId;
  const winState = state.windows[windowId];
  if (!winState || !winState.open) {
    return;
  }

  const windowElement = app.querySelector(`[data-window-id="${windowId}"]`);
  if (!windowElement) {
    return;
  }

  state.activeWindowId = windowId;
  winState.zIndex = ++state.zCounter;
  const rect = windowElement.getBoundingClientRect();
  state.drag = {
    windowId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
  };

  windowElement.classList.add("is-dragging");
  
  try {
    handle.setPointerCapture(event.pointerId);
  } catch (err) {
    console.warn("Pointer capture failed:", err);
  }
  
  event.preventDefault();
}

function handlePointerMove(event) {
  if (!state.drag) {
    return;
  }

  const winState = state.windows[state.drag.windowId];
  const windowElement = app.querySelector(`[data-window-id="${state.drag.windowId}"]`);
  if (!winState || !windowElement) {
    return;
  }

  const maxX = Math.max(window.innerWidth - winState.width - 24, 24);
  const maxY = Math.max(window.innerHeight - winState.height - 72, 24);
  winState.x = Math.max(24, Math.min(event.clientX - state.drag.offsetX, maxX));
  winState.y = Math.max(24, Math.min(event.clientY - state.drag.offsetY, maxY));
  windowElement.style.left = `${winState.x}px`;
  windowElement.style.top = `${winState.y}px`;
}

function handlePointerUp(event) {
  if (!state.drag) {
    return;
  }

  const windowElement = app.querySelector(`[data-window-id="${state.drag.windowId}"]`);
  const handle = windowElement?.querySelector("[data-drag-handle]");
  if (handle && event && typeof event.pointerId === "number") {
    try {
      handle.releasePointerCapture(event.pointerId);
    } catch (err) {
      console.warn("Release pointer capture failed:", err);
    }
  }

  windowElement?.classList.remove("is-dragging");
  state.drag = null;
  persistState();
}

function handleFormSubmit(event) {
  const launcherForm = event.target.closest("[data-launcher-form]");
  if (launcherForm) {
    event.preventDefault();
    const data = new FormData(launcherForm);
    const query = String(data.get("query") ?? "").trim();
    if (!query) {
      return;
    }

    state.launcherQuery = query;
    const suggestionsContainer = app.querySelector("#launcher-suggestions");
    if (suggestionsContainer) {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
    }
    launchFromQuery(query);
    return;
  }

  // Todo Form Submit
  const todoForm = event.target.closest("[data-action='add-todo-form']");
  if (todoForm) {
    event.preventDefault();
    const windowId = todoForm.dataset.windowId;
    const input = todoForm.querySelector(".todo-app__input");
    if (!input) return;
    const text = input.value.trim();
    if (text) {
      state.appStates.todo.list.push({ id: Date.now(), text, completed: false });
      input.value = "";
      updateTodoDOM(windowId);
      persistState();
    }
    return;
  }

  // Chat Form Submit
  const chatForm = event.target.closest("[data-action='send-chat-form']");
  if (chatForm) {
    event.preventDefault();
    const windowId = chatForm.dataset.windowId;
    const input = chatForm.querySelector(".chat-app__input");
    if (!input) return;
    const userText = input.value.trim();
    if (!userText) return;
    
    state.appStates.chat.messages.push({ sender: "user", text: userText });
    input.value = "";
    updateChatDOM(windowId);
    persistState();
    
    const chatWindow = app.querySelector(`[data-window-id="${windowId}"]`);
    const typInd = chatWindow ? chatWindow.querySelector(".chat-app__typing-indicator") : null;
    if (typInd) {
      typInd.style.display = "flex";
      const history = chatWindow.querySelector(".chat-app__history");
      if (history) history.scrollTop = history.scrollHeight;
    }
    
    window.setTimeout(() => {
      if (typInd) typInd.style.display = "none";
      const replyText = generateBotReply(userText);
      state.appStates.chat.messages.push({ sender: "assistant", text: replyText });
      updateChatDOM(windowId);
      persistState();
    }, 600 + Math.random() * 600);
    return;
  }

  const form = event.target.closest("[data-contact-form]");
  if (!form) {
    return;
  }

  event.preventDefault();
  const data = new FormData(form);
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();
  const status = form.querySelector("[data-form-status]");

  if (!name || !email || !message) {
    if (status) {
      status.textContent = "Fill in name, email, and message first.";
    }
    return;
  }

  const subject = encodeURIComponent(`Portfolio note from ${name}`);
  const body = encodeURIComponent(`${message}\n\nFrom: ${name} <${email}>`);
  window.location.href = `mailto:${portfolio.email}?subject=${subject}&body=${body}`;
  if (status) {
    status.textContent = "Opening your mail app...";
  }
}

function copyEmail() {
  const status = app.querySelector("[data-form-status]");
  if (!navigator.clipboard?.writeText) {
    if (status) {
      status.textContent = `Email: ${portfolio.email}`;
    }
    return;
  }

  navigator.clipboard.writeText(portfolio.email).then(() => {
    if (status) {
      status.textContent = "Email copied to clipboard.";
    }
  });
}

function handleClick(event) {
  // Close suggestions if clicked outside the launcher field
  if (!event.target.closest(".launcher__field")) {
    const suggestionsContainer = app.querySelector("#launcher-suggestions");
    if (suggestionsContainer) {
      suggestionsContainer.style.display = "none";
      suggestionsContainer.innerHTML = "";
    }
  }

  // Set theme click
  const setThemeBtn = event.target.closest("[data-action='set-theme']");
  if (setThemeBtn) {
    const themeName = setThemeBtn.dataset.theme;
    applyTheme(themeName);
    return;
  }

  // Calculator key click
  const calcKeyBtn = event.target.closest("[data-calc-key]");
  if (calcKeyBtn) {
    const key = calcKeyBtn.dataset.calcKey;
    const windowFrame = calcKeyBtn.closest("[data-window-id]");
    const windowId = windowFrame ? windowFrame.dataset.windowId : "";
    handleCalculatorInput(key, windowId);
    return;
  }

  // Notepad Select Note
  const selectNoteBtn = event.target.closest("[data-action='select-note']");
  if (selectNoteBtn) {
    const noteId = selectNoteBtn.dataset.noteId;
    const windowId = selectNoteBtn.dataset.windowId;
    saveCurrentNotepadContent(windowId);
    state.appStates.notes.activeNoteId = noteId;
    const notesState = state.appStates.notes;
    const note = notesState.list.find(n => n.id === noteId);
    if (note) {
      const titleEl = app.querySelector(`#note-title-${windowId}`);
      const contentEl = app.querySelector(`#note-content-${windowId}`);
      if (titleEl) titleEl.value = note.title;
      if (contentEl) contentEl.value = note.content;
    }
    updateNotepadSidebar(windowId);
    const deleteBtn = app.querySelector(`[data-window-id="${windowId}"] [data-action="delete-note"]`);
    if (deleteBtn) deleteBtn.disabled = !noteId;
    persistState();
    return;
  }

  // Notepad New Note
  const newNoteBtn = event.target.closest("[data-action='new-note']");
  if (newNoteBtn) {
    const windowId = newNoteBtn.dataset.windowId;
    saveCurrentNotepadContent(windowId);
    const newId = `note-${Date.now()}`;
    state.appStates.notes.list.push({ id: newId, title: "Untitled", content: "" });
    state.appStates.notes.activeNoteId = newId;
    const titleEl = app.querySelector(`#note-title-${windowId}`);
    const contentEl = app.querySelector(`#note-content-${windowId}`);
    if (titleEl) titleEl.value = "Untitled";
    if (contentEl) contentEl.value = "";
    updateNotepadSidebar(windowId);
    const deleteBtn = app.querySelector(`[data-window-id="${windowId}"] [data-action="delete-note"]`);
    if (deleteBtn) deleteBtn.disabled = false;
    persistState();
    return;
  }

  // Notepad Save Note
  const saveNoteBtn = event.target.closest("[data-action='save-note']");
  if (saveNoteBtn) {
    const windowId = saveNoteBtn.dataset.windowId;
    saveCurrentNotepadContent(windowId);
    updateNotepadSidebar(windowId);
    return;
  }

  // Notepad Delete Note
  const deleteNoteBtn = event.target.closest("[data-action='delete-note']");
  if (deleteNoteBtn) {
    const windowId = deleteNoteBtn.dataset.windowId;
    const activeNoteId = state.appStates.notes.activeNoteId;
    if (activeNoteId) {
      state.appStates.notes.list = state.appStates.notes.list.filter(n => n.id !== activeNoteId);
      state.appStates.notes.activeNoteId = state.appStates.notes.list[0]?.id || "";
      const newActive = state.appStates.notes.list[0] || { title: "", content: "" };
      const titleEl = app.querySelector(`#note-title-${windowId}`);
      const contentEl = app.querySelector(`#note-content-${windowId}`);
      if (titleEl) titleEl.value = newActive.title || "";
      if (contentEl) contentEl.value = newActive.content || "";
      updateNotepadSidebar(windowId);
      const deleteBtn = app.querySelector(`[data-window-id="${windowId}"] [data-action="delete-note"]`);
      if (deleteBtn) deleteBtn.disabled = !state.appStates.notes.activeNoteId;
      persistState();
    }
    return;
  }

  // Todo Toggle Completion
  const toggleTodoCheckbox = event.target.closest("[data-action='toggle-todo']");
  if (toggleTodoCheckbox) {
    const todoId = Number(toggleTodoCheckbox.dataset.todoId);
    const windowId = toggleTodoCheckbox.dataset.windowId;
    const todo = state.appStates.todo.list.find(t => t.id === todoId);
    if (todo) {
      todo.completed = toggleTodoCheckbox.checked;
      updateTodoDOM(windowId);
      persistState();
    }
    return;
  }

  // Todo Delete
  const deleteTodoBtn = event.target.closest("[data-action='delete-todo']");
  if (deleteTodoBtn) {
    const todoId = Number(deleteTodoBtn.dataset.todoId);
    const windowId = deleteTodoBtn.dataset.windowId;
    state.appStates.todo.list = state.appStates.todo.list.filter(t => t.id !== todoId);
    updateTodoDOM(windowId);
    persistState();
    return;
  }

  // Todo Filter
  const filterTodoBtn = event.target.closest("[data-action='filter-todo']");
  if (filterTodoBtn) {
    const filter = filterTodoBtn.dataset.filter;
    const windowId = filterTodoBtn.dataset.windowId;
    state.appStates.todo.filter = filter;
    updateTodoDOM(windowId);
    persistState();
    return;
  }

  // Todo Clear Completed
  const clearCompletedBtn = event.target.closest("[data-action='clear-completed-todos']");
  if (clearCompletedBtn) {
    const windowId = clearCompletedBtn.dataset.windowId;
    state.appStates.todo.list = state.appStates.todo.list.filter(t => !t.completed);
    updateTodoDOM(windowId);
    persistState();
    return;
  }

  // Timer Toggle Start/Pause
  const toggleTimerBtn = event.target.closest("[data-action='toggle-timer']");
  if (toggleTimerBtn) {
    const windowId = toggleTimerBtn.dataset.windowId;
    state.appStates.timer.isRunning = !state.appStates.timer.isRunning;
    updateTimerDOM(windowId);
    persistState();
    return;
  }

  // Timer Reset
  const resetTimerBtn = event.target.closest("[data-action='reset-timer']");
  if (resetTimerBtn) {
    const windowId = resetTimerBtn.dataset.windowId;
    const timerState = state.appStates.timer;
    timerState.isRunning = false;
    timerState.timeRemaining = timerState.duration;
    updateTimerDOM(windowId);
    persistState();
    return;
  }

  // Timer Presets
  const presetTimerBtn = event.target.closest("[data-action='preset-timer']");
  if (presetTimerBtn) {
    const windowId = presetTimerBtn.dataset.windowId;
    const preset = presetTimerBtn.dataset.preset;
    const duration = Number(presetTimerBtn.dataset.duration);
    const timerState = state.appStates.timer;
    timerState.isRunning = false;
    timerState.activePreset = preset;
    timerState.duration = duration;
    timerState.timeRemaining = duration;
    updateTimerDOM(windowId);
    persistState();
    return;
  }

  // Dashboard Firewall Checkbox
  const firewallCheckbox = event.target.closest("[data-action='toggle-firewall']");
  if (firewallCheckbox) {
    const windowId = firewallCheckbox.dataset.windowId;
    const dashState = state.appStates.dashboard;
    dashState.firewall = firewallCheckbox.checked;
    dashState.logs.push(`[${new Date().toLocaleTimeString()}] Firewall active: ${dashState.firewall ? 'YES' : 'NO'}`);
    updateDashboardDOM(windowId);
    persistState();
    return;
  }

  // Dashboard CDN Checkbox
  const cdnCheckbox = event.target.closest("[data-action='toggle-cdn']");
  if (cdnCheckbox) {
    const windowId = cdnCheckbox.dataset.windowId;
    const dashState = state.appStates.dashboard;
    dashState.cdn = cdnCheckbox.checked;
    dashState.logs.push(`[${new Date().toLocaleTimeString()}] Edge Cache status: ${dashState.cdn ? 'ENABLED' : 'DISABLED'}`);
    updateDashboardDOM(windowId);
    persistState();
    return;
  }

  // Browser Navigation Go
  const addressGoBtn = event.target.closest("[data-action='browser-go']");
  if (addressGoBtn) {
    const windowId = addressGoBtn.dataset.windowId;
    const input = app.querySelector(`#browser-address-${windowId}`);
    if (input) navigateBrowser(input.value.trim(), windowId);
    return;
  }

  // Browser Navigation Back
  const browserBackBtn = event.target.closest("[data-action='browser-back']");
  if (browserBackBtn) {
    const windowId = browserBackBtn.dataset.windowId;
    const browserState = state.appStates.browser;
    if (browserState.history.length > 1) {
      browserState.history.pop(); // Pop current
      const prev = browserState.history[browserState.history.length - 1];
      browserState.url = prev;
      const input = app.querySelector(`#browser-address-${windowId}`);
      if (input) input.value = prev;
      updateBrowserDOM(windowId);
      persistState();
    }
    return;
  }

  // Browser Navigation Refresh
  const browserRefreshBtn = event.target.closest("[data-action='browser-refresh']");
  if (browserRefreshBtn) {
    const windowId = browserRefreshBtn.dataset.windowId;
    updateBrowserDOM(windowId);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    const action = actionButton.dataset.action;
    const target = actionButton.dataset.target;
    const query = actionButton.dataset.query;

    if (action === "open-window") {
      openWindow(target);
      return;
    }

    if (action === "taskbar-window") {
      const winState = state.windows[target];
      if (!winState?.open) {
        openWindow(target);
      } else if (winState.minimized) {
        focusWindow(target);
      } else if (state.activeWindowId === target) {
        minimizeWindow(target);
      } else {
        focusWindow(target);
      }
      return;
    }

    if (action === "close-window") {
      closeWindow(target);
      return;
    }

    if (action === "minimize-window") {
      minimizeWindow(target);
      return;
    }

    if (action === "toggle-start") {
      toggleStartMenu();
      return;
    }

    if (action === "minimize-all") {
      minimizeAll();
      return;
    }

    if (action === "reset-layout") {
      resetLayout();
      return;
    }

    if (action === "select-suggestion") {
      const input = app.querySelector(".launcher__input");
      if (input) {
        input.value = query;
        state.launcherQuery = query;
      }
      const suggestionsContainer = app.querySelector("#launcher-suggestions");
      if (suggestionsContainer) {
        suggestionsContainer.style.display = "none";
        suggestionsContainer.innerHTML = "";
      }
      launchFromQuery(query);
      return;
    }

    if (action === "launch-example") {
      launchFromQuery(query || "");
      return;
    }

    if (action === "generated-action") {
      const intent = actionButton.dataset.intent;
      if (intent === "open-launcher" || intent === "generate-again") {
        focusLauncher();
        return;
      }

      if (intent === "reset-layout") {
        resetLayout();
        return;
      }
    }

    if (action === "copy-email") {
      copyEmail();
      return;
    }
  }

  const windowFrame = event.target.closest("[data-window-id]");
  if (windowFrame) {
    focusWindow(windowFrame.dataset.windowId);
  }

  if (state.startMenuOpen && !event.target.closest(".start-menu")) {
    state.startMenuOpen = false;
    render();
  }
}

function updateSuggestions(query) {
  const suggestionsContainer = app.querySelector("#launcher-suggestions");
  if (!suggestionsContainer) return;

  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    suggestionsContainer.style.display = "none";
    suggestionsContainer.innerHTML = "";
    return;
  }

  const matches = PLAUSIBLE_PROJECTS.filter(project => 
    project.title.toLowerCase().includes(trimmed) || 
    project.query.toLowerCase().includes(trimmed)
  );

  if (matches.length === 0) {
    suggestionsContainer.style.display = "none";
    suggestionsContainer.innerHTML = "";
    return;
  }

  suggestionsContainer.innerHTML = matches
    .map(project => `
      <button class="launcher__suggestion-item" type="button" data-action="select-suggestion" data-query="\${escapeHtml(project.query)}">
        \${renderIconHtml(project.icon || "code", "launcher__suggestion-icon")}
        <span>\${escapeHtml(project.title)}</span>
      </button>
    `)
    .join("");

  suggestionsContainer.style.display = "flex";
}

function handleInput(event) {
  const trafficSlider = event.target.closest("[data-action='slider-traffic']");
  if (trafficSlider) {
    const windowId = trafficSlider.dataset.windowId;
    const value = Number(trafficSlider.value);
    const dashState = state.appStates.dashboard;
    dashState.traffic = value;
    dashState.cpu = Math.round(Math.min(99, Math.max(1, value * 0.75 + Math.random() * 10)));
    updateDashboardDOM(windowId);
    persistState();
    return;
  }

  const launcherInput = event.target.closest(".launcher__input");
  if (launcherInput) {
    state.launcherQuery = launcherInput.value;
    updateSuggestions(launcherInput.value);
    return;
  }
}

function handleChange(event) {
  const modeSelect = event.target.closest("[data-action='select-mode']");
  if (modeSelect) {
    const windowId = modeSelect.dataset.windowId;
    const mode = modeSelect.value;
    const dashState = state.appStates.dashboard;
    dashState.mode = mode;
    
    if (mode === 'idle') {
      dashState.traffic = 5;
      dashState.cpu = 2;
      dashState.memory = 15;
    } else if (mode === 'normal') {
      dashState.traffic = 45;
      dashState.cpu = 18;
      dashState.memory = 42;
    } else if (mode === 'stress') {
      dashState.traffic = 95;
      dashState.cpu = 88;
      dashState.memory = 84;
    }
    
    dashState.logs.push(`[${new Date().toLocaleTimeString()}] Mode: ${mode.toUpperCase()}`);
    
    const slider = app.querySelector(`[data-window-id="${windowId}"] [data-action="slider-traffic"]`);
    if (slider) slider.value = String(dashState.traffic);
    
    updateDashboardDOM(windowId);
    persistState();
    return;
  }
}

function bindEvents() {
  app.addEventListener("click", handleClick);
  app.addEventListener("submit", handleFormSubmit);
  app.addEventListener("pointerdown", startDrag);
  app.addEventListener("input", handleInput);
  app.addEventListener("change", handleChange);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("resize", clampWindowsToViewport);
  window.addEventListener("keydown", (event) => {
    // Draggable window arrow-key move navigation
    if (event.target.classList.contains("window__titlebar") && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      const windowId = event.target.dataset.windowId;
      const winState = state.windows[windowId];
      if (winState) {
        const step = 20;
        if (event.key === "ArrowUp") winState.y = Math.max(0, winState.y - step);
        if (event.key === "ArrowDown") winState.y = Math.min(window.innerHeight - 80, winState.y + step);
        if (event.key === "ArrowLeft") winState.x = Math.max(0, winState.x - step);
        if (event.key === "ArrowRight") winState.x = Math.min(window.innerWidth - 80, winState.x + step);
        syncDynamicDom();
      }
      return;
    }

    // Browser address bar Enter
    if (event.key === "Enter" && event.target.classList.contains("browser-app__address")) {
      const windowId = event.target.dataset.windowId;
      navigateBrowser(event.target.value.trim(), windowId);
      return;
    }
    
    // Google input search bar Enter
    if (event.key === "Enter" && event.target.classList.contains("web-page__google-input")) {
      const windowFrame = event.target.closest("[data-window-id]");
      if (windowFrame) {
        navigateBrowser(event.target.value.trim(), windowFrame.dataset.windowId);
      }
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      focusLauncher();
      return;
    }

    if (event.key === "Escape" && state.startMenuOpen) {
      state.startMenuOpen = false;
      render();
      window.requestAnimationFrame(() => focusLauncher());
    }
  });
}

function bootstrap() {
  const currentTheme = state.appStates.settings?.theme || "default";
  applyTheme(currentTheme);
  render();
  bindEvents();
  
  // Combined timer and background dashboard simulator tick
  const bgTimer = window.setInterval(() => {
    // 1. Clock update
    updateClock();
    
    // 2. Timer update
    const timerState = state.appStates.timer;
    if (timerState.isRunning && timerState.timeRemaining > 0) {
      timerState.timeRemaining--;
      if (timerState.timeRemaining <= 0) {
        timerState.isRunning = false;
        playTimerAlert();
        state.appStates.dashboard.logs.push(`[${new Date().toLocaleTimeString()}] Timer alarm triggered.`);
      }
      
      const timerWindow = getAllWindows().find(w => w.kind === "timer" && state.windows[w.id]?.open);
      if (timerWindow) {
        updateTimerDOM(timerWindow.id);
      }
    }
    
    // 3. Dashboard background simulator fluctuations
    const dashState = state.appStates.dashboard;
    if (Math.random() < 0.25) {
      const baseCpu = dashState.mode === 'idle' ? 2 : (dashState.mode === 'stress' ? 85 : 18);
      const targetTraffic = dashState.mode === 'idle' ? 5 : (dashState.mode === 'stress' ? 95 : dashState.traffic);
      dashState.cpu = Math.round(Math.max(1, Math.min(99, baseCpu + (targetTraffic * 0.1) + (Math.random() * 8 - 4))));
      dashState.memory = Math.round(Math.max(10, Math.min(98, (dashState.cpu * 0.2) + (dashState.mode === 'idle' ? 20 : (dashState.mode === 'stress' ? 82 : 40)) + (Math.random() * 2 - 1))));
      
      if (Math.random() < 0.25) {
        const events = [
          "Connection accepted from client IP.",
          "Cache HIT ratio: 94%.",
          "CPU usage within normal parameters.",
          "Network packet filter active.",
          "CDN Edge synced successfully.",
          "System diagnostics green."
        ];
        const randomEvent = events[Math.floor(Math.random() * events.length)];
        dashState.logs.push(`[${new Date().toLocaleTimeString()}] ${randomEvent}`);
        if (dashState.logs.length > 20) dashState.logs.shift();
      }
      
      const dashWindow = getAllWindows().find(w => w.kind === "dashboard" && state.windows[w.id]?.open);
      if (dashWindow) {
        updateDashboardDOM(dashWindow.id);
      }
    }
  }, 1000);
  bgTimer.unref?.();

  const bootTimer = window.setTimeout(() => {
    state.booting = false;
    render();
    window.requestAnimationFrame(() => focusLauncher());
  }, 900);
  bootTimer.unref?.();

  window.addEventListener("beforeunload", () => {
    window.clearInterval(bgTimer);
  });
}

bootstrap();
