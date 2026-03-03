/**
 * Flat list of one prompt per item. Tweet-length, general — the AI fills in the rest.
 */

const TAILWIND_INSTRUCTION = `Use Tailwind CSS utility classes for all styling. Include <script src="https://cdn.tailwindcss.com"></script> in the <head> so Tailwind loads via CDN. Do not write custom <style> blocks — use only Tailwind classes.`

const makeVariantPrompt = `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). Create a distinct design variant — change layout, typography, color, or visual density so the result feels like a different designer made different choices. Text content and headings should convey the same meaning but tone and phrasing may adapt. Preserve semantic HTML and accessibility attributes. ${TAILWIND_INSTRUCTION} Return ONLY the complete HTML document with no markdown fences or explanation.
`

const restylePrompt = `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). Restyle it — change aesthetic mood, color palette, typographic voice, or visual style while keeping the same structure and content meaning. Preserve semantic HTML and accessibility attributes. ${TAILWIND_INSTRUCTION} Return ONLY the complete HTML document with no markdown fences or explanation.
`

const explorePrompt = `
You are a design variant generator. You will receive an HTML document for a UI. Create a bold, exploratory design variant — make sweeping changes across color palette, layout structure, typography, and visual density as if a different designer with a completely different aesthetic made it. The result should feel like a genuinely different creative direction, not a subtle tweak. Text content should convey the same meaning. Preserve semantic HTML and accessibility attributes. ${TAILWIND_INSTRUCTION} Return ONLY the complete HTML document with no markdown fences or explanation.
`

const remixColorsPrompt = `
You are a design variant generator. You will receive an HTML document for a UI. Remix ONLY the color palette — change background colors, text colors, border colors, and accent colors to create a fresh color mood. Keep the layout, spacing, typography scale, and HTML structure completely identical. Preserve semantic HTML and accessibility attributes. ${TAILWIND_INSTRUCTION} Return ONLY the complete HTML document with no markdown fences or explanation.
`

const remixLayoutPrompt = `
You are a design variant generator. You will receive an HTML document for a UI. Remix ONLY the layout — reorder sections, change the grid structure, adjust spacing and density, rearrange navigation or content blocks. Keep the color palette, typographic style, and all text content identical. Preserve semantic HTML and accessibility attributes. ${TAILWIND_INSTRUCTION} Return ONLY the complete HTML document with no markdown fences or explanation.
`

const customizePrompt = (userPrompt: string) => `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). ${userPrompt}. Preserve semantic HTML and accessibility attributes. ${TAILWIND_INSTRUCTION} Return ONLY the complete HTML document with no markdown fences or explanation.
`

export type PromptActionId =
  | "makeVariant"
  | "restyle"
  | "explore"
  | "remixColors"
  | "remixLayout"
  | "customize";

const promptById: Record<Exclude<PromptActionId, "customize">, string> = {
  makeVariant: makeVariantPrompt,
  restyle: restylePrompt,
  explore: explorePrompt,
  remixColors: remixColorsPrompt,
  remixLayout: remixLayoutPrompt,
};

export function injectContextIntoPrompt(
  basePrompt: string,
  userContext?: string,
  projectContext?: string
): string {
  const parts: string[] = [];
  if (userContext?.trim()) parts.push(`<user_aesthetic_preferences>\n${userContext.trim()}\n</user_aesthetic_preferences>`);
  if (projectContext?.trim()) parts.push(`<project_context>\n${projectContext.trim()}\n</project_context>`);
  if (parts.length === 0) return basePrompt;
  return `The following context should inform your design decisions:\n\n${parts.join("\n\n")}\n\n${basePrompt}`;
}

export function getPromptForAction(id: PromptActionId, customPrompt?: string): string {
  if (id === "customize" && customPrompt) return customizePrompt(customPrompt);
  if (id === "customize") return customizePrompt("Apply the user's requested design changes.");
  return promptById[id];
}

export const promptActions: Array<{ id: PromptActionId; label: string; icon: string }> = [
  { id: "makeVariant", label: "Make variant", icon: "Sparkles" },
  { id: "restyle", label: "Restyle", icon: "Brush" },
  { id: "customize", label: "Customize", icon: "Settings" },
];

export { makeVariantPrompt, restylePrompt, explorePrompt, remixColorsPrompt, remixLayoutPrompt, customizePrompt };
