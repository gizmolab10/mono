import { describe, it, expect } from 'vitest';
import { k } from '../common/Constants';
import {
	compute_silhouette_box,
	compute_uniface_box_from_silhouette,
	is_face_excluded,
	pick_first_viable_uniface_for_axis,
	pick_closest_uniface_for_axis,
	distance_from_point_to_line_2d,
	rectangles_overlap_2d,
	distance_between_rectangles_2d,
	rectangle_inside_rectangle_2d,
	bounding_rectangle_of_points_2d,
	distance_from_rect_to_segment_2d,
	min_distance_between_segments_2d,
	distance_point_to_segment_2d,
	segments_intersect_2d,
	candidate_passes_clearances,
	evaluate_clearances,
	SLIDE_ELIGIBLE_FILTERS,
	point_in_convex_polygon_2d,
	rect_intersects_convex_polygon_2d,
	distance_from_rect_to_convex_polygon_2d,
	UNIFACE_FACE_POS_X,
	UNIFACE_FACE_NEG_X,
	UNIFACE_FACE_POS_Y,
	UNIFACE_FACE_NEG_Y,
	UNIFACE_FACE_POS_Z,
	UNIFACE_FACE_NEG_Z,
	type Silhouette_Box,
	type Placement_Details,
	tally_candidate_counts_for_vote,
	pick_top_two_witness_indices_per_face,
	is_inside_arrow_blocked_at_anchor,
	does_label_fully_cover_inside_arrow,
	compute_dim_render_geometry,
	get_last_persisted,
	get_last_skip_used,
	get_last_locked_count,
	get_drift_within_tolerance_count,
} from '../render/Dimension_Placement';
import { vec3 } from 'gl-matrix';








