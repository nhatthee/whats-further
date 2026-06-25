export type ThemePresetName =
  | "warm-gold"
  | "soft-ivory"
  | "lonely-blue"
  | "winter-moon"
  | "ash-gray";

export type ThemePresetConfig = {
  background: string;
  foreground: string;
  accent: string;
  glow: string;
  shadow: string;
  particleMaterial:
    | "gold"
    | "ivory"
    | "amber"
    | "white"
    | "moon";
  atmosphere: {
    brightness: number;
    contrast: number;
    saturation: number;
    warmth: number;
  };
};

export const ThemePresets: Record<ThemePresetName, ThemePresetConfig> = {
  "warm-gold": {
    background: "#1A130F",
    foreground: "#F7E7C4",
    accent: "#D6A84F",
    glow: "rgba(214, 168, 79, 0.35)",
    shadow: "rgba(0, 0, 0, 0.45)",
    particleMaterial: "gold",
    atmosphere: {
      brightness: 1.04,
      contrast: 1.06,
      saturation: 1.08,
      warmth: 1.15,
    },
  },

  "soft-ivory": {
    background: "#F7F2E8",
    foreground: "#3A2A1F",
    accent: "#C8A96A",
    glow: "rgba(255, 245, 218, 0.35)",
    shadow: "rgba(45, 34, 24, 0.18)",
    particleMaterial: "ivory",
    atmosphere: {
      brightness: 1.05,
      contrast: 0.96,
      saturation: 0.94,
      warmth: 1.08,
    },
  },

  "lonely-blue": {
    background: "#101722",
    foreground: "#D8E6F2",
    accent: "#7FA6C8",
    glow: "rgba(127, 166, 200, 0.28)",
    shadow: "rgba(0, 0, 0, 0.55)",
    particleMaterial: "white",
    atmosphere: {
      brightness: 0.96,
      contrast: 1.08,
      saturation: 0.82,
      warmth: 0.72,
    },
  },

  "winter-moon": {
    background: "#111827",
    foreground: "#E8EEF6",
    accent: "#BFD7EA",
    glow: "rgba(191, 215, 234, 0.3)",
    shadow: "rgba(0, 0, 0, 0.5)",
    particleMaterial: "moon",
    atmosphere: {
      brightness: 0.98,
      contrast: 1.04,
      saturation: 0.76,
      warmth: 0.65,
    },
  },

  "ash-gray": {
    background: "#171717",
    foreground: "#E5E1DA",
    accent: "#9B9288",
    glow: "rgba(155, 146, 136, 0.22)",
    shadow: "rgba(0, 0, 0, 0.6)",
    particleMaterial: "white",
    atmosphere: {
      brightness: 0.92,
      contrast: 1.12,
      saturation: 0.68,
      warmth: 0.82,
    },
  },
};

export function getThemePreset(
  name: ThemePresetName,
): ThemePresetConfig {
  return ThemePresets[name];
}
