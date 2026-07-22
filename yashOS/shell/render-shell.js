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
        <span class="mac-menubar__brand" aria-hidden="true">
          <span class="mac-menubar__apple">◆</span>
        </span>
        <strong class="mac-menubar__title">yashOS</strong>
        <button class="mac-menubar__button" type="button" data-action="open-window" data-target="about">About</button>
        <button class="mac-menubar__button" type="button" data-action="open-window" data-target="projects">Projects</button>
        <button class="mac-menubar__button" type="button" data-action="focus-forge">App Forge</button>
        <button class="mac-menubar__button" type="button" data-action="open-window" data-target="contact">Contact</button>
      </div>
      <div class="mac-menubar__right">
        <button class="mac-menubar__spotlight" type="button" data-action="focus-forge" aria-label="Open App Forge search">
          ${renderIcon("search", "pixel-icon--sm")}
        </button>
        <button class="mac-menubar__spotlight" type="button" data-action="open-window" data-target="settings" aria-label="Open Settings">
          ${renderIcon("sliders", "pixel-icon--sm")}
        </button>
        <time class="mac-menubar__time" aria-label="Current time">${escapeHtml(clock)}</time>
      </div>
    </header>
  `;
}

/**
 * @param {object} options
 * @param {Array} options.dockItems - dock config from portfolio.dock
 * @param {object} options.windowStates
 * @param {string|null} options.activeWindowId
 * @param {Function} options.renderIcon
 * @param {Array} [options.generatedWindows] - open generated apps appended to dock
 */
export function renderDock({
  dockItems,
  windowStates,
  activeWindowId,
  renderIcon,
  generatedWindows = [],
}) {
  const items = [...dockItems];

  // Append open generated apps after a separator (if any)
  const openGenerated = (generatedWindows || []).filter((w) => {
    const st = windowStates[w.id];
    return st?.open;
  });

  if (openGenerated.length > 0) {
    items.push({ type: "separator" });
    for (const w of openGenerated) {
      items.push({
        id: w.id,
        label: w.label || w.title,
        glyph: w.glyph || "box",
        color: w.accent || "#0a84ff",
        generated: true,
        iconPath: "./assets/macOS/Terminal_Dark.png",
      });
    }
  }

  const dockHtml = items.map((item) => {
    if (item.type === "separator") {
      return `<span class="mac-dock__separator" role="separator" aria-hidden="true"></span>`;
    }

    const windowState = windowStates[item.id];
    const isOpen = Boolean(windowState?.open);
    const isActive = isOpen && activeWindowId === item.id && !windowState.minimized;
    const classes = [
      "mac-dock__item",
      isOpen ? "is-open" : "",
      isActive ? "is-active" : "",
      item.featured ? "is-featured" : "",
      item.generated ? "is-generated" : "",
    ].filter(Boolean).join(" ");

    const color = item.color || "#0a84ff";
    const iconInner = item.iconPath
      ? `<img class="mac-dock__icon-img" src="${escapeHtml(item.iconPath)}" alt="" draggable="false" />`
      : `<span class="mac-dock__icon" style="--dock-icon-color: ${escapeHtml(color)}" aria-hidden="true">${renderIcon(item.glyph, "pixel-icon--lg")}</span>`;

    return `
      <button
        class="${classes}"
        type="button"
        data-action="open-window"
        data-target="${escapeHtml(item.id)}"
        aria-label="Open ${escapeHtml(item.label)}"
        aria-pressed="${isActive}"
      >
        <span class="mac-dock__tooltip" aria-hidden="true">${escapeHtml(item.label)}</span>
        <div class="mac-dock__icon-wrapper">
          ${iconInner}
        </div>
        <span class="mac-dock__indicator" aria-hidden="true"></span>
      </button>
    `;
  }).join("");

  return `
    <nav class="mac-dock-container" aria-label="Applications">
      <div class="mac-dock" id="mac-dock">
        ${dockHtml}
      </div>
    </nav>
  `;
}

export function renderWindowFrame({ definition, windowState, isActive, body, renderIcon }) {
  const classes = [
    "window",
    definition.type === "generated" ? "window--generated" : "",
    definition.type === "project" ? "window--project" : "",
    definition.type === "forge" ? "window--forge" : "",
    windowState.minimized ? "is-minimized" : "",
    isActive && !windowState.minimized ? "is-active" : "",
  ].filter(Boolean).join(" ");

  const accent = definition.accent || definition.accentHi || null;
  const accentStyle = definition.type === "generated" || accent
    ? `--generated-accent:${definition.accent || accent || "#0a84ff"};--generated-accent-hi:${definition.accentHi || definition.accent || "#64d2ff"};`
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
          <button class="mac-dot mac-dot--close" type="button" data-action="close-window" data-target="${escapeHtml(definition.id)}" aria-label="Close ${escapeHtml(definition.title)}"><span class="mac-dot__icon" aria-hidden="true">×</span></button>
          <button class="mac-dot mac-dot--minimize" type="button" data-action="minimize-window" data-target="${escapeHtml(definition.id)}" aria-label="Minimize ${escapeHtml(definition.title)}"><span class="mac-dot__icon" aria-hidden="true">−</span></button>
          <button class="mac-dot mac-dot--zoom" type="button" data-action="focus-window" data-target="${escapeHtml(definition.id)}" aria-label="Focus ${escapeHtml(definition.title)}"><span class="mac-dot__icon" aria-hidden="true">+</span></button>
        </div>
        <div class="mac-titlebar__title">
          ${definition.iconPath ? `<img class="mac-titlebar__icon-img" src="${escapeHtml(definition.iconPath)}" alt="" />` : renderIcon(definition.glyph, "pixel-icon--xs")}
          <span>${escapeHtml(definition.title)}</span>
        </div>
      </header>
      <div class="window__body">
        ${body}
      </div>
    </section>
  `;
}
