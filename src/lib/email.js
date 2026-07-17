// ── EMAIL ────────────────────────────────────────────────────────
// All email content is built server-side in /api/email from the Airtable
// record — the client only names the record and the event. This keeps the
// endpoint locked down (no arbitrary recipient/subject/html from browsers).

const FATS_URL = "https://fine-art-tech-support.vercel.app";

async function callEmailApi(recordId, event) {
  if (!recordId) return; // record never saved to Airtable — nothing to email
  try {
    await fetch("/api/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recordId, event }),
    });
  } catch (e) {
    console.warn("Email send failed:", e.message);
  }
}

// recordId = the Airtable record id returned when the request was saved
async function sendConfirmationEmail(recordId) {
  return callEmailApi(recordId, "confirmation");
}

// req must carry airtableId; status picks the template server-side
async function sendStatusEmail(req, status) {
  return callEmailApi(req?.airtableId, status);
}

export { FATS_URL, sendConfirmationEmail, sendStatusEmail };
