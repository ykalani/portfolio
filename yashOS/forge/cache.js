import { normalizeQuery } from "./intent-matcher.js";
import { validateManifest } from "./manifest-schema.js";

export function createCacheKey({ query, projectId, scaffoldId, registryVersion }) {
  return [normalizeQuery(query), projectId ?? "none", scaffoldId, registryVersion].join("|");
}

export function createForgeCache({ storage, storageKey, maxEntries, registryVersion }) {
  const capacity = Number.isInteger(maxEntries) && maxEntries > 0
    ? Math.min(maxEntries, 20)
    : 20;
  let entries = [];

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const validEntry = (entry) => entry && typeof entry.key === "string" && entry.key.length > 0
    && entry.manifest?.registryVersion === registryVersion
    && validateManifest(entry.manifest).ok;
  const snapshot = () => entries.map(clone);
  const persist = () => {
    try {
      storage?.setItem(storageKey, JSON.stringify(snapshot()));
    } catch {
      // Cache remains usable in memory when persistence is unavailable.
    }
  };
  const normalize = (candidate) => Array.isArray(candidate)
    ? candidate.filter(validEntry).slice(-capacity).map(clone)
    : [];

  return {
    get(key) {
      const index = entries.findIndex((entry) => entry.key === key);
      if (index < 0) return null;
      const entry = entries[index];
      if (!validEntry(entry)) {
        entries.splice(index, 1);
        persist();
        return null;
      }
      entries.splice(index, 1);
      entries.push(clone(entry));
      persist();
      return clone(entry.manifest);
    },
    set(key, manifest) {
      const entry = { key, manifest };
      if (!validEntry(entry)) return false;
      entries = entries.filter((candidate) => candidate.key !== key && validEntry(candidate));
      entries.push(clone(entry));
      entries = entries.slice(-capacity);
      persist();
      return true;
    },
    hydrate() {
      try {
        const stored = JSON.parse(storage?.getItem(storageKey) ?? "[]");
        entries = normalize(stored);
      } catch {
        // Retain current valid in-memory entries.
      }
      return snapshot();
    },
    snapshot() {
      return snapshot();
    },
  };
}
