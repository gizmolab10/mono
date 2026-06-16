import type { O_Scene } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import { units, Units } from '../types/Units';
import { hits_3d } from '../events/Hits_3D';
import { selection } from '../managers/Selection';
import { stores } from '../managers/Stores';
import { k } from '../common/Constants';
import { vec3, mat4, quat } from 'gl-matrix';
import { e } from '../events/Events';
import { get } from 'svelte/store';
import { render } from './Render';
import { scene } from './Scene';

/**
 * Phase 2 (in progress) — viable (edge, direction) pair enumeration with
 * DOF ranges per pair. Implements rule 11 plus the viable-pair definition
 * in the Glossary of the dimensionals redesign spec.
 *
 * For every visible smart object and every one of its three axes, this
 * walks the silhouette edges along the axis, considers the four signed
 * perpendicular directions, applies the four filters (camera-axis,
 * witness-length min and max, slidable-position range), and returns the
 * surviving pairs each with its continuous-DOF ranges.
 *
 * Today this runs on-demand from the test hook `dim_viable_pair_counts`
 * (and any future test hook that wants pair data). It does NOT yet replace
 * the running force-driven placement code; that swap is Phase 3 work.
 *
 * Reads `last_hull` from R_Dimensions, which is set every render by the
 * running force-driven code. When the new code becomes the only path
 * (Phase 4), the hull computation moves here.
 */

// ─── Geometry helpers (moved here from R_Dimensions per Task 4.0) ──────

/** Andrew's monotone-chain convex hull on screen-space points. Returns
 *  the hull vertices in counter-clockwise order (in screen coordinates
 *  where y grows downward, this is actually clockwise — direction does
 *  not matter for our use). */
export function convex_hull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
	if (points.length <= 2) return points.slice();
	const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
	const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
		(a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
	const lower: Array<{ x: number; y: number }> = [];
	for (const p of sorted) {
		while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
			lower.pop();
		}
		lower.push(p);
	}
	const upper: Array<{ x: number; y: number }> = [];
	for (let i = sorted.length - 1; i >= 0; i--) {
		const p = sorted[i];
		while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
			upper.pop();
		}
		upper.push(p);
	}
	lower.pop();
	upper.pop();
	return lower.concat(upper);
}

/** Ray vs convex polygon. Returns the largest distance from the ray
 *  origin where the ray crosses any edge of the polygon (the exit
 *  point), or -1 if the ray does not pass through the polygon at all. */
export function ray_polygon_exit(
	ox: number, oy: number,
	dx: number, dy: number,
	poly: Array<{ x: number; y: number }>,
): number {
	let max_t = -1;
	for (let i = 0; i < poly.length; i++) {
		const p1 = poly[i];
		const p2 = poly[(i + 1) % poly.length];
		const edx = p2.x - p1.x;
		const edy = p2.y - p1.y;
		const det = dy * edx - dx * edy;
		if (Math.abs(det) < 1e-9) continue;
		const ax = p1.x - ox;
		const ay = p1.y - oy;
		const t = (ay * edx - ax * edy) / det;
		const s = (dx * ay - dy * ax) / det;
		if (t >= 0 && s >= 0 && s <= 1 && t > max_t) max_t = t;
	}
	return max_t;
}

/** For a convex polygon, returns the offset (dx, dy) to add to (px, py)
 *  so the point sits at least `margin` units outside the polygon. The
 *  returned push is perpendicular to the closest edge in the outward
 *  direction. Returns { dx: 0, dy: 0 } when already that far outside. */
export function push_outside_hull(
	px: number, py: number,
	hull: Array<{ x: number; y: number }>,
	margin: number,
): { dx: number; dy: number } {
	if (hull.length < 3) return { dx: 0, dy: 0 };
	let cx = 0, cy = 0;
	for (const v of hull) { cx += v.x; cy += v.y; }
	cx /= hull.length; cy /= hull.length;
	let max_signed = -Infinity;
	let push_dx = 0, push_dy = 0;
	for (let i = 0; i < hull.length; i++) {
		const a = hull[i];
		const b = hull[(i + 1) % hull.length];
		const ex = b.x - a.x;
		const ey = b.y - a.y;
		const elen = Math.hypot(ex, ey);
		if (elen < 1e-9) continue;
		let nx = -ey / elen;
		let ny =  ex / elen;
		const out_dot = nx * (a.x - cx) + ny * (a.y - cy);
		if (out_dot < 0) { nx = -nx; ny = -ny; }
		const d = nx * (px - a.x) + ny * (py - a.y);
		if (d > max_signed) {
			max_signed = d;
			push_dx = nx * (margin - d);
			push_dy = ny * (margin - d);
		}
	}
	if (max_signed >= margin) return { dx: 0, dy: 0 };
	return { dx: push_dx, dy: push_dy };
}

/** Combined silhouette outline of every rendered leaf part. Recomputed
 *  every render by `compute_viable_pairs`. Exported for test hooks. */
/** What kind of label this is per the repeater integration in rule 18. */
export type Label_Kind = 'template' | 'clone' | 'fireblock-first' | 'fireblock-last-shortened' | 'regular';

function is_visible_for_dim(obj: O_Scene): boolean {
	// X-ray mode: when the user holds OPTION AND at least one part in the
	// scene is hidden, dimensions are drawn for the HIDDEN parts only —
	// the visible parts are not dimensioned because they would clutter the
	// view of the hidden ones being inspected. With no hidden parts,
	// OPTION does nothing.
	const option_held = get(e.w_option_down);
	const has_hidden = scene.get_all().some(o => !o.so.visible);
	const xray_mode = option_held && has_hidden;
	if (xray_mode) return !obj.so.visible;

	if (!obj.so.visible) return false;
	let cursor = obj.parent;
	while (cursor) {
		if (cursor.so.hide_children) return false;
		cursor = cursor.parent;
	}
	return true;
}

/** Repeater filtering: the template gets all axes, firewalled fireblocks
 *  (first, or last when shortened) get the repeat axis only, everything
 *  else is a non-dimensioned clone. Per rule 22, view mode does NOT
 *  restrict the axis set — 2D and 3D consider all three axes the same
 *  way; the camera-axis filter handles axes that project to slivers. */
function classify_so(obj: O_Scene): { eligible: boolean; kind: Label_Kind; axes_allowed: readonly Axis_Name[] } {
	if (!obj.parent || !obj.parent.so.repeater) {
		return { eligible: true, kind: 'regular', axes_allowed: ['x', 'y', 'z'] };
	}
	const siblings = scene.get_all().filter(o => o.parent === obj.parent);
	if (siblings[0] === obj) {
		return { eligible: true, kind: 'template', axes_allowed: ['x', 'y', 'z'] };
	}
	const repeater = obj.parent.so.repeater;
	if (!repeater.firewall) {
		return { eligible: false, kind: 'clone', axes_allowed: [] };
	}
	const repeat_ai = repeater.run_axis ?? 0;
	const template_len = siblings[0].so.axes[repeat_ai].length.value;
	const this_len = obj.so.axes[repeat_ai].length.value;
	if (Math.abs(this_len - template_len) < 0.1) {
		return { eligible: false, kind: 'clone', axes_allowed: [] };
	}
	const fireblocks = siblings.filter(s =>
		Math.abs(s.so.axes[repeat_ai].length.value - template_len) > 0.1
	);
	const is_first = fireblocks[0] === obj;
	const is_last = fireblocks.length > 1 && fireblocks[fireblocks.length - 1] === obj;
	const last_shortened = is_last &&
		Math.abs(obj.so.axes[repeat_ai].length.value -
			fireblocks[0].so.axes[repeat_ai].length.value) > 0.1;
	const axis_name = (['x', 'y', 'z'] as const)[repeat_ai];
	if (is_first)        return { eligible: true,  kind: 'fireblock-first',            axes_allowed: [axis_name] };
	if (last_shortened)  return { eligible: true,  kind: 'fireblock-last-shortened',   axes_allowed: [axis_name] };
	return { eligible: false, kind: 'clone', axes_allowed: [] };
}


// ═══════════════════════════════════════════════════════════════════
// UNIFACE BOX — step 1 of the uniface transition (see uniface rules.md).
// Helper that builds the silhouette box and the three nested uniface
// boxes' per-uniface shifts. Nothing in the running placement code
// calls these yet; the unit tests below pin the geometry.
// ═══════════════════════════════════════════════════════════════════

/** Box that exactly encloses every corner of every rendered leaf object,
 *  world-axis-aligned. Per the lexicon entry for "silhouette box". */
export type Silhouette_Box = {
	min: [number, number, number]; // [x_min, y_min, z_min] in world units
	max: [number, number, number]; // [x_max, y_max, z_max] in world units
};

/** Uniface-face index. Six faces of the uniface box, named by their
 *  outward world-axis direction. */
export const UNIFACE_FACE_POS_X = 0;
export const UNIFACE_FACE_NEG_X = 1;
export const UNIFACE_FACE_POS_Y = 2;
export const UNIFACE_FACE_NEG_Y = 3;
export const UNIFACE_FACE_POS_Z = 4;
export const UNIFACE_FACE_NEG_Z = 5;

/** The uniface box family: the silhouette box plus three nested
 *  expansion levels (enum 1, 2, 3 per rule 1 of uniface rules.md).
 *  shifts[enum_index_zero_based][face_index] = world-units displacement
 *  from the silhouette box face along that face's outward normal, or
 *  null for an excluded face (per the lexicon entry "excluded uniface":
 *  a face whose normal points within angle_deg of the camera or within
 *  angle_deg of edge-on is excluded from the placement algorithm).
 *  Computed every render so the projected face sits at the configured
 *  screen-pixel margin (silhouette margin per enum level) past the
 *  silhouette rect on that side. */
export type Uniface_Box = {
	silhouette: Silhouette_Box;
	shifts: (number | null)[][]; // shifts[0..cap-1][0..5]; null = excluded
};

/** Whether a face is excluded from the placement algorithm. True when:
 *    - The outward normal is within front_deg of pointing AT the camera
 *      (opposite to camera_forward) — a witness extending along that
 *      normal would project to a point or sliver; OR
 *    - The outward normal is within back_deg of pointing AWAY from the
 *      camera (same direction as camera_forward) — the face is hidden
 *      by the box itself; the wider tolerance reflects that even
 *      partly-back faces are unusable.
 *  Faces facing sideways, up, or down (more than back_deg off from
 *  straight back AND more than front_deg off from straight at-camera)
 *  are KEPT. Per rule 14's camera-axis filter. */
export function is_face_excluded(
	face_normal: vec3,
	camera_forward: vec3,
	front_deg: number,
	back_deg: number,
): boolean {
	const n = vec3.create();
	vec3.normalize(n, face_normal);
	const f = vec3.create();
	vec3.normalize(f, camera_forward);
	const dot = vec3.dot(n, f);
	const cos_back  = Math.cos((back_deg  * Math.PI) / 180);
	const cos_front = Math.cos((front_deg * Math.PI) / 180);
	// dot >  cos_back   → within back_deg of pointing-away  → reject.
	// dot < -cos_front  → within front_deg of pointing-at   → reject.
	return dot > cos_back || dot < -cos_front;
}

/** Compute the silhouette box from an explicit list of world-space
 *  corners. Pure function; test-friendly. Returns a zero-extent box at
 *  the origin when the input is empty. */
export function compute_silhouette_box(world_corners: readonly vec3[]): Silhouette_Box {
	if (world_corners.length === 0) {
		return { min: [0, 0, 0], max: [0, 0, 0] };
	}
	let min_x =  Infinity, min_y =  Infinity, min_z =  Infinity;
	let max_x = -Infinity, max_y = -Infinity, max_z = -Infinity;
	for (const v of world_corners) {
		if (v[0] < min_x) min_x = v[0];
		if (v[1] < min_y) min_y = v[1];
		if (v[2] < min_z) min_z = v[2];
		if (v[0] > max_x) max_x = v[0];
		if (v[1] > max_y) max_y = v[1];
		if (v[2] > max_z) max_z = v[2];
	}
	return { min: [min_x, min_y, min_z], max: [max_x, max_y, max_z] };
}

/** Build the per-uniface shifts for a given silhouette box, projection,
 *  per-face exclusion test, margin, and enum cap. The shift for each
 *  uniface at enum level N is computed by local linearization: project
 *  the face center, project the face center plus one world-unit outward
 *  along the face normal, measure the screen distance, then scale so
 *  the projected face sits exactly N * margin_px past the silhouette
 *  rect on that side. Excluded faces (per the is_excluded callback)
 *  produce null shifts at every enum level. Pure function;
 *  test-friendly via the injected projection and exclusion test. */
export function compute_uniface_box_from_silhouette(
	silhouette: Silhouette_Box,
	project: (world_point: vec3) => { x: number; y: number },
	is_excluded: (face_normal: vec3) => boolean,
	margin_px: number,
	cap: number,
): Uniface_Box {
	const cx = (silhouette.min[0] + silhouette.max[0]) / 2;
	const cy = (silhouette.min[1] + silhouette.max[1]) / 2;
	const cz = (silhouette.min[2] + silhouette.max[2]) / 2;
	const faces: Array<{ center: vec3; normal: vec3 }> = [
		{ center: vec3.fromValues(silhouette.max[0], cy, cz), normal: vec3.fromValues( 1, 0, 0) }, // +x
		{ center: vec3.fromValues(silhouette.min[0], cy, cz), normal: vec3.fromValues(-1, 0, 0) }, // -x
		{ center: vec3.fromValues(cx, silhouette.max[1], cz), normal: vec3.fromValues(0,  1, 0) }, // +y
		{ center: vec3.fromValues(cx, silhouette.min[1], cz), normal: vec3.fromValues(0, -1, 0) }, // -y
		{ center: vec3.fromValues(cx, cy, silhouette.max[2]), normal: vec3.fromValues(0, 0,  1) }, // +z
		{ center: vec3.fromValues(cx, cy, silhouette.min[2]), normal: vec3.fromValues(0, 0, -1) }, // -z
	];
	const face_excluded = faces.map(f => is_excluded(f.normal));
	const shifts: (number | null)[][] = [];
	for (let lvl = 1; lvl <= cap; lvl++) {
		const target = margin_px * lvl;
		const row: (number | null)[] = [];
		for (let i = 0; i < faces.length; i++) {
			if (face_excluded[i]) {
				row.push(null);
				continue;
			}
			const f = faces[i];
			const p0 = project(f.center);
			const test = vec3.create();
			vec3.add(test, f.center, f.normal);
			const p1 = project(test);
			const screen_per_world = Math.hypot(p1.x - p0.x, p1.y - p0.y);
			row.push(screen_per_world > 1e-9 ? target / screen_per_world : 0);
		}
		shifts.push(row);
	}
	return { silhouette, shifts };
}

/** The matrix that turns a static-world point into a tumbled-world point.
 *  Equal to root.full_world_matrix * inverse(root.static_world_matrix).
 *  By the recursive structure of the world-matrix builder, this same matrix
 *  applies to every part — children's own local rotations cancel out
 *  between full and static. Returns identity when no root is present. */
export function compute_root_tumble_matrix(): mat4 {
	const root = scene.get_all().find(o => !o.parent);
	if (!root) return mat4.create();
	const full = render.get_world_matrix(root);
	const stat = render.get_static_world_matrix(root);
	const inv_stat = mat4.create();
	mat4.invert(inv_stat, stat);
	const M = mat4.create();
	mat4.multiply(M, full, inv_stat);
	return M;
}

/** Scene-side wrapper. Gathers the STATIC-frame corners of every rendered
 *  leaf part (no root tumble applied) so the bounding box is aligned with
 *  the real-world axes and tumbles with the scene when projected. The
 *  projection callback maps a static-frame point to screen pixels by
 *  applying the current root tumble first. */
/** True when every corner of the part's bounding box, after tumble plus
 *  projection, lies within the visible canvas rectangle AND in front of
 *  the camera. The lexicon's "fully visible part" rule — only such parts
 *  contribute to the silhouette box. */
export function is_fully_visible_on_screen(obj: O_Scene): boolean {
	const wm = render.get_static_world_matrix(obj);
	const tumble = compute_root_tumble_matrix();
	const w = render.logical_size.width;
	const h = render.logical_size.height;
	for (let xi = 0; xi < 2; xi++) {
		for (let yi = 0; yi < 2; yi++) {
			for (let zi = 0; zi < 2; zi++) {
				const local = vec3.fromValues(
					xi === 0 ? obj.so.x_min : obj.so.x_max,
					yi === 0 ? obj.so.y_min : obj.so.y_max,
					zi === 0 ? obj.so.z_min : obj.so.z_max,
				);
				const world = vec3.create();
				vec3.transformMat4(world, local, wm);
				const p = render.project_vertex(world, tumble);
				if (p.w < 0) return false;
				if (p.x < 0 || p.x > w) return false;
				if (p.y < 0 || p.y > h) return false;
			}
		}
	}
	return true;
}

export function build_uniface_box_for_scene(rendered_leaves: readonly O_Scene[]): Uniface_Box {
	const corners: vec3[] = [];
	for (const obj of rendered_leaves) {
		const wm = render.get_static_world_matrix(obj);
		for (const local_v of obj.so.vertices) {
			const world_v = vec3.create();
			vec3.transformMat4(world_v, local_v, wm);
			corners.push(world_v);
		}
	}
	const silhouette = compute_silhouette_box(corners);
	const tumble = compute_root_tumble_matrix();
	const project = (world_point: vec3) => {
		const p = render.project_vertex(world_point, tumble);
		return { x: p.x, y: p.y };
	};
	// Take the orientation, rotate the camera's looking direction backward
	// by it to get the camera direction expressed in the room's static
	// axes. Whichever room axis has the largest absolute component is the
	// one closest to camera-facing. Faces along that axis get rejected
	// when the angle is under twenty degrees.
	const orient_inv = quat.create();
	quat.invert(orient_inv, stores.current_orientation());
	const cam_dir_in_room = vec3.create();
	vec3.transformQuat(cam_dir_in_room, vec3.fromValues(0, 0, -1), orient_inv);
	const is_excluded = (face_normal: vec3) =>
		is_face_excluded(
			face_normal,
			cam_dir_in_room,
			k.dimensions.EXCLUDED_FACE_ANGLE_DEG,
			k.dimensions.EXCLUDED_BACK_FACE_ANGLE_DEG,
		);
	return compute_uniface_box_from_silhouette(
		silhouette,
		project,
		is_excluded,
		k.dimensions.SILHOUETTE_MARGIN_PX,
		k.dimensions.WITNESS_INDEX_CAP,
	);
}

export type Last_Resort_Geometry = {
	edge_p1_screen   : { x: number; y: number };
	edge_p2_screen   : { x: number; y: number };
	anchor_1         : { x: number; y: number };
	anchor_2         : { x: number; y: number };
	label_pos        : { x: number; y: number };
	label_rect       : Rect_2d;
	witness_length_px: number;
	/** Shift in mm applied to the part edge along the perpendicular world
	 *  axis to land at the projected anchors. Diagnostics only. */
	shift_mm         : number;
	/** True when the offset direction (after the part's world matrix is
	 *  applied) has a component toward the camera. Diagnostics + score. */
	is_front         : boolean;
};

/** Vertical and horizontal padding the renderer adds around the label
 *  rectangle when it draws the white box behind the number. The placement
 *  rectangle tracks only the text bounds; the drawn box reaches one pixel
 *  above and below the text, and two pixels left and right of it. */
const LABEL_BOX_VERT_PAD_PX  = 1;
const LABEL_BOX_HORIZ_PAD_PX = 2;
/** Pixels the renderer extends each witness line past the dim-line anchor
 *  in the direction away from the part edge. The last-resort inset has to
 *  cover this overhang plus the canvas clearance. */
const WITNESS_PAST_DIM_LINE_PX = 10;
/** Pixels of clearance kept between the dimensional's furthest-out point
 *  on screen and the canvas edge. The bbox of every drawn mark of the
 *  dimensional must sit inside the canvas with this much room to spare. */
const LAST_RESORT_CANVAS_CLEARANCE_PX = 10;

/** Last-resort placement for the case when the main search drops every
 *  candidate for a (part, axis) pair (heavy zoom, edge-on geometry, etc.).
 *  Ignores the silhouette and uniface boxes. Eight candidates per axis:
 *  four edges of the part along the measured axis, paired with the two
 *  outward perpendicular directions of each edge (the directions along
 *  the two non-measured local axes that point away from the part). For
 *  each candidate, a binary search finds the SMALLEST mm shift along the
 *  perpendicular such that the projected dimensional fits inside the
 *  canvas with ten pixels of clearance on every side. Smallest shift gives
 *  the shortest witnesses, which is what the spec calls for. Candidates
 *  whose two projected witness lines run closer than fifteen pixels apart
 *  (the normal-search silhouette margin) are dropped. The winner is
 *  scored: shorter projected witness length outranks longer; front-side
 *  offsets break ties. Returns null when no candidate fits. */
