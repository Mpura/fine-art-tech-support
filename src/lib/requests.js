import { REQUEST_TYPES, MEMBERS_TABLE, todayISO } from "../shared.jsx";
import { atGet } from "./airtable.js";

// ── ARCHIVE SUMMARY ─────────────────────────────────────────────
function archiveSummary(req){
  const d=req.details||{};
  if(req.typeId==="print"){
    const copies=d.copies?`${d.copies} cop${parseInt(d.copies)===1?"y":"ies"}`:null;
    return [d.paperSize,d.paperType,copies].filter(Boolean).join(" · ")||null;
  }
  if(req.typeId==="laser"){
    const mat=d.material&&d.materialThickness?`${d.material} ${d.materialThickness}mm`:d.material;
    return [mat,d.jobType,d.needsDesignHelp?"🎨 needed design help":null].filter(Boolean).join(" · ")||null;
  }
  if(req.typeId==="3d"){
    return [d.dimensions,d.material3d,d.infill?`${d.infill} infill`:null].filter(Boolean).join(" · ")||null;
  }
  if(req.typeId==="software"){
    return [d.softwareName,d.macLocation].filter(Boolean).join(" · ")||null;
  }
  if(req.typeId==="studio"){
    return d.shootType||null;
  }
  if(req.typeId==="gallery"){
    const dates=d.eventStart&&d.eventEnd?`${d.eventStart} → ${d.eventEnd}`:d.eventStart||null;
    return [d.eventType,dates].filter(Boolean).join(" · ")||null;
  }
  if(req.typeId==="avsetup"){
    const disp=d.displayType&&d.screenCount&&parseInt(d.screenCount)>1?`${d.displayType} ×${d.screenCount}`:d.displayType;
    return [d.venue,disp,d.device].filter(Boolean).join(" · ")||null;
  }
  if(req.typeId==="equipment"){
    const names=(d.itemsData||[]).map(i=>i.name).filter(Boolean);
    return names.length?names.join(", "):(d.items||null);
  }
  if(req.typeId==="query"){
    const n=req.notes||"";
    return n?n.slice(0,80)+(n.length>80?"…":""):null;
  }
  return null;
}

// ── REQUEST ↔ AIRTABLE CONVERTERS ───────────────────────────────
function reqToAirtable(req) {
  return {
    Name:          req.id || "",
    StudentName:   req.name || "",
    StudNo:        req.studNo || "",
    Year:          req.year || "",
    TypeId:        req.typeId || "",
    Status:        req.status || "Pending",
    Notes:         req.notes || "",
    SchedDate:     req.schedDate || "",
    DueDate:       req.dueDate || "",
    Details:       JSON.stringify(req.details || {}),
    WalkIn:        req.isWalkIn || false,
    VisitorType:   req.visitorType || (req.isExternal ? "external" : "student"),
    StaffNote:     req.staffNote || "",
    CreatedAt:     req.createdAt || todayISO(),
    UpdatedAt:     todayISO(),
    ReturnedItems: JSON.stringify(req.returnedItems || []),
    LostItems:     JSON.stringify(req.lostItems || []),
    LateDays:      req.lateDays || 0,
    LateFine:      req.lateFine || 0,
    CheckInNotes:  req.checkInNotes || "",
    StudentEmail:  req.studentEmail || "",
  };
}
function airtableToReq(rec) {
  const f = rec.fields || {};
  // Existing records saved with the old Data blob — fall back gracefully
  if (!f.StudentName && f.Data) {
    try { return { ...JSON.parse(f.Data), airtableId: rec.id }; } catch(e) {}
  }
  let details = {}, returnedItems = [], lostItems = [];
  try { details = JSON.parse(f.Details || "{}"); } catch(e) {}
  try { returnedItems = JSON.parse(f.ReturnedItems || "[]"); } catch(e) {}
  try { lostItems = JSON.parse(f.LostItems || "[]"); } catch(e) {}
  return {
    id:           f.Name || rec.id,
    airtableId:   rec.id,
    name:         f.StudentName || "",
    studNo:       f.StudNo || "",
    year:         f.Year || "",
    typeId:       f.TypeId || "",
    type:         REQUEST_TYPES.find(t=>t.id===f.TypeId)?.label || f.TypeId || "",
    status:       f.Status || "Pending",
    notes:        f.Notes || "",
    schedDate:    f.SchedDate || null,
    dueDate:      f.DueDate || null,
    details,
    isWalkIn:     f.WalkIn || false,
    visitorType:  f.VisitorType || "student",
    staffNote:    f.StaffNote || "",
    createdAt:    f.CreatedAt || "",
    updatedAt:    f.UpdatedAt || "",
    returnedItems,
    lostItems,
    lateDays:     f.LateDays || 0,
    lateFine:     f.LateFine || 0,
    checkInNotes: f.CheckInNotes || "",
    studentEmail: f.StudentEmail || "",
  };
}

function parseMemberName(fullName) {
  const parts = fullName.trim().split(" ");
  // Student numbers start with a letter and contain digits (e.g. g25K7744)
  const hasStudNo = parts.length > 1 && /^[a-zA-Z][a-zA-Z0-9]*\d/.test(parts[0]);
  return {
    studNo: hasStudNo ? parts[0] : "",
    name:   hasStudNo ? parts.slice(1).join(" ") : fullName.trim(),
  };
}
async function lookupStudent(input) {
  const q = input.trim().replace(/"/g, "").replace(/\\/g, "");
  if (!q) return { found: false };
  // Scoped read — the server builds the match formula (student-number prefix OR
  // name contains), forces one record and the safe field set. This stops the
  // whole member roster being pulled without a staff PIN.
  const data = await atGet(MEMBERS_TABLE, { "fields[]": ["Name","Yr","Email"], maxRecords: 1 }, { value: q });
  if (data.records?.length) {
    const rec = data.records[0];
    const { studNo, name } = parseMemberName(rec.fields["Name"] || "");
    const email = rec.fields["Email"] || (studNo ? `${studNo.toLowerCase()}@campus.ru.ac.za` : null);
    return { found: true, studentId: rec.id, name, fullName: rec.fields["Name"] || "", year: String(rec.fields["Yr"] || ""), studNo, email };
  }
  return { found: false };
}

export { archiveSummary, reqToAirtable, airtableToReq, parseMemberName, lookupStudent };
