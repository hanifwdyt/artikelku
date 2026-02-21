"use client";

import { memo, useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

const particlesOptions = {
  fullScreen: false,
  background: { color: { value: "transparent" } },
  fpsLimit: 60,
  particles: {
    color: {
      value: ["#ffffff", "#d6d3d1", "#a8a29e", "#d6b068", "#e7e5e4"],
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
};

export default memo(function CosmicBackground() {
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));
  }, []);

  if (!init) return null;

  return (
    <>
      <div className="cosmic-nebula" />
      <Particles
        id="cosmic-particles"
        className="fixed inset-0 z-0"
        options={particlesOptions}
      />
    </>
  );
});
