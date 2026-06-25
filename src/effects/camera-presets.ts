export type CameraPresetName =
  | "still"
  | "slow-push"
  | "slow-pull"
  | "gentle-drift"
  | "dream-float";

export type CameraPresetConfig = {
  scaleFrom?: number;
  scaleTo?: number;
  translateXFrom?: number;
  translateXTo?: number;
  translateYFrom?: number;
  translateYTo?: number;
  rotateFrom?: number;
  rotateTo?: number;
};

export const CameraPresets: Record<CameraPresetName, CameraPresetConfig> = {
  still: {
    scaleFrom: 1,
    scaleTo: 1,
    translateXFrom: 0,
    translateXTo: 0,
    translateYFrom: 0,
    translateYTo: 0,
    rotateFrom: 0,
    rotateTo: 0,
  },

  "slow-push": {
    scaleFrom: 1,
    scaleTo: 1.08,
    translateXFrom: 0,
    translateXTo: 0,
    translateYFrom: 0,
    translateYTo: -8,
    rotateFrom: 0,
    rotateTo: 0,
  },

  "slow-pull": {
    scaleFrom: 1.08,
    scaleTo: 1,
    translateXFrom: 0,
    translateXTo: 0,
    translateYFrom: -8,
    translateYTo: 0,
    rotateFrom: 0,
    rotateTo: 0,
  },

  "gentle-drift": {
    scaleFrom: 1.03,
    scaleTo: 1.07,
    translateXFrom: -8,
    translateXTo: 8,
    translateYFrom: 0,
    translateYTo: -6,
    rotateFrom: -0.2,
    rotateTo: 0.2,
  },

  "dream-float": {
    scaleFrom: 1.04,
    scaleTo: 1.1,
    translateXFrom: 6,
    translateXTo: -6,
    translateYFrom: 6,
    translateYTo: -10,
    rotateFrom: 0.15,
    rotateTo: -0.15,
  },
};

export function getCameraPreset(name: CameraPresetName): CameraPresetConfig {
  return CameraPresets[name];
}
