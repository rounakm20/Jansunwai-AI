// src/agents/router.js
const { getDb } = require("../db/database");

function generateTicketId() {
  return `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
}

async function routeComplaint({ complaintId, category, department, reasoning }) {
  const sb = getDb();
  const msgEn = `Grievance auto-classified under '${category}' and routed to '${department}'.`;
  const msgHi = `शिकायत को '${category}' के अंतर्गत वर्गीकृत किया गया है और '${department}' को अग्रेषित किया गया है।`;
  const { error } = await sb.from("status_logs").insert({
    complaint_id: complaintId, status: "Assigned",
    message_en: msgEn, message_hi: msgHi,
    agent_reasoning: reasoning,
    created_at: new Date().toISOString(),
  });
  if (error) throw error;
  return msgEn;
}

module.exports = { generateTicketId, routeComplaint };
