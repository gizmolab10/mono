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
/** Step 3h (rule 19): order (part, axis) entries by descending millimetre
 *  measurement, so the biggest dimensions get first pick of each spot and the
 *  smaller ones fit around them or drop. A copy is returned; equal millimetres
 *  keep their incoming order (stable). Pure. */
export function order_part_axis_by_descending_mm<T extends { mm: number }>(entries: readonly T[]): T[] {
	return [...entries].sort((a, b) => b.mm - a.mm);
}

/** Count threshold (spec 4.1). The traverse-and-filter step first produces the
 *  WHOLE list of valid placements (every part-axis that has one), with positions
 *  already fixed. This is the LAST step over that kept list: draw the N largest
 *  by length, plus every always-eligible one (selected part fully in frustum, or
 *  hovered part) — an always-eligible one among the N largest counts as one of
 *  the N; below the cut it draws on top. Moving the slider re-runs only this
 *  step over the same kept list, so nothing repositions. Pure; input order does
 *  not matter (it sorts by length itself). */
export function draw_largest_n<T extends { mm: number; always_eligible: boolean }>(
	entries: readonly T[],
	count: number,
): T[] {
	const sorted = [...entries].sort((a, b) => b.mm - a.mm);
	const kept: T[] = [];
	let n = 0;
	for (const e of sorted) {
		if (n < count) { kept.push(e); n++; continue; }   // among the N largest
		if (e.always_eligible) kept.push(e);              // below the cut, but always drawn
	}
	return kept;
}

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
	const wireframe_mode = option_held && has_hidden;
	if (wireframe_mode) return !obj.so.visible;

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
	| 'own-witness-vs-placed'
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

/** Cross-check for the persistence reuse pass (spec 7). True when this
 *  placement's label rectangle comes within `clearance` px of any already-kept
 *  witness line, OR its own witness lines come within `clearance` px of any
 *  already-kept label rectangle. Mirrors the chapter-5 filters
 *  label-vs-placed-witness and own-witness-vs-placed so a reused placement is
 *  held to the same witness/label clearance the fresh placement algorithm uses.
 *  Pure. */
