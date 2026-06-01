// src/agents/vernacular.js
// Generates bilingual (EN + HI) citizen-update messages using Gemini or templates.

const { GoogleGenerativeAI } = require("@google/generative-ai");

const TEMPLATES = {
  Submitted: {
    en: "Grievance received successfully. Tracking ID is {id}. AI agent is evaluating category and routing.",
    hi: "शिकायत सफलतापूर्वक प्राप्त हुई। ट्रैकिंग आईडी {id} है। एआई एजेंट श्रेणी और विभाग मैपिंग का मूल्यांकन कर रहा है।",
  },
  Assigned: {
    en: "Your complaint has been assigned to {department}.",
    hi: "आपकी शिकायत {department} को सौंप दी गई है।",
  },
  "In Progress": {
    en: "Department team acknowledged the grievance. Investigation and on-site resolution are in progress.",
    hi: "विभाग की टीम ने शिकायत स्वीकार कर ली है। जांच और ऑन-साइट समाधान प्रगति पर है।",
  },
  Escalated: {
    en: "Escalation Warning: Complaint escalated to District Magistrate / Commissioner's division due to delay.",
    hi: "चेतावनी: समय सीमा पार होने के कारण शिकायत को जिलाधिकारी / आयुक्त मंडल स्तर पर अग्रेषित किया गया है।",
  },
  Resolved: {
    en: "Grievance resolved successfully. Resolution action verified by inspector: {action}",
    hi: "शिकायत का समाधान सफलतापूर्वक हो गया है। निरीक्षक द्वारा सत्यापित कार्रवाई: {action}",
  },
};

function applyTemplate(template, vars) {
  return template
    .replace("{id}", vars.id ?? "N/A")
    .replace("{department}", vars.department ?? "General Administration")
    .replace("{action}", vars.action ?? "Standard action taken");
}

/**
 * Returns [messageEn, messageHi] for a given status update.
 * Falls back to templates if Gemini is unavailable.
 *
 * @param {string} status
 * @param {{ id: string, department: string, action?: string }} details
 * @returns {Promise<[string, string]>}
 */
async function generateVernacularMessages(status, details) {
  const tmpl = TEMPLATES[status] ?? TEMPLATES["Submitted"];
  const defaultEn = applyTemplate(tmpl.en, details);
  const defaultHi = applyTemplate(tmpl.hi, details);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [defaultEn, defaultHi];

  const prompt = `
You are an AI Communications officer for the Government.
Your task is to write a citizen-friendly SMS update for a grievance.
Status of grievance: ${status}
Ticket ID: ${details.id ?? "N/A"}
Department: ${details.department ?? "General Administration"}
Additional details/actions: ${details.action ?? "N/A"}

Write two brief SMS messages (under 160 characters each):
1. In plain English (clear, professional)
2. In clear Hindi (vernacular, easily understood by common citizens in UP, using Devanagari script)

Output exactly two lines and nothing else:
EN: [English message here]
HI: [Hindi message here]
`.trim();

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const lines = result.response.text().trim().split("\n");

    let en = defaultEn;
    let hi = defaultHi;
    for (const line of lines) {
      if (line.toUpperCase().startsWith("EN:")) en = line.slice(3).trim();
      else if (line.toUpperCase().startsWith("HI:")) hi = line.slice(3).trim();
    }
    return [en, hi];
  } catch (err) {
    console.error("[Vernacular] Gemini error, using template:", err.message);
    return [defaultEn, defaultHi];
  }
}

module.exports = { generateVernacularMessages };
