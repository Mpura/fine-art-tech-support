// Vercel serverless function — keeps the Airtable token server-side only.
// The frontend calls /api/airtable instead of Airtable directly.
//
// Access model:
//  - PUBLIC_OPS: table+method combos students legitimately need — open.
//  - STAFF_OPS: everything staff-side — requires the staff PIN, which is
//    verified server-side against the Settings table and never sent to clients.
//  - Anything else is rejected.
//  - GETs on the Settings table have the "pin"/"ratelimit" records stripped.
//  - Failed PIN checks are rate-limited per IP (see _auth.js) to stop brute force.

import { getClientIp, getPinContext, notePinResult } from "./_auth.js";

const BASE_ID = "appwRiUCBDUWkLo5j";
const AT_URL = `https://api.airtable.com/v0/${BASE_ID}`;

const REQUESTS = "tblAQE1leKVCRH51d";
const EQ = "tblc2MXweiXikz3wo";
const CHECKOUT = "tbl1DvH6ostZs7Jog";
const FINES = "tbliP9x6KL7EUABWc";
const MEMBERS = "tbloPfyyjQY79YxQd";
const MAINT = "tbldZisWbs1WQIr09";
const PM = "tblHyr7MxWVDIzFtC";
const SETTINGS = "tblfEH66wD8KPJMl9";
const CAPITAL_REQUESTS = "tblmOy3HOF3QQWd9t";
const SUPPLIERS = "tblhJKtWH4fR04RhQ";

// What an unauthenticated visitor (a student) may do
const PUBLIC_OPS = {
  [MEMBERS]: ["GET"],            // student number lookup
  [REQUESTS]: ["GET", "POST"],   // check status, submit requests
  [EQ]: ["GET"],                 // browse equipment
  [CHECKOUT]: ["POST"],          // equipment booking creates a checkout record
  [FINES]: ["GET"],              // view own charges
  [SETTINGS]: ["GET"],           // leave mode, blocks, schedules (pin stripped)
};

// What requires the staff PIN
const STAFF_OPS = {
  [REQUESTS]: ["PATCH"],
  [EQ]: ["PATCH"],
  [FINES]: ["POST", "PATCH"],
  [MAINT]: ["GET", "POST", "PATCH", "DELETE"],
  [PM]: ["GET", "POST", "PATCH", "DELETE"],
  [SETTINGS]: ["PATCH"],
  [CAPITAL_REQUESTS]: ["GET", "PATCH"],
  [SUPPLIERS]: ["GET"],
};


