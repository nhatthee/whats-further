import React from "react";
import { AbsoluteFill } from "remotion";

export type ContrastRuntimeProps = {
  amount?: number;
  opacity?: number;
};

export function ContrastRuntime({
  amount = 0,
  opacity,
}: ContrastRuntimeProps) {
  if (amount <= 0) {
    return null;
  }

  const resolvedOpacity = opacity ?? Math.min(0.32, amount * 0.38);

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 45,
        overflow: "hidden",
        opacity: resolvedOpacity,
        mixBlendMode: "soft-light",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.04) 28%, rgba(0,0,0,0.24) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(255,255,255,0.06) 42%, rgba(0,0,0,0.22) 100%)",
        }}
      />
    </AbsoluteFill>
  );
}
