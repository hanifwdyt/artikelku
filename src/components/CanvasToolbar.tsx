"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMode } from "@/contexts/ModeContext";

interface CanvasToolbarProps {
  onNewArticle: () => void;
}

export default function CanvasToolbar({ onNewArticle }: CanvasToolbarProps) {
  const router = useRouter();
  const { mode, toggleMode, isFlipping } = useMode();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2"
    >
      <div className="flex items-center gap-2 bg-[#1a1917]/80 backdrop-blur-xl border border-stone-500/25 rounded-xl px-3 py-2 shadow-lg shadow-stone-900/10">
        <span className="text-sm font-semibold bg-clip-text text-transparent px-2 font-[family-name:var(--font-playfair)]" style={{ backgroundImage: `linear-gradient(to right, #d6d3d1, var(--accent-light))` }}>
          nulis
        </span>

        <div className="w-px h-5 bg-stone-500/20" />

        {/* Mode Switch Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleMode}
          disabled={isFlipping}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: `rgba(var(--accent-rgb), 0.1)`,
            color: `var(--accent-light)`,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 2v6h-6" />
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
            <path d="M3 22v-6h6" />
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
          </svg>
          {mode === "public" ? "Public" : "Private"}
        </motion.button>

        <div className="w-px h-5 bg-stone-500/20" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewArticle}
          className="px-3 py-1.5 text-sm rounded-lg text-white transition-colors cursor-pointer"
          style={{ backgroundColor: `rgba(var(--accent-rgb), 0.2)` }}
        >
          {mode === "public" ? "+ New Article" : "+ New Entry"}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.open("/docs", "_blank")}
          className="px-3 py-1.5 text-sm text-stone-400 hover:text-stone-200 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
        >
          API Docs
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm text-stone-400 hover:text-stone-200 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
        >
          Logout
        </motion.button>
      </div>
    </motion.div>
  );
}
