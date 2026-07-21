import { validateManifest } from "../yashOS/forge/manifest-schema.js";

const REQUEST_KEYS = new Set(["query", "projectId", "scaffoldId", "seedManifest", "registryVersion"]);
const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const exactKeys = (value, keys) => isRecord(value)
  && Object.keys(value).length === keys.size
  && Object.keys(value).every((key) => keys.has(key));
const failure = (code, message) => ({ ok: false, code, message });
const manifestFailure = (errors, message) => failure(
  errors.find((code) => code.endsWith("_TOO_LARGE")) ?? "INVALID_MANIFEST",
  message,
);

export function parseForgeRequest(value) {
  if (!exactKeys(value, REQUEST_KEYS)) return failure("INVALID_REQUEST", "Request shape is invalid.");
  if (typeof value.query !== "string" || value.query.length > 300) {
    return failure("INVALID_REQUEST", "Query must contain 1–300 characters.");
  }
  const query = value.query.trim();
  if (!query) return failure("INVALID_REQUEST", "Query must contain 1–300 characters.");
  if (!((typeof value.projectId === "string" && value.projectId) || value.projectId === null)
    || typeof value.scaffoldId !== "string" || !value.scaffoldId
    || !Number.isSafeInteger(value.registryVersion)) {
    return failure("INVALID_REQUEST", "Request target is invalid.");
  }
  const seed = validateManifest(value.seedManifest);
  if (!seed.ok) return manifestFailure(seed.errors, "Seed manifest is invalid.");
  if (seed.value.sourceProjectId !== value.projectId
    || seed.value.scaffoldId !== value.scaffoldId
    || seed.value.registryVersion !== value.registryVersion) {
    return failure("INVALID_MANIFEST", "Seed target does not match request target.");
  }
  return { ok: true, value: { ...value, query, seedManifest: seed.value } };
}

export function parseRefinedManifest(value, request) {
  const refined = validateManifest(value);
  if (!refined.ok) return manifestFailure(refined.errors, "Gemini returned an invalid manifest.");
  if (refined.value.sourceProjectId !== request.projectId
    || refined.value.scaffoldId !== request.scaffoldId
    || refined.value.registryVersion !== request.registryVersion
    || refined.value.inspired !== request.seedManifest.inspired) {
    return failure("INVALID_MANIFEST", "Gemini changed the requested target.");
  }
  return { ok: true, value: refined.value };
}
