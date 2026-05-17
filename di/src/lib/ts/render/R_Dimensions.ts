import type { Projected, Dimension_Rect } from '../types/Interfaces';
import type Smart_Object from '../runtime/Smart_Object';
import type { O_Scene } from '../types/Interfaces';
import type { Axis_Name } from '../types/Types';
import { units, Units } from '../types/Units';
import { hits_3d } from '../events/Hits_3D';
import { e } from '../events/Events';
import { get } from 'svelte/store';
import { stores } from '../managers/Stores';
import { scene } from './Scene';
import { camera } from './Camera';
import { stale_writable } from '../common/Dirty';
import { vec3 } from 'gl-matrix';
import { mat4 } from 'gl-matrix';

/**
 * Dimension annotations: silhouette edge detection, witness lines, and
 * dimension labels for each axis of every scene object.
 *
 * Extracted from Render.ts — all geometry logic preserved verbatim.
 */

/** Subset of Render that Dimensions needs. Avoids circular import. */
export interface DimensionHost {
	ctx: CanvasRenderingContext2D;
	project_vertex(v: vec3, world_matrix: mat4): Projected;
	get_world_matrix(obj: O_Scene): mat4;
	face_winding(face: number[], projected: Projected[]): number;
	point_in_polygon_2d(px: number, py: number, poly: { x: number; y: number }[]): boolean;
	draw_arrow(x: number, y: number, dx: number, dy: number): void;
	dimension_rects: Dimension_Rect[];
}

// ─── Force-directed label layout ────────────────────────────────────
// Each dimension label is a movable rectangle. A simulation runs after
// label positions are computed and before they are drawn. Three forces
// per label: a spring pulling each label toward its "home" position
// (the midpoint between its witness lines), repulsion pushing labels
// away from each other when their rectangles overlap, and damping that
// settles the system. Position+velocity persist across frames so the
// layout continues to refine on each paint rather than restarting.

type Label_Candidate = {
	key       : string;          // `${so.id}:${axis}` — stable across frames
	home_x    : number;          // natural label position = midpoint of the dimension line
	home_y    : number;
	x         : number;          // current (simulated) screen position
	y         : number;
	vx        : number;          // velocity, carried across frames
	vy        : number;
	w         : number;          // label rectangle width (text + padding)
	h         : number;          // label rectangle height
	rep_w     : number;          // repulsion footprint width — covers label and the dimension line it owns
	rep_h     : number;          // repulsion footprint height
	text      : string;
	dim_z     : number;
	so        : Smart_Object;
	axis      : Axis_Name;
	layout_case: 1 | 2;          // 1 = inward arrows, 2 = inverted (outward arrows)
	w1_start  : Projected;       // projected witness-line endpoints (home positions)
	w1_end    : Projected;
	w2_start  : Projected;
	w2_end    : Projected;
	d1        : Projected;       // projected dimension-line endpoints
	d2        : Projected;
	flag_exceed   : boolean;     // smallest clearance > push cap (rule 25 condition 1)
	flag_forbidden: boolean;     // all four directions filtered by camera-axis rule (rule 20 fallback)
};

const persisted_state = new Map<string, { x: number; y: number; vx: number; vy: number }>();

// Diagnostic counters: running averages of per-paint counts. The averages
// use the incremental formula avg = avg + (value - avg) / counter, which
// uses a single number of memory and yields the same result as averaging a
// stored history. Reset on hot reload.
const stats = {
	counter         : 0,
	avg_collected   : 0,
	avg_dup_text    : 0,
	avg_forbidden   : 0,
	avg_exceed      : 0,
	avg_off_canvas  : 0,
	avg_overlap     : 0,
	avg_drawn       : 0,
};
export const w_dim_dropped_avg = stale_writable<number>(0);

// Stop-when-settled: remember whether the previous paint's simulation had
// any meaningful movement. If not, AND the inputs are unchanged this paint,
// skip the simulation entirely so the drawn dimensions don't flicker.
let prev_settled = false;
let prev_keys: string[] = [];
let prev_homes: number[] = [];

// Tuning values. SPRING_K pulls labels back toward home; REPULSION_K
// pushes overlapping labels apart along their axis of least overlap;
// PADDING widens each label's repulsion zone; DAMPING settles motion;
// ITERATIONS caps each layout pass; SILHOUETTE_MARGIN is the buffer
// in screen pixels between the drawing's silhouette and any label.
const SPRING_K          = 0.08;
const REPULSION_K       = 0.4;
const PADDING           = 15;
const DAMPING           = 0.6;
const ITERATIONS        = 30;
const SILHOUETTE_MARGIN = 30;

// Andrew's monotone chain convex hull. Returns the hull vertices in
// counter-clockwise order (in screen coordinates where y grows downward,
// this is actually clockwise — direction doesn't matter for our use).
function convex_hull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
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

