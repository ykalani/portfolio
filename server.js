const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const index = trimmed.indexOf("=");
        const key = trimmed.substring(0, index).trim();
        const value = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, "");
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn("Could not load .env file:", e.message);
}

// flashcard modules
const fc = require("./fc-db");
const groq = require("./fc-groq");
let _marked;
async function getMarked() {
  if (!_marked) _marked = await import("marked");
  return _marked.marked;
}

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const SYSTEM_PROMPT = `You are AppForge, a UI generator for a retro Windows-style portfolio desktop shell.
Your job is to convert a user prompt into a valid JSON manifest for a browser-based application.

You must return JSON ONLY. No markdown code blocks, no code fences, no leading/trailing text. Just raw JSON.

Schema:
{
  "title": "string",
  "kind": "custom",
  "icon": "string",
  "summary": "string",
  "accent": "string",
  "accentHi": "string",
  "window": { "width": number, "height": number },
  "tags": ["string"],
  "html": "string",
  "css": "",
  "js": "string",
  "panels": [],
  "actions": [],
  "notes": []
}

Rules for speed and quality:
1. CSS Constraint: Always set the "css" field to an empty string "". Write NO custom styles there.
2. Leverage Theme Utilities: Build your interface exclusively using these pre-styled, theme-aware utility classes:
   - ".retro-panel" : Primary container background.
   - ".retro-card" : Inner card block with physical borders and dropshadows.
   - ".retro-btn" : Dynamic interactive button.
   - ".retro-input" : Styled input text fields.
   - ".retro-terminal" : Monospaced black console output block.
3. Layout Utilities: Use inline CSS styling ONLY for flex alignment and simple spacing.
4. JS Scoping: All JS DOM selectors MUST query inside 'container'.
5. Keep it Concise: Limit HTML to essential interactive elements.`;

// ---------- helper ----------
function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.statusCode = 404; res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end("Not found"); return; }
    res.statusCode = 200;
    res.setHeader("Content-Type", mimeTypes[path.extname(filePath)] || "application/octet-stream");
    res.end(data);
  });
}

function json(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", c => body += c);
    req.on("end", () => { try { resolve(JSON.parse(body)); } catch { reject(new Error("Invalid JSON")); } });
  });
}

function readFormData(req) {
  return new Promise((resolve, reject) => {
    let body = Buffer.alloc(0);
    req.on("data", c => body = Buffer.concat([body, c]));
    req.on("end", () => resolve(body));
  });
}

// ---------- rate limiting ----------
const _rateLimits = {};
function rateCheck(ip, group, max, window) {
  const now = Date.now();
  if (!_rateLimits[ip]) _rateLimits[ip] = {};
  if (!_rateLimits[ip][group]) _rateLimits[ip][group] = [];
  _rateLimits[ip][group] = _rateLimits[ip][group].filter(t => now - t < window);
  if (_rateLimits[ip][group].length >= max) return false;
  _rateLimits[ip][group].push(now);
  return true;
}

