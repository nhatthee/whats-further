import type { Material } from "./types";
import { Amber } from "./Amber";
import { Gold } from "./Gold";
import { Ivory } from "./Ivory";
import { Moon } from "./Moon";
import { White } from "./White";

export type ParticleMaterialName =
  | "gold"
  | "ivory"
  | "amber"
  | "white"
  | "moon";

const materialRegistry: Record<ParticleMaterialName, Material> = {
  gold: Gold,
  ivory: Ivory,
  amber: Amber,
  white: White,
  moon: Moon,
};

export function getMaterial(name: ParticleMaterialName): Material {
  return materialRegistry[name];
}

export type { Material } from "./types";
export { Gold } from "./Gold";
export { Ivory } from "./Ivory";
export { Amber } from "./Amber";
export { White } from "./White";
export { Moon } from "./Moon";

// TODO: Glass
// TODO: Frost
// TODO: Smoke
// TODO: Neon
// TODO: Sakura
// TODO: Copper
