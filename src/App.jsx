import { useState, useEffect } from "react";

const TEAL = "#20B07F";
const BLUE = "#3b82f6";
const AMBER = "#d4851a";
const RED = "#e05a5a";
const TYPE_COLOR = {equipment:"#20B07F",print:"#3b82f6",laser:"#E65C00","3d":"#8b5cf6",studio:"#f59e0b",gallery:"#ef4444",software:"#06b6d4",query:"#6B7280"};

// ── DARK THEME ───────────────────────────────────────────────────
const T = {
  bg:"#0F1117", card:"#141720", surface:"#1a1d28",
  border:"0.5px solid #1e2130", borderColor:"#1e2130",
  text:"#e0e3ea", textMuted:"#6b7280", textFaint:"#4b5563",
  teal:"#20B07F", tealDim:"#0a2218",
  blue:"#3b82f6", blueDim:"#0a1e35",
};

// ── CONSTANTS ────────────────────────────────────────────────────
const BASE_ID = "appUqkCfnsOo2Jf7z";
const EQ_TABLE = "tblc2MXweiXikz3wo";
const CHECKOUT_TABLE = "tbl1DvH6ostZs7Jog";
const FINES_TABLE = "tbliP9x6KL7EUABWc";
const MEMBERS_TABLE = "tbloPfyyjQY79YxQd";
const REQUESTS_TABLE = "tblAQE1leKVCRH51d";
const HSMS_URL = "https://fineart-hsms.netlify.app/";

const YEAR_LABELS = {"1":"1st year","2":"2nd year","3":"3rd year","4":"4th year","m":"Masters","s":"Staff","o":"Other"};

const REQUEST_TYPES = [
  {id:"print",label:"Large format & photographic printing",icon:"🖨️",booking:"advance booking only",bookable:true,needsFiles:true,prep:["File must be PDF, JPEG or TIFF","Colour profile must be sRGB or CMYK","Know your paper size (A4 → A0)","Decide paper type: normal, glossy, newsprint or photographic","Know how many copies you need","⚠️ Minimum 2 business days advance booking required","⚠️ Test print may be needed — same-day completion is NOT guaranteed"]},
  {id:"laser",label:"Laser cutter & engraving",icon:"⚡",booking:"advance booking only",bookable:true,needsFiles:true,prep:["File must be SVG or AI — not JPEG, PNG or PDF","Document must be in RGB colour mode (File → Document Colour Mode → RGB)","Vector lines must be hairline stroke (0.001–0.005pt) with NO fill","Use colour-coded layers: Red = Cut, Blue = Engrave, Black = Raster etch","Know your exact material type and thickness in mm","Bring your own tape if securing lightweight materials to the bed","⚠️ Maximum cut depth is 12mm — thicker materials cannot be cut through","⚠️ Banned materials: PVC, polycarbonate, rubber, fibreglass, foam, galvanised metal, MDF — see guide","⚠️ You MUST be present for the full duration of your session — no drop-off jobs","⚠️ First-time users: a material test is required before any cutting","⚠️ Minimum 3 business days advance — no same-day or next-day bookings"]},
  {id:"3d",label:"3D printing",icon:"🧱",booking:"advance booking only",bookable:false,needsFiles:true,prep:["File must be STL or OBJ","Know your dimensions and scale","Decide material preference","Decide infill density","⚠️ Minimum 5 business days advance — prints take hours to complete","⚠️ Drop-off service: you will be notified when your print is ready to collect"]},
  {id:"software",label:"Software install",icon:"💻",booking:"walk-in",bookable:false,needsFiles:false,prep:["Know the exact software name","Have the download URL ready","Know which Mac number and lab room"]},
  {id:"studio",label:"Lighting studio",icon:"💡",booking:"advance booking only",bookable:false,needsFiles:false,prep:["Studio orientation required before first use — speak to Tech Support","Keys must be returned same day by 17:00","Bring your student card when collecting","⚠️ Studio is for photography students only"]},
  {id:"equipment",label:"Equipment booking",icon:"📷",booking:"advance booking only",bookable:false,needsFiles:false,prep:[]},
  {id:"gallery",label:"Gallery / space booking",icon:"🖼️",booking:"advance booking only",bookable:false,needsFiles:false,prep:["Have a clear concept or proposal for the event","Know your proposed dates and how many days you need","Estimate expected attendance","List any setup requirements (tables, chairs, PA, lighting)","⚠️ Bookings are subject to availability and departmental approval"]},
  {id:"query",label:"General query / other",icon:"💬",booking:"walk-in or advance",bookable:false,needsFiles:false,prep:[]},
];

const BOOKABLE = REQUEST_TYPES.filter(t=>t.bookable);
const LAB_IDS = ["print","laser","3d","studio"];
const DEFAULT_SCHEDULE = {
  laser:{days:[2,4],morningSlots:2,afternoonSlots:1,minAdvanceDays:3},
  "3d":{days:[1,3],morningSlots:2,afternoonSlots:2,minAdvanceDays:5},
  print:{days:[1,2,3,4,5],morningSlots:2,afternoonSlots:2,minAdvanceDays:2},
  studio:{days:[1,2,3,4,5],morningSlots:1,afternoonSlots:2,minAdvanceDays:0},
};

const STATUSES = ["Pending","In Progress","Done","Declined"];
const LASER_STATUSES = ["Pending","Material test required","Ready to cut","In Progress","Done","Declined"];
const EQ_STATUSES = ["Pending","Confirmed","Ready to collect","Collected","Partially Returned","Returned","Uncollected","Declined","Cancelled"];
const IT_STATUSES = ["Logged","Awaiting IT","In Progress","Resolved","Escalated"];

const statusStyle = {
  "Pending":{bg:"#2a1f0a",color:"#d4851a"},
  "In Progress":{bg:"#0a1e35",color:"#60a5fa"},
  "Material test required":{bg:"#2a0f1a",color:"#c96090"},
  "Ready to cut":{bg:"#0a2218",color:"#20B07F"},
  "Done":{bg:"#0a2218",color:"#20B07F"},
  "Declined":{bg:"#2a0f14",color:"#f87171"},
  "Confirmed":{bg:"#0a1e35",color:"#60a5fa"},
  "Ready to collect":{bg:"#0a2218",color:"#20B07F"},
  "Collected":{bg:"#0a2218",color:"#20B07F"},
  "Partially Returned":{bg:"#1a2a1a",color:"#4ade80"},
  "Returned":{bg:"#1a1d28",color:"#6b7280"},
  "Uncollected":{bg:"#2a1500",color:"#fb923c"},
  "Cancelled":{bg:"#1a1a2a",color:"#9ca3af"},
};
const itStatusStyle = {
  "Logged":{bg:"#2a1f0a",color:"#d4851a"},
  "Awaiting IT":{bg:"#0a1e35",color:"#60a5fa"},
  "In Progress":{bg:"#0a1e35",color:"#60a5fa"},
  "Resolved":{bg:"#0a2218",color:"#20B07F"},
  "Escalated":{bg:"#2a0f14",color:"#f87171"},
};

const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_FULL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const IT_ITEMS=[
  {id:"seminar_computers",label:"Seminar room computers"},
  {id:"seminar_projector",label:"Seminar room projector"},
  {id:"seminar_network",label:"Seminar room network/wifi"},
  {id:"maclab_software",label:"Mac lab — software/OS issue"},
  {id:"maclab_network",label:"Mac lab — network/wifi"},
  {id:"maclab_hardware",label:"Mac lab — hardware fault"},
  {id:"general_network",label:"Department network/internet"},
  {id:"other_it",label:"Other IT issue"},
];

const KEYS={req:"fats_req_v5",sched:"fats_sched_v5",block:"fats_block_v5",maint:"fats_maint_v5",hs:"fats_hs_v5",leave:"fats_leave_v5",it:"fats_it_v5",savedStudNo:"fats_studno_v1",staffPin:"fats_pin_v1",eqSet:"fats_eqset_v1"};
const DEFAULT_PIN="1234";
const DEFAULT_EQ_SETTINGS={yr12Days:3,yr34Days:5,dailyRate:50,maxAdvanceDays:1,collectionDeadlineHour:16,slotCap:2,yr2Cap:2,yr3Cap:3,yr4Cap:4,mastersCap:5};

// Equipment collection: Mon/Wed/Fri only, three 30-min windows during stockroom hours
const EQ_COL_DAYS=[1,3,5]; // Mon=1, Wed=3, Fri=5
const EQ_COL_SLOTS=[
  {id:"s1",label:"11:00–11:30"},
  {id:"s2",label:"11:30–12:00"},
  {id:"s3",label:"12:00–12:30"},
];
function isEqColDay(dateStr){if(!dateStr)return false;const d=new Date(dateStr+"T00:00:00");return EQ_COL_DAYS.includes(d.getDay());}

