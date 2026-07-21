export const STORAGE_KEY = "portfolio:desktop-state";

const WINDOW_STATE_KEYS = ["x", "y", "width", "height", "zIndex"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const MAX_APP_FORGE_CACHE_ENTRIES = 20;
const MAX_APP_FORGE_CACHE_MANIFEST_BYTES = 48 * 1024;

function serializedBytes(value) {
  try {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  } catch {
    return Infinity;
  }
}

function isJsonValue(value, depth = 0) {
  if (depth > 8 || value === null) {
    return depth <= 8;
  }

  if (["string", "number", "boolean"].includes(typeof value)) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length <= 50 && value.every((item) => isJsonValue(item, depth + 1));
  }

  return isRecord(value)
    && Object.keys(value).length <= 20
    && Object.values(value).every((item) => isJsonValue(item, depth + 1));
}

function isCacheEntry(value) {
  return isRecord(value)
    && Object.keys(value).length === 2
    && typeof value.key === "string"
    && value.key.length > 0
    && value.key.length <= 512
    && isRecord(value.manifest)
    && serializedBytes(value.manifest) <= MAX_APP_FORGE_CACHE_MANIFEST_BYTES
    && isJsonValue(value.manifest);
}

function cloneCache(entries) {
  return Array.isArray(entries)
    ? entries.filter(isCacheEntry).slice(-MAX_APP_FORGE_CACHE_ENTRIES).map(clone)
    : [];
}

function readSavedValue(rawValue) {
  if (typeof rawValue !== "string" || rawValue.length === 0) {
    return null;
  }

  try {
    const value = JSON.parse(rawValue);
    return isRecord(value) ? value : null;
  } catch {
    return null;
  }
}

function copyWindowState(target, savedWindow) {
  if (!isRecord(savedWindow)) {
    return;
  }

  if (typeof savedWindow.open === "boolean") {
    target.open = savedWindow.open;
  }

  if (typeof savedWindow.minimized === "boolean") {
    target.minimized = savedWindow.minimized;
  }

  for (const key of WINDOW_STATE_KEYS) {
    if (Number.isFinite(savedWindow[key])) {
      target[key] = savedWindow[key];
    }
  }
}

function restoreGeneratedWindow(savedWindow, savedState, nextZIndex) {
  if (!isRecord(savedWindow) || typeof savedWindow.id !== "string") {
    return null;
  }

  const width = Number.isFinite(savedState?.width)
    ? savedState.width
    : Number.isFinite(savedWindow.window?.width)
      ? savedWindow.window.width
      : 600;
  const height = Number.isFinite(savedState?.height)
    ? savedState.height
    : Number.isFinite(savedWindow.window?.height)
      ? savedWindow.window.height
      : 520;
  const x = Number.isFinite(savedState?.x)
    ? savedState.x
    : Number.isFinite(savedWindow.window?.x)
      ? savedWindow.window.x
      : 120;
  const y = Number.isFinite(savedState?.y)
    ? savedState.y
    : Number.isFinite(savedWindow.window?.y)
      ? savedWindow.window.y
      : 120;

  return {
    definition: {
      id: savedWindow.id,
      kind: typeof savedWindow.kind === "string" ? savedWindow.kind : "custom",
      type: "generated",
      title: typeof savedWindow.title === "string" ? savedWindow.title : "Custom App",
      label: typeof savedWindow.label === "string"
        ? savedWindow.label
        : typeof savedWindow.title === "string"
          ? savedWindow.title
          : "Custom App",
      glyph: typeof savedWindow.glyph === "string" ? savedWindow.glyph : "★",
      summary: typeof savedWindow.summary === "string" ? savedWindow.summary : "",
      accent: typeof savedWindow.accent === "string" ? savedWindow.accent : "#0a3b73",
      accentHi: typeof savedWindow.accentHi === "string" ? savedWindow.accentHi : "#2b74c5",
      prompt: typeof savedWindow.prompt === "string" ? savedWindow.prompt : "",
      tags: Array.isArray(savedWindow.tags) ? savedWindow.tags : [],
      window: { x, y, width, height },
      panels: Array.isArray(savedWindow.panels) ? savedWindow.panels : [],
      actions: Array.isArray(savedWindow.actions) ? savedWindow.actions : [],
      notes: Array.isArray(savedWindow.notes) ? savedWindow.notes : [],
      html: typeof savedWindow.html === "string" ? savedWindow.html : "",
      css: typeof savedWindow.css === "string" ? savedWindow.css : "",
      js: typeof savedWindow.js === "string" ? savedWindow.js : "",
      x,
      y,
      width,
      height,
      openByDefault: true,
    },
    state: {
      open: typeof savedState?.open === "boolean" ? savedState.open : true,
      minimized: typeof savedState?.minimized === "boolean" ? savedState.minimized : false,
      x,
      y,
      width,
      height,
      zIndex: Number.isFinite(savedState?.zIndex) ? savedState.zIndex : nextZIndex,
    },
  };
}