export default async function handler(req, res) {
  // Only allow POST from the app itself
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const PAT = process.env.AIRTABLE_PAT;
  if (!PAT) {
    return res.status(500).json({ error: "API token not configured on server" });
  }

  const headers = {
    Authorization: `Bearer ${PAT}`,
    "Content-Type": "application/json",
  };

  const { table, method, params, recordId, fields, staffPin, pin } = req.body || {};
  const ip = getClientIp(req);

  // Server-side PIN check — the stored PIN never leaves the server. Failed
  // attempts are counted per IP and locked out after too many (brute-force guard).
  if (method === "VERIFY_PIN") {
    const ctx = await getPinContext(PAT, ip);
    if (ctx.locked) return res.status(429).json({ ok: false, locked: true, retryAfter: ctx.retryAfter });
    const ok = ctx.stored != null && ctx.stored !== "null" && String(pin) === ctx.stored;
    const note = await notePinResult(PAT, ctx, ip, ok);
    return res.status(ok ? 200 : (note.justLocked ? 429 : 200)).json({ ok, ...(note.justLocked ? { locked: true, retryAfter: note.retryAfter } : {}) });
  }

  if (!table || !method) {
    return res.status(400).json({ error: "Missing table or method" });
  }

  // Authorisation: public op, or staff op with a valid PIN — otherwise reject
  const isPublic = PUBLIC_OPS[table]?.includes(method);
  if (!isPublic) {
    const isStaffOp = STAFF_OPS[table]?.includes(method);
    if (!isStaffOp) {
      return res.status(403).json({ error: "Operation not allowed" });
    }
    const ctx = await getPinContext(PAT, ip);
    if (ctx.locked) return res.status(429).json({ error: "Too many attempts. Try again later.", retryAfter: ctx.retryAfter });
    const ok = ctx.stored != null && ctx.stored !== "null" && String(staffPin) === ctx.stored;
    await notePinResult(PAT, ctx, ip, ok);
    if (!ok) return res.status(403).json({ error: "Staff PIN required" });
  }

  // Personal-data scoping: reads of Requests / Fines / Members return other
  // people's records. A caller without a valid staff PIN may only fetch rows
  // scoped to a student identity they supply (publicScope.value) — the server
  // builds the filter itself so a client can't ask for the whole table, and
  // staff-only fields are stripped from the response.
  const SCOPED_TABLES = [REQUESTS, FINES, MEMBERS];
  let scopedFormula = null;   // overrides any client filterByFormula
  let stripStaffFields = false;
  let forceMemberFields = false;
  if (method === "GET" && SCOPED_TABLES.includes(table)) {
    const val = String(req.body?.publicScope?.value ?? "").trim();
    if (val) {
      const safe = val.replace(/["\\]/g, "");
      const low = safe.toLowerCase();
      if (table === REQUESTS) {
        scopedFormula = `OR(LOWER({StudNo})="${low}",FIND("${low}",LOWER({StudentName}))>0)`;
        stripStaffFields = true;
      } else if (table === FINES) {
        scopedFormula = `{Student No}="${safe}"`;
      } else if (table === MEMBERS) {
        scopedFormula = `OR(LOWER(LEFT({Name},${low.length + 1}))="${low} ",FIND("${low}",LOWER({Name}))>0)`;
        forceMemberFields = true;
      }
    } else {
      // No scope supplied → only a valid staff PIN unlocks the full table
      // (these tables are always public ops, so no PIN was checked above)
      const ctx = await getPinContext(PAT, ip);
      if (ctx.locked) return res.status(429).json({ error: "Too many attempts. Try again later.", retryAfter: ctx.retryAfter });
      const ok = ctx.stored != null && ctx.stored !== "null" && String(staffPin) === ctx.stored;
      await notePinResult(PAT, ctx, ip, ok);
      if (!ok) return res.status(403).json({ error: "A student number or staff PIN is required to view this data" });
    }
  }

  let url;
  let options = { headers };

  try {
    if (method === "GET") {
      const u = new URL(`${AT_URL}/${table}`);
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            v.forEach((val, i) => {
              if (val !== null && typeof val === "object") {
                // nested object array e.g. sort[0][field]=X&sort[0][direction]=Y
                Object.entries(val).forEach(([sk, sv]) =>
                  u.searchParams.append(`${k}[${i}][${sk}]`, sv)
                );
              } else {
                u.searchParams.append(k, val);
              }
            });
          } else {
            u.searchParams.set(k, v);
          }
        });
      }
      // Server-enforced scoping for public reads of personal data
      if (scopedFormula) {
        u.searchParams.set("filterByFormula", scopedFormula);
        if (forceMemberFields) {
          u.searchParams.set("maxRecords", "1");
          u.searchParams.delete("fields[]");
          ["Name", "Yr", "Email"].forEach(f => u.searchParams.append("fields[]", f));
        }
      }
      url = u.toString();
      options.method = "GET";

    } else if (method === "POST") {
      url = `${AT_URL}/${table}`;
      options.method = "POST";
      options.body = JSON.stringify({ fields });

    } else if (method === "PATCH") {
      if (!recordId) return res.status(400).json({ error: "Missing recordId for PATCH" });
      url = `${AT_URL}/${table}/${recordId}`;
      options.method = "PATCH";
      options.body = JSON.stringify({ fields });

    } else if (method === "DELETE") {
      if (!recordId) return res.status(400).json({ error: "Missing recordId for DELETE" });
      url = `${AT_URL}/${table}/${recordId}`;
      options.method = "DELETE";

    } else {
      return res.status(400).json({ error: "Invalid method — use GET, POST, PATCH, or DELETE" });
    }

    const response = await fetch(url, options);
    const data = await response.json();

    // Never expose the PIN or rate-limit records through settings reads
    if (table === SETTINGS && method === "GET" && Array.isArray(data.records)) {
      data.records = data.records.filter(r => r.fields?.Name !== "pin" && r.fields?.Name !== "ratelimit");
    }

    // Strip staff-only fields from student-facing request reads
    if (stripStaffFields && Array.isArray(data.records)) {
      for (const rec of data.records) {
        if (rec.fields) { delete rec.fields.StaffNote; delete rec.fields.CheckInNotes; }
      }
    }

    return res.status(response.status).json(data);

  } catch (e) {
    return res.status(500).json({ error: "Failed to reach Airtable", detail: e.message });
  }
}
