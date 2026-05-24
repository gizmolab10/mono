import type { O_Scene, Projected } from '../types/Interfaces';
import { perf_timer } from '../common/Performance_Timer';
import { Seeded_Random } from '../common/Seeded_Random';
import type Smart_Object from '../runtime/Smart_Object';
import { dimensions } from '../editors/Dimension';
import { stale_writable } from '../common/Dirty';
import type { Axis_Name } from '../types/Types';
import { units, Units } from '../types/Units';
import { hits_3d } from '../events/Hits_3D';
import { stores } from '../managers/Stores';
import { vec3, mat4 } from 'gl-matrix';
import { e } from '../events/Events';
import { get } from 'svelte/store';
import { camera } from './Camera';
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
 * Reads `last_hull` from R_Dimensions, which is set every paint by the
 * running force-driven code. When the new code becomes the only path
 * (Phase 4), the hull computation moves here.
 */

const FORBIDDEN_CAM_DOT    = 0.866;
const WITNESS_LEN_MAX_PX   = 120;
const WITNESS_CAP_PX       = 80;
const SLIDABLE_OVERHANG_PX = 50;
const SILHOUETTE_MARGIN_PX = 15;
/** Buffer pixels the label rectangle must leave between itself and
 *  either witness anchor along the dim line (rule 1 item 4 + rule 10).
 *  Forbidden zone around witness 1: slidable in [-Y - label_w/2, Y + label_w/2].
 *  Forbidden zone around witness 2: same shape, centered on dim_line_length. */
const WITNESS_ANCHOR_BUFFER_PX = 20;
/** Cap on the clearance term used in scoring. Past this, additional
 *  clearance doesn't matter for ranking — the between bonus and the
 *  centering parabola get to differentiate. */
const CLEARANCE_SCORE_CAP_PX = 1000;

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

/** Combined silhouette outline of every painted leaf part. Recomputed
 *  every paint by `compute_viable_pairs`. Exported for test hooks. */
export let last_hull: Array<{ x: number; y: number }> = [];
export let last_hull_input: Array<{ x: number; y: number; so_id: string; so_name: string }> = [];

/** Ray-casting point-in-polygon test (general polygon, not just convex). */
function point_in_polygon(px: number, py: number, poly: ReadonlyArray<{ x: number; y: number }>): boolean {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const xi = poly[i].x, yi = poly[i].y;
		const xj = poly[j].x, yj = poly[j].y;
		const intersects = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
		if (intersects) inside = !inside;
	}
	return inside;
}

/** Returns the face's surface depth at an arbitrary screen point (x, y),
 *  assuming the face is planar in 3D (so it's also planar in screen
 *  space after the perspective divide). Returns null when the face has
 *  fewer than three usable vertices, all its vertices are collinear in
 *  screen space, or the face is viewed edge-on (depth varies infinitely
 *  fast across screen). Used by rule 11's visibility filter so a face's
 *  contribution at the endpoint reflects the actual surface there, not
 *  the average of all four corners. */
function face_depth_at_screen_point(
	face: ReadonlyArray<number>,
	projected: ReadonlyArray<{ x: number; y: number; z: number; w: number }>,
	x: number, y: number,
): number | null {
	if (face.length < 3) return null;
	const p0 = projected[face[0]];
	if (!p0 || p0.w < 0) return null;
	let p1: { x: number; y: number; z: number; w: number } | null = null;
	let p2: { x: number; y: number; z: number; w: number } | null = null;
	for (let i = 1; i < face.length; i++) {
		const cand = projected[face[i]];
		if (!cand || cand.w < 0) return null;
		if (p1 === null) { p1 = cand; continue; }
		const ax = p1.x - p0.x, ay = p1.y - p0.y;
		const bx = cand.x - p0.x, by = cand.y - p0.y;
		if (Math.abs(ax * by - ay * bx) > 1e-9) { p2 = cand; break; }
	}
	if (p1 === null || p2 === null) return null;
	const ax = p1.x - p0.x, ay = p1.y - p0.y, az = p1.z - p0.z;
	const bx = p2.x - p0.x, by = p2.y - p0.y, bz = p2.z - p0.z;
	const nz = ax * by - ay * bx;
	if (Math.abs(nz) < 1e-9) return null;
	const nx = ay * bz - az * by;
	const ny = az * bx - ax * bz;
	return p0.z - (nx * (x - p0.x) + ny * (y - p0.y)) / nz;
}

/** Numerical-safety margin for the depth comparison in rule 11. A face
 *  whose surface at the endpoint differs from the endpoint's depth by
 *  less than this counts as "touching", not "blocking" — so shared
 *  corners between sibling parts do not falsely trigger occlusion. NDC
 *  depth lives roughly in [-1, 1]; 1e-4 corresponds to a few
 *  millimetres in a room-scale scene. */
const FACE_DEPTH_TOLERANCE = 1e-4;

/** Per rule 11's edge-visibility filter: returns true when EITHER of
 *  the projected edge's two endpoints is hidden behind any of the
 *  `occluders`'s faces. Only the two endpoints are checked; the middle
 *  of the edge is allowed to pass behind other geometry. An occluder
 *  face counts as hiding an endpoint when (a) the face's surface depth
 *  AT THE ENDPOINT's screen position is clearly in front of the
 *  endpoint (depth comparison with a small numerical-safety margin so
 *  shared corners do not falsely trigger) AND (b) the endpoint's
 *  screen position lies inside the face's projected polygon. */
export function is_edge_occluded(
	p1: { x: number; y: number; z: number; w: number },
	p2: { x: number; y: number; z: number; w: number },
	occluders: ReadonlyArray<{ projected: ReadonlyArray<{ x: number; y: number; z: number; w: number }>; faces: ReadonlyArray<ReadonlyArray<number>> }>,
): boolean {
	if (occluders.length === 0) return false;
	const endpoints = [p1, p2];
	for (const ep of endpoints) {
		for (const occ of occluders) {
			for (const face of occ.faces) {
				const face_z_at_ep = face_depth_at_screen_point(face, occ.projected, ep.x, ep.y);
				if (face_z_at_ep === null) continue;
				if (face_z_at_ep >= ep.z - FACE_DEPTH_TOLERANCE) continue;
				const poly = face.map(vi => occ.projected[vi]);
				if (point_in_polygon(ep.x, ep.y, poly)) return true;
			}
		}
	}
	return false;
}

/** Diagnostic-only sibling of `is_edge_occluded`. For each occluder that
 *  hides either endpoint, returns one entry naming the blocker and which
 *  endpoint it hides. Used to print "label X was blocked by part Y" in
 *  the per-paint summary. Slightly slower than the boolean check (no
 *  early-out) so the hot path keeps using `is_edge_occluded`. */
export function find_edge_endpoint_blockers(
	p1: { x: number; y: number; z: number; w: number },
	p2: { x: number; y: number; z: number; w: number },
	occluders: ReadonlyArray<{ so_name: string; projected: ReadonlyArray<{ x: number; y: number; z: number; w: number }>; faces: ReadonlyArray<ReadonlyArray<number>> }>,
): { endpoint: 1 | 2; blocker_name: string }[] {
	const hits: { endpoint: 1 | 2; blocker_name: string }[] = [];
	if (occluders.length === 0) return hits;
	const endpoints: Array<{ idx: 1 | 2; p: typeof p1 }> = [{ idx: 1, p: p1 }, { idx: 2, p: p2 }];
	for (const ep of endpoints) {
		for (const occ of occluders) {
			let blocked = false;
			for (const face of occ.faces) {
				const face_z_at_ep = face_depth_at_screen_point(face, occ.projected, ep.p.x, ep.p.y);
				if (face_z_at_ep === null) continue;
				if (face_z_at_ep >= ep.p.z - FACE_DEPTH_TOLERANCE) continue;
				const poly = face.map(vi => occ.projected[vi]);
				if (point_in_polygon(ep.p.x, ep.p.y, poly)) { blocked = true; break; }
			}
			if (blocked) hits.push({ endpoint: ep.idx, blocker_name: occ.so_name });
		}
	}
	return hits;
}

/** Status-bar running average of how many dimensions get dropped per
 *  paint. The painter publishes to this. */
export const w_dim_dropped_avg = stale_writable<number>(0);

/** Per-(part, axis) tally of how each candidate edge was treated by the
 *  filters in `compute_viable_pairs`. Populated every call to that
 *  function. Read by `run_new_placement` to print a plain-English summary
 *  whenever a paint loses labels. */
export type Per_Label_Filter_Stats = {
	edges_hidden              : number;
	edges_too_short           : number;
	edges_projection_broken   : number;
	edges_no_viable_direction : number;
	edges_yielded_pairs       : number;
};
export const last_filter_stats: {
	total_edges_considered : number;
	per_label              : Map<string, Per_Label_Filter_Stats>;
} = {
	total_edges_considered : 0,
	per_label              : new Map(),
};

/** Per-label set of unique part names that hid at least one of the
 *  label's candidate edges. Diagnostic only; populated alongside the
 *  filter stats every call to `compute_viable_pairs`. */
export const last_blockers_per_label: Map<string, Set<string>> = new Map();

function bump_filter_stat(key: string, field: keyof Per_Label_Filter_Stats): void {
	let s = last_filter_stats.per_label.get(key);
	if (!s) {
		s = {
			edges_hidden              : 0,
			edges_too_short           : 0,
			edges_projection_broken   : 0,
			edges_no_viable_direction : 0,
			edges_yielded_pairs       : 0,
		};
		last_filter_stats.per_label.set(key, s);
	}
	s[field]++;
}

function compute_combined_hull(): void {
	const all_objects = scene.get_all();
	const points: Array<{ x: number; y: number }> = [];
	const tagged: Array<{ x: number; y: number; so_id: string; so_name: string }> = [];
	const painted = new Set<O_Scene>();
	for (const o of all_objects) if (is_visible_for_dim(o)) painted.add(o);
	const has_painted_child = (obj: O_Scene): boolean => {
		for (const other of all_objects) {
			if (other.parent === obj && painted.has(other)) return true;
		}
		return false;
	};
	for (const obj of all_objects) {
		if (!painted.has(obj)) continue;
		if (has_painted_child(obj)) continue;
		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;
		for (const p of projected) {
			if (p.w >= 0) {
				points.push({ x: p.x, y: p.y });
				tagged.push({ x: p.x, y: p.y, so_id: obj.so.id, so_name: obj.so.name });
			}
		}
	}
	last_hull = points.length >= 3 ? convex_hull(points) : [];
	last_hull_input = tagged;
}

/** What kind of label this is per the repeater integration in rule 18. */
export type Label_Kind = 'template' | 'clone' | 'fireblock-first' | 'fireblock-last-shortened' | 'regular';

/** A viable (edge, direction) pair for one label. Both continuous DOF
 *  ranges are in screen pixels. */
