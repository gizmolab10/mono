import { quat, vec3, vec4, mat3, mat4 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import type { Hit_3D_Result } from '../events/Hits_3D';
import { Point } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';
import { stores } from '../managers/Stores';
import { selection } from '../managers/Selection';
import { camera } from '../render/Camera';
import type { Bound, Axis_Name } from '../types/Types';
import { constraints, type Free_Constant } from '../algebra/Constraints';
import Smart_Object from '../runtime/Smart_Object';
import { scene as scene_graph } from '../render/Scene';
import { scenes } from '../managers/Scenes';
import { stale_writable } from '../common/Stale_Writable';
import { get } from 'svelte/store';

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

/** Face drag anchor in the child's parent-local frame.  Plane data is captured
 *  once in that frame and stays valid even when upstream pushes resize the
 *  parent during the drag.  For a drag where the child has no parent (edge
 *  case — the root is being translated), the frame is world and the frame
 *  transform is identity. */
interface Face_Anchor {
	frame_scene: O_Scene | null;           // parent scene whose local frame hosts the plane
	anchor_frame: vec3;                    // point where mousedown ray hit the plane, in frame coords
	plane_point: vec3;                     // any point on the face plane (frame coords)
	plane_normal: vec3;                    // face plane normal (frame coords, unit length)
	e1_frame: vec3;                        // face edge 1 in frame coords (drag start)
	e2_frame: vec3;                        // face edge 2 in frame coords (drag start)
	e1_local: vec3;                        // local edge vector 1
	e2_local: vec3;                        // local edge vector 2
	initial_bounds: Map<Bound, number>;    // child's absolute bounds at drag start
	so: Smart_Object;                      // child SO being translated
	child_scene: O_Scene;                  // reference to child scene
	parent_scene: O_Scene;                 // reference to parent scene (for guidance rendering)
	face_index: number;                    // which face is the guidance plane
}

/** One source attribute that a drag needs to push upstream in order to move
 *  a corner or edge.  Captures, at drag start: the attribute the drag wants
 *  to change, its starting value, the modifiable leaves reachable from it,
 *  how strongly each leaf pulls on it, and the starting values of each leaf. */
interface Attr_Target {
	attr_name: string;
	initial_value: number;
	/** If true, the target's new value equals initial + drag_offset.
	 *  If false, the target's new value equals initial - drag_offset. */
	grows_with_drag: boolean;
	free_constants: Free_Constant[];
	coefficients: number[];
	initial_fc_values: number[];
	/** Indices into the three arrays above where the coefficient is nonzero. */
	live_indices: number[];
	/** When the target attribute itself has no formula (it IS the free constant),
	 *  writing via free_constants misses the positional-vs-relative semantics
	 *  handled by set_bound. This flag lets the drag short-circuit and write
	 *  the bound directly for positional sources. */
	direct_bound: Bound | null;
}

/** All drag-time info for one axis affected by a corner or edge drag. */
interface Axis_Drag_Info {
	axis_name: Axis_Name;
	targets: Attr_Target[];
	/** The bound the drag is visibly moving (for root symmetric logic). */
	bound_name: Bound;
	bound_initial: number;
}

/** Stretch anchor in the dragged SO's parent-local frame.  Capturing the plane
 *  here (instead of in world) keeps the plane valid even when upstream pushes
 *  resize the parent during the drag — the parent's world transform can slide
 *  around, but the plane expressed in parent-local coordinates does not.
 *  For a root drag there is no parent; the anchor is captured in world and the
 *  frame transform is identity. */
interface Stretch_Anchor {
	frame_scene: O_Scene | null;           // parent scene whose local frame hosts the plane (null = world)
	anchor_frame: vec3;                    // point where mousedown ray hit the plane, in frame coords
	plane_point: vec3;                     // any point on the face plane (frame coords)
	plane_normal: vec3;                    // face plane normal (frame coords, unit length)
	e1_frame: vec3;                        // face edge 1 in frame coords (drag start)
	e2_frame: vec3;                        // face edge 2 in frame coords (drag start)
	e1_local: vec3;                        // local bounds-space edge vector 1
	e2_local: vec3;                        // local bounds-space edge vector 2
	initial_bounds: Map<Bound, number>;    // snapshot of affected bounds at mousedown
	axis_info: Axis_Drag_Info[];           // per-axis targets for upstream distribution
	so: Smart_Object;                      // the SO being stretched
	scene: O_Scene;                        // scene object for the SO being stretched
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
	w_pin_offer = stale_writable<Pin_Offer | null>(null);

	// ── lifecycle ──

	set_target(hit: Hit_3D_Result | null): void {
		this.target = hit;
		this.face_anchor = null;
		this.stretch_anchor = null;
		this._snap_results = [];
		this.w_pin_offer.set(null);
		// Immediate highlight: if clicking an edge/corner on a selected face, store for guidance rendering
		const sel = selection.current;
		if (hit && sel && (hit.type === T_Hit_3D.edge || hit.type === T_Hit_3D.corner) && sel.so.scene) {
			this.stretch_face = { scene: sel.so.scene, face_index: sel.index };
		} else {
			this.stretch_face = null;
		}
	}

	clear(): void {
		// End of drag: no formula text is ever edited by a drag — all changes
		// were written straight to upstream free constants.
		this.target = null;
		this.face_anchor = null;
		this.stretch_anchor = null;
		this.stretch_face = null;
		this._rotation_face = null;
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
		const sel = selection.current;

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
		const sel = selection.current;
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

	/** Capture a fixed parent-local plane and anchor point at drag start for face
	 *  translation.  Plane comes from the child's selected face (the face the
	 *  user clicked).  Snapshots child SO bounds for absolute offset application. */
	private init_face_anchor(
		mouse: Point,
		face_index: number,
		plane_scene: O_Scene,
		child_scene: O_Scene
	): Face_Anchor {
		const so = plane_scene.so;
		const world_matrix = this.get_world_matrix(plane_scene);
		const plane = this.compute_face_plane(so, face_index, world_matrix);

		// Where the mouse-down ray hits the face plane in world.
		const ray = camera.screen_to_ray(mouse.x, mouse.y);
		const anchor_world = ray_plane_hit(ray.origin, ray.dir, plane.plane_point, plane.plane_normal);

		// Express in parent-local frame so parent resizes during the drag do
		// not invalidate the plane (the drag-start plane stays fixed in the
		// parent's own coordinate system).
		const frame_scene = plane_scene.parent ?? null;
		const inv_frame = this.inverse_frame_matrix(frame_scene);
		const anchor_frame = vec3.transformMat4(vec3.create(), anchor_world, inv_frame);
		const plane_point_frame = vec3.transformMat4(vec3.create(), plane.plane_point, inv_frame);
		const plane_normal_frame = this.transform_direction(plane.plane_normal, inv_frame);
		vec3.normalize(plane_normal_frame, plane_normal_frame);
		const e1_frame = this.transform_direction(plane.e1_world, inv_frame);
		const e2_frame = this.transform_direction(plane.e2_world, inv_frame);

		const child_so = child_scene.so;
		const bound_names: Bound[] = ['x_min', 'x_max', 'y_min', 'y_max', 'z_min', 'z_max'];
		const initial_bounds = new Map<Bound, number>();
		for (const b of bound_names) initial_bounds.set(b, child_so.get_bound(b));

		return {
			frame_scene,
			anchor_frame, plane_point: plane_point_frame, plane_normal: plane_normal_frame,
			e1_frame, e2_frame,
			e1_local: plane.e1_local, e2_local: plane.e2_local,
			initial_bounds, so: child_so, child_scene, parent_scene: plane_scene, face_index,
		};
	}

	/** Compute bounds-space delta for face drag via frame-local ray-plane
	 *  intersection.  Same pattern as the stretch drag — the mouse ray is
	 *  transformed into the parent's current local frame, hits the stored
	 *  plane there, and the parent-local displacement is decomposed onto
	 *  the face's frame-local edges captured at drag start. */
	private get_anchored_delta(curr_mouse: Point): vec3 | null {
		const a = this.face_anchor;
		if (!a) return null;

		const ray = camera.screen_to_ray(curr_mouse.x, curr_mouse.y);
		const inv_frame = this.inverse_frame_matrix(a.frame_scene);
		const ray_origin_frame = vec3.transformMat4(vec3.create(), ray.origin, inv_frame);
		const ray_dir_frame = this.transform_direction(ray.dir, inv_frame);

		const hit = ray_plane_hit(ray_origin_frame, ray_dir_frame, a.plane_point, a.plane_normal);
		const delta_frame = vec3.subtract(vec3.create(), hit, a.anchor_frame);

		return decompose_delta(delta_frame, a.e1_frame, a.e2_frame, a.e1_local, a.e2_local);
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

		// Where the mouse-down ray hits the face plane in world space.
		const ray = camera.screen_to_ray(mouse.x, mouse.y);
		const anchor_world = ray_plane_hit(ray.origin, ray.dir, plane.plane_point, plane.plane_normal);

		// Express all plane data in the parent's local frame. If upstream pushes
		// during the drag resize the parent, the parent's world transform will
		// slide — but the plane in parent-local stays put.
		const frame_scene = scene.parent ?? null;
		const inv_frame = this.inverse_frame_matrix(frame_scene);
		const anchor_frame = vec3.transformMat4(vec3.create(), anchor_world, inv_frame);
		const plane_point_frame = vec3.transformMat4(vec3.create(), plane.plane_point, inv_frame);
		const plane_normal_frame = this.transform_direction(plane.plane_normal, inv_frame);
		vec3.normalize(plane_normal_frame, plane_normal_frame);
		const e1_frame = this.transform_direction(plane.e1_world, inv_frame);
		const e2_frame = this.transform_direction(plane.e2_world, inv_frame);

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

		// Capture per-axis targets — which source attributes the drag will try
		// to move, and the upstream free constants it will change to move them.
		const affected_axes = target_type === T_Hit_3D.edge
			? [so.edge_changes_axis(target_index, face_index)]
			: so.face_axes(face_index);
		const axis_info: Axis_Drag_Info[] = [];
		for (const axis_name of affected_axes) {
			const axis = so.axis_by_name(axis_name);
			const bound = target_type === T_Hit_3D.edge
				? so.edge_bound(target_index, face_index)
				: so.vertex_bound(target_index, axis_name);
			const is_min_drag = bound.endsWith('_min');
			const bound_initial = so.get_bound(bound);

			// Pick which source attributes the drag must change, per invariant.
			// Invariant index tells us which of the three axis attributes is
			// derived (start=0, end=1, length=2). Whichever of the other two
			// attributes actually move for this drag is a target here.
			const targets = this.build_axis_targets(so, axis, bound, is_min_drag, is_root);
			axis_info.push({ axis_name, targets, bound_name: bound, bound_initial });
		}

		return {
			frame_scene,
			anchor_frame, plane_point: plane_point_frame, plane_normal: plane_normal_frame,
			e1_frame, e2_frame,
			e1_local: plane.e1_local, e2_local: plane.e2_local,
			initial_bounds, axis_info, so, scene, face_index, target_type, target_index,
		};
	}

	/** Figure out which source attributes on this axis the drag must change in
	 *  order to move the given corner or edge, capture upstream free constants
	 *  for each, measure coefficients, and return the targets. */
	private build_axis_targets(
		so: Smart_Object,
		axis: { invariant: number; start: { name: string; value: number }; end: { name: string; value: number }; length: { name: string; value: number } },
		bound: Bound,
		is_min_drag: boolean,
		is_root: boolean,
	): Attr_Target[] {
		// Root has no parent and typically no formulas on its own bounds.
		// It uses symmetric stretch — writing directly to the end bound.
		// One direct-write target is sufficient; the symmetric sign flip for
		// min-drag corners is handled by apply_stretch_absolute.
		if (is_root) {
			const end_bound = bound.replace('_min', '_max') as Bound;
			const t = this.make_direct_target(so, end_bound);
			return t ? [t] : [];
		}

		const inv = axis.invariant;
		// Which attributes actually change value when this bound moves?
		// Max-bound drag: end and length grow with the drag. Start is fixed.
		// Min-bound drag: start grows with the drag, length shrinks. End is fixed.
		// Which ones are SOURCES (not derived)?  Any index that is NOT inv.
		const targets: Attr_Target[] = [];

		const push = (attr_name: string, grows: boolean, direct_bound: Bound | null) => {
			const t = this.make_target(so, attr_name, grows, direct_bound);
			if (t) targets.push(t);
		};

		if (is_min_drag) {
			// start and length move; start grows with drag, length shrinks.
			if (inv !== 0) push(axis.start.name, /*grows*/ true, bound);
			if (inv !== 2) push(axis.length.name, /*grows*/ false, null);
		} else {
			// end and length move; both grow with drag.
			if (inv !== 1) push(axis.end.name, /*grows*/ true, bound);
			if (inv !== 2) push(axis.length.name, /*grows*/ true, null);
		}

		// Overlap guard: if two targets share any free constant, fall back to
		// a single direct-write target (length for inv 0/1, bound for inv 2),
		// and log a warning. This avoids double-writing a single upstream number.
		if (targets.length > 1) {
			const seen = new Set<string>();
			let overlap = false;
			for (const t of targets) {
				for (const fc of t.free_constants) {
					const key = constraints.free_constant_key(fc);
					if (seen.has(key)) { overlap = true; break; }
					seen.add(key);
				}
				if (overlap) break;
			}
			if (overlap) {
				console.log(`drag axis ${axis.length.name.replace(/length|width|depth|height/, m => m.toUpperCase())}: two targets share a free constant — falling back to direct write to avoid double-counting`);
				// Fallback: write directly to the dragged bound, ignore length.
				const direct = this.make_direct_target(so, bound);
				return direct ? [direct] : [];
			}
		}

		return targets;
	}

	/** Build one Attr_Target by walking upstream from (so, attr_name). */
	private make_target(
		so: Smart_Object,
		attr_name: string,
		grows_with_drag: boolean,
		direct_bound: Bound | null,
	): Attr_Target | null {
		const attr = constraints.find_attr(so, attr_name);
		if (!attr) return null;

		const fcs = constraints.collect_upstream(so, attr_name);
		if (fcs === null) {
			// Cycle — abort this target. The axis may still move via its other
			// target, or the drag may be a no-op on this axis.
			console.log(`drag target ${so.name}.${attr_name}: upstream walk found a cycle — this target is inert`);
			return {
				attr_name, initial_value: attr.value, grows_with_drag,
				free_constants: [], coefficients: [], initial_fc_values: [],
				live_indices: [], direct_bound: null,
			};
		}

		const coeffs = constraints.measure_coefficients(so, attr_name, fcs);
		const initial_fc = fcs.map(fc => constraints.read_free_constant(fc));
		const live: number[] = [];
		for (let i = 0; i < coeffs.length; i++) {
			if (Math.abs(coeffs[i]) > 1e-6) live.push(i);
		}

		// Only keep direct_bound when the target IS its own free constant.
		// Walking upstream to parent constants means a formula is in play —
		// the normal distribution path must be used, not a direct bound write.
		const resolved_direct = (direct_bound
			&& fcs.length === 1
			&& fcs[0].kind === 'attr'
			&& fcs[0].so === so
			&& fcs[0].attr === attr) ? direct_bound : null;

		return {
			attr_name,
			initial_value: attr.value,
			grows_with_drag,
			free_constants: fcs,
			coefficients: coeffs,
			initial_fc_values: initial_fc,
			live_indices: live,
			direct_bound: resolved_direct,
		};
	}

	/** Fallback target used for direct bound writes — used for root (symmetric
	 *  stretch) and when overlap or cycles corrupt the upstream distribution.
	 *  Reads and writes use absolute (world-space) bound values via set_bound,
	 *  which handles the parent-offset conversion for child SOs. */
	private make_direct_target(so: Smart_Object, bound: Bound): Attr_Target | null {
		const attr = so.attributes_dict_byName[bound];
		if (!attr) return null;
		const absolute = so.get_bound(bound);
		return {
			attr_name: bound,
			initial_value: absolute,
			grows_with_drag: true,
			free_constants: [{ kind: 'attr', so, attr }],
			coefficients: [1],
			initial_fc_values: [absolute],
			live_indices: [0],
			direct_bound: bound,
		};
	}

	/** Inverse of the frame scene's world matrix, or identity when there is no
	 *  frame scene (i.e., the drag is on the root itself).  Used to transform
	 *  world-space mouse rays and plane data into a parent-local frame that
	 *  stays stable even when upstream pushes resize the parent. */
	private inverse_frame_matrix(frame_scene: O_Scene | null): mat4 {
		if (!frame_scene) return mat4.create(); // identity
		const frame_world = this.get_world_matrix(frame_scene);
		const inv = mat4.create();
		mat4.invert(inv, frame_world);
		return inv;
	}

	/** Transform a world-space direction (not point) by a 4x4 matrix.  Strips
	 *  the translation column so the direction only gets the rotation-and-scale
	 *  part of the transform.  Result retains direction-vector semantics. */
	private transform_direction(dir: vec3, m: mat4): vec3 {
		const m3 = mat3.create();
		mat3.fromMat4(m3, m);
		const out = vec3.create();
		vec3.transformMat3(out, dir, m3);
		return out;
	}

	/** Compute bounds-space delta for stretch drag via frame-local ray-plane
	 *  intersection.  Unprojects the mouse to a world ray, transforms it into
	 *  the parent's current local frame, hits the drag-start plane (stored in
	 *  that frame), and decomposes the frame-local displacement onto the face's
	 *  frame-local edges captured at drag start.  Because the frame is the
	 *  parent's live frame, parent resizes during the drag do not invalidate
	 *  the plane. */
	private get_stretch_delta(curr_mouse: Point): vec3 | null {
		const a = this.stretch_anchor;
		if (!a) return null;

		const ray = camera.screen_to_ray(curr_mouse.x, curr_mouse.y);
		const inv_frame = this.inverse_frame_matrix(a.frame_scene);
		const ray_origin_frame = vec3.transformMat4(vec3.create(), ray.origin, inv_frame);
		const ray_dir_frame = this.transform_direction(ray.dir, inv_frame);

		const hit = ray_plane_hit(ray_origin_frame, ray_dir_frame, a.plane_point, a.plane_normal);
		const delta_frame = vec3.subtract(vec3.create(), hit, a.anchor_frame);

		return decompose_delta(delta_frame, a.e1_frame, a.e2_frame, a.e1_local, a.e2_local);
	}

	// Get world matrix for a scene object (must match Render.ts exactly)
	private get_world_matrix(obj: O_Scene): mat4 {
		const so = obj.so;
		const center: vec3 = [
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
	 *
	 *  For each affected axis, we know which source attributes actually move
	 *  (captured at drag start).  For each of those sources we push the new
	 *  desired value upstream: the change is split equally across the free
	 *  constants reachable by walking its formula graph, weighted by how
	 *  strongly each constant pulls on the source.  Formula text is never
	 *  rewritten — only raw numbers change. */
	private apply_stretch_absolute(delta: vec3): void {
		const a = this.stretch_anchor!;

		// Reset all affected bounds to initial values. Upstream pushes will
		// overwrite what they need; anything not touched stays at its snapshot.
		for (const [bound, initial] of a.initial_bounds) {
			a.so.set_bound(bound, initial);
		}

		const is_root = !a.scene.parent;
		if (is_root) {
			this.apply_stretch_root(delta);
			constraints.enforce_invariants(a.so);
			return;
		}

		for (const info of a.axis_info) {
			const axis_vec = a.so.axis_vector(info.axis_name);
			const offset = vec3.dot(delta, axis_vec);
			for (const target of info.targets) {
				this.apply_target(target, offset);
			}
		}

		// Re-evaluate every formula now that free constants may have changed,
		// then enforce invariants so derived attributes catch up.
		constraints.propagate_all();
	}

	/** Root-only stretch: symmetric about the origin, writing end bounds
	 *  directly.  Preserved from the pre-walker drag — root has no parent,
	 *  typically no formulas on its own bounds, and needs the "abs" flip so
	 *  dragging a min corner past the origin doesn't go negative. */
	private apply_stretch_root(delta: vec3): void {
		const a = this.stretch_anchor!;
		// Symmetric stretch — both sides move, center stays fixed.
		vec3.scale(delta, delta, 2);

		for (const info of a.axis_info) {
			const axis_vec = a.so.axis_vector(info.axis_name);
			const offset = vec3.dot(delta, axis_vec);
			const bound = info.bound_name;
			const initial = info.bound_initial;

			let desired_abs: number;
			if (bound.endsWith('_min')) {
				const opposite = bound.replace('_min', '_max') as Bound;
				const opp_initial = a.initial_bounds.get(opposite) ?? initial;
				desired_abs = Math.abs(opp_initial - offset);
			} else {
				desired_abs = Math.abs(initial + offset);
			}
			const snapped = Smart_Object.snap(desired_abs);
			const end_bound = bound.replace('_min', '_max') as Bound;
			a.so.set_bound(end_bound, snapped);
		}
	}

	/** Push one target attribute's desired new value upstream by splitting the
	 *  change equally across its live free constants. */
	private apply_target(target: Attr_Target, drag_offset: number): void {
		const signed = target.grows_with_drag ? drag_offset : -drag_offset;
		const desired = Smart_Object.snap(target.initial_value + signed);
		const delta = desired - target.initial_value;

		if (target.live_indices.length === 0) return; // fully rigid — drag is a no-op here

		// Short-circuit for direct-bound targets (fallback path): writing via
		// free_constants on a positional attribute skips the parent-offset
		// handling that set_bound provides, so route through set_bound instead.
		if (target.direct_bound) {
			const fc = target.free_constants[0];
			if (fc.kind === 'attr') {
				fc.so.set_bound(target.direct_bound, desired);
				return;
			}
		}

		const share_per_constant = delta / target.live_indices.length;
		for (const i of target.live_indices) {
			const new_value = target.initial_fc_values[i] + share_per_constant / target.coefficients[i];
			constraints.write_free_constant(target.free_constants[i], new_value);
		}
	}

}

export const drag = new Drag();
