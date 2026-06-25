import type { ParticleKind } from "./ParticleEngine";
import type { ParticleMaterialName } from "./materials";
import type { ParticleShapeName } from "./particle-layers";
import { RendererFactory } from "./renderers/RendererFactory";

export type ParticleData = {
  id: number;
  x: number;
  y: number;
  size: number;
  blur: number;
  alpha: number;
  rotation?: number;
  rotate?: number;
  scaleX?: number;
  scaleY?: number;
  shape?: ParticleShapeName;
  debugColor?: string;
};

export function ParticleRenderer({
  kind,
  particle,
  material,
}: {
  kind: ParticleKind;
  particle: ParticleData;
  material?: ParticleMaterialName;
}) {
  return <RendererFactory kind={kind} particle={particle} material={material} />;
}
