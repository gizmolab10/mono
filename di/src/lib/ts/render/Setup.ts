import { scene, camera, render, animation } from '.';
import { hits_3d, scenes } from '../managers';
import { preferences, T_Preference } from '../managers/Preferences';
import { Smart_Object } from '../runtime';
import { constraints } from '../algebra/Constraints';
import { units, current_unit_system } from '../types/Units';
import { writable, get } from 'svelte/store';
import { quat, vec3 } from 'gl-matrix';
import { T_Hit_3D } from '../types/Enumerations';
import type { O_Scene } from '../types/Interfaces';
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

let root_scene: O_Scene | null = null;
export const w_scale = writable<number>(1);
export const w_root_so = writable<Smart_Object | null>(null);
export const w_all_sos = writable<Smart_Object[]>([]);

// View mode: '2d' or '3d'
const saved_view = preferences.read<'2d' | '3d'>(T_Preference.viewMode);
export const w_view_mode = writable<'2d' | '3d'>(saved_view ?? '3d');
w_view_mode.subscribe((mode) => {
  preferences.write(T_Preference.viewMode, mode);
});

/** Read current view mode synchronously (for non-reactive contexts like Render) */
export function current_view_mode(): '2d' | '3d' {
  return get(w_view_mode);
}

// Precision: index into the tick array for the current unit system.
// 0 = whole (coarsest), higher = finer. Persisted as a number.
const saved_precision = preferences.read<number>(T_Preference.precision);
export const w_precision = writable<number>(saved_precision ?? 0);
w_precision.subscribe((level) => {
  preferences.write(T_Preference.precision, level);
});

/** Read current precision level synchronously. */
export function current_precision(): number {
  return get(w_precision);
}

// Show/hide dimensionals
const saved_dims = preferences.read<boolean>(T_Preference.showDimensionals);
export const w_show_dimensionals = writable<boolean>(saved_dims ?? true);
w_show_dimensionals.subscribe((on) => {
  preferences.write(T_Preference.showDimensionals, on);
});

/** Toggle dimensionals visibility. */
export function toggle_dimensionals(): void {
  w_show_dimensionals.update(v => !v);
}

/** Read current dimensionals visibility synchronously. */
export function show_dimensionals(): boolean {
  return get(w_show_dimensionals);
}

// Solid / see-through
const saved_solid = preferences.read<boolean>(T_Preference.solid);
export const w_solid = writable<boolean>(saved_solid ?? true);
w_solid.subscribe((on) => {
  preferences.write(T_Preference.solid, on);
});

/** Toggle solid / see-through. */
export function toggle_solid(): void {
  w_solid.update(v => !v);
}

/** Read current solid state synchronously. */
export function is_solid(): boolean {
  return get(w_solid);
}

// Keep O_Scene.scale in sync with the store
w_scale.subscribe((value) => {
  if (root_scene && root_scene.scale !== value) {
    root_scene.scale = value;
    scenes.save();
  }
});

// ============================================
// INIT
// ============================================

