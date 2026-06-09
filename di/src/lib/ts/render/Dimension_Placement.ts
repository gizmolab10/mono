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
import { k } from '../common/Constants';
import { vec3, mat4, quat } from 'gl-matrix';
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
export let last_hull: Array<{ x: number; y: number }> = [];
export let last_hull_input: Array<{ x: number; y: number; so_id: string; so_name: string }> = [];
/** Per-part convex hulls of each rendered leaf part's projected vertices.
 *  Replaces the single combined hull for the rule-9 silhouette pushback:
 *  a label can sit in empty space BETWEEN parts even when the combined
 *  outline would have wrapped that space. The witness pushback computes
 *  the furthest distance the ray needs to travel to exit the union of
 *  ALL these per-part hulls along the witness direction. */
export let last_per_part_hulls: Array<{ so_id: string; hull: Array<{ x: number; y: number }> }> = [];

/** Status-bar running average of how many dimensions get dropped per
 *  render. The renderer publishes to this. */
export const w_dim_dropped_avg = stale_writable<number>(0);

/** Per-(part, axis) tally of how each candidate edge was treated by the
 *  filters in `compute_viable_pairs`. Populated every call to that
 *  function. Read by `run_new_placement` to print a plain-English summary
 *  whenever a render loses labels. */
export type Per_Label_Filter_Stats = {
	edges_hidden              : number;
	edges_too_short           : number;
	edges_projection_broken   : number;
	edges_no_viable_direction : number;
	edges_yielded_pairs       : number;
	// Per-direction-attempt rejection counters inside compute_pair_ranges.
	// Counted alongside the edge counters so the summary can show what
	// kills directions for labels that survived the per-edge filters.
	directions_silhouette_too_far    : number;
	directions_witness_range_empty   : number;
	directions_slidable_range_empty  : number;
	directions_projection_degenerate : number;
	directions_witnesses_converge    : number;
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

/** Diagnostic: every (edge, direction) attempt that got rejected with
 *  reason "silhouette too far", with the per-hull exit-t values that
 *  drove the rejection. Cleared at the start of `compute_viable_pairs`. */
export const last_silhouette_rejects: Array<{
	so_name      : string;
	axis         : Axis_Name;
	v1_idx       : number;
	v2_idx       : number;
	wit_ux       : number;
	wit_uy       : number;
	per_hull     : Array<{ so_id: string; t: number }>;
	witness_length_min : number;
	cap          : number;
}> = [];

function bump_filter_stat(key: string, field: keyof Per_Label_Filter_Stats): void {
	let s = last_filter_stats.per_label.get(key);
	if (!s) {
		s = {
			edges_hidden                     : 0,
			edges_too_short                  : 0,
			edges_projection_broken          : 0,
			edges_no_viable_direction        : 0,
			edges_yielded_pairs              : 0,
			directions_silhouette_too_far    : 0,
			directions_witness_range_empty   : 0,
			directions_slidable_range_empty  : 0,
			directions_projection_degenerate : 0,
			directions_witnesses_converge    : 0,
		};
		last_filter_stats.per_label.set(key, s);
	}
	s[field]++;
}

function compute_combined_hull(): void {
	const all_objects = scene.get_all();
	const points: Array<{ x: number; y: number }> = [];
	const tagged: Array<{ x: number; y: number; so_id: string; so_name: string }> = [];
	const per_part: Array<{ so_id: string; hull: Array<{ x: number; y: number }> }> = [];
	const rendered = new Set<O_Scene>();
	for (const o of all_objects) if (is_visible_for_dim(o)) rendered.add(o);
	const has_rendered_child = (obj: O_Scene): boolean => {
		for (const other of all_objects) {
			if (other.parent === obj && rendered.has(other)) return true;
		}
		return false;
	};
	for (const obj of all_objects) {
		if (!rendered.has(obj)) continue;
		if (has_rendered_child(obj)) continue;
		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;
		const own_points: Array<{ x: number; y: number }> = [];
		for (const p of projected) {
			if (p.w >= 0) {
				points.push({ x: p.x, y: p.y });
				tagged.push({ x: p.x, y: p.y, so_id: obj.so.id, so_name: obj.so.name });
				own_points.push({ x: p.x, y: p.y });
			}
		}
		if (own_points.length >= 3) {
			per_part.push({ so_id: obj.so.id, hull: convex_hull(own_points) });
		}
	}
	last_hull = points.length >= 3 ? convex_hull(points) : [];
	last_hull_input = tagged;
	last_per_part_hulls = per_part;
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
	 *  The renderer reads these so the two witness lines diverge correctly
	 *  in perspective — world-parallel rays do not project to screen-
	 *  parallel rays unless the edge is parallel to the image plane. */
	wit_1_per3d_x : number;
	wit_1_per3d_y : number;
	wit_2_per3d_x : number;
	wit_2_per3d_y : number;
	/** Formatted number text the renderer will draw. Computed once when the pair is built. */
	text         : string;
	/** NDC depth at the dim line midpoint, used by the renderer for the hit-test rectangle. */
	dim_z        : number;
	/** True when the adjacent face this direction came from is front-facing
	 *  on screen (its projected winding is positive). The search adds a
	 *  bonus to front-facing candidates so dimensions land on the visible
	 *  side of a part. Optional for back-compat with test fixtures. */
	is_front_facing? : boolean;
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
 * object's three axes at the current render. Reads the combined hull from
 * the most recent render of R_Dimensions.
 */
export function compute_viable_pairs(): Viable_Pair[] {
	compute_combined_hull();
	last_filter_stats.total_edges_considered = 0;
	last_filter_stats.per_label.clear();
	last_blockers_per_label.clear();
	last_silhouette_rejects.length = 0;
	const result: Viable_Pair[] = [];
	if (last_hull.length < 3) return result;
	if (!render.ctx)            return result;

	const cam_forward = compute_camera_forward();

	// Pre-build the list of potential occluders for rule 11's edge-visibility
	// check. Each rendered part contributes its projected vertices and the
	// list of its faces. The check at each edge filters out the OWN part.
	const all_objects = scene.get_all();
	type Occluder = { so_id: string; so_name: string; projected: Projected[]; faces: number[][] };
	const all_occluders: Occluder[] = [];
	// Rule 11 edge-visibility filter only fires in solid render mode. In
	// x-ray render mode no face is drawn solidly, so no face can hide an
	// edge — leave the blocker list empty and the per-edge check returns
	// false outright.
	if (stores.is_solid) {
		for (const o of all_objects) {
			if (!is_occluder_for_dim(o)) continue;
			const proj = hits_3d.get_projected(o.id);
			if (!proj) continue;
			const faces = o.so.scene?.faces;
			if (!faces) continue;
			all_occluders.push({ so_id: o.so.id, so_name: o.so.name, projected: proj, faces });
		}
	}

	for (const obj of all_objects) {
		if (!is_visible_for_dim(obj)) continue;
		const classification = classify_so(obj);
		if (!classification.eligible) continue;
		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;
		const world_matrix = render.get_world_matrix(obj);
		// Input the disabled rule-11 visibility check used. Kept commented
		// alongside the check itself so re-wiring is a one-step uncomment.
		// const others_as_occluders = all_occluders.filter(o => o.so_id !== obj.so.id);

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
				if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < k.dimensions.WITNESS_CLEARANCE_PX) {
					bump_filter_stat(lkey, 'edges_too_short');
					continue;
				}

				const all_dirs = two_face_outward_directions(obj.so, v1_idx, v2_idx, projected);
				const allowed_dirs = all_dirs.filter(d => passes_camera_axis_filter(d.dir, world_matrix, cam_forward));
				// Better degenerate than missing: when every direction is
				// rejected by the camera-angle filter, fall back to trying
				// both anyway so the label still appears (even if
				// foreshortened). Matches the old renderer's behavior.
				const dirs_to_try = allowed_dirs.length > 0 ? allowed_dirs : all_dirs;
				let yielded_any = false;
				for (const d of dirs_to_try) {
					const r = compute_pair_ranges({
						so       : obj.so,
						kind     : classification.kind,
						axis,
						v1_idx, v2_idx,
						direction: d.dir,
						is_front : d.is_front,
						world_matrix,
						p1, p2,
						label_w_px, label_h_px,
						text,
					});
					if (r.ok) { result.push(r.pair); yielded_any = true; }
					else {
						// Count which downstream filter killed this direction
						// so the diagnostic can name the dominant cause.
						const field =
							r.reason === 'silhouette_too_far'    ? 'directions_silhouette_too_far'    :
							r.reason === 'witness_range_empty'   ? 'directions_witness_range_empty'   :
							r.reason === 'slidable_range_empty'  ? 'directions_slidable_range_empty'  :
							r.reason === 'witnesses_converge'    ? 'directions_witnesses_converge'    :
							                                       'directions_projection_degenerate';
						bump_filter_stat(lkey, field);
					}
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
 *  X-ray mode mirrors the dimension-visibility check for consistency.
 *
 *  The two boolean params default to the live scene/keyboard state. Tests
 *  pass them explicitly to avoid touching globals. */
export function is_occluder_for_dim(
	obj: O_Scene,
	option_held: boolean = get(e.w_option_down),
	has_hidden_in_scene: boolean = scene.get_all().some(o => !o.so.visible),
): boolean {
	const xray_mode = option_held && has_hidden_in_scene;
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

/** Gap between the two witness lines on screen, treating the edge,
 *  the dim line, and the two witnesses as an irregular trapezoid.
 *  Picks the corner with the LARGER interior angle (the more-obtuse one),
 *  drops a perpendicular from that corner onto the OTHER witness's
 *  infinite line, and returns the length of that perpendicular. Ties go
 *  to W1's corner. The number captures the visible gap independent of
 *  where along the witness length you sample. Used by rule 11 to reject
 *  (edge, direction) pairs whose witnesses get closer than the WITNESS
 *  clearance. */
export function witness_trapezoid_gap(
	p1: { x: number; y: number },
	p2: { x: number; y: number },
	wit_1_dir: { x: number; y: number },
	wit_2_dir: { x: number; y: number },
): number {
	const m1 = Math.hypot(wit_1_dir.x, wit_1_dir.y);
	const m2 = Math.hypot(wit_2_dir.x, wit_2_dir.y);
	if (m1 < 1e-9 || m2 < 1e-9) return Math.hypot(p2.x - p1.x, p2.y - p1.y);
	const u1x = wit_1_dir.x / m1, u1y = wit_1_dir.y / m1;
	const u2x = wit_2_dir.x / m2, u2y = wit_2_dir.y / m2;

	const edx = p2.x - p1.x, edy = p2.y - p1.y;
	const elen = Math.hypot(edx, edy);
	if (elen < 1e-9) return 0;
	const ex = edx / elen, ey = edy / elen;

	// Cosines of the interior angles at each anchor. Larger angle = smaller cosine.
	const cos_at_p1 =  ex * u1x +  ey * u1y;
	const cos_at_p2 = -ex * u2x + -ey * u2y;

	// Pick the corner with the larger angle. Tie → pick W1's corner (p1).
	let obs_x: number, obs_y: number, u_obs_x: number, u_obs_y: number;
	let oth_x: number, oth_y: number, u_oth_x: number, u_oth_y: number;
	if (cos_at_p1 <= cos_at_p2) {
		obs_x = p1.x; obs_y = p1.y; u_obs_x = u1x; u_obs_y = u1y;
		oth_x = p2.x; oth_y = p2.y; u_oth_x = u2x; u_oth_y = u2y;
	} else {
		obs_x = p2.x; obs_y = p2.y; u_obs_x = u2x; u_obs_y = u2y;
		oth_x = p1.x; oth_y = p1.y; u_oth_x = u1x; u_oth_y = u1y;
	}

	// Perpendicular to the obtuse witness (rotate 90°).
	const perp_x = -u_obs_y, perp_y = u_obs_x;
	// Solve `obs + s*perp = other + t*u_other` for s. Distance = |s|.
	const Dx = oth_x - obs_x;
	const Dy = oth_y - obs_y;
	const det = perp_x * (-u_oth_y) - perp_y * (-u_oth_x);
	if (Math.abs(det) < 1e-9) {
		// Witnesses parallel — fall back to the perpendicular projection of D.
		return Math.abs(perp_x * Dx + perp_y * Dy);
	}
	const s = (Dx * (-u_oth_y) - Dy * (-u_oth_x)) / det;
	return Math.abs(s);
}

/** Convention: the renderer treats NEGATIVE projected winding as
 *  front-facing on screen (see `Render.ts:452` and others). This helper
 *  documents that convention in one place so the dimensioning code does
 *  not invert it by accident. */
export function is_face_front_facing(winding: number): boolean {
	return winding < 0;
}

/** Per the rule-1 direction definition: each silhouette edge has TWO
 *  possible directions, one for each of its two adjacent faces. The
 *  direction is perpendicular to the edge, lies in the face's plane,
 *  and points AWAY from the face's centroid — past the edge, into the
 *  clear space outside the part. This is the direction an engineering-
 *  drawing witness line actually extends. All vectors are in the SO's
 *  local frame; the caller transforms them to world coordinates as
 *  needed. Also reports the projected winding sign of each adjacent
 *  face (positive = front-facing on screen) so the search can bias
 *  toward placing dimensions on the visible side. */
function two_face_outward_directions(
	so: Smart_Object,
	v1_idx: number,
	v2_idx: number,
	projected: Projected[],
): Array<{ dir: vec3; is_front: boolean }> {
	const faces = so.scene?.faces;
	if (!faces) return [];
	const adj = edges_to_adjacent_faces(faces, v1_idx, v2_idx);
	if (adj.length !== 2) return [];
	const v1 = so.vertices[v1_idx];
	const v2 = so.vertices[v2_idx];
	const edge_unit = vec3.subtract(vec3.create(), v2, v1);
	if (vec3.length(edge_unit) < 1e-9) return [];
	vec3.normalize(edge_unit, edge_unit);
	const mid = vec3.scale(vec3.create(), vec3.add(vec3.create(), v1, v2), 0.5);

	const out: Array<{ dir: vec3; is_front: boolean }> = [];
	for (const fi of adj) {
		const face = faces[fi];
		const centroid = vec3.create();
		for (const vi of face) vec3.add(centroid, centroid, so.vertices[vi]);
		vec3.scale(centroid, centroid, 1 / face.length);
		const offset = vec3.subtract(vec3.create(), centroid, mid);
		const along = vec3.dot(offset, edge_unit);
		const perp = vec3.scaleAndAdd(vec3.create(), offset, edge_unit, -along);
		// Flip: the perp computed above points TOWARD the centroid (along
		// the face surface, into the part body). Negate to point AWAY
		// from the centroid — past the edge, into clear space outside.
		vec3.negate(perp, perp);
		if (vec3.length(perp) > 1e-6) {
			vec3.normalize(perp, perp);
			const is_front = is_face_front_facing(render.face_winding(face, projected));
			out.push({ dir: perp, is_front });
		}
	}
	return out;
}

function passes_camera_axis_filter(dir: vec3, world_matrix: mat4, cam_forward: vec3): boolean {
	const origin = vec3.create();
	const tip    = vec3.create();
	vec3.transformMat4(tip, dir, world_matrix);
	vec3.transformMat4(origin, vec3.create(), world_matrix);
	const world_dir = vec3.create();
	vec3.subtract(world_dir, tip, origin);
	vec3.normalize(world_dir, world_dir);
	return Math.abs(vec3.dot(world_dir, cam_forward)) <= k.dimensions.FORBIDDEN_CAM_DOT;
}

/** Compute the (witness length, slidable position) DOF ranges for one (edge, direction) pair. Returns null if any range collapses (line too short, off-canvas, projection breaks). */
/** Discriminated outcome of `compute_pair_ranges`. The success case
 *  carries the pair; the failure cases carry a tag the diagnostic can
 *  count. Tags are coarser than the in-function checks: any projection
 *  or magnitude degeneracy lumps into 'projection_degenerate' because
 *  the user-visible cause is the same. */
type Pair_Range_Result =
	| { ok: true; pair: Viable_Pair }
	| { ok: false; reason: 'projection_degenerate' | 'silhouette_too_far' | 'witness_range_empty' | 'slidable_range_empty' | 'witnesses_converge' };

function compute_pair_ranges(args: {
	so          : Smart_Object;
	kind        : Label_Kind;
	axis        : Axis_Name;
	v1_idx      : number;
	v2_idx      : number;
	direction   : vec3;
	is_front    : boolean;
	world_matrix: mat4;
	p1          : Projected;
	p2          : Projected;
	label_w_px  : number;
	label_h_px  : number;
	text        : string;
}): Pair_Range_Result {
	const { so, kind, axis, v1_idx, v2_idx, direction, is_front, world_matrix, p1, p2, label_w_px, label_h_px, text } = args;
	const v1 = so.vertices[v1_idx];
	const v2 = so.vertices[v2_idx];

	// Defensive: the outer loop pre-checks edge length, but other callers
	// may not. A sub-3-pixel projected edge counts as a degenerate
	// projection here.
	if (Math.hypot(p2.x - p1.x, p2.y - p1.y) < k.dimensions.WITNESS_CLEARANCE_PX) return { ok: false, reason: 'projection_degenerate' };

	// Project the 1-unit-offset versions of the two edge endpoints to find
	// the pixels-per-3D-unit conversion factor along this direction.
	const v1_plus = vec3.add(vec3.create(), v1, direction);
	const v2_plus = vec3.add(vec3.create(), v2, direction);
	const p_v1w = render.project_vertex(v1_plus, world_matrix);
	const p_v2w = render.project_vertex(v2_plus, world_matrix);
	if (p_v1w.w < 0 || p_v2w.w < 0) return { ok: false, reason: 'projection_degenerate' };

	const wlen1 = Math.hypot(p_v1w.x - p1.x, p_v1w.y - p1.y);
	const wlen2 = Math.hypot(p_v2w.x - p2.x, p_v2w.y - p2.y);
	if (wlen1 < 0.001 || wlen2 < 0.001) return { ok: false, reason: 'projection_degenerate' };
	const avg_wlen_per_3d_unit = (wlen1 + wlen2) / 2;

	// Witness direction on screen (unit vector along the projected witness ray).
	const wit_dx = p_v1w.x - p1.x;
	const wit_dy = p_v1w.y - p1.y;
	const wit_screen_len = Math.hypot(wit_dx, wit_dy);
	if (wit_screen_len < 0.001) return { ok: false, reason: 'projection_degenerate' };
	const wit_ux = wit_dx / wit_screen_len;
	const wit_uy = wit_dy / wit_screen_len;

	// Midpoint of the projected edge, in screen pixels — the starting point
	// of the dim line at zero push.
	const midX_init = (p1.x + p2.x) / 2;
	const midY_init = (p1.y + p2.y) / 2;

	// Witness-length min: distance from edge midpoint along the witness
	// direction to the furthest part-outline exit (across every rendered
	// part's own hull), plus the half-rectangle footprint along the
	// direction, plus the silhouette margin. Using per-part hulls instead
	// of the combined hull means a label can sit in empty space BETWEEN
	// parts — it only has to push past whichever part outlines the ray
	// actually traverses, not the convex envelope of the whole scene.
	let exit_t = 0;
	const per_hull_exits: Array<{ so_id: string; t: number }> = [];
	for (const ph of last_per_part_hulls) {
		const t = ray_polygon_exit(midX_init, midY_init, wit_ux, wit_uy, ph.hull);
		per_hull_exits.push({ so_id: ph.so_id, t });
		if (t > exit_t) exit_t = t;
	}
	const rect_radius_along_arrow = (label_w_px * Math.abs(wit_ux) + label_h_px * Math.abs(wit_uy)) / 2;
	const witness_length_min = exit_t + rect_radius_along_arrow + k.dimensions.SILHOUETTE_MARGIN_PX;
	if (witness_length_min > k.dimensions.WITNESS_CAP_PX) {
		last_silhouette_rejects.push({
			so_name : so.name,
			axis,
			v1_idx, v2_idx,
			wit_ux, wit_uy,
			per_hull : per_hull_exits,
			witness_length_min,
			cap : k.dimensions.WITNESS_CAP_PX,
		});
		return { ok: false, reason: 'silhouette_too_far' };
	}

	// Witness-length max: smaller of 80 and the value at which the
	// projected witness reaches 120 px. Linear approximation: at push P
	// the projected witness is ~ P (because avg_wlen is the per-3D-unit
	// projected length and P/avg_wlen is the 3D-distance equivalent, then
	// times avg_wlen back to projection ≈ P; for short pushes the linear
	// approximation is exact, for long ones perspective foreshortening
	// makes the line shorter than P, so 120 px ≈ 120 px of push).
	let witness_length_max = k.dimensions.WITNESS_CAP_PX;
	if (witness_length_max > k.dimensions.WITNESS_LEN_MAX_PX) witness_length_max = k.dimensions.WITNESS_LEN_MAX_PX;
	if (witness_length_max < witness_length_min) return { ok: false, reason: 'witness_range_empty' };

	// Perspective convergence: world-parallel witness lines project to
	// non-parallel screen rays when the edge is not parallel to the image
	// plane. Treat the edge + dim line + two witnesses as an irregular
	// trapezoid; measure the perpendicular gap from the wider-angle
	// corner to the opposite witness. Reject pairs whose visible
	// witnesses get closer than the WITNESS clearance.
	const trap_gap = witness_trapezoid_gap(
		{ x: p1.x, y: p1.y },
		{ x: p2.x, y: p2.y },
		{ x: p_v1w.x - p1.x, y: p_v1w.y - p1.y },
		{ x: p_v2w.x - p2.x, y: p_v2w.y - p2.y },
	);
	if (trap_gap < k.dimensions.WITNESS_CLEARANCE_PX) return { ok: false, reason: 'witnesses_converge' };

	// Slidable-position range, along the dim line (which runs from the
	// projected witness-1 anchor to the projected witness-2 anchor).
	const dim_line_length_px = Math.hypot(p2.x - p1.x, p2.y - p1.y);
	const slidable_min = label_w_px / 2 - k.dimensions.SLIDABLE_OVERHANG_PX;
	const slidable_max = dim_line_length_px + k.dimensions.SLIDABLE_OVERHANG_PX - label_w_px / 2;
	if (slidable_max <= slidable_min) return { ok: false, reason: 'slidable_range_empty' };

	return { ok: true, pair: {
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
		is_front_facing : is_front,
	} };
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

/** Rule 24's first pass: find every pair of labels whose reachable
 *  regions overlap when expanded by 22 pixels. Uses a coarse grid so
 *  the cost is order of (label count) times log (label count), not
 *  label count squared. */
export function compute_neighbour_pairs(): Candidate_Pair[] {
	const regions = compute_reachable_regions();
	return neighbour_pairs_from_regions(regions);
}

/** The cell-grid worker. Exposed for unit-tests; the real call site goes
 *  through `compute_neighbour_pairs`. */
export function neighbour_pairs_from_regions(regions: readonly Reachable_Region[]): Candidate_Pair[] {
	const cell = k.dimensions.NEIGHBOUR_GRID_CELL_PX;
	const margin = k.dimensions.PAIR_CLEARANCE_PX;
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
export function pair_can_separate(pair_a: Viable_Pair, pair_b: Viable_Pair, clearance_px = k.dimensions.PAIR_CLEARANCE_PX): boolean {
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
	clearance_px = k.dimensions.PAIR_CLEARANCE_PX,
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
 *  the set of labels carried over from the previous render that should
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
	// Hard front-face preference (rule 10): try every pair whose face is
	// front-facing on screen first. Only if NO front-facing pair yields a
	// viable candidate, fall back to the back-facing pairs.
	const front_pairs = region.pairs.filter(p => p.is_front_facing);
	const back_pairs  = region.pairs.filter(p => !p.is_front_facing);
	for (const group of [front_pairs, back_pairs]) {
		let best: Greedy_Placement | null = null;
		for (const pair of group) {
			const candidate = best_candidate_in_pair(pair, placed);
			if (!candidate) continue;
			if (!best || candidate.min_clearance > best.min_clearance) {
				best = candidate;
			}
		}
		if (best) return best;
	}
	return null;
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
	const Y_BUF = k.dimensions.WITNESS_ANCHOR_BUFFER_PX;
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

	let best: Greedy_Placement | null = null;
	let best_score = -Infinity;
	const W_step = (pair.witness_length_max - pair.witness_length_min) / Math.max(1, k.dimensions.GRID_RESOLUTION - 1);
	const S_step = (pair.slidable_max - pair.slidable_min) / Math.max(1, k.dimensions.GRID_RESOLUTION - 1);

	for (let i = 0; i < k.dimensions.GRID_RESOLUTION; i++) {
		const W = pair.witness_length_min + W_step * i;
		for (let j = 0; j < k.dimensions.GRID_RESOLUTION; j++) {
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
					const push = push_outside_hull(px, py, hull as Array<{ x: number; y: number }>, k.dimensions.SILHOUETTE_MARGIN_PX);
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
			const clearance_for_score = Math.min(min_clearance, k.dimensions.CLEARANCE_SCORE_CAP_PX);

			const is_between = S > w1_forb_hi && S < w2_forb_lo;
			let score = clearance_for_score;
			// Front-face bias: when the adjacent face whose plane this
			// dim line lies in points toward the camera, the dimension
			// sits on the visible side of the part. Give it a bonus so
			// the search prefers it over the equivalent back-face choice.
			if (pair.is_front_facing) score += k.dimensions.FRONT_FACE_BONUS;
			// Witness-shortness bias: penalise pushing the dim line
			// further from the part than the silhouette requires. Without
			// this the search picks the longest witness when clearance is
			// otherwise equal, and labels float far from their part.
			score -= k.dimensions.WITNESS_LENGTH_PENALTY_PER_PX * (W - pair.witness_length_min);
			if (is_between) {
				score += between_bonus;
				if (half_dl > 0) {
					const norm_d = Math.abs(S - midpoint) / half_dl;
					score -= k.dimensions.CENTERING_MAX_PX * norm_d * norm_d;
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
		if (placed_pair_distance(placed[i], placed[j]) >= k.dimensions.PAIR_CLEARANCE_PX) continue;
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
			if (placed_pair_distance(placed[i], placed[j]) < k.dimensions.PAIR_CLEARANCE_PX) {
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
		if (best && best.min_clearance >= k.dimensions.PAIR_CLEARANCE_PX) {
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
		if (!best_a || best_a.min_clearance < k.dimensions.PAIR_CLEARANCE_PX) continue;

		for (const pair_b of region_b.pairs) {
			if (pair_b === b.pair) continue;
			const best_b = best_candidate_in_pair(pair_b, [...others, best_a]);
			if (!best_b || best_b.min_clearance < k.dimensions.PAIR_CLEARANCE_PX) continue;
			placed[i] = best_a;
			placed[j] = best_b;
			return true;
		}
	}
	return false;
}

// ─── Persistence with 2-pixel tolerance (rule 19) ─────────────────────────────

const STRICT_PAIRWISE_PX       = k.dimensions.PAIR_CLEARANCE_PX;
const TOL_PAIRWISE_PX          = k.dimensions.PAIR_CLEARANCE_PX - k.dimensions.PERSISTENCE_TOLERANCE_PX;

/** A label's chosen four-DOF values from the previous render. The pair
 *  identity is reconstructed by matching `edge_v1_idx`, `edge_v2_idx`,
 *  and `direction` against the current render's regions. */
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

/** Outcome of the viability check at the start of a render. Either the
 *  search can be skipped entirely (all labels still viable within the
 *  2-pixel tolerance), OR a cold-run search is needed with some labels
 *  LOCKED (still strict-viable) and others FREE (to be re-placed). */
export type Viability_Result =
	| { kind: 'skip_search'; placements: Greedy_Placement[]; any_slack_used: boolean }
	| { kind: 'cold_run'; locked: Greedy_Placement[]; free_label_keys: Label_Key[] };

/** Run rule 19's viability checks for every persisted label against the
 *  current render's regions. Returns either a skip-search outcome (all
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
		const tol_w = (w >= pair.witness_length_min - k.dimensions.PERSISTENCE_TOLERANCE_PX) && (w <= pair.witness_length_max + k.dimensions.PERSISTENCE_TOLERANCE_PX);
		const tol_s = (s >= pair.slidable_min - k.dimensions.PERSISTENCE_TOLERANCE_PX) && (s <= pair.slidable_max + k.dimensions.PERSISTENCE_TOLERANCE_PX);
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
	// nothing remembered yet (the first render after scene load), that
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

/** Holds the per-label remembered four-DOF values between renders, plus
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

	/** Bump the drift counter after a slack-using search-skipped render.
	 *  After two such renders, the next call to should_force_cold_run() returns
	 *  true and the streak resets. */
	note_slack_use(): void { this.slack_streak += 1; }

	/** Reset the streak. Called after any cold-run render, since cold-runs
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

/** Project every persisted placement onto the current render's regions
 *  without re-running the search. Used by the layout-freeze path when a
 *  dimension is being edited. Persisted entries whose region or pair no
 *  longer exists are silently dropped from this render. */
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
 *  has been remembered between renders the longest; on a first render with
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

/** Module-level persistence state. Survives between renders. Reset on
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
	/** Seed string fed to the stochastic finish on the most recent cold run. Empty on search-skipped renders. */
	last_search_seed: string;
};

/** Compose every Phase-2 piece into a single end-to-end placement run.
 *  Called from the renderer when `w_use_new_placement` is on.
 *
 *  Step 1 — gather reachable regions.
 *  Step 2 — check viability against the previous render's choices.
 *  Step 3 — either reuse those choices (search skipped) OR run the full
 *           cold search (greedy seed → retry → stochastic finish).
 *  Step 4 — apply the drop policy.
 *  Step 5 — remember the result for the next render.
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
		// render left some labels still strictly viable AND drift-safety
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
	// the snapshot BEFORE we replace the persistence with this render's
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

	// log_dim_summary(expected_keys.size, placements.length, drop_report.dropped);
	// log_trace_target(placements);
	// log_trace_so(no_viable_pair_labels, placements);

	last_run_result = { placements, drop_report, search_skipped, last_search_seed: seed };
	return last_run_result;
}

/** One-shot debug trace. Edit DBG_TRACE_TEXT below to the formatted
 *  dimension text you want to follow through the search/renderer pipeline.
 *  When a placement matches, this prints the four chosen values plus the
 *  search's computed centre so we can compare against where the renderer
 *  ends up drawing the label. Set to '' to disable. */
const DBG_TRACE_TEXT: string = "16' 8 1/2\"";
let last_trace_logged = '';
export function log_trace_target(placements: readonly Greedy_Placement[]): void {
	if (DBG_TRACE_TEXT === '') return;
	for (const p of placements) {
		if (p.pair.text !== DBG_TRACE_TEXT) continue;
		const edge_dx = p.pair.edge_p2_x - p.pair.edge_p1_x;
		const edge_dy = p.pair.edge_p2_y - p.pair.edge_p1_y;
		const edge_len = Math.hypot(edge_dx, edge_dy);
		const half_w = p.label_w_px / 2;
		const Y_BUF = k.dimensions.WITNESS_ANCHOR_BUFFER_PX;
		const line =
			`DIM TRACE [${DBG_TRACE_TEXT}] on ${p.so_name} axis ${p.axis}: ` +
			`edge ends (${p.pair.edge_p1_x.toFixed(1)}, ${p.pair.edge_p1_y.toFixed(1)}) → ` +
			`(${p.pair.edge_p2_x.toFixed(1)}, ${p.pair.edge_p2_y.toFixed(1)}), ` +
			`edge length ${edge_len.toFixed(1)} px; ` +
			`label width ${p.label_w_px.toFixed(1)} px (half ${half_w.toFixed(1)}); ` +
			`witness length ${p.witness_length.toFixed(1)} px; ` +
			`slide ${p.slidable_position.toFixed(1)} px; ` +
			`forbidden zones [${(-Y_BUF - half_w).toFixed(1)}, ${(Y_BUF + half_w).toFixed(1)}] and ` +
			`[${(edge_len - Y_BUF - half_w).toFixed(1)}, ${(edge_len + Y_BUF + half_w).toFixed(1)}]; ` +
			`search centre (${p.center_x.toFixed(1)}, ${p.center_y.toFixed(1)})`;
		if (line !== last_trace_logged) {
			last_trace_logged = line;
			if (k.debug.diagnose_dims) console.log(line);
		}
	}
}

/** Per-part trace. Set DBG_TRACE_SO_NAME to a smart-object name (eg "A")
 *  to print, for that part, EVERY axis's outcome — placed or dropped
 *  with the dominant reason. Set to '' to disable. */
const DBG_TRACE_SO_NAME: string = "B";
let last_so_trace_logged = '';
export function log_trace_so(
	no_viable: readonly { so_id: string; so_name: string; axis: Axis_Name }[],
	placed: readonly Greedy_Placement[],
): void {
	if (DBG_TRACE_SO_NAME === '') return;
	const lines: string[] = [];
	const seen = new Set<string>();
	for (const p of placed) {
		if (p.so_name !== DBG_TRACE_SO_NAME) continue;
		const key = `${p.so_name}|${p.axis}`;
		if (seen.has(key)) continue;
		seen.add(key);
		const face_tag = p.pair.is_front_facing ? 'front face' : 'back face';
		lines.push(`axis ${p.axis}: PLACED at (${p.center_x.toFixed(1)}, ${p.center_y.toFixed(1)}) on ${face_tag}, witness length ${p.witness_length.toFixed(1)} px, edge ${p.pair.edge_v1_idx}-${p.pair.edge_v2_idx}`);
	}
	for (const d of no_viable) {
		if (d.so_name !== DBG_TRACE_SO_NAME) continue;
		const key = `${d.so_name}|${d.axis}`;
		if (seen.has(key)) continue;
		seen.add(key);
		const s = last_filter_stats.per_label.get(`${d.so_id}|${d.axis}`);
		if (!s) { lines.push(`axis ${d.axis}: dropped, no candidate edges`); continue; }
		const parts: string[] = [];
		if (s.edges_too_short            > 0) parts.push(`${s.edges_too_short} edges too short`);
		if (s.edges_projection_broken    > 0) parts.push(`${s.edges_projection_broken} projection broken`);
		if (s.edges_no_viable_direction  > 0) parts.push(`${s.edges_no_viable_direction} edges had no viable direction`);
		if (s.edges_yielded_pairs        > 0) parts.push(`${s.edges_yielded_pairs} edges yielded a pair (but the pair was dropped later)`);
		if (s.directions_silhouette_too_far    > 0) parts.push(`directions killed by silhouette ${s.directions_silhouette_too_far}`);
		if (s.directions_witness_range_empty   > 0) parts.push(`directions killed by witness range ${s.directions_witness_range_empty}`);
		if (s.directions_slidable_range_empty  > 0) parts.push(`directions killed by slidable range ${s.directions_slidable_range_empty}`);
		if (s.directions_projection_degenerate > 0) parts.push(`directions killed by projection ${s.directions_projection_degenerate}`);
		if (s.directions_witnesses_converge    > 0) parts.push(`directions killed by witnesses converging ${s.directions_witnesses_converge}`);
		lines.push(`axis ${d.axis}: dropped — ${parts.join(', ')}`);
	}
	// Per-direction detail for silhouette-too-far rejections on the trace SO.
	const rej_lines: string[] = [];
	for (const r of last_silhouette_rejects) {
		if (r.so_name !== DBG_TRACE_SO_NAME) continue;
		const per_hull = r.per_hull
			.map(h => `${h.so_id}:${h.t.toFixed(1)}`)
			.join(', ');
		rej_lines.push(
			`axis ${r.axis} edge ${r.v1_idx}-${r.v2_idx} dir (${r.wit_ux.toFixed(2)}, ${r.wit_uy.toFixed(2)}): ` +
			`per-hull exit-t [${per_hull}], witness min ${r.witness_length_min.toFixed(1)} vs cap ${r.cap}`
		);
	}

	if (lines.length === 0 && rej_lines.length === 0) return;
	const parts_str = lines.length > 0 ? lines.join('; ') : '(no axis summary)';
	const rej_str = rej_lines.length > 0 ? `\nDIM TRACE part [${DBG_TRACE_SO_NAME}] silhouette rejects: ${rej_lines.join('; ')}` : '';
	const full = `DIM TRACE part [${DBG_TRACE_SO_NAME}]: ${parts_str}${rej_str}`;
	if (full === last_so_trace_logged) return;
	last_so_trace_logged = full;
	if (k.debug.diagnose_dims) console.log(full);
}

/** Last summary string we printed. The per-render summary only fires
 *  when the new lines differ from the previous ones — stops the console
 *  from flooding while the user tumbles or rerenders with the same state. */
let last_logged_summary = '';

/** Per-render diagnostic. Prints a plain-English summary of how many
 *  labels were expected, how many made it onto the canvas, and — for
 *  the lost ones — what filter killed each. Also names the blocking
 *  parts for the first five labels whose every edge was hidden, so
 *  it's clear WHICH parts are doing the occluding. Logs only when the
 *  numbers change from the previous render. */
export function log_dim_summary(
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

	let no_candidate_edges = 0;
	let all_short = 0;
	let all_directions_rejected = 0;
	let all_projection_broken = 0;
	let mixed_reasons = 0;
	// Track every TRUE mixed-reasons label so we can print a per-label
	// breakdown and aggregate totals. The "no candidate edges" labels
	// (which never had any edge tally created) go to their own bucket.
	const mixed_labels: {
		so_name: string;
		axis: Axis_Name;
		short: number;
		proj: number;
		nodir: number;
	}[] = [];
	for (const d of dropped) {
		if (d.reason !== 'no_viable_pair') continue;
		const s = last_filter_stats.per_label.get(`${d.so_id}|${d.axis}`);
		if (!s) { no_candidate_edges++; continue; }
		const total = s.edges_too_short + s.edges_projection_broken + s.edges_no_viable_direction;
		if (total === 0)                                { no_candidate_edges++; continue; }
		if (s.edges_too_short      === total)           all_short++;
		else if (s.edges_no_viable_direction === total) all_directions_rejected++;
		else if (s.edges_projection_broken   === total) all_projection_broken++;
		else {
			mixed_reasons++;
			mixed_labels.push({
				so_name : d.so_name,
				axis    : d.axis,
				short   : s.edges_too_short,
				proj    : s.edges_projection_broken,
				nodir   : s.edges_no_viable_direction,
			});
		}
	}

	const line1 =
		`DIM: ${expected} labels expected, ${placed} placed, ${dropped.length} dropped ` +
		`(no viable edge ${drops_by_reason.no_viable_pair}, duplicate text ${drops_by_reason.duplicate_text}, ` +
		`off canvas ${drops_by_reason.off_canvas}, conflict ${drops_by_reason.remaining_conflict})`;

	let line2 = '';
	if (drops_by_reason.no_viable_pair > 0) {
		line2 =
			`DIM: of the ${drops_by_reason.no_viable_pair} with no viable edge: ` +
			`no candidate edges ${no_candidate_edges}, ` +
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

	// Aggregate per-direction rejection counts across every label that
	// had at least one direction killed. Tells us which downstream filter
	// is the dominant cause of "every direction rejected" / "mixed reasons".
	let dir_silhouette = 0;
	let dir_witness_range = 0;
	let dir_slidable_range = 0;
	let dir_projection = 0;
	let dir_converge = 0;
	for (const s of last_filter_stats.per_label.values()) {
		dir_silhouette    += s.directions_silhouette_too_far;
		dir_witness_range += s.directions_witness_range_empty;
		dir_slidable_range += s.directions_slidable_range_empty;
		dir_projection    += s.directions_projection_degenerate;
		dir_converge      += s.directions_witnesses_converge;
	}
	let line4 = '';
	const dir_total = dir_silhouette + dir_witness_range + dir_slidable_range + dir_projection + dir_converge;
	if (dir_total > 0) {
		line4 =
			`DIM direction rejections: silhouette too far ${dir_silhouette}, ` +
			`witness range empty ${dir_witness_range}, ` +
			`slidable range empty ${dir_slidable_range}, ` +
			`projection degenerate ${dir_projection}, ` +
			`witnesses converge ${dir_converge}`;
	}

	// Per-label sample for the mixed-reasons bucket — names up to five
	// labels with their per-edge breakdown so the cause inside "mixed"
	// is concrete, not opaque.
	let line5 = '';
	if (mixed_labels.length > 0) {
		const sample_mixed = mixed_labels.slice(0, 5).map(m => {
			const parts: string[] = [];
			if (m.short > 0) parts.push(`${m.short} short`);
			if (m.proj  > 0) parts.push(`${m.proj} projection`);
			if (m.nodir > 0) parts.push(`${m.nodir} no-direction`);
			return `${m.so_name} along ${m.axis} (${parts.join(', ')})`;
		});
		line5 = `DIM mixed sample: ${sample_mixed.join('; ')}`;
	}

	// Aggregate totals across every mixed-reasons label — tells the reader
	// which failure kind dominates inside the mixed bucket overall.
	let line6 = '';
	if (mixed_labels.length > 0) {
		let total_short = 0, total_proj = 0, total_nodir = 0;
		for (const m of mixed_labels) {
			total_short += m.short;
			total_proj  += m.proj;
			total_nodir += m.nodir;
		}
		line6 =
			`DIM mixed totals across ${mixed_labels.length} labels: ` +
			`${total_short} edges too short, ` +
			`${total_proj} projection broken, ` +
			`${total_nodir} every direction rejected`;
	}

	const full = `${line1}\n${line2}\n${line3}\n${line4}\n${line5}\n${line6}`;
	if (full === last_logged_summary) return;
	last_logged_summary = full;

	if (k.debug.diagnose_dims) {
		console.log(line1);
		if (line2) console.log(line2);
		if (line3) console.log(line3);
		if (line4) console.log(line4);
		if (line5) console.log(line5);
		if (line6) console.log(line6);
	}
}

/** For each placement, compute the world-space direction of the measured
 *  edge as a unit 3-tuple. Looks up the smart object and transforms the
 *  edge into world coordinates once per render. */
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
	| 'own-witness-convergence';

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
	picks: Array<{
		pick     : Placement_Details;
		so_id    : string;
		so_name  : string;
		axis     : Axis_Name;
	}>;
	/** The six-sided projected outline of the silhouette box on screen,
	 *  in canvas pixels. Read by the diagnostics renderer to draw it in
	 *  green so its shape is visible. */
	silhouette_polygon_screen: Array<{ x: number; y: number }>;
};

let last_uniface_placement: Uniface_Placement_Result = { uniface_box: null, picks: [], silhouette_polygon_screen: [] };

/** Last diagnostic output emitted by run_uniface_placement. Used to
 *  suppress repeat logs when the scene state hasn't changed — every
 *  mouse-move re-renders, but the picks and rejection counts are
 *  identical, so logging the same text again is just noise. */
let last_diag_output: string | null = null;

/** Have we sent the very first dimensionals log POST this browser session?
 *  The first POST overwrites the on-disk file; later POSTs append. */
let dispatched_dim_log_fresh: boolean = false;

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

export function get_last_uniface_placement(): Uniface_Placement_Result {
	return last_uniface_placement;
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
	const rendered_leaves: O_Scene[] = [];
	for (const obj of all_objects) {
		if (!visible.has(obj)) continue;
		if (has_visible_child(obj)) continue;
		rendered_leaves.push(obj);
	}
	// Alphabetical by part name — the duplicate-text drop (rule 4) walks
	// parts in this order and keeps the FIRST one to claim each
	// (text, axis) pair, so the order has to be deterministic and
	// alphabetical per step 3d of the proposal.
	rendered_leaves.sort((a, b) => a.so.name.localeCompare(b.so.name));
	const uniface_box = build_uniface_box_for_scene(rendered_leaves);

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
	const silhouette_corners_screen: { x: number; y: number }[] = [];
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
	const silhouette_polygon = convex_hull(silhouette_corners_screen);

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
	const WORLD_DISTANCE_WEIGHT        = 100; // each world unit of perpendicular distance from the part to the uniface plane reduces the score by this much. Strong enough to dominate every pixel-based term, so the closest uniface in world space wins by default; pixel terms only break ties.
	const NUM_WITNESS_INDICES = uniface_box.shifts.length;

	const picks: Uniface_Placement_Result['picks'] = [];
	const axes: Axis_Name[] = ['x', 'y', 'z'];
	// Hovered part — read once per render. Used to gate the verbose
	// per-dimension diagnostic AND to record sample failing candidates.
	const hovered_so_id_for_diag = hits_3d.hover?.so?.id ?? hits_3d.hovered_uniface_pick?.so_id ?? null;
	// Already-picked (text, axis) pairs from earlier dimensions this
	// render. The duplicate-text filter reads this to reject a new
	// dimension whose label text and axis match one already kept.
	const placed_dimensions: Array<{ text: string; axis: 'x' | 'y' | 'z' }> = [];
	// Diagnostic counters — printed once at the end of the function.
	let diag_total = 0;
	let diag_with_any_candidate = 0;
	let diag_with_winner = 0;
	const diag_rejection_counts: Map<Clearance_Filter, number> = new Map();
	const diag_log_buffer: string[] = [];
	// Step 3d counters — one per ported old-path filter so the
	// end-of-render summary names exactly how many parts each filter
	// removed and which parts those were.
	let diag_repeater_dropped_parts = 0;
	let diag_repeater_dropped_axes = 0;
	const diag_repeater_dropped_names: string[] = [];
	let diag_null_picks_removed = 0;
	// When any part is hovered, log the silhouette six-sided shape's
	// screen vertices once — needed to interpret sample-rect coordinates
	// of failing candidates below.
	if (hovered_so_id_for_diag !== null) {
		const poly_str = silhouette_polygon
			.map(p => `(${Math.round(p.x)},${Math.round(p.y)})`)
			.join(' → ');
		diag_log_buffer.push(`[uniface pick] silhouette six-sided shape on screen: ${poly_str}`);
	}
	// ─── Rule 19 witness-index vote (step 3g) ─────────────────────────
	// Phase 1: look at every (part, axis, direction, witness index)
	// combination in isolation and record whether any position passes
	// the candidate-vs-itself and candidate-vs-silhouette filters. Cross-
	// part filters do NOT run here — the running placed-things state is
	// empty by design. The records feed the vote that picks the two
	// witness indices to keep per direction. The main loop below then
	// runs the full filter pipeline restricted to the winning cells.
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
	const cell_viability: Map<string, Set<string>> = new Map();
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
						const cell_key = `${face_idx_s}|${wi_s}`;
						if (cell_viability.get(part_axis_key)?.has(cell_key)) continue;
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
							if (!cell_viability.has(part_axis_key)) cell_viability.set(part_axis_key, new Set());
							cell_viability.get(part_axis_key)!.add(cell_key);
						}
					}
				}
			}
		}
	}
	// Phase 2 & 3 — count parts viable at each (direction, witness index)
	// cell, then keep the two witness indices with the highest counts
	// per direction. A direction with zero viable parts has no winners.
	const cell_count: Map<string, number> = new Map();
	for (const cells of cell_viability.values()) {
		for (const cell of cells) cell_count.set(cell, (cell_count.get(cell) ?? 0) + 1);
	}
	const winners_per_face: Map<number, Set<number>> = new Map();
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
		const ranking: Array<{ wi: number; count: number }> = [];
		for (let wi_v = 0; wi_v < NUM_WITNESS_INDICES; wi_v++) {
			ranking.push({ wi: wi_v, count: cell_count.get(`${face_idx_v}|${wi_v}`) ?? 0 });
		}
		const sorted_for_pick = ranking.slice().sort((a, b) => b.count - a.count || a.wi - b.wi);
		const top: Set<number> = new Set();
		for (let i = 0; i < Math.min(2, sorted_for_pick.length); i++) {
			if (sorted_for_pick[i].count > 0) top.add(sorted_for_pick[i].wi);
		}
		winners_per_face.set(face_idx_v, top);
		const counts_str = ranking.map(r => `wi${r.wi + 1}=${r.count}`).join(' ');
		const winners_str = [...top].sort((a, b) => a - b).map(w => `wi${w + 1}`).join(', ') || 'none';
		vote_log_lines.push(`  ${VOTE_SIDE_NAMES[face_idx_v].padEnd(6)}: ${counts_str}   winners: ${winners_str}`);
	}
	diag_log_buffer.push(vote_log_lines.join('\n'));
	// Counter for the end-of-render summary: how many candidates the
	// main loop below skipped because their (direction, witness index)
	// cell lost the vote.
	let diag_vote_skipped = 0;
	for (const obj of rendered_leaves) {
		// Step 3d filter 1: repeater filter. Clones inside a non-firewall
		// repeater and middle fireblocks inside a firewall repeater get
		// no dim line. Templates and first/last-shortened fireblocks pass
		// — fireblocks only along the repeat axis.
		const classification = classify_so(obj);
		if (!classification.eligible) {
			diag_repeater_dropped_parts++;
			diag_repeater_dropped_names.push(`${obj.so.name} (${classification.kind})`);
			continue;
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
				diag_repeater_dropped_axes++;
				continue;
			}
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
					diag_total++;
					diag_rejection_counts.set(dim_check.filter, (diag_rejection_counts.get(dim_check.filter) ?? 0) + 1);
					picks.push({
						pick: {
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
						},
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
				world_distance_penalty: number;
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
				for (const [edge_w_p1, edge_w_p2] of edge_endpoints_world) {
					const ep1 = project_screen(edge_w_p1);
					const ep2 = project_screen(edge_w_p2);
					const edge_p1_screen = { x: ep1.x, y: ep1.y };
					const edge_p2_screen = { x: ep2.x, y: ep2.y };
					for (const face_idx of UNIFACE_CANDIDATES_PER_AXIS[axis]) {
						const s = shifts_row[face_idx];
						if (s === null || s === undefined) continue;
						// Rule 19 witness-index vote (step 3g): skip this
						// cell if its witness index lost the vote for this
						// direction. Labels in the same direction cluster
						// on at most two shared witness indices.
						const winners_for_face = winners_per_face.get(face_idx);
						if (!winners_for_face || !winners_for_face.has(wi)) {
							diag_vote_skipped++;
							continue;
						}
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
							diag_rejection_counts.set(shape_result.filter, (diag_rejection_counts.get(shape_result.filter) ?? 0) + 1);
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
								const dl_len_check = Math.hypot(a2.x - a1.x, a2.y - a1.y);
								if (dl_len_check > 1e-9) {
									const ux_check = (a2.x - a1.x) / dl_len_check;
									const uy_check = (a2.y - a1.y) / dl_len_check;
									const inside_rect = (pt: { x: number; y: number }, rx: number, ry: number): boolean =>
										pt.x >= rx - half_w - 2 && pt.x <= rx + half_w + 2 &&
										pt.y >= ry - LABEL_H_PX / 2 - 1 && pt.y <= ry + LABEL_H_PX / 2 + 1;
									const fully_a1 =
										inside_rect(a1, cx_s, cy_s) &&
										inside_rect({ x: a1.x + ux_check * ARROW_PX, y: a1.y + uy_check * ARROW_PX }, cx_s, cy_s);
									const fully_a2 =
										inside_rect(a2, cx_s, cy_s) &&
										inside_rect({ x: a2.x - ux_check * ARROW_PX, y: a2.y - uy_check * ARROW_PX }, cx_s, cy_s);
									if (fully_a1 || fully_a2) {
										const target = fully_a1 ? a1 : a2;
										const sign_away = fully_a1 ? -1 : +1;
										const shift = half_w + 2 + overhang_px + ARROW_PX;
										cx_s = target.x + sign_away * ux_check * shift;
										cy_s = target.y + sign_away * uy_check * shift;
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
								candidate_label_rect    : rect,
								candidate_anchor_1      : a1,
								candidate_anchor_2      : a2,
								candidate_edge_p1_screen: edge_p1_screen,
								candidate_edge_p2_screen: edge_p2_screen,
								silhouette              : silhouette_polygon,
								placed_label_rects,
								placed_anchors,
								placed_witness_segments,
								placed_dim_segments,
								pair_clearance_px       : k.dimensions.PAIR_CLEARANCE_PX,
								silhouette_margin_px    : k.dimensions.SILHOUETTE_MARGIN_PX,
								silhouette_clearance_px : 0,
								plane_camera_dot        : plane_camera_dot,
							};
							const result = evaluate_position_clearances(inputs);
							if (!result.ok) {
								// Count the ORIGINAL rejection per candidate, for the
								// diagnostic. Slide-retry rejections are not counted —
								// we want to know what initially required a slide.
								diag_rejection_counts.set(result.filter, (diag_rejection_counts.get(result.filter) ?? 0) + 1);
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
							// World-coordinate distance from the part to the
							// chosen uniface plane. Dominates the score so the
							// closest uniface in world space wins by default.
							let world_distance = 0;
							if      (face_idx === UNIFACE_FACE_POS_X) world_distance = (sb.max[0] + s) - bb_max[0];
							else if (face_idx === UNIFACE_FACE_NEG_X) world_distance = bb_min[0] - (sb.min[0] - s);
							else if (face_idx === UNIFACE_FACE_POS_Y) world_distance = (sb.max[1] + s) - bb_max[1];
							else if (face_idx === UNIFACE_FACE_NEG_Y) world_distance = bb_min[1] - (sb.min[1] - s);
							else if (face_idx === UNIFACE_FACE_POS_Z) world_distance = (sb.max[2] + s) - bb_max[2];
							else                                       world_distance = bb_min[2] - (sb.min[2] - s);
							const world_distance_penalty = WORLD_DISTANCE_WEIGHT * Math.max(0, world_distance);
							const score = between_bonus - centering_penalty - witness_length_penalty - inside_penalty - world_distance_penalty;
							if (best === null || score > best.score) {
								best = {
									face: face_idx,
									witness_index: wi,
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
									world_distance_penalty,
									witness_index: wi,
								});
							}
						}
					}
				}
				if (best !== null) break;  // first witness index with a winner wins.
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
			}

			// Diagnostic: one entry per (part, axis) — but only when at least
			// one of the four candidate sides has a passing candidate. The
			// final summary line counts every dimension whether or not it
			// printed an entry. Output is buffered and compared against the
			// previous render's output — same scene state → no log.
			diag_total++;
			if (per_side_best.size > 0) {
				diag_with_any_candidate++;
				if (winner !== null) diag_with_winner++;
			}
			// Print the full per-dimension block ONLY when the part is
			// currently hovered. Everything else stays out of the log;
			// the summary at the end still counts the whole scene.
			const hovered_so_id = hits_3d.hover?.so?.id ?? hits_3d.hovered_uniface_pick?.so_id ?? null;
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
				lines.push(`[uniface pick] ${obj.so.name} (${AXIS_LABELS[axis]}): chose ${winner_side}`);
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
							+ ` - distance-from-part ${s.world_distance_penalty.toFixed(1)}`
							+ ` (witness index ${s.witness_index + 1})${marker}`
						);
					}
				}
				diag_log_buffer.push(lines.join('\n'));
			}

			// Witness length in screen pixels: perpendicular distance from
			// the chosen edge line to the chosen uniface's anchor. No cap
			// is applied — see step 3b in the proposal.
			const witness_length_px = winner
				? distance_from_point_to_line_2d(winner.anchor_1, winner.edge_p1_screen, winner.edge_p2_screen)
				: null;
			picks.push({
				pick: {
					uniface                : winner ? winner.face : null,
					edge_v1_idx            : null,
					edge_v2_idx            : null,
					natural_label_position : winner ? winner.label_pos : null,
					witness_index          : winner ? winner.witness_index + 1 : 1,
					witness_length_px      : witness_length_px,
					edge_p1_screen         : winner ? winner.edge_p1_screen : null,
					edge_p2_screen         : winner ? winner.edge_p2_screen : null,
					anchor_1_screen        : winner ? winner.anchor_1 : null,
					anchor_2_screen        : winner ? winner.anchor_2 : null,
					label_text             : candidate_dim_text,
				},
				so_id   : obj.so.id,
				so_name : obj.so.name,
				axis,
			});
		}
	}
	// Step 3d filter 4 (no-viable-pair drop): remove every pick whose
	// search yielded no winning uniface — they cannot draw anything.
	const picks_with_winner = picks.filter(entry => {
		if (entry.pick.uniface === null) {
			diag_null_picks_removed++;
			return false;
		}
		return true;
	});
	{
		const histogram = Array.from(diag_rejection_counts.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([f, c]) => `  ${f}: ${c}`)
			.join('\n');
		const total_rejections = Array.from(diag_rejection_counts.values()).reduce((s, c) => s + c, 0);
		const repeater_names = diag_repeater_dropped_names.length > 0
			? `\n    parts removed by the repeater filter: ${diag_repeater_dropped_names.join(', ')}`
			: '';
		const summary =
			`[uniface pick] summary: ${diag_total} dimensions, ${diag_with_any_candidate} had at least one passing candidate, ${diag_with_winner} were picked`
			+ `\n  step 3d filter drops:`
			+ `\n    repeater filter removed ${diag_repeater_dropped_parts} part(s) and ${diag_repeater_dropped_axes} extra axis sweep(s)${repeater_names}`
			+ `\n    no-viable-pair drop removed ${diag_null_picks_removed} pick(s) with no chosen uniface`
			+ `\n  step 3g witness-index vote: skipped ${diag_vote_skipped} candidate cell(s) whose witness index lost the per-direction vote`
			+ `\n  rejections by filter (${total_rejections} total across all dimensions):\n${histogram || '  (none)'}`;
		const full_output = diag_log_buffer.length > 0
			? diag_log_buffer.join('\n') + '\n' + summary
			: summary;
		if (full_output !== last_diag_output) {
			last_diag_output = full_output;
			if (k.debug.diagnose_dims) {
				console.log(full_output);
				dispatch_dim_log_to_file(full_output);
			}
		}
	}
	last_uniface_placement = { uniface_box, picks: picks_with_winner, silhouette_polygon_screen: silhouette_polygon };
	return last_uniface_placement;
}
