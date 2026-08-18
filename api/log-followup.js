// Stamps today's date on all currently stale maintenance requests as LastFollowUpDate.
// Called from the portal after manually sending the Estates follow-up email.
// This resets the days counter so those records won't be chased again for 14 days.

import { verifyStaffPin, getClientIp } from "./_auth.js";

const BASE_ID        = "appwRiUCBDUWkLo5j";
const MAINT_TABLE    = "tbldZisWbs1WQIr09";
const CHASE_AFTER_DAYS = 14;
const SKIP_STATUSES  = ["Open", "Resolved", "Closed"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PAT = process.env.AIRTABLE_PAT;
  if (!PAT) return res.status(500).json({ error: "Missing AIRTABLE_PAT" });

  if (!(await verifyStaffPin(req.body?.staffPin, PAT, getClientIp(req)))) {
    return res.status(401).json({ error: "Staff PIN required" });
  }

  const atRes = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${MAINT_TABLE}?maxRecords=500`,
    { headers: { Authorization: `Bearer ${PAT}` } }
  );
  const data = await atRes.json();
  if (!data.records) return res.status(500).json({ error: "Failed to fetch records" });

  const now      = new Date();
  const todayISO = now.toISOString().split("T")[0];

  function daysOld(dateStr) {
    if (!dateStr) return null;
    return Math.floor((now - new Date(dateStr + "T00:00:00")) / 86400000);
  }

  // Same filter as cron-followup — use LastFollowUpDate if present, else DateSubmitted/DateLogged
  const stale = data.records.filter(r => {
    const status = r.fields.Status;
    if (!status || SKIP_STATUSES.includes(status)) return false;
    const checkDate = r.fields.LastFollowUpDate || r.fields.DateSubmitted || r.fields.DateLogged;
    const days = daysOld(checkDate);
    return days !== null && days >= CHASE_AFTER_DAYS;
  });

  if (stale.length === 0) {
    return res.status(200).json({ ok: true, updated: 0, message: "No stale requests to log." });
  }

  // Airtable PATCH accepts max 10 records per request
  let updated = 0;
  for (let i = 0; i < stale.length; i += 10) {
    const batch = stale.slice(i, i + 10);
    const patchRes = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${MAINT_TABLE}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${PAT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: batch.map(r => ({
            id: r.id,
            fields: { LastFollowUpDate: todayISO },
          })),
        }),
      }
    );
    const patchData = await patchRes.json();
    if (patchData.records) updated += patchData.records.length;
  }

  return res.status(200).json({ ok: true, updated, date: todayISO });
}
