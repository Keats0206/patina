/**
 * Flat list of one prompt per item. Tweet-length, general — the AI fills in the rest.
 */

const varyStrongPrompt = `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). Create a STRONG design variant with noticeable differences across layout, typography, and color — think different layout paradigm, new typographic hierarchy, distinct color palette, different visual density, or reimagined component styles. The result should feel like a different designer made different bold choices. Text content and headings should convey the same meaning but tone and phrasing may adapt to fit the new design. Preserve semantic HTML and accessibility attributes. Return ONLY the complete HTML document with no markdown fences or explanation.
`

const varySubtlePrompt = `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). Create a SUBTLE design variant — consider refining spacing, adjusting typographic rhythm, tweaking colors, or shifting proportions. The result should feel like a polished iteration of the original, not a reinvention. Text content and headings should convey the same meaning but tone and phrasing may adapt to fit the new design. Preserve semantic HTML and accessibility attributes. Return ONLY the complete HTML document with no markdown fences or explanation.
`

const changeStylePrompt = `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). Reimagine this in a completely different visual style — think different aesthetic mood, design language, or era. Consider how brand personality, motion, texture, or typographic voice could shift the feeling entirely. Text content and headings should convey the same meaning but tone and phrasing may adapt to match the new aesthetic. Preserve semantic HTML and accessibility attributes. Return ONLY the complete HTML document with no markdown fences or explanation.
`

const remixColorsPrompt = `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). Remix the color scheme entirely — consider new palette relationships between background, foreground, and accent, or explore different emotional registers through color temperature, saturation, or contrast. Typography and layout stay the same. Text content and headings should convey the same meaning but tone and phrasing may adapt to fit the new palette's mood. Preserve semantic HTML and accessibility attributes. Return ONLY the complete HTML document with no markdown fences or explanation.
`

const shuffleLayoutPrompt = `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). Rearrange the spatial layout — consider how changing element positioning, ordering, grouping, or flow could create a fresh experience. Text content and headings should convey the same meaning but tone and phrasing may adapt to fit the new structure. Preserve semantic HTML and accessibility attributes. Return ONLY the complete HTML document with no markdown fences or explanation.
`

const seeOtherViewsPrompt = `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). Reimagine this section using a completely different layout paradigm — consider how a structural departure from the original could better serve the content, hierarchy, or user flow. Text content and headings should convey the same meaning but tone and phrasing may adapt to fit the new paradigm. Preserve semantic HTML and accessibility attributes. Return ONLY the complete HTML document with no markdown fences or explanation.
`

const customizePrompt = (userPrompt: string) => `
You are a design variant generator. You will receive an HTML document for a UI (any interface—landing page, dashboard, form, card, etc.). ${userPrompt}. Preserve semantic HTML and accessibility attributes. Return ONLY the complete HTML document with no markdown fences or explanation.
`

export type PromptActionId =
  | "varyStrong"
  | "varySubtle"
  | "changeStyle"
  | "remixColors"
  | "shuffleLayout"
  | "seeOtherViews"
  | "customize";

const promptById: Record<Exclude<PromptActionId, "customize">, string> = {
  varyStrong: varyStrongPrompt,
  varySubtle: varySubtlePrompt,
  changeStyle: changeStylePrompt,
  remixColors: remixColorsPrompt,
  shuffleLayout: shuffleLayoutPrompt,
  seeOtherViews: seeOtherViewsPrompt,
};

export function getPromptForAction(id: PromptActionId, customPrompt?: string): string {
  if (id === "customize" && customPrompt) return customizePrompt(customPrompt);
  if (id === "customize") return customizePrompt("Apply the user's requested design changes.");
  return promptById[id];
}

export const promptActions: Array<{ id: PromptActionId; label: string; icon: string }> = [
  { id: "varyStrong", label: "Vary strong", icon: "Sparkles" },
  { id: "varySubtle", label: "Vary subtle", icon: "Sparkle" },
  { id: "changeStyle", label: "Change style", icon: "Brush" },
  { id: "remixColors", label: "Remix colors", icon: "Palette" },
  { id: "shuffleLayout", label: "Shuffle layout", icon: "LayoutGrid" },
  { id: "seeOtherViews", label: "See other views", icon: "LayoutTemplate" },
  { id: "customize", label: "Customize", icon: "Settings" },
];

export { varyStrongPrompt, varySubtlePrompt, changeStylePrompt, remixColorsPrompt, shuffleLayoutPrompt, seeOtherViewsPrompt, customizePrompt };