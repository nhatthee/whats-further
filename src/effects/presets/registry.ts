import type { CameraPresetName, CameraPresetConfig } from "../camera-presets";
import { CameraPresets } from "../camera-presets";
import type { MoodPresetName, MoodPresetConfig } from "../mood-presets";
import { MoodPresets } from "../mood-presets";
import {
  ParticlePresets,
  type ParticlePresetName,
} from "../particle-presets";
import type { ThemePresetName, ThemePresetConfig } from "../theme-presets";
import { ThemePresets } from "../theme-presets";
import type {
  VisualPresetName,
  VisualPresetConfig,
} from "../visual-presets";
import { VisualPresets } from "../visual-presets";

export type PresetCategory = "particle" | "camera" | "theme" | "mood" | "visual";

export type PresetRegistry = {
  particle: typeof ParticlePresets;
  camera: Record<CameraPresetName, CameraPresetConfig>;
  theme: Record<ThemePresetName, ThemePresetConfig>;
  mood: Record<MoodPresetName, MoodPresetConfig>;
  visual: Record<VisualPresetName, VisualPresetConfig>;
};

// TODO: support preset inheritance
// TODO: support preset validation
// TODO: support preset discovery for UI
// TODO: support SaaS custom preset packs

export const Presets: PresetRegistry = {
  particle: ParticlePresets,
  camera: CameraPresets,
  theme: ThemePresets,
  mood: MoodPresets,
  visual: VisualPresets,
};

export function getParticlePresetFromRegistry(name: ParticlePresetName) {
  return Presets.particle[name];
}

export function getCameraPresetFromRegistry(
  name: CameraPresetName,
): CameraPresetConfig {
  return Presets.camera[name];
}

export function getThemePresetFromRegistry(
  name: ThemePresetName,
): ThemePresetConfig {
  return Presets.theme[name];
}

export function getMoodPresetFromRegistry(
  name: MoodPresetName,
): MoodPresetConfig {
  return Presets.mood[name];
}

export function getVisualPresetFromRegistry(
  name: VisualPresetName,
): VisualPresetConfig {
  return Presets.visual[name];
}
