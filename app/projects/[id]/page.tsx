"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getProjectById,
  deleteProject,
  getProjectContext,
  setProjectContext,
  getUserContext,
  INITIAL_HTML_STORAGE_KEY_PREFIX,
  type Project,
} from "@/lib/projects";
import { stripMarkdownFences } from "@/lib/utils";
import { injectTailwindCDN, injectSelectionScript, useIframeStreaming } from "@/lib/streaming";
import type { PromptActionId } from "@/lib/promptLibrary";
import { Brush, LayoutTemplate, Zap, Minimize2, Smile, AlignLeft, Sparkles, MessageSquare, Compass, Monitor, Smartphone, Star, MousePointer, SlidersHorizontal, X } from "lucide-react";

// Map UI direction ids to API promptIds
const DIRECTION_TO_PROMPT: Record<string, PromptActionId | { id: "customize"; prompt: string }> = {
  bold: "makeVariant",
  clean: "makeVariant",
  playful: { id: "customize", prompt: "Make it more playful — warmer colors, rounded shapes, approachable typography. Think Figma or a modern consumer app." },
  editorial: { id: "customize", prompt: "Give it an editorial feel — magazine-like typography, dramatic layouts, strong hierarchy. Think Bloomberg or The Verge." },
  explore: "makeVariant",
  restyle: "restyle",
  layout: { id: "customize", prompt: "Restructure the layout — change the arrangement and composition of elements while keeping all content. Try a different grid, column structure, or spatial rhythm." },
};

// ─── Presets ───
const DIRECTIONS = [
  { id: "bold", label: "Bolder", Icon: Zap, desc: "Larger type, stronger contrast" },
  { id: "clean", label: "Cleaner", Icon: Minimize2, desc: "More whitespace, refined" },
  { id: "playful", label: "Playful", Icon: Smile, desc: "Warmer, friendlier" },
  { id: "editorial", label: "Editorial", Icon: AlignLeft, desc: "Magazine-like, dramatic" },
];
const ACTIONS = [
  { id: "explore", label: "Exploration",    Icon: Compass },
  { id: "restyle", label: "Restyle",        Icon: Brush },
  { id: "layout",  label: "Adjust layout",  Icon: LayoutTemplate },
];

// ─── Components ───
function StreamingPreview({ html, generating, interactive = false, selectionMode = false }: {
  html: string;
  generating: boolean;
  interactive?: boolean;
  selectionMode?: boolean;
}) {
  const { iframeRef, start } = useIframeStreaming({ html, delayMs: 20 });
  const htmlRef = useRef(html);
  htmlRef.current = html;

  useEffect(() => {
    if (!generating && html) start();
  }, [generating, start]);

  // Re-write iframe with/without selection script when selectionMode toggles
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !htmlRef.current) return;
    const d = iframe.contentDocument;
    const content = injectTailwindCDN(htmlRef.current);
    d.open();
    d.write(selectionMode ? injectSelectionScript(content) : content);
    d.close();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      {generating && (
        <div style={{ position: "absolute", inset: 0, zIndex: 2, background: "#0a0a0a", overflow: "hidden" }}>
          <div style={{
            position: "absolute", inset: 0,
            transform: "translateX(-100%)",
            background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.06),transparent)",
            animation: "shimmer 1.8s ease-in-out infinite",
          }} />
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Preview"
        style={{
          border: "none",
          width: "100%",
          height: "100%",
          pointerEvents: (interactive || selectionMode) ? "auto" : "none",
          cursor: selectionMode ? "crosshair" : undefined,
        }}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

function Preview({ html, interactive = false, selectionMode = false }: { html: string; interactive?: boolean; selectionMode?: boolean }) {
  const ref = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (ref.current?.contentDocument && html) {
      const d = ref.current.contentDocument;
      d.open();
      const content = injectTailwindCDN(html);
      d.write(selectionMode ? injectSelectionScript(content) : content);
      d.close();
    }
  }, [html, selectionMode]);
  return (
    <iframe
      ref={ref}
      title="Preview"
      style={{
        border: "none",
        width: "100%",
        height: "100%",
        pointerEvents: (interactive || selectionMode) ? "auto" : "none",
        cursor: selectionMode ? "crosshair" : undefined,
      }}
      sandbox="allow-scripts allow-same-origin"
    />
  );
}

