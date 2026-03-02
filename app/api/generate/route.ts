import { streamText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { getPromptForAction, type PromptActionId } from "@/lib/promptLibrary";

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

export async function POST(request: Request) {
  const body = await request.json();
  const { promptId, html, sourceUrl, customPrompt } = body as {
    promptId: PromptActionId;
    html?: string;
    sourceUrl?: string;
    customPrompt?: string;
  };

  let sourceHtml = typeof html === "string" ? html : null;
  if (!sourceHtml && typeof sourceUrl === "string") {
    try {
      const res = await fetch(sourceUrl, {
        headers: { "User-Agent": "Patina/1.0" },
        next: { revalidate: 0 },
      });
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      sourceHtml = await res.text();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch source URL" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (!promptId || !sourceHtml) {
    return new Response(
      JSON.stringify({ error: "promptId and html or sourceUrl are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const systemPrompt = getPromptForAction(
    promptId,
    typeof customPrompt === "string" ? customPrompt : undefined
  );

  const result = streamText({
    model: gateway("openai/gpt-4o-mini"),
    system: systemPrompt,
    messages: [{ role: "user", content: sourceHtml }],
  });

  return result.toTextStreamResponse();
}
