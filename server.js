const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const SYSTEM_PROMPT = `You are AppForge, a UI generator for a retro Windows-style portfolio desktop shell.
Your job is to convert a user prompt into a valid JSON manifest for a browser-based application.

You must return JSON ONLY. No markdown code blocks, no code fences, no leading/trailing text. Just raw JSON.

Schema:
{
  "title": "string",
  "kind": "custom" | "calculator" | "notes" | "todo" | "timer" | "dashboard" | "chat" | "browser",
  "icon": "string",
  "summary": "string",
  "accent": "string",
  "accentHi": "string",
  "window": { "width": number, "height": number },
  "tags": ["string"],
  "html": "string",
  "css": "string",
  "js": "string",
  "panels": [
    { "title": "string", "body": "string", "bullets": ["string"] }
  ],
  "actions": [
    { "label": "string", "intent": "string" }
  ],
  "notes": ["string"]
}

Guidelines for custom apps:
- Design the app to be fully functional within the HTML and JS properties.
- To achieve ultra-fast generation (under 2 seconds), you MUST set the "css" property to an empty string ("") and leverage the pre-defined global utility CSS classes for all styling.
- Pre-defined retro utility CSS classes you should use:
  - ".retro-panel" : Cream clay container background with a black border.
  - ".retro-grid" : A CSS grid for layout.
  - ".retro-card" : An inner clay-panel with outline and flat shadow.
  - ".retro-btn" : Tactile cream/gold physical button with push animation.
  - ".retro-input" : Styled retro form text field or area.
  - ".retro-terminal" : Matrix-green black monospace terminal console block.
  - Use custom inline style attributes for custom layouts, colors, spacing, alignments, or dimensions. Do not write custom CSS rules in the "css" field.
- Ensure the app is entirely self-contained. Do not rely on external CDN scripts or stylesheet files.
- For JS, always query inside 'container', e.g., 'const input = container.querySelector("input");'. Never write global document.querySelector to prevent conflicts.
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

    const requestPath = req.url === "/" ? "/index.html" : req.url.split("?")[0];
    const filePath = path.join(root, requestPath);

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.end("Not found");
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", mimeTypes[path.extname(filePath)] || "application/octet-stream");
      res.end(data);
    });
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