// Arrow vs convex polygon. Returns the largest distance from the arrow
// origin where the arrow line crosses any edge of the polygon (the exit
// point), or -1 if the arrow does not pass through the polygon at all
// or the polygon is entirely behind the arrow.
function ray_polygon_exit(
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

function run_simulation(candidates: Label_Candidate[]): number {
	const n = candidates.length;
	if (n === 0) return 0;
	const start_x = candidates.map(c => c.x);
	const start_y = candidates.map(c => c.y);
	const fx = new Array<number>(n);
	const fy = new Array<number>(n);
	for (let iter = 0; iter < ITERATIONS; iter++) {
		for (let i = 0; i < n; i++) {
			const c = candidates[i];
			let ax = (c.home_x - c.x) * SPRING_K;
			let ay = (c.home_y - c.y) * SPRING_K;
			for (let j = 0; j < n; j++) {
				if (j === i) continue;
				const o = candidates[j];
				const dx = c.x - o.x;
				const dy = c.y - o.y;
				const ox = (c.rep_w + o.rep_w) / 2 + PADDING - Math.abs(dx);
				const oy = (c.rep_h + o.rep_h) / 2 + PADDING - Math.abs(dy);
				if (ox > 0 && oy > 0) {
					// On exact-overlap, tiebreak by index so the lower-index label
					// pushes positive and the higher-index pushes negative — opposite
					// directions, so coincident labels separate instead of clumping.
					if (ox < oy) {
						const dir = dx > 0 ? 1 : dx < 0 ? -1 : (i < j ? 1 : -1);
						ax += dir * ox * REPULSION_K;
					} else {
						const dir = dy > 0 ? 1 : dy < 0 ? -1 : (i < j ? 1 : -1);
						ay += dir * oy * REPULSION_K;
					}
				}
			}
			fx[i] = ax;
			fy[i] = ay;
		}
		for (let i = 0; i < n; i++) {
			const c = candidates[i];
			c.vx = (c.vx + fx[i]) * DAMPING;
			c.vy = (c.vy + fy[i]) * DAMPING;
			c.x += c.vx;
			c.y += c.vy;
		}
	}
	// Report the largest single-pass movement so the caller can decide
	// whether the system has settled enough to skip the next paint's pass.
	let max_move = 0;
	for (let i = 0; i < n; i++) {
		const dx = candidates[i].x - start_x[i];
		const dy = candidates[i].y - start_y[i];
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist > max_move) max_move = dist;
	}
	return max_move;
}

function prune_persisted(active_keys: Set<string>): void {
	for (const key of persisted_state.keys()) {
		if (!active_keys.has(key)) persisted_state.delete(key);
	}
}

/** Render dimensions for all scene objects via three-phase layout:
 *  (A) collect a label candidate per dimension, (B) run the force
 *  simulation on the surviving candidates, (C) draw each candidate at
 *  its settled position and update the persisted state. */
