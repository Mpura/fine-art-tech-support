import { SETTINGS_TABLE, SETTINGS_RECS, todayISO } from "../shared.jsx";

// ── AIRTABLE REST API (via secure server proxy) ──────────────────
// All calls go to /api/airtable — the token never leaves the server.

// Staff PIN entered at unlock — attached to every call so the server can
// authorise staff-only operations. Empty for students; public ops don't need it.
function getStaffPin() { try { return sessionStorage.getItem("fats_staff_pin") || ""; } catch (e) { return ""; } }

async function verifyStaffPin(pin) {
  try {
    const res = await fetch("/api/airtable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "VERIFY_PIN", pin }),
    });
    const data = await res.json();
    return !!data.ok;
  } catch (e) { return false; }
}

async function atGet(table, params = {}) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method: "GET", params, staffPin: getStaffPin() }),
  });
  return res.json();
}

async function atPost(table, fields) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method: "POST", fields, staffPin: getStaffPin() }),
  });
  return res.json();
}

async function atPatch(table, recordId, fields) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method: "PATCH", recordId, fields, staffPin: getStaffPin() }),
  });
  return res.json();
}

// Persist a shared setting to Airtable (fire-and-forget; localStorage stays as cache)
function saveSetting(key, value) {
  const recId = SETTINGS_RECS[key];
  if (!recId) return Promise.resolve();
  return atPatch(SETTINGS_TABLE, recId, { Value: JSON.stringify(value), UpdatedAt: todayISO() }).catch(() => {});
}

async function atDelete(table, recordId) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method: "DELETE", recordId, staffPin: getStaffPin() }),
  });
  return res.json();
}

export { getStaffPin, verifyStaffPin, atGet, atPost, atPatch, atDelete, saveSetting };
