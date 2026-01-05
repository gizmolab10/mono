import { quat, vec3 } from 'gl-matrix';

export interface Projected {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface O_Scene {
  id: string;
  vertices: [number, number, number][];
  edges: [number, number][];
  orientation: quat;
  position: vec3;
  scale: number;
  color: string;
  parent?: O_Scene;
}
