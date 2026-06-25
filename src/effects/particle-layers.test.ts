import { describe, expect, it } from "vitest";
import {
  createParticleLayerDefinitions,
  PARTICLE_LAYER_TRAITS,
  simulateParticleLayerFrames,
  splitParticleCountByLayer,
} from "./particle-layers";
import {
  applyParticleDebugCount,
  applyParticleDebugOpacity,
  applyParticleDebugSpeedMultiplier,
  getParticleDebugColor,
} from "./particle-debug";
import {
  applyParticleProductionCount,
  applyParticleProductionOpacity,
  applyParticleProductionSize,
  applyParticleProductionSpeedMultiplier,
} from "./particle-production";

describe("particle-layers", () => {
  it("splits total count across background, mid, and foreground", () => {
    expect(splitParticleCountByLayer(100)).toEqual({
      background: 60,
      mid: 30,
      foreground: 10,
    });
  });

  it("creates layered particle definitions with shape variety", () => {
    const definitions = createParticleLayerDefinitions({
      totalCount: 30,
      seed: 7,
      width: 1080,
      height: 1920,
      shapeMix: ["dust", "tiny-petal", "soft-bokeh", "pollen"],
    });

    expect(definitions).toHaveLength(30);
    expect(definitions.filter((item) => item.layer === "background")).toHaveLength(
      18,
    );
    expect(definitions.filter((item) => item.layer === "mid")).toHaveLength(9);
    expect(definitions.filter((item) => item.layer === "foreground")).toHaveLength(
      3,
    );
    expect(new Set(definitions.map((item) => item.shape)).size).toBeGreaterThan(1);
  });

  it("simulates subtle layered motion with depth traits", () => {
    const definitions = createParticleLayerDefinitions({
      totalCount: 12,
      seed: 3,
      width: 1080,
      height: 1920,
    });

    const frameA = simulateParticleLayerFrames({
      definitions,
      frame: 0,
      width: 1080,
      height: 1920,
      globalOpacity: 1,
      driftMultiplier: 1,
      tuning: {
        sizeMultiplier: 1,
        opacityMultiplier: applyParticleProductionOpacity,
        speedMultiplier: applyParticleProductionSpeedMultiplier,
        debugParticles: false,
        debugHud: false,
      },
      getDebugColor: getParticleDebugColor,
    });

    const frameB = simulateParticleLayerFrames({
      definitions,
      frame: 12,
      width: 1080,
      height: 1920,
      globalOpacity: 1,
      driftMultiplier: 1,
      tuning: {
        sizeMultiplier: 1,
        opacityMultiplier: applyParticleProductionOpacity,
        speedMultiplier: applyParticleProductionSpeedMultiplier,
        debugParticles: false,
        debugHud: false,
      },
      getDebugColor: getParticleDebugColor,
    });

    const foreground = frameA.find((item) => item.layer === "foreground");
    const background = frameA.find((item) => item.layer === "background");

    expect(foreground).toBeDefined();
    expect(background).toBeDefined();
    expect(foreground!.blur).toBeGreaterThan(background!.blur);
    expect(foreground!.size).toBeGreaterThan(background!.size);
    expect(frameB[0]?.x).not.toBe(frameA[0]?.x);
    expect(frameB[0]?.rotation).not.toBe(frameA[0]?.rotation);
  });

  it("keeps debug mode visibility boosts across layers", () => {
    const definitions = createParticleLayerDefinitions({
      totalCount: 10,
      seed: 5,
      width: 1080,
      height: 1920,
    });

    const debugFrames = simulateParticleLayerFrames({
      definitions,
      frame: 4,
      width: 1080,
      height: 1920,
      globalOpacity: 1,
      driftMultiplier: 1,
      tuning: {
        sizeMultiplier: 1.5,
        opacityMultiplier: applyParticleDebugOpacity,
        speedMultiplier: applyParticleDebugSpeedMultiplier,
        debugParticles: true,
        debugHud: true,
      },
      getDebugColor: getParticleDebugColor,
    });

    expect(debugFrames.every((item) => item.debugColor)).toBe(true);
    expect(debugFrames.every((item) => item.blur === 0)).toBe(true);
    expect(
      debugFrames.every((item) => item.alpha <= 1 && item.alpha > 0),
    ).toBe(true);
  });

  it("uses expected trait multipliers", () => {
    expect(PARTICLE_LAYER_TRAITS.foreground.sizeMultiplier).toBe(1.8);
    expect(PARTICLE_LAYER_TRAITS.background.speedMultiplier).toBe(1.3);
    expect(applyParticleProductionCount(50)).toBe(90);
  });
});
