import { EQ_TABLE, CHECKOUT_TABLE, FINES_TABLE } from "../shared.jsx";
import { atGet, atPost } from "./airtable.js";

async function fetchEquipment(yearNum) {
  const data = await atGet(EQ_TABLE, {
    "fields[]": ["Name", "Type", "Equipment Status", "Status", "Image", "Restricted To Years", "Item Notes"]
  });
  if (!data.records) return [];
  return data.records
    .filter(rec => {
      const f = rec.fields;
      const eqStatus = f["Equipment Status"] || "";
      const avail = f["Status"] || "";
      const restricted = f["Restricted To Years"] || [];
      if (!["Fully Functional", "Functional - Worn"].includes(eqStatus)) return false;
      if (["Unavailable", "Checked Out"].includes(avail)) return false;
      // 1st years cannot book equipment
      if (String(yearNum) === "1") return false;
      // "Other" (external) can only see items explicitly marked for them
      if (String(yearNum) === "o") return restricted.includes("o");
      // Everyone else: if no restrictions set → visible; if set → must be included
      if (restricted.length > 0 && !restricted.includes(String(yearNum))) return false;
      return true;
    })
    .map(rec => {
      const f = rec.fields;
      const imgArr = f["Image"] || [];
      return {
        id: rec.id,
        name: f["Name"] || "",
        type: f["Type"] || "",
        equipmentStatus: f["Equipment Status"] || "",
        status: f["Status"] || "",
        image: imgArr[0]?.thumbnails?.large?.url || imgArr[0]?.url || "",
        restrictedYears: f["Restricted To Years"] || [],
        replacementCost: 500,
        accessories: (f["Item Notes"]||"").split("\n").map(s=>s.trim()).filter(Boolean),
      };
    });
}

async function createEquipmentBooking(student, items, collectionDate, slot, dueDate, notes) {
  await atPost(CHECKOUT_TABLE, {
    "Type": "Checking Out",
    "Estimated Return Date": dueDate,
    "Submitted By": [student.studentId],
    "Checked In Gear": items.map(i => i.id)
  });
}


async function saveFineRecord(fine) {
  return atPost(FINES_TABLE, {
    "Student No": fine.studNo,
    "Student Name": fine.studentName,
    "Request ID": fine.reqId,
    "Type": fine.type === "late_return" ? "Late Return" : "Lost Item",
    "Item Name": fine.itemName,
    "Amount (R)": fine.amount,
    "Days Late": fine.days,
    "Date": fine.date,
    "Month": fine.month,
    "Settled": false,
    "Staff Notes": fine.notes || "",
  });
}

async function fetchEqImagesByIds(ids) {
  if(!ids.length)return{};
  const formula=`OR(${ids.map(id=>`RECORD_ID()="${id}"`).join(",")})`;
  const data=await atGet(EQ_TABLE,{filterByFormula:formula,"fields[]":["Name","Image"]});
  const map={};
  for(const rec of data.records||[]){const imgArr=rec.fields["Image"]||[];map[rec.id]=imgArr[0]?.thumbnails?.large?.url||imgArr[0]?.url||"";}
  return map;
}

async function fetchFinesForStudent(studNo) {
  const data = await atGet(FINES_TABLE, { filterByFormula: `{Student No}="${studNo}"`, "sort[0][field]": "Date", "sort[0][direction]": "desc" });
  return (data.records || []).map(r => ({ id: r.id, ...r.fields }));
}

async function fetchFinesForMonth(month) {
  const data = await atGet(FINES_TABLE, { filterByFormula: `{Month}="${month}"`, "sort[0][field]": "Date", "sort[0][direction]": "desc" });
  return (data.records || []).map(r => ({ id: r.id, ...r.fields }));
}

async function settleFine(fineId) {
  return atPatch(FINES_TABLE, fineId, { Settled: true });
}

async function settleLostItemFine(reqId, itemName) {
  const formula = `AND({Request ID}="${reqId}",{Type}="Lost Item",{Item Name}="${itemName}",{Settled}=FALSE())`;
  const data = await atGet(FINES_TABLE, { filterByFormula: formula });
  for (const rec of data.records || []) {
    await atPatch(FINES_TABLE, rec.id, { Settled: true, "Staff Notes": "Item found and returned" });
  }
}

export { fetchEquipment, createEquipmentBooking, saveFineRecord, fetchEqImagesByIds, fetchFinesForStudent, fetchFinesForMonth, settleLostItemFine, settleFine };
