"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { motion } from "framer-motion";

export type ArticleNodeData = {
  title: string;
  status: "draft" | "published";
  slug: string;
  onEdit: (slug: string) => void;
};

function ArticleNodeComponent({ data }: NodeProps) {
  const { title, status, slug, onEdit } = data as unknown as ArticleNodeData;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      whileHover={{
        scale: 1.05,
        boxShadow: "0 0 30px rgba(120, 113, 108, 0.3)",
      }}
      onClick={() => onEdit(slug)}
      className="cursor-pointer group"
    >
      <div className="bg-[#1a1917]/90 backdrop-blur-sm border border-stone-500/30 rounded-xl px-5 py-4 min-w-[180px] max-w-[240px] transition-all group-hover:border-stone-400/50">
        <div className="flex items-center gap-2 mb-1">
          <div
            className={`w-2 h-2 rounded-full ${
              status === "published"
                ? "bg-emerald-400 shadow-emerald-400/50 shadow-sm"
                : "bg-amber-400 shadow-amber-400/50 shadow-sm"
            }`}
          />
          <span className="text-[10px] uppercase tracking-wider text-stone-500 font-medium">
            {status}
          </span>
        </div>
        <p className="text-sm font-medium text-stone-200 truncate">{title}</p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-stone-500 !w-2.5 !h-2.5 !border-0 opacity-0 group-hover:opacity-100 transition-opacity hover:!bg-amber-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-stone-500 !w-2.5 !h-2.5 !border-0 opacity-0 group-hover:opacity-100 transition-opacity hover:!bg-amber-400"
      />
    </motion.div>
  );
}

export default memo(ArticleNodeComponent);
