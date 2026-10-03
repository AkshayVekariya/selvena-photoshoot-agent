import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  referenceDataUrl?: string;
  generatedDataUrl?: string;
  prompt?: string;
  productType?: string;
  metal?: string;
  shot?: number;
};

function extractOutputText(data: any): string {
  if (typeof data.output_text === "string") return data.output_text;
  const chunks: string[] = [];
  const output = data.output || [];
  for (const item of output) {
    const content = item && item.content ? item.content : [];
    for (const part of content) {
      if (typeof part.text === "string") chunks.push(part.text);
    }
  }
  return chunks.join("\n");
}

function parseJson(text: string) {
  const fenced = text.match(/\`\`\`(?:json)?\\s*([\\s\\S]*?)\\s*\`\`\`/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Verifier did not return JSON.");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY is not configured on the server." }, { status: 503 });

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON request." }, { status: 400 });
  }

  if (!body.referenceDataUrl || !body.generatedDataUrl || !body.prompt || !body.productType || !body.metal || !body.shot) {
    return NextResponse.json({ error: "referenceDataUrl, generatedDataUrl, prompt, productType, metal and shot are required." }, { status: 400 });
  }

  const instruction = [
    "You are the SELVENA Design Lock verifier.",
    "Compare the original product reference against the generated jewelry photograph.",
    "The original reference is authoritative for product identity and geometry.",
    "The user-selected real metal is authoritative for final metal appearance; the CAD/rendered source metal color is not authoritative.",
    "When evidence is uncertain, use REVIEW rather than PASS.",
    "Use REJECT for a clear product mismatch or invented construction.",
    "Return JSON only:",
    '{"status":"PASS|REVIEW|REJECT","confidence":0,"issues":[],"checks":{"productIdentity":true,"geometry":true,"gemstones":true,"construction":true,"metal":true,"placement":true}}',
    "Evaluate product identity, silhouette, proportions, visible thickness, gemstone count/cut/size/position/spacing, prongs/settings, construction/attachments, selected metal appearance, scale, and wearing placement.",
    "Do not claim facts that cannot be verified from the images.",
    "Shot: P" + String(body.shot).padStart(2, "0"),
    "Product type: " + body.productType,
    "Selected metal: " + body.metal,
    "Generation instruction used:\n" + body.prompt
  ].join("\n\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-5.6-luna",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: instruction },
          { type: "input_image", image_url: body.referenceDataUrl, detail: "high" },
          { type: "input_image", image_url: body.generatedDataUrl, detail: "high" }
        ]
      }]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    return NextResponse.json({ error: "Verification failed.", providerError: message }, { status: response.status });
  }

  const data = await response.json();
  const output = extractOutputText(data);

  try {
    return NextResponse.json({ provider: "openai", model: "gpt-5.6-luna", verification: parseJson(output) });
  } catch {
    return NextResponse.json({
      provider: "openai",
      model: "gpt-5.6-luna",
      verification: {
        status: "REVIEW",
        confidence: 0,
        issues: ["Verifier output was not machine-readable JSON."],
        checks: {}
      }
    });
  }
}
