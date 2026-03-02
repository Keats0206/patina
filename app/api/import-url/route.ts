import { streamText } from "ai";
import { createGateway } from "@ai-sdk/gateway";

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

const INITIAL_HTML_PASS_SYSTEM = `You are an HTML normalizer for a design tool. You will receive raw HTML from a webpage (possibly partial, with external links or broken structure). Your job is to produce a single, clean, self-contained HTML document that:
- Preserves the visible structure and content of the page
- Fixes broken or invalid markup and closes tags where needed
- Keeps or inlines critical CSS so the page renders with the same general look
- Removes or strips non-essential scripts, trackers, and noise that would not affect design iteration
- Uses a single document with inline or embedded styles so it can be edited and varied later

Return ONLY the complete HTML document. Do not wrap it in markdown code fences or add any explanation before or after.`;

export async function POST(request: Request) {
  let url: string;
  try {
    const body = await request.json();
    url = typeof body?.url === "string" ? body.url.trim() : "";
  } catch {
    url = "";
  }
  if (!url) {
    return new Response(
      JSON.stringify({ error: "url is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  try {
    new URL(url);
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  let sourceHtml: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Patina/1.0 (Design import)" },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    sourceHtml = await res.text();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const result = streamText({
    model: gateway("anthropic/claude-sonnet-4"),
    system: INITIAL_HTML_PASS_SYSTEM,
    messages: [{ role: "user", content: sourceHtml }],
  });

  return result.toTextStreamResponse();
}
