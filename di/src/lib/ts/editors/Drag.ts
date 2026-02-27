import { quat, vec3, vec4, mat4 } from 'gl-matrix';
import type { O_Scene } from '../types/Interfaces';
import { hits_3d, type Hit_3D_Result } from '../managers/Hits_3D';
import { Point } from '../types/Coordinates';
import { T_Hit_3D } from '../types/Enumerations';
import { stores } from '../managers/Stores';
import { camera } from '../render/Camera';
import type { Bound, Axis_Name } from '../types/Types';
import Smart_Object from '../runtime/Smart_Object';

/** Anchored plane captured at drag start — prevents frame-to-frame drift.
 *  Uses parent-face geometry: the face's two edge vectors (e1, e2) form
 *  a natural basis.  World delta is decomposed onto e1/e2, then mapped
 *  directly to position-space via the corresponding local edge vectors.
 *  No matrix inverse needed — cleaner and immune to center-rotate artifacts. */
interface Face_Anchor {
	plane_point: vec3;           // world-space point on the face plane (fixed)
	plane_normal: vec3;          // world-space face normal (fixed)
	anchor_world: vec3;          // world-space intersection of initial mousedown
	e1_world: vec3;              // world-space edge vector 1 (corners[1] - corners[0])
	e2_world: vec3;              // world-space edge vector 2 (corners[3] - corners[0])
	e1_local: vec3;              // parent-local edge vector 1 (raw vertex diff)
	e2_local: vec3;              // parent-local edge vector 2 (raw vertex diff)
	initial_position: vec3;      // child's O_Scene.position at drag start
	child_scene: O_Scene;        // reference to child scene (to set position)
	parent_scene: O_Scene;       // reference to parent scene (for guidance rendering)
	face_index: number;          // which parent face is the guidance plane
}

/** Anchored plane for edge/corner stretch drags — same pattern as Face_Anchor.
 *  Freezes face geometry at mousedown so the projection plane doesn't shift
 *  as bounds change.  Stores initial bound values for absolute offset application. */
