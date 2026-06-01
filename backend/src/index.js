require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initDb } = require("./db/database");
const complaintsRouter = require("./routes/complaints");

const app = express();
const PORT = process.env.PORT || 8000;

// Allow any localhost port in dev + any VERCEL/Railway domain in prod
const allowedOrigins = [
  /^http:\/\/localhost(:\d+)?$/,
  /\.vercel\.app$/,
  /\.railway\.app$/,
  /\.netlify\.app$/,
  /\.onrender\.com$/,   // ← added for Render deployment
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl / Postman
    if (allowedOrigins.some(p => (typeof p === "string" ? p === origin : p.test(origin))))
      return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api", complaintsRouter);
app.get("/", (_req, res) => res.json({ name: "Jansunwai AI Portal", version: "1.0.0", status: "running" }));
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));

async function start() {
  try {
    await initDb();

    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const masked = apiKey.slice(0, 7) + "..." + apiKey.slice(-4);
      console.log(`\n[OK] Gemini AI active (${masked})`);
    } else {
      console.log("\n[WARN] No GEMINI_API_KEY — using keyword heuristics");
    }

    app.listen(PORT, () =>
      console.log(`[OK] Jansunwai backend → http://localhost:${PORT}\n`)
    );
  } catch (err) {
    console.error("[FATAL]", err.message);
    process.exit(1);
  }
}

start();