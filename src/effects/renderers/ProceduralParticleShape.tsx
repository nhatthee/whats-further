import type { ParticleMaterialName } from "../materials";
import { getMaterial } from "../materials";
import type { ParticleShapeName } from "../particle-layers";
import type { ParticleData } from "../ParticleRenderer";
import { CircleShape, GlowShape, PetalShape } from "../shapes";

export function ProceduralParticleShape({
  shape,
  particle,
  material = "gold",
}: {
  shape: ParticleShapeName;
  particle: ParticleData;
  material?: ParticleMaterialName;
}) {
  const shapeMaterial = getMaterial(material);
  const rotation = particle.rotation ?? 0;
  // rotate, scaleX, and scaleY are reserved for motion behaviors; not applied yet.

  switch (shape) {
    case "tiny-petal":
      return (
        <PetalShape
          material={shapeMaterial}
          width={particle.size * 2.4}
          height={particle.size * 1.1}
          blur={particle.blur * 0.25}
          opacity={particle.alpha}
          rotate={rotation}
        />
      );
    case "soft-bokeh":
      return (
        <GlowShape
          material={shapeMaterial}
          width={particle.size * 4.8}
          height={particle.size * 4.8}
          blur={particle.blur}
          opacity={particle.alpha * 0.75}
          rotate={rotation}
        />
      );
    case "pollen":
      return (
        <GlowShape
          material={shapeMaterial}
          width={particle.size * 2.2}
          height={particle.size * 2.2}
          blur={particle.blur * 0.4}
          opacity={particle.alpha}
          rotate={rotation}
        />
      );
    case "dust":
    default:
      return (
        <CircleShape
          material={shapeMaterial}
          width={particle.size * 2.2}
          height={particle.size * 2.2}
          opacity={particle.alpha}
        />
      );
  }
}
