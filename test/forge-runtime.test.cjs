const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const test = require("node:test");

const {
  BODY_READ_TIMEOUT_MS,
  MAX_GEMINI_RESPONSE_BYTES,
  createRefineManifest,
  errorBody,
  readJsonBody,
  disposeStoppedInboundAfterResponse,
} = require("../api/forge-runtime.cjs");
const { MAX_BODY_BYTES } = require("../api/forge-guards.cjs");
const { createForgeHandler } = require("../api/forge.js");

function createBodyStream(headers = {}) {
  const req = new EventEmitter();
  req.headers = headers;
  req.complete = false;
  req.destroyed = false;
  req.destroyCalls = 0;
  req.pauseCalls = 0;
  req.destroy = () => { req.destroyed = true; req.destroyCalls += 1; };
  req.pause = () => { req.pauseCalls += 1; };
  req.resume = () => { req.resumed = true; };
  return req;
}

function createFakeTimers() {
  const timers = new Map();
  let nextId = 0;
  return {
    setTimeoutImpl(callback, ms) { const id = ++nextId; timers.set(id, { callback, ms }); return id; },
    clearTimeoutImpl(id) { timers.delete(id); },
    run(ms) {
      for (const [id, timer] of [...timers]) {
        if (timer.ms === ms) { timers.delete(id); timer.callback(); }
      }
    },
  };
}

function manifest(overrides = {}) {
  return {
    version: 1,
    registryVersion: 1,
    sourceProjectId: "autosched",
    scaffoldId: "schedule-planner",
    inspired: false,
    title: "Schedule",
    summary: "Plan a course schedule.",
    theme: { accent: "#123ABC", surface: "glass" },
    data: { courses: ["Algorithms"] },
    components: [{ id: "hero", type: "hero", title: "Schedule", content: { text: "Plan courses." } }],
    actions: [{ id: "add", type: "add", label: "Add course" }, { id: "reset", type: "reset", label: "Reset" }],
    notes: [],
    ...overrides,
  };
}

function requestPayload() {
  const seedManifest = manifest();
  return {
    query: "Plan my courses",
    projectId: seedManifest.sourceProjectId,
    scaffoldId: seedManifest.scaffoldId,
    seedManifest,
    registryVersion: seedManifest.registryVersion,
  };
}

function createUpstreamResponse(statusCode) {
  const response = new EventEmitter();
  response.statusCode = statusCode;
  response.destroyCalls = 0;
  response.destroy = () => { response.destroyCalls += 1; };
  return response;
}

function createHttpsMock(onEnd) {
  const mock = {
    request: null,
    requestImpl(_options, callback) {
      const request = new EventEmitter();
      request.destroyCalls = 0;
      request.write = (body) => { request.body = body; };
      request.end = () => onEnd(request, callback);
      request.setTimeout = (ms, handler) => {
        request.timeoutMs = ms;
        request.timeoutHandler = handler;
      };
      request.destroy = (error) => {
        request.destroyCalls += 1;
        request.emit("error", error);
      };
      mock.request = request;
      return request;
    },
  };
  return mock;
}

test("formats fixed public errors", () => {
  assert.deepEqual(errorBody("INVALID_REQUEST", "Request shape is invalid."), {
    error: { code: "INVALID_REQUEST", message: "Request shape is invalid." },
  });
});

test("Gemini refinement maps injected HTTPS success and upstream failures to fixed responses", async () => {
  const success = createHttpsMock((request, callback) => {
    const response = createUpstreamResponse(200);
    callback(response);
    response.emit("data", Buffer.from(JSON.stringify({
      candidates: [{ content: { parts: [{ text: JSON.stringify(manifest()) }] } }],
    })));
    response.emit("end");
  });
  const refineSuccess = createRefineManifest({ httpsRequest: success.requestImpl, apiKey: "test-key" });
  assert.deepEqual(await refineSuccess(requestPayload()), { status: 200, body: { manifest: manifest() } });
  assert.equal(success.request.timeoutMs, 11_000);

  for (const [name, statusCode, text] of [
    ["unsuccessful", 503, "upstream-secret"],
    ["invalid JSON", 200, "{not-json"],
    ["fenced JSON", 200, "```json\n{}"],
  ]) {
    const upstream = createHttpsMock((request, callback) => {
      const response = createUpstreamResponse(statusCode);
      callback(response);
      response.emit("data", Buffer.from(JSON.stringify({
        candidates: [{ content: { parts: [{ text }] } }],
      })));
      response.emit("end");
    });
    const refine = createRefineManifest({ httpsRequest: upstream.requestImpl, apiKey: "test-key" });
    const result = await refine(requestPayload());
    assert.deepEqual(result, {
      status: 502,
      body: errorBody("GEMINI_UPSTREAM", "Gemini refinement failed."),
    }, name);
    assert.equal(JSON.stringify(result).includes("secret"), false, name);
  }
});