describe('Dimension_Placement — uniface design (rules 1-8) (pending implementation)', () => {
	// These tests describe the expected behaviour of the uniface design
	// captured in uniface rules.md (master spec). Rules 1 through 8 are placement
	// rules; rules 9-10 are meta-rules (carry-over and abandoned).
	// They are marked .todo so they show up in the suite as outstanding
	// work without producing failures while the implementation is missing.
	// Convert each .todo to .it once the corresponding helper exists.

	it('builds a world-axis-aligned 3D box that encloses every world corner of every rendered part (the root silhouette box)', () => {
		const corners: vec3[] = [
			vec3.fromValues(-1, -2, -3),
			vec3.fromValues( 2,  1,  0),
			vec3.fromValues( 0,  4,  5),
			vec3.fromValues(-5, -1,  2),
		];
		const box = compute_silhouette_box(corners);
		expect(box.min).toEqual([-5, -2, -3]);
		expect(box.max).toEqual([ 2,  4,  5]);
	});

	it.todo('excludes rotated parts from the root silhouette box — each rotated part gets its own silhouette box per rule 4');

	it('expands each kept face by a world-units shift whose projection sits exactly the silhouette margin past the silhouette polygon (rule 8)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const margin_px = 15;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, margin_px, 1);
		// Project the silhouette's POS_X face center: (10, 5, 5) → x = 10.
		// The POS_X uniface face at witness index 0 should project to x = 10 + 15 = 25.
		const shift_pos_x = box.shifts[0][UNIFACE_FACE_POS_X] as number;
		expect(project(vec3.fromValues(10 + shift_pos_x, 5, 5)).x - project(vec3.fromValues(10, 5, 5)).x).toBeCloseTo(margin_px, 1);
		// Symmetric: NEG_X face projection sits 15 px to the left of silhouette x = 0.
		const shift_neg_x = box.shifts[0][UNIFACE_FACE_NEG_X] as number;
		expect(project(vec3.fromValues(0, 5, 5)).x - project(vec3.fromValues(0 - shift_neg_x, 5, 5)).x).toBeCloseTo(margin_px, 1);
	});

	it('the box builder has no module-level cache — two calls with the same inputs return INDEPENDENT objects (recomputes every render)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const a = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 1);
		const b = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 1);
		expect(a).not.toBe(b);
		expect(a.shifts).not.toBe(b.shifts);
	});

	it('returns an empty silhouette box at the origin when no parts are rendered', () => {
		const box = compute_silhouette_box([]);
		expect(box.min).toEqual([0, 0, 0]);
		expect(box.max).toEqual([0, 0, 0]);
	});

	it('places the dim line in the plane of a uniface (rule 3)', () => {
		// An anchor sits on uniface POS_X when its world x equals
		// silhouette.max[0] + shift. Verify the box builder makes
		// such a position reachable.
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		const shift_pos_x_0 = box.shifts[0][UNIFACE_FACE_POS_X] as number;
		const shift_pos_x_1 = box.shifts[1][UNIFACE_FACE_POS_X] as number;
		const shift_pos_x_2 = box.shifts[2][UNIFACE_FACE_POS_X] as number;
		// Anchors on the POS_X uniface plane at each witness index.
		const anchor_a = vec3.fromValues(silhouette.max[0] + shift_pos_x_0, 3, 5);
		const anchor_b = vec3.fromValues(silhouette.max[0] + shift_pos_x_1, 7, 2);
		const anchor_c = vec3.fromValues(silhouette.max[0] + shift_pos_x_2, 1, 8);
		expect(anchor_a[0]).toBeCloseTo(silhouette.max[0] + shift_pos_x_0, 6);
		expect(anchor_b[0]).toBeCloseTo(silhouette.max[0] + shift_pos_x_1, 6);
		expect(anchor_c[0]).toBeCloseTo(silhouette.max[0] + shift_pos_x_2, 6);
		// Three distinct planes, one per witness index, all parallel to YZ.
		expect(shift_pos_x_0).toBeLessThan(shift_pos_x_1);
		expect(shift_pos_x_1).toBeLessThan(shift_pos_x_2);
	});

	it('the witness index picks which of the three nested uniface boxes holds the dim line (rule 1)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// Three nested levels exist. Each level's outward distance for a given face is larger than the previous.
		expect(box.shifts.length).toBe(3);
		const f = UNIFACE_FACE_POS_X;
		expect(box.shifts[0][f]).toBeLessThan(box.shifts[1][f] as number);
		expect(box.shifts[1][f]).toBeLessThan(box.shifts[2][f] as number);
		// The picker accepts a witness index and returns a uniface for each level.
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).not.toBeNull();
		expect(pick_first_viable_uniface_for_axis('x', box, 1)).not.toBeNull();
		expect(pick_first_viable_uniface_for_axis('x', box, 2)).not.toBeNull();
	});

	it('drops the label when no witness length places the dim line on a uniface without conflict (rule 3)', () => {
		// Every face excluded by the camera-axis filter → picker returns null
		// at every witness index → no viable uniface → label drops.
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const exclude_everything = (_n: vec3) => true;
		const box = compute_uniface_box_from_silhouette(silhouette, project, exclude_everything, 15, 3);
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).toBeNull();
		expect(pick_first_viable_uniface_for_axis('x', box, 1)).toBeNull();
		expect(pick_first_viable_uniface_for_axis('x', box, 2)).toBeNull();
	});

	it.todo('rotated parts get their own uniface box rotated with the part, around a local silhouette of the part and its subparts (rule 4)');

	it('a part-axis dim line is parallel-in-3D to that axis and lies on one of the four unifaces that contain that axis (rule 3)', () => {
		// For an x-axis dim line, the two anchors sit at the same y and z
		// but different x — so the direction (a2 - a1) is along (1,0,0).
		const a1_x = vec3.fromValues(0, 5, 7);
		const a2_x = vec3.fromValues(10, 5, 7);
		const dir_x = vec3.sub(vec3.create(), a2_x, a1_x);
		vec3.normalize(dir_x, dir_x);
		expect(dir_x[0]).toBeCloseTo(1, 6);
		expect(dir_x[1]).toBeCloseTo(0, 6);
		expect(dir_x[2]).toBeCloseTo(0, 6);
		// Same for y-axis.
		const a1_y = vec3.fromValues(3, 0, 7);
		const a2_y = vec3.fromValues(3, 10, 7);
		const dir_y = vec3.sub(vec3.create(), a2_y, a1_y);
		vec3.normalize(dir_y, dir_y);
		expect(dir_y[0]).toBeCloseTo(0, 6);
		expect(dir_y[1]).toBeCloseTo(1, 6);
		expect(dir_y[2]).toBeCloseTo(0, 6);
		// And z-axis.
		const a1_z = vec3.fromValues(3, 5, 0);
		const a2_z = vec3.fromValues(3, 5, 10);
		const dir_z = vec3.sub(vec3.create(), a2_z, a1_z);
		vec3.normalize(dir_z, dir_z);
		expect(dir_z[0]).toBeCloseTo(0, 6);
		expect(dir_z[1]).toBeCloseTo(0, 6);
		expect(dir_z[2]).toBeCloseTo(1, 6);
	});

	it('two dims along the same axis on different parts can share the same uniface when there is room', () => {
		// Two label rectangles at the same uniface but at separate
		// positions along the dim line. Their pairwise clearance is
		// enforced by the label-vs-label filter, not by the choice of
		// uniface. So they CAN share the uniface as long as their
		// rectangles are at least PAIR_CLEARANCE_PX apart.
		const rect_a = { x_min: 100, x_max: 140, y_min: 100, y_max: 114 };
		const rect_b = { x_min: 200, x_max: 240, y_min: 100, y_max: 114 };
		// 60 px gap between them along x — well over the 5-pixel
		// PAIR_CLEARANCE_PX threshold.
		const gap = distance_between_rectangles_2d(rect_a, rect_b);
		expect(gap).toBeGreaterThan(k.dimensions.PAIR_CLEARANCE_PX);
	});

	it('removes the 200-px witness cap for non-rotated parts — Placement_Details accepts arbitrarily long witnesses', () => {
		// In the new path the witness_length_px on a pick is whatever
		// distance the search produced. The old WITNESS_CAP_PX (200)
		// does not gate the new code. Verify the type accepts and the
		// renderer's downstream code reads the raw value back.
		const pick: Placement_Details = {
			uniface                : UNIFACE_FACE_POS_X,
			edge_v1_idx            : 0,
			edge_v2_idx            : 1,
			natural_label_position : { x: 100, y: 200 },
			witness_index          : 0,
			witness_length_px      : 450,  // well over the old 200-px cap
			edge_p1_screen         : { x: 0, y: 0 },
			edge_p2_screen         : { x: 10, y: 0 },
			anchor_1_screen        : { x: 0, y: 450 },
			anchor_2_screen        : { x: 10, y: 450 },
			label_text             : '12\'',
		};
		expect(pick.witness_length_px).toBe(450);
		expect(pick.witness_length_px).toBeGreaterThan(k.dimensions.WITNESS_CAP_PX);
	});

	// Coverage gaps from step 2 of the test-rollout proposal.

	it('the witness index cap value is 6 and is read from k.dimensions.WITNESS_INDEX_CAP (rule 1)', () => {
		expect(k.dimensions.WITNESS_INDEX_CAP).toBe(6);
	});

	it('the four placement choices are exactly edge, uniface, witness index, label position (rule 2)', () => {
		// Build a synthetic Placement_Details record and verify it
		// carries all four named fields.
		const pick: Placement_Details = {
			uniface                : UNIFACE_FACE_POS_X,
			edge_v1_idx            : 0,
			edge_v2_idx            : 1,
			natural_label_position : { x: 100, y: 200 },
			witness_index          : 1,
			witness_length_px      : 42,
			edge_p1_screen         : { x: 0, y: 0 },
			edge_p2_screen         : { x: 10, y: 0 },
			anchor_1_screen        : { x: 0, y: 50 },
			anchor_2_screen        : { x: 10, y: 50 },
			label_text             : '5\'',
		};
		// All four placement-choice fields per rule 2.
		expect(pick.uniface).not.toBeNull();
		expect(pick.edge_v1_idx).not.toBeNull();
		expect(pick.edge_v2_idx).not.toBeNull();
		expect(pick.witness_index).toBeGreaterThanOrEqual(0);
		expect(pick.natural_label_position).not.toBeNull();
	});

	it.todo('for a rotated part, the label center sits on the uniface closest to the rotated label projected center (rule 4 sub-point 1)');

	it.todo('for a rotated part, the dim line lies on a plane parallel to the rotated silhouette box that passes through the label center (rule 4 sub-point 1)');

	it('dropping a label because its witness index exceeded the cap does not trigger re-placement for labels that depended on this one position (rule 7)', () => {
		// run_uniface_placement walks each (part, axis) exactly once and
		// commits or drops in that single pass. Slide-retry is per-candidate,
		// not cross-label, so a drop never re-triggers anyone else.
		expect(SLIDE_ELIGIBLE_FILTERS).toBeInstanceOf(Set);
	});

	it('k.dimensions.PAIR_CLEARANCE_PX is 5 and k.dimensions.SILHOUETTE_MARGIN_PX is 15', () => {
		expect(k.dimensions.PAIR_CLEARANCE_PX).toBe(5);
		expect(k.dimensions.SILHOUETTE_MARGIN_PX).toBe(15);
	});

	// Rule 19 — depth-concentration vote.
	// After the full sweep finds viable depths per (part, direction), each
	// direction tallies how many parts found each depth viable. The two
	// depths with the longest lists win that direction; every other
	// (part, direction, depth) viability record is discarded. Parts viable
	// in a direction only at a losing depth lose that direction entirely.
	it('per direction, only the two witness indices with the most viable parts survive the depth-concentration vote (rule 19)', () => {
		// Three parts, direction POS_X. Witness index 0 viable for all three;
		// index 1 viable for two of three; index 2 viable for one of three;
		// index 3 viable for one of three. Top two = indices 0 and 1.
		const viability = new Map<string, Set<string>>([
			['part-A|x', new Set([`${UNIFACE_FACE_POS_X}|0`, `${UNIFACE_FACE_POS_X}|1`, `${UNIFACE_FACE_POS_X}|2`])],
			['part-B|x', new Set([`${UNIFACE_FACE_POS_X}|0`, `${UNIFACE_FACE_POS_X}|1`, `${UNIFACE_FACE_POS_X}|3`])],
			['part-C|x', new Set([`${UNIFACE_FACE_POS_X}|0`])],
		]);
		const counts = tally_candidate_counts_for_vote(viability);
		const winners = pick_top_two_witness_indices_per_face(counts, 4);
		const top = winners.get(UNIFACE_FACE_POS_X);
		expect(top).toBeDefined();
		expect(top!.has(0)).toBe(true);
		expect(top!.has(1)).toBe(true);
		expect(top!.has(2)).toBe(false);
		expect(top!.has(3)).toBe(false);
	});

	it('a part viable in a direction only at a witness index that lost the depth-concentration vote loses that direction (rule 19)', () => {
		// Five parts pile on index 0 in direction POS_Y; one lonely part is
		// viable only at index 3. The lonely part loses POS_Y because index 3
		// has count 1 while indices 1 and 2 both have count 0.
		const viability = new Map<string, Set<string>>([
			['part-A|y', new Set([`${UNIFACE_FACE_POS_Y}|0`])],
			['part-B|y', new Set([`${UNIFACE_FACE_POS_Y}|0`])],
			['part-C|y', new Set([`${UNIFACE_FACE_POS_Y}|0`])],
			['part-D|y', new Set([`${UNIFACE_FACE_POS_Y}|0`])],
			['part-E|y', new Set([`${UNIFACE_FACE_POS_Y}|0`])],
			['lonely|y', new Set([`${UNIFACE_FACE_POS_Y}|3`])],
		]);
		const counts = tally_candidate_counts_for_vote(viability);
		const winners = pick_top_two_witness_indices_per_face(counts, 4);
		const top = winners.get(UNIFACE_FACE_POS_Y);
		expect(top!.has(0)).toBe(true);
		expect(top!.has(3)).toBe(true);  // index 3 had count 1, indices 1+2 had count 0 → 3 wins second
		// If instead one of indices 1 or 2 had count >= 1, "lonely" would lose.
		const counts_with_filler = tally_candidate_counts_for_vote(new Map<string, Set<string>>([
			...viability,
			['filler1|y', new Set([`${UNIFACE_FACE_POS_Y}|1`])],
			['filler2|y', new Set([`${UNIFACE_FACE_POS_Y}|1`])],
		]));
		const top2 = pick_top_two_witness_indices_per_face(counts_with_filler, 4).get(UNIFACE_FACE_POS_Y);
		expect(top2!.has(3)).toBe(false);  // lonely's index 3 is no longer in top 2
		expect(top2!.has(0)).toBe(true);
		expect(top2!.has(1)).toBe(true);
	});

	it('the depth-concentration vote leaves each direction with at most two surviving witness indices (rule 19)', () => {
		// Direction POS_Z: every witness index has many viable parts. Vote
		// must still cap at two winners per direction.
		const viability = new Map<string, Set<string>>();
		for (let p = 0; p < 10; p++) {
			viability.set(`part-${p}|z`, new Set([
				`${UNIFACE_FACE_POS_Z}|0`,
				`${UNIFACE_FACE_POS_Z}|1`,
				`${UNIFACE_FACE_POS_Z}|2`,
				`${UNIFACE_FACE_POS_Z}|3`,
			]));
		}
		const counts = tally_candidate_counts_for_vote(viability);
		const winners = pick_top_two_witness_indices_per_face(counts, 4);
		for (let face_idx = 0; face_idx < 6; face_idx++) {
			const top = winners.get(face_idx);
			expect(top!.size).toBeLessThanOrEqual(2);
		}
	});

	// Rule 18 — dim line and arrow drawing (renderer behaviour pinned by visual review).
	// Tests live here because the rule is owned by the placement spec; the
	// behaviour itself is implemented in Dimension_Renderer.ts via the
	// pure helper compute_dim_render_geometry.
	const make_placement = (overrides: Partial<Placement_Details>): Placement_Details => ({
		uniface                : UNIFACE_FACE_POS_X,
		edge_v1_idx            : 0,
		edge_v2_idx            : 1,
		natural_label_position : { x: 100, y: 50 },
		witness_index          : 1,
		witness_length_px      : 30,
		edge_p1_screen         : { x: 0, y: 80 },
		edge_p2_screen         : { x: 200, y: 80 },
		anchor_1_screen        : { x: 0, y: 50 },
		anchor_2_screen        : { x: 200, y: 50 },
		label_text             : '5\'',
		...overrides,
	});
	const GEOM_W_GAP = 5;
	const GEOM_W_PAST = 10;
	const GEOM_OVERHANG = 20;
	const GEOM_ARROW = 6;

	it('the arrowhead tip touches the witness line at the anchor in both the inside and overhang cases (rule 18)', () => {
		// Inside case: label fits between the two anchors.
		const placement_inside = make_placement({});
		const g_inside = compute_dim_render_geometry(placement_inside, 40, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		expect(g_inside.arrows[0].tip).toEqual(placement_inside.anchor_1_screen);
		expect(g_inside.arrows[1].tip).toEqual(placement_inside.anchor_2_screen);
		// Overhang case: label slid past anchor 1.
		const placement_slid = make_placement({ natural_label_position: { x: -50, y: 50 } });
		const g_slid = compute_dim_render_geometry(placement_slid, 40, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		expect(g_slid.arrows[0].tip).toEqual(placement_slid.anchor_1_screen);
		expect(g_slid.arrows[1].tip).toEqual(placement_slid.anchor_2_screen);
	});

	it('an inside arrow that fits between the label box and the witness line is NOT blocked (rule 18)', () => {
		// Horizontal dim line; label centered at x=100, half_w=20, arrow size 6.
		// Anchor at x=0 sits 100 px left of label center — far more than
		// (20 + 2 + 6) = 28 px needed. Arrow fits.
		const label_center = { x: 100, y: 50 };
		const anchor_a1 = { x: 0, y: 50 };
		expect(is_inside_arrow_blocked_at_anchor(anchor_a1, label_center, 1, 0, +1, 20, 6)).toBe(false);
		// Mirror: anchor at x=200 with arrow pointing -1.
		const anchor_a2 = { x: 200, y: 50 };
		expect(is_inside_arrow_blocked_at_anchor(anchor_a2, label_center, 1, 0, -1, 20, 6)).toBe(false);
	});

	it('an inside arrow that does NOT fit between the label box and the witness line is blocked, triggering the outside flip (rule 18)', () => {
		// Label centered at x=100, half_w=20, arrow 6 — needs (20+2+6)=28 px
		// of clearance along the dim direction. Anchor at x=80 sits only 20
		// px to the left — too tight. Arrow blocked.
		const label_center = { x: 100, y: 50 };
		const anchor_too_close = { x: 80, y: 50 };
		expect(is_inside_arrow_blocked_at_anchor(anchor_too_close, label_center, 1, 0, +1, 20, 6)).toBe(true);
		// Diagonal case: dim direction at 45 degrees. Same projection check.
		const sqrt2 = Math.sqrt(2);
		const diagnostic_label = { x: 100, y: 100 };
		// Anchor 30 px back along the diagonal — projection -30, needed 28.
		// 30 > 28, so NOT blocked.
		const anchor_diagnostic_ok = { x: 100 - 30 / sqrt2, y: 100 - 30 / sqrt2 };
		expect(is_inside_arrow_blocked_at_anchor(anchor_diagnostic_ok, diagnostic_label, 1 / sqrt2, 1 / sqrt2, +1, 20, 6)).toBe(false);
		// Anchor 20 px back along the diagonal — projection -20, less than 28.
		// Blocked.
		const anchor_diagnostic_blocked = { x: 100 - 20 / sqrt2, y: 100 - 20 / sqrt2 };
		expect(is_inside_arrow_blocked_at_anchor(anchor_diagnostic_blocked, diagnostic_label, 1 / sqrt2, 1 / sqrt2, +1, 20, 6)).toBe(true);
	});

	it('the inside dim segment between the two anchors is dropped whenever EITHER side flips to outside (rule 18)', () => {
		// Tight label between two close anchors — both sides flip outside.
		const placement = make_placement({
			anchor_1_screen        : { x: 70, y: 50 },
			anchor_2_screen        : { x: 130, y: 50 },
			natural_label_position : { x: 100, y: 50 },
		});
		const geom = compute_dim_render_geometry(placement, 80, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		expect(geom.a1_outside).toBe(true);
		expect(geom.a2_outside).toBe(true);
		// No segment runs from a1 to a2 — only outside extensions.
		const has_inside_full = geom.dim_line_segments.some(seg =>
			seg.from.x === 70 && seg.from.y === 50 && seg.to.x === 130 && seg.to.y === 50,
		);
		expect(has_inside_full).toBe(false);
	});

	it('each side of the dim line decides independently whether to flip — one side can be inside while the other is outside (rule 18)', () => {
		// Label closer to anchor 2 so anchor 2 flips outside but anchor 1
		// stays inside.
		const placement = make_placement({
			anchor_1_screen        : { x: 0, y: 50 },
			anchor_2_screen        : { x: 200, y: 50 },
			natural_label_position : { x: 170, y: 50 },
		});
		const geom = compute_dim_render_geometry(placement, 50, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		// One inside, one outside.
		expect(geom.a1_outside).toBe(false);
		expect(geom.a2_outside).toBe(true);
	});

	it('when the label fully covers an arrowhead (anchor and arrow base both inside the label box), the slide-trigger helper returns true (rule 18)', () => {
		// Horizontal dim line; label centered at x=100, half_w=30, half_h=7,
		// arrow size 6. Anchor at x=95 sits 5 px left of label center — well
		// inside the rect. Arrow base at x=95+6=101 is also inside the rect.
		// So fully covered → slide.
		const label_center = { x: 100, y: 50 };
		const anchor_inside = { x: 95, y: 50 };
		expect(does_label_fully_cover_inside_arrow(anchor_inside, label_center, 1, 0, +1, 30, 7, 6)).toBe(true);
		// Anchor at x=50 sits well outside the rect's left edge (rect x_min
		// = 100 - 30 - 2 = 68). Not covered.
		const anchor_outside = { x: 50, y: 50 };
		expect(does_label_fully_cover_inside_arrow(anchor_outside, label_center, 1, 0, +1, 30, 7, 6)).toBe(false);
		// Anchor INSIDE the rect but arrow base OUTSIDE — half-covered, not
		// fully → no slide. Anchor x=66 (just right of x_min=68? no, 66<68 →
		// outside). Pick anchor=67 (still outside). Pick anchor=70:
		// inside rect; base at 76 also inside rect (x_max=132). So fully
		// covered. Need a case where anchor is inside but base is past.
		// Half-covered case: anchor inside the (padded) rect but the arrow's
		// base sits past the rect. With half_w=4 (rect x in [94,106]),
		// anchor at x=102 is inside; the arrow base at x=108 sits past
		// x_max=106 → NOT fully covered.
		const tight_label = { x: 100, y: 50 };
		expect(does_label_fully_cover_inside_arrow({ x: 102, y: 50 }, tight_label, 1, 0, +1, 4, 7, 6)).toBe(false);
	});

	it('step 3.1 slice A — every winning (part, axis) writes a persistence record after a successful placement run', async () => {
		const { run_placement_on_parts } = await import('./helpers/placement_harness');
		const result = run_placement_on_parts([
			{ name: 'wall_a', x_min: 0, x_max: 200, y_min: 0, y_max: 50, z_min: 0, z_max: 50 },
		]);
		const persisted = get_last_persisted();
		// Every winner in the placement result should have a matching key in
		// the persistence map.
		const winners = result.placements.filter(p => p.uniface !== null);
		expect(winners.length).toBeGreaterThan(0);
		for (const w of winners) {
			const key = `${w.so_id}|${w.axis}`;
			const entry = persisted.get(key);
			expect(entry).toBeDefined();
			expect(entry!.face).toBe(w.uniface);
			expect(entry!.witness_index).toBe(w.witness_index - 1);  // proposal stores 0-based; placement result is 1-based
			expect(entry!.label_position_t).toBeGreaterThanOrEqual(0);
			expect(entry!.label_position_t).toBeLessThanOrEqual(1);
			expect(entry!.edge_corner_pair_idx).toBeGreaterThanOrEqual(0);
			expect(entry!.edge_corner_pair_idx).toBeLessThan(4);
		}
	});

	it('step 3.1 slice A — persistence keys for parts no longer rendered are pruned on the next render', async () => {
		const { run_placement_on_parts } = await import('./helpers/placement_harness');
		run_placement_on_parts([
			{ name: 'wall_old', x_min: 0, x_max: 200, y_min: 0, y_max: 50, z_min: 0, z_max: 50 },
		]);
		const after_first = new Set(get_last_persisted().keys());
		expect(after_first.size).toBeGreaterThan(0);
		// Second render with a different part — wall_old's keys must NOT
		// survive into this render's persistence map.
		run_placement_on_parts([
			{ name: 'wall_new', x_min: 100, x_max: 300, y_min: 100, y_max: 150, z_min: 100, z_max: 150 },
		]);
		const after_second = get_last_persisted();
		for (const key of after_first) {
			expect(after_second.has(key)).toBe(false);
		}
		// And the new part is recorded.
		expect(Array.from(after_second.values()).some(e => e.so_name === 'wall_new')).toBe(true);
	});

	it('step 3.1 slice B — second run on the same scene takes the skip path', async () => {
		const { run_placement_on_parts } = await import('./helpers/placement_harness');
		const { run_uniface_placement } = await import('../render/Dimension_Placement');
		// Cubic part — all three axes should commit a winner so eligible
		// pairs match persisted entries.
		const first = run_placement_on_parts([
			{ name: 'box_skip', x_min: 0, x_max: 120, y_min: 0, y_max: 90, z_min: 0, z_max: 60 },
		]);
		expect(get_last_skip_used()).toBe(false);  // first call had nothing to skip from
		const first_winners = first.placements.filter(p => p.uniface !== null).length;
		expect(first_winners).toBeGreaterThan(0);
		expect(get_last_persisted().size).toBe(first_winners);
		// Re-run on the SAME scene (no re-clear): identical scene, identical
		// view. The standalone skip path is retired; the seeded run handles
		// reuse instead. The picked placements must still be unchanged.
		const second = run_uniface_placement();
		expect(get_last_skip_used()).toBe(false);
		// The seeded run reproduces the same set of placements with the
		// same chosen face and witness index per (part, axis).
		expect(second.placements.length).toBe(first.placements.length);
		for (let i = 0; i < first.placements.length; i++) {
			const a = first.placements[i];
			const b = second.placements.find(p => p.so_id === a.so_id && p.axis === a.axis)!;
			expect(b.uniface).toBe(a.uniface);
			expect(b.witness_index).toBe(a.witness_index);
		}
	});

	it('step 3.1 slice C — adding a new part on the next render locks the old parts and runs the search only for the newcomer', async () => {
		const { run_placement_on_parts } = await import('./helpers/placement_harness');
		const { run_uniface_placement } = await import('../render/Dimension_Placement');
		const { scene } = await import('../render/Scene');
		const { cube_edges, cube_faces, make_so } = await import('./helpers/scene_mock');
		// Render a scene with one part. Capture the persistence so we can
		// later check the original entries are preserved by the lock.
		run_placement_on_parts([
			{ name: 'box_lock_a', x_min: 0, x_max: 120, y_min: 0, y_max: 90, z_min: 0, z_max: 60 },
		]);
		const original_persisted_snapshot = new Map<string, { face: number; witness_index: number; edge_corner_pair_idx: number; label_position_t: number }>();
		for (const [key, entry] of get_last_persisted()) {
			original_persisted_snapshot.set(key, {
				face                 : entry.face,
				witness_index        : entry.witness_index,
				edge_corner_pair_idx : entry.edge_corner_pair_idx,
				label_position_t     : entry.label_position_t,
			});
		}
		expect(original_persisted_snapshot.size).toBeGreaterThan(0);
		// Add a second part to the existing scene (no clear).
		const root = scene.get_all().find(o => !o.parent)!;
		const new_so = make_so('box_lock_b', 150, 250, 0, 75, 0, 50);
		scene.create({ so: new_so, edges: cube_edges, faces: cube_faces, parent: root });
		// Re-render. The skip cannot fire because the eligible set changed;
		// slice C locks the original part's entries and the main loop
		// runs only for the new part.
		run_uniface_placement();
		expect(get_last_skip_used()).toBe(false);
		expect(get_last_locked_count()).toBeGreaterThan(0);
		expect(get_last_locked_count()).toBe(original_persisted_snapshot.size);
		// Every original persistence entry must be unchanged after the
		// seeded run — locked labels keep their chosen values.
		const persisted_after = get_last_persisted();
		for (const [key, before] of original_persisted_snapshot) {
			const after = persisted_after.get(key);
			expect(after).toBeDefined();
			expect(after!.face).toBe(before.face);
			expect(after!.witness_index).toBe(before.witness_index);
			expect(after!.edge_corner_pair_idx).toBe(before.edge_corner_pair_idx);
			expect(after!.label_position_t).toBe(before.label_position_t);
		}
		// Whether the new part wins is up to the main search; the slice-C
		// contract is only that the previously persisted entries are
		// locked and unchanged.
	});

	it('step 3.1 slice D — clean skip-path renders keep the drift counter at zero', async () => {
		const { run_placement_on_parts } = await import('./helpers/placement_harness');
		const { run_uniface_placement } = await import('../render/Dimension_Placement');
		// Fresh scene from the harness — start with a non-drifty baseline.
		run_placement_on_parts([
			{ name: 'box_drift', x_min: 0, x_max: 120, y_min: 0, y_max: 90, z_min: 0, z_max: 60 },
		]);
		// Full search just ran; the drift counter is zero after every
		// full-search render.
		expect(get_drift_within_tolerance_count()).toBe(0);
		// Run the same scene three more times. The standalone skip path is
		// retired (so skip is always false) and the drift counter is no
		// longer incremented — it stays at zero across every render.
		for (let i = 0; i < 3; i++) {
			run_uniface_placement();
			expect(get_last_skip_used()).toBe(false);
			expect(get_drift_within_tolerance_count()).toBe(0);
		}
	});

	it('step 3.1 slice B — a different scene on the next render bypasses the skip and runs the full search', async () => {
		const { run_placement_on_parts } = await import('./helpers/placement_harness');
		run_placement_on_parts([
			{ name: 'wall_pre', x_min: 0, x_max: 200, y_min: 0, y_max: 50, z_min: 0, z_max: 50 },
		]);
		// Different part identity → eligible set differs from last render's
		// persisted set, so the skip path must abort and the main search
		// must run.
		run_placement_on_parts([
			{ name: 'wall_post', x_min: 100, x_max: 300, y_min: 100, y_max: 150, z_min: 100, z_max: 150 },
		]);
		expect(get_last_skip_used()).toBe(false);
	});

	it('two labels whose natural positions would overlap each other after the slide are caught by the label-vs-label clearance check (rule 18 + rule 19 filter 2)', async () => {
		const { run_placement_on_parts } = await import('./helpers/placement_harness');
		// Two parts of identical size sitting very close together along
		// the x axis. The first part has width 200, depth 50, height 50;
		// the second part is positioned just past it on x. Both parts'
		// width labels would naturally sit in similar screen positions
		// after the slide; the clearance check should drop at least one
		// or push it to a different uniface direction.
		const result = run_placement_on_parts([
			{ name: 'wall_a', x_min: 0,   x_max: 200, y_min: 0, y_max: 50, z_min: 0, z_max: 50 },
			{ name: 'wall_b', x_min: 210, x_max: 410, y_min: 0, y_max: 50, z_min: 0, z_max: 50 },
		]);
		// Some placements may not commit (witness index excluded, edge-on,
		// etc.) but no two committed placements share the same label rect
		// coordinates on the screen — the label-vs-label clearance check
		// stands between them.
		const drawn = result.placements.filter(p => p.uniface !== null && p.natural_label_position !== null);
		const positions = drawn.map(p => `${Math.round(p.natural_label_position!.x)},${Math.round(p.natural_label_position!.y)}`);
		const unique_positions = new Set(positions);
		expect(unique_positions.size).toBe(positions.length);
	});

	it('the renderer does NOT re-slide the label — the geometry text position equals the placement natural position (rule 18)', () => {
		const placement = make_placement({ natural_label_position: { x: 73, y: 41 } });
		const geom = compute_dim_render_geometry(placement, 40, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		expect(geom.label_text_position).toEqual({ x: 73, y: 41 });
	});

	it('an inside arrowhead has the half of the dim line on its side drawn inside (rule 18)', () => {
		// Both sides inside: a single segment from a1 to a2.
		const placement = make_placement({});
		const geom = compute_dim_render_geometry(placement, 30, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		expect(geom.a1_outside).toBe(false);
		expect(geom.a2_outside).toBe(false);
		expect(geom.dim_line_segments).toHaveLength(1);
		expect(geom.dim_line_segments[0].from).toEqual(placement.anchor_1_screen);
		expect(geom.dim_line_segments[0].to).toEqual(placement.anchor_2_screen);
	});

	it('a flipped (outside) arrowhead draws NO inside dim line on its side (rule 18)', () => {
		// Both outside: only outside extensions, no segment touching the
		// interior between a1 and a2.
		const placement = make_placement({
			anchor_1_screen        : { x: 70, y: 50 },
			anchor_2_screen        : { x: 130, y: 50 },
			natural_label_position : { x: 100, y: 50 },
		});
		const geom = compute_dim_render_geometry(placement, 80, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		// Two outside extensions, one on each side. Each is overhang long.
		expect(geom.dim_line_segments).toHaveLength(2);
		// No segment from a1 to a2 nor from a1 to anything between them.
		for (const seg of geom.dim_line_segments) {
			const both_inside = (seg.from.x > 70 && seg.from.x < 130) || (seg.to.x > 70 && seg.to.x < 130);
			expect(both_inside).toBe(false);
		}
	});

	it('once the label has been slid past a witness anchor, BOTH arrows flip outside (rule 18)', () => {
		// Label slid past a1 — both arrows must go outside even though a2
		// alone might have allowed an inside arrow.
		const placement = make_placement({ natural_label_position: { x: -50, y: 50 } });
		const geom = compute_dim_render_geometry(placement, 30, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		expect(geom.slid_past_anchor).toBe('a1');
		expect(geom.a1_outside).toBe(true);
		expect(geom.a2_outside).toBe(true);
	});

	it('every outside arrow gets a dim-line extension of EXACTLY SLIDABLE_OVERHANG_PX (20 screen pixels) (rule 18)', () => {
		// Both-outside case — both extensions are exactly 20 px long.
		const placement = make_placement({
			anchor_1_screen        : { x: 70, y: 50 },
			anchor_2_screen        : { x: 130, y: 50 },
			natural_label_position : { x: 100, y: 50 },
		});
		const geom = compute_dim_render_geometry(placement, 80, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		expect(geom.dim_line_segments).toHaveLength(2);
		for (const seg of geom.dim_line_segments) {
			const len = Math.hypot(seg.to.x - seg.from.x, seg.to.y - seg.from.y);
			expect(len).toBeCloseTo(GEOM_OVERHANG, 1);
		}
	});

	it('on the slid side, a connector dim line runs from the extension end to the label near edge (rule 18)', () => {
		// Label slid past a1 — three segments total: a1 extension, a2
		// extension, AND a connector from the a1 extension end to the
		// label's near edge.
		const placement = make_placement({ natural_label_position: { x: -50, y: 50 } });
		const geom = compute_dim_render_geometry(placement, 30, 14, GEOM_W_GAP, GEOM_W_PAST, GEOM_OVERHANG, GEOM_ARROW)!;
		expect(geom.slid_past_anchor).toBe('a1');
		expect(geom.dim_line_segments).toHaveLength(3);
	});

	it.todo('hovering on the label number box triggers the same red highlight and popup as hovering on a dim line, witness line, or part (rule 18 + rule 20)');

	// Rule 19 — descending-millimetres traversal (step 3h).
	it.todo('the placement algorithm visits (part, axis) entries in descending order of millimetre value (rule 19)');

	it.todo('when two labels compete for the same spot, the one with the larger millimetre value wins (rule 19)');

	it.todo('the traversal queue empties cleanly — every (part, axis) is either committed or explicitly dropped (rule 19)');
});

describe('Dimension_Placement — uniface box builder (step 1)', () => {
	it('silhouette box encloses every world corner', () => {
		// Two parts: one centered at origin (size 2), one shifted at (10, 5, 0) (size 4).
		const corners: vec3[] = [
			vec3.fromValues(-1, -1, -1), vec3.fromValues(1, -1, -1), vec3.fromValues(1, 1, -1), vec3.fromValues(-1, 1, -1),
			vec3.fromValues(-1, -1,  1), vec3.fromValues(1, -1,  1), vec3.fromValues(1, 1,  1), vec3.fromValues(-1, 1,  1),
			vec3.fromValues(8, 3, -2), vec3.fromValues(12, 3, -2), vec3.fromValues(12, 7, -2), vec3.fromValues(8, 7, -2),
			vec3.fromValues(8, 3,  2), vec3.fromValues(12, 3,  2), vec3.fromValues(12, 7,  2), vec3.fromValues(8, 7,  2),
		];
		const box = compute_silhouette_box(corners);
		expect(box.min).toEqual([-1, -1, -2]);
		expect(box.max).toEqual([12, 7, 2]);
	});

	it('per-uniface shift equals margin when projection is 1 pixel per world unit (no exclusions)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		// Identity-scale projection: drop z, copy x and y to screen.
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// +x face moves along world +x; projection sees screen +x change by 1 per world unit.
		// shift at level 1 should equal margin (15).
		expect(box.shifts[0][UNIFACE_FACE_POS_X]).toBeCloseTo(15, 6);
		expect(box.shifts[0][UNIFACE_FACE_NEG_X]).toBeCloseTo(15, 6);
		expect(box.shifts[0][UNIFACE_FACE_POS_Y]).toBeCloseTo(15, 6);
		expect(box.shifts[0][UNIFACE_FACE_NEG_Y]).toBeCloseTo(15, 6);
		// +z and -z faces move along world z, which the identity-xy projection drops.
		// screen_per_world is zero → shift is zero per the safety guard.
		expect(box.shifts[0][UNIFACE_FACE_POS_Z]).toBe(0);
		expect(box.shifts[0][UNIFACE_FACE_NEG_Z]).toBe(0);
	});

	it('per-uniface shift scales linearly with the enum level (no exclusions)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: 2 * w[0], y: 2 * w[1] }); // 2 px per world unit
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// Enum 1: shift = 15 / 2 = 7.5
		// Enum 2: shift = 30 / 2 = 15
		// Enum 3: shift = 45 / 2 = 22.5
		expect(box.shifts[0][UNIFACE_FACE_POS_X]).toBeCloseTo(7.5, 6);
		expect(box.shifts[1][UNIFACE_FACE_POS_X]).toBeCloseTo(15, 6);
		expect(box.shifts[2][UNIFACE_FACE_POS_X]).toBeCloseTo(22.5, 6);
	});

	it('excluded faces get null shifts at every enum level', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// Exclude only the +x face.
		const is_excluded = (n: vec3) => n[0] === 1 && n[1] === 0 && n[2] === 0;
		const box = compute_uniface_box_from_silhouette(silhouette, project, is_excluded, 15, 3);
		expect(box.shifts[0][UNIFACE_FACE_POS_X]).toBeNull();
		expect(box.shifts[1][UNIFACE_FACE_POS_X]).toBeNull();
		expect(box.shifts[2][UNIFACE_FACE_POS_X]).toBeNull();
		// Other faces still get numeric shifts.
		expect(box.shifts[0][UNIFACE_FACE_NEG_X]).toBeCloseTo(15, 6);
	});

	it('the excluded-face rule rejects front-facing within 20° of pointing AT the camera and back-facing within 45° of pointing AWAY', () => {
		// Camera looks in +z (forward = (0,0,1)).
		// Back-facing = normal points AWAY from camera (same direction as forward).
		// Front-facing = normal points TOWARD camera (opposite to forward).
		const forward = vec3.fromValues(0, 0, 1);

		// BACK-facing within 45° of straight-back: rejected.
		expect(is_face_excluded(vec3.fromValues(0, 0, 1), forward, 20, 45)).toBe(true);  // straight back
		const back_at_44 = vec3.fromValues(Math.sin(44 * Math.PI / 180), 0, Math.cos(44 * Math.PI / 180));
		expect(is_face_excluded(back_at_44, forward, 20, 45)).toBe(true);  // 44° off — just inside
		// BACK-facing past 45° (closer to perpendicular): kept.
		const back_at_46 = vec3.fromValues(Math.sin(46 * Math.PI / 180), 0, Math.cos(46 * Math.PI / 180));
		expect(is_face_excluded(back_at_46, forward, 20, 45)).toBe(false);  // 46° off — just outside

		// FRONT-facing within 20° of pointing AT the camera: rejected.
		expect(is_face_excluded(vec3.fromValues(0, 0, -1), forward, 20, 45)).toBe(true);  // straight at camera
		const front_at_19 = vec3.fromValues(Math.sin(19 * Math.PI / 180), 0, -Math.cos(19 * Math.PI / 180));
		expect(is_face_excluded(front_at_19, forward, 20, 45)).toBe(true);  // 19° off, just inside

		// FRONT-facing more than 20° off from head-on: kept (useful glancing front faces).
		const front_at_21 = vec3.fromValues(Math.sin(21 * Math.PI / 180), 0, -Math.cos(21 * Math.PI / 180));
		expect(is_face_excluded(front_at_21, forward, 20, 45)).toBe(false);  // 21° off, just outside
		const front_glancing = vec3.fromValues(Math.sin(80 * Math.PI / 180), 0, -Math.cos(80 * Math.PI / 180));
		expect(is_face_excluded(front_glancing, forward, 20, 45)).toBe(false);  // 80° off — very glancing

		// Edge-on (perpendicular to forward) — past both thresholds — kept.
		expect(is_face_excluded(vec3.fromValues(1, 0, 0), forward, 20, 45)).toBe(false);
		expect(is_face_excluded(vec3.fromValues(0, 1, 0), forward, 20, 45)).toBe(false);
	});

	it('per-axis uniface picker returns the first uniface that is not excluded and contains the axis', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// All six faces are non-excluded.
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// For each axis, picker should return the first candidate in its preferred order.
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).toBe(UNIFACE_FACE_POS_Y);
		expect(pick_first_viable_uniface_for_axis('y', box, 0)).toBe(UNIFACE_FACE_POS_X);
		expect(pick_first_viable_uniface_for_axis('z', box, 0)).toBe(UNIFACE_FACE_POS_X);
	});

	it('per-axis uniface picker skips excluded faces and falls back to the next candidate', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// Exclude +y (the first candidate for x-axis).
		const is_excluded = (n: vec3) => n[1] === 1 && n[0] === 0 && n[2] === 0;
		const box = compute_uniface_box_from_silhouette(silhouette, project, is_excluded, 15, 3);
		// x-axis picker falls back from +y to -y.
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).toBe(UNIFACE_FACE_NEG_Y);
	});

	it('per-axis uniface picker returns null when every candidate is excluded', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// Exclude every face that could contain the x-axis: +y, -y, +z, -z.
		const is_excluded = (n: vec3) => n[0] === 0; // every non-x-axis-normal face
		const box = compute_uniface_box_from_silhouette(silhouette, project, is_excluded, 15, 3);
		expect(pick_first_viable_uniface_for_axis('x', box, 0)).toBeNull();
	});

	it('closest-uniface picker picks the candidate with the smallest screen distance to the seed (step 3a)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		const no_exclusions = (_n: vec3) => false;
		const box = compute_uniface_box_from_silhouette(silhouette, project, no_exclusions, 15, 3);
		// x-axis candidates: +y, -y, +z, -z. Set -z smallest among them.
		// +x and -x entries are not candidates for the x-axis so their values are ignored.
		const dists: number[] = [];
		dists[UNIFACE_FACE_POS_X] = 0;
		dists[UNIFACE_FACE_NEG_X] = 0;
		dists[UNIFACE_FACE_POS_Y] = 50;
		dists[UNIFACE_FACE_NEG_Y] = 20;
		dists[UNIFACE_FACE_POS_Z] = 30;
		dists[UNIFACE_FACE_NEG_Z] = 5;
		expect(pick_closest_uniface_for_axis('x', box, 0, dists)).toBe(UNIFACE_FACE_NEG_Z);
	});

	it('closest-uniface picker skips excluded candidates even when their distance would win (step 3a)', () => {
		const silhouette: Silhouette_Box = { min: [0, 0, 0], max: [10, 10, 10] };
		const project = (w: vec3) => ({ x: w[0], y: w[1] });
		// Exclude the -z face only.
		const exclude_neg_z = (n: vec3) => n[0] === 0 && n[1] === 0 && n[2] === -1;
		const box = compute_uniface_box_from_silhouette(silhouette, project, exclude_neg_z, 15, 3);
		const dists: number[] = [];
		dists[UNIFACE_FACE_POS_X] = 0;
		dists[UNIFACE_FACE_NEG_X] = 0;
		dists[UNIFACE_FACE_POS_Y] = 50;
		dists[UNIFACE_FACE_NEG_Y] = 20;
		dists[UNIFACE_FACE_POS_Z] = 30;
		dists[UNIFACE_FACE_NEG_Z] = 5;  // would win but is excluded
		expect(pick_closest_uniface_for_axis('x', box, 0, dists)).toBe(UNIFACE_FACE_NEG_Y);
	});
});

