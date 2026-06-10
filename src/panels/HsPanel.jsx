import { useState, useEffect } from "react";
import { TEAL, MAINT_TABLE, statusStyle, fmtDate, todayDate, genId, ipt, Btn } from "../shared.jsx";
import { atGet, atPost, atPatch, atDelete } from "../lib/airtable.js";

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
      // null (not undefined) so PATCH actually clears emptied fields — JSON drops undefined keys
      const baseFields={"Description":maintForm.description,"Location":maintForm.location,"ProblemType":maintForm.problemType||null,"Status":autoStatus,"UniversityRef":maintForm.universityRef||null,"DateLogged":maintForm.dateLogged||null,"DateSubmitted":maintForm.dateSubmitted||null,"Notes":maintForm.notes||null,"EmailDateTime":maintForm.emailDateTime||null};
      if(editMaint){
        await atPatch(MAINT_TABLE,editMaint.id,baseFields);
        setMaintReqs(prev=>prev.map(r=>r.id===editMaint.id?{...r,...baseFields}:r));
      } else {
        // On create, skip empty fields entirely rather than sending nulls
        const fields={"Name":genId(),...Object.fromEntries(Object.entries(baseFields).filter(([,v])=>v!=null&&v!==""))};
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
    await atPatch(MAINT_TABLE,req.id,{Status:"Open",DateResolved:null});
    setMaintReqs(prev=>prev.map(r=>r.id===req.id?{...r,Status:"Open",DateResolved:null}:r));
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
            <button key={v} onClick={()=>setReportPeriod(v)} style={{padding:"6px 14px",borderRadius:8,background:reportPeriod===v?TEAL:"#1a1d28",color:reportPeriod===v?"#fff":"#6b7280",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:reportPeriod===v?"none":"0.5px solid #1e2130"}}>{l}</button>
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


export default HsPanel;
