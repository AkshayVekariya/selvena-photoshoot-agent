import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  prompt?: string;
  referenceDataUrl?: string;
};

function dataUrlToParts(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,(.+)$/);
  if (!match) return null;
  return { mime: match[1], base64: match[2] };
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

  if (!body.prompt || !body.referenceDataUrl) {
    return NextResponse.json({ error: "prompt and referenceDataUrl are required." }, { status: 400 });
  }

  const source = dataUrlToParts(body.referenceDataUrl);
  if (!source) return NextResponse.json({ error: "Reference must be PNG, JPEG, or WebP." }, { status: 400 });

  const bytes = Buffer.from(source.base64, "base64");
  if (bytes.length > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Reference image is too large. Use an image under 10 MB." }, { status: 413 });
  }

  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", body.prompt);
  form.append("size", "1024x1024");
  form.append(
    "image",
    new Blob([bytes], { type: source.mime }),
    source.mime === "image/png" ? "reference.png" : source.mime === "image/webp" ? "reference.webp" : "reference.jpg"
  );

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: "Bearer " + apiKey },
    body: form
  });

  if (!response.ok) {
    const message = await response.text();
    return NextResponse.json({ error: "Image generation failed.", providerError: message }, { status: response.status });
  }

  const data = await response.json();
  const item = data && data.data && data.data[0];

  if (!item || (!item.b64_json && !item.url)) {
    return NextResponse.json({ error: "Image provider returned no image output." }, { status: 502 });
  }

  const imageUrl = item.b64_json ? "data:image/png;base64," + item.b64_json : item.url;

  return NextResponse.json({ provider: "openai", model: "gpt-image-2", imageUrl });
}
