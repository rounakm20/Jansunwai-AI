# 🇮🇳 Jansunwai AI Portal — Full Stack

React + Vite frontend · Node.js / Express backend · Supabase (Postgres) · Gemini AI

```
jansunwai-fullstack/
├── frontend/   ← React + Vite + Tailwind
└── backend/    ← Express + Supabase + Gemini
```

---

## 1. Supabase Setup (one-time)

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Open **SQL Editor → New Query**, paste `backend/supabase_schema.sql`, and **Run**
3. Go to **Settings → API** and note:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## 2. Backend

```bash
cd backend
cp .env.example .env        # fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
npm install
npm run dev                 # starts on http://localhost:8000
```

---

## 3. Frontend

```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8000/api (default is fine)
npm install
npm run dev                 # starts on http://localhost:5173
```

Open **http://localhost:5173** — done!

---

## Deployment

| Part | Recommended |
|------|-------------|
| Frontend | Vercel (connect your repo, set `VITE_API_URL`) |
| Backend | Railway or Render (set all 3 env vars) |
| Database | Supabase (already hosted) |

Set `VITE_API_URL` in Vercel to your Railway/Render backend URL, e.g.  
`https://jansunwai-backend.railway.app/api`

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/complaints` | File new complaint (AI classification) |
| GET  | `/api/complaints` | List — filters: `search`, `category`, `status`, `priority`, `department` |
| GET  | `/api/complaints/:id` | Detail + status history |
| POST | `/api/complaints/:id/status` | Update status |
| POST | `/api/simulate-tick` | Simulate 2-day time advance (auto-escalation) |
| GET  | `/api/stats` | Dashboard stats |
| GET  | `/api/trends` | Daily trends |