// ---------- flashcard routes ----------
function handleFlashcardRoute(req, res) {
  const u = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = u.pathname;

  // match /flashcards/api/...
  const apiMatch = pathname.match(/^\/flashcards\/api\/(.+)/);
  if (!apiMatch) {
    // serve static files
    if (pathname.startsWith("/flashcards-static/")) {
      serveFile(res, path.join(root, pathname));
      return;
    }
    if (pathname === "/flashcards" || pathname === "/flashcards/") {
      serveFile(res, path.join(root, "flashcards-static/index.html"));
      return;
    }
    res.statusCode = 404; res.end();
    return;
  }

  const apiPath = apiMatch[1];
  const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || "unknown";

  // /api/health
  if (apiPath === "health" && req.method === "GET") {
    json(res, { ok: true, groq_key_set: !!process.env.GROQ_API_KEY, groq_key_len: (process.env.GROQ_API_KEY || "").length });
    return;
  }

  // /api/sets
  if (apiPath === "sets" && req.method === "GET") {
    json(res, fc.getSets());
    return;
  }
  if (apiPath === "sets" && req.method === "POST") {
    readBody(req).then(data => {
      const id = fc.createSet(data.title || "Untitled", data.source || "");
      json(res, { id }, 201);
    }).catch(() => json(res, { error: "Invalid JSON" }, 400));
    return;
  }

  // /api/sets/:id
  const setIdMatch = apiPath.match(/^sets\/(\d+)$/);
  if (setIdMatch && req.method === "GET") {
    const s = fc.getSet(Number(setIdMatch[1]));
    if (!s) { json(res, { error: "not found" }, 404); return; }
    s.cards = fc.getCards(s.id);
    s.stats = fc.getStats(s.id);
    json(res, s);
    return;
  }
  if (setIdMatch && req.method === "DELETE") {
    fc.deleteSet(Number(setIdMatch[1]));
    res.statusCode = 204; res.end();
    return;
  }

  // /api/sets/:id/cards
  const cardsMatch = apiPath.match(/^sets\/(\d+)\/cards$/);
  if (cardsMatch && req.method === "POST") {
    readBody(req).then(data => {
      fc.addCards(Number(cardsMatch[1]), data.cards || []);
      json(res, { count: (data.cards || []).length }, 201);
    }).catch(() => json(res, { error: "Invalid JSON" }, 400));
    return;
  }

  // /api/sets/:id/review
  const reviewMatch = apiPath.match(/^sets\/(\d+)\/review$/);
  if (reviewMatch && req.method === "GET") {
    json(res, fc.getDueCards(Number(reviewMatch[1])));
    return;
  }
  if (reviewMatch && req.method === "POST") {
    readBody(req).then(data => {
      fc.recordReview(data.card_id, data.quality);
      json(res, { ok: true });
    }).catch(() => json(res, { error: "Invalid JSON" }, 400));
    return;
  }

  // /api/parse
  if (apiPath === "parse" && req.method === "POST") {
    if (!rateCheck(ip, "parse", 15, 3600000)) {
      json(res, { error: "rate_limit_exceeded", message: "Too many requests" }, 429);
      return;
    }
    readBody(req).then(async data => {
      try {
        const cards = await groq.parseVocab(data.text);
        json(res, { cards, method: data.method || "groq" });
      } catch (e) {
        json(res, { error: e.message }, 500);
      }
    }).catch(() => json(res, { error: "Invalid JSON" }, 400));
    return;
  }

  // /api/judge
  if (apiPath === "judge" && req.method === "POST") {
    readBody(req).then(async data => {
      if (!data.term || !data.definition) {
        json(res, { error: "term and definition required" }, 400);
        return;
      }
      try {
        const result = await groq.judgeAnswer(data.term, data.definition, data.answer);
        json(res, result);
      } catch (e) {
        json(res, { error: e.message }, 500);
      }
    }).catch(() => json(res, { error: "Invalid JSON" }, 400));
    return;
  }

  // /api/parse-image
  if (apiPath === "parse-image" && req.method === "POST") {
    if (!rateCheck(ip, "parse-image", 5, 3600000)) {
      json(res, { error: "rate_limit_exceeded", message: "Too many requests" }, 429);
      return;
    }
    readFormData(req).then(async buffer => {
      try {
        const cards = await groq.parseImage(buffer);
        json(res, { cards });
      } catch (e) {
        json(res, { error: e.message }, 500);
      }
    }).catch(() => json(res, { error: "no image" }, 400));
    return;
  }

  // /api/progress
  if (apiPath === "progress" && req.method === "POST") {
    readBody(req).then(data => {
      for (const r of (data.reviews || [])) fc.recordReview(r.card_id, r.quality);
      json(res, { ok: true });
    }).catch(() => json(res, { error: "Invalid JSON" }, 400));
    return;
  }

  json(res, { error: "not found" }, 404);
}

