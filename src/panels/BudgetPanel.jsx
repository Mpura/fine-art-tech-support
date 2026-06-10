import { useState } from "react";
import { TEAL, Btn } from "../shared.jsx";
import { ACE_2026, IT_2026, FE_2026 } from "../data/budget.js";

function BudgetPanel(){
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
          <button key={v} onClick={()=>{setBudTab(v);setExpanded(null);}} style={{padding:"7px 14px",borderRadius:8,background:budTab===v?TEAL:"#141720",color:budTab===v?"#fff":"#6b7280",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:budTab===v?"none":"0.5px solid #1e2130"}}>{l}</button>
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


export default BudgetPanel;
