// Anonymised equipment availability windows.
//
// Students can't see other students' requests (personal data is scoped
// server-side), but they DO need to know which items are already spoken for
// so two people can't book the same camera for the same days. This endpoint
// returns only { itemId, start, end } — no names, no student numbers, no
// request contents — which is safe to serve publicly.

const BASE_ID = "appUqkCfnsOo2Jf7z";
const REQUESTS = "tblAQE1leKVCRH51d";

// Statuses where the student still holds (or is still due to collect) the gear.
// Returned / Declined / Cancelled / Uncollected / Done all release it.
const HOLDING = ["Pending", "Confirmed", "Ready to collect", "Collected", "Partially Returned"];

export default async function handler(req, res) {
  const PAT = process.env.AIRTABLE_PAT;
  if (!PAT) return res.status(500).json({ error: "Server not configured" });

  try {
    // Follow pagination — Airtable caps at 100 records per page
    let records = [];
    let offset = null;
    let guard = 0;
    do {
      const url = new URL(`https://api.airtable.com/v0/${BASE_ID}/${REQUESTS}`);
      url.searchParams.set("pageSize", "100");
      ["TypeId", "Status", "SchedDate", "DueDate", "Details", "ReturnedItems", "LostItems"]
        .forEach(f => url.searchParams.append("fields[]", f));
      if (offset) url.searchParams.set("offset", offset);
      const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${PAT}` } });
      if (!r.ok) return res.status(502).json({ error: "Could not read bookings" });
      const data = await r.json();
      records = records.concat(data.records || []);
      offset = data.offset || null;
    } while (offset && guard++ < 50);

    const windows = [];
    // Collection-slot usage: { "YYYY-MM-DD|12:00–12:30": count }. Students
    // can't see other students' bookings, so slot capacity can only be
    // enforced with a server-side count like this.
    const slots = {};
    for (const rec of records) {
      const f = rec.fields || {};
      if (f.TypeId !== "equipment") continue;

      const sched = f.SchedDate ? String(f.SchedDate) : "";
      const start = sched ? sched.split(" ")[0] : null;
      if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) continue;

      // Slot usage counts anything not released — mirrors the old client rule
      // (Declined/Uncollected free the slot up again)
      if (!["Declined", "Uncollected", "Cancelled"].includes(f.Status)) {
        const m = sched.match(/\(([^)]+)\)/);
        const slotLabel = m ? m[1] : null;
        if (slotLabel) {
          const key = `${start}|${slotLabel}`;
          slots[key] = (slots[key] || 0) + 1;
        }
      }

      if (!HOLDING.includes(f.Status)) continue;
      const end = f.DueDate || start;

      let details = {}, returned = [], lost = [];
      try { details = JSON.parse(f.Details || "{}"); } catch (e) {}
      try { returned = JSON.parse(f.ReturnedItems || "[]"); } catch (e) {}
      try { lost = JSON.parse(f.LostItems || "[]"); } catch (e) {}

      for (const item of details.itemsData || []) {
        if (!item?.id) continue;
        // Already handed back (or written off) — no longer holding this item
        if (returned.includes(item.name) || lost.includes(item.name)) continue;
        windows.push({ itemId: item.id, start, end });
      }
    }

    // Short cache — availability changes rarely within a browsing session
    res.setHeader("Cache-Control", "public, max-age=30");
    return res.status(200).json({ windows, slots });
  } catch (e) {
    return res.status(500).json({ error: "Failed to build availability", detail: e.message });
  }
}
