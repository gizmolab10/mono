import type { vec3 } from 'gl-matrix';
import type Smart_Object from '../runtime/Smart_Object';

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
  edges: [number, number][];
  faces?: number[][];
  parent?: O_Scene;
  position: vec3;
  scale: number;
  color: string;
  id: string;
  so: Smart_Object;  // back-reference: vertices + orientation come from SO
}
