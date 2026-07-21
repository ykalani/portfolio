import assert from "node:assert/strict";
import test from "node:test";

import {
  ACTION_TYPES,
  COMPONENT_TYPES,
  MAX_ACTIONS,
  MAX_ACTION_LABEL_CHARS,
  MAX_COMPONENT_CONTENT_BYTES,
  MAX_COMPONENTS,
  MAX_COMPONENT_TEXT_CHARS,
  MAX_DATA_BYTES,
  MAX_JSON_ARRAY_ITEMS,
  MAX_JSON_DEPTH,
  MAX_JSON_OBJECT_KEYS,
  MAX_LINK_CHARS,
  MAX_MANIFEST_BYTES,
  MAX_NOTES,
  MAX_NOTE_CHARS,
  MAX_SUMMARY_CHARS,
  MAX_TITLE_CHARS,
  isValidActionId,
  isAllowedOpenLink,
  validateManifest,
} from "./manifest-schema.js";
import { REGISTRY_VERSION } from "./project-registry.js";

function manifest(overrides = {}) {
  return {
    version: 1,
    registryVersion: REGISTRY_VERSION,
    sourceProjectId: "autosched",
    scaffoldId: "schedule-planner",
    inspired: false,
    title: "Schedule",
    summary: "Plan a course schedule.",
    theme: { accent: "#123ABC", surface: "glass" },
    data: { courses: ["Algorithms"] },
    components: [{
      id: "hero",
      type: "hero",
      title: "Schedule",
      content: { text: "Plan courses." },
    }],
    actions: [
      { id: "add", type: "add", label: "Add course" },
      { id: "reset", type: "reset", label: "Reset" },
    ],
    notes: [],
    ...overrides,
  };
}

function expectRejected(candidate, error) {
  const result = validateManifest(candidate);
  assert.equal(result.ok, false);
  assert.ok(result.errors.includes(error), result.errors.join(", "));
  assert.equal("value" in result, false);
  for (const entry of result.errors) assert.equal(entry.includes("x"), false);
}

test("exports the fixed component and action vocabularies", () => {
  assert.deepEqual([...COMPONENT_TYPES], [
    "hero", "stat-grid", "data-table", "timeline", "calendar", "form",
    "chart", "activity-log", "canvas", "chat",
  ]);
  assert.deepEqual([...ACTION_TYPES], [
    "select", "filter", "sort", "toggle", "add", "remove", "calculate",
    "simulate", "reset", "open-link",
  ]);
});

test("accepts only protocol-safe action IDs", () => {
  for (const id of ["a", "add-course", `a${"-".repeat(63)}`]) {
    assert.equal(isValidActionId(id), true, id);
    assert.equal(validateManifest(manifest({
      actions: [{ id, type: "add", label: "Add course" }, manifest().actions[1]],
    })).ok, true, id);
  }

  for (const id of ["", "Add-course", "add_course", "add course", "-add", `a${"b".repeat(64)}`]) {
    assert.equal(isValidActionId(id), false, id);
    expectRejected(manifest({
      actions: [{ id, type: "add", label: "Add course" }, manifest().actions[1]],
    }), "INVALID_ACTION_ID");
  }
});

test("accepts an exact bounded manifest", () => {
  const result = validateManifest(manifest());

  assert.equal(result.ok, true);
  assert.deepEqual(result.value, manifest());
});

test("rejects unknown manifest, component, action, and theme keys", () => {
  expectRejected(manifest({ extra: true }), "INVALID_MANIFEST_KEYS");
  expectRejected(manifest({ components: [{ ...manifest().components[0], extra: true }] }), "INVALID_COMPONENT_KEYS");
  expectRejected(manifest({ actions: [{ ...manifest().actions[0], href: "/profiles" }, manifest().actions[1]] }), "INVALID_ACTION_KEYS");
  expectRejected(manifest({ theme: { accent: "#123ABC", surface: "glass", extra: true } }), "INVALID_THEME_KEYS");
});

test("requires a verified scaffold-matching source unless inspired", () => {
  expectRejected(manifest({ scaffoldId: "analytics-dashboard" }), "INVALID_SOURCE_PROJECT");
  expectRejected(manifest({ inspired: true, sourceProjectId: "autosched" }), "INSPIRED_SOURCE_PROJECT");
});

test("accepts inspired manifests only without a source project", () => {
  const result = validateManifest(manifest({ inspired: true, sourceProjectId: null }));

  assert.equal(result.ok, true);
});

