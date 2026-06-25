import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import type { ReactNode } from "react";
import { CameraPresets, type CameraPresetName } from "./camera-presets";
import { getCameraPresetFromRegistry } from "./presets/registry";

export type CameraMotionPreset =
  | "CALM"
  | "CONTEMPLATE"
  | "HOPE"
  | "LONELY"
  | "JOURNEY";

type CameraMotionProps = {
  children: ReactNode;
  preset?: CameraMotionPreset | CameraPresetName;
  scaleFrom?: number;
  scaleTo?: number;
  translateXFrom?: number;
  translateXTo?: number;
  translateYFrom?: number;
  translateYTo?: number;
  rotateFrom?: number;
  rotateTo?: number;
  speed?: number;
};

const emotionPresets: Record<
  CameraMotionPreset,
  {
    scaleEnd: number;
    translateXEnd: number;
    translateYEnd: number;
    rotateEnd: number;
  }
> = {
  CALM: {
    scaleEnd: 1.025,
    translateXEnd: 8,
    translateYEnd: 4,
    rotateEnd: 0,
  },
  CONTEMPLATE: {
    scaleEnd: 1.035,
    translateXEnd: -10,
    translateYEnd: 6,
    rotateEnd: -0.15,
  },
  HOPE: {
    scaleEnd: 1.04,
    translateXEnd: 12,
    translateYEnd: -8,
    rotateEnd: 0.12,
  },
  LONELY: {
    scaleEnd: 1.03,
    translateXEnd: -14,
    translateYEnd: 4,
    rotateEnd: -0.08,
  },
  JOURNEY: {
    scaleEnd: 1.045,
    translateXEnd: 18,
    translateYEnd: -4,
    rotateEnd: 0.1,
  },
};

function isCameraPresetName(value: string): value is CameraPresetName {
  return value in CameraPresets;
}

function hasExplicitMotionOverrides({
  scaleFrom,
  scaleTo,
  translateXFrom,
  translateXTo,
  translateYFrom,
  translateYTo,
  rotateFrom,
  rotateTo,
}: CameraMotionProps) {
  return (
    scaleFrom !== undefined ||
    scaleTo !== undefined ||
    translateXFrom !== undefined ||
    translateXTo !== undefined ||
    translateYFrom !== undefined ||
    translateYTo !== undefined ||
    rotateFrom !== undefined ||
    rotateTo !== undefined
  );
}

export function CameraMotion({
  children,
  preset = "CALM",
  scaleFrom,
  scaleTo,
  translateXFrom,
  translateXTo,
  translateYFrom,
  translateYTo,
  rotateFrom,
  rotateTo,
  speed,
}: CameraMotionProps) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const resolvedSpeed = speed ?? 1;
  const adjustedFrame = frame * resolvedSpeed;

  const progress = interpolate(
    adjustedFrame,
    [0, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const useRegistryResolution =
    isCameraPresetName(preset) ||
    hasExplicitMotionOverrides({
      children,
      preset,
      scaleFrom,
      scaleTo,
      translateXFrom,
      translateXTo,
      translateYFrom,
      translateYTo,
      rotateFrom,
      rotateTo,
    });

  if (useRegistryResolution) {
    const presetConfig = isCameraPresetName(preset)
      ? getCameraPresetFromRegistry(preset)
      : undefined;

    const resolvedScaleFrom = scaleFrom ?? presetConfig?.scaleFrom ?? 1;
    const resolvedScaleTo = scaleTo ?? presetConfig?.scaleTo ?? 1.05;
    const resolvedTranslateXFrom =
      translateXFrom ?? presetConfig?.translateXFrom ?? 0;
    const resolvedTranslateXTo =
      translateXTo ?? presetConfig?.translateXTo ?? 0;
    const resolvedTranslateYFrom =
      translateYFrom ?? presetConfig?.translateYFrom ?? 0;
    const resolvedTranslateYTo =
      translateYTo ?? presetConfig?.translateYTo ?? -6;
    const resolvedRotateFrom =
      rotateFrom ?? presetConfig?.rotateFrom ?? 0;
    const resolvedRotateTo = rotateTo ?? presetConfig?.rotateTo ?? 0;

    const scale = interpolate(
      progress,
      [0, 1],
      [resolvedScaleFrom, resolvedScaleTo]
    );
    const translateX = interpolate(
      progress,
      [0, 1],
      [resolvedTranslateXFrom, resolvedTranslateXTo]
    );
    const translateY = interpolate(
      progress,
      [0, 1],
      [resolvedTranslateYFrom, resolvedTranslateYTo]
    );
    const rotate = interpolate(
      progress,
      [0, 1],
      [resolvedRotateFrom, resolvedRotateTo]
    );

    return (
      <AbsoluteFill
        style={{
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>
    );
  }

  const config = emotionPresets[preset as CameraMotionPreset];

  const scale = interpolate(progress, [0, 1], [1, config.scaleEnd]);
  const translateX = interpolate(progress, [0, 1], [0, config.translateXEnd]);
  const translateY = interpolate(progress, [0, 1], [0, config.translateYEnd]);
  const rotate = interpolate(progress, [0, 1], [0, config.rotateEnd]);

  return (
    <AbsoluteFill
      style={{
        transform: `scale(${scale}) translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
}