function BrowserChrome({
  url,
  children,
  style,
  rightTools,
}: {
  url?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  rightTools?: React.ReactNode;
}) {
  const dotGroupWidth = 12 * 3 + 6 * 2;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid #2a2a2a",
        boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        background: "#0f0f0f",
        ...style,
      }}
    >
      <div
        style={{
          height: 38,
          background: "#141414",
          borderBottom: "1px solid #222",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 6, width: dotGroupWidth, flexShrink: 0 }}>
          {(["#FF5F57", "#FEBC2E", "#28C840"] as const).map((color, i) => (
            <div
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: color,
                border: "1px solid rgba(0,0,0,0.2)",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              maxWidth: 360,
              width: "100%",
              height: 22,
              background: "#0a0a0a",
              border: "1px solid #1f1f1f",
              borderRadius: 5,
              display: "flex",
              alignItems: "center",
              padding: "0 10px",
              fontSize: 11,
              color: "#555",
              userSelect: "none",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {url || "about:blank"}
          </div>
        </div>
        <div style={{ width: dotGroupWidth, flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
          {rightTools}
        </div>
      </div>
      <div style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

function Thumb({
  v,
  sel,
  gen,
  onClick,
  onDel,
  onStar,
  parent,
  isOriginal,
}: {
  v: { id: string; html: string; label: string; parentId: string | null; starred?: boolean };
  sel: boolean;
  gen: boolean;
  onClick: () => void;
  onDel?: (id: string) => void;
  onStar?: (id: string) => void;
  parent: string | null;
  isOriginal?: boolean;
}) {
  const [h, setH] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/10",
        borderRadius: 10,
        overflow: "hidden",
        border: sel ? "2px solid rgba(255,255,255,0.65)" : "2px solid transparent",
        background: "#111",
        cursor: "pointer",
        padding: 0,
        transition: "all 0.15s",
        boxShadow: sel ? "0 0 0 2px rgba(255,255,255,0.06)" : "none",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            transform: "scale(0.28)",
            transformOrigin: "top left",
            width: "357%",
            height: "357%",
          }}
        >
          <Preview html={v.html} />
        </div>
      </div>
      {gen && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#0d0d0d",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: "translateX(-100%)",
              background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)",
              animation: "shimmer 1.6s ease-in-out infinite",
            }}
          />
        </div>
      )}
      {isOriginal && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            padding: "2px 6px",
            borderRadius: 4,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            fontSize: 8,
            fontWeight: 700,
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            userSelect: "none",
          }}
        >
          Original
        </div>
      )}
      {onStar && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onStar(v.id);
          }}
          title={v.starred ? "Unstar" : "Star"}
          style={{
            position: "absolute",
            top: 4,
            left: 4,
            width: 20,
            height: 20,
            borderRadius: 5,
            background: v.starred ? "rgba(251,191,36,0.15)" : "rgba(0,0,0,0.6)",
            color: v.starred ? "#fbbf24" : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            cursor: "pointer",
            border: v.starred ? "1px solid rgba(251,191,36,0.4)" : "1px solid transparent",
            opacity: v.starred ? 1 : h ? 1 : 0,
            transition: "opacity 0.15s, color 0.15s, background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!v.starred) {
              e.currentTarget.style.color = "#fbbf24";
              e.currentTarget.style.border = "1px solid rgba(251,191,36,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!v.starred) {
              e.currentTarget.style.color = "transparent";
              e.currentTarget.style.border = "1px solid transparent";
            }
          }}
        >
          <Star size={11} strokeWidth={2} fill={v.starred ? "#fbbf24" : "none"} />
        </div>
      )}
      {h && !isOriginal && onDel && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDel(v.id);
          }}
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            width: 20,
            height: 20,
            borderRadius: 5,
            background: "rgba(0,0,0,0.8)",
            color: "#666",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            cursor: "pointer",
            border: "1px solid #333",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#f87171";
            e.currentTarget.style.borderColor = "#f87171";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#666";
            e.currentTarget.style.borderColor = "#333";
          }}
        >
          ✕
        </div>
      )}
    </button>
  );
}

