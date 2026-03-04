"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/** Ensures the Tailwind CDN script is present in the document. */
export function injectTailwindCDN(html: string): string {
  const tag = '<script src="https://cdn.tailwindcss.com"></script>';
  if (html.includes("cdn.tailwindcss.com")) return html;
  if (html.includes("</head>")) return html.replace("</head>", `${tag}\n</head>`);
  if (html.includes("<head>")) return html.replace("<head>", `<head>\n${tag}`);
  return tag + "\n" + html;
}

/** Inject an element-picker postMessage script before </body> for selection mode. */
export function injectSelectionScript(html: string): string {
  const script = `<script>(function(){
    var SEL_STYLE='2px solid rgba(99,102,241,0.9)';
    var HVR_STYLE='2px solid rgba(99,102,241,0.4)';
    var SKIP=new Set(['HTML','BODY','HEAD','SCRIPT','STYLE','LINK','META','NOSCRIPT']);
    var selected=new Set();
    var hovered=null;
    function label(el){
      var tag=el.tagName.toLowerCase();
      var text=(el.innerText||'').trim().replace(/\\s+/g,' ').slice(0,40);
      return text?tag+' \u00b7 "'+text+'"':tag;
    }
    function broadcast(){
      var snippets=Array.from(selected).map(function(el){return{html:el.outerHTML,label:label(el)};});
      window.parent.postMessage({type:'soupcan-selection',snippets:snippets},'*');
    }
    document.addEventListener('mouseover',function(e){
      var el=e.target;if(SKIP.has(el.tagName)||selected.has(el))return;
      if(hovered&&hovered!==el){hovered.style.outline='';hovered.style.cursor='';}
      hovered=el;el.style.outline=HVR_STYLE;el.style.cursor='crosshair';
    },true);
    document.addEventListener('mouseout',function(e){
      var el=e.target;
      if(el===hovered&&!selected.has(el)){el.style.outline='';el.style.cursor='';hovered=null;}
    },true);
    document.addEventListener('click',function(e){
      e.preventDefault();e.stopPropagation();
      var el=e.target;if(SKIP.has(el.tagName))return;
      if(selected.has(el)){selected.delete(el);el.style.outline='';el.style.cursor='';}
      else{selected.add(el);el.style.outline=SEL_STYLE;}
      broadcast();
    },true);
  })();<\/script>`;
  if (html.includes("</body>")) return html.replace("</body>", script + "</body>");
  return html + script;
}

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

    const chunks = chunkHTMLByElements(injectTailwindCDN(html));
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