export function compute_last_resort_placement(
	obj: O_Scene,
	axis: Axis_Name,
	label_w_px: number,
	label_h_px: number,
	canvas_w: number,
	canvas_h: number,
	project_screen: (world_point: vec3) => { x: number; y: number; w: number },
	cam_dir_in_room: vec3,
): Last_Resort_Geometry | null {
	const wm = render.get_static_world_matrix(obj);
	// Eight candidates per axis: four edges of the part along the measured
	// axis paired with two outward perpendicular offset directions per edge.
	// Local coordinates throughout — world transform applied at evaluation.
	type Candidate = {
		edge_local_p1   : vec3;
		edge_local_p2   : vec3;
		offset_dir_local: vec3;
	};
	const candidates: Candidate[] = [];
	const part_size = Math.max(
		obj.so.x_max - obj.so.x_min,
		obj.so.y_max - obj.so.y_min,
		obj.so.z_max - obj.so.z_min,
	);
	const ys: Array<{ pick: number; sign: number }> = [
		{ pick: obj.so.y_min, sign: -1 }, { pick: obj.so.y_max, sign: +1 },
	];
	const zs: Array<{ pick: number; sign: number }> = [
		{ pick: obj.so.z_min, sign: -1 }, { pick: obj.so.z_max, sign: +1 },
	];
	const xs: Array<{ pick: number; sign: number }> = [
		{ pick: obj.so.x_min, sign: -1 }, { pick: obj.so.x_max, sign: +1 },
	];
	if (axis === 'x') {
		for (const y of ys) for (const z of zs) {
			const e1 = vec3.fromValues(obj.so.x_min, y.pick, z.pick);
			const e2 = vec3.fromValues(obj.so.x_max, y.pick, z.pick);
			candidates.push({ edge_local_p1: e1, edge_local_p2: e2, offset_dir_local: vec3.fromValues(0, y.sign, 0) });
			candidates.push({ edge_local_p1: e1, edge_local_p2: e2, offset_dir_local: vec3.fromValues(0, 0, z.sign) });
		}
	} else if (axis === 'y') {
		for (const x of xs) for (const z of zs) {
			const e1 = vec3.fromValues(x.pick, obj.so.y_min, z.pick);
			const e2 = vec3.fromValues(x.pick, obj.so.y_max, z.pick);
			candidates.push({ edge_local_p1: e1, edge_local_p2: e2, offset_dir_local: vec3.fromValues(x.sign, 0, 0) });
			candidates.push({ edge_local_p1: e1, edge_local_p2: e2, offset_dir_local: vec3.fromValues(0, 0, z.sign) });
		}
	} else {
		for (const x of xs) for (const y of ys) {
			const e1 = vec3.fromValues(x.pick, y.pick, obj.so.z_min);
			const e2 = vec3.fromValues(x.pick, y.pick, obj.so.z_max);
			candidates.push({ edge_local_p1: e1, edge_local_p2: e2, offset_dir_local: vec3.fromValues(x.sign, 0, 0) });
			candidates.push({ edge_local_p1: e1, edge_local_p2: e2, offset_dir_local: vec3.fromValues(0, y.sign, 0) });
		}
	}
	// Local origin and offset endpoint in world; subtracting gives the rotation
	// of the offset direction into static-world coordinates. Used for the
	// front-vs-back-side check via the dot with cam_dir_in_room.
	const origin_w = vec3.create();
	vec3.transformMat4(origin_w, vec3.fromValues(0, 0, 0), wm);
	// Project a single dimensional configuration and decide if it fits.
	// All math returns screen-pixel values.
	type Evaluated = {
		fits          : boolean;
		any_behind    : boolean;
		geometry      : {
			e1            : { x: number; y: number };
			e2            : { x: number; y: number };
			a1            : { x: number; y: number };
			a2            : { x: number; y: number };
			label_pos     : { x: number; y: number };
			label_rect    : Rect_2d;
		} | null;
	};
	const evaluate = (c: Candidate, shift_mm: number): Evaluated => {
		const a_local_1 = vec3.create();
		vec3.scaleAndAdd(a_local_1, c.edge_local_p1, c.offset_dir_local, shift_mm);
		const a_local_2 = vec3.create();
		vec3.scaleAndAdd(a_local_2, c.edge_local_p2, c.offset_dir_local, shift_mm);
		const e_w_1 = vec3.create(); vec3.transformMat4(e_w_1, c.edge_local_p1, wm);
		const e_w_2 = vec3.create(); vec3.transformMat4(e_w_2, c.edge_local_p2, wm);
		const a_w_1 = vec3.create(); vec3.transformMat4(a_w_1, a_local_1, wm);
		const a_w_2 = vec3.create(); vec3.transformMat4(a_w_2, a_local_2, wm);
		const ep1 = project_screen(e_w_1);
		const ep2 = project_screen(e_w_2);
		const ap1 = project_screen(a_w_1);
		const ap2 = project_screen(a_w_2);
		if (ep1.w < 0 || ep2.w < 0 || ap1.w < 0 || ap2.w < 0) {
			return { fits: false, any_behind: true, geometry: null };
		}
		const e1 = { x: ep1.x, y: ep1.y };
		const e2 = { x: ep2.x, y: ep2.y };
		const a1 = { x: ap1.x, y: ap1.y };
		const a2 = { x: ap2.x, y: ap2.y };
		const label_pos = { x: (a1.x + a2.x) / 2, y: (a1.y + a2.y) / 2 };
		const label_rect: Rect_2d = {
			x_min: label_pos.x - label_w_px / 2,
			x_max: label_pos.x + label_w_px / 2,
			y_min: label_pos.y - label_h_px / 2,
			y_max: label_pos.y + label_h_px / 2,
		};
		// Witness extension end on each side: WITNESS_PAST_DIM_LINE_PX past
		// the anchor in the same screen direction the witness travels.
		const w1_len = Math.hypot(a1.x - e1.x, a1.y - e1.y);
		const w2_len = Math.hypot(a2.x - e2.x, a2.y - e2.y);
		const w1_ux = w1_len > 1e-9 ? (a1.x - e1.x) / w1_len : 0;
		const w1_uy = w1_len > 1e-9 ? (a1.y - e1.y) / w1_len : 0;
		const w2_ux = w2_len > 1e-9 ? (a2.x - e2.x) / w2_len : 0;
		const w2_uy = w2_len > 1e-9 ? (a2.y - e2.y) / w2_len : 0;
		const w1_past = { x: a1.x + w1_ux * WITNESS_PAST_DIM_LINE_PX, y: a1.y + w1_uy * WITNESS_PAST_DIM_LINE_PX };
		const w2_past = { x: a2.x + w2_ux * WITNESS_PAST_DIM_LINE_PX, y: a2.y + w2_uy * WITNESS_PAST_DIM_LINE_PX };
		const bbox_points = [
			e1, e2, a1, a2, w1_past, w2_past,
			{ x: label_pos.x - label_w_px / 2 - LABEL_BOX_HORIZ_PAD_PX, y: label_pos.y - label_h_px / 2 - LABEL_BOX_VERT_PAD_PX },
			{ x: label_pos.x + label_w_px / 2 + LABEL_BOX_HORIZ_PAD_PX, y: label_pos.y - label_h_px / 2 - LABEL_BOX_VERT_PAD_PX },
			{ x: label_pos.x + label_w_px / 2 + LABEL_BOX_HORIZ_PAD_PX, y: label_pos.y + label_h_px / 2 + LABEL_BOX_VERT_PAD_PX },
			{ x: label_pos.x - label_w_px / 2 - LABEL_BOX_HORIZ_PAD_PX, y: label_pos.y + label_h_px / 2 + LABEL_BOX_VERT_PAD_PX },
		];
		let bb_x_min = Infinity, bb_x_max = -Infinity, bb_y_min = Infinity, bb_y_max = -Infinity;
		for (const p of bbox_points) {
			if (p.x < bb_x_min) bb_x_min = p.x;
			if (p.x > bb_x_max) bb_x_max = p.x;
			if (p.y < bb_y_min) bb_y_min = p.y;
			if (p.y > bb_y_max) bb_y_max = p.y;
		}
		const lo_x = LAST_RESORT_CANVAS_CLEARANCE_PX;
		const lo_y = LAST_RESORT_CANVAS_CLEARANCE_PX;
		const hi_x = canvas_w - LAST_RESORT_CANVAS_CLEARANCE_PX;
		const hi_y = canvas_h - LAST_RESORT_CANVAS_CLEARANCE_PX;
		const fits = bb_x_min >= lo_x && bb_x_max <= hi_x && bb_y_min >= lo_y && bb_y_max <= hi_y;
		return { fits, any_behind: false, geometry: { e1, e2, a1, a2, label_pos, label_rect } };
	};
	// Per-candidate camera relationship. The offset direction in static
	// world is taken by transforming a unit offset through the part's
	// world matrix and subtracting the world-space origin (rotation only,
	// no translation). Returns:
	//   cam_dot       — signed dot with camera-forward; negative when the
	//                   offset goes TOWARD the camera (front side).
	//   cam_alignment — absolute dot; zero when the offset lies in the
	//                   plane perpendicular to the camera view (in-plane,
	//                   sideways), one when the offset points straight
	//                   toward or straight away from the camera.
	//   is_front      — true when cam_dot is negative.
	const camera_relation_of = (c: Candidate): { cam_dot: number; cam_alignment: number; is_front: boolean } => {
		const tip_w = vec3.create();
		vec3.transformMat4(tip_w, c.offset_dir_local, wm);
		const dir_w = vec3.create();
		vec3.subtract(dir_w, tip_w, origin_w);
		const len = Math.hypot(dir_w[0], dir_w[1], dir_w[2]);
		if (len < 1e-9) return { cam_dot: 0, cam_alignment: 0, is_front: false };
		vec3.scale(dir_w, dir_w, 1 / len);
		const cam_dot = vec3.dot(dir_w, cam_dir_in_room);
		return { cam_dot, cam_alignment: Math.abs(cam_dot), is_front: cam_dot < 0 };
	};
	let best: Last_Resort_Geometry | null = null;
	let best_score = -Infinity;
	const min_witness_gap_px = k.dimensions.SILHOUETTE_MARGIN_PX;
	for (const c of candidates) {
		const { cam_alignment, is_front } = camera_relation_of(c);
		// Spec rule 5.2 (option FOUR) — find the LARGEST millimetre shift
		// such that every drawn mark is INSIDE the canvas; at that shift
		// at least one mark sits ten pixels from its nearest canvas edge.
		// Pushes the dim as far out as the canvas allows, so witnesses are
		// long and the label box never sits on the part edge.
		const min_shift = part_size * 0.01 + 1e-3;
		const max_shift = Math.max(part_size, 1) * 100;
		// Step 1 — find ANY fitting shift, growing from small.
		let s_seed_fit = -1;
		let geom_seed_fit: Evaluated['geometry'] | null = null;
		let s_probe = min_shift;
		let probe_iters = 0;
		while (s_probe < max_shift && probe_iters < 30) {
			const r_probe = evaluate(c, s_probe);
			if (r_probe.fits) {
				s_seed_fit = s_probe;
				geom_seed_fit = r_probe.geometry;
				break;
			}
			s_probe *= 2;
			probe_iters++;
		}
		if (s_seed_fit < 0) continue;  // never fit at any tested shift
		// Step 2 — from the seed fit, double the shift until it stops
		// fitting (gives an upper bound where one mark is just past the
		// ten-pixel inset). Track the largest still-fitting shift so it can
		// stand in if no non-fitting upper bound is found within max_shift.
		let s_upper_nofit = -1;
		let last_fit = s_seed_fit;
		let last_geom: Evaluated['geometry'] | null = geom_seed_fit;
		let s_upper_probe = s_seed_fit * 2;
		let upper_iters = 0;
		while (s_upper_probe < max_shift && upper_iters < 30) {
			const r_upper = evaluate(c, s_upper_probe);
			if (!r_upper.fits) {
				s_upper_nofit = s_upper_probe;
				break;
			}
			last_fit = s_upper_probe;
			last_geom = r_upper.geometry;
			s_upper_probe *= 2;
			upper_iters++;
		}
		// Step 3 — if an upper non-fitting shift was found, bisect between
		// last_fit (fits) and s_upper_nofit (does not fit) to converge on
		// the LARGEST fitting shift within a tenth of a pixel.
		let s_fit = last_fit;
		let geom_fit: Evaluated['geometry'] | null = last_geom;
		if (s_upper_nofit > 0) {
			let s_low = last_fit;
			let s_high = s_upper_nofit;
			for (let i = 0; i < 30; i++) {
				const s_mid = (s_low + s_high) / 2;
				const r_mid = evaluate(c, s_mid);
				if (r_mid.fits) { s_low = s_mid; s_fit = s_mid; geom_fit = r_mid.geometry; }
				else            { s_high = s_mid; }
			}
		}
		if (!geom_fit) continue;
		// Witness-line-spacing check post-projection: same threshold the
		// normal search uses (rule 6, fifteen pixels).
		const witness_gap_px = min_distance_between_segments_2d(
			geom_fit.e1, geom_fit.a1, geom_fit.e2, geom_fit.a2,
		);
		if (witness_gap_px < min_witness_gap_px) continue;
		const witness_length_px = distance_from_point_to_line_2d(geom_fit.a1, geom_fit.e1, geom_fit.e2);
		// Score (primary): prefer offsets that lie in the plane of the
		// part face being measured — i.e., perpendicular to the camera
		// view — over offsets that pop straight toward or away from the
		// camera. Each unit of camera alignment costs ten thousand score
		// units, which always outranks any plausible witness-length
		// difference in pixels. Tiebreaker: shorter projected witness
		// length wins among candidates with equal camera alignment.
		const ALIGNMENT_WEIGHT = 10000;
		const score = -ALIGNMENT_WEIGHT * cam_alignment - witness_length_px;
		if (score > best_score) {
			best_score = score;
			best = {
				edge_p1_screen   : geom_fit.e1,
				edge_p2_screen   : geom_fit.e2,
				anchor_1         : geom_fit.a1,
				anchor_2         : geom_fit.a2,
				label_pos        : geom_fit.label_pos,
				label_rect       : geom_fit.label_rect,
				witness_length_px,
				shift_mm         : s_fit,
				is_front,
			};
		}
	}
	return best;
}

/** Per-axis uniface picker (step 2a of the uniface transition).
 *
 *  Given an axis being measured and a uniface box, return the index of
 *  the first uniface that is BOTH (a) not excluded — its shift is not
 *  null at the chosen enum level — AND (b) contains the measured axis
 *  (its outward normal is perpendicular to that axis, so the dim line
 *  parallel to the axis can lie in the uniface's plane).
 *
 *  Returns null if no such uniface exists. Order of preference for the
 *  four candidate unifaces per axis:
 *    x-axis: +y, -y, +z, -z
 *    y-axis: +x, -x, +z, -z
 *    z-axis: +x, -x, +y, -y
 *
 *  "First viable" picking only. Smarter picking (closest, least-crowded,
 *  stability-preferring) is step 3 of the transition. Conflict checking
 *  against other labels is the higher-level placement loop that wraps
 *  this picker. */
/** Per-axis candidate unifaces: the four faces of the uniface box whose
 *  outward normal is perpendicular to the named axis. A dim line
 *  parallel to that axis can sit in any of them. Shared by all per-axis
 *  pickers below. */
const UNIFACE_CANDIDATES_PER_AXIS: Record<Axis_Name, number[]> = {
	x: [UNIFACE_FACE_POS_Y, UNIFACE_FACE_NEG_Y, UNIFACE_FACE_POS_Z, UNIFACE_FACE_NEG_Z],
	y: [UNIFACE_FACE_POS_X, UNIFACE_FACE_NEG_X, UNIFACE_FACE_POS_Z, UNIFACE_FACE_NEG_Z],
	z: [UNIFACE_FACE_POS_X, UNIFACE_FACE_NEG_X, UNIFACE_FACE_POS_Y, UNIFACE_FACE_NEG_Y],
};

export function pick_first_viable_uniface_for_axis(
	axis: Axis_Name,
	uniface_box: Uniface_Box,
	enum_index_zero_based: number,
): number | null {
	const row = uniface_box.shifts[enum_index_zero_based];
	if (!row) return null;
	for (const face_idx of UNIFACE_CANDIDATES_PER_AXIS[axis]) {
		if (row[face_idx] !== null) return face_idx;
	}
	return null;
}

/** Per-axis closest-uniface picker (step 3a of the uniface transition).
 *
 *  Given the four candidate unifaces for this axis, return the one
 *  whose face center is closest, in screen pixels, to the natural label
 *  position (the seed point). The caller supplies the screen distance
 *  from the seed to each face center as a six-entry array indexed by
 *  UNIFACE_FACE_*; excluded faces (null shift at this enum level) are
 *  skipped regardless of their distance entry. Returns null if no
 *  candidate is viable. Pure; the caller does all projection. */
export function pick_closest_uniface_for_axis(
	axis: Axis_Name,
	uniface_box: Uniface_Box,
	enum_index_zero_based: number,
	screen_distance_per_face: readonly number[],
): number | null {
	const row = uniface_box.shifts[enum_index_zero_based];
	if (!row) return null;
	let best_idx: number | null = null;
	let best_dist = Infinity;
	for (const face_idx of UNIFACE_CANDIDATES_PER_AXIS[axis]) {
		if (row[face_idx] === null) continue;
		const d = screen_distance_per_face[face_idx];
		if (d < best_dist) {
			best_dist = d;
			best_idx = face_idx;
		}
	}
	return best_idx;
}

/** A 2D axis-aligned rectangle in screen pixels. Used by the clearance
 *  checks of rules 5, 6, and 19. */
export type Rect_2d = { x_min: number; y_min: number; x_max: number; y_max: number };

/** Tally how many parts marked each (direction, witness index) candidate
 *  viable in the rule-19 first-look sweep. Keys of the input map identify
 *  the part-axis; values are the set of "face|wi" candidates it found
 *  viable. The output keys "face|wi" map to the count of parts that
 *  included that candidate. Pure. */
export function tally_candidate_counts_for_vote(
	candidate_viability: ReadonlyMap<string, ReadonlySet<string>>,
): Map<string, number> {
	const counts = new Map<string, number>();
	for (const candidates of candidate_viability.values()) {
		for (const candidate of candidates) counts.set(candidate, (counts.get(candidate) ?? 0) + 1);
	}
	return counts;
}

/** Decide whether the inside arrow at an anchor would fit between the
 *  label box and the witness line on this side (rule 18). The arrow's
 *  tip sits at the anchor; it points along `arrow_dir_sign` * (a2 - a1).
 *  Returns true when the inside arrow does NOT fit — the renderer should
 *  flip this side to draw the outside extension and the outward arrow.
 *  Measured along the dim line direction itself so diagonal dims work.
 *  Pure. */
export function is_inside_arrow_blocked_at_anchor(
	anchor: { x: number; y: number },
	label_center: { x: number; y: number },
	dim_unit_dx: number,
	dim_unit_dy: number,
	arrow_dir_sign: number,
	half_label_width_px: number,
	arrow_size_px: number,
): boolean {
	const min_gap_along_dim = half_label_width_px + 2 + arrow_size_px;
	const anchor_proj = (anchor.x - label_center.x) * dim_unit_dx + (anchor.y - label_center.y) * dim_unit_dy;
	const signed_distance_outside_label = -arrow_dir_sign * anchor_proj;
	return signed_distance_outside_label < min_gap_along_dim;
}

/** Detect "label fully covers the inside arrow at this anchor" (rule 18's
 *  label-slide trigger). Returns true when BOTH the anchor itself AND the
 *  arrow's base point sit inside the (padded) label rect at the natural
 *  position. The slide moves the label past the witness anchor by
 *  half-label-width + 2 + SLIDABLE_OVERHANG_PX + arrow-length, so the
 *  cross-label clearance check sees the FINAL position. Pure. */
export function does_label_fully_cover_inside_arrow(
	anchor: { x: number; y: number },
	label_center: { x: number; y: number },
	dim_unit_dx: number,
	dim_unit_dy: number,
	arrow_dir_sign: number,
	half_label_width_px: number,
	half_label_height_px: number,
	arrow_size_px: number,
): boolean {
	const x_min = label_center.x - half_label_width_px - 2;
	const x_max = label_center.x + half_label_width_px + 2;
	const y_min = label_center.y - half_label_height_px - 1;
	const y_max = label_center.y + half_label_height_px + 1;
	const inside = (pt: { x: number; y: number }): boolean =>
		pt.x >= x_min && pt.x <= x_max && pt.y >= y_min && pt.y <= y_max;
	const arrow_base = {
		x: anchor.x + arrow_dir_sign * dim_unit_dx * arrow_size_px,
		y: anchor.y + arrow_dir_sign * dim_unit_dy * arrow_size_px,
	};
	return inside(anchor) && inside(arrow_base);
}

/** Everything a renderer needs to draw one placement on the canvas — all
 *  the line segments, the two arrowheads (tip and direction), the white
 *  label box, and the text position. Pure geometry, no canvas calls. The
 *  rule-18 tests can build a placement and assert the shapes this helper
 *  returns. */
export type Dim_Render_Geometry = {
	/** Two line segments for the two witness lines (each starts past the
	 *  part edge and ends past the anchor). Always two segments. */
	witness_segments: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>;
	/** Pieces of the dim line — between zero and three segments depending
	 *  on the inside / outside / slid case. */
	dim_line_segments: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }>;
	/** The two arrowheads, one per anchor. `tip` is where the triangle's
	 *  point sits; `direction` is the (dx, dy) the arrowhead's base
	 *  extends in. The renderer's draw_arrow expects this exact shape. */
	arrows: Array<{ tip: { x: number; y: number }; direction: { x: number; y: number } }>;
	/** The white label box. Render this filled white, then draw the text
	 *  centred on `label_text_position`. */
	label_box: { x_min: number; y_min: number; x_max: number; y_max: number };
	/** Centre point for the dim text. The text is drawn horizontally
	 *  centred (textAlign center, textBaseline middle). */
	label_text_position: { x: number; y: number };
	/** Whether the placement was slid past either witness anchor — used
	 *  by hover code and tests to know which case fired. */
	slid_past_anchor: 'a1' | 'a2' | null;
	/** Whether each side flipped to outside arrow / outside extension. */
	a1_outside: boolean;
	a2_outside: boolean;
};

/** Pure geometry helper — given a placement plus the measured label
 *  width and height, returns every line, arrowhead, and label box the
 *  renderer needs to draw. The label position is taken from the placement
 *  itself (placement has already done rule 18's slide). Rule 18's per-
 *  side flip decision runs here. Pure — no canvas required. */
export function compute_dim_render_geometry(
	placement: Placement_Details,
	label_w_px: number,
	label_h_px: number,
	witness_gap_from_part_px: number,
	witness_past_dim_line_px: number,
	overhang_px: number,
	arrow_size_px: number,
): Dim_Render_Geometry | null {
	const a1 = placement.anchor_1_screen;
	const a2 = placement.anchor_2_screen;
	const e1 = placement.edge_p1_screen;
	const e2 = placement.edge_p2_screen;
	const label_pos = placement.natural_label_position;
	if (!a1 || !a2 || !e1 || !e2 || !label_pos) return null;
	const dx = a2.x - a1.x;
	const dy = a2.y - a1.y;
	const dl_len = Math.hypot(dx, dy);
	if (dl_len < 1e-9) return null;
	const ux = dx / dl_len;
	const uy = dy / dl_len;
	const half_w = label_w_px / 2;
	const half_h = label_h_px / 2;
	// Witness line segments — each runs from a point just past the part
	// edge to a point just past its anchor.
	const w1_dx = a1.x - e1.x;
	const w1_dy = a1.y - e1.y;
	const w1_len = Math.hypot(w1_dx, w1_dy);
	const w1_ux = w1_len > 1e-9 ? w1_dx / w1_len : 0;
	const w1_uy = w1_len > 1e-9 ? w1_dy / w1_len : 0;
	const w2_dx = a2.x - e2.x;
	const w2_dy = a2.y - e2.y;
	const w2_len = Math.hypot(w2_dx, w2_dy);
	const w2_ux = w2_len > 1e-9 ? w2_dx / w2_len : 0;
	const w2_uy = w2_len > 1e-9 ? w2_dy / w2_len : 0;
	const witness_segments = [
		{
			from: { x: e1.x + w1_ux * witness_gap_from_part_px, y: e1.y + w1_uy * witness_gap_from_part_px },
			to  : { x: a1.x + w1_ux * witness_past_dim_line_px, y: a1.y + w1_uy * witness_past_dim_line_px },
		},
		{
			from: { x: e2.x + w2_ux * witness_gap_from_part_px, y: e2.y + w2_uy * witness_gap_from_part_px },
			to  : { x: a2.x + w2_ux * witness_past_dim_line_px, y: a2.y + w2_uy * witness_past_dim_line_px },
		},
	];
	// Slide detection — label past a1 means slid past a1; past a2 means
	// past a2. Placement already did the slide; the renderer reads the
	// final position.
	const proj_label = (label_pos.x - a1.x) * ux + (label_pos.y - a1.y) * uy;
	const slid_past_a1 = proj_label < 0;
	const slid_past_a2 = proj_label > dl_len;
	const slid = slid_past_a1 || slid_past_a2;
	const slid_past_anchor: 'a1' | 'a2' | null = slid_past_a1 ? 'a1' : slid_past_a2 ? 'a2' : null;
	// Per-side flip — slid forces both sides outside; otherwise the per-
	// anchor projection check decides.
	const a1_outside = slid || is_inside_arrow_blocked_at_anchor(a1, label_pos, ux, uy, +1, half_w, arrow_size_px);
	const a2_outside = slid || is_inside_arrow_blocked_at_anchor(a2, label_pos, ux, uy, -1, half_w, arrow_size_px);
	// Label near-edge points for the inside half-line case and for the
	// slid case's connector line.
	const proj_a1 = (a1.x - label_pos.x) * ux + (a1.y - label_pos.y) * uy;
	const proj_a2 = (a2.x - label_pos.x) * ux + (a2.y - label_pos.y) * uy;
	const sign_a1 = proj_a1 >= 0 ? 1 : -1;
	const sign_a2 = proj_a2 >= 0 ? 1 : -1;
	const label_near_a1 = { x: label_pos.x + sign_a1 * (half_w + 2) * ux, y: label_pos.y + sign_a1 * (half_w + 2) * uy };
	const label_near_a2 = { x: label_pos.x + sign_a2 * (half_w + 2) * ux, y: label_pos.y + sign_a2 * (half_w + 2) * uy };
	const dim_line_segments: Array<{ from: { x: number; y: number }; to: { x: number; y: number } }> = [];
	if (slid) {
		dim_line_segments.push({ from: { x: a1.x - ux * overhang_px, y: a1.y - uy * overhang_px }, to: a1 });
		dim_line_segments.push({ from: a2, to: { x: a2.x + ux * overhang_px, y: a2.y + uy * overhang_px } });
		if (slid_past_a1) {
			dim_line_segments.push({ from: { x: a1.x - ux * overhang_px, y: a1.y - uy * overhang_px }, to: label_near_a1 });
		} else {
			dim_line_segments.push({ from: { x: a2.x + ux * overhang_px, y: a2.y + uy * overhang_px }, to: label_near_a2 });
		}
	} else if (!a1_outside && !a2_outside) {
		dim_line_segments.push({ from: a1, to: a2 });
	} else if (!a1_outside && a2_outside) {
		dim_line_segments.push({ from: a1, to: label_near_a1 });
		dim_line_segments.push({ from: a2, to: { x: a2.x + ux * overhang_px, y: a2.y + uy * overhang_px } });
	} else if (a1_outside && !a2_outside) {
		dim_line_segments.push({ from: { x: a1.x - ux * overhang_px, y: a1.y - uy * overhang_px }, to: a1 });
		dim_line_segments.push({ from: label_near_a2, to: a2 });
	} else {
		dim_line_segments.push({ from: { x: a1.x - ux * overhang_px, y: a1.y - uy * overhang_px }, to: a1 });
		dim_line_segments.push({ from: a2, to: { x: a2.x + ux * overhang_px, y: a2.y + uy * overhang_px } });
	}
	const arrows = [
		a1_outside
			? { tip: a1, direction: { x: -dx, y: -dy } }
			: { tip: a1, direction: { x:  dx, y:  dy } },
		a2_outside
			? { tip: a2, direction: { x:  dx, y:  dy } }
			: { tip: a2, direction: { x: -dx, y: -dy } },
	];
	const label_box = {
		x_min: label_pos.x - half_w - 2,
		x_max: label_pos.x + half_w + 2,
		y_min: label_pos.y - half_h - 1,
		y_max: label_pos.y + half_h + 1,
	};
	return {
		witness_segments,
		dim_line_segments,
		arrows,
		label_box,
		label_text_position: { x: label_pos.x, y: label_pos.y },
		slid_past_anchor,
		a1_outside,
		a2_outside,
	};
}

