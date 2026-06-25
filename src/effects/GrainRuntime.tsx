import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

export type GrainRuntimeProps = {
  amount?: number;
  opacity?: number;
};

function seededNoise(x: number, y: number, frame: number): number {
  const value =
    Math.sin(x * 12.9898 + y * 78.233 + frame * 37.719) * 43758.5453;

  return value - Math.floor(value);
}

export function GrainRuntime({
  amount = 0,
  opacity,
}: GrainRuntimeProps) {
  const frame = useCurrentFrame();

  if (amount <= 0) {
    return null;
  }

  const resolvedOpacity = opacity ?? Math.min(0.28, amount);

  const dotCount = Math.round(220 * amount);

  return (
    <AbsoluteFill
      style={{
        zIndex: 50,
        overflow: "hidden",
        opacity: resolvedOpacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: dotCount }).map((_, index) => {
        const nx = seededNoise(index, 1, frame);
        const ny = seededNoise(index, 2, frame);
        const no = seededNoise(index, 3, frame);

        return (
          <span
            key={index}
            style={{
              position: "absolute",
              left: `${nx * 100}%`,
              top: `${ny * 100}%`,
              width: 1,
              height: 1,
              borderRadius: "999px",
              background: no > 0.5 ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.45)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
}
