import type { ShapeProps } from "./types";

export function GlowShape({
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
        width,
        height,
        borderRadius: "999px",
        background: material.background,
        boxShadow: material.boxShadow,
        opacity: opacity * (material.opacity ?? 1),
        filter: `blur(${blur + 2}px)`,
        transform: `rotate(${rotate}deg)`,
      }}
    />
  );
}