/** Pick the two highest-count witness indices per direction (rule 19's
 *  depth-concentration vote). For each of the six directions, return the
 *  set of winning witness indices (at most two; zero when the direction
 *  had no viable parts). Ties are broken by the smaller witness index
 *  first so the result is deterministic. Pure. */
export function pick_top_two_witness_indices_per_face(
	candidate_count: ReadonlyMap<string, number>,
	num_witness_indices: number,
): Map<number, Set<number>> {
	const winners = new Map<number, Set<number>>();
	for (let face_idx = 0; face_idx < 6; face_idx++) {
		const ranking: Array<{ wi: number; count: number }> = [];
		for (let wi = 0; wi < num_witness_indices; wi++) {
			ranking.push({ wi, count: candidate_count.get(`${face_idx}|${wi}`) ?? 0 });
		}
		ranking.sort((a, b) => b.count - a.count || a.wi - b.wi);
		const top: Set<number> = new Set();
		for (let i = 0; i < Math.min(2, ranking.length); i++) {
			if (ranking[i].count > 0) top.add(ranking[i].wi);
		}
		winners.set(face_idx, top);
	}
	return winners;
}

/** True when two axis-aligned rectangles share any interior area. Touching
 *  edges only do not count as overlap (strict inequality). Pure. */
export function rectangles_overlap_2d(a: Rect_2d, b: Rect_2d): boolean {
	if (a.x_max <= b.x_min) return false;
	if (b.x_max <= a.x_min) return false;
	if (a.y_max <= b.y_min) return false;
	if (b.y_max <= a.y_min) return false;
	return true;
}

/** Closest point distance, in pixels, between two axis-aligned rectangles.
 *  Returns 0 when they overlap. Returns the corner-to-corner distance when
 *  they are diagonally separated, the edge-perpendicular distance when one
 *  is purely to the side. Pure. */
export function distance_between_rectangles_2d(a: Rect_2d, b: Rect_2d): number {
	const dx = Math.max(0, Math.max(a.x_min - b.x_max, b.x_min - a.x_max));
	const dy = Math.max(0, Math.max(a.y_min - b.y_max, b.y_min - a.y_max));
	return Math.hypot(dx, dy);
}

/** True when the inner rectangle lies entirely inside the outer rectangle
 *  (touching counts as inside). Used to enforce "label rectangle must NOT
 *  sit inside the silhouette rect" — caller negates this result. Pure. */
export function rectangle_inside_rectangle_2d(inner: Rect_2d, outer: Rect_2d): boolean {
	return inner.x_min >= outer.x_min
	    && inner.x_max <= outer.x_max
	    && inner.y_min >= outer.y_min
	    && inner.y_max <= outer.y_max;
}

/** All inputs the candidate-clearance check needs. Pure data; no
 *  singletons. The helper below operates on this and returns a boolean. */
export type Clearance_Inputs = {
	candidate_label_rect       : Rect_2d;
	candidate_anchor_1         : { x: number; y: number };
	candidate_anchor_2         : { x: number; y: number };
	candidate_edge_p1_screen   : { x: number; y: number };
	candidate_edge_p2_screen   : { x: number; y: number };
	/** Convex polygon on screen — typically the six-sided hull of the
	 *  eight projected silhouette-box corners (or four-sided when the
	 *  camera looks straight down an axis). Pure. */
	silhouette                 : ReadonlyArray<{ x: number; y: number }>;
	placed_label_rects         : ReadonlyArray<Rect_2d>;
	placed_anchors             : ReadonlyArray<{ x: number; y: number }>;
	placed_witness_segments    : ReadonlyArray<[{ x: number; y: number }, { x: number; y: number }]>;
	placed_dim_segments        : ReadonlyArray<[{ x: number; y: number }, { x: number; y: number }]>;
	pair_clearance_px          : number;
	silhouette_margin_px       : number;
	/** Pixels of clearance required between the label rectangle and the
	 *  silhouette polygon. When undefined, falls back to silhouette_margin_px
	 *  (the pre-split behavior). The live path passes zero so labels can
	 *  touch the polygon from outside; labels INSIDE the polygon always
	 *  get rejected regardless of this value. */
	silhouette_clearance_px?   : number;
	/** Absolute value of the dot product between the flat plane's outward
	 *  normal (cross product of edge direction and witness direction) and
	 *  the camera looking direction, both in the same static-world frame.
	 *  Zero means edge-on; one means the plane fully faces the camera.
	 *  When undefined, the edge-on filter is skipped. The live path
	 *  computes this once per (axis, side) and reuses it across every
	 *  candidate of that combination. */
	plane_camera_dot?          : number;
	/** Absolute-dot threshold below which the edge-on filter rejects. The
	 *  default value (about ten degrees from edge-on) is used when this is
	 *  undefined. */
	edge_on_threshold?         : number;
	/** The numeric text this dimension would draw (e.g. "12'-4"). Used
	 *  by the duplicate-text filter. */
	candidate_dimension_text?  : string;
	/** The dimension's measured axis. Two dimensions with the same text
	 *  and the same axis are duplicates per the duplicate-text filter. */
	candidate_dimension_axis?  : 'x' | 'y' | 'z';
	/** The list of already-picked dimensions for the current render. The
	 *  duplicate-text filter rejects the candidate when any entry matches
	 *  its text and axis. */
	placed_dimensions?         : ReadonlyArray<{ text: string; axis: 'x' | 'y' | 'z' }>;
	/** The candidate's two witness lines in three-dimensional world
	 *  coordinates — each entry is a [start, end] pair. The shape filter
	 *  rejects the candidate when either of these coincides in three
	 *  dimensions with any already-placed witness. */
	candidate_witness_world_segments? : ReadonlyArray<[[number, number, number], [number, number, number]]>;
	/** Every previously-placed dimension's two witness lines in three-
	 *  dimensional world coordinates. */
	placed_witness_world_segments?    : ReadonlyArray<[[number, number, number], [number, number, number]]>;
	/** Distance under which two world points are treated as the same point
	 *  when checking three-dimensional witness coincidence. Defaults to
	 *  one-thousandth of a world unit. */
	witness_world_tolerance?          : number;
	/** Canvas size in screen pixels. When both are supplied, the off-canvas
	 *  position filter (spec rule 3.5) rejects any candidate whose drawn
	 *  marks (witness lines, dim line, label rect with padding, witness
	 *  extension past each anchor) extend past any canvas edge. When
	 *  undefined, the filter is skipped (useful for tests). */
	canvas_w?                         : number;
	canvas_h?                         : number;
};

/** Names the filter that rejected a candidate. Read by the slide-and-retry
 *  branch in `run_uniface_placement` so it knows whether sliding the label
 *  along the dim line could fix the rejection — see `SLIDE_ELIGIBLE_FILTERS`
 *  below. The five label-rect filters slide; the other three involve
 *  geometry (anchors, witnesses, dim line) that does not move when the
 *  label slides. */
export type Clearance_Filter =
	| 'duplicate-text'
	| 'edge-on-plane'
	| 'witness-overlaps-placed'
	| 'silhouette'
	| 'label-vs-label'
	| 'label-vs-placed-anchor'
	| 'label-vs-placed-witness'
	| 'label-vs-placed-dim'
	| 'own-anchor-vs-placed'
	| 'own-dim-vs-placed'
	| 'own-witness-convergence'
	| 'label-vs-anchor-zone'
	| 'off-canvas';

/** Discriminated outcome of `evaluate_clearances`. On rejection,
 *  `shortfall_px` is how many pixels of separation the rejecting filter
 *  wanted minus what the candidate had — the amount the slide-and-retry
 *  branch shifts by plus one. */
export type Clearance_Result =
	| { ok: true }
	| { ok: false; filter: Clearance_Filter; shortfall_px: number };

/** Dimension filters — checks whose answer depends on the whole dimension
 *  (part + axis) and not on edge, side, uniface index, or label position. The live
 *  path runs these once per dimension before any side is considered; a
 *  fail skips the entire dimension. */
export const DIMENSION_FILTERS: ReadonlySet<Clearance_Filter> = new Set<Clearance_Filter>([
	'duplicate-text',
]);

/** Shape filters — checks whose answer depends ONLY on the (edge, side,
 *  uniface index) combination, NOT on the label's position along the dim line.
 *  The live path runs these once per (edge, side, uniface index); a fail skips
 *  the whole label-position loop. */
export const SHAPE_FILTERS: ReadonlySet<Clearance_Filter> = new Set<Clearance_Filter>([
	'edge-on-plane',
	'witness-overlaps-placed',
	'own-witness-convergence',
]);

/** Position filters — checks whose answer depends on the label rect's
 *  position along the dim line. Re-run for every candidate position. */
export const POSITION_FILTERS: ReadonlySet<Clearance_Filter> = new Set<Clearance_Filter>([
	'silhouette',
	'label-vs-label',
	'label-vs-placed-anchor',
	'label-vs-placed-witness',
	'label-vs-placed-dim',
	'own-anchor-vs-placed',
	'own-dim-vs-placed',
	'label-vs-anchor-zone',
	'off-canvas',
]);

/** The five filters whose rejection sliding the label along the dim line
 *  can fix. All five are position filters; shape filters cannot be helped
 *  by sliding. */
export const SLIDE_ELIGIBLE_FILTERS: ReadonlySet<Clearance_Filter> = new Set<Clearance_Filter>([
	'silhouette',
	'label-vs-label',
	'label-vs-placed-anchor',
	'label-vs-placed-witness',
	'label-vs-placed-dim',
]);

/** Runs the DIMENSION-LEVEL checks (currently just duplicate-text).
 *  Returns the first failure, or `{ok: true}` when all pass. Pure.
 *  The live path calls this once per (part, axis) — the first thing
 *  before any side, edge, uniface index, or label position is considered. */
export function evaluate_dimension_clearances(in_: Clearance_Inputs): Clearance_Result {
	const text = in_.candidate_dimension_text;
	const axis = in_.candidate_dimension_axis;
	const placed = in_.placed_dimensions;
	if (text !== undefined && axis !== undefined && placed !== undefined) {
		for (const p of placed) {
			if (p.text === text && p.axis === axis) {
				return { ok: false, filter: 'duplicate-text', shortfall_px: 1 };
			}
		}
	}
	return { ok: true };
}

/** True when two three-dimensional line segments coincide — they share
 *  the same infinite line (parallel and collinear) AND their lengths
 *  overlap along that line. Distances below `tolerance` are treated as
 *  zero. Pure. */
export function segments_coincide_3d(
	a_start: [number, number, number], a_end: [number, number, number],
	b_start: [number, number, number], b_end: [number, number, number],
	tolerance: number,
): boolean {
	const ax = a_end[0] - a_start[0], ay = a_end[1] - a_start[1], az = a_end[2] - a_start[2];
	const bx = b_end[0] - b_start[0], by = b_end[1] - b_start[1], bz = b_end[2] - b_start[2];
	const a_len = Math.hypot(ax, ay, az);
	const b_len = Math.hypot(bx, by, bz);
	if (a_len < tolerance || b_len < tolerance) return false;
	// Parallel test — the absolute dot equals the product of magnitudes
	// only when the two directions are parallel (same or opposite).
	const dot = ax * bx + ay * by + az * bz;
	if (Math.abs(Math.abs(dot) - a_len * b_len) > tolerance * Math.max(a_len, b_len)) return false;
	// Collinear test — the offset from a_start to b_start must be parallel
	// to a, i.e. their cross product has near-zero magnitude.
	const dx = b_start[0] - a_start[0], dy = b_start[1] - a_start[1], dz = b_start[2] - a_start[2];
	const cx = ay * dz - az * dy;
	const cy = az * dx - ax * dz;
	const cz = ax * dy - ay * dx;
	const cross_mag = Math.hypot(cx, cy, cz);
	if (cross_mag / a_len > tolerance) return false;
	// Overlap test — project b's endpoints onto a's parameter line and
	// see whether [t_lo, t_hi] intersects [0, 1].
	const inv_len_sq = 1 / (a_len * a_len);
	const t_b_start = (dx * ax + dy * ay + dz * az) * inv_len_sq;
	const t_b_end = (
		(b_end[0] - a_start[0]) * ax +
		(b_end[1] - a_start[1]) * ay +
		(b_end[2] - a_start[2]) * az
	) * inv_len_sq;
	const t_lo = Math.min(t_b_start, t_b_end);
	const t_hi = Math.max(t_b_start, t_b_end);
	if (t_hi < 0 || t_lo > 1) return false;
	return true;
}

/** Runs the three SHAPE checks (edge-on plane, witness-overlaps-placed,
 *  own-witness-convergence). Returns the first failure, or `{ok: true}`
 *  when all pass. Pure. The live path calls this once per (edge, side,
 *  uniface index) before entering the per-position loop. */
export function evaluate_shape_clearances(in_: Clearance_Inputs): Clearance_Result {
	if (in_.plane_camera_dot !== undefined) {
		const threshold = in_.edge_on_threshold ?? k.dimensions.EDGE_ON_DOT_THRESHOLD;
		if (Math.abs(in_.plane_camera_dot) < threshold) {
			return { ok: false, filter: 'edge-on-plane', shortfall_px: 1 };
		}
	}
	if (in_.candidate_witness_world_segments !== undefined && in_.placed_witness_world_segments !== undefined) {
		const tol = in_.witness_world_tolerance ?? 0.001;
		for (const [c_start, c_end] of in_.candidate_witness_world_segments) {
			for (const [p_start, p_end] of in_.placed_witness_world_segments) {
				if (segments_coincide_3d(c_start, c_end, p_start, p_end, tol)) {
					return { ok: false, filter: 'witness-overlaps-placed', shortfall_px: 1 };
				}
			}
		}
	}
	const wd = min_distance_between_segments_2d(
		in_.candidate_edge_p1_screen, in_.candidate_anchor_1,
		in_.candidate_edge_p2_screen, in_.candidate_anchor_2,
	);
	if (wd < in_.silhouette_margin_px) {
		return { ok: false, filter: 'own-witness-convergence', shortfall_px: in_.silhouette_margin_px - wd };
	}
	return { ok: true };
}

/** Runs the seven POSITION checks (silhouette + label-vs-* + own-anchor +
 *  own-dim). Returns the first failure. Pure. Re-called for every label
 *  position the search tries; the slide-and-retry wraps this function. */
export function evaluate_position_clearances(in_: Clearance_Inputs): Clearance_Result {
	const {
		candidate_label_rect: rect,
		candidate_anchor_1: a1,
		candidate_anchor_2: a2,
		silhouette,
		placed_label_rects,
		placed_anchors,
		placed_witness_segments,
		placed_dim_segments,
		pair_clearance_px,
		silhouette_margin_px,
	} = in_;
	// Spec rule 3.5 — off-canvas exclusion. Every drawn mark of the
	// dimensional has to sit inside the canvas; any candidate with a mark
	// outside is dropped. Marks per the lexicon: witness lines, dim line,
	// label rect (with the renderer's padding), and the witness extension
	// past each anchor. Skipped when the caller does not supply canvas
	// dimensions (tests).
	if (in_.canvas_w !== undefined && in_.canvas_h !== undefined) {
		const cw = in_.canvas_w;
		const ch = in_.canvas_h;
		const e1 = in_.candidate_edge_p1_screen;
		const e2 = in_.candidate_edge_p2_screen;
		const w1_dx = a1.x - e1.x, w1_dy = a1.y - e1.y;
		const w1_len = Math.hypot(w1_dx, w1_dy);
		const w1_ux = w1_len > 1e-9 ? w1_dx / w1_len : 0;
		const w1_uy = w1_len > 1e-9 ? w1_dy / w1_len : 0;
		const w2_dx = a2.x - e2.x, w2_dy = a2.y - e2.y;
		const w2_len = Math.hypot(w2_dx, w2_dy);
		const w2_ux = w2_len > 1e-9 ? w2_dx / w2_len : 0;
		const w2_uy = w2_len > 1e-9 ? w2_dy / w2_len : 0;
		const w1_past = { x: a1.x + w1_ux * 10, y: a1.y + w1_uy * 10 };
		const w2_past = { x: a2.x + w2_ux * 10, y: a2.y + w2_uy * 10 };
		const pts = [
			e1, e2, a1, a2, w1_past, w2_past,
			{ x: rect.x_min - 2, y: rect.y_min - 1 },
			{ x: rect.x_max + 2, y: rect.y_min - 1 },
			{ x: rect.x_max + 2, y: rect.y_max + 1 },
			{ x: rect.x_min - 2, y: rect.y_max + 1 },
		];
		let bb_x_min = Infinity, bb_x_max = -Infinity, bb_y_min = Infinity, bb_y_max = -Infinity;
		for (const p of pts) {
			if (p.x < bb_x_min) bb_x_min = p.x;
			if (p.x > bb_x_max) bb_x_max = p.x;
			if (p.y < bb_y_min) bb_y_min = p.y;
			if (p.y > bb_y_max) bb_y_max = p.y;
		}
		const shortfall = Math.max(0 - bb_x_min, 0 - bb_y_min, bb_x_max - cw, bb_y_max - ch);
		if (shortfall > 0) {
			return { ok: false, filter: 'off-canvas', shortfall_px: shortfall };
		}
	}
	// Silhouette clearance (rule 6). The silhouette is the six-sided
	// projected outline of the silhouette box on screen, NOT the axis-
	// aligned rectangle around it — the rectangle would over-reject
	// labels sitting in the empty corners between the polygon and its
	// bounding rectangle. The clearance can be set independently of the
	// other pair/anchor/witness margins; when zero, a label may touch
	// the polygon from outside but is still rejected when it crosses
	// inside (the rect-intersects test catches that case even at zero).
	const sil_clearance = in_.silhouette_clearance_px ?? silhouette_margin_px;
	const sil_gap = distance_from_rect_to_convex_polygon_2d(rect, silhouette);
	const intersects_sil = (sil_gap === 0) && rect_intersects_convex_polygon_2d(rect, silhouette);
	if (sil_gap < sil_clearance) {
		return { ok: false, filter: 'silhouette', shortfall_px: sil_clearance - sil_gap };
	}
	if (intersects_sil) {
		return { ok: false, filter: 'silhouette', shortfall_px: 1 };
	}
	// Pair clearance (rule 5): label vs every placed label.
	for (const placed of placed_label_rects) {
		const d = distance_between_rectangles_2d(rect, placed);
		if (d < pair_clearance_px) {
			return { ok: false, filter: 'label-vs-label', shortfall_px: pair_clearance_px - d };
		}
	}
	// Filter 3 (rule 19): label rect vs every previously placed witness
	// anchor at PAIR_CLEARANCE_PX.
	for (const pa of placed_anchors) {
		const a_rect: Rect_2d = { x_min: pa.x, x_max: pa.x, y_min: pa.y, y_max: pa.y };
		const d = distance_between_rectangles_2d(rect, a_rect);
		if (d < pair_clearance_px) {
			return { ok: false, filter: 'label-vs-placed-anchor', shortfall_px: pair_clearance_px - d };
		}
	}
	// Filter 5 (rule 19) DISABLED pending visual review: label rect vs
	// every previously placed witness line at PAIR_CLEARANCE_PX. Removed
	// to let more candidates survive; the label box paints solid white
	// over any witness line that passes behind it. If the layout reads
	// poorly, uncomment.
	// for (const [sa, sb] of placed_witness_segments) {
	// 	const d = distance_from_rect_to_segment_2d(rect, sa, sb);
	// 	if (d < pair_clearance_px) {
	// 		return { ok: false, filter: 'label-vs-placed-witness', shortfall_px: pair_clearance_px - d };
	// 	}
	// }
	void placed_witness_segments;
	// Filter 6 (rule 19): label rect vs every previously placed dim line
	// at PAIR_CLEARANCE_PX.
	for (const [sa, sb] of placed_dim_segments) {
		const d = distance_from_rect_to_segment_2d(rect, sa, sb);
		if (d < pair_clearance_px) {
			return { ok: false, filter: 'label-vs-placed-dim', shortfall_px: pair_clearance_px - d };
		}
	}
	// Filter 7 (rule 7): the candidate's own anchors and dim line clear
	// every previously placed label rectangle by at least pair_clearance_px.
	// The previously-placed-anchor comparison was dropped per the rule update.
	const own_anchor_rects: Rect_2d[] = [a1, a2].map(p =>
		({ x_min: p.x, x_max: p.x, y_min: p.y, y_max: p.y }));
	for (const own_a_rect of own_anchor_rects) {
		for (const placed of placed_label_rects) {
			const d = distance_between_rectangles_2d(own_a_rect, placed);
			if (d < pair_clearance_px) {
				return { ok: false, filter: 'own-anchor-vs-placed', shortfall_px: pair_clearance_px - d };
			}
		}
	}
	for (const placed of placed_label_rects) {
		const d = distance_from_rect_to_segment_2d(placed, a1, a2);
		if (d < pair_clearance_px) {
			return { ok: false, filter: 'own-dim-vs-placed', shortfall_px: pair_clearance_px - d };
		}
	}
	// Step 3.2 — label-position forbidden range (PENDING rule 32a).
	// The candidate label rectangle must NOT overlap a 20-pixel zone
	// extending along the dim line BEFORE OR AFTER each witness anchor
	// in (a) the candidate's own two anchors (measured along the
	// candidate's own dim line) AND (b) every already-placed label's two
	// anchors (each measured along that placed label's own dim line).
	// NOT slide-eligible — sliding the candidate moves it relative to
	// the same anchors that gate it.
	const ZONE_PX = k.dimensions.WITNESS_ANCHOR_BUFFER_PX;  // 20 px today.
	const check_anchor_zone = (
		anchor: { x: number; y: number },
		dim_start: { x: number; y: number },
		dim_end: { x: number; y: number },
	): boolean => {
		const dx = dim_end.x - dim_start.x;
		const dy = dim_end.y - dim_start.y;
		const len = Math.hypot(dx, dy);
		if (len < 1e-9) return false;
		const ux = dx / len;
		const uy = dy / len;
		const zone_start = { x: anchor.x - ux * ZONE_PX, y: anchor.y - uy * ZONE_PX };
		const zone_end   = { x: anchor.x + ux * ZONE_PX, y: anchor.y + uy * ZONE_PX };
		return distance_from_rect_to_segment_2d(rect, zone_start, zone_end) === 0;
	};
	// (a) Candidate's own anchors along the candidate's own dim line.
	if (check_anchor_zone(a1, a1, a2) || check_anchor_zone(a2, a1, a2)) {
		return { ok: false, filter: 'label-vs-anchor-zone', shortfall_px: 1 };
	}
	// (b) Every already-placed dim line's two endpoints (anchors) along
	// that dim line's own direction.
	for (const [pa1, pa2] of placed_dim_segments) {
		if (check_anchor_zone(pa1, pa1, pa2) || check_anchor_zone(pa2, pa1, pa2)) {
			return { ok: false, filter: 'label-vs-anchor-zone', shortfall_px: 1 };
		}
	}
	return { ok: true };
}

