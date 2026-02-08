import { scene, camera, render, animation } from '.';
import { hits_3d, persistence } from '../managers';
import { Smart_Object } from '../runtime';
import { writable } from 'svelte/store';
import { quat, vec3 } from 'gl-matrix';
import { Size } from '../types';
import { e3 } from '../signals';

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
// MODULE STATE
// ============================================

let active_scene: import('../types/Interfaces').O_Scene | null = null;
export const w_scale = writable<number>(1);

// Keep O_Scene.scale in sync with the store
w_scale.subscribe((value) => {
  if (active_scene && active_scene.scale !== value) {
    active_scene.scale = value;
    persistence.save();
  }
});

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
  let example: Smart_Object;
  let saved_scale = 1;

  if (saved?.smart_objects[0]) {
    const result = Smart_Object.deserialize(saved.smart_objects[0]);
    example = result.so;
    saved_scale = result.scale;
  } else {
    example = new Smart_Object('A');
  }

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
    scale: saved_scale,
    color: 'rgba(78, 205, 196,',
  });
  example.scene = example_scene;
  active_scene = example_scene;
  w_scale.set(saved_scale);

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

  // Input: scroll wheel scales object
  e3.set_wheel_handler((delta, fine) => {
    e3.scale_object(example_scene, delta, fine);
    w_scale.set(example_scene.scale);
  });

  // Render loop
  animation.on_tick(() => {
    render.render();
  });

  animation.start();
}

// ============================================
// TOOLBAR ACTIONS
// ============================================

export function scale_up(): void {
  if (!active_scene) return;
  e3.scale_object(active_scene, 1, false);
  w_scale.set(active_scene.scale);
}

export function scale_down(): void {
  if (!active_scene) return;
  e3.scale_object(active_scene, -1, false);
  w_scale.set(active_scene.scale);
}
