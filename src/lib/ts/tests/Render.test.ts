import { quat, vec3 } from 'gl-matrix';
import { scene } from '../render/Scene';
import { camera } from '../render/Camera';
import { render } from '../render/Render';
import { input } from '../render/Input';
import { animation } from '../render/Animation';
import { Size, Point3 } from '../types/Coordinates';

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

// ============================================
// INIT
// ============================================

export function init(canvas: HTMLCanvasElement) {
  // Initialize managers
  camera.init(new Size(canvas.width, canvas.height));
  render.init(canvas);
  input.init(canvas);

  // Create scene objects
  const outer_cube = scene.create({
    vertices: cube_vertices,
    edges: cube_edges,
    color: 'rgba(78, 205, 196,',
  });

  const inner_cube = scene.create({
    vertices: cube_vertices,
    edges: cube_edges,
    scale: 0.4,
    color: 'rgba(255, 107, 107,',
    parent: outer_cube,
  });

  // Initial rotation for outer cube
  const init_quat = quat.create();
  quat.setAxisAngle(init_quat, vec3.normalize(vec3.create(), [1, 1, 0]), 0.5);
  quat.multiply(outer_cube.orientation, init_quat, outer_cube.orientation);
  quat.normalize(outer_cube.orientation, outer_cube.orientation);

  // Input: drag rotates outer cube
  input.set_drag_handler((delta) => {
    input.rotate_object(outer_cube, delta);
  });

  // Animation: spin inner cube + render
  animation.on_tick(() => {
    const spin = quat.create();
    quat.setAxisAngle(spin, [0, 1, 0], 0.02);
    quat.multiply(inner_cube.orientation, spin, inner_cube.orientation);
    quat.normalize(inner_cube.orientation, inner_cube.orientation);

    render.render();
  });

  animation.start();
}
