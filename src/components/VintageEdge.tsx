"use client";

import { type EdgeProps, SmoothStepEdge } from "@xyflow/react";

export default function VintageEdge(props: EdgeProps) {
  return (
    <SmoothStepEdge
      {...props}
      pathOptions={{ borderRadius: 16 }}
      style={{
        stroke: "#78716c",
        strokeWidth: 1.5,
        strokeDasharray: "6 3",
        filter: "drop-shadow(0 0 2px rgba(120, 113, 108, 0.3))",
      }}
    />
  );
}
