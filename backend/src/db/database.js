// src/db/database.js
// Supabase (Postgres) client — replaces sql.js

const { createClient } = require("@supabase/supabase-js");

let _supabase = null;

function getDb() {
  if (_supabase) return _supabase;
  throw new Error("Supabase not initialised. Call initDb() first.");
}

async function initDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role bypasses RLS

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env"
    );
  }

  _supabase = createClient(url, key);

  // Verify connection
  const { error } = await _supabase.from("complaints").select("id").limit(1);
  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows — that's fine, table just empty
    throw new Error(`Supabase connection error: ${error.message}`);
  }

  console.log("[OK] Supabase connected.");
  await seedData();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
function hoursAfter(iso, h) {
  return new Date(new Date(iso).getTime() + h * 3600000).toISOString();
}
function daysAfter(iso, d) {
  const dt = new Date(iso);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString();
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seedData() {
  const { count } = await _supabase
    .from("complaints")
    .select("*", { count: "exact", head: true });

  if (count > 0) return; // Already seeded

  const samples = [
    {
      id: "TKT-582910",
      title: "Low hanging power lines posing danger",
      description: "High voltage electricity wires are hanging very low near the playground in Gomti Nagar Sector 3. It is extremely hazardous for children playing in the park. Please tighten them immediately.",
      location: "Gomti Nagar, Lucknow",
      category: "Electricity",
      department: "State Electricity Distribution Corporation (UPPCL)",
      priority: "High", sentiment: "Frustrated",
      summary: "High voltage electricity wires hanging low near playground in Gomti Nagar park, posing danger to children.",
      status: "Escalated", preferred_language: "hi", age_days: 5,
    },
    {
      id: "TKT-192837",
      title: "Severe garbage accumulation and foul smell",
      description: "Uncontrolled heap of waste has accumulated in Sector 12 near the main market. Municipal staff has not visited for a week. Strays are scattering the trash, and it smells terrible.",
      location: "Sector 12, Noida",
      category: "Sanitation",
      department: "Municipal Solid Waste & Sanitation Division",
      priority: "Medium", sentiment: "Angry",
      summary: "Garbage dump accumulated in Noida Sector 12 market with no municipal pickup for a week, causing foul odors.",
      status: "In Progress", preferred_language: "hi", age_days: 2,
    },
    {
      id: "TKT-847291",
      title: "Yellow muddy water supplied in mornings",
      description: "For the past three days, the tap water supplied in the morning has a yellowish color and contains mud particles. We cannot drink or cook with it.",
      location: "Kakadeo, Kanpur",
      category: "Water Supply",
      department: "Jal Sansthan (Water Board)",
      priority: "High", sentiment: "Anxious",
      summary: "Tap water supply contains mud and yellow discolouration in Kakadeo area for three consecutive days.",
      status: "Submitted", preferred_language: "en", age_days: 0,
    },
    {
      id: "TKT-463829",
      title: "Massive potholes on main crossing road",
      description: "The main crossing near Hazratganj has developed huge potholes after the rains. Multiple motorists have fallen off their two-wheelers. Urgent repair required.",
      location: "Hazratganj, Lucknow",
      category: "Roads",
      department: "Public Works Department (PWD)",
      priority: "High", sentiment: "Angry",
      summary: "Hazardous large potholes at Hazratganj crossing following rain, causing vehicle accidents.",
      status: "Resolved", preferred_language: "hi", age_days: 8,
    },
    {
      id: "TKT-304958",
      title: "Street lights not functioning for 2 weeks",
      description: "The entire lane of Block B has non-functional street lights. It gets completely dark by 7 PM, making it unsafe for residents and senior citizens walking in the evening.",
      location: "Indira Nagar, Lucknow",
      category: "Electricity",
      department: "State Electricity Distribution Corporation (UPPCL)",
      priority: "Medium", sentiment: "Neutral",
      summary: "Streetlights off for two weeks in Indira Nagar Block B lane, causing safety concerns.",
      status: "Assigned", preferred_language: "en", age_days: 3,
    },
    {
      id: "TKT-758493",
      title: "Sewer overflow onto main road",
      description: "A manhole is overflowing constantly near the government primary school. The dirty water is flooding the street, and children have to step through it to enter school.",
      location: "Aliganj, Lucknow",
      category: "Sanitation",
      department: "Municipal Solid Waste & Sanitation Division",
      priority: "High", sentiment: "Frustrated",
      summary: "Sewer leakage and overflow near public school in Aliganj, flooding the street.",
      status: "In Progress", preferred_language: "hi", age_days: 1,
    },
  ];

  for (const item of samples) {
    const { age_days, ...fields } = item;
    const createdAt = daysAgo(age_days);
    const updatedAt = fields.status === "Resolved" ? daysAfter(createdAt, 3) : createdAt;

    await _supabase.from("complaints").insert({
      ...fields, image_data: null, created_at: createdAt, updated_at: updatedAt,
    });

    const logs = [];

    logs.push({
      complaint_id: fields.id, status: "Submitted",
      message_en: `Grievance filed successfully. Tracking ID: ${fields.id}`,
      message_hi: `शिकायत सफलतापूर्वक दर्ज कर ली गई है। ट्रैकिंग आईडी: ${fields.id}`,
      agent_reasoning: "AI classification triggered on ingestion. Intent classified as public infrastructure grievance.",
      created_at: createdAt,
    });

    if (["Assigned","In Progress","Escalated","Resolved"].includes(fields.status)) {
      logs.push({
        complaint_id: fields.id, status: "Assigned",
        message_en: `Assigned to ${fields.department} for investigation.`,
        message_hi: `जांच के लिए इसे ${fields.department} को सौंप दिया गया है।`,
        agent_reasoning: `Routing Agent mapped '${fields.category}' to '${fields.department}'.`,
        created_at: hoursAfter(createdAt, 2),
      });
    }

    if (["In Progress","Escalated","Resolved"].includes(fields.status)) {
      logs.push({
        complaint_id: fields.id, status: "In Progress",
        message_en: "Official field investigation initiated. Officer assigned to site.",
        message_hi: "आधिकारिक मैदानी जांच शुरू की गई। अधिकारी को स्थल पर नियुक्त किया गया है।",
        agent_reasoning: "Follow-up Agent recorded acknowledgement from local division desk.",
        created_at: daysAfter(createdAt, 1),
      });
    }

    if (fields.status === "Escalated") {
      logs.push({
        complaint_id: fields.id, status: "Escalated",
        message_en: "Escalated to Division Commissioner due to delay in resolution.",
        message_hi: "नियत समय में समाधान न होने के कारण संभागीय आयुक्त को शिकायत अग्रेषित की गई है।",
        agent_reasoning: "Escalation trigger: High priority ticket remained in progress for more than 72 hours.",
        created_at: daysAfter(createdAt, 4),
      });
    }

    if (fields.status === "Resolved") {
      logs.push({
        complaint_id: fields.id, status: "Resolved",
        message_en: "Resolution complete. Potholes filled and road patch repair verified by inspector.",
        message_hi: "समाधान पूरा हो गया है। गड्ढों को भर दिया गया है और निरीक्षक द्वारा सड़क मरम्मत का सत्यापन किया गया है।",
        agent_reasoning: "Resolution agent confirmed closure with site photos and inspector clearance.",
        created_at: daysAfter(createdAt, 3),
      });
    }

    await _supabase.from("status_logs").insert(logs);
  }

  console.log("[OK] Database seeded with sample complaints.");
}

module.exports = { getDb, initDb };
