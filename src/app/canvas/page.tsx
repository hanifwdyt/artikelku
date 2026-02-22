"use client";

import dynamic from "next/dynamic";
import FlipContainer from "@/components/FlipContainer";

const CanvasView = dynamic(() => import("@/components/CanvasView"), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen flex items-center justify-center">
      <div className="text-stone-400">Loading canvas...</div>
    </div>
  ),
});

export default function CanvasPage() {
  return (
    <FlipContainer>
      <CanvasView />
    </FlipContainer>
  );
}