function CompareCard({
  v,
  gen,
  onPick,
  onDel,
}: {
  v: { id: string; html: string; label: string };
  gen: boolean;
  onPick: (id: string) => void;
  onDel: (id: string) => void;
}) {
  const [h, setH] = useState(false);
  return (
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      style={{
        position: "relative",
        borderRadius: 10,
        overflow: "hidden",
        border: h ? "1px solid #333" : "1px solid #1a1a1a",
        background: "#0d0d0d",
        transition: "all 0.2s",
        boxShadow: h ? "0 4px 20px rgba(0,0,0,0.5)" : "none",
      }}
    >
      <div
        style={{
          height: 28,
          background: "#111",
          borderBottom: "1px solid #1a1a1a",
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          gap: 6,
          flexShrink: 0,
        }}
      >
        {(["#FF5F57", "#FEBC2E", "#28C840"] as const).map((color, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: color,
              border: "1px solid rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}
          />
        ))}
        <span style={{ fontSize: 10, color: "#555", marginLeft: 4 }}>{v.label}</span>
      </div>
      <div
        style={{
          aspectRatio: "4/3",
          position: "relative",
          overflow: "hidden",
          background: "#080808",
        }}
      >
        <div
          style={{
            transform: "scale(0.45)",
            transformOrigin: "top left",
            width: "222%",
            height: "222%",
            position: "absolute",
            inset: 0,
          }}
        >
          <Preview html={v.html} />
        </div>
        {gen && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#0d0d0d",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: "translateX(-100%)",
                background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent)",
                animation: "shimmer 1.6s ease-in-out infinite",
              }}
            />
          </div>
        )}
      </div>
      {!gen && v.html && (
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 10,
            display: "flex",
            gap: 5,
            opacity: h ? 1 : 0,
            transition: "opacity 0.15s",
            zIndex: 5,
          }}
        >
          <button
            onClick={() => onPick(v.id)}
            style={{
              padding: "5px 12px",
              borderRadius: 7,
              border: "none",
              background: "#fff",
              color: "#000",
              fontSize: 10,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Use this
          </button>
          {v.id !== "original" && (
            <button
              onClick={() => onDel(v.id)}
              style={{
                padding: "5px 8px",
                borderRadius: 7,
                border: "1px solid #2a2a2a",
                background: "rgba(0,0,0,0.7)",
                color: "#666",
                fontSize: 10,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══ MAIN ═══
export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string | undefined;
  const [project, setProject] = useState<Project | null | undefined>(undefined);
  const [variants, setVariants] = useState<Array<{ id: string; html: string; label: string; parentId: string | null; starred?: boolean }>>([]);
  const [selId, setSelId] = useState<string>("original");
  const [chat, setChat] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const [genIds, setGenIds] = useState<Set<string>>(new Set());
  const [onboard, setOnboard] = useState(true);
  const [view, setView] = useState<"single" | "compare">("single");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [tab, setTab] = useState<"variants" | "chat">("variants");
  const [showSettings, setShowSettings] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [seedFetched, setSeedFetched] = useState(false);
  const [viewport, setViewport] = useState<"web" | "mobile">("web");
  const [showStarred, setShowStarred] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [projectContext, setProjectContextState] = useState("");
  const [userContextPreview, setUserContextPreview] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedSnippets, setSelectedSnippets] = useState<Array<{ html: string; label: string }>>([]);
  const chatEnd = useRef<HTMLDivElement>(null);
  const restoredFromStorageRef = useRef(false);

  const sel = variants.find((v) => v.id === selId) || variants[0];
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  // Load project
  useEffect(() => {
    if (typeof id !== "string") return;
    const p = getProjectById(id);
    setProject(p ?? null);
  }, [id]);

  // Restore variants from localStorage
  useEffect(() => {
    if (typeof id !== "string" || !project || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(`soupcan-variants-${id}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Array<{ id: string; html: string; label: string; parentId: string | null }>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        restoredFromStorageRef.current = true;
        setVariants(parsed);
        setSelId(parsed[0]?.id ?? "original");
        setSeedFetched(true);
      }
    } catch {
      // ignore
    }
  }, [id, project]);

  // Seed HTML: sessionStorage (import-url), fetch project URL, or sample
  useEffect(() => {
    if (!project || seedFetched || restoredFromStorageRef.current) return;
    const pid = project.id;
    if (typeof window !== "undefined") {
      const key = `${INITIAL_HTML_STORAGE_KEY_PREFIX}${pid}`;
      const initialHtml = sessionStorage.getItem(key);
      if (initialHtml != null && initialHtml.length > 0) {
        sessionStorage.removeItem(key);
        setVariants([{ id: "original", html: initialHtml, label: "Original", parentId: null }]);
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
        setVariants([{ id: "original", html, label: "Original", parentId: null }]);
      })
      .catch(() => {
        if (restoredFromStorageRef.current) return;
        fetch("/sample-one.html")
          .then((r) => r.text())
          .then((html) => {
            if (restoredFromStorageRef.current) return;
            setVariants([{ id: "original", html, label: "Original", parentId: null }]);
          })
          .catch(() => {
            if (restoredFromStorageRef.current) return;
            setVariants([{ id: "original", html: "", label: "Original", parentId: null }]);
          });
      })
      .finally(() => setSeedFetched(true));
  }, [project, seedFetched]);

  // Persist variants
  useEffect(() => {
    if (typeof id !== "string" || variants.length === 0 || typeof window === "undefined") return;
    try {
      localStorage.setItem(`soupcan-variants-${id}`, JSON.stringify(variants));
    } catch {
      // ignore
    }
  }, [id, variants]);

  // Load project context
  useEffect(() => {
    if (typeof id !== "string" || !project) return;
    setProjectContextState(getProjectContext(id));
  }, [id, project]);

  // Load user context preview
  useEffect(() => { setUserContextPreview(getUserContext()); }, []);

  // postMessage listener for element picker
  useEffect(() => {
    if (!selectMode) return;
    function handler(e: MessageEvent) {
      if (e.data?.type === "soupcan-selection") {
        setSelectedSnippets(e.data.snippets ?? []);
      }
    }
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [selectMode]);

  const addGen = (gid: string) => setGenIds((p) => new Set(p).add(gid));
  const rmGen = (gid: string) => setGenIds((p) => {
    const s = new Set(p);
    s.delete(gid);
    return s;
  });
  const anyGen = genIds.size > 0;

  const getPromptParams = (dir: string) => {
    const mapped = DIRECTION_TO_PROMPT[dir];
    if (!mapped) return { promptId: "makeVariant" as PromptActionId, customPrompt: undefined };
    if (typeof mapped === "string") return { promptId: mapped, customPrompt: undefined };
    return { promptId: mapped.id, customPrompt: mapped.prompt };
  };

  const gen1 = useCallback(
    async (dir: string, srcId?: string, custom?: string, label?: string, imageDataUrl?: string) => {
      const src = variants.find((v) => v.id === (srcId || selId));
      if (!src?.html) return null;
      const { promptId, customPrompt } = custom
        ? { promptId: "customize" as PromptActionId, customPrompt: custom }
        : getPromptParams(dir);
      const nid = `v-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setSelectMode(false);
      setSelectedSnippets([]);
      setVariants((p) => [
        ...p,
        { id: nid, html: "", label: label || dir.charAt(0).toUpperCase() + dir.slice(1), parentId: src.id },
      ]);
      addGen(nid);
      setSelId(nid);
      setView("single");
      setErr(null);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ promptId, html: src.html, customPrompt: customPrompt || custom, imageDataUrl, userContext: getUserContext(), projectContext }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.error || `Generation failed: ${res.status}`);
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
        html = stripMarkdownFences(html);
        const idx = html.indexOf("<!DOCTYPE");
        if (idx > 0) html = html.slice(idx);
        setVariants((p) => p.map((v) => (v.id === nid ? { ...v, html } : v)));
        return nid;
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Generation failed");
        setVariants((p) => p.filter((v) => v.id !== nid));
        return null;
      } finally {
        rmGen(nid);
      }
    },
    [variants, selId, projectContext]
  );

  const genN = useCallback(
    async (dir: string, n = 3, srcId?: string) => {
      const src = variants.find((v) => v.id === (srcId || selId));
      if (!src?.html) return;
      setView("compare");
      setOnboard(false);
      setErr(null);
      const { promptId, customPrompt } = getPromptParams(dir);
      const ids: string[] = [];
      const newVs: Array<{ id: string; html: string; label: string; parentId: string }> = [];
      for (let i = 0; i < n; i++) {
        const nid = `v-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
        ids.push(nid);
        newVs.push({
          id: nid,
          html: "",
          parentId: src.id,
          label: `${dir.charAt(0).toUpperCase() + dir.slice(1)} #${i + 1}`,
        });
      }
      setVariants((p) => [...p, ...newVs]);
      setCompareIds(ids);
      ids.forEach(addGen);
      await Promise.allSettled(
        ids.map(async (nid, i) => {
          const multiNote = n > 1 ? `Variation ${i + 1} of ${n}. Be meaningfully different. ` : "";
          const finalCustom = customPrompt ? multiNote + customPrompt : (n > 1 ? multiNote : undefined);
          try {
            const res = await fetch("/api/generate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                promptId,
                html: src.html,
                customPrompt: finalCustom,
                userContext: getUserContext(),
                projectContext,
              }),
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data?.error || `Failed: ${res.status}`);
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
            html = stripMarkdownFences(html);
            const idx = html.indexOf("<!DOCTYPE");
            if (idx > 0) html = html.slice(idx);
            setVariants((p) => p.map((v) => (v.id === nid ? { ...v, html } : v)));
          } catch (e) {
            setErr((prev) => (prev ? prev + "; " + (e instanceof Error ? e.message : "Error") : (e instanceof Error ? e.message : "Error")));
            setVariants((p) => p.filter((v) => v.id !== nid));
            setCompareIds((p) => p.filter((x) => x !== nid));
          } finally {
            rmGen(nid);
          }
        })
      );
    },
    [variants, selId, projectContext]
  );

  const sendChat = useCallback(async () => {
    if (!input.trim() && !attachedImage && selectedSnippets.length === 0) return;
    const msg = input.trim();
    const img = attachedImage;
    const snippets = selectedSnippets;

    let customPrompt = msg || (img ? "Apply changes based on the attached image." : "Apply design improvements.");
    if (snippets.length > 0) {
      const targets = snippets
        .map((s, i) => `Element ${i + 1} (${s.label}):\n\`\`\`html\n${s.html}\n\`\`\``)
        .join("\n\n");
      customPrompt = `TARGETED EDIT: Modify ONLY the specific elements listed below. All other content, layout, and styling must remain exactly unchanged. Return the complete HTML with only these elements changed.\n\nTarget elements:\n${targets}\n\nInstruction: ${customPrompt}`;
    }

    setInput("");
    setAttachedImage(null);
    setSelectMode(false);
    setSelectedSnippets([]);
    const displayMsg = msg + (img ? " [image attached]" : "") + (snippets.length > 0 ? ` [${snippets.length} element${snippets.length !== 1 ? "s" : ""} targeted]` : "");
    setChat((p) => [...p, { role: "user", content: displayMsg }, { role: "assistant", content: "Generating…" }]);
    const nid = await gen1("customize", selId, customPrompt, "Custom", img ?? undefined);
    if (nid) {
      setSelId(nid);
      setTab("variants");
      setChat((p) => [...p.slice(0, -1), { role: "assistant", content: "Done — new variation ready." }]);
    } else {
      setChat((p) => [...p.slice(0, -1), { role: "assistant", content: "Failed — see error above." }]);
    }
  }, [input, attachedImage, selId, gen1, selectedSnippets]);

  const del = useCallback(
    (vid: string) => {
      setVariants((p) => p.filter((v) => v.id !== vid));
      setCompareIds((p) => p.filter((x) => x !== vid));
      if (selId === vid) setSelId("original");
    },
    [selId]
  );

  const pick = useCallback((vid: string) => {
    setSelId(vid);
    setView("single");
    setShowStarred(false);
    setCompareIds([]);
  }, []);

  const toggleStar = useCallback((vid: string) => {
    setVariants((p) => p.map((v) => v.id === vid ? { ...v, starred: !v.starred } : v));
  }, []);

  const parent = (v: { parentId: string | null }) =>
    v.parentId ? variants.find((p) => p.id === v.parentId)?.label ?? null : null;

  if (project === undefined) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: "#050505", color: "#666" }}>
        Loading…
      </div>
    );
  }

  if (project === null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", alignItems: "center", justifyContent: "center", gap: 16, background: "#050505", color: "#fff" }}>
        <p>Project not found.</p>
        <Link href="/" style={{ color: "#fff", textDecoration: "underline" }}>
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: "#050505",
        fontFamily: "'DM Sans',-apple-system,sans-serif",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideInRight{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:translateX(0)}}
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        input:focus,button:focus{outline:none}
      `}</style>

      {/* ═══ SIDEBAR ═══ */}
      <div
        style={{
          width: 320,
          minWidth: 320,
          borderRight: "1px solid #1a1a1a",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0a",
        }}
      >
        <div style={{ padding: "12px 12px 10px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", gap: 8 }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", color: "inherit", flex: 1 }}>
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "#666",
              }}
            >
              ←
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{project.title}</div>
              <div style={{ fontSize: 9, color: "#555" }}>Design Explorer</div>
            </div>
          </Link>
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="Project settings"
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              border: showSettings ? "1px solid rgba(255,255,255,0.2)" : "1px solid #222",
              background: showSettings ? "rgba(255,255,255,0.06)" : "transparent",
              color: showSettings ? "#fff" : "#555",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
          >
            <SlidersHorizontal size={13} strokeWidth={1.5} />
          </button>
        </div>

        <div style={{ display: "flex", padding: "6px 8px", gap: 3 }}>
          {(["variants", "chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1,
                padding: "5px 0",
                borderRadius: 6,
                border: "none",
                background: tab === t ? "#1a1a1a" : "transparent",
                color: tab === t ? "#fff" : "#555",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                textTransform: "capitalize",
              }}
            >
              {t === "variants" ? `Variants (${variants.length})` : "Chat"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflow: "auto", padding: "4px 8px" }}>
          {tab === "variants" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                ...variants.filter((v) => v.id === "original"),
                ...[...variants.filter((v) => v.id !== "original")].reverse(),
              ].map((v) => (
                <div key={v.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <Thumb
                    v={v}
                    sel={selId === v.id}
                    gen={genIds.has(v.id)}
                    onClick={() => {
                      setSelId(v.id);
                      setOnboard(false);
                      setView("single");
                      setShowStarred(false);
                    }}
                    onDel={v.id !== "original" ? del : undefined}
                    onStar={toggleStar}
                    parent={parent(v)}
                    isOriginal={v.id === "original"}
                  />
                  <div style={{ paddingLeft: 2 }}>
                    <div style={{ fontSize: 10, color: "#555", fontWeight: 500 }}>
                      {v.id === "original" ? "Imported initial design" : v.label}
                    </div>
                    {v.id !== "original" && parent(v) && (
                      <div style={{ fontSize: 9, color: "#333", marginTop: 1 }}>from {parent(v)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ flex: 1, overflow: "auto" }}>
                {chat.length === 0 ? (
                  <div style={{ padding: "20px 6px", textAlign: "center", color: "#444", fontSize: 11, lineHeight: 1.7 }}>
                    <div style={{ marginBottom: 8, display: "flex", justifyContent: "center", color: "#333" }}><MessageSquare size={18} strokeWidth={1.5} /></div>
                    Describe changes.
                    <br />
                    AI generates a real variation.
                  </div>
                ) : (
                  chat.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                        marginBottom: 6,
                        animation: "fadeIn 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "88%",
                          padding: "8px 11px",
                          borderRadius: m.role === "user" ? "11px 11px 2px 11px" : "11px 11px 11px 2px",
                          background: m.role === "user" ? "#1f1f1f" : "#1a1a1a",
                          color: m.role === "user" ? "#fff" : "#bbb",
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEnd} />
              </div>
            </div>
          )}
        </div>

        {err && (
          <div
            style={{
              margin: "0 8px 6px",
              padding: "6px 8px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 7,
              fontSize: 10,
              color: "#f87171",
              lineHeight: 1.4,
            }}
          >
            {err}
            <button
              onClick={() => setErr(null)}
              style={{ float: "right", background: "none", border: "none", color: "#f87171", cursor: "pointer", fontSize: 11, fontWeight: 700 }}
            >
              ✕
            </button>
          </div>
        )}

        <div style={{ padding: "8px 8px 10px", borderTop: "1px solid #1a1a1a" }}>
          {view === "single" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 }}>
              {ACTIONS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => (count > 1 ? genN(a.id, count) : gen1(a.id).then((nid) => nid && setSelId(nid)))}
                  disabled={anyGen}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "1px solid #1a1a1a",
                    background: "transparent",
                    color: anyGen ? "#333" : "#666",
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: anyGen ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    textAlign: "left",
                    width: "100%",
                    transition: "color 0.1s, border-color 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (!anyGen) {
                      e.currentTarget.style.color = "#fff";
                      e.currentTarget.style.borderColor = "#333";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = anyGen ? "#333" : "#666";
                    e.currentTarget.style.borderColor = "#1a1a1a";
                  }}
                >
                  <a.Icon size={12} strokeWidth={1.5} />
                  {a.label}
                  {count > 1 && <span style={{ fontSize: 9, color: "#444", fontWeight: 600, marginLeft: "auto" }}>×{count}</span>}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 9, color: "#444", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Per action:
              </span>
              {[1, 2].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 5,
                    border: count === n ? "1px solid rgba(255,255,255,0.3)" : "1px solid #222",
                    background: count === n ? "rgba(255,255,255,0.06)" : "transparent",
                    color: count === n ? "#fff" : "#555",
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (selectMode) { setSelectMode(false); setSelectedSnippets([]); }
                else { setSelectMode(true); setTab("chat"); }
              }}
              title={selectMode ? "Exit selection" : "Point & Edit"}
              style={{
                width: 26,
                height: 26,
                borderRadius: 6,
                border: selectMode ? "1px solid rgba(99,102,241,0.5)" : "1px solid #2a2a2a",
                background: selectMode ? "rgba(99,102,241,0.2)" : "transparent",
                color: selectMode ? "#a5b4fc" : "#555",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.15s, border-color 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!selectMode) {
                  e.currentTarget.style.borderColor = "#444";
                  e.currentTarget.style.color = "#aaa";
                }
              }}
              onMouseLeave={(e) => {
                if (!selectMode) {
                  e.currentTarget.style.borderColor = "#2a2a2a";
                  e.currentTarget.style.color = "#555";
                }
              }}
            >
              <MousePointer size={12} strokeWidth={1.5} />
            </button>
          </div>
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files[0];
              if (!file || !file.type.startsWith("image/")) return;
              const reader = new FileReader();
              reader.onload = () => setAttachedImage(reader.result as string);
              reader.readAsDataURL(file);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              background: isDragOver ? "#1c1c1c" : "#141414",
              borderRadius: 10,
              border: isDragOver ? "1px solid #555" : "1px solid #2e2e2e",
              padding: "10px 8px 8px 12px",
              transition: "border-color 0.15s, background 0.15s",
            }}
          >
            {selectedSnippets.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {selectedSnippets.map((s, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(99,102,241,0.12)",
                    border: "1px solid rgba(99,102,241,0.35)",
                    borderRadius: 6,
                    padding: "3px 4px 3px 8px",
                    fontSize: 10,
                    color: "#a5b4fc",
                  }}>
                    <MousePointer size={9} strokeWidth={1.5} style={{ flexShrink: 0, opacity: 0.7 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 100 }}>
                      {s.label}
                    </span>
                    <button
                      onClick={() => setSelectedSnippets((p) => p.filter((_, j) => j !== i))}
                      style={{
                        background: "none", border: "none", padding: "0 2px",
                        color: "rgba(165,180,252,0.6)", cursor: "pointer",
                        fontSize: 11, lineHeight: 1, flexShrink: 0,
                        display: "flex", alignItems: "center",
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            {attachedImage && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ position: "relative", display: "inline-flex" }}>
                  <img
                    src={attachedImage}
                    alt="attached"
                    style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #333" }}
                  />
                  <button
                    onClick={() => setAttachedImage(null)}
                    style={{
                      position: "absolute", top: -6, right: -6,
                      width: 16, height: 16, borderRadius: "50%",
                      background: "#333", border: "1px solid #555",
                      color: "#aaa", fontSize: 9, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      lineHeight: 1,
                    }}
                  >✕</button>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => setTab("chat")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendChat();
                  }
                }}
                placeholder={
                  isDragOver ? "Drop image here…"
                  : selectedSnippets.length > 0 ? `Edit ${selectedSnippets[0].label}…`
                  : "Describe changes… (or drop an image)"
                }
                rows={4}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: "#e0e0e0",
                  fontSize: 12,
                  fontFamily: "inherit",
                  resize: "none",
                  outline: "none",
                  lineHeight: 1.6,
                }}
              />
              <button
                onClick={sendChat}
                disabled={(!input.trim() && !attachedImage && selectedSnippets.length === 0) || anyGen}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  border: "none",
                  background: (() => {
                    const hasContent = input.trim() || attachedImage || selectedSnippets.length > 0;
                    if (!hasContent || anyGen) return "#222";
                    return selectedSnippets.length > 0 ? "#6366f1" : "#fff";
                  })(),
                  color: (input.trim() || attachedImage || selectedSnippets.length > 0) ? (selectedSnippets.length > 0 ? "#fff" : "#000") : "#555",
                  cursor: (input.trim() || attachedImage || selectedSnippets.length > 0) && !anyGen ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                ↑
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ═══ MAIN ═══ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {!seedFetched && variants.length === 0 ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#555", fontSize: 13 }}>
              Loading original page…
            </div>
          ) : (
            <>
              {/* Onboarding */}
              {onboard && variants.length === 1 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(5,5,5,0.9)",
                    backdropFilter: "blur(10px)",
                    animation: "fadeIn 0.3s ease",
                  }}
                >
                  <div style={{ textAlign: "center", maxWidth: 540, padding: 36, animation: "fadeIn 0.35s ease 0.1s both" }}>
                    <div style={{ marginBottom: 14, display: "flex", justifyContent: "center", color: "#444" }}><Sparkles size={24} strokeWidth={1.5} /></div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, letterSpacing: "-0.02em" }}>
                      Explore design directions
                    </h2>
                    <p style={{ fontSize: 13, color: "#777", lineHeight: 1.6, marginBottom: 28 }}>
                      Pick a direction to generate {count > 1 ? `${count} real variations` : "a real variation"} — powered by AI.
                    </p>
                    <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                      {DIRECTIONS.map((d, i) => (
                        <button
                          key={d.id}
                          onClick={() =>
                            count > 1 ? genN(d.id, count) : gen1(d.id).then((nid) => nid && (setSelId(nid), setOnboard(false)))
                          }
                          disabled={anyGen}
                          style={{
                            padding: "14px 18px",
                            borderRadius: 12,
                            border: "1px solid #222",
                            background: "#111",
                            color: "#fff",
                            cursor: anyGen ? "not-allowed" : "pointer",
                            textAlign: "left",
                            width: 120,
                            fontFamily: "inherit",
                            transition: "all 0.2s",
                            animation: `fadeIn 0.3s ease ${0.15 + i * 0.06}s both`,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 6px 16px rgba(255,255,255,0.04)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#222";
                            e.currentTarget.style.transform = "none";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div style={{ marginBottom: 8, color: "#666" }}><d.Icon size={16} strokeWidth={1.5} /></div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{d.label}</div>
                          <div style={{ fontSize: 10, color: "#555", lineHeight: 1.3 }}>{d.desc}</div>
                        </button>
                      ))}
                    </div>
                    <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <span style={{ fontSize: 10, color: "#444" }}>Generate</span>
                      {[1, 2].map((n) => (
                        <button
                          key={n}
                          onClick={() => setCount(n)}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 6,
                            border: count === n ? "1px solid rgba(255,255,255,0.3)" : "1px solid #222",
                            background: count === n ? "rgba(255,255,255,0.06)" : "transparent",
                            color: count === n ? "#fff" : "#555",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                          }}
                        >
                          {n}
                        </button>
                      ))}
                      <span style={{ fontSize: 10, color: "#444" }}>at a time</span>
                    </div>
                    <button
                      onClick={() => {
                        setOnboard(false);
                        setTab("chat");
                      }}
                      style={{
                        marginTop: 16,
                        background: "none",
                        border: "none",
                        color: "#555",
                        fontSize: 11,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                    >
                      Or describe what you want →
                    </button>
                  </div>
                </div>
              )}

              {/* Compare */}
              {view === "compare" ? (
                <div style={{ height: "100%", overflow: "auto", padding: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <button
                      onClick={() => { setView("single"); setCompareIds([]); }}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        border: "1px solid #222",
                        background: "transparent",
                        color: "#666",
                        fontSize: 10,
                        fontWeight: 500,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#444"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#222"; }}
                    >
                      ← Back
                    </button>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        compareIds.length <= 2 ? "1fr 1fr" : compareIds.length === 3 ? "1fr 1fr 1fr" : "1fr 1fr",
                      gap: 14,
                    }}
                  >
                    {compareIds.map((vid) => {
                      const v = variants.find((x) => x.id === vid);
                      if (!v) return null;
                      return <CompareCard key={v.id} v={v} gen={genIds.has(v.id)} onPick={pick} onDel={del} />;
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: 24 }}>
                  {showStarred ? (
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                        <button
                          onClick={() => setShowStarred(false)}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            padding: "4px 10px", borderRadius: 6,
                            border: "1px solid rgba(251,191,36,0.3)",
                            background: "rgba(251,191,36,0.08)",
                            color: "#fbbf24", fontSize: 10, fontWeight: 600,
                            cursor: "pointer", fontFamily: "inherit",
                          }}
                        >
                          <Star size={11} strokeWidth={2} fill="#fbbf24" /> Starred
                        </button>
                        <span style={{ fontSize: 10, color: "#444" }}>
                          {variants.filter((v) => v.starred).length} variant{variants.filter((v) => v.starred).length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {variants.filter((v) => v.starred).length === 0 ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 12 }}>
                          <div style={{ textAlign: "center" }}>
                            <Star size={24} strokeWidth={1.5} style={{ margin: "0 auto 8px", display: "block", color: "#333" }} />
                            No starred variants yet. Star variants from the sidebar.
                          </div>
                        </div>
                      ) : (
                        <div style={{ flex: 1, overflow: "auto" }}>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: variants.filter((v) => v.starred).length <= 2 ? "1fr 1fr" : "1fr 1fr 1fr",
                              gap: 14,
                            }}
                          >
                            {variants.filter((v) => v.starred).map((v) => (
                              <CompareCard key={v.id} v={v} gen={genIds.has(v.id)} onPick={pick} onDel={del} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                  <BrowserChrome
                    url={project.url}
                    style={{ flex: 1, minHeight: 0 }}
                    rightTools={
                      <div style={{ display: "flex", gap: 2 }}>
                        <button
                          onClick={() => setShowStarred(true)}
                          title="Show starred variants"
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 22, height: 22, borderRadius: 4, border: "none",
                            cursor: "pointer",
                            background: variants.some((v) => v.starred) ? "rgba(251,191,36,0.12)" : "transparent",
                            color: variants.some((v) => v.starred) ? "#fbbf24" : "#555",
                            transition: "background 0.1s, color 0.1s",
                            marginRight: 2,
                          }}
                        >
                          <Star size={13} strokeWidth={2} fill={variants.some((v) => v.starred) ? "#fbbf24" : "none"} />
                        </button>
                        {(["web", "mobile"] as const).map((v) => {
                          const Icon = v === "web" ? Monitor : Smartphone;
                          const active = viewport === v;
                          return (
                            <button
                              key={v}
                              onClick={() => setViewport(v)}
                              title={v === "web" ? "Desktop" : "Mobile"}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 22,
                                height: 22,
                                borderRadius: 4,
                                border: "none",
                                cursor: "pointer",
                                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                                color: active ? "#fff" : "#555",
                                transition: "background 0.1s, color 0.1s",
                              }}
                            >
                              <Icon size={13} />
                            </button>
                          );
                        })}
                      </div>
                    }
                  >
                    {selectMode && (
                      <div style={{
                        position: "absolute",
                        top: 10,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 10,
                        background: "rgba(67,56,202,0.92)",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 500,
                        padding: "5px 13px",
                        borderRadius: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        backdropFilter: "blur(6px)",
                        boxShadow: "0 2px 12px rgba(79,70,229,0.5)",
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        letterSpacing: "0.01em",
                      }}>
                        <MousePointer size={11} strokeWidth={1.5} />
                        Click a component to select
                      </div>
                    )}
                    {viewport === "mobile" ? (
                      <div style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        justifyContent: "center",
                        background: "#080808",
                        overflowY: "auto",
                      }}>
                        <div style={{ width: 390, height: "100%", position: "relative", flexShrink: 0 }}>
                          <StreamingPreview html={sel?.html ?? ""} generating={!!(sel && genIds.has(sel.id))} interactive selectionMode={selectMode} />
                        </div>
                      </div>
                    ) : (
                      <StreamingPreview html={sel?.html ?? ""} generating={!!(sel && genIds.has(sel.id))} interactive selectionMode={selectMode} />
                    )}
                  </BrowserChrome>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ═══ SETTINGS PANEL ═══ */}
        {showSettings && (
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: 280,
              background: "#0a0a0a",
              borderLeft: "1px solid #1a1a1a",
              display: "flex",
              flexDirection: "column",
              zIndex: 30,
              animation: "slideInRight 0.18s ease",
            }}
          >
            <div style={{ padding: "14px 14px 12px", borderBottom: "1px solid #1a1a1a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.06em" }}>Project settings</span>
              <button
                onClick={() => setShowSettings(false)}
                style={{ background: "none", border: "none", color: "#555", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 2 }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "16px 14px", display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Project context
                </div>
                <div style={{ fontSize: 10, color: "#444", marginBottom: 8, lineHeight: 1.6 }}>
                  Describe this project's purpose or audience. AI will use this when generating variations.
                </div>
                <textarea
                  value={projectContext}
                  onChange={(e) => {
                    const v = e.target.value;
                    setProjectContextState(v);
                    if (typeof id === "string") setProjectContext(id, v);
                  }}
                  placeholder={`e.g. "SaaS landing page for developers. Technical audience. Tone should be direct and confident."`}
                  rows={6}
                  style={{
                    width: "100%",
                    background: "#0f0f0f",
                    border: "1px solid #2a2a2a",
                    borderRadius: 6,
                    padding: "8px 10px",
                    color: "#e0e0e0",
                    fontSize: 11,
                    fontFamily: "inherit",
                    resize: "none",
                    outline: "none",
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#3a3a3a")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
                />
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#666", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Aesthetic preferences
                </div>
                {userContextPreview ? (
                  <div style={{
                    fontSize: 10,
                    color: "#555",
                    background: "#0f0f0f",
                    border: "1px solid #1f1f1f",
                    borderRadius: 6,
                    padding: "8px 10px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>
                    {userContextPreview.length > 200 ? userContextPreview.slice(0, 200) + "…" : userContextPreview}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: "#444", lineHeight: 1.6 }}>
                    No aesthetic preferences set.
                  </div>
                )}
                <a
                  href="/settings"
                  style={{ fontSize: 10, color: "#555", marginTop: 8, display: "inline-block", textDecoration: "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
                >
                  Edit in Settings →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
