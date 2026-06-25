export type ForceVector = {
  x: number;
  y: number;
};

export type ForceFieldType = "none" | "breeze" | "swirl" | "updraft";

export function getForce(
  x: number,
  y: number,
  frame: number,
  type: ForceFieldType,
): ForceVector {
  switch (type) {
    case "none":
      return { x: 0, y: 0 };

    case "breeze":
      return {
        x: Math.sin((y + frame * 0.35) * 0.003) * 0.07,
        y: Math.sin((x + frame * 0.15) * 0.002) * 0.015,
      };

    case "swirl": {
      const centerX = 540;
      const centerY = 960;
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const strength = 0.05 + Math.sin(frame * 0.018) * 0.008;

      return {
        x: (-dy / distance) * strength,
        y: (dx / distance) * strength,
      };
    }

    case "updraft":
      return {
        x: Math.sin((x + frame * 0.25) * 0.0035) * 0.03,
        y: -0.09 + Math.sin((y + frame * 0.2) * 0.0025) * 0.015,
      };

    default:
      return { x: 0, y: 0 };
  }
}

// Future:
// noise field
// curl noise
// vortex
// heat distortion
// gravity wells
