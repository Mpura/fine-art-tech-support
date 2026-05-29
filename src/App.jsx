import { useState, useEffect, useRef } from "react";

const TEAL = "#20B07F";
const BLUE = "#3b82f6";
const AMBER = "#d4851a";
const RED = "#e05a5a";
const TYPE_COLOR = {equipment:"#20B07F",print:"#3b82f6",laser:"#E65C00","3d":"#8b5cf6",studio:"#f59e0b",gallery:"#ef4444",software:"#06b6d4",avsetup:"#a855f7",query:"#6B7280"};

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
const MAINT_TABLE = "tbldZisWbs1WQIr09";
const PM_TABLE = "tblHyr7MxWVDIzFtC";

const YEAR_LABELS = {"1":"1st year","2":"2nd year","3":"3rd year","4":"4th year","m":"Masters","s":"Staff","o":"Other"};

const REQUEST_TYPES = [
  {id:"print",label:"Large format & photographic printing",icon:"🖨️",booking:"advance booking only",bookable:true,needsFiles:true,prep:["File must be PDF, JPEG or TIFF","Colour profile must be sRGB or CMYK","Know your paper size (A4 → A0)","Decide paper type: normal, glossy, newsprint or photographic","Know how many copies you need","⚠️ Minimum 2 business days advance booking required","⚠️ Test print may be needed — same-day completion is NOT guaranteed"]},
  {id:"laser",label:"Laser cutter & engraving",icon:"⚡",booking:"advance booking only",bookable:true,needsFiles:true,prep:["Design in CorelDRAW, export as .AI for vector jobs (or .BMP for photo engraving)","Convert all text to curves before exporting: select text → Ctrl+Q","Use different colours for different operations (e.g. one colour for cut lines, another for engrave areas)","Check your design in Wireframe view (View → Wireframe) — what you see is what the laser cuts","Know your exact material type and thickness in mm","Bring your own tape if securing lightweight materials to the bed","Bring your file on a USB stick — must be under 1 GB, formatted as FAT","⚠️ Banned materials: PVC, polycarbonate, rubber, fibreglass, foam, galvanised metal, MDF — see guide","⚠️ You MUST be present for the full duration of your session — no drop-off jobs","⚠️ First-time users: a material test cut is required before your main job","⚠️ Minimum 3 business days advance — no same-day or next-day bookings"]},
  {id:"3d",label:"3D printing",icon:"🧱",booking:"advance booking only",bookable:false,needsFiles:true,prep:["File must be STL or OBJ","Know your dimensions and scale","Decide material preference","Decide infill density","⚠️ Minimum 5 business days advance — prints take hours to complete","⚠️ Drop-off service: you will be notified when your print is ready to collect"]},
  {id:"software",label:"Software install",icon:"💻",booking:"walk-in",bookable:false,needsFiles:false,prep:["Know the exact software name","Have the download URL ready","Know which Mac number and lab room"]},
  {id:"studio",label:"Lighting studio",icon:"💡",booking:"advance booking only",bookable:false,needsFiles:false,prep:["Studio orientation required before first use — speak to Tech Support","Keys must be returned same day by 17:00","Bring your student card when collecting","⚠️ Studio is for photography students only"]},
  {id:"equipment",label:"Equipment booking",icon:"📷",booking:"advance booking only",bookable:false,needsFiles:false,prep:[]},
  {id:"gallery",label:"Gallery / space booking",icon:"🖼️",booking:"advance booking only",bookable:false,needsFiles:false,prep:["Have a clear concept or proposal for the event","Know your proposed dates and how many days you need","Estimate expected attendance","List any setup requirements (tables, chairs, PA, lighting)","⚠️ Bookings are subject to availability and departmental approval"]},
  {id:"avsetup",label:"Tech setup / AV support",icon:"📽️",booking:"advance booking — 5 days min",bookable:false,needsFiles:false,prep:["Know your event date and time","Know the venue or space you'll be using","Have an idea of what device you're connecting (MacBook, Windows, iPad, phone — or none)","Think about how many screens or projection surfaces you need","⚠️ Only 2 projectors are available for booking — request early","⚠️ Minimum 5 business days notice required — this allows time for equipment checks and cable runs"]},
  {id:"query",label:"General query / other",icon:"💬",booking:"questions, issues & everything else",bookable:false,needsFiles:false,prep:[]},
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
const AV_STATUSES = ["Pending","Confirmed","In Progress","Done","Declined"];
const LASER_STATUSES = ["Pending","Material test required","Ready to cut","In Progress","Done","Declined"];
const EQ_STATUSES = ["Pending","Confirmed","Ready to collect","Collected","Partially Returned","Returned","Uncollected","Declined","Cancelled"];

const statusStyle = {
  // Maintenance statuses
  "Open":{bg:"#1a1d28",color:"#9ca3af"},
  "Submitted to Estates":{bg:"#0a1e35",color:"#60a5fa"},
  "Resolved":{bg:"#0a2218",color:"#20B07F"},
  "Closed":{bg:"#1a1d28",color:"#4b5563"},
  // Request statuses
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
const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DAY_FULL=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const KEYS={req:"fats_req_v5",sched:"fats_sched_v5",block:"fats_block_v5",maint:"fats_maint_v5",hs:"fats_hs_v5",leave:"fats_leave_v5",savedStudNo:"fats_studno_v1",staffPin:"fats_pin_v1",eqSet:"fats_eqset_v1",lic:"fats_lic_v1"};

// Default Corel licence pre-loaded
const DEFAULT_LICENCES=[{id:"corel_2026_01",software:"CorelDRAW Graphics Suite Education",vendor:"Learning Curve",vendorContact:"Phillip Mokgethi",vendorPhone:"+27 84 424 0772",poNumber:"RP0000122595",licenceNo:"1158587",importCode:"10690273",partNo:"LCCDGSSUBA11",seats:2,effectiveDate:"2026-05-12",expiryDate:"2027-05-11",notes:"365-Day Subscription (Single User). Activate at coreldraw.com/licensemanagement. Keep this certificate for renewal reference.",createdAt:"2026-05-12T09:11:00.000Z"}];
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

// Rush-mode: staff append ?rush=1 to the URL to bypass the 5-day minimum for last-minute requests
const RUSH_MODE = new URLSearchParams(window.location.search).get("rush")==="1";

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

// ── UNIVERSITY CALENDAR ──────────────────────────────────────────
// Source: Rhodes University Diary 2026 (official). Update each year.
const PUBLIC_HOLIDAYS_2026 = [
  {date:"2026-01-01",label:"New Year's Day"},
  {date:"2026-03-21",label:"Human Rights Day"},
  {date:"2026-04-03",label:"Good Friday"},
  {date:"2026-04-06",label:"Family Day"},
  {date:"2026-04-27",label:"Freedom Day"},
  {date:"2026-05-01",label:"Workers' Day"},
  {date:"2026-06-16",label:"Youth Day"},
  {date:"2026-08-10",label:"National Women's Day (observed)"},
  {date:"2026-09-24",label:"Heritage Day"},
  {date:"2026-12-16",label:"Day of Reconciliation"},
  {date:"2026-12-25",label:"Christmas Day"},
  {date:"2026-12-26",label:"Day of Goodwill"},
];
// University vacation/recess periods — stockroom CLOSED
const RECESS_RANGES = [
  {start:"2026-03-21",end:"2026-03-29",label:"Mid-semester Vacation"},
  {start:"2026-06-13",end:"2026-07-05",label:"Mid-year Vacation"},
  {start:"2026-08-15",end:"2026-08-23",label:"Mid-semester Vacation"},
  {start:"2026-12-15",end:"2026-12-31",label:"Year-end Closure"},
];
// SWOT periods — equipment IS available (students studying for exams)
const SWOT_RANGES = [
  {start:"2026-05-16",end:"2026-05-20",label:"SWOT Period"},
  {start:"2026-10-02",end:"2026-10-07",label:"SWOT Period"},
];
function inRange(dateStr,start,end){return dateStr>=start&&dateStr<=end;}
function getDateStatus(dateStr){
  if(!dateStr)return null;
  // SWOT week — explicitly allowed, just flag it
  const swot=SWOT_RANGES.find(r=>inRange(dateStr,r.start,r.end));
  if(swot)return{type:"swot",label:swot.label};
  // Public holiday
  const ph=PUBLIC_HOLIDAYS_2026.find(h=>h.date===dateStr);
  if(ph)return{type:"blocked",label:ph.label};
  // Recess
  const recess=RECESS_RANGES.find(r=>inRange(dateStr,r.start,r.end));
  if(recess)return{type:"blocked",label:recess.label};
  return null;
}

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

async function atDelete(table, recordId) {
  const res = await fetch("/api/airtable", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ table, method: "DELETE", recordId }),
  });
  return res.json();
}

