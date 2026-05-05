// Reset all checked-out equipment back to Available by creating proper Check-In records.
// Run from your fine-art-tech-support folder:
//   node reset_equipment.js

const PAT = process.env.VITE_AIRTABLE_PAT;
const BASE_ID = "appUqkCfnsOo2Jf7z";
const EQ_TABLE = "tblc2MXweiXikz3wo";
const CHECKOUT_TABLE = "tbl1DvH6ostZs7Jog";

if (!PAT) {
  console.error("❌ No PAT found. Run with: VITE_AIRTABLE_PAT=patXXXX node reset_equipment.js");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${PAT}`,
  "Content-Type": "application/json",
};

async function run() {
  // 1. Fetch all equipment and find ones that are currently checked out.
  //    We check where "Check Out" rollup timestamp > "Check In" rollup timestamp.
  console.log("Fetching all equipment...");
  const url = `https://api.airtable.com/v0/${BASE_ID}/${EQ_TABLE}?fields[]=Name&fields[]=Check%20Out&fields[]=Check%20In`;
  const res = await fetch(url, { headers });
  const data = await res.json();

  if (!data.records) { console.error("❌ Failed:", JSON.stringify(data)); process.exit(1); }

  // Items are "Not Available" when Check Out timestamp > Check In timestamp (or no Check In yet)
  const checkedOut = data.records.filter(r => {
    const out = r.fields["Check Out"] || 0;
    const inn = r.fields["Check In"] || 0;
    return out > inn;
  });

  if (checkedOut.length === 0) {
    console.log("✅ All equipment already shows as Available — nothing to reset.");
    return;
  }

  console.log(`Found ${checkedOut.length} item(s) currently checked out:`);
  checkedOut.forEach(r => console.log("  •", r.fields["Name"] || r.id));

  // 2. Create ONE "Checking In" record in CHECKOUT_TABLE linking all checked-out items.
  //    This updates the "Check In" rollup timestamp on each piece of equipment,
  //    making it newer than the "Check Out" timestamp → shows as ✔ Available.
  console.log("\nPosting Checking In record to Airtable...");
  const ids = checkedOut.map(r => r.id);

  const postRes = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${CHECKOUT_TABLE}`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      fields: {
        "Type": "Checking In",
        "Checked Out Gear": ids,
      }
    })
  });

  const result = await postRes.json();

  if (result.id) {
    console.log(`\n✅ Done! Created check-in record ${result.id}`);
    console.log(`   ${checkedOut.length} item(s) should now show as ✔ Available in Airtable.`);
    console.log("   (Refresh your Airtable browser tab to confirm.)");
  } else {
    console.error("❌ Failed to create check-in record:", JSON.stringify(result));
    process.exit(1);
  }
}

run().catch(console.error);
