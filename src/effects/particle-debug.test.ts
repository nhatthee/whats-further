import { describe, expect, it } from "vitest";
import {
  applyParticleDebugCount,
  applyParticleDebugOpacity,
  applyParticleDebugSpeedMultiplier,
  getParticleDebugColor,
  isParticleDebugEnabled,
} from "./particle-debug";

describe("particle-debug", () => {
  it("is disabled by default", () => {
    expect(isParticleDebugEnabled({})).toBe(false);
    expect(isParticleDebugEnabled({ debugParticles: false })).toBe(false);
  });

  it("is enabled only when debugParticles is true", () => {
    expect(isParticleDebugEnabled({ debugParticles: true })).toBe(true);
  });

  it("applies debug multipliers", () => {
    expect(applyParticleDebugCount(40)).toBe(120);
    expect(applyParticleDebugOpacity(0.2)).toBeCloseTo(0.6);
    expect(applyParticleDebugOpacity(0.5)).toBe(1);
    expect(applyParticleDebugSpeedMultiplier(0.45)).toBeCloseTo(0.9);
  });

  it("alternates bright debug tint colors", () => {
    expect(getParticleDebugColor(0)).toBe("#00ffff");
    expect(getParticleDebugColor(1)).toBe("#ff00ff");
  });
});