function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}
function toKey(y,m,d){return`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function fmt(iso){if(!iso)return"";const d=new Date(iso);return d.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"});}
function fmtDate(iso){if(!iso)return"";const d=new Date(iso+"T00:00:00");return d.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"});}
function todayISO(){return new Date().toISOString();}
function todayDate(){const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
function localDateStr(d){return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function addBusinessDays(dateStr,n){let d=new Date(dateStr+"T00:00:00");let added=0;while(added<n){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)added++;}return localDateStr(d);}
// Equipment loans count ALL days (weekends included). If due date lands on weekend, push to Monday.
function addCalendarDays(dateStr,n){let d=new Date(dateStr+"T00:00:00");d.setDate(d.getDate()+n);if(d.getDay()===6)d.setDate(d.getDate()+2);if(d.getDay()===0)d.setDate(d.getDate()+1);return localDateStr(d);}
function nextEqColDay(fromDateStr){let d=new Date(fromDateStr+"T00:00:00");d.setDate(d.getDate()+1);while(!EQ_COL_DAYS.includes(d.getDay())){d.setDate(d.getDate()+1);}return localDateStr(d);}
function countDaysLate(dueDateStr,returnDateStr){let due=new Date(dueDateStr+"T00:00:00");let ret=new Date(returnDateStr+"T00:00:00");if(ret<=due)return 0;return Math.round((ret-due)/(1000*60*60*24));}
function countBizDaysLate(dueDateStr,returnDateStr){let due=new Date(dueDateStr+"T00:00:00");let ret=new Date(returnDateStr+"T00:00:00");if(ret<=due)return 0;let count=0;let d=new Date(due);while(d<ret){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)count++;}return count;}

// Keyword-based replacement cost for individual accessories
function accessoryCost(text){const t=(text||"").toLowerCase();if(t.includes("lens cap"))return 80;if(t.includes("lens"))return 800;if(t.includes("battery"))return 350;if(t.includes("charger"))return 200;if(t.includes("micro sd")||t.includes("microsd"))return 150;if(t.includes("sd card")||t.includes("memory card"))return 150;if(t.includes("filter"))return 400;if(t.includes("cable"))return 100;if(t.includes("windscreen"))return 120;if(t.includes("calibration"))return 300;if(t.includes("pouch")||t.includes("case")||t.includes("bag"))return 80;if(t.includes("adapter"))return 80;if(t.includes("glasses")||t.includes("safety"))return 80;return 150;}

const ipt={width:"100%",padding:"11px 14px",borderRadius:10,border:"1.5px solid #1e2130",fontSize:14,boxSizing:"border-box",fontFamily:"inherit",background:"#141720",color:"#e0e3ea",outline:"none"};
const pill=(status,map=statusStyle)=>{const s=(map)[status]||{};return <span style={{fontSize:11,padding:"4px 11px",borderRadius:20,fontWeight:500,whiteSpace:"nowrap",...s}}>{status}</span>;};
const Btn=({children,onClick,color=TEAL,outline=false,disabled=false,small=false,full=false,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{padding:small?"7px 14px":"11px 20px",borderRadius:10,border:outline?`1.5px solid ${color}`:"none",background:disabled?"#1e2130":outline?"transparent":color,color:disabled?"#4b5563":outline?color:"#fff",fontSize:small?12:14,fontWeight:500,cursor:disabled?"not-allowed":"pointer",fontFamily:"inherit",width:full?"100%":"auto",letterSpacing:"0.01em",...style}}>{children}</button>
);

// ── AIRTABLE REST API (via secure server proxy) ──────────────────
// All calls go to /api/airtable — the token never leaves the server.

async function atGet(table, params = {}) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method: "GET", params }),
  });
  return res.json();
}

async function atPost(table, fields) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method: "POST", fields }),
  });
  return res.json();
}

async function atPatch(table, recordId, fields) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method: "PATCH", recordId, fields }),
  });
  return res.json();
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
    type:         f.TypeId || "",
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
  const fields = ["Name","Yr","Email"];
  // 1. Try case-insensitive student number prefix match
  const snFormula = `LOWER(LEFT({Name},LEN(LOWER("${q}"))+1))=LOWER(CONCATENATE("${q}"," "))`;
  const snData = await atGet(MEMBERS_TABLE, { filterByFormula: snFormula, "fields[]": fields, maxRecords: 1 });
  if (snData.records?.length) {
    const rec = snData.records[0];
    const { studNo, name } = parseMemberName(rec.fields["Name"] || "");
    const email = rec.fields["Email"] || (studNo ? `${studNo.toLowerCase()}@campus.ru.ac.za` : null);
    return { found: true, studentId: rec.id, name, fullName: rec.fields["Name"] || "", year: String(rec.fields["Yr"] || ""), studNo, email };
  }
  // 2. Fallback: search by name (for staff / visitors with no student number)
  // FIND() returns 0 if not found (safe in filterByFormula), unlike SEARCH() which errors
  const nameFormula = `FIND(LOWER("${q}"),LOWER({Name}))>0`;
  const nameData = await atGet(MEMBERS_TABLE, { filterByFormula: nameFormula, "fields[]": fields, maxRecords: 1 });
  if (nameData.records?.length) {
    const rec = nameData.records[0];
    const { studNo, name } = parseMemberName(rec.fields["Name"] || "");
    const email = rec.fields["Email"] || (studNo ? `${studNo.toLowerCase()}@campus.ru.ac.za` : null);
    return { found: true, studentId: rec.id, name, fullName: rec.fields["Name"] || "", year: String(rec.fields["Yr"] || ""), studNo, email };
  }
  return { found: false };
}

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
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px">Hi <strong>${req.name}</strong>, your <strong>${typeName}</strong> request has been received and is being reviewed.</p>
    <div style="background:#1a1d28;border-radius:8px;padding:14px 16px;margin-bottom:4px;font-size:14px">
      <p style="margin:0 0 8px"><strong>Status:</strong> Pending</p>
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

async function createCheckIn(req) {
  const itemIds=(req.details?.itemsData||[]).map(i=>i.id).filter(Boolean);
  if(!itemIds.length)return;
  const fields={"Type":"Checking In","Checked Out Gear":itemIds};
  if(req.studentId)fields["Submitted By"]=[req.studentId];
  await atPost(CHECKOUT_TABLE,fields);
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

// ── MAIN APP ─────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState("student"); // student | dashboard
  const [screen, setScreen] = useState("home");
  const [selType, setSelType] = useState(null);
  const [prepOk, setPrepOk] = useState(false);

  // Requests
  const [requests, setRequests] = useState([]);
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [blocks, setBlocks] = useState({});
  const [maintLogs, setMaintLogs] = useState([]);
  const [hsLogs, setHsLogs] = useState([]);
  const [itReferrals, setItReferrals] = useState([]);
  const [leaveMode, setLeaveMode] = useState({active:false,returnDate:"",message:""});
  const [loaded, setLoaded] = useState(false);

  // Dashboard UI
  const [expandId, setExpandId] = useState(null);
  const [staffNotes, setStaffNotes] = useState({});
  const [filterStatus, setFilterStatus] = useState("All");
  const [dashTab, setDashTab] = useState("today");
  const [editEq, setEditEq] = useState(null);

  // Calendar
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selDate, setSelDate] = useState(null);

  // Staff calendar
  const [staffCalYear, setStaffCalYear] = useState(new Date().getFullYear());
  const [staffCalMonth, setStaffCalMonth] = useState(new Date().getMonth());
  const [staffCalDay, setStaffCalDay] = useState(null);
  const [selSlot, setSelSlot] = useState(null);

  // Block dates
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

  // Maintenance
  const [maintForm, setMaintForm] = useState({equipmentId:"",date:"",notes:"",status:"Done",duration:""});

  // IT referrals
  const [itForm, setItForm] = useState({itemId:"",description:"",priority:"Normal",dateLogged:todayDate(),loggedWith:"",reference:"",notes:""});
  const [itFilter, setItFilter] = useState("All");
  const [expandItId, setExpandItId] = useState(null);
  const [itUpdateNote, setItUpdateNote] = useState({});

  // Student request form
  const [form, setForm] = useState({name:"",studNo:localStorage.getItem(KEYS.savedStudNo)||"",year:"",when:"walkin",schedDate:"",notes:"",paperSize:"",paperType:"",colour:"Colour",copies:"",material:"",materialThickness:"",dimensions:"",jobType:"Cut",softwareName:"",downloadUrl:"",macLocation:"",shootType:"",duration:"",material3d:"",infill:"",eventType:"",eventStart:"",eventEnd:"",attendance:"",setupNeeds:"",venue:"",techSupport:"",printPresent:"",softwareType:"",studioDate:"",studioSlot:"",dropOffDate:"",sessionDuration:"",fileLink:"",firstTime:false});

  // Equipment booking state
  const [eqScreen, setEqScreen] = useState("lookup"); // lookup | browse | confirm | success
  const [eqStudNo, setEqStudNo] = useState("");
  const [eqStudent, setEqStudent] = useState(null);
  const [eqLooking, setEqLooking] = useState(false);
  const [eqLookupErr, setEqLookupErr] = useState("");
  const [equipment, setEquipment] = useState([]);
  const [eqLoading, setEqLoading] = useState(false);
  const [eqErr, setEqErr] = useState("");
  const [selItems, setSelItems] = useState([]);
  const [eqFilter, setEqFilter] = useState("All");
  const [eqSearch, setEqSearch] = useState("");
  const [eqColDate, setEqColDate] = useState("");
  const [eqSlot, setEqSlot] = useState("");
  const [eqNotes, setEqNotes] = useState("");
  const [eqSubmitting, setEqSubmitting] = useState(false);
  const [labExpanded, setLabExpanded] = useState(false);
  const [staffUnlocked, setStaffUnlocked] = useState(()=>sessionStorage.getItem("fats_staff_unlocked")==="1");
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState("");
  const [changingPin, setChangingPin] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window!=="undefined"&&window.innerWidth>=900);
  const [newPin, setNewPin] = useState("");
  const [labChoice, setLabChoice] = useState("");
  const [visitorType, setVisitorType] = useState("student"); // student | external
  const [extForm, setExtForm] = useState({name:"",affiliation:"",contact:""});
  const [checkStudNo, setCheckStudNo] = useState("");
  const [checkResults, setCheckResults] = useState(null);
  const [lastReq, setLastReq] = useState(null);
  const [verifiedStudent, setVerifiedStudent] = useState(null);
  const [verifyingStudent, setVerifyingStudent] = useState(false);
  const [verifyErr, setVerifyErr] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [eqSettings, setEqSettings] = useState(()=>JSON.parse(localStorage.getItem(KEYS.eqSet)||"null")||DEFAULT_EQ_SETTINGS);
  const [fines, setFines] = useState([]);
  const [finesLoading, setFinesLoading] = useState(false);
  const [checkInModal, setCheckInModal] = useState(null);
  const [ciLost, setCiLost] = useState([]);
  const [ciReturning, setCiReturning] = useState([]);
  const [ciNotes, setCiNotes] = useState("");
  const [ciLostAccessories, setCiLostAccessories] = useState([]); // [{itemName, accessory, cost}]
  const [chargesMonth, setChargesMonth] = useState(new Date().toISOString().slice(0,7));
  const [chargesStudNo, setChargesStudNo] = useState("");
  const [eqSettingsForm, setEqSettingsForm] = useState(null);
  const [myFines, setMyFines] = useState(null);
  const [myFinesLoading, setMyFinesLoading] = useState(false);
  const [checkShowArchive, setCheckShowArchive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eqCheckImages, setEqCheckImages] = useState({});
  const [queueEqImages, setQueueEqImages] = useState({});

  const type = REQUEST_TYPES.find(t=>t.id===selType);
  const getLoanDays = (yearStr) => {
    const y = String(yearStr);
    if (["3","4","m","s"].includes(y)) return eqSettings.yr34Days;
    return eqSettings.yr12Days;
  };
  const getItemCap = (yearStr) => {
    const y = String(yearStr);
    if (y==="2") return eqSettings.yr2Cap||2;
    if (y==="3") return eqSettings.yr3Cap||3;
    if (y==="4") return eqSettings.yr4Cap||4;
    if (y==="m"||y==="s") return eqSettings.mastersCap||5;
    return 2;
  };
  const getEqMinDate = () => {
    const now = new Date();
    const today = todayDate();
    if (now.getHours() >= (eqSettings.collectionDeadlineHour||16)) return nextEqColDay(today);
    return today;
  };
  const isSlotPast = (slotLabel) => {
    const today = todayDate();
    if (eqColDate !== today) return false;
    const now = new Date();
    const endHour = slotLabel.includes("11:00")?11:slotLabel.includes("11:30")?12:12;
    const endMin = slotLabel.includes("11:00")?30:slotLabel.includes("11:30")?0:30;
    return now.getHours() > endHour || (now.getHours() === endHour && now.getMinutes() >= endMin);
  };
  const eqDueDate = eqColDate && eqStudent ? addCalendarDays(eqColDate, getLoanDays(eqStudent.year)) : "";

  useEffect(()=>{
    // Staff-device settings stay in localStorage (schedule, blocks, etc.)
    try{
      const s=localStorage.getItem(KEYS.sched);if(s)setSchedule(JSON.parse(s));
      const b=localStorage.getItem(KEYS.block);if(b)setBlocks(JSON.parse(b));
      const m=localStorage.getItem(KEYS.maint);if(m)setMaintLogs(JSON.parse(m));
      const h=localStorage.getItem(KEYS.hs);if(h)setHsLogs(JSON.parse(h));
      const l=localStorage.getItem(KEYS.leave);if(l)setLeaveMode(JSON.parse(l));
      const i=localStorage.getItem(KEYS.it);if(i)setItReferrals(JSON.parse(i));
      const sn=localStorage.getItem(KEYS.savedStudNo);if(sn)setForm(f=>({...f,studNo:sn}));
    }catch(e){}
    // Requests come from Airtable so they're visible across all devices
    atGet(REQUESTS_TABLE,{maxRecords:500}).then(data=>{
      if(data.records){
        const reqs=data.records.map(airtableToReq).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
        setRequests(reqs);persist(KEYS.req,reqs);
      }
    }).catch(()=>{
      // Fall back to localStorage cache if Airtable is unreachable
      try{const r=localStorage.getItem(KEYS.req);if(r)setRequests(JSON.parse(r));}catch(e){}
    }).finally(()=>setLoaded(true));
  },[]);

  // Refresh requests from Airtable every time staff switches to the dashboard
  useEffect(()=>{
    if(view!=="dashboard")return;
    atGet(REQUESTS_TABLE,{maxRecords:500}).then(data=>{
      if(data.records){
        const reqs=data.records.map(airtableToReq).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
        setRequests(reqs);persist(KEYS.req,reqs);
      }
    }).catch(()=>{});
  },[view]);
  useEffect(()=>{const handle=()=>setIsDesktop(window.innerWidth>=900);window.addEventListener("resize",handle);return()=>window.removeEventListener("resize",handle);},[]);

  useEffect(()=>{
    if(view!=="staff"||dashTab!=="queue")return;
    const ids=[...new Set(requests.flatMap(r=>r.details?.itemsData?.map(i=>i.id)||[]).filter(Boolean))];
    if(!ids.length)return;
    fetchEqImagesByIds(ids).then(imgs=>setQueueEqImages(imgs)).catch(()=>{});
  },[dashTab,requests,view]);

  const persist=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data));}catch(e){}};
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  function getDetails(){
    if(selType==="print") return{paperSize:form.paperSize,paperType:form.paperType,colour:form.colour,copies:form.copies,printPresent:form.printPresent};
    if(selType==="laser") return{material:form.material,materialThickness:form.materialThickness,dimensions:form.dimensions,jobType:form.jobType,sessionDuration:form.sessionDuration,fileLink:form.fileLink,firstTime:form.firstTime};
    if(selType==="3d") return{dimensions:form.dimensions,material3d:form.material3d,infill:form.infill,dropOffDate:form.dropOffDate};
    if(selType==="software") return{softwareType:form.softwareType,softwareName:form.softwareName,downloadUrl:form.downloadUrl,macLocation:form.macLocation};
    if(selType==="studio") return{shootType:form.shootType};
    if(selType==="gallery") return{eventType:form.eventType,eventStart:form.eventStart,eventEnd:form.eventEnd,attendance:form.attendance,setupNeeds:form.setupNeeds,venue:form.venue,techSupport:form.techSupport};
    return{};
  }
  async function submitRequest(isWalkIn=false){
    const isExt=visitorType==="external";
    if(isExt){if(!extForm.name.trim()||!selType)return;}
    else{if(!verifiedStudent||!selType)return;}
    const _schedDate=
      selType==="studio"&&form.studioDate&&form.studioSlot?`${form.studioDate} (${EQ_COL_SLOTS.find(s=>s.id===form.studioSlot)?.label||form.studioSlot})`:
      selType==="3d"&&form.dropOffDate?`Drop-off: ${fmtDate(form.dropOffDate)}`:
      type.bookable&&selDate?`${selDate} (${selSlot==="morning"?"Morning 09:00–12:00":"Afternoon 13:00–16:00"})`:
      form.when==="later"&&!isWalkIn?form.schedDate:null;
    const req={id:genId(),name:isExt?extForm.name.trim():verifiedStudent.name,studNo:isExt?"":verifiedStudent?.studNo||"",year:isExt?"":verifiedStudent?.year||"",studentEmail:isExt?null:verifiedStudent?.email||null,affiliation:isExt?extForm.affiliation.trim():"",contact:isExt?extForm.contact.trim():"",type:type.label,typeId:selType,when:isWalkIn?"walkin":(type.bookable&&selDate)||(selType==="studio"&&form.studioDate)||(selType==="3d"&&form.dropOffDate)?"booked":form.when,schedDate:_schedDate,notes:form.notes.trim(),details:getDetails(),status:"Pending",staffNote:"",isWalkIn,isExternal:isExt,createdAt:todayISO(),updatedAt:todayISO()};
    // Show immediately in UI
    const u=[req,...requests];setRequests(u);persist(KEYS.req,u);
    // Save to Airtable so staff can see it from any device
    try{
      const result=await atPost(REQUESTS_TABLE,reqToAirtable(req));
      if(result.id){setRequests(prev=>prev.map(r=>r.id===req.id?{...r,airtableId:result.id}:r));}
      else{console.error("FATS: request save failed",result);}
    }catch(e){console.error("FATS: request save error",e);}
    // Send confirmation email to student (non-blocking)
    sendConfirmationEmail(req);
    return req;
  }
  function updateStatus(id,status){
    const req=requests.find(r=>r.id===id);
    if(req?.typeId==="equipment"&&["Declined","Uncollected","Cancelled"].includes(status)){
      const ids=(req.details?.itemsData||[]).map(i=>i.id).filter(Boolean);
      if(ids.length){atPost(CHECKOUT_TABLE,{"Type":"Checking In","Checked Out Gear":ids}).catch(()=>{});}
    }
    if(req?.airtableId){atPatch(REQUESTS_TABLE,req.airtableId,{Status:status,UpdatedAt:todayISO()}).catch(()=>{});}
    const u=requests.map(r=>r.id===id?{...r,status,updatedAt:todayISO()}:r);setRequests(u);persist(KEYS.req,u);
    // Send status update email for key statuses (non-blocking)
    if(req&&["Confirmed","Ready to collect","Declined","Cancelled"].includes(status)){
      sendStatusEmail({...req,status},status);
    }
  }
  function updateReq(id,fields){
    const req=requests.find(r=>r.id===id);
    const updated={...req,...fields,updatedAt:todayISO()};
    if(req?.airtableId){atPatch(REQUESTS_TABLE,req.airtableId,reqToAirtable(updated)).catch(()=>{});}
    const u=requests.map(r=>r.id===id?updated:r);setRequests(u);persist(KEYS.req,u);
  }
  async function confirmCheckIn(req,returningNames,lostItemNames,notes){
    const today=todayDate();
    const allItemNames=(req.details?.itemsData||[]).map(i=>i.name);
    const alreadyReturned=req.returnedItems||[];
    const nowReturning=returningNames.filter(n=>!alreadyReturned.includes(n));
    const allReturnedAfter=[...alreadyReturned,...nowReturning];
    const allBack=allItemNames.every(n=>allReturnedAfter.includes(n)||lostItemNames.includes(n));
    const lateDays=allBack&&req.dueDate?countDaysLate(req.dueDate,today):0;
    const lateFine=lateDays*eqSettings.dailyRate;
    // Create Checking In records only for items being returned now
    const returningIds=(req.details?.itemsData||[]).filter(i=>nowReturning.includes(i.name)).map(i=>i.id).filter(Boolean);
    try{
      if(returningIds.length){
        const fields={"Type":"Checking In","Checked Out Gear":returningIds};
        if(req.studentId)fields["Submitted By"]=[req.studentId];
        await atPost(CHECKOUT_TABLE,fields);
      }
      if(allBack&&lateDays>0)await saveFineRecord({studNo:req.studNo,studentName:req.name,reqId:req.id,type:"late_return",itemName:"Equipment booking",amount:lateFine,days:lateDays,date:today,month:today.slice(0,7),notes});
      for(const item of lostItemNames){
        const cost=(req.details?.itemsData||[]).find(i=>i.name===item)?.replacementCost||500;
        await saveFineRecord({studNo:req.studNo,studentName:req.name,reqId:req.id,type:"lost_item",itemName:item,amount:cost,days:0,date:today,month:today.slice(0,7),notes});
      }
      for(const a of ciLostAccessories){
        await saveFineRecord({studNo:req.studNo,studentName:req.name,reqId:req.id,type:"lost_item",itemName:`${a.itemName} — ${a.accessory}`,amount:a.cost,days:0,date:today,month:today.slice(0,7),notes});
      }
    }catch(e){}
    const newStatus=allBack?"Returned":"Partially Returned";
    const updatedReq={...req,status:newStatus,returnedAt:allBack?today:req.returnedAt,returnedItems:allReturnedAfter,lateDays,lateFine};
    updateReq(req.id,{status:newStatus,returnedAt:allBack?today:req.returnedAt,returnedItems:allReturnedAfter,checkInNotes:notes,lostItems:[...(req.lostItems||[]),...lostItemNames],lateDays,lateFine});
    // Send return receipt email when fully returned
    if(allBack) sendStatusEmail(updatedReq,"Returned");
    setCheckInModal(null);setCiReturning([]);setCiLost([]);setCiNotes("");setCiLostAccessories([]);
  }
  function saveNote(id){
    const note=staffNotes[id]||"";
    const req=requests.find(r=>r.id===id);
    if(req?.airtableId){atPatch(REQUESTS_TABLE,req.airtableId,{StaffNote:note,UpdatedAt:todayISO()}).catch(()=>{});}
    const u=requests.map(r=>r.id===id?{...r,staffNote:note,updatedAt:todayISO()}:r);setRequests(u);persist(KEYS.req,u);
  }
  function updateSchedule(eqId,field,val){const u={...schedule,[eqId]:{...schedule[eqId],[field]:val}};setSchedule(u);persist(KEYS.sched,u);}
  function toggleDay(eqId,day){const curr=schedule[eqId]?.days||[];const u={...schedule,[eqId]:{...schedule[eqId],days:curr.includes(day)?curr.filter(d=>d!==day):[...curr,day].sort()}};setSchedule(u);persist(KEYS.sched,u);}
  function addBlock(){if(!blockDate||!blockReason.trim())return;const u={...blocks,[blockDate]:{reason:blockReason.trim(),createdAt:todayISO()}};setBlocks(u);persist(KEYS.block,u);setBlockDate("");setBlockReason("");}
  function removeBlock(k){const u={...blocks};delete u[k];setBlocks(u);persist(KEYS.block,u);}
  function logMaintenance(){if(!maintForm.equipmentId||!maintForm.date)return;const log={id:genId(),...maintForm,createdAt:todayISO()};const u=[log,...maintLogs];setMaintLogs(u);persist(KEYS.maint,u);setMaintForm({equipmentId:"",date:"",notes:"",status:"Done",duration:""});}
  function toggleLeave(){const u=leaveMode.active?{active:false,returnDate:"",message:""}:{...leaveMode,active:true};setLeaveMode(u);persist(KEYS.leave,u);}
  function saveLeave(){persist(KEYS.leave,leaveMode);}
  function updateItStatus(id,status){const u=itReferrals.map(r=>r.id===id?{...r,status,updatedAt:todayISO()}:r);setItReferrals(u);persist(KEYS.it,u);}
  function addItUpdate(id){const note=itUpdateNote[id];if(!note?.trim())return;const u=itReferrals.map(r=>r.id===id?{...r,updates:[...r.updates,{note:note.trim(),date:todayISO()}],updatedAt:todayISO()}:r);setItReferrals(u);persist(KEYS.it,u);setItUpdateNote(n=>({...n,[id]:""}));}
  function logItReferral(){if(!itForm.itemId||!itForm.description.trim())return;const item=IT_ITEMS.find(i=>i.id===itForm.itemId);const ref={id:genId(),itemId:itForm.itemId,itemLabel:item?.label||"",description:itForm.description.trim(),priority:itForm.priority,dateLogged:itForm.dateLogged,loggedWith:itForm.loggedWith.trim(),reference:itForm.reference.trim(),notes:itForm.notes.trim(),status:"Logged",updates:[],createdAt:todayISO(),updatedAt:todayISO()};const u=[ref,...itReferrals];setItReferrals(u);persist(KEYS.it,u);setItForm({itemId:"",description:"",priority:"Normal",dateLogged:todayDate(),loggedWith:"",reference:"",notes:""});}

  async function handleVerifyStudent(){
    if(!form.studNo.trim())return;
    setVerifyingStudent(true);setVerifyErr("");
    try{
      const result=await lookupStudent(form.studNo.trim());
      if(result?.found){setVerifiedStudent(result);if(rememberMe)localStorage.setItem(KEYS.savedStudNo,result.studNo);}
      else{setVerifyErr("Not found. Try your student number or full name.");}
    }catch(e){setVerifyErr("Could not connect. Please try again.");}
    setVerifyingStudent(false);
  }

  function getBookings(eqId,dateKey,slot){return requests.filter(r=>r.typeId===eqId&&r.schedDate&&r.schedDate.startsWith(dateKey)&&r.schedDate.includes(slot==="morning"?"(Morning)":"(Afternoon)")&&r.status!=="Declined"&&r.status!=="Cancelled").length;}
  function getReqsForDate(dateKey){return requests.filter(r=>r.schedDate&&r.schedDate.startsWith(dateKey));}

  // Equipment booking handlers
  async function handleEqLookup(){
    if(!eqStudNo.trim())return;
    setEqLooking(true);setEqLookupErr("");
    try{
      const result=await lookupStudent(eqStudNo.trim());
      if(result?.found){
        // If year is missing or unrecognised, treat as "other" (staff/visitor — gets masters cap & loan days)
        const yr=(result.year&&["1","2","3","4","m","s","o"].includes(result.year))?result.year:"o";
        const student={...result,year:yr};
        if(yr==="1"){
          setEqLookupErr("Equipment booking is available from 2nd year onwards. 1st year students can still log other requests at the main desk.");
        } else {
          setEqStudent(student);setEqScreen("browse");
          setEqLoading(true);
          const items=await fetchEquipment(yr);
          setEquipment(items);setEqLoading(false);
        }
      } else {
        setEqLookupErr("Not found. Try your student number or full name, or speak to Tech Support.");
      }
    }catch(e){setEqLookupErr("Could not connect. Please try again.");}
    setEqLooking(false);
  }
  function toggleEqItem(item){
    const cap=getItemCap(eqStudent?.year);
    setSelItems(prev=>{
      if(prev.find(i=>i.id===item.id)) return prev.filter(i=>i.id!==item.id);
      if(prev.length>=cap){setEqErr(`${YEAR_LABELS[eqStudent?.year]||"Your year"} can book up to ${cap} item${cap>1?"s":""} at a time.`);return prev;}
      setEqErr("");
      return [...prev,item];
    });
  }
  async function submitEqRequest(){
    if(!eqColDate||!eqSlot||selItems.length===0)return;
    const due=addCalendarDays(eqColDate,getLoanDays(eqStudent.year));
    setEqSubmitting(true);
    try{await createEquipmentBooking(eqStudent,selItems,eqColDate,eqSlot,due,eqNotes);}catch(e){}
    const slotLabel=EQ_COL_SLOTS.find(s=>s.id===eqSlot)?.label||eqSlot;
    const req={id:genId(),name:eqStudent.name,studNo:eqStudent.studNo,year:eqStudent.year,studentId:eqStudent.studentId,studentEmail:eqStudent.email||null,type:"Equipment booking",typeId:"equipment",when:"booked",schedDate:`${eqColDate} (${slotLabel})`,notes:eqNotes,details:{items:selItems.map(i=>i.name).join(", "),itemsData:selItems.map(i=>({id:i.id,name:i.name,type:i.type||"",image:i.image||"",replacementCost:i.replacementCost||500,accessories:i.accessories||[]}))},dueDate:due,collectedAt:null,returnedAt:null,returnedItems:[],checkInNotes:"",lostItems:[],lateDays:0,lateFine:0,status:"Pending",staffNote:"",isWalkIn:false,createdAt:todayISO(),updatedAt:todayISO()};
    const u=[req,...requests];setRequests(u);persist(KEYS.req,u);
    setEqScreen("success");setEqSubmitting(false);
    try{
      const result=await atPost(REQUESTS_TABLE,reqToAirtable(req));
      if(result.id){setRequests(prev=>prev.map(r=>r.id===req.id?{...r,airtableId:result.id}:r));}
      else{console.error("FATS: eq request save failed",result);}
    }catch(e){console.error("FATS: eq request save error",e);}
    // Send confirmation email to student (non-blocking)
    sendConfirmationEmail(req);
  }
  function resetEq(){setEqScreen("lookup");setEqStudNo("");setEqStudent(null);setEquipment([]);setSelItems([]);setEqFilter("All");setEqSearch("");setEqColDate("");setEqSlot("");setEqNotes("");setEqLookupErr("");setEqErr("");}

  const eqTypes=["All",...new Set(equipment.map(e=>e.type).filter(Boolean))];
  const eqFiltered=equipment.filter(e=>(eqFilter==="All"||e.type===eqFilter)&&(!eqSearch||e.name?.toLowerCase().includes(eqSearch.toLowerCase())));
  const sortedRequests=[...requests].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const filtered=filterStatus==="All"?sortedRequests:sortedRequests.filter(r=>r.status===filterStatus);
  const counts=STATUSES.reduce((a,s)=>({...a,[s]:requests.filter(r=>r.status===s).length}),{});
  const openIt=itReferrals.filter(r=>r.status!=="Resolved").length;
  const itFiltered=itFilter==="All"?itReferrals:itReferrals.filter(r=>r.status===itFilter);

  // ── TODAY FILTERS ────────────────────────────────────────────────
  const _today=todayDate();
  const morningToday=requests.filter(r=>r.schedDate?.startsWith(_today)&&r.schedDate.includes("Morning")&&["print","laser"].includes(r.typeId)&&r.status!=="Declined"&&r.status!=="Done");
  const afternoonToday=requests.filter(r=>r.schedDate?.startsWith(_today)&&r.schedDate.includes("Afternoon")&&["print","laser"].includes(r.typeId)&&r.status!=="Declined"&&r.status!=="Done");
  const studioToday=requests.filter(r=>r.typeId==="studio"&&r.schedDate?.startsWith(_today)&&r.status!=="Declined"&&r.status!=="Done");
  const eqCollectionsToday=requests.filter(r=>r.typeId==="equipment"&&r.schedDate?.startsWith(_today)&&r.status!=="Declined"&&r.status!=="Cancelled"&&r.status!=="Returned");
  const eqDueToday=requests.filter(r=>r.typeId==="equipment"&&r.dueDate===_today&&r.status!=="Returned"&&r.status!=="Declined"&&r.status!=="Cancelled");
  const eqOverdue=requests.filter(r=>r.typeId==="equipment"&&r.dueDate&&r.dueDate<_today&&r.status!=="Returned"&&r.status!=="Declined"&&r.status!=="Cancelled");

  // ── TODAY CARD ───────────────────────────────────────────────────
  const TodayCard=({req,actionLabel,actionStatus})=>{
    const typeInfo=REQUEST_TYPES.find(t=>t.id===req.typeId)||{};
    const typeColor=TYPE_COLOR[req.typeId]||"#6B7280";
    const d=req.details||{};
    let summary="";
    if(req.typeId==="print"){summary=[d.paperSize,d.paperType,d.colour,d.copies&&`×${d.copies}`].filter(v=>v&&!String(v).startsWith("Select")).join(", ");}
    else if(req.typeId==="laser"){summary=[d.material&&d.materialThickness?`${d.material} ${d.materialThickness}mm`:d.material,d.dimensions,d.jobType,d.sessionDuration,d.firstTime?"⭐ First time":null].filter(v=>v&&!String(v).startsWith("Select")).join(", ");}
    else if(req.typeId==="studio"){const sm=req.schedDate?.match(/\((.+?)\)/);summary=(d.shootType&&!d.shootType.startsWith("Select")?d.shootType+" · ":"")+(sm?sm[1]:"");}
    else if(req.typeId==="equipment"){summary=d.items||(d.itemsData||[]).map(i=>i.name).join(", ")||"Equipment";}
    const isOverdue=req.dueDate&&req.dueDate<_today;
    return(
      <div style={{display:"flex",alignItems:"stretch",background:"#141720",borderRadius:10,marginBottom:8,overflow:"hidden",border:isOverdue?"1px solid #7f1d1d":"0.5px solid #1e2130"}}>
        <div style={{width:4,flexShrink:0,background:typeColor}}/>
        <div style={{flex:1,padding:"10px 12px",minWidth:0}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
            <div style={{minWidth:0}}>
              <div style={{fontSize:11,color:typeColor,fontWeight:600,marginBottom:2}}>{typeInfo.icon} {typeInfo.label||req.type}</div>
              <div style={{fontSize:14,fontWeight:500,color:"#e0e3ea",lineHeight:1.2}}>
                {req.name}
                {req.studNo&&<span style={{fontWeight:400,fontSize:11,color:"#6b7280",marginLeft:6}}>#{req.studNo}</span>}
                {req.year&&<span style={{fontWeight:400,fontSize:11,color:"#6b7280",marginLeft:4}}>· Yr{req.year}</span>}
              </div>
              {summary&&<div style={{fontSize:12,color:"#6b7280",marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{summary}</div>}
              {isOverdue&&<div style={{fontSize:11,color:"#f87171",marginTop:2}}>⚠ Due {fmtDate(req.dueDate)} · {countBizDaysLate(req.dueDate,_today)}d late</div>}
              {req.dueDate&&!isOverdue&&req.typeId==="equipment"&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>↩ Due today</div>}
            </div>
            <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
              {pill(req.status)}
              {actionLabel&&req.status!==actionStatus&&req.status!=="Done"&&req.status!=="Returned"&&(
                <button onClick={()=>{if(req.typeId==="equipment"&&actionStatus==="Returned"){const items=(req.details?.itemsData||[]).map(i=>i.name).filter(n=>!(req.returnedItems||[]).includes(n));setCheckInModal(req);setCiReturning(items);setCiLost([]);setCiNotes("");}else{updateStatus(req.id,actionStatus);}}}
                  style={{fontSize:11,padding:"4px 10px",borderRadius:8,border:"none",background:typeColor,color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:500,whiteSpace:"nowrap"}}>{actionLabel}</button>
              )}
            </div>
          </div>
          {req.notes&&<div style={{fontSize:11,color:"#4b5563",marginTop:4,fontStyle:"italic"}}>"{req.notes}"</div>}
        </div>
      </div>
    );
  };

  // ── SHARED COMPONENTS ────────────────────────────────────────────
  const TabBar=()=>(
    <div style={{background:"#0F1117",borderBottom:"1px solid #1e2130",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:50,marginBottom:24,marginLeft:-20,marginRight:-20}}>
      <div>
        <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",letterSpacing:"-0.3px"}}>Fine Art Tech Support</div>
        <div style={{fontSize:11,color:"#4b5563",marginTop:1,letterSpacing:"0.01em"}}>Fine Art Department</div>
      </div>
      <div style={{display:"flex",background:"#1a1d28",borderRadius:10,padding:3,gap:2}}>
        {[["student","Student"],["dashboard","Staff"]].map(([v,l])=>(
          <button key={v} onClick={()=>{
          if(v==="dashboard"&&!staffUnlocked){setView("pin");setScreen("home");setPinInput("");setPinErr("");return;}
          setView(v);setScreen("home");setSelType(null);setPrepOk(false);setSelDate(null);setSelSlot(null);setDashTab("today");setLabExpanded(false);setLabChoice("");setVerifiedStudent(null);setVerifyErr("");setCheckStudNo("");setCheckResults(null);setVisitorType("student");setExtForm({name:"",affiliation:"",contact:""});if(v==="student"){setEqScreen("lookup");}
        }} style={{padding:"7px 18px",borderRadius:8,background:view===v?"#22263a":"transparent",color:view===v?"#e0e3ea":"#6b7280",fontSize:13,fontWeight:view===v?600:400,border:"none",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>{l}</button>
        ))}
      </div>
    </div>
  );
  const Back=({to,label="← Back",extra=()=>{}})=>(
    <button onClick={()=>{setScreen(to);if(to==="home"){setSelType(null);setPrepOk(false);setSelDate(null);setSelSlot(null);setLabExpanded(false);setLabChoice("");setVerifiedStudent(null);setVerifyErr("");setVisitorType("student");setExtForm({name:"",affiliation:"",contact:""});}extra();}}
      style={{background:"none",border:"none",color:"#4b5563",fontSize:13,fontWeight:400,cursor:"pointer",padding:"0 0 18px 0",display:"flex",alignItems:"center",gap:4}}>{label}</button>
  );

  const CalendarPicker=({eqId})=>{
    const sched=schedule[eqId]||{days:[],morningSlots:1,afternoonSlots:1,minAdvanceDays:0};
    const today=new Date();today.setHours(0,0,0,0);
    const minAllowed=sched.minAdvanceDays?addBusinessDays(todayDate(),sched.minAdvanceDays):null;
    const firstDay=new Date(calYear,calMonth,1).getDay();
    const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
    const cells=[];for(let i=0;i<firstDay;i++)cells.push(null);for(let d=1;d<=daysInMonth;d++)cells.push(d);
    const isAvail=(d)=>{const date=new Date(calYear,calMonth,d);if(date<today)return false;const k=toKey(calYear,calMonth,d);if(minAllowed&&k<minAllowed)return false;if(blocks[k])return false;if(!sched.days.includes(date.getDay()))return false;return getBookings(eqId,k,"morning")<sched.morningSlots||getBookings(eqId,k,"afternoon")<sched.afternoonSlots;};
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>‹</button>
          <div style={{fontWeight:500,fontSize:15}}>{MONTHS[calMonth]} {calYear}</div>
          <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#9ca3af"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>{DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:"#6b7280",fontWeight:500}}>{d}</div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:12}}>
          {cells.map((d,i)=>{if(!d)return<div key={i}/>;const avail=isAvail(d);const blocked=!!blocks[toKey(calYear,calMonth,d)];const k=toKey(calYear,calMonth,d);const sel=selDate===k;const past=new Date(calYear,calMonth,d)<new Date(new Date().setHours(0,0,0,0));return(
            <div key={i} onClick={()=>avail&&(setSelDate(k),setSelSlot(null))} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,fontSize:12,cursor:avail?"pointer":"default",background:sel?TEAL:blocked?"#2a0a0a":avail?"#0a2218":"transparent",color:sel?"#fff":blocked?"#f87171":avail?"#20B07F":past?"#374151":"#4b5563",fontWeight:sel?500:400}}>{d}</div>
          );})}
        </div>
        {selDate&&(()=>{
          const mFull=getBookings(eqId,selDate,"morning")>=sched.morningSlots;
          const aFull=getBookings(eqId,selDate,"afternoon")>=sched.afternoonSlots;
          const stockroomDay=EQ_COL_DAYS.includes(new Date(selDate+"T00:00:00").getDay());
          return(
          <div style={{marginBottom:12}}>
            <div style={{fontSize:13,color:"#9ca3af",marginBottom:8,fontWeight:500}}>{selDate} — choose a slot:</div>
            {stockroomDay&&<div style={{fontSize:12,color:"#d4851a",background:"#2a1f0a",borderRadius:8,padding:"6px 10px",marginBottom:8}}>⚠ Morning slot unavailable — stockroom collections run 11:00–12:30 on this day.</div>}
            <div style={{display:"flex",gap:8}}>
              {[["morning","🌅 Morning (09:00–12:00)",mFull||stockroomDay,stockroomDay?"Stockroom day":`${sched.morningSlots-getBookings(eqId,selDate,"morning")} left`],["afternoon","🌆 Afternoon (13:00–16:00)",aFull,`${sched.afternoonSlots-getBookings(eqId,selDate,"afternoon")} left`]].map(([v,l,full,sub])=>(
                <button key={v} onClick={()=>!full&&setSelSlot(v)} disabled={full} style={{flex:1,padding:"10px 8px",borderRadius:10,border:selSlot===v?`2px solid ${TEAL}`:"0.5px solid #1e2130",background:full?"#1a1d28":selSlot===v?"#0a2218":"#141720",color:full?"#374151":selSlot===v?TEAL:"#e0e3ea",fontSize:13,cursor:full?"not-allowed":"pointer",fontFamily:"inherit"}}>
                  {l}<br/><span style={{fontSize:11,color:full?"#374151":"#6b7280"}}>{full&&sub==="Stockroom day"?"Unavailable":full?"Full":sub}</span>
                </button>
              ))}
            </div>
          </div>
        );})()}
      </div>
    );
  };

  // ── STAFF PIN ────────────────────────────────────────────────────
  if(view==="pin") return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:32,paddingBottom:16,borderBottom:"1px solid #1e2130"}}>
        <div><div style={{fontSize:15,fontWeight:600,color:"#e0e3ea"}}>Fine Art Tech Support</div><div style={{fontSize:11,color:"#4b5563",marginTop:1}}>Fine Art Department</div></div>
        <button onClick={()=>setView("student")} style={{background:"none",border:"none",color:"#6b7280",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>
      </div>
      <div style={{textAlign:"center",padding:"1rem 0 2rem"}}>
        <div style={{fontSize:36,marginBottom:12}}>🔒</div>
        <div style={{fontSize:18,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>Staff access</div>
        <div style={{fontSize:13,color:"#4b5563",marginBottom:28}}>Enter your PIN to continue</div>
        <input type="password" inputMode="numeric" maxLength={6} style={{...ipt,textAlign:"center",fontSize:24,letterSpacing:"0.4em",maxWidth:200,margin:"0 auto 16px"}} value={pinInput} onChange={e=>{setPinInput(e.target.value);setPinErr("");}} onKeyDown={e=>e.key==="Enter"&&(()=>{const stored=localStorage.getItem(KEYS.staffPin)||DEFAULT_PIN;if(pinInput===stored){sessionStorage.setItem("fats_staff_unlocked","1");setStaffUnlocked(true);setView("dashboard");setScreen("home");}else{setPinErr("Incorrect PIN. Try again.");}})()}  placeholder="••••" autoFocus/>
        {pinErr&&<div style={{fontSize:13,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"10px 12px",marginBottom:16}}>{pinErr}</div>}
        <Btn full style={{maxWidth:200,margin:"0 auto",display:"block"}} onClick={()=>{const stored=localStorage.getItem(KEYS.staffPin)||DEFAULT_PIN;if(pinInput===stored){sessionStorage.setItem("fats_staff_unlocked","1");setStaffUnlocked(true);setView("dashboard");setScreen("home");}else{setPinErr("Incorrect PIN. Try again.");}}}>Unlock →</Btn>
      </div>
    </div>
  );

  // ── STUDENT HOME ─────────────────────────────────────────────────
  if(view==="student"&&screen==="home") return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      <TabBar/>
      <div style={{fontSize:20,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>Fine Art Tech Support</div>
      <div style={{fontSize:13,color:"#4b5563",marginBottom:8}}>Fine Art Department</div>
      {leaveMode.active?(
        <div style={{background:"#2a1f0a",borderRadius:10,padding:"16px",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:8}}>🏖️</div>
          <div style={{fontWeight:500,fontSize:15,color:"#d4851a",marginBottom:4}}>Tech Support is on leave</div>
          {leaveMode.returnDate&&<div style={{fontSize:14,color:"#d4851a",marginBottom:4}}>Returning: {fmtDate(leaveMode.returnDate)}</div>}
          {leaveMode.message&&<div style={{fontSize:13,color:"#d4851a"}}>{leaveMode.message}</div>}
          <div style={{fontSize:12,color:"#d4851a",marginTop:8}}>Requests cannot be submitted while staff is on leave.</div>
        </div>
      ):(<>
        <div style={{fontSize:12,color:"#fb923c",background:"#2a1500",borderRadius:8,padding:"8px 12px",marginBottom:20}}>⚠️ You must submit a request before coming in person. No request = no assistance.</div>
        {/* ── Service grid ── */}
        <div style={{fontSize:11,color:"#4b5563",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:500,marginBottom:10}}>Request a service</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
          {REQUEST_TYPES.filter(t=>LAB_IDS.includes(t.id)).map(t=>(
            <div key={t.id} onClick={()=>{setSelType(t.id);setScreen(t.prep.length>0?"prep":"form");setPrepOk(false);setSelDate(null);setSelSlot(null);setForm(f=>({...f,name:"",studNo:localStorage.getItem(KEYS.savedStudNo)||"",year:"",when:"walkin",schedDate:"",notes:""}));}}
              style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px",cursor:"pointer"}}>
              <div style={{fontSize:18,marginBottom:6}}>{t.icon}</div>
              <div style={{fontSize:12,fontWeight:500,color:"#c9cdd6",lineHeight:1.3}}>{t.label}</div>
              <div style={{fontSize:10,color:"#4b5563",marginTop:2}}>{t.booking}</div>
            </div>
          ))}
        </div>
        {/* Equipment + check request — wide action buttons */}
        <div onClick={()=>{setScreen("equipment");setEqScreen("lookup");}} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"11px 14px",marginBottom:8,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,height:28,borderRadius:8,background:"#1a1e2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>📷</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:500,color:"#c9cdd6"}}>Equipment booking</div>
            <div style={{fontSize:10,color:"#4b5563"}}>Cameras, tripods & more</div>
          </div>
          <span style={{color:"#374151",fontSize:14}}>›</span>
        </div>
        <div onClick={()=>{setScreen("check");setCheckStudNo("");setCheckResults(null);setMyFines(null);}} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"11px 14px",marginBottom:16,cursor:"pointer",display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:28,height:28,borderRadius:8,background:"#1a2e25",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>📋</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:500,color:"#c9cdd6"}}>Check my request</div>
            <div style={{fontSize:10,color:"#4b5563"}}>View status & updates</div>
          </div>
          <span style={{color:"#374151",fontSize:14}}>›</span>
        </div>
        {/* Other services — compact list */}
        <div style={{fontSize:11,color:"#4b5563",textTransform:"uppercase",letterSpacing:"0.08em",fontWeight:500,marginBottom:8}}>Other services</div>
        {REQUEST_TYPES.filter(t=>!LAB_IDS.includes(t.id)&&t.id!=="equipment").map(t=>(
          <div key={t.id} onClick={()=>{setSelType(t.id);setScreen(t.prep.length>0?"prep":"form");setPrepOk(false);setSelDate(null);setSelSlot(null);setForm(f=>({...f,name:"",studNo:localStorage.getItem(KEYS.savedStudNo)||"",year:"",when:"walkin",schedDate:"",notes:""}));}}
            style={{display:"flex",alignItems:"center",gap:12,background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"10px 14px",marginBottom:6,cursor:"pointer"}}>
            <span style={{fontSize:18}}>{t.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{t.label}</div>
              <div style={{fontSize:11,color:"#4b5563",marginTop:1}}>{t.booking}</div>
            </div>
            <span style={{color:"#374151"}}>›</span>
          </div>
        ))}
      </>)}
    </div>
  );

  // ── CHECK STATUS ────────────────────────────────────────────────
  if(view==="student"&&screen==="check") {
    async function runCheckSearch(rawQ){
      const q=(rawQ||checkStudNo).trim();
      if(!q)return;
      localStorage.setItem("fats_last_check",q);
      setCheckResults(null);setMyFines(null);setMyFinesLoading(true);
      // Always fetch fresh data from Airtable so status is live
      let freshReqs=requests;
      try{
        const data=await atGet(REQUESTS_TABLE,{maxRecords:500});
        if(data.records){
          freshReqs=data.records.map(airtableToReq).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
          setRequests(freshReqs);persist(KEYS.req,freshReqs);
        }
      }catch(e){}
      const lower=q.toLowerCase();
      const res=freshReqs.filter(r=>r.studNo?.toLowerCase()===lower||r.name?.toLowerCase().includes(lower));
      setCheckResults(res);
      try{
        const ids=[...new Set(res.flatMap(r=>r.details?.itemsData?.map(i=>i.id)||[]).filter(Boolean))];
        if(ids.length){const imgs=await fetchEqImagesByIds(ids);setEqCheckImages(imgs);}
        const f=await fetchFinesForStudent(q);setMyFines(f);
      }catch(e){setMyFines([]);}
      setMyFinesLoading(false);
    }
    // Auto-fill + auto-search from last session
    const _savedCheck=localStorage.getItem("fats_last_check");
    if(_savedCheck&&!checkStudNo&&checkResults===null){setCheckStudNo(_savedCheck);setTimeout(()=>runCheckSearch(_savedCheck),0);}
  return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      <TabBar/><Back to="home" extra={()=>{setCheckStudNo("");setCheckResults(null);setMyFines(null);}}/>
      <div style={{fontSize:18,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>Check my request</div>
      <div style={{fontSize:13,color:"#4b5563",marginBottom:20}}>Enter your student number or name to see your submissions and charges</div>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <input style={{...ipt,flex:1}} value={checkStudNo} onChange={e=>setCheckStudNo(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&checkStudNo.trim())runCheckSearch();}} placeholder="e.g. g25K7744 or your name" autoFocus/>
        <Btn onClick={()=>runCheckSearch()} disabled={!checkStudNo.trim()}>Search</Btn>
        {checkResults!==null&&<button onClick={()=>runCheckSearch()} style={{background:"#1a1d28",border:"0.5px solid #2a2d3e",borderRadius:8,color:"#9ca3af",fontSize:13,padding:"0 12px",cursor:"pointer",fontFamily:"inherit"}}>↻ Refresh</button>}
      </div>
      {checkResults!==null&&checkResults.length===0&&(
        <div style={{textAlign:"center",padding:"2rem",color:"#374151",fontSize:14}}>No requests found for <strong style={{color:"#e0e3ea"}}>{checkStudNo}</strong>.</div>
      )}
      {checkResults!==null&&(()=>{
        const ARCHIVE_STATUSES=["Returned","Declined","Cancelled","Uncollected","Done"];
        const active=checkResults.filter(r=>!ARCHIVE_STATUSES.includes(r.status));
        const archived=checkResults.filter(r=>ARCHIVE_STATUSES.includes(r.status));
        const ReqCard=({req})=>(
        <div key={req.id} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:14,padding:"16px 18px",marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
            <div>
              <div style={{fontWeight:500,fontSize:14,color:"#e0e3ea"}}>{REQUEST_TYPES.find(t=>t.id===req.typeId)?.icon} {req.type}</div>
              <div style={{fontSize:12,color:"#4b5563",marginTop:2}}>{req.schedDate?`📅 ${req.schedDate}`:req.when==="walkin"?"Walk-in":""} · {fmt(req.createdAt)}</div>
            </div>
            {pill(req.status)}
          </div>
          {req.typeId==="equipment"&&req.details?.itemsData?.length>0&&(
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
              {req.details.itemsData.map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,background:"#1a1d28",borderRadius:10,padding:"6px 10px 6px 6px",minWidth:0}}>
                  {(eqCheckImages[item.id]||item.image)
                    ?<img src={eqCheckImages[item.id]||item.image} alt={item.name} style={{width:44,height:44,objectFit:"cover",borderRadius:7,flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
                    :<div style={{width:44,height:44,background:"#1e2130",borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>📷</div>
                  }
                  <div>
                    <div style={{fontSize:12,fontWeight:500,color:"#e0e3ea",lineHeight:1.3}}>{item.name}</div>
                    {item.type&&<div style={{fontSize:11,color:"#4b5563"}}>{item.type}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
          {req.typeId==="equipment"&&req.dueDate&&(
            <div style={{fontSize:12,color:req.status==="Collected"&&new Date()>new Date(req.dueDate+"T00:00:00")?"#f87171":"#6b7280",background:req.status==="Collected"&&new Date()>new Date(req.dueDate+"T00:00:00")?"#2a0f14":"#1a1d28",borderRadius:8,padding:"6px 10px",marginBottom:6}}>
              📅 Due: <strong>{fmtDate(req.dueDate)}</strong>{req.status==="Collected"&&new Date()>new Date(req.dueDate+"T00:00:00")?" — OVERDUE":""}
            </div>
          )}
          {req.status==="Confirmed"&&<div style={{background:"#0a2218",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#20B07F",marginBottom:6}}>⏳ Booking confirmed — your slot is reserved{req.schedDate?` for ${req.schedDate.split(" ")[0]}`:""}.  Wait for a <strong>"Ready to collect"</strong> notification before coming in.</div>}
          {req.status==="Ready to collect"&&<div style={{background:"#0a2218",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#20B07F",marginBottom:6}}>📦 Your equipment is ready to collect. Bring your student card.</div>}
          {req.status==="Done"&&<div style={{background:"#0a2218",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#20B07F",marginBottom:6}}>✅ Done — your request has been completed.</div>}
          {req.status==="Declined"&&<div style={{background:"#2a0f14",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#f87171",marginBottom:6}}>❌ Declined{req.staffNote?` — ${req.staffNote}`:". Please contact Tech Support for more info."}.</div>}
          {req.status==="Cancelled"&&<div style={{background:"#1a1a2a",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#9ca3af",marginBottom:6}}>🚫 Cancelled{req.staffNote?` — ${req.staffNote}`:". This request has been cancelled."}.</div>}
          {req.status==="Pending"&&<div style={{background:"#2a1f0a",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#d4851a",marginBottom:6}}>⏳ Pending — Tech Support will review your request. Check back soon.</div>}
          {req.typeId==="laser"&&req.status==="Material test required"&&(
            <div style={{background:"#2a1500",borderRadius:10,padding:"12px 14px",marginBottom:6,borderLeft:"4px solid #E65C00"}}>
              <div style={{fontSize:13,fontWeight:600,color:"#E65C00",marginBottom:4}}>🧪 Material test required</div>
              <div style={{fontSize:13,color:"#9ca3af",lineHeight:1.6}}>Before your job can be cut, Tech Support needs to run a short test on your material to confirm settings. <strong>Come in during your booked slot</strong> and bring your material. The test takes about 5–10 minutes.</div>
              {req.staffNote&&<div style={{fontSize:12,color:"#d4851a",marginTop:6}}>📝 {req.staffNote}</div>}
            </div>
          )}
          {req.typeId==="laser"&&req.status==="Ready to cut"&&(
            <div style={{background:"#0a2218",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#20B07F",marginBottom:6}}>✅ Test passed — your job is ready to cut. Come in at your booked time.</div>
          )}
          {req.staffNote&&req.status!=="Declined"&&<div style={{fontSize:12,color:"#60a5fa",background:"#0a1e35",borderRadius:8,padding:"6px 10px",marginBottom:6}}>📝 {req.staffNote}</div>}
          <div style={{fontSize:11,color:"#374151",textAlign:"right"}}>Ref: {req.id.slice(0,8).toUpperCase()}</div>
        </div>);
        return(<>
          {active.length===0&&archived.length>0&&<div style={{textAlign:"center",padding:"1.5rem",color:"#374151",fontSize:14}}>No active requests — check your archive below.</div>}
          {active.length===0&&archived.length===0&&null}
          {active.map(req=><ReqCard key={req.id} req={req}/>)}
          {/* Archive toggle */}
          {archived.length>0&&(
            <div style={{marginTop:4,marginBottom:8}}>
              <button onClick={()=>setCheckShowArchive(v=>!v)} style={{width:"100%",background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"space-between",fontFamily:"inherit",color:"#6b7280",fontSize:13}}>
                <span>📁 Past requests ({archived.length})</span>
                <span style={{fontSize:16}}>{checkShowArchive?"▲":"▼"}</span>
              </button>
              {checkShowArchive&&<div style={{marginTop:8}}>{archived.map(req=><ReqCard key={req.id} req={req}/>)}</div>}
            </div>
          )}
        </>);
      })()}
      {/* Outstanding charges */}
      {(myFinesLoading||myFines!==null)&&(
        <div style={{marginTop:8}}>
          <div style={{fontSize:15,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>💳 Your outstanding charges</div>
          {myFinesLoading&&<div style={{textAlign:"center",padding:"1rem",color:"#6b7280",fontSize:13}}>Loading charges...</div>}
          {!myFinesLoading&&myFines!==null&&(()=>{
            const unsettled=myFines.filter(f=>!f["Settled"]);
            const total=unsettled.reduce((s,f)=>s+(f["Amount (R)"]||0),0);
            if(unsettled.length===0)return<div style={{background:"#0a2218",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#20B07F"}}>✅ No outstanding charges — keep it up!</div>;
            return(<>
              <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,overflow:"hidden",marginBottom:8}}>
                {unsettled.map((f,i)=>(
                  <div key={f.id||i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,fontSize:12,color:"#e0e3ea",padding:"10px 12px",borderTop:i>0?"0.5px solid #1e2130":"none",alignItems:"center"}}>
                    <div><div style={{color:f["Type"]==="Late Return"?"#c2410c":"#b91c1c",fontWeight:500}}>{f["Type"]}</div><div style={{color:"#6b7280",fontSize:11}}>{f["Item Name"]} · {f["Date"]||""}</div></div>
                    <span style={{fontWeight:600}}>R{f["Amount (R)"]||0}</span>
                  </div>
                ))}
              </div>
              <div style={{background:"#2a0f14",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#f87171",fontWeight:600,marginBottom:6}}>Total owed: R{total}</div>
              <div style={{fontSize:12,color:"#374151"}}>Charges are added to your student account by the department at month end.</div>
            </>);
          })()}
        </div>
      )}
    </div>
  );}

  // ── EQUIPMENT BOOKING SCREENS ────────────────────────────────────
  if(view==="student"&&screen==="equipment") {
    // Lookup screen
    if(eqScreen==="lookup") return(
      <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
        <TabBar/>
        <Back to="home" label="← Back"/>
        <div style={{fontSize:18,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>Equipment Booking</div>
        <div style={{fontSize:13,color:"#4b5563",marginBottom:20}}>Enter your student number or name to see available equipment</div>
        <div style={{background:"#0a1e35",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13,color:"#60a5fa"}}>
          Your year is verified automatically — equipment available to your year will be shown.
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Student number or name *</label>
          <input style={{...ipt,fontSize:16,letterSpacing:"0.05em"}} value={eqStudNo} onChange={e=>setEqStudNo(e.target.value.trim())} onKeyDown={e=>e.key==="Enter"&&handleEqLookup()} placeholder="e.g. g25K7744 or your name" autoFocus/>
          {eqLookupErr&&<div style={{marginTop:8,fontSize:13,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"10px 12px"}}>⚠️ {eqLookupErr}</div>}
        </div>
        <Btn onClick={handleEqLookup} disabled={!eqStudNo.trim()||eqLooking} full style={{padding:"13px",fontSize:15}}>
          {eqLooking?"Verifying...":"Find my equipment →"}
        </Btn>
      </div>
    );

    // Browse screen
    if(eqScreen==="browse") return(
      <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
        <TabBar/>
        <button onClick={()=>{setEqScreen("lookup");}} style={{background:"none",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer",padding:"0 0 12px 0",display:"block"}}>← Back</button>
        <div style={{background:"#0a2218",border:"0.5px solid #20B07F",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:14,fontWeight:500,color:"#20B07F"}}>👋 {eqStudent?.name}</div><div style={{fontSize:12,color:"#20B07F"}}>{eqStudent?.studNo} · {YEAR_LABELS[eqStudent?.year]||`Year ${eqStudent?.year}`}</div></div>
          {selItems.length>0&&<Btn small onClick={()=>setEqScreen("confirm")} color={TEAL}>Book {selItems.length} item{selItems.length>1?"s":""}</Btn>}
        </div>
        <div style={{fontSize:15,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>Available for {YEAR_LABELS[eqStudent?.year]}</div>
        <div style={{fontSize:13,color:"#4b5563",marginBottom:4}}>Tap to select items · Max {getItemCap(eqStudent?.year)} item{getItemCap(eqStudent?.year)>1?"s":""} per booking</div>
        {eqErr&&<div style={{fontSize:13,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"8px 12px",marginBottom:8}}>{eqErr}</div>}
        <input style={{...ipt,marginBottom:10}} placeholder="Search..." value={eqSearch} onChange={e=>setEqSearch(e.target.value)}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          {eqTypes.map(t=><button key={t} onClick={()=>setEqFilter(t)} style={{padding:"5px 12px",borderRadius:20,border:"0.5px solid #1e2130",background:eqFilter===t?TEAL:"#141720",color:eqFilter===t?"#fff":"#6b7280",fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{t}</button>)}
        </div>
        {eqLoading&&<div style={{textAlign:"center",padding:"3rem",color:"#6b7280"}}><div style={{fontSize:28,marginBottom:8}}>⏳</div><div style={{fontSize:14}}>Loading equipment...</div></div>}
        {!eqLoading&&eqFiltered.length===0&&<div style={{textAlign:"center",padding:"3rem",color:"#6b7280",fontSize:14}}>No equipment available for {YEAR_LABELS[eqStudent?.year]}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:selItems.length>0?80:0}}>
          {eqFiltered.map(item=>{
            const sel=!!selItems.find(i=>i.id===item.id);
            return(
              <div key={item.id} onClick={()=>toggleEqItem(item)} style={{background:"#141720",border:sel?`2px solid ${TEAL}`:"0.5px solid #1e2130",borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative"}}>
                {sel&&<div style={{position:"absolute",top:8,right:8,background:TEAL,borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,zIndex:1}}>✓</div>}
                {item.image?<img src={item.image} alt={item.name||""} style={{width:"100%",height:120,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none";}}/>:<div style={{height:120,background:"#1a1d28",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>📷</div>}
                <div style={{padding:"10px 10px 12px"}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea",marginBottom:3,lineHeight:1.3}}>{item.name||"Unnamed"}</div>
                  <div style={{fontSize:11,color:"#4b5563",marginBottom:4}}>{item.type}</div>
                  <div style={{display:"inline-block",fontSize:10,padding:"2px 7px",borderRadius:20,background:item.equipmentStatus==="Fully Functional"?"#0a2218":"#2a1f0a",color:item.equipmentStatus==="Fully Functional"?"#20B07F":"#d4851a"}}>{item.equipmentStatus}</div>
                </div>
              </div>
            );
          })}
        </div>
        {selItems.length>0&&(
          <div style={{position:"sticky",bottom:0,background:"#0F1117",borderTop:"0.5px solid #1e2130",padding:"12px 0",marginTop:8}}>
            <Btn onClick={()=>setEqScreen("confirm")} full style={{padding:"13px",fontSize:15}}>Continue with {selItems.length} item{selItems.length>1?"s":""} →</Btn>
          </div>
        )}
      </div>
    );

    // Confirm screen
    if(eqScreen==="confirm") return(
      <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
        <TabBar/>
        <button onClick={()=>setEqScreen("browse")} style={{background:"none",border:"none",color:"#9ca3af",fontSize:13,cursor:"pointer",padding:"0 0 12px 0",display:"block"}}>← Back</button>
        <div style={{fontSize:18,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>Book collection slot</div>
        <div style={{fontSize:13,color:"#4b5563",marginBottom:16}}>{eqStudent?.name} · {YEAR_LABELS[eqStudent?.year]}</div>
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:500,color:"#6b7280",marginBottom:10}}>Selected ({selItems.length}):</div>
          {selItems.map(item=>(
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              {item.image?<img src={item.image} style={{width:40,height:40,objectFit:"cover",borderRadius:8,flexShrink:0}} alt=""/>:<div style={{width:40,height:40,background:"#1e2130",borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📷</div>}
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{item.name}</div><div style={{fontSize:11,color:"#4b5563"}}>{item.type}</div></div>
              <button onClick={()=>toggleEqItem(item)} style={{background:"none",border:"none",color:"#374151",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>
            </div>
          ))}
        </div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Collection date *</label>
          <input type="date" style={ipt} value={eqColDate} min={getEqMinDate()} max={addBusinessDays(todayDate(),eqSettings.maxAdvanceDays)} onChange={e=>{setEqColDate(e.target.value);setEqSlot("");}}/>
          <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Collection days: <strong>Mon, Wed, Fri</strong> only (stockroom hours 11:00–12:30). Book up to {eqSettings.maxAdvanceDays} day{eqSettings.maxAdvanceDays!==1?"s":""} ahead. Bookings close at {eqSettings.collectionDeadlineHour}:00.</div>
          {eqColDate&&!isEqColDay(eqColDate)&&<div style={{fontSize:12,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"8px 10px",marginTop:6}}>⚠️ That date is not a stockroom day. Please pick a Monday, Wednesday or Friday.</div>}
        </div>
        {eqColDate&&isEqColDay(eqColDate)&&eqDueDate&&(
          <div style={{background:"#0a2218",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#20B07F"}}>
            📅 Equipment due back: <strong>{fmtDate(eqDueDate)}</strong> <span style={{fontSize:12,opacity:0.8}}>({getLoanDays(eqStudent?.year)} business days for {YEAR_LABELS[eqStudent?.year]||`Year ${eqStudent?.year}`})</span>
          </div>
        )}
        {eqColDate&&isEqColDay(eqColDate)&&(
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Collection slot *</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {EQ_COL_SLOTS.map(slot=>{
              const taken=requests.filter(r=>r.typeId==="equipment"&&r.schedDate&&r.schedDate.startsWith(eqColDate)&&r.schedDate.includes(slot.label)&&!["Declined","Uncollected"].includes(r.status)).length;
              const full=taken>=(eqSettings.slotCap||2);
              const past=isSlotPast(slot.label);
              const unavail=full||past;
              return(
                <button key={slot.id} onClick={()=>!unavail&&setEqSlot(slot.id)} disabled={unavail} style={{flex:1,minWidth:100,padding:"12px 8px",borderRadius:10,border:eqSlot===slot.id?`2px solid ${TEAL}`:"0.5px solid #1e2130",background:unavail?"#1a1d28":eqSlot===slot.id?"#0a2218":"#141720",color:unavail?"#374151":eqSlot===slot.id?TEAL:"#e0e3ea",fontSize:13,cursor:unavail?"not-allowed":"pointer",fontFamily:"inherit",textAlign:"center"}}>
                  {slot.label}<br/><span style={{fontSize:11,color:unavail?"#374151":eqSlot===slot.id?TEAL:"#4b5563"}}>{past?"Passed":full?"Full":`${(eqSettings.slotCap||2)-taken} left`}</span>
                </button>
              );
            })}
          </div>
        </div>
        )}
        <div style={{marginBottom:20}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Notes (optional)</label><textarea style={{...ipt,resize:"vertical"}} rows={2} value={eqNotes} onChange={e=>setEqNotes(e.target.value)} placeholder="e.g. Need camera for location shoot Thursday"/></div>
        <div style={{background:"#2a1f0a",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#d4851a"}}>⚠️ Do not come to collect until Tech Support confirms. Bring your student card.</div>
        <Btn onClick={submitEqRequest} disabled={!eqColDate||!isEqColDay(eqColDate)||!eqSlot||eqSubmitting} full style={{padding:"13px",fontSize:15}}>{eqSubmitting?"Submitting...":"Submit equipment request"}</Btn>
      </div>
    );

    // Success screen
    if(eqScreen==="success") return(
      <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem",textAlign:"center"}}>
        <TabBar/>
        <div style={{padding:"2rem 1rem"}}>
          <div style={{fontSize:52,marginBottom:16}}>📷</div>
          <div style={{fontSize:18,fontWeight:500,marginBottom:8}}>Request submitted!</div>
          <div style={{fontSize:14,color:"#e0e3ea",marginBottom:4}}>{eqStudent?.name} — {YEAR_LABELS[eqStudent?.year]}</div>
          <div style={{fontSize:13,color:"#9ca3af",marginBottom:16}}>{selItems.length} item{selItems.length>1?"s":""} · {eqColDate} · {EQ_COL_SLOTS.find(s=>s.id===eqSlot)?.label||eqSlot}</div>
          <div style={{background:"#0a2218",borderRadius:8,padding:"10px 14px",marginBottom:10,fontSize:13,color:"#20B07F"}}>✅ Request submitted — check your request status to see when it's confirmed for collection.</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:24}}>Bring your student card when collecting.</div>
          <Btn outline color="#888" onClick={()=>{resetEq();setScreen("home");}} style={{color:"#9ca3af",border:"0.5px solid #1e2130",background:"transparent"}}>← Back to home</Btn>
        </div>
      </div>
    );
  }

  // ── PREP ────────────────────────────────────────────────────────
  if(view==="student"&&screen==="prep"&&type) return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      <TabBar/><Back to="home"/>
      <div style={{fontSize:17,fontWeight:500,color:"#e0e3ea",marginBottom:16}}>{type.icon} {type.label}</div>
      <div style={{background:"#2a1f0a",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:500,color:"#d4851a",marginBottom:10}}>Before you submit — make sure you have:</div>
        {type.prep.map((p,i)=><div key={i} style={{fontSize:13,color:p.startsWith("⚠️")?"#f87171":"#9ca3af",marginBottom:6,display:"flex",gap:8,alignItems:"flex-start"}}><span style={{flexShrink:0}}>{p.startsWith("⚠️")?"":"✓"}</span><span>{p}</span></div>)}
      </div>
      {type.id==="laser"&&(
        <a href="/laser-guide.html" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,background:"#0a1e35",border:"0.5px solid #1e3a5f",borderRadius:10,padding:"12px 14px",marginBottom:16,textDecoration:"none"}}>
          <span style={{fontSize:20}}>📄</span>
          <div>
            <div style={{fontSize:13,fontWeight:500,color:"#60a5fa"}}>Laser File Preparation Guide</div>
            <div style={{fontSize:12,color:"#4b5563"}}>File setup, colour coding, banned materials &amp; examples — opens in new tab</div>
          </div>
          <span style={{marginLeft:"auto",color:"#374151",fontSize:14}}>↗</span>
        </a>
      )}
      {type.needsFiles&&<label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",marginBottom:20,background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px"}}>
        <input type="checkbox" checked={prepOk} onChange={e=>setPrepOk(e.target.checked)} style={{marginTop:2,width:16,height:16,flexShrink:0}}/>
        <span style={{fontSize:14,color:"#e0e3ea"}}>I have everything ready and understand the requirements</span>
      </label>}
      <Btn onClick={()=>setScreen(type.bookable?"calendar":"form")} disabled={type.needsFiles&&!prepOk} full style={{padding:"13px",fontSize:15}}>{type.bookable?"Choose a date →":"Continue to request form →"}</Btn>
    </div>
  );

  // ── CALENDAR ────────────────────────────────────────────────────
  if(view==="student"&&screen==="calendar"&&type) return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      <TabBar/><Back to="prep"/>
      <div style={{fontSize:17,fontWeight:500,marginBottom:4}}>{type.icon} {type.label}</div>
      <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Select an available date and slot</div>
      <CalendarPicker eqId={selType}/>
      {selDate&&selSlot&&<Btn onClick={()=>setScreen("form")} full style={{padding:"13px",fontSize:15,marginTop:8}}>Continue → {selDate} {selSlot==="morning"?"Morning (09:00–12:00)":"Afternoon (13:00–16:00)"}</Btn>}
    </div>
  );

  // ── REQUEST FORM ────────────────────────────────────────────────
  if(view==="student"&&screen==="form"&&type) return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      <TabBar/><Back to={type.bookable?"calendar":type.prep.length>0?"prep":"home"}/>
      <div style={{fontSize:17,fontWeight:500,marginBottom:16}}>{type.icon} {type.label}</div>
      {type.bookable&&selDate&&selSlot&&<div style={{background:"#0a2218",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#20B07F",fontWeight:500}}>📅 {selDate} — {selSlot==="morning"?"Morning (09:00–12:00)":"Afternoon (13:00–16:00)"}</div>}
      {/* Who is submitting? */}
      <div style={{display:"flex",background:"#141720",borderRadius:10,padding:3,gap:2,marginBottom:16}}>
        {[["student","Fine Art student"],["external","External / visitor"]].map(([v,l])=>(
          <button key={v} onClick={()=>{setVisitorType(v);setVerifiedStudent(null);setVerifyErr("");setExtForm({name:"",affiliation:"",contact:""}); setF("studNo","");}}
            style={{flex:1,padding:"8px",borderRadius:8,background:visitorType===v?"#1a1d28":"transparent",color:visitorType===v?"#e0e3ea":"#9ca3af",fontSize:13,fontWeight:visitorType===v?600:400,border:"none",cursor:"pointer",fontFamily:"inherit",outline:visitorType===v?`1px solid ${T.borderColor}`:"none"}}>{l}</button>
        ))}
      </div>
      {visitorType==="student"&&(!verifiedStudent?(
        <div style={{marginBottom:20}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Student number or name *</label>
          <div style={{display:"flex",gap:8}}>
            <input style={{...ipt,flex:1}} value={form.studNo} onChange={e=>{setF("studNo",e.target.value);setVerifyErr("");}} onKeyDown={e=>e.key==="Enter"&&handleVerifyStudent()} placeholder="e.g. g25K7744 or your name" autoFocus/>
            <Btn onClick={handleVerifyStudent} disabled={!form.studNo.trim()||verifyingStudent}>{verifyingStudent?"...":"Verify"}</Btn>
          </div>
          <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#6b7280",marginTop:10,cursor:"pointer"}}>
            <input type="checkbox" checked={rememberMe} onChange={e=>setRememberMe(e.target.checked)} style={{width:15,height:15}}/>
            Remember me on this device
          </label>
          {verifyErr&&<div style={{marginTop:8,fontSize:13,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"10px 12px"}}>⚠️ {verifyErr}</div>}
        </div>
      ):(
        <div style={{background:"#0a2218",borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:500,color:"#20B07F"}}>✓ {verifiedStudent.name}</div>
            <div style={{fontSize:12,color:"#20B07F"}}>{verifiedStudent.studNo} · {YEAR_LABELS[verifiedStudent.year]||`Year ${verifiedStudent.year}`}</div>
          </div>
          <button onClick={()=>{setVerifiedStudent(null);setVerifyErr("");setF("studNo","");localStorage.removeItem(KEYS.savedStudNo);setRememberMe(false);}} style={{fontSize:12,color:"#20B07F",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Not you?</button>
        </div>
      ))}
      {visitorType==="external"&&(
        <div style={{marginBottom:20}}>
          <div style={{marginBottom:12}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Full name *</label><input style={ipt} value={extForm.name} onChange={e=>setExtForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Nomsa Dlamini" autoFocus/></div>
          <div style={{marginBottom:12}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Organisation / affiliation</label><input style={ipt} value={extForm.affiliation} onChange={e=>setExtForm(f=>({...f,affiliation:e.target.value}))} placeholder="e.g. Drama Dept, Community Arts Centre"/></div>
          <div><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Contact (email or phone)</label><input style={ipt} value={extForm.contact} onChange={e=>setExtForm(f=>({...f,contact:e.target.value}))} placeholder="e.g. nomsa@email.com or 082 000 0000"/></div>
        </div>
      )}
      {type.id==="print"&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Paper size</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["A4","A3","A2","A1","A0"].map(s=><button key={s} onClick={()=>setF("paperSize",s)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:form.paperSize===s?TEAL:"#1a1d28",color:form.paperSize===s?"#fff":"#e0e3ea",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>)}</div></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Paper type</label><select style={ipt} value={form.paperType} onChange={e=>setF("paperType",e.target.value)}>{["Select paper type","Normal","Glossy","Newsprint","Photographic"].map(p=><option key={p}>{p}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Colour or B&W</label><div style={{display:"flex",gap:8}}>{["Colour","Black & White"].map(c=><button key={c} onClick={()=>setF("colour",c)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.colour===c?BLUE:"#1a1d28",color:form.colour===c?"#fff":"#e0e3ea",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>)}</div></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Number of copies</label><input style={ipt} type="number" min="1" value={form.copies} onChange={e=>setF("copies",e.target.value)} placeholder="e.g. 2"/></div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Will you be present during printing? *</label>
          <div style={{display:"flex",gap:8}}>
            {[["yes","Yes — I'll wait"],["no","No — drop off & collect later"]].map(([v,l])=>(
              <button key={v} onClick={()=>setF("printPresent",v)} style={{flex:1,padding:"9px 6px",borderRadius:8,border:"none",background:form.printPresent===v?BLUE:"#1a1d28",color:form.printPresent===v?"#fff":"#e0e3ea",fontSize:12,cursor:"pointer",fontFamily:"inherit",lineHeight:1.4}}>{l}</button>
            ))}
          </div>
        </div>
      </>)}
      {type.id==="laser"&&(<>
        {/* First-time user toggle */}
        <label style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer",marginBottom:16,background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px"}}>
          <input type="checkbox" checked={form.firstTime} onChange={e=>setF("firstTime",e.target.checked)} style={{width:16,height:16,flexShrink:0}}/>
          <div>
            <div style={{fontSize:14,color:"#e0e3ea"}}>This is my first time using the laser cutter</div>
            <div style={{fontSize:12,color:"#6b7280"}}>A short test cut will be run before your session</div>
          </div>
        </label>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <div style={{flex:2}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Material type *</label><input style={ipt} value={form.material} onChange={e=>setF("material",e.target.value)} placeholder="e.g. plywood, acrylic, cardboard"/></div>
          <div style={{flex:1}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Thickness (mm) *</label><input style={ipt} type="number" min="1" max="12" value={form.materialThickness} onChange={e=>setF("materialThickness",e.target.value)} placeholder="e.g. 3"/></div>
        </div>
        {form.materialThickness&&Number(form.materialThickness)>12&&(
          <div style={{background:"#2a0f14",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#f87171",marginBottom:14}}>⚠️ Maximum cut depth is 12mm. This material may not cut through fully — Tech Support will advise.</div>
        )}
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Dimensions (W × H mm)</label><input style={ipt} value={form.dimensions} onChange={e=>setF("dimensions",e.target.value)} placeholder="e.g. 300 × 200mm"/></div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Job type *</label>
          <div style={{display:"flex",gap:8}}>{["Cut","Engrave","Both"].map(j=><button key={j} onClick={()=>setF("jobType",j)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.jobType===j?TEAL:"#1a1d28",color:form.jobType===j?"#fff":"#e0e3ea",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{j}</button>)}</div>
          {["Engrave","Both"].includes(form.jobType)&&(
            <div style={{background:"#2a1f0a",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#d4851a",marginTop:8}}>⏱ Raster engraving takes significantly longer than cutting. A 2-hour session is recommended for jobs that include engraving.</div>
          )}
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Session duration *</label><div style={{display:"flex",gap:8}}>{["1 hour","2 hours"].map(d=><button key={d} onClick={()=>setF("sessionDuration",d)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.sessionDuration===d?TEAL:"#1a1d28",color:form.sessionDuration===d?"#fff":"#e0e3ea",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{d}</button>)}</div></div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>File link (Google Drive or WeTransfer)</label>
          <input style={ipt} value={form.fileLink} onChange={e=>setF("fileLink",e.target.value)} placeholder="https://drive.google.com/..."/>
          <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Share your file before your session so Tech Support can check it in advance.</div>
        </div>
      </>)}
      {type.id==="3d"&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Dimensions / scale</label><input style={ipt} value={form.dimensions} onChange={e=>setF("dimensions",e.target.value)} placeholder="e.g. 15cm tall"/></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Material</label><select style={ipt} value={form.material3d} onChange={e=>setF("material3d",e.target.value)}>{["Select material","PLA","ABS","PETG","Resin","Other"].map(m=><option key={m}>{m}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Infill density</label><select style={ipt} value={form.infill} onChange={e=>setF("infill",e.target.value)}>{["Select infill","10% (light)","20% (standard)","50% (strong)","100% (solid)"].map(i=><option key={i}>{i}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Preferred drop-off date *</label><input type="date" style={ipt} value={form.dropOffDate} min={addBusinessDays(todayDate(),5)} onChange={e=>setF("dropOffDate",e.target.value)}/><div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Minimum 5 business days ahead. You will be notified when the print is ready to collect.</div></div>
      </>)}
      {type.id==="software"&&(<>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>What do you need help with? *</label>
          <div style={{display:"flex",gap:8}}>
            {[["adobe","🎓 Adobe / licence"],["mac","🖥 Mac software install"]].map(([v,l])=>(
              <button key={v} onClick={()=>{setF("softwareType",v);if(v==="mac")setF("when","later");}} style={{flex:1,padding:"10px 8px",borderRadius:8,border:"none",background:form.softwareType===v?BLUE:"#1a1d28",color:form.softwareType===v?"#fff":"#e0e3ea",fontSize:13,cursor:"pointer",fontFamily:"inherit",lineHeight:1.4}}>{l}</button>
            ))}
          </div>
        </div>
        {form.softwareType==="adobe"&&(
          <div style={{background:"#141720",border:"1px solid #312e81",borderRadius:12,padding:"14px 16px",marginBottom:14,borderLeft:"4px solid #6366F1"}}>
            <div style={{fontSize:14,fontWeight:600,color:"#4338CA",marginBottom:6}}>Adobe licences are managed by university IT</div>
            <div style={{fontSize:13,color:"#9ca3af",lineHeight:1.6,marginBottom:8}}>Creative Cloud licences are issued by the university IT department, not Fine Art Tech Support. You can still submit this request so there is a record, but you will need to contact IT directly to activate or renew your licence.</div>
            <div style={{fontSize:13,color:"#4338CA",fontWeight:500}}>📧 IT Help Desk: itsupport@university.ac.za</div>
          </div>
        )}
        {form.softwareType==="mac"&&(<>
          <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Software name</label><input style={ipt} value={form.softwareName} onChange={e=>setF("softwareName",e.target.value)} placeholder="e.g. Adobe Fresco"/></div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Download URL (optional)</label><input style={ipt} value={form.downloadUrl} onChange={e=>setF("downloadUrl",e.target.value)} placeholder="e.g. https://adobe.com/fresco"/></div>
          <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Which Mac & lab room</label><input style={ipt} value={form.macLocation} onChange={e=>setF("macLocation",e.target.value)} placeholder="e.g. Mac 4, Lab B"/></div>
        </>)}
      </>)}
      {type.id==="studio"&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Key collection date *</label><input type="date" style={ipt} value={form.studioDate} min={todayDate()} max={addBusinessDays(todayDate(),eqSettings.maxAdvanceDays)} onChange={e=>{setF("studioDate",e.target.value);setF("studioSlot","");}}/>{form.studioDate&&!isEqColDay(form.studioDate)&&<div style={{fontSize:12,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"8px 10px",marginTop:6}}>⚠️ Keys are only available Mon, Wed, Fri (11:00–12:30). Please pick one of those days.</div>}</div>
        {form.studioDate&&isEqColDay(form.studioDate)&&(
          <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Collection slot *</label>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {EQ_COL_SLOTS.map(slot=>{
                const taken=requests.filter(r=>r.typeId==="studio"&&r.schedDate&&r.schedDate.startsWith(form.studioDate)&&r.schedDate.includes(slot.label)&&r.status!=="Declined").length;
                const full=taken>=1;
                return(<button key={slot.id} onClick={()=>!full&&setF("studioSlot",slot.id)} disabled={full} style={{flex:1,minWidth:100,padding:"12px 8px",borderRadius:10,border:form.studioSlot===slot.id?`2px solid ${TEAL}`:"0.5px solid #1e2130",background:full?"#1a1d28":form.studioSlot===slot.id?"#0a2218":"#141720",color:full?"#374151":form.studioSlot===slot.id?TEAL:"#e0e3ea",fontSize:13,cursor:full?"not-allowed":"pointer",fontFamily:"inherit",textAlign:"center"}}>{slot.label}<br/><span style={{fontSize:11}}>{full?"Full":"Available"}</span></button>);
              })}
            </div>
          </div>
        )}
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Type of shoot</label><select style={ipt} value={form.shootType} onChange={e=>setF("shootType",e.target.value)}>{["Select shoot type","Portrait","Product","Video","Still life","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
      </>)}
      {type.id==="gallery"&&(<>
        <div style={{background:"#0a1e35",borderRadius:10,padding:"10px 12px",marginBottom:14,fontSize:12,color:"#3b82f6"}}>
          📋 Read the <a href="https://docs.google.com/document/d/GALLERY_RULES_PLACEHOLDER" target="_blank" rel="noreferrer" style={{color:"#3b82f6",fontWeight:600}}>Gallery Booking Rules & Guidelines</a> before submitting.
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Venue *</label><select style={ipt} value={form.venue} onChange={e=>setF("venue",e.target.value)}>{["Select venue","Main gallery","2nd year studio","Seminar room","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Event type *</label><select style={ipt} value={form.eventType} onChange={e=>setF("eventType",e.target.value)}>{["Select event type","Exhibition","Performance","Workshop","Screening","Graduation show","Pop-up / market","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <div style={{flex:1}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Start date *</label><input type="date" style={ipt} value={form.eventStart} min={todayDate()} onChange={e=>setF("eventStart",e.target.value)}/></div>
          <div style={{flex:1}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>End date *</label><input type="date" style={ipt} value={form.eventEnd} min={form.eventStart||todayDate()} onChange={e=>setF("eventEnd",e.target.value)}/></div>
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Expected attendance</label><input style={ipt} type="number" min="1" value={form.attendance} onChange={e=>setF("attendance",e.target.value)} placeholder="e.g. 40"/></div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Tech support needed?</label>
          <div style={{display:"flex",gap:8}}>
            {[["yes","Yes"],["no","No"]].map(([v,l])=>(
              <button key={v} onClick={()=>setF("techSupport",v)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.techSupport===v?TEAL:"#1a1d28",color:form.techSupport===v?"#fff":"#e0e3ea",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Setup requirements</label><textarea style={{...ipt,resize:"vertical"}} rows={3} value={form.setupNeeds} onChange={e=>setF("setupNeeds",e.target.value)} placeholder="e.g. 6 tables, chairs for 30, projector, background lighting"/></div>
      </>)}
      {!type.bookable&&!["gallery","studio","3d"].includes(type.id)&&!(selType==="software"&&form.softwareType!=="mac")&&<div style={{marginBottom:14}}>
        <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>{selType==="software"?"When should we schedule the install?":"When do you need it?"}</label>
        <div style={{display:"flex",gap:8}}>{(selType==="software"?[["later","Schedule"]]: [["walkin","Right now"],["later","Schedule"]]).map(([v,l])=><button key={v} onClick={()=>setF("when",v)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.when===v?BLUE:"#1a1d28",color:form.when===v?"#fff":"#e0e3ea",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>)}</div>
        {form.when==="later"&&<>
          <input type="datetime-local" style={{...ipt,marginTop:8}} value={form.schedDate} onChange={e=>setF("schedDate",e.target.value)}/>
          {selType==="software"&&form.schedDate&&(()=>{const d=new Date(form.schedDate);return EQ_COL_DAYS.includes(d.getDay())&&d.getHours()>=9&&d.getHours()<13;})()&&(
            <div style={{fontSize:12,color:"#d4851a",background:"#2a1f0a",borderRadius:8,padding:"6px 10px",marginTop:6}}>⚠ Stockroom collections run Mon/Wed/Fri 11:00–12:30. If possible, choose a different time to avoid overlap.</div>
          )}
        </>}
      </div>}
      <div style={{marginBottom:20}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Additional notes (optional)</label><textarea style={{...ipt,resize:"vertical"}} rows={3} value={form.notes} onChange={e=>setF("notes",e.target.value)} placeholder="Any extra details Tech Support should know..."/></div>
      <Btn onClick={async()=>{if(submitting)return;setSubmitting(true);const r=await submitRequest();setSubmitting(false);if(r){setLastReq(r);setScreen("success");}}} disabled={submitting||(visitorType==="student"?!verifiedStudent:!extForm.name.trim())||(selType==="print"&&!form.printPresent)||(selType==="laser"&&!form.sessionDuration)||(selType==="3d"&&!form.dropOffDate)||(selType==="studio"&&(!form.studioDate||!isEqColDay(form.studioDate)||!form.studioSlot))} full style={{padding:"13px",fontSize:15}}>{submitting?"Submitting…":"Submit a request"}</Btn>
    </div>
  );

  // ── SUCCESS ──────────────────────────────────────────────────────
  if(view==="student"&&screen==="success") return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      <TabBar/>
      <div style={{textAlign:"center",padding:"1.5rem 0 1rem"}}>
        <div style={{fontSize:48,marginBottom:8}}>✅</div>
        <div style={{fontSize:18,fontWeight:600,marginBottom:4}}>Request confirmed!</div>
        <div style={{fontSize:13,color:"#6b7280"}}>Screenshot this for your records</div>
      </div>
      {lastReq&&(
        <div style={{background:"#141720",border:`1.5px solid ${TEAL}`,borderRadius:14,padding:"18px 16px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14,paddingBottom:12,borderBottom:"0.5px solid #1e2130"}}>
            <div>
              <div style={{fontWeight:600,fontSize:15}}>{lastReq.name}</div>
              <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{lastReq.studNo}{lastReq.year&&!lastReq.year.startsWith("Select")?" · "+lastReq.year:""}</div>
            </div>
            <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,background:"#2a1f0a",color:"#d4851a",whiteSpace:"nowrap"}}>Pending</span>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>Request type</div>
            <div style={{fontSize:14,fontWeight:500}}>{REQUEST_TYPES.find(t=>t.id===lastReq.typeId)?.icon} {lastReq.type}</div>
          </div>
          {lastReq.schedDate&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>Scheduled for</div>
              <div style={{fontSize:14,fontWeight:500}}>📅 {lastReq.schedDate}</div>
            </div>
          )}
          {Object.values(lastReq.details||{}).some(v=>v&&!String(v).startsWith("Select"))&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:6}}>Details</div>
              <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.9,flexWrap:"wrap",display:"flex",gap:6}}>
                {lastReq.details.paperSize&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>📐 {lastReq.details.paperSize}</span>}
                {lastReq.details.paperType&&!lastReq.details.paperType.startsWith("Select")&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>🗒️ {lastReq.details.paperType}</span>}
                {lastReq.details.colour&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>{lastReq.details.colour}</span>}
                {lastReq.details.copies&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>×{lastReq.details.copies} copies</span>}
                {lastReq.details.material&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>🪵 {lastReq.details.material}</span>}
                {lastReq.details.dimensions&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>📏 {lastReq.details.dimensions}</span>}
                {lastReq.details.jobType&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>{lastReq.details.jobType}</span>}
                {lastReq.details.softwareName&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>💻 {lastReq.details.softwareName}</span>}
                {lastReq.details.macLocation&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>🖥️ {lastReq.details.macLocation}</span>}
                {lastReq.details.shootType&&!lastReq.details.shootType.startsWith("Select")&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>💡 {lastReq.details.shootType}</span>}
                {lastReq.details.duration&&!lastReq.details.duration.startsWith("Select")&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>⏱️ {lastReq.details.duration}</span>}
                {lastReq.details.eventType&&!lastReq.details.eventType.startsWith("Select")&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>🖼️ {lastReq.details.eventType}</span>}
                {lastReq.details.eventStart&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>📅 {lastReq.details.eventStart}{lastReq.details.eventEnd&&lastReq.details.eventEnd!==lastReq.details.eventStart?` → ${lastReq.details.eventEnd}`:""}</span>}
                {lastReq.details.attendance&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>👥 ~{lastReq.details.attendance} people</span>}
                {lastReq.details.material3d&&!lastReq.details.material3d.startsWith("Select")&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>🧱 {lastReq.details.material3d}</span>}
                {lastReq.details.infill&&!lastReq.details.infill.startsWith("Select")&&<span style={{background:"#1a1d28",borderRadius:6,padding:"2px 8px"}}>{lastReq.details.infill}</span>}
              </div>
            </div>
          )}
          {lastReq.notes&&(
            <div style={{marginBottom:12}}>
              <div style={{fontSize:12,color:"#6b7280",marginBottom:4}}>Notes</div>
              <div style={{fontSize:13,color:"#9ca3af"}}>"{lastReq.notes}"</div>
            </div>
          )}
          <div style={{paddingTop:12,borderTop:"0.5px solid #1e2130",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:11,color:"#ccc"}}>Ref: {lastReq.id.slice(0,8).toUpperCase()}</span>
            <span style={{fontSize:11,color:"#6b7280"}}>{fmt(lastReq.createdAt)}</span>
          </div>
        </div>
      )}
      <div style={{background:"#2a1f0a",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13,color:"#d4851a",textAlign:"center"}}>
        ⏳ Wait for Tech Support to confirm before coming in person.
      </div>
      <Btn outline color="#888" onClick={()=>{setScreen("home");setSelType(null);setPrepOk(false);setSelDate(null);setSelSlot(null);setLastReq(null);}} style={{color:"#9ca3af",border:"0.5px solid #1e2130",background:"transparent",width:"100%",padding:"11px"}}>Submit another request</Btn>
    </div>
  );

  // ── WALK-IN LOG ──────────────────────────────────────────────────
  if(view==="dashboard"&&screen==="walkin") return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      <TabBar/><Back to="home" label="← Back to queue"/>
      <div style={{fontSize:17,fontWeight:500,marginBottom:4}}>Log a walk-in</div>
      <div style={{fontSize:13,color:"#6b7280",marginBottom:20}}>Student pitched up — log it quickly</div>
      {["Student name *","Student number"].map((lbl,i)=>(
        <div key={i} style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>{lbl}</label><input style={ipt} value={i===0?form.name:form.studNo} onChange={e=>setF(i===0?"name":"studNo",e.target.value)} placeholder={i===0?"e.g. Sipho Nkosi":"e.g. g25K7744"}/></div>
      ))}
      <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Year</label><select style={ipt} value={form.year} onChange={e=>setF("year",e.target.value)}>{[["","Select year"],["1","1st year"],["2","2nd year"],["3","3rd year"],["4","4th year"],["m","Masters"],["s","Staff"],["o","Other"]].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></div>
      <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>What do they need?</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{REQUEST_TYPES.filter(t=>t.id!=="equipment").map(t=><button key={t.id} onClick={()=>setSelType(t.id)} style={{padding:"8px 12px",borderRadius:8,border:"none",background:selType===t.id?TEAL:"#1a1d28",color:selType===t.id?"#fff":"#e0e3ea",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{t.icon} {t.label}</button>)}</div></div>
      <div style={{marginBottom:20}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Quick notes</label><textarea style={{...ipt,resize:"vertical"}} rows={3} value={form.notes} onChange={e=>setF("notes",e.target.value)} placeholder="e.g. Software on Mac 4 — told to come back Thursday"/></div>
      <Btn onClick={()=>{if(!form.name.trim()||!selType)return;submitRequest(true);setScreen("home");setSelType(null);setForm(f=>({...f,name:"",studNo:"",year:"",notes:""}));}} disabled={!form.name.trim()||!selType} full style={{padding:"13px",fontSize:15}}>Log walk-in</Btn>
    </div>
  );

  // ── DASHBOARD ────────────────────────────────────────────────────
  if(view==="dashboard"){const desktopTwoCol=isDesktop&&(dashTab==="today"||dashTab==="queue");return(
    <div style={isDesktop?{display:"flex",minHeight:"100vh",background:"#0F1117",alignItems:"flex-start",margin:"-24px -16px -48px",width:"calc(100% + 32px)"}:{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      {isDesktop&&(
        <div style={{width:200,background:"#0a0d14",borderRight:"0.5px solid #1e2130",padding:"14px 10px",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto",display:"flex",flexDirection:"column"}}>
          <div style={{marginBottom:18}}><div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>FATS</div><div style={{fontSize:10,color:"#4b5563",marginTop:2}}>Fine Art Department</div></div>
          <div style={{fontSize:10,color:"#4b5563",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,marginBottom:6,paddingLeft:6}}>Views</div>
          {[["today",`📅 Today · ${new Date().getDate()}`],["queue","📋 All requests"]].map(([v,l])=>(
            <div key={v} onClick={()=>setDashTab(v)} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:desktopTwoCol?"#e0e3ea":"#6b7280",background:desktopTwoCol?"#141720":"transparent",cursor:"pointer",marginBottom:2}}>{l}</div>
          ))}
          <div style={{fontSize:10,color:"#4b5563",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,marginBottom:6,paddingLeft:6,marginTop:14}}>Manage</div>
          {[["it","💻 IT"+(openIt>0?" ("+openIt+")":"")],["schedule","🗓 Schedule"],["blocks","🚫 Blocks"],["cal","📆 Calendar"],["charges","💳 Charges"]].map(([v,l])=>(
            <div key={v} onClick={()=>setDashTab(v)} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:dashTab===v?"#e0e3ea":"#6b7280",background:dashTab===v?"#141720":"transparent",cursor:"pointer",marginBottom:2}}>{l}</div>
          ))}
          <div style={{marginTop:"auto",paddingTop:16,borderTop:"0.5px solid #1e2130"}}>
            <a href={HSMS_URL} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:"#6b7280",textDecoration:"none",marginBottom:4}}>🦺 H&S / Maintenance</a>
            <div onClick={()=>{sessionStorage.removeItem("fats_staff_unlocked");setStaffUnlocked(false);setView("student");}} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:"#6b7280",cursor:"pointer"}}>🔒 Lock</div>
          </div>
        </div>
      )}
      {!isDesktop&&<TabBar/>}
      <div style={isDesktop?{flex:1,overflowX:"hidden",padding:"1.5rem 1.25rem"}:{}}>

      {/* Leave toggle */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,background:leaveMode.active?"#2a1f0a":"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"10px 14px"}}>
        <span style={{fontSize:13,fontWeight:500,color:leaveMode.active?"#d4851a":"#9ca3af",flex:1}}>{leaveMode.active?"🏖️ Leave mode ON — queue frozen":"🟢 Active — accepting requests"}</span>
        <Btn small onClick={toggleLeave} color={leaveMode.active?TEAL:AMBER}>{leaveMode.active?"Go active":"Go on leave"}</Btn>
      </div>
      {leaveMode.active&&(<div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
        <div style={{marginBottom:8}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Return date</label><input type="date" style={ipt} value={leaveMode.returnDate} onChange={e=>setLeaveMode(l=>({...l,returnDate:e.target.value}))}/></div>
        <div style={{marginBottom:8}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Message for students</label><input style={ipt} value={leaveMode.message} onChange={e=>setLeaveMode(l=>({...l,message:e.target.value}))} placeholder="e.g. Back after swot week"/></div>
        <Btn small onClick={saveLeave}>Save</Btn>
      </div>)}

      {/* Lock / Change PIN */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <button onClick={()=>{sessionStorage.removeItem("fats_staff_unlocked");setStaffUnlocked(false);setView("student");}} style={{flex:1,padding:"8px",borderRadius:8,background:"#141720",border:"0.5px solid #1e2130",fontSize:12,color:"#6b7280",cursor:"pointer",fontFamily:"inherit"}}>🔒 Lock</button>
        <button onClick={()=>{setChangingPin(p=>!p);setNewPin("");}} style={{flex:1,padding:"8px",borderRadius:8,background:"#141720",border:"0.5px solid #1e2130",fontSize:12,color:"#6b7280",cursor:"pointer",fontFamily:"inherit"}}>🔑 Change PIN</button>
      </div>
      {changingPin&&(
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>Current PIN: <strong style={{color:"#e0e3ea"}}>{localStorage.getItem(KEYS.staffPin)||DEFAULT_PIN}</strong></div>
          <div style={{display:"flex",gap:8}}>
            <input type="password" inputMode="numeric" maxLength={6} style={{...ipt,flex:1,letterSpacing:"0.2em"}} value={newPin} onChange={e=>setNewPin(e.target.value)} placeholder="New PIN"/>
            <Btn small onClick={()=>{if(newPin.length>=4){localStorage.setItem(KEYS.staffPin,newPin);setChangingPin(false);setNewPin("");}}} disabled={newPin.length<4}>Save</Btn>
          </div>
        </div>
      )}

      {/* H&S link */}
      <a href={HSMS_URL} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"10px 14px",marginBottom:16,textDecoration:"none",color:"inherit"}}>
        <span style={{fontSize:18}}>🦺</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>Health & Safety / Maintenance</div><div style={{fontSize:12,color:"#4b5563"}}>Open FineArt HSMS →</div></div>
        <span style={{color:"#374151",fontSize:16}}>›</span>
      </a>

      {/* Dash tabs */}
      {!isDesktop&&<div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}}>
        {[["today",`Today · ${new Date().getDate()}`],["queue","Queue"],["it",`IT${openIt>0?` (${openIt})`:""}` ],["schedule","Schedule"],["blocks","Blocks"],["cal","Calendar"],["charges","Charges"]].map(([v,l])=>(
          <button key={v} onClick={()=>setDashTab(v)} style={{flex:1,minWidth:55,padding:"8px 4px",borderRadius:8,border:"none",background:dashTab===v?TEAL:"#141720",color:dashTab===v?"#fff":"#6b7280",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:dashTab===v?"none":"0.5px solid #1e2130"}}>{l}</button>
        ))}
      </div>}

      <div style={desktopTwoCol?{display:"flex",alignItems:"flex-start",gap:0}:{}}>
      <div style={desktopTwoCol?{flex:1,borderRight:"0.5px solid #1e2130",paddingRight:20}:{}}>
      {/* ── TODAY ── */}
      {(dashTab==="today"||desktopTwoCol)&&(()=>{
        const todayHeading=`${DAY_FULL[new Date().getDay()]} ${new Date().getDate()} ${MONTHS[new Date().getMonth()]} ${new Date().getFullYear()}`;
        const Sec=({icon,title,items,sk})=>(
          <div style={{marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:500,color:"#6b7280",marginBottom:8,display:"flex",alignItems:"center",gap:6,borderBottom:"1px solid #1e2130",paddingBottom:6}}>
              {icon} {title}
              {items.length>0&&<span style={{fontSize:11,color:"#6b7280",fontWeight:400}}>· {items.length}</span>}
            </div>
            {items.length===0
              ?<div style={{background:"#0f1117",border:"0.5px dashed #1e2130",borderRadius:8,padding:"10px",textAlign:"center",fontSize:11,color:"#2a2d3e",marginBottom:6}}>Nothing scheduled</div>
              :items.map(r=>{
                let al,as_;
                if(sk==="morning"||sk==="afternoon"){al=r.typeId==="laser"?"Start session":"Mark in progress";as_="In Progress";}
                else if(sk==="studio"){al="Confirm";as_="Confirmed";}
                else if(sk==="collections"){al="Mark ready";as_="Ready to collect";}
                else{al="Check in";as_="Returned";}
                return <TodayCard key={r.id} req={r} actionLabel={al} actionStatus={as_}/>;
              })
            }
          </div>
        );
        return(<>
          <div style={{marginBottom:20}}>
            <div style={{fontSize:17,fontWeight:500,color:"#e0e3ea",letterSpacing:"-0.3px"}}>📅 {todayHeading}</div>
            <div style={{fontSize:12,color:"#4b5563",marginTop:3}}>Daily overview — bookings, collections and returns</div>
          </div>
          {/* Stats summary */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
            {[["Pending",counts["Pending"]||0,"#d4851a","#2a1f0a"],["In Progress",counts["In Progress"]||0,"#60a5fa","#0a1e35"],["Done",counts["Done"]||0,"#20B07F","#0a2218"]].map(([l,n,col,bg])=>(
              <div key={l} style={{background:bg,borderRadius:8,padding:"10px 12px",border:`0.5px solid ${col}22`}}>
                <div style={{fontSize:22,fontWeight:500,color:col,lineHeight:1}}>{n}</div>
                <div style={{fontSize:10,color:col,marginTop:3}}>{l}</div>
              </div>
            ))}
          </div>
          <Sec icon="🌅" title="Morning (09:00–12:00)" items={morningToday} sk="morning"/>
          {/* Now indicator — between morning and afternoon */}
          {(()=>{const h=new Date().getHours();return h>=9&&h<17&&(
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,marginTop:-8}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:"#20B07F",flexShrink:0}}/>
              <span style={{fontSize:10,color:"#20B07F",fontWeight:500,whiteSpace:"nowrap"}}>Now — {new Date().getHours().toString().padStart(2,"0")}:{new Date().getMinutes().toString().padStart(2,"0")}</span>
              <div style={{flex:1,height:"0.5px",background:"#20B07F",opacity:0.4}}/>
            </div>
          );})()}
          <Sec icon="🌆" title="Afternoon (13:00–16:00)" items={afternoonToday} sk="afternoon"/>
          <Sec icon="🏢" title="Studio sessions today" items={studioToday} sk="studio"/>
          <Sec icon="📦" title="Equipment collections today" items={eqCollectionsToday} sk="collections"/>
          <Sec icon="📬" title="Equipment due back today" items={eqDueToday} sk="due"/>
          <Sec icon="⚠️" title="Overdue equipment" items={eqOverdue} sk="overdue"/>
        </>);
      })()}

      </div>
      <div style={desktopTwoCol?{flex:1,paddingLeft:20}:{}}>
      {/* ── QUEUE ── */}
      {(dashTab==="queue"||desktopTwoCol)&&(<>
        {(()=>{const uncollected=requests.filter(r=>r.typeId==="equipment"&&["Confirmed","Ready to collect"].includes(r.status)&&r.schedDate&&new Date(r.schedDate.split(" ")[0]+"T"+String(eqSettings.collectionDeadlineHour).padStart(2,"0")+":00")<new Date());return uncollected.length>0&&(<div style={{background:"#2a1500",border:"1px solid #7c3000",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:13,fontWeight:600,color:"#fb923c",marginBottom:6}}>⚠ {uncollected.length} booking{uncollected.length>1?"s":""} past collection deadline</div>
          {uncollected.map(r=><div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:12,color:"#9a3412",marginBottom:4}}>
            <span>{r.name} ({r.studNo}) — {r.schedDate?.split(" ")[0]}</span>
            <button onClick={()=>updateStatus(r.id,"Uncollected")} style={{fontSize:11,padding:"3px 8px",borderRadius:6,border:"none",background:"#c2410c",color:"#fff",cursor:"pointer",fontFamily:"inherit"}}>Mark Uncollected</button>
          </div>)}
        </div>);})()}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["Pending","#2a1f0a","#d4851a"],["In Progress","#0a1e35","#60a5fa"],["Done","#0a2218","#20B07F"]].map(([s,bg,col])=>(
            <div key={s} style={{flex:1,background:bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:500,color:col}}>{counts[s]||0}</div>
              <div style={{fontSize:11,color:col}}>{s}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          <Btn outline color={TEAL} onClick={()=>{setScreen("walkin");setSelType(null);setForm(f=>({...f,name:"",studNo:"",year:"",notes:""}));}} style={{flex:1}}>+ Log walk-in</Btn>
          <select style={{...ipt,flex:1}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option>All</option>{STATUSES.map(s=><option key={s}>{s}</option>)}</select>
        </div>
        {!loaded&&<div style={{color:"#6b7280",fontSize:14}}>Loading...</div>}
        {loaded&&filtered.length===0&&<div style={{textAlign:"center",padding:"3rem",color:"#6b7280",fontSize:14}}>No requests yet</div>}
        {filtered.map(req=>{
          const typeInfo=REQUEST_TYPES.find(t=>t.id===req.typeId)||{};
          const typeColor=TYPE_COLOR[req.typeId]||"#6B7280";
          const hasItems=req.typeId==="equipment"&&req.details?.itemsData?.length>0;
          return(
            <div key={req.id} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:14,padding:"14px 16px",marginBottom:12,borderLeft:`3px solid ${typeColor}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:5}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap",marginBottom:3}}>
                    <span style={{fontSize:13,fontWeight:600,color:typeColor}}>{typeInfo.icon} {req.type||typeInfo.label}</span>
                    {req.isWalkIn&&<span style={{fontSize:11,background:"#0a1e35",color:"#3b82f6",borderRadius:6,padding:"2px 7px"}}>walk-in</span>}
                    {req.isExternal&&<span style={{fontSize:11,background:"#1a1028",color:"#a78bfa",borderRadius:6,padding:"2px 7px"}}>external</span>}
                  </div>
                  <div style={{fontSize:15,fontWeight:500,color:"#e0e3ea",lineHeight:1.3}}>
                    {req.name}{req.studNo&&<span style={{fontWeight:400,fontSize:12,color:"#4b5563",marginLeft:6}}>#{req.studNo}</span>}
                  </div>
                  {(req.isExternal?req.affiliation:req.year&&!req.year.startsWith("Select")?req.year:null)&&(
                    <div style={{fontSize:12,color:"#6b7280",marginTop:1}}>
                      {req.isExternal?req.affiliation||"External visitor":req.year}
                      {req.isExternal&&req.contact&&<span> · 📞 {req.contact}</span>}
                    </div>
                  )}
                </div>
                {pill(req.status)}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap",marginBottom:8}}>
                {req.schedDate&&<span style={{fontSize:12,background:`${typeColor}18`,color:typeColor,borderRadius:6,padding:"2px 8px",fontWeight:500}}>📅 {req.schedDate}</span>}
                {req.when==="walkin"&&!req.schedDate&&<span style={{fontSize:12,color:"#6b7280"}}>Walk-in</span>}
                <span style={{fontSize:11,color:"#bbb"}}>{fmt(req.createdAt)}</span>
              </div>
              {req.typeId==="equipment"&&req.dueDate&&req.status==="Collected"&&new Date()>new Date(req.dueDate+"T00:00:00")&&(
                <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#2a0f14",color:"#f87171",borderRadius:6,padding:"3px 9px",fontSize:12,fontWeight:600,marginBottom:8}}>
                  ⚠ OVERDUE {countBizDaysLate(req.dueDate,todayDate())}d late
                </div>
              )}
              {hasItems&&(
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                  {req.details.itemsData.map((item,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:7,background:"#1a1d28",borderRadius:10,padding:"6px 10px 6px 6px",minWidth:0}}>
                      {(queueEqImages[item.id]||item.image)
                        ?<img src={queueEqImages[item.id]||item.image} alt={item.name} style={{width:40,height:40,objectFit:"cover",borderRadius:7,flexShrink:0}} onError={e=>{e.target.style.display="none";}}/>
                        :<div style={{width:40,height:40,background:"#1e2130",borderRadius:7,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📷</div>
                      }
                      <div>
                        <div style={{fontSize:12,fontWeight:500,color:"#e0e3ea",lineHeight:1.3}}>{item.name}</div>
                        {item.type&&<div style={{fontSize:11,color:"#4b5563"}}>{item.type}</div>}
                      </div>
                    </div>
                  ))}
                  {req.dueDate&&<div style={{display:"flex",alignItems:"center",fontSize:12,color:"#9ca3af",padding:"0 4px"}}>↩ Due {fmtDate(req.dueDate)}</div>}
                </div>
              )}
              {req.typeId==="equipment"&&!hasItems&&req.details?.items&&(
                <div style={{fontSize:12,color:"#9ca3af",background:"#1a1d28",borderRadius:8,padding:"8px 10px",marginBottom:6}}>
                  📦 {req.details.items}{req.dueDate&&<span style={{marginLeft:10}}>↩ Due: {fmtDate(req.dueDate)}</span>}
                </div>
              )}
              {req.typeId!=="equipment"&&Object.values(req.details||{}).some(v=>v&&!String(v).startsWith("Select"))&&(
                <div style={{fontSize:12,color:"#9ca3af",background:"#1a1d28",borderRadius:8,padding:"8px 10px",marginBottom:6,lineHeight:1.8}}>
                  {req.details.paperSize&&<span style={{marginRight:10}}>📐 {req.details.paperSize}</span>}
                  {req.details.paperType&&!req.details.paperType.startsWith("Select")&&<span style={{marginRight:10}}>🗒️ {req.details.paperType}</span>}
                  {req.details.colour&&<span style={{marginRight:10}}>🎨 {req.details.colour}</span>}
                  {req.details.copies&&<span style={{marginRight:10}}>×{req.details.copies}</span>}
                  {req.details.printPresent&&<span style={{marginRight:10}}>{req.details.printPresent==="yes"?"👤 Present":"📬 Drop-off"}</span>}
                  {req.details.material&&<span style={{marginRight:10}}>🪵 {req.details.material}{req.details.materialThickness?` · ${req.details.materialThickness}mm`:""}</span>}
                  {req.details.dimensions&&<span style={{marginRight:10}}>📏 {req.details.dimensions}</span>}
                  {req.details.jobType&&req.typeId==="laser"&&<span style={{marginRight:10}}>⚡ {req.details.jobType}</span>}
                  {req.details.sessionDuration&&<span style={{marginRight:10}}>⏱ {req.details.sessionDuration}</span>}
                  {req.details.firstTime&&<span style={{marginRight:10,background:"#2a1f0a",color:"#d4851a",borderRadius:6,padding:"2px 7px",fontWeight:600}}>⭐ FIRST TIME</span>}
                  {req.details.fileLink&&<a href={req.details.fileLink} target="_blank" rel="noreferrer" style={{marginRight:10,color:"#60a5fa",textDecoration:"none"}}>📎 File link</a>}
                  {req.details.softwareName&&<span style={{marginRight:10}}>💻 {req.details.softwareName}</span>}
                  {req.details.macLocation&&<span style={{marginRight:10}}>🖥️ {req.details.macLocation}</span>}
                  {req.details.shootType&&!req.details.shootType.startsWith("Select")&&<span style={{marginRight:10}}>💡 {req.details.shootType}</span>}
                  {req.details.duration&&!req.details.duration.startsWith("Select")&&<span style={{marginRight:10}}>⏱️ {req.details.duration}</span>}
                  {req.details.venue&&!req.details.venue.startsWith("Select")&&<span style={{marginRight:10}}>📍 {req.details.venue}</span>}
                  {req.details.eventType&&!req.details.eventType.startsWith("Select")&&<span style={{marginRight:10}}>🖼️ {req.details.eventType}</span>}
                  {req.details.eventStart&&<span style={{marginRight:10}}>📅 {req.details.eventStart}{req.details.eventEnd&&req.details.eventEnd!==req.details.eventStart?` → ${req.details.eventEnd}`:""}</span>}
                  {req.details.attendance&&<span style={{marginRight:10}}>👥 ~{req.details.attendance} people</span>}
                  {req.details.techSupport&&<span style={{marginRight:10,color:req.details.techSupport==="yes"?"#DC2626":"#6B7280"}}>🛠 Tech support: {req.details.techSupport==="yes"?"Yes":"No"}</span>}
                  {req.details.material3d&&!req.details.material3d.startsWith("Select")&&<span style={{marginRight:10}}>🧱 {req.details.material3d}</span>}
                  {req.details.infill&&!req.details.infill.startsWith("Select")&&<span style={{marginRight:10}}>{req.details.infill}</span>}
                  {req.details.dropOffDate&&<span style={{marginRight:10}}>📬 Drop-off: {req.details.dropOffDate}</span>}
                </div>
              )}
              {req.notes&&<div style={{fontSize:13,color:"#9ca3af",background:"#1a1d28",borderRadius:8,padding:"8px 10px",marginBottom:8}}>"{req.notes}"</div>}
              {req.staffNote&&<div style={{fontSize:12,color:"#3b82f6",background:"#0a1e35",borderRadius:8,padding:"6px 10px",marginBottom:8}}>📝 {req.staffNote}</div>}
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
                {(req.typeId==="laser"?LASER_STATUSES:req.typeId==="equipment"?EQ_STATUSES:STATUSES).filter(s=>s!==req.status).map(s=>(
                  <button key={s} onClick={()=>{
                    if(req.typeId==="equipment"&&s==="Returned"){const items=(req.details?.itemsData||[]).map(i=>i.name).filter(n=>!(req.returnedItems||[]).includes(n));setCheckInModal(req);setCiReturning(items);setCiLost([]);setCiNotes("");}
                    else updateStatus(req.id,s);
                  }} style={{padding:"5px 11px",borderRadius:8,border:"0.5px solid #1e2130",background:"#1a1d28",cursor:"pointer",color:"#9ca3af",fontSize:12,fontFamily:"inherit"}}>→ {s}</button>
                ))}
              </div>
              <button onClick={()=>setExpandId(expandId===req.id?null:req.id)} style={{fontSize:12,color:"#3b82f6",background:"none",border:"none",cursor:"pointer",padding:0}}>{expandId===req.id?"Hide note ▲":"Add / edit note ▼"}</button>
              {expandId===req.id&&(<div style={{marginTop:8,background:"#1a1d28",borderRadius:8,padding:"10px"}}>
                <textarea rows={2} placeholder="e.g. Files not ready — told to come back Thursday" defaultValue={req.staffNote} onChange={e=>setStaffNotes(n=>({...n,[req.id]:e.target.value}))} style={{...ipt,resize:"vertical",fontSize:13}}/>
                <Btn onClick={()=>{saveNote(req.id);setExpandId(null);}} color={BLUE} style={{marginTop:6,fontSize:13}}>Save note</Btn>
              </div>)}
            </div>
          );
        })}
      </>)}

      </div></div>
      {/* ── IT REFERRALS ── */}
      {dashTab==="it"&&(<>
        <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>IT referrals</div>
        <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Log issues for IT — seminar room, Mac lab, network</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["Open",itReferrals.filter(r=>r.status!=="Resolved").length,"#2a1f0a","#d4851a"],["Resolved",itReferrals.filter(r=>r.status==="Resolved").length,"#E1F5EE","#0F6E56"],["Escalated",itReferrals.filter(r=>r.status==="Escalated").length,"#2a0f14","#f87171"]].map(([l,n,bg,col])=>(
            <div key={l} style={{flex:1,background:bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:500,color:col}}>{n}</div>
              <div style={{fontSize:11,color:col}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Log new IT referral</div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>What needs IT? *</label><select style={ipt} value={itForm.itemId} onChange={e=>setItForm(f=>({...f,itemId:e.target.value}))}><option value="">Select item</option>{IT_ITEMS.map(i=><option key={i.id} value={i.id}>{i.label}</option>)}</select></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Description *</label><textarea style={{...ipt,resize:"vertical"}} rows={2} value={itForm.description} onChange={e=>setItForm(f=>({...f,description:e.target.value}))} placeholder="e.g. Projector bulb blown, no display output"/></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Priority</label><div style={{display:"flex",gap:6}}>{[["Low","#1a1d28","#9ca3af"],["Normal",TEAL,"#fff"],["Urgent","#e24b4a","#fff"]].map(([p,bg,col])=><button key={p} onClick={()=>setItForm(f=>({...f,priority:p}))} style={{flex:1,padding:"7px",borderRadius:8,border:"none",background:itForm.priority===p?bg:"#1a1d28",color:itForm.priority===p?col:"#9ca3af",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{p}</button>)}</div></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Date logged</label><input type="date" style={ipt} value={itForm.dateLogged} onChange={e=>setItForm(f=>({...f,dateLogged:e.target.value}))}/></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Logged with (IT contact)</label><input style={ipt} value={itForm.loggedWith} onChange={e=>setItForm(f=>({...f,loggedWith:e.target.value}))} placeholder="e.g. Thabo from IT helpdesk"/></div>
          <div style={{marginBottom:12}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>IT reference / ticket number</label><input style={ipt} value={itForm.reference} onChange={e=>setItForm(f=>({...f,reference:e.target.value}))} placeholder="e.g. INC-20261234"/></div>
          <Btn onClick={logItReferral} disabled={!itForm.itemId||!itForm.description.trim()} full>Log IT referral</Btn>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>{["All",...IT_STATUSES].map(s=><button key={s} onClick={()=>setItFilter(s)} style={{padding:"5px 12px",borderRadius:20,border:"none",background:itFilter===s?BLUE:"#1a1d28",color:itFilter===s?"#fff":"#9ca3af",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{s}</button>)}</div>
        {itFiltered.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>No IT referrals yet</div>}
        {itFiltered.map(ref=>(
          <div key={ref.id} style={{background:"#141720",border:`0.5px solid ${ref.priority==="Urgent"?"#c05050":"#1e2130"}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{flex:1,paddingRight:8}}>
                <div style={{fontWeight:500,fontSize:14,display:"flex",alignItems:"center",gap:6}}>{ref.itemLabel}{ref.priority==="Urgent"&&<span style={{fontSize:10,background:"#2a0f14",color:"#f87171",borderRadius:4,padding:"2px 6px"}}>URGENT</span>}</div>
                <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>Logged: {fmtDate(ref.dateLogged)}{ref.loggedWith?" · "+ref.loggedWith:""}</div>
                {ref.reference&&<div style={{fontSize:12,color:BLUE,marginTop:1}}>Ref: {ref.reference}</div>}
              </div>
              {pill(ref.status,itStatusStyle)}
            </div>
            <div style={{fontSize:13,color:"#9ca3af",background:"#1a1d28",borderRadius:8,padding:"8px 10px",marginBottom:8}}>{ref.description}</div>
            {ref.updates?.length>0&&ref.updates.map((u,i)=><div key={i} style={{fontSize:12,color:"#9ca3af",borderLeft:`2px solid ${BLUE}`,paddingLeft:8,marginBottom:4}}><span style={{color:"#6b7280",marginRight:6}}>{fmt(u.date)}</span>{u.note}</div>)}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>{IT_STATUSES.filter(s=>s!==ref.status).map(s=><button key={s} onClick={()=>updateItStatus(ref.id,s)} style={{padding:"5px 11px",borderRadius:8,border:"0.5px solid #1e2130",background:"transparent",cursor:"pointer",color:"#e0e3ea",fontSize:12,fontFamily:"inherit"}}>→ {s}</button>)}</div>
            <button onClick={()=>setExpandItId(expandItId===ref.id?null:ref.id)} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer",padding:0}}>{expandItId===ref.id?"Hide update ▲":"Add update ▼"}</button>
            {expandItId===ref.id&&<div style={{marginTop:8,display:"flex",gap:8}}><input style={{...ipt,flex:1,fontSize:13}} value={itUpdateNote[ref.id]||""} onChange={e=>setItUpdateNote(n=>({...n,[ref.id]:e.target.value}))} placeholder="e.g. IT confirmed Thursday"/><Btn small onClick={()=>addItUpdate(ref.id)} color={BLUE}>Add</Btn></div>}
          </div>
        ))}
      </>)}

      {/* ── SCHEDULE ── */}
      {dashTab==="schedule"&&(<>
        <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Equipment schedule</div>
        <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Set available days and slot limits for bookable equipment</div>
        {/* Loan settings */}
        <div style={{background:"#141720",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:eqSettingsForm?12:0}}>
            <div style={{fontSize:13,fontWeight:500}}>⚙ Equipment Loan Settings</div>
            <button onClick={()=>setEqSettingsForm(f=>f?null:{...eqSettings})} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer"}}>{eqSettingsForm?"Cancel":"Edit"}</button>
          </div>
          {!eqSettingsForm&&<div style={{fontSize:12,color:"#9ca3af",marginTop:8}}>Yr2: {eqSettings.yr12Days}d/{eqSettings.yr2Cap||2}items · Yr3: {eqSettings.yr34Days}d/{eqSettings.yr3Cap||3}items · Yr4+: {eqSettings.yr34Days}d/{eqSettings.yr4Cap||4}items · Masters/Staff: {eqSettings.mastersCap||5}items · Fee: R{eqSettings.dailyRate}/day · Deadline: {eqSettings.collectionDeadlineHour}:00 · Slot cap: {eqSettings.slotCap||2}</div>}
          {eqSettingsForm&&(<div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
            {[["Year 2 loan (calendar days)","yr12Days"],["Year 3–4 loan (calendar days)","yr34Days"],["Late fee (R/day)","dailyRate"],["Max advance booking (days)","maxAdvanceDays"],["Booking deadline (hour, 24h)","collectionDeadlineHour"],["Max students per slot","slotCap"],["Max items — Year 2","yr2Cap"],["Max items — Year 3","yr3Cap"],["Max items — Year 4","yr4Cap"],["Max items — Masters/Staff","mastersCap"]].map(([label,key])=>(
              <div key={key} style={{display:"flex",alignItems:"center",gap:8}}>
                <label style={{fontSize:12,color:"#9ca3af",flex:1}}>{label}</label>
                <input type="number" style={{...ipt,width:70,flex:"0 0 auto"}} value={eqSettingsForm[key]} onChange={e=>setEqSettingsForm(f=>({...f,[key]:Number(e.target.value)}))}/>
              </div>
            ))}
            <Btn small onClick={()=>{setEqSettings(eqSettingsForm);localStorage.setItem(KEYS.eqSet,JSON.stringify(eqSettingsForm));setEqSettingsForm(null);}}>Save settings</Btn>
          </div>)}
        </div>
        {BOOKABLE.map(t=>{const s=schedule[t.id]||{days:[],morningSlots:1,afternoonSlots:1};const editing=editEq===t.id;return(
          <div key={t.id} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:14,padding:"16px 18px",marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:editing?12:4}}>
              <div style={{fontWeight:500,fontSize:14}}>{t.icon} {t.label}</div>
              <button onClick={()=>setEditEq(editing?null:t.id)} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer"}}>{editing?"Done ✓":"Edit"}</button>
            </div>
            {!editing&&<div style={{fontSize:12,color:"#6b7280"}}>{s.days.length>0?s.days.map(d=>DAY_FULL[d]).join(", "):"No days set"} · Morning: {s.morningSlots} · Afternoon: {s.afternoonSlots} · Min advance: {s.minAdvanceDays||0} days</div>}
            {editing&&(<>
              <div style={{fontSize:12,color:"#9ca3af",marginBottom:6}}>Available days:</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>{[1,2,3,4,5].map(d=>{const on=s.days.includes(d);return<button key={d} onClick={()=>toggleDay(t.id,d)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:on?TEAL:"#1a1d28",color:on?"#fff":"#9ca3af",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{DAY_FULL[d]}</button>;})}</div>
              <div style={{display:"flex",gap:12,marginBottom:12}}>{[["morningSlots","🌅 Morning"],["afternoonSlots","🌆 Afternoon"]].map(([k,l])=>(
                <div key={k} style={{flex:1}}><div style={{fontSize:12,color:"#9ca3af",marginBottom:6}}>{l} slots</div><div style={{display:"flex",gap:6}}>{[1,2,3].map(n=><button key={n} onClick={()=>updateSchedule(t.id,k,n)} style={{width:36,height:36,borderRadius:8,border:"none",background:s[k]===n?BLUE:"#1a1d28",color:s[k]===n?"#fff":"#9ca3af",fontSize:13,cursor:"pointer",fontWeight:500,fontFamily:"inherit"}}>{n}</button>)}</div></div>
              ))}</div>
              <div style={{fontSize:12,color:"#9ca3af",marginBottom:6}}>⏱ Min advance booking (business days)</div>
              <div style={{display:"flex",gap:6}}>{[0,1,2,3,5,7].map(n=><button key={n} onClick={()=>updateSchedule(t.id,"minAdvanceDays",n)} style={{width:36,height:36,borderRadius:8,border:"none",background:(s.minAdvanceDays||0)===n?BLUE:"#1a1d28",color:(s.minAdvanceDays||0)===n?"#fff":"#9ca3af",fontSize:13,cursor:"pointer",fontWeight:500,fontFamily:"inherit"}}>{n}</button>)}</div>
            </>)}
          </div>
        );})}
      </>)}

      {/* ── CALENDAR ── */}
      {dashTab==="cal"&&(()=>{
        const firstDay=new Date(staffCalYear,staffCalMonth,1).getDay();
        const daysInMonth=new Date(staffCalYear,staffCalMonth+1,0).getDate();
        const cells=[];for(let i=0;i<firstDay;i++)cells.push(null);for(let d=1;d<=daysInMonth;d++)cells.push(d);
        return(<>
          <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Calendar</div>
          <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Scheduled bookings by date</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <button onClick={()=>{setStaffCalDay(null);if(staffCalMonth===0){setStaffCalMonth(11);setStaffCalYear(y=>y-1);}else setStaffCalMonth(m=>m-1);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af"}}>‹</button>
            <div style={{fontWeight:500,fontSize:15}}>{MONTHS[staffCalMonth]} {staffCalYear}</div>
            <button onClick={()=>{setStaffCalDay(null);if(staffCalMonth===11){setStaffCalMonth(0);setStaffCalYear(y=>y+1);}else setStaffCalMonth(m=>m+1);}} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:"#9ca3af"}}>›</button>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:4}}>
            {DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:"#6b7280",fontWeight:500}}>{d}</div>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:16}}>
            {cells.map((d,i)=>{
              if(!d)return<div key={i}/>;
              const k=toKey(staffCalYear,staffCalMonth,d);
              const dayReqs=getReqsForDate(k);
              const sel=staffCalDay===k;
              const today=todayDate()===k;
              return(
                <div key={i} onClick={()=>setStaffCalDay(sel?null:k)} style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:8,fontSize:12,cursor:"pointer",background:sel?TEAL:today?"#0a2218":"#141720",border:`0.5px solid ${sel?TEAL:today?TEAL:"#1e2130"}`,color:sel?"#fff":today?TEAL:"#e0e3ea",fontWeight:sel||today?500:400}}>
                  <span>{d}</span>
                  {dayReqs.length>0&&<span style={{width:6,height:6,borderRadius:"50%",background:sel?"rgba(255,255,255,0.8)":TEAL,marginTop:2,flexShrink:0}}/>}
                </div>
              );
            })}
          </div>
          {staffCalDay&&(()=>{
            const dayReqs=getReqsForDate(staffCalDay);
            return(
              <div style={{background:"#141720",border:`0.5px solid ${TEAL}`,borderRadius:12,padding:"14px 16px",marginBottom:16}}>
                <div style={{fontWeight:500,fontSize:14,marginBottom:dayReqs.length>0?12:0,color:TEAL}}>{fmtDate(staffCalDay)}</div>
                {dayReqs.length===0&&<div style={{fontSize:13,color:"#6b7280"}}>No bookings on this date.</div>}
                {dayReqs.map(r=>(
                  <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",borderBottom:"0.5px solid #1e2130",paddingBottom:10,marginBottom:10}}>
                    <div>
                      <div style={{fontSize:13,fontWeight:500}}>{r.name}{r.studNo&&<span style={{fontWeight:400,color:"#6b7280",fontSize:12,marginLeft:6}}>#{r.studNo}</span>}</div>
                      <div style={{fontSize:12,color:"#9ca3af",marginTop:2}}>{r.type}</div>
                      <div style={{fontSize:11,color:"#6b7280",marginTop:1}}>{(()=>{const m=r.schedDate?.match(/\((.+)\)/);return m?`🕐 ${m[1]}`:(r.schedDate?.includes("Morning")?"🌅 Morning":"🌆 Afternoon");})()}</div>
                    </div>
                    {pill(r.status)}
                  </div>
                ))}
              </div>
            );
          })()}
        </>);
      })()}

      {/* ── CHARGES ── */}
      {dashTab==="charges"&&(<>
        <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Student charges</div>
        <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Late return fees and lost item charges — added to student accounts at month end</div>
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <input type="month" style={{...ipt,flex:"0 0 auto",width:"auto"}} value={chargesMonth} onChange={e=>{setChargesMonth(e.target.value);setFines([]);}}/>
          <input style={{...ipt,flex:1}} value={chargesStudNo} onChange={e=>setChargesStudNo(e.target.value)} placeholder="Filter by student no..."/>
          <Btn small onClick={async()=>{setFinesLoading(true);try{const r=await fetchFinesForMonth(chargesMonth);setFines(r);}catch(e){}setFinesLoading(false);}}>Load</Btn>
        </div>
        {finesLoading&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>Loading charges...</div>}
        {!finesLoading&&(()=>{
          const filtered=fines.filter(f=>!chargesStudNo||(f["Student No"]||"").toLowerCase().includes(chargesStudNo.toLowerCase()));
          const total=filtered.reduce((s,f)=>s+(f["Amount (R)"]||0),0);
          return(<>
            {filtered.length===0&&fines.length>0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>No charges matching that student number.</div>}
            {filtered.length===0&&fines.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>Click Load to fetch charges for this month.</div>}
            {filtered.length>0&&(<>
              <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,overflow:"hidden",marginBottom:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:0,fontSize:11,color:"#6b7280",background:"#1a1d28",padding:"8px 12px",fontWeight:500}}>
                  <span>Student</span><span>Date</span><span>Type</span><span>Item</span><span style={{textAlign:"right"}}>Amount</span>
                </div>
                {filtered.map((f,i)=>(
                  <div key={f.id||i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:0,fontSize:12,color:"#e0e3ea",padding:"10px 12px",borderTop:"0.5px solid #1e2130",alignItems:"center"}}>
                    <div><div style={{fontWeight:500}}>{f["Student Name"]}</div><div style={{fontSize:11,color:"#6b7280"}}>{f["Student No"]}</div></div>
                    <span>{f["Date"]||""}</span>
                    <span style={{color:f["Type"]==="Late Return"?"#c2410c":"#b91c1c"}}>{f["Type"]}</span>
                    <span>{f["Item Name"]}</span>
                    <span style={{textAlign:"right",fontWeight:600}}>R{f["Amount (R)"]||0}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#1a1d28",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
                <span style={{fontSize:14,fontWeight:600}}>Month total: R{total}</span>
                <Btn small onClick={()=>{
                  const month=chargesMonth;
                  const lines=filtered.map(f=>`${f["Student Name"]} (${f["Student No"]}): R${f["Amount (R)"]||0} ${f["Type"]}${f["Item Name"]&&f["Type"]==="Lost Item"?" — "+f["Item Name"]:""}`).join("\n");
                  const text=`Equipment Charges — ${month}\n${lines}\nTOTAL: R${total}`;
                  navigator.clipboard?.writeText(text);
                }}>Copy for admin</Btn>
              </div>
            </>)}
          </>);
        })()}
      </>)}

      {/* ── BLOCKS ── */}
      {dashTab==="blocks"&&(<>
        <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Block dates</div>
        <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Block specific dates — leave, maintenance, public holidays</div>
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Date to block</label><input type="date" style={ipt} value={blockDate} onChange={e=>setBlockDate(e.target.value)}/></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Reason (students will see this)</label><input style={ipt} value={blockReason} onChange={e=>setBlockReason(e.target.value)} placeholder="e.g. Maintenance day, On leave, Public holiday"/></div>
          <Btn onClick={addBlock} disabled={!blockDate||!blockReason.trim()} full>Block this date</Btn>
        </div>
        {Object.keys(blocks).length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>No dates blocked yet</div>}
        {Object.entries(blocks).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>(
          <div key={k} style={{background:"#141720",border:"0.5px solid #4a1a1a",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:500,fontSize:14,color:"#e24b4a"}}>🚫 {k}</div><div style={{fontSize:13,color:"#9ca3af",marginTop:2}}>{v.reason}</div></div>
            <button onClick={()=>removeBlock(k)} style={{background:"none",border:"none",color:"#6b7280",fontSize:18,cursor:"pointer"}}>×</button>
          </div>
        ))}
      </>)}

      {/* ── CHECK-IN MODAL ── */}
      {checkInModal&&(()=>{
        const req=checkInModal;
        const allItemNames=(req.details?.itemsData||[]).map(i=>i.name);
        const alreadyReturned=req.returnedItems||[];
        const pendingItems=allItemNames.filter(n=>!alreadyReturned.includes(n));
        const today=todayDate();
        const allBack=ciReturning.length===pendingItems.length&&pendingItems.every(n=>ciReturning.includes(n));
        const lateDays=allBack&&req.dueDate?countDaysLate(req.dueDate,today):0;
        const lateFine=lateDays*eqSettings.dailyRate;
        const lostCosts=ciLost.reduce((s,name)=>{const cost=(req.details?.itemsData||[]).find(i=>i.name===name)?.replacementCost||500;return s+cost;},0)+ciLostAccessories.reduce((s,a)=>s+a.cost,0);
        const totalCharges=lateFine+lostCosts;
        return(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:16,padding:"20px",maxWidth:500,width:"100%",maxHeight:"90vh",overflowY:"auto"}}>
              <div style={{fontSize:16,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>Equipment Check-In</div>
              <div style={{fontSize:13,color:"#4b5563",marginBottom:12}}>{req.name} · {req.studNo}</div>
              {alreadyReturned.length>0&&<div style={{background:"#0a2218",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:12,color:"#20B07F"}}>✅ Already returned: {alreadyReturned.join(", ")}</div>}
              <div style={{fontSize:13,fontWeight:500,marginBottom:8,color:"#9ca3af"}}>Items being returned <strong style={{color:"#e0e3ea"}}>now</strong>:</div>
              {pendingItems.map(name=>{
                const itemData=(req.details?.itemsData||[]).find(i=>i.name===name);
                const accessories=itemData?.accessories||[];
                const isReturning=ciReturning.includes(name);
                return(
                  <div key={name} style={{marginBottom:6}}>
                    <label style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,background:isReturning?"#0a2218":"#1a1d28",cursor:"pointer"}}>
                      <input type="checkbox" checked={isReturning} onChange={e=>{setCiReturning(prev=>e.target.checked?[...prev,name]:prev.filter(n=>n!==name));if(!e.target.checked)setCiLostAccessories(prev=>prev.filter(a=>a.itemName!==name));}} style={{width:15,height:15,flexShrink:0}}/>
                      <span style={{fontSize:13,color:isReturning?"#20B07F":"#e0e3ea",fontWeight:500}}>{name}</span>
                    </label>
                    {isReturning&&accessories.length>0&&(
                      <div style={{paddingLeft:24,paddingTop:3,paddingBottom:2}}>
                        <div style={{fontSize:11,color:"#6b7280",margin:"3px 0 3px 4px"}}>Accessories — uncheck any that are missing:</div>
                        {accessories.map(acc=>{
                          const isLostAcc=ciLostAccessories.some(a=>a.itemName===name&&a.accessory===acc);
                          const cost=accessoryCost(acc);
                          return(
                            <label key={acc} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 10px",borderRadius:6,background:isLostAcc?"#2a0f14":"#0f1318",marginBottom:2,cursor:"pointer"}}>
                              <input type="checkbox" checked={!isLostAcc} onChange={e=>{if(!e.target.checked)setCiLostAccessories(prev=>[...prev,{itemName:name,accessory:acc,cost}]);else setCiLostAccessories(prev=>prev.filter(a=>!(a.itemName===name&&a.accessory===acc)));}} style={{width:13,height:13,flexShrink:0}}/>
                              <span style={{fontSize:12,color:isLostAcc?"#f87171":"#9ca3af",flex:1}}>{acc}</span>
                              {isLostAcc&&<span style={{fontSize:11,color:"#f87171",fontWeight:500,whiteSpace:"nowrap"}}>Missing · R{cost}</span>}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              {ciReturning.length>0&&(<>
                <div style={{fontSize:13,fontWeight:500,margin:"12px 0 8px",color:"#9ca3af"}}>Mark any item as <strong style={{color:"#f87171"}}>entirely lost</strong>:</div>
                {ciReturning.map(name=>(
                  <label key={name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:ciLost.includes(name)?"#2a0f14":"#1a1d28",marginBottom:6,cursor:"pointer"}}>
                    <input type="checkbox" checked={ciLost.includes(name)} onChange={()=>setCiLost(l=>l.includes(name)?l.filter(x=>x!==name):[...l,name])} style={{width:15,height:15,flexShrink:0,accentColor:"#f87171"}}/>
                    <span style={{fontSize:13,color:ciLost.includes(name)?"#f87171":"#e0e3ea"}}>{name}</span>
                  </label>
                ))}
              </>)}
              <div style={{marginTop:16}}>
                <label style={{fontSize:12,color:"#6b7280",display:"block",marginBottom:4}}>Notes (optional)</label>
                <textarea style={{width:"100%",background:"#1a1d28",border:"0.5px solid #1e2130",borderRadius:8,padding:"8px 10px",fontSize:13,color:"#e0e3ea",resize:"vertical",fontFamily:"inherit"}} rows={2} value={ciNotes} onChange={e=>setCiNotes(e.target.value)} placeholder="e.g. Returned in good condition"/>
              </div>
              {totalCharges>0&&(
                <div style={{background:"#2a1f0a",borderRadius:8,padding:"10px 12px",marginTop:12,fontSize:13}}>
                  {lateFine>0&&<div style={{color:"#d4851a",marginBottom:4}}>Late fee: R{lateFine} ({lateDays} day{lateDays!==1?"s":""})</div>}
                  {lostCosts>0&&<div style={{color:"#f87171",marginBottom:4}}>Lost items: R{lostCosts}</div>}
                  <div style={{fontWeight:600,color:"#e0e3ea"}}>Total charges: R{totalCharges}</div>
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <Btn outline color="#4b5563" onClick={()=>{setCheckInModal(null);setCiReturning([]);setCiLost([]);setCiNotes("");setCiLostAccessories([]);}} style={{flex:1}}>Cancel</Btn>
                <Btn color={TEAL} onClick={()=>confirmCheckIn(req,ciReturning,ciLost,ciNotes)} disabled={ciReturning.length===0} style={{flex:2}}>Confirm Check-In</Btn>
              </div>
            </div>
          </div>
        );
      })()}

      </div>
    </div>
  );
}
}