"use client";

import dynamic from "next/dynamic";

const FloatingMusicPlayer = dynamic(
  () => import("@/components/FloatingMusicPlayer"),
  { ssr: false }
);

export default function FloatingMusicPlayerWrapper() {
  return <FloatingMusicPlayer />;
}
