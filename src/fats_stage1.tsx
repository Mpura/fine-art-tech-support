import { useState, useEffect } from "react";

const TEAL = "#1D9E75";
const BLUE = "#185FA5";
const AMBER = "#854F0B";
const RED = "#A32D2D";

// ── CONSTANTS ────────────────────────────────────────────────────
const BASE_ID = "appUqkCfnsOo2Jf7z";
const EQ_TABLE = "tblc2MXweiXikz3wo";
const CHECKOUT_TABLE = "tbl1DvH6ostZs7Jog";
const MEMBERS_TABLE = "tbloPfyyjQY79YxQd";
const HSMS_URL = "https://fineart-hsms.netlify.app/";

const YEAR_LABELS = {"1":"1st year","2":"2nd year","3":"3rd year","4":"4th year"};

const REQUEST_TYPES = [
  {id:"print",label:"Large format & photographic printing",icon:"🖨️",booking:"walk-in or advance",bookable:false,needsFiles:true,prep:["File must be PDF, JPEG or TIFF","Colour profile must be sRGB or CMYK","Know your paper size (A4 → A0)","Decide paper type: normal, glossy, newsprint or photographic","Know how many copies you need"]},
  {id:"copy",label:"Photocopying",icon:"📄",booking:"walk-in or advance",bookable:false,needsFiles:false,prep:[]},
  {id:"laser",label:"Laser cutter & engraving",icon:"⚡",booking:"advance booking only",bookable:true,needsFiles:true,prep:["File must be SVG, AI or DXF","Know your material type (wood, acrylic, cardboard...)","Have your exact dimensions ready","Decide: cut, engrave or both","⚠️ Material test required — same-day cutting is NOT guaranteed. Book well in advance."]},
  {id:"3d",label:"3D printing",icon:"🧱",booking:"advance booking only",bookable:true,needsFiles:true,prep:["File must be STL or OBJ","Know your dimensions and scale","Decide material preference","Decide infill density","⚠️ 3D prints can take several hours — book well ahead of your deadline."]},
  {id:"software",label:"Software install",icon:"💻",booking:"walk-in",bookable:false,needsFiles:false,prep:["Know the exact software name","Have the download URL ready","Know which Mac number and lab room"]},
  {id:"studio",label:"Lighting studio",icon:"💡",booking:"advance booking only",bookable:true,needsFiles:false,prep:["Know your shoot type (portrait, product, video...)","Estimate how long you need the studio","Check the booking calendar before submitting"]},
  {id:"newsprint",label:"Newsprint copying",icon:"📰",booking:"walk-in or advance",bookable:false,needsFiles:false,prep:[]},
  {id:"equipment",label:"Equipment booking",icon:"📷",booking:"advance booking only",bookable:false,needsFiles:false,prep:[]},
  {id:"query",label:"General query",icon:"💬",booking:"walk-in",bookable:false,needsFiles:false,prep:[]},
  {id:"other",label:"Other",icon:"📌",booking:"walk-in or advance",bookable:false,needsFiles:false,prep:[]},
];

const BOOKABLE = REQUEST_TYPES.filter(t=>t.bookable);
const DEFAULT_SCHEDULE = {
  laser:{days:[2,4],morningSlots:2,afternoonSlots:1},
  "3d":{days:[1,3],morningSlots:2,afternoonSlots:2},
  studio:{days:[1,2,3,4,5],morningSlots:1,afternoonSlots:2},
};

const STATUSES = ["Pending","In Progress","Done","Declined"];
const LASER_STATUSES = ["Pending","Material test required","Ready to cut","In Progress","Done","Declined"];
const IT_STATUSES = ["Logged","Awaiting IT","In Progress","Resolved","Escalated"];

