import type { ShapeProps } from "./types";

export function SnowShape(props: ShapeProps) {
  return (
    <div
      style={{
        width: props.width,
        height: props.height,
        borderRadius: "999px",
        background: props.material.background,
        boxShadow: props.material.boxShadow,
        opacity: props.opacity ?? 1,
        filter: `blur(${props.blur ?? 0}px)`,
        transform: `rotate(${props.rotate ?? 0}deg)`,
      }}
    />
  );
}
