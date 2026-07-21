import assert from "node:assert/strict";
import test from "node:test";

import { parseForgeRequest, parseRefinedManifest } from "../api/forge-contract.mjs";
import { REGISTRY_VERSION } from "../yashOS/forge/project-registry.js";
import {
  MAX_ACTION_LABEL_CHARS,
  MAX_ACTIONS,
  MAX_COMPONENT_CONTENT_BYTES,
  MAX_COMPONENT_TEXT_CHARS,
  MAX_COMPONENTS,
  MAX_DATA_BYTES,
  MAX_JSON_ARRAY_ITEMS,
  MAX_JSON_DEPTH,
  MAX_JSON_OBJECT_KEYS,
  MAX_LINK_CHARS,
  MAX_MANIFEST_BYTES,
  MAX_NOTE_CHARS,
  MAX_NOTES,
  MAX_SUMMARY_CHARS,
  MAX_TITLE_CHARS,
} from "../yashOS/forge/manifest-schema.js";

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
    components: [{ id: "hero", type: "hero", title: "Schedule", content: { text: "Plan courses." } }],
    actions: [{ id: "add", type: "add", label: "Add course" }, { id: "reset", type: "reset", label: "Reset" }],
    notes: [],
    ...overrides,
  };
}

function request(overrides = {}) {
  const seedManifest = manifest(overrides.seedManifest);
  return {
    query: "Plan my courses",
    projectId: seedManifest.sourceProjectId,
    scaffoldId: seedManifest.scaffoldId,
    seedManifest,
    registryVersion: seedManifest.registryVersion,
    ...overrides,
  };
}

test("accepts an exact matching Forge request and refinement", () => {
  const parsed = parseForgeRequest(request());
  assert.deepEqual(parsed, { ok: true, value: request() });
  assert.deepEqual(parseRefinedManifest(manifest(), parsed.value), { ok: true, value: manifest() });
});

test("rejects invalid request shapes and target mutations with fixed failures", () => {
  const wrongShape = parseForgeRequest({ ...request(), extra: true });
  assert.deepEqual(wrongShape, { ok: false, code: "INVALID_REQUEST", message: "Request shape is invalid." });
  const parsed = parseForgeRequest(request());
  const changed = parseRefinedManifest(manifest({ inspired: true, sourceProjectId: null }), parsed.value);
  assert.deepEqual(changed, { ok: false, code: "INVALID_MANIFEST", message: "Gemini changed the requested target." });
});

test("rejects blank and overlong queries", () => {
  for (const query of ["", "  ", "x".repeat(301)]) {
    assert.deepEqual(parseForgeRequest(request({ query })), {
      ok: false, code: "INVALID_REQUEST", message: "Query must contain 1–300 characters.",
    });
  }
});

test("propagates every public manifest size code without echoing oversized input", () => {
  const cases = [
    ["manifest bytes", manifest({ data: { text: "manifest-secret-".repeat(MAX_MANIFEST_BYTES) } }), "MANIFEST_TOO_LARGE"],
    ["data bytes", manifest({ data: `data-secret-${"x".repeat(MAX_DATA_BYTES)}` }), "DATA_TOO_LARGE"],
    ["component content bytes", manifest({
      components: [{ ...manifest().components[0], content: { text: `content-secret-${"x".repeat(MAX_COMPONENT_CONTENT_BYTES)}` } }],
    }), "COMPONENT_CONTENT_TOO_LARGE"],
  ];

  const validRequest = parseForgeRequest(request());
  assert.equal(validRequest.ok, true);
  for (const [name, invalidManifest, code] of cases) {
    const seedResult = parseForgeRequest(request({ seedManifest: invalidManifest }));
    const refinedResult = parseRefinedManifest(invalidManifest, validRequest.value);
    assert.deepEqual(seedResult, { ok: false, code, message: "Seed manifest is invalid." }, name);
    assert.deepEqual(refinedResult, { ok: false, code, message: "Gemini returned an invalid manifest." }, name);
    assert.equal(JSON.stringify(seedResult).includes("secret-"), false, name);
    assert.equal(JSON.stringify(refinedResult).includes("secret-"), false, name);
  }
});

test("maps string, count, depth, and null manifest failures to INVALID_MANIFEST", () => {
  let nested = "depth-secret";
  for (let index = 0; index <= MAX_JSON_DEPTH; index += 1) nested = { nested };

  const cases = [
    ["title", manifest({ title: "title-secret-".repeat(MAX_TITLE_CHARS) })],
    ["summary", manifest({ summary: "summary-secret-".repeat(MAX_SUMMARY_CHARS) })],
    ["component text", manifest({
      components: [{ ...manifest().components[0], content: { text: `component-secret-${"x".repeat(MAX_COMPONENT_TEXT_CHARS)}` } }],
    })],
    ["note", manifest({ notes: ["note-secret-".repeat(MAX_NOTE_CHARS)] })],
    ["action label", manifest({
      actions: [{ ...manifest().actions[0], label: "label-secret-".repeat(MAX_ACTION_LABEL_CHARS) }, manifest().actions[1]],
    })],
    ["link", manifest({
      actions: [
        { id: "link", type: "open-link", label: "Open", href: `/${"link-secret-".repeat(MAX_LINK_CHARS)}` },
        manifest().actions[1],
      ],
    })],
    ["components count", manifest({
      components: Array.from({ length: MAX_COMPONENTS + 1 }, (_, index) => ({ ...manifest().components[0], id: `hero-${index}` })),
    })],
    ["actions count", manifest({
      actions: Array.from({ length: MAX_ACTIONS + 1 }, (_, index) => ({ ...manifest().actions[0], id: `add-${index}` })),
    })],
    ["notes count", manifest({ notes: Array.from({ length: MAX_NOTES + 1 }, () => "count-secret") })],
    ["array count", manifest({ data: Array.from({ length: MAX_JSON_ARRAY_ITEMS + 1 }, () => "count-secret") })],
    ["object count", manifest({
      data: Object.fromEntries(Array.from({ length: MAX_JSON_OBJECT_KEYS + 1 }, (_, index) => [`key${index}`, "count-secret"])),
    })],
    ["nested depth", manifest({ data: nested })],
    ["null", null],
  ];

  const validRequest = parseForgeRequest(request());
  assert.equal(validRequest.ok, true);
  for (const [name, invalidManifest] of cases) {
    const seedResult = parseForgeRequest(request({ seedManifest: invalidManifest }));
    const refinedResult = parseRefinedManifest(invalidManifest, validRequest.value);
    assert.deepEqual(seedResult, {
      ok: false, code: "INVALID_MANIFEST", message: "Seed manifest is invalid.",
    }, name);
    assert.deepEqual(refinedResult, {
      ok: false, code: "INVALID_MANIFEST", message: "Gemini returned an invalid manifest.",
    }, name);
    assert.equal(JSON.stringify(seedResult).includes("secret"), false, name);
    assert.equal(JSON.stringify(refinedResult).includes("secret"), false, name);
  }
});
