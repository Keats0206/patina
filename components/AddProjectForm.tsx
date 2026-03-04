"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addProject, INITIAL_HTML_STORAGE_KEY_PREFIX } from "@/lib/projects";
import { stripMarkdownFences } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";

type Stage = "idle" | "fetching" | "processing" | "finalizing";

const STEPS: { key: Stage; label: string }[] = [
  { key: "fetching", label: "Fetching page" },
  { key: "processing", label: "Processing with AI" },
  { key: "finalizing", label: "Finalizing" },
];

const STAGE_ORDER: Stage[] = ["idle", "fetching", "processing", "finalizing"];

function stageIndex(s: Stage) {
  return STAGE_ORDER.indexOf(s);
}

function StepIcon({ status }: { status: "pending" | "active" | "completed" }) {
  if (status === "completed") {
    return (
      <span className="flex size-4 items-center justify-center">
        <Check className="size-3.5" style={{ color: "oklch(0.55 0 0)" }} />
      </span>
    );
  }
  if (status === "active") {
    return <Loader2 className="size-4 animate-spin text-foreground" />;
  }
  return (
    <span
      className="size-4 flex items-center justify-center text-[10px]"
      style={{ color: "oklch(0.35 0 0)" }}
    >
      ●
    </span>
  );
}

export function AddProjectForm({ onAdded }: { onAdded: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [importingHostname, setImportingHostname] = useState("");

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

    let hostname = trimmed;
    try {
      hostname = new URL(trimmed).hostname;
    } catch {}

    setImportingHostname(hostname);
    setImporting(true);
    setStage("idle");

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
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Extract and handle SOUPCAN markers
        const markerPattern = /\x00SOUPCAN:([^\x00]+)\x00/g;
        let match;
        while ((match = markerPattern.exec(buffer)) !== null) {
          const payload = match[1];
          if (payload.startsWith("error:")) {
            throw new Error(payload.slice(6));
          } else if (payload === "fetching" || payload === "processing") {
            setStage(payload as Stage);
          }
        }

        // Strip all markers, accumulate HTML
        html += buffer.replace(/\x00SOUPCAN:[^\x00]*\x00/g, "");
        buffer = "";
      }

      const cleanHtml = stripMarkdownFences(html);
      setStage("finalizing");

      await new Promise((resolve) => setTimeout(resolve, 400));

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
      setStage("idle");
    }
  }

  return (
    <div className="space-y-4">
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
          Import URL
        </Button>
      </form>

      {importing && (
        <div
          className="rounded border p-6"
          style={{ borderColor: "oklch(0.18 0 0)", background: "oklch(0.10 0 0)" }}
        >
          <div className="mb-5">
            <p
              className="mb-1 text-[11px] font-medium uppercase tracking-widest"
              style={{ color: "oklch(0.45 0 0)" }}
            >
              Importing
            </p>
            <p className="text-sm font-medium text-foreground">{importingHostname}</p>
          </div>
          <div className="space-y-3">
            {STEPS.map((step) => {
              const stepIdx = stageIndex(step.key);
              const currentIdx = stageIndex(stage);
              const status =
                stepIdx < currentIdx
                  ? "completed"
                  : stepIdx === currentIdx
                  ? "active"
                  : "pending";
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <StepIcon status={status} />
                  <span
                    className="text-sm"
                    style={{
                      color:
                        status === "active"
                          ? "oklch(0.92 0 0)"
                          : status === "completed"
                          ? "oklch(0.55 0 0)"
                          : "oklch(0.35 0 0)",
                    }}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