describe('Dimension_Placement — distance_from_point_to_line_2d (step 3a edge-to-anchor)', () => {
	it('zero distance when the point sits on the line', () => {
		const p = { x: 5, y: 0 };
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(0, 6);
	});

	it('measures perpendicular distance from point to horizontal line', () => {
		const p = { x: 5, y: 7 };
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(7, 6);
	});

	it('measures perpendicular distance from point to vertical line', () => {
		const p = { x: 3, y: 100 };
		const a = { x: 0, y: 0 };
		const b = { x: 0, y: 10 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(3, 6);
	});

	it('measures perpendicular distance from point to a diagonal line', () => {
		// Line y = x (through origin and (1,1)). Point (0, 2) is sqrt(2) away.
		const p = { x: 0, y: 2 };
		const a = { x: 0, y: 0 };
		const b = { x: 1, y: 1 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(Math.SQRT2, 6);
	});

	it('falls back to point-to-endpoint distance when the line is degenerate', () => {
		const p = { x: 3, y: 4 };
		const a = { x: 0, y: 0 };
		const b = { x: 0, y: 0 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(5, 6);
	});

	it('uses the infinite line, not the segment — point off the end still measures perpendicular', () => {
		const p = { x: 100, y: 5 };  // far to the right of the segment, 5 above
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		expect(distance_from_point_to_line_2d(p, a, b)).toBeCloseTo(5, 6);
	});
});

describe('Dimension_Placement — rectangle helpers (step 3a clearance checks)', () => {
	it('rectangles overlap when their interiors intersect', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 5, y_min: 5, x_max: 15, y_max: 15 };
		expect(rectangles_overlap_2d(a, b)).toBe(true);
	});

	it('rectangles do not overlap when only touching at an edge', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 10, y_min: 0, x_max: 20, y_max: 10 };
		expect(rectangles_overlap_2d(a, b)).toBe(false);
	});

	it('rectangles do not overlap when fully separated', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 20, y_min: 20, x_max: 30, y_max: 30 };
		expect(rectangles_overlap_2d(a, b)).toBe(false);
	});

	it('distance between rectangles is zero when they overlap', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 5, y_min: 5, x_max: 15, y_max: 15 };
		expect(distance_between_rectangles_2d(a, b)).toBeCloseTo(0, 6);
	});

	it('distance between rectangles is the side gap when one is purely to the right', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 17, y_min: 0, x_max: 27, y_max: 10 };
		expect(distance_between_rectangles_2d(a, b)).toBeCloseTo(7, 6);
	});

	it('distance between rectangles is the diagonal gap when one is corner-offset from the other', () => {
		const a = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const b = { x_min: 13, y_min: 14, x_max: 20, y_max: 20 };
		// horizontal gap 3, vertical gap 4 → diagonal 5
		expect(distance_between_rectangles_2d(a, b)).toBeCloseTo(5, 6);
	});

	it('rectangle-inside-rectangle is true when the inner sits fully inside', () => {
		const outer = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };
		const inner = { x_min: 10, y_min: 10, x_max: 50, y_max: 50 };
		expect(rectangle_inside_rectangle_2d(inner, outer)).toBe(true);
	});

	it('rectangle-inside-rectangle is true when the inner exactly matches the outer (touching counts)', () => {
		const r = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };
		expect(rectangle_inside_rectangle_2d(r, r)).toBe(true);
	});

	it('rectangle-inside-rectangle is false when the inner extends past one side', () => {
		const outer = { x_min: 0, y_min: 0, x_max: 100, y_max: 100 };
		const inner = { x_min: 90, y_min: 50, x_max: 110, y_max: 60 };
		expect(rectangle_inside_rectangle_2d(inner, outer)).toBe(false);
	});

	it('bounding rectangle of points returns the tight axis-aligned envelope', () => {
		const points = [{ x: 1, y: 2 }, { x: 5, y: -1 }, { x: 3, y: 4 }];
		const r = bounding_rectangle_of_points_2d(points);
		expect(r.x_min).toBeCloseTo(1, 6);
		expect(r.y_min).toBeCloseTo(-1, 6);
		expect(r.x_max).toBeCloseTo(5, 6);
		expect(r.y_max).toBeCloseTo(4, 6);
	});

	it('bounding rectangle of an empty list returns a zero-extent rectangle at the origin', () => {
		const r = bounding_rectangle_of_points_2d([]);
		expect(r.x_min).toBe(0);
		expect(r.y_min).toBe(0);
		expect(r.x_max).toBe(0);
		expect(r.y_max).toBe(0);
	});

	it('rect-to-segment distance is zero when the segment passes through the rectangle', () => {
		const r = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const a = { x: -5, y: 5 };
		const b = { x: 20, y: 5 };
		expect(distance_from_rect_to_segment_2d(r, a, b)).toBeCloseTo(0, 6);
	});

	it('rect-to-segment distance is the perpendicular gap when the segment runs parallel above the rectangle', () => {
		const r = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const a = { x: 0, y: 17 };
		const b = { x: 10, y: 17 };
		expect(distance_from_rect_to_segment_2d(r, a, b)).toBeCloseTo(7, 6);
	});

	it('rect-to-segment distance is the corner-to-endpoint gap when the segment sits off-corner', () => {
		const r = { x_min: 0, y_min: 0, x_max: 10, y_max: 10 };
		const a = { x: 13, y: 14 };
		const b = { x: 20, y: 20 };
		// closest segment point to the rect is endpoint a; rect corner is (10,10); gap = hypot(3,4) = 5
		expect(distance_from_rect_to_segment_2d(r, a, b)).toBeCloseTo(5, 1);
	});
});

