import { REGISTRY_VERSION, getProject } from "./project-registry.js";
import { getScaffold } from "./scaffolds.js";

export const MAX_MANIFEST_BYTES = 48 * 1024;
export const MAX_DATA_BYTES = 24 * 1024;
export const MAX_COMPONENT_CONTENT_BYTES = 8 * 1024;
export const MAX_JSON_DEPTH = 8;
export const MAX_JSON_ARRAY_ITEMS = 50;
export const MAX_JSON_OBJECT_KEYS = 20;
export const MAX_TITLE_CHARS = 120;
export const MAX_SUMMARY_CHARS = 600;
export const MAX_COMPONENT_TEXT_CHARS = 1_000;
export const MAX_NOTE_CHARS = 400;
export const MAX_ACTION_LABEL_CHARS = 120;
export const MAX_LINK_CHARS = 2_048;
export const MAX_COMPONENTS = 6;
export const MAX_ACTIONS = 4;
export const MAX_NOTES = 8;
export const MAX_ID_CHARS = 64;
export const MAX_THEME_COLOR_CHARS = 7;
export const ACTION_ID = /^[a-z][a-z0-9-]{0,63}$/;

export const COMPONENT_TYPES = new Set([
  "hero", "stat-grid", "data-table", "timeline", "calendar", "form",
  "chart", "activity-log", "canvas", "chat",
]);
export const ACTION_TYPES = new Set([
  "select", "filter", "sort", "toggle", "add", "remove", "calculate",
  "simulate", "reset", "open-link",
]);
export const SURFACE_TYPES = new Set(["glass"]);

const encoder = new TextEncoder();
const MANIFEST_KEYS = [
  "version", "registryVersion", "sourceProjectId", "scaffoldId", "inspired",
  "title", "summary", "theme", "data", "components", "actions", "notes",
];
const COMPONENT_KEYS = ["id", "type", "title", "content"];
const ACTION_KEYS = ["id", "type", "label"];
const OPEN_LINK_ACTION_KEYS = [...ACTION_KEYS, "href"];
const THEME_KEYS = ["accent", "surface"];

function isRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function hasExactKeys(value, keys) {
  return isRecord(value)
    && Object.keys(value).length === keys.length
    && keys.every((key) => Object.hasOwn(value, key));
}

function serializedBytes(value) {
  try {
    return encoder.encode(JSON.stringify(value)).byteLength;
  } catch {
    return Infinity;
  }
}

function boundedJson(value, depth = 0) {
  if (depth > MAX_JSON_DEPTH || value === null) return depth <= MAX_JSON_DEPTH;
  if (typeof value === "string") return value.length <= MAX_COMPONENT_TEXT_CHARS;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "boolean") return true;
  if (Array.isArray(value)) {
    return value.length <= MAX_JSON_ARRAY_ITEMS
      && value.every((entry) => boundedJson(entry, depth + 1));
  }
  return isRecord(value)
    && Object.keys(value).length <= MAX_JSON_OBJECT_KEYS
    && Object.values(value).every((entry) => boundedJson(entry, depth + 1));
}

function addSizeErrors(input, errors) {
  if (serializedBytes(input) > MAX_MANIFEST_BYTES) errors.push("MANIFEST_TOO_LARGE");
  if (serializedBytes(input?.data) > MAX_DATA_BYTES) errors.push("DATA_TOO_LARGE");
  for (const component of Array.isArray(input?.components) ? input.components : []) {
    if (isRecord(component?.content)
      && serializedBytes(component.content) > MAX_COMPONENT_CONTENT_BYTES) {
      errors.push("COMPONENT_CONTENT_TOO_LARGE");
    }
  }
}

function validId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_ID_CHARS;
}

export function isValidActionId(value) {
  return typeof value === "string" && ACTION_ID.test(value);
}

function invalid(errors, code) {
  if (!errors.includes(code)) errors.push(code);
}