export function createWindowStates(definitions) {
  return Object.fromEntries(
    definitions.map((definition) => [
      definition.id,
      {
        open: Boolean(definition.openByDefault),
        minimized: false,
        x: definition.x,
        y: definition.y,
        width: definition.width,
        height: definition.height,
        zIndex: definition.openByDefault ? 1 : 0,
      },
    ]),
  );
}

export function createDesktopState({ definitions, appStates }) {
  return {
    activeWindowId: "",
    launcherQuery: "",
    zCounter: 10,
    windows: createWindowStates(definitions),
    generatedWindows: [],
    drag: null,
    clock: "",
    appStates: clone(appStates),
    appForgeCache: [],
  };
}

export function createPersistedSnapshot(state) {
  return {
    activeWindowId: state.activeWindowId,
    launcherQuery: state.launcherQuery,
    zCounter: state.zCounter,
    windows: Object.fromEntries(
      Object.entries(state.windows).map(([id, windowState]) => [
        id,
        {
          open: windowState.open,
          minimized: windowState.minimized,
          x: windowState.x,
          y: windowState.y,
          width: windowState.width,
          height: windowState.height,
          zIndex: windowState.zIndex,
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
    appForgeCache: cloneCache(state.appForgeCache),
  };
}

export function hydrateDesktopState(defaultState, rawValue) {
  const nextState = clone(defaultState);
  const saved = readSavedValue(rawValue);
  if (!saved) {
    return nextState;
  }

  if (typeof saved.launcherQuery === "string") {
    nextState.launcherQuery = saved.launcherQuery;
  }

  if (Number.isFinite(saved.zCounter)) {
    nextState.zCounter = Math.max(nextState.zCounter, saved.zCounter);
  }

  const savedWindows = isRecord(saved.windows) ? saved.windows : {};
  for (const [id, windowState] of Object.entries(nextState.windows)) {
    copyWindowState(windowState, savedWindows[id]);
  }

  const restoredGeneratedWindows = Array.isArray(saved.generatedWindows)
    ? saved.generatedWindows
      .map((savedWindow, index) => restoreGeneratedWindow(
        savedWindow,
        savedWindows[savedWindow?.id],
        nextState.zCounter + index + 1,
      ))
      .filter(Boolean)
    : [];

  nextState.generatedWindows = restoredGeneratedWindows.map(({ definition }) => definition);
  for (const { definition, state } of restoredGeneratedWindows) {
    nextState.windows[definition.id] = state;
  }

  nextState.zCounter = Math.max(
    nextState.zCounter,
    ...Object.values(nextState.windows).map((windowState) => windowState.zIndex),
  );

  if (isRecord(saved.appStates)) {
    nextState.appStates = {
      ...nextState.appStates,
      ...saved.appStates,
    };
  }

  nextState.appForgeCache = cloneCache(saved.appForgeCache);

  if (
    typeof saved.activeWindowId === "string"
    && nextState.windows[saved.activeWindowId]?.open
    && !nextState.windows[saved.activeWindowId]?.minimized
  ) {
    nextState.activeWindowId = saved.activeWindowId;
  } else {
    nextState.activeWindowId = Object.keys(nextState.windows).find(
      (id) => nextState.windows[id].open && !nextState.windows[id].minimized,
    ) || "";
  }

  return nextState;
}