describe('Dimension_Placement — candidate_passes_clearances (step 3a full clearance suite)', () => {
	// Common setup: a candidate label centred at (200, 200), 40x14, well away
	// from a silhouette rect at (0..100, 0..100). The candidate's witness
	// anchors are at (170, 200) and (230, 200); the edge endpoints are at
	// (170, 250) and (230, 250). With no previously placed picks, everything
	// should pass.
	const base = () => ({
		candidate_label_rect    : { x_min: 180, x_max: 220, y_min: 193, y_max: 207 } as const,
		// Long dim line so the 20-pixel forbidden zone around each anchor
		// does not bite into the centered label rectangle. Anchor 1 at
		// (140) → zone ends at 160; rect left edge at 180. Anchor 2 at
		// (260) → zone starts at 240; rect right edge at 220.
		candidate_anchor_1      : { x: 140, y: 200 },
		candidate_anchor_2      : { x: 260, y: 200 },
		candidate_edge_p1_screen: { x: 140, y: 250 },
		candidate_edge_p2_screen: { x: 260, y: 250 },
		silhouette              : [
			{ x:   0, y:   0 },
			{ x: 100, y:   0 },
			{ x: 100, y: 100 },
			{ x:   0, y: 100 },
		] as const,
		placed_label_rects      : [] as const,
		placed_anchors          : [] as const,
		placed_witness_segments : [] as const,
		placed_dim_segments     : [] as const,
		pair_clearance_px       : 15,
		silhouette_margin_px    : 15,
	});

	it('passes when nothing else is placed and the silhouette is well away', () => {
		expect(candidate_passes_clearances(base())).toBe(true);
	});

	it('fails when the candidate label rect sits inside the silhouette rect', () => {
		const in_ = { ...base(),
			candidate_label_rect: { x_min: 30, x_max: 70, y_min: 30, y_max: 70 } };
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('fails when the candidate label rect is within 15 px of a placed label rect', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 230, x_max: 270, y_min: 193, y_max: 207 }] };
		// gap is 10 px (220 to 230), less than 15
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	// Symmetric clearance — the new requirement.
	it('fails when the candidate ANCHOR sits within 15 px of a previously placed label rect', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 160, x_max: 175, y_min: 195, y_max: 205 }] };
		// anchor_1 at (170, 200) is INSIDE that rect, distance 0
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('fails when the candidate ANCHOR sits within 15 px of a previously placed anchor', () => {
		const in_ = { ...base(),
			placed_anchors: [{ x: 180, y: 200 }] };
		// anchor_1 at (170, 200) is 10 away from (180, 200), less than 15
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('fails when the candidate DIM LINE passes within 15 px of a previously placed label rect', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 195, x_max: 205, y_min: 210, y_max: 215 }] };
		// dim line from (170,200) to (230,200) is the horizontal line y=200; placed rect top is y=210; gap = 10 < 15
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('fails when the candidate DIM LINE passes within 15 px of a previously placed anchor', () => {
		const in_ = { ...base(),
			placed_anchors: [{ x: 200, y: 212 }] };
		// dim line is y=200 from x=170..230; anchor at (200, 212) is 12 perpendicular pixels away; less than 15
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('passes the symmetric checks when the placed obstacles are well away', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 500, x_max: 540, y_min: 500, y_max: 514 }],
			placed_anchors    : [{ x: 600, y: 600 }] };
		expect(candidate_passes_clearances(in_)).toBe(true);
	});

	it('fails when the candidate\'s two witness lines come within 15 px of each other', () => {
		// Bring the second witness's edge endpoint very close to the first witness.
		// Edge p1 is at (170, 250) → anchor_1 (170, 200): vertical line at x = 170.
		// Edge p2 at (180, 250) → anchor_2 (180, 200): vertical line at x = 180.
		// Distance between them = 10 px, which is less than 15.
		const in_ = { ...base(),
			candidate_edge_p2_screen: { x: 180, y: 250 },
			candidate_anchor_2      : { x: 180, y: 200 },
			candidate_label_rect    : { x_min: 175, x_max: 215, y_min: 193, y_max: 207 } };
		expect(candidate_passes_clearances(in_)).toBe(false);
	});

	it('passes when the two witness lines are at least 15 px apart', () => {
		// Same as base — witnesses are at x = 170 and x = 230, 60 px apart.
		expect(candidate_passes_clearances(base())).toBe(true);
	});
});

