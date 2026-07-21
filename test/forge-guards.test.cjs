const assert = require("node:assert/strict");
const test = require("node:test");

const {
  MAX_BODY_BYTES,
  MAX_PROMPT_CHARS,
  isAllowedBodySize,
  isAllowedPrompt,
  clientIp,
  createRateLimiter,
} = require("../api/forge-guards.cjs");

test("enforces body and prompt limits", () => {
  assert.equal(isAllowedBodySize(MAX_BODY_BYTES), true);
  assert.equal(isAllowedBodySize(MAX_BODY_BYTES + 1), false);
  assert.equal(isAllowedPrompt("x".repeat(MAX_PROMPT_CHARS)), true);
  assert.equal(isAllowedPrompt("x".repeat(MAX_PROMPT_CHARS + 1)), false);
  assert.equal(isAllowedPrompt("  "), false);
});

test("uses only trusted Vercel or socket IP identities", () => {
  assert.equal(clientIp({ "x-vercel-forwarded-for": "198.51.100.7, 203.0.113.9" }, "192.0.2.1", true), "203.0.113.9");
  assert.equal(clientIp({ "x-vercel-forwarded-for": "198.51.100.7, 203.0.113.9" }, "192.0.2.1", false), "192.0.2.1");
  assert.equal(clientIp({ "x-forwarded-for": "198.51.100.1", "x-real-ip": "198.51.100.2" }, "192.0.2.3", false), "192.0.2.3");
  assert.equal(clientIp({ "x-vercel-forwarded-for": "not-an-ip" }, "192.0.2.4", true), "192.0.2.4");
  assert.equal(clientIp({}, "not-an-ip", true), "unknown");
});

test("rate limits per identity and resets after its window", () => {
  let now = 0;
  const limiter = createRateLimiter({ now: () => now });
  for (let index = 0; index < 20; index += 1) assert.equal(limiter.check("192.0.2.1").ok, true);
  const blocked = limiter.check("192.0.2.1");
  assert.equal(blocked.ok, false);
  assert.ok(blocked.retryAfterSeconds > 0);
  now = 60_000;
  assert.equal(limiter.check("192.0.2.1").ok, true);
});
