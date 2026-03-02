"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/** Chunk HTML by element boundaries for streaming render. */
export function chunkHTMLByElements(html: string): string[] {
  const chunks: string[] = [];
  const bodyStart = html.indexOf("<body>");
  if (bodyStart === -1) return [html];

  chunks.push(html.slice(0, bodyStart + 6));

  const rest = html.slice(bodyStart + 6);
  const closeIdx = rest.lastIndexOf("</body>");
  const bodyContent = closeIdx !== -1 ? rest.slice(0, closeIdx) : rest;
  const tail = closeIdx !== -1 ? rest.slice(closeIdx) : "";

  let depth = 0;
  let buf = "";
  let i = 0;

  while (i < bodyContent.length) {
    if (bodyContent[i] === "<") {
      const end = bodyContent.indexOf(">", i);
      if (end === -1) {
        buf += bodyContent.slice(i);
        break;
      }

      const tag = bodyContent.slice(i, end + 1);
      const isClose = bodyContent[i + 1] === "/";
      const voidMatch = /^<(br|hr|img|input|meta|link|source|area|base|col|embed|param|track|wbr)\b/i.test(tag);
      const selfClose = tag.endsWith("/>") || voidMatch;

      buf += tag;
      i = end + 1;

      if (selfClose) continue;
      if (isClose) {
        depth--;
        if (depth <= 2 && buf.trim()) {
          chunks.push(buf);
          buf = "";
        }
      } else if (!voidMatch) {
        depth++;
      }
    } else {
      buf += bodyContent[i];
      i++;
    }
  }
  if (buf.trim()) chunks.push(buf);
  if (tail) chunks.push(tail);
  return chunks;
}

export interface UseIframeStreamingOptions {
  html: string;
  delayMs: number;
  startDelayMs?: number;
}

export function useIframeStreaming({
  html,
  delayMs,
  startDelayMs = 0,
}: UseIframeStreamingOptions) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const cancelledRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startScheduledRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const chunks = chunkHTMLByElements(html);
    setTotalChunks(chunks.length);
    setChunkIndex(0);
    setIsStreaming(true);
    setIsDone(false);
    cancelledRef.current = false;

    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();

    let idx = 0;

    const tick = () => {
      if (cancelledRef.current) {
        doc.close();
        return;
      }
      if (idx >= chunks.length) {
        doc.close();
        setIsStreaming(false);
        setIsDone(true);
        return;
      }

      doc.write(chunks[idx]);
      idx++;
      setChunkIndex(idx);

      if (idx >= chunks.length) {
        doc.close();
        setIsStreaming(false);
        setIsDone(true);
      } else {
        timeoutRef.current = setTimeout(tick, delayMs);
      }
    };

    tick();
  }, [html, delayMs]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (startScheduledRef.current) clearTimeout(startScheduledRef.current);
    timeoutRef.current = null;
    startScheduledRef.current = null;

    const iframe = iframeRef.current;
    if (iframe?.contentDocument) {
      try {
        iframe.contentDocument.open();
        iframe.contentDocument.close();
      } catch {}
    }

    setChunkIndex(0);
    setTotalChunks(0);
    setIsStreaming(false);
    setIsDone(false);
  }, []);

  useEffect(() => {
    if (startDelayMs <= 0) {
      start();
      return () => {
        cancelledRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }
    startScheduledRef.current = setTimeout(start, startDelayMs);
    return () => {
      cancelledRef.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (startScheduledRef.current) clearTimeout(startScheduledRef.current);
    };
  }, [start, startDelayMs]);

  return { iframeRef, isStreaming, isDone, start, reset, chunkIndex, totalChunks };
}
