import assert from "node:assert/strict";
import test from "node:test";

import { getScaffold, SCAFFOLD_IDS, SCAFFOLDS } from "./scaffolds.js";

const componentTypes = new Set([
  "hero", "calendar", "timeline", "data-table", "form", "stat-grid", "chart",
  "activity-log", "chat", "canvas",
]);

test("provides all six deterministic scaffold factories", () => {
  assert.deepEqual(SCAFFOLD_IDS, [
    "schedule-planner", "analytics-dashboard", "workflow-builder",
    "simulation-console", "creative-workbench", "research-explorer",
  ]);
  assert.equal(SCAFFOLDS.size, SCAFFOLD_IDS.length);
  assert.equal(getScaffold("missing"), null);

  for (const id of SCAFFOLD_IDS) {
    const factory = getScaffold(id);
    const first = factory.createSeed("example query");
    const second = factory.createSeed("example query");

    assert.deepEqual(first, second);
    assert.ok(first.components.length >= 1 && first.components.length <= 6);
    assert.ok(first.actions.length >= 2 && first.actions.length <= 4);
    assert.equal(first.data.query, "example query");
    assert.equal(first.theme.surface, "glass");

    for (const component of first.components) {
      assert.equal(typeof component.id, "string");
      assert.ok(componentTypes.has(component.type));
      assert.equal(typeof component.title, "string");
      assert.equal(typeof component.content, "object");
    }

    for (const action of first.actions) {
      assert.equal(typeof action.id, "string");
      assert.equal(typeof action.type, "string");
      assert.equal(typeof action.label, "string");
      if ("href" in action) assert.equal(typeof action.href, "string");
    }
  }
});

test("starts schedule seeds with exactly two course rows", () => {
  assert.deepEqual(
    getScaffold("schedule-planner").createSeed("plan").data.courses,
    ["Algorithms", "Databases"],
  );
});
