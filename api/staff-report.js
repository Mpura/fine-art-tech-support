// Sends a maintenance request status report to all Fine Art staff.
// Called manually from the H&S Report tab in FATS.
//
// Required env vars: AIRTABLE_PAT, GMAIL_USER, GMAIL_PASS

import nodemailer from "nodemailer";

const BASE_ID     = "appUqkCfnsOo2Jf7z";
const MAINT_TABLE = "tbldZisWbs1WQIr09";

const STAFF = [
  "Maureen De Jager <m.dejager@ru.ac.za>",
  "Ruth Simbao <r.simbao@ru.ac.za>",
  "Stephen Fọlárànmí <s.folaranmi@ru.ac.za>",
  "Thembinkosi Goniwe <t.goniwe@ru.ac.za>",
  "Rat Western <n.western@ru.ac.za>",
  "Christine Dixie <c.dixie@ru.ac.za>",
  "Sikhumbuzo Makandula <s.makandula@ru.ac.za>",
  "Mbali Khoza <m.khoza@ru.ac.za>",
  "Jarrett Erasmus <jarrett.erasmus@ru.ac.za>",
  "Robyn Munnick <r.munnick@ru.ac.za>",
  "Jan Nell <j.nell@ru.ac.za>",
  "Mpumzi Mpati <m.mpati@ru.ac.za>",
  "Heidi Smith <h.smith@ru.ac.za>",
  "Leroy Payne <leroyspayne@gmail.com>",
  "Phila Phaliso <philaphaliso@gmail.com>",
];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const PAT       = process.env.AIRTABLE_PAT;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  if (!PAT || !gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Missing env vars: AIRTABLE_PAT, GMAIL_USER, GMAIL_PASS" });
  }

  // Fetch all requests from Airtable
  const atRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${MAINT_TABLE}?maxRecords=500`, {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  const data = await atRes.json();
  if (!data.records) return res.status(500).json({ error: "Failed to fetch records", detail: data });

  const now     = new Date();
  const records = data.records.map(r => ({ id: r.id, ...r.fields }));
  const open    = records.filter(r => !["Resolved", "Closed"].includes(r.Status));
  const resolved = records.filter(r => r.Status === "Resolved");

  function daysSince(d) {
    if (!d) return null;
    return Math.floor((now - new Date(d + "T00:00:00")) / 86400000);
  }
  function agingColor(days) {
    if (days === null) return "#666";
    if (days < 14)  return "#27ae60";
    if (days < 30)  return "#e67e22";
    return "#c0392b";
  }

  const openRows = open
    .sort((a, b) => (daysSince(b.DateSubmitted) || 0) - (daysSince(a.DateSubmitted) || 0))
    .map(r => {
      const days = daysSince(r.DateSubmitted);
      const col  = agingColor(days);
      return `
        <tr style="border-top:1px solid #eee">
          <td style="padding:8px 10px">${r.UniversityRef || "—"}</td>
          <td style="padding:8px 10px">${r.ProblemType   || "—"}</td>
          <td style="padding:8px 10px">${r.Location      || "—"}</td>
          <td style="padding:8px 10px">${r.Description   || ""}</td>
          <td style="padding:8px 10px;font-weight:bold;color:${col}">${days !== null ? days + " days" : "—"}</td>
          <td style="padding:8px 10px">${r.Status        || "—"}</td>
        </tr>`;
    }).join("");

  const resolvedRows = resolved
    .sort((a, b) => (b.DateResolved || "").localeCompare(a.DateResolved || ""))
    .slice(0, 10) // show last 10 resolved
    .map(r => `
      <tr style="border-top:1px solid #eee;color:#999">
        <td style="padding:6px 10px">${r.UniversityRef || "—"}</td>
        <td style="padding:6px 10px">${r.ProblemType   || "—"}</td>
        <td style="padding:6px 10px">${r.Location      || "—"}</td>
        <td style="padding:6px 10px">${r.Description   || ""}</td>
        <td style="padding:6px 10px;color:#27ae60">Resolved ${r.DateResolved || ""}</td>
      </tr>`).join("");

  const dateStr = now.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from:    `"Fine Art Tech Support" <${gmailUser}>`,
    to:      gmailUser,
    bcc:     STAFF.join(", "),
    subject: `Maintenance Requests Update — Fine Art Department (${dateStr})`,
    html: `
      <div style="font-family:sans-serif;max-width:800px">
        <h2 style="color:#333;margin-bottom:4px">Fine Art Department — Maintenance Requests</h2>
        <p style="color:#666;margin-top:0">${dateStr}</p>

        <p>Dear colleagues,</p>
        <p>
          Please find below the current status of maintenance requests logged for our department.
          If you have submitted a request to Estates that does not appear on this list, please
          forward the email confirmation to <a href="mailto:m.mpati@ru.ac.za">m.mpati@ru.ac.za</a>
          so it can be tracked and followed up accordingly.
        </p>
        <p>
          If you need to log a new request or report a fault, please send the details to
          <a href="mailto:m.mpati@ru.ac.za">m.mpati@ru.ac.za</a>,
          <a href="mailto:j.nell@ru.ac.za">j.nell@ru.ac.za</a> or
          <a href="mailto:h.smith@ru.ac.za">h.smith@ru.ac.za</a> and we will submit it on your behalf.
        </p>

        <h3 style="color:#c0392b;margin-top:32px">Open Requests (${open.length})</h3>
        ${open.length === 0
          ? `<p style="color:#27ae60">No open requests at this time.</p>`
          : `<table style="border-collapse:collapse;width:100%;font-size:13px">
              <thead>
                <tr style="background:#f5f5f5;text-align:left">
                  <th style="padding:8px 10px">Ref</th>
                  <th style="padding:8px 10px">Type</th>
                  <th style="padding:8px 10px">Location</th>
                  <th style="padding:8px 10px">Description</th>
                  <th style="padding:8px 10px">Outstanding</th>
                  <th style="padding:8px 10px">Status</th>
                </tr>
              </thead>
              <tbody>${openRows}</tbody>
            </table>`
        }

        <h3 style="color:#27ae60;margin-top:32px">Recently Resolved (last 10)</h3>
        ${resolved.length === 0
          ? `<p style="color:#666">No resolved requests yet.</p>`
          : `<table style="border-collapse:collapse;width:100%;font-size:13px">
              <thead>
                <tr style="background:#f5f5f5;text-align:left">
                  <th style="padding:8px 10px">Ref</th>
                  <th style="padding:8px 10px">Type</th>
                  <th style="padding:8px 10px">Location</th>
                  <th style="padding:8px 10px">Description</th>
                  <th style="padding:8px 10px">Status</th>
                </tr>
              </thead>
              <tbody>${resolvedRows}</tbody>
            </table>`
        }

        <p style="margin-top:32px;color:#666;font-size:12px;border-top:1px solid #eee;padding-top:16px">
          Fine Art Tech Support · Rhodes University Fine Art Department<br>
          To update or query a request, contact <a href="mailto:m.mpati@ru.ac.za">m.mpati@ru.ac.za</a>
        </p>
      </div>`,
  });

  return res.status(200).json({ ok: true, sent: STAFF.length, open: open.length, resolved: resolved.length });
}
