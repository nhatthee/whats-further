import type { VisualPresetName } from "../visual-presets";
import { Presets } from "./registry";

export type LegacyVisualEnginePreset = {
  camera?: unknown;
  grain?: boolean;
  light?: boolean;
  ink?: boolean;
};

export type VisualEnginePresetInput =
  | VisualPresetName
  | LegacyVisualEnginePreset
  | undefined;

export type ResolvedVisualEnginePreset =
  | {
      kind: "visual";
      visualPreset: VisualPresetName;
    }
  | {
      kind: "legacy";
      legacyPreset: LegacyVisualEnginePreset;
    }
  | {
      kind: "none";
    };

export function isVisualPresetName(
  value: unknown,
): value is VisualPresetName {
  return (
    typeof value === "string" &&
    value in Presets.visual
  );
}

export function resolveVisualEnginePreset(
  preset: VisualEnginePresetInput,
): ResolvedVisualEnginePreset {
  if (!preset) {
    return { kind: "none" };
  }

  if (isVisualPresetName(preset)) {
    return {
      kind: "visual",
      visualPreset: preset,
    };
  }

  if (typeof preset === "object") {
    return {
      kind: "legacy",
      legacyPreset: preset,
    };
  }

  return { kind: "none" };
}
