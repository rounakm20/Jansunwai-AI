// src/routes/complaints.js
const { Router } = require("express");
const { getDb } = require("../db/database");
const { classifyComplaint } = require("../agents/classifier");
const { generateTicketId, routeComplaint } = require("../agents/router");
const { generateVernacularMessages } = require("../agents/vernacular");
const { checkAndEscalateComplaints } = require("../agents/escalator");

const router = Router();

// ── POST /api/complaints ──────────────────────────────────────────────────────
router.post("/complaints", async (req, res) => {
  try {
    const { title, description, location, preferred_language = "en", image_data = null } = req.body;
    if (!title || !description || !location)
      return res.status(400).json({ error: "title, description and location are required" });

    const sb = getDb();
    const ticketId = generateTicketId();
    const ai = await classifyComplaint(title, description, image_data);
    const now = new Date().toISOString();

    const { data: complaint, error } = await sb.from("complaints").insert({
      id: ticketId, title, description, location,
      category: ai.category, department: ai.department,
      priority: ai.priority, sentiment: ai.sentiment, summary: ai.summary,
      status: "Submitted", preferred_language, image_data,
      created_at: now, updated_at: now,
    }).select().single();

    if (error) throw error;

    const [msgEn, msgHi] = await generateVernacularMessages("Submitted", { id: ticketId, department: ai.department });
    await sb.from("status_logs").insert({
      complaint_id: ticketId, status: "Submitted",
      message_en: msgEn, message_hi: msgHi,
      agent_reasoning: "Citizen submission captured. File upload verified (if any). Real-time ingestion complete.",
      created_at: now,
    });

    // Assign immediately
    const { data: updated, error: updateErr } = await sb
      .from("complaints").update({ status: "Assigned", updated_at: now })
      .eq("id", ticketId).select().single();
    if (updateErr) throw updateErr;

    await routeComplaint({ complaintId: ticketId, category: ai.category, department: ai.department,
      reasoning: ai.reasoning ?? "Autonomous routing triggered by classification metadata." });

    return res.status(201).json(updated);
  } catch (err) {
    console.error("[POST /complaints]", err);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

// ── GET /api/complaints ───────────────────────────────────────────────────────
router.get("/complaints", async (req, res) => {
  try {
    const sb = getDb();
    const { search, category, status, priority, department } = req.query;

    let query = sb.from("complaints").select("*").order("created_at", { ascending: false });

    if (category)   query = query.eq("category", category);
    if (status)     query = query.eq("status", status);
    if (priority)   query = query.eq("priority", priority);
    if (department) query = query.eq("department", department);
    if (search) {
      // Supabase full-text search across multiple columns via ilike + or
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,id.ilike.%${search}%,location.ilike.%${search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json(data);
  } catch (err) {
    console.error("[GET /complaints]", err);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

// ── GET /api/complaints/:id ───────────────────────────────────────────────────
router.get("/complaints/:id", async (req, res) => {
  try {
    const sb = getDb();

    const { data: complaint, error: e1 } = await sb
      .from("complaints").select("*").eq("id", req.params.id).single();
    if (e1 || !complaint) return res.status(404).json({ error: "Complaint not found" });

    const { data: history, error: e2 } = await sb
      .from("status_logs").select("*").eq("complaint_id", req.params.id).order("created_at", { ascending: true });
    if (e2) throw e2;

    return res.json({ complaint, history });
  } catch (err) {
    console.error("[GET /complaints/:id]", err);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

// ── POST /api/complaints/:id/status ──────────────────────────────────────────
router.post("/complaints/:id/status", async (req, res) => {
  try {
    const sb = getDb();
    const { status, action_taken = null } = req.body;

    const { data: complaint, error: e1 } = await sb
      .from("complaints").select("*").eq("id", req.params.id).single();
    if (e1 || !complaint) return res.status(404).json({ error: "Complaint not found" });

    if (!["In Progress", "Resolved", "Escalated"].includes(status))
      return res.status(400).json({ error: "Invalid status transition" });

    const now = new Date().toISOString();
    const { data: updated, error: e2 } = await sb
      .from("complaints").update({ status, updated_at: now }).eq("id", complaint.id).select().single();
    if (e2) throw e2;

    const details = { id: complaint.id, department: complaint.department,
      action: action_taken ?? "Administrative status update" };
    const [msgEn, msgHi] = await generateVernacularMessages(status, details);

    const { error: e3 } = await sb.from("status_logs").insert({
      complaint_id: complaint.id, status,
      message_en: msgEn, message_hi: msgHi,
      agent_reasoning: `Manual action logged by department administrator. Detail: ${action_taken ?? "None"}`,
      created_at: now,
    });
    if (e3) throw e3;

    return res.json(updated);
  } catch (err) {
    console.error("[POST /complaints/:id/status]", err);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

// ── POST /api/simulate-tick ───────────────────────────────────────────────────
router.post("/simulate-tick", async (req, res) => {
  try {
    const sb = getDb();
    const { data: active, error: e1 } = await sb
      .from("complaints").select("id,created_at").neq("status", "Resolved");
    if (e1) throw e1;

    const twoDaysMs = 2 * 24 * 60 * 60 * 1000;
    for (const c of active) {
      const shifted = new Date(new Date(c.created_at).getTime() - twoDaysMs).toISOString();
      await sb.from("complaints").update({ created_at: shifted }).eq("id", c.id);
    }

    const escalatedIds = await checkAndEscalateComplaints();

    return res.json({
      message: `Time simulated forward by 2 days. Processed ${active.length} complaints.`,
      escalated_count: escalatedIds.length,
      escalated_tickets: escalatedIds,
    });
  } catch (err) {
    console.error("[POST /simulate-tick]", err);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

// ── GET /api/stats ────────────────────────────────────────────────────────────
router.get("/stats", async (req, res) => {
  try {
    const sb = getDb();
    const dept = req.query.department;

    // Helper: count with optional dept filter
    const count = async (filters = {}) => {
      let q = sb.from("complaints").select("*", { count: "exact", head: true });
      for (const [col, val] of Object.entries(filters)) q = q.eq(col, val);
      if (dept) q = q.eq("department", dept);
      const { count: c, error } = await q;
      if (error) throw error;
      return c ?? 0;
    };

    const [total, pending, resolved, escalated] = await Promise.all([
      count(),
      (async () => { let q = sb.from("complaints").select("*",{count:"exact",head:true}).neq("status","Resolved"); if(dept) q=q.eq("department",dept); const {count:c}=await q; return c??0; })(),
      count({ status: "Resolved" }),
      count({ status: "Escalated" }),
    ]);

    const categories = ["Sanitation","Water Supply","Electricity","Roads","Health","Public Safety","Other"];
    const categoryData = Object.fromEntries(
      await Promise.all(categories.map(async (cat) => [cat, await count({ category: cat })]))
    );

    const priorities = ["High","Medium","Low"];
    const priorityData = Object.fromEntries(
      await Promise.all(priorities.map(async (p) => [p, await count({ priority: p })]))
    );

    // Avg resolution hours
    let avgHours = 36.5;
    let q = sb.from("complaints").select("created_at,updated_at").eq("status","Resolved");
    if (dept) q = q.eq("department", dept);
    const { data: resolvedTickets } = await q;
    if (resolvedTickets?.length > 0) {
      const totalHrs = resolvedTickets.reduce(
        (sum, t) => sum + (new Date(t.updated_at) - new Date(t.created_at)) / 3600000, 0
      );
      avgHours = totalHrs / resolvedTickets.length;
    }

    const statuses = ["Submitted","Assigned","In Progress","Escalated","Resolved"];
    const byStatus = Object.fromEntries(
      await Promise.all(statuses.map(async (s) => [s, await count({ status: s })]))
    );

    return res.json({
      total_complaints: total, pending_complaints: pending,
      resolved_complaints: resolved, escalated_complaints: escalated,
      category_data: categoryData, priority_data: priorityData,
      avg_resolution_hours: Math.round(avgHours * 10) / 10,
      by_status: byStatus,
    });
  } catch (err) {
    console.error("[GET /stats]", err);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

// ── GET /api/trends ───────────────────────────────────────────────────────────
router.get("/trends", async (req, res) => {
  try {
    const sb = getDb();
    const days = parseInt(req.query.days, 10) || 14;

    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    const startStr = start.toISOString().slice(0, 10);

    const { data: filed } = await sb
      .from("complaints").select("created_at").gte("created_at", startStr);
    const { data: resolvedRows } = await sb
      .from("complaints").select("updated_at").eq("status","Resolved").gte("updated_at", startStr);

    // Tally by date
    const filedMap = {}, resolvedMap = {};
    (filed ?? []).forEach(r => {
      const d = r.created_at.slice(0,10);
      filedMap[d] = (filedMap[d] ?? 0) + 1;
    });
    (resolvedRows ?? []).forEach(r => {
      const d = r.updated_at.slice(0,10);
      resolvedMap[d] = (resolvedMap[d] ?? 0) + 1;
    });

    const trends = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const dayStr = d.toISOString().slice(0, 10);
      const label  = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      trends.push({ date: dayStr, label, filed: filedMap[dayStr] ?? 0, resolved: resolvedMap[dayStr] ?? 0 });
    }

    return res.json({ trends, days });
  } catch (err) {
    console.error("[GET /trends]", err);
    return res.status(500).json({ error: err.message ?? "Internal server error" });
  }
});

module.exports = router;
