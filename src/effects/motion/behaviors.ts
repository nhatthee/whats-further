export type MotionVector = {
  x: number;
  y: number;
  rotate: number;
  scaleX: number;
  scaleY: number;
};

export type MotionBehavior =
  | "none"
  | "drift"
  | "flutter"
  | "spin"
  | "fall"
  | "rise"
  | "orbit"
  | "hover";

const NONE_MOTION_VECTOR: MotionVector = {
  x: 0,
  y: 0,
  rotate: 0,
  scaleX: 1,
  scaleY: 1,
};

// TODO: paper-specific flutter
// TODO: petal-specific flutter
// TODO: firefly hover
// TODO: snow fall
// TODO: wind-responsive behaviors
// TODO: behavior blending

function hash(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function particlePhase(particleId: number, offset = 0): number {
  return hash(particleId * 17 + offset) * Math.PI * 2;
}

function particleRate(
  particleId: number,
  min: number,
  max: number,
  offset = 0,
): number {
  return min + hash(particleId * 31 + offset) * (max - min);
}

export function getMotionBehavior(
  behavior: MotionBehavior,
  frame: number,
  particleId: number,
  intensity = 1,
): MotionVector {
  if (behavior === "none" || intensity <= 0) {
    return { ...NONE_MOTION_VECTOR };
  }

  const time = frame * 0.05;
  const phase = particlePhase(particleId);

  switch (behavior) {
    case "drift": {
      const rate = particleRate(particleId, 0.75, 1.15);
      return {
        x: Math.sin(time * rate + phase) * 6 * intensity,
        y: Math.cos(time * rate * 0.65 + phase) * 2 * intensity,
        rotate: Math.sin(time * 0.35 + phase) * 3 * intensity,
        scaleX: 1,
        scaleY: 1,
      };
    }

    case "flutter": {
      const rate = particleRate(particleId, 1.1, 1.6, 1);
      const flip = Math.sin(time * rate * 1.8 + phase);
      return {
        x: Math.sin(time * rate + phase) * 14 * intensity,
        y: Math.cos(time * rate * 0.9 + phase) * 4 * intensity,
        rotate: Math.sin(time * rate * 1.4 + phase) * 12 * intensity,
        scaleX: 1 + flip * 0.08 * intensity,
        scaleY: 1 - flip * 0.08 * intensity,
      };
    }

    case "spin": {
      const rate = particleRate(particleId, 0.9, 1.3, 2);
      return {
        x: Math.sin(time * rate * 2.2 + phase) * 1.5 * intensity,
        y: Math.cos(time * rate * 2.2 + phase) * 1.5 * intensity,
        rotate: frame * rate * 4 * intensity,
        scaleX: 1,
        scaleY: 1,
      };
    }

    case "fall": {
      const rate = particleRate(particleId, 0.7, 1.1, 3);
      return {
        x: Math.sin(time * rate + phase) * 5 * intensity,
        y: frame * rate * 1.8 * intensity,
        rotate: Math.sin(time * 0.5 + phase) * 6 * intensity,
        scaleX: 1,
        scaleY: 1,
      };
    }

    case "rise": {
      const rate = particleRate(particleId, 0.7, 1.1, 4);
      return {
        x: Math.sin(time * rate + phase) * 5 * intensity,
        y: -frame * rate * 1.8 * intensity,
        rotate: Math.sin(time * 0.5 + phase) * 6 * intensity,
        scaleX: 1,
        scaleY: 1,
      };
    }

    case "orbit": {
      const rate = particleRate(particleId, 0.6, 1, 5);
      const radius = 10 * intensity;
      const angle = time * rate + phase;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotate: frame * rate * 2 * intensity,
        scaleX: 1,
        scaleY: 1,
      };
    }

    case "hover": {
      const rate = particleRate(particleId, 0.5, 0.9, 6);
      return {
        x: Math.sin(time * rate + phase) * 3 * intensity,
        y: Math.cos(time * rate * 1.3 + phase) * 3 * intensity,
        rotate: Math.sin(time * 0.25 + phase) * 1.5 * intensity,
        scaleX: 1,
        scaleY: 1,
      };
    }

    default:
      return { ...NONE_MOTION_VECTOR };
  }
}
