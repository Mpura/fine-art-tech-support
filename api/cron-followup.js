// Vercel cron job — runs every 3 days at 07:00.
// Finds maintenance requests that have been submitted to Estates for 7+ days
// without being resolved, and sends a follow-up email.
//
// Required env vars (set in Vercel dashboard):
//   AIRTABLE_PAT  — Airtable personal access token
//   GMAIL_USER    — sender Gmail address
//   GMAIL_PASS    — Gmail app password (16-char)
//   CRON_SECRET   — any random string; set the same value in Vercel → Settings → Cron Job Secret

import nodemailer from "nodemailer";

const BASE_ID   = "appUqkCfnsOo2Jf7z";
const MAINT_TABLE = "tbldZisWbs1WQIr09";
const CHASE_AFTER_DAYS = 7; // start chasing after this many days

export default async function handler(req, res) {
  // Vercel automatically sends Authorization: Bearer <CRON_SECRET> for cron requests.
  // Allow direct GET calls from the staff portal too (no secret needed from same origin).
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}` && req.method !== "POST") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const PAT       = process.env.AIRTABLE_PAT;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  const TO  = "m.mpati@ru.ac.za"; // TEST — revert after preview
  const CCS = [];

  if (!PAT || !gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Missing env vars: AIRTABLE_PAT, GMAIL_USER, GMAIL_PASS" });
  }

  // 1. Fetch all non-resolved, non-closed requests
  const url = `https://api.airtable.com/v0/${BASE_ID}/${MAINT_TABLE}?maxRecords=200`;
  const atRes = await fetch(url, { headers: { Authorization: `Bearer ${PAT}` } });
  const data  = await atRes.json();

  if (!data.records) {
    return res.status(500).json({ error: "Failed to fetch Airtable records", detail: data });
  }

  const now   = new Date();
  const stale = data.records.filter(r => {
    const { Status, DateSubmitted } = r.fields;
    if (["Resolved", "Closed"].includes(Status)) return false;
    if (!DateSubmitted) return false;
    const days = Math.floor((now - new Date(DateSubmitted + "T00:00:00")) / 86400000);
    return days >= CHASE_AFTER_DAYS;
  });

  if (stale.length === 0) {
    return res.status(200).json({ message: "No stale requests — nothing to chase.", sent: 0 });
  }

  // 2. Send one consolidated email listing all stale requests
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const rows = stale.map(r => {
    const f    = r.fields;
    const days = Math.floor((now - new Date((f.DateSubmitted || "") + "T00:00:00")) / 86400000);
    return `
      <tr style="border-top:1px solid #ddd">
        <td style="padding:8px 10px">${f.UniversityRef || "—"}</td>
        <td style="padding:8px 10px">${f.ProblemType   || "—"}</td>
        <td style="padding:8px 10px">${f.Location      || "—"}</td>
        <td style="padding:8px 10px;max-width:300px">${f.Description || ""}</td>
        <td style="padding:8px 10px;color:#c0392b;font-weight:bold">${days} days</td>
        <td style="padding:8px 10px">${f.Status        || "—"}</td>
      </tr>`;
  }).join("");

  await transporter.sendMail({
    from:    `"Fine Art Tech Support — Rhodes University" <${gmailUser}>`,
    to:      TO,
    cc:      CCS.join(", "),
    subject: `Outstanding Maintenance Request Follow-up — Fine Art Department`,
    html: `
      <p style="font-family:sans-serif">Dear Facilities Team,</p>
      <p style="font-family:sans-serif">
        We are following up on the maintenance request${stale.length > 1 ? "s" : ""} listed below,
        which ${stale.length > 1 ? "were" : "was"} submitted to Estates and remain${stale.length === 1 ? "s" : ""} unresolved.
        We would appreciate an update on the progress of ${stale.length > 1 ? "these requests" : "this request"}
        at your earliest convenience.
      </p>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:8px 10px;text-align:left">Ref</th>
            <th style="padding:8px 10px;text-align:left">Type</th>
            <th style="padding:8px 10px;text-align:left">Location</th>
            <th style="padding:8px 10px;text-align:left">Description</th>
            <th style="padding:8px 10px;text-align:left">Outstanding</th>
            <th style="padding:8px 10px;text-align:left">Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-family:sans-serif;margin-top:24px;">
        Please do not hesitate to contact us if you require any further information.
      </p>
      <p style="font-family:sans-serif;">
        Kind regards,<br>
        Fine Art Department — Rhodes University
      </p>`,
  });

  return res.status(200).json({ sent: stale.length, requests: stale.map(r => r.fields.UniversityRef || r.id) });
}
