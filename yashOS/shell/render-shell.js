export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatMenuClock(date, locales = undefined) {
  return new Intl.DateTimeFormat(locales, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function renderMenuBar({ portfolioName, clock, renderIcon }) {
  return `
    <header class="mac-menubar" aria-label="${escapeHtml(portfolioName)} menu bar">
      <div class="mac-menubar__left">
        <span class="mac-menubar__brand" aria-hidden="true">${renderIcon("device-desktop", "pixel-icon--xs")}</span>
        <strong class="mac-menubar__title">${escapeHtml(portfolioName)}</strong>
        <button class="mac-menubar__button" type="button" data-action="focus-forge">App Forge</button>
      </div>
      <div class="mac-menubar__right">
        <button class="mac-menubar__spotlight" type="button" data-action="focus-forge" aria-label="Open App Forge search">
          ${renderIcon("search", "pixel-icon--sm")}
        </button>
        <time class="mac-menubar__time" aria-label="Current time">${escapeHtml(clock)}</time>
      </div>
    </header>
  `;
}

export function renderDock({ windows, windowStates, activeWindowId, renderIcon }) {
  return `
    <nav class="mac-dock-container" aria-label="Applications">
      <div class="mac-dock">
        ${windows.map((window) => {
          const windowState = windowStates[window.id];
          const isOpen = Boolean(windowState?.open);
          const isActive = isOpen && activeWindowId === window.id && !windowState.minimized;
          const classes = [
            "mac-dock__item",
            isOpen ? "is-open" : "",
            isActive ? "is-active" : "",
          ].filter(Boolean).join(" ");

          return `
            <button
              class="${classes}"
              type="button"
              data-action="open-window" data-target="${escapeHtml(window.id)}"
              aria-label="Open ${escapeHtml(window.label)}"
              aria-pressed="${isActive}"
            >
              <span class="mac-dock__icon" aria-hidden="true">${renderIcon(window.glyph, "pixel-icon--lg")}</span>
              <span class="mac-dock__label">${escapeHtml(window.label)}</span>
              <span class="mac-dock__indicator" aria-hidden="true"></span>
            </button>
          `;
        }).join("")}
      </div>
    </nav>
  `;
}

export function renderWindowFrame({ definition, windowState, isActive, body, renderIcon }) {
  const classes = [
    "window",
    definition.type === "generated" ? "window--generated" : "",
    windowState.minimized ? "is-minimized" : "",
    isActive && !windowState.minimized ? "is-active" : "",
  ].filter(Boolean).join(" ");
  const accentStyle = definition.type === "generated"
    ? `--generated-accent:${definition.accent};--generated-accent-hi:${definition.accentHi};`
    : "";

  return `
    <section
      class="${classes}"
      data-window-id="${escapeHtml(definition.id)}"
      data-window-kind="${escapeHtml(definition.type)}"
      style="left:${windowState.x}px;top:${windowState.y}px;width:${windowState.width}px;height:${windowState.height}px;z-index:${windowState.zIndex};${accentStyle}"
      aria-label="${escapeHtml(definition.title)}"
    >
      <header class="mac-titlebar" data-drag-handle data-window-id="${escapeHtml(definition.id)}" tabindex="0" aria-label="${escapeHtml(definition.title)} title bar. Press arrow keys to move window.">
        <div class="mac-titlebar__dots">
          <button class="mac-dot mac-dot--close" type="button" data-action="close-window" data-target="${escapeHtml(definition.id)}" aria-label="Close ${escapeHtml(definition.title)}"></button>
          <button class="mac-dot mac-dot--minimize" type="button" data-action="minimize-window" data-target="${escapeHtml(definition.id)}" aria-label="Minimize ${escapeHtml(definition.title)}"></button>
        </div>
        <div class="mac-titlebar__title">
          ${renderIcon(definition.glyph, "pixel-icon--xs")}
          <span>${escapeHtml(definition.title)}</span>
        </div>
      </header>
      <div class="window__body">
        ${body}
      </div>
    </section>
  `;
}
