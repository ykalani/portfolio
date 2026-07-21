import assert from "node:assert/strict";
import test from "node:test";
import {
  formatMenuClock,
  renderDock,
  renderMenuBar,
  renderWindowFrame,
} from "../shell/render-shell.js";

const icon = (name, className) => `<i data-icon="${name}" class="${className}"></i>`;

test("formats a complete menu-bar clock and renders a Spotlight control", () => {
  const clock = formatMenuClock(new Date("2026-07-20T16:17:00"), "en-US");
  const markup = renderMenuBar({
    portfolioName: "Yash <Kalani>",
    clock,
    renderIcon: icon,
  });

  assert.match(clock, /Jul/);
  assert.match(markup, /Yash &lt;Kalani&gt;/);
  assert.match(markup, /data-action="focus-forge"/);
  assert.match(markup, /class="mac-menubar__time"/);
});

test("renders dock open and active indicators without a taskbar", () => {
  const markup = renderDock({
    windows: [
      { id: "about", label: "About", glyph: "user" },
      { id: "forge", label: "App Forge", glyph: "zap" },
    ],
    windowStates: {
      about: { open: true, minimized: false },
      forge: { open: true, minimized: false },
    },
    activeWindowId: "forge",
    renderIcon: icon,
  });

  assert.match(markup, /class="mac-dock__item is-open"/);
  assert.match(markup, /class="mac-dock__item is-open is-active"/);
  assert.match(markup, /data-action="open-window" data-target="forge"/);
  assert.match(markup, /aria-pressed="true"/);
  assert.doesNotMatch(markup, /taskbar|start-menu|desktop-icon/);
});

test("renders accessible macOS-style close and minimize controls around the body", () => {
  const markup = renderWindowFrame({
    definition: {
      id: "forge",
      type: "forge",
      title: "App Forge <Builder>",
      glyph: "zap",
    },
    windowState: {
      open: true,
      minimized: false,
      x: 500,
      y: 180,
      width: 590,
      height: 410,
      zIndex: 11,
    },
    isActive: true,
    body: "<form data-launcher-form></form>",
    renderIcon: icon,
  });

  assert.match(markup, /class="window is-active"/);
  assert.doesNotMatch(markup, /\bis-macos\b/);
  assert.match(markup, /data-drag-handle data-window-id="forge"/);
  assert.match(markup, /data-action="minimize-window" data-target="forge"/);
  assert.match(markup, /data-action="close-window" data-target="forge"/);
  assert.match(markup, /App Forge &lt;Builder&gt;/);
  assert.match(markup, /<div class="window__body">/);
});
