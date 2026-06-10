// Vercel serverless function — keeps the Airtable token server-side only.
// The frontend calls /api/airtable instead of Airtable directly.
//
// Access model:
//  - PUBLIC_OPS: table+method combos students legitimately need — open.
//  - STAFF_OPS: everything staff-side — requires the staff PIN, which is
//    verified server-side against the Settings table and never sent to clients.
//  - Anything else is rejected.
//  - GETs on the Settings table have the "pin" record stripped from the response.

const BASE_ID = "appUqkCfnsOo2Jf7z";
const AT_URL = `https://api.airtable.com/v0/${BASE_ID}`;

const REQUESTS = "tblAQE1leKVCRH51d";
const EQ = "tblc2MXweiXikz3wo";
const CHECKOUT = "tbl1DvH6ostZs7Jog";
const FINES = "tbliP9x6KL7EUABWc";
const MEMBERS = "tbloPfyyjQY79YxQd";
const MAINT = "tbldZisWbs1WQIr09";
const PM = "tblHyr7MxWVDIzFtC";
const SETTINGS = "tblfEH66wD8KPJMl9";
const PIN_RECORD_ID = "recl1lbt7hHWY8vHr";

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
  [FINES]: ["POST"],
  [MAINT]: ["GET", "POST", "PATCH", "DELETE"],
  [PM]: ["GET", "POST", "PATCH", "DELETE"],
  [SETTINGS]: ["PATCH"],
};

async function fetchStoredPin(headers) {
  const res = await fetch(`${AT_URL}/${SETTINGS}/${PIN_RECORD_ID}`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  try { return String(JSON.parse(data.fields?.Value ?? "null")); } catch (e) { return null; }
}

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

  // Server-side PIN check — the stored PIN never leaves the server
  if (method === "VERIFY_PIN") {
    const stored = await fetchStoredPin(headers);
    return res.status(200).json({ ok: stored != null && String(pin) === stored });
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
    const stored = await fetchStoredPin(headers);
    if (stored == null || String(staffPin) !== stored) {
      return res.status(403).json({ error: "Staff PIN required" });
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

    // Never expose the PIN record through settings reads
    if (table === SETTINGS && method === "GET" && Array.isArray(data.records)) {
      data.records = data.records.filter(r => r.fields?.Name !== "pin");
    }

    return res.status(response.status).json(data);

  } catch (e) {
    return res.status(500).json({ error: "Failed to reach Airtable", detail: e.message });
  }
}
