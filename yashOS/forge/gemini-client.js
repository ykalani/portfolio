export async function requestRefinement(request, { fetchImpl = fetch, signal } = {}) {
  const response = await fetchImpl("/api/forge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.error?.message ?? `App Forge request failed (${response.status})`);
  }
  return body.manifest;
}

export function createRefinementCoordinator({
  debounceMs = 350,
  requestTimeoutMs = 12_000,
  watchdogMs = 15_000,
  now = () => Date.now(),
  setTimeoutImpl = globalThis.setTimeout,
  clearTimeoutImpl = globalThis.clearTimeout,
  createAbortController = () => new AbortController(),
  fetchManifest = requestRefinement,
} = {}) {
  let current = null;
  let generation = 0;

  const isCurrent = (job) => current === job && !job.settled && job.generation === generation;

  function cancelCurrentGeneration() {
    const job = current;
    generation += 1;
    if (!job) return generation;
    job.settled = true;
    clearTimeoutImpl(job.debounceId);
    clearTimeoutImpl(job.requestTimeoutId);
    clearTimeoutImpl(job.watchdogId);
    job.controller?.abort();
    current = null;
    return generation;
  }

  function settle(job, kind, value) {
    if (!isCurrent(job)) return;
    job.settled = true;
    clearTimeoutImpl(job.debounceId);
    clearTimeoutImpl(job.requestTimeoutId);
    clearTimeoutImpl(job.watchdogId);
    if (kind === "refined") job.onRefined(value);
    else job.onLocal(value);
    current = null;
  }

  return {
    schedule(request, { onRefined, onLocal }) {
      cancelCurrentGeneration();
      const job = {
        id: generation,
        generation,
        queryBecameStableAt: now(),
        debounceId: null,
        requestTimeoutId: null,
        watchdogId: null,
        controller: null,
        settled: false,
        onRefined,
        onLocal,
      };
      current = job;
      job.watchdogId = setTimeoutImpl(() => {
        if (!isCurrent(job)) return;
        job.controller?.abort();
        settle(job, "local", {
          reason: "watchdog",
          elapsedMs: now() - job.queryBecameStableAt,
        });
      }, watchdogMs);
      job.debounceId = setTimeoutImpl(() => {
        if (!isCurrent(job)) return;
        job.controller = createAbortController();
        job.requestTimeoutId = setTimeoutImpl(() => {
          if (!isCurrent(job)) return;
          job.controller.abort();
          settle(job, "local", {
            reason: "request-timeout",
            elapsedMs: now() - job.queryBecameStableAt,
          });
        }, requestTimeoutMs);
        Promise.resolve(fetchManifest(request, { signal: job.controller.signal }))
          .then((manifest) => settle(job, "refined", manifest))
          .catch(() => settle(job, "local", {
            reason: "unavailable",
            elapsedMs: now() - job.queryBecameStableAt,
          }));
      }, debounceMs);
      return job.id;
    },
    cancelCurrentGeneration,
  };
}
