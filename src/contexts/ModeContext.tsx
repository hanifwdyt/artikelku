"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AppMode } from "@/types";

interface ModeContextValue {
  mode: AppMode;
  toggleMode: () => void;
  isFlipping: boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>("public");
  const [isFlipping, setIsFlipping] = useState(false);

  const toggleMode = useCallback(() => {
    if (isFlipping) return;
    setIsFlipping(true);

    // Switch mode at midpoint of animation (400ms into 800ms)
    setTimeout(() => {
      setMode((prev) => (prev === "public" ? "private" : "public"));
    }, 400);

    // Animation complete
    setTimeout(() => {
      setIsFlipping(false);
    }, 800);
  }, [isFlipping]);

  return (
    <ModeContext.Provider value={{ mode, toggleMode, isFlipping }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error("useMode must be used within ModeProvider");
  return ctx;
}
