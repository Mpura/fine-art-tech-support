// Run from your fine-art-tech-support folder:
// node reset_equipment.js

const PAT = process.env.VITE_AIRTABLE_PAT;
const BASE_ID = "appUqkCfnsOo2Jf7z";
const EQ_TABLE = "tblc2MXweiXikz3wo";

if (!PAT) {
  console.error("❌ No PAT found. Run with: VITE_AIRTABLE_PAT=patXXXX node reset_equipment.js");
  process.exit(1);
}

async function run() {
  console.log("Fetching all equipment...");
  const url = `https://api.airtable.com/v0/${BASE_ID}/${EQ_TABLE}?fields[]=Name&fields[]=Status`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${PAT}` } });
  const data = await res.json();

  if (!data.records) { console.error("❌ Failed:", data); process.exit(1); }

  const toReset = data.records.filter(r => r.fields["Status"] === "Checked Out");
  console.log(`Found ${toReset.length} item(s) marked Checked Out — resetting to Available...`);

  for (const rec of toReset) {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${EQ_TABLE}/${rec.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${PAT}`, "Content-Type": "application/json" },
      body: JSON.stringify({ fields: { "Status": "Available" } })
    });
    const result = await r.json();
    console.log(`✓ ${rec.fields["Name"]} → Available`);
  }

  console.log("Done ✅");
}

run().catch(console.error);
