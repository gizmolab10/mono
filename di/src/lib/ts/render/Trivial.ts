import { quat, vec3 } from 'gl-matrix';
import { scene } from './Scene';
import { camera } from './Camera';
import { render } from './Render';
import { animation } from './Animation';
import { Size, Point3 } from '../types/Coordinates';
import { e3 } from '../signals/Events_3D';
import { hits_3d } from '../managers/Hits_3D';
import Smart_Object from '../runtime/Smart_Object';

// ============================================
// GEOMETRY
// ============================================

const cube_vertices: Point3[] = [
  new Point3(-1, -1, -1), new Point3(1, -1, -1), new Point3(1, 1, -1), new Point3(-1, 1, -1),
  new Point3(-1, -1,  1), new Point3(1, -1,  1), new Point3(1, 1,  1), new Point3(-1, 1,  1),
];

const cube_edges: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

// Faces: CCW winding when viewed from outside (normal points outward)
// Vertices: 0-3 front face (-z), 4-7 back face (+z)
const cube_faces: number[][] = [
  [3, 2, 1, 0],  // front  (-z) — looking at front, CCW is 3→2→1→0
  [4, 5, 6, 7],  // back   (+z)
  [0, 4, 7, 3],  // left   (-x)
  [2, 6, 5, 1],  // right  (+x)
  [7, 6, 2, 3],  // top    (+y)
  [0, 1, 5, 4],  // bottom (-y)
];

// ============================================
// INIT
// ============================================

export function init(canvas: HTMLCanvasElement) {
  // Initialize managers
  camera.init(new Size(canvas.width, canvas.height));
  render.init(canvas);
  e3.init(canvas);

  // Create scene objects as Smart_Objects
  const outer_scene = scene.create({
    vertices: cube_vertices,
    edges: cube_edges,
    faces: cube_faces,
    color: 'rgba(78, 205, 196,',
  });
  const outer_cube = new Smart_Object('outer_cube', outer_scene);

  const inner_scene = scene.create({
    vertices: cube_vertices,
    edges: cube_edges,
    faces: cube_faces,
    scale: 0.4,
    color: 'rgba(255, 107, 107,',
    parent: outer_scene,
  });
  const inner_cube = new Smart_Object('inner_cube', inner_scene);

  hits_3d.register(outer_cube);
  hits_3d.register(inner_cube);

  // Initial rotation for outer cube
  const init_quat = quat.create();
  quat.setAxisAngle(init_quat, vec3.normalize(vec3.create(), [1, 1, 0]), 0.5);
  quat.multiply(outer_cube.scene!.orientation, init_quat, outer_cube.scene!.orientation);
  quat.normalize(outer_cube.scene!.orientation, outer_cube.scene!.orientation);

  // Input: drag rotates outer cube
  e3.set_drag_handler((delta) => {
    e3.rotate_object(outer_cube.scene!, delta);
  });

  // Animation: spin inner cube + render
  animation.on_tick(() => {
    const spin = quat.create();
    quat.setAxisAngle(spin, [0, 1, 0], 0.02);
    quat.multiply(inner_cube.scene!.orientation, spin, inner_cube.scene!.orientation);
    quat.normalize(inner_cube.scene!.orientation, inner_cube.scene!.orientation);

    render.render();
  });

  animation.start();
}