export function render_dimensions(host: DimensionHost): void {
	const candidates: Label_Candidate[] = [];

	// Per-paint diagnostic counts. Updated as the algorithm runs, then folded
	// into running averages at the end.
	let cnt_collected   = 0;
	let cnt_dup_text    = 0;
	let cnt_forbidden   = 0;
	let cnt_exceed      = 0;
	let cnt_off_canvas  = 0;
	let cnt_overlap     = 0;

	// Skip any smart object whose own visible flag is off, or whose
	// chain of parents includes one that hides its children. Matches
	// the visibility rule used elsewhere when deciding what to draw.
	function is_visible(obj: O_Scene): boolean {
		if (!obj.so.visible) return false;
		let cursor = obj.parent;
		while (cursor) {
			if (cursor.so.hide_children) return false;
			cursor = cursor.parent;
		}
		return true;
	}

	// While the OPTION key is held, show dimensions even for invisible smart
	// objects so the user can read measurements of hidden parts. The silhouette
	// hull stays built from visible objects only — invisible objects don't
	// paint, so they shouldn't affect where other dimensions land.
	const option_down = get(e.w_option_down);
	function should_draw_dimensions_for(obj: O_Scene): boolean {
		if (is_visible(obj)) return true;
		return option_down;
	}

	// Build a single combined outline that wraps every visible LEAF smart
	// object's projected vertices. Containers (objects with at least one
	// visible child) are excluded — their bounding-box corners can sit far
	// outside any actually-painted geometry and would inflate the outline
	// past where the drawing visually ends.
	const all_objects = scene.get_all();
	function has_visible_child(obj: O_Scene): boolean {
		for (const other of all_objects) {
			if (other.parent === obj && is_visible(other)) return true;
		}
		return false;
	}
	const all_points: Array<{ x: number; y: number }> = [];
	for (const obj of all_objects) {
		if (!is_visible(obj)) continue;
		if (has_visible_child(obj)) continue;  // leaves only
		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;
		for (const p of projected) {
			if (p.w >= 0) all_points.push({ x: p.x, y: p.y });
		}
	}
	const combined_hull: Array<{ x: number; y: number }> = all_points.length >= 3 ? convex_hull(all_points) : [];

	// Phase A — collect
	for (const obj of scene.get_all()) {
		if (!should_draw_dimensions_for(obj)) continue;
		if (!obj.parent) {
			// root: skip unless it has projected geometry
			const root_projected = hits_3d.get_projected(obj.id);
			if (!root_projected) continue;
			const root_so = obj.so;
			const root_world = host.get_world_matrix(obj);
			const is_2d = stores.current_view_mode === '2d';
			const root_front = is_2d ? hits_3d.front_most_face(root_so) : -1;
			const root_axes: Axis_Name[] = (is_2d && root_front >= 0) ? root_so.face_axes(root_front) : ['x', 'y', 'z'];
			for (const axis of root_axes) {
				const c = prepare_axis_dimension(host, root_so, axis, root_projected, root_world, combined_hull);
				if (c) candidates.push(c);
			}
			continue;
		}

		// repeater: template gets all axes; first fireblock gets repeat-axis only;
		// last fireblock also gets repeat-axis if its length differs from the first
		if (obj.parent.so.repeater) {
			const siblings = scene.get_all().filter(o => o.parent === obj.parent);
			if (siblings[0] !== obj) {
				const repeater = obj.parent.so.repeater;
				if (!repeater.firewall) continue;

				const repeat_ai = repeater.run_axis ?? 0;
				const template_len = siblings[0].so.axes[repeat_ai].length.value;
				const this_len = obj.so.axes[repeat_ai].length.value;
				if (Math.abs(this_len - template_len) < 0.1) continue;

				const fireblocks = siblings.filter(s =>
					Math.abs(s.so.axes[repeat_ai].length.value - template_len) > 0.1
				);
				const is_first = fireblocks[0] === obj;
				const is_last = fireblocks.length > 1 && fireblocks[fireblocks.length - 1] === obj;
				const last_shortened = is_last &&
					Math.abs(obj.so.axes[repeat_ai].length.value -
						fireblocks[0].so.axes[repeat_ai].length.value) > 0.1;
				if (!is_first && !last_shortened) continue;

				const fb_proj = hits_3d.get_projected(obj.id);
				if (!fb_proj) continue;
				const axis_name: Axis_Name = (['x', 'y', 'z'] as const)[repeat_ai];
				const c = prepare_axis_dimension(host, obj.so, axis_name, fb_proj, host.get_world_matrix(obj), combined_hull);
				if (c) candidates.push(c);
				continue;
			}
		}

		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;

		const so = obj.so;
		const world_matrix = host.get_world_matrix(obj);

		const is_2d_mode = stores.current_view_mode === '2d';
		const front_face = is_2d_mode ? hits_3d.front_most_face(so) : -1;
		const all_axes: Axis_Name[] = (is_2d_mode && front_face >= 0) ? so.face_axes(front_face) : ['x', 'y', 'z'];
		for (const axis of all_axes) {
			const c = prepare_axis_dimension(host, so, axis, projected, world_matrix, combined_hull);
			if (c) candidates.push(c);
		}
	}

	cnt_collected = candidates.length;

	// Phase A2 — drop every duplicate text. If two or more dimensions show
	// the same number anywhere in the drawing, only the first one collected
	// is kept; the rest are dropped before simulation.
	const seen = new Set<string>();
	const deduped: Label_Candidate[] = [];
	for (const c of candidates) {
		if (seen.has(c.text)) { cnt_dup_text++; continue; }
		seen.add(c.text);
		deduped.push(c);
	}
	candidates.length = 0;
	candidates.push(...deduped);

	// Count would-be drops from rule 25:
	// - "exceed" flag: smallest clearance across all four directions exceeded the push cap
	// - "forbidden" flag: all four candidate directions were forbidden by the camera-axis rule
	for (const c of candidates) {
		if (c.flag_exceed)    cnt_exceed++;
		if (c.flag_forbidden) cnt_forbidden++;
	}

	// Phase B — seed from persisted state, then simulate if needed.
	for (const c of candidates) {
		const prev = persisted_state.get(c.key);
		if (prev) {
			c.x  = prev.x;
			c.y  = prev.y;
			c.vx = prev.vx;
			c.vy = prev.vy;
		}
	}

	// Detect whether this paint's inputs match the previous paint. If they
	// do and the previous simulation settled, skip the simulation entirely.
	// This stops the system from drifting tiny amounts every paint, which
	// was flipping borderline candidates in and out of the drop conditions.
	const curr_keys = candidates.map(c => c.key).sort();
	const curr_homes: number[] = [];
	for (const k of curr_keys) {
		const c = candidates.find(cc => cc.key === k);
		if (c) { curr_homes.push(c.home_x, c.home_y); }
	}
	let inputs_match = curr_keys.length === prev_keys.length;
	if (inputs_match) {
		for (let i = 0; i < curr_keys.length; i++) {
			if (curr_keys[i] !== prev_keys[i]) { inputs_match = false; break; }
		}
	}
	if (inputs_match) {
		for (let i = 0; i < curr_homes.length; i++) {
			if (Math.abs(curr_homes[i] - prev_homes[i]) > 0.5) { inputs_match = false; break; }
		}
	}
	if (!(prev_settled && inputs_match)) {
		const max_move = run_simulation(candidates);
		prev_settled = max_move < 0.5;
	}
	prev_keys  = curr_keys;
	prev_homes = curr_homes;

	// Phase B2 — drop any candidate whose label rectangle would extend past
	// the canvas edge, OR whose drawn witness line (using the same intersect-
	// with-witness-ray math the draw function uses) would exceed the witness
	// length threshold after the force simulation has moved the label.
	const canvas_w = host.ctx.canvas.width;
	const canvas_h = host.ctx.canvas.height;
	const WITNESS_DRAWN_MAX_PX = 120;
	const surviving: Label_Candidate[] = [];
	for (const c of candidates) {
		const left  = c.x - c.w / 2;
		const right = c.x + c.w / 2;
		const top   = c.y - c.h / 2;
		const bot   = c.y + c.h / 2;
		if (left < 0 || top < 0 || right > canvas_w || bot > canvas_h) {
			cnt_off_canvas++;
			continue;
		}

		// Compute the actual drawn witness line lengths using the same math
		// as the draw function: line through (x, y) parallel to the original
		// dimension line direction, intersected with each projected witness
		// ray. The intersection points are where the witness lines actually
		// terminate on screen.
		const dl_dx = c.d2.x - c.d1.x;
		const dl_dy = c.d2.y - c.d1.y;
		function intersect_for_drop(rx: number, ry: number, rdx: number, rdy: number): { x: number; y: number; s: number } | null {
			const det = dl_dy * rdx - dl_dx * rdy;
			if (Math.abs(det) < 1e-9) return null;
			const s = (dl_dx * (ry - c.y) - dl_dy * (rx - c.x)) / det;
			return { s, x: rx + s * rdx, y: ry + s * rdy };
		}
		const i1 = intersect_for_drop(c.w1_start.x, c.w1_start.y, c.w1_end.x - c.w1_start.x, c.w1_end.y - c.w1_start.y);
		const i2 = intersect_for_drop(c.w2_start.x, c.w2_start.y, c.w2_end.x - c.w2_start.x, c.w2_end.y - c.w2_start.y);
		const end1x = (i1 && i1.s > 0) ? i1.x : c.d1.x;
		const end1y = (i1 && i1.s > 0) ? i1.y : c.d1.y;
		const end2x = (i2 && i2.s > 0) ? i2.x : c.d2.x;
		const end2y = (i2 && i2.s > 0) ? i2.y : c.d2.y;
		const wlen1_drawn = Math.sqrt((end1x - c.w1_start.x) ** 2 + (end1y - c.w1_start.y) ** 2);
		const wlen2_drawn = Math.sqrt((end2x - c.w2_start.x) ** 2 + (end2y - c.w2_start.y) ** 2);
		if (wlen1_drawn > WITNESS_DRAWN_MAX_PX || wlen2_drawn > WITNESS_DRAWN_MAX_PX) {
			cnt_off_canvas++;
			continue;
		}

		surviving.push(c);
	}
	candidates.length = 0;
	candidates.push(...surviving);

	// Phase C — draw, push rects, update persisted state
	const active_keys = new Set<string>();
	for (const c of candidates) {
		draw_dimension_candidate(host, c);
		host.dimension_rects.push({
			axis: c.axis, so: c.so,
			x: c.x, y: c.y,
			w: c.w, h: c.h,
			z: c.dim_z,
			face_index: -1,
		});
		active_keys.add(c.key);
		persisted_state.set(c.key, { x: c.x, y: c.y, vx: c.vx, vy: c.vy });
	}
	prune_persisted(active_keys);

	// Overlap detection (rule 25 condition 3) — counted but not enforced
	// here. Surviving label rectangles that still overlap each other after
	// the simulation are noted in the per-paint stats.
	for (let i = 0; i < candidates.length; i++) {
		for (let j = i + 1; j < candidates.length; j++) {
			const a = candidates[i], b = candidates[j];
			const dx = Math.abs(a.x - b.x);
			const dy = Math.abs(a.y - b.y);
			if (dx < (a.w + b.w) / 2 && dy < (a.h + b.h) / 2) {
				cnt_overlap++;
				break;
			}
		}
	}
	const cnt_drawn = candidates.length;

	// Update running averages. Standard incremental form:
	// avg_new = avg_old + (value - avg_old) / counter
	stats.counter++;
	const k = stats.counter;
	stats.avg_collected  += (cnt_collected  - stats.avg_collected)  / k;
	stats.avg_dup_text   += (cnt_dup_text   - stats.avg_dup_text)   / k;
	stats.avg_forbidden  += (cnt_forbidden  - stats.avg_forbidden)  / k;
	stats.avg_exceed     += (cnt_exceed     - stats.avg_exceed)     / k;
	stats.avg_off_canvas += (cnt_off_canvas - stats.avg_off_canvas) / k;
	stats.avg_overlap    += (cnt_overlap    - stats.avg_overlap)    / k;
	stats.avg_drawn      += (cnt_drawn      - stats.avg_drawn)      / k;

	// Status strip: average of (exceed + off-canvas), rounded to nearest.
	w_dim_dropped_avg.set(Math.round(stats.avg_exceed + stats.avg_off_canvas));
}

