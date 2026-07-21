import assert from "node:assert/strict";
import test from "node:test";
import {
  STORAGE_KEY,
  createDesktopState,
  createPersistedSnapshot,
  hydrateDesktopState,
} from "../core/store.js";

const definitions = [
  { id: "about", x: 56, y: 72, width: 420, height: 340, openByDefault: false },
  { id: "forge", x: 500, y: 180, width: 590, height: 410, openByDefault: false },
];

const appStates = {
  settings: { theme: "default" },
  notes: { activeNoteId: "note-1", list: [] },
};

test("creates isolated default state using the existing persistence key", () => {
  const first = createDesktopState({ definitions, appStates });
  const second = createDesktopState({ definitions, appStates });

  assert.equal(STORAGE_KEY, "portfolio:desktop-state");
  assert.deepEqual(first.windows.about, {
    open: false,
    minimized: false,
    x: 56,
    y: 72,
    width: 420,
    height: 340,
    zIndex: 0,
  });
  first.appStates.settings.theme = "dark";
  assert.equal(second.appStates.settings.theme, "default");
});

test("persists only durable desktop fields", () => {
  const state = createDesktopState({ definitions, appStates });
  state.activeWindowId = "forge";
  state.launcherQuery = "schedule";
  state.drag = { windowId: "forge", offsetX: 4, offsetY: 8 };
  state.clock = "Mon, Jul 20, 4:17 PM";
  state.windows.forge.open = true;
  state.windows.forge.zIndex = 11;

  assert.deepEqual(createPersistedSnapshot(state), {
    activeWindowId: "forge",
    launcherQuery: "schedule",
    zCounter: 10,
    windows: {
      about: {
        open: false,
        minimized: false,
        x: 56,
        y: 72,
        width: 420,
        height: 340,
        zIndex: 0,
      },
      forge: {
        open: true,
        minimized: false,
        x: 500,
        y: 180,
        width: 590,
        height: 410,
        zIndex: 11,
      },
    },
    generatedWindows: [],
    appStates,
    appForgeCache: [],
  });
});

test("hydrates valid base and generated windows while ignoring retired start-menu state", () => {
  const defaultState = createDesktopState({ definitions, appStates });
  const saved = {
    activeWindowId: "generated-clock",
    startMenuOpen: true,
    launcherQuery: "clock",
    zCounter: 22,
    windows: {
      forge: {
        open: true,
        minimized: false,
        x: 310,
        y: 125,
        width: 640,
        height: 430,
        zIndex: 12,
      },
      "generated-clock": {
        open: true,
        minimized: false,
        x: 160,
        y: 120,
        width: 380,
        height: 260,
        zIndex: 22,
      },
    },
    generatedWindows: [{
      id: "generated-clock",
      kind: "timer",
      title: "Focus Clock",
      label: "Focus Clock",
      glyph: "clock",
      summary: "A preserved generated app.",
      accent: "#123456",
      accentHi: "#456789",
      prompt: "make a clock",
      tags: ["timer"],
      window: { width: 380, height: 260 },
      panels: [],
      actions: [],
      notes: [],
      html: "",
      css: "",
      js: "",
    }],
    appStates: {
      settings: { theme: "dark" },
    },
  };

  const hydrated = hydrateDesktopState(defaultState, JSON.stringify(saved));

  assert.equal(hydrated.launcherQuery, "clock");
  assert.equal(hydrated.activeWindowId, "generated-clock");
  assert.equal(hydrated.zCounter, 22);
  assert.equal(hydrated.windows.forge.x, 310);
  assert.equal(hydrated.generatedWindows[0].type, "generated");
  assert.equal(hydrated.generatedWindows[0].x, 160);
  assert.equal(hydrated.generatedWindows[0].window.height, 260);
  assert.equal(hydrated.appStates.settings.theme, "dark");
  assert.equal("startMenuOpen" in hydrated, false);
});

test("hydrates a minimized saved active window to a visible open fallback", () => {
  const defaultState = createDesktopState({ definitions, appStates });
  const saved = {
    activeWindowId: "forge",
    windows: {
      about: { open: true, minimized: false, zIndex: 11 },
      forge: { open: true, minimized: true, zIndex: 12 },
    },
  };

  const hydrated = hydrateDesktopState(defaultState, JSON.stringify(saved));

  assert.equal(hydrated.activeWindowId, "about");
});

test("returns defaults for invalid JSON and does not mutate those defaults", () => {
  const defaultState = createDesktopState({ definitions, appStates });
  const hydrated = hydrateDesktopState(defaultState, "{not-json");

  assert.notEqual(hydrated, defaultState);
  assert.deepEqual(hydrated, defaultState);
});

test("creates an isolated empty Forge cache and persists validated-shaped entries", () => {
  const first = createDesktopState({ definitions, appStates });
  const second = createDesktopState({ definitions, appStates });
  const entry = { key: "autosched|autosched|schedule-planner|1", manifest: { version: 1 } };

  first.appForgeCache.push(entry);

  assert.deepEqual(second.appForgeCache, []);
  assert.deepEqual(createPersistedSnapshot(first).appForgeCache, [entry]);
  assert.notEqual(createPersistedSnapshot(first).appForgeCache[0], entry);
});

test("hydrates at most twenty cache-shaped entries and discards malformed entries", () => {
  const defaultState = createDesktopState({ definitions, appStates });
  const valid = (index) => ({ key: `key-${index}`, manifest: { version: 1, title: String(index) } });
  const saved = {
    appForgeCache: [
      ...Array.from({ length: 21 }, (_, index) => valid(index)),
      { key: "", manifest: {} },
      { key: "bad", manifest: { nested: { too: { deep: { x: { y: { z: { a: { b: { c: 1 } } } } } } } } } },
    ],
  };

  const hydrated = hydrateDesktopState(defaultState, JSON.stringify(saved));

  assert.equal(hydrated.appForgeCache.length, 20);
  assert.equal(hydrated.appForgeCache[0].key, "key-1");
  assert.equal(hydrated.appForgeCache.at(-1).key, "key-20");
});

test("keeps legacy generated windows backward compatible while adding Forge cache", () => {
  const defaultState = createDesktopState({ definitions, appStates });
  const generated = {
    id: "generated-legacy", title: "Legacy payload", kind: "generated",
    html: "<p>existing runtime payload</p>", css: "", js: "",
  };
  defaultState.generatedWindows = [generated];
  defaultState.windows[generated.id] = {
    open: true, minimized: false, x: 1, y: 2, width: 300, height: 200, zIndex: 99,
  };
  const persisted = createPersistedSnapshot(defaultState);
  const hydrated = hydrateDesktopState(
    createDesktopState({ definitions, appStates }), JSON.stringify(persisted),
  );

  assert.equal(persisted.generatedWindows[0].id, generated.id);
  assert.equal(persisted.generatedWindows[0].html, generated.html);
  assert.equal(hydrated.generatedWindows[0].id, generated.id);
  assert.equal(hydrated.windows[generated.id].open, true);
  assert.deepEqual(hydrated.appForgeCache, []);
});
