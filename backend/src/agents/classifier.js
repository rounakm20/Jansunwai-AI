// src/agents/classifier.js
// Classifies a complaint using Gemini AI, with a keyword-based fallback.

const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEPARTMENTS = {
  Sanitation: "Municipal Solid Waste & Sanitation Division",
  "Water Supply": "Jal Sansthan (Water Board)",
  Electricity: "State Electricity Distribution Corporation (UPPCL)",
  Roads: "Public Works Department (PWD)",
  Health: "Chief Medical Officer (CMO) Office",
  "Public Safety": "Local Police & Traffic Control",
  Other: "General Administration Department",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function cleanJsonString(text) {
  let s = text.trim();
  if (s.startsWith("```json")) s = s.slice(7);
  else if (s.startsWith("```")) s = s.slice(3);
  if (s.endsWith("```")) s = s.slice(0, -3);
  return s.trim();
}

// ── Fallback: keyword heuristics ─────────────────────────────────────────────

function fallbackClassify(title, description) {
  const text = `${title} ${description}`.toLowerCase();

  let category = "Other";
  let priority = "Low";
  let sentiment = "Neutral";

  if (/power|electricity|voltage|current|wire|light|transformer|uppcl|meter/.test(text))
    category = "Electricity";
  else if (/sewer|drain|drainage|overflow/.test(text)) category = "Sanitation";
  else if (/water|leak|pipe|tap|jal/.test(text)) category = "Water Supply";
  else if (/garbage|trash|clean|sweeper|dustbin|waste|filth|dump|smell/.test(text))
    category = "Sanitation";
  else if (/road|pothole|highway|street|repair|tar|asphalt|pwd/.test(text))
    category = "Roads";
  else if (/hospital|doctor|health|disease|medicine|dengue|malaria|cmo|clinic/.test(text))
    category = "Health";
  else if (/police|safety|theft|harassment|danger|crime|robbery|scam/.test(text))
    category = "Public Safety";

  if (/danger|hazard|life|accident|emergency|immediate|urgent|sparking|child|injur/.test(text))
    priority = "High";
  else if (/broken|leak|week|days|blocked|foul|fever/.test(text))
    priority = "Medium";

  if (/worst|angry|terrible|useless|disaster|impossible/.test(text)) sentiment = "Angry";
  else if (/frustrated|delay|waiting|please help|sad/.test(text)) sentiment = "Frustrated";
  else if (/scared|fear|unsafe|threat/.test(text)) sentiment = "Anxious";

  const department = DEPARTMENTS[category] ?? DEPARTMENTS["Other"];
  const summary = title.length < 80 ? title : title.slice(0, 80) + "...";

  return {
    category,
    department,
    priority,
    sentiment,
    summary: `[Local Heuristic] ${summary}`,
    reasoning: `Local rule-based agent analyzed keyword markers for '${category}' and priority '${priority}'.`,
  };
}

// ── Main classifier ───────────────────────────────────────────────────────────

/**
 * Classify a complaint using Gemini (if API key set) or keyword fallback.
 *
 * @param {string} title
 * @param {string} description
 * @param {string|null} imageData  - base64 data URI (optional)
 * @returns {Promise<object>}
 */
async function classifyComplaint(title, description, imageData = null) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return fallbackClassify(title, description);

  const prompt = `
You are an expert AI Classifier for the Indian Government's Jansunwai Grievance portal.
Analyze the following grievance:
Title: ${title}
Description: ${description}

Categorize it into one of these: Sanitation, Water Supply, Electricity, Roads, Health, Public Safety, Other.
Assign the appropriate department from the following map:
- Sanitation -> Municipal Solid Waste & Sanitation Division
- Water Supply -> Jal Sansthan (Water Board)
- Electricity -> State Electricity Distribution Corporation (UPPCL)
- Roads -> Public Works Department (PWD)
- Health -> Chief Medical Officer (CMO) Office
- Public Safety -> Local Police & Traffic Control
- Other -> General Administration Department

Determine priority (High, Medium, Low) based on public safety, duration, and severity.
Analyze citizen's sentiment (Angry, Frustrated, Anxious, Neutral, Hopeful).
Provide a concise, 1-sentence executive summary of the issue.
Explain the reasoning behind your decisions in a brief paragraph.

You MUST respond with a valid JSON object ONLY. No other markdown outside of JSON.
Format:
{
  "category": "CategoryName",
  "department": "DepartmentName",
  "priority": "High/Medium/Low",
  "sentiment": "SentimentName",
  "summary": "Short 1-sentence summary",
  "reasoning": "Explain the category and priority reasoning"
}
`.trim();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const parts = [];

    // Attach image if provided (data URI)
    if (imageData) {
      const match = imageData.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: { mimeType: match[1], data: match[2] },
        });
        parts.push({
          text:
            prompt +
            "\n\nCRITICAL: A supporting photo has been uploaded. Analyze the image alongside the text and reference your visual verification in the 'reasoning' field.",
        });
      } else {
        parts.push({ text: prompt });
      }
    } else {
      parts.push({ text: prompt });
    }

    const result = await model.generateContent(parts);
    const text = result.response.text();
    const data = JSON.parse(cleanJsonString(text));

    return {
      category: data.category ?? "Other",
      department: DEPARTMENTS[data.category] ?? DEPARTMENTS["Other"],
      priority: data.priority ?? "Medium",
      sentiment: data.sentiment ?? "Neutral",
      summary: data.summary ?? title.slice(0, 100),
      reasoning: data.reasoning ?? "Classified using Gemini AI model.",
    };
  } catch (err) {
    console.error("[Classifier] Gemini API error, falling back:", err.message);
    return fallbackClassify(title, description);
  }
}

module.exports = { classifyComplaint };
