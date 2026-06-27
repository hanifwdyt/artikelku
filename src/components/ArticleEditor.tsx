"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import EditorToolbar from "./EditorToolbar";
import MermaidNodeView from "./MermaidNodeView";
import type { Article, ArticleLink } from "@/types";

const lowlight = createLowlight(common);

const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(MermaidNodeView);
  },
}).configure({ lowlight, defaultLanguage: "plaintext" });

interface ArticleEditorProps {
  article: Article;
  allArticles: Article[];
  nodeRect: DOMRect | null;
  onClose: () => void;
}

export default function ArticleEditor({
  article,
  allArticles,
  nodeRect,
  onClose,
}: ArticleEditorProps) {
  const [title, setTitle] = useState(article.title);
  const [status, setStatus] = useState(article.status);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [references, setReferences] = useState<string[]>([]);
  const [originalRefs, setOriginalRefs] = useState<string[]>([]);
  const [refSearch, setRefSearch] = useState("");
  const [showRefDropdown, setShowRefDropdown] = useState(false);
  const [linksLoaded, setLinksLoaded] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const initialLoadRef = useRef(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const otherArticles = useMemo(
    () => allArticles.filter((a) => a.id !== article.id),
    [allArticles, article.id]
  );

  // Load existing references
  useEffect(() => {
    async function loadLinks() {
      try {
        const res = await fetch("/api/links");
        if (!res.ok) return;
        const links: ArticleLink[] = await res.json();
        const outgoing = links
          .filter((l) => l.sourceId === article.id)
          .map((l) => l.targetId);
        setReferences(outgoing);
        setOriginalRefs(outgoing);
      } catch {
        // ignore
      } finally {
        setLinksLoaded(true);
      }
    }
    loadLinks();
  }, [article.id]);

  const filteredArticles = useMemo(() => {
    return otherArticles.filter(
      (a) =>
        !references.includes(a.id) &&
        a.title.toLowerCase().includes(refSearch.toLowerCase())
    );
  }, [otherArticles, references, refSearch]);

  const addReference = useCallback((id: string) => {
    setReferences((prev) => [...prev, id]);
    setRefSearch("");
    setShowRefDropdown(false);
  }, []);

  const removeReference = useCallback((id: string) => {
    setReferences((prev) => prev.filter((r) => r !== id));
  }, []);

  const getArticleTitle = useCallback(
    (id: string) => {
      const a = allArticles.find((art) => art.id === id);
      return a?.title || "Unknown";
    },
    [allArticles]
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      CustomCodeBlock,
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Start writing..." }),
      Link.configure({ openOnClick: false }),
    ],
    content: (() => {
      try {
        const parsed = JSON.parse(article.content);
        if (parsed && typeof parsed === "object" && parsed.type) return parsed;
        return "";
      } catch {
        return "";
      }
    })(),
    editorProps: {
      attributes: {
        class: "tiptap prose-invert focus:outline-none min-h-[300px]",
      },
    },
    onUpdate: () => {
      setIsDirty(true);
    },
  });

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    setIsDirty(true);
  }, [title, status]);

  useEffect(() => {
    if (!linksLoaded) return;
    const refsChanged =
      references.length !== originalRefs.length ||
      references.some((r) => !originalRefs.includes(r));
    if (refsChanged) setIsDirty(true);
  }, [references, originalRefs, linksLoaded]);

  const syncReferences = useCallback(async () => {
    const toAdd = references.filter((r) => !originalRefs.includes(r));
    const toRemove = originalRefs.filter((r) => !references.includes(r));

    // Create new links
    for (const targetId of toAdd) {
      await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: article.id, targetId }),
      });
    }

    // Delete removed links — need to find link IDs
    if (toRemove.length > 0) {
      const res = await fetch("/api/links");
      if (res.ok) {
        const links: ArticleLink[] = await res.json();
        for (const targetId of toRemove) {
          const link = links.find(
            (l) => l.sourceId === article.id && l.targetId === targetId
          );
          if (link) {
            await fetch(`/api/links/${link.id}`, { method: "DELETE" });
          }
        }
      }
    }
  }, [references, originalRefs, article.id]);

  const persist = useCallback(
    async (override?: { status?: "draft" | "published" }) => {
      if (!editor) return false;
      const content = JSON.stringify(editor.getJSON());
      const contentHtml = editor.getHTML();
      const finalStatus = override?.status ?? status;

      const res = await fetch(`/api/articles/${article.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, contentHtml, status: finalStatus }),
      });

      if (!res.ok) return false;

      if (linksLoaded) {
        await syncReferences();
        setOriginalRefs(references);
      }
      setLastSavedAt(new Date());
      setIsDirty(false);
      return true;
    },
    [editor, title, status, article.slug, syncReferences, linksLoaded, references]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    const ok = await persist();
    setSaving(false);
    if (ok) onClose();
  }, [persist, onClose]);

  // Auto-save tiap 30 detik kalau dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (isDirty && !saving && editor) {
        persist();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isDirty, saving, editor, persist]);

  // Warning kalau ada perubahan belum disimpan
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const handleDelete = useCallback(async () => {
    if (!confirm("Delete this article?")) return;
    setDeleting(true);
    await fetch(`/api/articles/${article.slug}`, { method: "DELETE" });
    setDeleting(false);
    onClose();
  }, [article.slug, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, handleSave]);

  // Auto-scroll: smooth rAF loop, pause on click or when reaching bottom
  useEffect(() => {
    if (!isAutoScrolling) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    let animId: number;
    let accum = 0;

    const step = () => {
      accum += 0.4; // px per frame @ 60fps ≈ 24px/s
      if (accum >= 1) {
        const px = Math.floor(accum);
        container.scrollTop += px;
        accum -= px;
      }
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - 2) {
        setIsAutoScrolling(false);
        return;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isAutoScrolling]);

  const originX = nodeRect
    ? (nodeRect.x + nodeRect.width / 2) / window.innerWidth
    : 0.5;
  const originY = nodeRect
    ? (nodeRect.y + nodeRect.height / 2) / window.innerHeight
    : 0.5;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.3 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        style={{
          transformOrigin: `${originX * 100}% ${originY * 100}%`,
        }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
      >
        <div
          className="w-full max-w-3xl max-h-[85vh] bg-[#1a1917]/95 backdrop-blur-xl border border-stone-500/25 rounded-2xl shadow-2xl shadow-stone-900/30 flex flex-col pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 pb-0">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Article title..."
              className="text-xl font-bold bg-transparent border-none outline-none text-stone-200 placeholder-stone-500 flex-1 mr-4 font-[family-name:var(--font-playfair)]"
            />
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setStatus((s) => (s === "draft" ? "published" : "draft"))
                }
                className="px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer border"
                style={
                  status === "published"
                    ? {
                        backgroundColor: "rgba(16, 185, 129, 0.2)",
                        color: "#34d399",
                        borderColor: "rgba(16, 185, 129, 0.3)",
                      }
                    : {
                        backgroundColor: `rgba(var(--accent-rgb), 0.2)`,
                        color: `var(--accent-light)`,
                        borderColor: `rgba(var(--accent-rgb), 0.3)`,
                      }
                }
              >
                {status}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-1.5 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Editor */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-5"
            onMouseDown={() => isAutoScrolling && setIsAutoScrolling(false)}
          >
            <EditorToolbar
              editor={editor}
              isAutoScrolling={isAutoScrolling}
              onToggleAutoScroll={() => setIsAutoScrolling((v) => !v)}
            />
            <EditorContent editor={editor} />
          </div>

          {/* References */}
          {linksLoaded && otherArticles.length > 0 && (
            <div className="px-5 pb-3 border-t border-stone-500/10 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                  References
                </span>
              </div>

              {/* Selected pills */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {references.map((refId) => (
                  <span
                    key={refId}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-stone-700/50 text-stone-300 border border-stone-500/20 rounded-full"
                  >
                    {getArticleTitle(refId)}
                    <button
                      onClick={() => removeReference(refId)}
                      className="text-stone-500 hover:text-stone-300 cursor-pointer ml-0.5"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              {/* Search input */}
              <div className="relative">
                <input
                  type="text"
                  value={refSearch}
                  onChange={(e) => {
                    setRefSearch(e.target.value);
                    setShowRefDropdown(true);
                  }}
                  onFocus={() => setShowRefDropdown(true)}
                  placeholder="Search articles to reference..."
                  className="w-full px-3 py-1.5 text-xs bg-[#292524]/60 border border-stone-500/20 rounded-lg text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-400/40 transition-all"
                />

                {/* Dropdown */}
                {showRefDropdown && filteredArticles.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-32 overflow-y-auto bg-[#292524] border border-stone-500/20 rounded-lg shadow-lg z-10">
                    {filteredArticles.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => addReference(a.id)}
                        className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:bg-stone-700/50 transition-colors cursor-pointer"
                        style={{ }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = `var(--accent-light)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = "";
                        }}
                      >
                        {a.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Click outside to close dropdown */}
              {showRefDropdown && (
                <div
                  className="fixed inset-0 z-[5]"
                  onClick={() => setShowRefDropdown(false)}
                />
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between p-5 pt-3 border-t border-stone-500/10">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </motion.button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-600">
                {saving
                  ? "Saving…"
                  : isDirty
                  ? "Unsaved changes"
                  : lastSavedAt
                  ? `Saved ${lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                  : "Cmd+S to save"}
              </span>
              {status !== "published" ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setSaving(true);
                    setStatus("published");
                    const ok = await persist({ status: "published" });
                    setSaving(false);
                    if (ok) onClose();
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
                  style={{
                    backgroundColor: "rgba(16, 185, 129, 0.85)",
                    color: "#fff",
                  }}
                  title="Publish to blog.hanif.app"
                >
                  Publish to Blog
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setSaving(true);
                    setStatus("draft");
                    const ok = await persist({ status: "draft" });
                    setSaving(false);
                    if (ok) onClose();
                  }}
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg text-stone-300 border border-stone-500/30 hover:bg-stone-700/40 transition-colors cursor-pointer disabled:opacity-50"
                  title="Unpublish — kembali ke draft"
                >
                  Unpublish
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm bg-stone-700 hover:bg-stone-600 disabled:bg-stone-700/50 rounded-lg text-white font-medium transition-colors cursor-pointer"
              >
                {saving ? "Saving..." : "Save"}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
