import { describe, expect, it } from "vitest";
import {
  applyParticleProductionCount,
  applyParticleProductionOpacity,
  applyParticleProductionSize,
  applyParticleProductionSpeedMultiplier,
} from "./particle-production";

describe("particle-production", () => {
  it("applies production visibility multipliers", () => {
    expect(applyParticleProductionCount(50)).toBe(90);
    expect(applyParticleProductionSize(10)).toBeCloseTo(11.5);
    expect(applyParticleProductionOpacity(0.3)).toBeCloseTo(0.54);
    expect(applyParticleProductionOpacity(0.7)).toBe(1);
    expect(applyParticleProductionSpeedMultiplier(0.4)).toBeCloseTo(0.54);
  });
});