// ---------- blog routes ----------
async function handleBlogRoute(req, res) {
  const u = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = u.pathname;

  if (pathname === "/blog" || pathname === "/blog/") {
    renderBlogListing(req, res);
    return;
  }

  const slugMatch = pathname.match(/^\/blog\/(.+)$/);
  if (slugMatch) {
    await renderBlogPost(req, res, slugMatch[1]);
    return;
  }

  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end("Not found");
}

function readFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  match[1].split("\n").forEach(line => {
    const colon = line.indexOf(": ");
    if (colon > 0) {
      meta[line.slice(0, colon).trim()] = line.slice(colon + 2).trim();
    }
  });
  return { meta, body: match[2] };
}

function renderBlogListing(req, res) {
  const blogDir = path.join(root, "blog");
  let files;
  try { files = fs.readdirSync(blogDir); } catch {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(blogPage(`<p style="color:#888">No posts yet.</p>`));
    return;
  }

  const posts = files.filter(f => f.endsWith(".md")).map(f => {
    const content = fs.readFileSync(path.join(blogDir, f), "utf-8");
    const { meta } = readFrontmatter(content);
    const slug = f.replace(/\.md$/, "");
    return { slug, title: meta.title || slug, date: meta.date || "", summary: meta.summary || "" };
  }).sort((a, b) => b.date.localeCompare(a.date));

  const items = posts.map(p => `
    <li class="blog-post-item">
      <h2><a href="/blog/${slug(p.slug)}">${esc(p.title)}</a></h2>
      ${p.date ? `<div class="blog-post-date">${esc(p.date)}</div>` : ""}
      ${p.summary ? `<p class="blog-post-summary">${esc(p.summary)}</p>` : ""}
    </li>
  `).join("\n");

  const html = blogPage(`
    <h1>Blog</h1>
    <ul class="blog-posts">${items}</ul>
  `, "Blog");
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(html);
}

async function renderBlogPost(req, res, slug) {
  const filePath = path.join(root, "blog", slug + ".md");
  let content;
  try { content = fs.readFileSync(filePath, "utf-8"); } catch {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not found");
    return;
  }

  const { meta, body } = readFrontmatter(content);
  const marked = await getMarked();
  const html = await marked.parse(body);
  const postHtml = `
    <article class="blog-post">
      <h1>${esc(meta.title || slug)}</h1>
      ${meta.date ? `<div class="date">${esc(meta.date)}</div>` : ""}
      ${html}
    </article>
  `;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(blogPage(postHtml, meta.title || slug));
}

function blogPage(bodyHtml, pageTitle) {
  const t = pageTitle ? `${esc(pageTitle)} — Blog` : "Blog";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/blog.css">
</head>
<body>
<div class="blog-container">
  <div class="blog-header">
    <a href="/">&larr; Home</a>
  </div>
  ${bodyHtml}
</div>
</body>
</html>`;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function slug(s) {
  return encodeURIComponent(s);
}

// ---------- original server ----------
function generateAppManifest(prompt, callback) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { callback(new Error("GEMINI_API_KEY not set")); return; }
  const requestBody = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: SYSTEM_PROMPT }, { text: `User request: "${prompt}"` }] }],
    generationConfig: { responseMimeType: "application/json" }
  });
  const options = {
    hostname: "generativelanguage.googleapis.com",
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(requestBody) }
  };
  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", chunk => data += chunk);
    res.on("end", () => {
      if (res.statusCode !== 200) { try { callback(new Error(JSON.parse(data).error?.message || data)); } catch { callback(new Error(data)); } return; }
      try {
        const result = JSON.parse(data);
        let text = result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        text = text.replace(/^```json\s*/i, "").replace(/^```/, "").replace(/```$/, "").trim();
        callback(null, JSON.parse(text));
      } catch (err) { callback(new Error(`Parse error: ${err.message}`)); }
    });
  });
  req.on("error", err => callback(new Error(`Network error: ${err.message}`)));
  req.write(requestBody);
  req.end();
}

