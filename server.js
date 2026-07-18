const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Load environment variables from .env file if it exists
try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const index = trimmed.indexOf("=");
        const key = trimmed.substring(0, index).trim();
        const value = trimmed.substring(index + 1).trim().replace(/^['"]|['"]$/g, ""); // strip quotes
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.warn("Could not load .env file:", e.message);
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
   - ".retro-panel" : Primary container background (automatically adapts to cream panel, neon dark, or frosted glass depending on active theme).
   - ".retro-card" : Inner card block with physical borders and dropshadows.
   - ".retro-btn" : Dynamic interactive button (handles active press, glows, and theme coloring).
   - ".retro-input" : Styled input text fields.
   - ".retro-terminal" : Monospaced black console output block (glows neon green in Matrix theme).
3. Layout Utilities: Use inline CSS styling ONLY for flex alignment and simple spacing, e.g., 'style="display:flex; flex-direction:column; gap:10px; padding:12px;"'.
4. JS Scoping: All JS DOM selectors MUST query inside 'container' (e.g. 'container.querySelector("#btn")'). Never query the global 'document'.
5. Keep it Concise: Limit HTML to essential interactive elements and JS to basic state modification. Keep output short to minimize latency.
`;

function generateAppManifest(prompt, callback) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    callback(new Error("GEMINI_API_KEY environment variable is not set. Please set the key in the shell before starting the server."));
    return;
  }

  const requestBody = JSON.stringify({
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `User request: "${prompt}"` }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  });

  const options = {
    hostname: "generativelanguage.googleapis.com",
    path: `/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody)
    }
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => { data += chunk; });
    res.on("end", () => {
      if (res.statusCode !== 200) {
        let errText = data;
        try {
          const parsed = JSON.parse(data);
          errText = parsed.error?.message || data;
        } catch (e) {}
        callback(new Error(`API Error (HTTP ${res.statusCode}): ${errText}`));
        return;
      }

      try {
        const result = JSON.parse(data);
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
          callback(new Error("Empty response from model"));
          return;
        }

        let cleanText = textResponse.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        }
        if (cleanText.startsWith("```")) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.slice(0, -3);
        }
        cleanText = cleanText.trim();

        const manifest = JSON.parse(cleanText);
        callback(null, manifest);
      } catch (err) {
        callback(new Error(`Failed to parse model response: ${err.message}`));
      }
    });
  });

  req.on("error", (err) => {
    callback(new Error(`Network error: ${err.message}`));
  });

  req.write(requestBody);
  req.end();
}

function createServer(currentPort) {
  const server = http.createServer((req, res) => {
    if (req.url === "/api/forge" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk; });
      req.on("end", () => {
        let payload;
        try {
          payload = JSON.parse(body);
        } catch (e) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid JSON body" }));
          return;
        }

        const prompt = payload.prompt;
        if (!prompt) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Missing prompt parameter" }));
          return;
        }

        generateAppManifest(prompt, (err, manifest) => {
          if (err) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(manifest));
        });
      });
      return;
    }

    if (req.url.startsWith("/api/source") && req.method === "GET") {
      const urlObj = new URL(req.url, `http://${req.headers.host || "localhost"}`);
      const file = urlObj.searchParams.get("file");
      const allowedFiles = ["index.html", "app.js", "content.js", "generator.js", "server.js", "styles.css"];
      if (!allowedFiles.includes(file)) {
        res.statusCode = 403;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Forbidden");
        return;
      }
      const filePath = path.join(root, file);
      fs.readFile(filePath, "utf-8", (error, data) => {
        if (error) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Server error");
          return;
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(data);
      });
      return;
    }

    if (req.url.startsWith("/api/") && req.url !== "/api/forge") {
      const targetUrl = `http://127.0.0.1:5000${req.url}`;
      const proxyReq = http.request(targetUrl, {
        method: req.method,
        headers: req.headers
      }, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      });
      proxyReq.on("error", (err) => {
        res.statusCode = 502;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end(`Bad Gateway: ${err.message}`);
      });
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
    if (requestPath === "/flashcards" || requestPath === "/flashcards/") {
      candidatePaths = [path.join(root, "../flashcard-review/templates/index.html")];
    } else if (requestPath.startsWith("/static/")) {
      candidatePaths = [path.join(root, "../flashcard-review", requestPath)];
    } else {
      const normalizedPath = requestPath.endsWith("/") && requestPath !== "/"
        ? requestPath.slice(0, -1)
        : requestPath;
      const paths = path.extname(normalizedPath)
        ? [normalizedPath]
        : [normalizedPath, `${normalizedPath}.html`, `${normalizedPath}/index.html`];
      candidatePaths = paths.map(p => path.join(root, p));
    }

    const tryReadFile = (candidateIndex) => {
      if (candidateIndex >= candidatePaths.length) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Not found");
        return;
      }

      const filePath = candidatePaths[candidateIndex];
      fs.readFile(filePath, (error, data) => {
        if (error) {
          if (error.code === "ENOENT") {
            tryReadFile(candidateIndex + 1);
            return;
          }

          res.statusCode = 500;
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.end("Server error");
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", mimeTypes[path.extname(filePath)] || "application/octet-stream");
        res.end(data);
      });
    };

    tryReadFile(0);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      createServer(currentPort + 1);
      return;
    }

    console.error(error);
    process.exitCode = 1;
  });

  server.listen(currentPort, "127.0.0.1", () => {
    console.log(`Retro Windows Portfolio running at http://127.0.0.1:${currentPort}`);
  });
}

createServer(port);
