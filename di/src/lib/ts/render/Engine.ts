import { units, Units } from '../types/Units';
import { hits_3d, scenes, stores } from '../managers';
import type { Bound } from '../types/Types';
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
  // Vertices: 0-3 bottom face (-z), 4-7 top face (+z)
  private readonly faces: number[][] = [
    [3, 2, 1, 0],  // bottom (-z) — looking at bottom, CCW is 3→2→1→0
    [4, 5, 6, 7],  // top    (+z)
    [0, 4, 7, 3],  // left   (-x)
    [2, 6, 5, 1],  // right  (+x)
    [7, 6, 2, 3],  // front  (+y)
    [0, 1, 5, 4],  // back   (-y)
  ];

  constructor() {
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
        const so = Smart_Object.deserialize(data);
        const so_scene = scene.create({
          so,
          edges: this.edges,
          faces: this.faces,
          color: colors.edge_color_rgba(),
        });
        so.scene = so_scene;
        hits_3d.register(so);
        smart_objects.push(so);
      }
      // Restore parent refs by id and rebind bare-ref formulas
      for (let i = 0; i < saved.smart_objects.length; i++) {
        const parent_id = saved.smart_objects[i].parent_id;
        if (!parent_id) continue;
        const parent_so = smart_objects.find(so => so.id === parent_id);
        if (parent_so?.scene) {
          smart_objects[i].scene!.parent = parent_so.scene;
          constraints.rebind_formulas(smart_objects[i], parent_id);
        }
      }
      // Evaluate all formulas now that refs are bound and scene is populated
      constraints.propagate_all();
    } else {
      // First run — create default SO with initial tumble
      const so = new Smart_Object('A');
      const init_quat = quat.create();
      quat.setAxisAngle(init_quat, vec3.normalize(vec3.create(), [1, 1, 0]), 0.5);
      const tumble = stores.current_orientation();
      quat.multiply(tumble, init_quat, tumble);
      quat.normalize(tumble, tumble);
      stores.set_orientation(tumble);
      const so_scene = scene.create({
        so,
        edges: this.edges,
        faces: this.faces,
        color: colors.edge_color_rgba(),
      });
      stores.w_scale.set(8.5);
      so.scene = so_scene;
      hits_3d.register(so);
      smart_objects.push(so);
    }

    // Restore root SO by id, or default to first
    const saved_id = saved?.root_id ?? '';
    const root_so = smart_objects.find(so => so.id === saved_id) ?? smart_objects[0];
    this.root_scene = root_so.scene;
    // Root start bounds are always zero
    root_so.set_bound('x_min', 0);
    root_so.set_bound('y_min', 0);
    root_so.set_bound('z_min', 0);
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
    e3.set_drag_handler((prev, curr, alt_key) => {
      const target = hits_3d.selection?.so.scene ?? this.root_scene;
      if (!target) return;
      if (drag.edit_selection(prev, curr)) {
        const changed = hits_3d.selection?.so;
        if (changed) constraints.propagate(changed);
      } else {
        if (stores.current_view_mode() === '2d') {
          if (!this.root_scene) return;
          this.saved_3d_orientation = null;
          this.rotate_2d(this.root_scene, prev, curr);
        } else {
          drag.rotate_object(target, prev, curr, alt_key);
        }
      }
      stores.tick();
      scenes.save();
    });

    // Input: drag ended — in 2D, animate snap-back from tilt to axis-aligned
    e3.set_drag_end_handler(() => {
      if (this.is_tilting && this.root_scene) {
        // snapped_orientation is always the last clean axis-aligned quat
        this.snap_anim = {
          from: stores.current_orientation(),
          to: quat.clone(this.snapped_orientation),
          t: 0,
        };
        this.is_tilting = false;
      }
    });

    // Input: scroll wheel scales entire rendering
    e3.set_wheel_handler((delta, fine) => {
      drag.scale(delta, fine);
    });

    // Render loop
    animation.on_tick(() => {
      this.tick_snap_animation();
      this.update_front_face();
      render.render();
    });

    animation.start();
  }

  // ── toolbar actions ──

  scale_up(): void {
    drag.scale(1, false);
  }

  scale_down(): void {
    drag.scale(-1, false);
  }

  // Per-face snap candidates: FACE_SNAP_QUATS[face] = 4 quats (0°, 90°, 180°, 270° twist)
  private static readonly FACE_SNAP_QUATS: quat[][] = (() => {
    const q = (axis: vec3, angle: number) => quat.setAxisAngle(quat.create(), axis, angle);
    const X = vec3.fromValues(1, 0, 0);
    const Y = vec3.fromValues(0, 1, 0);
    const Z = vec3.fromValues(0, 0, 1);
    // Base orientation per face: rotates so face's outward normal points toward camera (+z)
    const bases = [
      q(Y, Math.PI),                 // 0 bottom (normal [-z] → need 180° Y)
      quat.identity(quat.create()),  // 1 top    (normal [+z] → already facing camera)
      q(Y, Math.PI / 2),             // 2 left   (normal [-x] → +90° Y)
      q(Y, -Math.PI / 2),            // 3 right  (normal [+x] → -90° Y)
      q(X, Math.PI / 2),             // 4 front  (normal [+y] → +90° X)
      q(X, -Math.PI / 2),            // 5 back   (normal [-y] → -90° X)
    ];
    const twists = [0, Math.PI / 2, Math.PI, -Math.PI / 2].map(a => q(Z, a));
    return bases.map(base => twists.map(twist => {
      const combined = quat.create();
      quat.multiply(combined, twist, base);
      return quat.normalize(combined, combined);
    }));
  })();

  /** Snap tumble orientation to the nearest axis-aligned quat for the given face. */
  private snap_to_face(face: number): void {
    const current = stores.current_orientation();
    let best: quat = Engine.FACE_SNAP_QUATS[face][0];
    let best_dot = -Infinity;
    for (const candidate of Engine.FACE_SNAP_QUATS[face]) {
      const dot = Math.abs(quat.dot(current, candidate));
      if (dot > best_dot) { best_dot = dot; best = candidate; }
    }
    stores.set_orientation(best);
  }

  /** Scratch orientation for 2D rotation — accumulates mouse drag to detect face changes. */
  private scratch_orientation = quat.create();
  /** The snapped orientation to tilt away from (reset on each snap). */
  private snapped_orientation = quat.create();
  /** Whether a 2D tilt is active (needs snap-back on drag end). */
  private is_tilting = false;

  /** Snap animation state (animates the tumble store). */
  private snap_anim: {
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
      stores.set_orientation(anim.to);
      this.snap_anim = null;
    } else {
      // Ease-out: decelerate into the snap
      const eased = 1 - (1 - anim.t) * (1 - anim.t);
      const result = quat.create();
      quat.slerp(result, anim.from, anim.to, eased);
      stores.set_orientation(result);
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
    const current_tumble = stores.current_orientation();
    if (best_face >= 0 && best_face !== current_face) {
      let best_quat: quat = Engine.FACE_SNAP_QUATS[best_face][0];
      let best_dot = -Infinity;
      for (const candidate of Engine.FACE_SNAP_QUATS[best_face]) {
        const d = Math.abs(quat.dot(current_tumble, candidate));
        if (d > best_dot) { best_dot = d; best_quat = candidate; }
      }
      const snap_target = quat.clone(best_quat);

      this.snap_anim = {
        from: quat.clone(current_tumble),
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
      const tilted = quat.create();
      quat.slerp(tilted, this.snapped_orientation, this.scratch_orientation, t);
      stores.set_orientation(tilted);
      this.is_tilting = true;
    }
  }

  /** Snap tumble: lock the front-most face, then pick the nearest 90° twist. */
  straighten(): void {
    if (!this.root_scene) return;
    const so = this.root_scene.so;
    const face = hits_3d.front_most_face(so);
    if (face < 0) {
      stores.set_orientation(quat.create());
    } else {
      this.snap_to_face(face);
    }
    scenes.save();
  }

  /** Animate tumble to show the given face (0–5) at front. */
  orient_to_face(face: number): void {
    if (!this.root_scene || face < 0 || face > 5) return;
    const current = stores.current_orientation();
    let best: quat = Engine.FACE_SNAP_QUATS[face][0];
    let best_dot = -Infinity;
    for (const candidate of Engine.FACE_SNAP_QUATS[face]) {
      const dot = Math.abs(quat.dot(current, candidate));
      if (dot > best_dot) { best_dot = dot; best = candidate; }
    }
    this.snap_anim = {
      from: quat.clone(current),
      to: quat.clone(best),
      t: 0,
    };
    scenes.save();
  }

  /** Track which face is front-most on root SO, push to store. */
  private _last_front_face = -1;
  private update_front_face(): void {
    if (!this.root_scene) return;
    const face = hits_3d.front_most_face(this.root_scene.so);
    if (face !== this._last_front_face) {
      this._last_front_face = face;
      stores.w_front_face.set(face);
    }
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
        this.saved_3d_orientation = stores.current_orientation();
        this.snap_to_face(face);
        const snapped = stores.current_orientation();
        quat.copy(this.scratch_orientation, snapped);
        quat.copy(this.snapped_orientation, snapped);
      }
      camera.set_position(vec3.fromValues(0, 0, 2750));
      camera.set_ortho(true);
    } else {
      if (this.saved_3d_orientation) {
        stores.set_orientation(this.saved_3d_orientation);
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

  /** Insert an SO subtree from a .di file as children of the selected (or root) SO. */
  insert_child_from_text(text: string): void {
    const target_so = stores.selection()?.so ?? this.root_scene?.so;
    if (!target_so?.scene) return;

    const parsed = scenes.parse_text(text);
    if (!parsed?.smart_objects.length) return;

    const old_to_new = new Map<string, string>();
    const deserialized: { so: Smart_Object; old_parent_id?: string }[] = [];

    // Deserialize all SOs with fresh IDs, keep original names
    for (const data of parsed.smart_objects) {
      const so = Smart_Object.deserialize(data);
      const old_id = so.id;
      so.setID();
      old_to_new.set(old_id, so.id);
      deserialized.push({ so, old_parent_id: data.parent_id });
    }

    const imported_root_id = parsed.root_id;
    const new_sos: Smart_Object[] = [];

    // Wire scene hierarchy — values and formulas stay as-is from the file
    for (const { so, old_parent_id } of deserialized) {
      const is_imported_root = old_to_new.get(imported_root_id) === so.id
        || (!old_parent_id && deserialized[0].so === so);

      let parent_scene: O_Scene;

      if (is_imported_root) {
        // Imported root was absolute in its file — convert to offsets from target parent
        for (const axis of so.axes) {
          if (!axis.start.compiled) {
            axis.start.value = axis.start.value - target_so.get_bound(axis.start.name as Bound);
          }
          if (!axis.end.compiled) {
            axis.end.value = axis.end.value - target_so.get_bound(axis.end.name as Bound);
          }
        }
        parent_scene = target_so.scene!;
      } else if (old_parent_id) {
        const new_parent_id = old_to_new.get(old_parent_id);
        const parent = new_sos.find(s => s.id === new_parent_id);
        if (!parent?.scene) continue;
        parent_scene = parent.scene;
      } else {
        continue;
      }

      const so_scene = scene.create({
        so,
        edges: this.edges,
        faces: this.faces,
        color: colors.edge_color_rgba(),
        parent: parent_scene,
      });
      so.scene = so_scene;
      hits_3d.register(so);
      new_sos.push(so);
    }

    if (new_sos.length) {
      stores.w_all_sos.update(list => [...list, ...new_sos]);
      scenes.save();
    }
  }

  /** Remove all children from the root SO. */
  remove_all_children(): void {
    const root = this.root_scene?.so;
    if (!root) return;

    const all = scene.get_all();
    const children = all.filter(o => o.parent);

    for (const child of children) {
      hits_3d.unregister(child.so);
      scene.destroy(child.id);
    }

    // Clear selection if it was a child
    const sel = hits_3d.selection;
    if (sel && children.some(c => c.so === sel.so)) {
      hits_3d.set_selection(null);
    }

    stores.w_all_sos.set([root]);
    scenes.save();
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
