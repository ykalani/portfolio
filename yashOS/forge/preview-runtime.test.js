import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

import { compileSeedManifest } from "./compiler.js";
import { MAX_MANIFEST_BYTES } from "./manifest-schema.js";
import {
  PREVIEW_CHANNEL,
  PREVIEW_VERSION,
  buildPreviewSrcdoc,
  isAllowedPreviewMessage,
  mountPreview,
  resolvePreviewOpenLink,
} from "./preview-runtime.js";
import { SCAFFOLD_IDS } from "./scaffolds.js";

const previewTarget = (scaffoldId) => ({
  query: `preview ${scaffoldId}`,
  sourceProjectId: null,
  scaffoldId,
  inspired: true,
});

class Element {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.listeners = new Map();
    this.attributes = new Map();
    this.style = { setProperty() {} };
    this._text = "";
  }

  set textContent(value) { this._text = String(value); }
  get textContent() { return `${this._text}${this.children.map((child) => child.textContent).join("")}`; }
  append(...nodes) { nodes.forEach((node) => this.children.push(node)); }
  replaceChildren(...nodes) { this.children = []; this.append(...nodes); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  click() { this.listeners.get("click")?.(); }
}

function previewDocument(manifest) {
  const app = new Element("main");
  const messages = [];
  const document = {
    createElement: (tag) => new Element(tag),
    getElementById: (id) => id === "app" ? app : null,
  };
  const script = buildPreviewSrcdoc(manifest).match(/<script>([\s\S]*)<\/script>/)[1];
  vm.runInNewContext(script, {
    document,
    parent: { postMessage: (message) => messages.push(message) },
    structuredClone,
  });
  return { app, messages };
}

function nodesByTag(node, tagName) {
  return [
    ...(node.tagName === tagName ? [node] : []),
    ...node.children.flatMap((child) => nodesByTag(child, tagName)),
  ];
}

function clickAction(preview, label) {
  const button = nodesByTag(preview.app, "button").find((node) => node.textContent === label);
  assert.ok(button, `expected ${label} button`);
  button.click();
}