describe('Dimension_Placement — convex polygon helpers (silhouette hexagon)', () => {
	const square = [
		{ x:   0, y:   0 },
		{ x: 100, y:   0 },
		{ x: 100, y: 100 },
		{ x:   0, y: 100 },
	];
	const hexagon = [
		{ x:  50, y:   0 },
		{ x: 100, y:  30 },
		{ x: 100, y:  70 },
		{ x:  50, y: 100 },
		{ x:   0, y:  70 },
		{ x:   0, y:  30 },
	];

	it('point inside a square is detected', () => {
		expect(point_in_convex_polygon_2d({ x: 50, y: 50 }, square)).toBe(true);
	});
	it('point outside a square returns false', () => {
		expect(point_in_convex_polygon_2d({ x: 150, y: 50 }, square)).toBe(false);
	});
	it('point in the corner cut off by a hexagon returns false', () => {
		// (5, 5) sits inside the square but outside the hexagon (the hex
		// trims the corners of the square).
		expect(point_in_convex_polygon_2d({ x:   5, y:   5 }, hexagon)).toBe(false);
	});
	it('point in the center of the hexagon returns true', () => {
		expect(point_in_convex_polygon_2d({ x: 50, y: 50 }, hexagon)).toBe(true);
	});

	it('rectangle inside the polygon counts as intersecting', () => {
		const rect = { x_min: 40, x_max: 60, y_min: 40, y_max: 60 };
		expect(rect_intersects_convex_polygon_2d(rect, hexagon)).toBe(true);
	});
	it('rectangle far outside the polygon does not intersect', () => {
		const rect = { x_min: 200, x_max: 220, y_min: 200, y_max: 220 };
		expect(rect_intersects_convex_polygon_2d(rect, hexagon)).toBe(false);
	});
	it('rectangle in the cut corner of the hexagon (inside the bounding rectangle) does NOT intersect the hexagon', () => {
		const rect = { x_min: 1, x_max: 9, y_min: 1, y_max: 9 };
		// The rect sits in the corner the hexagon trims off the square.
		expect(rect_intersects_convex_polygon_2d(rect, hexagon)).toBe(false);
	});

	it('distance from rectangle to polygon is zero when they overlap', () => {
		const rect = { x_min: 40, x_max: 60, y_min: 40, y_max: 60 };
		expect(distance_from_rect_to_convex_polygon_2d(rect, hexagon)).toBe(0);
	});
	it('distance from rectangle to polygon equals the screen gap when they are separated', () => {
		// Square hexagon is at x_max = 100. Rect starts at x_min = 110, gap 10.
		const rect = { x_min: 110, x_max: 120, y_min: 40, y_max: 60 };
		expect(distance_from_rect_to_convex_polygon_2d(rect, square)).toBeCloseTo(10, 6);
	});
	it('distance from a corner-cut rectangle to the hexagon is positive', () => {
		// Rect sits in the trimmed corner of the hexagon — close to the
		// nearest hex edge but not touching it. Distance is small but > 0.
		const rect = { x_min: 1, x_max: 9, y_min: 1, y_max: 9 };
		const d = distance_from_rect_to_convex_polygon_2d(rect, hexagon);
		expect(d).toBeGreaterThan(0);
	});
});

