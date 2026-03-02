import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/^```(?:html)?\s*\n?/);
  if (fence) {
    const end = trimmed.lastIndexOf("```");
    if (end > fence[0].length) return trimmed.slice(fence[0].length, end).trim();
  }
  return trimmed;
}
