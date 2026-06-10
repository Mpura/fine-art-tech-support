import { useState, useEffect } from "react";
import { EQ_TABLE, Btn } from "../shared.jsx";
import { atGet, atPatch } from "../lib/airtable.js";

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

  useEffect(()=>{fetchAll();},[]);

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
          <button key={v} onClick={()=>setInsTab(v)} style={{padding:"7px 14px",borderRadius:8,background:insTab===v?TEAL:"#141720",color:insTab===v?"#fff":"#6b7280",fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:insTab===v?"none":"0.5px solid #1e2130"}}>{l}</button>
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
                <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>Collection: {req.schedDate||req.createdAt?.slice(0,10)||"—"}{req.dueDate?` · Due: ${req.dueDate}`:""}</div>
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


export default InsurancePanel;