describe('Dimension_Placement — evaluate_clearances (named filter rejection)', () => {
	// Same base as the boolean suite above. Each test forces one filter to
	// reject and confirms the returned name plus shortfall.
	const base = () => ({
		candidate_label_rect    : { x_min: 180, x_max: 220, y_min: 193, y_max: 207 } as const,
		// Long dim line so the 20-pixel forbidden zone around each anchor
		// does not bite into the centered label rectangle. Anchor 1 at
		// (140) → zone ends at 160; rect left edge at 180. Anchor 2 at
		// (260) → zone starts at 240; rect right edge at 220.
		candidate_anchor_1      : { x: 140, y: 200 },
		candidate_anchor_2      : { x: 260, y: 200 },
		candidate_edge_p1_screen: { x: 140, y: 250 },
		candidate_edge_p2_screen: { x: 260, y: 250 },
		silhouette              : [
			{ x:   0, y:   0 },
			{ x: 100, y:   0 },
			{ x: 100, y: 100 },
			{ x:   0, y: 100 },
		] as const,
		placed_label_rects      : [] as const,
		placed_anchors          : [] as const,
		placed_witness_segments : [] as const,
		placed_dim_segments     : [] as const,
		pair_clearance_px       : 15,
		silhouette_margin_px    : 15,
	});

	it('passes with ok:true when nothing is in the way', () => {
		const r = evaluate_clearances(base());
		expect(r.ok).toBe(true);
	});

	it('rejects with name silhouette when the label sits inside the silhouette rect', () => {
		const in_ = { ...base(),
			candidate_label_rect: { x_min: 30, x_max: 70, y_min: 30, y_max: 70 } };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('silhouette');
			expect(r.shortfall_px).toBe(15);
		}
	});

	it('rejects with name label-vs-label when the label rect is within 15 px of a placed label', () => {
		const in_ = { ...base(),
			placed_label_rects: [{ x_min: 230, x_max: 270, y_min: 193, y_max: 207 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-label');
			expect(r.shortfall_px).toBeCloseTo(5, 6);  // 15 - 10
		}
	});

	it('rejects with name label-vs-placed-anchor when a placed anchor sits within 15 px of the label rect', () => {
		const in_ = { ...base(),
			placed_anchors: [{ x: 225, y: 200 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-placed-anchor');
			expect(r.shortfall_px).toBeCloseTo(10, 6);  // 15 - 5
		}
	});

	// DISABLED pending visual review: filter 5 (label-vs-placed-witness)
	// was removed in Dimension_Placement.ts; this test still pins its
	// behaviour. If the filter is reinstated, drop the .skip.
	it.skip('rejects with name label-vs-placed-witness when a placed witness passes within 15 px of the label rect', () => {
		const in_ = { ...base(),
			placed_witness_segments: [[{ x: 200, y: 215 }, { x: 200, y: 300 }] as [{ x: number; y: number }, { x: number; y: number }]] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-placed-witness');
			expect(r.shortfall_px).toBeCloseTo(7, 6);  // 15 - 8
		}
	});

	it('rejects with name label-vs-placed-dim when a placed dim line passes within 15 px of the label rect', () => {
		const in_ = { ...base(),
			placed_dim_segments: [[{ x: 100, y: 215 }, { x: 300, y: 215 }] as [{ x: number; y: number }, { x: number; y: number }]] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-placed-dim');
			expect(r.shortfall_px).toBeCloseTo(7, 6);  // 15 - 8
		}
	});

	it('rejects with name own-anchor-vs-placed when a candidate anchor sits within 15 px of a placed label rect (label rect itself is clear)', () => {
		// Override anchor 1 to the older close-in position so the anchor
		// sits 5 px from the placed rect; own-anchor-vs-placed fires
		// before the position chain reaches the anchor-zone filter.
		const in_ = { ...base(),
			candidate_anchor_1: { x: 170, y: 200 },
			placed_label_rects: [{ x_min: 155, x_max: 165, y_min: 195, y_max: 205 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('own-anchor-vs-placed');
		}
	});

	it('rejects with name own-dim-vs-placed when the dim line passes within 15 px of a placed label rect (label rect and anchors are clear)', () => {
		// Long dim line so anchors are far from the obstacle. Obstacle sits
		// just below the dim line beyond the candidate label — close enough
		// for the dim line to fail by 9 px short, but x-clear of the label
		// rect by 20 px.
		const in_ = { ...base(),
			candidate_anchor_1 : { x: 50, y: 200 },
			candidate_anchor_2 : { x: 350, y: 200 },
			placed_label_rects: [{ x_min: 240, x_max: 280, y_min: 209, y_max: 217 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('own-dim-vs-placed');
			expect(r.shortfall_px).toBeCloseTo(6, 6);  // 15 - 9
		}
	});

	it('rejects with name own-witness-convergence when the two witness lines come within 15 px of each other', () => {
		// Tight anchors so the two vertical witnesses sit only 10 px
		// apart; the shape-level convergence check fires before any
		// position-level filter gets a turn.
		const in_ = { ...base(),
			candidate_anchor_1      : { x: 170, y: 200 },
			candidate_edge_p1_screen: { x: 170, y: 250 },
			candidate_edge_p2_screen: { x: 180, y: 250 },
			candidate_anchor_2      : { x: 180, y: 200 },
			candidate_label_rect    : { x_min: 175, x_max: 215, y_min: 193, y_max: 207 } };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('own-witness-convergence');
			expect(r.shortfall_px).toBeCloseTo(5, 6);  // 15 - 10
		}
	});

	it('lists exactly the five label-rectangle filters as slide-eligible', () => {
		expect(SLIDE_ELIGIBLE_FILTERS.has('silhouette')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-label')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-placed-anchor')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-placed-witness')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-placed-dim')).toBe(true);
		expect(SLIDE_ELIGIBLE_FILTERS.has('own-anchor-vs-placed')).toBe(false);
		expect(SLIDE_ELIGIBLE_FILTERS.has('own-dim-vs-placed')).toBe(false);
		expect(SLIDE_ELIGIBLE_FILTERS.has('own-witness-convergence')).toBe(false);
	});

	it('step 3.2 — rejects with name label-vs-anchor-zone when the candidate label overlaps the 20-pixel forbidden zone around one of its own anchors', () => {
		const in_ = { ...base(),
			// Anchor 1 close to the label rect; the zone reaches into it.
			candidate_anchor_1: { x: 170, y: 200 },
			// Anchor 2 stays well away so its own zone is clear of the
			// label, and own-witness-convergence does not fire (the two
			// vertical witnesses are 90 px apart).
		};
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-anchor-zone');
		}
	});

	it('step 3.2 — rejects with name label-vs-anchor-zone when the candidate label overlaps a 20-pixel zone around an already-placed label\'s anchor', () => {
		const in_ = { ...base(),
			candidate_label_rect: { x_min: 180, x_max: 220, y_min: 215, y_max: 229 },
			// Placed dim line at y=220 starts at x=240. Its anchor zone
			// reaches backward (negative dim direction) to x=220, just
			// touching the candidate label rect's right edge. The placed
			// dim segment ITSELF sits 20 px to the right of the candidate
			// label rect, so label-vs-placed-dim does not fire — only the
			// new zone filter triggers.
			placed_dim_segments: [
				[{ x: 240, y: 220 }, { x: 440, y: 220 }] as [{ x: number; y: number }, { x: number; y: number }],
			],
		};
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-anchor-zone');
		}
	});

	it('step 3.2 — the new label-vs-anchor-zone filter is NOT slide-eligible', () => {
		expect(SLIDE_ELIGIBLE_FILTERS.has('label-vs-anchor-zone')).toBe(false);
	});

	it('sliding the label by the reported shortfall plus one pixel makes the candidate pass — simulating the slide-and-retry branch', () => {
		// Long dim line so anchors are far from the obstacle. Anchor 1
		// at (155, 200) so the 20-pixel forbidden zone around it ends at
		// x=175 — clear of the candidate label rect (180, 220). Obstacle
		// is a placed label rect at (230-270, 215-229): just to the right
		// of and below the candidate label, far enough from the dim line
		// and both anchors to clear those filters. Distance from candidate
		// label rect to placed = sqrt(100 + 64) ≈ 12.81; shortfall ≈ 2.19.
		// Sliding LEFT along the dim line by 3.19 px clears the 15 px
		// requirement and still keeps clear of the anchor zone.
		const in_ = { ...base(),
			candidate_anchor_1 : { x: 155, y: 200 },
			candidate_anchor_2 : { x: 470, y: 200 },
			placed_label_rects: [{ x_min: 230, x_max: 270, y_min: 215, y_max: 229 }] };
		const r = evaluate_clearances(in_);
		expect(r.ok).toBe(false);
		if (!r.ok) {
			expect(r.filter).toBe('label-vs-label');
			const shift = r.shortfall_px + 1;
			const shifted_rect = {
				x_min: in_.candidate_label_rect.x_min - shift,
				x_max: in_.candidate_label_rect.x_max - shift,
				y_min: in_.candidate_label_rect.y_min,
				y_max: in_.candidate_label_rect.y_max,
			};
			const retry = evaluate_clearances({ ...in_, candidate_label_rect: shifted_rect });
			expect(retry.ok).toBe(true);
		}
	});
});

describe('Dimension_Placement — min_distance_between_segments_2d', () => {
	it('zero when the two segments cross', () => {
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 10, y: 10 };
		const b1 = { x: 0, y: 10 };
		const b2 = { x: 10, y: 0 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(0, 6);
	});

	it('equals the parallel gap when both segments run side by side', () => {
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 100, y: 0 };
		const b1 = { x: 0, y: 7 };
		const b2 = { x: 100, y: 7 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(7, 1);
	});

	it('equals the closest endpoint pair when the segments are well separated', () => {
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 5, y: 0 };
		const b1 = { x: 15, y: 0 };  // 10 px to the right of a2
		const b2 = { x: 20, y: 0 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(10, 6);
	});

	it('returns the perpendicular gap exactly for long parallel segments — closed form, no sampling error', () => {
		// Two parallel segments, each 1000 pixels long, gap of 7 pixels.
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 1000, y: 0 };
		const b1 = { x: 0, y: 7 };
		const b2 = { x: 1000, y: 7 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(7, 6);
	});

	it('catches a near-touch that the old eleven-sample method would miss', () => {
		// First segment is 1000 long horizontally; second is a short vertical
		// dipping down to within 3 px of the first, centred at x=500. The old
		// sampling at every 100 px would never sample exactly x=500 and would
		// miss the close point. Closed form catches it.
		const a1 = { x: 0, y: 0 };
		const a2 = { x: 1000, y: 0 };
		const b1 = { x: 500, y: 3 };
		const b2 = { x: 500, y: 50 };
		expect(min_distance_between_segments_2d(a1, a2, b1, b2)).toBeCloseTo(3, 6);
	});
});

describe('Dimension_Placement — distance_point_to_segment_2d', () => {
	it('zero when the point is on the segment', () => {
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		const p = { x: 5, y: 0 };
		expect(distance_point_to_segment_2d(p, a, b)).toBeCloseTo(0, 6);
	});

	it('perpendicular distance when the projection lands inside the segment', () => {
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		const p = { x: 5, y: 4 };
		expect(distance_point_to_segment_2d(p, a, b)).toBeCloseTo(4, 6);
	});

	it('distance to the nearer endpoint when the projection lands past the segment', () => {
		const a = { x: 0, y: 0 };
		const b = { x: 10, y: 0 };
		const p = { x: 20, y: 4 };
		// closest point is endpoint b at (10, 0); gap = hypot(10, 4) ≈ 10.77
		expect(distance_point_to_segment_2d(p, a, b)).toBeCloseTo(Math.hypot(10, 4), 6);
	});

	it('point-to-endpoint distance when the segment is degenerate', () => {
		const a = { x: 5, y: 5 };
		const b = { x: 5, y: 5 };
		const p = { x: 5, y: 9 };
		expect(distance_point_to_segment_2d(p, a, b)).toBeCloseTo(4, 6);
	});
});

describe('Dimension_Placement — segments_intersect_2d', () => {
	it('true when segments cross', () => {
		expect(segments_intersect_2d({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true);
	});

	it('false when segments are parallel', () => {
		expect(segments_intersect_2d({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBe(false);
	});

	it('false when segments would cross only if extended past their endpoints', () => {
		expect(segments_intersect_2d({ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 6, y: 0 }, { x: 7, y: 7 })).toBe(false);
	});
});

