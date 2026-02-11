import type Smart_Object from '../runtime/Smart_Object';
import type { Axis } from '../runtime/Smart_Object';
import type { vec3 } from 'gl-matrix';

// Projected stays here (not in Coordinates.ts) because it's a pipeline-specific
// output structure, not a reusable geometry primitive. The `w` field is for
// clip-space culling, not general math.

export interface Projected {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface S_Editing {
  formatted: string;  // pre-filled text
  so: Smart_Object;
  axis: Axis;
  x: number;          // screen x (center of text)
  y: number;        // screen y (center of text)
}

export interface Dimension_Rect {
  so: Smart_Object;
  axis: Axis;
  x: number;        // screen x of text center
  y: number;        // screen y of text center
  w: number;        // text width in pixels
  h: number;        // text height in pixels
  z: number;        // NDC depth at text center (for occlusion)
}

export interface O_Scene {
  edges: [number, number][];
  faces?: number[][];
  parent?: O_Scene;
  so: Smart_Object;             // back-reference: vertices + orientation come from SO
  position: vec3;
  scale: number;
  color: string;
  id: string;
}
