import type { ParticleKind } from "../ParticleEngine";
import type { ParticleMaterialName } from "../materials";
import type { ParticleData } from "../ParticleRenderer";
import { DustRenderer } from "./DustRenderer";
import { PetalRenderer } from "./PetalRenderer";

// TODO: FireflyRenderer — currently falls back to DustRenderer
// TODO: SnowRenderer — currently falls back to DustRenderer
// TODO: AshRenderer — currently falls back to DustRenderer
// TODO: LightRenderer — currently falls back to DustRenderer
// TODO: PaperRenderer — experimental only; import directly in MotionLab

const rendererRegistry = {
  dust: DustRenderer,
  petal: PetalRenderer,
  firefly: DustRenderer,
  snow: DustRenderer,
  ash: DustRenderer,
  light: DustRenderer,
} as const;

export function RendererFactory({
  kind,
  particle,
  material,
}: {
  kind: ParticleKind;
  particle: ParticleData;
  material?: ParticleMaterialName;
}) {
  const Renderer = rendererRegistry[kind] ?? DustRenderer;

  return <Renderer particle={particle} material={material} />;
}
