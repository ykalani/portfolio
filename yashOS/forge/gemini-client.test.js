import assert from "node:assert/strict";
import test from "node:test";

import { createRefinementCoordinator, requestRefinement } from "./gemini-client.js";

class FakeClock {
  constructor() {
    this.time = 0;
    this.nextId = 1;
    this.timers = new Map();
    this.cleared = [];
  }

  setTimeout = (callback, delay) => {
    const id = this.nextId++;
    this.timers.set(id, { callback, due: this.time + delay });
    return id;
  };

  clearTimeout = (id) => {
    this.cleared.push(id);
    this.timers.delete(id);
  };

  advance(ms) {
    const target = this.time + ms;
    while (true) {
      const next = [...this.timers.entries()]
        .filter(([, timer]) => timer.due <= target)
        .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0];
      if (!next) break;
      const [id, timer] = next;
      this.timers.delete(id);
      this.time = timer.due;
      timer.callback();
    }
    this.time = target;
  }
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, reject, resolve };
}

function coordinator(clock, fetchManifest, options = {}) {
  return createRefinementCoordinator({
    now: () => clock.time,
    setTimeoutImpl: clock.setTimeout,
    clearTimeoutImpl: clock.clearTimeout,
    fetchManifest,
    ...options,
  });
}

test("does not start refinement fetch before the 350ms debounce", () => {
  const clock = new FakeClock();
  let calls = 0;
  const refine = coordinator(clock, () => {
    calls += 1;
    return new Promise(() => {});
  });

  refine.schedule({ query: "schedule" }, { onRefined() {}, onLocal() {} });
  clock.advance(349);
  assert.equal(calls, 0);
  clock.advance(1);
  assert.equal(calls, 1);
});

test("passes the active job AbortSignal to custom refinement fetches", () => {
  const clock = new FakeClock();
  let received;
  const refine = coordinator(clock, (_request, options) => {
    received = options;
    return new Promise(() => {});
  });

  refine.schedule({ query: "schedule" }, { onRefined() {}, onLocal() {} });
  clock.advance(350);

  assert.ok(received.signal instanceof AbortSignal);
  assert.equal(received.signal.aborted, false);
});

test("aborts a hanging request twelve seconds after its request starts", () => {
  const clock = new FakeClock();
  let signal;
  const local = [];
  const refine = coordinator(clock, (_request, options) => {
    signal = options.signal;
    return new Promise(() => {});
  });

  refine.schedule({ query: "schedule" }, { onRefined() {}, onLocal: (value) => local.push(value) });
  clock.advance(350);
  clock.advance(11_999);
  assert.equal(signal.aborted, false);
  assert.deepEqual(local, []);
  clock.advance(1);

  assert.equal(signal.aborted, true);
  assert.deepEqual(local, [{ reason: "request-timeout", elapsedMs: 12_350 }]);
});

test("returns to local mode at the absolute watchdog deadline despite debounce", () => {
  const clock = new FakeClock();
  const local = [];
  const refine = coordinator(clock, () => new Promise(() => {}), {
    requestTimeoutMs: 20_000,
  });

  refine.schedule({ query: "schedule" }, { onRefined() {}, onLocal: (value) => local.push(value) });
  clock.advance(14_999);
  assert.deepEqual(local, []);
  clock.advance(1);

  assert.deepEqual(local, [{ reason: "watchdog", elapsedMs: 15_000 }]);
});

test("settles a current generation with refinement only once", async () => {
  const clock = new FakeClock();
  const request = deferred();
  const refined = [];
  const local = [];
  const refine = coordinator(clock, () => request.promise);

  refine.schedule({ query: "schedule" }, {
    onRefined: (value) => refined.push(value),
    onLocal: (value) => local.push(value),
  });
  clock.advance(350);
  request.resolve({ title: "Refined" });
  await Promise.resolve();
  await Promise.resolve();
  clock.advance(15_000);

  assert.deepEqual(refined, [{ title: "Refined" }]);
  assert.deepEqual(local, []);
});

test("cancels all timers and suppresses a stale generation completion", async () => {
  const clock = new FakeClock();
  const request = deferred();
  let signal;
  const callbacks = [];
  const refine = coordinator(clock, (_request, options) => {
    signal = options.signal;
    return request.promise;
  });

  refine.schedule({ query: "schedule" }, {
    onRefined: () => callbacks.push("refined"),
    onLocal: () => callbacks.push("local"),
  });
  clock.advance(350);
  const generation = refine.cancelCurrentGeneration();
  request.resolve({ title: "late" });
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(generation, 2);
  assert.equal(signal.aborted, true);
  assert.deepEqual(callbacks, []);
  assert.equal(clock.timers.size, 0);
  assert.ok(clock.cleared.length >= 3);
});

test("requestRefinement forwards its exact signal to the injected fetch implementation", async () => {
  const controller = new AbortController();
  let request;
  const manifest = { title: "Refined" };

  assert.deepEqual(await requestRefinement({ query: "schedule" }, {
    signal: controller.signal,
    fetchImpl: async (_url, options) => {
      request = options;
      return { ok: true, json: async () => ({ manifest }) };
    },
  }), manifest);
  assert.equal(request.signal, controller.signal);
  assert.deepEqual(JSON.parse(request.body), { query: "schedule" });
});
