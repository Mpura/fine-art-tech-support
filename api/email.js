// Vercel serverless function — sends request emails via Gmail/Google Workspace SMTP.
//
// SECURITY MODEL: the client may only send { recordId, event }. The server
// fetches the request record from Airtable itself — the recipient address and
// all content come from the database, never from the caller. This prevents the
// endpoint being used as an open relay (arbitrary to/subject/html).
//
// Required env vars: AIRTABLE_PAT, GMAIL_USER, GMAIL_PASS

import nodemailer from "nodemailer";

const BASE_ID = "appwRiUCBDUWkLo5j";
const REQUESTS = "tblAQE1leKVCRH51d";
const FATS_URL = "https://fine-art-tech-support.vercel.app";

const ALLOWED_EVENTS = [
  "confirmation", "Confirmed", "Ready to collect", "Material test required",
  "Ready to cut", "Declined", "Cancelled", "Returned", "Done",
];

const TYPE_META = {
  print:     { label: "Large format & photographic printing", icon: "🖨️" },
  laser:     { label: "Laser cutter & engraving",             icon: "🔦" },
  "3d":      { label: "3D printing",                          icon: "🧱" },
  studio:    { label: "Lighting studio",                      icon: "💡" },
  equipment: { label: "Equipment booking",                    icon: "📷" },
  software:  { label: "Software install",                     icon: "💿" },
  gallery:   { label: "Gallery / space booking",              icon: "🖼️" },
  avsetup:   { label: "Tech setup / AV support",              icon: "📽️" },
  query:     { label: "General query / other",                icon: "💬" },
};

