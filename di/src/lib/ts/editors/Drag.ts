import { quat, vec3, vec4, mat4 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import { hits_3d, type Hit_3D_Result } from '../events/Hits_3D';
import { Point } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';
import { stores } from '../managers/Stores';
import { camera } from '../render/Camera';
import type { Bound, Axis_Name } from '../types/Types';
import { constraints } from '../algebra/Constraints';
import Smart_Object from '../runtime/Smart_Object';
import { scene as scene_graph } from '../render/Scene';
import { scenes } from '../managers/Scenes';
import { writable, get } from 'svelte/store';

// ── Exported pure math for testing ──

/** Intersect a ray with a plane. Returns the intersection point.
 *  If the ray is parallel to the plane, returns the ray origin (safe fallback). */
export function ray_plane_hit(
	ray_origin: vec3, ray_dir: vec3,
	plane_point: vec3, plane_normal: vec3,
): vec3 {
	const denom = vec3.dot(ray_dir, plane_normal);
	const diff = vec3.create();
	vec3.subtract(diff, plane_point, ray_origin);
	const t = denom !== 0 ? vec3.dot(diff, plane_normal) / denom : 0;
	const result = vec3.create();
	vec3.scaleAndAdd(result, ray_origin, ray_dir, t);
	return result;
}

/** Decompose a world-space delta onto two face edge vectors, returning the result in local space.
 *  Returns null if either edge vector is near-zero length. */
export function decompose_delta(
	delta_world: vec3,
	e1_world: vec3, e2_world: vec3,
	e1_local: vec3, e2_local: vec3,
): vec3 | null {
	const e1_dot_e1 = vec3.dot(e1_world, e1_world);
	const e2_dot_e2 = vec3.dot(e2_world, e2_world);
	if (e1_dot_e1 < 1e-10 || e2_dot_e2 < 1e-10) return null;

	const a_coeff = vec3.dot(delta_world, e1_world) / e1_dot_e1;
	const b_coeff = vec3.dot(delta_world, e2_world) / e2_dot_e2;

	const result = vec3.create();
	vec3.scaleAndAdd(result, result, e1_local, a_coeff);
	vec3.scaleAndAdd(result, result, e2_local, b_coeff);
	return result;
}

/** Screen-space face drag anchor — projects face edges to screen at drag start.
 *  Mouse displacement is decomposed in 2D, same as the stretch anchor. */
interface Face_Anchor {
	anchor_screen: Point;                  // mouse screen position at drag start
	e1_screen: { x: number; y: number };   // face edge 1 projected to screen (pixels)
	e2_screen: { x: number; y: number };   // face edge 2 projected to screen (pixels)
	e1_local: vec3;                        // local edge vector 1
	e2_local: vec3;                        // local edge vector 2
	initial_bounds: Map<Bound, number>;    // child's absolute bounds at drag start
	so: Smart_Object;                      // child SO being translated
	child_scene: O_Scene;                  // reference to child scene
	parent_scene: O_Scene;                 // reference to parent scene (for guidance rendering)
	face_index: number;                    // which face is the guidance plane
}

/** Per-axis formula info captured at drag start — used to redirect the stretch
 *  to the formula-bearing source attribute, and to update the formula at drag end. */
interface Axis_Formula_Info {
	axis_name: Axis_Name;
	invariant: number;               // 0=start derived, 1=end derived, 2=length derived
	formula_text: string | null;     // original formula on the source attribute (if any)
	formula_result: number;          // value the formula produced at drag start
	source_attr_name: string;        // name of the source attribute being modified (e.g., 'width')
}

/** Screen-space stretch anchor — captures screen-projected face edges at drag start.
 *  Mouse displacement is decomposed in 2D, then scaled to bounds units. */
interface Stretch_Anchor {
	anchor_screen: Point;                  // mouse screen position at drag start
	e1_screen: { x: number; y: number };   // face edge 1 projected to screen (pixels)
	e2_screen: { x: number; y: number };   // face edge 2 projected to screen (pixels)
	e1_local: vec3;                        // local bounds-space edge vector 1
	e2_local: vec3;                        // local bounds-space edge vector 2
	initial_bounds: Map<Bound, number>;    // snapshot of affected bounds at mousedown
	formula_info: Axis_Formula_Info[];     // per-axis formula info for redirect + update
	so: Smart_Object;                      // the SO being stretched
	scene: O_Scene;                        // scene object (for frozen_center)
	face_index: number;                    // selected face
	target_type: T_Hit_3D;                 // edge or corner
	target_index: number;                  // which edge or corner
}

/** Record of an edge snap during face drag — used for pin offer on drag end. */
interface Snap_Result {
	dragged_bound: Bound;
	sibling_so: Smart_Object;
	sibling_bound: Bound;
	value: number;
}

/** Distance threshold in mm for edge-to-edge snapping during face drag. */
const SNAP_THRESHOLD_MM = 5;

/** Pin offer shown after a drag ends with active snaps. */
export interface Pin_Offer {
	screen_x: number;
	screen_y: number;
	snaps: Snap_Result[];
	dragged_so: Smart_Object;
}

/** Bound name → formula alias for cross-references. */
const bound_to_alias: Record<string, string> = {
	x_min: 'x', x_max: 'X',
	y_min: 'y', y_max: 'Y',
	z_min: 'z', z_max: 'Z',
};

class Drag {
	private target: Hit_3D_Result | null = null;

	/** Fixed plane + anchor for face drags — prevents drift from moving plane. */
	private face_anchor: Face_Anchor | null = null;

	/** Fixed plane + anchor for edge/corner stretch drags. */
	private stretch_anchor: Stretch_Anchor | null = null;

	/** Set on mousedown for immediate edge highlight before first drag frame. */
	private stretch_face: { scene: O_Scene; face_index: number } | null = null;

	/** During rotation, the face whose normal is the rotation axis. */
	private _rotation_face: { scene: O_Scene; face_index: number } | null = null;

	/** Active edge snaps from the most recent face drag frame. */
	private _snap_results: Snap_Result[] = [];

	/** Pin offer shown after drag ends with active snaps. */
	w_pin_offer = writable<Pin_Offer | null>(null);

	// ── lifecycle ──

	set_target(hit: Hit_3D_Result | null): void {
		this.target = hit;
		this.face_anchor = null;
		this.stretch_anchor = null;
		this._snap_results = [];
		this.w_pin_offer.set(null);
		// Immediate highlight: if clicking an edge/corner on a selected face, store for guidance rendering
		const sel = hits_3d.selection;
		if (hit && sel && (hit.type === T_Hit_3D.edge || hit.type === T_Hit_3D.corner) && sel.so.scene) {
			this.stretch_face = { scene: sel.so.scene, face_index: sel.index };
		} else {
			this.stretch_face = null;
		}
	}

	clear(): void {
		// Finalize stretch: update formulas with the drag offset, then unfreeze
		if (this.stretch_anchor) {
			this.finalize_stretch();
			delete this.stretch_anchor.scene.frozen_center;
		}
		this.target = null;
		this.face_anchor = null;
		this.stretch_anchor = null;
		this.stretch_face = null;
		this._rotation_face = null;
	}

	/** At drag end, update formulas on the source attributes to include the drag offset.
	 *  This preserves the formula relationship while encoding the manual adjustment. */
	private finalize_stretch(): void {
		const a = this.stretch_anchor;
		if (!a) return;

		for (const info of a.formula_info) {
			if (!info.formula_text) continue;  // no formula on this axis — nothing to update

			const axis = a.so.axis_by_name(info.axis_name);
			const current_value = (info.invariant === 0 || info.invariant === 1)
				? axis.length.value
				: a.so.get_bound(info.source_attr_name as Bound);
			const offset = current_value - info.formula_result;

			// Skip if the drag didn't change anything (within snap precision)
			if (Math.abs(offset) < 0.01) continue;

			// Build the updated formula: original ± offset
			const sign = offset >= 0 ? '+' : '-';
			const abs_offset = Math.abs(offset);
			const new_formula = `${info.formula_text} ${sign} ${abs_offset}`;

			// Apply the updated formula to the source attribute
			const parent_id = a.scene.parent?.so.id;
			constraints.set_formula(a.so, info.source_attr_name, new_formula, parent_id);
		}
	}

	get has_target(): boolean { return this.target !== null; }

	/** During a drag, returns the scene + face index whose edges should be
	 *  highlighted.  Face drag → parent's guidance plane.  Edge/corner drag →
	 *  selected face on the SO being stretched.  null when inactive. */
	get guidance_face(): { scene: O_Scene; face_index: number } | null {
		if (this.face_anchor) return { scene: this.face_anchor.parent_scene, face_index: this.face_anchor.face_index };
		if (this.stretch_anchor) return { scene: this.stretch_anchor.scene, face_index: this.stretch_anchor.face_index };
		return this.stretch_face;
	}

	/** During rotation, the face whose normal is the rotation axis. */
	get rotation_face(): { scene: O_Scene; face_index: number } | null {
		return this._rotation_face;
	}

	/** Edge snaps from the current/most-recent face drag. */
	get snap_results(): Snap_Result[] { return this._snap_results; }

	/** Clear snap results — called when pin offer is accepted or dismissed. */
	clear_snap_results(): void { this._snap_results = []; }

	/** After drag ends with active snaps, compute screen position and populate pin offer. */
	compute_pin_offer(): void {
		const a = this.face_anchor;
		if (!a || this._snap_results.length === 0) return;

		const so = a.so;
		const world_matrix = this.get_world_matrix(a.child_scene);
		const view_projection = mat4.create();
		mat4.multiply(view_projection, camera.projection, camera.view);

		let total_x = 0, total_y = 0;
		for (const snap of this._snap_results) {
			// Midpoint of the snapped edge on the child SO
			const mid: vec3 = [
				(so.x_min + so.x_max) / 2,
				(so.y_min + so.y_max) / 2,
				(so.z_min + so.z_max) / 2,
			];
			// Place on the snapped bound's axis
			const axis = snap.dragged_bound.startsWith('x') ? 0
				: snap.dragged_bound.startsWith('y') ? 1 : 2;
			mid[axis] = snap.value;

			const world: vec3 = [0, 0, 0];
			vec3.transformMat4(world, mid, world_matrix);

			const clip = vec4.create();
			vec4.transformMat4(clip, vec4.fromValues(world[0], world[1], world[2], 1), view_projection);
			if (Math.abs(clip[3]) < 1e-6) continue;

			total_x += ((clip[0] / clip[3]) + 1) * 0.5 * camera.size.width;
			total_y += (1 - (clip[1] / clip[3])) * 0.5 * camera.size.height;
		}

		const n = this._snap_results.length;
		this.w_pin_offer.set({
			screen_x: total_x / n,
			screen_y: total_y / n,
			snaps: [...this._snap_results],
			dragged_so: so,
		});
	}

	/** Accept pin offer: set attached cross-referencing formulas on both SOs. */
	accept_pin(): void {
		const offer = get(this.w_pin_offer);
		if (!offer) return;

		const parent_id = offer.dragged_so.scene?.parent?.so.id;
		for (const snap of offer.snaps) {
			const dragged_alias = bound_to_alias[snap.dragged_bound];
			const sibling_alias = bound_to_alias[snap.sibling_bound];
			if (!dragged_alias || !sibling_alias) continue;

			// Dragged SO's bound → references sibling
			constraints.set_formula(
				offer.dragged_so, snap.dragged_bound,
				`${snap.sibling_so.name}.${sibling_alias}`,
				parent_id, true
			);
			// Sibling's bound → references dragged SO
			constraints.set_formula(
				snap.sibling_so, snap.sibling_bound,
				`${offer.dragged_so.name}.${dragged_alias}`,
				parent_id, true
			);
		}

		this.w_pin_offer.set(null);
		constraints.propagate(offer.dragged_so);
		stores.tick();
		scenes.save();
	}

	// ── object transforms ──

	scale(delta: number, fine: boolean): void {
		const factor = fine ? (delta > 0 ? 1.02 : 0.98) : (delta > 0 ? 1.1 : 0.9);
		stores.w_scale.update(s => s * factor);
	}

	rotate_object(_obj: O_Scene, prev: Point, curr: Point, alt_key = false): void {
		const sel = hits_3d.selection;

		// No alt key → always tumble root (free rotation via store)
		// Alt key but no face selected → also tumble root
		if (!alt_key || !sel || sel.type !== T_Hit_3D.face) {
			this._rotation_face = null;
			const dx = curr.x - prev.x;
			const dy = curr.y - prev.y;
			const rot_x = quat.create();
			const rot_y = quat.create();
			quat.setAxisAngle(rot_x, [1, 0, 0], dy * 0.01);
			quat.setAxisAngle(rot_y, [0, 1, 0], dx * 0.01);
			const q = stores.current_orientation();
			quat.multiply(q, rot_y, q);
			quat.multiply(q, rot_x, q);
			quat.normalize(q, q);
			stores.set_orientation(q);
			return;
		}

		// Alt key + face selected → constrained rotation on the selected face
		const so = sel.so;
		const scene = so.scene;
		if (!scene) return;

		// Rotate around selected face's normal
		const face_normal_local: vec3 = so.face_normal(sel.index);
		const rotation_axis: Axis_Name = so.face_fixed_axis(sel.index);
		const rotation_target: Smart_Object = so;
		const normal_scene: O_Scene = scene;
		this._rotation_face = { scene, face_index: sel.index };

		// Face normal in world space for screen projection and camera direction check
		const world_matrix = this.get_world_matrix(normal_scene);
		const nw = vec4.create();
		vec4.transformMat4(nw, vec4.fromValues(face_normal_local[0], face_normal_local[1], face_normal_local[2], 0), world_matrix);
		const face_normal_world: vec3 = [nw[0], nw[1], nw[2]];
		vec3.normalize(face_normal_world, face_normal_world);

		// Project SO center to screen space as pivot for theta calculation
		const center_local: vec3 = [
			(rotation_target.x_min + rotation_target.x_max) / 2,
			(rotation_target.y_min + rotation_target.y_max) / 2,
			(rotation_target.z_min + rotation_target.z_max) / 2,
		];
		const center_world: vec3 = [0, 0, 0];
		vec3.transformMat4(center_world, center_local, world_matrix);

		const view_projection = mat4.create();
		mat4.multiply(view_projection, camera.projection, camera.view);
		const center_clip = vec4.create();
		vec4.transformMat4(center_clip, vec4.fromValues(center_world[0], center_world[1], center_world[2], 1), view_projection);
		if (Math.abs(center_clip[3]) < 1e-6) return;
		const center_screen_x = ((center_clip[0] / center_clip[3]) + 1) * 0.5 * camera.size.width;
		const center_screen_y = (1 - (center_clip[1] / center_clip[3])) * 0.5 * camera.size.height;

		// Mouse angle change around projected center
		const theta_prev = Math.atan2(prev.y - center_screen_y, prev.x - center_screen_x);
		const theta_curr = Math.atan2(curr.y - center_screen_y, curr.x - center_screen_x);
		let delta_theta = -(theta_curr - theta_prev);
		if (delta_theta > Math.PI) delta_theta -= 2 * Math.PI;
		if (delta_theta < -Math.PI) delta_theta += 2 * Math.PI;

		// If face normal points away from camera, flip so rotation follows mouse
		const camera_direction = vec3.create();
		vec3.subtract(camera_direction, camera.center_pos, camera.eye);
		if (vec3.dot(face_normal_world, camera_direction) > 0) delta_theta = -delta_theta;

		// Apply rotation to the axis angle
		rotation_target.nudge_axis(rotation_axis, delta_theta);

		// Snap: check if current angle is near a detent, snap if so
		const axis_obj = rotation_target.axis_by_name(rotation_axis);
		let current_angle = axis_obj.angle.value;

		const SNAP_THRESHOLD = 3 * Math.PI / 180;
		const SNAP_ANGLES = [0, 22.5, 30, 45, 60, 67.5, 90];
		const snap_rad = SNAP_ANGLES.map(d => d * Math.PI / 180);
		const all_snaps: number[] = [];
		for (const a of snap_rad) {
			for (const sign of [1, -1]) {
				const v = sign * a;
				for (let m = -2; m <= 2; m++) {
					let s = v + m * Math.PI / 2;
					while (s > Math.PI) s -= 2 * Math.PI;
					while (s < -Math.PI) s += 2 * Math.PI;
					all_snaps.push(s);
				}
			}
		}

		// Normalize current angle to [-π, π]
		while (current_angle > Math.PI) current_angle -= 2 * Math.PI;
		while (current_angle < -Math.PI) current_angle += 2 * Math.PI;

		for (const snap of all_snaps) {
			let diff = current_angle - snap;
			while (diff > Math.PI) diff -= 2 * Math.PI;
			while (diff < -Math.PI) diff += 2 * Math.PI;
			if (Math.abs(diff) < SNAP_THRESHOLD) {
				axis_obj.angle.value = snap;
				break;
			}
		}
	}

	// ── selection editing ──

	// Edit the current selection by modifying SO bounds
	// Projects mouse positions onto face plane to get world-space delta
	edit_selection(prev_mouse: Point, curr_mouse: Point): boolean {
		const sel = hits_3d.selection;
		const target = this.target;
		if (!sel || !target) return false;

		// Selection must be a face
		if (sel.type !== T_Hit_3D.face) return false;

		// Drag target must belong to same SO as selection
		if (target.so !== sel.so) return false;

		const scene = sel.so.scene;
		if (!scene) return false;

		// Face drag: translate child SO in the plane of the selected face
		if (target.type === T_Hit_3D.face) {
			if (!scene.parent) return false; // root SO cannot be translated

			// First frame: capture anchor from the SELECTED face on the child SO
			if (!this.face_anchor) {
				this.face_anchor = this.init_face_anchor(prev_mouse, sel.index, scene, scene);
			}

			// Every frame: intersect curr_mouse with the FIXED plane, compute total delta
			const delta = this.get_anchored_delta(curr_mouse);
			if (!delta) return false;
			this.apply_face_drag_absolute(delta);
			return true;
		}

		// Edge/corner drag: stretch bounds using anchored plane
		if (target.type === T_Hit_3D.edge || target.type === T_Hit_3D.corner) {
			// Validate target belongs to selected face
			if (target.type === T_Hit_3D.edge && !sel.so.edge_in_face(target.index, sel.index)) return false;
			if (target.type === T_Hit_3D.corner && !sel.so.corner_in_face(target.index, sel.index)) return false;

			// First frame: capture anchor
			if (!this.stretch_anchor) {
				const anchor = this.init_stretch_anchor(prev_mouse, sel.index, target.type, target.index, scene);
				if (!anchor) return false;
				this.stretch_anchor = anchor;
			}

			// Every frame: compute absolute delta from anchor, apply as offset from initial bounds
			const delta = this.get_stretch_delta(curr_mouse);
			if (!delta) return false;
			this.apply_stretch_absolute(delta);
			return true;
		}

		return false;
	}

	// ── internals ──

	/** Compute face plane geometry: edge vectors, normal, plane point, and
	 *  local edge vectors.  Shared by face drag and stretch drag init. */
	private compute_face_plane(so: Smart_Object, face_index: number, world_matrix: mat4) {
		const face_verts = so.face_vertices(face_index);
		const local_verts = so.vertices;
		const corners_world: vec3[] = [];
		for (const vi of face_verts) {
			const lv = local_verts[vi];
			const wv: vec3 = [0, 0, 0];
			vec3.transformMat4(wv, lv, world_matrix);
			corners_world.push(wv);
		}

		const e1_world = vec3.sub(vec3.create(), corners_world[1], corners_world[0]);
		const e2_world = vec3.sub(vec3.create(), corners_world[3], corners_world[0]);
		const plane_normal = vec3.cross(vec3.create(), e1_world, e2_world);
		vec3.normalize(plane_normal, plane_normal);

		const lv0 = local_verts[face_verts[0]];
		const lv1 = local_verts[face_verts[1]];
		const lv3 = local_verts[face_verts[3]];
		const e1_local = vec3.sub(vec3.create(), lv1, lv0);
		const e2_local = vec3.sub(vec3.create(), lv3, lv0);

		const plane_point = vec3.fromValues(
			(corners_world[0][0] + corners_world[1][0] + corners_world[2][0] + corners_world[3][0]) / 4,
			(corners_world[0][1] + corners_world[1][1] + corners_world[2][1] + corners_world[3][1]) / 4,
			(corners_world[0][2] + corners_world[1][2] + corners_world[2][2] + corners_world[3][2]) / 4,
		);

		return { e1_world, e2_world, e1_local, e2_local, plane_normal, plane_point };
	}

	/** Capture a fixed plane + anchor at drag start for face translation.
	 *  Plane comes from the PARENT SO's front face (stable — parent doesn't move).
	 *  Snapshots child SO bounds for absolute offset application. */
	private init_face_anchor(
		mouse: Point,
		face_index: number,
		plane_scene: O_Scene,
		child_scene: O_Scene
	): Face_Anchor {
		const so = plane_scene.so;
		const world_matrix = this.get_world_matrix(plane_scene);
		const plane = this.compute_face_plane(so, face_index, world_matrix);

		// Project face corners to screen space
		const project = (world_pt: vec3): { x: number; y: number } => {
			const clip = vec4.create();
			vec4.transformMat4(clip, [world_pt[0], world_pt[1], world_pt[2], 1], this.vp_matrix());
			if (Math.abs(clip[3]) < 1e-6) return { x: 0, y: 0 };
			return {
				x: ((clip[0] / clip[3]) + 1) * 0.5 * camera.size.width,
				y: (1 - (clip[1] / clip[3])) * 0.5 * camera.size.height,
			};
		};
		const face_verts = so.face_vertices(face_index);
		const local_verts = so.vertices;
		const corners_screen: { x: number; y: number }[] = [];
		for (const vi of face_verts) {
			const lv = local_verts[vi];
			const wv: vec3 = [0, 0, 0];
			vec3.transformMat4(wv, lv, world_matrix);
			corners_screen.push(project(wv));
		}
		const e1_screen = { x: corners_screen[1].x - corners_screen[0].x, y: corners_screen[1].y - corners_screen[0].y };
		const e2_screen = { x: corners_screen[3].x - corners_screen[0].x, y: corners_screen[3].y - corners_screen[0].y };

		const child_so = child_scene.so;
		const bound_names: Bound[] = ['x_min', 'x_max', 'y_min', 'y_max', 'z_min', 'z_max'];
		const initial_bounds = new Map<Bound, number>();
		for (const b of bound_names) initial_bounds.set(b, child_so.get_bound(b));

		// Rotate the local edge vectors by the child's orientation so the
		// bounds-space delta follows the child's rotated face, not the parent's axes.
		const orientation = child_so.orientation;
		const e1_rotated = vec3.create();
		const e2_rotated = vec3.create();
		vec3.transformQuat(e1_rotated, plane.e1_local, orientation);
		vec3.transformQuat(e2_rotated, plane.e2_local, orientation);

		return { anchor_screen: mouse, e1_screen, e2_screen, e1_local: e1_rotated, e2_local: e2_rotated, initial_bounds, so: child_so, child_scene, parent_scene: plane_scene, face_index };
	}

	/** Compute bounds-space delta from screen-space mouse displacement for face drag. */
	private get_anchored_delta(curr_mouse: Point): vec3 | null {
		const a = this.face_anchor;
		if (!a) return null;

		const dx = curr_mouse.x - a.anchor_screen.x;
		const dy = curr_mouse.y - a.anchor_screen.y;

		const e1 = a.e1_screen, e2 = a.e2_screen;
		const e1_dot_e1 = e1.x * e1.x + e1.y * e1.y;
		const e2_dot_e2 = e2.x * e2.x + e2.y * e2.y;
		if (e1_dot_e1 < 1e-6 || e2_dot_e2 < 1e-6) return null;

		const a_coeff = (dx * e1.x + dy * e1.y) / e1_dot_e1;
		const b_coeff = (dx * e2.x + dy * e2.y) / e2_dot_e2;

		const result = vec3.create();
		vec3.scaleAndAdd(result, result, a.e1_local, a_coeff);
		vec3.scaleAndAdd(result, result, a.e2_local, b_coeff);
		return result;
	}

	/** Capture screen-projected face edges at drag start for edge/corner stretching.
	 *  Projects the face's two edge vectors to screen space. Mouse displacement
	 *  is decomposed in 2D and scaled to bounds units — no 3D ray intersection,
	 *  no center-shift compensation needed. */
	private init_stretch_anchor(
		mouse: Point,
		face_index: number,
		target_type: T_Hit_3D,
		target_index: number,
		scene: O_Scene
	): Stretch_Anchor | null {
		const so = scene.so;
		const world_matrix = this.get_world_matrix(scene);
		const plane = this.compute_face_plane(so, face_index, world_matrix);

		// Project the face's two edge vectors to screen space
		const project = (world_pt: vec3): { x: number; y: number } => {
			const clip = vec4.create();
			vec4.transformMat4(clip, [world_pt[0], world_pt[1], world_pt[2], 1], this.vp_matrix());
			if (Math.abs(clip[3]) < 1e-6) return { x: 0, y: 0 };
			return {
				x: ((clip[0] / clip[3]) + 1) * 0.5 * camera.size.width,
				y: (1 - (clip[1] / clip[3])) * 0.5 * camera.size.height,
			};
		};
		const face_verts = so.face_vertices(face_index);
		const local_verts = so.vertices;
		const corners_screen: { x: number; y: number }[] = [];
		for (const vi of face_verts) {
			const lv = local_verts[vi];
			const wv: vec3 = [0, 0, 0];
			vec3.transformMat4(wv, lv, world_matrix);
			corners_screen.push(project(wv));
		}
		const e1_screen = { x: corners_screen[1].x - corners_screen[0].x, y: corners_screen[1].y - corners_screen[0].y };
		const e2_screen = { x: corners_screen[3].x - corners_screen[0].x, y: corners_screen[3].y - corners_screen[0].y };

		// Snapshot affected bounds
		const initial_bounds = new Map<Bound, number>();
		const is_root = !scene.parent;
		if (target_type === T_Hit_3D.edge) {
			const bound = so.edge_bound(target_index, face_index);
			initial_bounds.set(bound, so.get_bound(bound));
			if (is_root && bound.endsWith('_min')) {
				const opposite = bound.replace('_min', '_max') as Bound;
				initial_bounds.set(opposite, so.get_bound(opposite));
			}
		} else {
			for (const axis of so.face_axes(face_index)) {
				const bound = so.vertex_bound(target_index, axis);
				initial_bounds.set(bound, so.get_bound(bound));
				if (is_root && bound.endsWith('_min')) {
					const opposite = bound.replace('_min', '_max') as Bound;
					initial_bounds.set(opposite, so.get_bound(opposite));
				}
			}
		}

		// Freeze the center so the world matrix doesn't shift during the drag
		scene.frozen_center = vec3.fromValues(
			(so.x_min + so.x_max) / 2,
			(so.y_min + so.y_max) / 2,
			(so.z_min + so.z_max) / 2,
		);

		// Capture per-axis formula info: which attribute is derived, which is the source,
		// and what formula (if any) is on the source that the drag will modify.
		const formula_info: Axis_Formula_Info[] = [];
		const affected_axes = target_type === T_Hit_3D.edge
			? [so.edge_changes_axis(target_index, face_index)]
			: so.face_axes(face_index);
		for (const axis_name of affected_axes) {
			const axis = so.axis_by_name(axis_name);
			const inv = axis.invariant;
			// The source attribute that the drag should modify:
			// If inv=1 (end derived), source = length. If inv=0 (start derived), source = length.
			// If inv=2 (length derived), source = the bound itself (start or end).
			let source_attr;
			if (inv === 0 || inv === 1) {
				source_attr = axis.length;
			} else {
				const bound = target_type === T_Hit_3D.edge
					? so.edge_bound(target_index, face_index)
					: so.vertex_bound(target_index, axis_name);
				source_attr = so.attributes_dict_byName[bound];
			}
			formula_info.push({
				axis_name,
				invariant: inv,
				formula_text: source_attr?.formula_display ?? null,
				formula_result: source_attr?.value ?? 0,
				source_attr_name: source_attr?.name ?? '',
			});
		}

		return { anchor_screen: mouse, e1_screen, e2_screen, e1_local: plane.e1_local, e2_local: plane.e2_local, initial_bounds, formula_info, so, scene, face_index, target_type, target_index };
	}

	/** View-projection matrix for screen projection. */
	private vp_matrix(): mat4 {
		const vp = mat4.create();
		mat4.multiply(vp, camera.projection, camera.view);
		return vp;
	}

	/** Compute bounds-space delta from screen-space mouse displacement. */
	private get_stretch_delta(curr_mouse: Point): vec3 | null {
		const a = this.stretch_anchor;
		if (!a) return null;

		// 2D pixel displacement from anchor
		const dx = curr_mouse.x - a.anchor_screen.x;
		const dy = curr_mouse.y - a.anchor_screen.y;

		// Decompose pixel displacement onto the two screen-projected edge directions
		const e1 = a.e1_screen, e2 = a.e2_screen;
		const e1_dot_e1 = e1.x * e1.x + e1.y * e1.y;
		const e2_dot_e2 = e2.x * e2.x + e2.y * e2.y;
		if (e1_dot_e1 < 1e-6 || e2_dot_e2 < 1e-6) return null;

		const a_coeff = (dx * e1.x + dy * e1.y) / e1_dot_e1;
		const b_coeff = (dx * e2.x + dy * e2.y) / e2_dot_e2;

		// Map to local bounds space
		const result = vec3.create();
		vec3.scaleAndAdd(result, result, a.e1_local, a_coeff);
		vec3.scaleAndAdd(result, result, a.e2_local, b_coeff);
		return result;
	}

	// Get world matrix for a scene object (must match Render.ts exactly)
	private get_world_matrix(obj: O_Scene): mat4 {
		const so = obj.so;
		const center: vec3 = obj.frozen_center ?? [
			(so.x_min + so.x_max) / 2,
			(so.y_min + so.y_max) / 2,
			(so.z_min + so.z_max) / 2,
		];
		// Root: tumble only (from store). Child: so.orientation (tumble inherited via parent).
		const orientation = obj.parent ? so.orientation : stores.current_orientation();

		// Move SO center to origin, rotate, then:
		//   Root: scale + position (center stays at origin for screen centering)
		//   Child: translate back (rotate around own center in parent space)
		const local = mat4.create();
		mat4.fromTranslation(local, [-center[0], -center[1], -center[2]]);
		const rot = mat4.create();
		mat4.fromQuat(rot, orientation);
		mat4.multiply(local, rot, local);

		if (obj.parent) {
			// Child: uncenter so rotation is around own center within parent space
			const from_center = mat4.create();
			mat4.fromTranslation(from_center, center);
			mat4.multiply(local, from_center, local);
		} else {
			// Root: keep center at origin → scale around origin → position (for pan)
			const s = stores.current_scale;
			const scale_mat = mat4.create();
			mat4.fromScaling(scale_mat, [s, s, s]);
			mat4.multiply(local, scale_mat, local);
		}

		const pos_mat = mat4.create();
		mat4.fromTranslation(pos_mat, obj.position);
		mat4.multiply(local, pos_mat, local);

		if (obj.parent) {
			const parent_world = this.get_world_matrix(obj.parent);
			mat4.multiply(local, parent_world, local);
		}

		return local;
	}

	// Apply face drag as absolute offset from initial bounds (no drift).
	// delta is the total bounds-space displacement since drag start.
	private apply_face_drag_absolute(delta: vec3): void {
		const a = this.face_anchor!;
		const axes: [Bound, Bound][] = [['x_min', 'x_max'], ['y_min', 'y_max'], ['z_min', 'z_max']];
		for (let i = 0; i < 3; i++) {
			const [min_b, max_b] = axes[i];
			a.so.set_bound(min_b, a.initial_bounds.get(min_b)! + delta[i]);
			a.so.set_bound(max_b, a.initial_bounds.get(max_b)! + delta[i]);
		}
		this.detect_edge_snap();
	}

	/** During face drag, detect if the dragged SO's edges are near a sibling's edges.
	 *  Snaps to zero gap when within threshold. Updates _snap_results for pin offer. */
	private detect_edge_snap(): void {
		const a = this.face_anchor;
		if (!a) return;
		this._snap_results = [];

		// Movement axes — skip the axis perpendicular to the drag plane
		const move_axes = a.parent_scene.so.face_axes(a.face_index);

		// Find sibling scenes (same parent, different SO)
		const siblings = scene_graph.get_all().filter(
			o => o.parent === a.parent_scene && o !== a.child_scene
		);
		if (siblings.length === 0) return;

		const axis_bounds: Record<Axis_Name, [Bound, Bound]> = {
			x: ['x_min', 'x_max'], y: ['y_min', 'y_max'], z: ['z_min', 'z_max'],
		};

		for (const axis of move_axes) {
			const [min_b, max_b] = axis_bounds[axis];
			const dragged_min = a.so.get_bound(min_b);
			const dragged_max = a.so.get_bound(max_b);

			let best: { dragged_bound: Bound; sibling_so: Smart_Object; sibling_bound: Bound; value: number; distance: number } | null = null;

			for (const sibling of siblings) {
				const sibling_min = sibling.so.get_bound(min_b);
				const sibling_max = sibling.so.get_bound(max_b);

				for (const [dv, db, sv, sb] of [
					[dragged_min, min_b, sibling_min, min_b],
					[dragged_min, min_b, sibling_max, max_b],
					[dragged_max, max_b, sibling_min, min_b],
					[dragged_max, max_b, sibling_max, max_b],
				] as [number, Bound, number, Bound][]) {
					const distance = Math.abs(dv - sv);
					if (distance < SNAP_THRESHOLD_MM && (!best || distance < best.distance)) {
						best = { dragged_bound: db, sibling_so: sibling.so, sibling_bound: sb, value: sv, distance };
					}
				}
			}

			if (best) {
				// Shift entire SO on this axis so edges align
				const current = a.so.get_bound(best.dragged_bound);
				const shift = best.value - current;
				a.so.set_bound(min_b, a.so.get_bound(min_b) + shift);
				a.so.set_bound(max_b, a.so.get_bound(max_b) + shift);

				this._snap_results.push({
					dragged_bound: best.dragged_bound,
					sibling_so: best.sibling_so,
					sibling_bound: best.sibling_bound,
					value: best.value,
				});
			}
		}
	}

	/** Apply stretch drag as absolute offset from initial bounds.
	 *  delta is the total bounds-space displacement since mousedown.
	 *  For edge: affects 1 bound.  For corner: affects 2 bounds.
	 *  Compensates for center-rotate-uncenter shift: pins the opposite side
	 *  by adjusting O_Scene.position after the bound change. */
	private apply_stretch_absolute(delta: vec3): void {
		const a = this.stretch_anchor!;

		// Reset all affected bounds to initial values first (absolute, not incremental)
		for (const [bound, initial] of a.initial_bounds) {
			a.so.set_bound(bound, initial);
		}

		// Root: symmetric stretch (both sides move, center stays fixed)
		const is_root = !a.scene.parent;
		if (is_root) vec3.scale(delta, delta, 2);

		// Apply bound changes — redirect to the source attribute when the target bound is derived
		const apply_axis = (info: Axis_Formula_Info, desired_abs: number) => {
			const snapped = Smart_Object.snap(desired_abs);
			const axis = a.so.axis_by_name(info.axis_name);

			if (info.invariant === 0 || info.invariant === 1) {
				// Start or end is derived from length. Set LENGTH directly —
				// enforce_invariants will compute the derived attribute from it.
				// Use the INITIAL length and INITIAL bound to avoid frame-over-frame accumulation.
				const bound = a.target_type === T_Hit_3D.edge
					? a.so.edge_bound(a.target_index, a.face_index)
					: a.so.vertex_bound(a.target_index, info.axis_name);
				const initial_bound = a.initial_bounds.get(bound)!;
				const drag_offset = bound.endsWith('_max')
					? snapped - initial_bound   // max moved outward → length grows
					: initial_bound - snapped;  // min moved inward → length shrinks
				axis.length.value = info.formula_result + drag_offset;
			} else {
				// Length is derived. Start or end is a source — set it directly.
				if (constraints.try_solve_given(a.so, a.so.vertex_bound(a.target_index, info.axis_name), snapped)) {
					constraints.propagate_all();
				} else {
					a.so.set_bound(a.so.vertex_bound(a.target_index, info.axis_name), snapped);
				}
			}
		};

		// Compute desired absolute position per axis and apply.
		for (const info of a.formula_info) {
			const axis_vec = a.so.axis_vector(info.axis_name);
			const offset = vec3.dot(delta, axis_vec);
			const bound = a.target_type === T_Hit_3D.edge
				? a.so.edge_bound(a.target_index, a.face_index)
				: a.so.vertex_bound(a.target_index, info.axis_name);
			const initial = a.initial_bounds.get(bound)!;

			if (is_root && bound.endsWith('_min')) {
				const opposite = bound.replace('_min', '_max') as Bound;
				const opp_initial = a.initial_bounds.get(opposite)!;
				apply_axis(info, Math.abs(opp_initial - offset));
			} else {
				const desired = initial + offset;
				const snapped = Smart_Object.snap(is_root ? Math.abs(desired) : desired);

				// For _min drags: also set the start bound so the opposite side stays fixed.
				// Without this, only length changes and end = start + length moves both sides.
				if (bound.endsWith('_min') && !is_root) {
					a.so.set_bound(bound, snapped);
				}

				apply_axis(info, snapped);
			}
		}

		// Let the invariant system compute derived attributes from the sources we just set
		constraints.enforce_invariants(a.so);
	}

}

export const drag = new Drag();
