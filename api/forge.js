const { createRateLimiter, clientIp } = require("./forge-guards.cjs");
const {
  errorBody, readJsonBody, disposeStoppedInboundAfterResponse, refineManifest,
} = require("./forge-runtime.cjs");

const forgeRateLimiter = createRateLimiter();

function sendApiJson(res, status, body, headers = {}, stoppedInboundRequest = null) {
  if (res.writableEnded || res.destroyed) return;
  if (stoppedInboundRequest) disposeStoppedInboundAfterResponse(stoppedInboundRequest, res);
  for (const [name, value] of Object.entries(headers)) res.setHeader(name, value);
  return res.status(status).json(body);
}

function createForgeHandler({ readBody = readJsonBody, refine = refineManifest } = {}) {
  return async function handler(req, res) {
    if (req.method !== "POST") {
      return sendApiJson(res, 405, errorBody("METHOD_NOT_ALLOWED", "Use POST."), { Allow: "POST" });
    }
    const rate = forgeRateLimiter.check(clientIp(req.headers, req.socket?.remoteAddress, process.env.VERCEL === "1"));
    if (!rate.ok) {
      return sendApiJson(res, 429, errorBody("RATE_LIMITED", "Too many App Forge requests."), {
        "Retry-After": String(rate.retryAfterSeconds),
      });
    }
    let payload;
    try {
      payload = await readBody(req);
    } catch (error) {
      if (error?.code === "PAYLOAD_TOO_LARGE") {
        return sendApiJson(res, 413, errorBody("PAYLOAD_TOO_LARGE", "Request body exceeds 64 KiB."), {}, req);
      }
      if (error?.code === "REQUEST_BODY_TIMEOUT") {
        return sendApiJson(res, 408, errorBody("REQUEST_BODY_TIMEOUT", "Request body read timed out."), {}, req);
      }
      return sendApiJson(res, 400, errorBody("INVALID_REQUEST", "Request body must be valid JSON."));
    }
    const result = await refine(payload);
    return sendApiJson(res, result.status, result.body);
  };
}

const handler = createForgeHandler();
handler.config = { api: { bodyParser: false } };

module.exports = handler;
module.exports.createForgeHandler = createForgeHandler;
