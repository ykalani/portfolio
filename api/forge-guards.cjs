const { isIP } = require("node:net");

const MAX_BODY_BYTES = 64 * 1024;
const MAX_PROMPT_CHARS = 300;

function isAllowedBodySize(byteLength) {
  return Number.isSafeInteger(byteLength) && byteLength >= 0 && byteLength <= MAX_BODY_BYTES;
}

function isAllowedPrompt(query) {
  return typeof query === "string" && query.trim().length >= 1 && query.length <= MAX_PROMPT_CHARS;
}

function finalValidatedIp(value) {
  if (typeof value !== "string") return "";
  const finalToken = value.split(",").map((token) => token.trim()).filter(Boolean).at(-1) ?? "";
  return isIP(finalToken) ? finalToken : "";
}

function clientIp(headers = {}, socketAddress = "", isVercel = process.env.VERCEL === "1") {
  const vercelIp = isVercel ? finalValidatedIp(headers["x-vercel-forwarded-for"]) : "";
  if (vercelIp) return vercelIp;
  return typeof socketAddress === "string" && isIP(socketAddress) ? socketAddress : "unknown";
}

function createRateLimiter({ limit = 20, windowMs = 60_000, now = () => Date.now() } = {}) {
  const buckets = new Map();
  return {
    check(ip) {
      const at = now();
      const key = typeof ip === "string" && ip ? ip : "unknown";
      const recent = (buckets.get(key) ?? []).filter((timestamp) => at - timestamp < windowMs);
      if (recent.length >= limit) {
        buckets.set(key, recent);
        return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (at - recent[0])) / 1000)) };
      }
      recent.push(at);
      buckets.set(key, recent);
      return { ok: true, retryAfterSeconds: 0 };
    },
  };
}

module.exports = {
  MAX_BODY_BYTES,
  MAX_PROMPT_CHARS,
  isAllowedBodySize,
  isAllowedPrompt,
  clientIp,
  createRateLimiter,
};
