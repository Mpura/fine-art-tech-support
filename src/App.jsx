import { useState, useEffect, useRef, Fragment } from "react";
import {
  TEAL, BLUE, AMBER, RED, TYPE_COLOR,
  EQ_TABLE, CHECKOUT_TABLE, FINES_TABLE, MEMBERS_TABLE, REQUESTS_TABLE, MAINT_TABLE, PM_TABLE, SETTINGS_TABLE, SETTINGS_RECS,
  YEAR_LABELS, REQUEST_TYPES, BOOKABLE, LAB_IDS, DEFAULT_SCHEDULE,
  STATUSES, AV_STATUSES, LASER_STATUSES, EQ_STATUSES, statusStyle,
  MONTHS, DAYS_SHORT, DAY_FULL, KEYS, DEFAULT_LICENCES, DEFAULT_EQ_SETTINGS,
  EQ_COL_DAYS, EQ_COL_SLOTS, isEqColDay, RUSH_MODE,
  genId, toKey, fmt, fmtDate, todayISO, todayDate, localDateStr,
  addBusinessDays, addCalendarDays, nextEqColDay, countBizDaysLate, accessoryCost,
  CAL_DATA_YEAR, PUBLIC_HOLIDAYS_2026, RECESS_RANGES, SWOT_RANGES, getDateStatus,
  ipt, pill, Btn,
} from "./shared.jsx";
import { verifyStaffPin, atGet, atPost, atPatch, atDelete, saveSetting } from "./lib/airtable.js";
import { archiveSummary, reqToAirtable, airtableToReq, lookupStudent } from "./lib/requests.js";
import { sendConfirmationEmail, sendStatusEmail } from "./lib/email.js";
import { fetchEquipment, createEquipmentBooking, saveFineRecord, fetchEqImagesByIds, fetchFinesForStudent, fetchFinesForMonth, settleLostItemFine, settleFine } from "./lib/equipment.js";
import BudgetPanel from "./panels/BudgetPanel.jsx";
import InsurancePanel from "./panels/InsurancePanel.jsx";
import PmPanel from "./panels/PmPanel.jsx";
import HsPanel from "./panels/HsPanel.jsx";
import SuppliersPanel from "./panels/SuppliersPanel.jsx";

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
  const [queueSearch, setQueueSearch] = useState("");
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
    if(step===2)return !!avWiz.eventDate&&!!avWiz.setupDate&&!!avWiz.setupTime;
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
  const [pinChecking, setPinChecking] = useState(false);
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
  const [eqManualDue, setEqManualDue] = useState("");
  const [pmDueToday, setPmDueToday] = useState([]);
  const [pmPerUse, setPmPerUse] = useState([]);

  const type = REQUEST_TYPES.find(t=>t.id===selType);
  const getLoanDays = (yearStr) => {
    const y = String(yearStr);
    if (y==="3") return eqSettings.yr3Days??2;
    if (["4","m","s"].includes(y)) return eqSettings.yr34Days;
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
  const persist=(key,data)=>{try{localStorage.setItem(key,JSON.stringify(data));}catch(e){}};

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
    // Shared settings come from Airtable so leave mode, blocks, schedules and
    // the PIN apply on every device (localStorage above is just a fast cache)
    atGet(SETTINGS_TABLE,{maxRecords:10}).then(d=>{
      for(const r of d.records||[]){
        let val;try{val=JSON.parse(r.fields?.Value||"null");}catch(e){continue;}
        if(val==null)continue;
        const key=r.fields?.Name;
        if(key==="leave"){setLeaveMode(val);persist(KEYS.leave,val);}
        else if(key==="blocks"){setBlocks(val);persist(KEYS.block,val);}
        else if(key==="schedule"){setSchedule(val);persist(KEYS.sched,val);}
        else if(key==="eqSettings"){setEqSettings(val);localStorage.setItem(KEYS.eqSet,JSON.stringify(val));}
        // "pin" is never returned by the server — verified server-side via VERIFY_PIN
      }
    }).catch(()=>{});
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
      const all=(d.records||[]).map(r=>({id:r.id,...r.fields}));
      // Date-based: due today or overdue (excludes Per Use — those are shown separately)
      const due=all.filter(t=>t.Interval!=="Per Use"&&t.NextDue&&t.NextDue<=today);
      // Per Use: laser checklist tasks — shown whenever there are laser sessions today
      const perUse=all.filter(t=>t.Interval==="Per Use");
      setPmDueToday(due);
      setPmPerUse(perUse);
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
    // Walk-ins are logged by staff from typed fields — no verified student session
    if(isWalkIn){if(!form.name.trim()||!selType)return;}
    else if(isExt){if(!extForm.name.trim()||!selType)return;}
    else{if(!verifiedStudent||!selType)return;}
    const _schedDate=
      selType==="studio"&&form.studioDate&&form.studioSlot?`${form.studioDate} (${EQ_COL_SLOTS.find(s=>s.id===form.studioSlot)?.label||form.studioSlot})`:
      selType==="3d"&&form.dropOffDate?`Drop-off: ${fmtDate(form.dropOffDate)}`:
      type.bookable&&selDate?`${selDate} (${selSlot==="morning"?"Morning 09:00–12:00":"Afternoon 13:00–16:00"})`:
      form.when==="later"&&!isWalkIn?form.schedDate:null;
    const req={id:genId(),
      name:isWalkIn?form.name.trim():isExt?extForm.name.trim():verifiedStudent.name,
      studNo:isWalkIn?form.studNo.trim():isExt?"":verifiedStudent?.studNo||"",
      year:isWalkIn?form.year||"":isExt?"":verifiedStudent?.year||"",
      studentEmail:isWalkIn||isExt?null:verifiedStudent?.email||null,
      affiliation:isExt?extForm.affiliation.trim():"",contact:isExt?extForm.contact.trim():"",type:type.label,typeId:selType,when:isWalkIn?"walkin":(type.bookable&&selDate)||(selType==="studio"&&form.studioDate)||(selType==="3d"&&form.dropOffDate)?"booked":form.when,schedDate:_schedDate,notes:form.notes.trim(),details:getDetails(),status:"Pending",staffNote:"",isWalkIn,isExternal:isExt&&!isWalkIn,createdAt:todayISO(),updatedAt:todayISO()};
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
    const _emailStatuses=["Confirmed","Ready to collect","Declined","Cancelled","Material test required","Ready to cut"];
    const _doneEmail=status==="Done"&&["query","print","3d"].includes(req?.typeId);
    if(req&&(_emailStatuses.includes(status)||_doneEmail)){
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
    // Lost items are ticked as "returning" in the modal UI before being marked lost —
    // exclude them here so they aren't checked back into stock or listed as returned
    const nowReturning=returningNames.filter(n=>!alreadyReturned.includes(n)&&!lostItemNames.includes(n));
    const allReturnedAfter=[...alreadyReturned,...nowReturning];
    const allBack=allItemNames.every(n=>allReturnedAfter.includes(n)||lostItemNames.includes(n));
    const lateDays=allBack&&req.dueDate?countBizDaysLate(req.dueDate,today):0;
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
  async function markItemFound(req, itemName) {
    const today = todayDate();
    const newLostItems = (req.lostItems||[]).filter(n=>n!==itemName);
    const newReturnedItems = [...(req.returnedItems||[]), itemName];
    const allItemNames = (req.details?.itemsData||[]).map(i=>i.name);
    const allBack = allItemNames.every(n=>newReturnedItems.includes(n));
    const newStatus = allBack ? "Returned" : req.status;
    updateReq(req.id, {status:newStatus, returnedItems:newReturnedItems, lostItems:newLostItems, ...(allBack&&!req.returnedAt?{returnedAt:today}:{})});
    try { await settleLostItemFine(req.id, itemName); } catch(e) {}
  }
  function saveNote(id){
    const note=staffNotes[id]||"";
    const req=requests.find(r=>r.id===id);
    if(req?.airtableId){atPatch(REQUESTS_TABLE,req.airtableId,{StaffNote:note,UpdatedAt:todayISO()}).catch(()=>{});}
    const u=requests.map(r=>r.id===id?{...r,staffNote:note,updatedAt:todayISO()}:r);setRequests(u);persist(KEYS.req,u);
  }
  function updateSchedule(eqId,field,val){const u={...schedule,[eqId]:{...schedule[eqId],[field]:val}};setSchedule(u);persist(KEYS.sched,u);saveSetting("schedule",u);}
  function toggleDay(eqId,day){const curr=schedule[eqId]?.days||[];const u={...schedule,[eqId]:{...schedule[eqId],days:curr.includes(day)?curr.filter(d=>d!==day):[...curr,day].sort()}};setSchedule(u);persist(KEYS.sched,u);saveSetting("schedule",u);}
  function addBlock(){if(!blockDate||!blockReason.trim())return;const u={...blocks,[blockDate]:{reason:blockReason.trim(),createdAt:todayISO()}};setBlocks(u);persist(KEYS.block,u);saveSetting("blocks",u);setBlockDate("");setBlockReason("");}
  function removeBlock(k){const u={...blocks};delete u[k];setBlocks(u);persist(KEYS.block,u);saveSetting("blocks",u);}
  function logMaintenance(){if(!maintForm.equipmentId||!maintForm.date)return;const log={id:genId(),...maintForm,createdAt:todayISO()};const u=[log,...maintLogs];setMaintLogs(u);persist(KEYS.maint,u);setMaintForm({equipmentId:"",date:"",notes:"",status:"Done",duration:""});}
  function toggleLeave(){const u=leaveMode.active?{active:false,returnDate:"",message:""}:{...leaveMode,active:true};setLeaveMode(u);persist(KEYS.leave,u);saveSetting("leave",u);}
  function saveLeave(){persist(KEYS.leave,leaveMode);saveSetting("leave",leaveMode);}
  function addLicence(){if(!licForm.software.trim())return;const lic={id:genId(),...licForm,seats:Number(licForm.seats)||1,createdAt:todayISO()};const u=[lic,...licences];setLicences(u);persist(KEYS.lic,u);setLicForm({software:"",vendor:"",vendorContact:"",vendorPhone:"",poNumber:"",licenceNo:"",importCode:"",partNo:"",seats:"1",effectiveDate:todayDate(),expiryDate:"",notes:""});setShowLicForm(false);}
  function deleteLicence(id){if(!window.confirm("Delete this licence record?"))return;const u=licences.filter(l=>l.id!==id);setLicences(u);persist(KEYS.lic,u);}
  function licStatus(l){if(!l.expiryDate)return{label:"Perpetual",bg:"#0a2218",color:"#20B07F"};const days=Math.floor((new Date(l.expiryDate+"T00:00:00")-new Date())/86400000);if(days<0)return{label:"Expired",bg:"#2a0f14",color:"#f87171"};if(days<=60)return{label:`Expires in ${days}d`,bg:"#2a1f0a",color:"#d4851a"};return{label:`Active · exp ${fmtDate(l.expiryDate)}`,bg:"#0a2218",color:"#20B07F"};}

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
  // Auto-fill + re-run the last search when the student opens the check screen
  useEffect(()=>{
    if(view!=="student"||screen!=="check")return;
    const saved=localStorage.getItem("fats_last_check");
    if(saved&&!checkStudNo&&checkResults===null){setCheckStudNo(saved);runCheckSearch(saved);}
  },[view,screen]);

  async function tryStaffUnlock(){
    if(!pinInput||pinChecking)return;
    setPinChecking(true);setPinErr("");
    const ok=await verifyStaffPin(pinInput);
    setPinChecking(false);
    if(ok){
      sessionStorage.setItem("fats_staff_unlocked","1");
      sessionStorage.setItem("fats_staff_pin",pinInput);
      setStaffUnlocked(true);setView("dashboard");setScreen("home");setPinInput("");
    } else {
      setPinErr("Incorrect PIN. Try again.");
    }
  }

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

  // schedDate is stored as "YYYY-MM-DD (Morning 09:00–12:00)" — match on the word, not "(Morning)"
  function getBookings(eqId,dateKey,slot){return requests.filter(r=>r.typeId===eqId&&r.schedDate&&r.schedDate.startsWith(dateKey)&&r.schedDate.includes(slot==="morning"?"Morning":"Afternoon")&&r.status!=="Declined"&&r.status!=="Cancelled").length;}

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
    if(!eqColDate||(!eqIsWalkIn&&!eqSlot)||selItems.length===0)return;
    const autoDue=addCalendarDays(eqColDate,getLoanDays(eqStudent.year));
    const due=eqIsWalkIn&&eqManualDue?eqManualDue:autoDue;
    const slotLabel=eqIsWalkIn?"Walk-in":(EQ_COL_SLOTS.find(s=>s.id===eqSlot)?.label||eqSlot);
    const initStatus=eqIsWalkIn?"Confirmed":"Pending";
    setEqSubmitting(true);
    try{await createEquipmentBooking(eqStudent,selItems,eqColDate,eqSlot||"walkin",due,eqNotes);}catch(e){}
    const req={id:genId(),name:eqStudent.name,studNo:eqStudent.studNo,year:eqStudent.year,studentId:eqStudent.studentId,studentEmail:eqStudent.email||null,type:"Equipment booking",typeId:"equipment",when:"booked",schedDate:`${eqColDate} (${slotLabel})`,notes:eqNotes,details:{items:selItems.map(i=>i.name).join(", "),itemsData:selItems.map(i=>({id:i.id,name:i.name,type:i.type||"",image:i.image||"",replacementCost:i.replacementCost||500,accessories:i.accessories||[]}))},dueDate:due,collectedAt:null,returnedAt:null,returnedItems:[],checkInNotes:"",lostItems:[],lateDays:0,lateFine:0,status:initStatus,staffNote:"",isWalkIn:eqIsWalkIn,createdAt:todayISO(),updatedAt:todayISO()};
    const u=[req,...requests];setRequests(u);persist(KEYS.req,u);
    setEqScreen("success");setEqSubmitting(false);setEqIsWalkIn(false);
    try{
      const result=await atPost(REQUESTS_TABLE,reqToAirtable(req));
      if(result.id){setRequests(prev=>prev.map(r=>r.id===req.id?{...r,airtableId:result.id}:r));}
      else{console.error("FATS: eq request save failed",result);}
    }catch(e){console.error("FATS: eq request save error",e);}
    sendConfirmationEmail(req);
  }
  function resetEq(){setEqScreen("lookup");setEqStudNo("");setEqStudent(null);setEquipment([]);setSelItems([]);setEqFilter("All");setEqSearch("");setEqColDate("");setEqSlot("");setEqNotes("");setEqTermsAgreed(false);setEqLookupErr("");setEqErr("");setEqManualDue("");}

  const eqTypes=["All",...new Set(equipment.map(e=>e.type).filter(Boolean))];
  const eqFiltered=equipment.filter(e=>(eqFilter==="All"||e.type===eqFilter)&&(!eqSearch||e.name?.toLowerCase().includes(eqSearch.toLowerCase())));
  const sortedRequests=[...requests].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const statusFiltered=filterStatus==="All"?sortedRequests:sortedRequests.filter(r=>r.status===filterStatus);
  const filtered=queueSearch.trim()?statusFiltered.filter(r=>r.name?.toLowerCase().includes(queueSearch.toLowerCase())||r.studNo?.toLowerCase().includes(queueSearch.toLowerCase())):statusFiltered;
  const QUEUE_DONE=["Done","Declined","Cancelled","Returned","Uncollected"];
  const queueActive=filtered.filter(r=>!QUEUE_DONE.includes(r.status));
  const queueArchive=filtered.filter(r=>QUEUE_DONE.includes(r.status));
  const allStatuses=["All",...["Pending","Confirmed","In Progress","Material test required","Ready to cut","Done","Ready to collect","Collected","Partially Returned","Returned","Uncollected","Declined","Cancelled"]];
  const counts=STATUSES.reduce((a,s)=>({...a,[s]:requests.filter(r=>r.status===s).length}),{});
  // ── TODAY FILTERS ────────────────────────────────────────────────
  const _today=todayDate();
  const morningToday=requests.filter(r=>r.schedDate?.startsWith(_today)&&r.schedDate.includes("Morning")&&["print","laser"].includes(r.typeId)&&r.status!=="Declined"&&r.status!=="Done"&&r.status!=="Cancelled");
  const afternoonToday=requests.filter(r=>r.schedDate?.startsWith(_today)&&r.schedDate.includes("Afternoon")&&["print","laser"].includes(r.typeId)&&r.status!=="Declined"&&r.status!=="Done"&&r.status!=="Cancelled");
  const studioToday=requests.filter(r=>r.typeId==="studio"&&r.schedDate?.startsWith(_today)&&r.status!=="Declined"&&r.status!=="Done"&&r.status!=="Cancelled");
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
        <input type="password" inputMode="numeric" maxLength={6} style={{...ipt,textAlign:"center",fontSize:24,letterSpacing:"0.4em",maxWidth:200,margin:"0 auto 16px"}} value={pinInput} onChange={e=>{setPinInput(e.target.value);setPinErr("");}} onKeyDown={e=>e.key==="Enter"&&tryStaffUnlock()}  placeholder="••••" autoFocus/>
        {pinErr&&<div style={{fontSize:13,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"10px 12px",marginBottom:16}}>{pinErr}</div>}
        <Btn full style={{maxWidth:200,margin:"0 auto",display:"block"}} onClick={tryStaffUnlock} disabled={pinChecking}>{pinChecking?"Checking…":"Unlock →"}</Btn>
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
        function bookAgain(req){
          const d=req.details||{};
          setForm(f=>({...f,material:d.material||"",materialThickness:d.materialThickness||"",dimensions:d.dimensions||"",jobType:d.jobType||"Cut",sessionDuration:d.sessionDuration||"",fileLink:"",firstTime:false,paperSize:d.paperSize||"",paperType:d.paperType||"",colour:d.colour||"Colour",copies:d.copies||"",material3d:d.material3d||"",infill:d.infill||"",shootType:d.shootType||""}));
          setSelType(req.typeId);setPrepOk(false);setSelDate(null);setSelSlot(null);setScreen("prep");
        }
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
              📅 Return by: <strong>{fmtDate(req.dueDate)}</strong> before {eqSettings.returnByHour||10}:00{req.status==="Collected"&&new Date()>new Date(req.dueDate+"T00:00:00")?" — OVERDUE":""}
            </div>
          )}
          {req.status==="Confirmed"&&<div style={{background:"#0a2218",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#20B07F",marginBottom:6}}>{req.typeId==="equipment"?"⏳ Booking confirmed — your slot is reserved. Wait for a \"Ready to collect\" notification before coming in.":`✅ Booking confirmed — your slot is reserved${req.schedDate?` for ${req.schedDate.split(" ")[0]}`:""}.  Come in at your booked time.`}</div>}
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
          {req.status==="Done"&&["laser","print","3d","studio"].includes(req.typeId)&&(
            <button onClick={()=>bookAgain(req)} style={{marginTop:8,width:"100%",background:"#0a1e35",border:"0.5px solid #1e3a5f",borderRadius:8,padding:"9px 14px",color:"#60a5fa",fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}>↩ Book again with same details</button>
          )}
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
      {(myFinesLoading||myFines!==null)&&(()=>{
        const today=todayDate();
        const accruing=(checkResults||[]).filter(r=>r.typeId==="equipment"&&r.dueDate&&r.dueDate<today&&["Collected","Partially Returned"].includes(r.status)).map(r=>({req:r,days:countBizDaysLate(r.dueDate,today),fine:countBizDaysLate(r.dueDate,today)*(eqSettings.dailyRate||50)})).filter(a=>a.days>0);
        return(
        <div style={{marginTop:8}}>
          <div style={{fontSize:15,fontWeight:500,color:"#e0e3ea",marginBottom:4}}>💳 Your outstanding charges</div>
          {myFinesLoading&&<div style={{textAlign:"center",padding:"1rem",color:"#6b7280",fontSize:13}}>Loading charges...</div>}
          {!myFinesLoading&&myFines!==null&&(()=>{
            const unsettled=myFines.filter(f=>!f["Settled"]);
            const savedTotal=unsettled.reduce((s,f)=>s+(f["Amount (R)"]||0),0);
            const accruingTotal=accruing.reduce((s,a)=>s+a.fine,0);
            const grandTotal=savedTotal+accruingTotal;
            if(unsettled.length===0&&accruing.length===0)return<div style={{background:"#0a2218",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#20B07F"}}>✅ No outstanding charges — keep it up!</div>;
            return(<>
              {accruing.length>0&&(
                <div style={{background:"#1a1200",border:"0.5px solid #d4851a",borderRadius:10,overflow:"hidden",marginBottom:8}}>
                  <div style={{fontSize:11,color:"#d4851a",fontWeight:600,padding:"6px 12px",background:"#2a1f0a",letterSpacing:"0.05em",textTransform:"uppercase"}}>⏳ Accruing — +R{eqSettings.dailyRate||50}/day until returned</div>
                  {accruing.map((a,i)=>(
                    <div key={a.req.id} style={{display:"grid",gridTemplateColumns:"1fr auto",gap:8,fontSize:12,color:"#e0e3ea",padding:"10px 12px",borderTop:i>0?"0.5px solid #2a2000":"none",alignItems:"center"}}>
                      <div>
                        <div style={{color:"#d4851a",fontWeight:500}}>Late return — {a.days} day{a.days!==1?"s":""} overdue</div>
                        <div style={{color:"#6b7280",fontSize:11}}>Due {fmtDate(a.req.dueDate)} · {(a.req.details?.itemsData||[]).map(i=>i.name).join(", ")||"Equipment"}</div>
                      </div>
                      <span style={{fontWeight:600,color:"#d4851a",whiteSpace:"nowrap"}}>R{a.fine}</span>
                    </div>
                  ))}
                </div>
              )}
              {unsettled.length>0&&(
                <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,overflow:"hidden",marginBottom:8}}>
                  {unsettled.map((f,i)=>(
                    <div key={f.id||i} style={{display:"grid",gridTemplateColumns:"1fr auto auto",gap:8,fontSize:12,color:"#e0e3ea",padding:"10px 12px",borderTop:i>0?"0.5px solid #1e2130":"none",alignItems:"center"}}>
                      <div><div style={{color:f["Type"]==="Late Return"?"#c2410c":"#b91c1c",fontWeight:500}}>{f["Type"]}</div><div style={{color:"#6b7280",fontSize:11}}>{f["Item Name"]} · {f["Date"]||""}</div></div>
                      <span style={{fontWeight:600}}>R{f["Amount (R)"]||0}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{background:"#2a0f14",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#f87171",fontWeight:600,marginBottom:6}}>Total owed: R{grandTotal}</div>
              <div style={{fontSize:12,color:"#374151"}}>Charges are added to your student account by the department at month end.</div>
            </>);
          })()}
        </div>
        );
      })()}
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
          <input style={{...ipt,fontSize:16,letterSpacing:"0.05em"}} value={eqStudNo} onChange={e=>setEqStudNo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleEqLookup()} placeholder="e.g. g25K7744 or your name" autoFocus/>
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
        {/* ── Walk-in banner ── */}
        {eqIsWalkIn&&<div style={{background:"#0a1e35",border:"0.5px solid #1e3a5f",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:12,color:"#60a5fa"}}>🏃 Walk-in mode — date and return restrictions are bypassed. Set dates manually below.</div>}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>{eqIsWalkIn?"Collection / checkout date *":"Collection date *"}</label>
          <input type="date" style={ipt} value={eqColDate}
            {...(!eqIsWalkIn&&{min:getEqMinDate(),max:addBusinessDays(todayDate(),eqSettings.maxAdvanceDays)})}
            onChange={e=>{setEqColDate(e.target.value);setEqSlot("");setEqManualDue("");}}/>
          {!eqIsWalkIn&&<div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Collection days: <strong>Mon, Wed, Fri</strong> only (stockroom hours 11:00–12:30). Book up to {eqSettings.maxAdvanceDays} day{eqSettings.maxAdvanceDays!==1?"s":""} ahead. Bookings close at {eqSettings.collectionDeadlineHour}:00.</div>}
          {!eqIsWalkIn&&eqColDate&&!isEqColDay(eqColDate)&&<div style={{fontSize:12,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"8px 10px",marginTop:6}}>⚠️ That date is not a stockroom day. Please pick a Monday, Wednesday or Friday.</div>}
          {!eqIsWalkIn&&eqColDate&&isEqColDay(eqColDate)&&(()=>{const ds=getDateStatus(eqColDate);if(!ds)return null;if(ds.type==="blocked")return<div style={{fontSize:12,color:"#f87171",background:"#2a0f14",borderRadius:8,padding:"8px 10px",marginTop:6}}>🚫 {ds.label} — the stockroom is closed on this date. Please choose a different day.</div>;if(ds.type==="swot")return<div style={{fontSize:12,color:"#60a5fa",background:"#0a1e35",borderRadius:8,padding:"8px 10px",marginTop:6}}>📚 {ds.label} — stockroom is open. Good luck with your studies!</div>;return null;})()}
        </div>
        {/* Due date — manual for walk-ins, auto-calculated for bookings */}
        {eqColDate&&(eqIsWalkIn?true:(isEqColDay(eqColDate)&&getDateStatus(eqColDate)?.type!=="blocked"))&&(
          eqIsWalkIn?(
            <div style={{marginBottom:14}}>
              <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Return / due date * <span style={{fontWeight:400,color:"#4b5563"}}>(set manually)</span></label>
              <input type="date" style={ipt} value={eqManualDue||eqDueDate}
                min={eqColDate}
                onChange={e=>setEqManualDue(e.target.value)}/>
              {(eqManualDue||eqDueDate)&&<div style={{fontSize:12,color:"#20B07F",marginTop:4}}>↩ Equipment due back: <strong>{fmtDate(eqManualDue||eqDueDate)}</strong></div>}
            </div>
          ):(
            <div style={{background:"#0a2218",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#20B07F"}}>
              📅 Equipment due back: <strong>{fmtDate(eqDueDate)}</strong> <span style={{fontSize:12,opacity:0.8}}>({getLoanDays(eqStudent?.year)} business days for {YEAR_LABELS[eqStudent?.year]||`Year ${eqStudent?.year}`})</span>
            </div>
          )
        )}
        {/* Slot picker — only for regular bookings */}
        {!eqIsWalkIn&&eqColDate&&isEqColDay(eqColDate)&&getDateStatus(eqColDate)?.type!=="blocked"&&(
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
        <div style={{marginBottom:20}}><label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:4}}>Notes (optional)</label><textarea style={{...ipt,resize:"vertical"}} rows={2} value={eqNotes} onChange={e=>setEqNotes(e.target.value)} placeholder={eqIsWalkIn?"e.g. Checked out for exam on 2 June — agreed to terms verbally":"e.g. Need camera for location shoot Thursday"}/></div>
        {/* Borrowing terms — shown for student bookings, skipped for walk-ins */}
        {!eqIsWalkIn&&(<>
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
        </>)}
        <Btn onClick={submitEqRequest}
          disabled={eqSubmitting||selItems.length===0||!eqColDate||(eqIsWalkIn?!(eqManualDue||eqDueDate):(!isEqColDay(eqColDate)||getDateStatus(eqColDate)?.type==="blocked"||!eqSlot||!eqTermsAgreed))}
          full style={{padding:"13px",fontSize:15}}>
          {eqSubmitting?"Submitting...":(eqIsWalkIn?"✅ Log walk-in checkout":"Submit equipment request")}
        </Btn>
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
            style={{flex:1,padding:"8px",borderRadius:8,background:visitorType===v?"#1a1d28":"transparent",color:visitorType===v?"#e0e3ea":"#9ca3af",fontSize:13,fontWeight:visitorType===v?600:400,border:"none",cursor:"pointer",fontFamily:"inherit",outline:visitorType===v?"1px solid #1e2130":"none"}}>{l}</button>
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
                <label style={{fontSize:13,color:"#9ca3af",display:"block",marginBottom:6}}>Preferred setup / arrival time *</label>
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
                  <Fragment key={k}><span style={{fontSize:12,color:"#4b5563",whiteSpace:"nowrap"}}>{k}</span><span style={{fontSize:12,color:"#c9cdd6"}}>{v}</span></Fragment>
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
  if(view==="dashboard"){return(
    <div style={isDesktop?{display:"flex",minHeight:"100vh",background:"#0F1117",alignItems:"flex-start",margin:"-24px -16px -48px",width:"calc(100% + 32px)"}:{maxWidth:680,margin:"0 auto",padding:"1.5rem 1.25rem"}}>
      {isDesktop&&(
        <div style={{width:200,background:"#0a0d14",borderRight:"0.5px solid #1e2130",padding:"14px 10px",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowY:"auto",display:"flex",flexDirection:"column"}}>
          <div style={{marginBottom:18}}><div style={{fontSize:13,fontWeight:500,color:"#e0e3ea"}}>FATS</div><div style={{fontSize:10,color:"#4b5563",marginTop:2}}>Fine Art Department</div></div>
          <div style={{fontSize:10,color:"#4b5563",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,marginBottom:6,paddingLeft:6}}>Views</div>
          {[["today",`📅 Today · ${new Date().getDate()}`],["queue","📋 All requests"]].map(([v,l])=>(
            <div key={v} onClick={()=>setDashTab(v)} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:dashTab===v?"#e0e3ea":"#6b7280",background:dashTab===v?"#141720":"transparent",cursor:"pointer",marginBottom:2}}>{l}</div>
          ))}
          <div style={{fontSize:10,color:"#4b5563",letterSpacing:"0.06em",textTransform:"uppercase",fontWeight:500,marginBottom:6,paddingLeft:6,marginTop:14}}>Manage</div>
          {[["hs","🦺 H&S / Maintenance"],["pm","🔧 PM Schedule"],["schedule","🗓 Schedule"],["blocks","🚫 Blocks"],["charges","💳 Charges"],["lic","🔑 Licences"],["insurance","🛡 Insurance"],["budget","📊 Budget / ACE"],["suppliers","🏷 Suppliers"]].map(([v,l])=>(
            <div key={v} onClick={()=>setDashTab(v)} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:dashTab===v?"#e0e3ea":"#6b7280",background:dashTab===v?"#141720":"transparent",cursor:"pointer",marginBottom:2}}>{l}</div>
          ))}
          <div style={{marginTop:"auto",paddingTop:16,borderTop:"0.5px solid #1e2130"}}>
            <a href="/laser-staff-guide.html" target="_blank" rel="noreferrer" style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:"#6b7280",textDecoration:"none",marginBottom:4}}>⚡ Laser Operator Guide</a>
            <div onClick={()=>{sessionStorage.removeItem("fats_staff_unlocked");sessionStorage.removeItem("fats_staff_pin");setStaffUnlocked(false);setView("student");}} style={{display:"flex",alignItems:"center",padding:"7px 8px",borderRadius:7,fontSize:12,color:"#6b7280",cursor:"pointer"}}>🔒 Lock</div>
          </div>
        </div>
      )}
      {!isDesktop&&<TabBar/>}
      <div style={isDesktop?{flex:1,overflowX:"hidden",padding:"1.5rem 1.25rem"}:{}}>

      {/* ── Compact staff control bar ── */}
      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:12,background:leaveMode.active?"#2a1f0a":"#141720",border:`0.5px solid ${leaveMode.active?"#5a3a0a":"#1e2130"}`,borderRadius:10,padding:"8px 12px"}}>
        <span style={{fontSize:13,fontWeight:500,color:leaveMode.active?"#d4851a":"#20B07F",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{leaveMode.active?"🏖️ Leave mode ON":"🟢 Active"}</span>
        <Btn small onClick={toggleLeave} color={leaveMode.active?TEAL:AMBER} style={{flexShrink:0}}>{leaveMode.active?"Go active":"Leave"}</Btn>
        <button onClick={()=>{sessionStorage.removeItem("fats_staff_unlocked");sessionStorage.removeItem("fats_staff_pin");setStaffUnlocked(false);setView("student");}} style={{padding:"5px 10px",borderRadius:7,background:"#0f1117",border:"0.5px solid #1e2130",fontSize:12,color:"#6b7280",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>🔒</button>
        <button onClick={()=>{setChangingPin(p=>!p);setNewPin("");}} style={{padding:"5px 10px",borderRadius:7,background:changingPin?"#1a1d28":"#0f1117",border:`0.5px solid ${changingPin?"#3b82f6":"#1e2130"}`,fontSize:12,color:changingPin?"#3b82f6":"#6b7280",cursor:"pointer",fontFamily:"inherit",flexShrink:0}} title="Change PIN">⚙</button>
      </div>
      {new Date().getFullYear()>CAL_DATA_YEAR&&(
        <div style={{background:"#2a0f14",border:"0.5px solid #7f1d1d",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#f87171"}}>
          ⚠️ The university calendar (public holidays, recess dates) in this app is for {CAL_DATA_YEAR} — holiday and vacation blocking is no longer applied. Ask your developer to update it from the new Rhodes Diary.
        </div>
      )}
      {leaveMode.active&&(<div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
        <div style={{marginBottom:8}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Return date</label><input type="date" style={ipt} value={leaveMode.returnDate} onChange={e=>setLeaveMode(l=>({...l,returnDate:e.target.value}))}/></div>
        <div style={{marginBottom:8}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Message for students</label><input style={ipt} value={leaveMode.message} onChange={e=>setLeaveMode(l=>({...l,message:e.target.value}))} placeholder="e.g. Back after swot week"/></div>
        <Btn small onClick={saveLeave}>Save</Btn>
      </div>)}
      {changingPin&&(
        <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:10,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>Set a new staff PIN (4–6 digits). It applies on all devices.</div>
          <div style={{display:"flex",gap:8}}>
            <input type="password" inputMode="numeric" maxLength={6} style={{...ipt,flex:1,letterSpacing:"0.2em"}} value={newPin} onChange={e=>setNewPin(e.target.value)} placeholder="New PIN"/>
            <Btn small onClick={()=>{if(newPin.length>=4){saveSetting("pin",newPin).then(()=>{sessionStorage.setItem("fats_staff_pin",newPin);});setChangingPin(false);setNewPin("");}}} disabled={newPin.length<4}>Save</Btn>
          </div>
        </div>
      )}

      {/* Dash tabs */}
      {!isDesktop&&<div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>
        {[["today",`Today`],["queue","Queue"],["hs","H&S"],["pm","PM"],["schedule","Schedule"],["blocks","Blocks"],["charges","Charges"],["lic","Licences"],["insurance","Insurance"],["budget","Budget"]].map(([v,l])=>(
          <button key={v} onClick={()=>setDashTab(v)} style={{flex:"1 1 auto",padding:"7px 6px",borderRadius:8,background:dashTab===v?TEAL:"#141720",color:dashTab===v?"#fff":"#6b7280",fontSize:11,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:dashTab===v?"none":"0.5px solid #1e2130"}}>{l}</button>
        ))}
      </div>}

      <div>
      <div>
      {/* ── TODAY ── */}
      {dashTab==="today"&&(()=>{
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
          {/* Stats summary — scoped to today's workload, not all-time */}
          {(()=>{
            const todayReqs=requests.filter(r=>r.schedDate?.startsWith(_today)||r.details?.setupDate===_today||r.dueDate===_today);
            const tc=s=>todayReqs.filter(r=>r.status===s).length;
            return(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
            {[["Pending",tc("Pending")+tc("Confirmed"),"#d4851a","#2a1f0a"],["In Progress",tc("In Progress"),"#60a5fa","#0a1e35"],["Done",tc("Done")+tc("Returned")+tc("Collected"),"#20B07F","#0a2218"]].map(([l,n,col,bg])=>(
              <div key={l} style={{background:bg,borderRadius:8,padding:"10px 12px",border:`0.5px solid ${col}22`}}>
                <div style={{fontSize:22,fontWeight:500,color:col,lineHeight:1}}>{n}</div>
                <div style={{fontSize:10,color:col,marginTop:3}}>{l}</div>
              </div>
            ))}
          </div>
            );
          })()}
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
          {/* Per Use laser checklist — only shows on days with laser bookings */}
          {pmPerUse.length>0&&(morningToday.length>0||afternoonToday.length>0)&&(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:500,color:"#6b7280",marginBottom:8,display:"flex",alignItems:"center",gap:6,borderBottom:"1px solid #1e2130",paddingBottom:6}}>
                ⚡ Laser checklist <span style={{fontSize:11,fontWeight:400,color:"#a855f7"}}>· per use</span>
              </div>
              {pmPerUse.map(t=>{
                const lastDone=t.LastDone?`Last done: ${fmtDate(t.LastDone)}`:"Never logged";
                return(
                  <div key={t.id} style={{display:"flex",alignItems:"stretch",background:"#141720",borderRadius:10,marginBottom:8,overflow:"hidden",border:"0.5px solid #2d1a4a"}}>
                    <div style={{width:4,flexShrink:0,background:"#a855f7"}}/>
                    <div style={{flex:1,padding:"10px 12px",minWidth:0}}>
                      <div style={{fontSize:11,color:"#a855f7",fontWeight:600,marginBottom:2}}>Do before / after each session</div>
                      <div style={{fontSize:14,fontWeight:500,color:"#e0e3ea"}}>{t.TaskName}</div>
                      <div style={{fontSize:12,color:"#6b7280",marginTop:1}}>{t.Machine}{t.Notes?` · ${t.Notes}`:""} · <span style={{color:"#4b5563"}}>{lastDone}</span></div>
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
      <div>
      {/* ── QUEUE ── */}
      {dashTab==="queue"&&(<>
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
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <Btn outline color={TEAL} onClick={()=>{setScreen("walkin");setSelType(null);setForm(f=>({...f,name:"",studNo:"",year:"",notes:""}));}} style={{flexShrink:0}}>+ Walk-in</Btn>
          <input style={{...ipt,flex:1}} value={queueSearch} onChange={e=>setQueueSearch(e.target.value)} placeholder="Search name or student no…"/>
          <select style={{...ipt,flexShrink:0,width:"auto"}} value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>{allStatuses.map(s=><option key={s}>{s}</option>)}</select>
        </div>
        {!loaded&&<div style={{color:"#6b7280",fontSize:14}}>Loading...</div>}
        {loaded&&queueActive.length===0&&queueArchive.length===0&&<div style={{textAlign:"center",padding:"3rem",color:"#6b7280",fontSize:14}}>{queueSearch.trim()?"No results for that search":"No requests yet"}</div>}
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
              {req.lostItems?.length>0&&(
                <div style={{marginTop:8,background:"#1a0a00",border:"0.5px solid #d4851a",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:11,color:"#d4851a",fontWeight:600,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:6}}>Lost items</div>
                  {req.lostItems.map(name=>(
                    <div key={name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                      <span style={{color:"#e0e3ea"}}>❌ {name}</span>
                      <button onClick={()=>markItemFound(req,name)} style={{padding:"3px 10px",borderRadius:6,border:"0.5px solid #20B07F",background:"#0a2218",color:"#20B07F",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:500}}>✓ Found &amp; returned</button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={()=>setExpandId(expandId===req.id?null:req.id)} style={{fontSize:12,color:"#3b82f6",background:"none",border:"none",cursor:"pointer",padding:0}}>{expandId===req.id?"Hide note ▲":"Add / edit note ▼"}</button>
              {expandId===req.id&&(<div style={{marginTop:8,background:"#1a1d28",borderRadius:8,padding:"10px"}}>
                <textarea rows={2} placeholder="e.g. Files not ready — told to come back Thursday" defaultValue={req.staffNote} onChange={e=>setStaffNotes(n=>({...n,[req.id]:e.target.value}))} style={{...ipt,resize:"vertical",fontSize:13}}/>
                <Btn onClick={()=>{saveNote(req.id);setExpandId(null);}} color={BLUE} style={{marginTop:6,fontSize:13}}>Save note</Btn>
              </div>)}
            </div>
          );
        })}
        {/* ── ARCHIVE ── */}
        {queueArchive.length>0&&(
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
            <button onClick={()=>setEqSettingsForm(f=>f?null:{...DEFAULT_EQ_SETTINGS,...eqSettings})} style={{fontSize:12,color:BLUE,background:"none",border:"none",cursor:"pointer"}}>{eqSettingsForm?"Cancel":"Edit"}</button>
          </div>
          {!eqSettingsForm&&<div style={{fontSize:12,color:"#9ca3af",marginTop:8}}>Yr2: {eqSettings.yr12Days}d/{eqSettings.yr2Cap||2}items · Yr3: {eqSettings.yr3Days??2}d/{eqSettings.yr3Cap||3}items · Yr4+: {eqSettings.yr34Days}d/{eqSettings.yr4Cap||4}items · Masters/Staff: {eqSettings.mastersCap||5}items · Fee: R{eqSettings.dailyRate}/day · Return by: {eqSettings.returnByHour||10}:00 · Pickup: 12:00–13:00 · Slot cap: {eqSettings.slotCap||2}</div>}
          {eqSettingsForm&&(<div style={{display:"flex",flexDirection:"column",gap:10,marginTop:8}}>
            {[["Year 2 loan (calendar days)","yr12Days"],["Year 3 loan (calendar days)","yr3Days"],["Year 4+ loan (calendar days)","yr34Days"],["Late fee (R/day)","dailyRate"],["Max advance booking (days)","maxAdvanceDays"],["Booking deadline (hour, 24h)","collectionDeadlineHour"],["Return deadline (hour, 24h)","returnByHour"],["Max students per slot","slotCap"],["Max items — Year 2","yr2Cap"],["Max items — Year 3","yr3Cap"],["Max items — Year 4","yr4Cap"],["Max items — Masters/Staff","mastersCap"]].map(([label,key])=>(
              <div key={key} style={{display:"flex",alignItems:"center",gap:8}}>
                <label style={{fontSize:12,color:"#9ca3af",flex:1}}>{label}</label>
                <input type="number" style={{...ipt,width:70,flex:"0 0 auto"}} value={eqSettingsForm[key]} onChange={e=>setEqSettingsForm(f=>({...f,[key]:Number(e.target.value)}))}/>
              </div>
            ))}
            <Btn small onClick={()=>{setEqSettings(eqSettingsForm);localStorage.setItem(KEYS.eqSet,JSON.stringify(eqSettingsForm));saveSetting("eqSettings",eqSettingsForm);setEqSettingsForm(null);}}>Save settings</Btn>
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
        {(()=>{
          const today=todayDate();
          const overdue=requests.filter(r=>r.typeId==="equipment"&&r.dueDate&&r.dueDate<today&&["Collected","Partially Returned"].includes(r.status));
          if(overdue.length===0)return null;
          const total=overdue.reduce((s,r)=>s+countBizDaysLate(r.dueDate,today)*(eqSettings.dailyRate||50),0);
          return(
            <div style={{marginBottom:20}}>
              <div style={{fontSize:13,fontWeight:600,color:"#d4851a",marginBottom:8}}>⏳ Currently accruing</div>
              <div style={{background:"#141720",border:"0.5px solid #d4851a",borderRadius:12,overflow:"hidden",marginBottom:8}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:0,fontSize:11,color:"#6b7280",background:"#1a1d28",padding:"8px 12px",fontWeight:500}}>
                  <span>Student</span><span>Equipment</span><span>Overdue</span><span style={{textAlign:"right"}}>Running fine</span>
                </div>
                {overdue.map((r,i)=>{
                  const days=countBizDaysLate(r.dueDate,today);
                  const fine=days*(eqSettings.dailyRate||50);
                  return(
                    <div key={r.id} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr auto",gap:0,fontSize:12,color:"#e0e3ea",padding:"10px 12px",borderTop:i>0?"0.5px solid #1e2130":"none",alignItems:"center"}}>
                      <div><div style={{fontWeight:500}}>{r.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{r.studNo}</div></div>
                      <span style={{fontSize:11,color:"#9ca3af"}}>{(r.details?.itemsData||[]).map(i=>i.name).join(", ")||"—"}</span>
                      <span style={{color:"#f87171"}}>{days}d · due {fmtDate(r.dueDate)}</span>
                      <span style={{textAlign:"right",fontWeight:600,color:"#d4851a",whiteSpace:"nowrap",paddingLeft:8}}>R{fine}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{background:"#2a1f0a",borderRadius:10,padding:"10px 14px",fontSize:13,color:"#d4851a",fontWeight:600}}>Total accruing: R{total}</div>
            </div>
          );
        })()}
        <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
          <input type="month" style={{...ipt,flex:"0 0 auto",width:"auto"}} value={chargesMonth} onChange={e=>{setChargesMonth(e.target.value);setFines([]);}}/>
          <input style={{...ipt,flex:1}} value={chargesStudNo} onChange={e=>setChargesStudNo(e.target.value)} placeholder="Filter by student no..."/>
          <Btn small onClick={async()=>{setFinesLoading(true);try{const r=await fetchFinesForMonth(chargesMonth);setFines(r);}catch(e){}setFinesLoading(false);}}>Load</Btn>
        </div>
        {finesLoading&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>Loading charges...</div>}
        {!finesLoading&&(()=>{
          const filtered=fines.filter(f=>!f["Settled"]&&(!chargesStudNo||(f["Student No"]||"").toLowerCase().includes(chargesStudNo.toLowerCase())));
          const total=filtered.reduce((s,f)=>s+(f["Amount (R)"]||0),0);
          return(<>
            {filtered.length===0&&fines.length>0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>No unsettled charges{chargesStudNo?" matching that student number":""} for this month.</div>}
            {filtered.length===0&&fines.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>Click Load to fetch charges for this month.</div>}
            {filtered.length>0&&(<>
              <div style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,overflow:"hidden",marginBottom:12}}>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto auto",gap:0,fontSize:11,color:"#6b7280",background:"#1a1d28",padding:"8px 12px",fontWeight:500}}>
                  <span>Student</span><span>Date</span><span>Type</span><span>Item</span><span style={{textAlign:"right"}}>Amount</span><span/>
                </div>
                {filtered.map((f,i)=>(
                  <div key={f.id||i} style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto auto",gap:0,fontSize:12,color:"#e0e3ea",padding:"10px 12px",borderTop:"0.5px solid #1e2130",alignItems:"center"}}>
                    <div><div style={{fontWeight:500}}>{f["Student Name"]}</div><div style={{fontSize:11,color:"#6b7280"}}>{f["Student No"]}</div></div>
                    <span>{f["Date"]||""}</span>
                    <span style={{color:f["Type"]==="Late Return"?"#c2410c":"#b91c1c"}}>{f["Type"]}</span>
                    <span>{f["Item Name"]}</span>
                    <span style={{textAlign:"right",fontWeight:600,paddingRight:12}}>R{f["Amount (R)"]||0}</span>
                    <button onClick={async()=>{if(!f.id)return;await settleFine(f.id);setFines(prev=>prev.map(x=>x.id===f.id?{...x,Settled:true}:x));}} style={{padding:"3px 8px",borderRadius:6,border:"0.5px solid #374151",background:"#1a1d28",color:"#6b7280",fontSize:11,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap"}}>✓ Settle</button>
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
            <div key={lic.id} style={{background:"#141720",border:`0.5px solid ${st.label==="Expired"?"#c05050":st.label.startsWith("Expires in")?"#7a5a1a":"#1e2130"}`,borderRadius:14,padding:"16px 18px",marginBottom:12}}>
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

      {/* ── SUPPLIERS ── */}
      {dashTab==="suppliers"&&<SuppliersPanel/>}

      {/* ── CHECK-IN MODAL ── */}
      {checkInModal&&(()=>{
        const req=checkInModal;
        const allItemNames=(req.details?.itemsData||[]).map(i=>i.name);
        const alreadyReturned=req.returnedItems||[];
        const pendingItems=allItemNames.filter(n=>!alreadyReturned.includes(n));
        const today=todayDate();
        const allBack=ciReturning.length===pendingItems.length&&pendingItems.every(n=>ciReturning.includes(n));
        const lateDays=allBack&&req.dueDate?countBizDaysLate(req.dueDate,today):0;
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