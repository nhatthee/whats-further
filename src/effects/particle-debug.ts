export const PARTICLE_DEBUG_COUNT_MULTIPLIER = 3;
export const PARTICLE_DEBUG_SIZE_MULTIPLIER = 1.5;
export const PARTICLE_DEBUG_OPACITY_MULTIPLIER = 3;
export const PARTICLE_DEBUG_SPEED_MULTIPLIER = 2;

export type ParticleDebugInputProps = {
  debugParticles?: boolean;
};

export function isParticleDebugEnabled(
  inputProps: ParticleDebugInputProps,
): boolean {
  return inputProps.debugParticles === true;
}

export function clampParticleOpacity(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function getParticleDebugColor(id: number): string {
  return id % 2 === 0 ? "#00ffff" : "#ff00ff";
}

export function applyParticleDebugCount(count: number): number {
  return Math.max(0, Math.round(count * PARTICLE_DEBUG_COUNT_MULTIPLIER));
}

export function applyParticleDebugOpacity(opacity: number): number {
  return clampParticleOpacity(opacity * PARTICLE_DEBUG_OPACITY_MULTIPLIER);
}

export function applyParticleDebugSpeedMultiplier(
  driftMultiplier: number,
): number {
  return driftMultiplier * PARTICLE_DEBUG_SPEED_MULTIPLIER;
}
