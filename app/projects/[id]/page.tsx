"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeftIcon,
  Brush,
  Expand,
  LayoutGrid,
  LayoutTemplate,
  Loader2,
  Palette,
  Settings,
  Sparkle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { getProjectById, INITIAL_HTML_STORAGE_KEY_PREFIX, type Project } from "@/lib/projects";
import { stripMarkdownFences } from "@/lib/utils";
import { promptActions, type PromptActionId } from "@/lib/promptLibrary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Sparkle,
  Brush,
  Palette,
  LayoutGrid,
  LayoutTemplate,
  Settings,
};

export interface VariantCardData {
  id: string;
  html: string;
  label?: string;
  rating?: "up" | "down";
}

const HIDDEN_PROMPT_ACTIONS: PromptActionId[] = [
  "shuffleLayout",
  "seeOtherViews",
  "customize",
  "varySubtle",
];

const visiblePromptActions = promptActions.filter((a) => !HIDDEN_PROMPT_ACTIONS.includes(a.id));

function VariantCard({
  card,
  iframeRef,
  isStreaming,
  isGenerating,
  onGenerate,
  onOpenDetail,
  onThumbsUp,
  onThumbsDown,
  actions = visiblePromptActions,
}: {
  card: VariantCardData;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
  isStreaming: boolean;
  isGenerating: boolean;
  onGenerate: (promptId: PromptActionId) => void;
  onOpenDetail?: () => void;
  onThumbsUp?: () => void;
  onThumbsDown?: () => void;
  actions?: typeof promptActions;
}) {
  const isThisStreaming = isStreaming && iframeRef != null;

  return (
    <div className="relative flex flex-col rounded-lg border bg-card shadow-sm overflow-hidden group">
      <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
        {card.html || isThisStreaming ? (
          <iframe
            ref={iframeRef ?? undefined}
            srcDoc={isThisStreaming ? undefined : card.html}
            title={`Preview ${card.label ?? card.id}`}
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <iframe
            src="/sample-one.html"
            title="Preview"
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
        {isThisStreaming && (
          <div className="absolute left-2 top-2 flex items-center gap-2 rounded-md bg-primary/90 px-2 py-1 text-xs font-medium text-primary-foreground shadow-sm">
            <Loader2 className="size-3 shrink-0 animate-spin" />
            <span>Streaming…</span>
          </div>
        )}
        {onOpenDetail && (
          <Button
            variant="default"
            size="icon-sm"
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail();
            }}
            title="View full screen"
          >
            <Expand className="size-4" />
          </Button>
        )}
        <div className="absolute left-2 bottom-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="outline"
            size="icon-sm"
            className={
              card.rating === "up"
                ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
                : ""
            }
            onClick={(e) => {
              e.stopPropagation();
              onThumbsUp?.();
            }}
            title="Good design"
          >
            <ThumbsUp className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            className={
              card.rating === "down"
                ? "bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                : ""
            }
            onClick={(e) => {
              e.stopPropagation();
              onThumbsDown?.();
            }}
            title="Bad design"
          >
            <ThumbsDown className="size-4" />
          </Button>
        </div>
        <div className="absolute right-2 bottom-2 flex flex-col items-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          {actions.map((action) => {
            const Icon = actionIcons[action.icon];
            return (
              <Button
                key={action.id}
                variant="default"
                size="xs"
                className="shrink-0"
                disabled={isGenerating}
                onClick={() => onGenerate(action.id)}
              >
                {Icon ? <Icon className="size-3" /> : null}
                {action.label}
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [cards, setCards] = useState<VariantCardData[]>([]);
  const [generatingCardId, setGeneratingCardId] = useState<string | null>(null);
  const [seedFetched, setSeedFetched] = useState(false);
  const [detailCard, setDetailCard] = useState<VariantCardData | null>(null);
  const streamingIframeRef = useRef<HTMLIFrameElement>(null);
  const restoredFromStorageRef = useRef(false);

  useEffect(() => {
    if (typeof id === "string") {
      setProject(getProjectById(id) ?? null);
    }
  }, [id]);

  // Restore saved variants from localStorage (so seed effect doesn't overwrite)
  useEffect(() => {
    if (typeof id !== "string" || !project || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`patina-variants-${id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as VariantCardData[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        restoredFromStorageRef.current = true;
        setCards(parsed);
        setSeedFetched(true);
      }
    } catch {
      // ignore invalid or missing storage
    }
  }, [id, project]);

  // Persist variants to localStorage whenever cards change
  useEffect(() => {
    if (typeof id !== "string" || cards.length === 0 || typeof window === "undefined") return;
    try {
      localStorage.setItem(`patina-variants-${id}`, JSON.stringify(cards));
    } catch {
      // ignore quota or other storage errors
    }
  }, [id, cards]);

  // Seed card: use sessionStorage initial HTML (from Import URL), or fetch project URL, or fallback to sample
  useEffect(() => {
    if (!project || seedFetched || restoredFromStorageRef.current) return;
    const id = project.id;
    if (typeof window !== "undefined") {
      const key = `${INITIAL_HTML_STORAGE_KEY_PREFIX}${id}`;
      const initialHtml = sessionStorage.getItem(key);
      if (initialHtml != null && initialHtml.length > 0) {
        sessionStorage.removeItem(key);
        setCards([{ id: "seed", html: initialHtml, label: "Original" }]);
        setSeedFetched(true);
        return;
      }
    }
    const sourceUrl = project.url.startsWith("http")
      ? project.url
      : new URL(project.url, typeof window !== "undefined" ? window.location.origin : "").href;
    fetch(sourceUrl, { cache: "no-store" })
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error("Fetch failed"))))
      .then((html) => {
        if (restoredFromStorageRef.current) return;
        setCards([{ id: "seed", html, label: "Original" }]);
      })
      .catch(() => {
        if (restoredFromStorageRef.current) return;
        fetch("/sample-one.html")
          .then((r) => r.text())
          .then((html) => {
            if (restoredFromStorageRef.current) return;
            setCards([{ id: "seed", html, label: "Original" }]);
          })
          .catch(() => {
            if (restoredFromStorageRef.current) return;
            setCards([{ id: "seed", html: "", label: "Original" }]);
          });
      })
      .finally(() => setSeedFetched(true));
  }, [project, seedFetched, cards.length]);

  const handleGenerate = useCallback(
    async (promptId: PromptActionId, sourceCardId: string) => {
      if (!project || generatingCardId != null) return;
      const sourceCard = cards.find((c) => c.id === sourceCardId);
      if (!sourceCard?.html) return;

      const newId = `card-${Date.now()}`;
      setGeneratingCardId(newId);
      setCards((prev) => [
        ...prev,
        { id: newId, html: "", label: promptActions.find((a) => a.id === promptId)?.label },
      ]);

      await new Promise((r) => setTimeout(r, 0));

      const iframe = streamingIframeRef.current;
      if (iframe?.contentDocument) {
        try {
          iframe.contentDocument.open();
          iframe.contentDocument.close();
        } catch {
          // ignore
        }
      }

      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId, html: sourceCard.html }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `Generation failed: ${res.status}`);
        }
        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");
        const decoder = new TextDecoder();
        let html = "";
        let docOpened = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          html += chunk;
          const doc = streamingIframeRef.current?.contentDocument;
          if (doc) {
            if (!docOpened) {
              doc.open();
              docOpened = true;
            }
            doc.write(chunk);
          }
        }

        const doc = streamingIframeRef.current?.contentDocument;
        if (doc && docOpened) doc.close();
        const finalHtml = stripMarkdownFences(html);
        setCards((prev) => prev.map((c) => (c.id === newId ? { ...c, html: finalHtml } : c)));
      } catch (e) {
        console.error(e);
        setCards((prev) => prev.filter((c) => c.id !== newId));
      } finally {
        setGeneratingCardId(null);
      }
    },
    [project, generatingCardId, cards]
  );

  if (project === undefined) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Project not found.</p>
        <Button asChild variant="link">
          <Link href="/">Back to projects</Link>
        </Button>
      </div>
    );
  }

  const isGenerating = generatingCardId != null;

  return (
    <div className="p-4 flex min-h-screen bg-stone-100">
      <aside className="flex shrink-0 flex-col w-[275px] border-r border-transparent rounded-lg overflow-hidden">
        <div className="flex items-center gap-1 p-2 min-h-[40px]">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-2 justify-start text-muted-foreground hover:text-foreground shrink-0"
          >
            <Link href="/">
              <ArrowLeftIcon className="size-4" />
            </Link>
          </Button>
        </div>
        <div className="px-2 pb-2">
            <Card className="border-0 bg-transparent shadow-none">
              <CardHeader className="px-0">
                <CardTitle className="text-lg">{project.title}</CardTitle>
                <CardDescription>Added {new Date(project.createdAt).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-sm text-primary underline-offset-4 hover:underline"
                >
                  {project.url}
                </a>
              </CardContent>
            </Card>
        </div>
      </aside>

      <main className="flex flex-1 flex-col min-h-0 gap-0 bg-white rounded-lg overflow-hidden">
        {detailCard ? (
          <>
            <div className="flex-1 min-h-0 relative">
              <iframe
                srcDoc={detailCard.html || undefined}
                title={detailCard.label ?? detailCard.id}
                className="absolute inset-0 w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
              <div className="absolute left-0 right-0 top-0 flex justify-between items-center p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
                <div className="pointer-events-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="shadow-md"
                    onClick={() => setDetailCard(null)}
                  >
                    <ArrowLeftIcon className="size-4 mr-1.5" />
                    Back to grid
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-center px-4 py-3 border-t bg-background shrink-0">
              <div className="flex w-full max-w-2xl items-center gap-2">
                <Input
                  placeholder="Ask for changes…"
                  className="flex-1 rounded-full px-4 py-5 text-base shadow-md border-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      // TODO: wire to chat/generate
                    }
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 rounded-full size-11"
                  onClick={() => setDetailCard(null)}
                  title="Close"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col gap-6 overflow-auto p-8">
            {!seedFetched && cards.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground">Loading…</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {cards.map((card) => (
                  <VariantCard
                    key={card.id}
                    card={card}
                    iframeRef={card.id === generatingCardId ? streamingIframeRef : undefined}
                    isStreaming={card.id === generatingCardId}
                    isGenerating={isGenerating}
                    onGenerate={(promptId) => handleGenerate(promptId, card.id)}
                    onOpenDetail={() => setDetailCard(card)}
                    onThumbsUp={() =>
                      setCards((prev) =>
                        prev.map((c) =>
                          c.id === card.id ? { ...c, rating: c.rating === "up" ? undefined : "up" } : c
                        )
                      )
                    }
                    onThumbsDown={() =>
                      setCards((prev) =>
                        prev.map((c) =>
                          c.id === card.id ? { ...c, rating: c.rating === "down" ? undefined : "down" } : c
                        )
                      )
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
