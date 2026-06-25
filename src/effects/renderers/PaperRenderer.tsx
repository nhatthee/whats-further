import type { ParticleData } from "../ParticleRenderer";

export function PaperRenderer({ particle }: { particle: ParticleData }) {
  const baseRotation = particle.id * 23;
  const behaviorRotation = particle.rotate ?? 0;
  const scaleX = particle.scaleX ?? 1;
  const scaleY = particle.scaleY ?? 1;

  return (
    <div
      style={{
        position: "absolute",
        left: particle.x,
        top: particle.y,
        transform: `translate(-50%, -50%) rotate(${baseRotation + behaviorRotation}deg) scaleX(${scaleX}) scaleY(${scaleY})`,
        pointerEvents: "none",
        width: 80,
        height: 48,
        background: "rgba(255, 0, 0, 0.95)",
        border: "3px solid white",
        boxShadow: "0 0 20px rgba(255,255,255,0.9)",
        mixBlendMode: "normal",
        opacity: 1,
        filter: "none",
      }}
    />
  );
}