/** Compute everything needed to draw a dimension annotation for one
 *  axis of one part. Returns a Label_Candidate carrying the projected
 *  geometry and the home position for the label, OR null if no edge
 *  works (occluded, behind camera, or too short for arrows). */
function prepare_axis_dimension(
	host: DimensionHost,
	so: Smart_Object,
	axis: Axis_Name,
	projected: Projected[],
	world_matrix: mat4,
	combined_hull: Array<{ x: number; y: number }>,
): Label_Candidate | null {
	const edge_candidates = find_best_edge_for_axis(host, so, axis, projected);
	if (!edge_candidates || edge_candidates.length === 0) return null;

	const value = axis === 'x' ? so.width : axis === 'y' ? so.depth : so.height;

	// Measure the label text once per dimension so the rectangle dimensions
	// are available when computing the silhouette push.
	host.ctx.font = '12px sans-serif';
	const text_preview = units.format_for_system(value, Units.current_unit_system(), stores.current_precision);
	const text_width_preview = host.ctx.measureText(text_preview).width;
	const text_height_preview = 12;
	// White background pads the text by 2 px on each side horizontally and
	// 1 px on each side vertically (see draw_dimension_candidate). The full
	// label rectangle is (text width + 4) by (text height + 2).
	const label_rect_w = text_width_preview + 4;
	const label_rect_h = text_height_preview + 2;

	for (const { v1_idx, v2_idx } of edge_candidates) {
		const verts = so.vertices;
		const v1 = verts[v1_idx], v2 = verts[v2_idx];
		const p1 = projected[v1_idx], p2 = projected[v2_idx];
		if (p1.w < 0 || p2.w < 0) continue;

		// Try all four signed perpendicular axes; for each, measure the
		// silhouette clearance distance. Pick the direction with the smallest
		// clearance — the path of least resistance to the outside of the
		// drawing. The clearance accounts for the label's rectangle, not just
		// its center point, so the whole rectangle ends up outside the
		// silhouette after the push. If everything ties at zero, fall back to
		// the existing "most perpendicular axis on screen, outward from smart
		// object center" preference so behavior stays sensible in open scenes.
		const all_axes_for_perp: Axis_Name[] = ['x', 'y', 'z'];
		const perp_axes = all_axes_for_perp.filter(a => a !== axis);
		const four_dirs: vec3[] = [];
		for (const ax of perp_axes) {
			const v = so.axis_vector(ax);
			four_dirs.push(vec3.clone(v));
			four_dirs.push(vec3.negate(vec3.create(), v));
		}
		const fallback_axis = edge_witness_direction(host, so, v1_idx, v2_idx, axis, projected, world_matrix);
		const edge_mid = vec3.fromValues((v1[0] + v2[0]) / 2, (v1[1] + v2[1]) / 2, (v1[2] + v2[2]) / 2);
		const cx = (so.x_min + so.x_max) / 2;
		const cy = (so.y_min + so.y_max) / 2;
		const cz = (so.z_min + so.z_max) / 2;
		const outward = vec3.fromValues(edge_mid[0] - cx, edge_mid[1] - cy, edge_mid[2] - cz);
		const fallback_dot = vec3.dot(fallback_axis, outward);
		const fallback_dir = fallback_dot < 0 ? vec3.negate(vec3.create(), fallback_axis) : fallback_axis;

		// Camera forward direction in world space — used to reject witness
		// directions that point too close to or away from the viewer (such
		// directions project to very short lines and look degenerate).
		const cam_forward = vec3.create();
		vec3.subtract(cam_forward, camera.center_pos, camera.eye);
		vec3.normalize(cam_forward, cam_forward);
		const FORBIDDEN_CAM_DOT = 0.866;

		// Transform each local-space direction to world space (as a direction,
		// not a position), then check its alignment with the camera's forward.
		const world_origin = vec3.create();
		vec3.transformMat4(world_origin, vec3.create(), world_matrix);

		const filtered_dirs = four_dirs.filter(dir => {
			const world_dir_pt = vec3.create();
			vec3.transformMat4(world_dir_pt, dir, world_matrix);
			const world_dir = vec3.create();
			vec3.subtract(world_dir, world_dir_pt, world_origin);
			vec3.normalize(world_dir, world_dir);
			return Math.abs(vec3.dot(world_dir, cam_forward)) <= FORBIDDEN_CAM_DOT;
		});
		// If all four directions are forbidden, fall back to all four so the
		// dimension still draws — better degenerate than missing.
		const dirs_to_try = filtered_dirs.length > 0 ? filtered_dirs : four_dirs;
		const flag_forbidden_local = filtered_dirs.length === 0;

		let witness_dir: vec3 | null = null;
		let best_clearance = Infinity;
		let best_avg_wlen = 0;
		let best_max_t = 0;

		for (const dir of dirs_to_try) {
			const v1_plus = vec3.add(vec3.create(), v1, dir);
			const v2_plus = vec3.add(vec3.create(), v2, dir);
			const p_v1w = host.project_vertex(v1_plus, world_matrix);
			const p_v2w = host.project_vertex(v2_plus, world_matrix);
			if (p_v1w.w < 0 || p_v2w.w < 0) continue;
			const wlen1 = Math.sqrt((p_v1w.x - p1.x) ** 2 + (p_v1w.y - p1.y) ** 2);
			const wlen2 = Math.sqrt((p_v2w.x - p2.x) ** 2 + (p_v2w.y - p2.y) ** 2);
			if (wlen1 < 0.001 || wlen2 < 0.001) continue;
			const a_wlen = (wlen1 + wlen2) / 2;
			const g_3d = 4 / a_wlen;
			const d_3d = 20 / a_wlen;

			const w1s_p = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, dir, g_3d), world_matrix);
			const d1_p = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, dir, d_3d), world_matrix);
			const d2_p = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v2, dir, d_3d), world_matrix);
			if (w1s_p.w < 0 || d1_p.w < 0 || d2_p.w < 0) continue;

			const wit_dx = d1_p.x - w1s_p.x;
			const wit_dy = d1_p.y - w1s_p.y;
			const wit_screen_len = Math.sqrt(wit_dx * wit_dx + wit_dy * wit_dy);
			if (wit_screen_len < 0.001) continue;
			const wit_ux = wit_dx / wit_screen_len;
			const wit_uy = wit_dy / wit_screen_len;
			const midX_init = (d1_p.x + d2_p.x) / 2;
			const midY_init = (d1_p.y + d2_p.y) / 2;

			const exit_t = combined_hull.length >= 3
				? Math.max(0, ray_polygon_exit(midX_init, midY_init, wit_ux, wit_uy, combined_hull))
				: 0;

			// The label's rectangle extends half its width and half its height
			// around the center. Project the rectangle onto the witness arrow
			// direction to get the radius along that direction. The back of
			// the rectangle is this many pixels behind the center along the
			// arrow, so the push must include this extra distance to put the
			// whole rectangle past the silhouette.
			const rect_radius_along_arrow = (label_rect_w * Math.abs(wit_ux) + label_rect_h * Math.abs(wit_uy)) / 2;
			const total_clearance = exit_t > 0 ? exit_t + rect_radius_along_arrow : 0;

			// Project the witness line at the post-push distance and measure
			// it on screen. Any direction whose projected witness exceeds the
			// threshold is skipped — these are the "stretched line" cases
			// from deep objects where the witness from the anchored start
			// projects much longer than the push amount suggests.
			const WITNESS_LEN_MAX = 120;
			const raw_push_for_test = total_clearance > 0 ? total_clearance + SILHOUETTE_MARGIN : 0;
			const capped_push_for_test = Math.min(raw_push_for_test, 80);
			const pushed_dist_3d_test = d_3d + capped_push_for_test / a_wlen;
			const ext_3d_test = 8 / a_wlen;
			const w1_end_test = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, dir, pushed_dist_3d_test + ext_3d_test), world_matrix);
			if (w1_end_test.w < 0) continue;
			const projected_witness_len = Math.sqrt(
				(w1_end_test.x - w1s_p.x) ** 2 + (w1_end_test.y - w1s_p.y) ** 2
			);
			if (projected_witness_len > WITNESS_LEN_MAX) continue;

			// Smaller clearance wins. On ties, prefer the fallback direction.
			const ties_fallback = vec3.equals(dir, fallback_dir);
			if (total_clearance < best_clearance || (total_clearance === best_clearance && ties_fallback)) {
				best_clearance = total_clearance;
				witness_dir = dir;
				best_avg_wlen = a_wlen;
				best_max_t = total_clearance;
			}
		}

		if (!witness_dir) continue;

		const gap_px = 4;
		const dist_px = 20;
		const ext_px = 8;
		const avg_wlen = best_avg_wlen;
		const gap_3d = gap_px / avg_wlen;
		let dist_3d = dist_px / avg_wlen;
		const ext_3d = ext_px / avg_wlen;

		if (best_max_t > 0) {
			// Cap the push so a single dimension can't fly off the canvas.
			// Beyond the cap, accept the label sitting closer to or slightly
			// inside the drawing rather than vanishing off-screen.
			const PUSH_CAP_PX = 80;
			const raw_push_px = best_max_t + SILHOUETTE_MARGIN;
			const capped_push_px = Math.min(raw_push_px, PUSH_CAP_PX);
			dist_3d += capped_push_px / avg_wlen;
			// console.log(
			// 	`silhouette push '${so.name}' ${axis}: ` +
			// 	`pushed by ${capped_push_px.toFixed(0)} px (raw ${raw_push_px.toFixed(0)}) past the combined drawing outline`
			// );
		}

		// Rule 18 already filters out directions whose post-push witness line
		// would exceed the threshold, so by the time we get here the chosen
		// direction's witness line is acceptable. No binary-search cap needed.

		const w1_start = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, witness_dir, gap_3d), world_matrix);
		const w2_start = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v2, witness_dir, gap_3d), world_matrix);
		const w1_end = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, witness_dir, dist_3d + ext_3d), world_matrix);
		const w2_end = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v2, witness_dir, dist_3d + ext_3d), world_matrix);
		const d1 = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v1, witness_dir, dist_3d), world_matrix);
		const d2 = host.project_vertex(vec3.scaleAndAdd(vec3.create(), v2, witness_dir, dist_3d), world_matrix);

		if (w1_start.w < 0 || w1_end.w < 0 || w2_start.w < 0 || w2_end.w < 0 || d1.w < 0 || d2.w < 0) continue;

		host.ctx.font = '12px sans-serif';
		const text = units.format_for_system(value, Units.current_unit_system(), stores.current_precision);
		const textWidth = host.ctx.measureText(text).width;
		const textHeight = 12;

		const midX = (d1.x + d2.x) / 2, midY = (d1.y + d2.y) / 2;
		const dim_z = (d1.z + d2.z) / 2;

		if (dimension_occluded(host, midX, midY, textWidth, textHeight, dim_z, so.id)) continue;

		const dx = d2.x - d1.x, dy = d2.y - d1.y;
		const lineLen = Math.sqrt(dx * dx + dy * dy);
		if (lineLen < 1) continue;
		const ux = dx / lineLen, uy = dy / lineLen;

		const padding = 8;
		const gap = textWidth * Math.abs(ux) + textHeight * Math.abs(uy) + padding;
		const arrowSize = 20;

		if (lineLen < gap) continue;

		const layout_case: 1 | 2 = lineLen >= gap + arrowSize ? 1 : 2;

		// Repulsion footprint covers the label and a fraction of the dimension line
		// so parallel dimension lines push each other apart without long perpendicular
		// lines colliding through their full bounding boxes.
		const rep_w = Math.max(textWidth, Math.abs(dx) * 0.5);
		const rep_h = Math.max(textHeight, Math.abs(dy) * 0.5);

		// flag_exceed: did the smallest clearance across the four directions
		// exceed the push cap? If yes, rule 25 would drop this candidate.
		const PUSH_CAP_PX_FLAG = 80;
		const flag_exceed_local = best_clearance > PUSH_CAP_PX_FLAG;

		return {
			key: `${so.id}:${axis}`,
			home_x: midX, home_y: midY,
			x: midX, y: midY,
			vx: 0, vy: 0,
			w: textWidth, h: textHeight,
			rep_w, rep_h,
			text, dim_z, so, axis,
			layout_case,
			w1_start, w1_end, w2_start, w2_end, d1, d2,
			flag_exceed: flag_exceed_local,
			flag_forbidden: flag_forbidden_local,
		};
	}

	return null;
}

