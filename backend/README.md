# Jansunwai AI Portal — Node.js / Express + Supabase Backend

## Stack

| Concern | Library |
|---|---|
| HTTP server | Express 4 |
| Database | Supabase (Postgres) via `@supabase/supabase-js` |
| AI classification | `@google/generative-ai` (Gemini 1.5 Flash) |
| Config | `dotenv` |

## Setup

### 1. Create your Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor → New Query**, paste the contents of `supabase_schema.sql`, and run it
3. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Configure environment
```bash
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and optionally GEMINI_API_KEY
```

### 3. Install and run
```bash
npm install
npm start          # production
npm run dev        # nodemon hot-reload
```

The server starts on **http://localhost:8000**. On first boot it seeds 6 sample complaints automatically if the table is empty.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/complaints` | File a new complaint (AI classification + routing) |
| `GET`  | `/api/complaints` | List complaints — filters: `search`, `category`, `status`, `priority`, `department` |
| `GET`  | `/api/complaints/:id` | Complaint detail + full status history |
| `POST` | `/api/complaints/:id/status` | Update status: `In Progress` / `Resolved` / `Escalated` |
| `POST` | `/api/simulate-tick` | Simulate 2-day time advance, triggers auto-escalation |
| `GET`  | `/api/stats` | Dashboard statistics (optional `?department=`) |
| `GET`  | `/api/trends` | Daily filed/resolved trend data (optional `?days=14`) |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default `8000`) |
| `SUPABASE_URL` | **Yes** | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Service role key (bypasses RLS) |
| `GEMINI_API_KEY` | No | Google Gemini key — keyword heuristics used if absent |

## AI Agents

- **Classifier** — Gemini 1.5 Flash (multimodal: text + optional image). Falls back to keyword rules.
- **Router** — generates `TKT-XXXXXX` ticket IDs and writes the Assigned log entry.
- **Vernacular** — bilingual EN/HI citizen SMS messages via Gemini (template fallback).
- **Escalator** — auto-escalates on SLA breach: High ≥ 3 days, Medium ≥ 7 days, Low ≥ 14 days.
