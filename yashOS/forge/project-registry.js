import registry from "./project-registry.json" with { type: "json" };

function freezeValue(value) {
  if (Array.isArray(value)) {
    value.forEach(freezeValue);
  } else if (value && typeof value === "object") {
    Object.values(value).forEach(freezeValue);
  }

  return Object.freeze(value);
}

export const REGISTRY_VERSION = registry.version;
export const PROJECTS = freezeValue(registry.projects);
export const PROJECT_BY_ID = freezeValue(
  Object.fromEntries(PROJECTS.map((project) => [project.id, project])),
);

export function getProject(id) {
  return typeof id === "string" && Object.hasOwn(PROJECT_BY_ID, id)
    ? PROJECT_BY_ID[id]
    : null;
}