function edge_witness_direction(
	host: DimensionHost,
	so: Smart_Object,
	v1_idx: number, v2_idx: number,
	edge_axis: Axis_Name,
	projected: Projected[],
	world_matrix: mat4
): vec3 {
	const ep1 = projected[v1_idx], ep2 = projected[v2_idx];
	const edge_dx = ep2.x - ep1.x, edge_dy = ep2.y - ep1.y;
	const edge_len = Math.sqrt(edge_dx * edge_dx + edge_dy * edge_dy);
	if (edge_len < 0.001) return so.axis_vector('x');
	const edge_ux = edge_dx / edge_len, edge_uy = edge_dy / edge_len;

	const all_axes: Axis_Name[] = ['x', 'y', 'z'];
	const candidates = all_axes.filter(a => a !== edge_axis);

	const origin = vec3.create();
	const p0 = host.project_vertex(origin, world_matrix);

	let best_axis = candidates[0];
	let best_perp = -Infinity;

	for (const axis of candidates) {
		const unit_vec = so.axis_vector(axis);
		const p1 = host.project_vertex(unit_vec, world_matrix);
		const wx = p1.x - p0.x, wy = p1.y - p0.y;
		const cross = Math.abs(edge_ux * wy - edge_uy * wx);
		if (cross > best_perp) {
			best_perp = cross;
			best_axis = axis;
		}
	}

	return so.axis_vector(best_axis);
}

