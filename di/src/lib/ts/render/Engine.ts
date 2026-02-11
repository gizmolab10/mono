import { units, Units } from '../types/Units';
import { hits_3d, scenes, stores } from '../managers';
import type { Bound } from '../runtime/Smart_Object';
import { scene, camera, render, animation } from '.';
import type { O_Scene } from '../types/Interfaces';
import { T_Hit_3D } from '../types/Enumerations';
import { Smart_Object } from '../runtime';
import { constraints } from '../algebra';
import { colors } from '../draw/Colors';
import { quat, vec3 } from 'gl-matrix';
import { drag } from '../editors/Drag';
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

    // Keep all O_Scene colors in sync with the edge color preference
    stores.w_edge_color.subscribe(() => {
      const rgba = colors.edge_color_rgba();
      for (const obj of scene.get_all()) {
        obj.color = rgba;
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
    Smart_Object.snap = (mm) => units.snap_for_system(mm, Units.current_unit_system(), stores.current_precision());

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
          color: colors.edge_color_rgba(),
          ...(data.position ? { position: vec3.fromValues(data.position[0], data.position[1], data.position[2]) } : {}),
        });
        so.scene = so_scene;
        hits_3d.register(so);
        smart_objects.push(so);
      }
      // Restore parent refs by id
      for (let i = 0; i < saved.smart_objects.length; i++) {
        const parent_id = saved.smart_objects[i].parent_id;
        if (!parent_id) continue;
        const parent_so = smart_objects.find(so => so.id === parent_id);
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
        color: colors.edge_color_rgba(),
      });
      so.scene = so_scene;
      hits_3d.register(so);
      smart_objects.push(so);
    }

    // Restore root SO by id, or default to first
    const saved_id = saved?.root_id ?? '';
    const root_so = smart_objects.find(so => so.id === saved_id) ?? smart_objects[0];
    this.root_scene = root_so.scene;
    stores.w_scale.set(this.root_scene?.scale ?? 1);
    stores.w_root_so.set(root_so);
    scenes.root_id = root_so.id;
    scenes.root_name = root_so.name;
    stores.w_all_sos.set(smart_objects);

    // Restore selection (SO + face) by id
    if (saved?.selected_id != null) {
      const sel_so = smart_objects.find(so => so.id === saved.selected_id);
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
      if (!drag.edit_selection(prev, curr)) {
        drag.rotate_object(target, prev, curr);
      }
      scenes.save();
    });

    // Input: scroll wheel scales entire rendering
    e3.set_wheel_handler((delta, fine) => {
      if (!this.root_scene) return;
      drag.scale_object(this.root_scene, delta, fine);
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
    drag.scale_object(this.root_scene, 1, false);
    stores.w_scale.set(this.root_scene.scale);
  }

  scale_down(): void {
    if (!this.root_scene) return;
    drag.scale_object(this.root_scene, -1, false);
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
    const system = Units.current_unit_system();
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

  delete_selected_so(): void {
    const sel = stores.selection();
    if (!sel) return;
    const so = sel.so;
    if (!so.scene?.parent) return;  // can't delete root

    // Clear selection first
    hits_3d.set_selection(null);

    // Clear formulas on the deleted SO
    for (const bound of Object.keys(so.attributes_dict_byName) as Bound[]) {
      constraints.clear_formula(so, bound);
    }

    // Clear formulas on other SOs that reference the deleted SO
    for (const o of scene.get_all()) {
      if (o.so === so) continue;
      for (const bound of Object.keys(o.so.attributes_dict_byName) as Bound[]) {
        const attr = o.so.attributes_dict_byName[bound];
        if (attr.compiled && this.formula_references_so(attr.compiled, so.id)) {
          constraints.clear_formula(o.so, bound);
        }
      }
    }

    // Reparent any children of the deleted SO to the deleted SO's parent
    for (const o of scene.get_all()) {
      if (o.parent === so.scene) {
        o.parent = so.scene.parent;
      }
    }

    // Remove from systems
    hits_3d.unregister(so);
    scene.destroy(so.scene.id);
    stores.w_all_sos.update(list => list.filter(s => s !== so));
    scenes.save();
  }

  private formula_references_so(node: import('../algebra/Nodes').Node, so_id: string): boolean {
    switch (node.type) {
      case 'literal': return false;
      case 'reference': return node.object === so_id;
      case 'unary': return this.formula_references_so(node.operand, so_id);
      case 'binary': return this.formula_references_so(node.left, so_id) || this.formula_references_so(node.right, so_id);
    }
  }

  add_child_so(): void {
    const selected = stores.selection();
    const parent_so = selected?.so ?? this.root_scene?.so;
    if (!parent_so?.scene) return;

    const used = new Set(scene.get_all().map(o => o.so.name));
    const { child, formulas } = parent_so.create_child(used);

    // Apply formulas via constraints (cycle-safe)
    for (const [bound, formula] of Object.entries(formulas)) {
      constraints.set_formula(child, bound as Bound, formula);
    }

    const so_scene = scene.create({
      so: child,
      edges: this.edges,
      faces: this.faces,
      scale: 1,
      color: colors.edge_color_rgba(),
      parent: parent_so.scene,
    });
    child.scene = so_scene;
    hits_3d.register(child);

    // Keep parent selected after adding child
    stores.w_all_sos.update(list => [...list, child]);
    scenes.save();
  }
}

export const engine = new Engine();
