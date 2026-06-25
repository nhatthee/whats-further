import React from "react";
import { AbsoluteFill } from "remotion";

export type LightRuntimeProps = {
  softness?: number;
  color?: string;
  intensity?: number;
};

export function LightRuntime({
  softness = 0,
  color = "rgba(255, 231, 196, 1)",
  intensity,
}: LightRuntimeProps) {
  if (softness <= 0) {
    return null;
  }

  const resolvedIntensity = intensity ?? Math.min(0.42, softness * 0.46);

  const blur = 80 + softness * 180;
  const size = 42 + softness * 32;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 40,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: `${size}%`,
          height: `${size}%`,
          left: "-10%",
          top: "-8%",
          borderRadius: "999px",
          background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 68%)`,
          opacity: resolvedIntensity,
          filter: `blur(${blur}px)`,
          transform: "translateZ(0)",
        }}
      />

      <div
        style={{
          position: "absolute",
          width: `${size * 0.75}%`,
          height: `${size * 0.75}%`,
          right: "-12%",
          bottom: "8%",
          borderRadius: "999px",
          background: `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 72%)`,
          opacity: resolvedIntensity * 0.42,
          filter: `blur(${blur * 0.8}px)`,
          transform: "translateZ(0)",
        }}
      />
    </AbsoluteFill>
  );
}
