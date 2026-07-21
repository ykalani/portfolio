const assert = require("node:assert/strict");
const http = require("node:http");
const test = require("node:test");

const { classifyRoute, createServer } = require("../server.js");

function request(server, method, path) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const req = http.request({ host: "127.0.0.1", port: address.port, path, method }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on("error", reject);
    req.end();
  });
}

test("classifies Forge and retired API paths", () => {
  assert.equal(classifyRoute("/api/source"), "retired-source");
  assert.equal(classifyRoute("/api/source?file=app.js"), "retired-source");
  assert.equal(classifyRoute("/api/forge"), "forge");
  assert.equal(classifyRoute("/api/anything"), "unknown-api");
});

test("retires source and unknown API routes with empty 404s", async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  for (const [method, path] of [
    ["GET", "/api/source"], ["HEAD", "/api/source"], ["GET", "/api/source?file=app.js"],
    ["HEAD", "/api/source?file=app.js"], ["GET", "/api/anything"],
  ]) {
    const response = await request(server, method, path);
    assert.deepEqual(response, { status: 404, body: "" });
  }
});

test("serves yashOS index for GET and HEAD directory paths", async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());

  for (const [method, path] of [
    ["GET", "/yashOS"], ["GET", "/yashOS/"], ["HEAD", "/yashOS"], ["HEAD", "/yashOS/"],
  ]) {
    const response = await request(server, method, path);
    assert.equal(response.status, 200, `${method} ${path}`);
  }
});

test("local Forge handler returns fixed body-read responses without refinement", async (t) => {
  const cases = [
    ["REQUEST_BODY_TIMEOUT", 408, "Request body read timed out."],
    ["PAYLOAD_TOO_LARGE", 413, "Request body exceeds 64 KiB."],
  ];
  for (const [code, status, message] of cases) {
    let refined = 0;
    const server = createServer({
      readBody: async () => {
        const error = new Error(code);
        error.code = code;
        throw error;
      },
      refine: async () => { refined += 1; },
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const response = await request(server, "POST", "/api/forge");
    await new Promise((resolve) => server.close(resolve));
    assert.equal(response.status, status);
    assert.deepEqual(JSON.parse(response.body), { error: { code, message } });
    assert.equal(refined, 0);
  }
});

test("local Forge handler returns a single fixed timeout response", async (t) => {
  let refined = 0;
  const server = createServer({
    readBody: async () => {
      const error = new Error("timeout");
      error.code = "REQUEST_BODY_TIMEOUT";
      throw error;
    },
    refine: async () => { refined += 1; },
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const response = await request(server, "POST", "/api/forge");
  assert.equal(response.status, 408);
  assert.deepEqual(JSON.parse(response.body), {
    error: { code: "REQUEST_BODY_TIMEOUT", message: "Request body read timed out." },
  });
  assert.equal(refined, 0);
});
