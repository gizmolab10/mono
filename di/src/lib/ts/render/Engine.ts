import { constraints, givens, evaluator } from '../algebra';
import type { Portable_Scene } from '../managers/Versions';
import type { Bound, Axis_Name } from '../types/Types';
import { scenes, stores, history } from '../managers';
import { scene, camera, render, animation } from '.';
import type { O_Scene } from '../types/Interfaces';
import { T_Hit_3D } from '../types/Enumerations';
import { units, Units } from '../types/Units';
import { Smart_Object } from '../runtime';
import { colors } from '../utilities/Colors';
import { quat, vec3 } from 'gl-matrix';
import { drag } from '../editors/Drag';
import { e3, hits_3d } from '../events';

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
		colors.w_edge_color.subscribe(() => {
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

		// Load scene
		this.load_scene(scenes.load());

		// Input: drag edits selection OR rotates selected object, then save
		e3.set_drag_handler((prev, curr, alt_key) => {
			const target = hits_3d.selection?.so.scene ?? this.root_scene;
			if (!target) return;
			if (drag.edit_selection(prev, curr)) {
				const changed = hits_3d.selection?.so;
				if (changed) constraints.propagate(changed);
			} else if (!drag.has_target) {
				this.saved_pre_snap_orientation = null;
				drag.rotate_object(target, prev, curr, alt_key);
			}
			stores.tick();
			scenes.save();
		});

		// Input: drag ended — snap to nearest face-aligned orientation
		e3.set_drag_end_handler(() => {
			// Pin offer for edge snaps (must run before drag.clear)
			if (drag.snap_results.length > 0) {
				drag.compute_pin_offer();
			}

			if (this.is_tilting && this.root_scene) {
				// 2D tilt snap-back
				this.snap_anim = {
					from: stores.current_orientation(),
					to: quat.clone(this.snapped_orientation),
					t: 0,
				};
				this.is_tilting = false;
			} else if (stores.current_view_mode() === '3d' && stores.rotation_snap() && this.root_scene) {
				// 3D snap: animate to nearest face-aligned orientation on drag end
				const so = this.root_scene.so;
				const face = hits_3d.front_most_face(so);
				if (face >= 0) {
					const current = stores.current_orientation();
					let best_quat: quat = Engine.FACE_SNAP_QUATS[face][0];
					let best_dot = -Infinity;
					for (const candidate of Engine.FACE_SNAP_QUATS[face]) {
						const d = Math.abs(quat.dot(current, candidate));
						if (d > best_dot) { best_dot = d; best_quat = candidate; }
					}
					const target = quat.clone(best_quat);
	
					this.snap_anim = {
						from: quat.clone(current),
						to: target,
						t: 0,
					};
					quat.copy(this.scratch_orientation, target);
					quat.copy(this.snapped_orientation, target);
				}
			}
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

	// ── load scene ──

	/** Load a Portable_Scene in-place: teardown old state, rebuild, restore camera/selection.
	 *  Called by setup() on init and by library panel for scene switching (no page reload).
	 *  When recompute is false, camera stays at current position (used by undo/redo). */
	load_scene(saved: Portable_Scene | null, recompute = true): void {
		if (recompute) history.clear();
		// Teardown
		scene.clear();
		hits_3d.clear();
		givens.clear();
		stores.w_editing.set(0);  // T_Editing.none

		const smart_objects: Smart_Object[] = [];

		if (saved?.smart_objects.length) {
			// Restore givens before deserialization (formulas may reference them during rebind)
			if (saved.givens?.length) {
				for (const entry of saved.givens) {
					if (entry.name) { givens.set(entry.name, entry.value_mm); givens.set_locked(entry.name, entry.locked ?? true); }
				}
			}
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
					constraints.rebind_formulas(smart_objects[i], parent_id, !recompute);
				}
			}
			// Evaluate all formulas now that refs are bound and scene is populated
			// Skip during undo/redo — serialized values already reflect the correct state
			if (recompute) constraints.propagate_all();
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
		if (!saved) root_so.visible = false;

		scenes.root_so = root_so;
		scenes.root_id = root_so.id;
		scenes.root_name = root_so.name;
		stores.w_all_sos.set(scene.get_all().map(o => o.so));

		// Fit-normalize root if any SO has negative start/end/length (skip if root is a repeater)
		// Skip during undo/redo — serialized values are the complete truth
		if (recompute && !root_so.repeater && smart_objects.some(so => so.axes.some(a => a.start.value < 0 || a.end.value < 0 || a.length.value < 0))) {
			this.fit_to_children();
		}

		// Restore selection only if previously saved
		if (saved?.selected_id != null) {
			const sel_so = smart_objects.find(so => so.id === saved.selected_id);
			if (sel_so && saved.selected_face != null) {
				hits_3d.set_selection({ so: sel_so, type: T_Hit_3D.face, index: saved.selected_face });
			}
		}

		if (recompute && saved?.camera) {
			camera.deserialize(saved.camera);
		}

		// Restore ortho mode if saved view was 2d
		if (stores.current_view_mode() === '2d') {
			camera.set_ortho(true);
		}

		stores.tick();
		scenes.save();
	}

	// ── undo / redo ──

	undo(): void {
		const saved = history.undo();
		if (!saved) return;
		this.load_scene(saved, false);
	}

	redo(): void {
		const saved = history.redo();
		if (!saved) return;
		this.load_scene(saved, false);
	}

	/** Check if current orientation is already snapped to a face-aligned position. */
	is_straightened(): boolean {
		const root_so = this.root_scene?.so;
		if (!root_so) return false;
		const current = stores.current_orientation();
		const face = hits_3d.front_most_face(root_so);
		if (face < 0) return false;
		for (const candidate of Engine.FACE_SNAP_QUATS[face]) {
			if (Math.abs(quat.dot(current, candidate)) > 0.999) return true;
		}
		return false;
	}

	// ── toolbar actions ──

	scale_up(): void {
		drag.scale(1, false);
	}

	scale_down(): void {
		drag.scale(-1, false);
	}

	// Preferred twist index per face: bottom-at-bottom for sides, front-at-bottom for top/bottom
	//   twists: [0°, 90°, 180°, -90°] around Z
	//   face 0 bottom → twist 0 (0)     face 1 top    → twist 0 (0)
	//   face 2 left   → twist 1 (π/2)   face 3 right  → twist 3 (-π/2)
	//   face 4 front  → twist 2 (π)     face 5 back   → twist 0 (identity)
	private static readonly PREFERRED_TWIST = [0, 0, 1, 3, 2, 0];

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

	/** Snap tumble orientation to the preferred axis-aligned quat for the given face. */
	private snap_to_face(face: number): void {
		stores.set_orientation(Engine.FACE_SNAP_QUATS[face][Engine.PREFERRED_TWIST[face]]);
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
			quat.copy(this.scratch_orientation, anim.to);
			quat.copy(this.snapped_orientation, anim.to);
			this.snap_anim = null;
		} else {
			// Ease-out: decelerate into the snap
			const eased = 1 - (1 - anim.t) * (1 - anim.t);
			const result = quat.create();
			quat.slerp(result, anim.from, anim.to, eased);
			stores.set_orientation(result);
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
		const q = stores.current_orientation();
		quat.copy(this.scratch_orientation, q);
		quat.copy(this.snapped_orientation, q);
		scenes.save();
	}

	/** Toggle rotation snap. Snap on = straighten + save prior orientation. Snap off = restore prior. */
	toggle_rotation_snap(): void {
		const was_snapped = stores.rotation_snap();
		stores.toggle_rotation_snap();
		if (!was_snapped) {
			// Turning snap ON — save current orientation, then straighten
			this.saved_pre_snap_orientation = stores.current_orientation();
			this.straighten();
		} else {
			// Turning snap OFF — restore prior orientation if we have one
			if (this.saved_pre_snap_orientation) {
				const current = stores.current_orientation();
				const target = this.saved_pre_snap_orientation;
				this.saved_pre_snap_orientation = null;
				this.snap_anim = {
					from: quat.clone(current),
					to: quat.clone(target),
					t: 0,
				};
			}
		}
	}

	/** Animate tumble to show the given face (0–5) at front, using preferred twist. */
	orient_to_face(face: number): void {
		if (!this.root_scene || face < 0 || face > 5) return;
		const current = stores.current_orientation();
		const target = Engine.FACE_SNAP_QUATS[face][Engine.PREFERRED_TWIST[face]];
		this.snap_anim = {
			from: quat.clone(current),
			to: quat.clone(target),
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
			stores.w_forward_face.set(face);
		}
	}

	private saved_3d_orientation: quat | null = null;
	private saved_pre_snap_orientation: quat | null = null;

	/** Toggle between 2D and 3D view. 2D snaps root face-on (if snap enabled), 3D restores. */
	toggle_view_mode(): void {
		const mode = stores.current_view_mode() === '3d' ? '2d' : '3d';
		stores.w_view_mode.set(mode);
		if (mode === '2d') {
			if (stores.rotation_snap()) {
				const so = this.root_scene?.so;
				const face = so ? hits_3d.front_most_face(so) : -1;
				if (so && face >= 0) {
					this.saved_3d_orientation = stores.current_orientation();
					this.snap_to_face(face);
					const snapped = stores.current_orientation();
					quat.copy(this.scratch_orientation, snapped);
					quat.copy(this.snapped_orientation, snapped);
				}
			} else {
				const q = stores.current_orientation();
				quat.copy(this.scratch_orientation, q);
				quat.copy(this.snapped_orientation, q);
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
		history.snapshot();
		stores.w_precision.set(level);
		// Snap every non-formula bound to the precision grid
		const system = Units.current_unit_system();
		for (const obj of scene.get_all()) {
			const so = obj.so;
			for (const axis of so.axes) for (const attr of [axis.start, axis.end, axis.length]) {
				if (attr.has_formula) continue;
				attr.value = units.snap_for_system(attr.value, system, level);
			}
		}
		constraints.propagate_all();
		scenes.save();
	}

	// ── hierarchy ──

	delete_selected_so(): void {
		history.snapshot();
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
			for (const axis of obj.so.axes) for (const attr of [axis.start, axis.end, axis.length]) {
				constraints.clear_formula(obj.so, attr.name);
			}
		}

		// Clear formulas on surviving SOs that reference any deleted SO
		for (const o of scene.get_all()) {
			if (to_remove.has(o)) continue;
			for (const axis of o.so.axes) for (const attr of [axis.start, axis.end, axis.length]) {
				if (attr.compiled) {
					for (const obj of to_remove) {
						if (this.formula_references_so(attr.compiled, obj.so.id)) {
							constraints.clear_formula(o.so, attr.name);
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
		history.snapshot();
		const target_so = stores.selection()?.so ?? this.root_scene?.so;
		if (!target_so?.scene) return;

		const parsed = scenes.parse_text(text);
		if (!parsed?.smart_objects.length) return;

		// Merge givens from the imported item (don't overwrite existing)
		if (parsed.givens?.length) {
			for (const entry of parsed.givens) {
				if (entry.name && !givens.has(entry.name)) {
					givens.set(entry.name, entry.value_mm);
					givens.set_locked(entry.name, entry.locked ?? true);
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

		// Rebind formulas: deserialize compiles but leaves placeholder refs ('' = parent,
		// 'self' = this SO). rebind resolves them to actual IDs and evaluates.
		for (const so of new_sos) {
			const parent_id = so.scene?.parent?.so.id;
			if (parent_id) {
				constraints.rebind_formulas(so, parent_id);
			} else {
				constraints.enforce_invariants(so);
			}
		}

		if (new_sos.length) {
			// Cascade and trigger sync_repeater via post_propagate_hook
			constraints.propagate_all();
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

		// Prune givens no longer referenced by any remaining formula
		constraints.referenced_givens.clear();
		const remaining = scene.get_all().map(o => o.so);
		for (const so of remaining) {
			for (const axis of so.axes) for (const attr of [axis.start, axis.end, axis.length]) {
				if (attr.compiled) evaluator.evaluate(attr.compiled, (obj, a) => constraints.resolve(obj, a));
			}
		}
		for (const entry of givens.get_all()) {
			if (!constraints.referenced_givens.has(entry.name)) {
				console.warn(`[remove_all_children] pruning unreferenced given: "${entry.name}"`);
				givens.remove(entry.name);
			}
		}

		stores.w_all_sos.set(remaining);
		stores.tick();
		scenes.save();
	}

	add_child_so(): void {
		history.snapshot();
		const selected = stores.selection();
		const parent_so = selected?.so ?? this.root_scene?.so;
		if (!parent_so?.scene) return;

		const used = new Set(scene.get_all().map(o => o.so.name));
		const { child, formulas } = parent_so.create_child(used);

		// Apply formulas via constraints (cycle-safe)
		for (const [bound, formula] of Object.entries(formulas)) {
			constraints.set_formula(child, bound as Bound, formula as string);
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

	/** Duplicate the selected SO as a sibling with the same dimensions, angles, and formulas. */
	duplicate_so(): void {
		history.snapshot();
		const selected = stores.selection();
		if (!selected?.so) return;
		const src = selected.so;
		const parent_scene = src.scene?.parent;
		if (!parent_scene) return; // can't duplicate root

		const used = new Set(scene.get_all().map(o => o.so.name));
		const serialized = src.serialize();

		// Fresh name
		let name = src.name;
		while (used.has(name)) {
			const m = name.match(/^(.*?)(\d+)$/);
			name = m ? m[1] + (parseInt(m[2]) + 1) : name + '2';
		}

		serialized.name = name;
		const clone = Smart_Object.deserialize(serialized);
		clone.setID();

		// Recompile formulas from source tokens onto the clone
		for (let ai = 0; ai < 3; ai++) {
			for (const attr_name of ['start', 'end', 'length'] as const) {
				const src_attr = src.axes[ai][attr_name];
				if (src_attr.formula) {
					const formula_str = src_attr.formula_display;
					if (formula_str) {
						constraints.set_formula(clone, clone.axes[ai][attr_name].name, formula_str, parent_scene.so.id);
					}
				}
			}
		}

		const so_scene = scene.create({
			so: clone,
			edges: this.edges,
			faces: this.faces,
			color: colors.edge_color_rgba(),
			parent: parent_scene,
		});
		clone.scene = so_scene;
		hits_3d.register(clone);

		constraints.propagate(clone);
		stores.w_all_sos.update(list => [...list, clone]);
		hits_3d.set_selection({ so: clone, type: T_Hit_3D.face, index: 0 });
		stores.tick();
		scenes.save();
	}

	/** Resize root to exactly fit its children. User-initiated — never automatic.
	 *  Snapshots direct children's absolute positions, resizes root to the union
	 *  AABB of all descendants, then restores direct children (recalculates their
	 *  offsets against the new root). Grandchildren stay correct because they're
	 *  relative to their parent, not root. */
	/** Check if root bounds already exactly match the union AABB of all descendants. */
	root_fits(): boolean {
		const root = this.root_scene?.so;
		if (!root?.scene) return true;

		// Repeater parents manage child layout — fit is meaningless
		if (root.repeater?.is_repeating) return true;

		// Only check direct children — repeater clones create feedback loops
		const children = scene.get_all().filter(o => o.parent === root.scene);
		if (children.length === 0) return true;

		let x_lo = Infinity, x_hi = -Infinity;
		let y_lo = Infinity, y_hi = -Infinity;
		let z_lo = Infinity, z_hi = -Infinity;

		for (const obj of children) {
			const so = obj.so;
			if (so.x_min < x_lo) x_lo = so.x_min;
			if (so.x_max > x_hi) x_hi = so.x_max;
			if (so.y_min < y_lo) y_lo = so.y_min;
			if (so.y_max > y_hi) y_hi = so.y_max;
			if (so.z_min < z_lo) z_lo = so.z_min;
			if (so.z_max > z_hi) z_hi = so.z_max;
		}

		const eps = 0.01;
		return Math.abs(root.x_min - x_lo) < eps && Math.abs(root.x_max - x_hi) < eps
			&& Math.abs(root.y_min - y_lo) < eps && Math.abs(root.y_max - y_hi) < eps
			&& Math.abs(root.z_min - z_lo) < eps && Math.abs(root.z_max - z_hi) < eps;
	}

	fit_to_children(): void {
		const root = this.root_scene?.so;
		if (!root?.scene) return;

		const all = scene.get_all();
		const direct_children: O_Scene[] = [];
		let x_lo = Infinity, x_hi = -Infinity;
		let y_lo = Infinity, y_hi = -Infinity;
		let z_lo = Infinity, z_hi = -Infinity;
		let has_desc = false;

		for (const obj of all) {
			if (obj.parent === root.scene) direct_children.push(obj);
			let p: O_Scene | undefined = obj.parent; let is_desc = false;
			while (p) { if (p === root.scene) { is_desc = true; break; } p = p.parent; }
			if (!is_desc) continue;
			has_desc = true;
			const so = obj.so;
			if (so.x_min < x_lo) x_lo = so.x_min;
			if (so.x_max > x_hi) x_hi = so.x_max;
			if (so.y_min < y_lo) y_lo = so.y_min;
			if (so.y_max > y_hi) y_hi = so.y_max;
			if (so.z_min < z_lo) z_lo = so.z_min;
			if (so.z_max > z_hi) z_hi = so.z_max;
		}

		if (!has_desc) return;

		// Snapshot direct children's absolute positions
		const snaps = direct_children.map(obj => ({
			so: obj.so,
			x_min: obj.so.x_min, x_max: obj.so.x_max,
			y_min: obj.so.y_min, y_max: obj.so.y_max,
			z_min: obj.so.z_min, z_max: obj.so.z_max,
		}));

		// Resize root to union AABB
		root.set_bound('x_min', x_lo);
		root.set_bound('x_max', x_hi);
		root.set_bound('y_min', y_lo);
		root.set_bound('y_max', y_hi);
		root.set_bound('z_min', z_lo);
		root.set_bound('z_max', z_hi);

		// Restore direct children (recalculates offsets against new root)
		for (const snap of snaps) {
			snap.so.set_bound('x_min', snap.x_min);
			snap.so.set_bound('x_max', snap.x_max);
			snap.so.set_bound('y_min', snap.y_min);
			snap.so.set_bound('y_max', snap.y_max);
			snap.so.set_bound('z_min', snap.z_min);
			snap.so.set_bound('z_max', snap.z_max);
		}

		constraints.propagate(root);
		stores.tick();
		scenes.save();
	}

	// ── repeaters ──

	/** Swap two axes on an SO and its template child.
	 *  Swaps Axis objects in-place, relabels, rewrites formula aliases.
	 *  Updates repeater config (run_axis, rise_axis) to match. */
	swap_axes(so: Smart_Object, a: number, b: number): void {
		const AXIS_NAMES: Axis_Name[] = ['x', 'y', 'z'];

		// Collect all descendants (parent-first order so offset fixup reads post-swap parent bounds)
		const targets: Smart_Object[] = [so];
		const all = scene.get_all();
		for (const obj of all) {
			let p = obj.parent;
			while (p) {
				if (p === so.scene) { targets.push(obj.so); break; }
				p = p.parent;
			}
		}

		// Pre-cache absolute positions for ALL targets before any swaps
		// (get_bound walks the parent chain — if parent already swapped, values are wrong)
		const cached = targets.map(target => ({
			abs_a: [target.get_bound(target.axes[a].start.name as Bound),
			        target.get_bound(target.axes[a].end.name as Bound)],
			abs_b: [target.get_bound(target.axes[b].start.name as Bound),
			        target.get_bound(target.axes[b].end.name as Bound)],
		}));

		// Phase 1: swap axes on every target
		for (let idx = 0; idx < targets.length; idx++) {
			const target = targets[idx];
			const { abs_a, abs_b } = cached[idx];

			// 1. Swap axis objects — values, invariants, formulas travel with them
			[target.axes[a], target.axes[b]] = [target.axes[b], target.axes[a]];

			// 2. Relabel — update axis name + attribute names to match new position
			target.axes[a].relabel(AXIS_NAMES[a]);
			target.axes[b].relabel(AXIS_NAMES[b]);

			// 3. Swap formula aliases — rewrite axis-specific refs in tokens, recompile
			//    All axes, not just the two being swapped (the 3rd may reference swapped names)
			for (const axis of target.axes) {
				for (const attr of axis.attributes) {
					constraints.swap_attr_aliases(attr, a, b);
				}
			}

			// 4. Fix offsets — stored values are parent-relative; parent bounds differ per axis
			const parent = target.scene?.parent?.so;
			if (parent) {
				const ax_a = target.axes[a]; // was at position b
				const ax_b = target.axes[b]; // was at position a
				if (!ax_a.start.compiled) ax_a.start.value = abs_b[0] - parent.get_bound(ax_a.start.name as Bound);
				if (!ax_a.end.compiled)   ax_a.end.value   = abs_b[1] - parent.get_bound(ax_a.end.name as Bound);
				if (!ax_b.start.compiled) ax_b.start.value = abs_a[0] - parent.get_bound(ax_b.start.name as Bound);
				if (!ax_b.end.compiled)   ax_b.end.value   = abs_a[1] - parent.get_bound(ax_b.end.name as Bound);
			}

			// Update repeater config if this target has one
			if (target.repeater) {
				const r = { ...target.repeater };
				if (r.run_axis === a) r.run_axis = b as 0 | 1 | 2;
				else if (r.run_axis === b) r.run_axis = a as 0 | 1 | 2;
				if (r.rise_axis === a) r.rise_axis = b as 0 | 1 | 2;
				else if (r.rise_axis === b) r.rise_axis = a as 0 | 1 | 2;
				target.repeater = r;
			}
		}

		// Phase 2: rebind all targets, then cascade once (launch.md two-phase rule)
		for (const target of targets) {
			const parent_id = target.scene?.parent?.so.id;
			if (parent_id) {
				constraints.rebind_formulas(target, parent_id);
			} else {
				constraints.enforce_invariants(target);
			}
		}
		constraints.propagate_all();
	}

	/** Physically rotate root and all children by 90°.
	 *  Root angles are ignored by the renderer, so we transform geometry directly.
	 *  Rotation = reflection (swap_axes) + mirror one axis to fix handedness. */
	rotate_root_90(rot_axis_name: Axis_Name, sign: 1 | -1): void {
		const root_so = this.root_scene?.so;
		if (!root_so) return;

		// Determine swap pair from rotation axis
		const SWAP: Record<Axis_Name, [number, number]> = { z: [0, 1], x: [1, 2], y: [0, 2] };
		const [a, b] = SWAP[rot_axis_name];

		// Step 1: swap axes (proven-working reflection for entire subtree)
		this.swap_axes(root_so, a, b);

		// Step 2: mirror one axis to convert reflection → proper rotation
		// +90° → mirror first axis of pair, -90° → mirror second
		const mirror = sign === -1 ? a : b;
		const mirror_start = root_so.axes[mirror].start.name as Bound;
		const mirror_end   = root_so.axes[mirror].end.name as Bound;
		const root_min = root_so.get_bound(mirror_start);
		const root_max = root_so.get_bound(mirror_end);

		// Convert all direct children of root
		const all = scene.get_all();
		for (const obj of all) {
			if (obj.parent !== root_so.scene) continue;
			const child = obj.so;
			const axis = child.axes[mirror];

			// Skip if both endpoints are formula-driven
			if (axis.start.compiled && axis.end.compiled) continue;

			const old_start = child.get_bound(mirror_start);
			const old_end   = child.get_bound(mirror_end);
			const new_start = root_min + root_max - old_end;
			const new_end   = root_min + root_max - old_start;

			// Write offsets directly to avoid set_bound's intermediate length sync
			if (!axis.start.compiled) {
				axis.start.value = new_start - root_so.get_bound(mirror_start);
			}
			if (!axis.end.compiled) {
				axis.end.value = new_end - root_so.get_bound(mirror_end);
			}
			// Length unchanged (mirror preserves it), but re-sync for safety
			if (!axis.length.compiled) {
				axis.length.value = new_end - new_start;
			}
		}

		// Diagonal repeaters: sync_repeater always marches clones in +run direction.
		// When the mirror axis matches run_axis, the visual run direction must reverse.
		// Add π on rot_axis so the renderer flips the staircase visually.
		for (const obj of all) {
			if (obj.parent !== root_so.scene) continue;
			const r = obj.so.repeater;
			if (!r?.is_diagonal) continue;
			if (r.run_axis === mirror) {
				const current = obj.so.axis_by_name(rot_axis_name).angle.value;
				obj.so.touch_axis(rot_axis_name, current + Math.PI);
			}
		}

		// Cascade all formulas and invariants
		constraints.propagate_all();

		// Re-sync any repeaters among direct children
		for (const obj of all) {
			if (obj.parent !== root_so.scene) continue;
			if (obj.so.repeater) this.sync_repeater(obj.so);
		}
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

	/** Remove all children except the first (template) from a repeater parent.
	 *  Resets the template back to parent origin and restores original run-axis
	 *  length if it was modified by diagonal layout. */
	strip_clones(so: Smart_Object): void {
		if (!so.scene) return;
		const children = scene.get_all().filter(o => o.parent === so.scene);

		// Reset template to parent origin and restore original dimensions
		if (children.length > 0) {
			const t = children[0].so;
			for (let ai = 0; ai < 3; ai++) {
				const delta = -t.axes[ai].start.value;
				t.axes[ai].start.value = 0;
				t.axes[ai].end.value += delta;
			}
			// Restore run-axis length if diagonal modified it
			if (so.repeater?._orig_run_length != null) {
				const repeat_ai = so.repeater.run_axis ?? 0;
				const orig = so.repeater._orig_run_length;
				const length_delta = orig - t.axes[repeat_ai].length.value;
				t.axes[repeat_ai].length.value = orig;
				t.axes[repeat_ai].end.value += length_delta;
				delete so.repeater._orig_run_length;
			}
		}

		for (const clone of children.slice(1)) {
			hits_3d.unregister(clone.so);
			scene.destroy(clone.id);
		}
		stores.w_all_sos.set(scene.get_all().map(o => o.so));
	}

	/** Sync repeater children to match the constraint-derived count.
	 *  Count determined by: gap range → spacing → 1 (fallback).
	 *  When rise_axis differs from run_axis (ie, diagonal), clones offset along both axes.
	 *  Clone i is offset by step × (i+1) along run_axis (or auto-detected largest axis). */
	sync_repeater(so: Smart_Object): void {
		if (!so.repeater || !so.scene || so.repeater.is_repeating === false) return;

		const all_children = scene.get_all().filter(o => o.parent === so.scene);
		if (all_children.length === 0) return;

		const template_entry = all_children[0];

		const t = template_entry.so;
		const w = t.width, d = t.depth, h = t.height;
		const auto_ai = (w >= d && w >= h) ? 0 : (d >= h ? 1 : 2);
		const repeat_ai = so.repeater.run_axis ?? auto_ai;
		const template_dim = [w, d, h][repeat_ai];
		if (template_dim <= 0) return;

		// rise_axis: which dimension gap_min/gap_max constrain (defaults to run_axis)
		const gap_ai = so.repeater.rise_axis ?? repeat_ai;
		const parent_dims = [so.width, so.depth, so.height];
		const parent_length = parent_dims[repeat_ai];
		const gap_length = parent_dims[gap_ai];

		// Determine count and step distances
		const { gap_min, gap_max, spacing, is_diagonal } = so.repeater;
		let count: number;
		let step: number;
		let gap_step = 0; // secondary axis offset (nonzero for diagonal)

		const diagonal = is_diagonal === true || (is_diagonal == null && gap_ai !== repeat_ai);
		if (diagonal) {
			const g_min = gap_min ?? 6 * 25.4;
			const g_max = gap_max ?? 9 * 25.4;
			count = gap_length > 0 ? this.resolve_gap(gap_length, g_min, g_max) : 1;
			if (gap_ai !== repeat_ai) {
				// Stairs: tread depth = 1.25 × run, all fitting within envelope
				const gap_dim = [w, d, h][gap_ai];
				step = count > 1 ? parent_length / (count - 0.75) : parent_length;
				step = Math.min(step, parent_length);
				gap_step = count > 0 ? (gap_length - gap_dim) / count : 0;
			} else {
				step = parent_length / count;
			}
		} else {
			const sp = spacing ?? 16 * 25.4;
			if (sp > 0 && parent_length > 0) {
				count = Math.floor((parent_length - template_dim) / sp);
				step = sp;
			} else {
				count = 1;
				step = template_dim;
			}
		}

		// Bookend: for spacing repeaters, place a final clone flush at parent's far edge
		let has_bookend = false;
		let bookend_offset = 0;
		let shoved_last = false;
		let shoved_offset = 0;
		let shoved_bay = 0;
		if (!gap_step && spacing != null && spacing > 0 && parent_length > 0) {
			const t_start = t.axes[repeat_ai].start.value;
			bookend_offset = parent_length - template_dim - t_start;
			const last_offset = count > 0 ? count * step : 0;
			has_bookend = bookend_offset >= last_offset + template_dim;
			// Tight bookend: envelope extends past last clone by less than template_dim —
			// shove the last clone back to make room for one more at the end
			if (!has_bookend && count > 0) {
				const remaining = bookend_offset - last_offset;
				if (remaining > 0 && remaining < template_dim) {
					has_bookend = true;
					shoved_last = true;
					shoved_offset = bookend_offset - template_dim;
					shoved_bay = shoved_offset - (count - 1) * step - template_dim;
				}
			}
		}

		const clones = all_children.slice(1);
		// Template is instance 0; clones fill positions 1..count-1 (top position is the landing, not a tread)
		const needed_studs = Math.max(0, count - (gap_step ? 2 : 0)) + (has_bookend ? 1 : 0);

		// Firewall blocking: horizontal members between studs — one per bay including bookend bay
		const regular_bay = step - template_dim;
		const bookend_bay = has_bookend ? (shoved_last ? 0 : bookend_offset - template_dim - step * count) : 0;
		const has_bookend_fireblock = bookend_bay > 0;
		const needed_firewall = (so.repeater.firewall && !gap_step && needed_studs > 0) ? count + (has_bookend_fireblock ? 1 : 0) : 0;
		const total_needed = needed_studs + needed_firewall;

		// Firewall geometry: find the height axis (tallest non-repeat axis of template)
		const dims = [w, d, h];
		let height_ai = repeat_ai === 0 ? 1 : 0;
		for (let i = 0; i < 3; i++) {
			if (i !== repeat_ai && dims[i] > dims[height_ai]) height_ai = i;
		}

		// Stairs: position template 1 gap_step from parent edge on rise axis (bottom phantom)
		// and set tread depth to 1.25 × run so nosing fits within envelope
		if (gap_step) {
			if (so.repeater._orig_run_length == null) {
				so.repeater._orig_run_length = t.axes[repeat_ai].length.value;
			}
			const gap_delta = gap_step - t.axes[gap_ai].start.value;
			t.axes[gap_ai].start.value += gap_delta;
			t.axes[gap_ai].end.value += gap_delta;
			const tread_depth = Math.min(step * 1.25, parent_length);
			const length_delta = tread_depth - t.axes[repeat_ai].length.value;
			t.axes[repeat_ai].length.value += length_delta;
			t.axes[repeat_ai].end.value += length_delta;
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
			const offset = (has_bookend && i === needed_studs - 1) ? bookend_offset
				: (shoved_last && i === needed_studs - 2) ? shoved_offset
				: step * (i + 1);
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
			const bay = (has_bookend_fireblock && fi === count) ? bookend_bay
				: (shoved_last && fi === count - 1) ? shoved_bay
				: regular_bay;
			this.apply_firewall_position(surviving[i].so, t, fi, repeat_ai, height_ai, step, template_dim, parent_dims, bay);
		}

		// Add missing clones
		const used = new Set(scene.get_all().map(o => o.so.name));
		for (let i = surviving.length; i < total_needed; i++) {
			const clone = this.clone_so_from_template(t, used);
			if (i < needed_studs) {
				const offset = (has_bookend && i === needed_studs - 1) ? bookend_offset
					: (shoved_last && i === needed_studs - 2) ? shoved_offset
					: step * (i + 1);
				clone.axes[repeat_ai].start.value += offset;
				clone.axes[repeat_ai].end.value   += offset;
				if (gap_step) {
					clone.axes[gap_ai].start.value += gap_step * (i + 1);
					clone.axes[gap_ai].end.value   += gap_step * (i + 1);
				}
			} else {
				const fi = i - needed_studs;
				const bay = (has_bookend_fireblock && fi === count) ? bookend_bay
					: (shoved_last && fi === count - 1) ? shoved_bay
					: regular_bay;
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
		clone.visible = t.visible;
		return clone;
	}
}

export const engine = new Engine();
