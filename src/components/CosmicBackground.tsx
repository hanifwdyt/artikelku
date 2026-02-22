"use client";

import { memo, useEffect, useState, useMemo } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useMode } from "@/contexts/ModeContext";

const COLORS = {
  public: ["#ffffff", "#d6d3d1", "#a8a29e", "#d6b068", "#e7e5e4"],
  private: ["#ffffff", "#d6d3d1", "#a8a29e", "#68b5d6", "#e7e5e4"],
};

export default memo(function CosmicBackground() {
  const [init, setInit] = useState(false);
  const { mode } = useMode();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  const particlesOptions = useMemo(
    () => ({
      fullScreen: false,
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      particles: {
        color: {
          value: COLORS[mode],
        },
        links: {
          color: "#78716c",
          distance: 150,
          enable: true,
          opacity: 0.08,
          width: 0.5,
        },
        move: {
          enable: true,
          speed: 0.3,
          direction: "none" as const,
          random: true,
          straight: false,
          outModes: { default: "bounce" as const },
        },
        number: {
          value: 150,
          density: { enable: true },
        },
        opacity: {
          value: { min: 0.1, max: 0.8 },
          animation: {
            enable: true,
            speed: 0.5,
            startValue: "random" as const,
            sync: false,
          },
        },
        size: {
          value: { min: 0.3, max: 3 },
          animation: {
            enable: true,
            speed: 1,
            startValue: "random" as const,
            sync: false,
          },
        },
      },
      detectRetina: true,
    }),
    [mode]
  );

  if (!init) return null;

  return (
    <>
      <div className="cosmic-nebula" />
      <Particles
        key={mode}
        id={`cosmic-particles-${mode}`}
        className="fixed inset-0 z-0"
        options={particlesOptions}
      />
    </>
  );
});
