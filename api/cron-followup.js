// Fortnightly Estates follow-up email.
// Finds requests that have been logged for 14+ days and are not yet
// Resolved, Closed, or Open (Open = not yet submitted to Estates).
//
// Vercel cron schedule (vercel.json): 0 7 8,22 * *  — 8th & 22nd at 07:00
//
// Required env vars: AIRTABLE_PAT, GMAIL_USER, GMAIL_PASS, CRON_SECRET

import nodemailer from "nodemailer";

const BASE_ID          = "appUqkCfnsOo2Jf7z";
const MAINT_TABLE      = "tbldZisWbs1WQIr09";
const CHASE_AFTER_DAYS = 14;
const SKIP_STATUSES    = ["Open", "Resolved", "Closed"];

const TO  = "estates@ru.ac.za";
const CCS = ["m.mpati@ru.ac.za", "h.smith@ru.ac.za", "j.nell@ru.ac.za", "lois.anguria@ru.ac.za"];

export default async function handler(req, res) {
  // Vercel cron sends GET with Authorization header; allow POST from app too
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}` && req.method !== "POST") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const PAT       = process.env.AIRTABLE_PAT;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  if (!PAT || !gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Missing env vars: AIRTABLE_PAT, GMAIL_USER, GMAIL_PASS" });
  }

  // Fetch all records
  const atRes = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${MAINT_TABLE}?maxRecords=500`,
    { headers: { Authorization: `Bearer ${PAT}` } }
  );
  const data = await atRes.json();
  if (!data.records) return res.status(500).json({ error: "Failed to fetch records", detail: data });

  const now = new Date();

  function daysOld(dateStr) {
    if (!dateStr) return null;
    return Math.floor((now - new Date(dateStr + "T00:00:00")) / 86400000);
  }

  function cleanDesc(desc) {
    if (!desc) return "";
    return desc.replace(/,?\s*Status been changed to:.*$/si, "").replace(/\n+/g, " ").trim().slice(0, 120);
  }

  function cleanLoc(loc) {
    if (!loc) return "—";
    if (/GRAPHICS/i.test(loc))      return loc.match(/Room\s+(\S+)/i) ? `Graphics (${loc.match(/Room\s+(\S+)/i)[1]})` : "Graphics";
    if (/PHOTOGRAPHY/i.test(loc))   return loc.match(/Room\s+(\S+)/i) ? `Photography (${loc.match(/Room\s+(\S+)/i)[1]})` : "Photography";
    if (/FINE ART DEPT/i.test(loc)) return loc.match(/Room\s+(\S+)/i) ? `Fine Art (${loc.match(/Room\s+(\S+)/i)[1]})` : "Fine Art";
    if (/SCULPTURE/i.test(loc))     return "Sculpture";
    if (/PAINTING/i.test(loc))      return "Painting";
    return loc;
  }

  // Filter: not in skip list, logged 14+ days ago
  const stale = data.records
    .filter(r => {
      const status = r.fields.Status;
      if (!status || SKIP_STATUSES.includes(status)) return false;
      const days = daysOld(r.fields.DateLogged);
      return days !== null && days >= CHASE_AFTER_DAYS;
    })
    .sort((a, b) => (daysOld(b.fields.DateLogged) || 0) - (daysOld(a.fields.DateLogged) || 0));

  if (stale.length === 0) {
    return res.status(200).json({ message: "No stale requests — nothing to chase.", sent: 0 });
  }

  const isPreview = req.query?.preview === "true";
  const dateStr = now.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  const tableRows = stale.map(r => {
    const f    = r.fields;
    const days = daysOld(f.DateLogged);
    const daysColor = days >= 60 ? "#b91c1c" : days >= 30 ? "#d97706" : "#555";
    return `
      <tr>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;font-weight:600;white-space:nowrap">${f.UniversityRef || "—"}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;white-space:nowrap">${f.ProblemType || "—"}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;white-space:nowrap">${cleanLoc(f.Location)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8">${cleanDesc(f.Description)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;font-weight:700;color:${daysColor};white-space:nowrap">${days}d</td>
      </tr>`;
  }).join("");

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:780px;margin:32px auto;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1a1a1a;padding:28px 32px">
    <div style="font-size:11px;color:#888;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Rhodes University · Fine Art Department</div>
    <div style="font-size:22px;font-weight:700;color:#ffffff">Maintenance Request Follow-up</div>
    <div style="font-size:13px;color:#aaaaaa;margin-top:4px">${dateStr}</div>
  </div>
  <div style="padding:32px">
    <p style="margin:0 0 16px;color:#333;font-size:14px;line-height:1.7">Dear Facilities Team,</p>
    <p style="margin:0 0 24px;color:#333;font-size:14px;line-height:1.7">
      We are following up on the ${stale.length > 1 ? `${stale.length} maintenance requests` : "maintenance request"} below,
      which ${stale.length > 1 ? "have" : "has"} been outstanding for 14 or more days.
      We would appreciate an update on the progress at your earliest convenience.
    </p>
    <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:10px">
      Outstanding Requests <span style="font-size:13px;font-weight:400;color:#888">(${stale.length} item${stale.length !== 1 ? "s" : ""})</span>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333;margin-bottom:24px">
      <thead>
        <tr style="background:#f0f0f0">
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Ref</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Type</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Area</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Description</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Days</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>
    <p style="margin:0 0 24px;color:#555;font-size:13px;line-height:1.7">
      Please do not hesitate to contact us if you require any further information regarding any of these requests.
    </p>
    <p style="margin:0 0 6px;color:#333;font-size:14px">Regards,</p>
    <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:700">Mpumzi</p>
    <p style="margin:2px 0 0;color:#888;font-size:12px">Fine Art Department — Rhodes University</p>
  </div>
</div>
</body>
</html>`;

  if (isPreview) {
    return res.status(200).json({ ok: true, html: emailHtml, stale: stale.length });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from:    `"Mpumzi Mpati | Fine Art Dept" <${gmailUser}>`,
    replyTo: "Mpumzi Mpati <m.mpati@ru.ac.za>",
    to:      TO,
    cc:      CCS.join(", "),
    subject: `Outstanding Maintenance Requests — Fine Art Department (${dateStr})`,
    html:    emailHtml,
  });

  return res.status(200).json({ sent: stale.length, requests: stale.map(r => r.fields.UniversityRef || r.id) });
}
