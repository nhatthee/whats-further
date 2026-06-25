import type { ShapeProps } from "./types";

export function PaperShape({
  width,
  height,
  blur = 0,
  opacity = 1,
  rotate = 0,
  material,
}: ShapeProps) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        width,
        height,
        borderRadius: "2px",
        background:
          material.background ??
          "linear-gradient(135deg, rgba(255,246,220,0.95), rgba(230,185,95,0.72))",
        boxShadow:
          material.boxShadow ??
          "0 0 14px rgba(255,220,140,0.3), inset 0 0 8px rgba(255,255,255,0.25)",
        opacity,
        filter: `blur(${blur}px)`,
        transform: `rotate(${rotate}deg) scaleX(1)`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 48%, rgba(120,80,20,0.12) 52%, transparent 100%)",
          opacity: 0.5,
          borderRadius: "inherit",
        }}
      />
    </div>
  );
}
