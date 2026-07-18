const https = require("https");

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

module.exports = (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Method Not Allowed" }));
    return;
  }

  const prompt = req.body?.prompt;
  if (!prompt) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Missing prompt parameter" }));
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "GEMINI_API_KEY environment variable is not set on the server." }));
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

  const geminiReq = https.request(options, (geminiRes) => {
    let data = "";
    geminiRes.on("data", (chunk) => { data += chunk; });
    geminiRes.on("end", () => {
      if (geminiRes.statusCode !== 200) {
        let errText = data;
        try {
          const parsed = JSON.parse(data);
          errText = parsed.error?.message || data;
        } catch (e) {}
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: `API Error (HTTP ${geminiRes.statusCode}): ${errText}` }));
        return;
      }

      try {
        const result = JSON.parse(data);
        const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textResponse) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Empty response from model" }));
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
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(manifest));
      } catch (err) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: `Failed to parse model response: ${err.message}` }));
      }
    });
  });

  geminiReq.on("error", (err) => {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: `Network error: ${err.message}` }));
  });

  geminiReq.write(requestBody);
  geminiReq.end();
};