// ── ARCHIVE SUMMARY ─────────────────────────────────────────────
function archiveSummary(req){
  const d=req.details||{};
  if(req.typeId==="print"){
    const copies=d.copies?`${d.copies} cop${parseInt(d.copies)===1?"y":"ies"}`:null;
    return [d.paperSize,d.paperType,copies].filter(Boolean).join(" · ")||null;
  }
  if(req.typeId==="laser"){
    const mat=d.material&&d.materialThickness?`${d.material} ${d.materialThickness}mm`:d.material;
    return [mat,d.jobType].filter(Boolean).join(" · ")||null;
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

// ── BUDGET / ACE PANEL ───────────────────────────────────────────
const ACE_2026=[
  {no:1,item:"Sony A7IV + 28-70mm lens",use:"Digital cameras for photography teaching, artwork documentation, and student assessment across all Fine Art disciplines. Supersedes Canon 5D Mk II / III.",type:"Addition",assetNo:null,qty:2,unitPrice:39995,total:79990,criticality:"Fundamental to the delivery of photography and documentation-based teaching: Without reliable cameras, students cannot create, present, or evaluate photographic and video work.",risk:"Outdated DSLRs are unreliable and incompatible with current software, creating workflow disruptions and data-loss risks.",growth:"Supports growing student numbers and the department's shift towards digital and hybrid art-making.",rating:5},
  {no:2,item:"Sony A6700 + 16-50mm lens",use:"Compact mirrorless camera for video documentation of demonstrations and workshops requiring portability. Supports video and sound combined with traditional media.",type:"Addition",assetNo:null,qty:1,unitPrice:24995,total:24995,criticality:"Important for video and digital media instruction, workshops, and student research.",risk:"Lack of compact modern cameras limits moving image teaching and encourages unsafe improvisation with ageing DSLRs.",growth:"Expands learning opportunities for experimental video and hybrid media.",rating:5},
  {no:3,item:"DJI RS 4 Pro combo",use:"Professional gimbal stabiliser for smooth, high-quality camera movement in documentation and student video projects including installations, performances, and exhibitions.",type:"Addition",assetNo:null,qty:1,unitPrice:23295,total:23295,criticality:"Essential for stable camera operation in documentation of installations, performances, and student films.",risk:"Without stabilisation tools, students risk equipment damage and poor-quality documentation.",growth:"Expands the department's ability to support video-based coursework and interdisciplinary projects.",rating:5},
  {no:4,item:"DJI OSMO Pocket 3 creator combo",use:"Compact camera for quick documentation of installations, performances, and student projects both in and outside the studio. Useful across all Fine Art disciplines.",type:"Addition",assetNo:null,qty:1,unitPrice:16695,total:16695,criticality:"A flexible and accessible camera for rapid documentation and student-led projects.",risk:"Lacking compact portable cameras restricts capture of smaller installations and events.",growth:"Encourages student engagement with mobile and site-based practices.",rating:5},
  {no:5,item:"Lowepro Tahoe BP150 bag",use:"Protective backpack to transport cameras and accessories safely between studios, classrooms, and off-site venues. Shared departmental use.",type:"Addition",assetNo:null,qty:2,unitPrice:2195,total:4390,criticality:"Essential for protecting and extending the life of valuable cameras used in teaching.",risk:"Without protective transport, equipment is exposed to impact, dust, and moisture damage.",growth:"Improves logistics and equipment management across teaching spaces.",rating:4},
  {no:6,item:"Jenova modern shoulder bag",use:"Lightweight shoulder bag for compact camera kits used in classes and fieldwork. Supports easy handling and accessibility across all sections.",type:"Addition",assetNo:null,qty:1,unitPrice:2195,total:2195,criticality:"Supports safe handling and easy transport of smaller camera kits.",risk:"Unprotected transport increases likelihood of accidental damage.",growth:"Encourages student engagement with mobile and site-based practices.",rating:4},
  {no:7,item:"Smallrig 3824 battery charger kit",use:"Additional power supply for mirrorless cameras for extended teaching or documentation sessions. Ensures uninterrupted operation during exhibitions and student assessments.",type:"Addition",assetNo:null,qty:2,unitPrice:1590,total:3180,criticality:"Ensures cameras remain on continuously without disrupting class activities.",risk:"Limited battery capacity can lead to workflow interruptions, data loss, and project delays.",growth:"Supports simultaneous use of cameras and longer shooting sessions.",rating:4},
  {no:8,item:"Smallrig 4336 cage for A6700",use:"Protective camera cage providing mounting points for lights, microphones, and accessories. Improves functionality and safety of the A6700 in multiple Fine Art teaching contexts.",type:"Addition",assetNo:null,qty:1,unitPrice:1495,total:1495,criticality:"Improves safety, functionality, and versatility of the A6700 camera setup.",risk:"Cameras are more prone to wear and damage without a protective cage during student use.",growth:"Expands adaptability of cameras for advanced student projects.",rating:3},
  {no:9,item:"Epson 4100lm FullHD projector (1920×1080)",use:"First Full HD projector in the Fine Art department. Used to display student artwork, portfolios, and multimedia projects in high resolution for critiques, demonstrations, and workshops.",type:"Addition",assetNo:null,qty:3,unitPrice:13121,total:39363,criticality:"Essential for teaching and presenting student artwork and multimedia projects.",risk:"Current projectors are outdated or low resolution, making it difficult to display artwork clearly.",growth:"Being the first Full HD projector, supports shift to high-quality digital presentations and expanding student numbers.",rating:4},
  {no:10,item:"Epson soft carry case",use:"Optional carry bag for safe transport of the Epson 4100lm projector between classrooms, studios, and exhibition spaces.",type:"Addition",assetNo:null,qty:3,unitPrice:1084,total:3252,criticality:"Not critical; serves only for safe transport.",risk:"Without it, the projector is more vulnerable to damage during movement between spaces.",growth:"Improves mobility and flexibility of projector use.",rating:2},
];

const IT_2026={
  current:[
    {pc:"Master PC",assetNo:"RU02NFSS",use:"Adobe video editing, photography, 3D works, laser engraving, assisting students with troubleshooting"},
    {pc:"Photo Printing PC",assetNo:"RU023C7B",use:"Photo printing workflow"},
    {pc:"Laser PC",assetNo:"RU023C7B",use:"Laser engraving previews and student support"},
  ],
  monitors:[
    {pc:"Master PC",assetNo:"RU02TGX7",spec:"27-inch, AdobeRGB, 1440p+, calibration capable",notes:"Supports video editing, 3D works, photography, laser engraving"},
    {pc:"Photo Printing PC",assetNo:"RU01A5QD",spec:"22-inch, AdobeRGB, Full HD, factory-calibrated preferred",notes:"Ensures accurate photo previews and prints; cost-effective"},
    {pc:"Laser PC",assetNo:"RU01GM4E",spec:"Reuse current Master monitor",notes:"Sufficient quality for laser engraving previews; resource optimisation"},
  ],
  towers:[
    {pc:"Master PC",spec:"Intel i7 / AMD Ryzen 7, 32GB+ RAM, dedicated GPU, ≥1TB SSD, Windows 11 Pro",notes:"Current tower (i5, 16GB, integrated GPU, 500GB SSD) struggles with urgent tasks. Example: Master's student video corrupted hours before exam; required re-edit, render, and export.",action:"New tower"},
    {pc:"Laser PC",spec:"Intel i5 / AMD Ryzen 5, 16GB RAM, integrated GPU, 512GB SSD, Windows 11 Pro",notes:"Provides stable performance for laser engraving workflows.",action:"New tower"},
    {pc:"Photo Printing PC",spec:"Current Master PC tower (RU02NFSS) repurposed",notes:"Existing tower sufficient; main requirement is high-quality monitor.",action:"Repurpose Master PC tower"},
  ],
  software:[
    {pc:"Master PC & Dedicated PC",software:"CorelDRAW Graphics Suite",purpose:"Vector graphics for design, photo editing, laser engraving prep",license:"Renewal, 2 seats",detail:"Part No: LCCDGSSUBA11 · Education 365-Day Subscription · Expiry: 14-04-2026"},
    {pc:"Master PC & Laser PC",software:"LightBurn",purpose:"Laser engraving file preparation and production",license:"One-off purchase, 3 seats (Master PC + Laser PC + 1 spare)",detail:"New purchase"},
  ],
  summary:[
    "Master PC receives high-performance tower and 27-inch AdobeRGB monitor for urgent, high-demand tasks.",
    "Current Master PC tower and monitor repurposed for Photo Printing PC and Laser PC — avoiding unnecessary expenditure.",
    "Laser PC receives cost-effective tower for reliable engraving workflows.",
    "CorelDRAW renewal and LightBurn one-off purchase ensure all PCs are fully capable.",
    "Optimises resources while improving workflow efficiency, print accuracy, and student support.",
  ],
};

const FE_2026=[
  {section:"First Year Studio",items:[
    {no:"FY-1",item:"Projector Ceiling Mount",use:"For presentations and crits; used by multiple sections.",type:"Addition",assetNo:null,qty:1,criticality:1,risk:1,urgency:3,rating:3},
    {no:"FY-2",item:"Remote Projector Screen",use:"Improves presentation quality during teaching and student critiques.",type:"Addition",assetNo:null,qty:1,criticality:3,risk:1,urgency:3,rating:9},
    {no:"FY-3",item:"Blinds",use:"Light control for better visual display.",type:"Addition",assetNo:null,qty:2,criticality:5,risk:1,urgency:5,rating:25},
    {no:"FY-4",item:"Desk Rectangular 1600×800 (3 drawers)",use:"Replace old and unsightly office desk.",type:"Replacement",assetNo:null,qty:1,criticality:1,risk:1,urgency:3,rating:3,office:true},
    {no:"FY-5",item:"Curtains",use:"Office curtains very old and faded; need replacement.",type:"Replacement",assetNo:null,qty:1,criticality:1,risk:1,urgency:3,rating:3,office:true},
    {no:"FY-6",item:"Chair Highback helm contract with arms",use:"Replace office chair.",type:"Replacement",assetNo:null,qty:1,criticality:1,risk:1,urgency:3,rating:3,office:true},
  ]},
  {section:"Painting Studio",items:[
    {no:"PA-1",item:"Dividers / Movable Walls",use:"Provide flexible studio layouts. Improves safety by creating clear working areas and separating materials and tools.",type:"Addition",assetNo:null,qty:4,criticality:5,risk:1,urgency:5,rating:25},
    {no:"PA-2",item:"Extractor Fan (Spray Booth)",use:"Ensures safe ventilation when using solvents and spray materials. Critical for health and safety compliance and air quality.",type:"Addition",assetNo:null,qty:1,criticality:3,risk:3,urgency:3,rating:27},
    {no:"PA-3",item:"Flammable Waste Cans",use:"Safe disposal for solvents and thinners. Essential to prevent fire hazards and meet safety regulations.",type:"Addition",assetNo:null,qty:6,criticality:5,risk:5,urgency:5,rating:125},
    {no:"PA-4",item:"Blinds",use:"No blinds in office windows; impossible to control light.",type:"Replacement",assetNo:null,qty:1,criticality:5,risk:1,urgency:3,rating:15,office:true},
  ]},
  {section:"Sculpture Studio",items:[
    {no:"SC-1",item:"L-Shaped Desk",use:"Returning to Sculpture office after 9 years; old desk unsuitable for office work.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:1,urgency:5,rating:25,office:true},
    {no:"SC-2",item:"High-Back Chair",use:"Current chair broken; needs ergonomic replacement for daily use.",type:"Replacement",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75,office:true},
    {no:"SC-3",item:"Filing Cabinet",use:"Organised storage of departmental and teaching materials.",type:"Replacement",assetNo:null,qty:1,criticality:5,risk:1,urgency:5,rating:25,office:true},
    {no:"SC-4",item:"Blinds",use:"Existing blinds are paint-splattered, torn, and in disrepair.",type:"Replacement",assetNo:null,qty:1,criticality:5,risk:1,urgency:3,rating:15,office:true},
  ]},
  {section:"Photography Studio",items:[
    {no:"PH-1",item:"Parrat RT3030 A2 Rotary Trimmer",use:"Precision cutting tool for photographic and digital prints. Supports both Digital Arts and Photography. Important for accuracy and safety.",type:"Addition",assetNo:null,qty:2,criticality:5,risk:3,urgency:5,rating:75},
  ]},
  {section:"Digital Arts Studio",items:[
    {no:"DA-1",item:"Remote Projector Screen",use:"Enhances presentation and teaching quality during critiques and lectures. Shared by Photography and Digital Arts.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:1,urgency:3,rating:15},
    {no:"DA-2",item:"Projector Ceiling Mount",use:"Supports studio presentations and crits; improves efficiency.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:1,urgency:5,rating:25},
  ]},
  {section:"Print Studio",items:[
    {no:"PR-1",item:"Mat Cutter",use:"Precise cutting of prints and paper in the shared departmental workshop. Essential for framing and safe handling of sharp tools.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
  ]},
  {section:"Departmental Workshop / Lab",items:[
    {no:"DW-1",item:"3D Scanner",use:"Used across all sections for scanning sculptures, installations, and artworks for digital documentation. Supports research and exhibition preparation.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
    {no:"DW-2",item:"3D Printer",use:"Enables model-making and prototype creation. Shared tool supporting design development across sections and interdisciplinary collaboration.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
    {no:"DW-3",item:"CO₂ Laser Engraver",use:"Replaces the outdated 2014 model. Shared fabrication tool used by multiple sections for engraving and prototyping. Essential for modern digital fabrication and safety compliance.",type:"Replacement",assetNo:"RU021Y7V",qty:1,criticality:5,risk:5,urgency:5,rating:125},
    {no:"DW-4",item:"Heat Press / Sublimation Press",use:"Transfer digital designs onto paper/fabric. Promotes cross-media learning between Digital Arts and Printmaking.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
    {no:"DW-5",item:"Matterport 3D Camera Pro3",use:"Captures 3D scans for documentation of exhibitions and installations. Used across all sections to digitally archive work and improve departmental visibility.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:5,urgency:5,rating:125},
    {no:"DW-6",item:"Material Handling Trolley",use:"Used by the Technical Assistant, workshop staff, and students across all studios to safely transport heavy materials, sculptures, and equipment. Prevents injuries and damage to artworks.",type:"Addition",assetNo:null,qty:1,criticality:5,risk:3,urgency:5,rating:75},
  ]},
];

function BudgetPanel(){
  const TEAL="#20B07F";
  const [budTab,setBudTab]=useState("ace"); // ace | fe | it
  const [showProcess,setShowProcess]=useState(false);
  const [expanded,setExpanded]=useState(null);
  const [approvals,setApprovals]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("ace2026_approvals")||"{}");}catch{return {};}
  });
  const [approvedAmounts,setApprovedAmounts]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("ace2026_amounts")||"{}");}catch{return {};}
  });
  const [feApprovals,setFeApprovals]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("fe2026_approvals")||"{}");}catch{return {};}
  });
  const [itApprovals,setItApprovals]=useState(()=>{
    try{return JSON.parse(localStorage.getItem("it2026_approvals")||"{}");}catch{return {};}
  });

  function setApproval(no,status){
    const next={...approvals,[no]:status};
    setApprovals(next);
    localStorage.setItem("ace2026_approvals",JSON.stringify(next));
  }
  function setApprovedAmt(no,val){
    const next={...approvedAmounts,[no]:val};
    setApprovedAmounts(next);
    localStorage.setItem("ace2026_amounts",JSON.stringify(next));
  }
  function setFeApproval(no,status){
    const next={...feApprovals,[no]:status};
    setFeApprovals(next);
    localStorage.setItem("fe2026_approvals",JSON.stringify(next));
  }
  function setItApproval(key,status){
    const next={...itApprovals,[key]:status};
    setItApprovals(next);
    localStorage.setItem("it2026_approvals",JSON.stringify(next));
  }

  const totalRequested=ACE_2026.reduce((s,i)=>s+i.total,0);
  const totalApproved=ACE_2026.reduce((s,i)=>{
    if(approvals[i.no]==="approved"){
      const a=parseFloat(approvedAmounts[i.no]);
      return s+(isNaN(a)?i.total:a);
    }
    return s;
  },0);
  const countApproved=ACE_2026.filter(i=>approvals[i.no]==="approved").length;
  const countRejected=ACE_2026.filter(i=>approvals[i.no]==="rejected").length;
  const countPending=ACE_2026.filter(i=>!approvals[i.no]).length;

  const ratingColor=r=>r>=5?"#20B07F":r>=4?"#60a5fa":r>=3?"#d4851a":"#6b7280";
  const statusBg={approved:"#0a2218",rejected:"#2a0f14",undefined:"#1a1d28"};
  const statusCol={approved:"#20B07F",rejected:"#f87171",undefined:"#6b7280"};

  const ipt={background:"#1a1d28",border:"0.5px solid #1e2130",borderRadius:6,padding:"4px 8px",fontSize:12,color:"#e0e3ea",fontFamily:"inherit",width:"100%",boxSizing:"border-box"};

  return(
    <div>
      <div style={{fontSize:15,fontWeight:500,marginBottom:2}}>Budget Submissions 2025–2026</div>
      <div style={{fontSize:13,color:"#6b7280",marginBottom:4}}>Prepared by Mpumzi Mpati · Reviewed by Prof Maureen de Jager · Department of Fine Art</div>
      <div style={{fontSize:11,color:"#4b5563",marginBottom:12}}>Track approval status as decisions are communicated. Saved locally on this device.</div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[["ace","📷 ACE — Capital Equipment"],["fe","🪑 F&E — Furniture & Equipment"],["it","💻 IT / Computer Equipment"]].map(([v,l])=>(
          <button key={v} onClick={()=>{setBudTab(v);setExpanded(null);}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:budTab===v?TEAL:"#141720",color:budTab===v?"#fff":"#6b7280",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:budTab===v?"none":"0.5px solid #1e2130"}}>{l}</button>
        ))}
      </div>

      {/* ── PROCESS & CONTACTS ── */}
      <div style={{marginBottom:16}}>
        <button onClick={()=>setShowProcess(p=>!p)} style={{width:"100%",background:"#0d1520",border:"0.5px solid #1e3a5f",borderRadius:10,padding:"9px 14px",color:"#60a5fa",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span>ℹ️ Budget Process & Contacts — Finance Division 2026</span>
          <span style={{color:"#374151"}}>{showProcess?"▲":"▼"}</span>
        </button>
        {showProcess&&(
          <div style={{background:"#0d1520",border:"0.5px solid #1e3a5f",borderTop:"none",borderRadius:"0 0 10px 10px",padding:"14px 16px"}}>
            <div style={{fontSize:11,color:"#374151",marginBottom:12}}>Issued by Finance Division · 25 August 2025 · Council Funded Budget 2026</div>

            {/* Category rules */}
            <div style={{display:"grid",gap:8,marginBottom:16}}>
              {[
                {cat:"📷 ACE",email:"finbudget+capex@ru.ac.za",deadline:"31 Oct 2025",contact:"Rodney Bridger (r.bridger@ru.ac.za · ext 8137)",rule:"Quotes must be sourced and included with submission. HOD must sign off.",submitted:true},
                {cat:"🪑 F&E",email:"finbudget+fe@ru.ac.za",deadline:"17 Oct 2025",contact:"Merril Prinsloo (m.prinsloo@ru.ac.za · ext 8136)",rule:"No prices needed — Buying Office sources quotes, except for specialised items. HOD sign-off required.",submitted:true},
                {cat:"💻 IT / Computer",email:"support@ru.ac.za",deadline:"24 Oct 2025",contact:"Tracey Chambers (t.chambers@ru.ac.za · ext 8290)",rule:"Submitted to I&TS division, not Finance. Include asset numbers for replacements.",submitted:true},
                {cat:"📊 Operational",email:"finbudget+ops@ru.ac.za",deadline:"25 Sep 2025",contact:"Linda Booi (l.booi@ru.ac.za · ext 8723)",rule:"Day-to-day running costs. Small capital items under R5,000. Monthly spread required.",submitted:false},
              ].map(c=>(
                <div key={c.cat} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:6}}>
                    <span style={{fontSize:12,fontWeight:600,color:"#e0e3ea"}}>{c.cat}</span>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:10,padding:"1px 7px",borderRadius:20,background:c.submitted?"#0a2218":"#2a1f0a",color:c.submitted?"#20B07F":"#d4851a"}}>{c.submitted?"Submitted":"Check"}</span>
                      <span style={{fontSize:10,color:"#374151"}}>Due {c.deadline}</span>
                    </div>
                  </div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:4,lineHeight:1.5}}>{c.rule}</div>
                  <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
                    <span style={{fontSize:10,fontFamily:"monospace",color:"#60a5fa"}}>{c.email}</span>
                    <span style={{fontSize:10,color:"#374151"}}>· {c.contact}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Key rule */}
            <div style={{background:"#1a1d28",borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:"#9ca3af",lineHeight:1.6}}>
              <strong style={{color:"#d4851a"}}>How approval decisions are made:</strong> When total requests exceed the approved budget pool, items are prioritised by <strong style={{color:"#e0e3ea"}}>criticality and urgency</strong> scores. Higher ratings get funded first. Finance prepares a consolidated summary for Deans and Executive Managers to review.
            </div>

            {/* Finance contacts */}
            <div style={{fontSize:11,fontWeight:500,color:"#9ca3af",marginBottom:6}}>Finance Division contacts</div>
            <div style={{display:"grid",gap:4}}>
              {[
                ["Prof Dave Sewry","Interim CFO · Budget Owner","d.sewry@ru.ac.za",""],
                ["Mr Geoff Erasmus","Director: Finance · Budget Process Owner","g.erasmus@ru.ac.za","7541"],
                ["Ms Linda Booi","Senior Manager: Management Accountant · Budget Co-ordination","l.booi@ru.ac.za","8723"],
                ["Mr Rodney Bridger","Senior Buyer · Academic Equipment","r.bridger@ru.ac.za","8137"],
                ["Ms Merril Prinsloo","Buyer · Furniture & Equipment","m.prinsloo@ru.ac.za","8136"],
                ["Ms Tracey Chambers","Service Manager I&TS · Computer Equipment","t.chambers@ru.ac.za","8290"],
                ["Mr Dominic Mohlala","Financial Cost Controller","dominic.mohlala@ru.ac.za","8531"],
              ].map(([name,role,email,ext])=>(
                <div key={name} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 8px",background:"#1a1d28",borderRadius:6,flexWrap:"wrap"}}>
                  <div style={{flex:1,minWidth:120}}>
                    <span style={{fontSize:11,color:"#e0e3ea",fontWeight:500}}>{name}</span>
                    {ext&&<span style={{fontSize:10,color:"#374151",marginLeft:6}}>ext {ext}</span>}
                    <div style={{fontSize:10,color:"#4b5563"}}>{role}</div>
                  </div>
                  <span style={{fontSize:10,fontFamily:"monospace",color:"#60a5fa"}}>{email}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ACE TAB ── */}
      {budTab==="ace"&&<>
      {/* Totals */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        {[
          ["Total requested","R "+totalRequested.toLocaleString("en-ZA"),"#1a1d28","#9ca3af"],
          ["Total approved","R "+totalApproved.toLocaleString("en-ZA"),"#0a2218","#20B07F"],
          ["Approved",countApproved+"/"+ACE_2026.length,"#0a2218","#20B07F"],
          ["Rejected",countRejected,"#2a0f14","#f87171"],
          ["Pending",countPending,"#1a1d28","#d4851a"],
        ].map(([label,n,bg,col])=>(
          <div key={label} style={{flex:1,minWidth:80,background:bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:label.startsWith("Total")?14:20,fontWeight:600,color:col,lineHeight:1.2}}>{n}</div>
            <div style={{fontSize:11,color:col,marginTop:2}}>{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{background:"#1a1d28",borderRadius:6,height:6,marginBottom:20,overflow:"hidden"}}>
        <div style={{width:(totalApproved/totalRequested*100)+"%",height:"100%",background:TEAL,borderRadius:6,transition:"width 0.3s"}}/>
      </div>

      {/* Items */}
      {ACE_2026.map(item=>{
        const status=approvals[item.no];
        const isOpen=expanded===item.no;
        return(
          <div key={item.no} style={{background:statusBg[status]||"#141720",border:`0.5px solid ${isOpen?"#60a5fa":status==="approved"?"#134029":status==="rejected"?"#3a1a1a":"#1e2130"}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}} onClick={()=>setExpanded(isOpen?null:item.no)}>
              <div style={{minWidth:22,height:22,borderRadius:"50%",background:"#1a1d28",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#6b7280",fontWeight:600,flexShrink:0,marginTop:1}}>{item.no}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{item.item}</div>
                <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center"}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#1a1d28",color:"#60a5fa",fontWeight:500}}>
                    R {item.total.toLocaleString("en-ZA")}
                  </span>
                  <span style={{fontSize:11,color:"#4b5563"}}>Qty {item.qty} × R {item.unitPrice.toLocaleString("en-ZA")}</span>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#1a1d28",color:ratingColor(item.rating),fontWeight:500}}>
                    {"★".repeat(item.rating)}{"☆".repeat(5-item.rating)} {item.rating}/5
                  </span>
                  {status&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:statusBg[status],color:statusCol[status],fontWeight:500,textTransform:"capitalize"}}>{status}</span>}
                </div>
              </div>
              <span style={{color:"#374151",fontSize:13,marginTop:2,flexShrink:0}}>{isOpen?"▲":"▼"}</span>
            </div>

            {isOpen&&(
              <div style={{marginTop:12,borderTop:"0.5px solid #1e2130",paddingTop:12}}>
                {/* Justification */}
                <div style={{marginBottom:10}}>
                  <div style={{fontSize:11,color:"#60a5fa",fontWeight:500,marginBottom:4}}>Use</div>
                  <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.6}}>{item.use}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                  <div style={{background:"#0a1a0f",borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#20B07F",fontWeight:500,marginBottom:4}}>CRITICALITY</div>
                    <div style={{fontSize:11,color:"#9ca3af",lineHeight:1.5}}>{item.criticality}</div>
                  </div>
                  <div style={{background:"#1a1208",borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#d4851a",fontWeight:500,marginBottom:4}}>RISK</div>
                    <div style={{fontSize:11,color:"#9ca3af",lineHeight:1.5}}>{item.risk}</div>
                  </div>
                  <div style={{background:"#0d1520",borderRadius:8,padding:"8px 10px"}}>
                    <div style={{fontSize:10,color:"#60a5fa",fontWeight:500,marginBottom:4}}>GROWTH</div>
                    <div style={{fontSize:11,color:"#9ca3af",lineHeight:1.5}}>{item.growth}</div>
                  </div>
                </div>
                {/* Approval controls */}
                <div style={{background:"#1a1d28",borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:11,color:"#9ca3af",marginBottom:8,fontWeight:500}}>Approval status</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:status==="approved"?10:0}}>
                    {["approved","rejected","pending"].map(s=>(
                      <button key={s} onClick={e=>{e.stopPropagation();setApproval(item.no,s==="pending"?undefined:s);}} style={{padding:"5px 12px",borderRadius:8,border:"none",background:status===(s==="pending"?undefined:s)?(s==="approved"?TEAL:s==="rejected"?"#dc2626":"#374151"):"#141720",color:"#fff",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{s}</button>
                    ))}
                  </div>
                  {status==="approved"&&(
                    <div style={{marginTop:8}}>
                      <label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:4}}>Approved amount (R) — leave blank if full amount</label>
                      <input type="number" style={{...ipt,maxWidth:180}} value={approvedAmounts[item.no]||""} onChange={e=>{e.stopPropagation();setApprovedAmt(item.no,e.target.value);}} placeholder={item.total}/>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={{fontSize:11,color:"#374151",marginTop:16,textAlign:"center"}}>
        Submitted 2025 · Finance Division · Rhodes University · Department of Fine Art
      </div>
      </>}

      {/* ── F&E TAB ── */}
      {budTab==="fe"&&(()=>{
        const allFeItems=FE_2026.flatMap(s=>s.items);
        const feCountApproved=allFeItems.filter(i=>feApprovals[i.no]==="approved").length;
        const feCountRejected=allFeItems.filter(i=>feApprovals[i.no]==="rejected").length;
        const feCountPending=allFeItems.filter(i=>!feApprovals[i.no]).length;
        const ratingBg=r=>r>=100?"#2a0f14":r>=50?"#2a1f0a":r>=20?"#0a1a0f":"#1a1d28";
        const ratingCol=r=>r>=100?"#f87171":r>=50?"#d4851a":r>=20?"#20B07F":"#6b7280";
        return(<>
          <div style={{background:"#0d1520",border:"0.5px solid #1e3a5f",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#9ca3af"}}>
            <span style={{color:"#60a5fa",fontWeight:500}}>No prices submitted</span> — F&amp;E form uses a rating system only (Criticality × Risk × Urgency). Prices are sourced separately by Finance.
            <span style={{color:"#374151",marginLeft:8}}>Submitted: 16 Oct 2025</span>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
            {[
              ["Total items",allFeItems.length,"#1a1d28","#9ca3af"],
              ["Approved",feCountApproved+"/"+allFeItems.length,"#0a2218","#20B07F"],
              ["Rejected",feCountRejected,"#2a0f14","#f87171"],
              ["Pending",feCountPending,"#1a1d28","#d4851a"],
            ].map(([label,n,bg,col])=>(
              <div key={label} style={{flex:1,minWidth:80,background:bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:600,color:col}}>{n}</div>
                <div style={{fontSize:11,color:col,marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>
          {FE_2026.map(section=>(
            <div key={section.section} style={{marginBottom:20}}>
              <div style={{fontSize:12,fontWeight:600,color:"#60a5fa",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8,paddingBottom:6,borderBottom:"0.5px solid #1e3a5f"}}>{section.section}</div>
              {section.items.map(item=>{
                const status=feApprovals[item.no];
                const isOpen=expanded===item.no;
                const statusBg={approved:"#0a2218",rejected:"#2a0f14"};
                const statusCol={approved:"#20B07F",rejected:"#f87171"};
                return(
                  <div key={item.no} style={{background:statusBg[status]||"#141720",border:`0.5px solid ${isOpen?"#60a5fa":status==="approved"?"#134029":status==="rejected"?"#3a1a1a":"#1e2130"}`,borderRadius:12,padding:"11px 14px",marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}} onClick={()=>setExpanded(isOpen?null:item.no)}>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                          <span style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{item.item}</span>
                          {item.office&&<span style={{fontSize:10,padding:"1px 6px",borderRadius:20,background:"#1a1d28",color:"#6b7280"}}>Office</span>}
                        </div>
                        <div style={{display:"flex",gap:6,marginTop:5,flexWrap:"wrap",alignItems:"center"}}>
                          <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:ratingBg(item.rating),color:ratingCol(item.rating),fontWeight:600}}>Rating {item.rating}</span>
                          <span style={{fontSize:11,color:"#4b5563"}}>C:{item.criticality} × R:{item.risk} × U:{item.urgency}</span>
                          <span style={{fontSize:11,color:"#6b7280"}}>Qty {item.qty||1}</span>
                          {item.assetNo&&<span style={{fontSize:11,padding:"2px 6px",borderRadius:20,background:"#1a2a1a",color:"#d4851a"}}>Replaces {item.assetNo}</span>}
                          {status&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:statusBg[status],color:statusCol[status],fontWeight:500,textTransform:"capitalize"}}>{status}</span>}
                        </div>
                      </div>
                      <span style={{color:"#374151",fontSize:13,marginTop:2,flexShrink:0}}>{isOpen?"▲":"▼"}</span>
                    </div>
                    {isOpen&&(
                      <div style={{marginTop:10,borderTop:"0.5px solid #1e2130",paddingTop:10}}>
                        <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.6,marginBottom:10}}>{item.use}</div>
                        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:10}}>
                          {[["Criticality",item.criticality,"#20B07F","#0a1a0f"],["Risk",item.risk,"#d4851a","#1a1208"],["Urgency",item.urgency,"#60a5fa","#0d1520"]].map(([label,score,col,bg])=>(
                            <div key={label} style={{background:bg,borderRadius:8,padding:"6px 10px",textAlign:"center"}}>
                              <div style={{fontSize:10,color:col,fontWeight:500,marginBottom:2}}>{label}</div>
                              <div style={{fontSize:18,fontWeight:700,color:col}}>{score}/5</div>
                            </div>
                          ))}
                        </div>
                        <div style={{background:"#1a1d28",borderRadius:8,padding:"8px 12px"}}>
                          <div style={{fontSize:11,color:"#9ca3af",marginBottom:6,fontWeight:500}}>Approval status</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                            {["approved","rejected","pending"].map(s=>(
                              <button key={s} onClick={e=>{e.stopPropagation();setFeApproval(item.no,s==="pending"?undefined:s);}} style={{padding:"5px 12px",borderRadius:8,border:"none",background:status===(s==="pending"?undefined:s)?(s==="approved"?TEAL:s==="rejected"?"#dc2626":"#374151"):"#141720",color:"#fff",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{s}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
          <div style={{fontSize:11,color:"#374151",marginTop:8,textAlign:"center"}}>
            F&amp;E Submission · 16 Oct 2025 · Finance Division · Rhodes University · Department of Fine Art
          </div>
        </>);
      })()}

      {/* ── IT TAB ── */}
      {budTab==="it"&&(()=>{
        const allItKeys=[...IT_2026.monitors.map(m=>"mon-"+m.pc),...IT_2026.towers.map(t=>"tow-"+t.pc),...IT_2026.software.map(s=>"sw-"+s.software)];
        const itApproved=allItKeys.filter(k=>itApprovals[k]==="approved").length;
        const itRejected=allItKeys.filter(k=>itApprovals[k]==="rejected").length;
        const itPending=allItKeys.filter(k=>!itApprovals[k]).length;
        const sectionHdr=(icon,title)=>(
          <div style={{fontSize:12,fontWeight:600,color:"#60a5fa",letterSpacing:"0.04em",textTransform:"uppercase",marginBottom:8,marginTop:20,paddingBottom:6,borderBottom:"0.5px solid #1e3a5f"}}>{icon} {title}</div>
        );
        const ApprovalBtns=({k})=>(
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
            {["approved","rejected","pending"].map(s=>(
              <button key={s} onClick={e=>{e.stopPropagation();setItApproval(k,s==="pending"?undefined:s);}} style={{padding:"4px 10px",borderRadius:8,border:"none",background:itApprovals[k]===(s==="pending"?undefined:s)?(s==="approved"?TEAL:s==="rejected"?"#dc2626":"#374151"):"#141720",color:"#fff",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{s}</button>
            ))}
            {itApprovals[k]&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:itApprovals[k]==="approved"?"#0a2218":"#2a0f14",color:itApprovals[k]==="approved"?"#20B07F":"#f87171",fontWeight:500,textTransform:"capitalize"}}>{itApprovals[k]}</span>}
          </div>
        );
        return(<>
          {/* Summary chips */}
          <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
            {[["Requests",allItKeys.length,"#1a1d28","#9ca3af"],["Approved",itApproved,"#0a2218","#20B07F"],["Rejected",itRejected,"#2a0f14","#f87171"],["Pending",itPending,"#1a1d28","#d4851a"]].map(([label,n,bg,col])=>(
              <div key={label} style={{flex:1,minWidth:80,background:bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:20,fontWeight:600,color:col}}>{n}</div>
                <div style={{fontSize:11,color:col,marginTop:2}}>{label}</div>
              </div>
            ))}
          </div>

          {/* Current inventory */}
          {sectionHdr("🖥","Current Equipment")}
          <div style={{display:"grid",gap:6,marginBottom:4}}>
            {IT_2026.current.map(c=>(
              <div key={c.pc} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"10px 14px",display:"flex",gap:12,alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{c.pc}</div>
                  <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{c.use}</div>
                </div>
                <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#0a2218",color:"#20B07F",fontWeight:500,flexShrink:0}}>{c.assetNo}</span>
              </div>
            ))}
          </div>

          {/* Monitors */}
          {sectionHdr("🖥","Monitor Requests")}
          {IT_2026.monitors.map(m=>{
            const k="mon-"+m.pc;
            return(
              <div key={k} style={{background:itApprovals[k]==="approved"?"#0a2218":itApprovals[k]==="rejected"?"#2a0f14":"#141720",border:`0.5px solid ${itApprovals[k]==="approved"?"#134029":itApprovals[k]==="rejected"?"#3a1a1a":"#1e2130"}`,borderRadius:10,padding:"11px 14px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{m.pc}</div>
                    <div style={{fontSize:12,color:"#60a5fa",marginTop:3,fontWeight:500}}>{m.spec}</div>
                    <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{m.notes}</div>
                    {m.assetNo&&<div style={{fontSize:10,color:"#374151",marginTop:2}}>Current asset: {m.assetNo}</div>}
                  </div>
                </div>
                <ApprovalBtns k={k}/>
              </div>
            );
          })}

          {/* Towers */}
          {sectionHdr("🗜","Tower (PC) Requests")}
          {IT_2026.towers.map(t=>{
            const k="tow-"+t.pc;
            return(
              <div key={k} style={{background:itApprovals[k]==="approved"?"#0a2218":itApprovals[k]==="rejected"?"#2a0f14":"#141720",border:`0.5px solid ${itApprovals[k]==="approved"?"#134029":itApprovals[k]==="rejected"?"#3a1a1a":"#1e2130"}`,borderRadius:10,padding:"11px 14px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
                      <span style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{t.pc}</span>
                      <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#1a1d28",color:"#d4851a"}}>{t.action}</span>
                    </div>
                    <div style={{fontSize:12,color:"#60a5fa",marginTop:3,fontWeight:500}}>{t.spec}</div>
                    <div style={{fontSize:11,color:"#6b7280",marginTop:2,lineHeight:1.5}}>{t.notes}</div>
                  </div>
                </div>
                <ApprovalBtns k={k}/>
              </div>
            );
          })}

          {/* Software */}
          {sectionHdr("📦","Software Requests")}
          {IT_2026.software.map(s=>{
            const k="sw-"+s.software;
            return(
              <div key={k} style={{background:itApprovals[k]==="approved"?"#0a2218":itApprovals[k]==="rejected"?"#2a0f14":"#141720",border:`0.5px solid ${itApprovals[k]==="approved"?"#134029":itApprovals[k]==="rejected"?"#3a1a1a":"#1e2130"}`,borderRadius:10,padding:"11px 14px",marginBottom:6}}>
                <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{s.software}</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{s.purpose}</div>
                <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#0d1520",color:"#60a5fa"}}>{s.license}</span>
                </div>
                <div style={{fontSize:10,color:"#374151",marginTop:4,fontFamily:"monospace"}}>{s.detail}</div>
                <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>For: {s.pc}</div>
                <ApprovalBtns k={k}/>
              </div>
            );
          })}

          {/* Summary */}
          {sectionHdr("📋","Summary / Motivation")}
          <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:20}}>
            {IT_2026.summary.map((line,i)=>(
              <div key={i} style={{fontSize:12,color:"#9ca3af",marginBottom:6,paddingLeft:12,borderLeft:"2px solid #1e3a5f",lineHeight:1.5}}>{line}</div>
            ))}
          </div>

          <div style={{fontSize:11,color:"#374151",marginTop:8,textAlign:"center"}}>
            IT / Computer Equipment Request · Rhodes University · Department of Fine Art
          </div>
        </>);
      })()}

    </div>
  );
}

// ── INSURANCE / ASSET PANEL ──────────────────────────────────────
function InsurancePanel({equipment,requests}){
  const [insTab,setInsTab]=useState("assets"); // assets | incidents | policy
  const [allEq,setAllEq]=useState([]);
  const [loading,setLoading]=useState(false);
  const [editId,setEditId]=useState(null);
  const [editForm,setEditForm]=useState({assetNumber:"",warrantyExpiry:"",warrantyCoverage:"",warrantySupplier:"",replacementValue:"",quoteSource:""});
  const [saving,setSaving]=useState(false);
  const [saveMsg,setSaveMsg]=useState("");
  const [search,setSearch]=useState("");

  const ipt={width:"100%",background:"#1a1d28",border:"0.5px solid #1e2130",borderRadius:8,padding:"8px 10px",fontSize:13,color:"#e0e3ea",fontFamily:"inherit",boxSizing:"border-box"};

  async function fetchAll(){
    setLoading(true);
    try{
      const data=await atGet(EQ_TABLE,{"fields[]":["Name","Type","Equipment Status","Asset Number","Warranty Expiry","Warranty Coverage","Warranty Supplier","Replacement Value (R)","Quote Source"],"sort[0][field]":"Type","sort[0][direction]":"asc"});
      if(data.records){
        setAllEq(data.records.map(r=>({
          id:r.id,
          name:r.fields["Name"]||"",
          type:r.fields["Type"]||"",
          eqStatus:r.fields["Equipment Status"]||"",
          assetNumber:r.fields["Asset Number"]||"",
          warrantyExpiry:r.fields["Warranty Expiry"]||"",
          warrantyCoverage:r.fields["Warranty Coverage"]||"",
          warrantySupplier:r.fields["Warranty Supplier"]||"",
          replacementValue:r.fields["Replacement Value (R)"]||null,
          quoteSource:r.fields["Quote Source"]||"",
        })));
      }
    }catch(e){console.error("InsurancePanel fetch",e);}
    setLoading(false);
  }

  useState(()=>{fetchAll();},[]);

  function openEdit(item){
    setEditId(item.id);
    setEditForm({assetNumber:item.assetNumber,warrantyExpiry:item.warrantyExpiry,warrantyCoverage:item.warrantyCoverage,warrantySupplier:item.warrantySupplier,replacementValue:item.replacementValue!=null?String(item.replacementValue):"",quoteSource:item.quoteSource});
    setSaveMsg("");
  }

  async function saveEdit(item){
    setSaving(true);setSaveMsg("");
    try{
      const fields={};
      if(editForm.assetNumber!==item.assetNumber)fields["Asset Number"]=editForm.assetNumber;
      if(editForm.warrantyExpiry!==item.warrantyExpiry)fields["Warranty Expiry"]=editForm.warrantyExpiry||null;
      if(editForm.warrantyCoverage!==item.warrantyCoverage)fields["Warranty Coverage"]=editForm.warrantyCoverage;
      if(editForm.warrantySupplier!==item.warrantySupplier)fields["Warranty Supplier"]=editForm.warrantySupplier;
      const newRV=editForm.replacementValue===""?null:parseFloat(editForm.replacementValue);
      if(newRV!==item.replacementValue)fields["Replacement Value (R)"]=newRV;
      if(editForm.quoteSource!==item.quoteSource)fields["Quote Source"]=editForm.quoteSource;
      if(Object.keys(fields).length){await atPatch(EQ_TABLE,item.id,fields);}
      setAllEq(prev=>prev.map(e=>e.id===item.id?{...e,...editForm,replacementValue:newRV}:e));
      setSaveMsg("Saved");
      setTimeout(()=>{setEditId(null);setSaveMsg("");},800);
    }catch(e){setSaveMsg("Error — check Airtable field names");}
    setSaving(false);
  }

  const incidentRequests=requests.filter(r=>(r.lostItems&&r.lostItems.length>0)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  const withAsset=allEq.filter(e=>e.assetNumber);
  const withoutAsset=allEq.filter(e=>!e.assetNumber);
  const withValue=allEq.filter(e=>e.replacementValue!=null);
  const portfolioTotal=allEq.reduce((s,e)=>s+(e.replacementValue||0),0);
  const filtered=allEq.filter(e=>!search||(e.name+e.type+e.assetNumber).toLowerCase().includes(search.toLowerCase()));

  function warrantyStatus(e){
    if(!e.warrantyExpiry)return null;
    const days=Math.floor((new Date(e.warrantyExpiry+"T00:00:00")-new Date())/86400000);
    if(days<0)return{label:"Warranty expired",bg:"#2a0f14",color:"#f87171"};
    if(days<=60)return{label:`Expires in ${days}d`,bg:"#2a1f0a",color:"#d4851a"};
    return{label:`Warranty OK`,bg:"#0a2218",color:"#20B07F"};
  }

  const TEAL="#20B07F";

  return(
    <div>
      <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Insurance &amp; Asset Register</div>
      <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Equipment coverage, asset numbers, warranty records and incidents</div>

      {/* Summary chips */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        {[
          ["Total items",allEq.length,"#1a1d28","#9ca3af"],
          ["Asset no.",withAsset.length,"#0a2218","#20B07F"],
          ["No asset no.",withoutAsset.length,"#2a1f0a","#d4851a"],
          ["Incidents",incidentRequests.length,"#2a0f14","#f87171"],
        ].map(([label,n,bg,col])=>(
          <div key={label} style={{flex:1,minWidth:80,background:bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:600,color:col}}>{n}</div>
            <div style={{fontSize:11,color:col}}>{label}</div>
          </div>
        ))}
      </div>
      {/* Portfolio value banner */}
      <div style={{background:"#0d1520",border:"0.5px solid #1e3a5f",borderRadius:10,padding:"10px 14px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div>
          <span style={{fontSize:12,color:"#60a5fa",fontWeight:500}}>Portfolio Replacement Value</span>
          <span style={{fontSize:11,color:"#374151",marginLeft:8}}>({withValue.length}/{allEq.length} items priced)</span>
        </div>
        <div style={{fontSize:18,fontWeight:600,color:"#60a5fa",letterSpacing:"0.02em"}}>
          R {portfolioTotal.toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["assets","📋 Asset register"],["incidents","⚠️ Incidents"],["policy","📄 Policy summary"]].map(([v,l])=>(
          <button key={v} onClick={()=>setInsTab(v)} style={{padding:"7px 14px",borderRadius:8,border:"none",background:insTab===v?TEAL:"#141720",color:insTab===v?"#fff":"#6b7280",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:insTab===v?"none":"0.5px solid #1e2130"}}>{l}</button>
        ))}
      </div>

      {/* ── ASSET REGISTER ── */}
      {insTab==="assets"&&(<>
        <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"center"}}>
          <input style={{...ipt,flex:1}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search equipment…"/>
          <button onClick={fetchAll} style={{padding:"8px 14px",borderRadius:8,border:"0.5px solid #1e2130",background:"#141720",color:"#9ca3af",fontSize:12,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>{loading?"Loading…":"↻ Refresh"}</button>
        </div>

        {withoutAsset.length>0&&(
          <div style={{background:"#2a1f0a",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#d4851a"}}>
            ⚠️ {withoutAsset.length} item{withoutAsset.length!==1?"s":""} without an asset number — not covered by university insurance.
          </div>
        )}

        {loading&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>Loading…</div>}

        {!loading&&filtered.map(item=>{
          const ws=warrantyStatus(item);
          const isEditing=editId===item.id;
          const covered=!!item.assetNumber;
          return(
            <div key={item.id} style={{background:"#141720",border:`0.5px solid ${isEditing?"#60a5fa":"#1e2130"}`,borderRadius:12,padding:"12px 14px",marginBottom:8}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}} onClick={()=>isEditing?setEditId(null):openEdit(item)}>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{item.name}</div>
                  <div style={{fontSize:11,color:"#4b5563",marginTop:2}}>{item.type}{item.eqStatus&&<span style={{color:"#374151"}}> · {item.eqStatus}</span>}</div>
                  <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap",alignItems:"center"}}>
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:covered?"#0a2218":"#2a1f0a",color:covered?"#20B07F":"#d4851a",fontWeight:500}}>
                      {covered?`✓ ${item.assetNumber}`:"⚠ No asset no."}
                    </span>
                    {item.replacementValue!=null
                      ?<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#0d1520",color:"#60a5fa",fontWeight:500}}>R {Number(item.replacementValue).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
                      :<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#1a1d28",color:"#4b5563"}}>No value</span>
                    }
                    {ws&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:ws.bg,color:ws.color}}>{ws.label}</span>}
                    {item.warrantyCoverage&&<span style={{fontSize:11,color:"#6b7280"}}>{item.warrantyCoverage}</span>}
                  </div>
                  {item.quoteSource&&<div style={{fontSize:10,color:"#374151",marginTop:4}}>📄 {item.quoteSource}</div>}
                </div>
                <span style={{color:"#374151",fontSize:13,marginTop:2}}>{isEditing?"▲":"✎"}</span>
              </div>

              {isEditing&&(
                <div style={{marginTop:12,borderTop:"0.5px solid #1e2130",paddingTop:12}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Asset Number <span style={{color:"#d4851a"}}>(required for insurance coverage)</span></label>
                      <input style={ipt} value={editForm.assetNumber} onChange={e=>setEditForm(f=>({...f,assetNumber:e.target.value}))} placeholder="e.g. RU-FA-0042"/>
                    </div>
                    <div>
                      <label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Warranty Expiry</label>
                      <input type="date" style={ipt} value={editForm.warrantyExpiry} onChange={e=>setEditForm(f=>({...f,warrantyExpiry:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Warranty Supplier</label>
                      <input style={ipt} value={editForm.warrantySupplier} onChange={e=>setEditForm(f=>({...f,warrantySupplier:e.target.value}))} placeholder="e.g. Orms Cape Town"/>
                    </div>
                    <div style={{gridColumn:"1/-1"}}>
                      <label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Warranty Coverage</label>
                      <input style={ipt} value={editForm.warrantyCoverage} onChange={e=>setEditForm(f=>({...f,warrantyCoverage:e.target.value}))} placeholder="e.g. Full replacement, Parts only, On-site repair"/>
                    </div>
                    <div>
                      <label style={{fontSize:12,color:"#60a5fa",display:"block",marginBottom:4}}>Replacement Value (R) <span style={{color:"#374151",fontWeight:400}}>incl. VAT</span></label>
                      <input type="number" step="0.01" min="0" style={ipt} value={editForm.replacementValue} onChange={e=>setEditForm(f=>({...f,replacementValue:e.target.value}))} placeholder="e.g. 16335.75"/>
                    </div>
                    <div>
                      <label style={{fontSize:12,color:"#60a5fa",display:"block",marginBottom:4}}>Quote Source</label>
                      <input style={ipt} value={editForm.quoteSource} onChange={e=>setEditForm(f=>({...f,quoteSource:e.target.value}))} placeholder="e.g. ORMS QCT144352, Dec 2023"/>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <button onClick={()=>saveEdit(item)} disabled={saving} style={{padding:"7px 18px",borderRadius:8,border:"none",background:TEAL,color:"#fff",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>{saving?"Saving…":"Save"}</button>
                    <button onClick={()=>setEditId(null)} style={{padding:"7px 14px",borderRadius:8,border:"0.5px solid #1e2130",background:"#1a1d28",color:"#9ca3af",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                    {saveMsg&&<span style={{fontSize:12,color:saveMsg==="Saved"?"#20B07F":"#f87171"}}>{saveMsg}</span>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!loading&&filtered.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>No equipment found</div>}
      </>)}

      {/* ── INCIDENTS ── */}
      {insTab==="incidents"&&(<>
        <div style={{fontSize:13,color:"#6b7280",marginBottom:14}}>Equipment reported as lost or missing during check-in</div>
        {incidentRequests.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#374151",fontSize:14}}>No incidents recorded</div>}
        {incidentRequests.map(req=>(
          <div key={req.id} style={{background:"#141720",border:"0.5px solid #2a0f14",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>{req.name} <span style={{color:"#6b7280",fontWeight:400}}>· {req.studNo}</span></div>
                <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>Booked: {req.eqColDate||req.createdAt?.slice(0,10)} · Collection: {req.eqSlot||"—"}</div>
              </div>
              <span style={{fontSize:11,padding:"3px 8px",borderRadius:20,background:"#2a0f14",color:"#f87171",fontWeight:500}}>Lost reported</span>
            </div>
            <div style={{marginBottom:4}}>
              {(req.lostItems||[]).map(item=>(
                <div key={item} style={{display:"flex",alignItems:"flex-start",gap:6,fontSize:12,color:"#f87171",marginBottom:5}}>
                  <span style={{marginTop:1}}>⚠</span>
                  <div>
                    <div>{item}</div>
                    {(()=>{
                      const eq=allEq.find(e=>e.name===item);
                      return(
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:2}}>
                          {eq?.assetNumber
                            ?<span style={{color:"#d4851a",fontSize:11}}>Asset: {eq.assetNumber} · Theft/loss claim possible with SAPS report</span>
                            :<span style={{color:"#6b7280",fontSize:11}}>No asset no. · Student liable for full replacement</span>
                          }
                          {eq?.replacementValue!=null&&(
                            <span style={{color:"#60a5fa",fontSize:11,fontWeight:500}}>
                              Charge: R {Number(eq.replacementValue).toLocaleString("en-ZA",{minimumFractionDigits:2,maximumFractionDigits:2})}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
            {req.checkInNotes&&<div style={{fontSize:12,color:"#9ca3af",marginTop:4}}>Notes: {req.checkInNotes}</div>}
          </div>
        ))}
      </>)}

      {/* ── POLICY SUMMARY ── */}
      {insTab==="policy"&&(
        <div style={{background:"#0d1520",border:"0.5px solid #1e3a5f",borderRadius:12,padding:"16px 18px"}}>
          <div style={{fontSize:13,fontWeight:600,color:"#60a5fa",marginBottom:12}}>Rhodes University Equipment Insurance — Summary</div>
          <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.8}}>
            <div style={{marginBottom:10}}>
              <div style={{color:"#20B07F",fontWeight:500,marginBottom:4}}>✓ Covered (with conditions)</div>
              <div>• Items with a university <strong style={{color:"#e0e3ea"}}>asset number</strong> are covered for <strong style={{color:"#e0e3ea"}}>theft only</strong>.</div>
              <div>• Student must report to Rhodes Security and SAPS within <strong style={{color:"#e0e3ea"}}>24 hours</strong> of the incident.</div>
              <div>• A valid <strong style={{color:"#e0e3ea"}}>SAPS case number</strong> must be provided for a claim to be considered.</div>
              <div>• Loss with a police report: claim is <em>reviewed</em> — not automatically approved.</div>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{color:"#f87171",fontWeight:500,marginBottom:4}}>✗ Not covered</div>
              <div>• Items <strong style={{color:"#e0e3ea"}}>without an asset number</strong>.</div>
              <div>• Items lost without a police report — <strong style={{color:"#e0e3ea"}}>student fully liable</strong>.</div>
              <div>• Accidental damage — <strong style={{color:"#e0e3ea"}}>student liable</strong> (policy unclear; assume liability).</div>
              <div>• Items not reported immediately (reporting at return date is too late).</div>
            </div>
            <div style={{background:"#1a1d28",borderRadius:8,padding:"10px 12px",marginTop:10,fontSize:11}}>
              <strong style={{color:"#e0e3ea"}}>Claims process:</strong> Submit SAPS case number to Fine Art Tech Support. Tech Support forwards to university insurance claims contact. Outcome is at insurer's discretion.
            </div>
            <div style={{color:"#4b5563",fontSize:11,marginTop:10}}>
              Source: verbal confirmation from university insurance claims contact, May 2026. No written policy document available at time of writing.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── PM SCHEDULE PANEL ────────────────────────────────────────────
function PmPanel(){
  const [pmTasks,setPmTasks]=useState(null);
  const [loading,setLoading]=useState(false);
  const [filterStatus,setFilterStatus]=useState("all");
  const [filterInterval,setFilterInterval]=useState("all");
  const [expandedSections,setExpandedSections]=useState({});
  const [expandedNotes,setExpandedNotes]=useState({});
  const [expandedLog,setExpandedLog]=useState({});
  const [logOpen,setLogOpen]=useState({});
  const [logForms,setLogForms]=useState({});
  const [showForm,setShowForm]=useState(false);
  const [editTask,setEditTask]=useState(null);
  const [pmForm,setPmForm]=useState({taskName:"",machine:"",interval:"Monthly",lastDone:"",nextDue:"",notes:""});
  const [editingInlineId,setEditingInlineId]=useState(null);
  const [confirmDeleteId,setConfirmDeleteId]=useState(null);

  const PM_SECTIONS=[
    {id:"printmaking",label:"Printmaking",icon:"🖨",match:m=>/etching|relief press|aquatint|acid bath|hot plate|extractor/i.test(m)},
    {id:"photo",label:"Photography",icon:"📷",match:m=>/epson|elinchrom/i.test(m)},
    {id:"maclab",label:"Mac Lab",icon:"💻",match:m=>/mac lab/i.test(m)},
    {id:"laser",label:"Laser Cutter",icon:"⚡",match:m=>/laser|argus/i.test(m)},
    {id:"seminar",label:"Seminar Room",icon:"🎤",match:m=>/seminar room/i.test(m)&&!/2nd year/i.test(m)},
    {id:"studio2",label:"2nd Year Studio",icon:"🎨",match:m=>/2nd year studio/i.test(m)},
    {id:"gallery",label:"Gallery",icon:"🖼",match:m=>/gallery/i.test(m)},
    {id:"seminar2",label:"2nd Year Seminar Room",icon:"📐",match:m=>/2nd year seminar/i.test(m)},
    {id:"other",label:"Other",icon:"⚙",match:()=>true},
  ];

  function getSection(machine){for(const s of PM_SECTIONS){if(s.match(machine||""))return s;}return PM_SECTIONS[PM_SECTIONS.length-1];}
  function daysUntilPm(d){if(!d)return null;return Math.floor((new Date(d+"T00:00:00")-new Date())/86400000);}
  function intervalDaysPm(iv){return iv==="Daily"?1:iv==="Weekly"?7:iv==="Monthly"?30:iv==="Per Term"?90:365;}
  function addDaysFn(dateStr,n){const d=new Date(dateStr+"T00:00:00");d.setDate(d.getDate()+n);return localDateStr(d);}
  function getTaskStatus(task){if(!task.NextDue)return"not-done";const du=daysUntilPm(task.NextDue);if(du<0)return"overdue";if(du<=7)return"due-soon";return"scheduled";}
  function statusMeta(s){
    if(s==="overdue")return{label:"Overdue",color:"#f87171",bg:"#2a0f14"};
    if(s==="due-soon")return{label:"Due soon",color:"#d4851a",bg:"#2a1f0a"};
    if(s==="scheduled")return{label:"Scheduled",color:"#20B07F",bg:"#0a2218"};
    return{label:"Not yet done",color:"#6b7280",bg:"#1a1d28"};
  }
  function openLogForm(task){
    setLogOpen(p=>({...p,[task.id]:true}));
    setLogForms(p=>({...p,[task.id]:{outcome:"Done",notes:"",date:todayDate()}}));
  }
  function parseLogEntries(raw){
    if(!raw)return[];
    return raw.split("\n").filter(Boolean).map(line=>{
      const parts=line.split(" | ");
      return{date:parts[0]||"",outcome:parts[1]||"",note:parts[2]||""};
    });
  }

  useEffect(()=>{
    setLoading(true);
    atGet(PM_TABLE,{maxRecords:200,sort:[{field:"Machine",direction:"asc"}]})
      .then(d=>{
        const tasks=d.records?d.records.map(r=>({id:r.id,...r.fields})):[];
        setPmTasks(tasks);
        const init={};
        PM_SECTIONS.forEach(s=>{
          const st=tasks.filter(t=>getSection(t.Machine||"").id===s.id);
          init[s.id]=st.some(t=>["overdue","due-soon"].includes(getTaskStatus(t)));
        });
        setExpandedSections(init);
      })
      .catch(()=>setPmTasks([]))
      .finally(()=>setLoading(false));
  },[]);

  async function saveLog(task){
    const lf=logForms[task.id]||{outcome:"Done",notes:"",date:todayDate()};
    const outcome=lf.outcome||"Done";
    const icon=outcome==="Done"?"✓":outcome==="Partial"?"⚠":"✗";
    const entry=`${lf.date} | ${icon} ${outcome}${lf.notes?` | ${lf.notes}`:""}`;
    const newLog=task.TaskLog?`${entry}\n${task.TaskLog}`:entry;
    const updates={TaskLog:newLog};
    if(outcome==="Done"){
      updates.LastDone=lf.date;
      updates.NextDue=addDaysFn(lf.date,intervalDaysPm(task.Interval||"Monthly"));
    } else if(outcome==="Partial"){
      updates.LastDone=lf.date;
      updates.NextDue=addDaysFn(lf.date,7);
    }
    // Not done: no date changes — task stays overdue/due
    await atPatch(PM_TABLE,task.id,updates);
    setPmTasks(prev=>prev.map(t=>t.id===task.id?{...t,...updates}:t));
    setLogOpen(p=>({...p,[task.id]:false}));
    setExpandedLog(p=>({...p,[task.id]:true}));
  }

  async function savePm(){
    const fields={TaskName:pmForm.taskName,Machine:pmForm.machine,Interval:pmForm.interval,...(pmForm.lastDone&&{LastDone:pmForm.lastDone}),...(pmForm.nextDue&&{NextDue:pmForm.nextDue}),Notes:pmForm.notes};
    if(editTask){
      await atPatch(PM_TABLE,editTask.id,fields);
      setPmTasks(prev=>prev.map(t=>t.id===editTask.id?{...t,...fields}:t));
    }else{
      const result=await atPost(PM_TABLE,{Name:genId(),...fields});
      if(result.id)setPmTasks(prev=>[...prev,{id:result.id,...fields}]);
    }
    setShowForm(false);setEditTask(null);setEditingInlineId(null);
    setPmForm({taskName:"",machine:"",interval:"Monthly",lastDone:"",nextDue:"",notes:""});
  }

  async function deletePm(task){
    await atDelete(PM_TABLE,task.id);
    setPmTasks(prev=>prev.filter(t=>t.id!==task.id));
  }

  const tasks=pmTasks||[];
  const counts={overdue:0,"due-soon":0,scheduled:0,"not-done":0};
  tasks.forEach(t=>counts[getTaskStatus(t)]++);
  let filtered=tasks;
  if(filterStatus!=="all")filtered=filtered.filter(t=>getTaskStatus(t)===filterStatus);
  if(filterInterval!=="all")filtered=filtered.filter(t=>t.Interval===filterInterval);
  const activeSectionCount=PM_SECTIONS.filter(s=>tasks.some(t=>getSection(t.Machine||"").id===s.id)).length;
  const grouped=PM_SECTIONS.map(s=>({...s,tasks:filtered.filter(t=>getSection(t.Machine||"").id===s.id)})).filter(s=>s.tasks.length>0);

  if(loading)return<div style={{padding:"2rem",textAlign:"center",color:"#6b7280",fontSize:13}}>Loading PM tasks…</div>;

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:15,fontWeight:500,color:"#e0e3ea"}}>PM Schedule</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:1}}>
            {counts.overdue>0&&<span style={{color:"#f87171",marginRight:8}}>{counts.overdue} overdue</span>}
            {counts["due-soon"]>0&&<span style={{color:"#d4851a",marginRight:8}}>{counts["due-soon"]} due soon</span>}
            {counts.overdue===0&&counts["due-soon"]===0?<span style={{color:"#20B07F"}}>all on track</span>:null}
            <span style={{color:"#374151",marginLeft:counts.overdue>0||counts["due-soon"]>0?4:0}}>{tasks.length} tasks · {activeSectionCount} sections</span>
          </div>
        </div>
        <Btn small outline color={TEAL} onClick={()=>{setShowForm(true);setEditTask(null);setPmForm({taskName:"",machine:"",interval:"Monthly",lastDone:"",nextDue:"",notes:""});}}>+ Add task</Btn>
      </div>

      {/* Summary chips */}
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[
          ["all","All",tasks.length,"#6b7280","#1a1d28"],
          ["overdue","Overdue",counts.overdue,"#f87171","#2a0f14"],
          ["due-soon","Due soon",counts["due-soon"],"#d4851a","#2a1f0a"],
        ].map(([v,l,n,col,bg])=>(
          <button key={v} onClick={()=>setFilterStatus(v)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:filterStatus===v?`1.5px solid ${col}`:"0.5px solid #1e2130",background:filterStatus===v?bg:"#141720",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:600,color:filterStatus===v?col:"#e0e3ea"}}>{n}</div>
            <div style={{fontSize:10,color:filterStatus===v?col:"#4b5563",marginTop:1}}>{l}</div>
          </button>
        ))}
      </div>

      {/* Interval filter */}
      <div style={{display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
        {["all","Daily","Weekly","Monthly","Per Term","Annually"].map(v=>(
          <button key={v} onClick={()=>setFilterInterval(v)} style={{padding:"5px 11px",borderRadius:20,border:"none",background:filterInterval===v?TEAL:"#1a1d28",color:filterInterval===v?"#fff":"#9ca3af",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>{v==="all"?"All":v}</button>
        ))}
      </div>

      {/* Add / Edit form */}
      {showForm&&(
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>{editTask?"Edit task":"New PM task"}</div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:2}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Task name *</label><input style={ipt} value={pmForm.taskName} onChange={e=>setPmForm(f=>({...f,taskName:e.target.value}))} placeholder="e.g. Clean lens"/></div>
            <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Machine</label><input style={ipt} value={pmForm.machine} onChange={e=>setPmForm(f=>({...f,machine:e.target.value}))} placeholder="e.g. Laser Cutter"/></div>
          </div>
          <div style={{display:"flex",gap:8,marginBottom:10}}>
            <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Interval</label><select style={ipt} value={pmForm.interval} onChange={e=>setPmForm(f=>({...f,interval:e.target.value}))}>{["Daily","Weekly","Monthly","Per Term","Annually"].map(t=><option key={t}>{t}</option>)}</select></div>
            <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Last done</label><input type="date" style={ipt} value={pmForm.lastDone} onChange={e=>setPmForm(f=>({...f,lastDone:e.target.value}))}/></div>
            <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Next due</label><input type="date" style={ipt} value={pmForm.nextDue} onChange={e=>setPmForm(f=>({...f,nextDue:e.target.value}))}/></div>
          </div>
          <div style={{marginBottom:12}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Step-by-step notes</label><textarea style={{...ipt,resize:"vertical"}} rows={2} value={pmForm.notes} onChange={e=>setPmForm(f=>({...f,notes:e.target.value}))} placeholder="What to check, products needed, steps…"/></div>
          <div style={{display:"flex",gap:8}}>
            <Btn outline color="#4b5563" onClick={()=>{setShowForm(false);setEditTask(null);}} style={{flex:1}}>Cancel</Btn>
            <Btn color={TEAL} onClick={savePm} disabled={!pmForm.taskName.trim()} style={{flex:2}}>Save</Btn>
          </div>
        </div>
      )}

      {pmTasks!==null&&filtered.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14,border:"0.5px dashed #1e2130",borderRadius:10}}>No tasks match this filter</div>}

      {/* Grouped sections */}
      {grouped.map(section=>{
        const isExpanded=!!expandedSections[section.id];
        const secOverdue=section.tasks.filter(t=>getTaskStatus(t)==="overdue").length;
        const secDueSoon=section.tasks.filter(t=>getTaskStatus(t)==="due-soon").length;
        const secLastDone=section.tasks.map(t=>t.LastDone).filter(Boolean).sort().pop();
        return(
          <div key={section.id} style={{marginBottom:8}}>
            <button onClick={()=>setExpandedSections(p=>({...p,[section.id]:!p[section.id]}))} style={{width:"100%",background:"#1a1d28",border:"0.5px solid #1e2130",borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontFamily:"inherit",marginBottom:isExpanded?4:0}}>
              <span style={{fontSize:14}}>{section.icon}</span>
              <span style={{fontSize:13,fontWeight:500,color:"#e0e3ea",flex:1,textAlign:"left"}}>{section.label}</span>
              {secOverdue>0&&<span style={{fontSize:10,background:"#2a0f14",color:"#f87171",borderRadius:5,padding:"2px 7px"}}>{secOverdue} overdue</span>}
              {secDueSoon>0&&<span style={{fontSize:10,background:"#2a1f0a",color:"#d4851a",borderRadius:5,padding:"2px 7px"}}>{secDueSoon} due soon</span>}
              {secLastDone&&secOverdue===0&&secDueSoon===0&&<span style={{fontSize:10,color:"#374151"}}>last {fmtDate(secLastDone)}</span>}
              <span style={{fontSize:10,display:"inline-block",transition:"transform 0.2s",transform:isExpanded?"rotate(90deg)":"rotate(0deg)",color:"#374151",marginLeft:2}}>▶</span>
            </button>

            {isExpanded&&section.tasks.map(task=>{
              const status=getTaskStatus(task);
              const meta=statusMeta(status);
              const du=task.NextDue?daysUntilPm(task.NextDue):null;
              const notesOpen=!!expandedNotes[task.id];
              const logOpen_=!!logOpen[task.id];
              const logEntries=parseLogEntries(task.TaskLog);
              const logHistoryOpen=!!expandedLog[task.id];
              const lf=logForms[task.id]||{outcome:"Done",notes:"",date:todayDate()};
              return(
                <div key={task.id} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:5,borderLeft:`3px solid ${meta.color}`}}>
                  {/* Task header */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:4}}>
                        {task.Machine&&<span style={{fontSize:11,background:"#1a1d28",color:"#9ca3af",borderRadius:5,padding:"2px 7px"}}>⚙ {task.Machine}</span>}
                        {task.Interval&&<span style={{fontSize:11,color:"#4b5563"}}>{task.Interval}</span>}
                      </div>
                      <div style={{fontSize:14,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>{task.TaskName}</div>
                      <div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:12,color:"#6b7280"}}>
                        {task.LastDone?<span>Last done: {fmtDate(task.LastDone)}</span>:<span style={{color:"#374151"}}>Never done</span>}
                        {task.NextDue&&<span style={{color:meta.color}}>Next due: {fmtDate(task.NextDue)}{du!==null&&<span> · {du<0?`${Math.abs(du)}d overdue`:du===0?"today":`in ${du}d`}</span>}</span>}
                      </div>
                    </div>
                    <span style={{background:meta.bg,color:meta.color,fontSize:10,fontWeight:600,padding:"3px 9px",borderRadius:6,marginLeft:8,whiteSpace:"nowrap",flexShrink:0}}>{meta.label}</span>
                  </div>

                  {/* Step-by-step notes */}
                  {task.Notes&&(
                    <div style={{marginBottom:8}}>
                      <button onClick={()=>setExpandedNotes(p=>({...p,[task.id]:!p[task.id]}))} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}>{notesOpen?"▲ Hide notes":"▼ How to do it"}</button>
                      {notesOpen&&<div style={{marginTop:8,background:"#0f1117",border:"0.5px solid #1e2130",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#9ca3af",whiteSpace:"pre-line",lineHeight:1.7}}>{task.Notes}</div>}
                    </div>
                  )}

                  {/* Log history */}
                  {logEntries.length>0&&(
                    <div style={{marginBottom:8}}>
                      <button onClick={()=>setExpandedLog(p=>({...p,[task.id]:!p[task.id]}))} style={{fontSize:12,color:"#9ca3af",background:"none",border:"none",cursor:"pointer",padding:0,fontFamily:"inherit"}}>
                        {logHistoryOpen?"▲ Hide log":"▼ Log history"} <span style={{color:"#374151"}}>({logEntries.length})</span>
                      </button>
                      {logHistoryOpen&&(
                        <div style={{marginTop:8,display:"flex",flexDirection:"column",gap:5}}>
                          {logEntries.map((entry,i)=>{
                            const col=entry.outcome.includes("✓")?"#20B07F":entry.outcome.includes("⚠")?"#d4851a":"#f87171";
                            const bg=entry.outcome.includes("✓")?"#0a2218":entry.outcome.includes("⚠")?"#2a1f0a":"#2a0f14";
                            return(
                              <div key={i} style={{background:bg,borderRadius:8,padding:"8px 10px",borderLeft:`2px solid ${col}`}}>
                                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:entry.note?3:0}}>
                                  <span style={{fontSize:12,fontWeight:600,color:col}}>{entry.outcome}</span>
                                  <span style={{fontSize:11,color:"#4b5563"}}>— {fmtDate(entry.date)}</span>
                                </div>
                                {entry.note&&<div style={{fontSize:12,color:"#9ca3af"}}>{entry.note}</div>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Log entry form */}
                  {logOpen_&&(
                    <div style={{background:"#0f1117",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px",marginBottom:8}}>
                      <div style={{fontSize:12,color:"#9ca3af",marginBottom:8,fontWeight:500}}>Log entry for: <span style={{color:"#e0e3ea"}}>{task.TaskName}</span></div>
                      {/* Outcome selector */}
                      <div style={{display:"flex",gap:6,marginBottom:10}}>
                        {[["Done","✓","#20B07F","#0a2218"],["Partial","⚠","#d4851a","#2a1f0a"],["Not done","✗","#f87171","#2a0f14"]].map(([v,icon,col,bg])=>{
                          const sel=(lf.outcome||"Done")===v;
                          return(
                            <button key={v} onClick={()=>setLogForms(p=>({...p,[task.id]:{...lf,outcome:v}}))} style={{flex:1,padding:"8px 4px",borderRadius:8,border:sel?`1.5px solid ${col}`:"0.5px solid #1e2130",background:sel?bg:"#141720",color:sel?col:"#6b7280",fontSize:12,fontWeight:sel?600:400,cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
                              <div style={{fontSize:16}}>{icon}</div>
                              <div style={{fontSize:11,marginTop:2}}>{v}</div>
                            </button>
                          );
                        })}
                      </div>
                      {/* Outcome hint */}
                      <div style={{fontSize:11,color:"#4b5563",marginBottom:10,padding:"5px 8px",background:"#141720",borderRadius:6}}>
                        {lf.outcome==="Done"&&"✓ Done — updates Last done and schedules next due date automatically"}
                        {lf.outcome==="Partial"&&"⚠ Partial — logs the date but sets next check to 7 days (follow up soon)"}
                        {lf.outcome==="Not done"&&"✗ Not done — no dates changed, task stays due. Reason is recorded in the log"}
                      </div>
                      {/* Date */}
                      <div style={{marginBottom:8}}>
                        <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Date</label>
                        <input type="date" style={{...ipt,fontSize:12}} value={lf.date||todayDate()} onChange={e=>setLogForms(p=>({...p,[task.id]:{...lf,date:e.target.value}}))}/>
                      </div>
                      {/* Notes */}
                      <div style={{marginBottom:10}}>
                        <label style={{fontSize:11,color:"#6b7280",display:"block",marginBottom:4}}>Notes{lf.outcome==="Not done"?" (reason) *":""}</label>
                        <textarea style={{...ipt,resize:"vertical",fontSize:12}} rows={2} value={lf.notes||""} onChange={e=>setLogForms(p=>({...p,[task.id]:{...lf,notes:e.target.value}}))} placeholder={lf.outcome==="Done"?"e.g. Lubricated all rollers, rotated felts. Used Q20 on gears.":lf.outcome==="Partial"?"e.g. Cleaned lens but mirrors still need doing — waiting for cotton buds":"e.g. Press booked for Year 3 project — couldn't access. Will reschedule."}/>
                      </div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>setLogOpen(p=>({...p,[task.id]:false}))} style={{flex:1,padding:"8px",borderRadius:8,border:"0.5px solid #1e2130",background:"#141720",color:"#6b7280",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                        <button onClick={()=>saveLog(task)} disabled={lf.outcome==="Not done"&&!lf.notes?.trim()} style={{flex:2,padding:"8px",borderRadius:8,border:"none",background:(lf.outcome==="Not done"&&!lf.notes?.trim())?"#1e2130":TEAL,color:(lf.outcome==="Not done"&&!lf.notes?.trim())?"#4b5563":"#fff",fontSize:12,fontWeight:500,cursor:(lf.outcome==="Not done"&&!lf.notes?.trim())?"not-allowed":"pointer",fontFamily:"inherit"}}>Save log entry</button>
                      </div>
                    </div>
                  )}

                  {/* Inline edit form */}
                  {editingInlineId===task.id&&(
                    <div style={{background:"#0f1117",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px",marginTop:6}}>
                      <div style={{fontSize:12,fontWeight:500,color:"#e0e3ea",marginBottom:10}}>Edit task</div>
                      <div style={{display:"flex",gap:8,marginBottom:8}}>
                        <div style={{flex:2}}><label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:3}}>Task name *</label><input style={ipt} value={pmForm.taskName} onChange={e=>setPmForm(f=>({...f,taskName:e.target.value}))}/></div>
                        <div style={{flex:1}}><label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:3}}>Machine</label><input style={ipt} value={pmForm.machine} onChange={e=>setPmForm(f=>({...f,machine:e.target.value}))}/></div>
                      </div>
                      <div style={{display:"flex",gap:8,marginBottom:8}}>
                        <div style={{flex:1}}><label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:3}}>Interval</label><select style={ipt} value={pmForm.interval} onChange={e=>setPmForm(f=>({...f,interval:e.target.value}))}>{["Daily","Weekly","Monthly","Per Term","Annually"].map(t=><option key={t}>{t}</option>)}</select></div>
                        <div style={{flex:1}}><label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:3}}>Last done</label><input type="date" style={ipt} value={pmForm.lastDone} onChange={e=>setPmForm(f=>({...f,lastDone:e.target.value}))}/></div>
                        <div style={{flex:1}}><label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:3}}>Next due</label><input type="date" style={ipt} value={pmForm.nextDue} onChange={e=>setPmForm(f=>({...f,nextDue:e.target.value}))}/></div>
                      </div>
                      <div style={{marginBottom:10}}><label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:3}}>Notes</label><textarea style={{...ipt,resize:"vertical",fontSize:12}} rows={2} value={pmForm.notes} onChange={e=>setPmForm(f=>({...f,notes:e.target.value}))} placeholder="What to check, steps…"/></div>
                      <div style={{display:"flex",gap:6}}>
                        <button onClick={()=>{setEditingInlineId(null);setEditTask(null);}} style={{flex:1,padding:"7px",borderRadius:8,border:"0.5px solid #1e2130",background:"#141720",color:"#6b7280",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
                        <button onClick={savePm} disabled={!pmForm.taskName.trim()} style={{flex:2,padding:"7px",borderRadius:8,border:"none",background:pmForm.taskName.trim()?TEAL:"#1e2130",color:pmForm.taskName.trim()?"#fff":"#4b5563",fontSize:12,fontWeight:500,cursor:pmForm.taskName.trim()?"pointer":"not-allowed",fontFamily:"inherit"}}>Save</button>
                      </div>
                    </div>
                  )}
                  {/* Action buttons */}
                  {!logOpen_&&editingInlineId!==task.id&&(
                    <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
                      <Btn small color={TEAL} onClick={()=>openLogForm(task)}>📋 Log</Btn>
                      <button onClick={()=>{setEditTask(task);setPmForm({taskName:task.TaskName||"",machine:task.Machine||"",interval:task.Interval||"Monthly",lastDone:task.LastDone||"",nextDue:task.NextDue||"",notes:task.Notes||""});setEditingInlineId(task.id);}} style={{padding:"5px 11px",borderRadius:8,border:"0.5px solid #1e2130",background:"#1a1d28",cursor:"pointer",color:"#60a5fa",fontSize:12,fontFamily:"inherit"}}>✏ Edit</button>
                      {confirmDeleteId===task.id?(
                        <span style={{display:"flex",gap:5,alignItems:"center",marginLeft:"auto"}}>
                          <span style={{fontSize:11,color:"#f87171"}}>Delete?</span>
                          <button onClick={()=>{deletePm(task);setConfirmDeleteId(null);}} style={{padding:"4px 9px",borderRadius:6,border:"none",background:"#f87171",color:"#fff",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Yes</button>
                          <button onClick={()=>setConfirmDeleteId(null)} style={{padding:"4px 9px",borderRadius:6,border:"0.5px solid #1e2130",background:"#1a1d28",color:"#6b7280",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>No</button>
                        </span>
                      ):(
                        <button onClick={()=>setConfirmDeleteId(task.id)} style={{padding:"5px 11px",borderRadius:8,border:"0.5px solid #3b1a1a",background:"#1f0f0f",cursor:"pointer",color:"#f87171",fontSize:12,fontFamily:"inherit",marginLeft:"auto"}}>🗑</button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── H&S PANEL COMPONENT ──────────────────────────────────────────
function HsPanel(){
  const [hsTab,setHsTab]=useState("reqs");
  const [maintReqs,setMaintReqs]=useState(null);
  const [hsLoading,setHsLoading]=useState(false);
  const [showMaintForm,setShowMaintForm]=useState(false);
  const [maintForm,setMaintForm]=useState({description:"",location:"",problemType:"",universityRef:"",dateLogged:todayDate(),dateSubmitted:"",notes:"",emailDateTime:""});
  const [editMaint,setEditMaint]=useState(null);
  const [pasteEmail,setPasteEmail]=useState("");
  const [pasteMode,setPasteMode]=useState(false);
  const [resolvingId,setResolvingId]=useState(null);
  const [resolveDate,setResolveDate]=useState("");
  const [submitting,setSubmitting]=useState(false);
  const [reportPeriod,setReportPeriod]=useState("month");
  const [reportFilter,setReportFilter]=useState(null);
  const [lastFollowUp,setLastFollowUp]=useState(()=>{try{return JSON.parse(localStorage.getItem("fats_followup_log")||"null");}catch{return null;}});
  const [lastStaffReport,setLastStaffReport]=useState(()=>{try{return JSON.parse(localStorage.getItem("fats_staffreport_log")||"null");}catch{return null;}});
  const [showTicketInput,setShowTicketInput]=useState(false);
  const [ticketInput,setTicketInput]=useState("");
  const [openMenuId,setOpenMenuId]=useState(null);
  const [archiveOpen,setArchiveOpen]=useState(false);

  function parseRUEmail(text){
    const id=(text.match(/ID[:\s]+(\d+)/i)||[])[1]||"";
    const rawType=(text.match(/Problem Type[:\s]+([^\n\r]+?)(?:\s+at\s|\s+Location|$)/i)||[])[1]||"";
    const typeMap={electrical:"Electrical",plumbing:"Plumbing",structural:"Structural",pest:"Pest Control",clean:"Cleaning",mechanical:"Equipment",hvac:"Equipment",equipment:"Equipment"};
    const probType=Object.entries(typeMap).find(([k])=>rawType.toLowerCase().includes(k))?.[1]||"Other";
    const building=(text.match(/Building Name[:\s]+([^\n\r]+?)(?:\s+and\s|\s+Floor|$)/i)||[])[1]?.trim()||"";
    const floor=(text.match(/Floor[:\s]+([^\n\r]+?)(?:\s+and\s|\s+Room|$)/i)||[])[1]?.trim()||"";
    const room=(text.match(/Room[:\s]+([^\n\r]+?)(?:\s+and\s|\s+Description|$)/i)||[])[1]?.trim()||"";
    const location=[building,floor&&`Floor ${floor}`,room&&`Room ${room}`].filter(Boolean).join(", ");
    const desc=(text.match(/Description[:\s]+([\s\S]+?)(?:[\r\n]+\s*(?:Status|Thanks|If you|$))/i)||[])[1]?.trim()||"";
    const rawStatus=(text.match(/Status been changed to[:\s]+(\w+)/i)||[])[1]||"";
    const statusMap={requested:"Submitted to Estates",inprogress:"In Progress","in progress":"In Progress",completed:"Resolved",resolved:"Resolved",closed:"Closed"};
    const status=statusMap[rawStatus.toLowerCase()]||"Submitted to Estates";
    const dtMatch=text.match(/(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d{1,2}\s+\w+(?:\s+\d{4})?,\s*\d{1,2}:\d{2}/i);
    const emailDateTime=dtMatch?dtMatch[0]:"";
    // Convert "Mon 16 Mar, 11:36" or "Mon 16 Mar 2026, 11:36" → "2026-03-16"
    function emailDateToISO(s){
      if(!s)return"";
      const months={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
      const m=s.match(/(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?/);
      if(!m)return"";
      const day=String(parseInt(m[1])).padStart(2,"0");
      const mon=months[m[2].toLowerCase().slice(0,3)];
      if(!mon)return"";
      const year=m[3]||String(new Date().getFullYear());
      return`${year}-${String(mon).padStart(2,"0")}-${day}`;
    }
    const dateSubmitted=emailDateToISO(emailDateTime)||"";
    return{universityRef:id,problemType:probType,location,description:desc,dateLogged:todayDate(),dateSubmitted,notes:"",parsedStatus:status,emailDateTime};
  }
  function daysSince(d){if(!d)return null;const diff=new Date()-new Date(d+"T00:00:00");return Math.floor(diff/86400000);}
  function escalationColor(days){if(days===null)return"#6b7280";if(days<14)return"#20B07F";if(days<30)return"#d4851a";return"#f87171";}
  useEffect(()=>{
    setHsLoading(true);
    atGet(MAINT_TABLE,{maxRecords:200,sort:[{field:"DateLogged",direction:"desc"}]}).then(d=>{
      setMaintReqs(d.records?d.records.map(r=>({id:r.id,...r.fields})):[]);
    }).catch(()=>setMaintReqs([])).finally(()=>setHsLoading(false));
  },[]);

  async function saveMaintReq(){
    if(submitting)return;
    setSubmitting(true);
    try{
      const autoStatus=maintForm.universityRef?"Submitted to Estates":"Open";
      const baseFields={"Description":maintForm.description,"Location":maintForm.location,"ProblemType":maintForm.problemType||undefined,"Status":autoStatus,"UniversityRef":maintForm.universityRef||undefined,"DateLogged":maintForm.dateLogged||undefined,"DateSubmitted":maintForm.dateSubmitted||undefined,"Notes":maintForm.notes||undefined,"EmailDateTime":maintForm.emailDateTime||undefined};
      if(editMaint){
        await atPatch(MAINT_TABLE,editMaint.id,baseFields);
        setMaintReqs(prev=>prev.map(r=>r.id===editMaint.id?{...r,...baseFields}:r));
      } else {
        const fields={"Name":genId(),...baseFields};
        const res=await atPost(MAINT_TABLE,fields);
        if(res.id) setMaintReqs(prev=>[{id:res.id,...fields},...(prev||[])]);
      }
      setShowMaintForm(false);setEditMaint(null);setMaintForm({description:"",location:"",problemType:"",universityRef:"",dateLogged:todayDate(),dateSubmitted:"",notes:"",emailDateTime:""});
    }finally{setSubmitting(false);}
  }
  async function deleteMaintReq(req){
    if(!window.confirm(`Delete this request?\n\n"${req.Description}"\n\nThis cannot be undone.`))return;
    await atDelete(MAINT_TABLE,req.id);
    setMaintReqs(prev=>prev.filter(r=>r.id!==req.id));
  }
  async function reopenMaintReq(req){
    await atPatch(MAINT_TABLE,req.id,{Status:"Open",DateResolved:undefined});
    setMaintReqs(prev=>prev.map(r=>r.id===req.id?{...r,Status:"Open",DateResolved:undefined}:r));
  }
  function refreshHs(){
    setHsLoading(true);
    atGet(MAINT_TABLE,{maxRecords:200,sort:[{field:"DateLogged",direction:"desc"}]}).then(d=>{
      setMaintReqs(d.records?d.records.map(r=>({id:r.id,...r.fields})):[]);
    }).catch(()=>setMaintReqs([])).finally(()=>setHsLoading(false));
  }
  async function updateMaintStatus(req,status,dateResolved){
    const extra=status==="Resolved"?{DateResolved:dateResolved||todayDate()}:{};
    await atPatch(MAINT_TABLE,req.id,{Status:status,...extra});
    setMaintReqs(prev=>prev.map(r=>r.id===req.id?{...r,Status:status,...extra}:r));
  }
  async function confirmResolve(req){
    await updateMaintStatus(req,"Resolved",resolveDate||todayDate());
    setResolvingId(null);setResolveDate("");
  }
  const openReqs=(maintReqs||[]).filter(r=>!["Resolved","Closed"].includes(r.Status));
  const closedReqs=(maintReqs||[]).filter(r=>["Resolved","Closed"].includes(r.Status));
  const needsChase=openReqs.filter(r=>{
    const checkDate=r.LastFollowUpDate||r.DateSubmitted||r.DateLogged;
    if(!checkDate)return false;
    return Math.floor((Date.now()-new Date(checkDate+"T00:00:00").getTime())/86400000)>=14;
  });

  return(<>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
      <div style={{fontSize:15,fontWeight:500}}>🦺 H&S / Maintenance</div>
      <button onClick={refreshHs} title="Refresh from Airtable" style={{padding:"4px 10px",borderRadius:7,border:"0.5px solid #1e2130",background:"#1a1d28",cursor:"pointer",color:"#6b7280",fontSize:11,fontFamily:"inherit"}}>↻ Refresh</button>
    </div>
    <div style={{fontSize:13,color:"#6b7280",marginBottom:12}}>Requisitions and preventive maintenance log</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
      <div onClick={()=>setHsTab("reqs")} style={{background:"#2a1f0a",borderRadius:8,padding:"10px 12px",border:"0.5px solid #d4851a33",cursor:"pointer"}}>
        <div style={{fontSize:22,fontWeight:500,color:"#d4851a",lineHeight:1}}>{openReqs.length}</div>
        <div style={{fontSize:10,color:"#d4851a",marginTop:3}}>Open requests</div>
      </div>
      <div onClick={()=>setHsTab("report")} style={{background:needsChase.length>0?"#2a1f0a":"#141720",borderRadius:8,padding:"10px 12px",border:`0.5px solid ${needsChase.length>0?"#d4851a33":"#1e2130"}`,cursor:"pointer"}}>
        <div style={{fontSize:22,fontWeight:500,color:needsChase.length>0?"#d4851a":"#6b7280",lineHeight:1}}>{needsChase.length}</div>
        <div style={{fontSize:10,color:needsChase.length>0?"#d4851a":"#6b7280",marginTop:3}}>Due a chase</div>
      </div>
      <div onClick={()=>setHsTab("report")} style={{background:"#0d1525",borderRadius:8,padding:"10px 12px",border:"0.5px solid #3b82f633",cursor:"pointer"}}>
        {(()=>{
          if(!lastFollowUp)return(<><div style={{fontSize:22,fontWeight:500,color:"#4b5563",lineHeight:1}}>—</div><div style={{fontSize:10,color:"#4b5563",marginTop:3}}>Never chased</div></>);
          const days=Math.floor((new Date()-new Date(lastFollowUp.date+"T00:00:00"))/86400000);
          const col=days===0?"#20B07F":days<=14?"#60a5fa":days<=21?"#d97706":"#f87171";
          return(<><div style={{fontSize:22,fontWeight:500,color:col,lineHeight:1}}>{days===0?"Today":`${days}d`}</div><div style={{fontSize:10,color:col,marginTop:3}}>{days===0?"Chased today":"Since last chase"}</div></>);
        })()}
      </div>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:16}}>
      {[["reqs","🔧 Requisitions"],["report","📊 Report"]].map(([v,l])=>(
        <button key={v} onClick={()=>setHsTab(v)} style={{flex:1,padding:"8px 4px",borderRadius:8,background:hsTab===v?TEAL:"#141720",color:hsTab===v?"#fff":"#6b7280",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:hsTab===v?"none":"0.5px solid #1e2130"}}>{l}</button>
      ))}
    </div>
    {hsLoading&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>Loading...</div>}
    {!hsLoading&&hsTab==="reqs"&&(<>
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        <Btn outline color={TEAL} onClick={()=>{setShowMaintForm(true);setPasteMode(false);setEditMaint(null);setMaintForm({description:"",location:"",problemType:"",universityRef:"",dateLogged:todayDate(),dateSubmitted:"",notes:"",emailDateTime:""});}} style={{flex:1}}>+ Manual</Btn>
        <Btn outline color="#60a5fa" onClick={()=>{setShowMaintForm(true);setPasteMode(true);setEditMaint(null);setPasteEmail("");}} style={{flex:1}}>📧 Paste RU email</Btn>
      </div>
      {showMaintForm&&(
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,padding:"16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>{editMaint?"Edit request":pasteMode?"Paste university email":"New maintenance request"}</div>
          {pasteMode&&!editMaint&&(<>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Paste the RU email body below</label>
              <textarea style={{...ipt,resize:"vertical",fontSize:12}} rows={8} value={pasteEmail} onChange={e=>setPasteEmail(e.target.value)} placeholder={"Paste the email text here, e.g.:\n\nYour work request with ID: 104694 with\nProblem Type: ELECTRICAL|...\nLocation: B1 and\nBuilding Name: B1-FINE ARTS GRAPHICS DEPT and\nFloor: G and\nRoom: G019 and\nDescription: ..."}/>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <Btn color="#60a5fa" onClick={()=>{const parsed=parseRUEmail(pasteEmail);setMaintForm({description:parsed.description,location:parsed.location,problemType:parsed.problemType,universityRef:parsed.universityRef,dateLogged:todayDate(),dateSubmitted:parsed.dateSubmitted||"",notes:"",emailDateTime:parsed.emailDateTime||""});setPasteMode(false);}} disabled={!pasteEmail.trim()} style={{flex:2}}>Parse email →</Btn>
              <Btn outline color="#4b5563" onClick={()=>{setShowMaintForm(false);setPasteMode(false);}} style={{flex:1}}>Cancel</Btn>
            </div>
            <div style={{fontSize:12,color:"#4b5563",background:"#0f1117",borderRadius:8,padding:"10px 12px"}}>The parser will extract the request ID, problem type, building, floor, room, and description automatically. You can review and edit everything before saving.</div>
          </>)}
          {!pasteMode&&(<>
            <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Description *</label><textarea style={{...ipt,resize:"vertical"}} rows={3} value={maintForm.description} onChange={e=>setMaintForm(f=>({...f,description:e.target.value}))} placeholder="What is the problem?"/></div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Location</label><input style={ipt} value={maintForm.location} onChange={e=>setMaintForm(f=>({...f,location:e.target.value}))} placeholder="e.g. Mac lab, Workshop"/></div>
              <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Problem type</label><select style={ipt} value={maintForm.problemType} onChange={e=>setMaintForm(f=>({...f,problemType:e.target.value}))}><option value="">Select…</option>{["Electrical","Plumbing","Structural","Pest Control","Cleaning","Equipment","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Date logged</label><input type="date" style={ipt} value={maintForm.dateLogged} onChange={e=>setMaintForm(f=>({...f,dateLogged:e.target.value}))}/></div>
              <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Date submitted to Estates{!maintForm.dateSubmitted&&<span style={{color:"#f87171",marginLeft:6,fontSize:11}}>⚠ enter manually</span>}</label><input type="date" style={{...ipt,...(!maintForm.dateSubmitted?{borderColor:"#f87171"}:{})}} value={maintForm.dateSubmitted} onChange={e=>setMaintForm(f=>({...f,dateSubmitted:e.target.value}))}/></div>
            </div>
            {maintForm.emailDateTime&&(<div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Email timestamp (from parsed email)</label><input style={{...ipt,color:"#60a5fa",background:"#0a1e35"}} value={maintForm.emailDateTime} readOnly/></div>)}
            <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>University reference no.</label><input style={ipt} value={maintForm.universityRef} onChange={e=>setMaintForm(f=>({...f,universityRef:e.target.value}))} placeholder="e.g. REQ-2026-1234"/></div>
            <div style={{marginBottom:12}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Notes</label><textarea style={{...ipt,resize:"vertical"}} rows={2} value={maintForm.notes} onChange={e=>setMaintForm(f=>({...f,notes:e.target.value}))} placeholder="Any additional details…"/></div>
            <div style={{display:"flex",gap:8}}>
              <Btn outline color="#4b5563" onClick={()=>{setShowMaintForm(false);setEditMaint(null);setPasteMode(false);}} style={{flex:1}} disabled={submitting}>Cancel</Btn>
              <Btn color={TEAL} onClick={saveMaintReq} disabled={!maintForm.description.trim()||submitting} style={{flex:2}}>{submitting?"Saving…":"Save"}</Btn>
            </div>
          </>)}
        </div>
      )}
      {(maintReqs===null)&&!hsLoading&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>Loading…</div>}
      {maintReqs!==null&&openReqs.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14,border:"0.5px dashed #1e2130",borderRadius:10}}>No open requests</div>}
      {openReqs.map(req=>{
        const days=req.DateSubmitted?daysSince(req.DateSubmitted):null;
        const col=escalationColor(days);
        return(
          <div key={req.id} style={{background:"#141720",border:`0.5px solid #1e2130`,borderRadius:12,padding:"14px 16px",marginBottom:10,borderLeft:`3px solid ${col}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:4,alignItems:"center"}}>
                  {req.ProblemType&&<span style={{fontSize:11,background:"#1a1d28",color:"#9ca3af",borderRadius:5,padding:"2px 7px"}}>{req.ProblemType}</span>}
                  {req.Location&&<span style={{fontSize:11,color:"#6b7280"}}>📍 {req.Location}</span>}
                  {req.LastFollowUpDate&&<span style={{fontSize:11,background:"#0d1a2e",color:"#60a5fa",borderRadius:5,padding:"2px 7px",border:"0.5px solid #3b82f633"}}>📧 Chased {fmtDate(req.LastFollowUpDate)}</span>}
                </div>
                <div style={{fontSize:14,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>{req.Description}</div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap",fontSize:12,color:"#6b7280"}}>
                  {req.DateLogged&&<span>Logged: {fmtDate(req.DateLogged)}</span>}
                  {req.DateSubmitted&&<span style={{color:col}}>Submitted: {fmtDate(req.DateSubmitted)} · {days}d ago</span>}
                  {req.UniversityRef&&<span style={{color:"#60a5fa"}}>Ref: {req.UniversityRef}</span>}
                  {req.EmailDateTime&&<span style={{color:"#9ca3af"}}>📧 {req.EmailDateTime}</span>}
                </div>
                {req.Notes&&<div style={{fontSize:12,color:"#c9d1d9",marginTop:8,background:"#0d1525",borderRadius:7,padding:"8px 10px",borderLeft:"2px solid #3b82f6"}}>
                  <span style={{fontSize:10,color:"#60a5fa",fontWeight:600,display:"block",marginBottom:3,letterSpacing:"0.5px"}}>NOTES</span>
                  {req.Notes}
                </div>}
              </div>
              <div style={{marginLeft:8,flexShrink:0}}>
                <span style={{...statusStyle[req.Status]||{bg:"#1a1d28",color:"#9ca3af"},background:(statusStyle[req.Status]||{bg:"#1a1d28"}).bg,color:(statusStyle[req.Status]||{color:"#9ca3af"}).color,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:6,whiteSpace:"nowrap"}}>{req.Status}</span>
              </div>
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8,alignItems:"center"}}>
              {req.Status!=="Resolved"&&(resolvingId===req.id?(
                <span style={{display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                  <input type="date" value={resolveDate} onChange={e=>setResolveDate(e.target.value)} style={{...ipt,padding:"3px 7px",fontSize:11,width:"auto"}}/>
                  <button onClick={()=>confirmResolve(req)} style={{padding:"4px 10px",borderRadius:7,border:"none",background:"#20B07F",cursor:"pointer",color:"#fff",fontSize:11,fontFamily:"inherit"}}>✓ Confirm</button>
                  <button onClick={()=>{setResolvingId(null);setResolveDate("");}} style={{padding:"4px 8px",borderRadius:7,border:"0.5px solid #1e2130",background:"#1a1d28",cursor:"pointer",color:"#6b7280",fontSize:11,fontFamily:"inherit"}}>✕</button>
                </span>
              ):(
                <button onClick={()=>{setResolvingId(req.id);setResolveDate(todayDate());setOpenMenuId(null);}} style={{padding:"4px 10px",borderRadius:7,border:"0.5px solid #1e2130",background:"#1a1d28",cursor:"pointer",color:"#9ca3af",fontSize:11,fontFamily:"inherit"}}>→ Resolved</button>
              ))}
              <button onClick={()=>{setEditMaint(req);setMaintForm({description:req.Description||"",location:req.Location||"",problemType:req.ProblemType||"",universityRef:req.UniversityRef||"",dateLogged:req.DateLogged||todayDate(),dateSubmitted:req.DateSubmitted||"",notes:req.Notes||"",emailDateTime:req.EmailDateTime||""});setShowMaintForm(true);setOpenMenuId(null);}} style={{padding:"4px 10px",borderRadius:7,border:"0.5px solid #1e2130",background:"#1a1d28",cursor:"pointer",color:"#60a5fa",fontSize:11,fontFamily:"inherit"}}>✏ Edit</button>
              <div style={{position:"relative",marginLeft:"auto"}}>
                <button onClick={()=>setOpenMenuId(openMenuId===req.id?null:req.id)} style={{padding:"4px 10px",borderRadius:7,border:"0.5px solid #1e2130",background:openMenuId===req.id?"#1e2130":"#141720",cursor:"pointer",color:"#6b7280",fontSize:15,fontFamily:"inherit",lineHeight:1}}>⋯</button>
                {openMenuId===req.id&&(
                  <div style={{position:"absolute",bottom:"calc(100% + 6px)",right:0,zIndex:100,background:"#1a1d28",border:"0.5px solid #1e2130",borderRadius:9,padding:"4px",minWidth:175,boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
                    {["Submitted to Estates","In Progress","Closed"].filter(s=>s!==req.Status).map(s=>(
                      <button key={s} onClick={()=>{updateMaintStatus(req,s);setOpenMenuId(null);}} style={{display:"block",width:"100%",textAlign:"left",padding:"7px 10px",border:"none",background:"transparent",cursor:"pointer",color:"#9ca3af",fontSize:12,fontFamily:"inherit",borderRadius:6}}>→ {s}</button>
                    ))}
                    <div style={{borderTop:"0.5px solid #1e2130",margin:"3px 0"}}/>
                    <button onClick={()=>{deleteMaintReq(req);setOpenMenuId(null);}} style={{display:"block",width:"100%",textAlign:"left",padding:"7px 10px",border:"none",background:"transparent",cursor:"pointer",color:"#f87171",fontSize:12,fontFamily:"inherit",borderRadius:6}}>🗑 Delete</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {closedReqs.length>0&&(
        <details style={{marginTop:8}} open={archiveOpen} onToggle={e=>setArchiveOpen(e.target.open)}>
          <summary style={{fontSize:13,color:"#4b5563",cursor:"pointer",padding:"10px 14px",background:"#0f1117",borderRadius:8,border:"0.5px solid #1e2130",listStyle:"none",display:"flex",alignItems:"center",gap:8,userSelect:"none"}}>
            <span style={{fontSize:11,display:"inline-block",transition:"transform 0.2s",transform:archiveOpen?"rotate(90deg)":"rotate(0deg)"}}>▶</span> Archive — {closedReqs.length} resolved / closed
          </summary>
          <div style={{marginTop:8}}>
            {closedReqs.map(req=>(
              <div key={req.id} style={{background:"#0f1117",border:"0.5px solid #1e2130",borderRadius:10,padding:"10px 14px",marginBottom:6,opacity:0.8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"#9ca3af"}}>{req.Description}</div>
                    <div style={{fontSize:11,color:"#374151",marginTop:2}}>{req.Location&&`📍 ${req.Location} · `}{req.DateResolved&&`Resolved ${fmtDate(req.DateResolved)}`}</div>
                  </div>
                  <span style={{fontSize:11,color:"#4b5563",background:"#1a1d28",borderRadius:5,padding:"2px 7px",whiteSpace:"nowrap"}}>{req.Status}</span>
                </div>
                <div style={{display:"flex",gap:6,marginTop:8}}>
                  <button onClick={()=>reopenMaintReq(req)} style={{padding:"3px 9px",borderRadius:6,border:"0.5px solid #1e2130",background:"#1a1d28",cursor:"pointer",color:"#60a5fa",fontSize:11,fontFamily:"inherit"}}>↩ Reopen</button>
                  <button onClick={()=>deleteMaintReq(req)} style={{padding:"3px 9px",borderRadius:6,border:"0.5px solid #3b1a1a",background:"#1f0f0f",cursor:"pointer",color:"#f87171",fontSize:11,fontFamily:"inherit"}}>🗑 Delete</button>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </>)}
    {/* ── REPORT ── */}
    {!hsLoading&&hsTab==="report"&&(()=>{
      const now=new Date();
      function cleanDesc(d){if(!d)return"";return d.replace(/,?\s*Status been changed to:.*$/si,"").replace(/\n+/g," ").trim();}
      function startOf(period){
        const d=new Date();
        if(period==="month"){d.setDate(1);d.setHours(0,0,0,0);return d;}
        if(period==="lastmonth"){d.setDate(1);d.setHours(0,0,0,0);d.setMonth(d.getMonth()-1);return d;}
        if(period==="3months"){d.setMonth(d.getMonth()-3);d.setHours(0,0,0,0);return d;}
        if(period==="term"){
          const m=d.getMonth();
          if(m>=1&&m<=4){d.setMonth(1,1);}else if(m>=5&&m<=7){d.setMonth(5,1);}else{d.setMonth(8,1);}
          d.setHours(0,0,0,0);return d;
        }
        return new Date(0);
      }
      function endOf(period){
        if(period==="lastmonth"){const d=new Date();d.setDate(1);d.setHours(0,0,0,0);return d;}
        return now;
      }
      const all=maintReqs||[];
      const from=startOf(reportPeriod);
      const to=endOf(reportPeriod);
      const inPeriod=all.filter(r=>{
        const d=new Date((r.DateSubmitted||r.DateLogged||"2000-01-01")+"T00:00:00");
        return d>=from&&d<=to;
      });
      const resolved=inPeriod.filter(r=>r.Status==="Resolved");
      const outstanding=inPeriod.filter(r=>!["Resolved","Closed"].includes(r.Status));
      const closed=inPeriod.filter(r=>r.Status==="Closed");
      const followedUp=inPeriod.filter(r=>r.LastFollowUpDate);
      const avgDays=resolved.length?Math.round(resolved.reduce((sum,r)=>{
        if(!r.DateSubmitted||!r.DateResolved)return sum;
        return sum+Math.floor((new Date(r.DateResolved+"T00:00:00")-new Date(r.DateSubmitted+"T00:00:00"))/86400000);
      },0)/resolved.length):null;
      const aging={under7:0,d7to14:0,d14to30:0,over30:0};
      outstanding.forEach(r=>{
        const d=r.DateSubmitted?Math.floor((now-new Date(r.DateSubmitted+"T00:00:00"))/86400000):0;
        if(d<7)aging.under7++;else if(d<14)aging.d7to14++;else if(d<30)aging.d14to30++;else aging.over30++;
      });
      const byType={};
      inPeriod.forEach(r=>{const t=r.ProblemType||"Other";byType[t]=(byType[t]||0)+1;});
      const periods=[["month","This Month"],["term","This Term"],["all","All Time"]];
      const nextSendDate=(()=>{
        const now=new Date();
        const earliest=new Date("2026-06-01T07:00:00");
        const sentCycle=lastStaffReport?.cycle||null;
        const y=now.getFullYear(),m=now.getMonth();
        const candidates=[new Date(y,m,1,7,0,0),new Date(y,m,15,7,0,0),new Date(y,m+1,1,7,0,0),new Date(y,m+1,15,7,0,0),new Date(y,m+2,1,7,0,0)];
        const next=candidates.find(d=>d>now&&d>=earliest&&d.toISOString().split("T")[0]!==sentCycle);
        const daysLeft=Math.ceil((next-now)/86400000);
        const label=next.toLocaleDateString("en-ZA",{day:"2-digit",month:"short"});
        const isWarningDay=daysLeft===1;
        const isSendDay=daysLeft===0;
        return{daysLeft,label,isWarningDay,isSendDay};
      })();
      return(<>
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#e0e3ea"}}>Maintenance Report</div>
              <div style={{fontSize:11,marginTop:3,color:nextSendDate.isSendDay?"#20B07F":nextSendDate.isWarningDay?"#d97706":"#6b7280"}}>
                {nextSendDate.isSendDay
                  ? "📧 Report sends today at 07:00"
                  : nextSendDate.isWarningDay
                    ? `⏰ Report sends tomorrow (${nextSendDate.label}) — check everything is up to date`
                    : `Next report: ${nextSendDate.label} · ${nextSendDate.daysLeft} day${nextSendDate.daysLeft!==1?"s":""} away`}
              </div>
              {lastStaffReport&&<div style={{fontSize:11,color:"#6b7280",marginTop:4}}>Last sent: {new Date(lastStaffReport.date+"T00:00:00").toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"})}</div>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
              <button onClick={async()=>{
                try{
                  const r=await fetch("/api/staff-report?preview=true",{method:"POST"});
                  const d=await r.json();
                  if(d.html){
                    const w=window.open("","_blank");
                    w.document.write(d.html);
                    w.document.close();
                  }else alert("❌ Could not load preview: "+(d.error||"Unknown error"));
                }catch(e){alert("❌ Network error: "+e.message);}
              }} style={{padding:"7px 14px",borderRadius:8,border:"0.5px solid #1e2130",background:"#1a1d28",color:"#9ca3af",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>👁 Preview</button>
              <button onClick={()=>{
                const now=new Date();
                const today=now.toISOString().split("T")[0];
                const y=now.getFullYear(),mo=now.getMonth();
                const earliest=new Date("2026-06-01T07:00:00");
                const cycleCandidates=[new Date(y,mo,1,7,0,0),new Date(y,mo,15,7,0,0),new Date(y,mo+1,1,7,0,0),new Date(y,mo+1,15,7,0,0)];
                const cycle=(cycleCandidates.find(d=>d>=now&&d>=earliest)||cycleCandidates[0]).toISOString().split("T")[0];
                const log={date:today,cycle};
                localStorage.setItem("fats_staffreport_log",JSON.stringify(log));
                setLastStaffReport(log);
              }} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#0a2218",color:"#20B07F",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>✅ Mark sent</button>
            </div>
          </div>
        </div>
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"14px 16px",marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:"#e0e3ea"}}>Estates Follow-up</div>
              <div style={{fontSize:11,marginTop:3,color:"#6b7280"}}>{(()=>{if(!lastFollowUp)return"Chases all open requests outstanding 14+ days";const next=new Date(lastFollowUp.date+"T00:00:00");next.setDate(next.getDate()+14);const daysLeft=Math.ceil((next-new Date())/86400000);const nextLabel=next.toLocaleDateString("en-ZA",{day:"2-digit",month:"short"});return daysLeft<=0?"Chases all open requests outstanding 14+ days · next chase overdue":`Chases all open requests outstanding 14+ days · next chase: ${nextLabel} (${daysLeft}d)`;})()}</div>
              {lastFollowUp&&<div style={{fontSize:11,color:"#6b7280",marginTop:4}}>Last sent: {new Date(lastFollowUp.date+"T00:00:00").toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"})}{lastFollowUp.count?` · ${lastFollowUp.count} req`:""}{lastFollowUp.ticket?` · ${lastFollowUp.ticket}`:""}</div>}
            </div>
            <div style={{display:"flex",gap:6,alignItems:"center",flexShrink:0}}>
              <button onClick={async()=>{
                try{
                  const r=await fetch("/api/cron-followup?preview=true",{method:"POST"});
                  const d=await r.json();
                  if(d.html){const w=window.open("","_blank");w.document.write(d.html);w.document.close();}
                  else alert("No stale requests to preview.");
                }catch(e){alert("❌ "+e.message);}
              }} style={{padding:"7px 14px",borderRadius:8,border:"0.5px solid #1e2130",background:"#1a1d28",color:"#9ca3af",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>👁 Preview</button>
              {showTicketInput?(
                <span style={{display:"flex",gap:5,alignItems:"center"}}>
                  <input value={ticketInput} onChange={e=>setTicketInput(e.target.value)} placeholder="RT ticket, e.g. #805652" style={{...ipt,padding:"5px 9px",fontSize:11,width:170}} autoFocus/>
                  <button onClick={async()=>{
                    const today=new Date().toISOString().split("T")[0];
                    if(lastFollowUp&&lastFollowUp.date===today){
                      const log={...lastFollowUp,ticket:ticketInput.trim()||null};
                      localStorage.setItem("fats_followup_log",JSON.stringify(log));
                      setLastFollowUp(log);
                    }else{
                      try{
                        const r=await fetch("/api/log-followup",{method:"POST"});
                        const d=await r.json();
                        if(d.ok){
                          const log={date:today,count:d.updated,ticket:ticketInput.trim()||null};
                          localStorage.setItem("fats_followup_log",JSON.stringify(log));
                          setLastFollowUp(log);
                        }else alert("❌ "+(d.error||"Unknown error"));
                      }catch(e){alert("❌ "+e.message);}
                    }
                    setShowTicketInput(false);setTicketInput("");
                  }} style={{padding:"5px 10px",borderRadius:7,border:"none",background:"#20B07F",cursor:"pointer",color:"#fff",fontSize:11,fontFamily:"inherit"}}>✓</button>
                  <button onClick={()=>{setShowTicketInput(false);setTicketInput("");}} style={{padding:"5px 8px",borderRadius:7,border:"0.5px solid #1e2130",background:"#1a1d28",cursor:"pointer",color:"#6b7280",fontSize:11,fontFamily:"inherit"}}>✕</button>
                </span>
              ):(
                <button onClick={()=>{setShowTicketInput(true);setTicketInput(lastFollowUp?.ticket||"");}} style={{padding:"7px 14px",borderRadius:8,border:"none",background:"#0a2218",color:"#20B07F",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit"}}>✅ Mark sent</button>
              )}
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
          {periods.map(([v,l])=>(
            <button key={v} onClick={()=>setReportPeriod(v)} style={{padding:"6px 14px",borderRadius:8,border:"none",background:reportPeriod===v?TEAL:"#1a1d28",color:reportPeriod===v?"#fff":"#6b7280",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:reportPeriod===v?"none":"0.5px solid #1e2130"}}>{l}</button>
          ))}
        </div>
        {inPeriod.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14,border:"0.5px dashed #1e2130",borderRadius:10}}>No requests in this period</div>}
        {inPeriod.length>0&&(<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
            {[["Total opened",inPeriod.length,"#e0e3ea","#1a1d28","all"],["Resolved",resolved.length,"#20B07F","#0a2218","resolved"],["Outstanding",outstanding.length,"#d4851a","#2a1f0a","outstanding"],["Followed Up",followedUp.length,"#3b82f6","#0d1a2e","followedup"]].map(([l,n,col,bg,fKey])=>{
              const active=reportFilter===fKey||(fKey==="outstanding"&&reportFilter===null);
              return(
                <div key={l} onClick={()=>setReportFilter(fKey==="outstanding"&&reportFilter===null?null:fKey)} style={{background:bg,borderRadius:10,padding:"12px 14px",border:`0.5px solid ${active?col:col+"22"}`,cursor:"pointer",outline:active?`1.5px solid ${col}`:"none",transition:"outline 0.1s"}}>
                  <div style={{fontSize:24,fontWeight:600,color:col,lineHeight:1}}>{n}</div>
                  <div style={{fontSize:11,color:col,marginTop:4,opacity:0.8}}>{l}</div>
                </div>
              );
            })}
          </div>
          {avgDays!==null&&<div style={{background:"#0a1e35",borderRadius:10,padding:"12px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:13,color:"#9ca3af"}}>Avg. resolution time</span>
            <span style={{fontSize:18,fontWeight:600,color:"#60a5fa"}}>{avgDays} days</span>
          </div>}
          {outstanding.length>0&&(!reportFilter||reportFilter==="outstanding")&&(<>
            <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea",marginBottom:8}}>Outstanding — aging</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,marginBottom:16}}>
              {[["< 7 days",aging.under7,"#20B07F"],["7–14 days",aging.d7to14,"#60a5fa"],["14–30 days",aging.d14to30,"#d4851a"],["> 30 days",aging.over30,"#f87171"]].map(([l,n,col])=>(
                <div key={l} style={{background:"#141720",borderRadius:8,padding:"10px",border:`0.5px solid ${col}44`,textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:600,color:col}}>{n}</div>
                  <div style={{fontSize:10,color:"#6b7280",marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
          </>)}
          {(()=>{
            const filterLabel=reportFilter==="resolved"?"Resolved":reportFilter==="followedup"?"Followed Up":reportFilter==="all"?"All":outstanding.length>0?"Outstanding":null;
            const filterList=reportFilter==="resolved"?resolved:reportFilter==="followedup"?followedUp:reportFilter==="all"?inPeriod:outstanding;
            if(!filterLabel||filterList.length===0)return null;
            return(<>
            <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea",marginBottom:8}}>{filterLabel} requests <span style={{fontWeight:400,color:"#6b7280",fontSize:12}}>({filterList.length})</span></div>
            {filterList.sort((a,b)=>{
              const da=a.DateSubmitted?Math.floor((now-new Date(a.DateSubmitted+"T00:00:00"))/86400000):0;
              const db=b.DateSubmitted?Math.floor((now-new Date(b.DateSubmitted+"T00:00:00"))/86400000):0;
              return db-da;
            }).map(r=>{
              const days=r.DateSubmitted?Math.floor((now-new Date(r.DateSubmitted+"T00:00:00"))/86400000):null;
              const col=days===null?"#6b7280":days<7?"#20B07F":days<14?"#60a5fa":days<30?"#d4851a":"#f87171";
              return(
                <div key={r.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#141720",borderRadius:8,marginBottom:6,borderLeft:`3px solid ${col}`}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"#e0e3ea",marginBottom:2}}>{cleanDesc(r.Description)}</div>
                    <div style={{fontSize:11,color:"#6b7280"}}>{r.Location&&`📍 ${r.Location}`}{r.UniversityRef&&` · Ref: ${r.UniversityRef}`}</div>
                  </div>
                  <div style={{textAlign:"right",marginLeft:12,flexShrink:0}}>
                    <div style={{fontSize:13,fontWeight:600,color:col}}>{days!==null?`${days}d`:"-"}</div>
                    <div style={{fontSize:10,color:"#6b7280"}}>{filterLabel?.toLowerCase()}</div>
                  </div>
                </div>
              );
            })}
            </>);
          })()}
          {Object.keys(byType).length>0&&(<>
            <div style={{fontSize:13,fontWeight:500,color:"#e0e3ea",marginBottom:8,marginTop:8}}>By problem type</div>
            {Object.entries(byType).sort(([,a],[,b])=>b-a).map(([t,n])=>(
              <div key={t} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#141720",borderRadius:8,marginBottom:4}}>
                <span style={{fontSize:13,color:"#9ca3af"}}>{t}</span>
                <span style={{fontSize:13,fontWeight:600,color:"#e0e3ea"}}>{n}</span>
              </div>
            ))}
          </>)}
        </>)}
      </>);
    })()}
  </>);
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
  const [licences, setLicences] = useState(DEFAULT_LICENCES);
  const [licForm, setLicForm] = useState({software:"",vendor:"",vendorContact:"",vendorPhone:"",poNumber:"",licenceNo:"",importCode:"",partNo:"",seats:"1",effectiveDate:todayDate(),expiryDate:"",notes:""});
  const [showLicForm, setShowLicForm] = useState(false);
  const [expandLicId, setExpandLicId] = useState(null);
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

  const [selSlot, setSelSlot] = useState(null);

  // Block dates
  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

  // Maintenance
  const [maintForm, setMaintForm] = useState({equipmentId:"",date:"",notes:"",status:"Done",duration:""});

  // Student request form
  const [form, setForm] = useState({name:"",studNo:localStorage.getItem(KEYS.savedStudNo)||"",year:"",when:"walkin",schedDate:"",notes:"",paperSize:"",paperType:"",colour:"Colour",copies:"",material:"",materialThickness:"",dimensions:"",jobType:"Cut",softwareName:"",downloadUrl:"",macLocation:"",shootType:"",duration:"",material3d:"",infill:"",eventType:"",eventStart:"",eventEnd:"",attendance:"",setupNeeds:"",venue:"",techSupport:"",printPresent:"",softwareType:"",studioDate:"",studioSlot:"",dropOffDate:"",sessionDuration:"",fileLink:"",firstTime:false});

  // AV setup wizard state
  const [avStep, setAvStep] = useState(0);
  const [avWiz, setAvWiz] = useState({purpose:"",venue:"",venueOther:"",eventDate:"",eventTime:"",setupDate:"",setupTime:"",duration:"",device:"",displayType:"",screenCount:"1",contentType:"",audio:""});
  const setAv = (key,val) => setAvWiz(w=>({...w,[key]:val}));
  function avWizStepOk(step){
    if(step===0)return !!avWiz.purpose;
    if(step===1)return !!avWiz.venue&&(avWiz.venue!=="other"||!!avWiz.venueOther.trim());
    if(step===2)return !!avWiz.eventDate&&!!avWiz.setupDate;
    if(step===3)return !!avWiz.device;
    if(step===4)return !!avWiz.contentType;
    if(step===5)return !!avWiz.displayType&&!!avWiz.screenCount&&parseInt(avWiz.screenCount)>0;
    if(step===6)return !!avWiz.audio;
    return true;
  }
  function deriveAVRequirements(w){
    const reqs=[];
    const n=parseInt(w.screenCount)||1;
    const dt=w.displayType||"projector";
    // Projector requirements
    if(dt==="projector"||dt==="both"){
      if(n>2)reqs.push({icon:"⚠️",label:`${n} × projectors — complex setup, Tech Support will advise`,warn:true});
      else reqs.push({icon:"📽️",label:`${n} × projector${n>1?"s":""}`});
      reqs.push({icon:"🔗",label:"HDMI cable(s)"});
      if(w.device==="mediaplayer")reqs.push({icon:"🎞️",label:"Media player (USB) — bring content on USB stick"});
      else if(w.device==="laptop")reqs.push({icon:"🔌",label:"Adapter may be needed — bring your laptop to confirm"});
      else if(w.device==="phone")reqs.push({icon:"🔌",label:"Phone / tablet adapter — check availability"});
      else if(w.device==="unknown")reqs.push({icon:"🔌",label:"Adapter TBC — Tech Support will advise"});
    }
    // Screen / TV requirements
    if(dt==="screen"||dt==="both"){
      reqs.push({icon:"📺",label:`${n} × screen${n>1?"s":""} / TV — size to be confirmed with Tech Support`});
      reqs.push({icon:"🔌",label:"Power / extension lead — plug points to be confirmed at venue"});
      reqs.push({icon:"🎬",label:"Video format: MP4 (H.264) recommended for USB playback"});
    }
    // Audio
    if(w.audio==="music"||w.audio==="video")reqs.push({icon:"🔊",label:"Audio output — check availability"});
    else if(w.audio==="performance")reqs.push({icon:"🎤",label:"PA + microphone — check availability"});
    return reqs;
  }

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
  const [eqTermsAgreed, setEqTermsAgreed] = useState(false);
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
  const [eqIsWalkIn, setEqIsWalkIn] = useState(false);
  const [pmDueToday, setPmDueToday] = useState([]);

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
      const li=localStorage.getItem(KEYS.lic);if(li)setLicences(JSON.parse(li));
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

  // Refresh requests when staff switches to dashboard — throttled to once per 10 minutes
  const lastDashFetch = useRef(0);
  useEffect(()=>{
    if(view!=="dashboard")return;
    const now=Date.now();
    if(now-lastDashFetch.current < 10*60*1000)return;
    lastDashFetch.current=now;
    atGet(REQUESTS_TABLE,{maxRecords:500}).then(data=>{
      if(data.records){
        const reqs=data.records.map(airtableToReq).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
        setRequests(reqs);persist(KEYS.req,reqs);
      }
    }).catch(()=>{});
  },[view]);
  useEffect(()=>{const handle=()=>setIsDesktop(window.innerWidth>=900);window.addEventListener("resize",handle);return()=>window.removeEventListener("resize",handle);},[]);
  // Fetch PM tasks due today or overdue for the Today tab
  useEffect(()=>{
    if(view!=="dashboard")return;
    atGet(PM_TABLE,{maxRecords:200}).then(d=>{
      const today=todayDate();
      const due=(d.records||[]).map(r=>({id:r.id,...r.fields})).filter(t=>t.NextDue&&t.NextDue<=today);
      setPmDueToday(due);
    }).catch(()=>{});
  },[view]);
  // Reset AV wizard whenever user selects a different request type
  useEffect(()=>{setAvStep(0);setAvWiz({purpose:"",venue:"",venueOther:"",eventDate:"",eventTime:"",setupDate:"",setupTime:"",duration:"",device:"",displayType:"",screenCount:"1",contentType:"",audio:""});},[selType]);


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
    if(selType==="avsetup"){
      const VENUE_LABELS={"sculpture":"Sculpture studio","painting":"Painting studio","da":"DA studio","print":"Print studio","year1":"1st year studio","year2":"2nd year studio","gallery":"Main gallery","seminar":"Seminar room","outdoor":"Outdoor space","other":avWiz.venueOther||"Other"};
      const DEV_LABELS={"mediaplayer":"Dept media player (USB)","laptop":"Own laptop","phone":"Phone / tablet","unknown":"TBC"};
      const DT_LABELS={"projector":"Projector","screen":"Screen / TV","both":"Projector + Screen"};
      return{purpose:avWiz.purpose,venue:VENUE_LABELS[avWiz.venue]||avWiz.venue,eventDate:avWiz.eventDate,eventTime:avWiz.eventTime,setupDate:avWiz.setupDate,setupTime:avWiz.setupTime,duration:avWiz.duration&&!avWiz.duration.startsWith("Select")?avWiz.duration:"",device:DEV_LABELS[avWiz.device]||avWiz.device,displayType:DT_LABELS[avWiz.displayType]||avWiz.displayType,screenCount:avWiz.screenCount,contentType:avWiz.contentType,audio:avWiz.audio,requirements:deriveAVRequirements(avWiz).map(r=>r.label)};
    }
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
    // AV setup time tracking
    let detailPatch={};
    if(req?.typeId==="avsetup"){
      if(status==="In Progress"){
        detailPatch={startedAt:new Date().toISOString()};
      } else if(status==="Done"&&req.details?.startedAt){
        const mins=Math.round((new Date()-new Date(req.details.startedAt))/60000);
        const h=Math.floor(mins/60),m=mins%60;
        detailPatch={completedAt:new Date().toISOString(),setupDuration:h>0?`${h}h ${m}m`:`${m}m`};
      }
    }
    const updatedDetails=Object.keys(detailPatch).length>0?{...req?.details,...detailPatch}:req?.details;
    const atFields={Status:status,UpdatedAt:todayISO(),...(Object.keys(detailPatch).length>0&&{Details:JSON.stringify(updatedDetails)})};
    if(req?.airtableId){atPatch(REQUESTS_TABLE,req.airtableId,atFields).catch(()=>{});}
    const u=requests.map(r=>r.id===id?{...r,status,updatedAt:todayISO(),details:updatedDetails}:r);setRequests(u);persist(KEYS.req,u);
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
  function addLicence(){if(!licForm.software.trim())return;const lic={id:genId(),...licForm,seats:Number(licForm.seats)||1,createdAt:todayISO()};const u=[lic,...licences];setLicences(u);persist(KEYS.lic,u);setLicForm({software:"",vendor:"",vendorContact:"",vendorPhone:"",poNumber:"",licenceNo:"",importCode:"",partNo:"",seats:"1",effectiveDate:todayDate(),expiryDate:"",notes:""});setShowLicForm(false);}
  function deleteLicence(id){if(!window.confirm("Delete this licence record?"))return;const u=licences.filter(l=>l.id!==id);setLicences(u);persist(KEYS.lic,u);}
  function licStatus(l){if(!l.expiryDate)return{label:"Perpetual",bg:"#0a2218",color:"#20B07F"};const days=Math.floor((new Date(l.expiryDate+"T00:00:00")-new Date())/86400000);if(days<0)return{label:"Expired",bg:"#2a0f14",color:"#f87171"};if(days<=60)return{label:`Expires in ${days}d`,bg:"#2a1f0a",color:"#d4851a"};return{label:`Active · exp ${fmtDate(l.expiryDate)}`,bg:"#0a2218",color:"#20B07F"};}

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
    const req={id:genId(),name:eqStudent.name,studNo:eqStudent.studNo,year:eqStudent.year,studentId:eqStudent.studentId,studentEmail:eqStudent.email||null,type:"Equipment booking",typeId:"equipment",when:"booked",schedDate:`${eqColDate} (${slotLabel})`,notes:eqNotes,details:{items:selItems.map(i=>i.name).join(", "),itemsData:selItems.map(i=>({id:i.id,name:i.name,type:i.type||"",image:i.image||"",replacementCost:i.replacementCost||500,accessories:i.accessories||[]}))},dueDate:due,collectedAt:null,returnedAt:null,returnedItems:[],checkInNotes:"",lostItems:[],lateDays:0,lateFine:0,status:"Pending",staffNote:"",isWalkIn:eqIsWalkIn,createdAt:todayISO(),updatedAt:todayISO()};
    const u=[req,...requests];setRequests(u);persist(KEYS.req,u);
    setEqScreen("success");setEqSubmitting(false);setEqIsWalkIn(false);
    try{
      const result=await atPost(REQUESTS_TABLE,reqToAirtable(req));
      if(result.id){setRequests(prev=>prev.map(r=>r.id===req.id?{...r,airtableId:result.id}:r));}
      else{console.error("FATS: eq request save failed",result);}
    }catch(e){console.error("FATS: eq request save error",e);}
    // Send confirmation email to student (non-blocking)
    sendConfirmationEmail(req);
  }
  function resetEq(){setEqScreen("lookup");setEqStudNo("");setEqStudent(null);setEquipment([]);setSelItems([]);setEqFilter("All");setEqSearch("");setEqColDate("");setEqSlot("");setEqNotes("");setEqTermsAgreed(false);setEqLookupErr("");setEqErr("");}

  const eqTypes=["All",...new Set(equipment.map(e=>e.type).filter(Boolean))];
  const eqFiltered=equipment.filter(e=>(eqFilter==="All"||e.type===eqFilter)&&(!eqSearch||e.name?.toLowerCase().includes(eqSearch.toLowerCase())));
  const sortedRequests=[...requests].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const filtered=filterStatus==="All"?sortedRequests:sortedRequests.filter(r=>r.status===filterStatus);
  const QUEUE_DONE=["Done","Declined","Cancelled","Returned","Uncollected"];
  const queueActive=filtered.filter(r=>!QUEUE_DONE.includes(r.status));
  const queueArchive=filtered.filter(r=>QUEUE_DONE.includes(r.status));
  const counts=STATUSES.reduce((a,s)=>({...a,[s]:requests.filter(r=>r.status===s).length}),{});
  // ── TODAY FILTERS ────────────────────────────────────────────────
  const _today=todayDate();
  const morningToday=requests.filter(r=>r.schedDate?.startsWith(_today)&&r.schedDate.includes("Morning")&&["print","laser"].includes(r.typeId)&&r.status!=="Declined"&&r.status!=="Done");
  const afternoonToday=requests.filter(r=>r.schedDate?.startsWith(_today)&&r.schedDate.includes("Afternoon")&&["print","laser"].includes(r.typeId)&&r.status!=="Declined"&&r.status!=="Done");
  const studioToday=requests.filter(r=>r.typeId==="studio"&&r.schedDate?.startsWith(_today)&&r.status!=="Declined"&&r.status!=="Done");
  const eqCollectionsToday=requests.filter(r=>r.typeId==="equipment"&&r.schedDate?.startsWith(_today)&&r.status!=="Declined"&&r.status!=="Cancelled"&&r.status!=="Returned");
  const eqDueToday=requests.filter(r=>r.typeId==="equipment"&&r.dueDate===_today&&r.status!=="Returned"&&r.status!=="Declined"&&r.status!=="Cancelled");
  const eqOverdue=requests.filter(r=>r.typeId==="equipment"&&r.dueDate&&r.dueDate<_today&&r.status!=="Returned"&&r.status!=="Declined"&&r.status!=="Cancelled");
  const avSetupToday=requests.filter(r=>r.typeId==="avsetup"&&r.details?.setupDate===_today&&r.status!=="Declined"&&r.status!=="Done");

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
    else if(req.typeId==="avsetup"){summary=[d.venue,d.displayType&&d.screenCount?`${d.displayType} × ${d.screenCount}`:d.displayType,d.setupTime?`Setup ${d.setupTime}`:"",d.eventDate?`Event ${fmtDate(d.eventDate)}`:""].filter(v=>v&&v!=="TBC").join(" · ");}
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
              {req.typeId==="avsetup"&&req.status==="In Progress"&&req.details?.startedAt&&(
                <div style={{fontSize:11,color:"#a855f7",marginTop:3}}>🟣 Started {new Date(req.details.startedAt).toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"})}</div>
              )}
              {req.typeId==="avsetup"&&req.details?.setupDuration&&(
                <div style={{fontSize:11,color:"#20B07F",marginTop:3}}>⏱ Setup took {req.details.setupDuration}</div>
              )}
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
  if(screen==="equipment"&&(view==="student"||eqIsWalkIn)) {
    // Lookup screen
    if(eqScreen==="lookup") return(
      <div style={{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
        <TabBar/>
        <Back to={eqIsWalkIn?"walkin":"home"} label={eqIsWalkIn?"← Back to walk-in":"← Back"} extra={eqIsWalkIn?()=>setEqIsWalkIn(false):()=>{}}/>
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
        {(()=>{const today=todayDate();const upcoming=[...PUBLIC_HOLIDAYS_2026.filter(h=>h.date>=today).slice(0,2),...RECESS_RANGES.filter(r=>r.end>=today).slice(0,2)];if(!upcoming.length)return null;return(<details style={{marginBottom:14}}><summary style={{fontSize:12,color:"#6b7280",cursor:"pointer",userSelect:"none"}}>📅 Upcoming closures & public holidays</summary><div style={{marginTop:8,background:"#141720",borderRadius:8,padding:"10px 12px"}}>{PUBLIC_HOLIDAYS_2026.filter(h=>h.date>=today).slice(0,4).map(h=><div key={h.date} style={{fontSize:12,color:"#9ca3af",marginBottom:3}}>🔴 {fmtDate(h.date)} — {h.label}</div>)}{RECESS_RANGES.filter(r=>r.end>=today).map(r=><div key={r.start} style={{fontSize:12,color:"#9ca3af",marginBottom:3}}>🔴 {fmtDate(r.start)} – {fmtDate(r.end)} — {r.label}</div>)}{SWOT_RANGES.filter(r=>r.end>=today).slice(0,2).map(r=><div key={r.start} style={{fontSize:12,color:"#60a5fa",marginBottom:3}}>📚 {fmtDate(r.start)} – {fmtDate(r.end)} — {r.label} (open)</div>)}</div></details>);})()}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Collection date *</label>
          <input type="date" style={ipt} value={eqColDate} min={getEqMinDate()} max={addBusinessDays(todayDate(),eqSettings.maxAdvanceDays)} onChange={e=>{setEqColDate(e.target.value);setEqSlot("");}}/>
          <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Collection days: <strong>Mon, Wed, Fri</strong> only (stockroom hours 11:00–12:30). Book up to {eqSettings.maxAdvanceDays} day{eqSettings.maxAdvanceDays!==1?"s":""} ahead. Bookings close at {eqSettings.collectionDeadlineHour}:00.</div>
          {eqColDate&&!isEqColDay(eqColDate)&&<div style={{fontSize:12,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"8px 10px",marginTop:6}}>⚠️ That date is not a stockroom day. Please pick a Monday, Wednesday or Friday.</div>}
          {eqColDate&&isEqColDay(eqColDate)&&(()=>{const ds=getDateStatus(eqColDate);if(!ds)return null;if(ds.type==="blocked")return<div style={{fontSize:12,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"8px 10px",marginTop:6}}>🚫 {ds.label} — the stockroom is closed on this date. Please choose a different day.</div>;if(ds.type==="swot")return<div style={{fontSize:12,color:"#60a5fa",background:"#0a1e35",borderRadius:8,padding:"8px 10px",marginTop:6}}>📚 {ds.label} — stockroom is open. Good luck with your studies!</div>;return null;})()}
        </div>
        {eqColDate&&isEqColDay(eqColDate)&&getDateStatus(eqColDate)?.type!=="blocked"&&eqDueDate&&(
          <div style={{background:"#0a2218",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#20B07F"}}>
            📅 Equipment due back: <strong>{fmtDate(eqDueDate)}</strong> <span style={{fontSize:12,opacity:0.8}}>({getLoanDays(eqStudent?.year)} business days for {YEAR_LABELS[eqStudent?.year]||`Year ${eqStudent?.year}`})</span>
          </div>
        )}
        {eqColDate&&isEqColDay(eqColDate)&&getDateStatus(eqColDate)?.type!=="blocked"&&(
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
        {/* ── BORROWING TERMS ── */}
        <div style={{background:"#0d1520",border:"0.5px solid #1e3a5f",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:600,color:"#60a5fa",marginBottom:10}}>🛡 Equipment Borrowing Terms</div>
          <div style={{fontSize:12,color:"#9ca3af",lineHeight:1.7,marginBottom:12}}>
            <div style={{marginBottom:6}}>By borrowing this equipment you agree to the following:</div>
            <div style={{marginBottom:4}}>• You are fully responsible for the equipment from collection to return.</div>
            <div style={{marginBottom:4}}>• Items with a university asset number are covered for <strong style={{color:"#e0e3ea"}}>theft only</strong>. You must report to Security and SAPS within 24 hours and provide a case number.</div>
            <div style={{marginBottom:4}}>• Items without an asset number are <strong style={{color:"#e0e3ea"}}>not covered</strong> by university insurance.</div>
            <div style={{marginBottom:4}}>• Loss without a police report: you are <strong style={{color:"#e0e3ea"}}>fully liable</strong> for replacement cost.</div>
            <div style={{marginBottom:4}}>• Accidental damage: you are liable. Do not attempt to repair — report immediately to Tech Support.</div>
            <div style={{marginBottom:4}}>• Report any damage, loss or theft <strong style={{color:"#e0e3ea"}}>immediately</strong> — not at return date.</div>
            <div>• Equipment must be returned clean and in its original packaging/case.</div>
          </div>
          <label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer"}}>
            <input type="checkbox" checked={eqTermsAgreed} onChange={e=>setEqTermsAgreed(e.target.checked)} style={{marginTop:2,accentColor:TEAL,width:16,height:16,flexShrink:0}}/>
            <span style={{fontSize:12,color:"#e0e3ea",lineHeight:1.5}}>I have read and agree to the borrowing terms above. I understand I am responsible for this equipment.</span>
          </label>
        </div>
        <div style={{background:"#2a1f0a",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#d4851a"}}>⚠️ Do not come to collect until Tech Support confirms. Bring your student card.</div>
        <Btn onClick={submitEqRequest} disabled={!eqColDate||!isEqColDay(eqColDate)||getDateStatus(eqColDate)?.type==="blocked"||!eqSlot||!eqTermsAgreed||eqSubmitting} full style={{padding:"13px",fontSize:15}}>{eqSubmitting?"Submitting...":"Submit equipment request"}</Btn>
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
      {type.id==="avsetup"&&(()=>{
        const STEP_LABELS=["Purpose","Venue","Date & time","Content source","Content","Display","Audio","Review"];
        const PURPOSE_OPTS=[["exam","🎓","Assessment or degree show","Mid-year, end-of-year, or degree show"],["gallery","🖼️","Gallery or exhibition install","Looping video, immersive projection"],["class","📚","In-class or lecture presentation","Slides, demo or tutorial"],["performance","🎭","Performance or screening","Film screening, live performance"],["workshop","🔧","Workshop or demonstration","Practical session, live demo"],["other","💬","Other / not sure","Describe in notes at the end"]];
        const VENUE_OPTS=[["sculpture","🗿","Sculpture studio",""],["painting","🎨","Painting studio",""],["da","💻","DA studio","Digital Arts"],["print","🖨️","Print studio",""],["year1","1️⃣","1st year studio","Main Fine Art building"],["year2","2️⃣","2nd year studio","Main Fine Art building"],["gallery","🖼️","Main gallery","Main Fine Art building"],["seminar","📐","Seminar room","Main Fine Art building"],["outdoor","🌳","Outdoor space","Cables and power may be limited"],["other","📍","Other — describe below",""]];
        const DEVICE_OPTS=[["mediaplayer","📺","Department media player","Content played from USB stick via dept player","Bring content on USB"],["laptop","💻","My own laptop","MacBook, Windows, or other — bring your laptop","Adapter may be needed"],["phone","📱","Phone or tablet","iPhone, Android, iPad","Adapter likely needed"],["unknown","🤔","Not sure yet","Tech Support will advise when reviewing your request","To confirm at collection"]];
        const CONTENT_OPTS=[["slides","🖥️","Slideshow or presentation","PowerPoint, Keynote, Google Slides"],["video","🎬","Video or film","MP4, MOV, looping video work"],["images","🖼️","Still images or artwork","JPEG, PNG, digital portfolio"],["website","🌐","Website or live demo","Browser, live stream, interactive content"],["mixed","🔀","Multiple / mixed content","Combination of slides, video, images"]];
        const AUDIO_OPTS=[["none","🔇","No sound needed","Silent presentation","No audio equipment"],["music","🔊","Background music or ambient sound","Low-level audio from the setup","Audio output required"],["video","🎬","Sound for video or film","Audio from video content","Audio output required"],["performance","🎤","PA for a live talk or performance","Speaker needs to be heard by an audience","PA + microphone required"]];
        const stepOk=avWizStepOk(avStep);
        const SelBtn=({val,cur,onSel,icon,label,sub,badge,warn})=>(
          <div onClick={()=>onSel(val)} style={{padding:"11px 14px",borderRadius:10,border:cur===val?"1px solid #3b82f6":"0.5px solid #1e2130",background:cur===val?"#0a1e35":"#141720",marginBottom:7,cursor:"pointer"}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10,minWidth:0}}>
                <span style={{fontSize:18,flexShrink:0,lineHeight:1.2}}>{icon}</span>
                <div>
                  <div style={{fontSize:13,fontWeight:cur===val?600:400,color:cur===val?"#60a5fa":"#c9cdd6"}}>{label}</div>
                  {sub&&<div style={{fontSize:11,color:"#4b5563",marginTop:2}}>{sub}</div>}
                </div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                {cur===val&&<span style={{color:"#3b82f6",fontSize:13}}>✓</span>}
                {badge&&<span style={{fontSize:10,color:warn?"#f87171":cur===val?"#3b82f6":"#374151",background:warn?"#2a0f14":cur===val?"#0d1a2e":"#1a1d28",padding:"2px 7px",borderRadius:4,whiteSpace:"nowrap"}}>{badge}</span>}
              </div>
            </div>
          </div>
        );
        const reqs=deriveAVRequirements(avWiz);
        const PURPOSE_LABELS={"exam":"Assessment / degree show","gallery":"Gallery/exhibition","class":"In-class presentation","performance":"Performance/screening","workshop":"Workshop","other":"Other"};
        const VENUE_LABELS={"sculpture":"Sculpture studio","painting":"Painting studio","da":"DA studio","print":"Print studio","year1":"1st year studio","year2":"2nd year studio","gallery":"Main gallery","seminar":"Seminar room","outdoor":"Outdoor space","other":avWiz.venueOther||"Other"};
        const DEV_LABELS={"mediaplayer":"Dept media player (USB)","laptop":"Own laptop","phone":"Phone / tablet","unknown":"TBC"};
        const DT_LABELS={"projector":"Projector","screen":"Screen / TV","both":"Projector + Screen"};
        return(<>
          {/* Progress bar */}
          <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:18}}>
            {STEP_LABELS.map((l,i)=>(
              <div key={i} style={{flex:i===avStep?2:1,height:4,borderRadius:4,background:i<avStep?"#20B07F":i===avStep?"#3b82f6":"#1e2130",transition:"all 0.25s"}}/>
            ))}
          </div>
          <div style={{fontSize:11,color:"#6b7280",marginBottom:16,letterSpacing:"0.3px"}}>STEP {avStep+1} OF {STEP_LABELS.length} &nbsp;·&nbsp; {STEP_LABELS[avStep].toUpperCase()}</div>

          {/* Step 0: Purpose */}
          {avStep===0&&(<>
            <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",marginBottom:4}}>What is this setup for?</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>This helps us understand your setup and plan the right support.</div>
            {PURPOSE_OPTS.map(([v,icon,label,sub])=><SelBtn key={v} val={v} cur={avWiz.purpose} onSel={p=>setAv("purpose",p)} icon={icon} label={label} sub={sub}/>)}
          </>)}

          {/* Step 1: Venue */}
          {avStep===1&&(<>
            <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",marginBottom:4}}>Where is this happening?</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>The venue affects projector placement, cable runs, and setup time needed.</div>
            {VENUE_OPTS.map(([v,icon,label,sub])=><SelBtn key={v} val={v} cur={avWiz.venue} onSel={p=>setAv("venue",p)} icon={icon} label={label} sub={sub||undefined}/>)}
            {avWiz.venue==="other"&&<input style={{...ipt,marginTop:4,marginBottom:4}} value={avWiz.venueOther} onChange={e=>setAv("venueOther",e.target.value)} placeholder="Describe the venue or space" autoFocus/>}
          </>)}

          {/* Step 2: Date & time */}
          {avStep===2&&(<>
            <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",marginBottom:4}}>Dates for your event</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:RUSH_MODE?8:16}}>We need both dates to book equipment and plan the setup.{!RUSH_MODE&&" Minimum 5 business days before your event date."}</div>
            {RUSH_MODE&&<div style={{background:"#2a1a00",border:"0.5px solid #d4851a",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#d4851a",marginBottom:14}}>⚡ Rush request — date restrictions lifted. Please coordinate setup times directly with Tech Support.</div>}

            {/* Event date block */}
            <div style={{background:"#111827",border:"0.5px solid #1f2937",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontSize:12,color:"#3b82f6",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Event date</div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Date of the event *</label>
                <input type="date" style={ipt} value={avWiz.eventDate} min={RUSH_MODE?todayDate():addBusinessDays(todayDate(),5)} onChange={e=>setAv("eventDate",e.target.value)}/>
                {avWiz.eventDate&&<div style={{fontSize:12,color:"#4b5563",marginTop:4}}>📅 {fmtDate(avWiz.eventDate)}</div>}
              </div>
              <div style={{display:"flex",gap:10}}>
                <div style={{flex:1}}>
                  <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Event start time</label>
                  <input type="time" style={ipt} value={avWiz.eventTime} onChange={e=>setAv("eventTime",e.target.value)}/>
                </div>
                <div style={{flex:1}}>
                  <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Duration</label>
                  <select style={ipt} value={avWiz.duration} onChange={e=>setAv("duration",e.target.value)}>
                    {["Select duration","Under 1 hour","1 hour","2 hours","3 hours","Half day","Full day","Multiple days"].map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Setup / collection date block */}
            <div style={{background:"#111827",border:"0.5px solid #1f2937",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
              <div style={{fontSize:12,color:"#a855f7",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Setup / collection date</div>
              <div style={{marginBottom:10}}>
                <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Date for Tech Support to set up *</label>
                <input type="date" style={ipt} value={avWiz.setupDate} min={RUSH_MODE?todayDate():addBusinessDays(todayDate(),5)} max={avWiz.eventDate||undefined} onChange={e=>setAv("setupDate",e.target.value)}/>
                {avWiz.setupDate&&<div style={{fontSize:12,color:"#4b5563",marginTop:4}}>📅 {fmtDate(avWiz.setupDate)}</div>}
              </div>
              <div>
                <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Preferred setup / arrival time</label>
                <input type="time" style={ipt} value={avWiz.setupTime} onChange={e=>setAv("setupTime",e.target.value)}/>
                <div style={{fontSize:11,color:"#4b5563",marginTop:4}}>This is when Tech Support should arrive to install and test. Equipment is also collected after your event.</div>
              </div>
            </div>

            <div style={{background:"#0a1e35",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#3b82f6"}}>💡 Complex installs (multiple projectors, long cable runs) may need Tech Support on-site 1–2 days before your event.</div>
          </>)}

          {/* Step 3: Device / content source */}
          {avStep===3&&(<>
            <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",marginBottom:4}}>What will play the content?</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>This helps us figure out what cables and adapters the setup will need.</div>
            {DEVICE_OPTS.map(([v,icon,label,sub,badge])=><SelBtn key={v} val={v} cur={avWiz.device} onSel={p=>setAv("device",p)} icon={icon} label={label} sub={sub} badge={badge}/>)}
          </>)}

          {/* Step 4: Content type */}
          {avStep===4&&(<>
            <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",marginBottom:4}}>What will be displayed?</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>Helps us understand resolution needs and check that your file format will work.</div>
            {CONTENT_OPTS.map(([v,icon,label,sub])=><SelBtn key={v} val={v} cur={avWiz.contentType} onSel={p=>setAv("contentType",p)} icon={icon} label={label} sub={sub}/>)}
          </>)}

          {/* Step 5: Display type + count */}
          {avStep===5&&(<>
            <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",marginBottom:4}}>What type of display do you need?</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>This determines what equipment is needed for your setup.</div>
            {[["projector","📽️","Projector","Image projected onto a wall or ceiling surface"],["screen","📺","Screen / TV","Physical display — various sizes available, plays from USB or HDMI"],["both","🔀","Both","A projector and a physical screen / TV"]].map(([v,icon,label,sub])=><SelBtn key={v} val={v} cur={avWiz.displayType} onSel={p=>setAv("displayType",p)} icon={icon} label={label} sub={sub}/>)}

            {avWiz.displayType&&(<>
              <div style={{fontSize:13,color:"#9ca3af",marginTop:16,marginBottom:6,fontWeight:600}}>How many {avWiz.displayType==="projector"?"projectors":avWiz.displayType==="screen"?"screens / TVs":"displays in total"}?</div>
              <input type="number" min="1" max="20" style={{...ipt,fontSize:22,fontWeight:600,textAlign:"center",padding:"14px"}} value={avWiz.screenCount} onChange={e=>setAv("screenCount",e.target.value)} placeholder="e.g. 1"/>

              {/* Projector stock warnings */}
              {(avWiz.displayType==="projector"||avWiz.displayType==="both")&&avWiz.screenCount&&parseInt(avWiz.screenCount)>2&&(
                <div style={{background:"#2a1f0a",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#d4851a",marginTop:10}}>⚠️ More than 2 projectors is a complex setup that needs early planning. Submit the request — Tech Support will contact you to discuss.</div>
              )}
              {(avWiz.displayType==="projector"||avWiz.displayType==="both")&&avWiz.screenCount&&parseInt(avWiz.screenCount)===2&&(
                <div style={{background:"#0a1e35",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#3b82f6",marginTop:10}}>📋 2 projectors uses the full department stock — book well in advance.</div>
              )}
              {(avWiz.displayType==="projector"||avWiz.displayType==="both")&&avWiz.screenCount&&parseInt(avWiz.screenCount)===1&&(
                <div style={{background:"#0a1e35",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#3b82f6",marginTop:10}}>📽️ 1 projector available — Tech Support will confirm.</div>
              )}

              {/* Screen advisory */}
              {(avWiz.displayType==="screen"||avWiz.displayType==="both")&&(
                <div style={{background:"#0a2218",borderRadius:8,padding:"10px 12px",fontSize:12,color:"#4ade80",marginTop:10}}>📺 Screens are available in different sizes. Add a size preference in the notes at the end if you have one — otherwise Tech Support will advise.</div>
              )}
            </>)}
          </>)}

          {/* Step 6: Audio */}
          {avStep===6&&(<>
            <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",marginBottom:4}}>Do you need audio or sound?</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:14}}>Let us know so we can check what audio equipment is available for your setup.</div>
            {AUDIO_OPTS.map(([v,icon,label,sub,badge])=><SelBtn key={v} val={v} cur={avWiz.audio} onSel={p=>setAv("audio",p)} icon={icon} label={label} sub={sub} badge={badge}/>)}
          </>)}

          {/* Step 7: Summary */}
          {avStep===7&&(<>
            <div style={{fontSize:15,fontWeight:600,color:"#e0e3ea",marginBottom:4}}>Your setup summary</div>
            <div style={{fontSize:12,color:"#6b7280",marginBottom:16}}>Based on your answers. Tech Support will review this, confirm what's available, and contact you to plan setup days.</div>
            <div style={{background:"#0a1e35",border:"0.5px solid #1e3a5f",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:11,color:"#3b82f6",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Your event</div>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"5px 14px"}}>
                {[["Purpose",PURPOSE_LABELS[avWiz.purpose]||avWiz.purpose],["Venue",VENUE_LABELS[avWiz.venue]],["Event date",avWiz.eventDate?fmtDate(avWiz.eventDate):"Not set"],["Event time",avWiz.eventTime||"Not specified"],["Setup date",avWiz.setupDate?fmtDate(avWiz.setupDate):"Not set"],["Setup time",avWiz.setupTime||"Not specified"],["Duration",avWiz.duration&&!avWiz.duration.startsWith("Select")?avWiz.duration:"Not specified"],["Display",DT_LABELS[avWiz.displayType]||"Not set"],["Count",avWiz.screenCount||"Not set"],["Device",DEV_LABELS[avWiz.device]||avWiz.device]].filter(([,v])=>v&&v!=="Not set"&&v!=="Not specified").map(([k,v])=>(
                  <><span key={k+"k"} style={{fontSize:12,color:"#4b5563",whiteSpace:"nowrap"}}>{k}</span><span key={k+"v"} style={{fontSize:12,color:"#c9cdd6"}}>{v}</span></>
                ))}
              </div>
            </div>
            <div style={{background:"#0a2218",border:"0.5px solid #14532d",borderRadius:10,padding:"12px 14px",marginBottom:16}}>
              <div style={{fontSize:11,color:"#20B07F",fontWeight:600,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>What this setup will likely need</div>
              {reqs.map((r,i)=>(
                <div key={i} style={{display:"flex",alignItems:"flex-start",gap:8,marginBottom:6}}>
                  <span style={{fontSize:14,lineHeight:1.3}}>{r.icon}</span>
                  <span style={{fontSize:13,color:r.warn?"#d4851a":"#c9cdd6",lineHeight:1.4}}>{r.label}</span>
                </div>
              ))}
              <div style={{fontSize:11,color:"#4b5563",marginTop:8,borderTop:"0.5px solid #1e3a1e",paddingTop:8}}>Availability and exact setup plan confirmed by Tech Support after review. Setup may require 1–2 days before your event.</div>
            </div>
          </>)}

          {/* Wizard navigation */}
          <div style={{display:"flex",gap:8,marginBottom:avStep===7?16:24}}>
            {avStep>0&&<button onClick={()=>setAvStep(s=>s-1)} style={{flex:1,padding:"11px",borderRadius:8,border:"0.5px solid #1e2130",background:"#1a1d28",color:"#9ca3af",fontSize:13,cursor:"pointer",fontFamily:"inherit"}}>← Back</button>}
            {avStep<7&&<Btn onClick={()=>setAvStep(s=>s+1)} disabled={!stepOk} style={{flex:avStep===0?undefined:1,padding:"11px",fontSize:13}} full={avStep===0}>{avStep===6?"Review summary →":"Next →"}</Btn>}
          </div>
        </>);
      })()}
      {!type.bookable&&!["gallery","studio","3d","avsetup"].includes(type.id)&&!(selType==="software"&&form.softwareType!=="mac")&&<div style={{marginBottom:14}}>
        <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>{selType==="software"?"When should we schedule the install?":"When do you need it?"}</label>
        <div style={{display:"flex",gap:8}}>{(selType==="software"?[["later","Schedule"]]: [["walkin","Right now"],["later","Schedule"]]).map(([v,l])=><button key={v} onClick={()=>setF("when",v)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.when===v?BLUE:"#1a1d28",color:form.when===v?"#fff":"#e0e3ea",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>)}</div>
        {form.when==="later"&&<>
          <input type="datetime-local" style={{...ipt,marginTop:8}} value={form.schedDate} onChange={e=>setF("schedDate",e.target.value)}/>
          {selType==="software"&&form.schedDate&&(()=>{const d=new Date(form.schedDate);return EQ_COL_DAYS.includes(d.getDay())&&d.getHours()>=9&&d.getHours()<13;})()&&(
            <div style={{fontSize:12,color:"#d4851a",background:"#2a1f0a",borderRadius:8,padding:"6px 10px",marginTop:6}}>⚠ Stockroom collections run Mon/Wed/Fri 11:00–12:30. If possible, choose a different time to avoid overlap.</div>
          )}
        </>}
      </div>}
      {(type.id!=="avsetup"||avStep===7)&&<div style={{marginBottom:20}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>{type.id==="avsetup"?"Any extra notes for Tech Support? (optional)":"Additional notes (optional)"}</label><textarea style={{...ipt,resize:"vertical"}} rows={3} value={form.notes} onChange={e=>setF("notes",e.target.value)} placeholder={type.id==="avsetup"?"e.g. I need to set up the night before, or there's a very long cable run needed...":"Any extra details Tech Support should know..."}/></div>}
      {(type.id!=="avsetup"||avStep===7)&&<Btn onClick={async()=>{if(submitting)return;setSubmitting(true);const r=await submitRequest();setSubmitting(false);if(r){setLastReq(r);setScreen("success");}}} disabled={submitting||(visitorType==="student"?!verifiedStudent:!extForm.name.trim())||(selType==="print"&&!form.printPresent)||(selType==="laser"&&!form.sessionDuration)||(selType==="3d"&&!form.dropOffDate)||(selType==="studio"&&(!form.studioDate||!isEqColDay(form.studioDate)||!form.studioSlot))||(selType==="avsetup"&&avStep<7)} full style={{padding:"13px",fontSize:15}}>{submitting?"Submitting…":"Submit a request"}</Btn>}
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
      <Btn outline color="#888" onClick={()=>{setScreen("home");setSelType(null);setPrepOk(false);setSelDate(null);setSelSlot(null);setLastReq(null);setVerifiedStudent(null);setVerifyErr("");setForm(f=>({...f,studNo:"",name:""}));}} style={{color:"#9ca3af",border:"0.5px solid #1e2130",background:"transparent",width:"100%",padding:"11px"}}>Submit another request</Btn>
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
      <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>What do they need?</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{REQUEST_TYPES.map(t=><button key={t.id} onClick={()=>{if(t.id==="equipment"){setEqIsWalkIn(true);setEqScreen("lookup");setEqStudNo("");setEqStudent(null);setSelItems([]);setEqColDate("");setEqSlot("");setEqNotes("");setScreen("equipment");}else{setSelType(t.id);}}} style={{padding:"8px 12px",borderRadius:8,border:"none",background:selType===t.id?TEAL:"#1a1d28",color:selType===t.id?"#fff":"#e0e3ea",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{t.icon} {t.label}</button>)}</div></div>
      <div style={{marginBottom:20}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Quick notes</label><textarea style={{...ipt,resize:"vertical"}} rows={3} value={form.notes} onChange={e=>setF("notes",e.target.value)} placeholder="e.g. Software on Mac 4 — told to come back Thursday"/></div>
      <Btn onClick={()=>{if(!form.name.trim()||!selType)return;submitRequest(true);setScreen("home");setSelType(null);setForm(f=>({...f,name:"",studNo:"",year:"",notes:""}));}} disabled={!form.name.trim()||!selType} full style={{padding:"13px",fontSize:15}}>Log walk-in</Btn>
    </div>
  );

  // ── DASHBOARD ────────────────────────────────────────────────────
  if(view==="dashboard"){const desktopTwoCol=false;return(
    <div style={isDesktop?{display:"flex",minHeight:"100vh",background:"#0F1117",alignItems:"flex-start",margin:"-24px -16px -48px",width:"calc(100% + 32px)"}:{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      {isDesktop&&(
        <div style={{width:200,background:"#0a0d14",borderRight:"0.5px solid #1e2130",padding:"14px 10px",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto",display:"flex",flexDirection:"column"}}>
          <div style={{marginBottom:18}}><div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>FATS</div><div style={{fontSize:10,color:"#4b5563",marginTop:2}}>Fine Art Department</div></div>
          <div style={{fontSize:10,color:"#4b5563",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,marginBottom:6,paddingLeft:6}}>Views</div>
          {[["today",`📅 Today · ${new Date().getDate()}`],["queue","📋 All requests"]].map(([v,l])=>(
            <div key={v} onClick={()=>setDashTab(v)} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:desktopTwoCol?"#e0e3ea":"#6b7280",background:desktopTwoCol?"#141720":"transparent",cursor:"pointer",marginBottom:2}}>{l}</div>
          ))}
          <div style={{fontSize:10,color:"#4b5563",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,marginBottom:6,paddingLeft:6,marginTop:14}}>Manage</div>
          {[["hs","🦺 H&S / Maintenance"],["pm","🔧 PM Schedule"],["schedule","🗓 Schedule"],["blocks","🚫 Blocks"],["charges","💳 Charges"],["lic","🔑 Licences"],["insurance","🛡 Insurance"],["budget","📊 Budget / ACE"]].map(([v,l])=>(
            <div key={v} onClick={()=>setDashTab(v)} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:dashTab===v?"#e0e3ea":"#6b7280",background:dashTab===v?"#141720":"transparent",cursor:"pointer",marginBottom:2}}>{l}</div>
          ))}
          <div style={{marginTop:"auto",paddingTop:16,borderTop:"0.5px solid #1e2130"}}>
            <a href="/laser-staff-guide.html" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:"#6b7280",textDecoration:"none",marginBottom:4}}>⚡ Laser Operator Guide</a>
            <div onClick={()=>{sessionStorage.removeItem("fats_staff_unlocked");setStaffUnlocked(false);setView("student");}} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:"#6b7280",cursor:"pointer"}}>🔒 Lock</div>
          </div>
        </div>
      )}
      {!isDesktop&&<TabBar/>}
      <div style={isDesktop?{flex:1,overflowX:"hidden",padding:"1.5rem 1.25rem"}:{}}>

      {/* ── Compact staff control bar ── */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,background:leaveMode.active?"#2a1f0a":"#141720",border:`0.5px solid ${leaveMode.active?"#5a3a0a":"#1e2130"}`,borderRadius:10,padding:"8px 12px"}}>
        <span style={{fontSize:13,fontWeight:500,color:leaveMode.active?"#d4851a":"#20B07F",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leaveMode.active?"🏖️ Leave mode ON":"🟢 Active"}</span>
        <Btn small onClick={toggleLeave} color={leaveMode.active?TEAL:AMBER} style={{flexShrink:0}}>{leaveMode.active?"Go active":"Leave"}</Btn>
        <button onClick={()=>{sessionStorage.removeItem("fats_staff_unlocked");setStaffUnlocked(false);setView("student");}} style={{padding:"5px 10px",borderRadius:7,background:"#0f1117",border:"0.5px solid #1e2130",fontSize:12,color:"#6b7280",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>🔒</button>
        <button onClick={()=>{setChangingPin(p=>!p);setNewPin("");}} style={{padding:"5px 10px",borderRadius:7,background:changingPin?"#1a1d28":"#0f1117",border:`0.5px solid ${changingPin?"#3b82f6":"#1e2130"}`,fontSize:12,color:changingPin?"#3b82f6":"#6b7280",cursor:"pointer",fontFamily:"inherit",flexShrink:0}} title="Change PIN">⚙</button>
      </div>
      {leaveMode.active&&(<div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
        <div style={{marginBottom:8}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Return date</label><input type="date" style={ipt} value={leaveMode.returnDate} onChange={e=>setLeaveMode(l=>({...l,returnDate:e.target.value}))}/></div>
        <div style={{marginBottom:8}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Message for students</label><input style={ipt} value={leaveMode.message} onChange={e=>setLeaveMode(l=>({...l,message:e.target.value}))} placeholder="e.g. Back after swot week"/></div>
        <Btn small onClick={saveLeave}>Save</Btn>
      </div>)}
      {changingPin&&(
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>Current PIN: <strong style={{color:"#e0e3ea"}}>{localStorage.getItem(KEYS.staffPin)||DEFAULT_PIN}</strong></div>
          <div style={{display:"flex",gap:8}}>
            <input type="password" inputMode="numeric" maxLength={6} style={{...ipt,flex:1,letterSpacing:"0.2em"}} value={newPin} onChange={e=>setNewPin(e.target.value)} placeholder="New PIN"/>
            <Btn small onClick={()=>{if(newPin.length>=4){localStorage.setItem(KEYS.staffPin,newPin);setChangingPin(false);setNewPin("");}}} disabled={newPin.length<4}>Save</Btn>
          </div>
        </div>
      )}

      {/* Dash tabs */}
      {!isDesktop&&<div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}}>
        {[["today",`Today · ${new Date().getDate()}`],["queue","Queue"],["hs","H&S"],["pm","🔧 PM"],["schedule","Schedule"],["blocks","Blocks"],["charges","Charges"],["lic","🔑 Lic"],["insurance","🛡 Insure"],["budget","📊 Budget"]].map(([v,l])=>(
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
                else if(sk==="avsetup"){al=r.status==="In Progress"?"Mark done":"Start setup";as_=r.status==="In Progress"?"Done":"In Progress";}
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
          <Sec icon="📽️" title="AV setups today" items={avSetupToday} sk="avsetup"/>
          {pmDueToday.length>0&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:500,color:"#6b7280",marginBottom:8,display:"flex",alignItems:"center",gap:6,borderBottom:"1px solid #1e2130",paddingBottom:6}}>
                🔧 PM tasks due <span style={{fontSize:11,fontWeight:400}}>· {pmDueToday.length}</span>
              </div>
              {pmDueToday.map(t=>{
                const days=Math.floor((new Date()-new Date(t.NextDue+"T00:00:00"))/86400000);
                const overdue=days>0;
                return(
                  <div key={t.id} style={{display:"flex",alignItems:"stretch",background:"#141720",borderRadius:10,marginBottom:8,overflow:"hidden",border:`0.5px solid ${overdue?"#7f1d1d":"#1e2130"}`}}>
                    <div style={{width:4,flexShrink:0,background:overdue?"#f87171":"#d4851a"}}/>
                    <div style={{flex:1,padding:"10px 12px",minWidth:0}}>
                      <div style={{fontSize:11,color:overdue?"#f87171":"#d4851a",fontWeight:600,marginBottom:2}}>{overdue?`${days}d overdue`:"Due today"}</div>
                      <div style={{fontSize:14,fontWeight:500,color:"#e0e3ea"}}>{t.TaskName}</div>
                      <div style={{fontSize:12,color:"#6b7280",marginTop:1}}>{t.Machine}{t.Interval?` · ${t.Interval}`:""}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",padding:"0 12px"}}>
                      <button onClick={()=>setDashTab("pm")} style={{fontSize:11,padding:"4px 10px",borderRadius:8,border:"0.5px solid #1e2130",background:"#1a1d28",color:"#9ca3af",cursor:"pointer",fontFamily:"inherit",fontWeight:500,whiteSpace:"nowrap"}}>Log →</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
        {loaded&&queueActive.length===0&&queueArchive.length===0&&<div style={{textAlign:"center",padding:"3rem",color:"#6b7280",fontSize:14}}>No requests yet</div>}
        {queueActive.map(req=>{
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
              {/* ── AV SETUP: structured detail card ── */}
              {req.typeId==="avsetup"&&req.details&&(
                <div style={{background:"#1a1d28",borderRadius:8,padding:"10px 12px",marginBottom:6,fontSize:12}}>
                  <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:"5px 14px",marginBottom:req.details.requirements?.length>0?10:0}}>
                    {req.details.purpose&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Purpose</span><span style={{color:"#c9cdd6"}}>🎯 {req.details.purpose}</span></>}
                    {req.details.venue&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Venue</span><span style={{color:"#c9cdd6"}}>📍 {req.details.venue}</span></>}
                    {req.details.eventDate&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Event</span><span style={{color:"#c9cdd6"}}>📅 {fmtDate(req.details.eventDate)}{req.details.eventTime?` · ${req.details.eventTime}`:""}</span></>}
                    {req.details.setupDate&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Setup</span><span style={{color:"#c9cdd6"}}>🔧 {fmtDate(req.details.setupDate)}{req.details.setupTime?` · ${req.details.setupTime}`:""}</span></>}
                    {req.details.duration&&!String(req.details.duration).startsWith("Select")&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Duration</span><span style={{color:"#c9cdd6"}}>⏱ {req.details.duration}</span></>}
                    {req.details.device&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Device</span><span style={{color:"#c9cdd6"}}>💻 {req.details.device}</span></>}
                    {req.details.displayType&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Display</span><span style={{color:"#c9cdd6"}}>{req.details.displayType==="Screen / TV"?"📺":"📽️"} {req.details.displayType}{req.details.screenCount?` × ${req.details.screenCount}`:""}</span></>}
                    {req.details.contentType&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Content</span><span style={{color:"#c9cdd6"}}>🎬 {req.details.contentType}</span></>}
                    {req.details.audio&&req.details.audio!=="none"&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Audio</span><span style={{color:"#c9cdd6"}}>🔊 {req.details.audio}</span></>}
                    {req.details.setupDuration&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Setup took</span><span style={{color:"#20B07F",fontWeight:600}}>⏱ {req.details.setupDuration}</span></>}
                    {req.details.startedAt&&!req.details.setupDuration&&<><span style={{color:"#4b5563",whiteSpace:"nowrap"}}>Started</span><span style={{color:"#a855f7"}}>🟣 {new Date(req.details.startedAt).toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"})}</span></>}
                  </div>
                  {req.details.requirements?.length>0&&(
                    <div style={{borderTop:"0.5px solid #1e2130",paddingTop:8}}>
                      {req.details.requirements.map((r,i)=>(
                        <div key={i} style={{color:"#20B07F",marginBottom:4,lineHeight:1.4}}>✓ {r}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {req.typeId!=="equipment"&&req.typeId!=="avsetup"&&Object.values(req.details||{}).some(v=>v&&!String(v).startsWith("Select"))&&(
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
                {(req.typeId==="laser"?LASER_STATUSES:req.typeId==="equipment"?EQ_STATUSES:req.typeId==="avsetup"?AV_STATUSES:STATUSES).filter(s=>s!==req.status).map(s=>(
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
        {/* ── ARCHIVE ── */}
        {queueArchive.length>0&&filterStatus==="All"&&(
          <div style={{marginTop:12}}>
            <div style={{fontSize:11,color:"#374151",fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",padding:"0 2px",marginBottom:8}}>Archive — {queueArchive.length} completed / declined</div>
            {REQUEST_TYPES.map(type=>{
              const group=queueArchive.filter(r=>r.typeId===type.id);
              if(!group.length)return null;
              const typeColor=TYPE_COLOR[type.id]||"#6B7280";
              return(
                <details key={type.id} style={{marginBottom:6}}>
                  <summary style={{fontSize:13,color:"#6b7280",cursor:"pointer",padding:"9px 14px",background:"#0f1117",borderRadius:8,border:"0.5px solid #1e2130",borderLeft:`3px solid ${typeColor}55`,listStyle:"none",display:"flex",alignItems:"center",gap:8,userSelect:"none"}}>
                    <span style={{fontSize:10,color:"#374151"}}>▶</span>
                    <span>{type.icon}</span>
                    <span style={{flex:1}}>{type.label}</span>
                    <span style={{fontSize:11,color:"#4b5563",background:"#1a1d28",borderRadius:6,padding:"2px 8px",border:"0.5px solid #1e2130"}}>{group.length}</span>
                  </summary>
                  <div style={{marginTop:6,paddingLeft:4,opacity:0.75}}>
                    {group.map(req=>(
                      <div key={req.id} style={{background:"#0f1117",border:"0.5px solid #1e2130",borderRadius:10,padding:"9px 14px",marginBottom:5,borderLeft:`3px solid ${typeColor}44`}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                          <div style={{minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:500,color:"#9ca3af"}}>{req.name}{req.studNo&&<span style={{fontWeight:400,fontSize:12,color:"#374151",marginLeft:6}}>#{req.studNo}</span>}</div>
                            {archiveSummary(req)&&<div style={{fontSize:11,color:"#4b5563",marginTop:2}}>{archiveSummary(req)}</div>}
                            {req.schedDate&&<div style={{fontSize:11,color:"#374151",marginTop:2}}>📅 {req.schedDate}</div>}
                            {req.typeId==="avsetup"&&req.details?.setupDuration&&(
                              <div style={{fontSize:11,color:"#20B07F",marginTop:2}}>⏱ Setup took {req.details.setupDuration}</div>
                            )}
                          </div>
                          {pill(req.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </>)}

      </div></div>
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

      {/* ── LICENCES ── */}
      {dashTab==="lic"&&(<>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
          <div style={{fontSize:15,fontWeight:500}}>Software licences</div>
          <button onClick={()=>setShowLicForm(f=>!f)} style={{fontSize:12,padding:"6px 14px",borderRadius:8,border:"none",background:showLicForm?"#1a1d28":TEAL,color:showLicForm?"#9ca3af":"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>{showLicForm?"Cancel":"+ Add licence"}</button>
        </div>
        <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Purchase orders, licence keys, seats and expiry dates</div>

        {/* Stat chips */}
        <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
          {[["Total",licences.length,"#1a1d28","#9ca3af"],
            ["Active",licences.filter(l=>{if(!l.expiryDate)return true;return Math.floor((new Date(l.expiryDate+"T00:00:00")-new Date())/86400000)>60;}).length,"#0a2218","#20B07F"],
            ["Expiring soon",licences.filter(l=>{if(!l.expiryDate)return false;const d=Math.floor((new Date(l.expiryDate+"T00:00:00")-new Date())/86400000);return d>=0&&d<=60;}).length,"#2a1f0a","#d4851a"],
            ["Expired",licences.filter(l=>l.expiryDate&&Math.floor((new Date(l.expiryDate+"T00:00:00")-new Date())/86400000)<0).length,"#2a0f14","#f87171"],
          ].map(([label,n,bg,col])=>(
            <div key={label} style={{flex:1,minWidth:80,background:bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:600,color:col}}>{n}</div>
              <div style={{fontSize:11,color:col}}>{label}</div>
            </div>
          ))}
        </div>

        {/* Add form */}
        {showLicForm&&(
          <div style={{background:"#141720",border:`0.5px solid ${TEAL}`,borderRadius:14,padding:"16px 18px",marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:500,marginBottom:14,color:TEAL}}>New licence record</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Software name *</label><input style={ipt} value={licForm.software} onChange={e=>setLicForm(f=>({...f,software:e.target.value}))} placeholder="e.g. CorelDRAW Graphics Suite Education"/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Vendor / Supplier</label><input style={ipt} value={licForm.vendor} onChange={e=>setLicForm(f=>({...f,vendor:e.target.value}))} placeholder="e.g. Learning Curve"/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>PO Number</label><input style={ipt} value={licForm.poNumber} onChange={e=>setLicForm(f=>({...f,poNumber:e.target.value}))} placeholder="e.g. RP0000122595"/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Licence / Certificate No.</label><input style={ipt} value={licForm.licenceNo} onChange={e=>setLicForm(f=>({...f,licenceNo:e.target.value}))} placeholder="e.g. 1158587"/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Import / Activation Code</label><input style={ipt} value={licForm.importCode} onChange={e=>setLicForm(f=>({...f,importCode:e.target.value}))} placeholder="e.g. 10690273"/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Part Number</label><input style={ipt} value={licForm.partNo} onChange={e=>setLicForm(f=>({...f,partNo:e.target.value}))} placeholder="e.g. LCCDGSSUBA11"/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>No. of seats / copies</label><input type="number" min="1" style={ipt} value={licForm.seats} onChange={e=>setLicForm(f=>({...f,seats:e.target.value}))}/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Effective date</label><input type="date" style={ipt} value={licForm.effectiveDate} onChange={e=>setLicForm(f=>({...f,effectiveDate:e.target.value}))}/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Expiry date <span style={{color:"#4b5563"}}>(leave blank if perpetual)</span></label><input type="date" style={ipt} value={licForm.expiryDate} onChange={e=>setLicForm(f=>({...f,expiryDate:e.target.value}))}/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Vendor contact</label><input style={ipt} value={licForm.vendorContact} onChange={e=>setLicForm(f=>({...f,vendorContact:e.target.value}))} placeholder="Contact person name"/></div>
              <div><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Vendor phone</label><input style={ipt} value={licForm.vendorPhone} onChange={e=>setLicForm(f=>({...f,vendorPhone:e.target.value}))} placeholder="+27 ..."/></div>
              <div style={{gridColumn:"1/-1"}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Notes</label><textarea style={{...ipt,resize:"vertical"}} rows={2} value={licForm.notes} onChange={e=>setLicForm(f=>({...f,notes:e.target.value}))} placeholder="Activation steps, renewal notes, URLs..."/></div>
            </div>
            <Btn onClick={addLicence} disabled={!licForm.software.trim()} full>Save licence record</Btn>
          </div>
        )}

        {/* Licence cards */}
        {licences.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>No licences recorded yet</div>}
        {licences.map(lic=>{
          const st=licStatus(lic);
          const expanded=expandLicId===lic.id;
          return(
            <div key={lic.id} style={{background:"#141720",border:`0.5px solid ${st.label.startsWith("Expir")&&!st.label.startsWith("Expiring in")?"#c05050":st.label==="Expired"?"#c05050":"#1e2130"}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                <div style={{flex:1,minWidth:0,paddingRight:8}}>
                  <div style={{fontWeight:600,fontSize:15,marginBottom:2}}>{lic.software}</div>
                  <div style={{fontSize:12,color:"#6b7280"}}>{lic.vendor}{lic.poNumber&&<span style={{marginLeft:8,color:"#4b5563"}}>PO: {lic.poNumber}</span>}</div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:st.bg,color:st.color,fontWeight:500,whiteSpace:"nowrap"}}>{st.label}</span>
                </div>
              </div>
              <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:8}}>
                <div style={{fontSize:12}}><span style={{color:"#6b7280"}}>Seats: </span><span style={{fontWeight:600,color:"#e0e3ea"}}>{lic.seats}</span></div>
                {lic.effectiveDate&&<div style={{fontSize:12}}><span style={{color:"#6b7280"}}>Effective: </span><span style={{color:"#e0e3ea"}}>{fmtDate(lic.effectiveDate)}</span></div>}
                {lic.expiryDate&&<div style={{fontSize:12}}><span style={{color:"#6b7280"}}>Expires: </span><span style={{color:st.color,fontWeight:500}}>{fmtDate(lic.expiryDate)}</span></div>}
              </div>
              <button onClick={()=>setExpandLicId(expanded?null:lic.id)} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer",padding:0,marginBottom:expanded?12:0}}>{expanded?"▲ Hide details":"▼ Show details"}</button>
              {expanded&&(
                <div style={{borderTop:"0.5px solid #1e2130",paddingTop:12,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  {lic.licenceNo&&<div style={{fontSize:12}}><div style={{color:"#6b7280",marginBottom:2}}>Licence No.</div><div style={{fontFamily:"monospace",fontSize:13,color:"#e0e3ea",letterSpacing:"0.05em"}}>{lic.licenceNo}</div></div>}
                  {lic.importCode&&<div style={{fontSize:12}}><div style={{color:"#6b7280",marginBottom:2}}>Import / Activation Code</div><div style={{fontFamily:"monospace",fontSize:13,color:"#e0e3ea",letterSpacing:"0.05em"}}>{lic.importCode}</div></div>}
                  {lic.partNo&&<div style={{fontSize:12}}><div style={{color:"#6b7280",marginBottom:2}}>Part Number</div><div style={{color:"#e0e3ea"}}>{lic.partNo}</div></div>}
                  {lic.vendorContact&&<div style={{fontSize:12}}><div style={{color:"#6b7280",marginBottom:2}}>Vendor contact</div><div style={{color:"#e0e3ea"}}>{lic.vendorContact}{lic.vendorPhone&&<span style={{color:"#6b7280"}}> · {lic.vendorPhone}</span>}</div></div>}
                  {lic.notes&&<div style={{gridColumn:"1/-1",fontSize:12}}><div style={{color:"#6b7280",marginBottom:2}}>Notes</div><div style={{color:"#9ca3af",lineHeight:1.5}}>{lic.notes}</div></div>}
                  <div style={{gridColumn:"1/-1",marginTop:4}}>
                    <button onClick={()=>deleteLicence(lic.id)} style={{fontSize:11,color:"#f87171",background:"none",border:"0.5px solid #f87171",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:"inherit"}}>Delete record</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </>)}

      {/* ── H&S / MAINTENANCE ── */}
      <div style={{display:dashTab==="hs"?"block":"none"}}><HsPanel/></div>

      {/* ── PM SCHEDULE ── */}
      <div style={{display:dashTab==="pm"?"block":"none"}}><PmPanel/></div>

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

      {/* ── INSURANCE ── */}
      {dashTab==="insurance"&&<InsurancePanel equipment={equipment} requests={requests}/>}

      {/* ── BUDGET / ACE ── */}
      {dashTab==="budget"&&<BudgetPanel/>}

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