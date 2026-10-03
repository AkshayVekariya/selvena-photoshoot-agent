"use client";

import { useMemo, useState } from "react";
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
  const [generated, setGenerated] = useState<{shot:number;prompt:string}[]>([]);

  const allSelected = selectedShots.length === SHOTS.length;

  const readiness = useMemo(() => {
    if (!reference) return {state:"REQUIRED", text:"Upload the exact product reference before generation."};
    if (selectedShots.some(s => s >= 7) && !notes.trim()) {
      return {state:"LIMITED", text:"Worn/lifestyle shots may require scale or wearing references. Do not invent missing construction."};
    }
    return {state:"READY", text:"Core inputs are present. Shot-specific references remain subject to review."};
  }, [reference, selectedShots, notes]);

  function toggleShot(id:number) {
    setSelectedShots(current =>
      current.includes(id) ? current.filter(x=>x!==id) : [...current,id].sort((a,b)=>a-b)
    );
  }

  function generate() {
    if (!reference || selectedShots.length===0) return;
    setGenerated(generatePrompts({
      productType, metal, selectedShots,
      referenceName: reference.name,
      additionalNotes: notes
    }));
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
            <input type="file" accept="image/*" onChange={e=>setReference(e.target.files?.[0] ?? null)} />
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
          {SHOTS.map(shot=>(
            <button
              key={shot.id}
              className={selectedShots.includes(shot.id) ? "shot active" : "shot"}
              onClick={()=>toggleShot(shot.id)}
            >
              <span className="shot-num">P{String(shot.id).padStart(2,"0")}</span>
              <strong>{shot.title}</strong>
              <small>{shot.mode}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>05 · Additional references / notes</h2>
        <textarea
          rows={4}
          value={notes}
          onChange={e=>setNotes(e.target.value)}
          placeholder="Dimensions, trustworthy worn reference, attachment/chain details, or other documented constraints."
        />
      </section>

      <section className="status-bar">
        <div><span className="status-label">{readiness.state}</span><span>{readiness.text}</span></div>
        <button className="primary" disabled={!reference || selectedShots.length===0} onClick={generate}>
          Build photoshoot prompts
        </button>
      </section>

      {generated.length>0 && (
        <section className="panel">
          <h2>Prompt output</h2>
          <p>Generation-provider integration is the next adapter layer; these prompts are production-ready inputs.</p>
          <div className="results">
            {generated.map(item=>(
              <article className="result" key={item.shot}>
                <div className="result-head">
                  <strong>P{String(item.shot).padStart(2,"0")}</strong>
                  <span>READY FOR GENERATOR</span>
                </div>
                <pre>{item.prompt}</pre>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
