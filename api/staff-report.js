// Fortnightly maintenance status report — sent to all Fine Art staff.
// Also handles the day-before warning email when called with ?warn=true.
//
// Vercel cron schedule (vercel.json):
//   Report:  0 7 1,15 * *   — 1st and 15th of each month at 07:00
//   Warning: 0 7 14,28 * *  — day before, at 07:00
//
// Required env vars: AIRTABLE_PAT, GMAIL_USER, GMAIL_PASS, CRON_SECRET

import nodemailer from "nodemailer";

const BASE_ID     = "appUqkCfnsOo2Jf7z";
const MAINT_TABLE = "tbldZisWbs1WQIr09";
const RESOLVED_WINDOW_DAYS = 30; // only show resolved items from last 30 days
const NEW_BADGE_DAYS       = 14; // flag requests added in last 14 days as NEW

const STAFF = [
  "c.dixie@ru.ac.za",
  "j.nell@ru.ac.za",
  "jarretterasmus@gmail.com",
  "lois.anguria@ru.ac.za",
  "m.khoza@ru.ac.za",
  "m.mpati@ru.ac.za",
  "n.western@ru.ac.za",
  "r.munnick@ru.ac.za",
  "s.makandula@ru.ac.za",
  "s.folaranmi@ru.ac.za",
  "t.goniwe@ru.ac.za",
  "philaphaliso@gmail.com",
  "leroyspayne@gmail.com",
];

