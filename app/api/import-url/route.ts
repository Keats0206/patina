import { streamText } from "ai";
import { createGateway } from "@ai-sdk/gateway";

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

const INITIAL_HTML_PASS_SYSTEM = `You are an HTML normalizer for a design tool. You will receive raw HTML from a webpage (possibly partial, with external links or broken structure). Your job is to produce a single, clean, self-contained HTML document that:
- Preserves the visible structure and content of the page
- Fixes broken or invalid markup and closes tags where needed
- Converts all styling to Tailwind CSS utility classes — include <script src="https://cdn.tailwindcss.com"></script> in the <head> and do not write custom <style> blocks
- Removes or strips non-essential scripts, trackers, and noise that would not affect design iteration

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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode("\x00PATINA:fetching\x00"));

      let sourceHtml: string;
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": "Patina/1.0 (Design import)" },
          next: { revalidate: 0 },
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
        sourceHtml = await res.text();
      } catch {
        controller.enqueue(encoder.encode("\x00PATINA:error:Failed to fetch URL\x00"));
        controller.close();
        return;
      }

      controller.enqueue(encoder.encode("\x00PATINA:processing\x00"));

      const result = streamText({
        model: gateway("anthropic/claude-opus-4.5"),
        system: INITIAL_HTML_PASS_SYSTEM,
        messages: [{ role: "user", content: sourceHtml }],
      });

      for await (const chunk of result.textStream) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
