// Shared constants, helpers and UI primitives for the FATS portal.
// Extracted from App.jsx — see README for the module map.

const TEAL = "#20B07F";
const BLUE = "#3b82f6";
const AMBER = "#d4851a";
const RED = "#e05a5a";
const TYPE_COLOR = {equipment:"#20B07F",print:"#3b82f6",laser:"#E65C00","3d":"#8b5cf6",studio:"#f59e0b",gallery:"#ef4444",software:"#06b6d4",avsetup:"#a855f7",query:"#6B7280"};

// ── CONSTANTS ────────────────────────────────────────────────────
const BASE_ID = "appUqkCfnsOo2Jf7z";
const EQ_TABLE = "tblc2MXweiXikz3wo";
const CHECKOUT_TABLE = "tbl1DvH6ostZs7Jog";
const FINES_TABLE = "tbliP9x6KL7EUABWc";
const MEMBERS_TABLE = "tbloPfyyjQY79YxQd";
const REQUESTS_TABLE = "tblAQE1leKVCRH51d";
const MAINT_TABLE = "tbldZisWbs1WQIr09";
const PM_TABLE = "tblHyr7MxWVDIzFtC";
const SUPPLIERS_TABLE = "tblhJKtWH4fR04RhQ";
// Shared app settings — one record per key so leave mode, blocks, schedules,
// equipment settings and the staff PIN apply on every device, not just the
// browser where they were changed.
const SETTINGS_TABLE = "tblfEH66wD8KPJMl9";
const SETTINGS_RECS = {leave:"recVxEasEt1aNrS3N",blocks:"recKwguxmAdTgtjQH",schedule:"recnV0VmlYGKrH5wx",eqSettings:"recKAlQewn1k7eDcs",pin:"recl1lbt7hHWY8vHr"};

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
  // Laser is a whole-day, single-booking resource (see LAB_EXCLUSIVE_TYPES in
  // App.jsx) — morningSlots/afternoonSlots no longer apply to it.
  laser:{days:[1,2,3,4,5],minAdvanceDays:1},
  "3d":{days:[1,3],morningSlots:2,afternoonSlots:2,minAdvanceDays:5},
  print:{days:[1,2,3,4,5],morningSlots:2,afternoonSlots:2,minAdvanceDays:2},
  studio:{days:[1,2,3,4,5],morningSlots:1,afternoonSlots:2,minAdvanceDays:0},
};

const STATUSES = ["Pending","In Progress","Done","Declined","Cancelled"];
const AV_STATUSES = ["Pending","Confirmed","In Progress","Done","Declined","Cancelled"];
const LASER_STATUSES = ["Pending","Confirmed","Material test required","Ready to cut","In Progress","Done","Declined","Cancelled"];
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

// Licence seed moved server-side (api/_licence-data.js, served via /api/licences)
// so vendor contacts / PO / licence numbers aren't in the public client bundle.
const DEFAULT_EQ_SETTINGS={yr12Days:3,yr3Days:2,yr34Days:5,dailyRate:50,maxAdvanceDays:1,collectionDeadlineHour:16,returnByHour:10,slotCap:2,yr2Cap:2,yr3Cap:3,yr4Cap:4,mastersCap:5};

// Equipment collection: Mon/Wed/Fri only, two 30-min windows 12:00–13:00
// Returns must be in by returnByHour (default 10:00) to allow same-day handover
const EQ_COL_DAYS=[1,3,5]; // Mon=1, Wed=3, Fri=5
const EQ_COL_SLOTS=[
  {id:"s1",label:"12:00–12:30"},
  {id:"s2",label:"12:30–13:00"},
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
function countBizDaysLate(dueDateStr,returnDateStr){let due=new Date(dueDateStr+"T00:00:00");let ret=new Date(returnDateStr+"T00:00:00");if(ret<=due)return 0;let count=0;let d=new Date(due);while(d<ret){d.setDate(d.getDate()+1);if(d.getDay()!==0&&d.getDay()!==6)count++;}return count;}

// Keyword-based replacement cost for individual accessories
function accessoryCost(text){const t=(text||"").toLowerCase();if(t.includes("lens cap"))return 80;if(t.includes("lens"))return 800;if(t.includes("battery"))return 350;if(t.includes("charger"))return 200;if(t.includes("micro sd")||t.includes("microsd"))return 150;if(t.includes("sd card")||t.includes("memory card"))return 150;if(t.includes("filter"))return 400;if(t.includes("cable"))return 100;if(t.includes("windscreen"))return 120;if(t.includes("calibration"))return 300;if(t.includes("pouch")||t.includes("case")||t.includes("bag"))return 80;if(t.includes("adapter"))return 80;if(t.includes("glasses")||t.includes("safety"))return 80;return 150;}

// ── UNIVERSITY CALENDAR ──────────────────────────────────────────
// Source: Rhodes University Diary 2026 (official). Update each year.
// CAL_DATA_YEAR drives a staff dashboard warning once this data goes stale.
const CAL_DATA_YEAR = 2026;
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

export {
  TEAL, BLUE, AMBER, RED, TYPE_COLOR, BASE_ID, EQ_TABLE, CHECKOUT_TABLE, FINES_TABLE, MEMBERS_TABLE, REQUESTS_TABLE, MAINT_TABLE, PM_TABLE, SUPPLIERS_TABLE, SETTINGS_TABLE, SETTINGS_RECS, YEAR_LABELS, REQUEST_TYPES, BOOKABLE, LAB_IDS, DEFAULT_SCHEDULE, STATUSES, AV_STATUSES, LASER_STATUSES, EQ_STATUSES, statusStyle, MONTHS, DAYS_SHORT, DAY_FULL, KEYS, DEFAULT_EQ_SETTINGS, EQ_COL_DAYS, EQ_COL_SLOTS, isEqColDay, RUSH_MODE, genId, toKey, fmt, fmtDate, todayISO, todayDate, localDateStr, addBusinessDays, addCalendarDays, nextEqColDay, countBizDaysLate, accessoryCost, CAL_DATA_YEAR, PUBLIC_HOLIDAYS_2026, RECESS_RANGES, SWOT_RANGES, inRange, getDateStatus, ipt, pill, Btn
};
