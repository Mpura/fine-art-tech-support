import { REQUEST_TYPES } from "../shared.jsx";

// ── EMAIL ────────────────────────────────────────────────────────
const FATS_URL = "https://fine-art-tech-support.vercel.app";

function buildEmailWrapper(icon, heading, bodyHtml) {
  return `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f1117;color:#e0e3ea;padding:32px 24px;border-radius:12px">
    <div style="font-size:28px;margin-bottom:8px">${icon}</div>
    <h2 style="margin:0 0 4px;font-size:20px;color:#e0e3ea">${heading}</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#9ca3af">Fine Art Tech Support</p>
    ${bodyHtml}
    <p style="font-size:13px;color:#6b7280;margin:16px 0 0">Track your request anytime at the <a href="${FATS_URL}" style="color:#6366f1;text-decoration:none">FATS portal</a> — you'll also receive emails for major updates.</p>
  </div>`;
}

async function sendEmail(to, subject, html) {
  try {
    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html }),
    });
  } catch (e) {
    console.warn("Email send failed:", e.message);
  }
}

async function sendConfirmationEmail(req) {
  const email = req.studentEmail;
  if (!email) return;
  const typeInfo = REQUEST_TYPES.find(t => t.id === req.typeId);
  const typeName = typeInfo?.label || req.type || "request";
  const icon = typeInfo?.icon || "📋";
  const items = req.details?.itemsData || [];
  const itemsHtml = items.length
    ? `<div style="margin-top:10px"><strong>Equipment:</strong><ul style="margin:6px 0 0;padding-left:18px;color:#c9cdd6">${items.map(i=>`<li>${i.name}</li>`).join("")}</ul></div>`
    : "";
  const isConfirmed = req.status === "Confirmed";
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, your <strong>${typeName}</strong> request has been ${isConfirmed ? "logged and confirmed" : "received and is being reviewed"}.</p>
    <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
      <p style="margin:0 0 8px"><strong>Status:</strong> ${req.status || "Pending"}</p>
      ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Scheduled:</strong> ${req.schedDate}</p>` : ""}
      ${req.dueDate ? `<p style="margin:0 0 8px"><strong>Due back:</strong> ${req.dueDate}</p>` : ""}
      ${itemsHtml}
      ${req.notes ? `<p style="margin:8px 0 0;color:#9ca3af;font-style:italic">"${req.notes}"</p>` : ""}
    </div>`;
  await sendEmail(email, `${icon} Your ${typeName} request — FATS`, buildEmailWrapper(icon, "Request received", bodyHtml));
}

async function sendStatusEmail(req, status) {
  const email = req.studentEmail;
  if (!email) return;
  const typeInfo = REQUEST_TYPES.find(t => t.id === req.typeId);
  const typeName = typeInfo?.label || req.type || "request";
  const icon = typeInfo?.icon || "📋";
  const items = req.details?.itemsData || [];
  const itemsHtml = items.length
    ? `<div style="margin-top:10px"><strong>Equipment:</strong><ul style="margin:6px 0 0;padding-left:18px;color:#c9cdd6">${items.map(i=>`<li>${i.name}</li>`).join("")}</ul></div>`
    : "";
  const noteHtml = req.staffNote ? `<p style="margin:10px 0 0;color:#9ca3af;font-style:italic">"${req.staffNote}"</p>` : "";

  let subject, heading, bodyHtml;

  if (status === "Confirmed") {
    subject = `✅ ${typeName} confirmed — FATS`;
    heading = "Request confirmed";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, your <strong>${typeName}</strong> request has been confirmed.</p>
      <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
        <p style="margin:0 0 8px"><strong>Status:</strong> Confirmed ✅</p>
        ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Scheduled:</strong> ${req.schedDate}</p>` : ""}
        ${req.dueDate ? `<p style="margin:0 0 8px"><strong>Due back:</strong> ${req.dueDate}</p>` : ""}
        ${itemsHtml}
      </div>`;
  } else if (status === "Ready to collect") {
    subject = `🎒 Equipment ready to collect — FATS`;
    heading = "Ready to collect!";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, your equipment is ready to collect. Please come fetch it at your earliest convenience.</p>
      <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
        ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Scheduled:</strong> ${req.schedDate}</p>` : ""}
        ${req.dueDate ? `<p style="margin:0 0 8px"><strong>Due back:</strong> ${req.dueDate}</p>` : ""}
        ${itemsHtml}
      </div>`;
  } else if (status === "Material test required") {
    subject = `🧪 Material test needed for your laser job — FATS`;
    heading = "Material test required";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, before your laser job can be cut, Tech Support needs to run a short test on your material to confirm the right settings.</p>
      <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
        <p style="margin:0 0 8px"><strong>What to do:</strong> come in during your booked slot and bring your material. The test takes about 5–10 minutes.</p>
        ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Your slot:</strong> ${req.schedDate}</p>` : ""}
        ${noteHtml}
      </div>`;
  } else if (status === "Ready to cut") {
    subject = `✅ Your laser job is ready to cut — FATS`;
    heading = "Ready to cut!";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, your material test passed — your laser job is ready to cut. Come in at your booked time.</p>
      <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
        ${req.schedDate ? `<p style="margin:0 0 8px"><strong>Your slot:</strong> ${req.schedDate}</p>` : ""}
        <p style="margin:0 0 8px">Remember: you must be present for the full duration of your session.</p>
        ${noteHtml}
      </div>`;
  } else if (status === "Declined") {
    subject = `❌ ${typeName} request declined — FATS`;
    heading = "Request declined";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, unfortunately your <strong>${typeName}</strong> request has been declined.</p>
      <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
        <p style="margin:0 0 8px"><strong>Status:</strong> Declined ❌</p>
        ${noteHtml}
      </div>`;
  } else if (status === "Cancelled") {
    subject = `🚫 ${typeName} request cancelled — FATS`;
    heading = "Request cancelled";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, your <strong>${typeName}</strong> request has been cancelled.</p>
      <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
        <p style="margin:0 0 8px"><strong>Status:</strong> Cancelled 🚫</p>
        ${noteHtml}
      </div>`;
  } else if (status === "Returned") {
    subject = `📦 Equipment returned — FATS`;
    heading = "Equipment returned — thank you";
    const returned = req.returnedItems?.length ? req.returnedItems : items.map(i => i.name);
    const returnedHtml = returned.length
      ? `<div style="margin-top:10px"><strong>Items returned:</strong><ul style="margin:6px 0 0;padding-left:18px;color:#c9cdd6">${returned.map(n=>`<li>${n}</li>`).join("")}</ul></div>`
      : "";
    bodyHtml = `
      <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, your equipment return has been recorded. Here's your receipt:</p>
      <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
        ${req.dueDate ? `<p style="margin:0 0 8px"><strong>Due date:</strong> ${req.dueDate}</p>` : ""}
        ${req.returnedAt ? `<p style="margin:0 0 8px"><strong>Returned on:</strong> ${req.returnedAt}</p>` : ""}
        ${returnedHtml}
        ${req.lateFine ? `<p style="margin:10px 0 0;color:#f87171"><strong>Late fine:</strong> R${req.lateFine} (${req.lateDays} day${req.lateDays===1?"":"s"} late)</p>` : ""}
      </div>`;
  } else {
    return; // no email for other statuses
  }

  await sendEmail(email, subject, buildEmailWrapper(icon, heading, bodyHtml));
}

export { FATS_URL, buildEmailWrapper, sendEmail, sendConfirmationEmail, sendStatusEmail };
