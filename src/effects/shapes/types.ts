export type ShapeMaterial = {
  background: string;
  boxShadow?: string;
  opacity?: number;
};

export type ShapeProps = {
  width: number;
  height: number;
  blur?: number;
  opacity?: number;
  rotate?: number;
  material: ShapeMaterial;
};
