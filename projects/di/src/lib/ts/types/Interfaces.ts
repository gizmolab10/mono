import type { quat, vec3 } from 'gl-matrix';
import type { Point3 } from './Coordinates';

// Projected stays here (not in Coordinates.ts) because it's a pipeline-specific
// output structure, not a reusable geometry primitive. The `w` field is for
// clip-space culling, not general math.

export interface Projected {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface O_Scene {
  id: string;
  vertices: Point3[];
  edges: [number, number][];
  orientation: quat;
  position: vec3;
  scale: number;
  color: string;
  parent?: O_Scene;
}
