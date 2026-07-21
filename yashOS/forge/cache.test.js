import assert from "node:assert/strict";
import test from "node:test";

import { MAX_MANIFEST_BYTES } from "./manifest-schema.js";
import { compileSeedManifest } from "./compiler.js";
import { REGISTRY_VERSION } from "./project-registry.js";
import { createCacheKey, createForgeCache } from "./cache.js";

function manifest(query = "simulate producer consumer") {
  return compileSeedManifest({
    query,
    sourceProjectId: null,
    scaffoldId: "simulation-console",
    inspired: true,
  });
}

function createStorage(initial = "[]") {
  let value = initial;
  return {
    getItem() { return value; },
    setItem(_key, next) { value = next; },
    value() { return value; },
  };
}

test("caches only valid manifests and clones cache boundaries", () => {
  const cache = createForgeCache({
    storage: createStorage(),
    storageKey: "forge",
    maxEntries: 20,
    registryVersion: REGISTRY_VERSION,
  });
  const original = manifest();

  assert.equal(cache.set("known", original), true);
  original.title = "mutated caller";
  const first = cache.get("known");
  first.title = "mutated return";

  assert.notEqual(cache.get("known").title, "mutated caller");
  assert.notEqual(cache.get("known").title, "mutated return");
  assert.deepEqual(cache.snapshot().map(({ key }) => key), ["known"]);
});

test("uses a twenty-entry LRU and promotes reads", () => {
  const cache = createForgeCache({
    storage: createStorage(),
    storageKey: "forge",
    maxEntries: 200,
    registryVersion: REGISTRY_VERSION,
  });
  const seed = manifest();

  for (let index = 0; index < 20; index += 1) {
    assert.equal(cache.set(`entry-${index}`, { ...seed, title: `Seed ${index}` }), true);
  }
  assert.ok(cache.get("entry-0"));
  assert.equal(cache.set("entry-20", { ...seed, title: "Seed 20" }), true);

  assert.equal(cache.get("entry-1"), null);
  assert.ok(cache.get("entry-0"));
  assert.deepEqual(cache.snapshot().map(({ key }) => key), [
    "entry-2", "entry-3", "entry-4", "entry-5", "entry-6",
    "entry-7", "entry-8", "entry-9", "entry-10", "entry-11",
    "entry-12", "entry-13", "entry-14", "entry-15", "entry-16",
    "entry-17", "entry-18", "entry-19", "entry-20", "entry-0",
  ]);
});

test("creates deterministic keys from normalized Forge targets", () => {
  assert.equal(createCacheKey({
    query: "The Producer and consumer",
    projectId: null,
    scaffoldId: "simulation-console",
    registryVersion: 1,
  }), "producer,consumer|none|simulation-console|1");
});

test("invalidates another registry version during hydrate", () => {
  const stale = { ...manifest(), registryVersion: REGISTRY_VERSION - 1 };
  const storage = createStorage(JSON.stringify([{ key: "stale", manifest: stale }]));
  const cache = createForgeCache({
    storage,
    storageKey: "forge",
    maxEntries: 20,
    registryVersion: REGISTRY_VERSION,
  });

  assert.deepEqual(cache.hydrate(), []);
  assert.equal(cache.get("stale"), null);
});

test("rejects invalid cached entries before they can reach a mount path", () => {
  const invalid = { ...manifest(), actions: [] };
  const storage = createStorage(JSON.stringify([{ key: "invalid", manifest: invalid }]));
  const cache = createForgeCache({
    storage,
    storageKey: "forge",
    maxEntries: 20,
    registryVersion: REGISTRY_VERSION,
  });
  let mounted = false;

  cache.hydrate();
  const cached = cache.get("invalid");
  if (cached) mounted = true;

  assert.equal(cached, null);
  assert.equal(mounted, false);
});

test("rejects a manifest exceeding the byte limit without retaining it", () => {
  const cache = createForgeCache({
    storage: createStorage(),
    storageKey: "forge",
    maxEntries: 20,
    registryVersion: REGISTRY_VERSION,
  });
  const oversized = {
    ...manifest(),
    data: { text: "x".repeat(MAX_MANIFEST_BYTES + 1) },
  };

  assert.equal(cache.set("oversized", oversized), false);
  assert.equal(cache.get("oversized"), null);
  assert.deepEqual(cache.snapshot(), []);
});

test("keeps valid memory entries usable when storage reads, parses, or writes fail", () => {
  const storage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
  };
  const cache = createForgeCache({
    storage,
    storageKey: "forge",
    maxEntries: 20,
    registryVersion: REGISTRY_VERSION,
  });
  const known = manifest();

  assert.equal(cache.set("known", known), true);
  assert.deepEqual(cache.hydrate().map(({ key }) => key), ["known"]);
  assert.deepEqual(cache.get("known"), known);

  storage.getItem = () => "{";
  assert.deepEqual(cache.hydrate().map(({ key }) => key), ["known"]);
  assert.deepEqual(cache.get("known"), known);

  storage.getItem = () => "[]";
  assert.deepEqual(cache.hydrate(), []);
  assert.deepEqual(cache.snapshot(), []);
});