const MPUMZI = "m.mpati@ru.ac.za";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Cron GET requests must carry the secret; POST from the app is always allowed
  const secret = process.env.CRON_SECRET;
  if (req.method === "GET" && secret && req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const PAT       = process.env.AIRTABLE_PAT;
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_PASS;

  if (!PAT || !gmailUser || !gmailPass) {
    return res.status(500).json({ error: "Missing env vars" });
  }

  const isWarn    = req.query?.warn === "true";
  const isPreview = req.query?.preview === "true";

  // Don't send the recurring report before the first scheduled date
  const EARLIEST_SEND = new Date("2026-06-01T00:00:00");
  if (!isPreview && req.method === "GET" && new Date() < EARLIEST_SEND) {
    return res.status(200).json({ skipped: true, reason: "Before first scheduled send date (2026-06-01)" });
  }

  // ── WARNING EMAIL ──────────────────────────────────────────────────────────
  if (isWarn) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from:    `"Mpumzi Mpati | Fine Art Dept" <${gmailUser}>`,
      to:      MPUMZI,
      subject: `⏰ Reminder — Staff Maintenance Report goes out tomorrow`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:32px auto;background:#fff;border-radius:6px;border:1px solid #e0e0e0;overflow:hidden">
          <div style="background:#1a1a1a;padding:20px 24px">
            <div style="font-size:11px;color:#888;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px">Fine Art Department</div>
            <div style="font-size:18px;font-weight:700;color:#fff">Staff Report — Tomorrow</div>
          </div>
          <div style="padding:24px">
            <p style="margin:0 0 14px;color:#333;font-size:14px;line-height:1.7">
              Hi Mpumzi, just a heads-up — the <strong>fortnightly maintenance status report</strong> is scheduled
              to go out to all staff tomorrow morning.
            </p>
            <p style="margin:0 0 14px;color:#333;font-size:14px;line-height:1.7">
              If you have any requests to add or statuses to update before it sends, now is a good time.
              You can also trigger it early from the <strong>Report tab</strong> in the FATS staff portal.
            </p>
            <p style="margin:0;color:#888;font-size:12px">This is an automated reminder — no action needed if everything is up to date.</p>
          </div>
        </div>`,
    });

    return res.status(200).json({ ok: true, type: "warning", sent_to: MPUMZI });
  }

  // ── FULL STAFF REPORT ──────────────────────────────────────────────────────
  const atRes = await fetch(
    `https://api.airtable.com/v0/${BASE_ID}/${MAINT_TABLE}?maxRecords=500`,
    { headers: { Authorization: `Bearer ${PAT}` } }
  );
  const data = await atRes.json();
  if (!data.records) return res.status(500).json({ error: "Failed to fetch records", detail: data });

  const now     = new Date();

  function daysOld(dateStr) {
    if (!dateStr) return null;
    return Math.floor((now - new Date(dateStr + "T00:00:00")) / 86400000);
  }

  function fmtDate(dateStr) {
    if (!dateStr) return "—";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
  }

  function cleanDesc(desc) {
    if (!desc) return "";
    // Strip the status change suffix Airtable appends, then truncate
    const clean = desc.replace(/,?\s*Status been changed to:.*$/si, "").replace(/\n+/g, " ").trim();
    return clean.length > 100 ? clean.slice(0, 97) + "…" : clean;
  }

  function cleanLoc(loc) {
    if (!loc) return "—";
    // "B1-FINE ARTS GRAPHICS DEPT, Floor G, Room G002" → "Graphics (G002)"
    if (/GRAPHICS/i.test(loc))     return loc.match(/Room\s+(\S+)/i) ? `Graphics (${loc.match(/Room\s+(\S+)/i)[1]})` : "Graphics";
    if (/PHOTOGRAPHY/i.test(loc))  return loc.match(/Room\s+(\S+)/i) ? `Photography (${loc.match(/Room\s+(\S+)/i)[1]})` : "Photography";
    if (/FINE ART DEPT/i.test(loc))return loc.match(/Room\s+(\S+)/i) ? `Fine Art (${loc.match(/Room\s+(\S+)/i)[1]})` : "Fine Art";
    if (/SCULPTURE/i.test(loc))    return "Sculpture";
    if (/PAINTING/i.test(loc))     return "Painting";
    return loc;
  }

  const records = data.records.map(r => ({ ...r.fields }));

  const open = records
    .filter(r => !["Resolved", "Closed"].includes(r.Status))
    .sort((a, b) => (daysOld(b.DateLogged) || 0) - (daysOld(a.DateLogged) || 0));

  const recentResolved = records
    .filter(r => r.Status === "Resolved" && daysOld(r.DateLogged) <= RESOLVED_WINDOW_DAYS)
    .sort((a, b) => (daysOld(a.DateLogged) || 0) - (daysOld(b.DateLogged) || 0));

  const newCount = open.filter(r => daysOld(r.DateLogged) <= NEW_BADGE_DAYS).length;

  function openRows() {
    if (!open.length) return `<tr><td colspan="5" style="padding:12px 10px;color:#888;text-align:center">No open requests at this time.</td></tr>`;
    return open.map(r => {
      const days = daysOld(r.DateLogged);
      const daysColor = days >= 60 ? "#b91c1c" : days >= 30 ? "#d97706" : "#16a34a";
      const isNew = days !== null && days <= NEW_BADGE_DAYS;
      const newBadge = isNew
        ? `<span style="background:#1d4ed8;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;margin-left:6px;vertical-align:middle">NEW</span>`
        : "";
      return `
        <tr>
          <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;font-weight:600;white-space:nowrap">${r.UniversityRef || "—"}${newBadge}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;white-space:nowrap">${r.ProblemType || "—"}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;white-space:nowrap">${cleanLoc(r.Location)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8">${cleanDesc(r.Description)}</td>
          <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;white-space:nowrap;font-weight:700;color:${daysColor}">${days !== null ? days + "d" : "—"}</td>
        </tr>`;
    }).join("");
  }

  function resolvedRows() {
    if (!recentResolved.length) return `<tr><td colspan="4" style="padding:12px 10px;color:#888;text-align:center">No resolved requests in the last 30 days.</td></tr>`;
    return recentResolved.map(r => `
      <tr>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;font-weight:600;white-space:nowrap;color:#888">${r.UniversityRef || "—"}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;white-space:nowrap;color:#888">${r.ProblemType || "—"}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;white-space:nowrap;color:#888">${cleanLoc(r.Location)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #e8e8e8;color:#888">${cleanDesc(r.Description)}</td>
      </tr>`).join("");
  }

  const dateStr = now.toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif">
