"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface CanvasToolbarProps {
  onNewArticle: () => void;
}

export default function CanvasToolbar({ onNewArticle }: CanvasToolbarProps) {
  const router = useRouter();

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
        <span className="text-sm font-semibold bg-gradient-to-r from-stone-300 to-amber-200 bg-clip-text text-transparent px-2 font-[family-name:var(--font-playfair)]">
          nulis
        </span>

        <div className="w-px h-5 bg-stone-500/20" />

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onNewArticle}
          className="px-3 py-1.5 text-sm bg-stone-700 hover:bg-stone-600 rounded-lg text-white transition-colors cursor-pointer"
        >
          + New Article
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
