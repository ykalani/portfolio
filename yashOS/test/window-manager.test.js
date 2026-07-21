import assert from "node:assert/strict";
import test from "node:test";
import { createDesktopState } from "../core/store.js";
import {
  closeWindowState,
  focusWindowState,
  getAllWindowDefinitions,
  getWindowDefinition,
  minimizeWindowState,
  openWindowState,
} from "../core/window-manager.js";

const baseWindows = [
  { id: "about", x: 0, y: 0, width: 300, height: 200, openByDefault: false },
  { id: "forge", x: 20, y: 20, width: 500, height: 300, openByDefault: false },
];

function makeState() {
  return createDesktopState({
    definitions: baseWindows,
    appStates: { settings: { theme: "default" } },
  });
}

test("opens and focuses a known window at the next z-index", () => {
  const state = makeState();

  assert.equal(openWindowState(state, "forge", baseWindows), true);
  assert.equal(state.windows.forge.open, true);
  assert.equal(state.activeWindowId, "forge");
  assert.equal(state.windows.forge.zIndex, 11);
  assert.equal(openWindowState(state, "missing", baseWindows), false);
});

test("minimizing the active window selects the highest remaining visible window", () => {
  const state = makeState();
  openWindowState(state, "about", baseWindows);
  openWindowState(state, "forge", baseWindows);

  assert.equal(minimizeWindowState(state, "forge", baseWindows), true);
  assert.equal(state.windows.forge.minimized, true);
  assert.equal(state.activeWindowId, "about");
  assert.equal(focusWindowState(state, "forge", baseWindows), true);
  assert.equal(state.windows.forge.minimized, false);
  assert.equal(state.activeWindowId, "forge");
});

test("does not report a state change when minimizing an already minimized window", () => {
  const state = makeState();
  openWindowState(state, "forge", baseWindows);

  assert.equal(minimizeWindowState(state, "forge", baseWindows), true);
  assert.equal(minimizeWindowState(state, "forge", baseWindows), false);
});

test("closes a window and supports generated definition lookup", () => {
  const state = makeState();
  const generated = [{
    id: "generated-timer",
    x: 40,
    y: 40,
    width: 300,
    height: 220,
    openByDefault: true,
  }];
  state.generatedWindows = generated;
  state.windows["generated-timer"] = {
    open: true,
    minimized: false,
    x: 40,
    y: 40,
    width: 300,
    height: 220,
    zIndex: 12,
  };
  state.activeWindowId = "generated-timer";

  assert.equal(getAllWindowDefinitions(baseWindows, generated).length, 3);
  assert.equal(getWindowDefinition(baseWindows, generated, "generated-timer").id, "generated-timer");
  assert.equal(closeWindowState(state, "generated-timer", getAllWindowDefinitions(baseWindows, generated)), true);
  assert.equal(state.windows["generated-timer"].open, false);
  assert.equal(state.activeWindowId, "");
});

test("does not report a state change when closing an already closed window", () => {
  const state = makeState();
  openWindowState(state, "forge", baseWindows);

  assert.equal(closeWindowState(state, "forge", baseWindows), true);
  assert.equal(closeWindowState(state, "forge", baseWindows), false);
});
