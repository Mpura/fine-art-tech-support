import { SETTINGS_TABLE, SETTINGS_RECS, todayISO } from "../shared.jsx";

// ── AIRTABLE REST API (via secure server proxy) ──────────────────
// All calls go to /api/airtable — the token never leaves the server.

// Staff PIN entered at unlock — attached to every call so the server can
// authorise staff-only operations. Empty for students; public ops don't need it.
function getStaffPin() { try { return sessionStorage.getItem("fats_staff_pin") || ""; } catch (e) { return ""; } }

// Returns { ok, locked, retryAfter } so callers can distinguish a wrong PIN
// from a brute-force lockout.
async function verifyStaffPin(pin) {
  try {
    const res = await fetch("/api/airtable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "VERIFY_PIN", pin }),
    });
    const data = await res.json();
    return { ok: !!data.ok, locked: !!data.locked, retryAfter: data.retryAfter || 0 };
  } catch (e) { return { ok: false, locked: false, retryAfter: 0 }; }
}

// Shared response handler. If a staff session's PIN is stale (changed elsewhere,
// or the session predates a security update), the server answers 403 — in that
// case force a re-lock so the user lands on the PIN screen instead of staring
// at silently empty panels.
async function handleResp(res) {
  const data = await res.json();
  if (res.status === 403 && data?.error === "Staff PIN required") {
    try {
      if (sessionStorage.getItem("fats_staff_unlocked") === "1") {
        sessionStorage.removeItem("fats_staff_unlocked");
        sessionStorage.removeItem("fats_staff_pin");
        window.location.reload();
      }
    } catch (e) { /* sessionStorage unavailable — nothing to clear */ }
  }
  return data;
}

async function atCall(body) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, staffPin: getStaffPin() }),
  });
  return handleResp(res);
}

// Airtable returns at most 100 records per page — follow the offset token so
// list fetches return everything instead of silently stopping at 100.
// publicScope ({ value }) scopes reads of personal-data tables to one student
// when the caller has no staff PIN; the server enforces it.
async function atGet(table, params = {}, publicScope) {
  const scope = publicScope ? { publicScope } : {};
  let data = await atCall({ table, method: "GET", params, ...scope });
  if (!data.records || !data.offset) return data;
  const all = [...data.records];
  let guard = 0;
  while (data.offset && guard++ < 50) {
    data = await atCall({ table, method: "GET", params: { ...params, offset: data.offset }, ...scope });
    if (!data.records) break;
    all.push(...data.records);
  }
  return { ...data, records: all };
}
const atPost = (table, fields) => atCall({ table, method: "POST", fields });
const atPatch = (table, recordId, fields) => atCall({ table, method: "PATCH", recordId, fields });
const atDelete = (table, recordId) => atCall({ table, method: "DELETE", recordId });

// Persist a shared setting to Airtable (fire-and-forget; localStorage stays as cache)
function saveSetting(key, value) {
  const recId = SETTINGS_RECS[key];
  if (!recId) return Promise.resolve();
  return atPatch(SETTINGS_TABLE, recId, { Value: JSON.stringify(value), UpdatedAt: todayISO() }).catch(() => {});
}

export { getStaffPin, verifyStaffPin, atGet, atPost, atPatch, atDelete, saveSetting };
