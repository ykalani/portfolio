const Groq = require("groq-sdk");

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_FALLBACK = "llama-3.3-70b-specdec";
const VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SYSTEM_PROMPT = `You parse vocabulary or study material into flashcards.
Return ONLY valid JSON — an array of objects with "term", "definition", and "card_type" keys.
Example:
[
  {"term": "Photosynthesis", "definition": "Process by which plants convert light into chemical energy", "card_type": "term"},
  {"term": "What is the powerhouse of the cell?", "definition": "Mitochondria", "card_type": "question"}
]

card_type rules:
- "term" for vocabulary definitions, key concepts, factual pairs (e.g. "DNA → genetic material")
- "question" for Q&A pairs where the input is clearly a question and the answer is a response (e.g. "What causes seasons? → Earth's axial tilt")

Rules:
- If the input is a list of terms (one per line), create simple term->definition flashcards with card_type "term".
- If the input has tab/comma-separated pairs, preserve them exactly and determine the card_type from context.
- If the input is a block of text, extract key concepts and their definitions with card_type "term".
- If the input contains questions (sentences ending with ?), use card_type "question" and put the question in "term" and the answer in "definition".
- Make definitions concise but complete — 1-2 sentences max.
- Output ONLY the JSON array, no markdown, no commentary.`;

function getClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");
  return new Groq({ apiKey: key });
}

function parseCards(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    for (const k of ["flashcards", "cards", "terms", "pairs", "data"]) {
      if (Array.isArray(raw[k])) return raw[k];
    }
    return [raw];
  }
  return [];
}

async function parseVocab(text) {
  const groq = getClient();
  const resp = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Turn this into flashcards:\n\n${text}` },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });
  const raw = JSON.parse(resp.choices[0].message.content);
  return parseCards(raw);
}

const JUDGE_PROMPT = `You evaluate a student's answer to a flashcard question.

Term: "{term}"
Correct definition: "{definition}"
Student's answer: "{answer}"

Rate the answer 0-3 using these strict criteria:
- **3 (Perfect):** Captures ALL key concepts accurately. Minor wording differences are fine. Synonyms and rephrasing are acceptable as long as every essential point is present.
- **2 (Good):** Captures the main idea but misses minor details or has small inaccuracies. The core concept is there but not fully precise.
- **1 (Weak):** Has some relevant information but misses major key points. Shows partial understanding but significant gaps remain.
- **0 (Wrong):** Completely incorrect, irrelevant, blank, or shows no understanding of the concept.

Think step by step:
1. Identify the essential key points in the correct definition.
2. Check which of these are present in the student's answer.
3. Check for any incorrect information.
4. Assign a score and write 1-2 sentences of reasoning.

Return ONLY valid JSON: {"quality": 0-3, "reasoning": "..."}`;

async function judgeAnswer(term, definition, answer) {
  const groq = getClient();
  const models = [GROQ_MODEL, GROQ_FALLBACK];
  let lastErr;
  for (const model of models) {
    try {
      const resp = await groq.chat.completions.create({
        model,
        messages: [
          { role: "system", content: "You are a fair flashcard grader. Return only JSON." },
          { role: "user", content: JUDGE_PROMPT.replace("{term}", term).replace("{definition}", definition).replace("{answer}", answer) },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });
      return JSON.parse(resp.choices[0].message.content);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function parseImage(imageBuffer) {
  const groq = getClient();
  const b64 = imageBuffer.toString("base64");
  const dataUri = `data:image/jpeg;base64,${b64}`;

  const resp = await groq.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "This image contains a vocabulary list or study material. "
              + 'Extract every term-definition or question-answer pair and return them as a JSON array of objects with "term", "definition", and "card_type" keys. '
              + 'Use card_type "term" for vocabulary/factual pairs and "question" for Q&A pairs. '
              + "If the material uses tables, lists, or paragraphs, identify each distinct concept and its explanation. "
              + "Be thorough — capture ALL terms visible in the image. "
              + "Return ONLY valid JSON, no markdown, no commentary.",
          },
          { type: "image_url", image_url: { url: dataUri } },
        ],
      },
    ],
    temperature: 0.1,
    response_format: { type: "json_object" },
  });
  const raw = JSON.parse(resp.choices[0].message.content);
  return parseCards(raw);
}

module.exports = { parseVocab, judgeAnswer, parseImage };