export function placement_crosses_placed(
	label_rect: Rect_2d,
	own_witnesses: ReadonlyArray<[{ x: number; y: number }, { x: number; y: number }]>,
	kept_label_rects: ReadonlyArray<Rect_2d>,
	kept_witness_segments: ReadonlyArray<[{ x: number; y: number }, { x: number; y: number }]>,
	clearance: number,
): boolean {
	for (const [sa, sb] of kept_witness_segments) {
		if (distance_from_rect_to_segment_2d(label_rect, sa, sb) < clearance) return true;
	}
	for (const rect of kept_label_rects) {
		for (const [wa, wb] of own_witnesses) {
			if (distance_from_rect_to_segment_2d(rect, wa, wb) < clearance) return true;
		}
	}
	return false;
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
	// Filter 5 (rule 19): label rect vs every previously placed witness
	// line at PAIR_CLEARANCE_PX (spec 5.3).
	for (const [sa, sb] of placed_witness_segments) {
		const d = distance_from_rect_to_segment_2d(rect, sa, sb);
		if (d < pair_clearance_px) {
			return { ok: false, filter: 'label-vs-placed-witness', shortfall_px: pair_clearance_px - d };
		}
	}
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
	// Own witness lines vs every previously placed label rectangle (spec 5.3,
		// the reverse of label-vs-placed-witness): an always-eligible part is
		// traversed first, so its label is placed before later witnesses exist; the new
		// witness must clear placed labels too. Skipped when edge endpoints are
		// not supplied.
		if (in_.candidate_edge_p1_screen && in_.candidate_edge_p2_screen) {
			for (const placed of placed_label_rects) {
				if (distance_from_rect_to_segment_2d(placed, in_.candidate_edge_p1_screen, a1) < pair_clearance_px
					|| distance_from_rect_to_segment_2d(placed, in_.candidate_edge_p2_screen, a2) < pair_clearance_px) {
					return { ok: false, filter: 'own-witness-vs-placed', shortfall_px: 1 };
				}
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
};

export type Uniface_Placement_Result = {
	uniface_box: Uniface_Box | null;
	placements: Array<Placement_Details & {
		so_id    : string;
		so_name  : string;
		axis     : Axis_Name;
		// Length of this dimension in mm, and whether its part is always
		// eligible (selected fully in frustum, or hovered). Used by the final
		// draw-the-largest-N step to rank the whole valid list.
		mm              : number;
		always_eligible : boolean;
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
export function dimensionals_log(text: string): void {
	if (!k.debug.diagnose_dims) return;
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
	// Exactly one of the next two identifies the outward position; never both.
	// A uniface placement records its box level (witness_index); an outer-edge
	// placement records the outward distance in mm from the edge to the anchor.
	witness_index        : number | null;  // uniface box level (0-based), null for an outer edge
	witness_length_mm    : number | null;  // outer-edge outward distance in mm, null for a uniface
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
	// (the dimensions toggle is on OR this part is selected OR this part
	// is hovered). When the toggle is off and a part is selected or
	// hovered, the search runs ONLY for those parts — the renderer would
	// not draw the rest anyway.
	const selected_so_ids = new Set(selection.all.map(h => h.so.id));
	const hovered_so_id_for_eligibility = hits_3d.hover?.so?.id ?? null;
	const selected_names_for_log = selection.all.map(h => h.so.name).join(', ') || '(none)';
	const hovered_name_for_log = hits_3d.hover?.so?.name ?? '(none)';
	const total_visible_below_root = all_objects.filter(o => visible.has(o) && !!o.parent).length;
	// Count threshold (spec 4.1): a part is eligible only when all eight
	// corners are on screen; the selected part (only when FULLY in the
	// frustum) and the hovered part are force-kept on top of the count. The
	// cap to N is applied per (part, axis) after the biggest-first ordering,
	// in the work-list build below.
	const dim_count = stores.current_dimension_count;
	const is_always_eligible_part = (o: O_Scene): boolean =>
		(selected_so_ids.has(o.so.id) && is_fully_visible_on_screen(o))
		|| o.so.id === hovered_so_id_for_eligibility;
	const rendered_leaves: O_Scene[] = all_objects.filter(o =>
		visible.has(o)
		&& !!o.parent
		&& (is_fully_visible_on_screen(o) || is_always_eligible_part(o)),
	);
	// Diagnostic message for the eligibility filter. Pushed into the main
	// diagnostic-log buffer below once the buffer is constructed.
	const eligibility_log_line = `[uniface placement] eligibility filter: dimension count = ${dim_count}, selected parts = [${selected_names_for_log}], hovered part = ${hovered_name_for_log}, candidate parts ${rendered_leaves.length} of ${total_visible_below_root} visible below the root.`;
	// Nothing here clears the prior valid list. Hover, selection, the count
	// slider, and the dimensions on/off flag all keep it — the reuse pass
	// re-projects every saved placement and drops only the ones that no longer
	// fit, so positions hold steady across every event except a scene change.
	rendered_leaves.sort((a, b) => {
		const da = depth_from_root(a), db = depth_from_root(b);
		if (da !== db) return da - db;
		return a.so.name.localeCompare(b.so.name);
	});
	// Silhouette box: per the lexicon, only parts that are fully on
	// screen (every corner inside the canvas after tumble plus projection)
	// contribute. When the set is empty (heavy zoom — nothing qualifies),
	// the silhouette stays empty and the silhouette-clearance filter becomes
	// a no-op; the outer-edge placements, which do not depend on the
	// silhouette box, can still be chosen.
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
	// Box-corner hull — the convex hull of the silhouette box's eight projected
	// corners. Kept ONLY for the wider green diagnostic outline. It is built
	// from synthetic max-of-each-axis corners, so under perspective it does NOT
	// match the visible parts; it must not drive label rejection.
	const silhouette_box_corners_screen: { x: number; y: number }[] = [];
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
					silhouette_box_corners_screen.push({ x: p.x, y: p.y });
				}
			}
		}
	}
	const silhouette_box_hull_screen = silhouette_empty ? [] : convex_hull(silhouette_box_corners_screen);

	// THE silhouette every inside/outside test uses: the convex hull of every
	// projected VERTEX of every qualifying leaf part — the outline the eye
	// actually sees. Bug 001 fix: the inside/outside guard previously used the
	// box-corner hull above, which under perspective does not match the visible
	// silhouette, so a label could read inside the visible outline while the
	// guard called it outside (notes/work/now/bugs/001 dim is inside silho).
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
	const silhouette_polygon = qualifying_parts_corners_screen.length > 0
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
	const WITNESS_LENGTH_WEIGHT        = 2;   // each screen pixel of witness reduces the score by this much.
	const WITNESS_INSIDE_SILHOUETTE_WEIGHT = 200;  // score points per percentage of witness length inside the silhouette polygon (averaged over the two witnesses). Camera-zoom-independent.
	const SCREEN_ROOM_WEIGHT           = 1;   // each screen pixel of empty canvas room past the candidate's anchor midpoint (along the outward perpendicular) raises the score by this much. Now SMALLER than the witness-length penalty so shorter witnesses outrank empty-room-outward by default.
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
		diagnostic_log_buffer.push(`[uniface placement] visible silhouette (parts' vertices) the guard now uses: ${poly_str}`);
		const box_str = silhouette_box_hull_screen
			.map(p => `(${Math.round(p.x)},${Math.round(p.y)})`)
			.join(' → ');
		diagnostic_log_buffer.push(`[uniface placement] old box-corner outline (diagnostic only, no longer used by the guard): ${box_str}`);
	}
	// ─── Slice B of step 3.1 — persistence skip path ──────────────────
	// After the vote and BEFORE the main loop, check whether every
	// persisted (part, axis) entry can be re-projected from the current
	// frame and passes the four viability checks. If yes, build a result
	// from the re-projected entries and return early — the main loop is
	// skipped this render. If any check fails or the eligible set
	// differs from last render's persisted set, fall through to the
	// main loop. PENDING rule 2a of dim.spec.
	const try_skip = (): Uniface_Placement_Result | null => {
		// PERSISTENCE SKIP PATH RETIRED — always returns null so the seeded
		// run below executes every render. The seeded run already re-projects
		// every persisted entry and locks the ones that still pass strict
		// viability checks, which covered what this short-circuit used to do.
		// One re-projection pass per render saved a few microseconds; the
		// second source of subtle reuse bugs was not worth keeping. The body
		// below is preserved as a reference but is unreachable.
		return null;
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
			let a1_w_l: vec3, a2_w_l: vec3;
			if (entry.witness_length_mm !== null) {
				// Outer-edge reuse: rebuild anchors from the stored outward
				// distance in mm along the face's outward direction — the outer
				// edge has no uniface-box shift to read.
				const dir = vec3.create();
				if      (entry.face === UNIFACE_FACE_POS_X) vec3.set(dir,  1, 0, 0);
				else if (entry.face === UNIFACE_FACE_NEG_X) vec3.set(dir, -1, 0, 0);
				else if (entry.face === UNIFACE_FACE_POS_Y) vec3.set(dir, 0,  1, 0);
				else if (entry.face === UNIFACE_FACE_NEG_Y) vec3.set(dir, 0, -1, 0);
				else if (entry.face === UNIFACE_FACE_POS_Z) vec3.set(dir, 0, 0,  1);
				else                                         vec3.set(dir, 0, 0, -1);
				a1_w_l = vec3.create(); vec3.scaleAndAdd(a1_w_l, edge_w_p1_l, dir, entry.witness_length_mm);
				a2_w_l = vec3.create(); vec3.scaleAndAdd(a2_w_l, edge_w_p2_l, dir, entry.witness_length_mm);
			} else {
				if (entry.witness_index === null) continue;
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
				a1_w_l = anchor_world_l(edge_w_p1_l);
				a2_w_l = anchor_world_l(edge_w_p2_l);
			}
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
				// Viability check 6 — occlusion (spec 2.4). After a view change the
				// measured edge may now be hidden behind another part. If it is,
				// this placement is not viable; skip it so the full traversal
				// re-runs and drops it, matching the fresh path.
				if (render.edge_partly_hidden(edge_w_p1_l, edge_w_p2_l, tumble, entry.so_id)) {
					if (k.debug.diagnose_dims) console.log(`[uniface placement] reuse skipped: ${entry.so_name} (${entry.axis}) measured edge is now hidden behind another part. Will re-place via the full placement algorithm.`);
					continue;
				}
				// Cross-check (spec 7): a reused placement's label must clear every
				// already-kept witness line, and its own witness lines must clear every
				// already-kept label rectangle — the same witness/label clearance the
				// fresh placement algorithm applies. If it crosses, skip reuse and let
				// the full placement algorithm re-place this dimension.
				if (placement_crosses_placed(label_rect_l, [[e1_l, a1_l], [e2_l, a2_l]], placed_label_rects, placed_witness_segments, k.dimensions.PAIR_CLEARANCE_PX)) {
					if (k.debug.diagnose_dims) console.log(`[uniface placement] reuse skipped: ${entry.so_name} (${entry.axis}) label or witness overlaps an already-kept witness or label (spec 7). Will re-place via the full placement algorithm.`);
					continue;
				}
				// All checks pass — keep this placement.
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
				witness_index          : (entry.witness_index ?? uniface_box.shifts.length) + 1,
				witness_length_px      : witness_length_l,
				edge_p1_screen         : e1_l,
				edge_p2_screen         : e2_l,
				anchor_1_screen        : a1_l,
				anchor_2_screen        : a2_l,
				label_text             : label_text_l,
				so_id                  : entry.so_id,
				so_name                : entry.so_name,
				axis                   : entry.axis,
				mm                     : dim_value_l,
				always_eligible        : is_always_eligible_part(obj),
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
	// Step 3h (rule 19): build the (part, axis) work list, then process it
	// biggest-measurement-first so large dimensions claim their spots before
	// small ones. The repeater filter and the eligible-pair bookkeeping run
	// once, here, while the list is built; the main loop below then walks the
	// list in descending-millimetre order.
	const part_axis_entries: { obj: O_Scene; axis: Axis_Name; mm: number; always_eligible: boolean; base: boolean }[] = [];
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
		const always_eligible = is_always_eligible_part(obj);
		const base = is_fully_visible_on_screen(obj);
		for (const axis of axes) {
			if (!classification.axes_allowed.includes(axis)) { diagnostic_repeater_dropped_axes++; continue; }
			const mm = axis === 'x' ? obj.so.width : axis === 'y' ? obj.so.depth : obj.so.height;
			part_axis_entries.push({ obj, axis, mm, always_eligible, base });
		}
	}
	const part_axis_ordered = order_part_axis_by_descending_mm(part_axis_entries);
	// Traverse-and-filter (spec 4.1): compute EVERY part-axis that has a valid
	// placement, biggest-first, positions fixed. The N largest are chosen from
	// this whole list at the very end (draw_largest_n) — the count does NOT gate
	// the compute, so the biggest always win their spots and the slider only
	// re-picks from the kept list.
	if (k.debug.diagnose_dims) {
		const order_str = part_axis_ordered
			.map(e => `${e.obj.so.name}/${e.axis} ${Math.round(e.mm)}mm${e.always_eligible ? ' (always eligible)' : ''}`)
			.join(', ');
		diagnostic_log_buffer.push(`[uniface placement] count threshold: count ${dim_count}, ${part_axis_entries.length} candidate part-axes (biggest first): ${order_str}`);
	}
	for (const __pa of part_axis_ordered) {
		const obj = __pa.obj;
		const classification = classify_so(obj);
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
		// Front-most face normal of the PART in static world. Used by the
		// lies-flat reward in the score formula: candidate outward
		// directions perpendicular to this normal lie flat against the
		// face the camera is looking at and earn the reward.
		const front_normal_sw = vec3.create();
		{
			const origin_sw = vec3.create();
			vec3.transformMat4(origin_sw, vec3.fromValues(0, 0, 0), wm);
			const fn_sw = vec3.create();
			let best_dot = Infinity;
			for (let i = 0; i < 6; i++) {
				vec3.transformMat4(fn_sw, obj.so.face_normal(i), wm);
				vec3.subtract(fn_sw, fn_sw, origin_sw);
				const len = Math.hypot(fn_sw[0], fn_sw[1], fn_sw[2]);
				if (len < 1e-9) continue;
				vec3.scale(fn_sw, fn_sw, 1 / len);
				const d = vec3.dot(fn_sw, cam_dir_in_room);
				if (d < best_dot) {
					best_dot = d;
					vec3.copy(front_normal_sw, fn_sw);
				}
			}
		}
		// Strength of the front-face normal's camera-alignment scales the
		// lies-flat reward — a face that points straight at the camera
		// pays full weight; a face only weakly toward the camera pays less.
		const front_face_camera_alignment = Math.max(0, -vec3.dot(front_normal_sw, cam_dir_in_room));
		// Step 3h: the work list already holds one entry per (part, axis) in
		// descending-millimetre order, so this loop runs once, for this
		// entry's axis. The skip below stays as a guard but never fires here.
		for (const axis of [__pa.axis]) {
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
						mm              : __pa.mm,
						always_eligible : __pa.always_eligible,
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
			// The two directions that point AWAY from the part at each edge —
			// the outer-edge options (spec 3.3). Picked from which side of the
			// part box the edge sits on along the two non-measured axes.
			const nearer_max = (v: number, lo: number, hi: number) => Math.abs(v - hi) < Math.abs(v - lo);
			const edge_outward_faces: number[][] = edge_endpoints_world.map(([e1]) => {
				if (axis === 'x') return [
					nearer_max(e1[1], bb_min[1], bb_max[1]) ? UNIFACE_FACE_POS_Y : UNIFACE_FACE_NEG_Y,
					nearer_max(e1[2], bb_min[2], bb_max[2]) ? UNIFACE_FACE_POS_Z : UNIFACE_FACE_NEG_Z,
				];
				if (axis === 'y') return [
					nearer_max(e1[0], bb_min[0], bb_max[0]) ? UNIFACE_FACE_POS_X : UNIFACE_FACE_NEG_X,
					nearer_max(e1[2], bb_min[2], bb_max[2]) ? UNIFACE_FACE_POS_Z : UNIFACE_FACE_NEG_Z,
				];
				return [
					nearer_max(e1[0], bb_min[0], bb_max[0]) ? UNIFACE_FACE_POS_X : UNIFACE_FACE_NEG_X,
					nearer_max(e1[1], bb_min[1], bb_max[1]) ? UNIFACE_FACE_POS_Y : UNIFACE_FACE_NEG_Y,
				];
			});
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

			// Projected screen box of the part itself. An outer-edge label must
			// not sit inside it, or the part would cover the label.
			let part_box_x_min = Infinity, part_box_x_max = -Infinity;
			let part_box_y_min = Infinity, part_box_y_max = -Infinity;
			{
				const cw = vec3.create();
				for (const cx of [obj.so.x_min, obj.so.x_max])
				for (const cy of [obj.so.y_min, obj.so.y_max])
				for (const cz of [obj.so.z_min, obj.so.z_max]) {
					vec3.transformMat4(cw, vec3.fromValues(cx, cy, cz), wm_static);
					const p = project_screen(cw);
					if (p.w < 0) continue;
					if (p.x < part_box_x_min) part_box_x_min = p.x;
					if (p.x > part_box_x_max) part_box_x_max = p.x;
					if (p.y < part_box_y_min) part_box_y_min = p.y;
					if (p.y > part_box_y_max) part_box_y_max = p.y;
				}
			}
			const have_part_box = part_box_x_min < part_box_x_max && part_box_y_min < part_box_y_max;
			// Outer-edge anchors (spec 3.3): the smallest world shift of the edge
			// along `outward_dir` such that every mark sits 10 px inside the
			// canvas and the label box clears the part. Returns null when nothing
			// fits. The 15-px witness-spacing rule and every other rule are left
			// to the shared filter chain that runs on the result.
			const outer_edge_anchor_world = (
				edge_w_p1: vec3, edge_w_p2: vec3, outward_dir: vec3, lbl_w: number,
			): { a1_w: vec3; a2_w: vec3 } | null => {
				const CLEAR = 10;   // px inside the canvas
				const PAST  = 10;   // px the witnesses run past the anchor
				const evaluate = (shift: number): { fits: boolean; a1_w: vec3; a2_w: vec3 } => {
					const a1w = vec3.create(); vec3.scaleAndAdd(a1w, edge_w_p1, outward_dir, shift);
					const a2w = vec3.create(); vec3.scaleAndAdd(a2w, edge_w_p2, outward_dir, shift);
					const e1 = project_screen(edge_w_p1), e2 = project_screen(edge_w_p2);
					const a1 = project_screen(a1w), a2 = project_screen(a2w);
					if (e1.w < 0 || e2.w < 0 || a1.w < 0 || a2.w < 0) return { fits: false, a1_w: a1w, a2_w: a2w };
					const lx = (a1.x + a2.x) / 2, ly = (a1.y + a2.y) / 2;
					const w1 = Math.hypot(a1.x - e1.x, a1.y - e1.y);
					const w2 = Math.hypot(a2.x - e2.x, a2.y - e2.y);
					const u1x = w1 > 1e-9 ? (a1.x - e1.x) / w1 : 0, u1y = w1 > 1e-9 ? (a1.y - e1.y) / w1 : 0;
					const u2x = w2 > 1e-9 ? (a2.x - e2.x) / w2 : 0, u2y = w2 > 1e-9 ? (a2.y - e2.y) / w2 : 0;
					const pts = [
						{ x: e1.x, y: e1.y }, { x: e2.x, y: e2.y }, { x: a1.x, y: a1.y }, { x: a2.x, y: a2.y },
						{ x: a1.x + u1x * PAST, y: a1.y + u1y * PAST }, { x: a2.x + u2x * PAST, y: a2.y + u2y * PAST },
						{ x: lx - lbl_w / 2 - 2, y: ly - LABEL_H_PX / 2 - 1 }, { x: lx + lbl_w / 2 + 2, y: ly + LABEL_H_PX / 2 + 1 },
					];
					let xmn = Infinity, xmx = -Infinity, ymn = Infinity, ymx = -Infinity;
					for (const p of pts) { if (p.x < xmn) xmn = p.x; if (p.x > xmx) xmx = p.x; if (p.y < ymn) ymn = p.y; if (p.y > ymx) ymx = p.y; }
					let label_over_part = false;
					if (have_part_box) {
						label_over_part =
							lx + lbl_w / 2 > part_box_x_min && lx - lbl_w / 2 < part_box_x_max
							&& ly + LABEL_H_PX / 2 > part_box_y_min && ly - LABEL_H_PX / 2 < part_box_y_max;
					}
					const fits = xmn >= CLEAR && xmx <= canvas_w_for_score - CLEAR
						&& ymn >= CLEAR && ymx <= canvas_h_for_score - CLEAR && !label_over_part;
					return { fits, a1_w: a1w, a2_w: a2w };
				};
				const part_size = Math.max(obj.so.x_max - obj.so.x_min, obj.so.y_max - obj.so.y_min, obj.so.z_max - obj.so.z_min);
				const min_shift = part_size * 0.01 + 1e-3;
				const max_shift = Math.max(part_size, 1) * 100;
				let s_no = 0, s_yes = -1;
				let geom: { a1_w: vec3; a2_w: vec3 } | null = null;
				let probe = min_shift, iters = 0;
				while (probe < max_shift && iters < 30) {
					const r = evaluate(probe);
					if (r.fits) { s_yes = probe; geom = { a1_w: r.a1_w, a2_w: r.a2_w }; break; }
					s_no = probe; probe *= 2; iters++;
				}
				if (s_yes < 0 || geom === null) return null;
				let lo = s_no, hi = s_yes;
				for (let i = 0; i < 30; i++) {
					const mid = (lo + hi) / 2;
					const r = evaluate(mid);
					if (r.fits) { hi = mid; geom = { a1_w: r.a1_w, a2_w: r.a2_w }; } else { lo = mid; }
				}
				return geom;
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
				diag_cam_dot: number;
				diag_back_side_penalty: number;
				is_outer_edge: boolean;
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
				back_side_penalty: number;
				flat_reward: number;
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
			const is_hovered_for_samples = (hovered_so_id_for_diag !== null && obj.so.id === hovered_so_id_for_diag) || selected_so_ids.has(obj.so.id);
			const per_side_sample_rect: Map<number, Rect_2d> = new Map();
			// Plain-English description of the actual numbers behind one
			// rejected candidate per side, for the hovered part only.
			const per_side_sample_detail: Map<number, string> = new Map();

			// Occlusion exclusion (spec 2.4): a candidate edge is dropped when either
				// endpoint vertex is hidden behind another part's face. Independent of
				// witness index, so test once per edge here.
				const edge_occluded: boolean[] = edge_endpoints_world.map(([ew1, ew2]) =>
					render.edge_partly_hidden(ew1, ew2, tumble, obj.so.id),
				);
				if (k.debug.diagnose_dims) {
					const n_occ = edge_occluded.filter(Boolean).length;
					if (n_occ > 0) diagnostic_log_buffer.push(`[uniface placement] occlusion (spec 2.4): ${obj.so.name}/${axis} dropped ${n_occ} of ${edge_endpoints_world.length} candidate edges (part of the edge hidden behind another part).`);
				}
				for (let wi = 0; wi <= NUM_WITNESS_INDICES; wi++) {
				const is_outer_edge = wi === NUM_WITNESS_INDICES;
				const shifts_row = is_outer_edge ? null : uniface_box.shifts[wi];
				if (!is_outer_edge && !shifts_row) continue;
				for (let edge_idx = 0; edge_idx < edge_endpoints_world.length; edge_idx++) {
					const [edge_w_p1, edge_w_p2] = edge_endpoints_world[edge_idx];
						if (edge_occluded[edge_idx]) continue;  // spec 2.4: endpoint hidden behind another part
					const ep1 = project_screen(edge_w_p1);
					const ep2 = project_screen(edge_w_p2);
					const edge_p1_screen = { x: ep1.x, y: ep1.y };
					const edge_p2_screen = { x: ep2.x, y: ep2.y };
					for (const face_idx of UNIFACE_CANDIDATES_PER_AXIS[axis]) {
						// Outer edge only takes the two directions pointing away
						// from the part at this edge; a uniface takes the box shift.
						if (is_outer_edge && !edge_outward_faces[edge_idx].includes(face_idx)) continue;
						const s = is_outer_edge ? 0 : shifts_row![face_idx];
						if (!is_outer_edge && (s === null || s === undefined)) continue;
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
						let a1_w: vec3, a2_w: vec3;
						if (is_outer_edge) {
							const oa = outer_edge_anchor_world(edge_w_p1, edge_w_p2, SIDE_NORMAL_WORLD[face_idx], label_w_px);
							if (oa === null) continue;
							a1_w = oa.a1_w; a2_w = oa.a2_w;
						} else {
							a1_w = anchor_world(face_idx, edge_w_p1, s as number);
							a2_w = anchor_world(face_idx, edge_w_p2, s as number);
						}
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
									// On-screen cross-check: the angle between the dim line and a
									// witness. Near 0° means the marks collapse onto one line (truly
									// edge-on on screen); near 90° means the plane reads fine and the
									// world-space test disagrees with the picture.
									const dlx = a2.x - a1.x, dly = a2.y - a1.y;
									const wlx = a1.x - edge_p1_screen.x, wly = a1.y - edge_p1_screen.y;
									const dl_len = Math.hypot(dlx, dly), wl_len = Math.hypot(wlx, wly);
									const cosang = (dl_len > 1e-6 && wl_len > 1e-6) ? Math.abs(dlx * wlx + dly * wly) / (dl_len * wl_len) : 1;
									const onscreen_angle = Math.acos(Math.max(0, Math.min(1, cosang))) * 180 / Math.PI;
									per_side_sample_detail.set(
										face_idx,
										`plane-vs-camera dot=${plane_camera_dot.toFixed(3)} (about ${angle_deg_from_edge_on.toFixed(1)}° off edge-on; rejected below 10°); view=(${cam_dir_in_room[0].toFixed(2)},${cam_dir_in_room[1].toFixed(2)},${cam_dir_in_room[2].toFixed(2)}) plane-normal=(${plane_normal[0].toFixed(2)},${plane_normal[1].toFixed(2)},${plane_normal[2].toFixed(2)}); on-screen dim-line-to-witness angle=${onscreen_angle.toFixed(1)}°`,
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
							// Camera-side penalty: any candidate whose outward direction
							// (the silhouette face's outward normal in static world)
							// points AWAY from the camera (positive dot with the
							// camera-forward direction) gets a heavy penalty so
							// front-side candidates win whenever they exist. Weight
							// fifty thousand per unit of away-alignment — large
							// enough to outweigh the empty-canvas reward even when
							// the back side has hundreds of pixels more open room.
							const outward_sw = SIDE_NORMAL_WORLD[face_idx];
							const cam_dot_for_back = vec3.dot(outward_sw, cam_dir_in_room);
							const back_side_penalty = 50000 * Math.max(0, cam_dot_for_back);
							// Lies-flat reward: candidate outward directions
							// perpendicular to the part's front-face normal
							// earn the reward. Direction along the normal
							// (popping straight out of the front face) earns
							// zero. The reward also scales with how strongly
							// the front face points at the camera, so faces
							// nearly perpendicular to the view get a smaller
							// pull than faces that point straight at it.
							const flat_alignment = 1 - Math.abs(vec3.dot(outward_sw, front_normal_sw));
							const flat_reward = 500 * flat_alignment * front_face_camera_alignment;
							const score = between_bonus - centering_penalty - witness_length_penalty - inside_penalty + screen_room_reward - back_side_penalty + flat_reward;
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
									diag_cam_dot           : cam_dot_for_back,
									diag_back_side_penalty : back_side_penalty,
										is_outer_edge,
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
									back_side_penalty,
									flat_reward,
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
					// Store exactly one outward locator, never both. An outer edge
					// records its outward distance in mm from the edge to the anchor
					// (reuse rebuilds the anchor from it); a uniface records its level.
					const outward_length_mm_persist = winner.is_outer_edge
						? Math.hypot(
							winner.anchor_1_world[0] - winner.edge_p1_world[0],
							winner.anchor_1_world[1] - winner.edge_p1_world[1],
							winner.anchor_1_world[2] - winner.edge_p1_world[2],
						)
						: null;
				last_persisted.set(persisted_key(obj.so.id, axis), {
					so_id                : obj.so.id,
					so_name              : obj.so.name,
					axis,
					face                 : winner.face,
					witness_index        : winner.is_outer_edge ? null : winner.witness_index,
					witness_length_mm    : outward_length_mm_persist,
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
			// Print the per-side detail for the hovered part AND the selected part,
			// so a selected part with no drawn dimension shows why each side failed.
			const is_hovered_part = (hovered_so_id !== null && obj.so.id === hovered_so_id) || selected_so_ids.has(obj.so.id);
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
							+ ` - back-side ${s.back_side_penalty.toFixed(1)}`
							+ ` + lies-flat ${s.flat_reward.toFixed(1)}`
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
			placements.push({
				uniface                : winner ? winner.face : null,
				edge_v1_idx            : null,
				edge_v2_idx            : null,
				natural_label_position : winner ? winner.label_pos : null,
				witness_index          : winner ? winner.witness_index + 1 : 1,
				witness_length_px      : winner ? witness_length_px : null,
				edge_p1_screen         : winner ? winner.edge_p1_screen : null,
				edge_p2_screen         : winner ? winner.edge_p2_screen : null,
				anchor_1_screen        : winner ? winner.anchor_1 : null,
				anchor_2_screen        : winner ? winner.anchor_2 : null,
				label_text             : candidate_dim_text,
				so_id   : obj.so.id,
				so_name : obj.so.name,
				axis,
				mm              : __pa.mm,
				always_eligible : __pa.always_eligible,
			});
			// One-liner per dimension so the user can see at a glance which
			// witness level each chose (lower means closer to the silhouette),
			// or that it chose the outer edge.
			if (k.debug.diagnose_dims) {
				if (winner !== null) {
					diagnostic_log_buffer.push(`[uniface placement] ${obj.so.name} (${axis}): ${winner.is_outer_edge ? 'outer edge' : `witness index ${winner.witness_index + 1}`}`);
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
					// Camera-side diagnostic — describes the silhouette face
					// the dim sits on by its screen position relative to the
					// silhouette centre (where you SEE it on the canvas),
					// not by its world-axis name. Plus the front/back side
					// relative to the camera and the penalty applied.
					const fc_screen = face_centers_screen[winner.face];
					let screen_dir = 'unknown';
					if (fc_screen) {
						const ddx = fc_screen.x - silhouette_center_x;
						const ddy = fc_screen.y - silhouette_center_y;
						const adx = Math.abs(ddx);
						const ady = Math.abs(ddy);
						const horiz = adx > ady * 0.4 ? (ddx > 0 ? 'screen right' : 'screen left') : '';
						const vert  = ady > adx * 0.4 ? (ddy > 0 ? 'screen bottom' : 'screen top') : '';
						screen_dir = vert && horiz ? `${vert}-${horiz.split(' ')[1]}` : (vert || horiz || 'screen centre');
					}
					const side_label = winner.diag_cam_dot > 0 ? 'back (away from camera)' : winner.diag_cam_dot < 0 ? 'front (toward camera)' : 'edge-on';
					diagnostic_log_buffer.push(
						`    silhouette face sits at: ${screen_dir}, side relative to camera: ${side_label}, ` +
						`camera dot = ${winner.diag_cam_dot.toFixed(3)}, ` +
						`back-side penalty applied = ${winner.diag_back_side_penalty.toFixed(0)}`,
					);
				} else {
					diagnostic_log_buffer.push(`[uniface placement] ${obj.so.name} (${axis}): dropped (no placement passed every filter)`);
				}
			}
		}
	}
	// Step 3d filter 4 (no-viable-pair drop): remove every placement whose
	// search found no winning placement — they have no anchors to draw.
	const placements_with_winner = placements.filter(placement => {
		if (placement.uniface === null) {
			diagnostic_null_picks_removed++;
			return false;
		}
		return true;
	});
	// Draw-the-largest-N step (spec 4.1): from the whole valid list, draw the N
	// largest by length plus every always-eligible one. The slider N takes effect
	// ONLY here; it re-picks from the same list and moves nothing.
	const placements_to_draw = draw_largest_n(placements_with_winner, dim_count);
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
			`[uniface placement] summary: ${diagnostic_total} dimensions, ${diagnostic_with_any_candidate} had at least one viable candidate, ${diagnostic_with_winner} valid; drew the ${placements_to_draw.length} shown (${dim_count} largest plus always-eligible)`
			+ `\n  step 3d filter drops:`
			+ `\n    repeater filter removed ${diagnostic_repeater_dropped_parts} part(s) and ${diagnostic_repeater_dropped_axes} extra axis sweep(s)${repeater_names}`
			+ `\n    no-viable-pair drop removed ${diagnostic_null_picks_removed} pick(s) with no chosen uniface`
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
	last_uniface_placement_result = { uniface_box, placements: placements_to_draw, silhouette_polygon_screen: silhouette_polygon, silhouette_box_polygon_screen: silhouette_box_hull_screen };
	return last_uniface_placement_result;
}
