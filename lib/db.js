// Postgres client. Works with Vercel Postgres, Supabase, Neon, or any
// standard Postgres — set DATABASE_URL and run schema.sql once.
// Server-side only. Never import from a client component.
import { Pool } from "pg";
import { createHash, randomBytes } from "crypto";

let pool;

export function db() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : { rejectUnauthorized: false },
    });
  }
  return pool;
}

export async function findOrCreateUser(email) {
  const normalized = email.trim().toLowerCase();
  const created = await db().query(
    `INSERT INTO users (email) VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING *`,
    [normalized]
  );
  return created.rows[0];
}

export async function getUserById(id) {
  const client = db();
  const res = await client.query("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows[0] || null;
}

export async function createPendingPurchase(userId, stripeSessionId, product = "starter", reading = null) {
  const client = db();
  const res = await client.query(
    `INSERT INTO purchases (user_id, product, stripe_session_id, status, reading)
     VALUES ($1, $2, $3, 'pending', $4::jsonb)
     ON CONFLICT (stripe_session_id) DO NOTHING
     RETURNING *`,
    [userId, product, stripeSessionId, reading ? JSON.stringify(reading) : null]
  );
  return res.rows[0] || null;
}

export async function markPurchasePaid(stripeSessionId) {
  const client = db();
  const res = await client.query(
    `UPDATE purchases SET status = 'paid', paid_at = now()
     WHERE stripe_session_id = $1 RETURNING *`,
    [stripeSessionId]
  );
  return res.rows[0] || null;
}

export async function markPurchaseNotified(stripeSessionId) {
  await db().query(
    "UPDATE purchases SET notified_at = now() WHERE stripe_session_id = $1",
    [stripeSessionId]
  );
}

export async function userHasPaidStarter(userId) {
  const client = db();
  const res = await client.query(
    `SELECT 1 FROM purchases WHERE user_id = $1 AND product = 'starter' AND status = 'paid' LIMIT 1`,
    [userId]
  );
  return res.rows.length > 0;
}

export async function saveReading(userId, result) {
  const sourceId = String(result?.id || result?.date || new Date().toISOString());
  const res = await db().query(
    `INSERT INTO readings (user_id, source_id, result)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (user_id, source_id)
     DO UPDATE SET result = EXCLUDED.result
     RETURNING *`,
    [userId, sourceId, JSON.stringify(result)]
  );
  return res.rows[0];
}

export async function getReadings(userId) {
  const res = await db().query(
    "SELECT id, source_id, result, created_at FROM readings WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return res.rows;
}

export async function getStarterWorkspace(userId) {
  const res = await db().query(
    `INSERT INTO starter_workspaces (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );
  return res.rows[0];
}

const WORKSPACE_FIELDS = new Set([
  "setup",
  "protocol_start_date",
  "protocol_checked",
  "protocol_notes",
  "protocol_evidence",
  "course_correction",
  "vault_values",
  "completion_review",
]);

export async function syncInterventionOutcomes(userId, workspace, evidence) {
  const startDate = workspace?.protocol_start_date;
  if (!startDate || !evidence || typeof evidence !== "object") return;
  for (const [day, entry] of Object.entries(evidence)) {
    if (!entry?.signal || !entry?.interventionId) continue;
    await db().query(
      `INSERT INTO intervention_outcomes
         (user_id, sprint_start_date, method_version, intervention_key, module, plan_day, outcome_signal, evidence_type, evidence_length)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (user_id, sprint_start_date, intervention_key) DO UPDATE SET
         module = EXCLUDED.module, outcome_signal = EXCLUDED.outcome_signal,
         evidence_type = EXCLUDED.evidence_type, evidence_length = EXCLUDED.evidence_length, updated_at = now()`,
      [userId, startDate, entry.methodVersion || "1.1", entry.interventionId, entry.module || null,
        Number(day), entry.signal, entry.type || null, String(entry.output || "").length]
    );
  }
}

export async function getInterventionBenchmarks(methodVersion = "1.1") {
  const res = await db().query(
    `SELECT intervention_key, module, count(*)::int AS sample_size,
       round(100.0 * count(*) FILTER (WHERE outcome_signal IN ('strong', 'some')) / count(*))::int AS movement_rate,
       round(100.0 * count(*) FILTER (WHERE outcome_signal = 'strong') / count(*))::int AS strong_rate
     FROM intervention_outcomes WHERE method_version = $1
     GROUP BY intervention_key, module HAVING count(*) >= 10`,
    [methodVersion]
  );
  return res.rows;
}

export async function updateStarterWorkspace(userId, updates) {
  await getStarterWorkspace(userId);
  const entries = Object.entries(updates).filter(([key]) => WORKSPACE_FIELDS.has(key));
  if (!entries.length) return getStarterWorkspace(userId);
  const values = [userId];
  const assignments = entries.map(([key, value], index) => {
    values.push(key === "protocol_start_date" ? value || null : JSON.stringify(value || {}));
    return key === "protocol_start_date"
      ? `${key} = $${index + 2}`
      : `${key} = $${index + 2}::jsonb`;
  });
  const res = await db().query(
    `UPDATE starter_workspaces SET ${assignments.join(", ")}, updated_at = now()
     WHERE user_id = $1 RETURNING *`,
    values
  );
  return res.rows[0] || getStarterWorkspace(userId);
}

export async function createEmailSignInToken(userId, requester = "unknown", { skipRateLimit = false } = {}) {
  const requesterHash = createHash("sha256").update(requester).digest("hex");
  if (!skipRateLimit) {
    const recent = await db().query(
      `SELECT
         count(*) FILTER (WHERE user_id = $1)::int AS user_count,
         count(*) FILTER (WHERE requester_hash = $2)::int AS requester_count
       FROM auth_tokens WHERE created_at > now() - interval '15 minutes'`,
      [userId, requesterHash]
    );
    if (recent.rows[0].user_count >= 3 || recent.rows[0].requester_count >= 20) {
      throw new Error("Too many sign-in links requested. Try again in 15 minutes.");
    }
  }
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await db().query(
    `INSERT INTO auth_tokens (user_id, token_hash, requester_hash, expires_at)
     VALUES ($1, $2, $3, now() + interval '15 minutes')`,
    [userId, tokenHash, requesterHash]
  );
  return token;
}

export async function consumeEmailSignInToken(token) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const res = await db().query(
    `UPDATE auth_tokens SET consumed_at = now()
     WHERE token_hash = $1 AND consumed_at IS NULL AND expires_at > now()
     RETURNING user_id`,
    [tokenHash]
  );
  if (!res.rows[0]) return null;
  return getUserById(res.rows[0].user_id);
}

export async function recordProductEvent(userId, name, metadata = {}) {
  await db().query(
    "INSERT INTO product_events (user_id, name, metadata) VALUES ($1, $2, $3::jsonb)",
    [userId || null, name, JSON.stringify(metadata)]
  );
}
