import assert from "node:assert/strict";
import test from "node:test";

import { compileSeedManifest, INTERPRETATION_COPY } from "./compiler.js";
import { decideForgeTarget } from "./intent-matcher.js";
import { SCAFFOLD_IDS, getScaffold } from "./scaffolds.js";

const expectedTypes = {
  "schedule-planner": ["hero", "calendar", "timeline", "data-table", "form"],
  "analytics-dashboard": ["hero", "stat-grid", "chart", "data-table"],
  "workflow-builder": ["hero", "timeline", "activity-log", "chat"],
  "simulation-console": ["hero", "stat-grid", "canvas", "activity-log"],
  "creative-workbench": ["hero", "canvas", "form", "data-table"],
  "research-explorer": ["hero", "chart", "data-table", "form"],
};

test("compiles all six deterministic fallback seeds with their exact shapes", () => {
  for (const scaffoldId of SCAFFOLD_IDS) {
    const target = { query: `make ${scaffoldId}`, sourceProjectId: null, scaffoldId, inspired: true };
    const first = compileSeedManifest(target);
    const second = compileSeedManifest(target);

    assert.deepEqual(first, second);
    assert.deepEqual(first.components.map(({ type }) => type), expectedTypes[scaffoldId]);
    assert.ok(first.actions.length >= 2 && first.actions.length <= 4);
    assert.deepEqual(first.notes, []);
  }
});

test("labels all below-threshold fallback decisions as interpretations", () => {
  for (const query of ["booking", "simulate process", "scientific experiment"]) {
    const decision = decideForgeTarget(query);
    const result = compileSeedManifest({ query, ...decision });

    assert.equal(result.sourceProjectId, null);
    assert.equal(result.inspired, true);
    assert.equal(result.summary, INTERPRETATION_COPY);
    assert.equal(result.components.find(({ id }) => id === "hero").content.text, INTERPRETATION_COPY);
    if (decision.scaffoldId === "schedule-planner") {
      assert.equal(result.title.includes("AutoSched"), false);
      assert.equal(result.summary.includes("AutoSched"), false);
      assert.deepEqual(result.data.courses.slice(0, 2), ["Algorithms", "Databases"]);
    }
  }
});

test("compiles a verified project only with its matching scaffold", () => {
  const result = compileSeedManifest({
    query: "plan my schedule",
    sourceProjectId: "autosched",
    scaffoldId: "schedule-planner",
    inspired: false,
  });

  assert.equal(result.inspired, false);
  assert.equal(result.sourceProjectId, "autosched");
  assert.equal(result.title, "AutoSched");
});

test("rejects invalid Forge targets and unvalidated scaffold candidates", () => {
  assert.throws(() => compileSeedManifest({
    query: "plan",
    sourceProjectId: "autosched",
    scaffoldId: "analytics-dashboard",
    inspired: false,
  }), /source project is invalid/i);
  assert.throws(() => compileSeedManifest({
    query: "plan",
    sourceProjectId: "autosched",
    scaffoldId: "schedule-planner",
    inspired: true,
  }), /cannot claim a source project/i);

  const scaffold = getScaffold("schedule-planner");
  const createSeed = scaffold.createSeed;
  scaffold.createSeed = () => ({ ...createSeed("plan"), actions: [] });
  assert.throws(() => compileSeedManifest({
    query: "plan",
    sourceProjectId: "autosched",
    scaffoldId: "schedule-planner",
    inspired: false,
  }), /INVALID_ACTIONS/);
  scaffold.createSeed = createSeed;
});
