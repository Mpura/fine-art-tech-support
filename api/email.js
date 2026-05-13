// Vercel serverless function — sends confirmation emails via Gmail/Google Workspace SMTP.
// Add these to Vercel environment variables:
//   GMAIL_USER  — your full email address (e.g. m.mpati@ru.ac.za)
//   GMAIL_PASS  — your Google App Password (16-char code, NOT your normal password)

import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { to, subject, html } = req.body || {};

  if (!to || !subject || !html) {
    return res.status(400).json({ error: "Missing to, subject, or html" });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_PASS;

  if (!user || !pass) {
    return res.status(500).json({ error: "Email credentials not configured on server" });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Mpumzi Mpati | Fine Art Dept" <${user}>`,
      to,
      subject,
      html,
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Failed to send email", detail: e.message });
  }
}
