export type MoodPresetName =
  | "peaceful"
  | "lonely"
  | "hopeful"
  | "nostalgic"
  | "cinematic";

export type MoodPresetConfig = {
  energy: number;
  motionSpeed: number;
  particleIntensity: number;
  grainAmount: number;
  lightSoftness: number;
  driftAmount: number;
  emotionalContrast: number;
};

export const MoodPresets: Record<MoodPresetName, MoodPresetConfig> = {
  peaceful: {
    energy: 0.45,
    motionSpeed: 0.75,
    particleIntensity: 0.55,
    grainAmount: 0.18,
    lightSoftness: 0.85,
    driftAmount: 0.35,
    emotionalContrast: 0.35,
  },

  lonely: {
    energy: 0.28,
    motionSpeed: 0.55,
    particleIntensity: 0.38,
    grainAmount: 0.28,
    lightSoftness: 0.65,
    driftAmount: 0.2,
    emotionalContrast: 0.62,
  },

  hopeful: {
    energy: 0.58,
    motionSpeed: 0.82,
    particleIntensity: 0.68,
    grainAmount: 0.16,
    lightSoftness: 0.9,
    driftAmount: 0.45,
    emotionalContrast: 0.42,
  },

  nostalgic: {
    energy: 0.4,
    motionSpeed: 0.62,
    particleIntensity: 0.5,
    grainAmount: 0.32,
    lightSoftness: 0.78,
    driftAmount: 0.3,
    emotionalContrast: 0.55,
  },

  cinematic: {
    energy: 0.7,
    motionSpeed: 0.9,
    particleIntensity: 0.75,
    grainAmount: 0.22,
    lightSoftness: 0.72,
    driftAmount: 0.5,
    emotionalContrast: 0.75,
  },
};

export function getMoodPreset(
  name: MoodPresetName,
): MoodPresetConfig {
  return MoodPresets[name];
}
