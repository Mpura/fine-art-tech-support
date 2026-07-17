// Serves the capital-budget line items (prices, asset numbers, risk
// justifications) to staff only. This data used to ship in the public client
// bundle where anyone could read it via view-source; it now lives server-side
// and is returned only for a valid staff PIN.

import { verifyStaffPin, getClientIp } from "./_auth.js";
import { ACE_2026, IT_2026, FE_2026 } from "./_budget-data.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const PAT = process.env.AIRTABLE_PAT;
  if (!PAT) return res.status(500).json({ error: "Server not configured" });

  if (!(await verifyStaffPin(req.body?.staffPin, PAT, getClientIp(req)))) {
    return res.status(401).json({ error: "Staff PIN required" });
  }

  return res.status(200).json({ ACE_2026, IT_2026, FE_2026 });
}
