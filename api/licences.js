// Serves the seed software-licence records to staff only. This data used to
// ship in the public client bundle (shared.jsx DEFAULT_LICENCES) where anyone
// could read the vendor contacts, PO numbers and licence keys via view-source.

import { verifyStaffPin, getClientIp } from "./_auth.js";
import { DEFAULT_LICENCES } from "./_licence-data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const PAT = process.env.AIRTABLE_PAT;
  if (!PAT) return res.status(500).json({ error: "Server not configured" });

  if (!(await verifyStaffPin(req.body?.staffPin, PAT, getClientIp(req)))) {
    return res.status(401).json({ error: "Staff PIN required" });
  }

  return res.status(200).json({ licences: DEFAULT_LICENCES });
}