/** Convenience wrapper — runs the dimension, shape, and position checks
 *  in sequence. Returns the first failure. Equivalent to the pre-split
 *  single-function pipeline. Kept for tests and any caller that wants
 *  one-call semantics. Pure. */
export function evaluate_clearances(in_: Clearance_Inputs): Clearance_Result {
	const dim = evaluate_dimension_clearances(in_);
	if (!dim.ok) return dim;
	const shape = evaluate_shape_clearances(in_);
	if (!shape.ok) return shape;
	return evaluate_position_clearances(in_);
}

/** Boolean wrapper kept for backward compatibility. Returns true when the
 *  candidate passes every clearance check. Pure. */
export function candidate_passes_clearances(in_: Clearance_Inputs): boolean {
	return evaluate_clearances(in_).ok;
}

/** True when a point lies inside or on the boundary of a convex polygon
 *  whose vertices are listed in a consistent (clockwise or counter-
 *  clockwise) order. Returns false for degenerate polygons. Pure. */
export function point_in_convex_polygon_2d(
	p: { x: number; y: number },
	polygon: ReadonlyArray<{ x: number; y: number }>,
): boolean {
	if (polygon.length < 3) return false;
	let sign = 0;
	for (let i = 0; i < polygon.length; i++) {
		const a = polygon[i];
		const b = polygon[(i + 1) % polygon.length];
		const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
		if (cross === 0) continue;
		const this_sign = cross > 0 ? 1 : -1;
		if (sign === 0) sign = this_sign;
		else if (this_sign !== sign) return false;
	}
	return true;
}

/** True when an axis-aligned rectangle and a convex polygon share any
 *  point (corner of rect inside polygon, vertex of polygon inside rect,
 *  or any pair of edges crossing). Pure. */
export function rect_intersects_convex_polygon_2d(
	rect: Rect_2d,
	polygon: ReadonlyArray<{ x: number; y: number }>,
): boolean {
	if (polygon.length < 3) return false;
	const rect_corners = [
		{ x: rect.x_min, y: rect.y_min },
		{ x: rect.x_max, y: rect.y_min },
		{ x: rect.x_max, y: rect.y_max },
		{ x: rect.x_min, y: rect.y_max },
	];
	for (const c of rect_corners) if (point_in_convex_polygon_2d(c, polygon)) return true;
	for (const v of polygon) {
		if (v.x >= rect.x_min && v.x <= rect.x_max && v.y >= rect.y_min && v.y <= rect.y_max) return true;
	}
	for (let i = 0; i < polygon.length; i++) {
		const pa = polygon[i];
		const pb = polygon[(i + 1) % polygon.length];
		for (let j = 0; j < 4; j++) {
			const ra = rect_corners[j];
			const rb = rect_corners[(j + 1) % 4];
			if (segments_intersect_2d(pa, pb, ra, rb)) return true;
		}
	}
	return false;
}

/** Minimum distance in pixels between an axis-aligned rectangle and a
 *  convex polygon. Returns zero when they intersect. Otherwise scans every
 *  rectangle corner against every polygon edge and every polygon vertex
 *  against every rectangle edge, returning the smallest distance found.
 *  Pure. */
export function distance_from_rect_to_convex_polygon_2d(
	rect: Rect_2d,
	polygon: ReadonlyArray<{ x: number; y: number }>,
): number {
	if (rect_intersects_convex_polygon_2d(rect, polygon)) return 0;
	let min_d = Infinity;
	const rect_corners = [
		{ x: rect.x_min, y: rect.y_min },
		{ x: rect.x_max, y: rect.y_min },
		{ x: rect.x_max, y: rect.y_max },
		{ x: rect.x_min, y: rect.y_max },
	];
	for (const c of rect_corners) {
		for (let i = 0; i < polygon.length; i++) {
			const a = polygon[i];
			const b = polygon[(i + 1) % polygon.length];
			const d = distance_point_to_segment_2d(c, a, b);
			if (d < min_d) min_d = d;
		}
	}
	for (const v of polygon) {
		for (let j = 0; j < 4; j++) {
			const a = rect_corners[j];
			const b = rect_corners[(j + 1) % 4];
			const d = distance_point_to_segment_2d(v, a, b);
			if (d < min_d) min_d = d;
		}
	}
	return min_d;
}

/** Closed-form minimum distance, in pixels, between two line segments in
 *  2D. Returns zero when the segments cross. Otherwise returns the smaller
 *  of the four endpoint-to-other-segment distances (the closest pair is
 *  always at one of these). No sampling, no approximation. Pure. */
export function min_distance_between_segments_2d(
	a1: { x: number; y: number }, a2: { x: number; y: number },
	b1: { x: number; y: number }, b2: { x: number; y: number },
): number {
	if (segments_intersect_2d(a1, a2, b1, b2)) return 0;
	return Math.min(
		distance_point_to_segment_2d(a1, b1, b2),
		distance_point_to_segment_2d(a2, b1, b2),
		distance_point_to_segment_2d(b1, a1, a2),
		distance_point_to_segment_2d(b2, a1, a2),
	);
}

/** Perpendicular distance from a point to a line segment in 2D. When the
 *  perpendicular projection falls outside the segment, returns the
 *  distance to the nearer endpoint instead. Returns the point-to-endpoint
 *  distance when the segment is degenerate. Pure. */
export function distance_point_to_segment_2d(
	p: { x: number; y: number },
	a: { x: number; y: number },
	b: { x: number; y: number },
): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const len_sq = dx * dx + dy * dy;
	if (len_sq < 1e-12) return Math.hypot(p.x - a.x, p.y - a.y);
	const raw_t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len_sq;
	const t = Math.max(0, Math.min(1, raw_t));
	const cx = a.x + t * dx;
	const cy = a.y + t * dy;
	return Math.hypot(p.x - cx, p.y - cy);
}

/** True when two open line segments share an interior point. Parallel
 *  segments return false (they are handled by the endpoint-distance
 *  check in the caller). Pure. */
