import { units, Units } from '../types/Units';
import { hits_3d, scenes, stores } from '../managers';
import type { Bound } from '../types/Types';
import { scene, camera, render, animation } from '.';
import type { O_Scene } from '../types/Interfaces';
import type { Point } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';
import { Smart_Object } from '../runtime';
import { constraints, constants, evaluator } from '../algebra';
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

		// After any propagation, sync repeater SOs so clone count/positions stay current
		constraints.register_post_propagate(() => {
			let any = false;
			for (const o of scene.get_all()) {
				if (o.so.repeater) { this.sync_repeater(o.so); any = true; }
			}
			if (any) stores.w_all_sos.set(scene.get_all().map(o => o.so));
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

		// Signal that setup is complete (syncs reactive UI like SD table)
		stores.tick();

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

		// Collect the entire subtree: selected SO + all descendants
		const to_remove = new Set<O_Scene>([so.scene]);
		for (const obj of scene.get_all()) {
			let p = obj.parent;
			while (p) {
				if (p === so.scene) { to_remove.add(obj); break; }
				p = p.parent;
			}
		}

		// Clear formulas on every SO in the subtree
		for (const obj of to_remove) {
			for (const bound of Object.keys(obj.so.attributes_dict_byName) as Bound[]) {
				constraints.clear_formula(obj.so, bound);
			}
		}

		// Clear formulas on surviving SOs that reference any deleted SO
		for (const o of scene.get_all()) {
			if (to_remove.has(o)) continue;
			for (const bound of Object.keys(o.so.attributes_dict_byName) as Bound[]) {
				const attr = o.so.attributes_dict_byName[bound];
				if (attr.compiled) {
					for (const obj of to_remove) {
						if (this.formula_references_so(attr.compiled, obj.so.id)) {
							constraints.clear_formula(o.so, bound);
							break;
						}
					}
				}
			}
		}

		// Destroy entire subtree
		for (const obj of to_remove) {
			hits_3d.unregister(obj.so);
			scene.destroy(obj.id);
		}

		const remaining = scene.get_all().map(o => o.so);
		stores.w_all_sos.set(remaining);
		stores.tick();
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

		// Merge constants from the imported item (don't overwrite existing)
		if (parsed.constants?.length) {
			for (const entry of parsed.constants) {
				if (entry.name && !constants.has(entry.name)) {
					constants.set(entry.name, entry.value_mm);
				}
			}
		}

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
			// Re-evaluate formulas now that hierarchy is wired
			for (const so of new_sos) {
				constraints.propagate(so);
			}
			stores.w_all_sos.set(scene.get_all().map(o => o.so));
			stores.tick();
			scenes.save();
		}
	}

	/** Remove all children (and their subtrees) of the selected SO. */
	remove_all_children(): void {
		const target = stores.selection()?.so ?? this.root_scene?.so;
		if (!target?.scene) return;

		const all = scene.get_all();
		// Collect descendants: any O_Scene whose ancestor chain includes target.scene
		const to_remove: O_Scene[] = [];
		for (const obj of all) {
			let p = obj.parent;
			while (p) {
				if (p === target.scene) { to_remove.push(obj); break; }
				p = p.parent;
			}
		}
		if (!to_remove.length) return;

		for (const obj of to_remove) {
			hits_3d.unregister(obj.so);
			scene.destroy(obj.id);
		}

		// Clear selection if it was in the removed subtree
		const sel = hits_3d.selection;
		if (sel && to_remove.some(o => o.so === sel.so)) {
			hits_3d.set_selection(null);
		}

		// Prune constants no longer referenced by any remaining formula
		constraints.referenced_constants.clear();
		const remaining = scene.get_all().map(o => o.so);
		for (const so of remaining) {
			for (const attr of Object.values(so.attributes_dict_byName)) {
				if (attr.compiled) evaluator.evaluate(attr.compiled, (obj, a) => constraints.resolve(obj, a));
			}
		}
		for (const entry of constants.get_all()) {
			if (!constraints.referenced_constants.has(entry.name)) {
				console.warn(`[remove_all_children] pruning unreferenced constant: "${entry.name}"`);
				constants.remove(entry.name);
			}
		}

		stores.w_all_sos.set(remaining);
		stores.tick();
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
		stores.tick();
		scenes.save();
	}

	// ── repeaters ──


	/** Swap two axes on a repeater SO and its template child.
	 *  Serializes, rewrites formula aliases, deserializes into swapped positions.
	 *  Updates repeater config (repeat_axis, gap_axis) to match. */
	swap_axes(so: Smart_Object, a: number, b: number): void {
		const targets = [so];
		const children = scene.get_all().filter(o => o.parent === so.scene);
		if (children.length > 0) targets.push(children[0].so);

		for (const target of targets) {
			const ax_a = target.axes[a];
			const ax_b = target.axes[b];

			// Save absolute positions BEFORE swapping.
			// Position attributes (start, end) are stored as offsets from parent's same-named bound.
			// After swapping, offsets land under a different parent bound, so we need to recompute.
			const a_start_abs = target.get_bound(ax_a.start.name as Bound);
			const a_end_abs   = target.get_bound(ax_a.end.name as Bound);
			const b_start_abs = target.get_bound(ax_b.start.name as Bound);
			const b_end_abs   = target.get_bound(ax_b.end.name as Bound);

			const a_data = ax_a.serialize();
			const b_data = ax_b.serialize();

			for (const key of ['origin', 'extent', 'length', 'angle'] as const) {
				a_data.attributes[key] = constraints.swap_formula_aliases(a_data.attributes[key], a, b);
				b_data.attributes[key] = constraints.swap_formula_aliases(b_data.attributes[key], a, b);
			}

			// Clear existing formulas before deserializing
			// (Attribute.deserialize doesn't clear formula/compiled when data is a plain number)
			for (const attr of ax_a.attributes) {
				attr.formula = null;
				attr.compiled = null;
			}
			for (const attr of ax_b.attributes) {
				attr.formula = null;
				attr.compiled = null;
			}

			ax_a.deserialize(b_data);
			ax_b.deserialize(a_data);

			// Fix position offsets for non-formula attributes.
			// Deserialize wrote raw offsets from the other axis's serialization, but those offsets
			// were relative to the old axis's parent bound. Recompute from saved absolute values.
			const parent = target.scene?.parent?.so;
			if (parent) {
				if (!ax_a.start.compiled) ax_a.start.value = b_start_abs - parent.get_bound(ax_a.start.name as Bound);
				if (!ax_a.end.compiled)   ax_a.end.value   = b_end_abs   - parent.get_bound(ax_a.end.name as Bound);
				if (!ax_b.start.compiled) ax_b.start.value = a_start_abs - parent.get_bound(ax_b.start.name as Bound);
				if (!ax_b.end.compiled)   ax_b.end.value   = a_end_abs   - parent.get_bound(ax_b.end.name as Bound);
			}
		}

		// Update repeater config
		if (so.repeater) {
			const r = { ...so.repeater };
			if (r.repeat_axis === a) r.repeat_axis = b as 0 | 1;
			else if (r.repeat_axis === b) r.repeat_axis = a as 0 | 1;
			if (r.gap_axis === a) r.gap_axis = b as 0 | 1 | 2;
			else if (r.gap_axis === b) r.gap_axis = a as 0 | 1 | 2;
			so.repeater = r;
		}

		// Enforce invariants on parent so template formulas see correct values
		constraints.enforce_invariants(so);

		// Rebind template formulas (converts placeholders to IDs, evaluates, enforces invariants)
		if (children.length > 0) {
			constraints.rebind_formulas(children[0].so, so.id);
		}

		// Cascade changes and trigger sync_repeater via post_propagate_hook
		constraints.propagate(so);
	}

	/** Find a count where total_length / count falls within [gap_min, gap_max].
	 *  Prefers even division; falls back to the count whose gap is closest to range midpoint. */
	private resolve_gap(total_length: number, gap_min: number, gap_max: number): number {
		if (gap_max <= 0 || gap_min > gap_max || total_length <= 0) return 1;
		const count_lo = Math.max(1, Math.floor(total_length / gap_max));
		const count_hi = Math.max(1, Math.ceil(total_length / gap_min));
		const mid = (gap_min + gap_max) / 2;
		let best_count = count_lo;
		let best_distance = Infinity;
		for (let n = count_lo; n <= count_hi; n++) {
			const gap = total_length / n;
			if (gap >= gap_min && gap <= gap_max) {
				const distance = Math.abs(gap - mid);
				if (distance < best_distance) {
					best_distance = distance;
					best_count = n;
				}
			}
		}
		return best_count;
	}

	/** Sync repeater children to match the constraint-derived count.
	 *  Count determined by: gap range → spacing → 1 (fallback).
	 *  When gap_axis differs from repeat_axis (e.g. stairs), clones offset along both axes.
	 *  Clone i is offset by step × (i+1) along repeat_axis (or auto-detected largest axis). */
	sync_repeater(so: Smart_Object): void {
		if (!so.repeater || !so.scene) return;

		const all_children = scene.get_all().filter(o => o.parent === so.scene);
		if (all_children.length === 0) return;

		const template_entry = all_children[0];

		const t = template_entry.so;
		const w = t.width, d = t.depth, h = t.height;
		const auto_ai = (w >= d && w >= h) ? 0 : (d >= h ? 1 : 2);
		const repeat_ai = so.repeater.repeat_axis ?? auto_ai;
		const template_dim = [w, d, h][repeat_ai];
		if (template_dim <= 0) return;

		// gap_axis: which dimension gap_min/gap_max constrain (defaults to repeat_axis)
		const gap_ai = so.repeater.gap_axis ?? repeat_ai;
		const parent_dims = [so.width, so.depth, so.height];
		const parent_length = parent_dims[repeat_ai];
		const gap_length = parent_dims[gap_ai];

		// Determine count and step distances
		const { gap_min, gap_max, spacing } = so.repeater;
		let count: number;
		let step: number;
		let gap_step = 0; // secondary axis offset (nonzero when gap_axis !== repeat_axis)

		if (gap_min != null && gap_max != null && gap_length > 0) {
			count = this.resolve_gap(gap_length, gap_min, gap_max);
			step = parent_length / count;
			if (gap_ai !== repeat_ai) gap_step = gap_length / count;
		} else if (spacing != null && spacing > 0 && parent_length > 0) {
			count = Math.floor((parent_length - template_dim) / spacing);
			step = spacing;
		} else {
			count = 1;
			step = template_dim;
		}

		// Bookend: for spacing repeaters, place a final clone flush at parent's far edge
		let has_bookend = false;
		let bookend_offset = 0;
		if (!gap_step && spacing != null && spacing > 0 && parent_length > 0) {
			const t_start = t.axes[repeat_ai].start.value;
			bookend_offset = parent_length - template_dim - t_start;
			const last_offset = count > 0 ? count * step : 0;
			has_bookend = bookend_offset >= last_offset + template_dim;
		}

		const clones = all_children.slice(1);
		// Template is instance 0; clones fill positions 1..count-1 (top position is the landing, not a tread)
		const needed_studs = Math.max(0, count - (gap_step ? 2 : 0)) + (has_bookend ? 1 : 0);

		// Firewall blocking: horizontal members between studs — one per bay including bookend bay
		const regular_bay = step - template_dim;
		const bookend_bay = has_bookend ? bookend_offset - template_dim - step * count : 0;
		const has_bookend_fireblock = bookend_bay > 50.8; // only if gap > 2"
		const needed_firewall = (so.repeater.firewall && !gap_step && needed_studs > 0) ? count + (has_bookend_fireblock ? 1 : 0) : 0;
		const total_needed = needed_studs + needed_firewall;

		// Firewall geometry: find the height axis (tallest non-repeat axis of template)
		const dims = [w, d, h];
		let height_ai = repeat_ai === 0 ? 1 : 0;
		for (let i = 0; i < 3; i++) {
			if (i !== repeat_ai && dims[i] > dims[height_ai]) height_ai = i;
		}

		// Stairs: adjust step so last visible tread ends exactly at parent boundary
		if (gap_step && needed_studs > 0) {
			const t_start = t.axes[repeat_ai].start.value;
			step = (parent_length - t_start - template_dim) / needed_studs;
		}
		const changed = clones.length !== total_needed;

		// Remove excess clones
		for (const clone of clones.slice(total_needed)) {
			hits_3d.unregister(clone.so);
			scene.destroy(clone.id);
		}

		// Update positions of surviving stud clones from current template
		const surviving = clones.slice(0, total_needed);
		for (let i = 0; i < Math.min(surviving.length, needed_studs); i++) {
			const c = surviving[i].so;
			for (let ai = 0; ai < 3; ai++) {
				c.axes[ai].start.value  = t.axes[ai].start.value;
				c.axes[ai].end.value    = t.axes[ai].end.value;
				c.axes[ai].length.value = t.axes[ai].length.value;
				c.axes[ai].angle.value  = t.axes[ai].angle.value;
			}
			const offset = (has_bookend && i === needed_studs - 1) ? bookend_offset : step * (i + 1);
			c.axes[repeat_ai].start.value += offset;
			c.axes[repeat_ai].end.value   += offset;
			if (gap_step) {
				c.axes[gap_ai].start.value += gap_step * (i + 1);
				c.axes[gap_ai].end.value   += gap_step * (i + 1);
			}
		}

		// Update positions of surviving firewall clones
		for (let i = needed_studs; i < Math.min(surviving.length, total_needed); i++) {
			const fi = i - needed_studs;
			const bay = (has_bookend_fireblock && fi === count) ? bookend_bay : regular_bay;
			this.apply_firewall_position(surviving[i].so, t, fi, repeat_ai, height_ai, step, template_dim, parent_dims, bay);
		}

		// Add missing clones
		const used = new Set(scene.get_all().map(o => o.so.name));
		for (let i = surviving.length; i < total_needed; i++) {
			const clone = this.clone_so_from_template(t, used);
			if (i < needed_studs) {
				const offset = (has_bookend && i === needed_studs - 1) ? bookend_offset : step * (i + 1);
				clone.axes[repeat_ai].start.value += offset;
				clone.axes[repeat_ai].end.value   += offset;
				if (gap_step) {
					clone.axes[gap_ai].start.value += gap_step * (i + 1);
					clone.axes[gap_ai].end.value   += gap_step * (i + 1);
				}
			} else {
				const fi = i - needed_studs;
				const bay = (has_bookend_fireblock && fi === count) ? bookend_bay : regular_bay;
				this.apply_firewall_position(clone, t, fi, repeat_ai, height_ai, step, template_dim, parent_dims, bay);
			}
			const clone_scene = scene.create({
				so: clone,
				edges: this.edges,
				faces: this.faces,
				color: colors.edge_color_rgba(),
				parent: so.scene,
			});
			clone.scene = clone_scene;
			hits_3d.register(clone);
		}

		// Notify Svelte when clone count changed so rendering picks them up
		if (changed) stores.w_all_sos.set(scene.get_all().map(o => o.so));
	}

	/** Position a fire block clone: template rotated 90° (swap repeat/height lengths), shortened to fit between studs, at mid-height.
	 *  Values are offsets: start.value = offset from parent's min, end.value = offset from parent's max. */
	private apply_firewall_position(clone: Smart_Object, t: Smart_Object, index: number, repeat_ai: number, height_ai: number, step: number, template_dim: number, parent_dims: number[], bay_length: number): void {
		// Start from template axes for the "other" axis (depth), then override repeat and height
		for (let ai = 0; ai < 3; ai++) {
			clone.axes[ai].start.value  = t.axes[ai].start.value;
			clone.axes[ai].end.value    = t.axes[ai].end.value;
			clone.axes[ai].length.value = t.axes[ai].length.value;
			clone.axes[ai].angle.value  = t.axes[ai].angle.value;
		}

		// Repeat axis: shortened to fit between studs, positioned after the stud at this bay
		const block_length = bay_length;
		const block_start = t.axes[repeat_ai].start.value + template_dim + step * index;
		clone.axes[repeat_ai].start.value  = block_start;
		clone.axes[repeat_ai].end.value    = block_start + block_length - parent_dims[repeat_ai];
		clone.axes[repeat_ai].length.value = block_length;

		// Height axis: swapped to template_dim (stud width), centered at mid-height of parent
		const mid_start = parent_dims[height_ai] / 2 - template_dim / 2;
		clone.axes[height_ai].start.value  = mid_start;
		clone.axes[height_ai].end.value    = mid_start + template_dim - parent_dims[height_ai];
		clone.axes[height_ai].length.value = template_dim;
	}

	private clone_so_from_template(t: Smart_Object, used_names: Set<string>): Smart_Object {
		let name = 'A';
		while (used_names.has(name)) {
			name = String.fromCharCode(name.charCodeAt(0) + 1);
		}
		used_names.add(name);

		const clone = new Smart_Object(name);
		for (let ai = 0; ai < 3; ai++) {
			const ta = t.axes[ai];
			const ca = clone.axes[ai];
			ca.start.value  = ta.start.value;
			ca.end.value    = ta.end.value;
			ca.length.value = ta.length.value;
			ca.angle.value  = ta.angle.value;
			ca.invariant    = ta.invariant;
		}
		return clone;
	}
}

export const engine = new Engine();
