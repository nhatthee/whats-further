import type { ReactNode } from "react";
import type { ThemePresetName } from "./theme-presets";
import { getThemePresetFromRegistry } from "./presets/registry";

type ThemeRuntimeProps = {
  preset?: ThemePresetName;
  children: ReactNode;
};

export function ThemeRuntime({ preset, children }: ThemeRuntimeProps) {
  const theme = preset ? getThemePresetFromRegistry(preset) : undefined;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: theme?.background,
      }}
    >
      {children}
    </div>
  );
}
