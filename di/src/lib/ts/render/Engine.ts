import { units, current_unit_system } from '../types/Units';
import { scene, camera, render, animation } from '.';
import type { O_Scene } from '../types/Interfaces';
import { T_Hit_3D } from '../types/Enumerations';
import { hits_3d, scenes, stores } from '../managers';
import { Smart_Object } from '../runtime';
import { constraints } from '../algebra';
import { quat, vec3 } from 'gl-matrix';
import { e3 } from '../signals';

class Engine {
  private root_scene: O_Scene | null = null;

  // ── geometry (topology only — vertices come from SO) ──

  private readonly edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];

  // Faces: CCW winding when viewed from outside (normal points outward)
  // Vertices: 0-3 front face (-z), 4-7 back face (+z)
  private readonly faces: number[][] = [
    [3, 2, 1, 0],  // front  (-z) — looking at front, CCW is 3→2→1→0
    [4, 5, 6, 7],  // back   (+z)
    [0, 4, 7, 3],  // left   (-x)
    [2, 6, 5, 1],  // right  (+x)
    [7, 6, 2, 3],  // top    (+y)
    [0, 1, 5, 4],  // bottom (-y)
  ];

  constructor() {
    // Keep O_Scene.scale in sync with the store
    stores.w_scale.subscribe((value) => {
      if (this.root_scene && this.root_scene.scale !== value) {
        this.root_scene.scale = value;
        scenes.save();
      }
    });
  }

  // ── setup ──

  setup(canvas: HTMLCanvasElement) {
    // Clear stale state (handles HMR re-mount where singletons survive)
    scene.clear();
    animation.reset();
    hits_3d.clear();

    // Initialize managers
    render.init(canvas);
    camera.init(render.logical_size);
    e3.init(canvas);

    // Wire up precision snapping for drag operations
    Smart_Object.snap = (mm) => units.snap_for_system(mm, current_unit_system(), stores.current_precision());

    // Load saved state or create defaults
    const saved = scenes.load();
    const smart_objects: Smart_Object[] = [];

    if (saved?.smart_objects.length) {
      for (const data of saved.smart_objects) {
        const result = Smart_Object.deserialize(data);
        const so = result.so;
        const so_scene = scene.create({
          so,
          edges: this.edges,
          faces: this.faces,
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
        edges: this.edges,
        faces: this.faces,
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
    this.root_scene = root_so.scene;
    stores.w_scale.set(this.root_scene?.scale ?? 1);
    stores.w_root_so.set(root_so);
    scenes.root_name = root_so.name;
    stores.w_all_sos.set(smart_objects);

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
    if (stores.current_view_mode() === '2d') {
      camera.set_ortho(true);
    }

    // Input: drag edits selection OR rotates selected object, then save
    e3.set_drag_handler((prev, curr) => {
      const target = hits_3d.selection?.so.scene ?? this.root_scene;
      if (!target) return;
      if (!e3.edit_selection(prev, curr)) {
        e3.rotate_object(target, prev, curr);
      }
      scenes.save();
    });

    // Input: scroll wheel scales entire rendering
    e3.set_wheel_handler((delta, fine) => {
      if (!this.root_scene) return;
      e3.scale_object(this.root_scene, delta, fine);
      stores.w_scale.set(this.root_scene.scale);
    });

    // Render loop
    animation.on_tick(() => {
      render.render();
    });

    animation.start();
  }

  // ── toolbar actions ──

  scale_up(): void {
    if (!this.root_scene) return;
    e3.scale_object(this.root_scene, 1, false);
    stores.w_scale.set(this.root_scene.scale);
  }

  scale_down(): void {
    if (!this.root_scene) return;
    e3.scale_object(this.root_scene, -1, false);
    stores.w_scale.set(this.root_scene.scale);
  }

  /** Reset root SO orientation to identity (face-on). */
  straighten(): void {
    if (!this.root_scene) return;
    quat.identity(this.root_scene.so.orientation);
    scenes.save();
  }

  /** Toggle between 2D and 3D view. 2D = orthographic, face-on. */
  toggle_view_mode(): void {
    const mode = stores.current_view_mode() === '3d' ? '2d' : '3d';
    stores.w_view_mode.set(mode);
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
  set_precision(level: number): void {
    stores.w_precision.set(level);
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

  // ── hierarchy ──

  add_child_so(): void {
    if (!this.root_scene) return;
    const parent_so = this.root_scene.so;

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
      edges: this.edges,
      faces: this.faces,
      scale: 1,
      color: 'rgba(78, 205, 196,',
      parent: this.root_scene,
    });
    so.scene = so_scene;
    hits_3d.register(so);

    this.root_scene = so_scene;
    stores.w_scale.set(so_scene.scale);
    stores.w_root_so.set(so);
    stores.w_all_sos.update(list => [...list, so]);
    scenes.root_name = so.name;
    scenes.save();
  }
}

export const engine = new Engine();