export function isAllowedOpenLink(href, projectId, origin, lookupProject = getProject) {
  if (typeof href !== "string"
    || href.length < 1
    || href.length > MAX_LINK_CHARS
    || href.includes("\\")) return false;

  let url;
  try {
    url = new URL(href, origin);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (href.startsWith("/") && !href.startsWith("//")) {
    if (url.origin !== origin) return false;
    try {
      return !decodeURIComponent(url.pathname).includes("\\");
    } catch {
      return false;
    }
  }

  const project = lookupProject(projectId);
  if (!project || !isRecord(project.links)) return false;
  const verified = Object.values(project.links)
    .filter((link) => typeof link === "string" && link.length > 0 && /^https:\/\//.test(link))
    .find((link) => link === href);
  if (!verified) return false;

  try {
    const verifiedUrl = new URL(verified);
    return url.href === verifiedUrl.href
      && url.protocol === "https:"
      && !url.username
      && !url.password;
  } catch {
    return false;
  }
}

export function validateManifest(input) {
  const errors = [];
  addSizeErrors(input, errors);
  if (errors.length > 0) return { ok: false, errors };

  if (!hasExactKeys(input, MANIFEST_KEYS)) {
    invalid(errors, "INVALID_MANIFEST_KEYS");
    return { ok: false, errors };
  }
  if (input.version !== 1) invalid(errors, "INVALID_MANIFEST_VERSION");
  if (input.registryVersion !== REGISTRY_VERSION) invalid(errors, "INVALID_REGISTRY_VERSION");
  if (!validId(input.scaffoldId) || !getScaffold(input.scaffoldId)) invalid(errors, "INVALID_SCAFFOLD");
  if (typeof input.inspired !== "boolean") invalid(errors, "INVALID_INSPIRED");
  if (input.sourceProjectId !== null && !validId(input.sourceProjectId)) invalid(errors, "INVALID_SOURCE_PROJECT");
  if (typeof input.title !== "string" || input.title.length > MAX_TITLE_CHARS) invalid(errors, "INVALID_TITLE");
  if (typeof input.summary !== "string" || input.summary.length > MAX_SUMMARY_CHARS) invalid(errors, "INVALID_SUMMARY");

  if (!hasExactKeys(input.theme, THEME_KEYS)) {
    invalid(errors, "INVALID_THEME_KEYS");
  } else if (
    typeof input.theme.accent !== "string"
    || input.theme.accent.length > MAX_THEME_COLOR_CHARS
    || !/^#[0-9a-fA-F]{6}$/.test(input.theme.accent)
    || typeof input.theme.surface !== "string"
    || !SURFACE_TYPES.has(input.theme.surface)) {
    invalid(errors, "INVALID_THEME");
  }
  if (!boundedJson(input.data)) invalid(errors, "INVALID_DATA");

  if (!Array.isArray(input.components)
    || input.components.length < 1
    || input.components.length > MAX_COMPONENTS) {
    invalid(errors, "INVALID_COMPONENTS");
  } else {
    const componentIds = new Set();
    for (const component of input.components) {
      if (!hasExactKeys(component, COMPONENT_KEYS)) {
        invalid(errors, "INVALID_COMPONENT_KEYS");
        continue;
      }
      if (!validId(component.id) || componentIds.has(component.id)) invalid(errors, "INVALID_COMPONENT_ID");
      componentIds.add(component.id);
      if (!COMPONENT_TYPES.has(component.type)) invalid(errors, "INVALID_COMPONENT_TYPE");
      if (typeof component.title !== "string" || component.title.length > MAX_TITLE_CHARS) {
        invalid(errors, "INVALID_COMPONENT_TITLE");
      }
      if (!isRecord(component.content) || !boundedJson(component.content)) {
        invalid(errors, "INVALID_COMPONENT_CONTENT");
      }
    }
  }

  if (!Array.isArray(input.actions)
    || input.actions.length < 2
    || input.actions.length > MAX_ACTIONS) {
    invalid(errors, "INVALID_ACTIONS");
  } else {
    const actionIds = new Set();
    for (const action of input.actions) {
      const expectedKeys = action?.type === "open-link" ? OPEN_LINK_ACTION_KEYS : ACTION_KEYS;
      if (!hasExactKeys(action, expectedKeys)) {
        invalid(errors, "INVALID_ACTION_KEYS");
        continue;
      }
      if (!isValidActionId(action.id) || actionIds.has(action.id)) invalid(errors, "INVALID_ACTION_ID");
      actionIds.add(action.id);
      if (!ACTION_TYPES.has(action.type)) invalid(errors, "INVALID_ACTION_TYPE");
      if (typeof action.label !== "string" || action.label.length > MAX_ACTION_LABEL_CHARS) {
        invalid(errors, "INVALID_ACTION_LABEL");
      }
      if (action.type === "open-link"
        && (typeof action.href !== "string" || action.href.length > MAX_LINK_CHARS)) {
        invalid(errors, "INVALID_ACTION_HREF");
      }
    }
  }

  if (!Array.isArray(input.notes)
    || input.notes.length > MAX_NOTES
    || input.notes.some((note) => typeof note !== "string" || note.length > MAX_NOTE_CHARS)) {
    invalid(errors, "INVALID_NOTES");
  }

  if (input.inspired === true && input.sourceProjectId !== null) {
    invalid(errors, "INSPIRED_SOURCE_PROJECT");
  } else if (input.inspired === false) {
    const sourceProject = getProject(input.sourceProjectId);
    if (!sourceProject || sourceProject.scaffoldId !== input.scaffoldId) {
      invalid(errors, "INVALID_SOURCE_PROJECT");
    }
  }

  if (errors.length > 0) return { ok: false, errors };

  for (const action of input.actions) {
    if (action.type === "open-link"
      && !isAllowedOpenLink(action.href, input.sourceProjectId, "https://forge.invalid")) {
      invalid(errors, "INVALID_OPEN_LINK");
    }
  }

  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: input };
}
