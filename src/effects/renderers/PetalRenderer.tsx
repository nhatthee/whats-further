import { Gold, getMaterial, type ParticleMaterialName } from "../materials";
import type { ParticleData } from "../ParticleRenderer";
import { PetalShape } from "../shapes";

// TODO: petal curve variation
// TODO: depth-based rotation
// TODO: wind-responsive rotation
// TODO: petal color palettes

export function PetalRenderer({
  particle,
  material,
}: {
  particle: ParticleData;
  material?: ParticleMaterialName;
}) {
  const shapeMaterial = material ? getMaterial(material) : Gold;
  const baseRotation = particle.id * 37;
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
        mixBlendMode: "screen",
      }}
    >
      <PetalShape
        width={particle.size * 5}
        height={particle.size * 2.2}
        blur={particle.blur * 0.4}
        opacity={particle.alpha}
        rotate={0}
        material={shapeMaterial}
      />
    </div>
  );
}