// Escape everything interpolated into HTML — names/notes are user input
function esc(v) {
  return String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function wrapper(icon, heading, bodyHtml) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f1117;color:#e0e3ea;padding:32px 24px;border-radius:12px">
    <div style="font-size:28px;margin-bottom:8px">${icon}</div>
    <h2 style="margin:0 0 4px;font-size:20px;color:#e0e3ea">${heading}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af">Fine Art Tech Support</p>
    ${bodyHtml}
    <p style="font-size:13px;color:#6b7280;margin:16px 0 0">Track your request anytime at the <a href="${FATS_URL}" style="color:#6366f1;text-decoration:none">FATS portal</a> — you'll also receive emails for major updates.</p>
  </div>`;
}

function itemsHtml(items) {
  if (!items.length) return "";
  return `<div style="margin-top:10px"><strong>Equipment:</strong><ul style="margin:6px 0 0;padding-left:18px;color:#c9cdd6">${items.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>`;
}

function buildEmail(req, event) {
  const meta = TYPE_META[req.typeId] || { label: req.typeId || "request", icon: "📋" };
  const typeName = meta.label;
  const icon = meta.icon;
  const name = esc(req.name);
  const items = (req.details?.itemsData || []).map(i => i.name);
  const noteHtml = req.staffNote ? `<p style="margin:10px 0 0;color:#9ca3af;font-style:italic">"${esc(req.staffNote)}"</p>` : "";
  const box = (inner) => `<div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">${inner}</div>`;

  if (event === "confirmation") {
    // A walk-in is logged as already Collected — the student has the gear in
    // hand, so this email is a checkout receipt, not a "we'll review it" note.
    const isCollected = req.status === "Collected";
    const isConfirmed = req.status === "Confirmed";
    const opening = isCollected
      ? `you've collected the equipment below. Please have it back by the due date.`
      : `your <strong>${esc(typeName)}</strong> request has been ${isConfirmed ? "logged and confirmed" : "received and is being reviewed"}.`;
    return {
      subject: isCollected ? `📷 Equipment collected — FATS` : `${icon} Your ${typeName} request — FATS`,
      html: wrapper(icon, isCollected ? "Equipment collected" : "Request received", `
        <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, ${opening}</p>
        ${box(`
          <p style="margin:0 0 8px"><strong>Status:</strong> ${esc(req.status || "Pending")}</p>
          ${req.schedDate ? `<p style="margin:0 0 8px"><strong>${isCollected ? "Collected" : "Scheduled"}:</strong> ${esc(req.schedDate)}</p>` : ""}
          ${req.dueDate ? `<p style="margin:0 0 8px"><strong>Due back:</strong> ${esc(req.dueDate)}</p>` : ""}
          ${itemsHtml(items)}
          ${req.notes ? `<p style="margin:8px 0 0;color:#9ca3af;font-style:italic">"${esc(req.notes)}"</p>` : ""}`)}`),
    };
  }

  if (event === "Confirmed") {
    return {
      subject: `✅ ${typeName} confirmed — FATS`,
      html: wrapper(icon, "Request confirmed", `
        <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, your <strong>${esc(typeName)}</strong> request has been confirmed.</p>
        ${box(`
          <p style="margin:0 0 8px"><strong>Status:</strong> Confirmed ✅</p>
          ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Collect:</strong> ${esc(req.schedDate)}</p>` : ""}
          ${req.dueDate ? `<p style="margin:0 0 8px"><strong>Return by:</strong> ${esc(req.dueDate)} before 10:00</p>` : ""}
          ${itemsHtml(items)}`)}`),
    };
  }

  if (event === "Ready to collect") {
    return {
      subject: `🎒 Equipment ready to collect — FATS`,
      html: wrapper(icon, "Ready to collect!", `
        <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, your equipment is ready to collect. Please come fetch it during your booked slot (12:00–13:00).</p>
        ${box(`
          ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Collect:</strong> ${esc(req.schedDate)}</p>` : ""}
          ${req.dueDate ? `<p style="margin:0 0 8px"><strong>Return by:</strong> ${esc(req.dueDate)} before 10:00</p>` : ""}
          ${itemsHtml(items)}`)}`),
    };
  }

  if (event === "Material test required") {
    return {
      subject: `🧪 Material test needed for your laser job — FATS`,
      html: wrapper(icon, "Material test required", `
        <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, before your laser job can be cut, Tech Support needs to run a short test on your material to confirm the right settings.</p>
        ${box(`
          <p style="margin:0 0 8px"><strong>What to do:</strong> come in during your booked slot and bring your material. The test takes about 5–10 minutes.</p>
          ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Your slot:</strong> ${esc(req.schedDate)}</p>` : ""}
          ${noteHtml}`)}`),
    };
  }

  if (event === "Ready to cut") {
    return {
      subject: `✅ Your laser job is ready to cut — FATS`,
      html: wrapper(icon, "Ready to cut!", `
        <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, your material test passed — your laser job is ready to cut. Come in at your booked time.</p>
        ${box(`
          ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Your slot:</strong> ${esc(req.schedDate)}</p>` : ""}
          <p style="margin:0 0 8px">Remember: you must be present for the full duration of your session.</p>
          ${noteHtml}`)}`),
    };
  }

  if (event === "Declined") {
    return {
      subject: `❌ ${typeName} request declined — FATS`,
      html: wrapper(icon, "Request declined", `
        <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, unfortunately your <strong>${esc(typeName)}</strong> request has been declined.</p>
        ${box(`<p style="margin:0 0 8px"><strong>Status:</strong> Declined ❌</p>${noteHtml}`)}`),
    };
  }

  if (event === "Cancelled") {
    return {
      subject: `🚫 ${typeName} request cancelled — FATS`,
      html: wrapper(icon, "Request cancelled", `
        <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, your <strong>${esc(typeName)}</strong> request has been cancelled.</p>
        ${box(`<p style="margin:0 0 8px"><strong>Status:</strong> Cancelled 🚫</p>${noteHtml}`)}`),
    };
  }

  if (event === "Returned") {
    const returned = req.returnedItems?.length ? req.returnedItems : items;
    return {
      subject: `📦 Equipment returned — FATS`,
      html: wrapper(icon, "Equipment returned — thank you", `
        <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, your equipment return has been recorded. Here's your receipt:</p>
        ${box(`
          ${req.dueDate ? `<p style="margin:0 0 8px"><strong>Due date:</strong> ${esc(req.dueDate)}</p>` : ""}
          ${req.returnedAt ? `<p style="margin:0 0 8px"><strong>Returned on:</strong> ${esc(req.returnedAt)}</p>` : ""}
          ${returned.length ? `<div style="margin-top:10px"><strong>Items returned:</strong><ul style="margin:6px 0 0;padding-left:18px;color:#c9cdd6">${returned.map(n => `<li>${esc(n)}</li>`).join("")}</ul></div>` : ""}
          ${req.lateFine ? `<p style="margin:10px 0 0;color:#f87171"><strong>Late fine:</strong> R${esc(req.lateFine)} (${esc(req.lateDays)} day${req.lateDays === 1 ? "" : "s"} late)</p>` : ""}`)}`),
    };
  }

  if (event === "Done") {
    if (req.typeId === "query") {
      return {
        subject: `✅ Your query has been resolved — FATS`,
        html: wrapper(icon, "Query resolved", `
          <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, your query has been looked into and resolved.</p>
          ${box(noteHtml || `<p style="margin:0;color:#9ca3af">If you have any follow-up questions, feel free to visit Tech Support or submit a new request.</p>`)}`),
      };
    }
    if (req.typeId === "print") {
      return {
        subject: `🖨️ Your prints are ready to collect — FATS`,
        html: wrapper(icon, "Prints ready!", `
          <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, your print job is done — please come collect your prints from Tech Support.</p>
          ${box(`<p style="margin:0 0 8px">Come during stockroom hours (Monday–Friday, 08:00–16:30).</p>${noteHtml}`)}`),
      };
    }
    if (req.typeId === "3d") {
      return {
        subject: `🧱 Your 3D print is ready to collect — FATS`,
        html: wrapper(icon, "3D print ready!", `
          <p style="margin:0 0 16px;font-size:15px">Hi <strong>${name}</strong>, your 3D print is done — please come collect it from Tech Support.</p>
          ${box(`<p style="margin:0 0 8px">Come during stockroom hours (Monday–Friday, 08:00–16:30).</p>${noteHtml}`)}`),
      };
    }
    return null; // no Done email for other types
  }

  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { recordId, event } = req.body || {};
  if (!recordId || !event) {
    return res.status(400).json({ error: "Missing recordId or event" });
  }
  if (!/^rec[a-zA-Z0-9]+$/.test(String(recordId)) || !ALLOWED_EVENTS.includes(event)) {
    return res.status(400).json({ error: "Invalid recordId or event" });
  }

  const PAT = process.env.AIRTABLE_PAT;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;
  if (!PAT || !user || !pass) {
    return res.status(500).json({ error: "Server not configured" });
  }

  // Fetch the request record — recipient and content come from here, not the caller
  const atRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${REQUESTS}/${recordId}`, {
    headers: { Authorization: `Bearer ${PAT}` },
  });
  if (!atRes.ok) return res.status(404).json({ error: "Request record not found" });
  const rec = await atRes.json();
  const f = rec.fields || {};

  let details = {}, returnedItems = [];
  try { details = JSON.parse(f.Details || "{}"); } catch (e) {}
  try { returnedItems = JSON.parse(f.ReturnedItems || "[]"); } catch (e) {}

  const request = {
    name: f.StudentName || "",
    typeId: f.TypeId || "",
    status: f.Status || "Pending",
    notes: f.Notes || "",
    schedDate: f.SchedDate || "",
    dueDate: f.DueDate || "",
    staffNote: f.StaffNote || "",
    returnedAt: f.ReturnedAt || (f.UpdatedAt ? String(f.UpdatedAt).slice(0, 10) : ""),
    lateDays: f.LateDays || 0,
    lateFine: f.LateFine || 0,
    details,
    returnedItems,
  };

  const to = f.StudentEmail;
  if (!to) return res.status(200).json({ ok: false, reason: "No student email on record" });

  const email = buildEmail(request, event);
  if (!email) return res.status(200).json({ ok: false, reason: "No email template for this event/type" });

  try {
    const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
    await transporter.sendMail({
      from: `"Mpumzi Mpati | Fine Art Dept" <${user}>`,
      replyTo: "Mpumzi Mpati <m.mpati@ru.ac.za>",
      to,
      subject: email.subject,
      html: email.html,
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Failed to send email", detail: e.message });
  }
}
