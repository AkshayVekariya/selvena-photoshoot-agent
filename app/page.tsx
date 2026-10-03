"use client";

import { useMemo, useState } from "react";
import { checkShotReference, type ReferenceCheck } from "../lib/reference-check";
import { generatePrompts, type MetalColor, type ProductType, SHOTS } from "../lib/prompt-engine";

const PRODUCT_TYPES: ProductType[] = [
  "Ring","Earring","Pendant","Necklace","Bracelet","Bangle","Cuff","Anklet",
  "Toe Ring","Brooch","Cufflink","Other"
];

const METALS: MetalColor[] = [
  "Real Rose Gold","Real Yellow Gold","Real White Gold","Real Silver"
];

const METAL_HELP: Record<MetalColor, string> = {
  "Real Rose Gold": "Natural warm pink-gold reflections. Never pink paint, copper, orange, bronze, or plastic.",
  "Real Yellow Gold": "Natural rich warm yellow-gold reflections. Never bright yellow, mustard, orange, bronze, or plastic.",
  "Real White Gold": "Neutral silver-white white-gold reflections. Never chrome, mirror silver, blue-grey, or plastic.",
  "Real Silver": "Neutral polished silver reflections. Never chrome or plastic."
};

export default function Home() {
  const [reference, setReference] = useState<File | null>(null);
  const [productType, setProductType] = useState<ProductType>("Ring");
  const [metal, setMetal] = useState<MetalColor>("Real Rose Gold");
  const [selectedShots, setSelectedShots] = useState<number[]>([1]);
  const [notes, setNotes] = useState("");
  const [results, setResults] = useState<Array<{shot:number;prompt:string;status:string;imageUrl?:string;issues?:string[];reason?:string}>>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const checks = useMemo((): ReferenceCheck[] => selectedShots.map(shot =>
    checkShotReference({
      shot,
      productType,
      hasPrimaryReference: Boolean(reference),
      hasWornOrScaleReference: Boolean(notes.trim()),
      notes
    })
  ), [selectedShots, productType, reference, notes]);

  const allSelected = selectedShots.length === SHOTS.length;

  function toggleShot(id:number) {
    setSelectedShots(current =>
      current.includes(id) ? current.filter(x=>x!==id) : [...current,id].sort((a,b)=>a-b)
    );
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Could not read reference image."));
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(file);
    });
  }

  async function runPhotoshoot() {
    if (!reference || selectedShots.length===0) return;
    setRunning(true); setError("");
    try {
      const referenceDataUrl = await fileToDataUrl(reference);
      const prompts = generatePrompts({productType, metal, selectedShots, referenceName:reference.name, additionalNotes:notes});
      const initial = selectedShots.map(shot => {
        const check = checks.find(x => x.shot===shot)!;
        return {shot, prompt:prompts.find(x=>x.shot===shot)!.prompt, status:check.status==="REQUIRED"?"SKIPPED":"QUEUED", reason:check.reason};
      });
      setResults(initial);
      for (const item of initial) {
        if (item.status==="SKIPPED") continue;
        setResults(current=>current.map(x=>x.shot===item.shot?{...x,status:"GENERATING"}:x));
        const generation=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt:item.prompt,referenceDataUrl})});
        const genData=await generation.json();
        if(!generation.ok || !genData.imageUrl){
          setResults(current=>current.map(x=>x.shot===item.shot?{...x,status:"ERROR",issues:[genData.error || "Generation failed."]}:x));
          continue;
        }
        setResults(current=>current.map(x=>x.shot===item.shot?{...x,status:"VERIFYING",imageUrl:genData.imageUrl}:x));
        const verification=await fetch("/api/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({referenceDataUrl,generatedDataUrl:genData.imageUrl,prompt:item.prompt,productType,metal,shot:item.shot})});
        const verifyData=await verification.json();
        if(!verification.ok){
          setResults(current=>current.map(x=>x.shot===item.shot?{...x,status:"REVIEW",issues:[verifyData.error || "Verification unavailable."]}:x));
          continue;
        }
        const vr=verifyData.verification || {};
        const status=["PASS","REVIEW","REJECT"].includes(vr.status)?vr.status:"REVIEW";
        setResults(current=>current.map(x=>x.shot===item.shot?{...x,status,issues:Array.isArray(vr.issues)?vr.issues:[]}:x));
      }
    } catch(e) { setError(e instanceof Error ? e.message : "Photoshoot failed."); }
    finally { setRunning(false); }
  }

  return (
    <main className="shell">
      <header className="hero">
        <div className="brand">SELVENA</div>
        <div>
          <p className="eyebrow">PRODUCT PHOTOGRAPHY AGENT</p>
          <h1>Exact design. Controlled metal. Verified shots.</h1>
          <p className="lede">Build a controlled jewelry photoshoot from the exact product reference.</p>
        </div>
      </header>

      <section className="grid">
        <div className="panel">
          <h2>01 · Reference</h2>
          <label className="upload">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>setReference(e.target.files?.[0] ?? null)} />
            {reference ? <img className="reference-preview" src={URL.createObjectURL(reference)} alt="Reference preview" /> : null}
            <strong>{reference ? reference.name : "Upload exact product image"}</strong>
            <small>CAD geometry is authoritative for design. Its rendered metal color is not the final metal authority.</small>
          </label>
        </div>

        <div className="panel">
          <h2>02 · Product type</h2>
          <select value={productType} onChange={e=>setProductType(e.target.value as ProductType)}>
            {PRODUCT_TYPES.map(x=><option key={x}>{x}</option>)}
          </select>

          <h2 className="sub">03 · Real metal</h2>
          <select value={metal} onChange={e=>setMetal(e.target.value as MetalColor)}>
            {METALS.map(x=><option key={x}>{x}</option>)}
          </select>
          <p className="helper">{METAL_HELP[metal]}</p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>04 · Shot selection</h2>
            <p>All outputs are 1:1 square. P01–P06 product-only; P07–P10 worn/lifestyle.</p>
          </div>
          <button className="secondary" onClick={()=>setSelectedShots(allSelected?[]:SHOTS.map(x=>x.id))}>
            {allSelected ? "Clear all" : "Select all 10"}
          </button>
        </div>

        <div className="shot-grid">
          {SHOTS.map(shot=>{
            const check=checks.find(x=>x.shot===shot.id);
            return <button key={shot.id} className={selectedShots.includes(shot.id) ? "shot active" : "shot"} onClick={()=>toggleShot(shot.id)}>
              <span className="shot-num">P{String(shot.id).padStart(2,"0")}</span>
              <strong>{shot.title}</strong>
              <small>{shot.mode}</small>
              <span className={"check "+(check?.status.toLowerCase()||"required")}>{check?.status}</span>
            </button>;
          })}
        </div>
      </section>

      <section className="panel">
        <h2>05 · Additional references / notes</h2>
        <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Documented dimensions, trustworthy worn reference details, attachment/chain details, or other confirmed information." />
        <p>For worn/lifestyle shots, missing size or placement information is not guessed.</p>
      </section>

      <section className="status-bar">
        <div><span className="status-label">{reference ? "READY" : "REQUIRED"}</span><span>{reference ? "Required shots will be skipped until their missing references are supplied." : "Upload the exact product reference before generation."}</span></div>
        <button className="primary" disabled={!reference || selectedShots.length===0 || running} onClick={runPhotoshoot}>{running ? "Generating…" : "Generate & verify photoshoot"}</button>
      </section>

      {error ? <div className="error">{error}</div> : null}

      {results.length>0 && <section className="panel">
        <div className="panel-head"><div><h2>06 · Photoshoot results</h2><p>Generated images are checked against the original reference. Uncertain comparisons remain REVIEW.</p></div></div>
        <div className="result-grid">
          {results.map(item=><article className="result" key={item.shot}>
            <div className="result-head"><strong>P{String(item.shot).padStart(2,"0")}</strong><span className={"result-status "+item.status.toLowerCase()}>{item.status}</span></div>
            {item.imageUrl ? <img className="output-image" src={item.imageUrl} alt={"P"+String(item.shot).padStart(2,"0")+" result"} /> : null}
            {item.reason ? <p className="result-reason">{item.reason}</p> : null}
            {item.issues?.length ? <div className="issues">{item.issues.map((x,i)=><div key={i}>{x}</div>)}</div> : null}
            <details><summary>View generation prompt</summary><pre>{item.prompt}</pre></details>
          </article>)}
        </div>
      </section>}
    </main>
  );
}