export function init(canvas: HTMLCanvasElement) {
  // Initialize managers
  render.init(canvas);
  camera.init(render.logical_size);
  e3.init(canvas);

  // Wire up precision snapping for drag operations
  Smart_Object.snap = (mm) => units.snap_for_system(mm, current_unit_system(), current_precision());

  // Load saved state or create defaults
  const saved = scenes.load();
  const smart_objects: Smart_Object[] = [];

  if (saved?.smart_objects.length) {
    for (const data of saved.smart_objects) {
      const result = Smart_Object.deserialize(data);
      const so = result.so;
      const so_scene = scene.create({
        so,
        edges: example_edges,
        faces: example_faces,
        scale: result.scale,
        color: 'rgba(78, 205, 196,',
      });
      so.scene = so_scene;
      hits_3d.register(so);
      smart_objects.push(so);
    }
    // Restore parent refs by name
    for (let i = 0; i < saved.smart_objects.length; i++) {
      const parent_name = saved.smart_objects[i].parent_name;
      if (!parent_name) continue;
      const parent_so = smart_objects.find(so => so.name === parent_name);
      if (parent_so?.scene) {
        smart_objects[i].scene!.parent = parent_so.scene;
      }
    }
  } else {
    // First run — create default SO with initial rotation
    const so = new Smart_Object('A');
    const init_quat = quat.create();
    quat.setAxisAngle(init_quat, vec3.normalize(vec3.create(), [1, 1, 0]), 0.5);
    quat.multiply(so.orientation, init_quat, so.orientation);
    quat.normalize(so.orientation, so.orientation);
    const so_scene = scene.create({
      so,
      edges: example_edges,
      faces: example_faces,
      scale: 8.5,
      color: 'rgba(78, 205, 196,',
    });
    so.scene = so_scene;
    hits_3d.register(so);
    smart_objects.push(so);
  }

  // Restore root SO by name, or default to first
  const saved_name = saved?.root_name ?? '';
  const root_so = smart_objects.find(so => so.name === saved_name) ?? smart_objects[0];
  root_scene = root_so.scene;
  w_scale.set(root_scene?.scale ?? 1);
  w_root_so.set(root_so);
  scenes.root_name = root_so.name;
  w_all_sos.set(smart_objects);

  // Restore selection (SO + face) by name
  if (saved?.selected_name != null) {
    const sel_so = smart_objects.find(so => so.name === saved.selected_name);
    if (sel_so && saved.selected_face != null) {
      hits_3d.set_selection({ so: sel_so, type: T_Hit_3D.face, index: saved.selected_face });
    }
  }

  if (saved?.camera) {
    camera.deserialize(saved.camera);
  }

  // Restore ortho mode if saved view was 2d
  if (get(w_view_mode) === '2d') {
    camera.set_ortho(true);
  }

  // Input: drag edits selection OR rotates selected object, then save
  e3.set_drag_handler((prev, curr) => {
    const target = hits_3d.selection?.so.scene ?? root_scene;
    if (!target) return;
    if (!e3.edit_selection(prev, curr)) {
      e3.rotate_object(target, prev, curr);
    }
    scenes.save();
  });

  // Input: scroll wheel scales entire rendering
  e3.set_wheel_handler((delta, fine) => {
    if (!root_scene) return;
    e3.scale_object(root_scene, delta, fine);
    w_scale.set(root_scene.scale);
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
  if (!root_scene) return;
  e3.scale_object(root_scene, 1, false);
  w_scale.set(root_scene.scale);
}

export function scale_down(): void {
  if (!root_scene) return;
  e3.scale_object(root_scene, -1, false);
  w_scale.set(root_scene.scale);
}

/** Reset root SO orientation to identity (face-on). */
export function straighten(): void {
  if (!root_scene) return;
  quat.identity(root_scene.so.orientation);
  scenes.save();
}

/** Toggle between 2D and 3D view. 2D = orthographic, face-on. */
export function toggle_view_mode(): void {
  const mode = get(w_view_mode) === '3d' ? '2d' : '3d';
  w_view_mode.set(mode);
  if (mode === '2d') {
    // Face-on: camera on z axis, orthographic projection
    camera.set_position(vec3.fromValues(0, 0, 2750));
    camera.set_ortho(true);
  } else {
    // Back to perspective
    camera.set_ortho(false);
  }
  scenes.save();
}

/** Set precision level (index into tick array). Snaps all SO bounds to the new grid. */
export function set_precision(level: number): void {
  w_precision.set(level);
  // Snap every non-formula bound to the precision grid
  const system = current_unit_system();
  for (const obj of scene.get_all()) {
    const so = obj.so;
    for (const attr of Object.values(so.attributes_dict_byName)) {
      if (attr.has_formula) continue;
      attr.value = units.snap_for_system(attr.value, system, level);
    }
  }
  constraints.propagate_all();
  scenes.save();
}

// ============================================
// HIERARCHY
// ============================================

export function add_child_so(): void {
  if (!root_scene) return;
  const parent_so = root_scene.so;

  const all = scene.get_all();
  const used = new Set(all.map(o => o.so.name));
  let name = 'A';
  while (used.has(name)) {
    name = String.fromCharCode(name.charCodeAt(0) + 1);
  }

  const so = new Smart_Object(name);

  // Copy parent orientation
  quat.copy(so.orientation, parent_so.orientation);

  // Set bounds: shared origin with parent, 1 default-unit in each dimension
  const system = current_unit_system();
  const default_unit = units.default_unit_for_system(system);
  const half = units.to_mm(0.5, default_unit); // half of 1 unit
  const parent_name = parent_so.name;

  // Child shares parent's origin: formulas reference parent min bounds
  // Dimensions: 1 default unit centered at parent origin
  constraints.set_formula(so, 'x_min', `${parent_name}.x_min`);
  constraints.set_formula(so, 'y_min', `${parent_name}.y_min`);
  constraints.set_formula(so, 'z_min', `${parent_name}.z_min`);
  so.set_bound('x_max', parent_so.x_min + units.to_mm(1, default_unit));
  so.set_bound('y_max', parent_so.y_min + units.to_mm(1, default_unit));
  so.set_bound('z_max', parent_so.z_min + units.to_mm(1, default_unit));

  const so_scene = scene.create({
    so,
    edges: example_edges,
    faces: example_faces,
    scale: 1,
    color: 'rgba(78, 205, 196,',
    parent: root_scene,
  });
  so.scene = so_scene;
  hits_3d.register(so);

  root_scene = so_scene;
  w_scale.set(so_scene.scale);
  w_root_so.set(so);
  w_all_sos.update(list => [...list, so]);
  scenes.root_name = so.name;
  scenes.save();
}
