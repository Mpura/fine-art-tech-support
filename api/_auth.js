// Shared server-side staff-PIN verification with per-IP brute-force lockout.
// (Underscore prefix = not exposed as an endpoint by Vercel.)
//
// State lives in a Settings record named "ratelimit" (Value = JSON keyed by IP).
// Every PIN check already reads the Settings table for the stored PIN, so the
// lockout state rides along in that same fetch — no extra round-trip on the
// hot path, and no new infrastructure.

const BASE_ID = "appUqkCfnsOo2Jf7z";
const SETTINGS = "tblfEH66wD8KPJMl9";

const MAX_FAILS = 5;                       // failures before a lockout kicks in
const WINDOW_MS = 10 * 60 * 1000;          // failures older than this reset
const LOCK_MS = 15 * 60 * 1000;            // how long a locked IP stays out
const DELAY_MS = 700;                      // artificial delay on every failed try

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) return String(xff).split(",")[0].trim() || "unknown";
  return req.headers["x-real-ip"] || "unknown";
}

// One Settings fetch → the stored PIN plus the rate-limit record and this IP's
// current lockout status.
export async function getPinContext(PAT, ip) {
  const now = Date.now();
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${SETTINGS}?maxRecords=50`,
    { headers: { Authorization: `Bearer ${PAT}` } }
  );
  let stored = null, rlId = null, rlState = {};
  if (res.ok) {
    const data = await res.json();
    for (const rec of data.records || []) {
      const name = rec.fields?.Name;
      if (name === "pin") {
        try { stored = String(JSON.parse(rec.fields.Value ?? "null")); } catch (e) {}
      } else if (name === "ratelimit") {
        rlId = rec.id;
        try { rlState = JSON.parse(rec.fields.Value || "{}"); } catch (e) {}
      }
    }
  }
  const entry = rlState[ip];
  const locked = !!(entry?.until && entry.until > now);
  const retryAfter = locked ? Math.ceil((entry.until - now) / 1000) : 0;
  return { stored, rlId, rlState, now, locked, retryAfter };
}

async function saveRateLimit(PAT, ctx) {
  // Prune entries that are neither actively locked nor within the fail window
  for (const [k, v] of Object.entries(ctx.rlState)) {
    const lockedActive = v.until && v.until > ctx.now;
    const windowActive = v.first && ctx.now - v.first < WINDOW_MS;
    if (!lockedActive && !windowActive) delete ctx.rlState[k];
  }
  const headers = { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" };
  const body = JSON.stringify({
    fields: {
      Name: "ratelimit",
      Value: JSON.stringify(ctx.rlState),
      UpdatedAt: new Date().toISOString().slice(0, 10),
    },
  });
  if (ctx.rlId) {
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${SETTINGS}/${ctx.rlId}`, { method: "PATCH", headers, body });
  } else {
    await fetch(`https://api.airtable.com/v0/${BASE_ID}/${SETTINGS}`, { method: "POST", headers, body });
  }
}

// Record the outcome of a PIN check for this IP. Clears on success; on failure
// increments the counter, locks after MAX_FAILS, and delays to slow guessing.
export async function notePinResult(PAT, ctx, ip, success) {
  const entry = ctx.rlState[ip];
  if (success) {
    if (entry) { delete ctx.rlState[ip]; await saveRateLimit(PAT, ctx); }
    return { justLocked: false };
  }
  const within = entry && entry.first && ctx.now - entry.first < WINDOW_MS;
  let next = { fails: within ? (entry.fails || 0) + 1 : 1, first: within ? entry.first : ctx.now };
  let justLocked = false;
  if (next.fails >= MAX_FAILS) {
    next = { fails: 0, first: ctx.now, until: ctx.now + LOCK_MS };
    justLocked = true;
  }
  ctx.rlState[ip] = next;
  await saveRateLimit(PAT, ctx);
  await sleep(DELAY_MS);
  return { justLocked, retryAfter: justLocked ? Math.ceil(LOCK_MS / 1000) : 0 };
}

// Full verify with lockout — for low-frequency callers (report endpoints).
// Returns { ok, locked, retryAfter }.
export async function verifyPin(candidate, PAT, ip) {
  if (!PAT) return { ok: false };
  const ctx = await getPinContext(PAT, ip);
  if (ctx.locked) return { ok: false, locked: true, retryAfter: ctx.retryAfter };
  const ok = ctx.stored != null && ctx.stored !== "null" && String(candidate) === ctx.stored;
  const note = await notePinResult(PAT, ctx, ip, ok);
  return { ok, locked: note.justLocked, retryAfter: note.retryAfter };
}

// Back-compat boolean wrapper.
export async function verifyStaffPin(staffPin, PAT, ip = "server") {
  const r = await verifyPin(staffPin, PAT, ip);
  return r.ok;
}