const statusStyle = {
  "Pending":{bg:"#FAEEDA",color:"#854F0B"},
  "In Progress":{bg:"#E6F1FB",color:"#185FA5"},
  "Material test required":{bg:"#FBEAF0",color:"#993556"},
  "Ready to cut":{bg:"#E1F5EE",color:"#0F6E56"},
  "Done":{bg:"#E1F5EE",color:"#0F6E56"},
  "Declined":{bg:"#FCEBEB",color:"#A32D2D"},
};
const itStatusStyle = {
  "Logged":{bg:"#FAEEDA",color:"#854F0B"},
  "Awaiting IT":{bg:"#E6F1FB",color:"#185FA5"},
  "In Progress":{bg:"#E6F1FB",color:"#185FA5"},
  "Resolved":{bg:"#E1F5EE",color:"#0F6E56"},
  "Escalated":{bg:"#FCEBEB",color:"#A32D2D"},
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

const KEYS={req:"fats_req_v5",sched:"fats_sched_v5",block:"fats_block_v5",maint:"fats_maint_v5",hs:"fats_hs_v5",leave:"fats_leave_v5",it:"fats_it_v5"};

function genId(){return Date.now().toString(36)+Math.random().toString(36).slice(2);}
function toKey(y,m,d){return`${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;}
function fmt(iso){if(!iso)return"";const d=new Date(iso);return d.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"})+" "+d.toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit"});}
function fmtDate(iso){if(!iso)return"";const d=new Date(iso+"T00:00:00");return d.toLocaleDateString("en-ZA",{day:"2-digit",month:"short",year:"numeric"});}
function todayISO(){return new Date().toISOString();}
function todayDate(){return new Date().toISOString().slice(0,10);}

const ipt={width:"100%",padding:"10px 12px",borderRadius:8,border:"0.5px solid #ccc",fontSize:14,boxSizing:"border-box",fontFamily:"sans-serif"};
const pill=(status,map=statusStyle)=>{const s=(map)[status]||{};return <span style={{fontSize:11,padding:"3px 10px",borderRadius:20,whiteSpace:"nowrap",...s}}>{status}</span>;};
const Btn=({children,onClick,color=TEAL,outline=false,disabled=false,small=false,full=false,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{padding:small?"6px 12px":"9px 16px",borderRadius:8,border:outline?`0.5px solid ${color}`:"none",background:disabled?"#ccc":outline?"transparent":color,color:disabled?"#fff":outline?color:"#fff",fontSize:small?12:13,fontWeight:500,cursor:disabled?"not-allowed":"pointer",fontFamily:"sans-serif",width:full?"100%":"auto",...style}}>{children}</button>
);

// ── ANTHROPIC API for Airtable ───────────────────────────────────
async function airtableCall(prompt, maxTokens=3000) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      model:"claude-sonnet-4-20250514",
      max_tokens:maxTokens,
      mcp_servers:[{type:"url",url:"https://mcp.airtable.com/mcp",name:"airtable-mcp"}],
      messages:[{role:"user",content:prompt}]
    })
  });
  const data = await res.json();
  const text = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("") || "";
  const match = text.replace(/```json|```/g,"").match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
  return match ? JSON.parse(match[0]) : null;
}

async function lookupStudent(studNo) {
  return await airtableCall(`
Search the Airtable Team Members table (base: ${BASE_ID}, table: ${MEMBERS_TABLE}) for student number "${studNo}".
The Name field (fldrljU5H1fRcxl4N) contains entries like "g25K7744 Olerato" — student number is the first token.
The year is in field fld5UeedrhFdco5GZ as "1","2","3","4".

Return ONLY valid JSON (no markdown):
If found: {"found":true,"studentId":"recXXX","name":"FirstName","fullName":"g25K7744 FirstName","year":"2","studNo":"g25K7744"}
If not found: {"found":false}
`, 1500);
}

async function fetchEquipment(yearNum) {
  const result = await airtableCall(`
List all records from Airtable Equipment table (base: ${BASE_ID}, table: ${EQ_TABLE}).
Return ONLY a JSON array (no markdown):
[{"id":"recXXX","name":"","type":"","equipmentStatus":"","status":"","image":"","accessories":"","restrictedYears":[]}]

Field mappings:
- name: fldQRpIgtqLUhG5xG
- type: fldjUxbanYXODN6pJ (.name)
- equipmentStatus: fldikVDAqWP6jqrE1 (.name)
- status: fldkFVX44fpAKuTXX
- image: fld3LUaf1UVysViNn first item thumbnails.large.url or .url
- accessories: fldJ90d50xcskLOUo
- restrictedYears: fldyX7CsaZc8jp8SW (array of .name values)

Only include items where:
- equipmentStatus is "Fully Functional" OR "Functional - Worn"  
- status is NOT "Unavailable" and NOT "Checked Out"
- restrictedYears is empty (all years) OR contains "${yearNum}"
`, 4000);
  return Array.isArray(result) ? result : [];
}

async function createEquipmentBooking(student, items, collectionDate, slot, returnDate, notes) {
  await airtableCall(`
Create a record in Airtable Equipment Checkouts table (base: ${BASE_ID}, table: ${CHECKOUT_TABLE}):
- fldpkRB3zgivkSmcn (Type): "Checking Out"
- fldCm8EGbPP1fu7NH (Estimated Return Date): "${returnDate}"

Booking details (for notes):
Student: ${student.name} (${student.studNo}) Year ${student.year}
Items: ${items.map(i=>i.name).join(", ")}
Collection: ${collectionDate} ${slot==="morning"?"Morning":"Afternoon"}
Notes: ${notes}

Return: {"success":true}
`, 800);
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
  const [dashTab, setDashTab] = useState("queue");
  const [editEq, setEditEq] = useState(null);

  // Calendar
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(3);
  const [selDate, setSelDate] = useState(null);
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
  const [form, setForm] = useState({name:"",studNo:"",year:"",when:"walkin",schedDate:"",notes:"",paperSize:"",paperType:"",colour:"Colour",copies:"",material:"",dimensions:"",jobType:"Cut",softwareName:"",downloadUrl:"",macLocation:"",shootType:"",duration:"",material3d:"",infill:""});

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
  const [eqReturn, setEqReturn] = useState("");
  const [eqNotes, setEqNotes] = useState("");
  const [eqSubmitting, setEqSubmitting] = useState(false);

  const type = REQUEST_TYPES.find(t=>t.id===selType);

  useEffect(()=>{
    async function load(){
      try{
        const r=await window.storage.get(KEYS.req);if(r?.value)setRequests(JSON.parse(r.value));
        const s=await window.storage.get(KEYS.sched);if(s?.value)setSchedule(JSON.parse(s.value));
        const b=await window.storage.get(KEYS.block);if(b?.value)setBlocks(JSON.parse(b.value));
        const m=await window.storage.get(KEYS.maint);if(m?.value)setMaintLogs(JSON.parse(m.value));
        const h=await window.storage.get(KEYS.hs);if(h?.value)setHsLogs(JSON.parse(h.value));
        const l=await window.storage.get(KEYS.leave);if(l?.value)setLeaveMode(JSON.parse(l.value));
        const i=await window.storage.get(KEYS.it);if(i?.value)setItReferrals(JSON.parse(i.value));
      }catch(e){}
      setLoaded(true);
    }
    load();
  },[]);

  const persist=async(key,data)=>{try{await window.storage.set(key,JSON.stringify(data));}catch(e){}};
  const setF=(k,v)=>setForm(f=>({...f,[k]:v}));

  function submitRequest(isWalkIn=false){
    if(!form.name.trim()||!selType)return;
    const req={id:genId(),name:form.name.trim(),studNo:form.studNo.trim(),year:form.year,type:type.label,typeId:selType,when:isWalkIn?"walkin":type.bookable&&selDate?"booked":form.when,schedDate:type.bookable&&selDate?`${selDate} ${selSlot==="morning"?"(Morning)":"(Afternoon)"}`:form.when==="later"&&!isWalkIn?form.schedDate:null,notes:form.notes.trim(),details:{paperSize:form.paperSize,paperType:form.paperType,colour:form.colour,copies:form.copies,material:form.material,dimensions:form.dimensions,jobType:form.jobType,softwareName:form.softwareName,downloadUrl:form.downloadUrl,macLocation:form.macLocation,shootType:form.shootType,duration:form.duration,material3d:form.material3d,infill:form.infill},status:"Pending",staffNote:"",isWalkIn,createdAt:todayISO(),updatedAt:todayISO()};
    const u=[req,...requests];setRequests(u);persist(KEYS.req,u);
  }
  function updateStatus(id,status){const u=requests.map(r=>r.id===id?{...r,status,updatedAt:todayISO()}:r);setRequests(u);persist(KEYS.req,u);}
  function saveNote(id){const u=requests.map(r=>r.id===id?{...r,staffNote:staffNotes[id]||"",updatedAt:todayISO()}:r);setRequests(u);persist(KEYS.req,u);}
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

  function getBookings(eqId,dateKey,slot){return requests.filter(r=>r.typeId===eqId&&r.schedDate&&r.schedDate.startsWith(dateKey)&&r.schedDate.includes(slot==="morning"?"(Morning)":"(Afternoon)")&&r.status!=="Declined").length;}

  // Equipment booking handlers
  async function handleEqLookup(){
    if(!eqStudNo.trim())return;
    setEqLooking(true);setEqLookupErr("");
    try{
      const result=await lookupStudent(eqStudNo.trim());
      if(result?.found){
        setEqStudent(result);setEqScreen("browse");
        setEqLoading(true);
        const items=await fetchEquipment(result.year);
        setEquipment(items);setEqLoading(false);
      } else {
        setEqLookupErr("Student number not found. Please check and try again, or speak to Mpumzi.");
      }
    }catch(e){setEqLookupErr("Could not connect. Please try again.");}
    setEqLooking(false);
  }
  function toggleEqItem(item){setSelItems(prev=>prev.find(i=>i.id===item.id)?prev.filter(i=>i.id!==item.id):[...prev,item]);}
  async function submitEqRequest(){
    if(!eqColDate||!eqSlot||!eqReturn||selItems.length===0)return;
    setEqSubmitting(true);
    try{await createEquipmentBooking(eqStudent,selItems,eqColDate,eqSlot,eqReturn,eqNotes);}catch(e){}
    setEqScreen("success");setEqSubmitting(false);
  }
  function resetEq(){setEqScreen("lookup");setEqStudNo("");setEqStudent(null);setEquipment([]);setSelItems([]);setEqFilter("All");setEqSearch("");setEqColDate("");setEqSlot("");setEqReturn("");setEqNotes("");setEqLookupErr("");setEqErr("");}

  const eqTypes=["All",...new Set(equipment.map(e=>e.type).filter(Boolean))];
  const eqFiltered=equipment.filter(e=>(eqFilter==="All"||e.type===eqFilter)&&(!eqSearch||e.name?.toLowerCase().includes(eqSearch.toLowerCase())));
  const filtered=filterStatus==="All"?requests:requests.filter(r=>r.status===filterStatus);
  const counts=STATUSES.reduce((a,s)=>({...a,[s]:requests.filter(r=>r.status===s).length}),{});
  const openIt=itReferrals.filter(r=>r.status!=="Resolved").length;
  const itFiltered=itFilter==="All"?itReferrals:itReferrals.filter(r=>r.status===itFilter);

  // ── SHARED COMPONENTS ────────────────────────────────────────────
  const TabBar=()=>(
    <div style={{display:"flex",borderBottom:"0.5px solid #e0e0e0",marginBottom:20}}>
      {[["student","Student"],["dashboard","Staff"]].map(([v,l])=>(
        <button key={v} onClick={()=>{setView(v);setScreen("home");setSelType(null);setPrepOk(false);setSelDate(null);setSelSlot(null);setDashTab("queue");if(v==="student"){setEqScreen("lookup");}}}
          style={{flex:1,padding:"10px 0",background:"none",border:"none",borderBottom:view===v?`2px solid ${TEAL}`:"none",color:view===v?TEAL:"#888",fontSize:13,fontWeight:500,cursor:"pointer"}}>{l}</button>
      ))}
    </div>
  );
  const Back=({to,label="← Back",extra=()=>{}})=>(
    <button onClick={()=>{setScreen(to);if(to==="home"){setSelType(null);setPrepOk(false);setSelDate(null);setSelSlot(null);}extra();}}
      style={{background:"none",border:"none",color:"#666",fontSize:13,cursor:"pointer",padding:"0 0 16px 0",display:"block"}}>{label}</button>
  );

  const CalendarPicker=({eqId})=>{
    const sched=schedule[eqId]||{days:[],morningSlots:1,afternoonSlots:1};
    const today=new Date();today.setHours(0,0,0,0);
    const firstDay=new Date(calYear,calMonth,1).getDay();
    const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
    const cells=[];for(let i=0;i<firstDay;i++)cells.push(null);for(let d=1;d<=daysInMonth;d++)cells.push(d);
    const isAvail=(d)=>{const date=new Date(calYear,calMonth,d);if(date<today)return false;const k=toKey(calYear,calMonth,d);if(blocks[k])return false;if(!sched.days.includes(date.getDay()))return false;return getBookings(eqId,k,"morning")<sched.morningSlots||getBookings(eqId,k,"afternoon")<sched.afternoonSlots;};
    return(
      <div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#555"}}>‹</button>
          <div style={{fontWeight:500,fontSize:15}}>{MONTHS[calMonth]} {calYear}</div>
          <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#555"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>{DAYS_SHORT.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:"#aaa",fontWeight:500}}>{d}</div>)}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:12}}>
          {cells.map((d,i)=>{if(!d)return<div key={i}/>;const avail=isAvail(d);const blocked=!!blocks[toKey(calYear,calMonth,d)];const k=toKey(calYear,calMonth,d);const sel=selDate===k;const past=new Date(calYear,calMonth,d)<new Date(new Date().setHours(0,0,0,0));return(
            <div key={i} onClick={()=>avail&&(setSelDate(k),setSelSlot(null))} style={{aspectRatio:"1",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:8,fontSize:12,cursor:avail?"pointer":"default",background:sel?TEAL:blocked?"#fee":avail?"#E1F5EE":"transparent",color:sel?"#fff":blocked?"#e24b4a":avail?"#0F6E56":past?"#ddd":"#ccc",fontWeight:sel?500:400}}>{d}</div>
          );})}
        </div>
        {selDate&&(()=>{const mFull=getBookings(eqId,selDate,"morning")>=sched.morningSlots;const aFull=getBookings(eqId,selDate,"afternoon")>=sched.afternoonSlots;return(
          <div style={{marginBottom:12}}>
            <div style={{fontSize:13,color:"#666",marginBottom:8,fontWeight:500}}>{selDate} — choose a slot:</div>
            <div style={{display:"flex",gap:8}}>
              {[["morning","🌅 Morning",mFull,sched.morningSlots-getBookings(eqId,selDate,"morning")],["afternoon","🌆 Afternoon",aFull,sched.afternoonSlots-getBookings(eqId,selDate,"afternoon")]].map(([v,l,full,left])=>(
                <button key={v} onClick={()=>!full&&setSelSlot(v)} disabled={full} style={{flex:1,padding:"10px 8px",borderRadius:10,border:selSlot===v?`2px solid ${TEAL}`:"0.5px solid #ccc",background:full?"#f5f5f5":selSlot===v?"#E1F5EE":"#fff",color:full?"#ccc":selSlot===v?TEAL:"#444",fontSize:13,cursor:full?"not-allowed":"pointer",fontFamily:"sans-serif"}}>
                  {l}<br/><span style={{fontSize:11,color:full?"#ccc":"#aaa"}}>{full?"Full":`${left} left`}</span>
                </button>
              ))}
            </div>
          </div>
        );})()}
      </div>
    );
  };

  // ── STUDENT HOME ─────────────────────────────────────────────────
  if(view==="student"&&screen==="home") return(
    <div style={{maxWidth:440,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
      <TabBar/>
      <div style={{fontSize:20,fontWeight:500,marginBottom:4}}>Fine Art Tech Support</div>
      <div style={{fontSize:13,color:"#888",marginBottom:8}}>Rhodes University — Fine Art Department</div>
      {leaveMode.active?(
        <div style={{background:"#FAEEDA",borderRadius:10,padding:"16px",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:8}}>🏖️</div>
          <div style={{fontWeight:500,fontSize:15,color:"#854F0B",marginBottom:4}}>Mpumzi is on leave</div>
          {leaveMode.returnDate&&<div style={{fontSize:14,color:"#854F0B",marginBottom:4}}>Returning: {fmtDate(leaveMode.returnDate)}</div>}
          {leaveMode.message&&<div style={{fontSize:13,color:"#854F0B"}}>{leaveMode.message}</div>}
          <div style={{fontSize:12,color:"#854F0B",marginTop:8}}>Requests cannot be submitted while staff is on leave.</div>
        </div>
      ):(<>
        <div style={{fontSize:12,color:"#e24b4a",background:"#fcebeb",borderRadius:8,padding:"8px 12px",marginBottom:20}}>⚠️ You must submit a request before coming in person. No request = no assistance.</div>
        {REQUEST_TYPES.map(t=>(
          <div key={t.id} onClick={()=>{
            if(t.id==="equipment"){setScreen("equipment");setEqScreen("lookup");return;}
            setSelType(t.id);setScreen(t.prep.length>0?"prep":"form");setPrepOk(false);setSelDate(null);setSelSlot(null);setForm(f=>({...f,name:"",studNo:"",year:"",when:"walkin",schedDate:"",notes:""}));
          }} style={{display:"flex",alignItems:"center",gap:12,background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:"14px 16px",marginBottom:8,cursor:"pointer"}}>
            <span style={{fontSize:22}}>{t.icon}</span>
            <div style={{flex:1}}><div style={{fontSize:14,fontWeight:500}}>{t.label}</div><div style={{fontSize:11,color:"#aaa",marginTop:2}}>{t.booking}</div></div>
            <span style={{color:"#ccc"}}>›</span>
          </div>
        ))}
      </>)}
    </div>
  );

  // ── EQUIPMENT BOOKING SCREENS ────────────────────────────────────
  if(view==="student"&&screen==="equipment") {
    // Lookup screen
    if(eqScreen==="lookup") return(
      <div style={{maxWidth:440,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
        <TabBar/>
        <Back to="home" label="← Back"/>
        <div style={{fontSize:18,fontWeight:500,marginBottom:4}}>Equipment Booking</div>
        <div style={{fontSize:13,color:"#888",marginBottom:20}}>Enter your student number to see available equipment</div>
        <div style={{background:"#E6F1FB",borderRadius:10,padding:"12px 14px",marginBottom:20,fontSize:13,color:"#185FA5"}}>
          Your year is verified automatically — equipment available to your year will be shown.
        </div>
        <div style={{marginBottom:16}}>
          <label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Student number *</label>
          <input style={{...ipt,fontSize:16,letterSpacing:"0.05em"}} value={eqStudNo} onChange={e=>setEqStudNo(e.target.value.trim())} onKeyDown={e=>e.key==="Enter"&&handleEqLookup()} placeholder="e.g. g25K7744" autoFocus/>
          {eqLookupErr&&<div style={{marginTop:8,fontSize:13,color:"#A32D2D",background:"#FCEBEB",borderRadius:8,padding:"10px 12px"}}>⚠️ {eqLookupErr}</div>}
        </div>
        <Btn onClick={handleEqLookup} disabled={!eqStudNo.trim()||eqLooking} full style={{padding:"13px",fontSize:15}}>
          {eqLooking?"Verifying...":"Find my equipment →"}
        </Btn>
      </div>
    );

    // Browse screen
    if(eqScreen==="browse") return(
      <div style={{maxWidth:480,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
        <TabBar/>
        <button onClick={()=>{setEqScreen("lookup");}} style={{background:"none",border:"none",color:"#666",fontSize:13,cursor:"pointer",padding:"0 0 12px 0",display:"block"}}>← Back</button>
        <div style={{background:"#E1F5EE",borderRadius:10,padding:"10px 14px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontSize:14,fontWeight:500,color:"#0F6E56"}}>👋 {eqStudent?.name}</div><div style={{fontSize:12,color:"#0F6E56"}}>{eqStudent?.studNo} · {YEAR_LABELS[eqStudent?.year]||`Year ${eqStudent?.year}`}</div></div>
          {selItems.length>0&&<Btn small onClick={()=>setEqScreen("confirm")} color={TEAL}>Book {selItems.length} item{selItems.length>1?"s":""}</Btn>}
        </div>
        <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Available for {YEAR_LABELS[eqStudent?.year]}</div>
        <div style={{fontSize:13,color:"#888",marginBottom:12}}>Tap to select items</div>
        <input style={{...ipt,marginBottom:10}} placeholder="Search..." value={eqSearch} onChange={e=>setEqSearch(e.target.value)}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          {eqTypes.map(t=><button key={t} onClick={()=>setEqFilter(t)} style={{padding:"5px 12px",borderRadius:20,border:"none",background:eqFilter===t?TEAL:"#f0f0f0",color:eqFilter===t?"#fff":"#555",fontSize:12,cursor:"pointer",fontFamily:"sans-serif",whiteSpace:"nowrap"}}>{t}</button>)}
        </div>
        {eqLoading&&<div style={{textAlign:"center",padding:"3rem",color:"#aaa"}}><div style={{fontSize:28,marginBottom:8}}>⏳</div><div style={{fontSize:14}}>Loading equipment...</div></div>}
        {!eqLoading&&eqFiltered.length===0&&<div style={{textAlign:"center",padding:"3rem",color:"#aaa",fontSize:14}}>No equipment available for {YEAR_LABELS[eqStudent?.year]}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:selItems.length>0?80:0}}>
          {eqFiltered.map(item=>{
            const sel=!!selItems.find(i=>i.id===item.id);
            return(
              <div key={item.id} onClick={()=>toggleEqItem(item)} style={{background:"#fff",border:sel?`2px solid ${TEAL}`:"0.5px solid #e0e0e0",borderRadius:12,overflow:"hidden",cursor:"pointer",position:"relative"}}>
                {sel&&<div style={{position:"absolute",top:8,right:8,background:TEAL,borderRadius:"50%",width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:13,zIndex:1}}>✓</div>}
                {item.image?<img src={item.image} alt={item.name||""} style={{width:"100%",height:120,objectFit:"cover",display:"block"}} onError={e=>{e.target.style.display="none";}}/>:<div style={{height:120,background:"#f5f5f5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>📷</div>}
                <div style={{padding:"10px 10px 12px"}}>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:3,lineHeight:1.3}}>{item.name||"Unnamed"}</div>
                  <div style={{fontSize:11,color:"#888",marginBottom:4}}>{item.type}</div>
                  <div style={{display:"inline-block",fontSize:10,padding:"2px 7px",borderRadius:20,background:item.equipmentStatus==="Fully Functional"?"#E1F5EE":"#FAEEDA",color:item.equipmentStatus==="Fully Functional"?"#0F6E56":"#854F0B"}}>{item.equipmentStatus}</div>
                </div>
              </div>
            );
          })}
        </div>
        {selItems.length>0&&(
          <div style={{position:"sticky",bottom:0,background:"#fff",borderTop:"0.5px solid #e0e0e0",padding:"12px 0",marginTop:8}}>
            <Btn onClick={()=>setEqScreen("confirm")} full style={{padding:"13px",fontSize:15}}>Continue with {selItems.length} item{selItems.length>1?"s":""} →</Btn>
          </div>
        )}
      </div>
    );

    // Confirm screen
    if(eqScreen==="confirm") return(
      <div style={{maxWidth:440,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
        <TabBar/>
        <button onClick={()=>setEqScreen("browse")} style={{background:"none",border:"none",color:"#666",fontSize:13,cursor:"pointer",padding:"0 0 12px 0",display:"block"}}>← Back</button>
        <div style={{fontSize:18,fontWeight:500,marginBottom:4}}>Book collection slot</div>
        <div style={{fontSize:13,color:"#888",marginBottom:16}}>{eqStudent?.name} · {YEAR_LABELS[eqStudent?.year]}</div>
        <div style={{background:"#f7f7f7",borderRadius:10,padding:"12px 14px",marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:500,color:"#555",marginBottom:10}}>Selected ({selItems.length}):</div>
          {selItems.map(item=>(
            <div key={item.id} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              {item.image?<img src={item.image} style={{width:40,height:40,objectFit:"cover",borderRadius:8,flexShrink:0}} alt=""/>:<div style={{width:40,height:40,background:"#e0e0e0",borderRadius:8,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>📷</div>}
              <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>{item.name}</div><div style={{fontSize:11,color:"#aaa"}}>{item.type}</div></div>
              <button onClick={()=>toggleEqItem(item)} style={{background:"none",border:"none",color:"#ccc",cursor:"pointer",fontSize:18,padding:"0 4px"}}>×</button>
            </div>
          ))}
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Collection date *</label><input type="date" style={ipt} value={eqColDate} min={todayDate()} onChange={e=>{setEqColDate(e.target.value);if(eqReturn&&e.target.value>eqReturn)setEqReturn("");}}/></div>
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Collection slot *</label>
          <div style={{display:"flex",gap:8}}>
            {[["morning","🌅 Morning","Before 12pm"],["afternoon","🌆 Afternoon","After 12pm"]].map(([v,l,sub])=>(
              <button key={v} onClick={()=>setEqSlot(v)} style={{flex:1,padding:"12px 8px",borderRadius:10,border:eqSlot===v?`2px solid ${TEAL}`:"0.5px solid #ccc",background:eqSlot===v?"#E1F5EE":"#fff",color:eqSlot===v?TEAL:"#444",fontSize:13,cursor:"pointer",fontFamily:"sans-serif",textAlign:"center"}}>
                {l}<br/><span style={{fontSize:11,color:eqSlot===v?TEAL:"#aaa"}}>{sub}</span>
              </button>
            ))}
          </div>
        </div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Return date *</label><input type="date" style={ipt} value={eqReturn} min={eqColDate||todayDate()} onChange={e=>setEqReturn(e.target.value)}/></div>
        <div style={{marginBottom:20}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Notes (optional)</label><textarea style={{...ipt,resize:"vertical"}} rows={2} value={eqNotes} onChange={e=>setEqNotes(e.target.value)} placeholder="e.g. Need camera for location shoot Thursday"/></div>
        <div style={{background:"#FAEEDA",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:12,color:"#854F0B"}}>⚠️ Do not come to collect until Mpumzi confirms. Bring your student card.</div>
        <Btn onClick={submitEqRequest} disabled={!eqColDate||!eqSlot||!eqReturn||eqSubmitting} full style={{padding:"13px",fontSize:15}}>{eqSubmitting?"Submitting...":"Submit equipment request"}</Btn>
      </div>
    );

    // Success screen
    if(eqScreen==="success") return(
      <div style={{maxWidth:440,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif",textAlign:"center"}}>
        <TabBar/>
        <div style={{padding:"2rem 1rem"}}>
          <div style={{fontSize:52,marginBottom:16}}>📷</div>
          <div style={{fontSize:18,fontWeight:500,marginBottom:8}}>Request submitted!</div>
          <div style={{fontSize:14,color:"#333",marginBottom:4}}>{eqStudent?.name} — {YEAR_LABELS[eqStudent?.year]}</div>
          <div style={{fontSize:13,color:"#666",marginBottom:16}}>{selItems.length} item{selItems.length>1?"s":""} · {eqColDate} · {eqSlot==="morning"?"Morning":"Afternoon"}</div>
          <div style={{fontSize:13,color:"#e24b4a",background:"#fcebeb",borderRadius:8,padding:"10px 14px",marginBottom:10}}>Do not collect until Mpumzi confirms. Bring your student card.</div>
          <div style={{fontSize:13,color:"#185FA5",background:"#E6F1FB",borderRadius:8,padding:"10px 14px",marginBottom:24}}>✅ Logged in Airtable 2026 (test copy)</div>
          <Btn outline color="#888" onClick={resetEq} style={{color:"#555",border:"0.5px solid #ccc",background:"transparent"}}>Book more equipment</Btn>
        </div>
      </div>
    );
  }

  // ── PREP ────────────────────────────────────────────────────────
  if(view==="student"&&screen==="prep"&&type) return(
    <div style={{maxWidth:440,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
      <TabBar/><Back to="home"/>
      <div style={{fontSize:17,fontWeight:500,marginBottom:16}}>{type.icon} {type.label}</div>
      <div style={{background:"#FAEEDA",borderRadius:12,padding:"14px 16px",marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:500,color:"#854F0B",marginBottom:10}}>Before you submit — make sure you have:</div>
        {type.prep.map((p,i)=><div key={i} style={{fontSize:13,color:p.startsWith("⚠️")?"#A32D2D":"#5F4000",marginBottom:6,display:"flex",gap:8,alignItems:"flex-start"}}><span style={{flexShrink:0}}>{p.startsWith("⚠️")?"":"✓"}</span><span>{p}</span></div>)}
      </div>
      {type.needsFiles&&<label style={{display:"flex",alignItems:"flex-start",gap:10,cursor:"pointer",marginBottom:20,background:"#f7f7f7",borderRadius:10,padding:"12px 14px"}}>
        <input type="checkbox" checked={prepOk} onChange={e=>setPrepOk(e.target.checked)} style={{marginTop:2,width:16,height:16,flexShrink:0}}/>
        <span style={{fontSize:14,color:"#333"}}>I have everything ready and understand the requirements</span>
      </label>}
      <Btn onClick={()=>setScreen(type.bookable?"calendar":"form")} disabled={type.needsFiles&&!prepOk} full style={{padding:"13px",fontSize:15}}>{type.bookable?"Choose a date →":"Continue to request form →"}</Btn>
    </div>
  );

  // ── CALENDAR ────────────────────────────────────────────────────
  if(view==="student"&&screen==="calendar"&&type) return(
    <div style={{maxWidth:440,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
      <TabBar/><Back to="prep"/>
      <div style={{fontSize:17,fontWeight:500,marginBottom:4}}>{type.icon} {type.label}</div>
      <div style={{fontSize:13,color:"#888",marginBottom:16}}>Select an available date and slot</div>
      <CalendarPicker eqId={selType}/>
      {selDate&&selSlot&&<Btn onClick={()=>setScreen("form")} full style={{padding:"13px",fontSize:15,marginTop:8}}>Continue → {selDate} {selSlot==="morning"?"Morning":"Afternoon"}</Btn>}
    </div>
  );

  // ── REQUEST FORM ────────────────────────────────────────────────
  if(view==="student"&&screen==="form"&&type) return(
    <div style={{maxWidth:440,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
      <TabBar/><Back to={type.bookable?"calendar":type.prep.length>0?"prep":"home"}/>
      <div style={{fontSize:17,fontWeight:500,marginBottom:16}}>{type.icon} {type.label}</div>
      {type.bookable&&selDate&&selSlot&&<div style={{background:"#E1F5EE",borderRadius:10,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#0F6E56",fontWeight:500}}>📅 {selDate} — {selSlot==="morning"?"Morning":"Afternoon"} slot</div>}
      {["Full name *","Student number"].map((lbl,i)=>(
        <div key={i} style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{lbl}</label><input style={ipt} value={i===0?form.name:form.studNo} onChange={e=>setF(i===0?"name":"studNo",e.target.value)} placeholder={i===0?"e.g. Ayanda Mokoena":"e.g. g25K7744"}/></div>
      ))}
      <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Year of study</label><select style={ipt} value={form.year} onChange={e=>setF("year",e.target.value)}>{["Select year (optional)","1st year","2nd year","3rd year","4th year"].map(y=><option key={y}>{y}</option>)}</select></div>
      {type.id==="print"&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Paper size</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["A4","A3","A2","A1","A0"].map(s=><button key={s} onClick={()=>setF("paperSize",s)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:form.paperSize===s?TEAL:"#f0f0f0",color:form.paperSize===s?"#fff":"#444",fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>{s}</button>)}</div></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Paper type</label><select style={ipt} value={form.paperType} onChange={e=>setF("paperType",e.target.value)}>{["Select paper type","Normal","Glossy","Newsprint","Photographic"].map(p=><option key={p}>{p}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Colour or B&W</label><div style={{display:"flex",gap:8}}>{["Colour","Black & White"].map(c=><button key={c} onClick={()=>setF("colour",c)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.colour===c?BLUE:"#f0f0f0",color:form.colour===c?"#fff":"#444",fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>{c}</button>)}</div></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Number of copies</label><input style={ipt} type="number" min="1" value={form.copies} onChange={e=>setF("copies",e.target.value)} placeholder="e.g. 2"/></div>
      </>)}
      {(type.id==="copy"||type.id==="newsprint")&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Number of copies</label><input style={ipt} type="number" min="1" value={form.copies} onChange={e=>setF("copies",e.target.value)} placeholder="e.g. 10"/></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Colour or B&W</label><div style={{display:"flex",gap:8}}>{["Colour","Black & White"].map(c=><button key={c} onClick={()=>setF("colour",c)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.colour===c?BLUE:"#f0f0f0",color:form.colour===c?"#fff":"#444",fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>{c}</button>)}</div></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Paper size</label><div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["A4","A3","A2","A1"].map(s=><button key={s} onClick={()=>setF("paperSize",s)} style={{padding:"8px 14px",borderRadius:8,border:"none",background:form.paperSize===s?TEAL:"#f0f0f0",color:form.paperSize===s?"#fff":"#444",fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>{s}</button>)}</div></div>
      </>)}
      {type.id==="laser"&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Material type</label><input style={ipt} value={form.material} onChange={e=>setF("material",e.target.value)} placeholder="e.g. 3mm plywood"/></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Dimensions</label><input style={ipt} value={form.dimensions} onChange={e=>setF("dimensions",e.target.value)} placeholder="e.g. 300 x 200mm"/></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>Job type</label><div style={{display:"flex",gap:8}}>{["Cut","Engrave","Both"].map(j=><button key={j} onClick={()=>setF("jobType",j)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.jobType===j?TEAL:"#f0f0f0",color:form.jobType===j?"#fff":"#444",fontSize:13,cursor:"pointer",fontFamily:"sans-serif"}}>{j}</button>)}</div></div>
      </>)}
      {type.id==="3d"&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Dimensions / scale</label><input style={ipt} value={form.dimensions} onChange={e=>setF("dimensions",e.target.value)} placeholder="e.g. 15cm tall"/></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Material</label><select style={ipt} value={form.material3d} onChange={e=>setF("material3d",e.target.value)}>{["Select material","PLA","ABS","PETG","Resin","Other"].map(m=><option key={m}>{m}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Infill density</label><select style={ipt} value={form.infill} onChange={e=>setF("infill",e.target.value)}>{["Select infill","10% (light)","20% (standard)","50% (strong)","100% (solid)"].map(i=><option key={i}>{i}</option>)}</select></div>
      </>)}
      {type.id==="software"&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Software name</label><input style={ipt} value={form.softwareName} onChange={e=>setF("softwareName",e.target.value)} placeholder="e.g. Adobe Fresco"/></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Download URL</label><input style={ipt} value={form.downloadUrl} onChange={e=>setF("downloadUrl",e.target.value)} placeholder="e.g. https://adobe.com/fresco"/></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Which Mac & lab room</label><input style={ipt} value={form.macLocation} onChange={e=>setF("macLocation",e.target.value)} placeholder="e.g. Mac 4, Lab B"/></div>
      </>)}
      {type.id==="studio"&&(<>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Type of shoot</label><select style={ipt} value={form.shootType} onChange={e=>setF("shootType",e.target.value)}>{["Select shoot type","Portrait","Product","Video","Still life","Other"].map(s=><option key={s}>{s}</option>)}</select></div>
        <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Estimated duration</label><select style={ipt} value={form.duration} onChange={e=>setF("duration",e.target.value)}>{["Select duration","1 hour","2 hours","3 hours","Half day","Full day"].map(d=><option key={d}>{d}</option>)}</select></div>
      </>)}
      {!type.bookable&&<div style={{marginBottom:14}}>
        <label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>When do you need it?</label>
        <div style={{display:"flex",gap:8}}>{[["walkin","Right now"],["later","Schedule"]].map(([v,l])=><button key={v} onClick={()=>setF("when",v)} style={{flex:1,padding:"9px",borderRadius:8,border:"none",background:form.when===v?BLUE:"#f0f0f0",color:form.when===v?"#fff":"#444",fontSize:12,cursor:"pointer",fontFamily:"sans-serif"}}>{l}</button>)}</div>
        {form.when==="later"&&<input type="datetime-local" style={{...ipt,marginTop:8}} value={form.schedDate} onChange={e=>setF("schedDate",e.target.value)}/>}
      </div>}
      <div style={{marginBottom:20}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Additional notes (optional)</label><textarea style={{...ipt,resize:"vertical"}} rows={3} value={form.notes} onChange={e=>setF("notes",e.target.value)} placeholder="Any extra details Mpumzi should know..."/></div>
      <Btn onClick={()=>{submitRequest();setScreen("success");}} disabled={!form.name.trim()} full style={{padding:"13px",fontSize:15}}>Submit a request</Btn>
    </div>
  );

  // ── SUCCESS ──────────────────────────────────────────────────────
  if(view==="student"&&screen==="success") return(
    <div style={{maxWidth:440,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif",textAlign:"center"}}>
      <TabBar/>
      <div style={{padding:"2rem 1rem"}}>
        <div style={{fontSize:52,marginBottom:16}}>🎨</div>
        <div style={{fontSize:18,fontWeight:500,marginBottom:8}}>Request submitted!</div>
        <div style={{fontSize:14,color:"#666",marginBottom:6}}>Mpumzi will review your request and get back to you.</div>
        <div style={{fontSize:13,color:"#e24b4a",background:"#fcebeb",borderRadius:8,padding:"10px 14px",marginBottom:24}}>Please do not come in person until you hear back.</div>
        <Btn outline color="#888" onClick={()=>{setScreen("home");setSelType(null);setPrepOk(false);setSelDate(null);setSelSlot(null);}} style={{color:"#555",border:"0.5px solid #ccc",background:"transparent"}}>Submit another request</Btn>
      </div>
    </div>
  );

  // ── WALK-IN LOG ──────────────────────────────────────────────────
  if(view==="dashboard"&&screen==="walkin") return(
    <div style={{maxWidth:480,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
      <TabBar/><Back to="home" label="← Back to queue"/>
      <div style={{fontSize:17,fontWeight:500,marginBottom:4}}>Log a walk-in</div>
      <div style={{fontSize:13,color:"#888",marginBottom:20}}>Student pitched up — log it quickly</div>
      {["Student name *","Student number"].map((lbl,i)=>(
        <div key={i} style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>{lbl}</label><input style={ipt} value={i===0?form.name:form.studNo} onChange={e=>setF(i===0?"name":"studNo",e.target.value)} placeholder={i===0?"e.g. Sipho Nkosi":"e.g. g25K7744"}/></div>
      ))}
      <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Year</label><select style={ipt} value={form.year} onChange={e=>setF("year",e.target.value)}>{["Select year","1st year","2nd year","3rd year","4th year"].map(y=><option key={y}>{y}</option>)}</select></div>
      <div style={{marginBottom:14}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:6}}>What do they need?</label><div style={{display:"flex",flexWrap:"wrap",gap:6}}>{REQUEST_TYPES.filter(t=>t.id!=="equipment").map(t=><button key={t.id} onClick={()=>setSelType(t.id)} style={{padding:"8px 12px",borderRadius:8,border:"none",background:selType===t.id?TEAL:"#f0f0f0",color:selType===t.id?"#fff":"#444",fontSize:12,cursor:"pointer",fontFamily:"sans-serif"}}>{t.icon} {t.label}</button>)}</div></div>
      <div style={{marginBottom:20}}><label style={{fontSize:13,color:"#666",display:"block",marginBottom:4}}>Quick notes</label><textarea style={{...ipt,resize:"vertical"}} rows={3} value={form.notes} onChange={e=>setF("notes",e.target.value)} placeholder="e.g. Software on Mac 4 — told to come back Thursday"/></div>
      <Btn onClick={()=>{if(!form.name.trim()||!selType)return;submitRequest(true);setScreen("home");setSelType(null);setForm(f=>({...f,name:"",studNo:"",year:"",notes:""}));}} disabled={!form.name.trim()||!selType} full style={{padding:"13px",fontSize:15}}>Log walk-in</Btn>
    </div>
  );

  // ── DASHBOARD ────────────────────────────────────────────────────
  if(view==="dashboard") return(
    <div style={{maxWidth:480,margin:"0 auto",padding:"1.5rem 1rem",fontFamily:"sans-serif"}}>
      <TabBar/>

      {/* Leave toggle */}
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,background:leaveMode.active?"#FAEEDA":"#f7f7f7",borderRadius:10,padding:"10px 14px"}}>
        <span style={{fontSize:13,fontWeight:500,color:leaveMode.active?"#854F0B":"#555",flex:1}}>{leaveMode.active?"🏖️ Leave mode ON — queue frozen":"🟢 Active — accepting requests"}</span>
        <Btn small onClick={toggleLeave} color={leaveMode.active?TEAL:AMBER}>{leaveMode.active?"Go active":"Go on leave"}</Btn>
      </div>
      {leaveMode.active&&(<div style={{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
        <div style={{marginBottom:8}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Return date</label><input type="date" style={ipt} value={leaveMode.returnDate} onChange={e=>setLeaveMode(l=>({...l,returnDate:e.target.value}))}/></div>
        <div style={{marginBottom:8}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Message for students</label><input style={ipt} value={leaveMode.message} onChange={e=>setLeaveMode(l=>({...l,message:e.target.value}))} placeholder="e.g. Back after swot week"/></div>
        <Btn small onClick={saveLeave}>Save</Btn>
      </div>)}

      {/* H&S link */}
      <a href={HSMS_URL} target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",gap:10,background:"#f7f7f7",borderRadius:10,padding:"10px 14px",marginBottom:16,textDecoration:"none",color:"inherit"}}>
        <span style={{fontSize:18}}>🦺</span>
        <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500}}>Health & Safety / Maintenance</div><div style={{fontSize:12,color:"#888"}}>Open FineArt HSMS →</div></div>
        <span style={{color:"#ccc",fontSize:16}}>›</span>
      </a>

      {/* Dash tabs */}
      <div style={{display:"flex",gap:5,marginBottom:20,flexWrap:"wrap"}}>
        {[["queue","Queue"],["it",`IT${openIt>0?` (${openIt})`:""}` ],["schedule","Schedule"],["blocks","Blocks"]].map(([v,l])=>(
          <button key={v} onClick={()=>setDashTab(v)} style={{flex:1,minWidth:60,padding:"8px 4px",borderRadius:8,border:"none",background:dashTab===v?TEAL:"#f0f0f0",color:dashTab===v?"#fff":"#555",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"sans-serif"}}>{l}</button>
        ))}
      </div>

      {/* ── QUEUE ── */}
      {dashTab==="queue"&&(<>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["Pending","#FAEEDA","#854F0B"],["In Progress","#E6F1FB","#185FA5"],["Done","#E1F5EE","#0F6E56"]].map(([s,bg,col])=>(
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
        {!loaded&&<div style={{color:"#aaa",fontSize:14}}>Loading...</div>}
        {loaded&&filtered.length===0&&<div style={{textAlign:"center",padding:"3rem",color:"#aaa",fontSize:14}}>No requests yet</div>}
        {filtered.map(req=>(
          <div key={req.id} style={{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div>
                <div style={{fontWeight:500,fontSize:15}}>{req.name}{req.studNo&&<span style={{fontWeight:400,fontSize:12,color:"#aaa",marginLeft:6}}>#{req.studNo}</span>}{req.isWalkIn&&<span style={{fontSize:11,background:"#e6f1fb",color:"#185FA5",borderRadius:6,padding:"2px 7px",marginLeft:6}}>walk-in</span>}</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>{req.year&&!req.year.startsWith("Select")?req.year+" · ":""}{req.type}</div>
                <div style={{fontSize:12,color:"#aaa",marginTop:1}}>{req.schedDate?`📅 ${req.schedDate}`:req.when==="walkin"?"Walk-in":""} · {fmt(req.createdAt)}</div>
              </div>
              {pill(req.status)}
            </div>
            {Object.values(req.details||{}).some(v=>v&&!String(v).startsWith("Select"))&&(
              <div style={{fontSize:12,color:"#555",background:"#f7f7f7",borderRadius:8,padding:"8px 10px",marginBottom:6,lineHeight:1.8}}>
                {req.details.paperSize&&<span style={{marginRight:10}}>📐 {req.details.paperSize}</span>}
                {req.details.paperType&&!req.details.paperType.startsWith("Select")&&<span style={{marginRight:10}}>🗒️ {req.details.paperType}</span>}
                {req.details.colour&&<span style={{marginRight:10}}>🎨 {req.details.colour}</span>}
                {req.details.copies&&<span style={{marginRight:10}}>×{req.details.copies}</span>}
                {req.details.material&&<span style={{marginRight:10}}>🪵 {req.details.material}</span>}
                {req.details.dimensions&&<span style={{marginRight:10}}>📏 {req.details.dimensions}</span>}
                {req.details.jobType&&req.typeId==="laser"&&<span style={{marginRight:10}}>⚡ {req.details.jobType}</span>}
                {req.details.softwareName&&<span style={{marginRight:10}}>💻 {req.details.softwareName}</span>}
                {req.details.macLocation&&<span style={{marginRight:10}}>🖥️ {req.details.macLocation}</span>}
                {req.details.shootType&&!req.details.shootType.startsWith("Select")&&<span style={{marginRight:10}}>💡 {req.details.shootType}</span>}
                {req.details.duration&&!req.details.duration.startsWith("Select")&&<span style={{marginRight:10}}>⏱️ {req.details.duration}</span>}
                {req.details.material3d&&!req.details.material3d.startsWith("Select")&&<span style={{marginRight:10}}>🧱 {req.details.material3d}</span>}
                {req.details.infill&&!req.details.infill.startsWith("Select")&&<span>{req.details.infill}</span>}
              </div>
            )}
            {req.notes&&<div style={{fontSize:13,color:"#555",background:"#f0f0f0",borderRadius:8,padding:"8px 10px",marginBottom:8}}>"{req.notes}"</div>}
            {req.staffNote&&<div style={{fontSize:12,color:"#185FA5",background:"#E6F1FB",borderRadius:8,padding:"6px 10px",marginBottom:8}}>📝 {req.staffNote}</div>}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>
              {(req.typeId==="laser"?LASER_STATUSES:STATUSES).filter(s=>s!==req.status).map(s=>(
                <button key={s} onClick={()=>updateStatus(req.id,s)} style={{padding:"5px 11px",borderRadius:8,border:"0.5px solid #ccc",background:"transparent",cursor:"pointer",color:"#444",fontSize:12,fontFamily:"sans-serif"}}>→ {s}</button>
              ))}
            </div>
            <button onClick={()=>setExpandId(expandId===req.id?null:req.id)} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer",padding:0}}>{expandId===req.id?"Hide note ▲":"Add / edit note ▼"}</button>
            {expandId===req.id&&(<div style={{marginTop:8}}>
              <textarea rows={2} placeholder="e.g. Files not ready — told to come back Thursday" defaultValue={req.staffNote} onChange={e=>setStaffNotes(n=>({...n,[req.id]:e.target.value}))} style={{...ipt,resize:"vertical",fontSize:13}}/>
              <Btn onClick={()=>{saveNote(req.id);setExpandId(null);}} color={BLUE} style={{marginTop:6,fontSize:13}}>Save note</Btn>
            </div>)}
          </div>
        ))}
      </>)}

      {/* ── IT REFERRALS ── */}
      {dashTab==="it"&&(<>
        <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>IT referrals</div>
        <div style={{fontSize:13,color:"#888",marginBottom:16}}>Log issues for IT — seminar room, Mac lab, network</div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["Open",itReferrals.filter(r=>r.status!=="Resolved").length,"#FAEEDA","#854F0B"],["Resolved",itReferrals.filter(r=>r.status==="Resolved").length,"#E1F5EE","#0F6E56"],["Escalated",itReferrals.filter(r=>r.status==="Escalated").length,"#FCEBEB","#A32D2D"]].map(([l,n,bg,col])=>(
            <div key={l} style={{flex:1,background:bg,borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:20,fontWeight:500,color:col}}>{n}</div>
              <div style={{fontSize:11,color:col}}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:500,marginBottom:12}}>Log new IT referral</div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>What needs IT? *</label><select style={ipt} value={itForm.itemId} onChange={e=>setItForm(f=>({...f,itemId:e.target.value}))}><option value="">Select item</option>{IT_ITEMS.map(i=><option key={i.id} value={i.id}>{i.label}</option>)}</select></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Description *</label><textarea style={{...ipt,resize:"vertical"}} rows={2} value={itForm.description} onChange={e=>setItForm(f=>({...f,description:e.target.value}))} placeholder="e.g. Projector bulb blown, no display output"/></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Priority</label><div style={{display:"flex",gap:6}}>{[["Low","#f0f0f0","#555"],["Normal",TEAL,"#fff"],["Urgent","#e24b4a","#fff"]].map(([p,bg,col])=><button key={p} onClick={()=>setItForm(f=>({...f,priority:p}))} style={{flex:1,padding:"7px",borderRadius:8,border:"none",background:itForm.priority===p?bg:"#f0f0f0",color:itForm.priority===p?col:"#555",fontSize:12,cursor:"pointer",fontFamily:"sans-serif"}}>{p}</button>)}</div></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Date logged</label><input type="date" style={ipt} value={itForm.dateLogged} onChange={e=>setItForm(f=>({...f,dateLogged:e.target.value}))}/></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Logged with (IT contact)</label><input style={ipt} value={itForm.loggedWith} onChange={e=>setItForm(f=>({...f,loggedWith:e.target.value}))} placeholder="e.g. Thabo from IT helpdesk"/></div>
          <div style={{marginBottom:12}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>IT reference / ticket number</label><input style={ipt} value={itForm.reference} onChange={e=>setItForm(f=>({...f,reference:e.target.value}))} placeholder="e.g. INC-20261234"/></div>
          <Btn onClick={logItReferral} disabled={!itForm.itemId||!itForm.description.trim()} full>Log IT referral</Btn>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>{["All",...IT_STATUSES].map(s=><button key={s} onClick={()=>setItFilter(s)} style={{padding:"5px 12px",borderRadius:20,border:"none",background:itFilter===s?BLUE:"#f0f0f0",color:itFilter===s?"#fff":"#555",fontSize:12,cursor:"pointer",fontFamily:"sans-serif"}}>{s}</button>)}</div>
        {itFiltered.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#aaa",fontSize:14}}>No IT referrals yet</div>}
        {itFiltered.map(ref=>(
          <div key={ref.id} style={{background:"#fff",border:`0.5px solid ${ref.priority==="Urgent"?"#f09595":"#e0e0e0"}`,borderRadius:12,padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
              <div style={{flex:1,paddingRight:8}}>
                <div style={{fontWeight:500,fontSize:14,display:"flex",alignItems:"center",gap:6}}>{ref.itemLabel}{ref.priority==="Urgent"&&<span style={{fontSize:10,background:"#FCEBEB",color:"#A32D2D",borderRadius:4,padding:"2px 6px"}}>URGENT</span>}</div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>Logged: {fmtDate(ref.dateLogged)}{ref.loggedWith?" · "+ref.loggedWith:""}</div>
                {ref.reference&&<div style={{fontSize:12,color:BLUE,marginTop:1}}>Ref: {ref.reference}</div>}
              </div>
              {pill(ref.status,itStatusStyle)}
            </div>
            <div style={{fontSize:13,color:"#555",background:"#f7f7f7",borderRadius:8,padding:"8px 10px",marginBottom:8}}>{ref.description}</div>
            {ref.updates?.length>0&&ref.updates.map((u,i)=><div key={i} style={{fontSize:12,color:"#555",borderLeft:`2px solid ${BLUE}`,paddingLeft:8,marginBottom:4}}><span style={{color:"#aaa",marginRight:6}}>{fmt(u.date)}</span>{u.note}</div>)}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:6}}>{IT_STATUSES.filter(s=>s!==ref.status).map(s=><button key={s} onClick={()=>updateItStatus(ref.id,s)} style={{padding:"5px 11px",borderRadius:8,border:"0.5px solid #ccc",background:"transparent",cursor:"pointer",color:"#444",fontSize:12,fontFamily:"sans-serif"}}>→ {s}</button>)}</div>
            <button onClick={()=>setExpandItId(expandItId===ref.id?null:ref.id)} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer",padding:0}}>{expandItId===ref.id?"Hide update ▲":"Add update ▼"}</button>
            {expandItId===ref.id&&<div style={{marginTop:8,display:"flex",gap:8}}><input style={{...ipt,flex:1,fontSize:13}} value={itUpdateNote[ref.id]||""} onChange={e=>setItUpdateNote(n=>({...n,[ref.id]:e.target.value}))} placeholder="e.g. IT confirmed Thursday"/><Btn small onClick={()=>addItUpdate(ref.id)} color={BLUE}>Add</Btn></div>}
          </div>
        ))}
      </>)}

      {/* ── SCHEDULE ── */}
      {dashTab==="schedule"&&(<>
        <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Equipment schedule</div>
        <div style={{fontSize:13,color:"#888",marginBottom:16}}>Set available days and slot limits for bookable equipment</div>
        {BOOKABLE.map(t=>{const s=schedule[t.id]||{days:[],morningSlots:1,afternoonSlots:1};const editing=editEq===t.id;return(
          <div key={t.id} style={{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:editing?12:4}}>
              <div style={{fontWeight:500,fontSize:14}}>{t.icon} {t.label}</div>
              <button onClick={()=>setEditEq(editing?null:t.id)} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer"}}>{editing?"Done ✓":"Edit"}</button>
            </div>
            {!editing&&<div style={{fontSize:12,color:"#888"}}>{s.days.length>0?s.days.map(d=>DAY_FULL[d]).join(", "):"No days set"} · Morning: {s.morningSlots} · Afternoon: {s.afternoonSlots}</div>}
            {editing&&(<>
              <div style={{fontSize:12,color:"#666",marginBottom:6}}>Available days:</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>{[1,2,3,4,5].map(d=>{const on=s.days.includes(d);return<button key={d} onClick={()=>toggleDay(t.id,d)} style={{padding:"6px 12px",borderRadius:8,border:"none",background:on?TEAL:"#f0f0f0",color:on?"#fff":"#666",fontSize:12,cursor:"pointer",fontFamily:"sans-serif"}}>{DAY_FULL[d]}</button>;})}</div>
              <div style={{display:"flex",gap:12}}>{[["morningSlots","🌅 Morning"],["afternoonSlots","🌆 Afternoon"]].map(([k,l])=>(
                <div key={k} style={{flex:1}}><div style={{fontSize:12,color:"#666",marginBottom:6}}>{l} slots</div><div style={{display:"flex",gap:6}}>{[1,2,3].map(n=><button key={n} onClick={()=>updateSchedule(t.id,k,n)} style={{width:36,height:36,borderRadius:8,border:"none",background:s[k]===n?BLUE:"#f0f0f0",color:s[k]===n?"#fff":"#666",fontSize:13,cursor:"pointer",fontWeight:500,fontFamily:"sans-serif"}}>{n}</button>)}</div></div>
              ))}</div>
            </>)}
          </div>
        );})}
      </>)}

      {/* ── BLOCKS ── */}
      {dashTab==="blocks"&&(<>
        <div style={{fontSize:15,fontWeight:500,marginBottom:4}}>Block dates</div>
        <div style={{fontSize:13,color:"#888",marginBottom:16}}>Block specific dates — leave, maintenance, public holidays</div>
        <div style={{background:"#fff",border:"0.5px solid #e0e0e0",borderRadius:12,padding:"14px 16px",marginBottom:16}}>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Date to block</label><input type="date" style={ipt} value={blockDate} onChange={e=>setBlockDate(e.target.value)}/></div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:"#666",display:"block",marginBottom:4}}>Reason (students will see this)</label><input style={ipt} value={blockReason} onChange={e=>setBlockReason(e.target.value)} placeholder="e.g. Maintenance day, On leave, Public holiday"/></div>
          <Btn onClick={addBlock} disabled={!blockDate||!blockReason.trim()} full>Block this date</Btn>
        </div>
        {Object.keys(blocks).length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#aaa",fontSize:14}}>No dates blocked yet</div>}
        {Object.entries(blocks).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>(
          <div key={k} style={{background:"#fff",border:"0.5px solid #fcc",borderRadius:10,padding:"12px 14px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:500,fontSize:14,color:"#e24b4a"}}>🚫 {k}</div><div style={{fontSize:13,color:"#666",marginTop:2}}>{v.reason}</div></div>
            <button onClick={()=>removeBlock(k)} style={{background:"none",border:"none",color:"#aaa",fontSize:18,cursor:"pointer"}}>×</button>
          </div>
        ))}
      </>)}
    </div>
  );
}
