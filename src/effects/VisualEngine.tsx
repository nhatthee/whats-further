import type { ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { CameraMotion, type CameraMotionPreset } from "./CameraMotion";
import { ContrastRuntime } from "./ContrastRuntime";
import { DustOverlay } from "./DustOverlay";
import { FilmGrain } from "./FilmGrain";
import { GrainRuntime } from "./GrainRuntime";
import { GoldenPetals } from "./GoldenPetals";
import { InkTransition } from "./InkTransition";
import { LightRuntime } from "./LightRuntime";
import { LightSweep } from "./LightSweep";
import { ParticleEngine } from "./ParticleEngine";
import type { ParticleMaterialName } from "./materials";
import type { ParticlePresetName } from "./particle-presets";
import {
  getMoodPresetFromRegistry,
  getThemePresetFromRegistry,
  getVisualPresetFromRegistry,
} from "./presets/registry";
import { resolveVisualEnginePreset } from "./presets/resolveVisualEnginePreset";
import { ThemeRuntime } from "./ThemeRuntime";
import type { VisualPresetName } from "./visual-presets";

export type VisualEngineConfig = {
  camera?: CameraMotionPreset;
  dust?: boolean;
  petals?: boolean;
  light?: boolean;
  grain?: boolean;
  ink?: boolean;
};

export type VisualEngineProps = {
  children: ReactNode;
  config?: VisualEngineConfig;
  preset?: VisualPresetName | Pick<VisualEngineConfig, "camera">;
  visualPreset?: VisualPresetName;
  particlePreset?: ParticlePresetName;
  particleMaterial?: ParticleMaterialName;
  particleIntensity?: number;
  motionSpeed?: number;
  driftAmount?: number;
  grainAmount?: number;
  lightSoftness?: number;
  emotionalContrast?: number;
  debugParticles?: boolean;
  experimentalParticles?: boolean;
};

const defaultConfig: VisualEngineConfig = {
  camera: "CALM",
  dust: false,
  petals: false,
  light: false,
  grain: false,
  ink: false,
};

export function VisualEngine({
  children,
  config,
  preset,
  visualPreset,
  particlePreset,
  particleMaterial,
  particleIntensity,
  motionSpeed,
  driftAmount,
  grainAmount,
  lightSoftness,
  emotionalContrast,
  debugParticles = false,
  experimentalParticles = false,
}: VisualEngineProps) {
  const resolvedPresetInput = resolveVisualEnginePreset(preset);
  const resolvedVisualPreset =
    visualPreset ??
    (resolvedPresetInput.kind === "visual"
      ? resolvedPresetInput.visualPreset
      : undefined);
  const resolvedLegacyPreset =
    resolvedPresetInput.kind === "legacy"
      ? resolvedPresetInput.legacyPreset
      : undefined;

  const mergedOverlayConfig = {
    ...defaultConfig,
    ...resolvedLegacyPreset,
    ...config,
  };

  const registryVisualConfig = resolvedVisualPreset
    ? getVisualPresetFromRegistry(resolvedVisualPreset)
    : undefined;

  const resolvedCameraPreset = registryVisualConfig?.camera;
  const resolvedParticlePreset = registryVisualConfig?.particle;
  const resolvedThemePreset = registryVisualConfig?.theme;
  const resolvedMoodPreset = registryVisualConfig?.mood;
  const resolvedThemeConfig = resolvedThemePreset
    ? getThemePresetFromRegistry(resolvedThemePreset)
    : undefined;
  const resolvedThemeParticleMaterial =
    resolvedThemeConfig?.particleMaterial;
  const resolvedMoodConfig = resolvedMoodPreset
    ? getMoodPresetFromRegistry(resolvedMoodPreset)
    : undefined;
  const resolvedParticleIntensity =
    resolvedMoodConfig?.particleIntensity;
  const resolvedMotionSpeed = resolvedMoodConfig?.motionSpeed;
  const resolvedDriftAmount = resolvedMoodConfig?.driftAmount;
  const resolvedGrainAmount = resolvedMoodConfig?.grainAmount;
  const resolvedLightSoftness = resolvedMoodConfig?.lightSoftness;
  const resolvedEmotionalContrast = resolvedMoodConfig?.emotionalContrast;
  const resolvedLightColor = resolvedThemeConfig?.glow;

  const legacyCamera = resolvedLegacyPreset?.camera as
    | CameraMotionPreset
    | undefined;
  const explicitCamera = config?.camera ?? legacyCamera;
  const cameraForMotion =
    explicitCamera ?? resolvedCameraPreset ?? defaultConfig.camera;

  const particleForEngine = particlePreset ?? resolvedParticlePreset;
  const resolvedParticleMaterial =
    particleMaterial ?? resolvedThemeParticleMaterial;
  const resolvedParticleIntensityOverride =
    particleIntensity ?? resolvedParticleIntensity;
  const resolvedCameraMotionSpeed =
    motionSpeed ?? resolvedMotionSpeed;
  const resolvedParticleDriftMultiplier =
    driftAmount ?? resolvedDriftAmount;
  const resolvedRuntimeGrainAmount =
    grainAmount ?? resolvedGrainAmount;
  const resolvedRuntimeLightSoftness =
    lightSoftness ?? resolvedLightSoftness;
  const resolvedRuntimeEmotionalContrast =
    emotionalContrast ?? resolvedEmotionalContrast;
  const shouldRenderParticleEngine =
    experimentalParticles && particlePreset !== undefined;

  return (
    <AbsoluteFill>
      <ThemeRuntime preset={resolvedThemePreset}>
        <LightRuntime
          softness={resolvedRuntimeLightSoftness}
          color={resolvedLightColor}
        />

        <ContrastRuntime amount={resolvedRuntimeEmotionalContrast} />

        <CameraMotion preset={cameraForMotion} speed={resolvedCameraMotionSpeed}>
          <DustOverlay enabled={mergedOverlayConfig.dust}>
            <GoldenPetals enabled={mergedOverlayConfig.petals}>
              <LightSweep enabled={mergedOverlayConfig.light}>
                <FilmGrain enabled={mergedOverlayConfig.grain}>
                  <InkTransition enabled={mergedOverlayConfig.ink}>
                    {children}
                  </InkTransition>
                </FilmGrain>
              </LightSweep>
            </GoldenPetals>
          </DustOverlay>
        </CameraMotion>

        {shouldRenderParticleEngine && particleForEngine ? (
          <ParticleEngine
            enabled
            preset={particleForEngine}
            material={resolvedParticleMaterial}
            intensity={resolvedParticleIntensityOverride}
            driftMultiplier={resolvedParticleDriftMultiplier}
            debugParticles={debugParticles}
          />
        ) : null}

        <GrainRuntime amount={resolvedRuntimeGrainAmount} />
      </ThemeRuntime>
    </AbsoluteFill>
  );
}
