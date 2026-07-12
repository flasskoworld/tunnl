// Postgres client. Works with Vercel Postgres, Supabase, Neon, or any
// standard Postgres — set DATABASE_URL and run schema.sql once.
// Server-side only. Never import from a client component.
import { Pool } from "pg";

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
  const client = db();
  const existing = await client.query("SELECT * FROM users WHERE email = $1", [normalized]);
  if (existing.rows[0]) return existing.rows[0];
  const created = await client.query(
    "INSERT INTO users (email) VALUES ($1) RETURNING *",
    [normalized]
  );
  return created.rows[0];
}

export async function getUserById(id) {
  const client = db();
  const res = await client.query("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows[0] || null;
}

export async function createPendingPurchase(userId, stripeSessionId, product = "starter") {
  const client = db();
  const res = await client.query(
    `INSERT INTO purchases (user_id, product, stripe_session_id, status)
     VALUES ($1, $2, $3, 'pending')
     ON CONFLICT (stripe_session_id) DO NOTHING
     RETURNING *`,
    [userId, product, stripeSessionId]
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

export async function userHasPaidStarter(userId) {
  const client = db();
  const res = await client.query(
    `SELECT 1 FROM purchases WHERE user_id = $1 AND product = 'starter' AND status = 'paid' LIMIT 1`,
    [userId]
  );
  return res.rows.length > 0;
}

// ── One-time codes — the alternative to clicking the magic link ──

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

export async function createOtpCode(email) {
  const code = generateOtp();
  const client = db();
  await client.query(
    `INSERT INTO otp_codes (email, code, expires_at)
     VALUES ($1, $2, now() + interval '10 minutes')`,
    [email.trim().toLowerCase(), code]
  );
  return code;
}

// Single-use, 10-minute window. Not rate-limited in v1 — see README for
// the production note (per-email/IP throttling before this scales).
export async function verifyAndConsumeOtp(email, code) {
  const client = db();
  const res = await client.query(
    `UPDATE otp_codes SET consumed_at = now()
     WHERE email = $1 AND code = $2
       AND consumed_at IS NULL AND expires_at > now()
     RETURNING id`,
    [email.trim().toLowerCase(), code.trim()]
  );
  return res.rows.length > 0;
}