test("Gemini refinement maps the injected 11-second timeout and overflow safely", async () => {
  const timeout = createHttpsMock((request) => request.timeoutHandler());
  const timeoutResult = await createRefineManifest({
    httpsRequest: timeout.requestImpl, apiKey: "test-key",
  })(requestPayload());
  assert.deepEqual(timeoutResult, {
    status: 504,
    body: errorBody("GEMINI_TIMEOUT", "Gemini did not respond in time."),
  });
  assert.equal(timeout.request.timeoutMs, 11_000);

  let upstreamResponse;
  const overflow = createHttpsMock((request, callback) => {
    upstreamResponse = createUpstreamResponse(200);
    callback(upstreamResponse);
    upstreamResponse.emit("data", Buffer.alloc(MAX_GEMINI_RESPONSE_BYTES + 1, "x"));
    upstreamResponse.emit("data", Buffer.from("overflow-secret"));
    upstreamResponse.emit("end");
  });
  const overflowResult = await createRefineManifest({
    httpsRequest: overflow.requestImpl, apiKey: "test-key",
  })(requestPayload());
  assert.deepEqual(overflowResult, {
    status: 502,
    body: errorBody("GEMINI_RESPONSE_TOO_LARGE", "Gemini response exceeded the allowed size."),
  });
  assert.equal(overflow.request.destroyCalls, 1);
  assert.equal(upstreamResponse.destroyCalls, 1);
  assert.equal(JSON.stringify(overflowResult).includes("overflow-secret"), false);
});

test("Gemini refinement does not invoke HTTPS without an API key", async () => {
  const upstream = createHttpsMock(() => {
    throw new Error("HTTPS must not be called without a Gemini API key.");
  });
  const result = await createRefineManifest({
    httpsRequest: upstream.requestImpl, apiKey: "",
  })(requestPayload());
  assert.deepEqual(result, {
    status: 503,
    body: errorBody("GEMINI_UNAVAILABLE", "Gemini is unavailable."),
  });
  assert.equal(upstream.request, null);
});

test("body deadline pauses the stalled stream until response finish", async () => {
  const req = createBodyStream();
  const timers = createFakeTimers();
  const pending = readJsonBody(req, {
    bodyReadTimeoutMs: BODY_READ_TIMEOUT_MS,
    setTimeoutImpl: timers.setTimeoutImpl,
    clearTimeoutImpl: timers.clearTimeoutImpl,
  });
  timers.run(BODY_READ_TIMEOUT_MS);
  await assert.rejects(pending, { code: "REQUEST_BODY_TIMEOUT" });
  assert.equal(req.pauseCalls, 1);
  assert.equal(req.destroyCalls, 0);
  assert.equal(req.listenerCount("data"), 0);
  const res = new EventEmitter();
  disposeStoppedInboundAfterResponse(req, res);
  res.emit("finish");
  assert.equal(req.destroyCalls, 1);
});

test("body overflow pauses and clears retained readers", async () => {
  const req = createBodyStream();
  const timers = createFakeTimers();
  const pending = readJsonBody(req, { setTimeoutImpl: timers.setTimeoutImpl, clearTimeoutImpl: timers.clearTimeoutImpl });
  req.emit("data", Buffer.alloc(MAX_BODY_BYTES + 1));
  await assert.rejects(pending, { code: "PAYLOAD_TOO_LARGE" });
  assert.equal(req.pauseCalls, 1);
  assert.equal(req.destroyCalls, 0);
  assert.equal(req.listenerCount("data"), 0);
  assert.equal(req.listenerCount("end"), 0);
});

test("Vercel handler sends one fixed body-read response before disposal", async () => {
  for (const [code, status, message] of [
    ["REQUEST_BODY_TIMEOUT", 408, "Request body read timed out."],
    ["PAYLOAD_TOO_LARGE", 413, "Request body exceeds 64 KiB."],
  ]) {
    const req = createBodyStream();
    req.method = "POST";
    req.socket = { remoteAddress: "192.0.2.1" };
    const res = new EventEmitter();
    res.writableEnded = false;
    res.destroyed = false;
    res.status = (value) => { res.statusCode = value; return res; };
    res.json = (body) => { res.jsonCalls = (res.jsonCalls ?? 0) + 1; res.body = body; return res; };
    res.setHeader = () => {};
    let refined = 0;
    await createForgeHandler({
      readBody: async () => {
        const error = new Error(code);
        error.code = code;
        throw error;
      },
      refine: async () => { refined += 1; },
    })(req, res);
    assert.equal(res.statusCode, status);
    assert.deepEqual(res.body, errorBody(code, message));
    assert.equal(res.jsonCalls, 1);
    assert.equal(refined, 0);
    assert.equal(req.destroyCalls, 0);
    res.emit("finish");
    assert.equal(req.destroyCalls, 1);
  }
});

test("Vercel handler does not write to ended or destroyed responses", async () => {
  for (const state of ["writableEnded", "destroyed"]) {
    const req = createBodyStream();
    req.method = "POST";
    req.socket = { remoteAddress: "192.0.2.2" };
    const res = new EventEmitter();
    res.writableEnded = state === "writableEnded";
    res.destroyed = state === "destroyed";
    res.status = () => { res.statusCalls = (res.statusCalls ?? 0) + 1; return res; };
    res.json = () => { res.jsonCalls = (res.jsonCalls ?? 0) + 1; return res; };
    res.setHeader = () => { res.headerCalls = (res.headerCalls ?? 0) + 1; };

    await createForgeHandler({
      readBody: async () => {
        const error = new Error("too large");
        error.code = "PAYLOAD_TOO_LARGE";
        throw error;
      },
    })(req, res);

    assert.equal(res.statusCalls ?? 0, 0, state);
    assert.equal(res.jsonCalls ?? 0, 0, state);
    assert.equal(res.headerCalls ?? 0, 0, state);
  }
});
