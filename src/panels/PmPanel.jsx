import { useState, useEffect } from "react";
import { TEAL, BLUE, PM_TABLE, fmtDate, todayDate, localDateStr, genId, ipt, Btn } from "../shared.jsx";
import { atGet, atPost, atPatch, atDelete } from "../lib/airtable.js";

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
  function intervalDaysPm(iv){return iv==="Daily"?1:iv==="Weekly"?7:iv==="Monthly"?30:iv==="Per Term"?90:iv==="Per Use"?0:365;}
  function addDaysFn(dateStr,n){const d=new Date(dateStr+"T00:00:00");d.setDate(d.getDate()+n);return localDateStr(d);}
  function getTaskStatus(task){
    if(task.Interval==="Per Use")return"per-use";
    if(!task.NextDue)return"not-done";
    const du=daysUntilPm(task.NextDue);if(du<0)return"overdue";if(du<=7)return"due-soon";return"scheduled";
  }
  function statusMeta(s){
    if(s==="overdue")return{label:"Overdue",color:"#f87171",bg:"#2a0f14"};
    if(s==="due-soon")return{label:"Due soon",color:"#d4851a",bg:"#2a1f0a"};
    if(s==="scheduled")return{label:"Scheduled",color:"#20B07F",bg:"#0a2218"};
    if(s==="per-use")return{label:"Per use",color:"#a855f7",bg:"#1a0a2e"};
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
      // Per Use tasks: just record when it was last done — no fixed next due date
      if(task.Interval!=="Per Use"){
        updates.NextDue=addDaysFn(lf.date,intervalDaysPm(task.Interval||"Monthly"));
      }
    } else if(outcome==="Partial"){
      updates.LastDone=lf.date;
      if(task.Interval!=="Per Use"){
        updates.NextDue=addDaysFn(lf.date,7);
      }
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
  const counts={overdue:0,"due-soon":0,scheduled:0,"not-done":0,"per-use":0};
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
          ["per-use","Per Use",counts["per-use"],"#a855f7","#1a0a2e"],
        ].map(([v,l,n,col,bg])=>(
          <button key={v} onClick={()=>setFilterStatus(v)} style={{flex:1,padding:"10px 4px",borderRadius:10,border:filterStatus===v?`1.5px solid ${col}`:"0.5px solid #1e2130",background:filterStatus===v?bg:"#141720",cursor:"pointer",fontFamily:"inherit",textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:600,color:filterStatus===v?col:"#e0e3ea"}}>{n}</div>
            <div style={{fontSize:10,color:filterStatus===v?col:"#4b5563",marginTop:1}}>{l}</div>
          </button>
        ))}
      </div>

      {/* Interval filter */}
      <div style={{display:"flex",gap:5,marginBottom:16,flexWrap:"wrap"}}>
        {["all","Per Use","Daily","Weekly","Monthly","Per Term","Annually"].map(v=>(
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
            <div style={{flex:1}}><label style={{fontSize:12,color:"#9ca3af",display:"block",marginBottom:4}}>Interval</label><select style={ipt} value={pmForm.interval} onChange={e=>setPmForm(f=>({...f,interval:e.target.value}))}>{["Per Use","Daily","Weekly","Monthly","Per Term","Annually"].map(t=><option key={t}>{t}</option>)}</select></div>
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
                        <div style={{flex:1}}><label style={{fontSize:11,color:"#9ca3af",display:"block",marginBottom:3}}>Interval</label><select style={ipt} value={pmForm.interval} onChange={e=>setPmForm(f=>({...f,interval:e.target.value}))}>{["Per Use","Daily","Weekly","Monthly","Per Term","Annually"].map(t=><option key={t}>{t}</option>)}</select></div>
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


export default PmPanel;