export type Viable_Pair = {
	so_id        : string;
	so_name      : string;
	kind         : Label_Kind;
	axis         : Axis_Name;
	edge_v1_idx  : number;
	edge_v2_idx  : number;
	/** 3D unit direction along the perpendicular axis, in the smart object's local frame. */
	direction    : [number, number, number];
	/** Smallest witness length, in pixels, that puts the label rectangle 15 px outside the combined outline. */
	witness_length_min  : number;
	/** Largest witness length, in pixels, that respects the 80-pixel push cap AND keeps the projected witness ≤ 120 px. */
	witness_length_max  : number;
	/** Slidable-position range along the dim line, in pixels, measured from the projected witness-1 anchor. */
	slidable_min : number;
	slidable_max : number;
	/** Average projected length of a 1-unit 3D witness vector, in pixels. Phase 2 uses this to convert pixel pushes back to 3D distances. */
	avg_wlen_per_3d_unit : number;
	// Geometry the pair-check passes (rule 24) need:
	label_w_px   : number;
	label_h_px   : number;
	/** Projected edge endpoint 1, in screen pixels. */
	edge_p1_x    : number;
	edge_p1_y    : number;
	/** Projected edge endpoint 2, in screen pixels. */
	edge_p2_x    : number;
	edge_p2_y    : number;
	/** Averaged unit witness direction in screen pixels. The search-side
	 *  math (label center, AABB, clearance) reads this. */
	wit_ux       : number;
	wit_uy       : number;
	/** Per-endpoint screen vectors for one 3D unit of witness direction.
	 *  The painter reads these so the two witness lines diverge correctly
	 *  in perspective — world-parallel rays do not project to screen-
	 *  parallel rays unless the edge is parallel to the image plane. */
	wit_1_per3d_x : number;
	wit_1_per3d_y : number;
	wit_2_per3d_x : number;
	wit_2_per3d_y : number;
	/** Formatted number text the painter will draw. Computed once when the pair is built. */
	text         : string;
	/** NDC depth at the dim line midpoint, used by the painter for the hit-test rectangle. */
	dim_z        : number;
};

/** The AABB of every screen position one label can occupy, across its full
 *  four-DOF range. Used by rule 24's first pass to skip pairs that can't
 *  possibly conflict no matter what the search picks. */
export type Reachable_Region = {
	so_id      : string;
	so_name    : string;
	kind       : Label_Kind;
	axis       : Axis_Name;
	x_min      : number;
	x_max      : number;
	y_min      : number;
	y_max      : number;
	pairs      : Viable_Pair[];
};

/** A candidate pair of labels that might end up too close — both regions
 *  overlap when expanded by 33 pixels. Most "candidate" pairs will be
 *  cleared by rule 24's later passes; this list is just the cheap first
 *  cull. */
export type Candidate_Pair = {
	a_so_id : string;
	a_axis  : Axis_Name;
	b_so_id : string;
	b_axis  : Axis_Name;
};

/**
 * Compute every viable (edge, direction) pair for every visible smart
 * object's three axes at the current paint. Reads the combined hull from
 * the most recent paint of R_Dimensions.
 */
export function compute_viable_pairs(): Viable_Pair[] {
	compute_combined_hull();
	last_filter_stats.total_edges_considered = 0;
	last_filter_stats.per_label.clear();
	last_blockers_per_label.clear();
	const result: Viable_Pair[] = [];
	if (last_hull.length < 3) return result;
	if (!render.ctx)            return result;

	const cam_forward = compute_camera_forward();

	// Pre-build the list of potential occluders for rule 11's edge-visibility
	// check. Each painted part contributes its projected vertices and the
	// list of its faces. The check at each edge filters out the OWN part.
	const all_objects = scene.get_all();
	type Occluder = { so_id: string; so_name: string; projected: Projected[]; faces: number[][] };
	const all_occluders: Occluder[] = [];
	for (const o of all_objects) {
		if (!is_occluder_for_dim(o)) continue;
		const proj = hits_3d.get_projected(o.id);
		if (!proj) continue;
		const faces = o.so.scene?.faces;
		if (!faces) continue;
		all_occluders.push({ so_id: o.so.id, so_name: o.so.name, projected: proj, faces });
	}

	for (const obj of all_objects) {
		if (!is_visible_for_dim(obj)) continue;
		const classification = classify_so(obj);
		if (!classification.eligible) continue;
		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;
		const world_matrix = render.get_world_matrix(obj);
		const others_as_occluders = all_occluders.filter(o => o.so_id !== obj.so.id);

		for (const axis of classification.axes_allowed) {
			const value = axis === 'x' ? obj.so.width : axis === 'y' ? obj.so.depth : obj.so.height;
			render.ctx.font = '12px sans-serif';
			const text       = units.format_for_system(value, Units.current_unit_system(), stores.current_precision);
			const label_w_px = render.ctx.measureText(text).width + 4;
			const label_h_px = 12 + 2;

			const edges = silhouette_edges_along_axis(obj, axis, projected);
			const lkey = `${obj.so.id}|${axis}`;
			for (const { v1_idx, v2_idx } of edges) {
				last_filter_stats.total_edges_considered++;
				const p1 = projected[v1_idx];
				const p2 = projected[v2_idx];
				if (p1.w < 0 || p2.w < 0) {
					bump_filter_stat(lkey, 'edges_projection_broken');
					continue;
				}

				// Rule 11 minimum projected edge length (pre-checked here so
				// the per-edge filter stat is correct; compute_pair_ranges
				// re-checks defensively).
				if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 3) {
					bump_filter_stat(lkey, 'edges_too_short');
					continue;
				}

				// Rule 11 edge-visibility filter: skip edges that are
				// hidden behind another part at EITHER endpoint.
				if (is_edge_occluded(p1, p2, others_as_occluders)) {
					bump_filter_stat(lkey, 'edges_hidden');
					// Diagnostic: record which parts blocked this edge so
					// the per-paint summary can name them.
					const blockers = find_edge_endpoint_blockers(p1, p2, others_as_occluders);
					let set = last_blockers_per_label.get(lkey);
					if (!set) { set = new Set(); last_blockers_per_label.set(lkey, set); }
					for (const b of blockers) set.add(b.blocker_name);
					continue;
				}

				const all_dirs = four_perpendicular_directions(obj.so, axis);
				const allowed_dirs = all_dirs.filter(d => passes_camera_axis_filter(d, world_matrix, cam_forward));
				// Better degenerate than missing: when every direction is
				// rejected by the camera-angle filter, fall back to trying
				// all four anyway so the label still appears (even if
				// foreshortened). Matches the old painter's behavior.
				const dirs_to_try = allowed_dirs.length > 0 ? allowed_dirs : all_dirs;
				let yielded_any = false;
				for (const dir of dirs_to_try) {
					const pair = compute_pair_ranges({
						so       : obj.so,
						kind     : classification.kind,
						axis,
						v1_idx, v2_idx,
						direction: dir,
						world_matrix,
						p1, p2,
						label_w_px, label_h_px,
						text,
					});
					if (pair) { result.push(pair); yielded_any = true; }
				}
				bump_filter_stat(lkey, yielded_any ? 'edges_yielded_pairs' : 'edges_no_viable_direction');
			}
		}
	}
	return result;
}

