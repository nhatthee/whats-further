export type OverlayAsset = {
  id: string;
  name: string;
  version: string;
  path: string;
  enabledByDefault: boolean;
};

export const OverlayAssets = {
  dust: [] as OverlayAsset[],
  petals: [] as OverlayAsset[],
  light: [] as OverlayAsset[],
  grain: [] as OverlayAsset[],
  ink: [] as OverlayAsset[],
};

export const DefaultOverlayConfig = {
  dust: false,
  petals: false,
  light: false,
  grain: false,
  ink: false,
};

// TODO:
// Register Dust Overlay V1
// Register Golden Petals V1
// Register Light Sweep V1
// Register Film Grain V1
// Register Ink Transition V1
//
// Future:
// Support multiple overlay packs.
// Support seasonal themes.
// Support premium visual packs.
// Support automatic asset selection by Content Engine.
