// Shared server-side staff-PIN verification for API routes.
// (Underscore prefix = not exposed as an endpoint by Vercel.)

const BASE_ID = "appUqkCfnsOo2Jf7z";
const SETTINGS = "tblfEH66wD8KPJMl9";
const PIN_RECORD_ID = "recl1lbt7hHWY8vHr";

export async function verifyStaffPin(staffPin, PAT) {
  if (!staffPin || !PAT) return false;
  const res = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${SETTINGS}/${PIN_RECORD_ID}`,
    { headers: { Authorization: `Bearer ${PAT}` } }
  );
  if (!res.ok) return false;
  const data = await res.json();
  let stored;
  try { stored = String(JSON.parse(data.fields?.Value ?? "null")); } catch (e) { return false; }
  return stored !== "null" && String(staffPin) === stored;
}