test("builds a CSP-protected sandbox runtime for every scaffold", () => {
  for (const scaffoldId of SCAFFOLD_IDS) {
    const srcdoc = buildPreviewSrcdoc(compileSeedManifest(previewTarget(scaffoldId)));

    assert.match(srcdoc, /Content-Security-Policy/);
    assert.match(srcdoc, /default-src 'none'/);
    assert.match(srcdoc, /<main id="app"/);
    assert.doesNotMatch(srcdoc, /\bfetch\s*\(/);
    assert.doesNotMatch(srcdoc, /\bnew Function\b/);
    assert.match(srcdoc, /Last action:/);
  }
});

test("includes every component renderer and action reducer in the frame source", () => {
  const srcdoc = buildPreviewSrcdoc(compileSeedManifest(previewTarget("schedule-planner")));

  for (const type of [
    "hero", "stat-grid", "data-table", "timeline", "calendar", "form", "chart",
    "activity-log", "canvas", "chat",
  ]) {
    assert.match(srcdoc, new RegExp(`component\\.type === "${type}"`));
  }
  for (const type of [
    "select", "filter", "sort", "toggle", "add", "remove", "calculate", "simulate", "reset", "open-link",
  ]) {
    assert.match(srcdoc, new RegExp(`type === "${type}"`));
  }
});

test("renders scaffold actions and makes every seed action update status", () => {
  for (const scaffoldId of SCAFFOLD_IDS) {
    const manifest = compileSeedManifest(previewTarget(scaffoldId));
    const preview = previewDocument(manifest);

    for (const action of manifest.actions) {
      clickAction(preview, action.label);
      assert.match(preview.app.textContent, new RegExp(`Last action: ${action.label}\\.`));
    }
  }
});

test("updates the components that consume action data", () => {
  const schedule = previewDocument(compileSeedManifest(previewTarget("schedule-planner")));
  assert.match(schedule.app.textContent, /Algorithms.*Databases/);
  clickAction(schedule, "Add course");
  assert.match(schedule.app.textContent, /Course 3/);
  clickAction(schedule, "Remove course");
  assert.doesNotMatch(schedule.app.textContent, /Course 3/);

  const analytics = previewDocument(compileSeedManifest(previewTarget("analytics-dashboard")));
  clickAction(analytics, "Filter");
  assert.doesNotMatch(analytics.app.textContent, /Route BQueued/);
  clickAction(analytics, "Reset");
  clickAction(analytics, "Sort");
  assert.match(analytics.app.textContent, /Route B.*Route A/);

  const creative = previewDocument(compileSeedManifest(previewTarget("creative-workbench")));
  clickAction(creative, "Select mode");
  assert.match(creative.app.textContent, /Ready: Select mode/);
  clickAction(creative, "Translate");
  assert.match(creative.app.textContent, /Generated translation/);

  const simulation = previewDocument(compileSeedManifest(previewTarget("simulation-console")));
  clickAction(simulation, "Run step");
  assert.match(simulation.app.textContent, /Completed step 1/);
  clickAction(simulation, "Pause");
  assert.match(simulation.app.textContent, /Paused\./);
  clickAction(simulation, "Reset");
  assert.match(simulation.app.textContent, /Simulation is ready\./);
});

test("mounts only a validated manifest in a script-only sandbox", () => {
  const iframe = {
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
  };
  const manifest = compileSeedManifest(previewTarget("schedule-planner"));

  mountPreview(iframe, manifest);

  assert.equal(iframe.attributes.get("sandbox"), "allow-scripts");
  assert.equal(iframe.attributes.get("title"), `${manifest.title} interactive preview`);
  assert.match(iframe.srcdoc, /"add-course"/);
});

test("rejects an oversized manifest before assigning iframe srcdoc", () => {
  const iframe = {
    assigned: false,
    setAttribute() {},
    set srcdoc(value) { this.assigned = true; this.value = value; },
  };
  const manifest = compileSeedManifest(previewTarget("schedule-planner"));
  manifest.data = { text: "x".repeat(MAX_MANIFEST_BYTES + 1) };

  assert.throws(() => mountPreview(iframe, manifest), (error) => error.code === "MANIFEST_TOO_LARGE");
  assert.equal(iframe.assigned, false);
});

test("allows only exact opaque-origin preview protocol messages", () => {
  const iframeWindow = {};
  const validAction = {
    source: iframeWindow,
    origin: "null",
    data: {
      channel: PREVIEW_CHANNEL,
      version: PREVIEW_VERSION,
      type: "action",
      actionId: "add-course",
    },
  };

  assert.equal(isAllowedPreviewMessage({ ...validAction, source: {} }, iframeWindow), false);
  assert.equal(isAllowedPreviewMessage({ ...validAction, origin: "https://example.test" }, iframeWindow), false);
  assert.equal(isAllowedPreviewMessage({ ...validAction, data: { ...validAction.data, channel: "other" } }, iframeWindow), false);
  assert.equal(isAllowedPreviewMessage({ ...validAction, data: { ...validAction.data, version: 2 } }, iframeWindow), false);
  assert.equal(isAllowedPreviewMessage({ ...validAction, data: { ...validAction.data, type: "navigate" } }, iframeWindow), false);
  assert.equal(isAllowedPreviewMessage({ ...validAction, data: { ...validAction.data, extra: true } }, iframeWindow), false);
  for (const actionId of ["a", "add-course", `a${"-".repeat(63)}`]) {
    assert.equal(isAllowedPreviewMessage({
      ...validAction,
      data: { ...validAction.data, actionId },
    }, iframeWindow), true, actionId);
  }
  for (const actionId of ["", "Add-course", "add_course", "add course", "-add", `a${"b".repeat(64)}`]) {
    assert.equal(isAllowedPreviewMessage({
      ...validAction,
      data: { ...validAction.data, actionId },
    }, iframeWindow), false, actionId);
  }
  assert.equal(isAllowedPreviewMessage({
    source: iframeWindow,
    origin: "null",
    data: { channel: PREVIEW_CHANNEL, version: PREVIEW_VERSION, type: "ready" },
  }, iframeWindow), true);
});

test("resolves an open link only after the parent validates its iframe message", () => {
  const iframeWindow = {};
  const manifest = compileSeedManifest(previewTarget("schedule-planner"));
  manifest.actions = [
    { id: "open-docs", type: "open-link", label: "Open documentation", href: "/docs" },
    { id: "reset-plan", type: "reset", label: "Reset" },
  ];
  const event = {
    source: iframeWindow,
    origin: "null",
    data: {
      channel: PREVIEW_CHANNEL,
      version: PREVIEW_VERSION,
      type: "action",
      actionId: "open-docs",
    },
  };

  assert.equal(resolvePreviewOpenLink(event, iframeWindow, manifest), "/docs");
  assert.equal(resolvePreviewOpenLink({ ...event, source: {} }, iframeWindow, manifest), null);
  assert.equal(resolvePreviewOpenLink({
    ...event,
    data: { ...event.data, actionId: "reset-plan" },
  }, iframeWindow, manifest), null);
});
