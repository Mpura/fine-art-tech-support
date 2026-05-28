// Appends a pre-built HTML email to the Gmail Drafts folder via IMAP.
// Works with a Gmail App Password — no OAuth required.

import { ImapFlow } from "imapflow";

/**
 * @param {{ gmailUser: string, gmailPass: string, to: string|string[],
 *           cc?: string|string[], subject: string, html: string, fromName?: string }} opts
 */
export async function createGmailDraft({ gmailUser, gmailPass, to, cc, subject, html, fromName }) {
  const client = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
    logger: false,
  });

  await client.connect();

  try {
    const toStr   = Array.isArray(to) ? to.join(", ") : to;
    const ccStr   = cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : null;
    const fromStr = fromName ? `"${fromName}" <${gmailUser}>` : `<${gmailUser}>`;

    const headers = [
      `MIME-Version: 1.0`,
      `From: ${fromStr}`,
      `To: ${toStr}`,
      ...(ccStr ? [`Cc: ${ccStr}`] : []),
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `Content-Type: text/html; charset=UTF-8`,
    ].join("\r\n");

    const raw = `${headers}\r\n\r\n${html}`;

    await client.append("[Gmail]/Drafts", Buffer.from(raw, "utf-8"), ["\\Draft"]);
  } finally {
    await client.logout();
  }
}
