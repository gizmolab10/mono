import { units, Units } from '../types/Units';
import { hits_3d, scenes, stores } from '../managers';
import type { Bound } from '../runtime/Smart_Object';
import { scene, camera, render, animation } from '.';
import type { O_Scene } from '../types/Interfaces';
import type { Point } from '../types/Coordinates';
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
        if (stores.current_view_mode() === '2d') {
          if (!this.root_scene) return;
          this.rotate_2d(this.root_scene, prev, curr);
        } else {
          drag.rotate_object(target, prev, curr);
        }
      }
      scenes.save();
    });

    // Input: drag ended — in 2D, animate snap-back from tilt to axis-aligned
    e3.set_drag_end_handler(() => {
      if (this.is_tilting && this.root_scene) {
        const so = this.root_scene.so;
        // snapped_orientation is always the last clean axis-aligned quat
        this.snap_anim = {
          so,
          from: quat.clone(so.orientation),
          to: quat.clone(this.snapped_orientation),
          t: 0,
        };
        this.is_tilting = false;
      }
    });

    // Input: scroll wheel scales entire rendering
    e3.set_wheel_handler((delta, fine) => {
      if (!this.root_scene) return;
      drag.scale_object(this.root_scene, delta, fine);
      stores.w_scale.set(this.root_scene.scale);
    });

    // Render loop
    animation.on_tick(() => {
      this.tick_snap_animation();
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

  // Per-face snap candidates: FACE_SNAP_QUATS[face] = 4 quats (0°, 90°, 180°, 270° twist)
  private static readonly FACE_SNAP_QUATS: quat[][] = (() => {
    const q = (axis: vec3, angle: number) => quat.setAxisAngle(quat.create(), axis, angle);
    const X = vec3.fromValues(1, 0, 0);
    const Y = vec3.fromValues(0, 1, 0);
    const Z = vec3.fromValues(0, 0, 1);
    // Base orientation per face: rotates so face's outward normal points toward camera (+z)
    const bases = [
      q(Y, Math.PI),                 // 0 front  (normal [-z] → need 180° Y)
      quat.identity(quat.create()),  // 1 back   (normal [+z] → already facing camera)
      q(Y, Math.PI / 2),             // 2 left   (normal [-x] → +90° Y)
      q(Y, -Math.PI / 2),            // 3 right  (normal [+x] → -90° Y)
      q(X, Math.PI / 2),             // 4 top    (normal [+y] → +90° X)
      q(X, -Math.PI / 2),            // 5 bottom (normal [-y] → -90° X)
    ];
    const twists = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(a => q(Z, a));
    return bases.map(base => twists.map(twist => {
      const combined = quat.create();
      quat.multiply(combined, twist, base);
      return quat.normalize(combined, combined);
    }));
  })();

  /** Snap SO orientation to the nearest axis-aligned quat for the given face. */
  private snap_to_face(so: import('../runtime/Smart_Object').default, face: number): void {
    let best: quat = Engine.FACE_SNAP_QUATS[face][0];
    let best_dot = -Infinity;
    for (const candidate of Engine.FACE_SNAP_QUATS[face]) {
      const dot = Math.abs(quat.dot(so.orientation, candidate));
      if (dot > best_dot) { best_dot = dot; best = candidate; }
    }
    quat.copy(so.orientation, best);
  }

  /** Scratch orientation for 2D rotation — accumulates mouse drag to detect face changes. */
  private scratch_orientation = quat.create();
  /** The snapped orientation to tilt away from (reset on each snap). */
  private snapped_orientation = quat.create();
  /** Whether a 2D tilt is active (needs snap-back on drag end). */
  private is_tilting = false;

  /** Snap animation state. */
  private snap_anim: {
    so: import('../runtime/Smart_Object').default;
    from: quat;
    to: quat;
    t: number;
  } | null = null;

  /** Advance snap animation each frame. Called before render. */
  private tick_snap_animation(): void {
    const anim = this.snap_anim;
    if (!anim) return;
    anim.t += 0.15; // ~6–7 frames to complete (tuned for feel)
    if (anim.t >= 1) {
      quat.copy(anim.so.orientation, anim.to);
      this.snap_anim = null;
    } else {
      // Ease-out: decelerate into the snap
      const eased = 1 - (1 - anim.t) * (1 - anim.t);
      quat.slerp(anim.so.orientation, anim.from, anim.to, eased);
    }
  }

  /** In 2D mode, accumulate virtual rotation and snap when the front face changes.
   *  Applies a small visual tilt for feedback; snaps back on drag release. */
  private rotate_2d(target: O_Scene, prev: Point, curr: Point): void {
    const so = target.so;
    const sensitivity = 0.01;
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;

    // Accumulate rotation on scratch orientation
    const rot_x = quat.create();
    const rot_y = quat.create();
    quat.setAxisAngle(rot_x, [1, 0, 0], dy * sensitivity);
    quat.setAxisAngle(rot_y, [0, 1, 0], dx * sensitivity);
    quat.multiply(this.scratch_orientation, rot_y, this.scratch_orientation);
    quat.multiply(this.scratch_orientation, rot_x, this.scratch_orientation);
    quat.normalize(this.scratch_orientation, this.scratch_orientation);

    // During snap animation, only accumulate scratch — don't tilt or re-trigger
    if (this.snap_anim) return;

    // Find which face is front-most under the scratch orientation (max world-normal z)
    let best_face = -1, best_z = -Infinity;
    for (let i = 0; i < 6; i++) {
      const wn = vec3.transformQuat(vec3.create(), so.face_normal(i), this.scratch_orientation);
      if (wn[2] > best_z) { best_z = wn[2]; best_face = i; }
    }

    // If the front face changed, animate the snap
    const current_face = hits_3d.front_most_face(so);
    if (best_face >= 0 && best_face !== current_face) {
      let best_quat: quat = Engine.FACE_SNAP_QUATS[best_face][0];
      let best_dot = -Infinity;
      for (const candidate of Engine.FACE_SNAP_QUATS[best_face]) {
        const d = Math.abs(quat.dot(so.orientation, candidate));
        if (d > best_dot) { best_dot = d; best_quat = candidate; }
      }
      const snap_target = quat.clone(best_quat);

      this.snap_anim = {
        so,
        from: quat.clone(so.orientation),
        to: snap_target,
        t: 0,
      };
      this.is_tilting = false;
      // Pre-set scratch and snapped to the target for after animation completes
      quat.copy(this.scratch_orientation, snap_target);
      quat.copy(this.snapped_orientation, snap_target);
    } else {
      // Small tilt toward scratch — slerp clamped to ~5° max
      const max_tilt = 0.08;
      const dot = Math.abs(quat.dot(this.snapped_orientation, this.scratch_orientation));
      const t = Math.min(1.0 - dot, max_tilt);
      quat.slerp(so.orientation, this.snapped_orientation, this.scratch_orientation, t);
      this.is_tilting = true;
    }
  }

  /** Snap root SO: lock the front-most face, then pick the nearest 90° twist. */
  straighten(): void {
    if (!this.root_scene) return;
    const so = this.root_scene.so;
    const face = hits_3d.front_most_face(so);
    if (face < 0) {
      quat.identity(so.orientation);
    } else {
      this.snap_to_face(so, face);
    }
    scenes.save();
  }

  private saved_3d_orientation: quat | null = null;

  /** Toggle between 2D and 3D view. 2D snaps root face-on, 3D restores. */
  toggle_view_mode(): void {
    const mode = stores.current_view_mode() === '3d' ? '2d' : '3d';
    stores.w_view_mode.set(mode);
    if (mode === '2d') {
      const so = this.root_scene?.so;
      const face = so ? hits_3d.front_most_face(so) : -1;
      if (so && face >= 0) {
        this.saved_3d_orientation = quat.clone(so.orientation);
        this.snap_to_face(so, face);
        quat.copy(this.scratch_orientation, so.orientation);
        quat.copy(this.snapped_orientation, so.orientation);
      }
      camera.set_position(vec3.fromValues(0, 0, 2750));
      camera.set_ortho(true);
    } else {
      const so = this.root_scene?.so;
      if (so && this.saved_3d_orientation) {
        quat.copy(so.orientation, this.saved_3d_orientation);
        this.saved_3d_orientation = null;
      }
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
