"use client";

import { useEffect, useRef, useState } from "react";
import { NodeViewWrapper, NodeViewContent, type NodeViewProps } from "@tiptap/react";
import mermaid from "mermaid";

let mermaidInitialized = false;
function initMermaid() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
  });
  mermaidInitialized = true;
}

export default function MermaidNodeView(props: NodeViewProps) {
  const { node, updateAttributes } = props;
  const language = (node.attrs.language as string) || "";
  const code = node.textContent;
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");
  const idRef = useRef(`mermaid-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (language !== "mermaid" || !code.trim()) {
      setSvg("");
      setError("");
      return;
    }

    initMermaid();
    let cancelled = false;
    (async () => {
      try {
        const { svg: rendered } = await mermaid.render(idRef.current, code);
        if (!cancelled) {
          setSvg(rendered);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message.slice(0, 200) : "Render error");
          setSvg("");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  const isMermaid = language === "mermaid";

  return (
    <NodeViewWrapper className="code-block-wrapper my-3">
      <div className="flex items-center justify-between bg-[#0f0e0c]/60 border border-stone-500/20 border-b-0 rounded-t-lg px-3 py-1.5">
        <select
          value={language}
          onChange={(e) => updateAttributes({ language: e.target.value || null })}
          contentEditable={false}
          className="text-[10px] uppercase tracking-wider bg-transparent text-stone-400 border-none outline-none cursor-pointer hover:text-stone-200"
        >
          <option value="">plain</option>
          <option value="mermaid">mermaid</option>
          <option value="typescript">typescript</option>
          <option value="javascript">javascript</option>
          <option value="tsx">tsx</option>
          <option value="jsx">jsx</option>
          <option value="json">json</option>
          <option value="bash">bash</option>
          <option value="shell">shell</option>
          <option value="python">python</option>
          <option value="ruby">ruby</option>
          <option value="go">go</option>
          <option value="rust">rust</option>
          <option value="java">java</option>
          <option value="css">css</option>
          <option value="html">html</option>
          <option value="sql">sql</option>
          <option value="yaml">yaml</option>
          <option value="markdown">markdown</option>
        </select>
      </div>
      <pre className="!mt-0 !rounded-t-none">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <NodeViewContent {...({ as: "code" } as any)} className={language ? `language-${language}` : ""} />
      </pre>

      {isMermaid && (
        <div
          contentEditable={false}
          className="mt-2 p-3 bg-[#0f0e0c]/40 border border-stone-500/20 rounded-lg"
        >
          <div className="text-[10px] uppercase tracking-wider text-stone-500 mb-2">
            Diagram Preview
          </div>
          {error ? (
            <div className="text-xs text-red-400 font-mono">{error}</div>
          ) : svg ? (
            <div
              className="mermaid-preview flex justify-center"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div className="text-xs text-stone-600 italic">Type Mermaid code above to preview...</div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
}
