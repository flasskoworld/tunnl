-- TUNNL — Postgres schema (Vercel Postgres, Supabase, Neon, or any
-- standard Postgres all work — just set DATABASE_URL).

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product TEXT NOT NULL DEFAULT 'starter',
  stripe_session_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | paid
  reading JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

ALTER TABLE purchases ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS reading JSONB;

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON purchases(user_id, status);

CREATE TABLE IF NOT EXISTS auth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  requester_hash TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE auth_tokens ADD COLUMN IF NOT EXISTS requester_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_created ON auth_tokens(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_id)
);

CREATE INDEX IF NOT EXISTS idx_readings_user_created ON readings(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS starter_workspaces (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  setup JSONB NOT NULL DEFAULT '{}'::jsonb,
  protocol_start_date DATE,
  protocol_checked JSONB NOT NULL DEFAULT '{}'::jsonb,
  protocol_notes JSONB NOT NULL DEFAULT '{}'::jsonb,
  vault_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  completion_review JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_events_name_created ON product_events(name, created_at DESC);
