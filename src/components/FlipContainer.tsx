"use client";

import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useMode } from "@/contexts/ModeContext";

export default function FlipContainer({ children }: { children: ReactNode }) {
  const { mode, isFlipping } = useMode();

  // Sync data-mode attribute on <body>
  useEffect(() => {
    document.body.setAttribute("data-mode", mode);
  }, [mode]);

  return (
    <div style={{ perspective: "2000px" }} className="w-full h-full">
      <motion.div
        animate={
          isFlipping
            ? { rotateY: [0, 90, 90, 0] }
            : { rotateY: 0 }
        }
        transition={
          isFlipping
            ? { duration: 0.8, times: [0, 0.45, 0.55, 1], ease: "easeInOut" }
            : { duration: 0 }
        }
        style={{ transformStyle: "preserve-3d" }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
