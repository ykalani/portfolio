import assert from "node:assert/strict";
import test from "node:test";

import { PROJECTS, PROJECT_BY_ID, REGISTRY_VERSION, getProject } from "./project-registry.js";

test("exports versioned immutable records for exactly the verified projects", () => {
  assert.equal(REGISTRY_VERSION, 1);
  assert.deepEqual(
    PROJECTS.map((project) => project.id),
    [
      "autosched",
      "michigan-logistics-case-study",
      "app-forge",
      "ai-driven-music-translation",
    ],
  );
  assert.ok(Object.isFrozen(PROJECTS));

  for (const project of PROJECTS) {
    assert.ok(Object.isFrozen(project));
    assert.ok(Object.isFrozen(project.aliases));
    assert.ok(Object.isFrozen(project.capabilities));
    assert.ok(Object.isFrozen(project.technologies));
    assert.equal(project.links.repository, "");
    assert.equal(project.links.demo, "");
    assert.equal(PROJECT_BY_ID[project.id], project);
    assert.equal(getProject(project.id), project);
  }

  assert.equal(getProject("unknown"), null);
});

test("keeps the verified AutoSched details intact", () => {
  assert.deepEqual(getProject("autosched"), {
    id: "autosched",
    title: "AutoSched",
    aliases: ["class scheduler", "class schedule", "syllabus parser", "calendar sync"],
    summary: "Extracts lectures and exams from uploaded syllabi or screenshots, then syncs them to Google Calendar.",
    technologies: ["React", "OpenAI API", "Tesseract OCR", "Google Calendar"],
    capabilities: ["extract dates", "organize courses", "build schedules"],
    scaffoldId: "schedule-planner",
    links: { repository: "", demo: "" },
  });
});

test("rejects inherited object members as project IDs", () => {
  assert.equal(getProject("toString"), null);
});
