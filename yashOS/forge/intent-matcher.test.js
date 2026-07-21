import assert from "node:assert/strict";
import test from "node:test";

import { getProject } from "./project-registry.js";
import {
  FALLBACK_SCAFFOLD_ASSOCIATIONS,
  decideForgeTarget,
  matchProjects,
  normalizeQuery,
  selectScaffold,
} from "./intent-matcher.js";

test("normalizes queries into deterministic unique terms", () => {
  assert.deepEqual(
    normalizeQuery("  AutoSched: Syllabus-parser & CALENDAR sync!  "),
    ["autosched", "syllabus", "parser", "calendar", "sync"],
  );
  assert.deepEqual(normalizeQuery(null), []);
});

test("ranks an exact AutoSched query first", () => {
  const matches = matchProjects("AutoSched");

  assert.equal(matches[0].project.id, "autosched");
  assert.ok(matches[0].score > 0.15);
  assert.deepEqual(matches[0].matchedCapabilities, []);
  assert.ok(Object.isFrozen(matches[0].project));
  assert.ok(Object.isFrozen(matches[0].matchedCapabilities));
});

test("matches complete verified capabilities and keeps result ranking deterministic", () => {
  const first = matchProjects("extract dates and organize courses");
  const second = matchProjects("extract dates and organize courses");

  assert.equal(first[0].project.id, "autosched");
  assert.deepEqual(first[0].matchedCapabilities, ["extract dates", "organize courses"]);
  assert.deepEqual(first, second);
});

test("uses verified selected projects directly", () => {
  assert.deepEqual(decideForgeTarget("unrelated", "autosched"), {
    sourceProjectId: "autosched",
    scaffoldId: "schedule-planner",
    inspired: false,
  });
  assert.deepEqual(decideForgeTarget("unrelated", "missing-project"), {
    sourceProjectId: null,
    scaffoldId: "schedule-planner",
    inspired: true,
  });
});

test("does not treat inherited keys as verified Forge selections", () => {
  assert.deepEqual(decideForgeTarget("unrelated", "toString"), {
    sourceProjectId: null,
    scaffoldId: "schedule-planner",
    inspired: true,
  });
});

test("keeps the complete fallback association table separate from decisions", () => {
  assert.deepEqual(FALLBACK_SCAFFOLD_ASSOCIATIONS, {
    "schedule-planner": "autosched",
    "analytics-dashboard": "michigan-logistics-case-study",
    "workflow-builder": "app-forge",
    "simulation-console": null,
    "creative-workbench": "ai-driven-music-translation",
    "research-explorer": null,
  });
  assert.ok(Object.isFrozen(FALLBACK_SCAFFOLD_ASSOCIATIONS));
});

test("selects every fallback scaffold from its complete fixed table", () => {
  const fallbacks = [
    ["schedule-planner", "booking request"],
    ["analytics-dashboard", "compare metric options"],
    ["workflow-builder", "automation tool"],
    ["simulation-console", "simulate a producer process"],
    ["creative-workbench", "transform a sketch"],
    ["research-explorer", "scientific classification data"],
  ];

  for (const [scaffoldId, query] of fallbacks) {
    assert.equal(selectScaffold(query), scaffoldId);
    assert.deepEqual(decideForgeTarget(query), {
      sourceProjectId: null,
      scaffoldId,
      inspired: true,
    });
  }
});

test("does not expose AutoSched for a below-threshold mapped schedule fallback", () => {
  assert.deepEqual(decideForgeTarget("booking"), {
    sourceProjectId: null,
    scaffoldId: "schedule-planner",
    inspired: true,
  });
});

test("keeps simulation and research fallbacks unassociated with project records", () => {
  for (const [query, scaffoldId] of [
    ["simulate process", "simulation-console"],
    ["scientific experiment", "research-explorer"],
  ]) {
    const decision = decideForgeTarget(query);
    assert.deepEqual(decision, { sourceProjectId: null, scaffoldId, inspired: true });
    assert.equal(getProject(decision.sourceProjectId), null);
  }
});

test("matches locally in under fifty milliseconds", () => {
  const start = performance.now();
  const matches = matchProjects("AutoSched calendar schedule extract dates");
  const elapsed = performance.now() - start;

  assert.equal(matches[0].project.id, "autosched");
  assert.ok(elapsed < 50, `matching took ${elapsed.toFixed(3)} ms`);
});
