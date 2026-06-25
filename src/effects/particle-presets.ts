import type { ParticleKind } from "./ParticleEngine";
import type { ForceFieldType } from "./ForceField";
import type { ParticleShapeName } from "./particle-layers";

export type ParticlePresetName =
  | "golden-sunset"
  | "quiet-morning"
  | "lonely-rain"
  | "winter-night";

export type ParticlePreset = {
  kind: ParticleKind;
  count: number;
  seed: number;
  opacity: number;
  force: ForceFieldType;
  speedScale?: number;
  material?: import("./materials").ParticleMaterialName;
  shapeMix: ParticleShapeName[];
};

// TODO: depthBias
// TODO: spawnBias
// TODO: material
// TODO: geometry
// TODO: color temperature
// TODO: camera preset
// TODO: subtitle mood

export const ParticlePresets: Record<ParticlePresetName, ParticlePreset> = {
  "golden-sunset": {
    kind: "petal",
    count: 28,
    seed: 11,
    opacity: 1,
    force: "swirl",
    speedScale: 2.2,
    shapeMix: ["tiny-petal", "soft-bokeh", "pollen"],
  },

  "quiet-morning": {
    kind: "dust",
    count: 90,
    seed: 7,
    opacity: 0.65,
    force: "breeze",
    shapeMix: ["dust", "pollen", "soft-bokeh"],
  },

  "lonely-rain": {
    kind: "dust",
    count: 45,
    seed: 19,
    opacity: 0.45,
    force: "breeze",
    shapeMix: ["dust", "soft-bokeh"],
  },

  "winter-night": {
    kind: "snow",
    count: 120,
    seed: 29,
    opacity: 0.7,
    force: "breeze",
    shapeMix: ["dust", "pollen", "soft-bokeh"],
  },
};

export function getParticlePreset(
  preset: ParticlePresetName,
): ParticlePreset {
  return ParticlePresets[preset];
}
