import { useState, useEffect } from "react";
import { TEAL, SUPPLIERS_TABLE, ipt } from "../shared.jsx";
import { atGet } from "../lib/airtable.js";

// ── SUPPLIERS PANEL ──────────────────────────────────────────────
// Read-only directory of department suppliers, sourced from the shared
// Suppliers table. Used for quotes, orders and comparative sourcing.
function SuppliersPanel(){
  const [suppliers,setSuppliers]=useState(null);
  const [search,setSearch]=useState("");

  useEffect(()=>{
    let cancelled=false;
    (async()=>{
      try{
        const data=await atGet(SUPPLIERS_TABLE,{});
        if(cancelled||!data||!Array.isArray(data.records))return;
        const rows=data.records.map(r=>({
          id:r.id,
          name:r.fields?.["Supplier Name"]||"",
          contact:r.fields?.["Contact Person"]||"",
          email:r.fields?.["Email"]||"",
          phone:r.fields?.["Phone"]||"",
          website:r.fields?.["Website"]||"",
          category:r.fields?.["Category"]||"",
          supplies:r.fields?.["What They Supply"]||"",
          account:r.fields?.["Account / Reference"]||"",
          notes:r.fields?.["Notes"]||"",
          active:r.fields?.["Active"]===true,
        })).sort((a,b)=>a.name.localeCompare(b.name));
        if(!cancelled)setSuppliers(rows);
      }catch(e){ if(!cancelled)setSuppliers([]); }
    })();
    return()=>{cancelled=true;};
  },[]);

  const q=search.trim().toLowerCase();
  const filtered=(suppliers||[]).filter(s=>!q||[s.name,s.category,s.supplies,s.contact].some(v=>(v||"").toLowerCase().includes(q)));

  return(
    <div>
      <div style={{fontSize:15,fontWeight:500,marginBottom:2}}>Suppliers</div>
      <div style={{fontSize:13,color:"#6b7280",marginBottom:12}}>Department supplier &amp; vendor directory — for quotes, orders and comparative sourcing.</div>

      <input style={{...ipt,marginBottom:14}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, category or what they supply…"/>

      {suppliers===null&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>Loading…</div>}
      {suppliers!==null&&filtered.length===0&&<div style={{textAlign:"center",padding:"2rem",color:"#6b7280",fontSize:14}}>No suppliers found</div>}

      {filtered.map(s=>(
        <div key={s.id} style={{background:"#141720",border:"0.5px solid #1e2130",borderRadius:12,padding:"12px 14px",marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8,flexWrap:"wrap"}}>
            <div style={{fontSize:14,fontWeight:500,color:"#e0e3ea"}}>{s.name}{!s.active&&<span style={{fontSize:10,color:"#6b7280",marginLeft:8}}>(inactive)</span>}</div>
            {s.category&&<span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:"#1a1d28",color:TEAL,fontWeight:500}}>{s.category}</span>}
          </div>
          {s.supplies&&<div style={{fontSize:12,color:"#9ca3af",marginTop:6,lineHeight:1.5}}>{s.supplies}</div>}
          <div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8,fontSize:11,alignItems:"center"}}>
            {s.contact&&<span style={{color:"#6b7280"}}>👤 {s.contact}</span>}
            {s.email&&<a href={`mailto:${s.email}`} style={{color:"#60a5fa",fontFamily:"monospace",textDecoration:"none"}}>✉ {s.email}</a>}
            {s.phone&&<span style={{color:"#6b7280"}}>☎ {s.phone}</span>}
            {s.website&&<a href={s.website} target="_blank" rel="noopener noreferrer" style={{color:"#60a5fa",textDecoration:"none"}}>🔗 Website</a>}
            {s.account&&<span style={{color:"#6b7280"}}>Acc: {s.account}</span>}
          </div>
          {s.notes&&<div style={{fontSize:11,color:"#6b7280",marginTop:6,lineHeight:1.5}}>{s.notes}</div>}
        </div>
      ))}
    </div>
  );
}

export default SuppliersPanel;
