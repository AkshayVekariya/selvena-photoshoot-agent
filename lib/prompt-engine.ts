export type ProductType = "Ring"|"Earring"|"Pendant"|"Necklace"|"Bracelet"|"Bangle"|"Cuff"|"Anklet"|"Toe Ring"|"Brooch"|"Cufflink"|"Other";
export type MetalColor = "Real Rose Gold"|"Real Yellow Gold"|"Real White Gold"|"Real Silver";

export const SHOTS = [
  {id:1,title:"Hero White",mode:"product-only"},
  {id:2,title:"Three-Quarter",mode:"product-only"},
  {id:3,title:"Macro Detail",mode:"product-only"},
  {id:4,title:"Side Profile / Craftsmanship",mode:"product-only"},
  {id:5,title:"Soft Grey Editorial",mode:"product-only"},
  {id:6,title:"Minimal Luxury Brand",mode:"product-only"},
  {id:7,title:"Natural Worn Scale",mode:"worn/lifestyle"},
  {id:8,title:"Everyday Lifestyle",mode:"worn/lifestyle"},
  {id:9,title:"Extreme Worn Macro",mode:"worn/lifestyle"},
  {id:10,title:"Understated Fashion Campaign",mode:"worn/lifestyle"}
] as const;

type Input = {productType:ProductType;metal:MetalColor;selectedShots:number[];referenceName:string;additionalNotes:string};

const METAL:Record<MetalColor,string> = {
  "Real Rose Gold":"Photograph as real warm pink-gold metal with natural polished reflections. Never pink paint, copper, orange, bronze, or plastic.",
  "Real Yellow Gold":"Photograph as real rich warm yellow-gold metal with natural gold reflections. Never bright yellow, mustard, orange, bronze, or plastic.",
  "Real White Gold":"Photograph as real neutral silver-white white-gold with realistic reflections. Never chrome, mirror silver, blue-grey, or plastic.",
  "Real Silver":"Photograph as real neutral polished silver with realistic reflections. Never chrome or plastic."
};

const WEAR:Record<ProductType,string> = {
  Ring:"Place the exact ring naturally on a finger. Keep the hand anatomically correct and naturally curved. Ring face visible. No wedding band.",
  Earring:"Place the exact supplied earring on an anatomically correct ear. Keep hair away. Preserve supplied post, hook, clip, cuff, back, and attachment construction. Never invent a missing partner.",
  Pendant:"Place the exact pendant on the neck/chest with natural gravity. Preserve the supplied bail and chain only when documented; never invent an undocumented chain.",
  Necklace:"Place the exact necklace on the neck/chest. Preserve strand order, links, spacing, and length. Use trustworthy scale where needed.",
  Bracelet:"Place the exact bracelet on the wrist/forearm. Preserve circumference, clasp, links, and flexibility. Rigid parts stay rigid.",
  Bangle:"Place the exact bangle on the wrist. Preserve rigid construction and circumference; do not bend or resize.",
  Cuff:"Place the exact cuff on the wrist/forearm. Preserve rigid opening and geometry.",
  Anklet:"Place the exact anklet around the ankle. Preserve supplied link/chain construction and scale.",
  "Toe Ring":"Place the exact toe ring naturally on a toe. Preserve exact opening and proportions.",
  Brooch:"Place the exact brooch on a garment at its natural attachment location. Preserve the supplied pin/fastener.",
  Cufflink:"Place the exact cufflink on a shirt cuff at its natural attachment location. Preserve supplied face and fastening construction.",
  Other:"Use only a confirmed real wearing/attachment site. If unclear, keep the shot product-only until a reference is supplied."
};

const NEGATIVE = [
  "No extra, missing, or duplicated stones; no changed stone count, cut, size, color, position, spacing, prongs, bezels, settings, gallery, openings, engravings, links, bails, clasps, posts, hooks, backs, hinges, or other construction.",
  "Do not redesign, repair, mirror, reinterpret, enlarge, shrink, or invent unseen geometry.",
  "Do not infer metal purity, stone quality, measurements, or material facts from appearance.",
  "No extra jewelry, wedding bands, props, stands, mannequins, packaging, logos, watermarks, labels, text, CAD measurements, or graphic overlays.",
  "Avoid CGI appearance, plastic surfaces, artificial glow, exaggerated sparkle, excessive HDR, harsh highlights, motion blur, low resolution, distorted geometry, extra fingers/limbs, malformed hands, over-smoothed skin, or crowded backgrounds."
].join("\n");

const SHOT:Record<number,string> = {
  1:"Premium e-commerce hero on pure white, centered, comfortable margins, subtle contact shadow, realistic studio lighting.",
  2:"Three-quarter product view at approximately 20–30° where supported by the reference, showing dimensional form without changing geometry.",
  3:"Extreme macro of the defining product detail. Keep fine structure sharp and do not exaggerate gemstone brightness or enlarge the jewelry.",
  4:"Side/profile craftsmanship view showing depth, setting, thickness, openings, and construction exactly as supported by the reference.",
  5:"Soft grey editorial studio treatment with restrained luxury presentation, subtle depth, and controlled reflections.",
  6:"Minimal luxury brand product photograph with a clean understated studio environment and the product as the sole subject.",
  7:"Natural worn-scale photograph using supplied physical scale or trustworthy worn reference. Camera moves closer rather than enlarging the jewelry.",
  8:"Understated everyday lifestyle beside a softly lit window, plain ivory wall, cream/taupe/charcoal clothing, relaxed pose, diffuse daylight, quiet background.",
  9:"Intimate macro at the actual wearing site with a small amount of surrounding skin/fabric; accurate pores, fine lines and contact shadows; no enlargement.",
  10:"Understated fashion campaign on a warm grey studio wall with soft directional daylight/reflected fill, simple muted clothing, relaxed three-quarter stance and tight crop around the wearing area."
};

export function buildShotPrompt(input:Input,shot:number){
  const mode=shot>=7?"WORN/PLACEMENT RULE:\n"+WEAR[input.productType]:"PRODUCT-ONLY RULE:\nKeep the complete product visible and do not introduce a worn context.";
  return [
    "SELVENA PHOTOSHOOT — P"+String(shot).padStart(2,"0")+" "+(SHOTS.find(s=>s.id===shot)?.title??"Shot"),
    'REFERENCE AUTHORITY: "'+input.referenceName+'" is the sole product design authority.',
    "Product type: "+input.productType+".",
    "Final real metal: "+input.metal+". CAD/rendered metal color is not the final metal-color authority.",
    METAL[input.metal],
    "CRITICAL DESIGN LOCK: preserve exact silhouette, proportions, visible thickness, curvature, every gemstone count/cut/size/color/position/spacing, all settings and construction, and every supplied attachment. Empty openings remain empty. A single item stays a single item. Never invent unseen construction.",
    mode,
    SHOT[shot],
    "Photorealistic physical jewelry photography with realistic material response, believable reflections and shadows, natural optical depth of field. Output 1:1 square.",
    input.additionalNotes.trim()?("DOCUMENTED NOTES:\n"+input.additionalNotes.trim()):"",
    "UNIVERSAL NEGATIVE LOCK:\n"+NEGATIVE
  ].filter(Boolean).join("\n\n");
}

export function generatePrompts(input:Input){
  return input.selectedShots.map(shot=>({shot,prompt:buildShotPrompt(input,shot)}));
}