interface Stretch_Anchor {
	plane_point: vec3;           // world-space face center at mousedown (fixed)
	plane_normal: vec3;          // world-space face normal at mousedown (fixed)
	anchor_world: vec3;          // world-space intersection of initial mousedown
	e1_world: vec3;              // face edge vector 1 at mousedown (fixed)
	e2_world: vec3;              // face edge vector 2 at mousedown (fixed)
	e1_local: vec3;              // local edge vector 1 at mousedown (fixed)
	e2_local: vec3;              // local edge vector 2 at mousedown (fixed)
	initial_bounds: Map<Bound, number>;   // snapshot of affected bounds at mousedown
	initial_position: vec3;      // scene.position at mousedown (for absolute reset)
	ref_local: vec3;             // local-space reference point (opposite side, should not move)
	ref_world: vec3;             // world-space position of ref point at mousedown
	so: Smart_Object;            // the SO being stretched
	scene: O_Scene;              // scene being stretched (to adjust position)
	face_index: number;          // selected face
	target_type: T_Hit_3D;       // edge or corner
	target_index: number;        // which edge or corner
}

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

	// ── lifecycle ──

	set_target(hit: Hit_3D_Result | null): void {
		this.target = hit;
		this.face_anchor = null;
		this.stretch_anchor = null;
		// Immediate highlight: if clicking an edge/corner on a selected face, store for guidance rendering
		const sel = hits_3d.selection;
		if (hit && sel && (hit.type === T_Hit_3D.edge || hit.type === T_Hit_3D.corner) && sel.so.scene) {
			this.stretch_face = { scene: sel.so.scene, face_index: sel.index };
		} else {
			this.stretch_face = null;
		}
	}

	clear(): void {
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
		rotation_target.apply_rotation(rotation_axis, delta_theta);

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

		// Face drag: translate child SO in the plane of the parent's front-most face
		if (target.type === T_Hit_3D.face) {
			if (!scene.parent) return false; // root SO cannot be translated

			// First frame: capture anchor from PARENT's front face
			if (!this.face_anchor) {
				const parent_so = scene.parent.so;
				const front = hits_3d.front_most_face(parent_so);
				if (front < 0) return false;
				const anchor = this.init_face_anchor(prev_mouse, front, scene.parent, scene);
				if (!anchor) return false;
				this.face_anchor = anchor;
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

	/** Decompose world delta onto frozen face edge vectors, return local-space delta.
	 *  Shared by face drag (get_anchored_delta) and stretch drag (get_stretch_delta). */
	private decompose_to_local(
		delta_world: vec3,
		e1_world: vec3, e2_world: vec3,
		e1_local: vec3, e2_local: vec3
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

	/** Capture a fixed plane + anchor at drag start for face translation.
	 *  Plane comes from the PARENT SO's front face (stable — parent doesn't move).
	 *  Moves O_Scene.position (not bounds), so grandchildren maintain relative position. */
	private init_face_anchor(
		mouse: Point,
		face_index: number,
		parent_scene: O_Scene,
		child_scene: O_Scene
	): Face_Anchor | null {
		const world = this.get_world_matrix(parent_scene);
		const plane = this.compute_face_plane(parent_scene.so, face_index, world);
		const anchor_world = this.ray_plane_intersect(mouse, plane.plane_point, plane.plane_normal);
		if (!anchor_world) return null;

		return { ...plane, anchor_world, initial_position: vec3.clone(child_scene.position), child_scene, parent_scene, face_index };
	}

	/** Compute position delta from the fixed anchor to the current mouse position.
	 *  No matrix inverse — pure face-geometry decomposition. */
	private get_anchored_delta(curr_mouse: Point): vec3 | null {
		const a = this.face_anchor;
		if (!a) return null;

		const curr_world = this.ray_plane_intersect(curr_mouse, a.plane_point, a.plane_normal);
		if (!curr_world) return null;

		const delta_world = vec3.create();
		vec3.subtract(delta_world, curr_world, a.anchor_world);

		return this.decompose_to_local(delta_world, a.e1_world, a.e2_world, a.e1_local, a.e2_local);
	}

	/** Capture a fixed plane + anchor at drag start for edge/corner stretching.
	 *  Freezes face geometry so the projection plane doesn't shift as bounds change.
	 *  Snapshots affected bounds and a reference vertex for center-shift compensation. */
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

		const anchor_world = this.ray_plane_intersect(mouse, plane.plane_point, plane.plane_normal);
		if (!anchor_world) return null;

		// Snapshot affected bounds
		const initial_bounds = new Map<Bound, number>();
		const is_root = !scene.parent;
		if (target_type === T_Hit_3D.edge) {
			const bound = so.edge_bound(target_index, face_index);
			initial_bounds.set(bound, so.get_bound(bound));
			// Root min: will redirect to opposite max — snapshot it too
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

		// Snapshot position and opposite-side vertex for center-shift compensation.
		// Read at mousedown before any changes — so.vertices reflects initial bounds.
		const initial_position = vec3.clone(scene.position);
		const ref_local = this.find_opposite_vertex(so, face_index, target_type, target_index);
		const ref_world: vec3 = [0, 0, 0];
		vec3.transformMat4(ref_world, ref_local, world_matrix);

		return { ...plane, anchor_world, initial_bounds, initial_position, ref_local, ref_world, so, scene, face_index, target_type, target_index };
	}

	/** Compute bounds-space delta from the frozen stretch anchor to current mouse. */
	private get_stretch_delta(curr_mouse: Point): vec3 | null {
		const a = this.stretch_anchor;
		if (!a) return null;

		const curr_world = this.ray_plane_intersect(curr_mouse, a.plane_point, a.plane_normal);
		if (!curr_world) return null;

		const delta_world = vec3.create();
		vec3.subtract(delta_world, curr_world, a.anchor_world);

		return this.decompose_to_local(delta_world, a.e1_world, a.e2_world, a.e1_local, a.e2_local);
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
		const raw_orientation = obj.parent ? so.orientation : stores.current_orientation();
		// 2D: flatten toward camera, retaining in-plane rotation
		const orientation = stores.current_view_mode() === '2d'
			? this.flatten_orientation(raw_orientation)
			: raw_orientation;

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
			const s = stores.current_scale();
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

	/** Flatten orientation for 2D: swing-twist decomposition around the
	 *  local axis most aligned with the camera, keeping only the twist. */
	private flatten_orientation(q: quat): quat {
		const cam_fwd = vec3.create();
		vec3.subtract(cam_fwd, camera.center_pos, camera.eye);
		vec3.normalize(cam_fwd, cam_fwd);

		const inv_q = quat.create();
		quat.invert(inv_q, q);
		const local_fwd = vec3.create();
		vec3.transformQuat(local_fwd, cam_fwd, inv_q);

		const abs_x = Math.abs(local_fwd[0]);
		const abs_y = Math.abs(local_fwd[1]);
		const abs_z = Math.abs(local_fwd[2]);

		let twist: quat;
		if (abs_x >= abs_y && abs_x >= abs_z) {
			twist = quat.normalize(quat.create(), quat.fromValues(q[0], 0, 0, q[3]));
		} else if (abs_y >= abs_z) {
			twist = quat.normalize(quat.create(), quat.fromValues(0, q[1], 0, q[3]));
		} else {
			twist = quat.normalize(quat.create(), quat.fromValues(0, 0, q[2], q[3]));
		}
		return twist;
	}

	// Intersect camera ray through screen point with a plane
	private ray_plane_intersect(
		screen: Point,
		plane_point: vec3,
		plane_normal: vec3
	): vec3 | null {
		const ray = camera.screen_to_ray(screen.x, screen.y);

		// Ray: P = origin + t * dir
		// Plane: dot(P - plane_point, normal) = 0
		// Solve: dot(origin + t*dir - plane_point, normal) = 0
		// t = dot(plane_point - origin, normal) / dot(dir, normal)

		const denom = vec3.dot(ray.dir, plane_normal);
		if (Math.abs(denom) < 0.0001) return null;  // Ray parallel to plane

		const diff = vec3.create();
		vec3.subtract(diff, plane_point, ray.origin);
		const t = vec3.dot(diff, plane_normal) / denom;

		if (t < 0) return null;  // Intersection behind camera

		const result = vec3.create();
		vec3.scaleAndAdd(result, ray.origin, ray.dir, t);
		return result;
	}

	// Apply face drag as absolute offset from initial position (no drift).
	// delta is the total position-space displacement since drag start.
	// Moves O_Scene.position — bounds unchanged, so grandchildren stay put.
	private apply_face_drag_absolute(delta: vec3): void {
		const a = this.face_anchor!;
		vec3.add(a.child_scene.position, a.initial_position, delta);
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
		// Reset position to initial
		vec3.copy(a.scene.position, a.initial_position);

		// Root: symmetric stretch (both sides move, center stays fixed)
		const is_root = !a.scene.parent;
		if (is_root) vec3.scale(delta, delta, 2);

		// Apply bound changes from initial
		if (a.target_type === T_Hit_3D.edge) {
			const axis = a.so.edge_changes_axis(a.target_index, a.face_index);
			const bound = a.so.edge_bound(a.target_index, a.face_index);
			const axis_vec = a.so.axis_vector(axis);
			const offset = vec3.dot(delta, axis_vec);
			// Root min: invariant clamps start to 0 — redirect to opposite max
			if (is_root && bound.endsWith('_min')) {
				const opposite = bound.replace('_min', '_max') as Bound;
				const opp_initial = a.initial_bounds.get(opposite)!;
				// Math.abs: at length=0, reflect — seamlessly switch to growing from other side
				a.so.set_bound(opposite, Smart_Object.snap(Math.abs(opp_initial - offset)));
			} else {
				const initial = a.initial_bounds.get(bound)!;
				const raw = initial + offset;
				a.so.set_bound(bound, Smart_Object.snap(is_root ? Math.abs(raw) : raw));
			}
		} else {
			const axes = a.so.face_axes(a.face_index);
			for (const axis of axes) {
				const bound = a.so.vertex_bound(a.target_index, axis);
				const axis_vec = a.so.axis_vector(axis);
				const offset = vec3.dot(delta, axis_vec);
				// Root min: redirect to opposite max
				if (is_root && bound.endsWith('_min')) {
					const opposite = bound.replace('_min', '_max') as Bound;
					const opp_initial = a.initial_bounds.get(opposite)!;
					a.so.set_bound(opposite, Smart_Object.snap(Math.abs(opp_initial - offset)));
				} else {
					const initial = a.initial_bounds.get(bound)!;
					const raw = initial + offset;
					a.so.set_bound(bound, Smart_Object.snap(is_root ? Math.abs(raw) : raw));
				}
			}
		}

		// Compensate center-rotate-uncenter shift:
		// The reference point (opposite side) should stay at its original world position.
		// Drift must be converted from world space to position space (parent space).
		const wm_after = this.get_world_matrix(a.scene);
		const ref_after: vec3 = [0, 0, 0];
		vec3.transformMat4(ref_after, a.ref_local, wm_after);

		// World-space drift
		const drift_world: vec3 = [0, 0, 0];
		vec3.subtract(drift_world, a.ref_world, ref_after);

		// Convert to position space: position is in parent's coordinate frame.
		// Use direction-mode transform: apply parent's inverse to drift (no translation).
		if (a.scene.parent) {
			const parent_world = this.get_world_matrix(a.scene.parent);
			const inv_parent = mat4.create();
			mat4.invert(inv_parent, parent_world);
			// Direction transform: transform both origin and drift, subtract
			const origin_in_parent: vec3 = [0, 0, 0];
			const drift_end: vec3 = [...drift_world] as vec3;
			vec3.transformMat4(origin_in_parent, [0, 0, 0], inv_parent);
			vec3.transformMat4(drift_end, drift_world, inv_parent);
			const drift_parent: vec3 = [0, 0, 0];
			vec3.subtract(drift_parent, drift_end, origin_in_parent);
			vec3.add(a.scene.position, a.scene.position, drift_parent);
		}
		// Root: no drift compensation — symmetric stretch keeps center fixed
	}

	/** Find a local-space vertex on the opposite side of the drag target.
	 *  For edge: a vertex on the same face NOT on the dragged edge.
	 *  For corner: the diagonally opposite vertex in the face.
	 *  This vertex should not move when the dragged bound changes. */
	private find_opposite_vertex(so: Smart_Object, face_index: number, target_type: T_Hit_3D, target_index: number): vec3 {
		const face_verts = so.face_vertices(face_index);
		if (target_type === T_Hit_3D.edge) {
			const [ea, eb] = so.edge_vertices(target_index);
			const opp = face_verts.find(v => v !== ea && v !== eb);
			if (opp !== undefined) return vec3.clone(so.vertices[opp]);
		} else {
			const idx = face_verts.indexOf(target_index);
			const opp = face_verts[(idx + 2) % face_verts.length];
			return vec3.clone(so.vertices[opp]);
		}
		// Fallback: center
		return vec3.fromValues((so.x_min + so.x_max) / 2, (so.y_min + so.y_max) / 2, (so.z_min + so.z_max) / 2);
	}
}

export const drag = new Drag();
