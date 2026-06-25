import { clampParticleOpacity } from "./particle-debug";

export const PARTICLE_PRODUCTION_COUNT_MULTIPLIER = 1.8;
export const PARTICLE_PRODUCTION_SIZE_MULTIPLIER = 1.15;
export const PARTICLE_PRODUCTION_OPACITY_MULTIPLIER = 1.8;
export const PARTICLE_PRODUCTION_SPEED_MULTIPLIER = 1.35;

export function applyParticleProductionCount(count: number): number {
  return Math.max(0, Math.round(count * PARTICLE_PRODUCTION_COUNT_MULTIPLIER));
}

export function applyParticleProductionOpacity(opacity: number): number {
  return clampParticleOpacity(opacity * PARTICLE_PRODUCTION_OPACITY_MULTIPLIER);
}

export function applyParticleProductionSpeedMultiplier(
  driftMultiplier: number,
): number {
  return driftMultiplier * PARTICLE_PRODUCTION_SPEED_MULTIPLIER;
}

export function applyParticleProductionSize(size: number): number {
  return size * PARTICLE_PRODUCTION_SIZE_MULTIPLIER;
}