/** Per-label pair count — what `dim_viable_pair_counts()` exposes. */
export function compute_viable_pair_counts(): { so_name: string; axis: Axis_Name; pair_count: number }[] {
	const counts = new Map<string, number>();
	for (const p of compute_viable_pairs()) {
		const key = `${p.so_name}|${p.axis}`;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	const result: { so_name: string; axis: Axis_Name; pair_count: number }[] = [];
	for (const [key, count] of counts) {
		const [so_name, axis] = key.split('|') as [string, Axis_Name];
		result.push({ so_name, axis, pair_count: count });
	}
	return result;
}

// ─── internals ──────────────────────────────────────────────────────────

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

/** Visibility test for rule 11's potential-blocker set. Broader than
 *  `is_visible_for_dim`: a part is a blocker whenever its own visibility
 *  flag is on. Two consequences, both per the spec:
 *    - A parent whose own visibility is off but which is set to show its
 *      children does NOT block (its `obj.so.visible` is false).
 *    - A child whose ancestor is set to hide its children is not drawn
 *      on screen but IS a blocker — the ancestor's shell would otherwise
 *      leak dimensions through where the child sits.
 *  X-ray mode mirrors the dimension-visibility check for consistency. */
function is_occluder_for_dim(obj: O_Scene): boolean {
	const option_held = get(e.w_option_down);
	const has_hidden = scene.get_all().some(o => !o.so.visible);
	const xray_mode = option_held && has_hidden;
	if (xray_mode) return !obj.so.visible;

	return obj.so.visible;
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

function compute_camera_forward(): vec3 {
	const f = vec3.create();
	vec3.subtract(f, camera.center_pos, camera.eye);
	vec3.normalize(f, f);
	return f;
}

/** Edges where one adjacent face is front-facing and the other back-facing. */
function silhouette_edges_along_axis(obj: O_Scene, axis: Axis_Name, projected: Projected[]): { v1_idx: number; v2_idx: number }[] {
	const so = obj.so;
	if (!so.scene?.faces) return [];
	const verts = so.vertices;
	const faces = so.scene.faces;
	const edges = so.scene.edges;

	const result: { v1_idx: number; v2_idx: number }[] = [];
	for (const [v1, v2] of edges) {
		if (edge_axis(verts[v1], verts[v2]) !== axis) continue;
		const adj = edges_to_adjacent_faces(faces, v1, v2);
		if (adj.length !== 2) continue;
		const w0 = render.face_winding(faces[adj[0]], projected);
		const w1 = render.face_winding(faces[adj[1]], projected);
		if ((w0 < 0 && w1 >= 0) || (w1 < 0 && w0 >= 0)) {
			result.push({ v1_idx: v1, v2_idx: v2 });
		}
	}
	return result;
}

function edges_to_adjacent_faces(faces: number[][], v1: number, v2: number): number[] {
	const out: number[] = [];
	for (let fi = 0; fi < faces.length; fi++) {
		const face = faces[fi];
		for (let i = 0; i < face.length; i++) {
			const a = face[i], b = face[(i + 1) % face.length];
			if ((a === v1 && b === v2) || (a === v2 && b === v1)) {
				out.push(fi);
				break;
			}
		}
	}
	return out;
}

function edge_axis(v1: vec3, v2: vec3): Axis_Name | null {
	const dx = Math.abs(v2[0] - v1[0]);
	const dy = Math.abs(v2[1] - v1[1]);
	const dz = Math.abs(v2[2] - v1[2]);
	const eps = 0.01;
	if (dx > eps && dy < eps && dz < eps) return 'x';
	if (dy > eps && dx < eps && dz < eps) return 'y';
	if (dz > eps && dx < eps && dy < eps) return 'z';
	return null;
}

function four_perpendicular_directions(so: Smart_Object, axis: Axis_Name): vec3[] {
	const others: Axis_Name[] = (['x', 'y', 'z'] as const).filter(a => a !== axis);
	const dirs: vec3[] = [];
	for (const a of others) {
		const v = so.axis_vector(a);
		dirs.push(vec3.clone(v));
		dirs.push(vec3.negate(vec3.create(), v));
	}
	return dirs;
}

function passes_camera_axis_filter(dir: vec3, world_matrix: mat4, cam_forward: vec3): boolean {
	const origin = vec3.create();
	const tip    = vec3.create();
	vec3.transformMat4(tip, dir, world_matrix);
	vec3.transformMat4(origin, vec3.create(), world_matrix);
	const world_dir = vec3.create();
	vec3.subtract(world_dir, tip, origin);
	vec3.normalize(world_dir, world_dir);
	return Math.abs(vec3.dot(world_dir, cam_forward)) <= FORBIDDEN_CAM_DOT;
}

/** Compute the (witness length, slidable position) DOF ranges for one (edge, direction) pair. Returns null if any range collapses (line too short, off-canvas, projection breaks). */
function compute_pair_ranges(args: {
	so          : Smart_Object;
	kind        : Label_Kind;
	axis        : Axis_Name;
	v1_idx      : number;
	v2_idx      : number;
	direction   : vec3;
	world_matrix: mat4;
	p1          : Projected;
	p2          : Projected;
	label_w_px  : number;
	label_h_px  : number;
	text        : string;
}): Viable_Pair | null {
	const { so, kind, axis, v1_idx, v2_idx, direction, world_matrix, p1, p2, label_w_px, label_h_px, text } = args;
	const v1 = so.vertices[v1_idx];
	const v2 = so.vertices[v2_idx];

	// Rule 11 minimum projected edge length: reject pairs whose two
	// witness anchors are closer than 3 pixels on screen. A measurement
	// on a part that small reads as noise — label unreadable, dim line
	// would be a dot.
	if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < 3) return null;

	// Project the 1-unit-offset versions of the two edge endpoints to find
	// the pixels-per-3D-unit conversion factor along this direction.
	const v1_plus = vec3.add(vec3.create(), v1, direction);
	const v2_plus = vec3.add(vec3.create(), v2, direction);
	const p_v1w = render.project_vertex(v1_plus, world_matrix);
	const p_v2w = render.project_vertex(v2_plus, world_matrix);
	if (p_v1w.w < 0 || p_v2w.w < 0) return null;

	const wlen1 = Math.hypot(p_v1w.x - p1.x, p_v1w.y - p1.y);
	const wlen2 = Math.hypot(p_v2w.x - p2.x, p_v2w.y - p2.y);
	if (wlen1 < 0.001 || wlen2 < 0.001) return null;
	const avg_wlen_per_3d_unit = (wlen1 + wlen2) / 2;

	// Witness direction on screen (unit vector along the projected witness ray).
	const wit_dx = p_v1w.x - p1.x;
	const wit_dy = p_v1w.y - p1.y;
	const wit_screen_len = Math.hypot(wit_dx, wit_dy);
	if (wit_screen_len < 0.001) return null;
	const wit_ux = wit_dx / wit_screen_len;
	const wit_uy = wit_dy / wit_screen_len;

	// Midpoint of the projected edge, in screen pixels — the starting point
	// of the dim line at zero push.
	const midX_init = (p1.x + p2.x) / 2;
	const midY_init = (p1.y + p2.y) / 2;

	// Witness-length min: distance from edge midpoint along the witness
	// direction to the combined-outline exit, plus the half-rectangle
	// footprint along the direction, plus the 15-pixel buffer.
	const exit_t = Math.max(0, ray_polygon_exit(midX_init, midY_init, wit_ux, wit_uy, last_hull));
	const rect_radius_along_arrow = (label_w_px * Math.abs(wit_ux) + label_h_px * Math.abs(wit_uy)) / 2;
	const witness_length_min = exit_t + rect_radius_along_arrow + SILHOUETTE_MARGIN_PX;
	if (witness_length_min > WITNESS_CAP_PX) return null;

	// Witness-length max: smaller of 80 and the value at which the
	// projected witness reaches 120 px. Linear approximation: at push P
	// the projected witness is ~ P (because avg_wlen is the per-3D-unit
	// projected length and P/avg_wlen is the 3D-distance equivalent, then
	// times avg_wlen back to projection ≈ P; for short pushes the linear
	// approximation is exact, for long ones perspective foreshortening
	// makes the line shorter than P, so 120 px ≈ 120 px of push).
	let witness_length_max = WITNESS_CAP_PX;
	if (witness_length_max > WITNESS_LEN_MAX_PX) witness_length_max = WITNESS_LEN_MAX_PX;
	if (witness_length_max < witness_length_min) return null;

	// Slidable-position range, along the dim line (which runs from the
	// projected witness-1 anchor to the projected witness-2 anchor).
	const dim_line_length_px = Math.hypot(p2.x - p1.x, p2.y - p1.y);
	const slidable_min = -SLIDABLE_OVERHANG_PX + label_w_px / 2;
	const slidable_max = dim_line_length_px + SLIDABLE_OVERHANG_PX - label_w_px / 2;
	if (slidable_max <= slidable_min) return null;

	return {
		so_id : so.id,
		so_name : so.name,
		kind,
		axis,
		edge_v1_idx : v1_idx,
		edge_v2_idx : v2_idx,
		direction : [direction[0], direction[1], direction[2]],
		witness_length_min,
		witness_length_max,
		slidable_min,
		slidable_max,
		avg_wlen_per_3d_unit,
		label_w_px,
		label_h_px,
		edge_p1_x : p1.x,
		edge_p1_y : p1.y,
		edge_p2_x : p2.x,
		edge_p2_y : p2.y,
		wit_ux,
		wit_uy,
		wit_1_per3d_x : p_v1w.x - p1.x,
		wit_1_per3d_y : p_v1w.y - p1.y,
		wit_2_per3d_x : p_v2w.x - p2.x,
		wit_2_per3d_y : p_v2w.y - p2.y,
		text,
		dim_z : (p1.z + p2.z) / 2,
	};
}

// ─── Reachable regions and first-pass pair candidates (rule 24 first pass) ──────

/** Group every viable pair by (so_id, axis) and compute the AABB of every
 *  reachable label-rectangle position across that label's full four-DOF
 *  range. Conservative: the AABB tightly contains every reachable position
 *  but is slightly looser than the actual region (which is the union of
 *  parallelograms, one per (edge, direction) pair). */
export function compute_reachable_regions(): Reachable_Region[] {
	const all_pairs = compute_viable_pairs();
	const grouped = new Map<string, { so_id: string; so_name: string; kind: Label_Kind; axis: Axis_Name; pairs: Viable_Pair[] }>();
	for (const p of all_pairs) {
		const key = `${p.so_id}|${p.axis}`;
		const g = grouped.get(key);
		if (g) { g.pairs.push(p); }
		else   { grouped.set(key, { so_id: p.so_id, so_name: p.so_name, kind: p.kind, axis: p.axis, pairs: [p] }); }
	}
	const result: Reachable_Region[] = [];
	for (const g of grouped.values()) {
		const aabb = aabb_of_reachable_positions(g.pairs);
		if (!aabb) continue;
		result.push({ so_id: g.so_id, so_name: g.so_name, kind: g.kind, axis: g.axis, ...aabb, pairs: g.pairs });
	}
	return result;
}

/** Union AABB across every viable pair on this label, of the
 *  label-rectangle position that pair allows. */
function aabb_of_reachable_positions(pairs: readonly Viable_Pair[]): { x_min: number; x_max: number; y_min: number; y_max: number } | null {
	let x_min = Infinity, x_max = -Infinity, y_min = Infinity, y_max = -Infinity;
	for (const p of pairs) {
		// Edge direction in screen space (unit vector p1 -> p2).
		const edge_dx = p.edge_p2_x - p.edge_p1_x;
		const edge_dy = p.edge_p2_y - p.edge_p1_y;
		const edge_len = Math.hypot(edge_dx, edge_dy);
		if (edge_len < 0.001) continue;
		const edge_ux = edge_dx / edge_len;
		const edge_uy = edge_dy / edge_len;
		// At the four corners of (witness_length × slidable), the label
		// CENTER sits at p1 + wit*W + edge_dir*S. The label RECTANGLE
		// extends half_w to the left/right and half_h to the up/down.
		const half_w = p.label_w_px / 2;
		const half_h = p.label_h_px / 2;
		for (const W of [p.witness_length_min, p.witness_length_max]) {
			for (const S of [p.slidable_min, p.slidable_max]) {
				const cx = p.edge_p1_x + p.wit_ux * W + edge_ux * S;
				const cy = p.edge_p1_y + p.wit_uy * W + edge_uy * S;
				if (cx - half_w < x_min) x_min = cx - half_w;
				if (cx + half_w > x_max) x_max = cx + half_w;
				if (cy - half_h < y_min) y_min = cy - half_h;
				if (cy + half_h > y_max) y_max = cy + half_h;
			}
		}
	}
	if (!isFinite(x_min)) return null;
	return { x_min, x_max, y_min, y_max };
}

const NEIGHBOUR_GRID_CELL_PX = 50;
const PAIR_CLEARANCE_PX      = 33;

/** Rule 24's first pass: find every pair of labels whose reachable
 *  regions overlap when expanded by 33 pixels. Uses a coarse grid so
 *  the cost is order of (label count) times log (label count), not
 *  label count squared. */
export function compute_neighbour_pairs(): Candidate_Pair[] {
	const regions = compute_reachable_regions();
	return neighbour_pairs_from_regions(regions);
}

/** The cell-grid worker. Exposed for unit-tests; the real call site goes
 *  through `compute_neighbour_pairs`. */
export function neighbour_pairs_from_regions(regions: readonly Reachable_Region[]): Candidate_Pair[] {
	const cell = NEIGHBOUR_GRID_CELL_PX;
	const margin = PAIR_CLEARANCE_PX;
	// Map each cell to the set of region indices whose expanded AABB
	// overlaps that cell.
	const buckets = new Map<string, number[]>();
	for (let i = 0; i < regions.length; i++) {
		const r = regions[i];
		const cx0 = Math.floor((r.x_min - margin) / cell);
		const cx1 = Math.floor((r.x_max + margin) / cell);
		const cy0 = Math.floor((r.y_min - margin) / cell);
		const cy1 = Math.floor((r.y_max + margin) / cell);
		for (let cx = cx0; cx <= cx1; cx++) {
			for (let cy = cy0; cy <= cy1; cy++) {
				const key = `${cx},${cy}`;
				const arr = buckets.get(key);
				if (arr) arr.push(i);
				else     buckets.set(key, [i]);
			}
		}
	}
	// Every pair of regions sharing a cell is a candidate. De-dup by
	// keeping a Set of "i,j" with i < j.
	const seen = new Set<string>();
	const pairs: Candidate_Pair[] = [];
	for (const bucket of buckets.values()) {
		for (let a = 0; a < bucket.length; a++) {
			for (let b = a + 1; b < bucket.length; b++) {
				const i = bucket[a], j = bucket[b];
				const key = i < j ? `${i},${j}` : `${j},${i}`;
				if (seen.has(key)) continue;
				seen.add(key);
				// Re-verify the expanded AABBs actually overlap (a label
				// can share a cell with another but live in the opposite
				// corner without overlapping the expanded box).
				if (aabbs_overlap_with_margin(regions[i], regions[j], margin)) {
					pairs.push({ a_so_id: regions[i].so_id, a_axis: regions[i].axis, b_so_id: regions[j].so_id, b_axis: regions[j].axis });
				}
			}
		}
	}
	return pairs;
}

function aabbs_overlap_with_margin(a: Reachable_Region, b: Reachable_Region, margin: number): boolean {
	return !(a.x_max + margin < b.x_min || b.x_max + margin < a.x_min ||
	         a.y_max + margin < b.y_min || b.y_max + margin < a.y_min);
}

// ─── Tier 2 — closed-form rectangle separation (rule 24 second pass) ──────────

/** Can the two viable pairs achieve at least `clearance_px` of
 *  rectangle-to-rectangle clearance, given each label's center can move
 *  anywhere inside its per-pair (witness_length × slidable_position)
 *  region? Conservative AABB check — returns true if the rectangles can
 *  be axis-aligned-separated. Will sometimes return false on pairs that
 *  could diagonally separate; the safe direction (keeps borderline pairs
 *  in the conflict graph instead of dropping them prematurely). */
export function pair_can_separate(pair_a: Viable_Pair, pair_b: Viable_Pair, clearance_px = PAIR_CLEARANCE_PX): boolean {
	const a = center_aabb_of_pair(pair_a);
	const b = center_aabb_of_pair(pair_b);
	if (!a || !b) return false;
	const wA = pair_a.label_w_px, hA = pair_a.label_h_px;
	const wB = pair_b.label_w_px, hB = pair_b.label_h_px;
	// Max achievable centroid distance along each axis, minus the half-rectangle
	// extents along that axis, gives the max achievable gap.
	const max_x_gap = Math.max(b.x_max - a.x_min, a.x_max - b.x_min) - (wA + wB) / 2;
	if (max_x_gap >= clearance_px) return true;
	const max_y_gap = Math.max(b.y_max - a.y_min, a.y_max - b.y_min) - (hA + hB) / 2;
	if (max_y_gap >= clearance_px) return true;
	return false;
}

/** Center AABB for a single pair — every label-center position the
 *  (witness_length × slidable_position) range allows. */
function center_aabb_of_pair(p: Viable_Pair): { x_min: number; x_max: number; y_min: number; y_max: number } | null {
	const edge_dx = p.edge_p2_x - p.edge_p1_x;
	const edge_dy = p.edge_p2_y - p.edge_p1_y;
	const edge_len = Math.hypot(edge_dx, edge_dy);
	if (edge_len < 0.001) return null;
	const edge_ux = edge_dx / edge_len;
	const edge_uy = edge_dy / edge_len;
	let x_min = Infinity, x_max = -Infinity, y_min = Infinity, y_max = -Infinity;
	for (const W of [p.witness_length_min, p.witness_length_max]) {
		for (const S of [p.slidable_min, p.slidable_max]) {
			const cx = p.edge_p1_x + p.wit_ux * W + edge_ux * S;
			const cy = p.edge_p1_y + p.wit_uy * W + edge_uy * S;
			if (cx < x_min) x_min = cx;
			if (cx > x_max) x_max = cx;
			if (cy < y_min) y_min = cy;
			if (cy > y_max) y_max = cy;
		}
	}
	return { x_min, x_max, y_min, y_max };
}

/** Walk every (pair_A, pair_B) combination. If any combination lets the
 *  rectangles separate by `clearance_px`, the two LABELS are not in
 *  conflict no matter what the search picks. */
export function labels_can_separate_via_some_combination(
	pairs_a: readonly Viable_Pair[],
	pairs_b: readonly Viable_Pair[],
	clearance_px = PAIR_CLEARANCE_PX,
): boolean {
	for (const a of pairs_a) {
		for (const b of pairs_b) {
			if (pair_can_separate(a, b, clearance_px)) return true;
		}
	}
	return false;
}

/** Filter the first-pass candidates through the second pass: drop any
 *  whose labels can separate via some combination. The survivors are the
 *  "stubborn" pairs that enter the conflict graph (rule 24 third pass). */
export function compute_tier2_survivors(): Candidate_Pair[] {
	const regions = compute_reachable_regions();
	const region_index = new Map<string, Reachable_Region>();
	for (const r of regions) region_index.set(`${r.so_id}|${r.axis}`, r);

	const first_pass = neighbour_pairs_from_regions(regions);
	const survivors: Candidate_Pair[] = [];
	for (const c of first_pass) {
		const a = region_index.get(`${c.a_so_id}|${c.a_axis}`);
		const b = region_index.get(`${c.b_so_id}|${c.b_axis}`);
		if (!a || !b) continue;
		if (!labels_can_separate_via_some_combination(a.pairs, b.pairs)) {
			survivors.push(c);
		}
	}
	return survivors;
}

// ─── Conflict graph (rule 24 third pass + rule 10 conflict definition) ─────────

/** A stable string identifier for a label — `${so_id}|${axis}`. */
export type Label_Key = string;

export function label_key(so_id: string, axis: Axis_Name): Label_Key {
	return `${so_id}|${axis}`;
}

/** Edges between labels that are in true conflict — pairs that cannot
 *  separate by 33 pixels no matter which (edge, direction, witness
 *  length, slidable position) combination the search picks. */
export class Conflict_Graph {
	private edges_set : Set<string>                = new Set();
	private neighbours_of: Map<Label_Key, Set<Label_Key>> = new Map();

	add_edge(a: Label_Key, b: Label_Key): void {
		if (a === b) return;
		const key = a < b ? `${a}|${b}` : `${b}|${a}`;
		if (this.edges_set.has(key)) return;
		this.edges_set.add(key);
		this.add_neighbour(a, b);
		this.add_neighbour(b, a);
	}

	has_edge(a: Label_Key, b: Label_Key): boolean {
		const key = a < b ? `${a}|${b}` : `${b}|${a}`;
		return this.edges_set.has(key);
	}

	neighbours(label: Label_Key): Label_Key[] {
		const set = this.neighbours_of.get(label);
		return set ? Array.from(set) : [];
	}

	conflict_count(label: Label_Key): number {
		return this.neighbours_of.get(label)?.size ?? 0;
	}

	all_edges(): { a: Label_Key; b: Label_Key }[] {
		const out: { a: Label_Key; b: Label_Key }[] = [];
		for (const key of this.edges_set) {
			const i = key.indexOf('|', key.indexOf('|') + 1);  // skip past so_id|axis to find the splitter
			// Edge keys are `${a_so_id}|${a_axis}|${b_so_id}|${b_axis}` — split into two label keys by the middle pipe.
			const parts = key.split('|');
			out.push({ a: `${parts[0]}|${parts[1]}`, b: `${parts[2]}|${parts[3]}` });
			void i;
		}
		return out;
	}

	size(): number {
		return this.edges_set.size;
	}

	private add_neighbour(a: Label_Key, b: Label_Key): void {
		let set = this.neighbours_of.get(a);
		if (!set) { set = new Set(); this.neighbours_of.set(a, set); }
		set.add(b);
	}
}

/** Build the conflict graph from the current scene. Walks every pair
 *  that survived the second pass and adds it as an edge. */
export function build_conflict_graph(): Conflict_Graph {
	const graph = new Conflict_Graph();
	for (const c of compute_tier2_survivors()) {
		graph.add_edge(label_key(c.a_so_id, c.a_axis), label_key(c.b_so_id, c.b_axis));
	}
	return graph;
}

// ─── Greedy seed (rule 23 greedy step) ─────────────────────────────────────────

/** The four-DOF tuple a label gets committed to by the greedy seed. */
export type Greedy_Placement = {
	so_id            : string;
	so_name          : string;
	kind             : Label_Kind;
	axis             : Axis_Name;
	pair             : Viable_Pair;
	witness_length   : number;
	slidable_position: number;
	center_x         : number;
	center_y         : number;
	label_w_px       : number;
	label_h_px       : number;
	/** Minimum distance from this label's rectangle to every previously-placed label's rectangle. Infinity when this is the first label. */
	min_clearance    : number;
};

/** Continuous-DOF grid resolution per (edge, direction) pair. 5 × 5 = 25
 *  candidates per pair, per rule 23's continuous-optimization step. */
const GRID_RESOLUTION = 5;

/** Greedy seed for the live scene. Walks every label in most-constrained-first order,
 *  picks each label's best four-DOF combination given everything already placed. */
export function greedy_seed(): Greedy_Placement[] {
	const regions = compute_reachable_regions();
	const ancestry = new Map<string, string>();
	for (const r of regions) {
		const obj = scene.get_all().find(o => o.so.id === r.so_id);
		ancestry.set(r.so_id, obj ? ancestry_path_of(obj.so) : '');
	}
	return greedy_seed_for_regions(regions, ancestry);
}

/** Pure greedy seed — testable without a scene. `locked_placements` is
 *  the set of labels carried over from the previous paint that should
 *  stay exactly where they are. They are added to `placed` up front so
 *  every non-locked label sees them as obstacles, and their regions are
 *  skipped during the search. */
export function greedy_seed_for_regions(
	regions: readonly Reachable_Region[],
	ancestry: ReadonlyMap<string, string>,
	locked_placements: readonly Greedy_Placement[] = [],
): Greedy_Placement[] {
	const locked_keys = new Set<Label_Key>();
	for (const p of locked_placements) locked_keys.add(label_key(p.so_id, p.axis));
	const placed: Greedy_Placement[] = [...locked_placements];
	const free_regions = regions.filter(r => !locked_keys.has(label_key(r.so_id, r.axis)));
	const ordered = order_by_constrainedness(free_regions, ancestry);
	for (const region of ordered) {
		const placement = pick_best_placement(region, placed);
		if (placement) placed.push(placement);
	}
	return placed;
}

/** Most-constrained-first label ordering. Ties broken by alphabetical
 *  part ancestry path (rule 21 catch-all). Within a label, the per-axis
 *  tie-break is the axis letter — stable and deterministic. */
export function order_by_constrainedness(
	regions: readonly Reachable_Region[],
	ancestry: ReadonlyMap<string, string>,
): Reachable_Region[] {
	return [...regions].sort((a, b) => {
		if (a.pairs.length !== b.pairs.length) return a.pairs.length - b.pairs.length;
		const a_path = ancestry.get(a.so_id) ?? '';
		const b_path = ancestry.get(b.so_id) ?? '';
		if (a_path !== b_path) return a_path < b_path ? -1 : 1;
		return a.axis < b.axis ? -1 : a.axis > b.axis ? 1 : 0;
	});
}

/** Walk every viable pair on this label; pick the one whose best 5×5
 *  grid sample has the largest minimum clearance from already-placed
 *  rectangles. */
function pick_best_placement(region: Reachable_Region, placed: readonly Greedy_Placement[]): Greedy_Placement | null {
	let best: Greedy_Placement | null = null;
	for (const pair of region.pairs) {
		const candidate = best_candidate_in_pair(pair, placed);
		if (!candidate) continue;
		if (!best || candidate.min_clearance > best.min_clearance) {
			best = candidate;
		}
	}
	return best;
}

/** 5×5 grid sample of (witness_length, slidable_position) within the
 *  pair's ranges. Returns the candidate with the largest effective score
 *  (raw clearance minus overhang penalty — see rule 10's between-the-
 *  witnesses preference). The stored `min_clearance` is the RAW value;
 *  the score is used only to rank candidates inside this function. */
export function best_candidate_in_pair(
	pair: Viable_Pair,
	placed: readonly Greedy_Placement[],
	hull: ReadonlyArray<{ x: number; y: number }> = last_hull,
): Greedy_Placement | null {
	const edge_dx = pair.edge_p2_x - pair.edge_p1_x;
	const edge_dy = pair.edge_p2_y - pair.edge_p1_y;
	const edge_len = Math.hypot(edge_dx, edge_dy);
	if (edge_len < 0.001) return null;
	const edge_ux = edge_dx / edge_len;
	const edge_uy = edge_dy / edge_len;

	// Forbidden zones around each witness anchor: rule 1 item 4 says the
	// slidable range excludes positions within Y pixels of an anchor;
	// rule 10 says the label rectangle must never cover its witness
	// lines. The combined rule: forbidden when the label rectangle
	// reaches within Y of an anchor, which expands the zone by half the
	// label width on each side of the anchor.
	const Y_BUF = WITNESS_ANCHOR_BUFFER_PX;
	const half_w = pair.label_w_px / 2;
	const w1_forb_lo = -Y_BUF - half_w;
	const w1_forb_hi =  Y_BUF + half_w;
	const w2_forb_lo = edge_len - Y_BUF - half_w;
	const w2_forb_hi = edge_len + Y_BUF + half_w;

	// Rule 10 scoring: between-positions get a bonus equal to the room
	// they have between the witnesses (witness distance minus label
	// width). Overhang positions get no bonus. Inside between-positions
	// a parabolic centering penalty (zero at midpoint, X at witness
	// anchors) breaks ties toward the center.
	const between_bonus = Math.max(0, edge_len - pair.label_w_px);
	const midpoint = edge_len / 2;
	const half_dl  = edge_len / 2;
	const CENTERING_MAX_PX = 20;

	let best: Greedy_Placement | null = null;
	let best_score = -Infinity;
	const W_step = (pair.witness_length_max - pair.witness_length_min) / Math.max(1, GRID_RESOLUTION - 1);
	const S_step = (pair.slidable_max - pair.slidable_min) / Math.max(1, GRID_RESOLUTION - 1);

	for (let i = 0; i < GRID_RESOLUTION; i++) {
		const W = pair.witness_length_min + W_step * i;
		for (let j = 0; j < GRID_RESOLUTION; j++) {
			const S = pair.slidable_min + S_step * j;
			// Skip slidable positions that put the label rectangle over
			// or within Y pixels of either witness anchor.
			const forbidden_w1 = S >= w1_forb_lo && S <= w1_forb_hi;
			const forbidden_w2 = S >= w2_forb_lo && S <= w2_forb_hi;
			if (forbidden_w1 || forbidden_w2) continue;

			const cx = pair.edge_p1_x + pair.wit_ux * W + edge_ux * S;
			const cy = pair.edge_p1_y + pair.wit_uy * W + edge_uy * S;

			// Rule 9 enforcement: skip candidates whose label rectangle
			// is inside the silhouette outline or within 15 pixels of
			// any edge of it. The witness-length minimum only checks
			// clearance along the witness direction at the edge midpoint;
			// the slidable can move the label sideways into a part of
			// the silhouette the minimum didn't see.
			if (hull.length >= 3) {
				const hw = pair.label_w_px / 2;
				const hh = pair.label_h_px / 2;
				const corners: Array<[number, number]> = [
					[cx - hw, cy - hh],
					[cx + hw, cy - hh],
					[cx + hw, cy + hh],
					[cx - hw, cy + hh],
				];
				let too_close = false;
				for (const [px, py] of corners) {
					const push = push_outside_hull(px, py, hull as Array<{ x: number; y: number }>, SILHOUETTE_MARGIN_PX);
					if (push.dx !== 0 || push.dy !== 0) { too_close = true; break; }
				}
				if (too_close) continue;
			}

			const min_clearance = min_distance_to_placed(cx, cy, pair.label_w_px, pair.label_h_px, placed);

			// Cap the clearance contribution to the score so the between
			// bonus and the centering parabola can still differentiate
			// samples when the raw clearance is huge (or infinite, which
			// it is for the first label placed when no others have been
			// seated yet). Without this cap, every safe sample with
			// no nearby labels would tie at infinity and iteration
			// order would pick the leftmost — defeating the centering.
			const clearance_for_score = Math.min(min_clearance, CLEARANCE_SCORE_CAP_PX);

			const is_between = S > w1_forb_hi && S < w2_forb_lo;
			let score = clearance_for_score;
			if (is_between) {
				score += between_bonus;
				if (half_dl > 0) {
					const norm_d = Math.abs(S - midpoint) / half_dl;
					score -= CENTERING_MAX_PX * norm_d * norm_d;
				}
			}
			if (score > best_score) {
				best_score = score;
				best = {
					so_id            : pair.so_id,
					so_name          : pair.so_name,
					kind             : pair.kind,
					axis             : pair.axis,
					pair,
					witness_length   : W,
					slidable_position: S,
					center_x         : cx,
					center_y         : cy,
					label_w_px       : pair.label_w_px,
					label_h_px       : pair.label_h_px,
					min_clearance,
				};
			}
		}
	}
	return best;
}

/** Minimum rectangle-to-rectangle distance from a candidate label
 *  rectangle (centered at cx/cy with size w/h) to every already-placed
 *  label's rectangle. Returns Infinity when no labels are placed yet. */
export function min_distance_to_placed(cx: number, cy: number, w: number, h: number, placed: readonly Greedy_Placement[]): number {
	if (placed.length === 0) return Infinity;
	const half_w = w / 2, half_h = h / 2;
	let min = Infinity;
	for (const p of placed) {
		const p_half_w = p.label_w_px / 2, p_half_h = p.label_h_px / 2;
		const dx = Math.max(0, Math.abs(cx - p.center_x) - half_w - p_half_w);
		const dy = Math.max(0, Math.abs(cy - p.center_y) - half_h - p_half_h);
		const d = Math.hypot(dx, dy);
		if (d < min) min = d;
	}
	return min;
}

// ─── Retry pass (rule 23 retry step) ────────────────────────────────────────

/** Walk every label still in a true conflict after the greedy seed.
 *  Try single-label switches first; if no single switch clears the
 *  conflict, look one step further for a paired swap. Cap at two labels
 *  moving. The input is mutated in place; the same array is returned
 *  for convenience. `locked_keys` names labels that may not be moved —
 *  they still count as obstacles, but switches and swaps skip them. */
export function retry_pass(
	placed: Greedy_Placement[],
	regions: readonly Reachable_Region[],
	locked_keys: ReadonlySet<Label_Key> = new Set(),
): Greedy_Placement[] {
	const region_index = new Map<string, Reachable_Region>();
	for (const r of regions) region_index.set(label_key(r.so_id, r.axis), r);

	const conflicts = find_conflicts_in_placement(placed);
	for (const [i, j] of conflicts) {
		// The labels may already have been moved by an earlier retry —
		// re-check whether this pair is still in conflict before trying.
		if (placed_pair_distance(placed[i], placed[j]) >= PAIR_CLEARANCE_PX) continue;
		const i_locked = locked_keys.has(label_key(placed[i].so_id, placed[i].axis));
		const j_locked = locked_keys.has(label_key(placed[j].so_id, placed[j].axis));
		if (!i_locked && try_single_switch(i, placed, region_index)) continue;
		if (!j_locked && try_single_switch(j, placed, region_index)) continue;
		if (!i_locked && !j_locked) try_paired_swap(i, j, placed, region_index);
	}
	return placed;
}

/** Every pair of placed labels closer than 33 pixels rectangle-to-rectangle. */
export function find_conflicts_in_placement(placed: readonly Greedy_Placement[]): [number, number][] {
	const out: [number, number][] = [];
	for (let i = 0; i < placed.length; i++) {
		for (let j = i + 1; j < placed.length; j++) {
			if (placed_pair_distance(placed[i], placed[j]) < PAIR_CLEARANCE_PX) {
				out.push([i, j]);
			}
		}
	}
	return out;
}

/** Rectangle-to-rectangle distance between two placed labels. */
function placed_pair_distance(a: Greedy_Placement, b: Greedy_Placement): number {
	const dx = Math.max(0, Math.abs(a.center_x - b.center_x) - (a.label_w_px + b.label_w_px) / 2);
	const dy = Math.max(0, Math.abs(a.center_y - b.center_y) - (a.label_h_px + b.label_h_px) / 2);
	return Math.hypot(dx, dy);
}

/** Try every unused viable pair on this label in best-clearance order.
 *  Accept the first whose best candidate clears 33 pixels from every
 *  other placed label. */
function try_single_switch(idx: number, placed: Greedy_Placement[], region_index: Map<string, Reachable_Region>): boolean {
	const current = placed[idx];
	const region = region_index.get(label_key(current.so_id, current.axis));
	if (!region) return false;
	const others = placed.filter((_, k) => k !== idx);

	const scored: { best: Greedy_Placement | null }[] = [];
	for (const pair of region.pairs) {
		if (pair === current.pair) continue;
		scored.push({ best: best_candidate_in_pair(pair, others) });
	}
	scored.sort((a, b) => (b.best?.min_clearance ?? -Infinity) - (a.best?.min_clearance ?? -Infinity));

	for (const { best } of scored) {
		if (best && best.min_clearance >= PAIR_CLEARANCE_PX) {
			placed[idx] = best;
			return true;
		}
	}
	return false;
}

/** Try every (unused pair on A) × (unused pair on B) combination.
 *  Accept the first where both labels clear 33 pixels from everything
 *  including each other. */
function try_paired_swap(i: number, j: number, placed: Greedy_Placement[], region_index: Map<string, Reachable_Region>): boolean {
	const a = placed[i], b = placed[j];
	const region_a = region_index.get(label_key(a.so_id, a.axis));
	const region_b = region_index.get(label_key(b.so_id, b.axis));
	if (!region_a || !region_b) return false;

	const others = placed.filter((_, k) => k !== i && k !== j);

	for (const pair_a of region_a.pairs) {
		if (pair_a === a.pair) continue;
		const best_a = best_candidate_in_pair(pair_a, others);
		if (!best_a || best_a.min_clearance < PAIR_CLEARANCE_PX) continue;

		for (const pair_b of region_b.pairs) {
			if (pair_b === b.pair) continue;
			const best_b = best_candidate_in_pair(pair_b, [...others, best_a]);
			if (!best_b || best_b.min_clearance < PAIR_CLEARANCE_PX) continue;
			placed[i] = best_a;
			placed[j] = best_b;
			return true;
		}
	}
	return false;
}

// ─── Persistence with 2-pixel tolerance (rule 19) ─────────────────────────────

const PERSISTENCE_TOLERANCE_PX = 2;
const STRICT_PAIRWISE_PX       = PAIR_CLEARANCE_PX;
const TOL_PAIRWISE_PX          = PAIR_CLEARANCE_PX - PERSISTENCE_TOLERANCE_PX;

/** A label's chosen four-DOF values from the previous paint. The pair
 *  identity is reconstructed by matching `edge_v1_idx`, `edge_v2_idx`,
 *  and `direction` against the current paint's regions. */
export type Persisted_Placement = {
	so_id            : string;
	so_name          : string;
	axis             : Axis_Name;
	edge_v1_idx      : number;
	edge_v2_idx      : number;
	direction        : [number, number, number];
	witness_length   : number;
	slidable_position: number;
	label_w_px       : number;
	label_h_px       : number;
};

/** Outcome of the viability check at the start of a paint. Either the
 *  search can be skipped entirely (all labels still viable within the
 *  2-pixel tolerance), OR a cold-run search is needed with some labels
 *  LOCKED (still strict-viable) and others FREE (to be re-placed). */
export type Viability_Result =
	| { kind: 'skip_search'; placements: Greedy_Placement[]; any_slack_used: boolean }
	| { kind: 'cold_run'; locked: Greedy_Placement[]; free_label_keys: Label_Key[] };

/** Run rule 19's viability checks for every persisted label against the
 *  current paint's regions. Returns either a skip-search outcome (all
 *  labels OK) or a cold-run outcome (with the still-viable labels marked
 *  as locked obstacles for the search). */
export function compute_viability(
	persisted_list: readonly Persisted_Placement[],
	regions: readonly Reachable_Region[],
): Viability_Result {
	type Status = {
		persisted        : Persisted_Placement;
		re_projected     : Greedy_Placement | null;
		passes_strict    : boolean;
		passes_tolerance : boolean;
	};

	const region_index = new Map<string, Reachable_Region>();
	for (const r of regions) region_index.set(label_key(r.so_id, r.axis), r);

	const statuses: Status[] = [];
	for (const persisted of persisted_list) {
		const region = region_index.get(label_key(persisted.so_id, persisted.axis));
		if (!region) {
			statuses.push({ persisted, re_projected: null, passes_strict: false, passes_tolerance: false });
			continue;
		}
		const pair = find_matching_pair(persisted, region);
		if (!pair) {
			statuses.push({ persisted, re_projected: null, passes_strict: false, passes_tolerance: false });
			continue;
		}
		const re_proj = re_project_persisted(persisted, pair);
		const w = persisted.witness_length;
		const s = persisted.slidable_position;
		const strict_w = (w >= pair.witness_length_min) && (w <= pair.witness_length_max);
		const strict_s = (s >= pair.slidable_min) && (s <= pair.slidable_max);
		const tol_w = (w >= pair.witness_length_min - PERSISTENCE_TOLERANCE_PX) && (w <= pair.witness_length_max + PERSISTENCE_TOLERANCE_PX);
		const tol_s = (s >= pair.slidable_min - PERSISTENCE_TOLERANCE_PX) && (s <= pair.slidable_max + PERSISTENCE_TOLERANCE_PX);
		statuses.push({
			persisted,
			re_projected: re_proj,
			passes_strict: strict_w && strict_s,
			passes_tolerance: tol_w && tol_s,
		});
	}

	// Pairwise clearance — every label must clear every other by 33 px (strict) or 31 (tolerance).
	for (let i = 0; i < statuses.length; i++) {
		const a = statuses[i];
		if (!a.re_projected) continue;
		for (let j = i + 1; j < statuses.length; j++) {
			const b = statuses[j];
			if (!b.re_projected) continue;
			const d = placed_pair_distance(a.re_projected, b.re_projected);
			if (d < STRICT_PAIRWISE_PX) { a.passes_strict = false; b.passes_strict = false; }
			if (d < TOL_PAIRWISE_PX)    { a.passes_tolerance = false; b.passes_tolerance = false; }
		}
	}

	// Vacuous-truth guard: `every` over an empty array returns true. With
	// nothing remembered yet (the first paint after scene load), that
	// would mistakenly say "all good, skip the search" and hand back an
	// empty layout — so nothing ever gets drawn. Require at least one
	// remembered label before considering a skip.
	const all_tolerance = persisted_list.length > 0 && statuses.every(s => s.re_projected !== null && s.passes_tolerance);
	if (all_tolerance) {
		const any_slack = statuses.some(s => s.passes_tolerance && !s.passes_strict);
		return {
			kind: 'skip_search',
			placements: statuses.map(s => s.re_projected!).filter(p => p !== null),
			any_slack_used: any_slack,
		};
	}

	const locked: Greedy_Placement[] = [];
	const free_label_keys: Label_Key[] = [];
	for (const s of statuses) {
		if (s.passes_strict && s.re_projected) locked.push(s.re_projected);
		else                                   free_label_keys.push(label_key(s.persisted.so_id, s.persisted.axis));
	}
	return { kind: 'cold_run', locked, free_label_keys };
}

/** Holds the per-label remembered four-DOF values between paints, plus
 *  the drift-safety counter. */
export class Persistence {
	private remembered = new Map<Label_Key, Persisted_Placement>();
	private slack_streak = 0;

	remember(p: Greedy_Placement): void {
		this.remembered.set(label_key(p.so_id, p.axis), {
			so_id            : p.so_id,
			so_name          : p.so_name,
			axis             : p.axis,
			edge_v1_idx      : p.pair.edge_v1_idx,
			edge_v2_idx      : p.pair.edge_v2_idx,
			direction        : p.pair.direction,
			witness_length   : p.witness_length,
			slidable_position: p.slidable_position,
			label_w_px       : p.label_w_px,
			label_h_px       : p.label_h_px,
		});
	}

	remember_all(placements: readonly Greedy_Placement[]): void {
		for (const p of placements) this.remember(p);
	}

	forget(key: Label_Key): void { this.remembered.delete(key); }
	clear(): void { this.remembered.clear(); this.slack_streak = 0; }
	has(key: Label_Key): boolean { return this.remembered.has(key); }
	size(): number { return this.remembered.size; }

	get_all(): Persisted_Placement[] { return Array.from(this.remembered.values()); }

	/** Bump the drift counter after a slack-using search-skipped paint.
	 *  After two such paints, the next call to should_force_cold_run() returns
	 *  true and the streak resets. */
	note_slack_use(): void { this.slack_streak += 1; }

	/** Reset the streak. Called after any cold-run paint, since cold-runs
	 *  re-establish strict viability. */
	clear_slack_streak(): void { this.slack_streak = 0; }

	/** Did rule 19's drift-safety condition fire? */
	should_force_cold_run(): boolean { return this.slack_streak >= 2; }
}

function find_matching_pair(persisted: Persisted_Placement, region: Reachable_Region): Viable_Pair | null {
	for (const p of region.pairs) {
		if (p.edge_v1_idx !== persisted.edge_v1_idx) continue;
		if (p.edge_v2_idx !== persisted.edge_v2_idx) continue;
		const dx = Math.abs(p.direction[0] - persisted.direction[0]);
		const dy = Math.abs(p.direction[1] - persisted.direction[1]);
		const dz = Math.abs(p.direction[2] - persisted.direction[2]);
		if (dx < 0.001 && dy < 0.001 && dz < 0.001) return p;
	}
	return null;
}

/** Project every persisted placement onto the current paint's regions
 *  without re-running the search. Used by the layout-freeze path when a
 *  dimension is being edited. Persisted entries whose region or pair no
 *  longer exists are silently dropped from this paint. */
export function re_project_persisted_list(
	persisted_list: readonly Persisted_Placement[],
	regions: readonly Reachable_Region[],
): Greedy_Placement[] {
	const region_index = new Map<string, Reachable_Region>();
	for (const r of regions) region_index.set(label_key(r.so_id, r.axis), r);
	const out: Greedy_Placement[] = [];
	for (const p of persisted_list) {
		const r = region_index.get(label_key(p.so_id, p.axis));
		if (!r) continue;
		const pair = find_matching_pair(p, r);
		if (!pair) continue;
		out.push(re_project_persisted(p, pair));
	}
	return out;
}

function re_project_persisted(persisted: Persisted_Placement, pair: Viable_Pair): Greedy_Placement {
	const edge_dx = pair.edge_p2_x - pair.edge_p1_x;
	const edge_dy = pair.edge_p2_y - pair.edge_p1_y;
	const edge_len = Math.hypot(edge_dx, edge_dy);
	const edge_ux = edge_len > 0.001 ? edge_dx / edge_len : 0;
	const edge_uy = edge_len > 0.001 ? edge_dy / edge_len : 0;
	const cx = pair.edge_p1_x + pair.wit_ux * persisted.witness_length + edge_ux * persisted.slidable_position;
	const cy = pair.edge_p1_y + pair.wit_uy * persisted.witness_length + edge_uy * persisted.slidable_position;
	return {
		so_id            : persisted.so_id,
		so_name          : persisted.so_name,
		kind             : pair.kind,
		axis             : persisted.axis,
		pair,
		witness_length   : persisted.witness_length,
		slidable_position: persisted.slidable_position,
		center_x         : cx,
		center_y         : cy,
		label_w_px       : persisted.label_w_px,
		label_h_px       : persisted.label_h_px,
		min_clearance    : 0,
	};
}

// ─── Drop policy (rule 12) ─────────────────────────────────────────────────────

/** Reason a label was dropped. Mirrors the three drop conditions in rule 12. */
export type Drop_Reason = 'no_viable_pair' | 'remaining_conflict' | 'off_canvas' | 'duplicate_text';

/** One dropped label and the reason it went. `conflict_count_at_drop` is
 *  populated for the `remaining_conflict` reason — it's the count of other
 *  labels this one was in conflict with at the moment it was selected to
 *  go. For the other two reasons it's 0. */
export type Drop_Entry = {
	so_id : string;
	so_name : string;
	axis : Axis_Name;
	reason : Drop_Reason;
	conflict_count_at_drop : number;
};

/** Output of the drop policy. `kept_max_conflict` should always be 0 by
 *  construction — every conflict was resolved by dropping the most
 *  conflicted label. The field exists so the drop-policy test can verify
 *  the policy didn't keep any conflict-carrying labels. */
export type Drop_Report = {
	dropped : Drop_Entry[];
	kept_max_conflict : number;
};

/** Rule 4 dedup. Two labels are duplicates when they have the same text
 *  AND their measured edges are parallel in 3D. The kept one is whichever
 *  has been remembered between paints the longest; on a first paint with
 *  neither remembered, the alphabetical-by-ancestry-path tie-break makes
 *  the result deterministic across runs.
 *
 *  Mutates `placed` in place. Returns a list of dropped labels with
 *  reason `'duplicate_text'`. The caller folds these into the drop report.
 */
export function drop_duplicates(
	placed: Greedy_Placement[],
	persisted_before: ReadonlySet<Label_Key>,
	world_dirs: ReadonlyMap<Label_Key, [number, number, number]>,
	ancestry: ReadonlyMap<string, string>,
): Drop_Entry[] {
	type Entry = {
		idx        : number;
		text       : string;
		dir        : [number, number, number];
		persisted  : boolean;
		ancestry   : string;
	};
	const entries: Entry[] = [];
	for (let i = 0; i < placed.length; i++) {
		const p = placed[i];
		const key = label_key(p.so_id, p.axis);
		const dir = world_dirs.get(key) ?? [0, 0, 0];
		entries.push({
			idx        : i,
			text       : p.pair.text,
			dir        : canonical_direction(dir),
			persisted  : persisted_before.has(key),
			ancestry   : ancestry.get(p.so_id) ?? '',
		});
	}

	// Group by (text, direction-with-tolerance). Use canonical direction so
	// v1->v2 and v2->v1 match. Bucket by a quantized key for the direction
	// (3 decimal places ≈ 0.06° resolution, well below the 2° tolerance the
	// rule needs).
	const groups = new Map<string, Entry[]>();
	for (const e of entries) {
		const dir_key = `${e.dir[0].toFixed(3)},${e.dir[1].toFixed(3)},${e.dir[2].toFixed(3)}`;
		const key = `${e.text}|${dir_key}`;
		const g = groups.get(key);
		if (g) g.push(e);
		else   groups.set(key, [e]);
	}

	const drop_idxs = new Set<number>();
	const dropped: Drop_Entry[] = [];
	for (const group of groups.values()) {
		if (group.length < 2) continue;
		// Sort per rule 4: persisted first, then parent-over-child
		// (shallower ancestry path wins — fewer dots), then alphabetical
		// by ancestry. The HEAD of the sorted list is the keeper;
		// everything else is dropped.
		group.sort((a, b) => {
			if (a.persisted !== b.persisted) return a.persisted ? -1 : 1;
			const a_depth = a.ancestry === '' ? 0 : a.ancestry.split('.').length;
			const b_depth = b.ancestry === '' ? 0 : b.ancestry.split('.').length;
			if (a_depth !== b_depth) return a_depth - b_depth;
			return a.ancestry < b.ancestry ? -1 : a.ancestry > b.ancestry ? 1 : 0;
		});
		for (let i = 1; i < group.length; i++) {
			const p = placed[group[i].idx];
			drop_idxs.add(group[i].idx);
			dropped.push({ so_id: p.so_id, so_name: p.so_name, axis: p.axis, reason: 'duplicate_text', conflict_count_at_drop: 0 });
		}
	}

	// Remove dropped indices in reverse so the remaining indices stay valid.
	const sorted_drops = Array.from(drop_idxs).sort((a, b) => b - a);
	for (const i of sorted_drops) placed.splice(i, 1);

	return dropped;
}

/** Make a unit direction unique up to sign — flip if the first non-zero
 *  component is negative. Lets the dedup treat `v1 -> v2` and `v2 -> v1`
 *  as the same direction. The `+ 0` on each component normalizes any
 *  negative-zero result of the multiplication back to positive zero so
 *  the string key downstream doesn't differ between matching directions. */
function canonical_direction(d: [number, number, number]): [number, number, number] {
	const eps = 1e-6;
	let sign = 1;
	if (Math.abs(d[0]) > eps) sign = d[0] < 0 ? -1 : 1;
	else if (Math.abs(d[1]) > eps) sign = d[1] < 0 ? -1 : 1;
	else if (Math.abs(d[2]) > eps) sign = d[2] < 0 ? -1 : 1;
	return [(d[0] * sign) + 0, (d[1] * sign) + 0, (d[2] * sign) + 0];
}

/** Polish pass (rule 23). After the drop policy removes labels, re-run
 *  the per-label position pick using only the surviving labels as
 *  obstacles. Stops surviving labels from sitting off-center to avoid
 *  neighbours that no longer exist. Mutates `placed` in place. Runs
 *  once; any new conflicts it surfaces are accepted. */
export function polish_pass(
	placed: Greedy_Placement[],
	regions: readonly Reachable_Region[],
): void {
	const region_index = new Map<string, Reachable_Region>();
	for (const r of regions) region_index.set(label_key(r.so_id, r.axis), r);

	for (let i = 0; i < placed.length; i++) {
		const current = placed[i];
		const region = region_index.get(label_key(current.so_id, current.axis));
		if (!region) continue;
		const others = placed.filter((_, k) => k !== i);
		let best: Greedy_Placement | null = null;
		for (const pair of region.pairs) {
			const cand = best_candidate_in_pair(pair, others);
			if (!cand) continue;
			if (!best || cand.min_clearance > best.min_clearance) best = cand;
		}
		if (best) placed[i] = best;
	}
}

/** Apply rule 12's drop policy. Mutates `placed` in place — labels chosen
 *  to drop are removed. Returns a report of which labels were dropped and
 *  why. */
export function apply_drop_policy(
	placed: Greedy_Placement[],
	canvas_w: number,
	canvas_h: number,
	no_viable_pair_labels: readonly { so_id: string; so_name: string; axis: Axis_Name }[] = [],
): Drop_Report {
	const dropped: Drop_Entry[] = [];

	// Reason 1 — labels that had no viable pair from the start.
	for (const l of no_viable_pair_labels) {
		dropped.push({ so_id: l.so_id, so_name: l.so_name, axis: l.axis, reason: 'no_viable_pair', conflict_count_at_drop: 0 });
	}

	// Reason 3 — labels whose rectangle would extend past the canvas edge.
	for (let i = placed.length - 1; i >= 0; i--) {
		if (rectangle_off_canvas(placed[i], canvas_w, canvas_h)) {
			const p = placed[i];
			dropped.push({ so_id: p.so_id, so_name: p.so_name, axis: p.axis, reason: 'off_canvas', conflict_count_at_drop: 0 });
			placed.splice(i, 1);
		}
	}

	// Reason 2 — iteratively drop the label with the most current conflicts
	// until no conflicts remain.
	let conflicts = find_conflicts_in_placement(placed);
	while (conflicts.length > 0) {
		const counts = new Map<number, number>();
		for (const [i, j] of conflicts) {
			counts.set(i, (counts.get(i) ?? 0) + 1);
			counts.set(j, (counts.get(j) ?? 0) + 1);
		}
		let max_idx = -1, max_count = -1;
		for (const [idx, c] of counts) {
			// Ties broken by alphabetical part ancestry path (rule 21 catch-all)
			// — operationalized as so_name + axis since this function doesn't
			// have access to the full ancestry path. Stable and deterministic.
			if (c > max_count) {
				max_count = c; max_idx = idx;
			} else if (c === max_count && max_idx >= 0) {
				const a = placed[max_idx], b = placed[idx];
				const a_key = `${a.so_name}|${a.axis}`;
				const b_key = `${b.so_name}|${b.axis}`;
				// Drop the alphabetically LATER one (so the earlier one survives).
				if (b_key > a_key) { max_idx = idx; }
			}
		}
		if (max_idx < 0) break;
		const victim = placed[max_idx];
		dropped.push({ so_id: victim.so_id, so_name: victim.so_name, axis: victim.axis, reason: 'remaining_conflict', conflict_count_at_drop: max_count });
		placed.splice(max_idx, 1);
		conflicts = find_conflicts_in_placement(placed);
	}

	return { dropped, kept_max_conflict: 0 };
}

function rectangle_off_canvas(p: Greedy_Placement, canvas_w: number, canvas_h: number): boolean {
	const half_w = p.label_w_px / 2, half_h = p.label_h_px / 2;
	return (p.center_x - half_w < 0) || (p.center_x + half_w > canvas_w) ||
	       (p.center_y - half_h < 0) || (p.center_y + half_h > canvas_h);
}

// ─── Full pipeline (Task 2.11 — feature-flag-gated entry point) ───────────────

/** Module-level persistence state. Survives between paints. Reset on
 *  scene load via `persistence.clear()`. */
export const persistence = new Persistence();

/** What `run_new_placement` returned on the most recent call. Test hooks
 *  read from this without needing to re-run the search. */
let last_run_result: Run_New_Placement_Result = {
	placements        : [],
	drop_report       : { dropped: [], kept_max_conflict: 0 },
	search_skipped    : false,
	last_search_seed  : '',
};

export function get_last_run_result(): Run_New_Placement_Result {
	return last_run_result;
}

export type Run_New_Placement_Result = {
	placements      : Greedy_Placement[];
	drop_report     : Drop_Report;
	/** True when the viability check passed and the search was skipped. */
	search_skipped  : boolean;
	/** Seed string fed to the stochastic finish on the most recent cold run. Empty on search-skipped paints. */
	last_search_seed: string;
};

/** Compose every Phase-2 piece into a single end-to-end placement run.
 *  Called from the renderer when `w_use_new_placement` is on.
 *
 *  Step 1 — gather reachable regions.
 *  Step 2 — check viability against the previous paint's choices.
 *  Step 3 — either reuse those choices (search skipped) OR run the full
 *           cold search (greedy seed → retry → stochastic finish).
 *  Step 4 — apply the drop policy.
 *  Step 5 — remember the result for the next paint.
 */
export function run_new_placement(canvas_w: number, canvas_h: number): Run_New_Placement_Result {
	const regions = compute_reachable_regions();
	const persisted_list = persistence.get_all();

	const viability = compute_viability(persisted_list, regions);
	const force_cold = persistence.should_force_cold_run();
	// Rule: while a dimension number is being edited, the layout is
	// frozen — no re-search, no reshuffle. Labels still re-project onto
	// the current pair data so dim and witness lines follow the camera,
	// but each label's four-DOF choice stays put.
	const is_editing = dimensions.state !== null;

	let placements: Greedy_Placement[];
	let search_skipped = false;
	let seed = '';

	if (is_editing && persisted_list.length > 0) {
		perf_timer.start('search_skipped');
		placements = re_project_persisted_list(persisted_list, regions);
		search_skipped = true;
		perf_timer.stop('search_skipped');
	} else if (viability.kind === 'skip_search' && !force_cold) {
		perf_timer.start('search_skipped');
		placements = [...viability.placements];
		search_skipped = true;
		if (viability.any_slack_used) persistence.note_slack_use();
		else                          persistence.clear_slack_streak();
		perf_timer.stop('search_skipped');
	} else {
		// Cold run — full greedy + retry + stochastic. When the previous
		// paint left some labels still strictly viable AND drift-safety
		// hasn't fired, those labels are locked: they stay where they
		// were, act as obstacles for the rest, and never get a fresh
		// search slot. When drift-safety forced this run, no labels are
		// locked — the whole layout is re-derived.
		const locked_placements: Greedy_Placement[] =
			(viability.kind === 'cold_run' && !force_cold) ? viability.locked : [];
		const locked_keys = new Set<Label_Key>();
		for (const p of locked_placements) locked_keys.add(label_key(p.so_id, p.axis));

		perf_timer.start('cold_search');
		const ancestry = ancestry_map_for_regions(regions);
		perf_timer.start('greedy');
		placements = greedy_seed_for_regions(regions, ancestry, locked_placements);
		perf_timer.stop('greedy');
		perf_timer.start('retry');
		retry_pass(placements, regions, locked_keys);
		perf_timer.stop('retry');
		seed = seed_string_from_regions(regions);
		perf_timer.start('stochastic');
		stochastic_finish(placements, regions, seed, 200, locked_keys);
		perf_timer.stop('stochastic');
		persistence.clear_slack_streak();
		perf_timer.stop('cold_search');
	}

	// Identify labels rejected by rule-11 filters before the search ever
	// considered them — every (part, axis) the scene expected, minus the
	// (part, axis) pairs that the search actually placed. The dropped
	// count in the status bar then includes filter rejections too.
	const expected_keys = new Set<Label_Key>();
	const expected_meta = new Map<Label_Key, { so_id: string; so_name: string; axis: Axis_Name }>();
	for (const o of scene.get_all()) {
		if (!is_visible_for_dim(o)) continue;
		const cls = classify_so(o);
		if (!cls.eligible) continue;
		for (const ax of cls.axes_allowed) {
			const k = label_key(o.so.id, ax);
			expected_keys.add(k);
			expected_meta.set(k, { so_id: o.so.id, so_name: o.so.name, axis: ax });
		}
	}
	const placed_keys_now = new Set<Label_Key>();
	for (const p of placements) placed_keys_now.add(label_key(p.so_id, p.axis));
	const no_viable_pair_labels: { so_id: string; so_name: string; axis: Axis_Name }[] = [];
	for (const k of expected_keys) {
		if (!placed_keys_now.has(k)) {
			const meta = expected_meta.get(k);
			if (meta) no_viable_pair_labels.push(meta);
		}
	}

	// Rule 4: drop duplicates (same text + parallel measured edges).
	// Done BEFORE the rest of the drop policy so off-canvas / conflict
	// checks operate on the deduplicated set. Persisted-status comes from
	// the snapshot BEFORE we replace the persistence with this paint's
	// remember_all call below.
	const persisted_before = new Set<Label_Key>();
	for (const p of persisted_list) persisted_before.add(label_key(p.so_id, p.axis));
	const world_dirs = compute_world_edge_directions(placements);
	const ancestry_for_drops = ancestry_map_for_regions(regions);
	const duplicate_drops = drop_duplicates(placements, persisted_before, world_dirs, ancestry_for_drops);

	const drop_report = apply_drop_policy(placements, canvas_w, canvas_h, no_viable_pair_labels);
	drop_report.dropped.unshift(...duplicate_drops);

	// Polish pass (rule 23): re-position every survivor against the
	// reduced obstacle set so labels that moved off-center to avoid a
	// now-dropped neighbour can return to a better position.
	polish_pass(placements, regions);

	persistence.clear();
	persistence.remember_all(placements);

	log_dim_summary(expected_keys.size, placements.length, drop_report.dropped);

	last_run_result = { placements, drop_report, search_skipped, last_search_seed: seed };
	return last_run_result;
}

/** Last summary string we printed. The per-paint summary only fires
 *  when the new lines differ from the previous ones — stops the console
 *  from flooding while the user tumbles or repaints with the same state. */
let last_logged_summary = '';

/** Per-paint diagnostic. Prints a plain-English summary of how many
 *  labels were expected, how many made it onto the canvas, and — for
 *  the lost ones — what filter killed each. Also names the blocking
 *  parts for the first five labels whose every edge was hidden, so
 *  it's clear WHICH parts are doing the occluding. Logs only when the
 *  numbers change from the previous paint. */
function log_dim_summary(
	expected: number,
	placed: number,
	dropped: readonly Drop_Entry[],
): void {
	const drops_by_reason = {
		no_viable_pair     : 0,
		duplicate_text     : 0,
		off_canvas         : 0,
		remaining_conflict : 0,
	};
	for (const d of dropped) drops_by_reason[d.reason]++;

	let all_hidden = 0;
	let all_short = 0;
	let all_directions_rejected = 0;
	let all_projection_broken = 0;
	let mixed_reasons = 0;
	for (const d of dropped) {
		if (d.reason !== 'no_viable_pair') continue;
		const s = last_filter_stats.per_label.get(`${d.so_id}|${d.axis}`);
		const total = s
			? s.edges_hidden + s.edges_too_short + s.edges_projection_broken + s.edges_no_viable_direction
			: 0;
		if (!s || total === 0)                          { mixed_reasons++; continue; }
		if (s.edges_hidden              === total)      all_hidden++;
		else if (s.edges_too_short      === total)      all_short++;
		else if (s.edges_no_viable_direction === total) all_directions_rejected++;
		else if (s.edges_projection_broken   === total) all_projection_broken++;
		else                                            mixed_reasons++;
	}

	const line1 =
		`DIM: ${expected} labels expected, ${placed} placed, ${dropped.length} dropped ` +
		`(no viable edge ${drops_by_reason.no_viable_pair}, duplicate text ${drops_by_reason.duplicate_text}, ` +
		`off canvas ${drops_by_reason.off_canvas}, conflict ${drops_by_reason.remaining_conflict})`;

	let line2 = '';
	if (drops_by_reason.no_viable_pair > 0) {
		line2 =
			`DIM: of the ${drops_by_reason.no_viable_pair} with no viable edge: ` +
			`every edge hidden behind another part ${all_hidden}, ` +
			`every edge too short on screen ${all_short}, ` +
			`every direction rejected ${all_directions_rejected}, ` +
			`every projection broken ${all_projection_broken}, ` +
			`mixed reasons ${mixed_reasons}`;
	}

	let line3 = '';
	const sample: string[] = [];
	for (const d of dropped) {
		if (d.reason !== 'no_viable_pair') continue;
		const set = last_blockers_per_label.get(`${d.so_id}|${d.axis}`);
		if (!set || set.size === 0) continue;
		const names = Array.from(set).slice(0, 4).join(', ');
		sample.push(`${d.so_name} along ${d.axis} — blocked by ${names}`);
		if (sample.length >= 5) break;
	}
	if (sample.length > 0) {
		line3 = `DIM blocker sample: ${sample.join('; ')}`;
	}

	const full = `${line1}\n${line2}\n${line3}`;
	if (full === last_logged_summary) return;
	last_logged_summary = full;

	console.log(line1);
	if (line2) console.log(line2);
	if (line3) console.log(line3);
}

/** For each placement, compute the world-space direction of the measured
 *  edge as a unit 3-tuple. Looks up the smart object and transforms the
 *  edge into world coordinates once per paint. */
function compute_world_edge_directions(placed: readonly Greedy_Placement[]): Map<Label_Key, [number, number, number]> {
	const out = new Map<Label_Key, [number, number, number]>();
	const sos = new Map<string, ReturnType<typeof scene.get_all>[number]>();
	for (const o of scene.get_all()) sos.set(o.so.id, o);
	for (const p of placed) {
		const o = sos.get(p.so_id);
		if (!o) { out.set(label_key(p.so_id, p.axis), [0, 0, 0]); continue; }
		const wm = render.get_world_matrix(o);
		const v1 = o.so.vertices[p.pair.edge_v1_idx];
		const v2 = o.so.vertices[p.pair.edge_v2_idx];
		const v1_w = vec3.transformMat4(vec3.create(), v1, wm);
		const v2_w = vec3.transformMat4(vec3.create(), v2, wm);
		const dir = vec3.subtract(vec3.create(), v2_w, v1_w);
		const len = Math.hypot(dir[0], dir[1], dir[2]);
		if (len < 1e-6) { out.set(label_key(p.so_id, p.axis), [0, 0, 0]); continue; }
		out.set(label_key(p.so_id, p.axis), [dir[0] / len, dir[1] / len, dir[2] / len]);
	}
	return out;
}

function ancestry_map_for_regions(regions: readonly Reachable_Region[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const r of regions) {
		const obj = scene.get_all().find(o => o.so.id === r.so_id);
		map.set(r.so_id, obj ? ancestry_path_of(obj.so) : '');
	}
	return map;
}

// ─── Stochastic finish (rule 23 stochastic step) ───────────────────────────────

/** A stable seed string derived from the current scene's drawn labels.
 *  Same labels → same seed → same random sequence → same final layout. */
export function seed_string_from_regions(regions: readonly Reachable_Region[]): string {
	return regions.map(r => label_key(r.so_id, r.axis)).sort().join(',');
}

/** Up to 200 random switches. Each step picks a random conflicted label
 *  and swaps it to a random other viable pair. Accept the change if the
 *  total conflict count drops; reject if it stays the same or grows.
 *  Deterministic given the same seed string. Returns the same array
 *  it was given, mutated in place. `locked_keys` names labels that may
 *  not be picked as a swap target — they still count as obstacles. */
export function stochastic_finish(
	placed: Greedy_Placement[],
	regions: readonly Reachable_Region[],
	seed: string,
	max_iterations: number = 200,
	locked_keys: ReadonlySet<Label_Key> = new Set(),
): Greedy_Placement[] {
	const rng = new Seeded_Random(seed);
	const region_index = new Map<string, Reachable_Region>();
	for (const r of regions) region_index.set(label_key(r.so_id, r.axis), r);

	let conflicts = find_conflicts_in_placement(placed);
	for (let iter = 0; iter < max_iterations && conflicts.length > 0; iter++) {
		// Pick a random label currently in conflict.
		const conflicted_indices_set = new Set<number>();
		for (const [i, j] of conflicts) { conflicted_indices_set.add(i); conflicted_indices_set.add(j); }
		for (const idx of Array.from(conflicted_indices_set)) {
			if (locked_keys.has(label_key(placed[idx].so_id, placed[idx].axis))) conflicted_indices_set.delete(idx);
		}
		const conflicted_indices = Array.from(conflicted_indices_set).sort((a, b) => a - b);
		if (conflicted_indices.length === 0) break;
		const target_idx = rng.pick_one(conflicted_indices);

		const current = placed[target_idx];
		const region = region_index.get(label_key(current.so_id, current.axis));
		if (!region) continue;

		const other_pairs = region.pairs.filter(p => p !== current.pair);
		if (other_pairs.length === 0) continue;
		const new_pair = rng.pick_one(other_pairs);

		const others = placed.filter((_, k) => k !== target_idx);
		const candidate = best_candidate_in_pair(new_pair, others);
		if (!candidate) continue;

		const saved = placed[target_idx];
		placed[target_idx] = candidate;
		const new_conflicts = find_conflicts_in_placement(placed);
		if (new_conflicts.length < conflicts.length) {
			conflicts = new_conflicts;
		} else {
			placed[target_idx] = saved;
		}
	}
	return placed;
}

/** Ancestry path of a smart object, dotted, root excluded. Duplicated
 *  here because Dimension_Placement must not depend on Debug. */
function ancestry_path_of(so: Smart_Object): string {
	const names: string[] = [];
	let current: Smart_Object | null = so;
	while (current) {
		names.push(current.name);
		current = current.scene?.parent?.so ?? null;
	}
	names.pop();
	return names.reverse().join('.');
}

/** Brute-force-verify the conflict graph against the rule-10 definition:
 *  walk every pair of labels in the current scene, compute "can separate"
 *  the direct way (`labels_can_separate_via_some_combination`), compare
 *  with the graph. Returns any pairs the graph disagrees with the
 *  brute-force result on. Used by the test hook `dim_conflict_graph_check`. */
export function check_conflict_graph(): { a: Label_Key; b: Label_Key; brute_can_separate: boolean; graph_says_in_conflict: boolean }[] {
	const regions = compute_reachable_regions();
	const graph = build_conflict_graph();
	const mismatches: { a: Label_Key; b: Label_Key; brute_can_separate: boolean; graph_says_in_conflict: boolean }[] = [];
	for (let i = 0; i < regions.length; i++) {
		for (let j = i + 1; j < regions.length; j++) {
			const a = regions[i], b = regions[j];
			const brute_can_separate = labels_can_separate_via_some_combination(a.pairs, b.pairs);
			const a_key = label_key(a.so_id, a.axis);
			const b_key = label_key(b.so_id, b.axis);
			const graph_says_in_conflict = graph.has_edge(a_key, b_key);
			// The two should agree: brute "cannot separate" ↔ graph "in conflict".
			if ((!brute_can_separate) !== graph_says_in_conflict) {
				mismatches.push({ a: a_key, b: b_key, brute_can_separate, graph_says_in_conflict });
			}
		}
	}
	return mismatches;
}
