import { quat, vec3 } from 'gl-matrix';
import { scene, camera, render, animation } from '.';
import { Size } from '../types';
import { e3 } from '../signals';
import { hits_3d, persistence } from '../managers';
import { Smart_Object } from '../runtime';

// ============================================
// GEOMETRY (topology only — vertices come from SO)
// ============================================

const example_edges: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

// Faces: CCW winding when viewed from outside (normal points outward)
// Vertices: 0-3 front face (-z), 4-7 back face (+z)
const example_faces: number[][] = [
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

  // Load saved state or create defaults
  const saved = persistence.load();
  const example = saved?.smart_objects[0]
    ? Smart_Object.deserialize(saved.smart_objects[0])
    : new Smart_Object('example');

  if (!saved) {
    // Initial rotation (default)
    const init_quat = quat.create();
    quat.setAxisAngle(init_quat, vec3.normalize(vec3.create(), [1, 1, 0]), 0.5);
    quat.multiply(example.orientation, init_quat, example.orientation);
    quat.normalize(example.orientation, example.orientation);
  }

  const example_scene = scene.create({
    so: example,
    edges: example_edges,
    faces: example_faces,
    color: 'rgba(78, 205, 196,',
  });
  example.scene = example_scene;

  hits_3d.register(example);

  if (saved?.camera) {
    camera.deserialize(saved.camera);
  }

  // Input: drag edits selection OR rotates object, then save
  e3.set_drag_handler((prev, curr) => {
    if (!e3.edit_selection(prev, curr)) {
      e3.rotate_object(example_scene, prev, curr);
    }
    persistence.save();
  });

  // Render loop
  animation.on_tick(() => {
    render.render();
  });

  animation.start();
}
