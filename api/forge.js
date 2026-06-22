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

function generateAppManifest(prompt) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      reject(new Error("GEMINI_API_KEY environment variable is not set"));
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
          reject(new Error(`API Error (HTTP ${res.statusCode}): ${errText}`));
          return;
        }

        try {
          const result = JSON.parse(data);
          const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!textResponse) {
            reject(new Error("Empty response from model"));
            return;
          }

          let cleanText = textResponse.trim();
          if (cleanText.startsWith("```json")) cleanText = cleanText.substring(7);
          else if (cleanText.startsWith("```")) cleanText = cleanText.substring(3);
          if (cleanText.endsWith("```")) cleanText = cleanText.slice(0, -3);
          cleanText = cleanText.trim();

          const manifest = JSON.parse(cleanText);
          resolve(manifest);
        } catch (err) {
          reject(new Error(`Failed to parse model response: ${err.message}`));
        }
      });
    });

    req.on("error", (err) => reject(new Error(`Network error: ${err.message}`)));
    req.write(requestBody);
    req.end();
  });
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  let body = "";
  req.on("data", (chunk) => { body += chunk; });

  await new Promise((resolve) => req.on("end", resolve));

  let payload;
  try {
    payload = JSON.parse(body);
  } catch (e) {
    res.status(400).json({ error: "Invalid JSON body" });
    return;
  }

  if (!payload.prompt) {
    res.status(400).json({ error: "Missing prompt parameter" });
    return;
  }

  try {
    const manifest = await generateAppManifest(payload.prompt);
    res.status(200).json(manifest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