async function handleRequest(req, res) {
  try {
    // flashcard routes
    if (req.url.startsWith("/flashcards") || req.url.startsWith("/flashcards-static/")) {
      handleFlashcardRoute(req, res);
      return;
    }

    // blog routes
    if (req.url.startsWith("/blog")) {
      await handleBlogRoute(req, res);
      return;
    }

    if (req.url === "/api/forge" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => body += chunk);
      req.on("end", () => {
        let payload;
        try { payload = JSON.parse(body); } catch { json(res, { error: "Invalid JSON" }, 400); return; }
        if (!payload.prompt) { json(res, { error: "Missing prompt" }, 400); return; }
        generateAppManifest(payload.prompt, (err, manifest) => {
          if (err) { json(res, { error: err.message }, 500); return; }
          json(res, manifest);
        });
      });
      return;
    }

    if (req.url.startsWith("/api/source") && req.method === "GET") {
      const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const file = urlObj.searchParams.get("file");
      const allowed = ["index.html", "app.js", "content.js", "generator.js", "server.js", "styles.css"];
      if (!allowed.includes(file)) { res.statusCode = 403; res.end("Forbidden"); return; }
      serveFile(res, path.join(root, file));
      return;
    }

    if (req.url.startsWith("/api/") && req.url !== "/api/forge") {
      const targetUrl = `http://127.0.0.1:5000${req.url}`;
      const proxyReq = http.request(targetUrl, { method: req.method, headers: req.headers }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });
      proxyReq.on("error", () => { json(res, { error: "Backend unavailable" }, 502); });
      req.pipe(proxyReq, { end: true });
      return;
    }

    if (req.url === "/links" || req.url === "/links/") {
      res.statusCode = 301;
      res.setHeader("Location", "/profiles");
      res.end();
      return;
    }

    const requestPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    let candidatePaths;
    {
      const normalizedPath = requestPath.endsWith("/") && requestPath !== "/" ? requestPath.slice(0, -1) : requestPath;
      const paths = path.extname(normalizedPath) ? [normalizedPath] : [normalizedPath, `${normalizedPath}.html`, `${normalizedPath}/index.html`];
      candidatePaths = paths.map(p => path.join(root, p));
    }

    const tryReadFile = (idx) => {
      if (idx >= candidatePaths.length) { res.statusCode = 404; res.setHeader("Content-Type", "text/plain; charset=utf-8"); res.end("Not found"); return; }
      fs.readFile(candidatePaths[idx], (err, data) => {
        if (err) { tryReadFile(idx + 1); return; }
        res.statusCode = 200;
        res.setHeader("Content-Type", mimeTypes[path.extname(candidatePaths[idx])] || "application/octet-stream");
        res.end(data);
      });
    };
    tryReadFile(0);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Internal error");
  }
}

function createRequestHandler() {
  let dbReady = null;

  function ensureDb() {
    if (!dbReady) {
      dbReady = fc.initDb().catch(e => {
        console.error("DB init failed:", e.message);
        dbReady = null;
        throw e;
      });
    }
    return dbReady;
  }

  return (req, res) => {
    // health check doesn't need DB
    if (req.url === "/flashcards/api/health" && req.method === "GET") {
      let dbStatus = "not_attempted";
      if (dbReady) {
        dbReady.then(() => dbStatus = "ready").catch(e => dbStatus = "error:" + e.message);
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ ok: true, groq_key_set: !!process.env.GROQ_API_KEY, groq_key_len: (process.env.GROQ_API_KEY || "").length }));
      return;
    }

    if (req.url.startsWith("/flashcards/api")) {
      ensureDb().then(() => handleRequest(req, res)).catch(e => {
        console.error("Flashcard API error:", e.message);
        res.statusCode = 500;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Error: " + e.message);
      });
      return;
    }
    handleRequest(req, res);
  };
}

function createServer(currentPort) {
  const server = http.createServer(createRequestHandler());
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") { createServer(currentPort + 1); return; }
    console.error(error); process.exitCode = 1;
  });
  server.listen(currentPort, "127.0.0.1", async () => {
    await fc.initDb();
    console.log(`Portfolio running at http://127.0.0.1:${currentPort}`);
  });
}

if (require.main === module) {
  createServer(port);
}

module.exports = { createRequestHandler, createServer };