export function segments_intersect_2d(
	a: { x: number; y: number }, b: { x: number; y: number },
	c: { x: number; y: number }, d: { x: number; y: number },
): boolean {
	const rx = b.x - a.x, ry = b.y - a.y;
	const sx = d.x - c.x, sy = d.y - c.y;
	const denom = rx * sy - ry * sx;
	if (Math.abs(denom) < 1e-12) return false;
	const t = ((c.x - a.x) * sy - (c.y - a.y) * sx) / denom;
	const u = ((c.x - a.x) * ry - (c.y - a.y) * rx) / denom;
	return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

/** Distance, in pixels, from an axis-aligned rectangle to a line segment.
 *  Returns 0 when the segment passes through the rectangle or touches it.
 *  Computed by sampling the segment at evenly spaced points and taking the
 *  minimum point-to-rectangle distance. Eleven samples are enough to keep
 *  approximation error well under one pixel for typical screen-pixel
 *  segments. Pure. */
export function distance_from_rect_to_segment_2d(
	rect: Rect_2d,
	seg_a: { x: number; y: number },
	seg_b: { x: number; y: number },
): number {
	const SAMPLES = 11;
	let min_d = Infinity;
	for (let i = 0; i < SAMPLES; i++) {
		const t = i / (SAMPLES - 1);
		const px = seg_a.x + (seg_b.x - seg_a.x) * t;
		const py = seg_a.y + (seg_b.y - seg_a.y) * t;
		const point_rect: Rect_2d = { x_min: px, x_max: px, y_min: py, y_max: py };
		const d = distance_between_rectangles_2d(rect, point_rect);
		if (d < min_d) min_d = d;
		if (min_d === 0) return 0;
	}
	return min_d;
}

/** Bounding rectangle in screen pixels of a set of 2D points. Returns a
 *  zero-extent rect at the origin for an empty input. Pure. */
export function bounding_rectangle_of_points_2d(points: ReadonlyArray<{ x: number; y: number }>): Rect_2d {
	if (points.length === 0) return { x_min: 0, y_min: 0, x_max: 0, y_max: 0 };
	let x_min =  Infinity, y_min =  Infinity;
	let x_max = -Infinity, y_max = -Infinity;
	for (const p of points) {
		if (p.x < x_min) x_min = p.x;
		if (p.y < y_min) y_min = p.y;
		if (p.x > x_max) x_max = p.x;
		if (p.y > y_max) y_max = p.y;
	}
	return { x_min, y_min, x_max, y_max };
}

/** Perpendicular distance, in 2D, from a point to the infinite line
 *  through two other points. Returns the distance to the first line
 *  endpoint when the two line endpoints coincide (degenerate line).
 *  Pure; used by the screen-pixel "closest uniface to the edge" picker. */
export function distance_from_point_to_line_2d(
	point: { x: number; y: number },
	line_p1: { x: number; y: number },
	line_p2: { x: number; y: number },
): number {
	const dx = line_p2.x - line_p1.x;
	const dy = line_p2.y - line_p1.y;
	const len_sq = dx * dx + dy * dy;
	if (len_sq < 1e-12) {
		const px = point.x - line_p1.x;
		const py = point.y - line_p1.y;
		return Math.hypot(px, py);
	}
	// Cross-product magnitude over line length gives the perpendicular distance.
	const cross = (line_p2.x - line_p1.x) * (line_p1.y - point.y)
	            - (line_p1.x - point.x) * (line_p2.y - line_p1.y);
	return Math.abs(cross) / Math.sqrt(len_sq);
}

/** Result of one render of the uniface placement path. Holds the
 *  uniface box plus a per-(object, axis) record of which uniface was
 *  picked at the chosen witness index (1-based). Null in `uniface`
 *  means the picker could not find a viable uniface for that axis of
 *  that SO. The other placement-detail fields (edge, natural label
 *  position, witness index) carry the four placement choices the
 *  rules' rule 2 names. */
export type Placement_Details = {
	uniface                : number | null;
	edge_v1_idx            : number | null;
	edge_v2_idx            : number | null;
	natural_label_position : { x: number; y: number } | null;
	witness_index          : number;
	/** Witness length in screen pixels: the perpendicular distance from
	 *  the edge line to the chosen uniface's anchor. No cap is applied
	 *  (rule 3 / step 3b — interior parts can have arbitrarily long
	 *  witnesses reaching the uniface). Null when no uniface was picked. */
	witness_length_px      : number | null;
	/** Geometry needed to render the pick on the canvas: edge endpoints
	 *  and the two anchors, all in screen pixels. Null when no uniface
	 *  was picked. Step 3c reads these to draw the dim line and the two
	 *  witness lines. */
	edge_p1_screen         : { x: number; y: number } | null;
	edge_p2_screen         : { x: number; y: number } | null;
	anchor_1_screen        : { x: number; y: number } | null;
	anchor_2_screen        : { x: number; y: number } | null;
	/** The formatted dim text the renderer draws inside the white box on
	 *  the dim line (step 3e). Same string the duplicate-text filter
	 *  compares against, so what shows on screen matches what the search
	 *  judged. */
	label_text             : string | null;
	/** True when the main search dropped every candidate and the last-
	 *  resort step placed this dimensional just inside a canvas edge,
	 *  ignoring the silhouette and uniface boxes. The renderer draws it
	 *  the same way; downstream filters keep it even though `uniface` is
	 *  null because its anchors and edges are real screen coordinates. */
	is_last_resort?        : boolean;
};

export type Uniface_Placement_Result = {
	uniface_box: Uniface_Box | null;
	placements: Array<Placement_Details & {
		so_id    : string;
		so_name  : string;
		axis     : Axis_Name;
	}>;
	/** Tighter green outline — convex hull of every projected vertex of
	 *  every qualifying part. Sits inside the silhouette-box outline.
	 *  Drawn in green for diagnostic purposes; the placement code does NOT
	 *  use this shape for any filter or uniface offset. */
	silhouette_polygon_screen: Array<{ x: number; y: number }>;
	/** Wider green outline — convex hull of the silhouette box's eight
	 *  projected corners. This IS the shape the uniface faces are derived
	 *  from, so witness lines end fifteen pixels (times witness index) past
	 *  this outline. Drawn in green so it can be seen alongside the tighter
	 *  hull. */
	silhouette_box_polygon_screen: Array<{ x: number; y: number }>;
};

let last_uniface_placement_result: Uniface_Placement_Result = { uniface_box: null, placements: [], silhouette_polygon_screen: [], silhouette_box_polygon_screen: [] };


/** Last diagnostic output emitted by run_uniface_placement. Used to
 *  suppress repeat logs when the scene state hasn't changed — every
 *  mouse-move re-renders, but the picks and rejection counts are
 *  identical, so logging the same text again is just noise. */
let last_diagnostic_output: string | null = null;

/** Have we sent the very first dimensionals log POST this browser session?
 *  The first POST overwrites the on-disk file; later POSTs append. */
let dispatched_dim_log_fresh: boolean = false;

/** Append one extra line to the dimensionals log file. The renderer uses
 *  this to record what the white label box actually paints — separately
 *  from the placement code's batched per-render block. Always appends
 *  (never the fresh-overwrite first POST), so any subsequent placement
 *  POST appends after these renderer lines. */
export function append_dim_log_line(text: string): void {
	try {
		fetch('http://localhost:5171/log-dimensionals', { method: 'POST', body: text + '\n' }).catch(() => { /* silent */ });
	} catch {
		// silent
	}
}

/** Fire-and-forget POST of one render's diagnostic text to the hub
 *  dispatcher, which writes it to ~/GitHub/mono/logs/dimensionals.log.
 *  Silent on failure (the dispatcher may not be running). */
function dispatch_dim_log_to_file(text: string): void {
	const base = 'http://localhost:5171/log-dimensionals';
	const url = dispatched_dim_log_fresh ? base : `${base}?fresh=1`;
	dispatched_dim_log_fresh = true;
	try {
		fetch(url, { method: 'POST', body: text }).catch(() => { /* silent */ });
	} catch {
		// silent
	}
}

export function get_last_uniface_placement_result(): Uniface_Placement_Result {
	return last_uniface_placement_result;
}

/** One label's chosen values from last render — the four discrete plus one
 *  continuous degree of freedom that fully identify what the search picked.
 *  On the next render, the four viability checks read from these so the
 *  full search can be skipped when the picture is stable.
 *
 *  - `edge_corner_pair_idx` is the index into edge_endpoints_world (0 to 3),
 *    which the part's bounding box generates deterministically each render.
 *    Encoded as an index rather than world-space points because parts move
 *    between renders; the index identifies the corner pair regardless of
 *    where the part has been dragged to.
 *  - `label_position_t` is the fraction along the dim line, 0 at anchor 1,
 *    1 at anchor 2. Survives slide-and-retry because the slid t value is
 *    what gets stored.
 *
 *  Encodes step 3.1 of the uniface proposal AND PENDING rule 2a of the dim
 *  spec. Slice A: storage only — no skip logic, no seeded run, no drift
 *  safety. Those come in slices B, C, D. */
export type Persisted_Label = {
	so_id                : string;
	so_name              : string;
	axis                 : Axis_Name;
	face                 : number;  // 0 to 5 (UNIFACE_FACE_*)
	witness_index        : number;  // 0-based (0 to 3 today; cap is 4)
	edge_corner_pair_idx : number;  // 0 to 3
	// Fraction along the dim line at the time of the original placement:
	// label_pos = anchor_1 + (anchor_2 - anchor_1) * label_position_t. When
	// the slide pre-check fired this fraction sits outside [0, 1] (negative
	// for slid past anchor 1, greater than 1 for slid past anchor 2). The
	// persistence skip path multiplies by the NEW anchor span every render
	// so the slid label tracks tumble.
	label_position_t     : number;
	// True when the original placement was past one of the anchors. Lets
	// the next-render viability check accept t values outside [0, 1] only
	// when this was a known slid placement, not a drifted one.
	was_slid             : boolean;
};

/** Per-(part, axis) persistence record. Key is `${so_id}|${axis}`. Updated
 *  at the end of every successful run of run_uniface_placement: entries are
 *  added or overwritten for parts that picked something, and entries are
 *  pruned for parts that did not pick anything this render (part hidden,
 *  removed from the scene, or had no winning candidate). */
const last_persisted: Map<string, Persisted_Label> = new Map();

/** When false, the placement code does NOT pass canvas dimensions into
 *  the position-filter check, which disables the off-canvas filter
 *  (spec rule 3.5). Used by the test harness — tests run with identity
 *  projection matrices that place every anchor far off the synthetic
 *  canvas; without this flag the filter would reject every candidate.
 *  Production always leaves this true. */
let off_canvas_filter_enabled: boolean = true;
export function set_off_canvas_filter_enabled_for_tests(value: boolean): void {
	off_canvas_filter_enabled = value;
}

/** The dimensions flag value at the end of the previous render. When this
 *  render's flag value differs, the search context has changed (the part
 *  list shrinks or grows by the selection restriction); the lock pass
 *  must NOT reuse last render's placements at their old positions, so the
 *  persistence map is cleared before the search runs. Initialised to a
 *  sentinel so the first render of a session does not falsely trigger a
 *  clear. */
let last_dim_flag_on: boolean | null = null;
/** Identifiers of the parts that were selected at the end of the previous
 *  render. Same purpose as last_dim_flag_on — when the selected set
 *  changes between renders, the lock pass must NOT reuse last render's
 *  placements; the persistence map is cleared so the search starts fresh
 *  from the new selection. */
let last_selected_so_ids_serialised: string = '';

/** Read-only view of the persistence map. Exposed for tests and for the
 *  future slice-B skip path. */
export function get_last_persisted(): ReadonlyMap<string, Persisted_Label> {
	return last_persisted;
}

/** Whether the most recent run_uniface_placement call took the skip path
 *  (returned a result built from the persistence map) rather than running
 *  the full main search loop. Reset to false at the start of every call. */
let last_skip_used: boolean = false;

/** Set of (part, axis) keys that were ELIGIBLE last render — every
 *  rendered leaf's allowed axes, even ones that did not commit a winner.
 *  The skip path uses this to detect changes in the scene: if the current
 *  frame's eligible set differs from last render's, a new part appeared
 *  or an old one became ineligible, and the full search must run. */
const last_eligible_pairs: Set<string> = new Set();

/** Test-only accessor for the skip-path flag. */
export function get_last_skip_used(): boolean {
	return last_skip_used;
}

/** Count of persisted labels the most recent run_uniface_placement call
 *  locked during the seeded run (slice C of step 3.1). Zero on skip-path
 *  renders, zero on the first render, and zero when no persisted entry
 *  passed the strict viability checks against the current frame. */
let last_locked_count: number = 0;

/** Test-only accessor for the seeded-run lock count. */
export function get_last_locked_count(): number {
	return last_locked_count;
}

/** Drift-safety counter (slice D of step 3.1). Counts consecutive skip-
 *  path renders in which at least one label's viability check passed
 *  only by the 5-pixel tolerance — i.e., the check would have failed
 *  under the STRICT version. Reset to zero whenever a skip succeeds with
 *  no tolerance-only passes, OR whenever the full search runs. Reaching
 *  2 forces a full search on the next render to flush accumulated drift. */
let drift_within_tolerance_count: number = 0;

/** Per-render flag — was the most recent skip-path success only possible
 *  because at least one label passed by the 5-pixel tolerance? Slice B
 *  sets this; the post-skip block uses it to update the drift counter. */
let last_skip_drifted: boolean = false;

/** Count of last-resort placements produced by the most recent
 *  run_uniface_placement call. Skip-path bails when this was non-zero
 *  last render, because the persistence map does not record last-resort
 *  placements and re-projecting only persisted entries would lose them. */
let last_resort_count: number = 0;

/** Test-only accessor for the last-resort count. */
export function get_last_resort_count(): number {
	return last_resort_count;
}

/** Test-only accessor for the drift counter. */
export function get_drift_within_tolerance_count(): number {
	return drift_within_tolerance_count;
}

/** Stable key for the persistence map. Same identifier the duplicate-text
 *  drop uses to compare across (part, axis) pairs. */
function persisted_key(so_id: string, axis: Axis_Name): string {
	return `${so_id}|${axis}`;
}

/** Stub orchestrator for the uniface placement path (step 2c).
 *
 *  Gathers every rendered leaf object, builds the uniface box, and
 *  for each (object, axis) at witness index 1 calls the picker.
 *  Records the result for diagnostics. Does NOT yet emit anything the
 *  renderer consumes — when the flag is on and this runs, no dim lines
 *  draw. That intentional blank is the visual diff against the old
 *  path. */
export function run_uniface_placement(): Uniface_Placement_Result {
	last_skip_used = false;
	last_locked_count = 0;
	last_skip_drifted = false;
	const previous_last_resort_count = last_resort_count;
	last_resort_count = 0;
	const all_objects = scene.get_all();
	// Camera looking direction expressed in the room's static (untumbled)
	// axes. Read once per render; reused by the edge-on filter for every
	// (axis, side) combination the search visits.
	const cam_dir_in_room = vec3.create();
	{
		const orient_inv = quat.create();
		quat.invert(orient_inv, stores.current_orientation());
		vec3.transformQuat(cam_dir_in_room, vec3.fromValues(0, 0, -1), orient_inv);
	}
	const visible = new Set<O_Scene>();
	for (const o of all_objects) if (is_visible_for_dim(o)) visible.add(o);
	const has_visible_child = (obj: O_Scene): boolean => {
		for (const other of all_objects) {
			if (other.parent === obj && visible.has(other)) return true;
		}
		return false;
	};
	// All visible leaves. Used to build the silhouette box and the uniface
	// box — only leaf parts contribute (rule 9 / silhouette membership), so
	// container parts do not inflate the silhouette past the painted
	// geometry of their children.
	const all_visible_leaves: O_Scene[] = [];
	for (const obj of all_objects) {
		if (!visible.has(obj)) continue;
		if (has_visible_child(obj)) continue;
		all_visible_leaves.push(obj);
	}
	// Parts the placement search actually dimensions — every visible part,
	// not just leaves. A parent part with visible children gets its own
	// dim lines for its bounding box. The "leaves only" filter above is
	// for the silhouette (rule 9), not for which parts get dimensioned.
	// The root smart object IS excluded — it is the scene container, not
	// a real part. The duplicate-text drop sorts these by depth-from-root
	// first, so a parent wins over its child when their dim text agrees.
	const depth_from_root = (obj: O_Scene): number => {
		let depth = 0;
		let cursor: O_Scene | undefined = obj.parent;
		while (cursor) { depth++; cursor = cursor.parent; }
		return depth;
	};
	// Eligibility per the spec (chapter 2): visible AND below the root AND
	// (the dimensions toggle is on OR this part is selected). When the
	// toggle is off and a part is selected, the search runs ONLY for the
	// selected part — the renderer would not draw the rest anyway.
	const dim_flag_on = stores.show_dimensionals;
	const selected_so_ids = new Set(selection.all.map(h => h.so.id));
	const selected_names_for_log = selection.all.map(h => h.so.name).join(', ') || '(none)';
	const total_visible_below_root = all_objects.filter(o => visible.has(o) && !!o.parent).length;
	const rendered_leaves: O_Scene[] = all_objects.filter(o =>
		visible.has(o)
		&& !!o.parent
		&& (dim_flag_on || selected_so_ids.has(o.so.id)),
	);
	// Diagnostic message for the eligibility filter. Pushed into the main
	// diagnostic-log buffer below once the buffer is constructed. Kept as a
	// string here so the message survives until then.
	const eligibility_log_line = `[uniface placement] eligibility filter: dimensions flag = ${dim_flag_on ? 'on' : 'off'}, selected parts = [${selected_names_for_log}], kept ${rendered_leaves.length} of ${total_visible_below_root} visible parts below the root.`;
	// Context-change check. When the dimensions flag flips OR the selection
	// changes, the part list shrinks or grows; the lock pass would otherwise
	// reuse previous placements at their old positions, making the toggle
	// look like nothing happened to the selected part. Clear the persistence
	// map so the search starts fresh from the new context.
	const selected_so_ids_serialised = [...selected_so_ids].sort().join(',');
	const context_changed =
		(last_dim_flag_on !== null && last_dim_flag_on !== dim_flag_on)
		|| last_selected_so_ids_serialised !== selected_so_ids_serialised;
	if (context_changed) {
		last_persisted.clear();
		last_eligible_pairs.clear();
		if (k.debug.diagnose_dims) console.log(`[uniface placement] context change — dimensions flag or selection changed since last render; persistence cleared.`);
	}
	last_dim_flag_on = dim_flag_on;
	last_selected_so_ids_serialised = selected_so_ids_serialised;
	rendered_leaves.sort((a, b) => {
		const da = depth_from_root(a), db = depth_from_root(b);
		if (da !== db) return da - db;
		return a.so.name.localeCompare(b.so.name);
	});
	// Silhouette box: per the lexicon, only parts that are fully on
	// screen (every corner inside the canvas after tumble plus projection)
	// contribute. When the set is empty (heavy zoom — nothing qualifies),
	// the silhouette stays empty and downstream code switches to the
	// last-resort step: drop the silhouette-clearance check and place
	// each remaining dimensional just inside the canvas edge that gives
	// the shortest witness lines.
	const fully_visible_leaves = all_visible_leaves.filter(is_fully_visible_on_screen);
	const silhouette_empty = fully_visible_leaves.length === 0;
	const uniface_box = build_uniface_box_for_scene(fully_visible_leaves);
	if (k.debug.diagnose_dims) {
		console.log(`[uniface placement] silhouette source — ${fully_visible_leaves.length} of ${all_visible_leaves.length} visible parts have all eight corners inside the canvas`);
	}

	// Project the six face centers of the uniface box at witness index 1
	// to screen pixels. Excluded faces (null shift) project to null and
	// are never chosen by the picker. Box corners live in the static room
	// frame, so we project through the root tumble matrix to land on the
	// same screen pixels the parts draw at.
	const enum_idx = 0;
	const sb = uniface_box.silhouette;
	const cx = (sb.min[0] + sb.max[0]) / 2;
	const cy = (sb.min[1] + sb.max[1]) / 2;
	const cz = (sb.min[2] + sb.max[2]) / 2;
	const row = uniface_box.shifts[enum_idx] ?? [];
	const tumble = compute_root_tumble_matrix();
	const project_screen = (w: vec3) => render.project_vertex(w, tumble);
	const face_center_world = (i: number, s: number): vec3 => {
		switch (i) {
			case UNIFACE_FACE_POS_X: return vec3.fromValues(sb.max[0] + s, cy, cz);
			case UNIFACE_FACE_NEG_X: return vec3.fromValues(sb.min[0] - s, cy, cz);
			case UNIFACE_FACE_POS_Y: return vec3.fromValues(cx, sb.max[1] + s, cz);
			case UNIFACE_FACE_NEG_Y: return vec3.fromValues(cx, sb.min[1] - s, cz);
			case UNIFACE_FACE_POS_Z: return vec3.fromValues(cx, cy, sb.max[2] + s);
			default                : return vec3.fromValues(cx, cy, sb.min[2] - s); // UNIFACE_FACE_NEG_Z
		}
	};
	const face_centers_screen: ({ x: number; y: number } | null)[] = [];
	for (let i = 0; i < 6; i++) {
		const s = row[i];
		if (s === null || s === undefined) {
			face_centers_screen.push(null);
			continue;
		}
		const p = project_screen(face_center_world(i, s));
		face_centers_screen.push({ x: p.x, y: p.y });
	}

	// Silhouette rect on screen: bounding box of the eight projected
	// corners of the silhouette box. Used to reject candidate placements
	// whose label rectangle would sit entirely inside the silhouette.
	// When the silhouette source is empty (heavy zoom — no part has all
	// eight corners on the canvas), the polygon is empty. Every helper
	// that consumes it returns "no overlap" / Infinity for an empty
	// polygon, so the silhouette-clearance filter is implicitly skipped.
	const silhouette_corners_screen: { x: number; y: number }[] = [];
	if (!silhouette_empty) {
		for (let xi = 0; xi < 2; xi++) {
			for (let yi = 0; yi < 2; yi++) {
				for (let zi = 0; zi < 2; zi++) {
					const cw = vec3.fromValues(
						xi === 0 ? sb.min[0] : sb.max[0],
						yi === 0 ? sb.min[1] : sb.max[1],
						zi === 0 ? sb.min[2] : sb.max[2],
					);
					const p = project_screen(cw);
					silhouette_corners_screen.push({ x: p.x, y: p.y });
				}
			}
		}
	}
	const silhouette_polygon = silhouette_empty ? [] : convex_hull(silhouette_corners_screen);

	// Diagnostic green outline: convex hull of every projected vertex of
	// every qualifying part. Tighter than the projected silhouette box
	// (which uses synthetic max-of-each-axis corners) so the outline hugs
	// the qualifying parts and stops covering non-qualifying parts on
	// screen. Visualization only — the silhouette filter above still uses
	// the silhouette box for label rejection so that placement behavior
	// does not change with this diagnostic.
	const qualifying_parts_corners_screen: { x: number; y: number }[] = [];
	if (!silhouette_empty) {
		for (const obj_q of fully_visible_leaves) {
			const wm_q = render.get_static_world_matrix(obj_q);
			for (const local_v_q of obj_q.so.vertices) {
				const world_v_q = vec3.create();
				vec3.transformMat4(world_v_q, local_v_q, wm_q);
				const p_q = project_screen(world_v_q);
				qualifying_parts_corners_screen.push({ x: p_q.x, y: p_q.y });
			}
		}
	}
	const qualifying_parts_hull_screen = qualifying_parts_corners_screen.length > 0
		? convex_hull(qualifying_parts_corners_screen)
		: [];

	// Label sizes from the dim-text formatter — same recipe the old path
	// uses today: format the numeric value with the current unit system
	// and precision, then measure the rendered text in canvas pixels.
	const LABEL_H_PX = 12 + 2;
	if (render.ctx) render.ctx.font = '12px sans-serif';
	const measure_label_width = (value: number): number => {
		if (!render.ctx) return 40;
		const text = units.format_for_system(value, Units.current_unit_system(), stores.current_precision);
		return render.ctx.measureText(text).width + 4;
	};

	// Rectangles of labels already picked this render. Used for the
	// label-vs-label clearance check (rule 5, fifteen pixels).
	const placed_label_rects: Rect_2d[] = [];
	/** Parallel to placed_label_rects — a human label for each placed
	 *  rectangle so the diagnostic can name the offender on a
	 *  label-vs-label rejection. */
	const placed_label_owners: string[] = [];
	// Per-pick obstacles already on screen this render. Each new
	// candidate's label rectangle must clear all of these by at least
	// SILHOUETTE_MARGIN_PX (rule 6).
	const placed_anchors: Array<{ x: number; y: number }> = [];
	const placed_witness_segments: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];
	// Same two witness lines per picked dim, but in three-dimensional
	// world coordinates. Read by the shape-level
	// witness-overlaps-placed filter.
	const placed_witness_world_segments: Array<[[number, number, number], [number, number, number]]> = [];
	const placed_dim_segments: Array<[{ x: number; y: number }, { x: number; y: number }]> = [];

	const POSITION_SAMPLES = [0.5, 0.3, 0.7, 0.15, 0.85];
	const CENTERING_PENALTY_AT_ANCHOR  = 20;
	const WITNESS_LENGTH_WEIGHT        = 1;   // each screen pixel of witness reduces the score by this much.
	const WITNESS_INSIDE_SILHOUETTE_WEIGHT = 200;  // score points per percentage of witness length inside the silhouette polygon (averaged over the two witnesses). Camera-zoom-independent.
	const SCREEN_ROOM_WEIGHT           = 2;   // each screen pixel of empty canvas room past the candidate's anchor midpoint (along the outward perpendicular) raises the score by this much. Outweighs the witness-length penalty so the direction with more empty space on screen wins, even when its witness is longer.
	const canvas_w_for_score = render.logical_size.width;
	const canvas_h_for_score = render.logical_size.height;
	// Silhouette centroid on screen — used to choose which side of the dim
	// line points "outward" for the screen-room reward.
	const silhouette_center_x = silhouette_polygon.length > 0
		? silhouette_polygon.reduce((s, p) => s + p.x, 0) / silhouette_polygon.length
		: canvas_w_for_score / 2;
	const silhouette_center_y = silhouette_polygon.length > 0
		? silhouette_polygon.reduce((s, p) => s + p.y, 0) / silhouette_polygon.length
		: canvas_h_for_score / 2;
	const NUM_WITNESS_INDICES = uniface_box.shifts.length;

	const placements: Uniface_Placement_Result['placements'] = [];
	// Slice A of step 3.1 — set of persistence-map keys touched this
	// render. After the main loop, every key in last_persisted that is
	// NOT in this set gets pruned (its part is no longer rendered or
	// no longer picked anything).
	const seen_persisted_keys: Set<string> = new Set();
	const axes: Axis_Name[] = ['x', 'y', 'z'];
	// Hovered part — read once per render. Used to gate the verbose
	// per-dimension diagnostic AND to record sample failing candidates.
	const hovered_so_id_for_diag = hits_3d.hover?.so?.id ?? hits_3d.hovered_uniface_placement?.so_id ?? null;
	// Already-picked (text, axis) pairs from earlier dimensions this
	// render. The duplicate-text filter reads this to reject a new
	// dimension whose label text and axis match one already kept.
	const placed_dimensions: Array<{ text: string; axis: 'x' | 'y' | 'z' }> = [];
	// Diagnostic counters — printed once at the end of the function.
	let diagnostic_total = 0;
	let diagnostic_with_any_candidate = 0;
	let diagnostic_with_winner = 0;
	const diagnostic_rejection_counts: Map<Clearance_Filter, number> = new Map();
	const diagnostic_log_buffer: string[] = [];
	// First line of every diagnostic block — the eligibility filter's view
	// of the world: which dimensions flag, which selection, how many parts
	// it kept. Stable across mouse-move renders only if the flag and
	// selection are stable, so the suppression check naturally re-emits
	// the log when either changes.
	diagnostic_log_buffer.push(eligibility_log_line);
	// Step 3d counters — one per ported old-path filter so the
	// end-of-render summary names exactly how many parts each filter
	// removed and which parts those were.
	let diagnostic_repeater_dropped_parts = 0;
	let diagnostic_repeater_dropped_axes = 0;
	const diagnostic_repeater_dropped_names: string[] = [];
	let diagnostic_null_picks_removed = 0;
	// When any part is hovered, log the silhouette six-sided shape's
	// screen vertices once — needed to interpret sample-rect coordinates
	// of failing candidates below.
	if (hovered_so_id_for_diag !== null) {
		const poly_str = silhouette_polygon
			.map(p => `(${Math.round(p.x)},${Math.round(p.y)})`)
			.join(' → ');
		diagnostic_log_buffer.push(`[uniface placement] silhouette six-sided shape on screen: ${poly_str}`);
	}
	// ─── Rule 19 witness-index vote (step 3g) ─────────────────────────
	// Phase 1: look at every (part, axis, direction, witness index)
	// combination in isolation and record whether any position passes
	// the candidate-vs-itself and candidate-vs-silhouette filters. Cross-
	// part filters do NOT run here — the running placed-things state is
	// empty by design. The records feed the vote that picks the two
	// witness indices to keep per direction. The main loop below then
	// runs the full filter pipeline restricted to the winning candidates.
	const SWEEP_SIDE_NORMAL: readonly vec3[] = [
		vec3.fromValues( 1, 0, 0),
		vec3.fromValues(-1, 0, 0),
		vec3.fromValues(0,  1, 0),
		vec3.fromValues(0, -1, 0),
		vec3.fromValues(0, 0,  1),
		vec3.fromValues(0, 0, -1),
	];
	const SWEEP_ANCHOR_WORLD = (face_idx: number, edge_end: vec3, s: number): vec3 => {
		const w = vec3.create();
		const sbs = uniface_box.silhouette;
		if      (face_idx === UNIFACE_FACE_POS_X) vec3.set(w, sbs.max[0] + s, edge_end[1], edge_end[2]);
		else if (face_idx === UNIFACE_FACE_NEG_X) vec3.set(w, sbs.min[0] - s, edge_end[1], edge_end[2]);
		else if (face_idx === UNIFACE_FACE_POS_Y) vec3.set(w, edge_end[0], sbs.max[1] + s, edge_end[2]);
		else if (face_idx === UNIFACE_FACE_NEG_Y) vec3.set(w, edge_end[0], sbs.min[1] - s, edge_end[2]);
		else if (face_idx === UNIFACE_FACE_POS_Z) vec3.set(w, edge_end[0], edge_end[1], sbs.max[2] + s);
		else                                       vec3.set(w, edge_end[0], edge_end[1], sbs.min[2] - s);
		return w;
	};
	const candidate_viability: Map<string, Set<string>> = new Map();
	for (const obj of rendered_leaves) {
		const c = classify_so(obj);
		if (!c.eligible) continue;
		const wm_static_s = render.get_static_world_matrix(obj);
		const bb_min_s = vec3.create();
		const bb_max_s = vec3.create();
		vec3.transformMat4(bb_min_s, vec3.fromValues(obj.so.x_min, obj.so.y_min, obj.so.z_min), wm_static_s);
		vec3.transformMat4(bb_max_s, vec3.fromValues(obj.so.x_max, obj.so.y_max, obj.so.z_max), wm_static_s);
		for (const axis of axes) {
			if (!c.axes_allowed.includes(axis)) continue;
			const part_axis_key = `${obj.so.id}|${axis}`;
			const edge_endpoints_world_s: Array<[vec3, vec3]> = [];
			if (axis === 'x') {
				for (const yp of [bb_min_s[1], bb_max_s[1]]) for (const zp of [bb_min_s[2], bb_max_s[2]]) {
					edge_endpoints_world_s.push([vec3.fromValues(bb_min_s[0], yp, zp), vec3.fromValues(bb_max_s[0], yp, zp)]);
				}
			} else if (axis === 'y') {
				for (const xp of [bb_min_s[0], bb_max_s[0]]) for (const zp of [bb_min_s[2], bb_max_s[2]]) {
					edge_endpoints_world_s.push([vec3.fromValues(xp, bb_min_s[1], zp), vec3.fromValues(xp, bb_max_s[1], zp)]);
				}
			} else {
				for (const xp of [bb_min_s[0], bb_max_s[0]]) for (const yp of [bb_min_s[1], bb_max_s[1]]) {
					edge_endpoints_world_s.push([vec3.fromValues(xp, yp, bb_min_s[2]), vec3.fromValues(xp, yp, bb_max_s[2])]);
				}
			}
			const dim_value_s = axis === 'x' ? obj.so.width : axis === 'y' ? obj.so.depth : obj.so.height;
			const label_w_px_s = measure_label_width(dim_value_s);
			const edge_dir_world_s: vec3 = axis === 'x' ? vec3.fromValues(1, 0, 0)
				: axis === 'y' ? vec3.fromValues(0, 1, 0)
				: vec3.fromValues(0, 0, 1);
			for (let wi_s = 0; wi_s < NUM_WITNESS_INDICES; wi_s++) {
				const shifts_row_s = uniface_box.shifts[wi_s];
				if (!shifts_row_s) continue;
				for (const [edge_w_p1_s, edge_w_p2_s] of edge_endpoints_world_s) {
					const ep1s = project_screen(edge_w_p1_s);
					const ep2s = project_screen(edge_w_p2_s);
					const e1s = { x: ep1s.x, y: ep1s.y };
					const e2s = { x: ep2s.x, y: ep2s.y };
					for (const face_idx_s of UNIFACE_CANDIDATES_PER_AXIS[axis]) {
						const candidate_key = `${face_idx_s}|${wi_s}`;
						if (candidate_viability.get(part_axis_key)?.has(candidate_key)) continue;
						const ss = shifts_row_s[face_idx_s];
						if (ss === null || ss === undefined) continue;
						const pnorm = vec3.create();
						vec3.cross(pnorm, edge_dir_world_s, SWEEP_SIDE_NORMAL[face_idx_s]);
						vec3.normalize(pnorm, pnorm);
						const pcd = Math.abs(vec3.dot(pnorm, cam_dir_in_room));
						const a1ws = SWEEP_ANCHOR_WORLD(face_idx_s, edge_w_p1_s, ss);
						const a2ws = SWEEP_ANCHOR_WORLD(face_idx_s, edge_w_p2_s, ss);
						const a1ps = project_screen(a1ws);
						const a2ps = project_screen(a2ws);
						const a1s = { x: a1ps.x, y: a1ps.y };
						const a2s = { x: a2ps.x, y: a2ps.y };
						const sweep_shape: Clearance_Inputs = {
							candidate_label_rect    : { x_min: 0, x_max: 0, y_min: 0, y_max: 0 },
							candidate_anchor_1      : a1s,
							candidate_anchor_2      : a2s,
							candidate_edge_p1_screen: e1s,
							candidate_edge_p2_screen: e2s,
							silhouette              : silhouette_polygon,
							placed_label_rects      : [],
							placed_anchors          : [],
							placed_witness_segments : [],
							placed_dim_segments     : [],
							pair_clearance_px       : k.dimensions.PAIR_CLEARANCE_PX,
							silhouette_margin_px    : k.dimensions.SILHOUETTE_MARGIN_PX,
							plane_camera_dot        : pcd,
							candidate_witness_world_segments: [
								[[edge_w_p1_s[0], edge_w_p1_s[1], edge_w_p1_s[2]], [a1ws[0], a1ws[1], a1ws[2]]],
								[[edge_w_p2_s[0], edge_w_p2_s[1], edge_w_p2_s[2]], [a2ws[0], a2ws[1], a2ws[2]]],
							],
							placed_witness_world_segments: [],
						};
						const sres = evaluate_shape_clearances(sweep_shape);
						if (!sres.ok) continue;
						let any_pos_ok = false;
						for (const t of POSITION_SAMPLES) {
							const cxsv = a1s.x + (a2s.x - a1s.x) * t;
							const cysv = a1s.y + (a2s.y - a1s.y) * t;
							const rect_s: Rect_2d = {
								x_min: cxsv - label_w_px_s / 2,
								x_max: cxsv + label_w_px_s / 2,
								y_min: cysv - LABEL_H_PX / 2,
								y_max: cysv + LABEL_H_PX / 2,
							};
							const pos_in: Clearance_Inputs = {
								...sweep_shape,
								candidate_label_rect: rect_s,
								silhouette_clearance_px: 0,
							};
							const pres = evaluate_position_clearances(pos_in);
							if (pres.ok) { any_pos_ok = true; break; }
						}
						if (any_pos_ok) {
							if (!candidate_viability.has(part_axis_key)) candidate_viability.set(part_axis_key, new Set());
							candidate_viability.get(part_axis_key)!.add(candidate_key);
						}
					}
				}
			}
		}
	}
	// Phase 2 & 3 — count parts viable at each (direction, witness index)
	// candidate, then keep the two witness indices with the highest counts
	// per direction. A direction with zero viable parts has no winners.
	const candidate_count = tally_candidate_counts_for_vote(candidate_viability);
	const winners_per_face = pick_top_two_witness_indices_per_face(candidate_count, NUM_WITNESS_INDICES);
	const VOTE_SIDE_NAMES: Record<number, string> = {
		[UNIFACE_FACE_POS_X]: 'RIGHT',
		[UNIFACE_FACE_NEG_X]: 'LEFT',
		[UNIFACE_FACE_POS_Y]: 'FRONT',
		[UNIFACE_FACE_NEG_Y]: 'BACK',
		[UNIFACE_FACE_POS_Z]: 'TOP',
		[UNIFACE_FACE_NEG_Z]: 'BOTTOM',
	};
	const vote_log_lines: string[] = [
		`[uniface vote] witness-index counts per direction (parts that found a position viable in isolation):`,
	];
	for (let face_idx_v = 0; face_idx_v < 6; face_idx_v++) {
		const counts_str = Array.from({ length: NUM_WITNESS_INDICES }, (_, wi) =>
			`wi${wi + 1}=${candidate_count.get(`${face_idx_v}|${wi}`) ?? 0}`,
		).join(' ');
		const winners_str = [...(winners_per_face.get(face_idx_v) ?? [])].sort((a, b) => a - b).map(w => `wi${w + 1}`).join(', ') || 'none';
		vote_log_lines.push(`  ${VOTE_SIDE_NAMES[face_idx_v].padEnd(6)}: ${counts_str}   winners: ${winners_str}`);
	}
	diagnostic_log_buffer.push(vote_log_lines.join('\n'));
	// Counter for the end-of-render summary: how many candidates the
	// main loop below skipped because their (direction, witness index)
	// candidate lost the vote.
	let diagnostic_vote_skipped = 0;
	// ─── Slice B of step 3.1 — persistence skip path ──────────────────
	// After the vote and BEFORE the main loop, check whether every
	// persisted (part, axis) entry can be re-projected from the current
	// frame and passes the four viability checks. If yes, build a result
	// from the re-projected entries and return early — the main loop is
	// skipped this render. If any check fails or the eligible set
	// differs from last render's persisted set, fall through to the
	// main loop. PENDING rule 2a of dim.spec.
	const try_skip = (): Uniface_Placement_Result | null => {
		if (last_persisted.size === 0) return null;
		if (last_eligible_pairs.size === 0) return null;
		// Last render produced last-resort placements; the persistence map
		// does not record them, so re-projecting only persisted entries would
		// lose them. Force a full search so the last-resort step runs again.
		if (previous_last_resort_count > 0) {
			if (k.debug.diagnose_dims) console.log(`[uniface placement] skip path bailed — last render produced ${previous_last_resort_count} last-resort placement(s) that the persistence map does not carry; forcing a full search.`);
			return null;
		}
		// Slice D — drift safety. Two prior renders skipped only by the
		// 5-pixel tolerance; force a full search this render to flush.
		if (drift_within_tolerance_count >= 2) {
			if (k.debug.diagnose_dims) console.log(`[uniface placement] drift safety — forcing a full search after two skips that passed only by the 5-pixel tolerance.`);
			return null;
		}
		// Eligibility set this render. The skip path bails when the
		// current eligible set differs from last render's — a new part
		// appeared, a part became ineligible, or repeater axes changed.
		const eligible_pairs: Array<{ obj: O_Scene; axis: Axis_Name }> = [];
		const eligible_keys_now: Set<string> = new Set();
		for (const obj_e of rendered_leaves) {
			const c_e = classify_so(obj_e);
			if (!c_e.eligible) continue;
			for (const ax_e of c_e.axes_allowed) {
				eligible_pairs.push({ obj: obj_e, axis: ax_e });
				eligible_keys_now.add(persisted_key(obj_e.so.id, ax_e));
			}
		}
		if (eligible_keys_now.size !== last_eligible_pairs.size) return null;
		for (const k of eligible_keys_now) {
			if (!last_eligible_pairs.has(k)) return null;
		}
		// Build the re-project list — only the (part, axis) pairs that
		// have a persisted entry. Eligible pairs without one had no winner
		// last render; same-scene assumption says they still have no
		// winner this render and stay absent from the result.
		const persisted_pairs = eligible_pairs.filter(p =>
			last_persisted.has(persisted_key(p.obj.so.id, p.axis)),
		);
		if (persisted_pairs.length === 0) return null;
		if (persisted_pairs.length !== last_persisted.size) return null;
		// Re-project every persisted entry from the current frame.
		type Reproj = {
			so_id: string; so_name: string; axis: Axis_Name;
			face: number; witness_index: number;
			edge_p1_screen: { x: number; y: number }; edge_p2_screen: { x: number; y: number };
			anchor_1: { x: number; y: number }; anchor_2: { x: number; y: number };
			label_pos: { x: number; y: number }; label_rect: Rect_2d;
			label_text: string;
			witness_length_px: number; dim_len_px: number;
			label_position_t: number;
			was_slid: boolean;
		};
		const reproj: Reproj[] = [];
		for (const p of persisted_pairs) {
			const entry = last_persisted.get(persisted_key(p.obj.so.id, p.axis))!;
			const wm = render.get_static_world_matrix(p.obj);
			const bb_min_r = vec3.create();
			const bb_max_r = vec3.create();
			vec3.transformMat4(bb_min_r, vec3.fromValues(p.obj.so.x_min, p.obj.so.y_min, p.obj.so.z_min), wm);
			vec3.transformMat4(bb_max_r, vec3.fromValues(p.obj.so.x_max, p.obj.so.y_max, p.obj.so.z_max), wm);
			const edges_r: Array<[vec3, vec3]> = [];
			if (p.axis === 'x') {
				for (const yp of [bb_min_r[1], bb_max_r[1]]) for (const zp of [bb_min_r[2], bb_max_r[2]]) {
					edges_r.push([vec3.fromValues(bb_min_r[0], yp, zp), vec3.fromValues(bb_max_r[0], yp, zp)]);
				}
			} else if (p.axis === 'y') {
				for (const xp of [bb_min_r[0], bb_max_r[0]]) for (const zp of [bb_min_r[2], bb_max_r[2]]) {
					edges_r.push([vec3.fromValues(xp, bb_min_r[1], zp), vec3.fromValues(xp, bb_max_r[1], zp)]);
				}
			} else {
				for (const xp of [bb_min_r[0], bb_max_r[0]]) for (const yp of [bb_min_r[1], bb_max_r[1]]) {
					edges_r.push([vec3.fromValues(xp, yp, bb_min_r[2]), vec3.fromValues(xp, yp, bb_max_r[2])]);
				}
			}
			if (entry.edge_corner_pair_idx < 0 || entry.edge_corner_pair_idx >= edges_r.length) return null;
			const [edge_w_p1_r, edge_w_p2_r] = edges_r[entry.edge_corner_pair_idx];
			const shifts_row_r = uniface_box.shifts[entry.witness_index];
			if (!shifts_row_r) return null;
			const s_r = shifts_row_r[entry.face];
			if (s_r === null || s_r === undefined) return null;
			const sb_r = uniface_box.silhouette;
			const anchor_world_r = (edge_end: vec3): vec3 => {
				const w = vec3.create();
				if      (entry.face === UNIFACE_FACE_POS_X) vec3.set(w, sb_r.max[0] + s_r, edge_end[1], edge_end[2]);
				else if (entry.face === UNIFACE_FACE_NEG_X) vec3.set(w, sb_r.min[0] - s_r, edge_end[1], edge_end[2]);
				else if (entry.face === UNIFACE_FACE_POS_Y) vec3.set(w, edge_end[0], sb_r.max[1] + s_r, edge_end[2]);
				else if (entry.face === UNIFACE_FACE_NEG_Y) vec3.set(w, edge_end[0], sb_r.min[1] - s_r, edge_end[2]);
				else if (entry.face === UNIFACE_FACE_POS_Z) vec3.set(w, edge_end[0], edge_end[1], sb_r.max[2] + s_r);
				else                                         vec3.set(w, edge_end[0], edge_end[1], sb_r.min[2] - s_r);
				return w;
			};
			const a1_w_r = anchor_world_r(edge_w_p1_r);
			const a2_w_r = anchor_world_r(edge_w_p2_r);
			const ep1_r = project_screen(edge_w_p1_r);
			const ep2_r = project_screen(edge_w_p2_r);
			const a1p_r = project_screen(a1_w_r);
			const a2p_r = project_screen(a2_w_r);
			const e1_r = { x: ep1_r.x, y: ep1_r.y };
			const e2_r = { x: ep2_r.x, y: ep2_r.y };
			const a1_r = { x: a1p_r.x, y: a1p_r.y };
			const a2_r = { x: a2p_r.x, y: a2p_r.y };
			const dim_len_r = Math.hypot(a2_r.x - a1_r.x, a2_r.y - a1_r.y);
			if (dim_len_r < 1e-6) return null;
			const dim_value_r = p.axis === 'x' ? p.obj.so.width : p.axis === 'y' ? p.obj.so.depth : p.obj.so.height;
			const label_w_r = measure_label_width(dim_value_r);
			const label_text_r = render.ctx
				? units.format_for_system(dim_value_r, Units.current_unit_system(), stores.current_precision)
				: '';
			const label_pos_r = {
				x: a1_r.x + (a2_r.x - a1_r.x) * entry.label_position_t,
				y: a1_r.y + (a2_r.y - a1_r.y) * entry.label_position_t,
			};
			const label_rect_r: Rect_2d = {
				x_min: label_pos_r.x - label_w_r / 2,
				x_max: label_pos_r.x + label_w_r / 2,
				y_min: label_pos_r.y - LABEL_H_PX / 2,
				y_max: label_pos_r.y + LABEL_H_PX / 2,
			};
			const witness_length_r = distance_from_point_to_line_2d(a1_r, e1_r, e2_r);
			reproj.push({
				so_id: p.obj.so.id, so_name: p.obj.so.name, axis: p.axis,
				face: entry.face, witness_index: entry.witness_index,
				edge_p1_screen: e1_r, edge_p2_screen: e2_r,
				anchor_1: a1_r, anchor_2: a2_r,
				label_pos: label_pos_r, label_rect: label_rect_r,
				label_text: label_text_r,
				witness_length_px: witness_length_r, dim_len_px: dim_len_r,
				label_position_t: entry.label_position_t,
				was_slid: entry.was_slid,
			});
		}
		// Viability check 2 — previous label position within range ± 5 px.
		// Drift safety: track whether ANY label passed only by the
		// 5-pixel tolerance (would have failed the strict [0, 1] check).
		// Slid placements (label intentionally past one anchor) are exempt
		// from the in-range check: their saved fraction stays outside
		// [0, 1] by design.
		const TOLERANCE_PX = 5;
		for (const r of reproj) {
			if (r.was_slid) continue;
			const slack_t = TOLERANCE_PX / r.dim_len_px;
			if (r.label_position_t < -slack_t || r.label_position_t > 1 + slack_t) {
				if (k.debug.diagnose_dims) console.log(`[uniface placement] skip bailed: ${r.so_name} (${r.axis}) label position ${r.label_position_t.toFixed(2)} along the dim line falls outside the new range plus 5-pixel slack.`);
				return null;
			}
			if (r.label_position_t < 0 || r.label_position_t > 1) {
				last_skip_drifted = true;
			}
		}
		// Viability check 3 — every pair of label rectangles clears by pair clearance.
		for (let i = 0; i < reproj.length; i++) {
			for (let j = i + 1; j < reproj.length; j++) {
				const d = distance_between_rectangles_2d(reproj[i].label_rect, reproj[j].label_rect);
				if (d < k.dimensions.PAIR_CLEARANCE_PX) {
					if (k.debug.diagnose_dims) console.log(`[uniface placement] skip bailed: ${reproj[i].so_name} (${reproj[i].axis}) and ${reproj[j].so_name} (${reproj[j].axis}) labels would sit ${d.toFixed(1)} px apart on screen, below the ${k.dimensions.PAIR_CLEARANCE_PX} px pair clearance.`);
					return null;
				}
			}
		}
		// Viability check 4 — the label rectangle does not cross inside
		// the silhouette polygon. Touching from outside is fine — same
		// threshold the main search path's silhouette filter uses
		// (dim.spec rule 26). The proposal originally called for a
		// 15-pixel margin here; that was reconciled to the main-path
		// threshold so a label the search just placed does not
		// immediately fail its own viability check on the next render.
		for (const r of reproj) {
			const d = distance_from_rect_to_convex_polygon_2d(r.label_rect, silhouette_polygon);
			const intersects_sil = (d === 0) && rect_intersects_convex_polygon_2d(r.label_rect, silhouette_polygon);
			if (intersects_sil) {
				if (k.debug.diagnose_dims) console.log(`[uniface placement] skip bailed: ${r.so_name} (${r.axis}) crosses inside the silhouette outline`);
				return null;
			}
		}
		// Viability check 5 — spec rule 3.5 off-canvas exclusion. After
		// tumble, the persisted placement may have moved past a canvas edge.
		// Re-check that every drawn mark of the dimensional still sits
		// inside the canvas; if not, bail to the full search so the new
		// canvas-fit filter can find an on-canvas position.
		if (off_canvas_filter_enabled) {
			const cw = render.logical_size.width;
			const ch = render.logical_size.height;
			for (const r of reproj) {
				const w1_dx = r.anchor_1.x - r.edge_p1_screen.x, w1_dy = r.anchor_1.y - r.edge_p1_screen.y;
				const w1_len = Math.hypot(w1_dx, w1_dy);
				const w1_ux = w1_len > 1e-9 ? w1_dx / w1_len : 0;
				const w1_uy = w1_len > 1e-9 ? w1_dy / w1_len : 0;
				const w2_dx = r.anchor_2.x - r.edge_p2_screen.x, w2_dy = r.anchor_2.y - r.edge_p2_screen.y;
				const w2_len = Math.hypot(w2_dx, w2_dy);
				const w2_ux = w2_len > 1e-9 ? w2_dx / w2_len : 0;
				const w2_uy = w2_len > 1e-9 ? w2_dy / w2_len : 0;
				const w1_past = { x: r.anchor_1.x + w1_ux * 10, y: r.anchor_1.y + w1_uy * 10 };
				const w2_past = { x: r.anchor_2.x + w2_ux * 10, y: r.anchor_2.y + w2_uy * 10 };
				const pts = [
					r.edge_p1_screen, r.edge_p2_screen, r.anchor_1, r.anchor_2, w1_past, w2_past,
					{ x: r.label_rect.x_min - 2, y: r.label_rect.y_min - 1 },
					{ x: r.label_rect.x_max + 2, y: r.label_rect.y_min - 1 },
					{ x: r.label_rect.x_max + 2, y: r.label_rect.y_max + 1 },
					{ x: r.label_rect.x_min - 2, y: r.label_rect.y_max + 1 },
				];
				for (const p of pts) {
					if (p.x < 0 || p.x > cw || p.y < 0 || p.y > ch) {
						if (k.debug.diagnose_dims) console.log(`[uniface placement] skip bailed: ${r.so_name} (${r.axis}) drifted off the canvas after tumble; falling through to the full search.`);
						return null;
					}
				}
			}
		}
		// All five checks passed — build the result.
		const skip_placements: Uniface_Placement_Result['placements'] = [];
		for (const r of reproj) {
			skip_placements.push({
				uniface                : r.face,
				edge_v1_idx            : null,
				edge_v2_idx            : null,
				natural_label_position : r.label_pos,
				witness_index          : r.witness_index + 1,
				witness_length_px      : r.witness_length_px,
				edge_p1_screen         : r.edge_p1_screen,
				edge_p2_screen         : r.edge_p2_screen,
				anchor_1_screen        : r.anchor_1,
				anchor_2_screen        : r.anchor_2,
				label_text             : r.label_text,
				so_id                  : r.so_id,
				so_name                : r.so_name,
				axis                   : r.axis,
			});
		}
		return {
			uniface_box,
			placements: skip_placements,
			silhouette_polygon_screen: qualifying_parts_hull_screen,
			silhouette_box_polygon_screen: silhouette_polygon,
		};
	};
	const skip_result = try_skip();
	if (skip_result !== null) {
		last_skip_used = true;
		last_uniface_placement_result = skip_result;
		// Slice D — drift safety counter. A skip that succeeded only by
		// the 5-pixel tolerance bumps the counter; a clean skip resets it.
		if (last_skip_drifted) {
			drift_within_tolerance_count++;
			if (k.debug.diagnose_dims) console.log(`[uniface placement] skipped, but at least one label passed only by the 5-pixel tolerance; drift count now ${drift_within_tolerance_count}.`);
		} else {
			drift_within_tolerance_count = 0;
			if (k.debug.diagnose_dims) console.log(`[uniface placement] skipped — all ${last_persisted.size} persistent entries still viable`);
		}
		// last_eligible_pairs stays as-is — same scene means same eligible set.
		return skip_result;
	}
	// Slice D — full search clears any accumulated drift.
	drift_within_tolerance_count = 0;
	// ─── Slice C of step 3.1 — seeded run ─────────────────────────────
	// The skip path didn't fire. Re-project every persisted entry and
	// lock the ones that pass the STRICT (no-tolerance) versions of the
	// four viability checks. Locked labels become fixed obstacles before
	// the main loop runs; the free labels search around them.
	const locked_keys: Set<string> = new Set();
	if (last_persisted.size > 0) {
		const entries_sorted = Array.from(last_persisted.values()).sort((a, b) =>
			a.so_name.localeCompare(b.so_name) || a.axis.localeCompare(b.axis),
		);
		for (const entry of entries_sorted) {
			const obj = rendered_leaves.find(o => o.so.id === entry.so_id);
			if (!obj) continue;
			const cls = classify_so(obj);
			if (!cls.eligible) continue;
			if (!cls.axes_allowed.includes(entry.axis)) continue;
			const wm_l = render.get_static_world_matrix(obj);
			const bb_min_l = vec3.create();
			const bb_max_l = vec3.create();
			vec3.transformMat4(bb_min_l, vec3.fromValues(obj.so.x_min, obj.so.y_min, obj.so.z_min), wm_l);
			vec3.transformMat4(bb_max_l, vec3.fromValues(obj.so.x_max, obj.so.y_max, obj.so.z_max), wm_l);
			const edges_l: Array<[vec3, vec3]> = [];
			if (entry.axis === 'x') {
				for (const yp of [bb_min_l[1], bb_max_l[1]]) for (const zp of [bb_min_l[2], bb_max_l[2]]) {
					edges_l.push([vec3.fromValues(bb_min_l[0], yp, zp), vec3.fromValues(bb_max_l[0], yp, zp)]);
				}
			} else if (entry.axis === 'y') {
				for (const xp of [bb_min_l[0], bb_max_l[0]]) for (const zp of [bb_min_l[2], bb_max_l[2]]) {
					edges_l.push([vec3.fromValues(xp, bb_min_l[1], zp), vec3.fromValues(xp, bb_max_l[1], zp)]);
				}
			} else {
				for (const xp of [bb_min_l[0], bb_max_l[0]]) for (const yp of [bb_min_l[1], bb_max_l[1]]) {
					edges_l.push([vec3.fromValues(xp, yp, bb_min_l[2]), vec3.fromValues(xp, yp, bb_max_l[2])]);
				}
			}
			if (entry.edge_corner_pair_idx < 0 || entry.edge_corner_pair_idx >= edges_l.length) continue;
			const [edge_w_p1_l, edge_w_p2_l] = edges_l[entry.edge_corner_pair_idx];
			const shifts_row_l = uniface_box.shifts[entry.witness_index];
			if (!shifts_row_l) continue;
			const s_l = shifts_row_l[entry.face];
			if (s_l === null || s_l === undefined) continue;
			const sb_l = uniface_box.silhouette;
			const anchor_world_l = (edge_end: vec3): vec3 => {
				const w = vec3.create();
				if      (entry.face === UNIFACE_FACE_POS_X) vec3.set(w, sb_l.max[0] + s_l, edge_end[1], edge_end[2]);
				else if (entry.face === UNIFACE_FACE_NEG_X) vec3.set(w, sb_l.min[0] - s_l, edge_end[1], edge_end[2]);
				else if (entry.face === UNIFACE_FACE_POS_Y) vec3.set(w, edge_end[0], sb_l.max[1] + s_l, edge_end[2]);
				else if (entry.face === UNIFACE_FACE_NEG_Y) vec3.set(w, edge_end[0], sb_l.min[1] - s_l, edge_end[2]);
				else if (entry.face === UNIFACE_FACE_POS_Z) vec3.set(w, edge_end[0], edge_end[1], sb_l.max[2] + s_l);
				else                                         vec3.set(w, edge_end[0], edge_end[1], sb_l.min[2] - s_l);
				return w;
			};
			const a1_w_l = anchor_world_l(edge_w_p1_l);
			const a2_w_l = anchor_world_l(edge_w_p2_l);
			const ep1_l = project_screen(edge_w_p1_l);
			const ep2_l = project_screen(edge_w_p2_l);
			const a1p_l = project_screen(a1_w_l);
			const a2p_l = project_screen(a2_w_l);
			const e1_l = { x: ep1_l.x, y: ep1_l.y };
			const e2_l = { x: ep2_l.x, y: ep2_l.y };
			const a1_l = { x: a1p_l.x, y: a1p_l.y };
			const a2_l = { x: a2p_l.x, y: a2p_l.y };
			const dim_len_l = Math.hypot(a2_l.x - a1_l.x, a2_l.y - a1_l.y);
			if (dim_len_l < 1e-6) continue;
			const dim_value_l = entry.axis === 'x' ? obj.so.width : entry.axis === 'y' ? obj.so.depth : obj.so.height;
			const label_w_l = measure_label_width(dim_value_l);
			const label_text_l = render.ctx
				? units.format_for_system(dim_value_l, Units.current_unit_system(), stores.current_precision)
				: '';
			const label_pos_l = {
				x: a1_l.x + (a2_l.x - a1_l.x) * entry.label_position_t,
				y: a1_l.y + (a2_l.y - a1_l.y) * entry.label_position_t,
			};
			const label_rect_l: Rect_2d = {
				x_min: label_pos_l.x - label_w_l / 2,
				x_max: label_pos_l.x + label_w_l / 2,
				y_min: label_pos_l.y - LABEL_H_PX / 2,
				y_max: label_pos_l.y + LABEL_H_PX / 2,
			};
			// STRICT viability check 1 — formerly checked the per-direction
			// winners list. The main search no longer restricts to the
			// winners list, so this check is moot.
			// STRICT viability check 2 — label position strictly in [0, 1].
			// Slid placements (intentionally past one anchor) are exempt:
			// their fraction lives outside [0, 1] by design.
			if (!entry.was_slid && (entry.label_position_t < 0 || entry.label_position_t > 1)) {
				if (k.debug.diagnose_dims) console.log(`[uniface placement] lock skipped: ${entry.so_name} (${entry.axis}) label position ${entry.label_position_t.toFixed(2)} along the dim line is outside the new range. Will run the full search for this dimension.`);
				continue;
			}
			// STRICT viability check 3 — clears every already-locked label by pair clearance.
			let pair_violates_l = false;
			for (let pi = 0; pi < placed_label_rects.length; pi++) {
				const d_pair = distance_between_rectangles_2d(label_rect_l, placed_label_rects[pi]);
				if (d_pair < k.dimensions.PAIR_CLEARANCE_PX) {
					pair_violates_l = true;
					if (k.debug.diagnose_dims) console.log(`[uniface placement] lock skipped: ${entry.so_name} (${entry.axis}) would sit ${d_pair.toFixed(1)} px from an already-locked ${placed_label_owners[pi]}, below the ${k.dimensions.PAIR_CLEARANCE_PX} px pair clearance. Will run the full search for this dimension.`);
					break;
				}
			}
			if (pair_violates_l) continue;
			// STRICT viability check 4 — does not cross inside silhouette.
			const d_sil_l = distance_from_rect_to_convex_polygon_2d(label_rect_l, silhouette_polygon);
			const inside_sil_l = d_sil_l === 0 && rect_intersects_convex_polygon_2d(label_rect_l, silhouette_polygon);
			if (inside_sil_l) {
				if (k.debug.diagnose_dims) console.log(`[uniface placement] lock skipped: ${entry.so_name} (${entry.axis}) crosses inside the silhouette outline. Will run the full search for this dimension.`);
				continue;
			}
			// STRICT viability check 5 — spec rule 3.5 off-canvas exclusion.
			// After tumble, a persisted placement may now poke off canvas.
			// Skip the lock so the full search re-places this dimension
			// under the new canvas-fit filter.
			if (off_canvas_filter_enabled) {
				const cw_l = render.logical_size.width;
				const ch_l = render.logical_size.height;
				const w1_dx_l = a1_l.x - e1_l.x, w1_dy_l = a1_l.y - e1_l.y;
				const w1_len_l = Math.hypot(w1_dx_l, w1_dy_l);
				const w1_ux_l = w1_len_l > 1e-9 ? w1_dx_l / w1_len_l : 0;
				const w1_uy_l = w1_len_l > 1e-9 ? w1_dy_l / w1_len_l : 0;
				const w2_dx_l = a2_l.x - e2_l.x, w2_dy_l = a2_l.y - e2_l.y;
				const w2_len_l = Math.hypot(w2_dx_l, w2_dy_l);
				const w2_ux_l = w2_len_l > 1e-9 ? w2_dx_l / w2_len_l : 0;
				const w2_uy_l = w2_len_l > 1e-9 ? w2_dy_l / w2_len_l : 0;
				const w1_past_l = { x: a1_l.x + w1_ux_l * 10, y: a1_l.y + w1_uy_l * 10 };
				const w2_past_l = { x: a2_l.x + w2_ux_l * 10, y: a2_l.y + w2_uy_l * 10 };
				const off_pts_l = [
					e1_l, e2_l, a1_l, a2_l, w1_past_l, w2_past_l,
					{ x: label_rect_l.x_min - 2, y: label_rect_l.y_min - 1 },
					{ x: label_rect_l.x_max + 2, y: label_rect_l.y_min - 1 },
					{ x: label_rect_l.x_max + 2, y: label_rect_l.y_max + 1 },
					{ x: label_rect_l.x_min - 2, y: label_rect_l.y_max + 1 },
				];
				let off_l = false;
				for (const p of off_pts_l) {
					if (p.x < 0 || p.x > cw_l || p.y < 0 || p.y > ch_l) { off_l = true; break; }
				}
				if (off_l) {
					if (k.debug.diagnose_dims) console.log(`[uniface placement] lock skipped: ${entry.so_name} (${entry.axis}) would draw off canvas after tumble. Will run the full search for this dimension.`);
					continue;
				}
			}
			// All five strict checks pass — LOCK this label.
			const candidate_dim_text_l = label_text_l;
			placed_label_rects.push(label_rect_l);
			placed_label_owners.push(`${obj.so.name} (${entry.axis}=${candidate_dim_text_l}) [locked]`);
			placed_anchors.push(a1_l, a2_l);
			placed_witness_segments.push([e1_l, a1_l], [e2_l, a2_l]);
			placed_dim_segments.push([a1_l, a2_l]);
			placed_dimensions.push({ text: candidate_dim_text_l, axis: entry.axis });
			placed_witness_world_segments.push(
				[[edge_w_p1_l[0], edge_w_p1_l[1], edge_w_p1_l[2]], [a1_w_l[0], a1_w_l[1], a1_w_l[2]]],
				[[edge_w_p2_l[0], edge_w_p2_l[1], edge_w_p2_l[2]], [a2_w_l[0], a2_w_l[1], a2_w_l[2]]],
			);
			const witness_length_l = distance_from_point_to_line_2d(a1_l, e1_l, e2_l);
			placements.push({
				uniface                : entry.face,
				edge_v1_idx            : null,
				edge_v2_idx            : null,
				natural_label_position : label_pos_l,
				witness_index          : entry.witness_index + 1,
				witness_length_px      : witness_length_l,
				edge_p1_screen         : e1_l,
				edge_p2_screen         : e2_l,
				anchor_1_screen        : a1_l,
				anchor_2_screen        : a2_l,
				label_text             : label_text_l,
				so_id                  : entry.so_id,
				so_name                : entry.so_name,
				axis                   : entry.axis,
			});
			seen_persisted_keys.add(persisted_key(entry.so_id, entry.axis));
			locked_keys.add(persisted_key(entry.so_id, entry.axis));
			diagnostic_total++;
			diagnostic_with_any_candidate++;
			diagnostic_with_winner++;
		}
		last_locked_count = locked_keys.size;
		if (k.debug.diagnose_dims && locked_keys.size > 0) {
			console.log(`[uniface placement] seeded run — ${locked_keys.size} of ${last_persisted.size} persisted dimensions locked in place; free dimensions search around them.`);
		}
	}
	// Full search path: record this render's eligible (part, axis) set so
	// next render's skip path can detect a scene change.
	last_eligible_pairs.clear();
	for (const obj of rendered_leaves) {
		// Step 3d filter 1: repeater filter. Clones inside a non-firewall
		// repeater and middle fireblocks inside a firewall repeater get
		// no dim line. Templates and first/last-shortened fireblocks pass
		// — fireblocks only along the repeat axis.
		const classification = classify_so(obj);
		if (!classification.eligible) {
			diagnostic_repeater_dropped_parts++;
			diagnostic_repeater_dropped_names.push(`${obj.so.name} (${classification.kind})`);
			continue;
		}
		for (const ax_p of classification.axes_allowed) {
			last_eligible_pairs.add(persisted_key(obj.so.id, ax_p));
		}
		// Natural label position: projected centroid of the part's
		// static-frame corners. For a box-shaped part this equals the
		// projected midpoint of any axis-spanning edge of the part.
		// Static-frame corners so the seed and the face centers share
		// the same coordinate frame; project_screen applies the tumble.
		const wm = render.get_static_world_matrix(obj);
		let sx = 0, sy = 0, sz = 0, n = 0;
		for (const local_v of obj.so.vertices) {
			const wv = vec3.create();
			vec3.transformMat4(wv, local_v, wm);
			sx += wv[0]; sy += wv[1]; sz += wv[2]; n++;
		}
		const seed = n > 0 ? project_screen(vec3.fromValues(sx / n, sy / n, sz / n)) : null;
		const screen_distance_per_face: number[] = [];
		for (let i = 0; i < 6; i++) {
			const c = face_centers_screen[i];
			if (c === null || seed === null) {
				screen_distance_per_face.push(Infinity);
			} else {
				screen_distance_per_face.push(Math.hypot(c.x - seed.x, c.y - seed.y));
			}
		}
		// Part centroid no longer needed — edges now run between real
		// corner points, not through the centroid. The screen-centroid
		// seed below is still useful for any downstream consumers.
		void sx; void sy; void sz; void n;
		for (const axis of axes) {
			// Step 3d filter 1 continued: a firewalled fireblock gets dim
			// lines only along the repeat axis. Skip every other axis.
			if (!classification.axes_allowed.includes(axis)) {
				diagnostic_repeater_dropped_axes++;
				continue;
			}
			// Slice C of step 3.1 — this (part, axis) was already locked
			// from persistence in the seeded-run pre-pass. Skip the full
			// search for it.
			if (locked_keys.has(persisted_key(obj.so.id, axis))) continue;
			// Dimension-level check FIRST — duplicate-text rejects this
			// whole (part, axis) when another already-picked dimension
			// shows the same text on the same axis. Counts as one
			// rejection in the diagnostic and skips the whole axis.
			const candidate_dim_value = axis === 'x' ? obj.so.width : axis === 'y' ? obj.so.depth : obj.so.height;
			const candidate_dim_text = render.ctx
				? units.format_for_system(candidate_dim_value, Units.current_unit_system(), stores.current_precision)
				: '';
			{
				const dim_check = evaluate_dimension_clearances({
					candidate_label_rect    : { x_min: 0, x_max: 0, y_min: 0, y_max: 0 },
					candidate_anchor_1      : { x: 0, y: 0 },
					candidate_anchor_2      : { x: 0, y: 0 },
					candidate_edge_p1_screen: { x: 0, y: 0 },
					candidate_edge_p2_screen: { x: 0, y: 0 },
					silhouette              : silhouette_polygon,
					placed_label_rects      : [],
					placed_anchors          : [],
					placed_witness_segments : [],
					placed_dim_segments     : [],
					pair_clearance_px       : k.dimensions.PAIR_CLEARANCE_PX,
					silhouette_margin_px    : k.dimensions.SILHOUETTE_MARGIN_PX,
					candidate_dimension_text: candidate_dim_text,
					candidate_dimension_axis: axis,
					placed_dimensions,
				});
				if (!dim_check.ok) {
					diagnostic_total++;
					diagnostic_rejection_counts.set(dim_check.filter, (diagnostic_rejection_counts.get(dim_check.filter) ?? 0) + 1);
					placements.push({
						uniface: null,
						edge_v1_idx: null,
						edge_v2_idx: null,
						natural_label_position: null,
						witness_index: 1,
						witness_length_px: null,
						edge_p1_screen: null,
						edge_p2_screen: null,
						anchor_1_screen: null,
						anchor_2_screen: null,
						label_text: candidate_dim_text,
						so_id   : obj.so.id,
						so_name : obj.so.name,
						axis,
					});
					continue;
				}
			}
			// Enumerate the four real edges of the part along the axis.
			// Each edge sits at one of the four corner (other-two-axes)
			// pairs of the bounding box. The witness lines now start at
			// an actual part edge instead of the centroid line.
			const wm_static = render.get_static_world_matrix(obj);
			const bb_min = vec3.create();
			const bb_max = vec3.create();
			vec3.transformMat4(bb_min, vec3.fromValues(obj.so.x_min, obj.so.y_min, obj.so.z_min), wm_static);
			vec3.transformMat4(bb_max, vec3.fromValues(obj.so.x_max, obj.so.y_max, obj.so.z_max), wm_static);
			const edge_endpoints_world: Array<[vec3, vec3]> = [];
			if (axis === 'x') {
				for (const y_pick of [bb_min[1], bb_max[1]]) for (const z_pick of [bb_min[2], bb_max[2]]) {
					edge_endpoints_world.push([
						vec3.fromValues(bb_min[0], y_pick, z_pick),
						vec3.fromValues(bb_max[0], y_pick, z_pick),
					]);
				}
			} else if (axis === 'y') {
				for (const x_pick of [bb_min[0], bb_max[0]]) for (const z_pick of [bb_min[2], bb_max[2]]) {
					edge_endpoints_world.push([
						vec3.fromValues(x_pick, bb_min[1], z_pick),
						vec3.fromValues(x_pick, bb_max[1], z_pick),
					]);
				}
			} else {
				for (const x_pick of [bb_min[0], bb_max[0]]) for (const y_pick of [bb_min[1], bb_max[1]]) {
					edge_endpoints_world.push([
						vec3.fromValues(x_pick, y_pick, bb_min[2]),
						vec3.fromValues(x_pick, y_pick, bb_max[2]),
					]);
				}
			}
			const dim_value = axis === 'x' ? obj.so.width : axis === 'y' ? obj.so.depth : obj.so.height;
			const label_w_px = measure_label_width(dim_value);

			// Edge direction in static-world coordinates — just the axis
			// being measured. Combined with the side's outward normal it
			// gives the dim's flat plane normal (cross product); the
			// edge-on filter dots that with the camera direction.
			const edge_dir_world: vec3 = axis === 'x' ? vec3.fromValues(1, 0, 0)
				: axis === 'y' ? vec3.fromValues(0, 1, 0)
				: vec3.fromValues(0, 0, 1);
			const SIDE_NORMAL_WORLD: readonly vec3[] = [
				vec3.fromValues( 1, 0, 0),
				vec3.fromValues(-1, 0, 0),
				vec3.fromValues(0,  1, 0),
				vec3.fromValues(0, -1, 0),
				vec3.fromValues(0, 0,  1),
				vec3.fromValues(0, 0, -1),
			];

			// Build per-face world anchors at BOTH edge endpoints (one per
			// edge end). The dim line is between these two anchors; the
			// witness lines go from the edge endpoints to the anchors.
			const sb = uniface_box.silhouette;
			const anchor_world = (face_idx: number, edge_end: vec3, s: number): vec3 => {
				const w = vec3.create();
				if      (face_idx === UNIFACE_FACE_POS_X) vec3.set(w, sb.max[0] + s, edge_end[1], edge_end[2]);
				else if (face_idx === UNIFACE_FACE_NEG_X) vec3.set(w, sb.min[0] - s, edge_end[1], edge_end[2]);
				else if (face_idx === UNIFACE_FACE_POS_Y) vec3.set(w, edge_end[0], sb.max[1] + s, edge_end[2]);
				else if (face_idx === UNIFACE_FACE_NEG_Y) vec3.set(w, edge_end[0], sb.min[1] - s, edge_end[2]);
				else if (face_idx === UNIFACE_FACE_POS_Z) vec3.set(w, edge_end[0], edge_end[1], sb.max[2] + s);
				else                                       vec3.set(w, edge_end[0], edge_end[1], sb.min[2] - s);
				return w;
			};

			// Search: outermost loop over witness indices (cascade on cap),
			// then over each candidate edge of the part, then over candidate
			// faces and sampled positions.
			type Best_Candidate = {
				face: number;
				witness_index: number;
				edge_corner_pair_idx: number;
				label_position_t: number;
				label_pos: { x: number; y: number };
				label_rect: Rect_2d;
				anchor_1: { x: number; y: number };
				anchor_2: { x: number; y: number };
				edge_p1_screen: { x: number; y: number };
				edge_p2_screen: { x: number; y: number };
				edge_p1_world: [number, number, number];
				edge_p2_world: [number, number, number];
				anchor_1_world: [number, number, number];
				anchor_2_world: [number, number, number];
				score: number;
				slid_by_precheck: boolean;
				slid_by_retry: boolean;
			};
			let best: Best_Candidate | null = null;
			// Per-side best-passing candidate, broken into score components.
			// Used only by the diagnostic log after the search completes.
			type Per_Side_Score = {
				score: number;
				between_bonus: number;
				centering_penalty: number;
				witness_length_penalty: number;
				inside_penalty: number;
				screen_room_reward: number;
				witness_index: number;
			};
			const per_side_best: Map<number, Per_Side_Score> = new Map();
			// Per-side filter-rejection counters — count the ORIGINAL
			// rejection per candidate (not the slide-retry rejection).
			// Used by the diagnostic log to name the dominant rejection
			// when a side has no passing candidate.
			const per_side_rejections: Map<number, Map<Clearance_Filter, number>> = new Map();
			// When this part is hovered, store one sample rejected
			// candidate's label rectangle per side, so the diagnostic can
			// show actual screen coordinates the silhouette filter judged.
			const is_hovered_for_samples = hovered_so_id_for_diag !== null && obj.so.id === hovered_so_id_for_diag;
			const per_side_sample_rect: Map<number, Rect_2d> = new Map();
			// Plain-English description of the actual numbers behind one
			// rejected candidate per side, for the hovered part only.
			const per_side_sample_detail: Map<number, string> = new Map();

			for (let wi = 0; wi < NUM_WITNESS_INDICES; wi++) {
				const shifts_row = uniface_box.shifts[wi];
				if (!shifts_row) continue;
				for (let edge_idx = 0; edge_idx < edge_endpoints_world.length; edge_idx++) {
					const [edge_w_p1, edge_w_p2] = edge_endpoints_world[edge_idx];
					const ep1 = project_screen(edge_w_p1);
					const ep2 = project_screen(edge_w_p2);
					const edge_p1_screen = { x: ep1.x, y: ep1.y };
					const edge_p2_screen = { x: ep2.x, y: ep2.y };
					for (const face_idx of UNIFACE_CANDIDATES_PER_AXIS[axis]) {
						const s = shifts_row[face_idx];
						if (s === null || s === undefined) continue;
						// Rule 19 witness-index vote — the popular-uniface-index
						// vote is computed and logged for diagnostics, but the
						// main search is no longer restricted by it: every
						// candidate at every uniface index is considered.
						// Parts that need a less-popular uniface index to fit
						// can use one; the score still naturally prefers
						// shorter witnesses and bigger empty-room rewards.
						// Cross product of edge direction and side outward
						// normal gives the dim's flat plane normal. Dot with
						// the camera direction (both in static-world frame)
						// tells the edge-on filter how close to edge-on this
						// (axis, side) is. Computed once per (axis, side).
						const plane_normal = vec3.create();
						vec3.cross(plane_normal, edge_dir_world, SIDE_NORMAL_WORLD[face_idx]);
						vec3.normalize(plane_normal, plane_normal);
						const plane_camera_dot = Math.abs(vec3.dot(plane_normal, cam_dir_in_room));
						const a1_w = anchor_world(face_idx, edge_w_p1, s);
						const a2_w = anchor_world(face_idx, edge_w_p2, s);
						const a1p = project_screen(a1_w);
						const a2p = project_screen(a2_w);
						const a1 = { x: a1p.x, y: a1p.y };
						const a2 = { x: a2p.x, y: a2p.y };
						const dim_len = Math.hypot(a2.x - a1.x, a2.y - a1.y);
						// Shape checks first — once per (edge, side, uniface index).
						// If either fails, the entire label-position loop is
						// skipped for this combination. Counts as a single
						// rejection in the diagnostic.
						const shape_inputs: Clearance_Inputs = {
							candidate_label_rect    : { x_min: 0, x_max: 0, y_min: 0, y_max: 0 },
							candidate_anchor_1      : a1,
							candidate_anchor_2      : a2,
							candidate_edge_p1_screen: edge_p1_screen,
							candidate_edge_p2_screen: edge_p2_screen,
							silhouette              : silhouette_polygon,
							placed_label_rects      : [],
							placed_anchors          : [],
							placed_witness_segments : [],
							placed_dim_segments     : [],
							pair_clearance_px       : k.dimensions.PAIR_CLEARANCE_PX,
							silhouette_margin_px    : k.dimensions.SILHOUETTE_MARGIN_PX,
							plane_camera_dot        : plane_camera_dot,
							candidate_witness_world_segments: [
								[[edge_w_p1[0], edge_w_p1[1], edge_w_p1[2]], [a1_w[0], a1_w[1], a1_w[2]]],
								[[edge_w_p2[0], edge_w_p2[1], edge_w_p2[2]], [a2_w[0], a2_w[1], a2_w[2]]],
							],
							placed_witness_world_segments   : placed_witness_world_segments,
						};
						const shape_result = evaluate_shape_clearances(shape_inputs);
						if (!shape_result.ok) {
							diagnostic_rejection_counts.set(shape_result.filter, (diagnostic_rejection_counts.get(shape_result.filter) ?? 0) + 1);
							let fc = per_side_rejections.get(face_idx);
							if (!fc) { fc = new Map(); per_side_rejections.set(face_idx, fc); }
							fc.set(shape_result.filter, (fc.get(shape_result.filter) ?? 0) + 1);
							if (is_hovered_for_samples && !per_side_sample_detail.has(face_idx)) {
								if (shape_result.filter === 'edge-on-plane') {
									const angle_deg_from_edge_on = Math.asin(Math.max(0, Math.min(1, plane_camera_dot))) * 180 / Math.PI;
									per_side_sample_detail.set(
										face_idx,
										`plane-vs-camera dot=${plane_camera_dot.toFixed(3)} (about ${angle_deg_from_edge_on.toFixed(1)}° off edge-on; rejected below 10°)`,
									);
								} else if (shape_result.filter === 'own-witness-convergence') {
									const wit_gap = k.dimensions.SILHOUETTE_MARGIN_PX - shape_result.shortfall_px;
									per_side_sample_detail.set(
										face_idx,
										`two witnesses ${wit_gap.toFixed(1)} px apart on screen (rejected below 15 px)`,
									);
								} else if (shape_result.filter === 'witness-overlaps-placed') {
									per_side_sample_detail.set(
										face_idx,
										`a witness lies on the same three-dimensional line as a placed witness`,
									);
								}
							}
							continue;
						}
						for (const t of POSITION_SAMPLES) {
							let cx_s = a1.x + (a2.x - a1.x) * t;
							let cy_s = a1.y + (a2.y - a1.y) * t;
							let did_precheck_slide = false;
							// Rule 18 label slide: if the natural position
							// would have the label box fully cover either
							// arrowhead (anchor + arrow base both inside the
							// rect), slide the label past that witness so the
							// label-vs-label and label-vs-everything-else
							// clearance checks see the FINAL position. This
							// keeps the renderer in sync with placement —
							// renderer reads this same position.
							{
								const ARROW_PX = 6;
								const overhang_px = k.dimensions.SLIDABLE_OVERHANG_PX;
								const half_w = label_w_px / 2;
								const half_h = LABEL_H_PX / 2;
								const dl_len_check = Math.hypot(a2.x - a1.x, a2.y - a1.y);
								if (dl_len_check > 1e-9) {
									const ux_check = (a2.x - a1.x) / dl_len_check;
									const uy_check = (a2.y - a1.y) / dl_len_check;
									const label_center = { x: cx_s, y: cy_s };
									const fully_a1 = does_label_fully_cover_inside_arrow(a1, label_center, ux_check, uy_check, +1, half_w, half_h, ARROW_PX);
									const fully_a2 = does_label_fully_cover_inside_arrow(a2, label_center, ux_check, uy_check, -1, half_w, half_h, ARROW_PX);
									if (fully_a1 || fully_a2) {
										const target = fully_a1 ? a1 : a2;
										const sign_away = fully_a1 ? -1 : +1;
										const shift = half_w + 2 + overhang_px + ARROW_PX;
										cx_s = target.x + sign_away * ux_check * shift;
										cy_s = target.y + sign_away * uy_check * shift;
										did_precheck_slide = true;
									}
								}
							}
							const rect: Rect_2d = {
								x_min: cx_s - label_w_px / 2,
								x_max: cx_s + label_w_px / 2,
								y_min: cy_s - LABEL_H_PX / 2,
								y_max: cy_s + LABEL_H_PX / 2,
							};
							const inputs: Clearance_Inputs = {
								candidate_label_rect     : rect,
								candidate_anchor_1       : a1,
								candidate_anchor_2       : a2,
								candidate_edge_p1_screen : edge_p1_screen,
								candidate_edge_p2_screen : edge_p2_screen,
								silhouette               : silhouette_polygon,
								placed_label_rects,
								placed_anchors,
								placed_witness_segments,
								placed_dim_segments,
								pair_clearance_px        : k.dimensions.PAIR_CLEARANCE_PX,
								silhouette_margin_px     : k.dimensions.SILHOUETTE_MARGIN_PX,
								silhouette_clearance_px  : 0,
								plane_camera_dot         : plane_camera_dot,
								canvas_w                 : off_canvas_filter_enabled ? render.logical_size.width : undefined,
								canvas_h                 : off_canvas_filter_enabled ? render.logical_size.height : undefined,
							};
							const result = evaluate_position_clearances(inputs);
							if (!result.ok) {
								// Count the ORIGINAL rejection per candidate, for the
								// diagnostic. Slide-retry rejections are not counted —
								// we want to know what initially required a slide.
								diagnostic_rejection_counts.set(result.filter, (diagnostic_rejection_counts.get(result.filter) ?? 0) + 1);
								let fc = per_side_rejections.get(face_idx);
								if (!fc) { fc = new Map(); per_side_rejections.set(face_idx, fc); }
								fc.set(result.filter, (fc.get(result.filter) ?? 0) + 1);
								if (is_hovered_for_samples) {
									per_side_sample_rect.set(face_idx, rect);
								}
								if (is_hovered_for_samples) {
									let offender = '';
									if (result.filter === 'label-vs-label') {
										// Find the closest placed label rectangle — the one
										// most plausibly causing this rejection.
										let nearest_d = Infinity;
										let nearest_idx = -1;
										for (let pli = 0; pli < placed_label_rects.length; pli++) {
											const d = distance_between_rectangles_2d(rect, placed_label_rects[pli]);
											if (d < nearest_d) { nearest_d = d; nearest_idx = pli; }
										}
										if (nearest_idx >= 0) {
											offender = `, blocker: ${placed_label_owners[nearest_idx]} at distance ${nearest_d.toFixed(1)} px`;
										}
									}
									per_side_sample_detail.set(
										face_idx,
										`short by ${result.shortfall_px.toFixed(1)} px (filter: ${result.filter})${offender}`,
									);
								}
							}
							// Slide-and-retry: when a label-rectangle filter rejects,
							// shift the label along the dim line by the shortfall plus
							// one pixel and run the check once more on the shifted
							// candidate. Try both directions along the dim line — the
							// shortfall does not say which side the obstacle sits on,
							// so we have to try both to find the direction that moves
							// the label AWAY from it. Filters that involve the
							// candidate's own anchors, dim line, or witnesses cannot
							// be helped by sliding — drop those candidates outright.
							let use_cx = cx_s, use_cy = cy_s, use_rect = rect, use_t = t;
							let did_retry_slide = false;
							if (!result.ok) {
								if (!SLIDE_ELIGIBLE_FILTERS.has(result.filter)) continue;
								if (dim_len < 1e-9) continue;
								const ux = (a2.x - a1.x) / dim_len;
								const uy = (a2.y - a1.y) / dim_len;
								const shift_mag = result.shortfall_px + 1;
								let recovered = false;
								for (const sign of [+1, -1]) {
									const shift = sign * shift_mag;
									const cand_cx = cx_s + ux * shift;
									const cand_cy = cy_s + uy * shift;
									const cand_rect: Rect_2d = {
										x_min: cand_cx - label_w_px / 2,
										x_max: cand_cx + label_w_px / 2,
										y_min: cand_cy - LABEL_H_PX / 2,
										y_max: cand_cy + LABEL_H_PX / 2,
									};
									const retry = evaluate_position_clearances({ ...inputs, candidate_label_rect: cand_rect });
									if (retry.ok) {
										use_cx = cand_cx;
										use_cy = cand_cy;
										use_rect = cand_rect;
										use_t = t + shift / dim_len;
										recovered = true;
										did_retry_slide = true;
										break;
									}
								}
								if (!recovered) continue;
							}
							// Score (rule 19 preferences plus shorter-witness and
							// witness-not-crossing-silhouette preferences).
							const between_bonus = dim_len - label_w_px;
							const norm_off_center = Math.abs(use_t - 0.5) / 0.5;
							const centering_penalty = CENTERING_PENALTY_AT_ANCHOR * norm_off_center * norm_off_center;
							const wlen_1 = Math.hypot(a1.x - edge_p1_screen.x, a1.y - edge_p1_screen.y);
							const wlen_2 = Math.hypot(a2.x - edge_p2_screen.x, a2.y - edge_p2_screen.y);
							const witness_length_penalty = WITNESS_LENGTH_WEIGHT * (wlen_1 + wlen_2) / 2;
							// Penalty proportional to the PERCENT of each witness line
							// that lies INSIDE the silhouette polygon. Each witness
							// is sampled at eleven evenly spaced points; the inside
							// percent (0 to 100) is multiplied by the score weight.
							// Camera-zoom-independent: the absolute pixel count
							// changes with zoom, the percent does not.
							const inside_percent = (a: { x: number; y: number }, b: { x: number; y: number }): number => {
								const SAMPLES = 11;
								let inside_count = 0;
								for (let i = 0; i < SAMPLES; i++) {
									const u = i / (SAMPLES - 1);
									const px = a.x + (b.x - a.x) * u;
									const py = a.y + (b.y - a.y) * u;
									if (point_in_convex_polygon_2d({ x: px, y: py }, silhouette_polygon)) {
										inside_count++;
									}
								}
								return (inside_count / SAMPLES) * 100;
							};
							const inside_penalty = WITNESS_INSIDE_SILHOUETTE_WEIGHT
								* (inside_percent(edge_p1_screen, a1) + inside_percent(edge_p2_screen, a2)) / 2;
							// Screen-room reward. Distance in screen pixels from
							// the candidate's anchor midpoint to the canvas edge,
							// walking along the perpendicular to the dim line that
							// points away from the silhouette center. The
							// direction with more empty canvas space "outward"
							// from the silhouette gets a bigger reward.
							const mid_x_sr = (a1.x + a2.x) / 2;
							const mid_y_sr = (a1.y + a2.y) / 2;
							const dx_sr = a2.x - a1.x, dy_sr = a2.y - a1.y;
							const dim_len_screen_sr = Math.hypot(dx_sr, dy_sr);
							let screen_room_reward = 0;
							if (dim_len_screen_sr > 1e-9) {
								let perp_x = -dy_sr / dim_len_screen_sr;
								let perp_y = dx_sr / dim_len_screen_sr;
								const to_sil_x = silhouette_center_x - mid_x_sr;
								const to_sil_y = silhouette_center_y - mid_y_sr;
								if (perp_x * to_sil_x + perp_y * to_sil_y > 0) {
									perp_x = -perp_x; perp_y = -perp_y;
								}
								let t_to_edge = Infinity;
								if (perp_x > 1e-9) t_to_edge = Math.min(t_to_edge, (canvas_w_for_score - mid_x_sr) / perp_x);
								else if (perp_x < -1e-9) t_to_edge = Math.min(t_to_edge, -mid_x_sr / perp_x);
								if (perp_y > 1e-9) t_to_edge = Math.min(t_to_edge, (canvas_h_for_score - mid_y_sr) / perp_y);
								else if (perp_y < -1e-9) t_to_edge = Math.min(t_to_edge, -mid_y_sr / perp_y);
								if (isFinite(t_to_edge) && t_to_edge > 0) screen_room_reward = SCREEN_ROOM_WEIGHT * t_to_edge;
							}
							const score = between_bonus - centering_penalty - witness_length_penalty - inside_penalty + screen_room_reward;
							if (best === null || score > best.score) {
								best = {
									face: face_idx,
									witness_index: wi,
									edge_corner_pair_idx: edge_idx,
									label_position_t: use_t,
									label_pos: { x: use_cx, y: use_cy },
									label_rect: use_rect,
									anchor_1: a1,
									anchor_2: a2,
									edge_p1_screen,
									edge_p2_screen,
									edge_p1_world : [edge_w_p1[0], edge_w_p1[1], edge_w_p1[2]],
									edge_p2_world : [edge_w_p2[0], edge_w_p2[1], edge_w_p2[2]],
									anchor_1_world: [a1_w[0], a1_w[1], a1_w[2]],
									anchor_2_world: [a2_w[0], a2_w[1], a2_w[2]],
									score,
									slid_by_precheck: did_precheck_slide,
									slid_by_retry   : did_retry_slide,
								};
							}
							const existing = per_side_best.get(face_idx);
							if (existing === undefined || score > existing.score) {
								per_side_best.set(face_idx, {
									score,
									between_bonus,
									centering_penalty,
									witness_length_penalty,
									inside_penalty,
									screen_room_reward,
									witness_index: wi,
								});
							}
						}
					}
				}
				// Examine every uniface-index level. Per Jonathan: the search
				// should NOT stop until it has looked at all eight per-axis
				// (edge, perpendicular direction) candidates AT EVERY index-
				// derived uniface level, then pick the highest score across
				// the whole field.
			}

			const winner = best as Best_Candidate | null;
			if (winner !== null) {
				placed_label_rects.push(winner.label_rect);
				placed_label_owners.push(`${obj.so.name} (${axis}=${candidate_dim_text})`);
				placed_anchors.push(winner.anchor_1, winner.anchor_2);
				placed_witness_segments.push(
					[winner.edge_p1_screen, winner.anchor_1],
					[winner.edge_p2_screen, winner.anchor_2],
				);
				placed_dim_segments.push([winner.anchor_1, winner.anchor_2]);
				placed_dimensions.push({ text: candidate_dim_text, axis });
				placed_witness_world_segments.push(
					[winner.edge_p1_world, winner.anchor_1_world],
					[winner.edge_p2_world, winner.anchor_2_world],
				);
				// Slice A of step 3.1 — record this (part, axis) winner's
				// chosen values in the persistence map. Future renders will
				// read these for the four viability checks (slice B).
				// Compute the actual fraction along the dim line for the
				// final label position. Includes the slide pre-check shift,
				// which the per-sample t value (use_t) does NOT reflect.
				// Negative when slid past anchor 1, > 1 when slid past
				// anchor 2.
				const dx_persist = winner.anchor_2.x - winner.anchor_1.x;
				const dy_persist = winner.anchor_2.y - winner.anchor_1.y;
				const dim_len_sq_persist = dx_persist * dx_persist + dy_persist * dy_persist;
				const actual_t_persist = dim_len_sq_persist > 1e-9
					? ((winner.label_pos.x - winner.anchor_1.x) * dx_persist
					 + (winner.label_pos.y - winner.anchor_1.y) * dy_persist) / dim_len_sq_persist
					: winner.label_position_t;
				const was_slid_persist = actual_t_persist < 0 || actual_t_persist > 1;
				last_persisted.set(persisted_key(obj.so.id, axis), {
					so_id                : obj.so.id,
					so_name              : obj.so.name,
					axis,
					face                 : winner.face,
					witness_index        : winner.witness_index,
					edge_corner_pair_idx : winner.edge_corner_pair_idx,
					label_position_t     : actual_t_persist,
					was_slid             : was_slid_persist,
				});
				seen_persisted_keys.add(persisted_key(obj.so.id, axis));
			}

			// Diagnostic: one log entry per (part, axis) — but only when at least
			// one of the four candidate sides has a passing candidate. The
			// final summary line counts every dimension whether or not it
			// printed an entry. Output is buffered and compared against the
			// previous render's output — same scene state → no log.
			diagnostic_total++;
			if (per_side_best.size > 0) {
				diagnostic_with_any_candidate++;
				if (winner !== null) diagnostic_with_winner++;
			}
			// Print the full per-dimension block ONLY when the part is
			// currently hovered. Everything else stays out of the log;
			// the summary at the end still counts the whole scene.
			const hovered_so_id = hits_3d.hover?.so?.id ?? hits_3d.hovered_uniface_placement?.so_id ?? null;
			const is_hovered_part = hovered_so_id !== null && obj.so.id === hovered_so_id;
			if (is_hovered_part) {
				const SIDE_NAMES_BY_FACE: Record<number, string> = {
					[UNIFACE_FACE_POS_X]: 'RIGHT',
					[UNIFACE_FACE_NEG_X]: 'LEFT',
					[UNIFACE_FACE_POS_Y]: 'FRONT',
					[UNIFACE_FACE_NEG_Y]: 'BACK',
					[UNIFACE_FACE_POS_Z]: 'TOP',
					[UNIFACE_FACE_NEG_Z]: 'BOTTOM',
				};
				const AXIS_LABELS: Record<Axis_Name, string> = { x: 'width', y: 'depth', z: 'height' };
				const winner_side = winner ? SIDE_NAMES_BY_FACE[winner.face] : 'NONE';
				const lines: string[] = [];
				lines.push(`[uniface placement] ${obj.so.name} (${AXIS_LABELS[axis]}): chose ${winner_side}`);
				for (const face_idx of UNIFACE_CANDIDATES_PER_AXIS[axis]) {
					const sname = SIDE_NAMES_BY_FACE[face_idx];
					const s = per_side_best.get(face_idx);
					if (s === undefined) {
						const fc = per_side_rejections.get(face_idx);
						if (fc && fc.size > 0) {
							let total = 0;
							let dominant: Clearance_Filter | null = null;
							let dominant_count = 0;
							for (const [f, c] of fc) {
								total += c;
								if (c > dominant_count) { dominant_count = c; dominant = f; }
							}
							lines.push(`  ${sname.padEnd(6)}: no passing candidate (${total} tried, mostly rejected by ${dominant})`);
							const sample = per_side_sample_rect.get(face_idx);
							if (sample) {
								lines.push(
									`    sample label rectangle on screen: `
									+ `(${Math.round(sample.x_min)},${Math.round(sample.y_min)}) `
									+ `to (${Math.round(sample.x_max)},${Math.round(sample.y_max)})`
								);
							}
							const detail = per_side_sample_detail.get(face_idx);
							if (detail) {
								lines.push(`    why: ${detail}`);
							}
						} else {
							lines.push(`  ${sname.padEnd(6)}: no candidates considered`);
						}
					} else {
						const marker = winner !== null && winner.face === face_idx ? '  <- chosen' : '';
						lines.push(
							`  ${sname.padEnd(6)}: score=${s.score.toFixed(1)}`
							+ ` = fits-between ${s.between_bonus.toFixed(1)}`
							+ ` - off-center ${s.centering_penalty.toFixed(1)}`
							+ ` - line-length ${s.witness_length_penalty.toFixed(1)}`
							+ ` - crosses-design ${s.inside_penalty.toFixed(1)}`
							+ ` + screen-room ${s.screen_room_reward.toFixed(1)}`
							+ ` (witness index ${s.witness_index + 1})${marker}`
						);
					}
				}
				diagnostic_log_buffer.push(lines.join('\n'));
			}

			// Witness length in screen pixels: perpendicular distance from
			// the chosen edge line to the chosen uniface's anchor. No cap
			// is applied — see step 3b in the proposal.
			const witness_length_px = winner
				? distance_from_point_to_line_2d(winner.anchor_1, winner.edge_p1_screen, winner.edge_p2_screen)
				: null;
			// Last-resort step: when the main search dropped every candidate
			// for this (part, axis), pick a shift in mm along one of the
			// two non-measured axes — so the dim line is parallel to the
			// projected (tumbled) part edge — so the projected dimensional
			// fits inside the canvas with ten pixels of clearance. Ignores
			// the silhouette and uniface boxes. Skipped on the duplicate-
			// text drop above, which already pushed its own null-uniface
			// entry and continued.
			let last_resort_geom: Last_Resort_Geometry | null = null;
			if (winner === null) {
				const canvas_w_for_lr = render.logical_size.width;
				const canvas_h_for_lr = render.logical_size.height;
				last_resort_geom = compute_last_resort_placement(
					obj,
					axis,
					label_w_px,
					LABEL_H_PX,
					canvas_w_for_lr,
					canvas_h_for_lr,
					project_screen,
					cam_dir_in_room,
				);
				if (last_resort_geom !== null) {
					last_resort_count++;
					// Last-resort label and lines become obstacles for any
					// later (part, axis) iterations that DO find a winner.
					placed_label_rects.push(last_resort_geom.label_rect);
					placed_label_owners.push(`${obj.so.name} (${axis}=${candidate_dim_text}) [last-resort]`);
					placed_anchors.push(last_resort_geom.anchor_1, last_resort_geom.anchor_2);
					placed_witness_segments.push(
						[last_resort_geom.edge_p1_screen, last_resort_geom.anchor_1],
						[last_resort_geom.edge_p2_screen, last_resort_geom.anchor_2],
					);
					placed_dim_segments.push([last_resort_geom.anchor_1, last_resort_geom.anchor_2]);
					placed_dimensions.push({ text: candidate_dim_text, axis });
					if (k.debug.diagnose_dims) {
						const wl1 = Math.hypot(last_resort_geom.anchor_1.x - last_resort_geom.edge_p1_screen.x, last_resort_geom.anchor_1.y - last_resort_geom.edge_p1_screen.y);
						const wl2 = Math.hypot(last_resort_geom.anchor_2.x - last_resort_geom.edge_p2_screen.x, last_resort_geom.anchor_2.y - last_resort_geom.edge_p2_screen.y);
						const lr = last_resort_geom.label_rect;
						const side = last_resort_geom.is_front ? 'front side' : 'back side';
						console.log(
							`[uniface placement] last-resort placement for ${obj.so.name} (${axis}): shifted ${last_resort_geom.shift_mm.toFixed(1)} mm along the perpendicular (${side}); projected witness lengths ${wl1.toFixed(1)} px and ${wl2.toFixed(1)} px; label rectangle (${Math.round(lr.x_min)},${Math.round(lr.y_min)}) to (${Math.round(lr.x_max)},${Math.round(lr.y_max)}).`,
						);
					}
				} else if (k.debug.diagnose_dims) {
					console.log(`[uniface placement] last-resort placement skipped for ${obj.so.name} (${axis}): no viable shift found among the eight candidates (four edges, two perpendicular directions each).`);
				}
			}
			const has_lr = last_resort_geom !== null;
			placements.push({
				uniface                : winner ? winner.face : null,
				edge_v1_idx            : null,
				edge_v2_idx            : null,
				natural_label_position : winner ? winner.label_pos : (has_lr ? last_resort_geom!.label_pos : null),
				witness_index          : winner ? winner.witness_index + 1 : 1,
				witness_length_px      : winner ? witness_length_px : (has_lr ? last_resort_geom!.witness_length_px : null),
				edge_p1_screen         : winner ? winner.edge_p1_screen : (has_lr ? last_resort_geom!.edge_p1_screen : null),
				edge_p2_screen         : winner ? winner.edge_p2_screen : (has_lr ? last_resort_geom!.edge_p2_screen : null),
				anchor_1_screen        : winner ? winner.anchor_1 : (has_lr ? last_resort_geom!.anchor_1 : null),
				anchor_2_screen        : winner ? winner.anchor_2 : (has_lr ? last_resort_geom!.anchor_2 : null),
				label_text             : candidate_dim_text,
				is_last_resort         : has_lr ? true : undefined,
				so_id   : obj.so.id,
				so_name : obj.so.name,
				axis,
			});
			// One-liner per dimension so the user can see at a glance which
			// dimensions came from the normal search (and at which witness
			// index — lower means closer to the silhouette) and which fell
			// through to the last-resort step.
			if (k.debug.diagnose_dims) {
				if (winner !== null) {
					diagnostic_log_buffer.push(`[uniface placement] ${obj.so.name} (${axis}): normal search, witness index ${winner.witness_index + 1}`);
					// Geometry trace for the winning candidate. Plain-English
					// numbers so the next "label overlaps arrows" report can be
					// answered by reading the log. Distances are measured along
					// the dim line: positive means past the anchor in the
					// outward direction, negative means inside the dim line
					// span (which is where the arrow body sits).
					const dl_dx = winner.anchor_2.x - winner.anchor_1.x;
					const dl_dy = winner.anchor_2.y - winner.anchor_1.y;
					const dl_len = Math.hypot(dl_dx, dl_dy);
					const ux_d = dl_len > 1e-9 ? dl_dx / dl_len : 0;
					const uy_d = dl_len > 1e-9 ? dl_dy / dl_len : 0;
					// Project the label rect corners onto the dim line; the
					// smallest projection from anchor 1 is the rect's inner
					// edge toward anchor 1, the largest is the inner edge
					// toward anchor 2.
					const rect_pts = [
						{ x: winner.label_rect.x_min, y: winner.label_rect.y_min },
						{ x: winner.label_rect.x_max, y: winner.label_rect.y_min },
						{ x: winner.label_rect.x_max, y: winner.label_rect.y_max },
						{ x: winner.label_rect.x_min, y: winner.label_rect.y_max },
					];
					let min_proj_from_a1 =  Infinity;
					let max_proj_from_a1 = -Infinity;
					for (const p of rect_pts) {
						const proj = (p.x - winner.anchor_1.x) * ux_d + (p.y - winner.anchor_1.y) * uy_d;
						if (proj < min_proj_from_a1) min_proj_from_a1 = proj;
						if (proj > max_proj_from_a1) max_proj_from_a1 = proj;
					}
					// Distance from the label rect's NEAREST edge to each
					// anchor, measured along the dim direction. Negative means
					// the rect overhangs past that anchor on the outward side.
					const gap_a1 = min_proj_from_a1;             // a1 is at 0 along dim line
					const gap_a2 = dl_len - max_proj_from_a1;    // a2 is at dl_len along dim line
					const slide_note =
						winner.slid_by_precheck ? 'pre-check (label past one anchor)'
						: winner.slid_by_retry ? 'retry (label shifted within span)'
						: 'no slide (label between anchors)';
					diagnostic_log_buffer.push(
						`    geometry: dim line ${dl_len.toFixed(1)} px, position fraction ${winner.label_position_t.toFixed(2)}, ` +
						`label rect gap from anchor 1 = ${gap_a1.toFixed(1)} px, gap from anchor 2 = ${gap_a2.toFixed(1)} px, ` +
						`slide = ${slide_note}`,
					);
					diagnostic_log_buffer.push(
						`    screen positions: anchor 1 = (${winner.anchor_1.x.toFixed(1)}, ${winner.anchor_1.y.toFixed(1)}), ` +
						`anchor 2 = (${winner.anchor_2.x.toFixed(1)}, ${winner.anchor_2.y.toFixed(1)}), ` +
						`label center = (${winner.label_pos.x.toFixed(1)}, ${winner.label_pos.y.toFixed(1)}), ` +
						`label rect = (${winner.label_rect.x_min.toFixed(1)}, ${winner.label_rect.y_min.toFixed(1)}) to (${winner.label_rect.x_max.toFixed(1)}, ${winner.label_rect.y_max.toFixed(1)})`,
					);
					// Is each anchor inside the label rectangle? If yes, the
					// white box will paint over and erase the arrowhead at
					// that anchor.
					const inside_rect = (p: { x: number; y: number }, r: Rect_2d) =>
						p.x >= r.x_min && p.x <= r.x_max && p.y >= r.y_min && p.y <= r.y_max;
					const a1_inside = inside_rect(winner.anchor_1, winner.label_rect);
					const a2_inside = inside_rect(winner.anchor_2, winner.label_rect);
					diagnostic_log_buffer.push(
						`    anchor 1 inside label rect: ${a1_inside ? 'YES (arrow erased)' : 'no'}, ` +
						`anchor 2 inside label rect: ${a2_inside ? 'YES (arrow erased)' : 'no'}`,
					);
				} else if (has_lr) {
					diagnostic_log_buffer.push(`[uniface placement] ${obj.so.name} (${axis}): last-resort fall back (normal search produced no viable candidate; off-canvas filter and others rejected every candidate)`);
				} else {
					diagnostic_log_buffer.push(`[uniface placement] ${obj.so.name} (${axis}): dropped (no viable candidate from normal search, no last-resort fall back either)`);
				}
			}
		}
	}
	// Step 3d filter 4 (no-viable-pair drop): remove every placement
	// whose search yielded no winning uniface and no last-resort fallback —
	// they have no anchors to draw.
	const placements_with_winner = placements.filter(placement => {
		if (placement.uniface === null && !placement.is_last_resort) {
			diagnostic_null_picks_removed++;
			return false;
		}
		return true;
	});
	{
		const histogram = Array.from(diagnostic_rejection_counts.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([f, c]) => `  ${f}: ${c}`)
			.join('\n');
		const total_rejections = Array.from(diagnostic_rejection_counts.values()).reduce((s, c) => s + c, 0);
		const repeater_names = diagnostic_repeater_dropped_names.length > 0
			? `\n    parts removed by the repeater filter: ${diagnostic_repeater_dropped_names.join(', ')}`
			: '';
		const summary =
			`[uniface placement] summary: ${diagnostic_total} dimensions, ${diagnostic_with_any_candidate} had at least one passing candidate, ${diagnostic_with_winner} were picked`
			+ `\n  step 3d filter drops:`
			+ `\n    repeater filter removed ${diagnostic_repeater_dropped_parts} part(s) and ${diagnostic_repeater_dropped_axes} extra axis sweep(s)${repeater_names}`
			+ `\n    no-viable-pair drop removed ${diagnostic_null_picks_removed} pick(s) with no chosen uniface`
			+ `\n  step 3g witness-index vote: skipped ${diagnostic_vote_skipped} candidate(s) whose witness index lost the per-direction vote`
			+ `\n  rejections by filter (${total_rejections} total across all dimensions):\n${histogram || '  (none)'}`;
		const full_output = diagnostic_log_buffer.length > 0
			? diagnostic_log_buffer.join('\n') + '\n' + summary
			: summary;
		if (full_output !== last_diagnostic_output) {
			last_diagnostic_output = full_output;
			if (k.debug.diagnose_dims) {
				console.log(full_output);
				dispatch_dim_log_to_file(full_output);
			}
		}
	}
	// Slice A of step 3.1 — prune persistence entries for (part, axis)
	// pairs that were not touched this render. A part that disappeared
	// (hidden, removed, or no winner this render) loses its persisted
	// record so the next render does not try to skip on a stale entry.
	for (const key of Array.from(last_persisted.keys())) {
		if (!seen_persisted_keys.has(key)) last_persisted.delete(key);
	}
	last_uniface_placement_result = { uniface_box, placements: placements_with_winner, silhouette_polygon_screen: qualifying_parts_hull_screen, silhouette_box_polygon_screen: silhouette_polygon };
	return last_uniface_placement_result;
}