function find_best_edge_for_axis(
	host: DimensionHost,
	so: Smart_Object,
	axis: Axis_Name,
	projected: Projected[]
): { v1_idx: number; v2_idx: number }[] | null {
	if (!so.scene?.faces) return null;
	const verts = so.vertices;
	const faces = so.scene.faces;
	const edges = so.scene.edges;

	const edge_faces = (v1: number, v2: number): number[] => {
		const result: number[] = [];
		for (let fi = 0; fi < faces.length; fi++) {
			const face = faces[fi];
			for (let i = 0; i < face.length; i++) {
				const a = face[i], b = face[(i + 1) % face.length];
				if ((a === v1 && b === v2) || (a === v2 && b === v1)) {
					result.push(fi);
					break;
				}
			}
		}
		return result;
	};

	type SilhouetteCandidate = {
		v1: number; v2: number;
		front_face: number;
	};
	const silhouettes: SilhouetteCandidate[] = [];

	for (const [v1, v2] of edges) {
		if (edge_axis(verts[v1], verts[v2]) !== axis) continue;

		const adj = edge_faces(v1, v2);
		if (adj.length !== 2) continue;

		const w0 = host.face_winding(faces[adj[0]], projected);
		const w1 = host.face_winding(faces[adj[1]], projected);

		if (w0 < 0 && w1 >= 0) {
			silhouettes.push({ v1, v2, front_face: adj[0] });
		} else if (w1 < 0 && w0 >= 0) {
			silhouettes.push({ v1, v2, front_face: adj[1] });
		}
	}

	if (silhouettes.length === 0) return null;

	silhouettes.sort((a, b) => {
		const wa = host.face_winding(faces[a.front_face], projected);
		const wb = host.face_winding(faces[b.front_face], projected);
		return wa - wb;
	});

	return silhouettes.map(s => ({ v1_idx: s.v1, v2_idx: s.v2 }));
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

function dimension_occluded(
	host: DimensionHost,
	cx: number, cy: number, w: number, h: number,
	dim_z: number, owner_id: string,
): boolean {
	const hw = w / 2 + 4, hh = h / 2 + 4;
	const rect_corners = [
		{ x: cx - hw, y: cy - hh },
		{ x: cx + hw, y: cy - hh },
		{ x: cx + hw, y: cy + hh },
		{ x: cx - hw, y: cy + hh },
	];
	const center = { x: cx, y: cy };

	for (const obj of scene.get_all()) {
		if (obj.so.id === owner_id) continue;
		if (!obj.faces) continue;
		const projected = hits_3d.get_projected(obj.id);
		if (!projected) continue;
		const world = host.get_world_matrix(obj);

		for (const face of obj.faces) {
			if (host.face_winding(face, projected) >= 0) continue;
			if (face.some(vi => projected[vi].w < 0)) continue;

			const poly = face.map(vi => ({ x: projected[vi].x, y: projected[vi].y }));
			if (!rect_corners.every(c => host.point_in_polygon_2d(c.x, c.y, poly))) continue;

			const face_z = hits_3d.face_depth_at(center, face, obj.so, world);
			if (face_z === null) continue;

			if (face_z < dim_z) return true;
		}
	}
	return false;
}

/** Draw a prepared candidate. The dimension line is pinned to pass through
 *  the label's simulated position, parallel to its original projected
 *  direction. Each witness line stretches or shrinks along its own projected
 *  ray so its end meets the new dimension line endpoint — witness lines
 *  remain projections of axis-aligned 3D rays, never bending. The label
 *  draws at its simulated position with text aligned horizontally on screen. */
function draw_dimension_candidate(host: DimensionHost, c: Label_Candidate): void {
	const ctx = host.ctx;
	const { w1_start, w1_end, w2_start, w2_end, d1, d2, text, w, h, x, y, layout_case } = c;

	// console.log(
	// 	`drawing '${c.so.name}' ${c.axis}: ` +
	// 	`home at (${c.home_x.toFixed(0)},${c.home_y.toFixed(0)}), ` +
	// 	`label at (${x.toFixed(0)},${y.toFixed(0)}), ` +
	// 	`force drift ${Math.sqrt((x - c.home_x) ** 2 + (y - c.home_y) ** 2).toFixed(0)} px`
	// );

	// Build a 2D line through (x, y) parallel to the original projected
	// dimension line; intersect with each projected witness ray to find
	// new dimension line endpoints. If an intersection falls behind a
	// witness start (parameter < 0), keep that end at its original spot.
	const dl_dx = d2.x - d1.x;
	const dl_dy = d2.y - d1.y;

	function intersect_ray(rx: number, ry: number, rdx: number, rdy: number): { s: number; x: number; y: number } | null {
		// (x + t*dl_dx, y + t*dl_dy) = (rx + s*rdx, ry + s*rdy)
		// Solve for s. Cramer's rule on the 2x2 system.
		const det = dl_dy * rdx - dl_dx * rdy;
		if (Math.abs(det) < 1e-9) return null;
		const s = (dl_dx * (ry - y) - dl_dy * (rx - x)) / det;
		return { s, x: rx + s * rdx, y: ry + s * rdy };
	}

	const i1 = intersect_ray(w1_start.x, w1_start.y, w1_end.x - w1_start.x, w1_end.y - w1_start.y);
	const i2 = intersect_ray(w2_start.x, w2_start.y, w2_end.x - w2_start.x, w2_end.y - w2_start.y);
	const new_d1_x = (i1 && i1.s > 0) ? i1.x : d1.x;
	const new_d1_y = (i1 && i1.s > 0) ? i1.y : d1.y;
	const new_d2_x = (i2 && i2.s > 0) ? i2.x : d2.x;
	const new_d2_y = (i2 && i2.s > 0) ? i2.y : d2.y;

	const dx = new_d2_x - new_d1_x;
	const dy = new_d2_y - new_d1_y;
	const lineLen = Math.sqrt(dx * dx + dy * dy);
	const ux = lineLen > 0 ? dx / lineLen : 0;
	const uy = lineLen > 0 ? dy / lineLen : 0;

	// Bold and thicken when the cursor is on this dimension.
	const hov = hits_3d.hovered_dimension;
	const is_hovered = hov !== null && hov.so === c.so && hov.axis === c.axis;

	// Witness lines: from anchored start straight to new dimension line endpoint
	// (both points lie on the same projected witness ray, so the line is straight).
	ctx.strokeStyle = 'rgba(100, 100, 100, 0.7)';
	ctx.lineWidth = is_hovered ? 1.5 : 0.5;
	ctx.beginPath();
	ctx.moveTo(w1_start.x, w1_start.y);
	ctx.lineTo(new_d1_x, new_d1_y);
	ctx.moveTo(w2_start.x, w2_start.y);
	ctx.lineTo(new_d2_x, new_d2_y);
	ctx.stroke();

	if (layout_case === 1) {
		ctx.beginPath();
		ctx.moveTo(new_d1_x, new_d1_y);
		ctx.lineTo(new_d2_x, new_d2_y);
		ctx.stroke();
		ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
		host.draw_arrow(new_d1_x, new_d1_y, dx, dy);
		host.draw_arrow(new_d2_x, new_d2_y, -dx, -dy);
	} else {
		const extLen = 30;
		ctx.beginPath();
		ctx.moveTo(new_d1_x, new_d1_y);
		ctx.lineTo(new_d1_x - ux * extLen, new_d1_y - uy * extLen);
		ctx.moveTo(new_d2_x, new_d2_y);
		ctx.lineTo(new_d2_x + ux * extLen, new_d2_y + uy * extLen);
		ctx.stroke();
		ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
		host.draw_arrow(new_d1_x, new_d1_y, -dx, -dy);
		host.draw_arrow(new_d2_x, new_d2_y, dx, dy);
	}

	// Label: text drawn horizontally, centered at the label's simulated position
	// (which is exactly on the new dimension line by construction).
	ctx.font = is_hovered ? 'bold 12px sans-serif' : '12px sans-serif';
	ctx.fillStyle = 'white';
	ctx.fillRect(x - w / 2 - 2, y - h / 2 - 1, w + 4, h + 2);
	ctx.fillStyle = '#333';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, x, y);
}
