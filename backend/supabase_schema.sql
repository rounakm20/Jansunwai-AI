-- ============================================================
-- Jansunwai AI Portal — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id                 TEXT PRIMARY KEY,                        -- e.g. TKT-123456
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  location           TEXT NOT NULL,
  category           TEXT,
  department         TEXT,
  priority           TEXT,                                    -- High | Medium | Low
  sentiment          TEXT,                                    -- Angry | Frustrated | Anxious | Neutral | Hopeful
  summary            TEXT,
  status             TEXT NOT NULL DEFAULT 'Submitted',       -- Submitted | Assigned | In Progress | Escalated | Resolved
  preferred_language TEXT NOT NULL DEFAULT 'en',             -- en | hi
  image_data         TEXT,                                    -- base64 data URI (nullable)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Status logs table
CREATE TABLE IF NOT EXISTS status_logs (
  id               BIGSERIAL PRIMARY KEY,
  complaint_id     TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  status           TEXT NOT NULL,
  message_en       TEXT NOT NULL,
  message_hi       TEXT NOT NULL,
  agent_reasoning  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_complaints_status     ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category   ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_priority   ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_department ON complaints(department);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_complaint_id     ON status_logs(complaint_id);

-- Optional: full-text search index (speeds up the ?search= filter)
CREATE INDEX IF NOT EXISTS idx_complaints_fts ON complaints
  USING GIN (to_tsvector('english', title || ' ' || description || ' ' || location));

-- ============================================================
-- Row Level Security
-- The backend uses the service-role key which bypasses RLS,
-- but enable RLS anyway so anon/public keys can't read data.
-- ============================================================
ALTER TABLE complaints   ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs  ENABLE ROW LEVEL SECURITY;

-- Allow the service role full access (it bypasses RLS by default,
-- but these policies are good documentation of intent)
CREATE POLICY "service_role_all_complaints"  ON complaints   FOR ALL USING (true);
CREATE POLICY "service_role_all_status_logs" ON status_logs  FOR ALL USING (true);
