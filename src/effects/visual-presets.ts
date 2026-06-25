export type VisualPresetName =
  | "golden-sunset"
  | "quiet-morning"
  | "lonely-rain"
  | "winter-night"
  | "hopeful-dawn"
  | "deep-lonely"
  | "soft-memory"
  | "quiet-discipline"
  | "cinematic-growth";

export type VisualPresetIntensity =
  | "soft"
  | "medium"
  | "strong";

export type VisualPresetTone =
  | "peaceful"
  | "hopeful"
  | "lonely"
  | "nostalgic"
  | "cinematic"
  | "discipline"
  | "growth";

export type VisualPresetMetadata = {
  label: string;
  description: string;
  useCases: string[];
  intensity: VisualPresetIntensity;
  tone: VisualPresetTone;
};

export type VisualPresetConfig = {
  camera: import("./camera-presets").CameraPresetName;
  particle: import("./particle-presets").ParticlePresetName;
  theme: import("./theme-presets").ThemePresetName;
  mood: import("./mood-presets").MoodPresetName;
  metadata: VisualPresetMetadata;
};

export const VisualPresets: Record<
  VisualPresetName,
  VisualPresetConfig
> = {
  "golden-sunset": {
    camera: "slow-push",
    particle: "golden-sunset",
    theme: "warm-gold",
    mood: "peaceful",
    metadata: {
      label: "Golden Sunset",
      description:
        "Warm golden particles with calm cinematic motion for reflective and premium emotional scenes.",
      useCases: ["reflection", "wisdom", "gratitude", "calm"],
      intensity: "medium",
      tone: "peaceful",
    },
  },

  "quiet-morning": {
    camera: "gentle-drift",
    particle: "quiet-morning",
    theme: "soft-ivory",
    mood: "hopeful",
    metadata: {
      label: "Quiet Morning",
      description:
        "Soft ivory morning atmosphere with gentle movement for peaceful clarity and fresh starts.",
      useCases: ["morning", "clarity", "self-care", "peace"],
      intensity: "soft",
      tone: "peaceful",
    },
  },

  "lonely-rain": {
    camera: "slow-pull",
    particle: "lonely-rain",
    theme: "lonely-blue",
    mood: "lonely",
    metadata: {
      label: "Lonely Rain",
      description:
        "Cool blue emotional atmosphere with slower movement and restrained particles for loneliness and distance.",
      useCases: ["loneliness", "lost-love", "distance", "reflection"],
      intensity: "soft",
      tone: "lonely",
    },
  },

  "winter-night": {
    camera: "dream-float",
    particle: "winter-night",
    theme: "winter-moon",
    mood: "cinematic",
    metadata: {
      label: "Winter Night",
      description:
        "Cold moonlit cinematic atmosphere with dramatic contrast for solitude, resilience, and quiet strength.",
      useCases: ["solitude", "resilience", "discipline", "winter"],
      intensity: "strong",
      tone: "cinematic",
    },
  },

  "hopeful-dawn": {
    camera: "slow-push",
    particle: "quiet-morning",
    theme: "soft-ivory",
    mood: "hopeful",
    metadata: {
      label: "Hopeful Dawn",
      description:
        "Soft morning optimism with gentle particles, warm light, and hopeful emotional pacing.",
      useCases: ["growth", "hope", "motivation", "new-beginning"],
      intensity: "soft",
      tone: "hopeful",
    },
  },

  "deep-lonely": {
    camera: "slow-pull",
    particle: "lonely-rain",
    theme: "lonely-blue",
    mood: "lonely",
    metadata: {
      label: "Deep Lonely",
      description:
        "A deeper lonely atmosphere with slow pull motion, cool tones, and minimal drifting particles.",
      useCases: ["heartbreak", "distance", "sadness", "lost-love"],
      intensity: "medium",
      tone: "lonely",
    },
  },

  "soft-memory": {
    camera: "gentle-drift",
    particle: "quiet-morning",
    theme: "soft-ivory",
    mood: "nostalgic",
    metadata: {
      label: "Soft Memory",
      description:
        "Gentle nostalgic visuals with soft ivory tones and drifting particles for memories and reflection.",
      useCases: ["nostalgia", "memory", "past", "reflection"],
      intensity: "soft",
      tone: "nostalgic",
    },
  },

  "quiet-discipline": {
    camera: "slow-push",
    particle: "winter-night",
    theme: "ash-gray",
    mood: "peaceful",
    metadata: {
      label: "Quiet Discipline",
      description:
        "Minimal ash-gray atmosphere with steady motion for discipline, patience, and long-term focus.",
      useCases: ["discipline", "patience", "focus", "self-improvement"],
      intensity: "medium",
      tone: "discipline",
    },
  },

  "cinematic-growth": {
    camera: "dream-float",
    particle: "golden-sunset",
    theme: "warm-gold",
    mood: "cinematic",
    metadata: {
      label: "Cinematic Growth",
      description:
        "Warm dramatic motion with golden particles and cinematic contrast for growth and transformation.",
      useCases: ["growth", "transformation", "ambition", "motivation"],
      intensity: "strong",
      tone: "growth",
    },
  },
};

export function getVisualPreset(
  name: VisualPresetName,
): VisualPresetConfig {
  return VisualPresets[name];
}

export function getVisualPresetMetadata(
  name: VisualPresetName,
): VisualPresetMetadata {
  return VisualPresets[name].metadata;
}

export function listVisualPresets(): Array<{
  name: VisualPresetName;
  metadata: VisualPresetMetadata;
}> {
  return Object.entries(VisualPresets).map(([name, config]) => ({
    name: name as VisualPresetName,
    metadata: config.metadata,
  }));
}

export function findVisualPresetsByUseCase(
  useCase: string,
): Array<{
  name: VisualPresetName;
  metadata: VisualPresetMetadata;
}> {
  return listVisualPresets().filter((preset) =>
    preset.metadata.useCases.includes(useCase),
  );
}
