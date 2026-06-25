import {
  OverlayAssets,
  type OverlayAsset,
} from "./assets";

export class AssetManager {
  static getOverlay(
    category: keyof typeof OverlayAssets
  ): OverlayAsset | null {
    const assets = OverlayAssets[category];

    if (assets.length === 0) {
      return null;
    }

    return assets[0];
  }
}

// TODO:
// Support random selection.
// Support weighted assets.
// Support themes.
// Support premium packs.
// Support version pinning.
// Support automatic asset selection by Content Engine.
