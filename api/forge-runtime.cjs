const https = require("node:https");
const { MAX_BODY_BYTES } = require("./forge-guards.cjs");

const BODY_READ_TIMEOUT_MS = 2_000;
const MAX_GEMINI_RESPONSE_BYTES = 256 * 1024;

function errorBody(code, message) {
  return { error: { code, message } };
}

function runtimeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function stopReading(req) {
  req.pause?.();
}

function disposeStoppedInboundAfterResponse(req, res) {
  if (!req || req.complete || req.destroyed) return;
  const dispose = () => {
    if (req.complete || req.destroyed) return;
    if (typeof req.destroy === "function") req.destroy();
    else req.resume?.();
  };
  res.once?.("finish", dispose);
}

function readJsonBody(req, {
  bodyReadTimeoutMs = BODY_READ_TIMEOUT_MS,
  setTimeoutImpl = globalThis.setTimeout,
  clearTimeoutImpl = globalThis.clearTimeout,
} = {}) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let size = 0;
    let timeoutId = null;
    const chunks = [];
    const cleanup = () => {
      if (timeoutId !== null) clearTimeoutImpl(timeoutId);
      req.off?.("data", onData);
      req.off?.("error", onError);
      req.off?.("aborted", onAborted);
      req.off?.("end", onEnd);
    };
    const fail = (error, stop = false) => {
      if (settled) return;
      settled = true;
      chunks.length = 0;
      cleanup();
      if (stop) {
        error.inboundBodyStopped = true;
        stopReading(req);
      } else {
        req.resume?.();
      }
      reject(error);
    };
    const onData = (chunk) => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        fail(runtimeError("PAYLOAD_TOO_LARGE", "Request body exceeds 64 KiB."), true);
        return;
      }
      chunks.push(chunk);
    };
    const onError = () => fail(runtimeError("INVALID_REQUEST", "Request body could not be read."));
    const onAborted = () => fail(runtimeError("INVALID_REQUEST", "Request body could not be read."));
    const onEnd = () => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(runtimeError("INVALID_REQUEST", "Request body must be valid JSON."));
      }
    };
    const declared = Number(req.headers?.["content-length"]);
    if (Number.isSafeInteger(declared) && declared > MAX_BODY_BYTES) {
      fail(runtimeError("PAYLOAD_TOO_LARGE", "Request body exceeds 64 KiB."), true);
      return;
    }
    const timeoutMs = Number.isSafeInteger(bodyReadTimeoutMs) && bodyReadTimeoutMs > 0
      ? bodyReadTimeoutMs
      : BODY_READ_TIMEOUT_MS;
    timeoutId = setTimeoutImpl(
      () => fail(runtimeError("REQUEST_BODY_TIMEOUT", "Request body read timed out."), true),
      timeoutMs,
    );
    req.on("data", onData);
    req.on("error", onError);
    req.on("aborted", onAborted);
    req.on("end", onEnd);
  });
}

function requestGeminiManifest(request, {
  httpsRequest = https.request,
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_MODEL || "gemini-2.5-flash",
} = {}) {
  if (!apiKey) return Promise.reject(runtimeError("GEMINI_UNAVAILABLE", "Gemini is not configured."));
  const prompt = [
    "Return one JSON App Forge manifest only: no markdown fences and no executable code.",
    "Preserve sourceProjectId, scaffoldId, registryVersion, and inspired from this validated request.",
    JSON.stringify(request),
  ].join("\n");
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (callback, value) => {
      if (settled) return;
      settled = true;
      callback(value);
    };
    const fail = (error) => settle(reject, error);
    const geminiReq = httpsRequest({
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (geminiRes) => {
      let size = 0;
      const chunks = [];
      const abortUpstream = (error) => {
        chunks.length = 0;
        geminiRes.destroy(error);
        geminiReq.destroy(error);
        fail(error);
      };
      geminiRes.on("data", (chunk) => {
        if (settled) return;
        size += chunk.length;
        if (size > MAX_GEMINI_RESPONSE_BYTES) {
          abortUpstream(runtimeError("GEMINI_RESPONSE_TOO_LARGE", "Gemini response exceeds 256 KiB."));
          return;
        }
        chunks.push(chunk);
      });
      geminiRes.on("error", fail);
      geminiRes.on("end", () => {
        if (settled) return;
        const raw = Buffer.concat(chunks).toString("utf8");
        if (geminiRes.statusCode < 200 || geminiRes.statusCode >= 300) {
          fail(runtimeError("GEMINI_UPSTREAM", "Gemini returned an unsuccessful response."));
          return;
        }
        try {
          const envelope = JSON.parse(raw);
          const candidate = envelope.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof candidate !== "string" || candidate.trim().startsWith("```")) {
            throw runtimeError("GEMINI_UPSTREAM", "Gemini did not return unfenced JSON.");
          }
          settle(resolve, JSON.parse(candidate));
        } catch (error) {
          fail(error.code ? error : runtimeError("GEMINI_UPSTREAM", "Gemini returned invalid JSON."));
        }
      });
    });
    geminiReq.setTimeout(11_000, () => geminiReq.destroy(runtimeError("ETIMEDOUT", "Gemini request timed out.")));
    geminiReq.on("error", fail);
    geminiReq.write(body);
    geminiReq.end();
  });
}

function createRefineManifest(options = {}) {
  return async function refineManifest(payload) {
    const { parseForgeRequest, parseRefinedManifest } = await import("./forge-contract.mjs");
    const request = parseForgeRequest(payload);
    if (!request.ok) {
      const status = request.code.endsWith("_TOO_LARGE") ? 413 : 400;
      return { status, body: errorBody(request.code, request.message) };
    }
    try {
      const candidate = await requestGeminiManifest(request.value, options);
      const refined = parseRefinedManifest(candidate, request.value);
      if (!refined.ok) {
        const status = refined.code.endsWith("_TOO_LARGE") ? 413 : 422;
        return { status, body: errorBody(refined.code, refined.message) };
      }
      return { status: 200, body: { manifest: refined.value } };
    } catch (error) {
      if (error?.code === "ETIMEDOUT") return { status: 504, body: errorBody("GEMINI_TIMEOUT", "Gemini did not respond in time.") };
      if (error?.code === "GEMINI_UNAVAILABLE") return { status: 503, body: errorBody("GEMINI_UNAVAILABLE", "Gemini is unavailable.") };
      if (error?.code === "GEMINI_RESPONSE_TOO_LARGE") return { status: 502, body: errorBody("GEMINI_RESPONSE_TOO_LARGE", "Gemini response exceeded the allowed size.") };
      return { status: 502, body: errorBody("GEMINI_UPSTREAM", "Gemini refinement failed.") };
    }
  };
}

const refineManifest = createRefineManifest();

module.exports = {
  BODY_READ_TIMEOUT_MS,
  MAX_GEMINI_RESPONSE_BYTES,
  errorBody,
  readJsonBody,
  disposeStoppedInboundAfterResponse,
  createRefineManifest,
  refineManifest,
};
