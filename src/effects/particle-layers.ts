import { clampParticleOpacity } from "./particle-debug";

export type ParticleLayerName = "background" | "mid" | "foreground";

export type ParticleShapeName =
  | "dust"
  | "tiny-petal"
  | "soft-bokeh"
  | "pollen";

export const PARTICLE_LAYER_ORDER: ParticleLayerName[] = [
  "background",
  "mid",
  "foreground",
];

export const PARTICLE_LAYER_DISTRIBUTION: Record<ParticleLayerName, number> = {
  background: 0.6,
  mid: 0.3,
  foreground: 0.1,
};

export const PARTICLE_LAYER_TRAITS: Record<
  ParticleLayerName,
  {
    sizeMultiplier: number;
    opacityMultiplier: number;
    speedMultiplier: number;
    blur: number;
    parallaxMultiplier: number;
  }
> = {
  background: {
    sizeMultiplier: 0.6,
    opacityMultiplier: 0.5,
    speedMultiplier: 1.3,
    blur: 1.2,
    parallaxMultiplier: 0.85,
  },
  mid: {
    sizeMultiplier: 1,
    opacityMultiplier: 1,
    speedMultiplier: 1,
    blur: 0.8,
    parallaxMultiplier: 1,
  },
  foreground: {
    sizeMultiplier: 1.8,
    opacityMultiplier: 1.2,
    speedMultiplier: 0.6,
    blur: 2.8,
    parallaxMultiplier: 1.18,
  },
};

export const DEFAULT_PARTICLE_SHAPE_MIX: ParticleShapeName[] = [
  "dust",
  "pollen",
  "soft-bokeh",
  "tiny-petal",
];

export type ParticleLayerDefinition = {
  id: number;
  layer: ParticleLayerName;
  x: number;
  y: number;
  baseSize: number;
  baseSpeed: number;
  drift: number;
  baseAlpha: number;
  baseRotation: number;
  rotationSpeed: number;
  swayAmount: number;
  horizontalSway: number;
  sineAmount: number;
  swaySpeed: number;
  driftSpeed: number;
  phaseOffset: number;
  shape: ParticleShapeName;
  startOffset: number;
};

export type ParticleSimulationTuning = {
  sizeMultiplier: number;
  opacityMultiplier: (opacity: number) => number;
  speedMultiplier: (speed: number) => number;
  debugParticles: boolean;
  debugHud: boolean;
};

