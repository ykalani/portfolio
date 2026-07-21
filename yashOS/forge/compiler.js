import { REGISTRY_VERSION, getProject } from "./project-registry.js";
import { getScaffold } from "./scaffolds.js";
import { validateManifest } from "./manifest-schema.js";

export const INTERPRETATION_COPY = "A new interpretation inspired by Yash's work.";

export function compileSeedManifest({ query, sourceProjectId, scaffoldId, inspired }) {
  const scaffold = getScaffold(scaffoldId);
  const sourceProject = sourceProjectId === null ? null : getProject(sourceProjectId);
  if (!scaffold || typeof query !== "string" || !query.trim()) {
    throw new Error("Forge target is invalid.");
  }

  const interpretation = inspired === true;
  if (interpretation && sourceProjectId !== null) {
    throw new Error("Inspired Forge targets cannot claim a source project.");
  }
  if (!interpretation && (!sourceProject || sourceProject.scaffoldId !== scaffoldId)) {
    throw new Error("Forge source project is invalid.");
  }

  const seed = scaffold.createSeed(query.trim());
  const title = interpretation ? seed.components[0].title : sourceProject.title;
  const summary = interpretation ? INTERPRETATION_COPY : sourceProject.summary;
  const components = seed.components.map((component) => component.id === "hero"
    ? {
      ...component,
      content: {
        ...component.content,
        text: interpretation ? INTERPRETATION_COPY : component.content.text,
      },
    }
    : component);

  const result = validateManifest({
    version: 1,
    registryVersion: REGISTRY_VERSION,
    sourceProjectId,
    scaffoldId,
    inspired: interpretation,
    title,
    summary,
    theme: seed.theme,
    data: seed.data,
    components,
    actions: seed.actions,
    notes: [],
  });
  if (!result.ok) throw new Error(result.errors.join("; "));
  return result.value;
}
