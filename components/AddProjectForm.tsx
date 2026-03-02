"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addProject, INITIAL_HTML_STORAGE_KEY_PREFIX } from "@/lib/projects";
import { stripMarkdownFences } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function AddProjectForm({ onAdded }: { onAdded: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a URL");
      return;
    }
    try {
      new URL(trimmed);
    } catch {
      setError("Enter a valid URL");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Import failed: ${res.status}`);
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let html = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        html += decoder.decode(value, { stream: true });
      }
      const cleanHtml = stripMarkdownFences(html);
      const project = addProject(trimmed);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `${INITIAL_HTML_STORAGE_KEY_PREFIX}${project.id}`,
          cleanHtml
        );
      }
      setUrl("");
      onAdded();
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor="project-url">Import URL</Label>
        <Input
          id="project-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          aria-invalid={!!error}
          aria-describedby={error ? "url-error" : undefined}
          disabled={importing}
        />
        {error && (
          <p id="url-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
      <Button type="submit" className="sm:shrink-0" disabled={importing}>
        {importing ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Importing with AI…
          </>
        ) : (
          "Import URL"
        )}
      </Button>
    </form>
  );
}
