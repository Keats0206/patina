import { streamText } from "ai";
import { createGateway } from "@ai-sdk/gateway";
import { getPromptForAction, injectContextIntoPrompt, type PromptActionId } from "@/lib/promptLibrary";

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

// Model routing: fast/cheap → Flash; standard → Sonnet 4.5; custom instructions → Sonnet 4.5
const FAST_ACTIONS: PromptActionId[] = ["restyle"];
const STANDARD_ACTIONS: PromptActionId[] = ["makeVariant"];

function getModelForAction(promptId: PromptActionId): ReturnType<ReturnType<typeof createGateway>> {
  if (FAST_ACTIONS.includes(promptId)) return gateway("google/gemini-2.5-flash");
  if (STANDARD_ACTIONS.includes(promptId)) return gateway("anthropic/claude-sonnet-4.5");
  return gateway("anthropic/claude-sonnet-4.5"); // customize + any other
}

export async function POST(request: Request) {
  const body = await request.json();
  const { promptId, html, sourceUrl, customPrompt, imageDataUrl, userContext, projectContext } = body as {
    promptId: PromptActionId;
    html?: string;
    sourceUrl?: string;
    customPrompt?: string;
    imageDataUrl?: string;
    userContext?: string;
    projectContext?: string;
  };

  let sourceHtml = typeof html === "string" ? html : null;
  if (!sourceHtml && typeof sourceUrl === "string") {
    try {
      const res = await fetch(sourceUrl, {
        headers: { "User-Agent": "Soupcan/1.0" },
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

  const basePrompt = getPromptForAction(promptId, typeof customPrompt === "string" ? customPrompt : undefined);
  const systemPrompt = injectContextIntoPrompt(basePrompt, userContext, projectContext);

  const userContent = imageDataUrl
    ? [
        { type: "text" as const, text: sourceHtml },
        { type: "image" as const, image: imageDataUrl },
      ]
    : sourceHtml;

  const result = streamText({
    model: getModelForAction(promptId),
    system: systemPrompt,
    messages: [{ role: "user", content: userContent }],
  });

  return result.toTextStreamResponse();
}