function random(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

export function splitParticleCountByLayer(total: number): Record<
  ParticleLayerName,
  number
> {
  const safeTotal = Math.max(0, Math.round(total));
  const background = Math.round(safeTotal * PARTICLE_LAYER_DISTRIBUTION.background);
  const foreground = Math.round(
    safeTotal * PARTICLE_LAYER_DISTRIBUTION.foreground,
  );
  const mid = Math.max(0, safeTotal - background - foreground);

  return {
    background,
    mid,
    foreground,
  };
}

function biasedPosition(
  seed: number,
  width: number,
  height: number,
): { x: number; y: number } {
  if (random(seed + 11) < 0.65) {
    return {
      x: (0.45 + random(seed + 12) * 0.55) * width,
      y: random(seed + 13) * 0.55 * height,
    };
  }

  return {
    x: random(seed + 14) * width,
    y: random(seed + 15) * height,
  };
}

function pickParticleShape(
  seed: number,
  shapeMix: ParticleShapeName[],
): ParticleShapeName {
  const mix = shapeMix.length > 0 ? shapeMix : DEFAULT_PARTICLE_SHAPE_MIX;
  return mix[Math.floor(random(seed + 21) * mix.length)] ?? "dust";
}

function createLayerParticles({
  layer,
  count,
  seed,
  width,
  height,
  shapeMix,
  idOffset,
}: {
  layer: ParticleLayerName;
  count: number;
  seed: number;
  width: number;
  height: number;
  shapeMix: ParticleShapeName[];
  idOffset: number;
}): ParticleLayerDefinition[] {
  const particles: ParticleLayerDefinition[] = [];

  for (let index = 0; index < count; index += 1) {
    const particleSeed = seed + (idOffset + index) * 17;
    const position = biasedPosition(particleSeed, width, height);

    particles.push({
      id: idOffset + index,
      layer,
      x: position.x,
      y: position.y,
      baseSize: 0.8 + random(particleSeed + 3) * 3.6,
      baseSpeed: 0.12 + random(particleSeed + 4) * 0.38,
      drift: -0.2 + random(particleSeed + 5) * 0.4,
      baseAlpha: 0.12 + random(particleSeed + 7) * 0.42,
      baseRotation: random(particleSeed + 8) * 360,
      rotationSpeed: -0.35 + random(particleSeed + 9) * 0.7,
      swayAmount: 4 + random(particleSeed + 18) * 10,
      horizontalSway: 2 + random(particleSeed + 19) * 8,
      sineAmount: 3 + random(particleSeed + 20) * 7,
      swaySpeed: 0.35 + random(particleSeed + 22) * 0.55,
      driftSpeed: 0.4 + random(particleSeed + 23) * 0.8,
      phaseOffset: random(particleSeed + 16) * Math.PI * 2,
      shape: pickParticleShape(particleSeed, shapeMix),
      startOffset: random(particleSeed + 24) * 180,
    });
  }

  return particles;
}

export function createParticleLayerDefinitions({
  totalCount,
  seed,
  width,
  height,
  shapeMix = DEFAULT_PARTICLE_SHAPE_MIX,
}: {
  totalCount: number;
  seed: number;
  width: number;
  height: number;
  shapeMix?: ParticleShapeName[];
}): ParticleLayerDefinition[] {
  const counts = splitParticleCountByLayer(totalCount);
  const definitions: ParticleLayerDefinition[] = [];
  let idOffset = 0;

  for (const layer of PARTICLE_LAYER_ORDER) {
    const layerParticles = createLayerParticles({
      layer,
      count: counts[layer],
      seed,
      width,
      height,
      shapeMix,
      idOffset,
    });

    definitions.push(...layerParticles);
    idOffset += layerParticles.length;
  }

  return definitions;
}

function loop(value: number, max: number): number {
  return ((value % max) + max) % max;
}

export type SimulatedParticleFrame = {
  id: number;
  x: number;
  y: number;
  size: number;
  blur: number;
  alpha: number;
  rotation: number;
  shape: ParticleShapeName;
  layer: ParticleLayerName;
  debugColor?: string;
};

export function simulateParticleLayerFrames({
  definitions,
  frame,
  width,
  height,
  globalOpacity,
  driftMultiplier,
  movementSpeedScale = 1,
  tuning,
  getDebugColor,
}: {
  definitions: readonly ParticleLayerDefinition[];
  frame: number;
  width: number;
  height: number;
  globalOpacity: number;
  driftMultiplier: number;
  movementSpeedScale?: number;
  tuning: ParticleSimulationTuning;
  getDebugColor: (id: number) => string;
}): SimulatedParticleFrame[] {
  return definitions.map((particle) => {
    const traits = PARTICLE_LAYER_TRAITS[particle.layer];
    const time = frame + particle.startOffset;
    const motionTime = time * 0.03;
    const direction = random(particle.id * 31 + 9) > 0.5 ? 1 : -1;
    const speedScale =
      traits.speedMultiplier *
      tuning.speedMultiplier(driftMultiplier) *
      movementSpeedScale;
    const linearX =
      time * particle.drift * speedScale * traits.parallaxMultiplier;
    const linearY =
      time *
      particle.baseSpeed *
      direction *
      speedScale *
      traits.parallaxMultiplier;
    const sineX =
      Math.sin(motionTime * particle.swaySpeed + particle.phaseOffset) *
      particle.swayAmount *
      traits.parallaxMultiplier;
    const sineY =
      Math.cos(motionTime * particle.driftSpeed + particle.phaseOffset * 1.7) *
      particle.sineAmount;
    const swayX =
      Math.sin(motionTime * 0.7 + particle.phaseOffset) *
      particle.horizontalSway;
    const nextX = loop(particle.x + linearX + sineX + swayX, width);
    const nextY = loop(particle.y + linearY + sineY, height);
    const baseAlpha =
      particle.baseAlpha * traits.opacityMultiplier * globalOpacity;
    const resolvedAlpha = tuning.debugParticles
      ? tuning.opacityMultiplier(baseAlpha)
      : tuning.debugHud
        ? 0.9
        : tuning.opacityMultiplier(baseAlpha);
    const resolvedSize =
      particle.baseSize *
      traits.sizeMultiplier *
      tuning.sizeMultiplier;
    const resolvedBlur =
      tuning.debugParticles || tuning.debugHud ? 0 : traits.blur;
    const rotation =
      particle.baseRotation + frame * particle.rotationSpeed * traits.parallaxMultiplier;

    return {
      id: particle.id,
      x: nextX,
      y: nextY,
      size: resolvedSize,
      blur: resolvedBlur,
      alpha: clampParticleOpacity(resolvedAlpha),
      rotation,
      shape: particle.shape,
      layer: particle.layer,
      debugColor: tuning.debugParticles
        ? getDebugColor(particle.id)
        : undefined,
    };
  });
}
