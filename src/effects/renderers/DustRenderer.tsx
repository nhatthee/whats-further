import {
  Amber,
  Gold,
  Ivory,
  getMaterial,
  type ParticleMaterialName,
} from "../materials";
import type { Material } from "../materials/types";
import type { ParticleData } from "../ParticleRenderer";
import { CircleShape, GlowShape } from "../shapes";

export type DustVariant = "mote" | "spark" | "soft" | "wide" | "ellipse";

// TODO: Weighted variant selection
// TODO: Variant by depth
// TODO: Variant by mood
// TODO: Variant by light direction

function getDustVariant(id: number): DustVariant {
  const variants: DustVariant[] = ["mote", "spark", "soft", "wide", "ellipse"];
  return variants[id % variants.length];
}

function getVariantMaterial(
  variant: DustVariant,
  material?: ParticleMaterialName,
): Material {
  if (material) {
    return getMaterial(material);
  }

  switch (variant) {
    case "mote":
      return Gold;
    case "spark":
      return Ivory;
    case "soft":
      return Gold;
    case "wide":
      return Amber;
    case "ellipse":
      return Gold;
  }
}

function renderVariantShape(
  variant: DustVariant,
  particle: ParticleData,
  material?: ParticleMaterialName,
): React.ReactNode {
  const shapeMaterial = getVariantMaterial(variant, material);

  switch (variant) {
    case "mote":
      return (
        <CircleShape
          material={shapeMaterial}
          width={particle.size * 2.5}
          height={particle.size * 2.5}
        />
      );
    case "spark":
      return (
        <GlowShape
          material={shapeMaterial}
          width={particle.size * 2}
          height={particle.size * 2}
        />
      );
    case "soft":
      return (
        <GlowShape
          material={shapeMaterial}
          width={particle.size * 4}
          height={particle.size * 4}
          opacity={0.65}
        />
      );
    case "wide":
      return (
        <CircleShape
          material={shapeMaterial}
          width={particle.size * 5}
          height={particle.size * 2.2}
          opacity={0.7}
        />
      );
    case "ellipse":
      return (
        <GlowShape
          material={shapeMaterial}
          width={particle.size * 2}
          height={particle.size * 4.5}
          opacity={0.75}
        />
      );
  }
}

export function DustRenderer({
  particle,
  material,
}: {
  particle: ParticleData;
  material?: ParticleMaterialName;
}) {
  const variant = getDustVariant(particle.id);

  const outerStyle: React.CSSProperties = {
    position: "absolute",
    left: particle.x,
    top: particle.y,
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    opacity: particle.alpha,
    filter: `blur(${particle.blur}px)`,
    mixBlendMode: "screen",
  };

  return (
    <div style={outerStyle}>
      {renderVariantShape(variant, particle, material)}
    </div>
  );
}
