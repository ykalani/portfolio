import { PROJECTS, getProject } from "./project-registry.js";

export const MATCH_CONFIDENCE_THRESHOLD = 0.15;

const FALLBACK_SCAFFOLDS = Object.freeze([
  ["schedule-planner", ["schedule", "syllabus", "calendar", "booking", "timeline"]],
  ["analytics-dashboard", ["logistics", "metric", "comparison", "recommendation", "dashboard"]],
  ["workflow-builder", ["automation", "agent", "workflow", "tool"]],
  ["simulation-console", ["simulation", "simulate", "producer", "consumer", "process"]],
  ["creative-workbench", ["music", "translation", "editor", "transform", "audio"]],
  ["research-explorer", ["research", "scientific", "classification", "experiment", "data"]],
]);

export const FALLBACK_SCAFFOLD_ASSOCIATIONS = Object.freeze({
  "schedule-planner": "autosched",
  "analytics-dashboard": "michigan-logistics-case-study",
  "workflow-builder": "app-forge",
  "simulation-console": null,
  "creative-workbench": "ai-driven-music-translation",
  "research-explorer": null,
});

const termPattern = /[\p{L}\p{N}]+/gu;
const STOP_WORDS = new Set(["a", "an", "and", "at", "for", "from", "in", "into", "of", "on", "or", "the", "then", "through", "to", "with"]);

export function normalizeQuery(query) {
  if (typeof query !== "string") return [];

  return [...new Set(
    (query.toLowerCase().match(termPattern) ?? []).filter((term) => !STOP_WORDS.has(term)),
  )];
}

function projectTerms(project) {
  return new Set(normalizeQuery([
    project.title,
    ...project.aliases,
    project.summary,
    ...project.technologies,
    ...project.capabilities,
  ].join(" ")));
}

function matchedCapabilities(project, queryTerms) {
  return Object.freeze(project.capabilities.filter((capability) => {
    const capabilityTerms = normalizeQuery(capability);
    return capabilityTerms.length > 0 && capabilityTerms.every((term) => queryTerms.has(term));
  }));
}

export function matchProjects(query) {
  const normalized = normalizeQuery(query);
  if (normalized.length === 0) return [];

  const queryTerms = new Set(normalized);
  return PROJECTS
    .map((project, index) => {
      const terms = projectTerms(project);
      const overlap = normalized.filter((term) => terms.has(term)).length;
      return {
        project,
        score: overlap / normalized.length,
        matchedCapabilities: matchedCapabilities(project, queryTerms),
        index,
      };
    })
    .filter((match) => match.score > 0)
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ project, score, matchedCapabilities: capabilities }) => Object.freeze({
      project,
      score,
      matchedCapabilities: capabilities,
    }));
}

export function selectScaffold(query) {
  const queryTerms = new Set(normalizeQuery(query));
  let selected = FALLBACK_SCAFFOLDS[0][0];
  let bestOverlap = 0;

  for (const [scaffoldId, terms] of FALLBACK_SCAFFOLDS) {
    const overlap = terms.filter((term) => queryTerms.has(term)).length;
    if (overlap > bestOverlap) {
      selected = scaffoldId;
      bestOverlap = overlap;
    }
  }

  return selected;
}

export function decideForgeTarget(query, selectedProjectId = null) {
  const selectedProject = getProject(selectedProjectId);
  if (selectedProject) {
    return {
      sourceProjectId: selectedProject.id,
      scaffoldId: selectedProject.scaffoldId,
      inspired: false,
    };
  }

  const [match] = matchProjects(query);
  if (match && match.score >= MATCH_CONFIDENCE_THRESHOLD) {
    return {
      sourceProjectId: match.project.id,
      scaffoldId: match.project.scaffoldId,
      inspired: false,
    };
  }

  return {
    sourceProjectId: null,
    scaffoldId: selectScaffold(query),
    inspired: true,
  };
}