test("allows only same-origin relative or exact verified HTTPS open links", () => {
  const project = { links: { demo: "https://verified.example/project" } };
  const lookup = (id) => id === "project" ? project : null;

  assert.equal(isAllowedOpenLink("/profiles", "project", "https://portfolio.example", lookup), true);
  assert.equal(isAllowedOpenLink("https://verified.example/project", "project", "https://portfolio.example", lookup), true);
  for (const href of [
    "javascript:alert(1)",
    "https://unverified.example",
    "https://user:password@verified.example/project",
    "https://verified.example/project",
    "\\evil.example",
    "/\\evil.example",
    "/%5Cevil.example",
    "/%5cevil.example",
    "/%E0%A4%A",
    "//evil.example",
    "https:/\\evil.example",
    "//evil.example/%5Credirect",
  ]) {
    const projectId = href === "https://verified.example/project" ? "wrong-project" : "project";
    assert.equal(isAllowedOpenLink(href, projectId, "https://portfolio.example", lookup), false, href);
  }
});

test("rejects backslash and protocol-relative forms even when URL parsing changes origin", () => {
  const origin = "https://portfolio.example";
  const candidates = [
    ["\\evil.example", false],
    ["/\\evil.example", true],
    ["//evil.example", true],
    ["https:/\\evil.example", true],
    ["//evil.example/%5Credirect", true],
  ];

  for (const [href, changesOrigin] of candidates) {
    assert.equal(isAllowedOpenLink(href, "project", origin, () => null), false, href);
    assert.equal(new URL(href, origin).origin !== origin, changesOrigin, href);
  }
});

test("rejects unsafe links before a manifest can be accepted", () => {
  for (const href of [
    "javascript:alert(1)",
    "https://unverified.example",
    "https://user:password@verified.example/project",
    "\\evil.example",
    "/\\evil.example",
    "//evil.example",
    "https:/\\evil.example",
    "//evil.example/%5Credirect",
  ]) {
    expectRejected(manifest({
      actions: [
        { id: "link", type: "open-link", label: "Open", href },
        { id: "reset", type: "reset", label: "Reset" },
      ],
    }), "INVALID_OPEN_LINK");
  }
});

test("rejects independently oversized byte payloads before validation", () => {
  expectRejected(manifest({ data: { text: "x".repeat(MAX_MANIFEST_BYTES + 1) } }), "MANIFEST_TOO_LARGE");
  expectRejected(manifest({ data: { text: "x".repeat(MAX_DATA_BYTES + 1) } }), "DATA_TOO_LARGE");
  expectRejected(manifest({
    data: Array.from({ length: MAX_JSON_ARRAY_ITEMS }, () => "x".repeat(500)),
  }), "DATA_TOO_LARGE");
  expectRejected(manifest({
    components: [{ ...manifest().components[0], content: { text: "x".repeat(MAX_COMPONENT_CONTENT_BYTES + 1) } }],
  }), "COMPONENT_CONTENT_TOO_LARGE");
});

test("rejects independently oversized strings and collection counts", () => {
  expectRejected(manifest({ title: "x".repeat(MAX_TITLE_CHARS + 1) }), "INVALID_TITLE");
  expectRejected(manifest({ summary: "x".repeat(MAX_SUMMARY_CHARS + 1) }), "INVALID_SUMMARY");
  expectRejected(manifest({ components: [{ ...manifest().components[0], content: { text: "x".repeat(MAX_COMPONENT_TEXT_CHARS + 1) } }] }), "INVALID_COMPONENT_CONTENT");
  expectRejected(manifest({ notes: ["x".repeat(MAX_NOTE_CHARS + 1)] }), "INVALID_NOTES");
  expectRejected(manifest({ actions: [{ ...manifest().actions[0], label: "x".repeat(MAX_ACTION_LABEL_CHARS + 1) }, manifest().actions[1]] }), "INVALID_ACTION_LABEL");
  expectRejected(manifest({ actions: [{ id: "link", type: "open-link", label: "Open", href: "/".concat("x".repeat(MAX_LINK_CHARS)) }, manifest().actions[1]] }), "INVALID_ACTION_HREF");
  expectRejected(manifest({ components: Array.from({ length: MAX_COMPONENTS + 1 }, (_, index) => ({ ...manifest().components[0], id: `hero-${index}` })) }), "INVALID_COMPONENTS");
  expectRejected(manifest({ actions: Array.from({ length: MAX_ACTIONS + 1 }, (_, index) => ({ ...manifest().actions[0], id: `add-${index}` })) }), "INVALID_ACTIONS");
  expectRejected(manifest({ notes: Array.from({ length: MAX_NOTES + 1 }, () => "note") }), "INVALID_NOTES");
});

test("rejects bounded JSON arrays, records, and nesting independently", () => {
  expectRejected(manifest({ data: Array.from({ length: MAX_JSON_ARRAY_ITEMS + 1 }, () => 1) }), "INVALID_DATA");
  expectRejected(manifest({ data: Object.fromEntries(Array.from({ length: MAX_JSON_OBJECT_KEYS + 1 }, (_, index) => [`key${index}`, index])) }), "INVALID_DATA");
  let nested = "leaf";
  for (let index = 0; index <= MAX_JSON_DEPTH; index += 1) nested = { nested };
  expectRejected(manifest({ data: nested }), "INVALID_DATA");
});