<div style="max-width:780px;margin:32px auto;background:#ffffff;border-radius:6px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1a1a1a;padding:28px 32px">
    <div style="font-size:11px;color:#888;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">Rhodes University · Fine Art Department</div>
    <div style="font-size:22px;font-weight:700;color:#ffffff">Maintenance Update</div>
    <div style="font-size:13px;color:#aaaaaa;margin-top:4px">${dateStr}</div>
  </div>
  <div style="padding:32px">
    <p style="margin:0 0 24px;color:#333;font-size:14px;line-height:1.7">
      Hi everyone, here is the latest maintenance update for the department.
      ${newCount > 0
        ? `<strong>${newCount} new request${newCount > 1 ? "s have" : " has"} been added</strong> since the last update.`
        : "No new requests have been added since the last update."}
    </p>
    <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:6px">
      Open Requests <span style="font-size:13px;font-weight:400;color:#888">(${open.length} outstanding)</span>
    </div>
    <p style="margin:0 0 10px;color:#555;font-size:12px;line-height:1.5">
      Days column: <span style="color:#b91c1c;font-weight:700">red</span> = 60+ days &nbsp;|&nbsp;
      <span style="color:#d97706;font-weight:700">orange</span> = 30–59 days &nbsp;|&nbsp;
      <span style="color:#16a34a;font-weight:700">green</span> = under 30 days &nbsp;|&nbsp;
      <span style="background:#1d4ed8;color:#fff;font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px">NEW</span> = added in last 14 days
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333;margin-bottom:8px">
      <thead>
        <tr style="background:#f0f0f0">
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Ref</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Type</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Area</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Description</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Days</th>
        </tr>
      </thead>
      <tbody>${openRows()}</tbody>
    </table>
    <p style="margin:0 0 28px;color:#555;font-size:12px;line-height:1.6">
      💬 If you have a request that is not on this list, please reply to this email or forward me the Estates confirmation and I will add it.
    </p>
    <div style="font-size:15px;font-weight:700;color:#1a1a1a;margin-bottom:6px">
      Recently Resolved <span style="font-size:13px;font-weight:400;color:#888">(last 30 days — ${recentResolved.length} item${recentResolved.length !== 1 ? "s" : ""})</span>
    </div>
    <p style="margin:0 0 10px;color:#555;font-size:12px;line-height:1.5">
      If anything below was resolved in your area but the problem is still there, please let me know.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#333;margin-bottom:28px">
      <thead>
        <tr style="background:#f0f0f0">
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Ref</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Type</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Area</th>
          <th style="padding:8px 10px;text-align:left;border-bottom:2px solid #ddd">Description</th>
        </tr>
      </thead>
      <tbody>${resolvedRows()}</tbody>
    </table>
    <div style="border-top:1px solid #e8e8e8;padding-top:20px;color:#555;font-size:13px;line-height:1.7">
      Reply to this email if anything has changed, is missing, or needs updating.
    </div>
    <p style="margin:20px 0 6px;color:#333;font-size:14px">Regards,</p>
    <p style="margin:0;color:#1a1a1a;font-size:14px;font-weight:700">Mpumzi</p>
    <p style="margin:2px 0 0;color:#888;font-size:12px">Fine Art Department — Rhodes University</p>
  </div>
</div>
</body>
</html>`;

  // Preview mode — return HTML without sending
  if (isPreview) {
    return res.status(200).json({ ok: true, html: emailHtml, open: open.length, resolved: recentResolved.length });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from:     `"Mpumzi Mpati | Fine Art Dept" <${gmailUser}>`,
    replyTo:  "Mpumzi Mpati <m.mpati@ru.ac.za>",
    to:       STAFF.join(", "),
    subject:  `Fine Art Department — Maintenance Update | ${dateStr}`,
    html:     emailHtml,
  });

  return res.status(200).json({ ok: true, sent: STAFF.length, open: open.length, resolved: recentResolved.length });
}
