// src/agents/escalator.js
const { getDb } = require("../db/database");
const { generateVernacularMessages } = require("./vernacular");

const SLA_DAYS = { High: 3, Medium: 7, Low: 14 };

async function checkAndEscalateComplaints() {
  const sb = getDb();
  const now = new Date();
  const escalatedIds = [];

  const { data: active, error } = await sb
    .from("complaints").select("*").in("status", ["Assigned","In Progress"]);
  if (error) throw error;

  for (const c of active) {
    const daysOld = Math.floor((now - new Date(c.created_at)) / 86400000);
    const threshold = SLA_DAYS[c.priority] ?? 14;
    if (daysOld < threshold) continue;

    await sb.from("complaints")
      .update({ status: "Escalated", updated_at: now.toISOString() })
      .eq("id", c.id);

    const details = { id: c.id, department: c.department, action: "Escalated to Special Desk Officer" };
    const [msgEn, msgHi] = await generateVernacularMessages("Escalated", details);
    const reason = `${c.priority} priority grievance exceeded ${threshold}-day SLA (Age: ${daysOld} days) without resolution.`;

    await sb.from("status_logs").insert({
      complaint_id: c.id, status: "Escalated",
      message_en: msgEn, message_hi: msgHi,
      agent_reasoning: `Autonomous Escalation Engine triggered: ${reason}`,
      created_at: now.toISOString(),
    });
    escalatedIds.push(c.id);
  }
  return escalatedIds;
}

module.exports = { checkAndEscalateComplaints };
